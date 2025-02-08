import { CUISINE_MAPPINGS, PRICE_MAPPINGS } from "~/constants/cuisines";
import { PlaceDetails, PriceLevel } from "~/constants/types";

interface AggregatedPreferences {
  preferredCuisines: Record<string, number>;
  antiPreferredCuisines: Record<string, number>;
  dietaryRestrictions: Set<string>;
  acceptablePriceRanges: Set<PriceLevel>;
  rankedCuisines: string[];
}

export function aggregatePreferences(eventResponses: any[]): AggregatedPreferences {
  const preferences: AggregatedPreferences = {
    preferredCuisines: {},
    antiPreferredCuisines: {},
    dietaryRestrictions: new Set(),
    acceptablePriceRanges: new Set(),
    rankedCuisines: [],
  };

  const cuisineRankingScores: Record<string, number[]> = {};
  eventResponses.forEach(response => {
    const preferredCuisines = JSON.parse(response.preferredCuisines);
    const antiPreferredCuisines = JSON.parse(response.antiPreferredCuisines);
    const dietaryRestrictions = JSON.parse(response.dietaryRestrictions);
    const acceptablePriceRanges = JSON.parse(response.acceptablePriceRanges);
    const rankedCuisines = JSON.parse(response.rankedCuisines);

    preferredCuisines.forEach((cuisine: string) => {
      let cuisineMap = CUISINE_MAPPINGS[cuisine] || '';
      preferences.preferredCuisines[cuisineMap] = (preferences.preferredCuisines[cuisineMap] || 0) + 1;
    });

    antiPreferredCuisines.forEach((cuisine: string) => {
      let cuisineMap = CUISINE_MAPPINGS[cuisine] || '';
      preferences.antiPreferredCuisines[cuisineMap] = (preferences.antiPreferredCuisines[cuisineMap] || 0) + 1;
    });

    dietaryRestrictions.forEach((restriction: string) => {
      preferences.dietaryRestrictions.add(restriction);
    });

    acceptablePriceRanges.forEach((price: string) => {
      let priceMap = PRICE_MAPPINGS[price] || PriceLevel.PRICE_LEVEL_UNSPECIFIED;
      preferences.acceptablePriceRanges.add(priceMap);
    });

    rankedCuisines.forEach((cuisine: string, index: number) => {
      if (!cuisineRankingScores[cuisine]) {
        cuisineRankingScores[cuisine] = [];
      }
      cuisineRankingScores[cuisine].push(index);
    });
  });

  preferences.rankedCuisines = Object.entries(cuisineRankingScores)
    .map(([cuisine, rankings]) => ({
      cuisine,
      avgRank: rankings.reduce((sum, rank) => sum + rank, 0) / rankings.length
    }))
    .sort((a, b) => a.avgRank - b.avgRank)
    .map(entry => entry.cuisine);

  return preferences;
}

export function scoreRestaurant(restaurant: PlaceDetails, preferences: AggregatedPreferences): number {
  let score = 0;

  // Ensure restaurant has required properties
  if (!restaurant) return 0;

  // Handle cuisines/types
  const cuisines = restaurant.cuisines || restaurant.types || [];
  cuisines.forEach(cuisine => {
    if (preferences.preferredCuisines[cuisine]) {
      score += preferences.preferredCuisines[cuisine];
    }
    if (preferences.antiPreferredCuisines[cuisine]) {
      score -= preferences.antiPreferredCuisines[cuisine] * 2;
    }
    const rankIndex = preferences.rankedCuisines.indexOf(cuisine);
    if (rankIndex !== -1) {
      score += (preferences.rankedCuisines.length - rankIndex) * 2;
    }
  });

  // Handle price level
  const priceLevel = restaurant.price_level ?? PriceLevel.PRICE_LEVEL_UNSPECIFIED;
  if (preferences.acceptablePriceRanges.has(priceLevel)) {
    score += 5;
  }

  const lowestAcceptablePrice = Math.min(...Array.from(preferences.acceptablePriceRanges));
  if (priceLevel !== PriceLevel.PRICE_LEVEL_UNSPECIFIED && priceLevel <= lowestAcceptablePrice) {
    score += 10;
  } else if (!preferences.acceptablePriceRanges.has(priceLevel)) {
    score -= 5;
  }

  // Handle dietary restrictions
  const features = restaurant.features || {};
  if (preferences.dietaryRestrictions.has('Vegetarian') && !features.serves_vegetarian) {
    score -= 10;
  }

  // Handle rating
  if (typeof restaurant.rating === 'number') {
    score += restaurant.rating;
  }

  return score || 0; // Ensure we return 0 instead of null/undefined
} 