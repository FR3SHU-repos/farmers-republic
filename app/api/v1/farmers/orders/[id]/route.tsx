// app/api/v1/farmers/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";

type MongoOrderItem = {
  productId?: string;
  name?: string;
  price?: number;
  image?: string;
  qty?: number;
  farmerId?: string;

  status?: string;
  deliveryCharge?: number;
  extraCharge?: number;
  serviceCharge?: number;
};

type MongoOrder = {
  _id: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  status?: string;
  paymentStatus?: string;
  paymentMode?: string;
  source?: string;
  createdAt?: Date;
  updatedAt?: Date;
  items?: MongoOrderItem[];
};

// 👇 important: support both plain object & Promise for params
type ParamsContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// GET – farmer-specific view of one order
export async function GET(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  const orderId = id;

  console.log("🚜 FARMER ORDER DETAIL API HIT (GET)", orderId);

  await mongoDB();

  const url = new URL(req.url);
  const farmerId = url.searchParams.get("farmerId");

  if (!farmerId) {
    return NextResponse.json(
      failure("farmerId query parameter is required"),
      { status: 400 },
    );
  }

  const orderDoc = await OrderModel.findById(orderId).lean().exec();
  const order = orderDoc as MongoOrder | null;

  if (!order) {
    return NextResponse.json(failure("Order not found"), { status: 404 });
  }

  const allItems: MongoOrderItem[] = order.items || [];

  // only this farmer's line items
  const itemsForFarmer = allItems.filter(
    (it) => String(it.farmerId) === String(farmerId),
  );

  const itemsCount = itemsForFarmer.reduce(
    (sum, it) => sum + (it.qty ?? 0),
    0,
  );

  const subtotalForFarmer = itemsForFarmer.reduce(
    (sum, it) => sum + (it.price ?? 0) * (it.qty ?? 0),
    0,
  );

  const chargesForFarmer = itemsForFarmer.reduce((sum, it) => {
    const delivery = it.deliveryCharge ?? 0;
    const extra = it.extraCharge ?? 0;
    const service = it.serviceCharge ?? 0;
    return sum + delivery + extra + service;
  }, 0);

  const totalForFarmer = subtotalForFarmer + chargesForFarmer;

  return NextResponse.json(
    success(
      {
        orderId: String(order._id),
        farmerId,
        buyerId: order.buyerId || "",
        buyerName: order.buyerName || "",
        buyerEmail: order.buyerEmail || "",
        buyerPhone: order.buyerPhone || "",
        status: order.status || "pending",
        paymentStatus: order.paymentStatus || "unpaid",
        paymentMode: order.paymentMode || "cod",
        source: order.source || "web",
        createdAt: order.createdAt
          ? new Date(order.createdAt).toISOString()
          : new Date().toISOString(),

        subtotal: subtotalForFarmer,
        total: totalForFarmer,
        itemsCount,

        items: itemsForFarmer.map((it) => ({
          productId: it.productId || "",
          name: it.name || "",
          price: it.price ?? 0,
          qty: it.qty ?? 0,
          image: it.image || "",

          // expose item-level status/charges to frontend
          status: it.status || order.status || "pending",
          deliveryCharge: it.deliveryCharge ?? 0,
          extraCharge: it.extraCharge ?? 0,
          serviceCharge: it.serviceCharge ?? 0,
        })),
      },
      "Farmer order detail fetched",
    ),
    { status: 200 },
  );
}

// PATCH – update one item (product) for this farmer
export async function PATCH(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  const orderId = id;

  console.log("🚜 FARMER ORDER DETAIL API HIT (PATCH)", orderId);

  await mongoDB();

  const url = new URL(req.url);
  const farmerId = url.searchParams.get("farmerId");

  if (!farmerId) {
    return NextResponse.json(
      failure("farmerId query parameter is required"),
      { status: 400 },
    );
  }

  const body = await req.json();
  const {
    productId,
    status,
    deliveryCharge,
    extraCharge,
    serviceCharge,
  } = body || {};

  if (!productId) {
    return NextResponse.json(
      failure("productId is required to update item status/charges"),
      { status: 400 },
    );
  }

  const set: Record<string, unknown> = {};

  if (typeof status === "string") {
    set["items.$.status"] = status;
  }
  if (typeof deliveryCharge === "number") {
    set["items.$.deliveryCharge"] = deliveryCharge;
  }
  if (typeof extraCharge === "number") {
    set["items.$.extraCharge"] = extraCharge;
  }
  if (typeof serviceCharge === "number") {
    set["items.$.serviceCharge"] = serviceCharge;
  }

  if (Object.keys(set).length === 0) {
    return NextResponse.json(
      failure("Nothing to update (status / deliveryCharge / extraCharge / serviceCharge)"),
      { status: 400 },
    );
  }

  // update only this farmer's product line
  const updatedDoc = await OrderModel.findOneAndUpdate(
    {
      _id: orderId,
      "items.productId": productId,
      "items.farmerId": farmerId,
    },
    { $set: set },
    { new: true },
  ).lean();

  const updatedOrder = updatedDoc as MongoOrder | null;

  if (!updatedOrder) {
    return NextResponse.json(failure("Order or item not found"), {
      status: 404,
    });
  }

  // find updated item back out to return
  const updatedItem =
    updatedOrder.items?.find(
      (it) =>
        String(it.productId) === String(productId) &&
        String(it.farmerId) === String(farmerId),
    ) || null;

  return NextResponse.json(
    success(
      {
        orderId,
        farmerId,
        productId,
        item: updatedItem,
      },
      "Farmer item updated",
    ),
    { status: 200 },
  );
}
