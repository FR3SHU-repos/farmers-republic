// shared/interfaces/mongodb/delivery/deliveryEarning.ts

export type DeliveryEarning = {
  _id?: string;
  deliveryPersonId: string;      // user._id of the delivery person
  deliveryPersonName?: string;
  orderId: string;               // buyerOrder._id (unique per earning record)
  buyerName?: string;
  orderTotal: number;            // buyer's total paid
  deliveryFee: number;           // the delivery fee on the order
  earning: number;               // what the delivery person earns (min ₹30)
  paymentMode: string;           // "cod" | "online"
  paymentStatus: string;         // "paid" | "unpaid"
  itemCount: number;             // total units delivered
  deliveredAt: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
