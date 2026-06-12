"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  ExternalLink,
  FileText,
  Leaf,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { FPOS } from "@/shared/data/fpos";
import { cx } from "@/shared/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

function timeAgo(daysAgo: number) {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return `${daysAgo} days ago`;
}

const ACTIVITY = [
  {
    icon: Package,
    text: "1,200 kg Organic Rice dispatched to regional market",
    daysAgo: 3,
    color: "text-status-info",
    bg: "bg-status-info-surface",
  },
  {
    icon: Award,
    text: "Certification renewal submitted",
    daysAgo: 7,
    color: "text-status-warning",
    bg: "bg-status-warning-surface",
  },
  {
    icon: Users,
    text: "New procurement partner onboarded",
    daysAgo: 14,
    color: "text-status-success",
    bg: "bg-status-success-surface",
  },
];

// ─── Small sub-components ─────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-card p-5">
      <div className={cx("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
        <Icon className={cx("h-5 w-5", iconColor)} />
      </div>
      <p className="text-xl font-bold text-foreground-heading">{value}</p>
      <p className="mt-0.5 text-xs text-foreground-muted">{label}</p>
      {sub && <p className="mt-1 text-xs font-medium text-foreground-muted">{sub}</p>}
    </div>
  );
}

function SectionCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-2xl border border-border bg-surface-card p-5", className)}>
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-foreground-heading">{title}</h3>
      )}
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function FpoDetailPage() {
  const { id } = useParams() as { id: string };
  const fpo = FPOS.find((f) => f.id === id);

  if (!fpo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface">
          <Users className="h-8 w-8 text-brand" />
        </div>
        <p className="text-sm text-foreground-muted">
          The FPO you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/fpos"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to FPOs
        </Link>
      </div>
    );
  }

  const totalSold30 = fpo.products.reduce((s, p) => s + (p.sold30 || 0), 0);
  const totalSoldAll = fpo.products.reduce((s, p) => s + (p.soldTotal || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* ── Hero ──────────────────────────────────────── */}
      <div className="relative h-52 w-full overflow-hidden sm:h-64 lg:h-80">
        <Image
          src={fpo.banner}
          alt={fpo.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* gradient: dark at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back link */}
        <Link
          href="/fpos"
          className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-6 sm:top-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All FPOs
        </Link>

        {/* Hero text — pinned to bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {fpo.established && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                Est. {fpo.established}
              </p>
            )}
            <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
              {fpo.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <a
                href={fpo.googleMaps}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-white/80 transition hover:text-white"
              >
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                {fpo.place}
              </a>
              {fpo.crops?.length > 0 && (
                <span className="hidden text-white/40 sm:inline">·</span>
              )}
              {fpo.crops?.slice(0, 3).map((crop) => (
                <span
                  key={crop}
                  className="hidden rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white/90 backdrop-blur-sm sm:inline"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Short description */}
        {fpo.shortDesc && (
          <p className="mb-8 max-w-3xl text-sm leading-7 text-foreground-muted">
            {fpo.shortDesc}
          </p>
        )}

        {/* ── Stat cards ────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={Users}
            label="Farmers"
            value={fpo.noOfFarmers}
            sub={`Since ${fpo.established}`}
            iconColor="text-brand"
            iconBg="bg-secondary-subtle"
          />
          <StatCard
            icon={ShoppingCart}
            label="Sold last 30 days"
            value={totalSold30.toLocaleString("en-IN")}
            sub={`${totalSoldAll.toLocaleString("en-IN")} all time`}
            iconColor="text-status-info"
            iconBg="bg-status-info-surface"
          />
          <StatCard
            icon={Leaf}
            label="Swadeshi"
            value={`${fpo.swadeshiPercentage}%`}
            sub={`${fpo.organicPercent}% organic`}
            iconColor="text-status-success"
            iconBg="bg-status-success-surface"
          />
          <StatCard
            icon={TrendingUp}
            label="Total land"
            value={`${fpo.totalLandArea} ac`}
            sub={`Avg yield ${fpo.avgYieldPerAcre}`}
            iconColor="text-status-warning"
            iconBg="bg-status-warning-surface"
          />
        </div>

        {/* ── Main grid ─────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* ── Left sidebar ─────────────────────────── */}
          <div className="space-y-5">
            {/* Contact */}
            <SectionCard title="Contact">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                      Phone
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground-heading">
                      {fpo.phone}
                    </p>
                  </div>
                  <a
                    href={`tel:${fpo.phone}`}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                    Email
                  </p>
                  <a
                    href={`mailto:${fpo.email}`}
                    className="mt-0.5 block text-sm font-medium text-primary transition hover:underline"
                  >
                    {fpo.email}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                    Location
                  </p>
                  <a
                    href={fpo.googleMaps}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {fpo.place}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </div>

                {fpo.fssai && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                      FSSAI
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-foreground-body">
                      {fpo.fssai}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Farmers */}
            <SectionCard title={`Farmers (${fpo.noOfFarmers})`}>
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {fpo.farmers.map((farmer) => (
                  <div
                    key={farmer.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/farmers/${farmer.id}`}
                        className="block truncate text-sm font-medium text-foreground-heading transition hover:text-primary"
                      >
                        {farmer.name}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-foreground-muted">
                        {farmer.place}
                      </p>
                    </div>
                    {farmer.phone ? (
                      <a
                        href={`tel:${farmer.phone}`}
                        className="flex-shrink-0 text-xs text-primary transition hover:underline"
                      >
                        {farmer.phone}
                      </a>
                    ) : (
                      <span className="flex-shrink-0 text-xs text-foreground-muted">—</span>
                    )}
                  </div>
                ))}
              </div>
              <Link
                href={`/fpos/${fpo.id}/farmers`}
                className="mt-3 block text-center text-xs font-semibold text-primary transition hover:underline"
              >
                View all farmers →
              </Link>
            </SectionCard>

            {/* Certifications & Docs */}
            <SectionCard title="Certifications">
              <div className="flex flex-wrap gap-2">
                {fpo.certifications.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary-subtle px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    <Award className="h-3 w-3" />
                    {c}
                  </span>
                ))}
              </div>

              {fpo.documents?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                    Documents
                  </p>
                  <ul className="space-y-2">
                    {fpo.documents.map((d) => (
                      <li key={d.name}>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                          {d.name}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Right column ──────────────────────────── */}
          <div className="space-y-5">
            {/* Products & Sales */}
            <SectionCard>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground-heading">
                    Products & Sales
                  </h3>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    Recent performance across all listed products
                  </p>
                </div>
                <span className="flex-shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground-muted">
                  Updated {timeAgo(0)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      {["Product", "Sold (30d)", "Total Sold", "Avg Price"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={cx(
                              "px-4 py-3 text-xs font-semibold text-foreground-muted",
                              i > 0 ? "text-right" : "text-left"
                            )}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {fpo.products.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={cx(
                          "border-t border-border transition hover:bg-surface/60",
                          idx === 0 ? "border-t-0" : ""
                        )}
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/products/${p.id}`}
                            className="font-medium text-foreground-heading transition hover:text-primary"
                          >
                            {p.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-foreground-muted">
                            {fpo.crops[0]}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground-body">
                          {p.sold30.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground-body">
                          {p.soldTotal.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground-muted">
                          {inr(120)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-border bg-surface">
                      <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground-heading">
                        {totalSold30.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground-heading">
                        {totalSoldAll.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground-muted">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Land + KPIs */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Land breakdown */}
              <SectionCard title="Land Breakdown">
                <div className="space-y-3.5">
                  {Object.entries(fpo.landBreakdown).map(([key, acres]) => {
                    const pct = Math.round(
                      ((acres as number) / fpo.totalLandArea) * 100
                    );
                    return (
                      <div key={key}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium capitalize text-foreground-body">
                            {key}
                          </span>
                          <span className="text-foreground-muted">
                            {(acres as number).toLocaleString("en-IN")} ac · {pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="pt-1 text-xs text-foreground-muted">
                    Total:{" "}
                    <span className="font-semibold text-foreground-body">
                      {fpo.totalLandArea.toLocaleString("en-IN")} acres
                    </span>
                  </p>
                </div>
              </SectionCard>

              {/* KPIs */}
              <SectionCard title="Key Metrics">
                <div className="space-y-3">
                  {[
                    { label: "Avg yield / acre", value: fpo.avgYieldPerAcre },
                    { label: "Organic share", value: `${fpo.organicPercent}%` },
                    { label: "Swadeshi %", value: `${fpo.swadeshiPercentage}%` },
                    { label: "Member retention", value: "94%" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5"
                    >
                      <span className="text-xs text-foreground-muted">{label}</span>
                      <span className="text-sm font-semibold text-foreground-heading">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Request supply
                  </button>
                  <a
                    href={fpo.googleMaps}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-border bg-surface-card px-4 py-2 text-xs font-semibold text-foreground-body transition hover:bg-surface"
                  >
                    View on map
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </SectionCard>
            </div>

            {/* Recent activity timeline */}
            <SectionCard title="Recent Activity">
              <ol className="space-y-0">
                {ACTIVITY.map(({ icon: Icon, text, daysAgo, color, bg }, i) => (
                  <li key={i} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cx(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                          bg
                        )}
                      >
                        <Icon className={cx("h-4 w-4", color)} />
                      </div>
                      {i < ACTIVITY.length - 1 && (
                        <div className="my-1 w-px flex-1 bg-border" />
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className={cx(
                        "pb-5",
                        i === ACTIVITY.length - 1 ? "pb-0" : ""
                      )}
                    >
                      <p className="text-sm text-foreground-body">{text}</p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {timeAgo(daysAgo)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
