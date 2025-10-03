export const FPOS = [
  {
    id: "1",
    name: "Green Valley FPO",
    shortDesc:
      "A farmer-producer organisation focusing on organic cereals and spices. Collective of smallholder farms in Visakhapatnam region.",
    place: "Visakhapatnam, Andhra Pradesh",
    googleMaps: "https://www.google.com/maps/search/?api=1&query=Visakhapatnam",
    noOfFarmers: 120,
    totalLandArea: 560, // acres
    landBreakdown: {
      arable: 360,
      orchard: 120,
      leased: 80,
    },
    crops: ["Rice", "Millets", "Turmeric", "Sesame"],
    products: [
      { id: "p-rice", name: "Organic Rice (5kg)", sold30: 420, soldTotal: 12400 },
      { id: "p-millet", name: "Millet Flour (1kg)", sold30: 210, soldTotal: 5400 },
      { id: "p-turmeric", name: "Turmeric Powder (500g)", sold30: 120, soldTotal: 3100 },
    ],
    swadeshiPercentage: 92,
    avgYieldPerAcre: "1.2 ton",
    organicPercent: 88,
    phone: "+91 98765 43210",
    email: "info@greenvalleyfpo.org",
    fssai: "10234567891234",
    established: "2010",
    certifications: ["India Organic", "FSSAI Registered", "Fair Trade (pending)"],
    documents: [
      { name: "Annual Report 2024 (PDF)", url: "#" },
      { name: "Certification - India Organic", url: "#" },
    ],
    banner:
      "https://images.unsplash.com/photo-1599076480547-47dc5e42a0ab?w=1200&q=80&auto=format&fit=crop",
    farmers: [
      { id: "f1", name: "Ramu Reddy", place: "Kurnool", phone: "+91-98123-45678" },
      { id: "f2", name: "Sunita Devi", place: "Mysore", phone: "+91-98876-54321" },
      { id: "f3", name: "Karan Patel", place: "Visakhapatnam", phone: "" },
    ],
  },
  // add more FPOs as needed...
];