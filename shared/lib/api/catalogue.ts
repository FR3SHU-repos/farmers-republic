import type { Product } from "@/shared/interfaces/mongodb/products/product";
import { apiBase, apiURL } from "./url";

const BASE = apiBase(process.env.NEXT_PUBLIC_CATALOGUE_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL);
const DEFAULT_TIMEOUT_MS = 8_000;

type Envelope<T> = { success: boolean; message?: string; data: T };

export class CatalogueAPIError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "CatalogueAPIError";
  }
}

export type ProductPage = {
  items: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type ProductQuery = {
  q?: string;
  category?: string;
  farmerId?: string;
  status?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
};

export type CatalogueCategory = { id: string; name: string; slug: string; isActive: boolean; sortOrder: number };

function mapProduct(raw: Record<string, unknown>): Product {
  const images = Array.isArray(raw.images) ? raw.images.filter((x): x is string => typeof x === "string") : undefined;
  return {
    ...(raw as Product),
    id: String(raw.id ?? raw._id ?? ""),
    name: typeof raw.name === "string" ? raw.name : "",
    price: Number(raw.price ?? 0),
    image: typeof raw.image === "string" ? raw.image : images?.[0],
    images,
    farmerId: raw.farmerId == null ? undefined : String(raw.farmerId),
	categoryId: raw.categoryId == null ? undefined : String(raw.categoryId),
  };
}

async function get<T>(path: string, cache: RequestCache = "no-store"): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(apiURL(BASE, path), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache,
      signal: controller.signal,
    });
    let value: unknown;
    try { value = await response.json(); } catch { throw new CatalogueAPIError("Catalogue returned malformed JSON", response.status); }
    const body = value as Partial<Envelope<T>> & { code?: string };
    if (!response.ok || body.success !== true || body.data === undefined) {
      throw new CatalogueAPIError(body.message ?? `Catalogue request failed (${response.status})`, response.status, body.code);
    }
    return body.data;
  } catch (error) {
    if (error instanceof CatalogueAPIError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new CatalogueAPIError("Catalogue request timed out", 0, "timeout");
    throw new CatalogueAPIError("Catalogue service is unavailable", 0, "unavailable");
  } finally { clearTimeout(timeout); }
}

async function mutate<T>(path: string, method: "POST" | "PATCH", body: unknown, options: { idempotencyKey?: string; revision?: number } = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`/api/v1${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}), ...(options.revision !== undefined ? { "If-Match": String(options.revision) } : {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let value: unknown;
    try { value = await response.json(); } catch { throw new CatalogueAPIError("Catalogue returned malformed JSON", response.status); }
    const envelope = value as Partial<Envelope<T>> & { code?: string };
    if (!response.ok || envelope.success !== true || envelope.data === undefined) throw new CatalogueAPIError(envelope.message ?? `Catalogue request failed (${response.status})`, response.status, envelope.code);
    return envelope.data;
  } catch (error) {
    if (error instanceof CatalogueAPIError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new CatalogueAPIError("Catalogue request timed out", 0, "timeout");
    throw new CatalogueAPIError("Catalogue service is unavailable", 0, "unavailable");
  } finally { clearTimeout(timeout); }
}

export const catalogueAPI = {
	async categories(): Promise<CatalogueCategory[]> {
		const data = await get<{ items: CatalogueCategory[] }>("/categories");
		return data.items;
	},
  async list(query: ProductQuery = {}): Promise<ProductPage> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
    const data = await get<{ products?: Array<Record<string, unknown>>; meta?: ProductPage["meta"]; page?: number; limit?: number; total?: number; totalPages?: number }>(`/products?${params}`);
    const items = (data.products ?? []).map(mapProduct);
    const limit = Number(data.meta?.limit ?? data.limit ?? query.limit ?? 12);
    const total = Number(data.meta?.total ?? data.total ?? items.length);
    return { items, meta: { page: Number(data.meta?.page ?? data.page ?? query.page ?? 1), limit, total, totalPages: Number(data.meta?.totalPages ?? data.totalPages ?? Math.max(1, Math.ceil(total / limit))) } };
  },
  async get(id: string): Promise<Product> { return mapProduct(await get<Record<string, unknown>>(`/products/${encodeURIComponent(id)}`)); },
  async byFarmer(farmerId: string): Promise<Product[]> {
    const data = await get<{ products?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }>(`/products/by-farmer/${encodeURIComponent(farmerId)}`);
    return (data.products ?? data.items ?? []).map(mapProduct);
  },
  async create(input: Record<string, unknown>, idempotencyKey: string): Promise<Product> {
    return mapProduct(await mutate<Record<string, unknown>>("/products", "POST", input, { idempotencyKey }));
  },
  async update(id: string, input: Record<string, unknown>, revision?: number): Promise<Product> {
    return mapProduct(await mutate<Record<string, unknown>>(`/products/${encodeURIComponent(id)}`, "PATCH", input, { revision }));
  },
};
