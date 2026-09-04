// shared/interfaces/mongodb/products/product.tsx

/*
Real e-commerce product model

Existing fields:
  - id, name, image/images, price, unit
  - rating, reviewsCount
  - sourceFrom, purchasedLast30Days
  - farmer, farmerId
  - swadeshiPercent, healthBenefits, timeToSupply
  - tags, shelfLife, description, category, badge

New important fields:
  - slug, sku              → identity & SEO
  - mrp, currency          → pricing clarity
  - stockQty, inStock      → inventory
  - minOrderQty, maxOrderQty, stepQty → cart rules
  - status, isFeatured     → visibility / merchandising
  - hsnCode, gstRate, gstIncludedInPrice → GST meta
  - weightGrams, dimensionsCm, perishable, fragile, codAvailable → logistics
  - isOrganic, certifications, originCountry → trust / labels
  - seoTitle, seoDescription, searchKeywords → SEO
  - attributes             → flexible custom fields
  - createdAt, updatedAt   → timestamps
*/

export type ProductStatus =
  | "draft"
  | "active"
  | "inactive"
  | "out_of_stock"
  | "archived";

export type ProductType = "physical" | "digital" | "service";

export type ProductDimensions = {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
};

export type Product = {
  // Identity / basic
  id?: string | number;
  name: string;
  slug?: string;          // URL slug, e.g. "organic-turmeric-1kg"
  sku?: string;           // internal product code / barcode

  // Media
  image?: string;
  images?: string[];
  videoUrl?: string;      // optional product / explainer video

  // Pricing
  price: number;          // current selling price (may be discounted)
  mrp?: number;           // original MRP/list price for showing discount
  currency?: string;      // e.g. "INR"

  unit?: string;          // "kg", "litre", "packet"
  unitQuantity?: number;  // e.g. 1, 0.5 (1kg, 0.5kg etc.)

  // Quantity / purchase rules
  minOrderQty?: number;   // default 1
  maxOrderQty?: number;   // per order / per customer
  stepQty?: number;       // buy in steps (e.g. 0.5kg, 2kg multiples)

  // Inventory
  stockQty?: number;           // physical units the farmer has in hand
  reservedQty?: number;        // locked by active (non-terminal) orders — auto-managed
  availableQty?: number;       // stockQty − reservedQty — auto-maintained, what buyers can order
  lowStockThreshold?: number;  // flag as "low stock" when availableQty ≤ this value
  inStock?: boolean;           // quick flag for listings (auto-updated when availableQty hits 0)
  allowBackorder?: boolean;    // if true, skip the availableQty ≥ qty guard on order creation

  // Produce freshness (critical for perishables)
  harvestDate?: Date | string; // when this batch was harvested
  expiryDate?: Date | string;  // when this batch expires
  batchId?: string;            // farm batch identifier for traceability

  // Ratings / social proof
  rating?: number;        // 0–5
  reviewsCount?: number;

  // Farmer / source
  sourceFrom?: string;    // location / village / region
  purchasedLast30Days?: number;
  farmer?: string;        // farmer display name
  farmerId?: string | number;

  // Category & merchandising
  category?: string;
  categoryId?: string;
  subCategory?: string;
  tags?: string[];
  badge?: string;         // "Bestseller", "New", etc.
  label?: string;         // "Limited", "Festive Offer", etc.
  status?: ProductStatus; // draft/active/out_of_stock/etc.
  isFeatured?: boolean;   // show on homepage / highlight
  sortPriority?: number;  // manual ordering in lists

  // Health / story / quality
  swadeshiPercent?: number;
  healthBenefits?: string[];
  timeToSupply?: string;       // "2–4 days"
  shelfLife?: string;          // "12 months"
  storageInstructions?: string;// "Keep refrigerated"
  ingredients?: string[];      // for processed items
  originCountry?: string;      // default India
  isOrganic?: boolean;
  certifications?: string[];   // ["NPOP", "PGS India", etc.]

  // Description / content
  description?: string;        // long description
  shortDescription?: string;   // card summary

  // Tax (GST meta only – not amounts)
  hsnCode?: string;            // e.g. "1006"
  gstRate?: number;            // e.g. 0, 5, 12
  gstIncludedInPrice?: boolean;// true → price is GST inclusive

  // Logistics / shipping
  productType?: ProductType;   // physical / digital / service
  weightGrams?: number;        // net weight used for shipping calc
  dimensionsCm?: ProductDimensions;
  fragile?: boolean;
  perishable?: boolean;
  codAvailable?: boolean;      // Cash on Delivery allowed?

  // SEO / search
  seoTitle?: string;
  seoDescription?: string;
  searchKeywords?: string[];

  // Flexible custom attributes (for future)
  attributes?: Record<string, string | number | boolean>;

  // Timestamps (Mongo will fill these if you enable timestamps in schema)
  createdAt?: Date;
  updatedAt?: Date;
  revision?: number;
};
