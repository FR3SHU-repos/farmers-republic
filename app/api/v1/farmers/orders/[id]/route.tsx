// app/api/v1/farmers/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import OrderModel from "@/shared/models/mongodb/orders/buyerOrders";
import { success, failure } from "@/app/api/v1/utils/responses";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

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

  // ✅ NEW: totals stored in DB
  platformFeeTotal?: number;
  discountTotal?: number;
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
  timeline?: Array<{
    status: string;
    timestamp: Date | string;
    note?: string;
    actorType?: string;
    actorId?: string;
    actorName?: string;
  }>;
};

// 👇 important: support both plain object & Promise for params
type ParamsContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// GET – farmer-specific view of one order (deprecated compatibility route;
// Go owns this read, resolving the caller's own farmer profile server-side
// instead of trusting the client-supplied farmerId query param)
export async function GET(req: NextRequest, context: ParamsContext) {
  const { id } = await Promise.resolve(context.params);
  return proxyCatalogueGET(req, `/farmers/orders/${encodeURIComponent(id)}`);
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
    discountTotal, // ✅ NEW
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
  // ✅ NEW: support discount updates
  if (typeof discountTotal === "number") {
    set["items.$.discountTotal"] = discountTotal;
  }

  if (Object.keys(set).length === 0) {
    return NextResponse.json(
      failure(
        "Nothing to update (status / deliveryCharge / extraCharge / serviceCharge / discountTotal)",
      ),
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
