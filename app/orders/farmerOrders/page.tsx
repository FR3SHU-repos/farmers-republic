// app/orders/farmerOrders/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSpeechToText } from "@/shared/hooks/useSpeechToText";
import { useUser } from "@/shared/context/UserContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Types
type CreatedOrderItem = {
  productId: string; // We'll use a placeholder ID for manual entries
  productName: string;
  unit?: string;
  quantity: number;
  pricePerUnit: number;
  lineTotal: number;
};

// Simplified type for the manual entry row
type ManualItemEntry = {
  productName: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
};

export default function FarmerVoiceOrderPage() {
  const router = useRouter();
  const { user } = useUser();

  const [loadingAgent, setLoadingAgent] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");

  // --- 1. Customer Details State ---
  const [customerDetails, setCustomerDetails] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerCity: "",
    customerAddress: "",
  });

  // --- 2. Order Items State (Always visible) ---
  const [items, setItems] = useState<CreatedOrderItem[]>([]);
  
  // State for the "New Item" input row
  const [newItem, setNewItem] = useState<ManualItemEntry>({
    productName: "",
    quantity: "",
    unit: "kg",
    pricePerUnit: "",
  });

  const [deliveryFee, setDeliveryFee] = useState<number | "">("");
  
  // We keep this to store ID/Status returned from API, but we won't hide UI behind it
  const [orderMeta, setOrderMeta] = useState<{ id?: string; status?: string; source?: string } | null>(null);

  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  // Redirect if not logged in
  // Handle Voice Response
useEffect(() => {
  const run = async () => {
    if (!transcript || isListening) return;
    if (!user?.id) return;

    setLoadingAgent(true);
    setAgentMessage("Got it, understanding your order…");

    try {
      const res = await fetch("/api/v1/orders/voice/farmerOrders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          farmerId: user.id,
          deliveryFee: deliveryFee === "" ? undefined : Number(deliveryFee) || 0,
        }),
      });

      const json = await res.json();
      console.log("voice farmerOrders response:", json); // 👈 add this

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || "Error parsing order");
      }

      const orderData = json.data.order;

      // Populate Form Fields from AI Response
      setCustomerDetails({
        customerName: orderData.customerName || "",
        customerPhone: orderData.customerPhone || "",
        customerEmail: orderData.customerEmail || "",
        customerCity: orderData.customerCity || "",
        customerAddress: orderData.customerAddress || "",
      });

      // Populate Items from AI Response
      setItems(orderData.items || []);

      setOrderMeta({
        id: orderData.id,
        status: orderData.status,
        source: orderData.source,
      });

      setAgentMessage("Order details filled. Please review below ✅");
      toast.success("Voice order parsed!");
    } catch (e: any) {
      console.error("voice farmer order error:", e);
      setAgentMessage("Sorry, I couldn't understand the order fully.");
      toast.error("Could not auto-fill order. Please enter details manually.");
    } finally {
      setLoadingAgent(false);
    }
  };

  run();
}, [transcript, isListening, user?.id]);


  // --- Helpers ---

  const handleCustomerChange = (field: string, value: string) => {
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeliveryFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "") setDeliveryFee("");
    else setDeliveryFee(Number(v));
  };

  // Add a manual item to the list
  const addManualItem = () => {
    if (!newItem.productName || !newItem.quantity || !newItem.pricePerUnit) {
      toast.error("Please fill in Product, Qty and Price");
      return;
    }
    const qty = parseFloat(newItem.quantity);
    const price = parseFloat(newItem.pricePerUnit);
    
    const item: CreatedOrderItem = {
      productId: "manual-" + Date.now(),
      productName: newItem.productName,
      unit: newItem.unit,
      quantity: qty,
      pricePerUnit: price,
      lineTotal: qty * price,
    };

    setItems([...items, item]);
    setNewItem({ productName: "", quantity: "", unit: "kg", pricePerUnit: "" }); // Reset inputs
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Calculations
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const total = subtotal + (typeof deliveryFee === "number" ? deliveryFee : 0);


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


  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  if (!user?.id) {
    toast.error("Farmer not identified. Please login again.");
    return;
  }

  if (!customerDetails.customerName || !customerDetails.customerPhone || !customerDetails.customerAddress) {
    toast.error("Please fill customer name, phone and address");
    return;
  }

  if (items.length === 0) {
    toast.error("Please add at least one item");
    return;
  }

  try {
    const res = await fetch("/api/v1/orders/voice/farmerOrders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        farmerId: user.id,

        customerName: customerDetails.customerName,
        customerPhone: customerDetails.customerPhone,
        customerEmail: customerDetails.customerEmail,
        customerAddress: customerDetails.customerAddress,
        customerCity: customerDetails.customerCity,

        items,
        deliveryFee: typeof deliveryFee === "number" ? deliveryFee : 0,

        // optional meta
        source: "app",        // you can use "voice+manual" if you like
        paymentMode: "cod",
        paymentStatus: "unpaid",
        status: "pending",
      }),
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || json?.error || "Failed to save order");
    }

    toast.success("Order saved successfully ✅");

    // Optionally clear the form
    // setCustomerDetails(...); setItems([]); setDeliveryFee("");
    // Or navigate:
    // router.push(`/orders/${json.data.order.id}`);
  } catch (err: any) {
    console.error("manual save error:", err);
    toast.error(err?.message || "Failed to save order");
  }
};


  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Voice Order (Farmer)</h1>
                <p className="text-sm text-stone-500 mt-1">
                  Speak to auto-fill, or type details manually below.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs text-stone-400">Farmer Account</span>
                <span className="text-sm font-medium text-stone-800">{user.name}</span>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6 p-4 bg-stone-50 rounded-xl border border-stone-100">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-all ${
                  isListening 
                    ? "bg-red-100 text-red-700 border border-red-200 animate-pulse" 
                    : "bg-white border hover:bg-stone-50 text-stone-700 shadow-sm"
                }`}
              >
                {isListening ? "Stop Listening" : "Tap to Speak Order"}
                <span className="text-xl">🎤</span>
              </button>

              <div className="flex-1 w-full">
                 {transcript ? (
                   <p className="text-sm text-stone-600 italic">"{transcript}"</p>
                 ) : (
                   <p className="text-sm text-stone-400">Say "2kg tomatoes and 5kg onions for John..."</p>
                 )}
              </div>
            </div>
            
            {agentMessage && (
                <p className="text-sm text-blue-600 mb-4 font-medium flex items-center gap-2">
                   <span>🤖</span> {agentMessage}
                </p>
            )}

            <hr className="border-stone-100 mb-6" />

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* 1. Customer Details Section (Always Visible) */}
              <section>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">Customer Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Customer Name</label>
                    <input
                      value={customerDetails.customerName}
                      onChange={(e) => handleCustomerChange("customerName", e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Phone Number</label>
                    <input
                      value={customerDetails.customerPhone}
                      onChange={(e) => handleCustomerChange("customerPhone", e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Phone"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-500 mb-1">Full Address</label>
                    <input
                      value={customerDetails.customerAddress}
                      onChange={(e) => handleCustomerChange("customerAddress", e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Street, Building, Landmark..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">City</label>
                    <input
                      value={customerDetails.customerCity}
                      onChange={(e) => handleCustomerChange("customerCity", e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1">Email (Optional)</label>
                    <input
                      value={customerDetails.customerEmail}
                      onChange={(e) => handleCustomerChange("customerEmail", e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </section>

              {/* 2. Items Section (Always Visible) */}
              <section>
                 <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">Order Items</h3>
                 
                 {/* Items Table Header */}
                 <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-stone-500 mb-2 px-2">
                    <div className="col-span-5">Product</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-2">Price (₹)</div>
                    <div className="col-span-1"></div>
                 </div>

                 {/* List of Added Items */}
                 <div className="space-y-2 mb-4">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-stone-50 p-2 rounded-md border border-stone-200">
                        <div className="sm:col-span-5 font-medium text-stone-800">{item.productName}</div>
                        <div className="sm:col-span-2 text-sm">
                          <span className="sm:hidden text-stone-400 mr-1">Qty:</span>{item.quantity}
                        </div>
                        <div className="sm:col-span-2 text-sm text-stone-600">{item.unit}</div>
                        <div className="sm:col-span-2 text-sm font-medium flex items-center gap-1">
                            <span className="sm:hidden text-stone-400 mr-1">Price:</span>
                            <span className="hidden sm:inline">₹</span>
                            <input
                                type="number"
                                className="w-full sm:w-20 border border-stone-300 rounded px-2 py-1 text-sm bg-white"
                                value={item.pricePerUnit}
                                onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                                min={0}
                                step="0.5" // or "0.01" as you like
                            />
                        </div>

                        <div className="sm:col-span-1 text-right">
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {items.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-lg text-stone-400 text-sm">
                        No items yet. Speak or add manually below.
                      </div>
                    )}
                 </div>

                 {/* Manual Add Item Row */}
                 <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 mb-2">Add Item Manually</p>
                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                       <div className="col-span-2 sm:col-span-5">
                          <input 
                            placeholder="Product Name (e.g. Potato)"
                            className="w-full text-sm border rounded px-2 py-1.5"
                            value={newItem.productName}
                            onChange={e => setNewItem({...newItem, productName: e.target.value})}
                          />
                       </div>
                       <div className="col-span-1 sm:col-span-2">
                          <input 
                            type="number" 
                            placeholder="Qty"
                            className="w-full text-sm border rounded px-2 py-1.5"
                            value={newItem.quantity}
                            onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                          />
                       </div>
                       <div className="col-span-1 sm:col-span-2">
                          <select 
                            className="w-full text-sm border rounded px-2 py-1.5 bg-white"
                            value={newItem.unit}
                            onChange={e => setNewItem({...newItem, unit: e.target.value})}
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="pcs">pcs</option>
                            <option value="bunch">bunch</option>
                          </select>
                       </div>
                       <div className="col-span-2 sm:col-span-2">
                          <input 
                            type="number" 
                            placeholder="Price/Unit"
                            className="w-full text-sm border rounded px-2 py-1.5"
                            value={newItem.pricePerUnit}
                            onChange={e => setNewItem({...newItem, pricePerUnit: e.target.value})}
                          />
                       </div>
                       <div className="col-span-2 sm:col-span-1">
                          <button 
                            type="button" 
                            onClick={addManualItem}
                            className="w-full h-full bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                          >
                            +
                          </button>
                       </div>
                    </div>
                 </div>
              </section>

              {/* 3. Totals Section (Calculated) */}
              <section className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Delivery Fee (₹)</span>
                    <input 
                      type="number" 
                      value={deliveryFee} 
                      onChange={handleDeliveryFeeChange}
                      placeholder="0"
                      className="w-20 text-right border rounded px-2 py-1 bg-white"
                    />
                  </div>
                  <div className="border-t border-stone-300 my-1"></div>
                  <div className="flex justify-between font-bold text-lg text-stone-900">
                    <span>Total Order Value</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </section>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loadingAgent}
              >
                 {loadingAgent ? "Processing Voice..." : "Save Order"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}