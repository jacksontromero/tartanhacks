import { NextResponse } from 'next/server';
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { eventResponses, apiLogs, rankedPlaces } from "~/server/db/schema";
import { aggregatePreferences, scoreRestaurant } from "~/lib/ranking";

interface Restaurant {
  types?: string[];
  cuisines?: string[];
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

    // Get latest API log with places data
    const latestApiLog = await db.query.apiLogs.findFirst({
      where: eq(apiLogs.event_id, event_id),
      orderBy: (apiLogs, { desc }) => [desc(apiLogs.timestamp)],
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

    // Aggregate preferences from responses
    const preferences = aggregatePreferences(responses);
    
    console.log('Aggregated preferences:', preferences);

    // Score and rank restaurants
    const results = restaurants
      .map(restaurant => {
        const restaurantWithCuisines = {
          ...restaurant,
          cuisines: restaurant.types || [], // Use types as cuisines if cuisines not present
        };
        
        const score = scoreRestaurant(restaurantWithCuisines, preferences);
        
        return {
          restaurant: restaurantWithCuisines,
          score
        };
      })
      // .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => ({ 
        restaurant: entry.restaurant, 
        score: entry.score 
      }));

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
      place_details: result.restaurant,
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