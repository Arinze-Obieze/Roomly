export const listings = [
  {
    id: 1,
    title: "Modern Studio in Ranelagh",
    price: "€1,200",
    period: "mo",
    location: "Ranelagh, Dublin 6",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    matchScore: 98,
    verified: true,
    amenities: [
      { icon: "FaWifi", label: "High Speed" },
      { icon: "FaPaw", label: "Pet Friendly" }
    ],
    host: { name: "Sarah", avatar: "https://i.pravatar.cc/150?u=sarah" }
  },
  {
    id: 2,
    title: "Ensuite in Shared House",
    price: "€850",
    period: "mo",
    location: "Drumcondra, Dublin 9",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    matchScore: 84,
    verified: true,
    amenities: [
      { icon: "FaShower", label: "Ensuite" },
      { icon: "FaTree", label: "Garden" }
    ],
    host: { name: "James", avatar: "https://i.pravatar.cc/150?u=james" }
  },
  {
    id: 3,
    title: "Sunny Room near UCD",
    price: "€950",
    period: "mo",
    location: "Belfield, Dublin 4",
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    matchScore: 72,
    verified: false,
    amenities: [
      { icon: "FaWifi", label: "Wifi" },
      { icon: "MdOutlineBed", label: "Double" }
    ],
    host: { name: "Elena", avatar: "https://i.pravatar.cc/150?u=elena" }
  }
];