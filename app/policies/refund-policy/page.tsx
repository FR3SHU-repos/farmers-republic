// app/policies/refund-policy/page.tsx

export const metadata = {
  title: "Refund & Cancellation Policy | fr3sh.in",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10">

        <header className="space-y-2 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-sm text-gray-500">
            Last updated: 26 November 2025
          </p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed">

          {/* Intro */}
          <section className="space-y-3">
            <p>
              This refund and cancellation policy outlines how you can cancel or seek a 
              refund for a product/service that you have purchased through the Platform. 
              Under this policy:
            </p>
          </section>

          {/* Cancellation Rules */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Order Cancellations</h2>
            <p>
              Cancellations will only be considered if the request is made within 
              <strong> 10 days of placing the order</strong>. 
            </p>
            <p>
              However, cancellation requests may not be entertained if the orders have 
              already been communicated to the seller/merchant listed on the Platform 
              and they have initiated the shipping process, or if the product is already 
              out for delivery. In such cases, you may choose to reject the product at the 
              doorstep.
            </p>
          </section>

          {/* Perishable Items */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Perishable Items</h2>
            <p>
              Varmtech does not accept cancellation requests for perishable items such as 
              flowers, eatables, etc.
            </p>
            <p>
              However, a refund or replacement may be provided if you establish that the 
              quality of the delivered product was not satisfactory.
            </p>
          </section>

          {/* Damaged/Defective Items */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Damaged or Defective Products</h2>
            <p>
              In case you receive damaged or defective items, please report it to our 
              customer service team. The request will be processed once the seller/merchant 
              listed on the Platform has examined and verified the issue at their end.
            </p>
            <p>
              Such issues must be reported within <strong>10 days of receiving the product</strong>.
            </p>
          </section>

          {/* Product Not as Expected */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Product Not as Shown or Expected</h2>
            <p>
              If you feel the product received does not match what was shown on the site 
              or does not meet your expectations, you must notify our customer service 
              within <strong>10 days of receiving the product</strong>. 
            </p>
            <p>
              After reviewing your complaint, the customer service team will make an 
              appropriate decision.
            </p>
          </section>

          {/* Products With Manufacturer Warranty */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Products With Manufacturer Warranty</h2>
            <p>
              For products that include a manufacturer warranty, please contact the 
              manufacturer directly regarding any defects or service issues.
            </p>
          </section>

          {/* Refund Processing */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Refund Processing Time</h2>
            <p>
              In case any refund is approved by Varmtech, the refund will be processed 
              within <strong>10 days</strong> and credited to you using the original 
              method of payment (unless otherwise specified).
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
