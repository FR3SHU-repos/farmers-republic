import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  description: string;
  updated?: string;
  children: ReactNode;
};

export function LegalPage({ title, description, updated, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f8faf5] pb-24">
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-white to-lime-50/70">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-emerald-900/10 bg-white px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm hover:border-emerald-700/30"
          >
            FR3SH / Farmers Republic
          </Link>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
            {description}
          </p>
          {updated ? (
            <p className="mt-4 text-sm font-medium text-stone-500">
              Last updated: {updated}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <article className="space-y-8 text-sm leading-7 text-stone-700">
            {children}
          </article>

          <aside className="h-fit rounded-lg border border-emerald-900/10 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-emerald-950">
              App Store links
            </h2>
            <div className="mt-4 grid gap-3 text-sm">
              <Link href="/privacy" className="text-emerald-800 hover:text-emerald-950">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-emerald-800 hover:text-emerald-950">
                Terms & Conditions
              </Link>
              <Link href="/data-deletion" className="text-emerald-800 hover:text-emerald-950">
                Data Deletion Request
              </Link>
              <Link href="/content-rights" className="text-emerald-800 hover:text-emerald-950">
                Content Rights
              </Link>
              <Link href="/support" className="text-emerald-800 hover:text-emerald-950">
                Contact Support
              </Link>
            </div>
            <div className="mt-5 rounded-lg bg-lime-50 p-4 text-xs leading-6 text-emerald-950">
              For privacy, account, order, or intellectual property requests,
              email{" "}
              <a className="font-semibold underline" href="mailto:hello@farmers-republic.com">
                hello@farmers-republic.com
              </a>
              .
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-emerald-950">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
