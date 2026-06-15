// app/api/v1/products/[id]/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import ProductModel from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses";
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL, invalidateProductListCache } from "@/shared/lib/cache";
import mongoose from "mongoose";

function toStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value))
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------- GET BY ID ----------
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid product id"), { status: 400 });
    }

    const cacheKey = CacheKeys.productDetail(id);
    const cached = await cacheGet<ReturnType<typeof success>>(cacheKey);
    if (cached) return NextResponse.json(cached);

    await mongoDB();

    const product = await ProductModel.findById(id).lean().select("-__v");
    if (!product)
      return NextResponse.json(failure("Not found"), { status: 404 });

    const body = success(product);
    await cacheSet(cacheKey, body, CacheTTL.productDetail);
    return NextResponse.json(body);
  } catch (err: any) {
    console.error("Error in GET /api/v1/products/[id]:", err);
    return NextResponse.json(
      failure("Server error", err?.message),
      { status: 500 },
    );
  }
}

// ---------- PATCH (full update) ----------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await mongoDB();
    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(failure("Invalid product id"), { status: 400 });
    }

    const body = await req.json();

    // FarmerId handling (optional)
    let farmerObjectId: mongoose.Types.ObjectId | undefined;
    if (body.farmerId) {
      try {
        farmerObjectId = new mongoose.Types.ObjectId(body.farmerId);
      } catch {
        // ignore invalid farmer id
      }
    }

    // Dimensions handling
    let dimensionsCm: any;
    if (body.dimensionsCm && typeof body.dimensionsCm === "object") {
      const { length, width, height } = body.dimensionsCm;
      if (length != null && width != null && height != null) {
        dimensionsCm = {
          length: Number(length),
          width: Number(width),
          height: Number(height),
        };
      }
    } else if (
      body.lengthCm != null &&
      body.widthCm != null &&
      body.heightCm != null
    ) {
      dimensionsCm = {
        length: Number(body.lengthCm),
        width: Number(body.widthCm),
        height: Number(body.heightCm),
      };
    }

    const updateDoc: any = {
      // Identity
      name: body.name,
      slug: body.slug,
      sku: body.sku,

      // Media
      image: body.image,
      images: toStringArray(body.images),
      videoUrl: body.videoUrl,

      // Pricing
      price: body.price != null ? Number(body.price) : undefined,
      mrp: body.mrp != null ? Number(body.mrp) : undefined,
      currency: body.currency,
      hsnCode: body.hsnCode,
      gstRate: body.gstRate != null ? Number(body.gstRate) : undefined,
      gstIncludedInPrice: body.gstIncludedInPrice,

      // Unit
      unit: body.unit,
      unitQuantity:
        body.unitQuantity != null ? Number(body.unitQuantity) : undefined,

      // Order rules
      minOrderQty:
        body.minOrderQty != null ? Number(body.minOrderQty) : undefined,
      maxOrderQty:
        body.maxOrderQty != null ? Number(body.maxOrderQty) : undefined,
      stepQty: body.stepQty != null ? Number(body.stepQty) : undefined,

      // Inventory — availableQty is ALWAYS recomputed when stockQty changes
      // so we skip it here and handle it with $set after fetching reservedQty
      stockQty:          body.stockQty != null ? Number(body.stockQty) : undefined,
      inStock:           body.inStock,
      allowBackorder:    body.allowBackorder,
      lowStockThreshold: body.lowStockThreshold != null ? Number(body.lowStockThreshold) : undefined,

      // Produce freshness
      harvestDate: body.harvestDate ? new Date(body.harvestDate) : undefined,
      expiryDate:  body.expiryDate  ? new Date(body.expiryDate)  : undefined,
      batchId:     body.batchId     || undefined,

      // Ratings / social proof
      rating: body.rating,
      reviewsCount: body.reviewsCount,

      // Farmer / source
      sourceFrom: body.sourceFrom,
      purchasedLast30Days: body.purchasedLast30Days,
      farmer: body.farmer,
      farmerId: farmerObjectId,

      // Category / merchandising
      category: body.category,
      subCategory: body.subCategory,
      tags: toStringArray(body.tags),
      badge: body.badge,
      label: body.label,
      status: body.status,
      isFeatured: body.isFeatured,
      sortPriority:
        body.sortPriority != null ? Number(body.sortPriority) : undefined,

      // Health / quality
      swadeshiPercent:
        body.swadeshiPercent != null ? Number(body.swadeshiPercent) : undefined,
      healthBenefits: toStringArray(body.healthBenefits),
      timeToSupply: body.timeToSupply,
      shelfLife: body.shelfLife,
      storageInstructions: body.storageInstructions,
      ingredients: toStringArray(body.ingredients),
      originCountry: body.originCountry,
      isOrganic: body.isOrganic,
      certifications: toStringArray(body.certifications),

      // Content
      description: body.description,
      shortDescription: body.shortDescription,

      // Misc / tax
      fssai: body.fssai,
      // hsnCode + gstRate above

      // Logistics
      productType: body.productType,
      weightGrams:
        body.weightGrams != null ? Number(body.weightGrams) : undefined,
      dimensionsCm,
      fragile: body.fragile,
      perishable: body.perishable,
      codAvailable: body.codAvailable,

      // SEO
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      searchKeywords: toStringArray(body.searchKeywords),

      // Attributes
      attributes:
        body.attributes && typeof body.attributes === "object"
          ? body.attributes
          : undefined,
    };

    // Remove undefined so we don’t overwrite with undefined
    Object.keys(updateDoc).forEach((key) => {
      if (updateDoc[key] === undefined) delete updateDoc[key];
    });

    // When stockQty is explicitly set, recompute availableQty from the
    // current reservedQty so the invariant (available = stock - reserved) holds.
    if (updateDoc.stockQty !== undefined) {
      const current = await ProductModel.findById(id).select("reservedQty").lean() as any;
      const currentReserved = current?.reservedQty ?? 0;
      const newAvailable = Math.max(0, updateDoc.stockQty - currentReserved);
      updateDoc.availableQty = newAvailable;
      // Auto-toggle inStock based on recalculated available qty
      if (updateDoc.inStock === undefined) {
        updateDoc.inStock = newAvailable > 0;
      }
      if (updateDoc.status === undefined && newAvailable === 0) {
        updateDoc.status = "out_of_stock";
      }
    }

    const updated = await ProductModel.findByIdAndUpdate(id, updateDoc, {
      new: true,
    })
      .lean()
      .select("-__v");

    if (!updated)
      return NextResponse.json(failure("Not found"), { status: 404 });

    await Promise.all([
      cacheDel(CacheKeys.productDetail(id)),
      invalidateProductListCache(),
    ]);

    return NextResponse.json(success(updated));
  } catch (err: any) {
    console.error("Error in PATCH /api/v1/products/[id]:", err);
    return NextResponse.json(
      failure("Server error", err?.message),
      { status: 500 },
    );
  }
}
