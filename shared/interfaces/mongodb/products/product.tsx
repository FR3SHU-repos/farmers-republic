// shared/interfaces/mongodb/products/product.tsx

/*
This is for product descriptions
    id: Unique identifier for the product (number or string)
    name: Name of the product
    image: URL of the product image
    price: Price of the product
    unit: Unit of measurement (e.g., "kg", "litre")
    rating: Average rating of the product (0-5)
    reviewsCount: Number of reviews for the farmer
    sourceFrom: Origin of the farmer's products
    purchasedLast30Days: Number of purchases in the last 30 days
    farmer: Farmer;
    farmerId: Unique identifier for the farmer;
    swadeshiPercent: Percentage of products that are Swadeshi (0-100)
    healthBenefits: List of health benefits associated with the farmer's products
    timeToSupply: Estimated time to supply the products (e.g., "2-4 days")
    tags: List of tags associated with the farmer's products (e.g., health products, categories)
    shelfLife: Shelf life of the products (e.g., "12 months")
    description: Optional detailed description of the farmer and their practices
*/

export type Product = {
id?: string | number;
name: string;
image?: string;
images?: string[];
price: number;
unit?: string;
rating?: number;
reviewsCount?: number;
sourceFrom?: string;
purchasedLast30Days?: number;
farmer?: string;
farmerId?: string | number;
swadeshiPercent?: number;
healthBenefits?: string[];
timeToSupply?: string;
tags?: string[];
shelfLife?: string;
description?: string;
category?: string;
badge?: string;
};