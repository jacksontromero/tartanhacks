import { NextResponse } from 'next/server';
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { eventResponses, apiLogs, rankedPlaces } from "~/server/db/schema";
import { aggregatePreferences, scoreRestaurant, rankRestaurantsForEvent } from "~/lib/ranking";

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
    const event_id = params.id;
    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get event responses
    const responses = await db.query.eventResponses.findMany({
      where: eq(eventResponses.eventId, event_id),
    });

    if (responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses found for this event' },
        { status: 404 }
      );
    }

    // Get latest API log with places data
    const latestApiLog = await db.query.apiLogs.findFirst({
      where: eq(apiLogs.event_id, event_id),
      orderBy: [desc(apiLogs.timestamp)],
    }) as APILog | null;

    if (!latestApiLog?.response?.places) {
      return NextResponse.json(
        { error: 'No places data found for event' },
        { status: 404 }
      );
    }

    // Aggregate preferences
    const preferences = aggregatePreferences(responses);
    
    // Rank restaurants
    const rankings = await rankRestaurantsForEvent(
      event_id,
      latestApiLog.response.places,
      preferences,
      request
    );

    // Store ranked results
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

    return NextResponse.json({
      success: true,
      event_id,
      preferences: {
        preferred_cuisines: Object.keys(preferences.preferredCuisines),
        antipreferred_cuisines: Object.keys(preferences.antiPreferredCuisines),
      },
      rankings,
      meta: {
        total_responses: responses.length,
        total_restaurants: latestApiLog.response.places.length,
        ranked_restaurants: rankings.length
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