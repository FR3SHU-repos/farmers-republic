// app/api/v1/orders/voice/buyerOrders/route.tsx
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import ProductModel from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses";

// 🔹 LIST buyer orders
export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const buyerId = searchParams.get("buyerId");
    const page = Number(searchParams.get("page") || "1") || 1;
    const limit = Number(searchParams.get("limit") || "20") || 20;

    if (!buyerId) {
      return NextResponse.json(
        failure("buyerId query parameter is required"),
        { status: 400 }
      );
    }

    const filter: any = { buyerId };

    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      OrderModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

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
    console.error("List buyer orders error:", err);
    return NextResponse.json(
      failure("Failed to fetch orders", err?.message || err),
      { status: 500 }
    );
  }
}

// 🔹 CREATE new order (your existing code)
export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();

    const rawItems = body.items || [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(failure("Cart is empty"), { status: 400 });
    }

    const productIds = rawItems
      .map((it: any) => it.productId || it.id)
      .filter(Boolean);

    const products = await ProductModel.find({
      _id: { $in: productIds },
    })
      .select("_id price farmerId name image")
      .lean()
      .exec();

    const productMap = new Map<string, any>(
      products.map((p: any) => [String(p._id), p]),
    );

    const items = rawItems.map((it: any) => {
      const pid = String(it.productId || it.id);
      const p = productMap.get(pid);

      const price = p?.price ?? it.price;
      return {
        productId: pid,
        name: p?.name ?? it.name,
        price: Number(price || 0),
        image: p?.image ?? it.image ?? "",
        qty: Number(it.qty || 1),
        farmerId: p?.farmerId ? String(p.farmerId) : it.farmerId,
      };
    });

    const subtotal = items.reduce(
      (sum, it) => sum + (it.price || 0) * (it.qty || 0),
      0,
    );

    const deliveryFee = Number(body.deliveryFee ?? 0);
    const total = subtotal + deliveryFee;

    const orderDoc = await OrderModel.create({
      buyerId: body.buyerId || null,
      buyerName: body.buyerName || "",
      buyerEmail: body.buyerEmail || "",
      subtotal,
      deliveryFee,
      total,
      status: body.status || "pending",
      paymentStatus: body.paymentStatus || "unpaid",
      paymentMode: body.paymentMode || "cod",
      source: body.source || "web",
      items,
    });

    return NextResponse.json(
      success({ id: orderDoc._id }, "Order created"),
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json(
      failure("Failed to create order", err?.message || err),
      { status: 500 },
    );
  }
}
