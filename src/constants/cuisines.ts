export const CUISINE_TYPES = [
  "American",
  "Chinese",
  "Italian",
  "Japanese",
  "Mexican",
  "Thai",
  "Indian",
  "Mediterranean",
  "French",
  "Korean",
  "Vietnamese",
  "Greek",
  "Spanish",
  "Middle Eastern",
  "Brazilian",
  "Caribbean",
  "Ethiopian",
  "German",
  "Turkish",
  "Vegetarian/Vegan"
] as const;

export const LOCATIONS = [
  "Downtown",
  "Strip District",
  "Oakland",
  "Shadyside",
  "Squirrel Hill",
  "East Liberty",
  "Lawrenceville",
  "South Side",
  "North Shore",
  "Bloomfield"
] as const;

export const PRICE_RANGES = [
  { value: "$", label: "$ (Under $15)" },
  { value: "$$", label: "$$ ($15-$30)" },
  { value: "$$$", label: "$$$ ($31-$60)" },
  { value: "$$$$", label: "$$$$ (Over $60)" }
] as const;
