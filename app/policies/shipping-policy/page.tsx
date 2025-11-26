// app/policies/shipping-policy/page.tsx

export const metadata = {
  title: "Shipping Policy | fr3sh.in",
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10">

        <header className="space-y-2 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Shipping Policy
          </h1>
          <p className="text-sm text-gray-500">
            Last updated: 26 November 2025
          </p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed">

          {/* Shipping Method */}
          <section className="space-y-3">
            <p>
              The orders for the user are shipped through registered domestic
              courier companies and/or speed post only.
            </p>
          </section>

          {/* Dispatch & Delivery Timelines */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Dispatch & Delivery Timelines</h2>
            <p>
              Orders are shipped within <strong>30 days</strong> from the date of
              the order and/or payment, or as per the delivery date agreed at the
              time of order confirmation and delivery of the shipment, subject to
              courier company/post office norms.
            </p>
            <p>
              The Platform Owner shall not be liable for any delay in delivery by
              the courier company or postal authority.
            </p>
          </section>

          {/* Delivery Address & Confirmation */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Delivery Address & Confirmation</h2>
            <p>
              Delivery of all orders will be made to the address provided by the
              buyer at the time of purchase.
            </p>
            <p>
              Delivery of our services will be confirmed on your email ID as
              specified at the time of registration.
            </p>
          </section>

          {/* Shipping Charges */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Shipping Charges</h2>
            <p>
              If there are any shipping cost(s) levied by the seller or the
              Platform Owner (as the case may be), the same shall be notified to
              you at checkout and such charges are <strong>non-refundable</strong>.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
