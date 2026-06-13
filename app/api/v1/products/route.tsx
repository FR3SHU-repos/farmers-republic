// app/api/v1/products/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB }       from "@/shared/lib/db/mongo";
import ProductModel      from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses";
import mongoose          from "mongoose";
import { checkRateLimit, limiters, getIP } from "@/shared/lib/rateLimit";
import {
  cacheGet, cacheSet, cacheDel,
  invalidateProductListCache,
  CacheKeys, CacheTTL, queryHash,
} from "@/shared/lib/cache";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value).split(",").map((s) => s.trim()).filter(Boolean);
}

// ── CREATE PRODUCT (POST) ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Rate limit: 10 products / hour / farmer (identified by IP or farmerId) ─
  const limitKey = req.headers.get("x-farmer-id") || getIP(req);
  const limited  = await checkRateLimit(limiters.productCreate, limitKey);
  if (limited) return limited;

  try {
    await mongoDB();
    const body = await req.json();

    if (!body?.name || body.price == null) {
      return NextResponse.json(failure("Name and price are required"), { status: 400 });
    }

    let farmerObjectId: mongoose.Types.ObjectId | undefined;
    if (body.farmerId) {
      try { farmerObjectId = new mongoose.Types.ObjectId(body.farmerId); } catch { /* ignore */ }
    }

    let dimensionsCm: any;
    if (body.dimensionsCm && typeof body.dimensionsCm === "object") {
      const { length, width, height } = body.dimensionsCm;
      if (length != null && width != null && height != null) {
        dimensionsCm = { length: Number(length), width: Number(width), height: Number(height) };
      }
    } else if (body.lengthCm != null && body.widthCm != null && body.heightCm != null) {
      dimensionsCm = {
        length: Number(body.lengthCm),
        width:  Number(body.widthCm),
        height: Number(body.heightCm),
      };
    }

    const doc: any = {
      name:         body.name,
      slug:         body.slug,
      sku:          body.sku,
      image:        body.image,
      images:       toStringArray(body.images),
      videoUrl:     body.videoUrl,
      price:        Number(body.price),
      mrp:          body.mrp  != null ? Number(body.mrp)  : undefined,
      currency:     body.currency || "INR",
      unit:         body.unit,
      unitQuantity: body.unitQuantity != null ? Number(body.unitQuantity) : undefined,
      minOrderQty:  body.minOrderQty  != null ? Number(body.minOrderQty)  : 1,
      maxOrderQty:  body.maxOrderQty  != null ? Number(body.maxOrderQty)  : undefined,
      stepQty:      body.stepQty      != null ? Number(body.stepQty)      : 1,
      stockQty:          body.stockQty != null ? Number(body.stockQty) : 0,
      reservedQty:       0,
      availableQty:      body.stockQty != null ? Number(body.stockQty) : 0,
      lowStockThreshold: body.lowStockThreshold != null ? Number(body.lowStockThreshold) : 0,
      inStock:           body.inStock      ?? true,
      allowBackorder:    body.allowBackorder ?? false,
      harvestDate:  body.harvestDate ? new Date(body.harvestDate) : undefined,
      expiryDate:   body.expiryDate  ? new Date(body.expiryDate)  : undefined,
      batchId:      body.batchId || undefined,
      rating:       body.rating       ?? 0,
      reviewsCount: body.reviewsCount ?? 0,
      sourceFrom:   body.sourceFrom,
      purchasedLast30Days: body.purchasedLast30Days ?? 0,
      farmer:    body.farmer,
      farmerId:  farmerObjectId,
      category:     body.category,
      subCategory:  body.subCategory,
      tags:         toStringArray(body.tags),
      badge:        body.badge,
      label:        body.label,
      status:       body.status || "draft",
      isFeatured:   body.isFeatured   ?? false,
      sortPriority: body.sortPriority != null ? Number(body.sortPriority) : 0,
      swadeshiPercent: body.swadeshiPercent != null ? Number(body.swadeshiPercent) : undefined,
      healthBenefits:     toStringArray(body.healthBenefits),
      timeToSupply:       body.timeToSupply,
      shelfLife:          body.shelfLife,
      storageInstructions: body.storageInstructions,
      ingredients:        toStringArray(body.ingredients),
      originCountry:      body.originCountry || "India",
      isOrganic:          body.isOrganic ?? false,
      certifications:     toStringArray(body.certifications),
      description:        body.description,
      shortDescription:   body.shortDescription,
      fssai:              body.fssai,
      hsnCode:            body.hsnCode,
      gstRate:            body.gstRate != null ? Number(body.gstRate) : undefined,
      gstIncludedInPrice: body.gstIncludedInPrice ?? true,
      productType:  body.productType || "physical",
      weightGrams:  body.weightGrams  != null ? Number(body.weightGrams) : undefined,
      dimensionsCm,
      fragile:   body.fragile   ?? false,
      perishable: body.perishable ?? false,
      codAvailable: body.codAvailable ?? true,
      seoTitle:       body.seoTitle,
      seoDescription: body.seoDescription,
      searchKeywords: toStringArray(body.searchKeywords),
      attributes: body.attributes && typeof body.attributes === "object" ? body.attributes : undefined,
    };

    const created = await ProductModel.create(doc);

    // ── Invalidate product list + category caches on creation ─────────────
    await Promise.all([
      invalidateProductListCache(),
      cacheDel(CacheKeys.categoriesAll),
    ]);

    return NextResponse.json(
      success({ id: created._id, ...created.toObject({ versionKey: false }) }, "Product created"),
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Create product error:", err);
    return NextResponse.json(failure("Failed to create product", err?.message || err), { status: 500 });
  }
}

// ── LIST PRODUCTS (GET) ───────────────────────────────────────────────────────
const DEFAULT_LIMIT = 10;
const MAX_LIMIT     = 100;

export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url        = new URL(req.url);
    const pageParam  = parseInt(url.searchParams.get("page")  ?? "1",  10);
    const limitParam = parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const q          = (url.searchParams.get("q")        ?? "").trim();
    const category   = (url.searchParams.get("category") ?? "").trim();
    const farmerId   = (url.searchParams.get("farmerId") ?? "").trim();
    const status     = (url.searchParams.get("status")   ?? "").trim();
    const isFeatured = (url.searchParams.get("featured") ?? "").trim();
    const sort       = (url.searchParams.get("sort")     ?? "createdAt_desc").trim();

    const page  = Number.isFinite(pageParam)  && pageParam  > 0 ? pageParam  : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

    // ── Cache check ──────────────────────────────────────────────────────────
    const cacheParams: Record<string, string> = {
      page: String(page), limit: String(limit), q, category, farmerId, status, isFeatured, sort,
    };
    const key    = CacheKeys.productList(queryHash(cacheParams));
    const cached = await cacheGet<ReturnType<typeof success>>(key);
    if (cached) {
      return NextResponse.json(cached);
    }

    // ── Build MongoDB query ──────────────────────────────────────────────────
    const query: any = {};
    if (q) {
      query.$or = [
        { name:     { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { tags:     { $regex: q, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (farmerId) {
      try { query.farmerId = new mongoose.Types.ObjectId(farmerId); } catch { /* ignore */ }
    }
    if (status)             query.status     = status;
    if (isFeatured === "true")  query.isFeatured = true;
    if (isFeatured === "false") query.isFeatured = false;

    const sortOptions: any = {};
    if (sort) {
      const [field, order] = sort.split("_");
      const dir = order === "asc" ? 1 : -1;
      switch (field) {
        case "price":               sortOptions.price               = dir; break;
        case "rating":              sortOptions.rating              = dir; break;
        case "purchasedLast30Days": sortOptions.purchasedLast30Days = dir; break;
        case "name":                sortOptions.name                = dir; break;
        default:                    sortOptions.createdAt           = dir;
      }
    } else {
      sortOptions.createdAt = -1;
    }

    const skip     = (page - 1) * limit;
    const total    = await ProductModel.countDocuments(query);
    const products = await ProductModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean().select("-__v").exec();

    const responseBody = success({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), products }, "Products fetched");

    // ── Cache response ───────────────────────────────────────────────────────
    await cacheSet(key, responseBody, CacheTTL.productList);

    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("Error in GET /api/v1/products:", err);
    return NextResponse.json(failure("Server error", err?.message || err), { status: 500 });
  }
}
