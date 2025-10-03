// This contains general interfaces used across the application

/*
This is for products
    id: Unique identifier for the product
    name: Name of the product
    price: Price of the product
    image: URL of the product image
    category: Category to which the product belongs
    badge: Optional badge for special labels like "New" or "Sale"
    description: Optional detailed description of the product
*/
export type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  badge?: string;
  description?: string;
};

/*
This is for categories
    name: Name of the category
    emoji: Optional emoji representing the category
*/  

export type Category = { 
    name: string;
    emoji?: string
};

/*
This is for farmers
    name: Name of the farmer
    location: Location of the farmer
    phone: Optional phone number of the farmer
    avatar: Optional URL of the farmer's avatar image
    farmName: Optional name of the farm
    about: Optional brief description about the farmer
*/


export type Farmer = {
  name: string;
  location: string;
  phone?: string;
  avatar?: string;
  farmName?: string;
  about?: string;
};

/*
This is for product descriptions
    id: Unique identifier for the product (number or string)
    name: Name of the product
    image: URL of the product image
    price: Price of the product
    rating: Average rating of the product (0-5)
    reviewsCount: Number of reviews for the farmer
    sourceFrom: Origin of the farmer's products
    purchasedLast30Days: Number of purchases in the last 30 days
    farmer: Farmer;
    swadeshiPercent: Percentage of products that are Swadeshi (0-100)
    healthBenefits: List of health benefits associated with the farmer's products
    timeToSupply: Estimated time to supply the products (e.g., "2-4 days")
    tags: List of tags associated with the farmer's products (e.g., health products, categories)
    fssai: FSSAI license number
    shelfLife: Shelf life of the products (e.g., "12 months")
    description: Optional detailed description of the farmer and their practices
*/

export type ProductDetail = {
  id: number | string;
  name: string;
  image: string;
  price: number;
  rating: number; // 0-5
  reviewsCount?: number;
  sourceFrom: string;
  purchasedLast30Days: number;
  farmer: Farmer;
  swadeshiPercent?: number; // 0-100
  healthBenefits?: string[]; 
  timeToSupply?: string; // e.g. "2-4 days"
  tags?: string[]; // health products, categories
  fssai?: string;
  shelfLife?: string; // e.g. "12 months"
  description?: string;
};