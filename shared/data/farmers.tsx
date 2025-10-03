// shared/data/farmers.ts
export type Farmer = {
  id: string;
  name: string;
  farmName?: string;
  farmArea?: string; // e.g. "2 acres"
  crops: string[]; // crops grown
  products: { id?: string | number; name: string }[]; // products produced (can link to product ids)
  fpo?: string | null; // name of FPO if any
  swadeshiPercent?: number; // 0-100
  place?: string; // city / district / state
  phone?: string;
  avatar?: string;
  about?: string;
  established?: string; // year or "since 2010"
  certifications?: string[]; // e.g. "Organic - India"
  last30daysSales?: number;
};

export const FARMERS: Farmer[] = [
  {
    id: "f1",
    name: "Ramu Reddy",
    farmName: "Reddy Organic Farms",
    farmArea: "3.5 acres",
    crops: ["Sesame", "Chili", "Millets"],
    products: [{ id: "p1", name: "Cold-Pressed Sesame Oil (500ml)" }],
    fpo: "Kurnool Organic FPO",
    swadeshiPercent: 92,
    place: "Kurnool, Andhra Pradesh",
    phone: "+91-98123-45678",
    avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=800&q=80&auto=format&fit=crop",
    about:
      "Small family-run farm practicing crop rotation and traditional methods. Focus on soil health and zero chemical pesticides.",
    established: "1998",
    certifications: ["Organic Certified"],
    last30daysSales: 84,
  },
  {
    id: "f2",
    name: "Sunita Devi",
    farmName: "Sunita's Homestead",
    farmArea: "1.2 acres",
    crops: ["Turmeric", "Ginger", "Herbs"],
    products: [{ id: "p2", name: "Organic Turmeric Powder" }],
    fpo: null,
    swadeshiPercent: 100,
    place: "Mysore, Karnataka",
    phone: "+91-98876-54321",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80&auto=format&fit=crop",
    about:
      "Focused on natural soil amendments and community seed exchange. Runs small workshops for sustainable farming.",
    established: "2012",
    certifications: ["FSSAI Registered"],
    last30daysSales: 42,
  },
  // add more farmers as needed...
];
