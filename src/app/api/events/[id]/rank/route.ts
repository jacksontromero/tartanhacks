import { NextResponse } from 'next/server';
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { eventResponses, apiLogs, rankedPlaces } from "~/server/db/schema";
import { aggregatePreferences, scoreRestaurant } from "~/lib/ranking";

interface YelpCategory {
  alias: string;
  title: string;
}

interface Restaurant {
  id: string;
  displayName: { text: string };
  rating?: number;
  userRatingCount?: number;
  yelp?: {
    categories: YelpCategory[];
    rating: number;
    review_count: number;
    price?: string;
  };
  cuisines: string[];
  formattedAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  types?: string[];
  features?: Record<string, unknown>;
  [key: string]: unknown;
}

interface APILogResponse {
  places: Restaurant[];
}

interface APILog {
  response: APILogResponse;
  event_id: string;
  timestamp: Date;
}

// Helper to parse string arrays like "[\"Breakfast\"]" into ["Breakfast"]
const parseStringArray = (str: string | null | undefined, defaultValue: string[] = []) => {
  try {
    if (!str) return defaultValue;
    // Remove brackets and split by comma, then clean up quotes
    return str
      .replace(/^\[|\]$/g, '') // Remove [ and ]
      .split(',')
      .map(item => item.trim().replace(/^"|"$/g, '')) // Remove quotes
      .filter(item => item.length > 0); // Remove empty items
  } catch (e) {
    return defaultValue;
  }
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate event ID
    const event_id = params.id;
    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    console.log(`Processing rankings for event: ${event_id}`);

    // Get event responses
    const responses = await db.query.eventResponses.findMany({
      where: eq(eventResponses.eventId, event_id),
    });

    if (responses.length === 0) {
      console.log(`No responses found for event: ${event_id}`);
      return NextResponse.json(
        { error: 'No responses found for this event' },
        { status: 404 }
      );
    }

    console.log(`Found ${responses.length} responses for event: ${event_id}`);

    // Parse the responses
    const parsedResponses = responses.map(response => ({
      ...response,
      preferred_cuisines: parseStringArray(response.preferredCuisines),
      anti_preferred_cuisines: parseStringArray(response.antiPreferredCuisines),
      dietary_restrictions: parseStringArray(response.dietaryRestrictions),
      acceptable_price_ranges: parseStringArray(response.acceptablePriceRanges),
      ranked_cuisines: parseStringArray(response.rankedCuisines)
    }));

    // Now aggregate the parsed preferences
    const preferences = aggregatePreferences(parsedResponses);

    console.log('Parsed responses:', parsedResponses);
    console.log('Aggregated preferences:', preferences);

    // Get latest API log with places data
    const latestApiLog = await db.query.apiLogs.findFirst({
      where: eq(apiLogs.event_id, event_id),
      orderBy: [desc(apiLogs.timestamp)],
    }) as APILog | null;

    if (!latestApiLog?.response?.places) {
      console.log(`No places data found for event: ${event_id}`);
      return NextResponse.json(
        { error: 'No places data found for event' },
        { status: 404 }
      );
    }

    const restaurants = latestApiLog.response.places;
    if (restaurants.length === 0) {
      console.log(`No restaurants in places data for event: ${event_id}`);
      return NextResponse.json(
        { error: 'No restaurants found in places data' },
        { status: 404 }
      );
    }

    console.log(`Found ${restaurants.length} restaurants for event: ${event_id}`);

    // Score and rank restaurants
    const results = restaurants
      .map(restaurant => {
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
          score
        };
      })
      .sort((a, b) => b.score - a.score);

    if (results.length === 0) {
      console.log(`No restaurants matched scoring criteria for event: ${event_id}`);
      return NextResponse.json(
        { error: 'No restaurants matched the scoring criteria' },
        { status: 404 }
      );
    }

    console.log(`Ranked ${results.length} restaurants for event: ${event_id}`);

    // Prepare ranked results for storage
    const rankedPlacesToInsert = results.map(result => ({
      event_id,
      place_details: result.restaraunt,
      score: result.score
    }));

    // Store ranked results if we have any
    if (rankedPlacesToInsert.length > 0) {
      try {
        await db.insert(rankedPlaces).values(rankedPlacesToInsert);
        console.log(`Successfully stored rankings for event: ${event_id}`);
      } catch (dbError) {
        console.error('Error storing rankings:', dbError);
        // Continue execution even if storage fails
      }
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      event_id,
      preferences: {
        preferred_cuisines: Object.keys(preferences.preferredCuisines),
        antipreferred_cuisines: Object.keys(preferences.antiPreferredCuisines),
      },
      rankings: results,
      meta: {
        total_responses: responses.length,
        total_restaurants: restaurants.length,
        ranked_restaurants: results.length
      }
    });

  } catch (error) {
    console.error('Error ranking places:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate weighted rating
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