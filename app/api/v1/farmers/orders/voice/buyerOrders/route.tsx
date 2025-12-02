// app/api/v1/farmers/orders/voice/buyerOrders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import ProductModel from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses";
import type { OrderItem } from "@/shared/interfaces/mongodb/orders/buyerOrders";

// GET /api/v1/orders/voice/buyerOrders?buyerId=...
export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const buyerId = url.searchParams.get("buyerId");

    if (!buyerId) {
      return NextResponse.json(
        failure("buyerId query parameter is required"),
        { status: 400 }
      );
    }

    // simple pagination (optional)
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OrderModel.find({ buyerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      OrderModel.countDocuments({ buyerId }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

    return NextResponse.json(
      success(
        {
          orders,
          page,
          limit,
          total,
          totalPages,
        },
        "Buyer orders fetched"
      ),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("buyerOrders GET error:", err);
    return NextResponse.json(
      failure(err?.message || "Failed to fetch buyer orders"),
      { status: 500 }
    );
  }
}

// called from cart checkout
// called from cart checkout
export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    const body = await req.json();

    const {
      items,
      subtotal: _clientSubtotal, // we'll recompute
      deliveryFee,
      buyerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      paymentMode: orderPaymentMode,
      paymentStatus: orderPaymentStatus,
      source,
    } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        failure("Order items are required"),
        { status: 400 }
      );
    }

    // 🔐 Normalise items according to new model/interface
    const safeItems: OrderItem[] = await Promise.all(
      items.map(async (raw: any): Promise<OrderItem> => {
        const price = Number(raw.price ?? 0);
        const qty = Number(raw.qty ?? 1);

        // 🔍 ensure we have farmerId: from payload or from Product
        let farmerIdRaw: string | undefined = raw.farmerId;

        if (!farmerIdRaw && raw.productId) {
          try {
            const product = await ProductModel.findById(raw.productId)
              .select("farmerId")
              .lean()
              .exec();

            if (product && (product as any).farmerId) {
              farmerIdRaw = String((product as any).farmerId);
            } else {
              console.warn(
                "[buyerOrders POST] product without farmerId",
                raw.productId
              );
            }
          } catch (e) {
            console.error(
              "[buyerOrders POST] error fetching product for farmerId",
              raw.productId,
              e
            );
          }
        }

        const platformFees = Array.isArray(raw.platformFees)
          ? raw.platformFees.map((f: any) => ({
              type: f.type || "service",
              label: f.label || undefined,
              amount: Number(f.amount ?? 0),
            }))
          : [];

        const discounts = Array.isArray(raw.discounts)
          ? raw.discounts.map((d: any) => ({
              type: d.type || "manual",
              label: d.label || undefined,
              amount: Number(d.amount ?? 0),
            }))
          : [];

        const platformFeeTotal = Number(raw.platformFeeTotal ?? 0);
        const discountTotal = Number(raw.discountTotal ?? 0);

        const deliveryCharge = Number(raw.deliveryCharge ?? 0);
        const extraCharge = Number(raw.extraCharge ?? 0);
        const serviceCharge = Number(raw.serviceCharge ?? 0);

        const taxAmount = Number(raw.taxAmount ?? 0);
        const taxBreakup = raw.taxBreakup || {};

        // 🔑 If item-level payment not provided, fallback to order-level, then default
        const itemPaymentMode =
          (raw.paymentMode as any) || orderPaymentMode || "cod";
        const itemPaymentStatus =
          (raw.paymentStatus as any) || orderPaymentStatus || "unpaid";

        // paidAmount optional – can be calculated later or set explicitly
        const paidAmount =
          typeof raw.paidAmount === "number"
            ? Number(raw.paidAmount)
            : undefined;

        return {
          productId: String(raw.productId),
          name: raw.name,
          price,
          image: raw.image || "",
          qty,
          farmerId: farmerIdRaw, // ✅ now guaranteed when product has it

          status: raw.status || "pending",
          deliveryCharge,
          extraCharge,
          serviceCharge,

          platformFees,
          platformFeeTotal,

          discounts,
          discountTotal,

          paymentMode: itemPaymentMode,
          paymentStatus: itemPaymentStatus,
          paidAmount,
          currency: raw.currency || "INR",

          taxAmount,
          taxBreakup: {
            cgst: Number(taxBreakup.cgst ?? 0),
            sgst: Number(taxBreakup.sgst ?? 0),
            igst: Number(taxBreakup.igst ?? 0),
          },

          farmerPayoutAmount: raw.farmerPayoutAmount
            ? Number(raw.farmerPayoutAmount)
            : undefined,
          farmerSettlementStatus: raw.farmerSettlementStatus || "pending",
          farmerSettlementAt: raw.farmerSettlementAt
            ? new Date(raw.farmerSettlementAt)
            : undefined,
          settlementReferenceId: raw.settlementReferenceId || undefined,

          paymentReferenceId: raw.paymentReferenceId || undefined,
          shipmentTrackingId: raw.shipmentTrackingId || undefined,
          shipmentProvider: raw.shipmentProvider || undefined,
          promisedDeliveryDate: raw.promisedDeliveryDate
            ? new Date(raw.promisedDeliveryDate)
            : undefined,
          deliveredAt: raw.deliveredAt
            ? new Date(raw.deliveredAt)
            : undefined,
        };
      })
    );

    // subtotal from base price * qty
    const computedSubtotal = safeItems.reduce<number>(
      (sum: number, it: OrderItem) => sum + it.price * it.qty,
      0
    );

    // extra charges/discounts per item
    const extraChargesTotal = safeItems.reduce<number>(
      (sum: number, it: OrderItem) =>
        sum +
        (Number(it.deliveryCharge ?? 0) +
          Number(it.extraCharge ?? 0) +
          Number(it.serviceCharge ?? 0) +
          Number(it.platformFeeTotal ?? 0) +
          Number(it.taxAmount ?? 0) -
          Number(it.discountTotal ?? 0)),
      0
    );

    const numericDeliveryFee = Number(deliveryFee ?? 0);
    const total = computedSubtotal + extraChargesTotal + numericDeliveryFee;

    const orderDoc = await OrderModel.create({
      buyerId: buyerId ?? null,
      buyerName: buyerName || "",
      buyerEmail: buyerEmail || "",
      buyerPhone: buyerPhone || "",
      subtotal: computedSubtotal,
      deliveryFee: numericDeliveryFee,
      total,
      status: "pending",
      paymentStatus: orderPaymentStatus || "unpaid",
      paymentMode: orderPaymentMode || "cod",
      source: source || "web",
      items: safeItems,
    });

    return NextResponse.json(
      success(
        {
          id: String(orderDoc._id),
        },
        "Order created"
      ),
      { status: 201 }
    );
  } catch (err: any) {
    console.error("buyerOrders POST error:", err);
    return NextResponse.json(
      failure(err?.message || "Failed to create order"),
      { status: 500 }
    );
  }
}
