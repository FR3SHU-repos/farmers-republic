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
type ParamsContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: ParamsContext) {
  const params = await Promise.resolve(context.params);
  const { id } = params;
  console.log("🚜 FARMER ORDER DETAIL API HIT", id);

  await mongoDB();

  const url = new URL(req.url);
  const farmerId = url.searchParams.get("farmerId");
  //const orderId = params.id;
  const orderId = id;

  if (!farmerId) {
    return NextResponse.json(
      failure("farmerId query parameter is required"),
      { status: 400 }
    );
  }

  const orderDoc = await OrderModel.findById(orderId).lean().exec();
  const order = orderDoc as MongoOrder | null;

  if (!order) {
    return NextResponse.json(failure("Order not found"), { status: 404 });
  }

  const allItems: MongoOrderItem[] = order.items || [];
  const itemsForFarmer = allItems.filter(
    (it) => String(it.farmerId) === String(farmerId)
  );

  const itemsCount = itemsForFarmer.reduce(
    (sum, it) => sum + (it.qty ?? 0),
    0
  );

  const subtotalForFarmer = itemsForFarmer.reduce(
    (sum, it) => sum + (it.price ?? 0) * (it.qty ?? 0),
    0
  );

  const totalForFarmer = subtotalForFarmer;

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
        })),
      },
      "Farmer order detail fetched"
    ),
    { status: 200 }
  );
}

// 🔹 PATCH – update status / paymentStatus
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🚜 FARMER ORDER UPDATE API HIT", params.id);

  await mongoDB();
  const body = await req.json();

  const updates: any = {};
  if (body.status) updates.status = body.status;
  if (body.paymentStatus) updates.paymentStatus = body.paymentStatus;

  if (!Object.keys(updates).length) {
    return NextResponse.json(failure("Nothing to update"), {
      status: 400,
    });
  }

  const updatedDoc = await OrderModel.findByIdAndUpdate(
    params.id,
    { $set: updates },
    { new: true }
  ).lean();

  const updatedOrder = updatedDoc as MongoOrder | null;

  if (!updatedOrder) {
    return NextResponse.json(failure("Order not found"), { status: 404 });
  }

  return NextResponse.json(
    success({ id: updatedOrder._id }, "Order updated"),
    { status: 200 }
  );
}
