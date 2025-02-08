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

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const latParam = searchParams.get('latitude')
    const lngParam = searchParams.get('longitude')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'event_id is required' },
        { status: 400 }
      )
    }

    const baseLatitude = latParam ? parseFloat(latParam) : 40.4406
    const baseLongitude = lngParam ? parseFloat(lngParam) : -79.9959

    const offsets = [
      {lat: 0, lng: 0},
      {lat: 0.004, lng: 0}, 
      {lat: -0.004, lng: 0}, 
      {lat: 0, lng: 0.005}, 
      {lat: 0, lng: -0.005}, 
    ]

    const radii = [500, 1000] 
    const allPlaces = new Map()

    for (const offset of offsets) {
      console.log(`Searching with offset: ${JSON.stringify(offset)}`);
      const latitude = baseLatitude + offset.lat
      const longitude = baseLongitude + offset.lng

      for (const radius of radii) {
        console.log(`Searching with radius: ${radius}m`);
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

        await db.insert(apiRequestLogs).values({
          event_id: eventId ? String(eventId) : null, 
          request: {
            eventId,
            url: request.url,
            radius,
            latitude,
            longitude
          },
          response: response.ok ? { places: data.places || null } : null,
          duration: Date.now() - startTime,
          error: response.ok ? null : (data.error?.message || null),
          status: response.status
        })

        if (response.ok && data.places) {
          console.log(`Found ${data.places.length} places`);
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
              });
            }
          }
        }
      }
    }

    const places = Array.from(allPlaces.values())
    
    await db.insert(apiRequestLogs).values({
      event_id: String(eventId), 
      request: {
        eventId,
        url: request.url,
        baseLatitude,
        baseLongitude,
        offsets,
        radii
      },
      response: { places },
      duration: Date.now() - startTime,
      error: null,
      status: 200
    })

    return NextResponse.json({
      success: true,
      event_id: eventId,
      places
    })

  } catch (error) {
    await db.insert(apiRequestLogs).values({
      event_id: null,
      request: { url: request.url },
      response: null,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}
