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
      success({ orders, page, limit, total, totalPages }, "Buyer orders fetched"),
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

// ─── Inventory helpers ─────────────────────────────────────────────────────

// Atomically reserve qty for a single product.
// Uses a filter that checks availableQty >= qty (unless backorder is allowed).
// Returns the updated product doc, or null if insufficient stock.
async function reserveStock(
  productId: string,
  qty: number
): Promise<{ reserved: true } | { reserved: false; productName: string; available: number }> {
  const updated = await ProductModel.findOneAndUpdate(
    {
      _id: productId,
      $or: [
        { allowBackorder: true },
        { availableQty: { $gte: qty } },
      ],
    },
    { $inc: { reservedQty: qty, availableQty: -qty } },
    { new: true }
  ).lean() as any;

  if (!updated) {
    // Fetch the product to return a helpful error message
    const prod = await ProductModel.findById(productId)
      .select("name availableQty stockQty allowBackorder")
      .lean() as any;

    if (!prod) return { reserved: false, productName: `Product ${productId}`, available: 0 };
    return {
      reserved: false,
      productName: prod.name || productId,
      available: prod.availableQty ?? prod.stockQty ?? 0,
    };
  }

  // Auto-mark out of stock when availableQty hits 0
  if (updated.availableQty <= 0 && !updated.allowBackorder) {
    await ProductModel.findByIdAndUpdate(productId, {
      $set: { inStock: false, status: "out_of_stock" },
    });
  }

  return { reserved: true };
}

// Roll back reservations that were already made (on partial failure)
async function releaseStock(reservations: Array<{ productId: string; qty: number }>) {
  await Promise.all(
    reservations.map(({ productId, qty }) =>
      ProductModel.findByIdAndUpdate(productId, {
        $inc: { reservedQty: -qty, availableQty: qty },
      }).then(async (prod: any) => {
        // Re-enable if now back in stock
        if (prod && (prod.availableQty ?? 0) + qty > 0) {
          await ProductModel.findByIdAndUpdate(productId, {
            $set: { inStock: true, status: "active" },
          });
        }
      })
    )
  );
}

// ─── POST – called from cart checkout ─────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    const body = await req.json();
    const {
      items,
      subtotal: _clientSubtotal,
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
      return NextResponse.json(failure("Order items are required"), { status: 400 });
    }

    // ── Step 1: Normalise items + resolve farmerId ───────────────────────
    const safeItems: OrderItem[] = await Promise.all(
      items.map(async (raw: any): Promise<OrderItem> => {
        const price = Number(raw.price ?? 0);
        const qty   = Number(raw.qty ?? 1);

        let farmerIdRaw: string | undefined = raw.farmerId;
        if (!farmerIdRaw && raw.productId) {
          try {
            const product = await ProductModel.findById(raw.productId)
              .select("farmerId")
              .lean()
              .exec();
            if (product && (product as any).farmerId) {
              farmerIdRaw = String((product as any).farmerId);
            }
          } catch (e) {
            console.error("[buyerOrders POST] error fetching product for farmerId", raw.productId, e);
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

        const itemPaymentMode   = (raw.paymentMode as any) || orderPaymentMode || "cod";
        const itemPaymentStatus = (raw.paymentStatus as any) || orderPaymentStatus || "unpaid";
        const paidAmount        = typeof raw.paidAmount === "number" ? Number(raw.paidAmount) : undefined;

        return {
          productId: String(raw.productId),
          name:      raw.name,
          price,
          image:     raw.image || "",
          qty,
          farmerId:  farmerIdRaw,

          status:        raw.status || "pending",
          deliveryCharge: Number(raw.deliveryCharge ?? 0),
          extraCharge:    Number(raw.extraCharge    ?? 0),
          serviceCharge:  Number(raw.serviceCharge  ?? 0),

          platformFees,
          platformFeeTotal: Number(raw.platformFeeTotal ?? 0),

          discounts,
          discountTotal: Number(raw.discountTotal ?? 0),

          paymentMode:   itemPaymentMode,
          paymentStatus: itemPaymentStatus,
          paidAmount,
          currency: raw.currency || "INR",

          taxAmount: Number(raw.taxAmount ?? 0),
          taxBreakup: {
            cgst: Number(raw.taxBreakup?.cgst ?? 0),
            sgst: Number(raw.taxBreakup?.sgst ?? 0),
            igst: Number(raw.taxBreakup?.igst ?? 0),
          },

          farmerPayoutAmount:      raw.farmerPayoutAmount ? Number(raw.farmerPayoutAmount) : undefined,
          farmerSettlementStatus:  raw.farmerSettlementStatus || "pending",
          farmerSettlementAt:      raw.farmerSettlementAt ? new Date(raw.farmerSettlementAt) : undefined,
          settlementReferenceId:   raw.settlementReferenceId || undefined,
          paymentReferenceId:      raw.paymentReferenceId    || undefined,
          shipmentTrackingId:      raw.shipmentTrackingId    || undefined,
          shipmentProvider:        raw.shipmentProvider      || undefined,
          promisedDeliveryDate:    raw.promisedDeliveryDate  ? new Date(raw.promisedDeliveryDate) : undefined,
          deliveredAt:             raw.deliveredAt            ? new Date(raw.deliveredAt)           : undefined,
        };
      })
    );

    // ── Step 2: Atomically reserve inventory for every item ──────────────
    // If any item fails, roll back all reservations already made.
    const reservationsMade: Array<{ productId: string; qty: number }> = [];
    const stockErrors: string[] = [];

    for (const item of safeItems) {
      const result = await reserveStock(item.productId, item.qty);

      if (result.reserved) {
        reservationsMade.push({ productId: item.productId, qty: item.qty });
      } else {
        stockErrors.push(
          `"${result.productName}" — only ${result.available} unit(s) available (requested ${item.qty})`
        );
      }
    }

    if (stockErrors.length > 0) {
      // Release all reservations made in this pass before returning the error
      await releaseStock(reservationsMade);
      return NextResponse.json(
        failure(`Insufficient stock for the following items:\n${stockErrors.join("\n")}`),
        { status: 422 }
      );
    }

    // ── Step 3: Calculate totals & create order ──────────────────────────
    const computedSubtotal = safeItems.reduce<number>(
      (sum, it) => sum + it.price * it.qty,
      0
    );

    const extraChargesTotal = safeItems.reduce<number>(
      (sum, it) =>
        sum +
        (Number(it.deliveryCharge  ?? 0) +
         Number(it.extraCharge     ?? 0) +
         Number(it.serviceCharge   ?? 0) +
         Number(it.platformFeeTotal ?? 0) +
         Number(it.taxAmount       ?? 0) -
         Number(it.discountTotal   ?? 0)),
      0
    );

    const numericDeliveryFee = Number(deliveryFee ?? 0);
    const total = computedSubtotal + extraChargesTotal + numericDeliveryFee;

    const orderDoc = await OrderModel.create({
      buyerId:       buyerId ?? null,
      buyerName:     buyerName  || "",
      buyerEmail:    buyerEmail || "",
      buyerPhone:    buyerPhone || "",
      subtotal:      computedSubtotal,
      deliveryFee:   numericDeliveryFee,
      total,
      status:        "pending",
      paymentStatus: orderPaymentStatus || "unpaid",
      paymentMode:   orderPaymentMode   || "cod",
      source:        source             || "web",
      items:         safeItems,
    });

    return NextResponse.json(
      success({ id: String(orderDoc._id) }, "Order created"),
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
