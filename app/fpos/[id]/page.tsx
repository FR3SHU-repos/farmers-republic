"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Users,
  MapPin,
  Leaf,
  ShoppingCart,
  FileText,
  Phone,
  ExternalLink,
  Award,
} from "lucide-react";
//import { cx } from "@/shared/lib/utils";
import { FPOS } from "@/shared/data/fpos"; // Mock data

/* ------------------------- Mock data (replace with real API) ------------------------- */



/* ------------------------------- Helper utils -------------------------------- */

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/* ------------------------------- Page component -------------------------------- */

export default function FpoDetailPage() {
  const params = useParams() as { id?: string | undefined };
  const id = params?.id ?? "";
  const fpo = FPOS.find((f) => f.id === id);

  if (!fpo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center text-stone-600">
          <h3 className="text-xl font-semibold">FPO not found</h3>
          <p className="mt-2">The FPO you requested does not exist (mock data).</p>
          <Link href="/fpo" className="mt-4 inline-block text-primary hover:underline">
            Back to FPO list
          </Link>
        </div>
      </div>
    );
  }

  const totalSold30 = fpo.products.reduce((s, p) => s + (p.sold30 || 0), 0);
  const totalSoldAll = fpo.products.reduce((s, p) => s + (p.soldTotal || 0), 0);

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      {/* Banner */}
      <div className="relative h-56 md:h-72 lg:h-96">
        <Image src={fpo.banner} alt={fpo.name} fill className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b mt-100 from-black/30 to-black/40 flex items-end">
          <div className="max-w-6xl w-full mx-auto p-6 md:p-10 mb-200">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white">{fpo.name}</h1>
            <p className="text-sm md:text-base text-stone-100 mt-2 max-w-2xl">{fpo.shortDesc}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 md:-mt-16">
        {/* Top metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
            <div className="bg-green-50 rounded-full p-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-stone-500">No. of Farmers</div>
              <div className="text-lg font-semibold">{fpo.noOfFarmers}</div>
              <div className="text-xs text-stone-400">Joined since {fpo.established}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
            <div className="bg-green-50 rounded-full p-3">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-stone-500">Sold (last 30 days)</div>
              <div className="text-lg font-semibold">{totalSold30}</div>
              <div className="text-xs text-stone-400">{totalSoldAll} total</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
            <div className="bg-green-50 rounded-full p-3">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-stone-500">Swadeshi</div>
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold">{fpo.swadeshiPercentage}%</div>
                <div className="w-36 bg-stone-100 h-2 rounded overflow-hidden">
                  <div className="h-2 bg-green-600" style={{ width: `${fpo.swadeshiPercentage}%` }} />
                </div>
              </div>
              <div className="text-xs text-stone-400">Organic: {fpo.organicPercent}%</div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left column: farmers list + contact */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-md font-semibold mb-3">Contact</h3>
              <div className="text-sm text-stone-600 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-stone-400">Phone</div>
                    <div className="font-medium">{fpo.phone}</div>
                  </div>
                  <a href={`tel:${fpo.phone}`} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-600 text-white text-sm">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                </div>

                <div>
                  <div className="text-xs text-stone-400">Email</div>
                  <div className="font-medium">{fpo.email}</div>
                </div>

                <div>
                  <div className="text-xs text-stone-400">Location</div>
                  <a href={fpo.googleMaps} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {fpo.place} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-md font-semibold mb-3">Farmers in this FPO ({fpo.noOfFarmers})</h3>
              <div className="space-y-3 max-h-64 overflow-auto pr-2">
                {fpo.farmers.map((farmer) => (
                  <div key={farmer.id} className="flex items-center justify-between">
                    <div>
                      <Link href={`/farmers/${farmer.id}`} className="font-medium hover:underline">{farmer.name}</Link>
                      <div className="text-xs text-stone-500">{farmer.place}</div>
                    </div>
                    <div className="text-xs text-stone-500">{farmer.phone ? <a href={`tel:${farmer.phone}`}>{farmer.phone}</a> : "-"}</div>
                  </div>
                ))}
                {/* quick CTA */}
                <div className="pt-3">
                  <Link href={`/fpo/${fpo.id}/farmers`} className="text-sm inline-block text-primary hover:underline">View all farmers</Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="text-md font-semibold mb-3">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {fpo.certifications.map((c) => (
                  <div key={c} className="px-3 py-1 rounded-full bg-green-50 text-green-800 text-xs flex items-center gap-2">
                    <Award className="w-3 h-3" /> {c}
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <h4 className="text-xs text-stone-400">Documents</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {fpo.documents.map((d) => (
                    <li key={d.name}>
                      <a href={d.url} className="text-primary inline-flex items-center gap-2" target="_blank" rel="noreferrer">
                        <FileText className="w-4 h-4" /> {d.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Middle: products and sales */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Products & Sales</h3>
                  <p className="text-sm text-stone-500">Recent performance and product list</p>
                </div>
                <div className="text-sm text-stone-500">Updated: Today</div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-stone-500 border-b">
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Sold (30d)</th>
                      <th className="py-3 pr-4">Total sold</th>
                      <th className="py-3 pr-4">Avg price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fpo.products.map((p) => (
                      <tr key={p.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4">
                          <Link href={`/product/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                          <div className="text-xs text-stone-400">Category: {fpo.crops.join(", ")?.split(",")[0]}</div>
                        </td>
                        <td className="py-3 pr-4">{p.sold30}</td>
                        <td className="py-3 pr-4">{p.soldTotal}</td>
                        <td className="py-3 pr-4">{currency(120)} {/* mock */}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-3 font-semibold">Totals</td>
                      <td className="py-3 font-semibold">{totalSold30}</td>
                      <td className="py-3 font-semibold">{totalSoldAll}</td>
                      <td className="py-3 text-stone-500">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Land breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(fpo.landBreakdown).map(([key, acres]) => {
                    const pct = Math.round(((acres as number) / fpo.totalLandArea) * 100);
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="capitalize">{key}</div>
                          <div className="text-stone-500">{acres} acres · {pct}%</div>
                        </div>
                        <div className="mt-1 w-full bg-stone-100 h-2 rounded overflow-hidden">
                          <div className="h-2 bg-green-600" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">KPIs</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-stone-500">Avg yield / acre</div>
                    <div className="font-medium">{fpo.avgYieldPerAcre}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-stone-500">Organic %</div>
                    <div className="font-medium">{fpo.organicPercent}%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-stone-500">Member retention</div>
                    <div className="font-medium">94%</div>
                  </div>
                </div>

                <div className="mt-4">
                  <button className="px-4 py-2 rounded-full bg-green-600 text-white inline-flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Request supply
                  </button>
                  <a href={fpo.googleMaps} target="_blank" rel="noreferrer" className="ml-3 text-sm text-primary underline inline-flex items-center gap-2">
                    View on map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Optional: timeline or recent activity */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h4 className="text-sm font-semibold mb-3">Recent activity</h4>
              <ul className="space-y-3 text-sm text-stone-600">
                <li>📦 1200 kg Organic Rice dispatched to regional market (3 days ago)</li>
                <li>🧾 Certification renewal submitted (7 days ago)</li>
                <li>🤝 New procurement partner onboarded (14 days ago)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
