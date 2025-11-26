// app/policies/return-policy/page.tsx

export const metadata = {
  title: "Return Policy | fr3sh.in",
};

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10">

        <header className="space-y-2 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Return Policy</h1>
          <p className="text-sm text-gray-500">Last updated: 26 November 2025</p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed">

          {/* Return Window */}
          <section className="space-y-3">
            <p>
              We offer refund or exchange within the first <strong>30 days</strong> 
              from the date of your purchase. If 30 days have passed since your purchase, 
              you will not be eligible for a return, exchange, or refund of any kind.
            </p>
          </section>

          {/* Eligibility */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Eligibility for Return or Exchange</h2>
            <p>To be eligible for a return or exchange:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The purchased item must be unused and in the same condition as received.</li>
              <li>The item must have its original packaging.</li>
              <li>
                Items purchased on sale may not be eligible for return or exchange 
                (as indicated at the time of purchase).
              </li>
              <li>
                Only items that are defective or damaged may be eligible for replacement 
                through an exchange request.
              </li>
            </ul>
          </section>

          {/* Exempt Items */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Non-Returnable / Exempt Items</h2>
            <p>
              You agree that certain categories of products may be exempt from returns or 
              refunds. These categories will be clearly identified to you at the time of 
              purchase.
            </p>
          </section>

          {/* Inspection Process */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Return Inspection & Processing</h2>
            <p>
              For accepted return or exchange requests, once we receive your returned item, 
              it will undergo an inspection process.
            </p>
            <p>
              After inspection, we will notify you via email confirming receipt of the item. 
              If the returned product is approved after the quality check at our end, your 
              request (return or exchange) will be processed in accordance with our policies.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
