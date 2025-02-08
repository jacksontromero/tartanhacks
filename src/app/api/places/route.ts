// app/api/places/route.ts
import { NextResponse } from 'next/server'
import { db } from "src/server/db"
import { apiLogs as apiRequestLogs } from 'src/server/db/schema'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    // Validate API key
    if (!API_KEY) {
      console.error('Google Places API key not configured')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Parse URL parameters
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

    // Use provided coordinates or default to Pittsburgh downtown
    const baseLatitude = latParam ? parseFloat(latParam) : 40.4406
    const baseLongitude = lngParam ? parseFloat(lngParam) : -79.9959

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
            eventId,
            request: {
              eventId,
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
              // Get additional details for each place
              const detailsResponse = await fetch(`https://places.googleapis.com/v1/places/${place.id}`, {
                headers: {
                  'X-Goog-Api-Key': API_KEY,
                  'X-Goog-FieldMask': [
                    'id',
                    'displayName',
                    'formattedAddress',
                    'location',
                    'rating',
                    'userRatingCount',
                    'priceLevel',
                    'reviews',
                    'types',
                    'websiteUri',
                    'formattedPhoneNumber',
                    'currentOpeningHours',
                    'delivery',
                    'dineIn',
                    'takeout',
                    'wheelchairAccessibleEntrance',
                    'servesVegetarianFood'
                  ].join(',')
                }
              })

              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json()
                allPlaces.set(place.id, {
                  ...place,
                  ...detailsData,
                  features: {
                    wheelchair_accessible: detailsData.wheelchairAccessibleEntrance,
                    serves_vegetarian: detailsData.servesVegetarianFood,
                    delivery: detailsData.delivery,
                    dine_in: detailsData.dineIn,
                    takeout: detailsData.takeout
                  }
                })
              } else {
                allPlaces.set(place.id, place)
              }
            }
          }
        }
      }
    }

    // Convert map to array
    const places = Array.from(allPlaces.values())
    
    // Log final results to database
    await db.insert(apiRequestLogs).values({
      eventId,
      request: {
        eventId,
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
      event_id: eventId,
      places
    })

  } catch (error) {
    // Log error to database
    await db.insert(apiRequestLogs).values({
      eventId,
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