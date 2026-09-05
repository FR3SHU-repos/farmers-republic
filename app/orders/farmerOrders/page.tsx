"use client";

import { useEffect, useState } from "react";
import { useSpeechToText } from "@/shared/hooks/useSpeechToText";
import { useUser } from "@/shared/context/UserContext";
import { ChevronDown, Mic, MicOff, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

type CreatedOrderItem = {
  productId: string;
  productName: string;
  unit?: string;
  quantity: number;
  pricePerUnit: number;
  lineTotal: number;
};

type ManualItemEntry = {
  productName: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
};

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

export default function FarmerVoiceOrderPage() {
  const { user } = useUser();

  const [loadingAgent, setLoadingAgent] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");

  const [customerDetails, setCustomerDetails] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerCity: "",
    customerAddress: "",
  });

  const [items, setItems] = useState<CreatedOrderItem[]>([]);
  const [newItem, setNewItem] = useState<ManualItemEntry>({
    productName: "",
    quantity: "",
    unit: "kg",
    pricePerUnit: "",
  });
  const [deliveryFee, setDeliveryFee] = useState<number | "">("");
  const [orderMeta, setOrderMeta] = useState<{
    id?: string;
    status?: string;
    source?: string;
  } | null>(null);

  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText();

  useEffect(() => {
    const run = async () => {
      if (!transcript || isListening || !user?.id) return;
      setLoadingAgent(true);
      setAgentMessage("Got it, understanding your order…");
      try {
        const res = await fetch("/api/v1/farmers/orders/voice/farmerOrders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            farmerId: user.id,
            deliveryFee:
              deliveryFee === "" ? undefined : Number(deliveryFee) || 0,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success)
          throw new Error(json?.message || json?.error || "Error parsing order");

        const orderData = json.data.order;
        setCustomerDetails({
          customerName: orderData.customerName || "",
          customerPhone: orderData.customerPhone || "",
          customerEmail: orderData.customerEmail || "",
          customerCity: orderData.customerCity || "",
          customerAddress: orderData.customerAddress || "",
        });
        setItems(orderData.items || []);
        setOrderMeta({
          id: orderData.id,
          status: orderData.status,
          source: orderData.source,
        });
        setAgentMessage("Order details filled. Please review below ✅");
        toast.success("Voice order parsed!");
      } catch (e: any) {
        setAgentMessage("Sorry, I couldn't understand the order fully.");
        toast.error("Could not auto-fill order. Please enter details manually.");
      } finally {
        setLoadingAgent(false);
      }
    };
    run();
  }, [transcript, isListening, user?.id]);

  const handleCustomerChange = (field: string, value: string) =>
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));

  const handleDeliveryFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDeliveryFee(v === "" ? "" : Number(v));
  };

  const addManualItem = () => {
    if (!newItem.productName || !newItem.quantity || !newItem.pricePerUnit) {
      toast.error("Please fill in product, qty and price");
      return;
    }
    const qty = parseFloat(newItem.quantity);
    const price = parseFloat(newItem.pricePerUnit);
    setItems([
      ...items,
      {
        productId: "manual-" + Date.now(),
        productName: newItem.productName,
        unit: newItem.unit,
        quantity: qty,
        pricePerUnit: price,
        lineTotal: qty * price,
      },
    ]);
    setNewItem({ productName: "", quantity: "", unit: "kg", pricePerUnit: "" });
  };

  const removeItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleItemPriceChange = (index: number, value: string) => {
    const price = parseFloat(value);
    setItems((prev) => {
      const next = [...prev];
      const item = next[index];
      const qty = Number(item.quantity) || 0;
      next[index] = {
        ...item,
        pricePerUnit: isNaN(price) ? 0 : price,
        lineTotal: qty * (isNaN(price) ? 0 : price),
      };
      return next;
    });
  };

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const total = subtotal + (typeof deliveryFee === "number" ? deliveryFee : 0);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("Farmer not identified. Please login again.");
      return;
    }
    if (
      !customerDetails.customerName ||
      !customerDetails.customerPhone ||
      !customerDetails.customerAddress
    ) {
      toast.error("Please fill customer name, phone and address");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    try {
      const res = await fetch("/api/v1/voice-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          ...customerDetails,
          items,
          deliveryFee: typeof deliveryFee === "number" ? deliveryFee : 0,
          notes: "Submitted from farmer voice-order form; this is not a confirmed order.",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.message || json?.error || "Failed to save order");
      toast.success("Order saved successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save order");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <main className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm sm:p-8">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground-heading">
                  Voice Order
                </h1>
                <p className="mt-1 text-sm text-foreground-muted">
                  Speak to auto-fill, or type details manually below.
                </p>
              </div>
              <div className="hidden flex-col items-end text-right sm:flex">
                <span className="text-xs text-foreground-muted">Farmer Account</span>
                <span className="text-sm font-semibold text-foreground-heading">
                  {user.name}
                </span>
              </div>
            </div>

            {/* Voice controls */}
            <div className="mb-6 flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`flex flex-shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  isListening
                    ? "animate-pulse bg-status-danger-surface text-status-danger border border-status-danger/30"
                    : "bg-surface-card border border-border text-foreground-body shadow-sm hover:bg-surface hover:border-primary/30"
                }`}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4 text-brand" />
                )}
                {isListening ? "Stop Listening" : "Tap to Speak"}
              </button>

              <div className="flex-1">
                {transcript ? (
                  <p className="text-sm italic text-foreground-body">
                    &ldquo;{transcript}&rdquo;
                  </p>
                ) : (
                  <p className="text-sm text-foreground-muted">
                    Say &ldquo;2kg tomatoes and 5kg onions for John…&rdquo;
                  </p>
                )}
              </div>
            </div>

            {agentMessage && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-status-info/30 bg-status-info-surface px-4 py-2.5 text-sm font-medium text-status-info">
                <span>🤖</span>
                {agentMessage}
              </div>
            )}

            <div className="mb-6 border-t border-border" />

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Customer Details */}
              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground-muted">
                  Customer Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground-body">
                      Customer Name
                    </label>
                    <input
                      value={customerDetails.customerName}
                      onChange={(e) =>
                        handleCustomerChange("customerName", e.target.value)
                      }
                      className={INPUT_CLASS}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground-body">
                      Phone Number
                    </label>
                    <input
                      value={customerDetails.customerPhone}
                      onChange={(e) =>
                        handleCustomerChange("customerPhone", e.target.value)
                      }
                      className={INPUT_CLASS}
                      placeholder="+91 00000 00000"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground-body">
                      Full Address
                    </label>
                    <input
                      value={customerDetails.customerAddress}
                      onChange={(e) =>
                        handleCustomerChange("customerAddress", e.target.value)
                      }
                      className={INPUT_CLASS}
                      placeholder="Street, Building, Landmark…"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground-body">
                      City
                    </label>
                    <input
                      value={customerDetails.customerCity}
                      onChange={(e) =>
                        handleCustomerChange("customerCity", e.target.value)
                      }
                      className={INPUT_CLASS}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground-body">
                      Email{" "}
                      <span className="font-normal text-foreground-muted">
                        (optional)
                      </span>
                    </label>
                    <input
                      value={customerDetails.customerEmail}
                      onChange={(e) =>
                        handleCustomerChange("customerEmail", e.target.value)
                      }
                      className={INPUT_CLASS}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </section>

              {/* Order Items */}
              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground-muted">
                  Order Items
                </h3>

                {/* Column headers */}
                <div className="mb-2 hidden grid-cols-12 gap-2 px-2 text-xs font-semibold text-foreground-muted sm:grid">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-2">Price (₹)</div>
                  <div className="col-span-1" />
                </div>

                {/* Added items */}
                <div className="mb-4 space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 items-center gap-2 rounded-xl border border-border bg-surface p-3 sm:grid-cols-12"
                    >
                      <div className="font-medium text-foreground-heading sm:col-span-5">
                        {item.productName}
                      </div>
                      <div className="text-sm text-foreground-body sm:col-span-2">
                        <span className="mr-1 text-foreground-muted sm:hidden">
                          Qty:
                        </span>
                        {item.quantity}
                      </div>
                      <div className="text-sm text-foreground-muted sm:col-span-2">
                        {item.unit}
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-border bg-surface-card px-2 py-1.5 text-sm text-foreground-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-20"
                          value={item.pricePerUnit}
                          onChange={(e) =>
                            handleItemPriceChange(idx, e.target.value)
                          }
                          min={0}
                          step="0.5"
                        />
                      </div>
                      <div className="sm:col-span-1 sm:text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-status-danger transition hover:bg-status-danger-surface"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-border py-8 text-center text-sm text-foreground-muted">
                      No items yet — speak or add manually below.
                    </div>
                  )}
                </div>

                {/* Add item row */}
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Add Item Manually
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                    <div className="col-span-2 sm:col-span-5">
                      <input
                        placeholder="Product name (e.g. Potato)"
                        className={INPUT_CLASS}
                        value={newItem.productName}
                        onChange={(e) =>
                          setNewItem({ ...newItem, productName: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        className={INPUT_CLASS}
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem({ ...newItem, quantity: e.target.value })
                        }
                      />
                    </div>
                    <div className="relative col-span-1 sm:col-span-2">
                      <select
                        className={INPUT_CLASS + " appearance-none pr-8"}
                        value={newItem.unit}
                        onChange={(e) =>
                          setNewItem({ ...newItem, unit: e.target.value })
                        }
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="pcs">pcs</option>
                        <option value="bunch">bunch</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <input
                        type="number"
                        placeholder="Price/unit"
                        className={INPUT_CLASS}
                        value={newItem.pricePerUnit}
                        onChange={(e) =>
                          setNewItem({ ...newItem, pricePerUnit: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <button
                        type="button"
                        onClick={addManualItem}
                        className="flex h-full w-full items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Totals */}
              <section className="rounded-xl border border-border bg-surface p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-foreground-muted">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground-body">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-foreground-muted">
                    <span>Delivery Fee (₹)</span>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={handleDeliveryFeeChange}
                      placeholder="0"
                      className="w-24 rounded-lg border border-border bg-surface-card px-3 py-1.5 text-right text-sm text-foreground-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-base font-bold text-foreground-heading">
                      Total Order Value
                    </span>
                    <span className="text-xl font-bold text-primary">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Submit */}
              <button
                type="submit"
                disabled={loadingAgent}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
              >
                {loadingAgent ? "Processing Voice…" : "Save Order"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
