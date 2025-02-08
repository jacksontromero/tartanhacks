import { CUISINE_MAPPINGS, PRICE_MAPPINGS } from "~/constants/cuisines";
import { PlaceDetails, HostDetails, PriceLevel } from "~/constants/types"
import { db } from "~/server/db";
import { rankedPlaces } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { eventResponses, apiLogs } from "~/server/db/schema";

interface AggregatedPreferences {
    preferredCuisines: Record<string, number>
    antiPreferredCuisines: Record<string, number>
    dietaryRestrictions: Set<string>
    acceptablePriceRanges: Set<PriceLevel>
    rankedCuisines: string[]
  }

  function aggregatePreferences(eventResponses: any[]): AggregatedPreferences {
    const preferences: AggregatedPreferences = {
      preferredCuisines: {},
      antiPreferredCuisines: {},
      dietaryRestrictions: new Set(),
      acceptablePriceRanges: new Set(),
      rankedCuisines: [],
    };

    const cuisineRankingScores: Record<string, number[]> = {};
    eventResponses.forEach(response => {
      response.preferredCuisines.forEach((cuisine: string) => {
        const cuisineMap = CUISINE_MAPPINGS[cuisine] || '';
        preferences.preferredCuisines[cuisineMap] = (preferences.preferredCuisines[cuisineMap] || 0) + 1;
      });
      response.antiPreferredCuisines.forEach((cuisine: string) => {
        const cuisineMap = CUISINE_MAPPINGS[cuisine] || '';
        preferences.antiPreferredCuisines[cuisineMap] = (preferences.antiPreferredCuisines[cuisineMap] || 0) + 1;
      });
      response.dietaryRestrictions.forEach((restriction: string) => {
        preferences.dietaryRestrictions.add(restriction);
      });
      response.acceptablePriceRanges.forEach((price: string) => {
        const priceMap = PRICE_MAPPINGS[price] || PriceLevel.PRICE_LEVEL_UNSPECIFIED;
        preferences.acceptablePriceRanges.add(priceMap);
      });
      // Aggregate ranked cuisines
      response.rankedCuisines.forEach((cuisine: string, index: number) => {
        if (!cuisineRankingScores[cuisine]) {
          cuisineRankingScores[cuisine] = [];
        }
        cuisineRankingScores[cuisine].push(index);
      });
    });

    // Compute average ranking scores and sort cuisines by preference
    const aggregatedRanking = Object.entries(cuisineRankingScores)
      .map(([cuisine, rankings]) => ({
        cuisine,
        avgRank: rankings.reduce((sum, rank) => sum + rank, 0) / rankings.length
      }))
      .sort((a, b) => a.avgRank - b.avgRank) // Lower average rank is better
      .map(entry => entry.cuisine);

    preferences.rankedCuisines = aggregatedRanking;

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
      // Boost score based on ranked cuisines
      const rankIndex = preferences.rankedCuisines.indexOf(cuisine);
      if (rankIndex !== -1) {
        score += (preferences.rankedCuisines.length - rankIndex) * 2;
      }
    });

    // Check price range
    if (preferences.acceptablePriceRanges.has(restaurant.price_level)) {
      score += 5;
    }
    // Check price range
    const lowestAcceptablePrice = Math.min(...Array.from(preferences.acceptablePriceRanges));
    if (restaurant.price_level != PriceLevel.PRICE_LEVEL_UNSPECIFIED && restaurant.price_level.valueOf() <= lowestAcceptablePrice) {
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

  async function filterAndRankRestaurants(event_id: string): Promise<HostDetails[]> {
    // Get event responses
    const responses = await db.query.eventResponses.findMany({
      where: eq(eventResponses.eventId, event_id),
    });

    // Get latest API log with places data
    const latestApiLog = await db.query.apiLogs.findFirst({
      where: eq(apiLogs.event_id, event_id),
      orderBy: (apiLogs, { desc }) => [desc(apiLogs.timestamp)],
    });

    if (!latestApiLog?.response?.places) {
      throw new Error('No places data found for event');
    }

    const restaurants = latestApiLog.response.places as PlaceDetails[];
    const preferences = aggregatePreferences(responses);

    const results = restaurants
      .map(restaurant => ({ restaurant, score: scoreRestaurant(restaurant, preferences) }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => ({ restaraunt: entry.restaurant, score: entry.score }));

    // Insert ranked results into database
    const rankedPlacesToInsert = results.map(result => ({
      event_id,
      place_details: result.restaraunt,
      score: result.score
    }));

    await db.insert(rankedPlaces).values(rankedPlacesToInsert);

    return results;
  }
