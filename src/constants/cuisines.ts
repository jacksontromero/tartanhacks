export const CUISINE_MAPPINGS: { [key: string]: string } = {
  "Afghani": "afghani_restaurant",
  "African": "african_restaurant",
  "American": "american_restaurant",
  "Asian": "asian_restaurant",
  "Barbecue": "barbecue_restaurant",
  "Brazilian": "brazilian_restaurant",
  "Breakfast": "breakfast_restaurant",
  "Brunch": "brunch_restaurant",
  "Buffet": "buffet_restaurant",
  "Chinese": "chinese_restaurant",
  "Dessert": "dessert_restaurant",
  "Fast Food": "fast_food_restaurant",
  "Fine Dining": "fine_dining_restaurant",
  "French": "french_restaurant",
  "Greek": "greek_restaurant",
  "Hamburger": "hamburger_restaurant",
  "Indian": "indian_restaurant",
  "Indonesian": "indonesian_restaurant",
  "Italian": "italian_restaurant",
  "Japanese": "japanese_restaurant",
  "Korean": "korean_restaurant",
  "Lebanese": "lebanese_restaurant",
  "Mediterranean": "mediterranean_restaurant",
  "Mexican": "mexican_restaurant",
  "Middle Eastern": "middle_eastern_restaurant",
  "Pizza": "pizza_restaurant",
  "Ramen": "ramen_restaurant",
  "Seafood": "seafood_restaurant",
  "Spanish": "spanish_restaurant",
  "Sushi": "sushi_restaurant",
  "Thai": "thai_restaurant",
  "Turkish": "turkish_restaurant",
  "Vegan": "vegan_restaurant",
  "Vegetarian": "vegetarian_restaurant",
  "Vietnamese": "vietnamese_restaurant",
  "Cafe": "cafe",
  "Cafeteria": "cafeteria",
  "Coffee Shop": "coffee_shop",
  "Tea House": "tea_house"
};

export const CUISINE_TYPES: string[] = Object.keys(CUISINE_MAPPINGS);

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

export enum PriceLevel {
  PRICE_LEVEL_UNSPECIFIED = 0,
  PRICE_LEVEL_INEXPENSIVE = 1,
  PRICE_LEVEL_MODERATE = 2,
  PRICE_LEVEL_EXPENSIVE = 3,
  PRICE_LEVEL_VERY_EXPENSIVE = 4
};

export const PRICE_MAPPINGS: { [key: string]: PriceLevel } = {
    "?": PriceLevel.PRICE_LEVEL_UNSPECIFIED,
    "$": PriceLevel.PRICE_LEVEL_INEXPENSIVE,
    "$$": PriceLevel.PRICE_LEVEL_MODERATE,
    "$$$": PriceLevel.PRICE_LEVEL_EXPENSIVE,
    "$$$$": PriceLevel.PRICE_LEVEL_VERY_EXPENSIVE,
};

export const INVERSE_PRICE_MAPPINGS: { [key: string]: string } = Object.fromEntries(
  Object.entries(PRICE_MAPPINGS).map(([key, value]) => [value, key])
);

type SelectedCuisinesType = Record<string, boolean>
