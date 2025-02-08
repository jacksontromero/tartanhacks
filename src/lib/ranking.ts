import { CUISINE_MAPPINGS, PRICE_MAPPINGS } from "~/constants/cuisines";
import { PlaceDetails, PriceLevel } from "~/constants/types";
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { eventResponses, apiLogs, rankedPlaces, EventResponse } from "~/server/db/schema";
import { classifyCuisine } from "~/lib/ai";

export async function getRankingsForEvent(event_id: string) {
  // Get event responses
  const responses: EventResponse[] = await db.query.eventResponses.findMany({
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
    // Try to get cuisines if they're missing
    let cuisines = restaurant.cuisines || [];

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
      cuisines: [...cuisines, ...(restaurant.types || [])],
      features: restaurant.features || {},
      reviews: [],
      main_image_url: restaurant.main_image_url || null,
    };

    const score = scoreRestaurant(restaurantWithCuisines, preferences) || 0;

    return {
      restaraunt: restaurantWithCuisines,
      score,
      ProsCons: ""
    };
  }));

  // Sort by score but don't normalize
  const sortedRankings = rankings.sort((a, b) => b.score - a.score);

  // Store ranked results with scores
  if (sortedRankings.length > 0) {
    try {
      await db.insert(rankedPlaces).values(
        sortedRankings.map(result => ({
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
      preferred_cuisines: Object.keys(preferences.cuisineScores),
      antipreferred_cuisines: Object.keys(preferences.antiPreferredCuisines),
    },
    rankings: sortedRankings,
    meta: {
      total_responses: responses.length,
      total_restaurants: latestApiLog.response.places.length,
      ranked_restaurants: sortedRankings.length
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
  cuisineScores: Record<string, number>;
  antiPreferredCuisines: Record<string, number>;
  dietaryRestrictions: Set<string>;
  maxEffectivePrice: number;
}

export function aggregatePreferences(eventResponses: EventResponse[]): AggregatedPreferences {
  const preferences: AggregatedPreferences = {
    cuisineScores: {},
    antiPreferredCuisines: {},
    dietaryRestrictions: new Set(),
    maxEffectivePrice: Infinity, // Initialize with a high value
  };

  // We'll store each user's maximum acceptable price level here.
  const userMaxPrices: number[] = [];

  eventResponses.forEach(response => {
    const antiPreferredCuisines = JSON.parse(response.antiPreferredCuisines);
    const dietaryRestrictions = JSON.parse(response.dietaryRestrictions);
    const acceptablePriceRanges = JSON.parse(response.acceptablePriceRanges);
    const rankedCuisines = JSON.parse(response.rankedCuisines);

    // Accumulate anti-preferred cuisines exactly as before
    antiPreferredCuisines.forEach((cuisine: string) => {
      const mappedCuisine = CUISINE_MAPPINGS[cuisine] || "";
      preferences.antiPreferredCuisines[mappedCuisine] =
        (preferences.antiPreferredCuisines[mappedCuisine] || 0) + 1;
    });

    dietaryRestrictions.forEach((restriction: string) => {
      preferences.dietaryRestrictions.add(restriction);
    });

    // Compute this user's maximum acceptable price:
    const mappedPrices = acceptablePriceRanges.map(
      (price: string) => PRICE_MAPPINGS[price] || PriceLevel.PRICE_LEVEL_UNSPECIFIED
    );
    const userMaxPrice = Math.max(...mappedPrices);
    userMaxPrices.push(userMaxPrice);

    // Use a unified cuisine ranking: allocate exactly 5 points per response
    if (rankedCuisines && rankedCuisines.length > 0) {
      if (rankedCuisines.length === 1) {
        const cuisine = rankedCuisines[0];
        const mappedCuisine = CUISINE_MAPPINGS[cuisine] || "";
        preferences.cuisineScores[mappedCuisine] =
          (preferences.cuisineScores[mappedCuisine] || 0) + 5;
      } else {
        // For multiple cuisines:
        // - Give the top ranked cuisine 3 points.
        // - Divide the remaining 2 points equally among the rest.
        const firstCuisine = rankedCuisines[0];
        const mappedFirst = CUISINE_MAPPINGS[firstCuisine] || "";
        preferences.cuisineScores[mappedFirst] =
          (preferences.cuisineScores[mappedFirst] || 0) + 3;

        const remainingPoints = 2;
        const remainingCount = rankedCuisines.length - 1;
        const pointsEach = remainingPoints / remainingCount;

        for (let i = 1; i < rankedCuisines.length; i++) {
          const cuisine = rankedCuisines[i];
          const mappedCuisine = CUISINE_MAPPINGS[cuisine] || "";
          preferences.cuisineScores[mappedCuisine] =
            (preferences.cuisineScores[mappedCuisine] || 0) + pointsEach;
        }
      }
    }
  });

  // The overall strict budget threshold is the smallest max acceptable price among users.
  preferences.maxEffectivePrice = Math.min(...userMaxPrices);

  return preferences;
}

export function scoreRestaurant(restaurant: PlaceDetails, preferences: AggregatedPreferences): number {
  let score = 0;

  if (!restaurant) return 0;

  // Use the cuisineScores map to boost score based on user rankings.
  const cuisines = restaurant.cuisines || restaurant.types || [];
  cuisines.forEach(cuisine => {
    const mappedCuisine = CUISINE_MAPPINGS[cuisine] || "";

    // Deduct points for cuisines that are disliked.
    if (preferences.antiPreferredCuisines[mappedCuisine]) {
      score -= preferences.antiPreferredCuisines[mappedCuisine] * 10;
    }
    // Add points based on the cumulative preferred score.
    if (preferences.cuisineScores[mappedCuisine]) {
      score += preferences.cuisineScores[mappedCuisine] * 5;
    }
  });

  // Rating handling (weight: high)
  if (typeof restaurant.rating === 'number') {
    score += restaurant.rating * 5;
    if (restaurant.total_ratings) {
      // Increased multiplier (10 instead of 5) and cap (10 instead of 5) to rank review count higher
      score += Math.min(Math.log10(restaurant.total_ratings) * 10, 10);
    }
  }

  // Updated Price level handling:
  const priceLevel = restaurant.price_level ?? PriceLevel.PRICE_LEVEL_UNSPECIFIED;
  if (priceLevel === PriceLevel.PRICE_LEVEL_UNSPECIFIED) {
    // If price is unspecified, treat it neutrally.
  } else if (priceLevel <= preferences.maxEffectivePrice) {
    // Restaurant's price fits within the strict threshold: add a bonus.
    score += 5;
  } else {
    // Restaurant's price exceeds the strict threshold: apply a penalty.
    score -= 8;
  }

  // Dietary restrictions handling (weight: high)
  const features = restaurant.features || {};
  if (preferences.dietaryRestrictions.has('Vegetarian') && !features.serves_vegetarian) {
    score -= 50;
  }

  return score || 0;
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

