export const CUISINE_MAPPINGS: { [key: string]: string } = {
  "afghani_restaurant": "Afghani",
  "african_restaurant": "African",
  "american_restaurant": "American",
  "asian_restaurant": "Asian",
  "barbecue_restaurant": "Barbecue",
  "brazilian_restaurant": "Brazilian",
  "breakfast_restaurant": "Breakfast",
  "brunch_restaurant": "Brunch",
  "buffet_restaurant": "Buffet",
  "chinese_restaurant": "Chinese",
  "dessert_restaurant": "Dessert",
  "fast_food_restaurant": "Fast Food",
  "fine_dining_restaurant": "Fine Dining",
  "french_restaurant": "French",
  "greek_restaurant": "Greek",
  "hamburger_restaurant": "Hamburger",
  "indian_restaurant": "Indian",
  "indonesian_restaurant": "Indonesian",
  "italian_restaurant": "Italian",
  "japanese_restaurant": "Japanese",
  "korean_restaurant": "Korean",
  "lebanese_restaurant": "Lebanese",
  "mediterranean_restaurant": "Mediterranean",
  "mexican_restaurant": "Mexican",
  "middle_eastern_restaurant": "Middle Eastern",
  "pizza_restaurant": "Pizza",
  "ramen_restaurant": "Ramen",
  "seafood_restaurant": "Seafood",
  "spanish_restaurant": "Spanish",
  "sushi_restaurant": "Sushi",
  "thai_restaurant": "Thai",
  "turkish_restaurant": "Turkish",
  "vegan_restaurant": "Vegan",
  "vegetarian_restaurant": "Vegetarian",
  "vietnamese_restaurant": "Vietnamese",
  "cafe": "Cafe",
  "cafeteria": "Cafeteria",
  "coffee_shop": "Coffee Shop",
  "tea_house": "Tea House"
};

export const INVERSE_CUISINE_MAPPINGS: { [key: string]: string } = Object.fromEntries(
  Object.entries(CUISINE_MAPPINGS).map(([key, value]) => [value, key])
);

export const CUISINE_TYPES: string[] = Object.keys(INVERSE_CUISINE_MAPPINGS);

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
