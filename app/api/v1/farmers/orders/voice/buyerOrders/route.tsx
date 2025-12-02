// app/api/v1/farmers/orders/voice/buyerOrders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

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

    // 🔑 treat buyerId as plain string, no ObjectId/UUID validation
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

// POST /api/v1/orders/voice/buyerOrders
// called from cart checkout
export async function POST(req: NextRequest) {
  try {
    await mongoDB();

    const body = await req.json();

    const {
      items,
      subtotal,
      deliveryFee,
      buyerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      paymentMode,
      paymentStatus,
      source,
    } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        failure("Order items are required"),
        { status: 400 }
      );
    }

    const numericSubtotal = Number(subtotal ?? 0);
    const numericDeliveryFee = Number(deliveryFee ?? 0);
    const total = numericSubtotal + numericDeliveryFee;

    const orderDoc = await OrderModel.create({
      buyerId: buyerId ?? null,
      buyerName: buyerName || "",
      buyerEmail: buyerEmail || "",
      buyerPhone: buyerPhone || "",
      subtotal: numericSubtotal,
      deliveryFee: numericDeliveryFee,
      total,
      status: "pending",
      paymentStatus: paymentStatus || "unpaid",
      paymentMode: paymentMode || "cod",
      source: source || "web",
      items: items.map((it: any) => ({
        productId: String(it.productId),
        name: it.name,
        price: Number(it.price ?? 0),
        image: it.image || "",
        qty: Number(it.qty ?? 1),
        farmerId: it.farmerId ? String(it.farmerId) : undefined,
        status: "pending",
        deliveryCharge: 0,
        extraCharge: 0,
        serviceCharge: 0,
      })),
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
