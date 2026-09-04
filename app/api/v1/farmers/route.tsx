// app/api/v1/farmers/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/shared/lib/db/mongo";
import FarmerModel from "@/shared/models/mongodb/farmer";
import { success, failure } from "@/app/api/v1/utils/responses";
import { FARMERS } from "@/shared/data/farmers";
import { proxyCatalogueGET } from "@/shared/lib/api/catalogue-proxy";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

function fallbackFarmersResponse(req: NextRequest) {
  const url = new URL(req.url);
  const pageParam = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limitParam = parseInt(
    url.searchParams.get("limit") ?? String(DEFAULT_LIMIT),
    10,
  );
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const place = (url.searchParams.get("place") ?? "").trim().toLowerCase();
  const id = url.searchParams.get("id");

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT;

  const filtered = FARMERS.filter((farmer) => {
    if (id && farmer.id !== id) return false;

    const matchesSearch =
      !q ||
      farmer.name.toLowerCase().includes(q) ||
      farmer.farmName?.toLowerCase().includes(q) ||
      farmer.about?.toLowerCase().includes(q) ||
      farmer.crops.some((crop) => crop.toLowerCase().includes(q));

    const matchesPlace = !place || farmer.place?.toLowerCase().includes(place);

    return matchesSearch && matchesPlace;
  });

  if (id) {
    const farmer = filtered[0];

    if (!farmer) {
      return NextResponse.json(failure("Farmer not found"), { status: 404 });
    }

    return NextResponse.json(
      success(
        {
          farmerId: farmer.id,
          farmer,
          source: "fallback",
        },
        "Sample farmer fetched",
      ),
      { status: 200 },
    );
  }

  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit).map((farmer) => ({
    id: farmer.id,
    profileId: "",
    name: farmer.name,
    farmName: farmer.farmName,
    farmArea: farmer.farmArea,
    category: farmer.crops[0] ?? "",
    avatar: farmer.avatar,
    about: farmer.about,
    place: farmer.place,
    village: farmer.place,
    district: farmer.place,
    state: "",
    phone: farmer.phone,
    delivery: false,
    rating: 0,
    reviewsCount: 0,
    last30daysSales: farmer.last30daysSales ?? 0,
  }));

  return NextResponse.json(
    success(
      {
        items,
        meta: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
        },
        source: "fallback",
      },
      "Sample farmers fetched because the database is unavailable",
    ),
    { status: 200 },
  );
}

// ---------- CREATE FARMER (POST) ----------
export async function POST(req: NextRequest) {
  try {
    await mongoDB();
    const body = await req.json();

    if (!body?.name) {
      return NextResponse.json(failure("Name is required"), { status: 400 });
    }

    // Backward compatibility:
    // allow frontend to send "place" but map it to village if village is missing
    const place = body.place as string | undefined;

    const doc = {
      // System / auth
      profileId: body.profileId,

      // Basic identity
      name: body.name,
      fatherName: body.fatherName,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,

      // Contact
      phone: body.phone,
      alternatePhone: body.alternatePhone,
      email: body.email,
      whatsappNumber: body.whatsappNumber,

      // Address
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      village: body.village || place || undefined,
      mandal: body.mandal,
      district: body.district,
      state: body.state,
      pincode: body.pincode,
      geoLocation: body.geoLocation, // { lat, lng }

      // Farm details
      farmName: body.farmName,
      farmArea: body.farmArea,
      totalLandArea: body.totalLandArea,
      ownedLandArea: body.ownedLandArea,
      leasedLandArea: body.leasedLandArea,
      irrigationType: body.irrigationType,
      soilType: body.soilType,
      waterSource: body.waterSource,
      organicCertified: body.organicCertified ?? false,
      organicCertificationDetails: body.organicCertificationDetails,
      farmingExperienceYears: body.farmingExperienceYears,

      // Categories / crops
      category: body.category,
      subCategories: Array.isArray(body.subCategories)
        ? body.subCategories
        : typeof body.subCategories === "string"
        ? body.subCategories.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
      seasonalCrops: Array.isArray(body.seasonalCrops)
        ? body.seasonalCrops
        : typeof body.seasonalCrops === "string"
        ? body.seasonalCrops.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
      perennialCrops: Array.isArray(body.perennialCrops)
        ? body.perennialCrops
        : typeof body.perennialCrops === "string"
        ? body.perennialCrops.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],

      // Identification docs
      aadhaarNumber: body.aadhaarNumber,
      aadhaarDocUrl: body.aadhaarDocUrl,
      panNumber: body.panNumber,
      panDocUrl: body.panDocUrl,
      bankPassbookUrl: body.bankPassbookUrl,

      // Bank details
      bankAccountHolderName: body.bankAccountHolderName,
      bankAccountNumber: body.bankAccountNumber,
      bankIFSC: body.bankIFSC,
      bankName: body.bankName,
      bankBranch: body.bankBranch,
      upiId: body.upiId,

      // Compliance
      fssaiLicense: body.fssaiLicense,
      fssaiDocUrl: body.fssaiDocUrl,
      gstNumber: body.gstNumber,
      gstDocUrl: body.gstDocUrl,

      // Logistics / delivery
      delivery: !!body.delivery,
      deliveryRadiusKm: body.deliveryRadiusKm,
      deliveryPinCodes: Array.isArray(body.deliveryPinCodes)
        ? body.deliveryPinCodes
        : typeof body.deliveryPinCodes === "string"
        ? body.deliveryPinCodes.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
      pickupLocation: body.pickupLocation, // { address, lat, lng }
      preferredCourierPartners: Array.isArray(body.preferredCourierPartners)
        ? body.preferredCourierPartners
        : typeof body.preferredCourierPartners === "string"
        ? body.preferredCourierPartners.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],

      // Media
      avatar: body.avatar,
      photoPath: body.photoPath,
      farmImages: Array.isArray(body.farmImages) ? body.farmImages : [],
      farmVideos: Array.isArray(body.farmVideos) ? body.farmVideos : [],

      // Story & social
      about: body.about,
      experienceDescription: body.experienceDescription,
      awards: Array.isArray(body.awards)
        ? body.awards
        : typeof body.awards === "string"
        ? body.awards.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
      socialMedia: body.socialMedia ?? {
        instagram: body.instagram,
        youtube: body.youtube,
        facebook: body.facebook,
        website: body.website,
      },

      // Ratings & performance (optional, defaults from schema)
      rating: body.rating,
      reviewsCount: body.reviewsCount,
      onTimeDeliveryRate: body.onTimeDeliveryRate,
      repeatCustomerRate: body.repeatCustomerRate,

      // Operational
      active: body.active ?? true,
      availableForOrders: body.availableForOrders ?? true,
      weeklyAvailability: body.weeklyAvailability,

      // Admin
      verified: body.verified ?? false,
      kycStatus: body.kycStatus,
      notes: body.notes,
    };

    const created = await FarmerModel.create(doc);

    return NextResponse.json(
      success(
        {
          id: created._id,
          ...created.toObject({ versionKey: false }),
        },
        "Farmer created",
      ),
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Create farmer error:", err);
    return NextResponse.json(
      failure("Failed to create farmer", err?.message || err),
      { status: 500 },
    );
  }
}

// ---------- LIST FARMERS (GET) ----------
// ---------- GET FARMER(S) (GET) ----------
export async function GET(req: NextRequest) {
  return proxyCatalogueGET(req, "/farmers");
  /* Legacy read implementation retained temporarily for write-route colocation;
     it is unreachable and should be deleted when farmer writes move to Go.
  try {
    await mongoDB();

    const url = new URL(req.url);

    // 🔹 NEW: support single farmer fetch
    const id = url.searchParams.get("id");
    const profileId = url.searchParams.get("profileId");

    if (id || profileId) {
      const query: any = {};
      if (id) query._id = id;
      if (profileId) query.profileId = profileId;

      const farmer = await FarmerModel.findOne(query).lean();

      if (!farmer) {
        return NextResponse.json(
          failure("Farmer not found"),
          { status: 404 },
        );
      }

      return NextResponse.json(
        success(
          {
            farmerId: String((farmer as any)._id),
            farmer,
          },
          "Farmer fetched",
        ),
        { status: 200 },
      );
    }

    // 🔹 If no id/profileId → fall back to LIST (your old logic)
    const pageParam = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limitParam = parseInt(
      url.searchParams.get("limit") ?? String(DEFAULT_LIMIT),
      10,
    );

    const q = (url.searchParams.get("q") ?? "").trim();
    const place = (url.searchParams.get("place") ?? "").trim(); // backward compat
    const district = (url.searchParams.get("district") ?? "").trim();
    const state = (url.searchParams.get("state") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "createdAt_desc").trim();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, MAX_LIMIT)
        : DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Text search
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { farmName: { $regex: q, $options: "i" } },
        { about: { $regex: q, $options: "i" } },
        { village: { $regex: q, $options: "i" } },
        { district: { $regex: q, $options: "i" } },
      ];
    }

    // "place" param → match village or district (for old frontend)
    if (place) {
      filter.$or = [
        ...(filter.$or ?? []),
        { village: { $regex: `^${place}`, $options: "i" } },
        { district: { $regex: `^${place}`, $options: "i" } },
      ];
    }

    if (district) {
      filter.district = { $regex: `^${district}`, $options: "i" };
    }

    if (state) {
      filter.state = { $regex: `^${state}`, $options: "i" };
    }

    // Sorting
    const [sortField, sortDir] = sort.split("_");
    const sortMap: any = {};
    const dir = sortDir === "asc" ? 1 : -1;

    switch (sortField) {
      case "name":
        sortMap.name = dir;
        break;
      case "rating":
        sortMap.rating = dir;
        break;
      default:
        // createdAt_desc by default
        sortMap.createdAt = dir;
        break;
    }

    const total = await FarmerModel.countDocuments(filter);

    const farmers = await FarmerModel.find(filter)
      .sort(sortMap)
      .skip(skip)
      .limit(limit)
      .select(
        // Keep response light but useful
        "profileId name farmName farmArea totalLandArea category subCategories seasonalCrops perennialCrops " +
          "avatar photoPath farmImages about village mandal district state pincode phone whatsappNumber email " +
          "delivery deliveryRadiusKm deliveryPinCodes pickupLocation organicCertified rating reviewsCount " +
          "last30daysSales verified kycStatus active availableForOrders",
      )
      .lean()
      .exec();

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      success(
        {
          items: farmers.map((f: any) => ({
            id: String(f._id ?? f.id),
            _id: String(f._id ?? f.id),
            profileId: f.profileId,
            name: f.name,
            farmName: f.farmName,
            farmArea: f.farmArea,
            totalLandArea: f.totalLandArea,
            category: f.category || "",
            subCategories: f.subCategories ?? [],
            seasonalCrops: f.seasonalCrops ?? [],
            perennialCrops: f.perennialCrops ?? [],
            avatar: f.avatar,
            photoPath: f.photoPath,
            farmImages: f.farmImages ?? [],
            about: f.about,
            place:
              [f.village, f.district, f.state].filter(Boolean).join(", ") ||
              undefined,
            village: f.village,
            mandal: f.mandal,
            district: f.district,
            state: f.state,
            pincode: f.pincode,
            phone: f.phone,
            whatsappNumber: f.whatsappNumber,
            email: f.email,
            delivery: !!f.delivery,
            deliveryRadiusKm: f.deliveryRadiusKm,
            deliveryPinCodes: f.deliveryPinCodes ?? [],
            pickupLocation: f.pickupLocation,
            organicCertified: !!f.organicCertified,
            rating: f.rating ?? 0,
            reviewsCount: f.reviewsCount ?? 0,
            last30daysSales: f.last30daysSales ?? 0,
            verified: !!f.verified,
            kycStatus: f.kycStatus,
            active: f.active,
            availableForOrders: f.availableForOrders,
          })),
          meta: {
            total,
            page,
            limit,
            totalPages,
          },
        },
        "Farmers fetched",
      ),
    );
  } catch (err: any) {
    console.warn(
      "Legacy farmer database read failed:",
      err?.message || err,
    );
    return fallbackFarmersResponse(req);
  }
  */
}



// ---------- UPDATE FARMER (PATCH) ----------
export async function PATCH(req: NextRequest) {
  try {
    await mongoDB();

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const profileId = url.searchParams.get("profileId");

    if (!id && !profileId) {
      return NextResponse.json(
        failure("Either id or profileId is required"),
        { status: 400 },
      );
    }

    const body = await req.json();
    const update: any = {};

    // Keep it simple: allow updating these main fields
    const simpleFields = [
      "name",
      "fatherName",
      "gender",
      "dateOfBirth",
      "phone",
      "alternatePhone",
      "email",
      "whatsappNumber",
      "addressLine1",
      "addressLine2",
      "village",
      "mandal",
      "district",
      "state",
      "pincode",
      "farmName",
      "farmArea",
      "category",
      "about",
      "experienceDescription",
      "avatar",
      "photoPath",
    ];

    for (const key of simpleFields) {
      if (body[key] !== undefined) {
        update[key] = body[key];
      }
    }

    // Arrays
    if (body.subCategories !== undefined) {
      update.subCategories = Array.isArray(body.subCategories)
        ? body.subCategories
        : typeof body.subCategories === "string"
        ? body.subCategories.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
    }

    if (body.seasonalCrops !== undefined) {
      update.seasonalCrops = Array.isArray(body.seasonalCrops)
        ? body.seasonalCrops
        : typeof body.seasonalCrops === "string"
        ? body.seasonalCrops.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
    }

    if (body.perennialCrops !== undefined) {
      update.perennialCrops = Array.isArray(body.perennialCrops)
        ? body.perennialCrops
        : typeof body.perennialCrops === "string"
        ? body.perennialCrops.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
    }

    const query: any = {};
    if (id) query._id = id;
    if (profileId) query.profileId = profileId;

    const farmer = await FarmerModel.findOneAndUpdate(query, update, {
      new: true,
    }).lean();

    if (!farmer) {
      return NextResponse.json(
        failure("Farmer not found"),
        { status: 404 },
      );
    }

    return NextResponse.json(
      success(
        {
          farmerId: String((farmer as any)._id),
          farmer,
        },
        "Farmer updated",
      ),
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Update farmer error:", err);
    return NextResponse.json(
      failure("Failed to update farmer", err?.message || err),
      { status: 500 },
    );
  }
}
