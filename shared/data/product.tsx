// This is dummy data for products in the store
import { Product } from "../interfaces/general";


export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Organic Honey",
    price: 24.99,
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784366?w=1200&q=80&auto=format&fit=crop",
    category: "Pantry",
    badge: "Bestseller",
    description: "Raw, cold-extracted honey from small organic apiaries.",
  },
  {
    id: 2,
    name: "Essential Oil Set",
    price: 45.99,
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1200&q=80&auto=format&fit=crop",
    category: "Wellness",
    description: "Pure essential oils for aromatherapy and relaxation.",
  },
  {
    id: 3,
    name: "Herbal Tea Collection",
    price: 18.99,
    image:
      "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=1200&q=80&auto=format&fit=crop",
    category: "Beverages",
    description: "Blend of tulsi, chamomile and lemon grass — caffeine free.",
  },
  {
    id: 4,
    name: "Natural Soap Bar",
    price: 12.99,
    image:
      "https://images.unsplash.com/photo-1600857544200-2362193f6390?w=1200&q=80&auto=format&fit=crop",
    category: "Body Care",
    description: "Gentle glycerin soap scented with lavender essential oil.",
  },
];