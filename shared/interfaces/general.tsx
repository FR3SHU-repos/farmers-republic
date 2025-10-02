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