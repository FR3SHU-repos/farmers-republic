// app/api/v1/products/route.tsx

// This is to list farmers by pagination, and to create a new farmer

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import ProductModel from "@/shared/models/mongodb/products/products";
import { success, failure } from "@/app/api/v1/utils/responses"; // adjust path if needed
import mongoose from "mongoose";

// Create a new product
export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();

    // Basic validation
    if (!body?.name || !body?.price) {
      return NextResponse.json(failure("Name and price are required"), { status: 400 });
    }

    // Normalize minimal fields
    const doc = {
      name: body.name,
      image: body.image,
      images: Array.isArray(body.images) ? body.images : (body.images ? String(body.images).split(",").map(s=>s.trim()) : []),
      price: body.price,
      rating: body.rating ?? 0,
      reviewsCount: body.reviewsCount ?? 0,
      sourceFrom: body.sourceFrom,
      purchasedLast30Days: body.purchasedLast30Days ?? 0,
      farmer: body.farmer,
      swadeshiPercent: body.swadeshiPercent ?? undefined,
      healthBenefits: Array.isArray(body.healthBenefits) ? body.healthBenefits : (body.healthBenefits ? String(body.healthBenefits).split(",").map(s=>s.trim()) : []),
      timeToSupply: body.timeToSupply,
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(",").map(s=>s.trim()) : []),
      fssai: body.fssai,
      shelfLife: body.shelfLife,
      description: body.description,
      category: body.category,
      badge: body.badge,
    };

    const created = await ProductModel.create(doc);

    return NextResponse.json(success({ id: created._id, ...doc }, "Product created"), { status: 201 });
  } catch (err: any) {
    console.error("Create product error:", err);
    return NextResponse.json(failure("Failed to create product", err?.message || err), { status: 500 });
  }
}

// Default page size
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Getting list of products with pagination
export async function GET(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const pageParam = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limitParam = parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const q = (url.searchParams.get("q") ?? "").trim();
    const category = (url.searchParams.get("category") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "createdAt_desc").trim(); // e.g. createdAt_desc or price_asc

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build query object
    const query: any = {};
    if (q)                  query.name = { $regex: q, $options: "i" };
    if (category)           query.category = category;

    // Build sort object
    const sortOptions: any = {};
    if (sort) {
      const [field, order] = sort.split("_");
      sortOptions[field] = order === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // default sort
    }

    const total = await ProductModel.countDocuments(query);
    const products = await ProductModel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()
      .select("-__v")
      .exec();

    return NextResponse.json(
      success(
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          products,
        },
        "Products fetched"
      )
    );
  } catch (err: any) {
    console.error("Error in GET /api/v1/products:", err);
    return NextResponse.json(failure("Server error", err?.message), { status: 500 });
  }
}   