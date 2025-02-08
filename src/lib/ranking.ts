import { CUISINE_MAPPINGS, PRICE_MAPPINGS } from "~/constants/cuisines";
import { PlaceDetails, PriceLevel } from "~/constants/types";
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { eventResponses, apiLogs, rankedPlaces } from "~/server/db/schema";
import { classifyCuisine } from "~/lib/ai";

export async function getRankingsForEvent(event_id: string) {
  // Get event responses
  const responses = await db.query.eventResponses.findMany({
    where: eq(eventResponses.eventId, event_id),
  });

  if (responses.length === 0) {
    return {
      rankings: [],
      totalParticipants: 0,
      averageScore: 0,
    };
  }

  // Get latest API log with places data
  const latestApiLog = await db.query.apiLogs.findFirst({
    where: eq(apiLogs.event_id, event_id),
    orderBy: [desc(apiLogs.timestamp)],
  });

  if (!latestApiLog?.response?.places) {
    throw new Error('No places data found for event');
  }

  // Aggregate preferences
  const preferences = aggregatePreferences(responses);
  
  // Rank restaurants
  const rankings = await Promise.all(latestApiLog.response.places.map(async restaurant => {
    const yelpCuisines = restaurant.yelp?.categories?.map(cat => cat.title) || [];
    
    // Get AI-classified cuisines
    const restaurantInfo = `Name: ${restaurant.displayName.text}, Types: ${restaurant.types?.join(", ")}, Yelp Categories: ${yelpCuisines.join(", ")}`;
    const aiCuisines = await classifyCuisine(restaurantInfo);
    
    const restaurantWithCuisines: PlaceDetails = {
      name: restaurant.displayName.text,
      address: restaurant.formattedAddress,
      coordinates: {
        lat: restaurant.location?.latitude,
        lng: restaurant.location?.longitude
      },
      rating: calculateAggregateRating(
        restaurant.rating,
        restaurant.userRatingCount,
        restaurant.yelp?.rating,
        restaurant.yelp?.review_count
      ),
      total_ratings: (restaurant.userRatingCount || 0) + (restaurant.yelp?.review_count || 0),
      price_level: restaurant.yelp?.price?.length || 2,
      phone_number: restaurant.yelp?.phone || '',
      website: restaurant.yelp?.url || '',
      opening_hours: [],
      place_id: restaurant.id,
      types: restaurant.types || [],
      cuisines: [...aiCuisines, ...yelpCuisines],
      features: restaurant.features || {},
      reviews: []
    };
    
    const score = scoreRestaurant(restaurantWithCuisines, preferences) || 0;
    
    return {
      restaraunt: restaurantWithCuisines,
      score,
      ProsCons: ""
    };
  }));

  // Normalize scores to 0-10 range
  const sortedRankings = rankings.sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sortedRankings.map(r => r.score));
  const minScore = Math.min(...sortedRankings.map(r => r.score));
  
  const normalizedRankings = sortedRankings.map(ranking => ({
    ...ranking,
    score: maxScore === minScore ? 5 : // If all scores are equal, give them a middle score
      ((ranking.score - minScore) / (maxScore - minScore)) * 10
  }));

  // Store ranked results with original scores
  if (rankings.length > 0) {
    try {
      await db.insert(rankedPlaces).values(
        rankings.map(result => ({
          event_id,
          place_details: result.restaraunt,
          score: result.score
        }))
      );
    } catch (error) {
      console.error('Error storing rankings:', error);
    }
  }

  return {
    success: true,
    event_id,
    preferences: {
      preferred_cuisines: Object.keys(preferences.preferredCuisines),
      antipreferred_cuisines: Object.keys(preferences.antiPreferredCuisines),
    },
    rankings: normalizedRankings,
    meta: {
      total_responses: responses.length,
      total_restaurants: latestApiLog.response.places.length,
      ranked_restaurants: normalizedRankings.length
    }
  };
} 

function calculateAggregateRating(
  googleRating?: number,
  googleCount?: number,
  yelpRating?: number,
  yelpCount?: number
): number {
  if (!googleRating && !yelpRating) return 0;

  const googleWeight = googleCount ? googleCount / (googleCount + (yelpCount || 0)) : 0;
  const yelpWeight = yelpCount ? yelpCount / (yelpCount + (googleCount || 0)) : 0;

  return (
    ((googleRating || 0) * googleWeight + (yelpRating || 0) * yelpWeight) /
    (googleWeight + yelpWeight || 1)
  );
}

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

export async function rankRestaurantsForEvent(
  event_id: string,
  restaurants: Restaurant[],
  preferences: AggregatedPreferences,
  request: Request
): Promise<HostDetails[]> {
  const results = await Promise.all(restaurants.map(async restaurant => {
    const yelpCuisines = restaurant.yelp?.categories?.map(cat => cat.title) || [];
    
    const restaurantWithCuisines: PlaceDetails = {
      name: restaurant.displayName.text,
      address: restaurant.formattedAddress,
      coordinates: {
        lat: restaurant.location?.latitude,
        lng: restaurant.location?.longitude
      },
      rating: calculateAggregateRating(
        restaurant.rating,
        restaurant.userRatingCount,
        restaurant.yelp?.rating,
        restaurant.yelp?.review_count
      ),
      total_ratings: (restaurant.userRatingCount || 0) + (restaurant.yelp?.review_count || 0),
      price_level: restaurant.yelp?.price?.length || 2,
      phone_number: restaurant.yelp?.phone || '',
      website: restaurant.yelp?.url || '',
      opening_hours: [],
      place_id: restaurant.id,
      types: restaurant.types || [],
      cuisines: [...(restaurant.cuisines || []), ...yelpCuisines],
      features: restaurant.features || {},
      reviews: []
    };
    
    const score = scoreRestaurant(restaurantWithCuisines, preferences) || 0;
  
    return {
      restaraunt: restaurantWithCuisines,
      score,
      ProsCons: ""
    };
  }));
  return results.sort((a, b) => b.score - a.score);
}

