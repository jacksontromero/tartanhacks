// app/api/places/route.ts
import { NextResponse } from 'next/server'
import { db } from "~/server/db"
import { apiLogs as apiRequestLogs } from '~/server/db/schema'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const YELP_API_KEY = process.env.YELP_API_KEY

// Helper function to search Yelp
async function searchYelp(name: string, latitude: number, longitude: number) {
  try {
    console.log(`Searching Yelp for: ${name} at ${latitude},${longitude}`);
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(name)}&latitude=${latitude}&longitude=${longitude}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${YELP_API_KEY}`,
        }
      }
    );
    console.log('Yelp response status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Yelp data:', data.businesses?.[0]);
      return data.businesses?.[0] || null;
    }
    const errorText = await response.text();
    console.error('Yelp error response:', errorText);
    return null;
  } catch (error) {
    console.error('Yelp API error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  console.log('API request started');
  const startTime = Date.now()
  
  try {
    if (!API_KEY) {
      console.error('Google Places API key not configured')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    if (!YELP_API_KEY) {
      console.warn('Yelp API key not configured');
    }

    // Parse request body
    const body = await request.json();
    const { event_id, latitude, longitude } = body;
    
    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id is required' },
        { status: 400 }
      )
    }

    // Use provided coordinates or default to Pittsburgh downtown
    const baseLatitude = latitude ?? 40.4406
    const baseLongitude = longitude ?? -79.9959

    // Define offsets to search in different nearby areas (roughly 500m in each direction)
    const offsets = [
      {lat: 0, lng: 0},
      {lat: 0.004, lng: 0}, // North
      {lat: -0.004, lng: 0}, // South
      {lat: 0, lng: 0.005}, // East
      {lat: 0, lng: -0.005}, // West
    ]

    // Make multiple API calls with different radii and center points to get more coverage
    const radii = [500, 1000] // Reduced radii since we're searching multiple points
    const allPlaces = new Map() // Use Map to deduplicate places by ID

    for (const offset of offsets) {
      const latitude = baseLatitude + offset.lat
      const longitude = baseLongitude + offset.lng

      for (const radius of radii) {
        const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': [
              'places.id',
              'places.displayName', 
              'places.formattedAddress',
              'places.location',
              'places.rating',
              'places.userRatingCount',
              'places.priceLevel',
              'places.reviews',
            ].join(',')
          },
          body: JSON.stringify({
            locationRestriction: {
              circle: {
                center: {
                  latitude,
                  longitude
                },
                radius
              }
            },
            maxResultCount: 20,
            rankPreference: "DISTANCE",
            includedTypes: ['restaurant', 'cafe', 'bakery', 'meal_takeaway', 'bar']
          })
        })

        const data = await response.json()

        if (!response.ok) {
          // Log error and continue with next radius
          await db.insert(apiRequestLogs).values({
            event_id: event_id || null,
            request: {
              event_id,
              url: request.url,
              radius,
              latitude,
              longitude
            },
            response: data,
            error: data.error?.message,
            duration: Date.now() - startTime,
            status: response.status
          })
          continue
        }

        // Add unique places to map
        if (data.places) {
          for (const place of data.places) {
            if (!allPlaces.has(place.id)) {
              // Get Yelp data directly without Google details
              const yelpData = await searchYelp(
                place.displayName?.text,
                place.location?.latitude,
                place.location?.longitude
              );
              console.log(`Yelp data for ${place.displayName?.text}:`, yelpData);

              allPlaces.set(place.id, {
                ...place,
                yelp: yelpData,
                features: {
                  wheelchair_accessible: place.wheelchairAccessibleEntrance,
                  serves_vegetarian: place.servesVegetarianFood,
                  delivery: place.delivery,
                  dine_in: place.dineIn,
                  takeout: place.takeout
                }
              })
            }
          }
        }
      }
    }

    // Convert map to array
    const places = Array.from(allPlaces.values())
    
    // Log final results to database
    await db.insert(apiRequestLogs).values({
      event_id: event_id || null,
      request: {
        event_id,
        url: request.url,
        baseLatitude,
        baseLongitude,
        offsets,
        radii
      },
      response: { places },
      error: null,
      duration: Date.now() - startTime,
      status: 200
    })

    return NextResponse.json({
      success: true,
      event_id: event_id,
      places
    })

  } catch (error) {
    // Log error to database
    await db.insert(apiRequestLogs).values({
      event_id: event_id || null,
      request: {
        url: request.url
      },
      response: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      status: 500
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add HEAD method to fix 405 error
export async function HEAD() {
  return new Response(null, { status: 200 })
}
