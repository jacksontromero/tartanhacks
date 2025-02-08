import { PriceLevel, Area } from '~/constants/types';

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
  { name: 'Downtown Pittsburgh', lat: 40.4406, lng: -79.9959 },
  { name: 'Oakland', lat: 40.4421, lng: -79.9620 },
  // Add more locations as needed
] as const;

export const LOCATION_COORDINATES: { [key: string]: Area} = {
  "Downtown": { name: "Downtown", lat: 40.4406, lng: -80.0000 },
  "Strip District": { name: "Strip District", lat: 40.4500, lng: -79.9777 },
  "Oakland": { name: "Oakland", lat: 40.4421, lng: -79.9559 },
  "Shadyside": { name: "Shadyside", lat: 40.4543, lng: -79.9333 },
  "Squirrel Hill": { name: "Squirrel Hill", lat: 40.4382, lng: -79.9236 },
  "East Liberty": { name: "East Liberty", lat: 40.4621, lng: -79.9242 },
  "Lawrenceville": { name: "Lawrenceville", lat: 40.4650, lng: -79.9605 },
  "South Side": { name: "South Side", lat: 40.4282, lng: -79.9729 },
  "North Shore": { name: "North Shore", lat: 40.4465, lng: -80.0103 },
  "Bloomfield": { name: "Bloomfield", lat: 40.4621, lng: -79.9478 }
};

export const PRICE_RANGES = [
  { value: "$", label: "$ (Under $15)" },
  { value: "$$", label: "$$ ($15-$30)" },
  { value: "$$$", label: "$$$ ($31-$60)" },
  { value: "$$$$", label: "$$$$ (Over $60)" }
] as const;

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
