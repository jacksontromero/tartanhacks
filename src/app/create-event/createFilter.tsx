import { CUISINE_MAPPINGS, PriceLevel, PRICE_MAPPINGS } from "~/constants/cuisines";
import { PlaceDetails, HostDetails } from "~/constants/types"

interface AggregatedPreferences {
    preferredCuisines: Record<string, number>
    antiPreferredCuisines: Record<string, number>
    dietaryRestrictions: Set<string>
    acceptablePriceRanges: Set<PriceLevel>
  }
  
  function aggregatePreferences(eventResponses: any[]): AggregatedPreferences {
    const preferences: AggregatedPreferences = {
      preferredCuisines: {},
      antiPreferredCuisines: {},
      dietaryRestrictions: new Set(),
      acceptablePriceRanges: new Set()
    };
  
    eventResponses.forEach(response => {
      response.preferredCuisines.forEach((cuisine: string) => {
        let cuisineMap = CUISINE_MAPPINGS[cuisine] || '';
        preferences.preferredCuisines[cuisineMap] = (preferences.preferredCuisines[cuisineMap] || 0) + 1;
      });
      response.antiPreferredCuisines.forEach((cuisine: string) => {
        let cuisineMap = CUISINE_MAPPINGS[cuisine] || '';
        preferences.antiPreferredCuisines[cuisineMap] = (preferences.antiPreferredCuisines[cuisineMap] || 0) + 1;
      });
      response.dietaryRestrictions.forEach((restriction: string) => {
        preferences.dietaryRestrictions.add(restriction);
      });
      response.acceptablePriceRanges.forEach((price: string) => {
        let priceMap = PRICE_MAPPINGS[price] || PriceLevel.PRICE_LEVEL_UNSPECIFIED;
        preferences.acceptablePriceRanges.add(priceMap);
      });
    });
  
    return preferences;
  }
  
  function scoreRestaurant(restaurant: PlaceDetails, preferences: AggregatedPreferences): number {
    let score = 0;
  
    // Match cuisine preferences
    restaurant.cuisines.forEach(cuisine => {
      if (preferences.preferredCuisines[cuisine]) {
        score += preferences.preferredCuisines[cuisine];
      }
      if (preferences.antiPreferredCuisines[cuisine]) {
        score -= preferences.antiPreferredCuisines[cuisine] * 2; // Penalize anti-preferences
      }
    });

    // Check price range
    if (preferences.acceptablePriceRanges.has(restaurant.price_level)) {
      score += 5;
    }
    // Check price range
    const lowestAcceptablePrice = Math.min(...Array.from(preferences.acceptablePriceRanges));
    if (restaurant.price_level != 0 && restaurant.price_level <= lowestAcceptablePrice) {
        score += 10;
    } else if (!preferences.acceptablePriceRanges.has(restaurant.price_level)) {
        score -= 5;
    }
  
    // TODO: find other dietary indicators through LLM and incorporate
    if (preferences.dietaryRestrictions.has('Vegetarian') && !restaurant.features.serves_vegetarian) {
      score -= 10;
    }
  
    score += restaurant.rating 
    // TODO: incorporate total number of ratings

    return score;
  }
  
 // TOOD: add eventResponses interface
  function filterAndRankRestaurants(restaurants: PlaceDetails[], eventResponses: any[]): HostDetails[] {
    const preferences = aggregatePreferences(eventResponses);
    return restaurants
      .map(restaurant => ({ restaurant, score: scoreRestaurant(restaurant, preferences) }))
      .filter(entry => entry.score > 0) // Ensure relevance
      .sort((a, b) => b.score - a.score) // Rank by highest score
      .map(entry => ({ restaraunt: entry.restaurant, score: entry.score }) );
  }
  