// app/api/places/route.ts
import { NextResponse } from 'next/server'

// Types
interface Area {
  name: string
  lat: number
  lng: number
}

interface PlaceFeatures {
  wheelchair_accessible: boolean
  serves_vegetarian: boolean
  delivery: boolean
  dine_in: boolean
  takeout: boolean
}

interface PlaceReview {
  name: string
  text: string
  rating: number
  relativePublishTimeDescription: string
  publishTime: string
  authorAttribution?: {
    displayName: string
    photoUri?: string
    uri?: string
  }
}

interface PlaceDetails {
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  rating: number
  total_ratings: number
  price_level: number
  phone_number: string
  website: string
  opening_hours: string[]
  place_id: string
  types: string[]
  features: PlaceFeatures,
  reviews: PlaceReview[],
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY

async function searchPlaces(
  latitude: number,
  longitude: number,
  radius: number,
  placeTypes: string[],
  pageToken?: string
): Promise<{ places: PlaceDetails[], nextPageToken?: string }> {
  const url = 'https://places.googleapis.com/v1/places:searchNearby'
  
  const body = {
    locationRestriction: {
      circle: {
        center: {
          latitude: latitude,
          longitude: longitude
        },
        radius: radius
      }
    },
    includedTypes: placeTypes,
    maxResultCount: 30,
    rankPreference: "RATING",
    pageToken: pageToken
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY!,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.primaryType',
          'places.types',
          'places.priceLevel',
          'places.nationalPhoneNumber',
          'places.websiteUri',
          'places.currentOpeningHours',
          'places.delivery',
          'places.dineIn',
          'places.takeout',
          'places.wheelchairAccessibleEntrance',
          'places.servesVegetarianFood',
          'places.reviews',
          'nextPageToken',
        ].join(',')
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Error from Google Places API:', result)
      return { places: [] }
    }

    const places: PlaceDetails[] = (result.places || []).map(place => ({
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      coordinates: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0
      },
      rating: place.rating || 0,
      total_ratings: place.userRatingCount || 0,
      price_level: place.priceLevel || 0,
      phone_number: place.nationalPhoneNumber || '',
      website: place.websiteUri || '',
      opening_hours: place.currentOpeningHours?.weekdayDescriptions || [],
      place_id: place.id,
      types: place.types || [],
      features: {
        wheelchair_accessible: place.wheelchairAccessibleEntrance || false,
        serves_vegetarian: place.servesVegetarianFood || false,
        delivery: place.delivery || false,
        dine_in: place.dineIn || false,
        takeout: place.takeout || false
      }
    }))

    return {
      places,
      nextPageToken: result.nextPageToken
    }
  } catch (error) {
    console.error('Error in nearby search:', error)
    return { places: [] }
  }
}

async function processArea(area: Area, radius: number): Promise<PlaceDetails[]> {
  console.log(`Searching in ${area.name}...`)
  const allResults: PlaceDetails[] = []
  const placeTypes = ['restaurant', 'cafe', 'meal_takeaway']

  for (const placeType of placeTypes) {
    console.log(`Searching for ${placeType}s...`)
    let pageToken: string | undefined
    
    do {
      const result = await searchPlaces(area.lat, area.lng, radius, placeType, pageToken)
      allResults.push(...result.places)
      pageToken = result.nextPageToken
      
      if (pageToken) {
        // Wait before using the page token
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } while (pageToken)

    // Rate limiting between place types
    if (placeTypes.indexOf(placeType) < placeTypes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return allResults
}

export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const areaParam = searchParams.get('area')
  
  // Default to Downtown Pittsburgh if no area specified
  const areas: Area[] = areaParam ? 
    JSON.parse(areaParam) : 
    [{
      name: "Downtown",
      lat: 40.4406,
      lng: -79.9959
    }]

  const radius = parseInt(searchParams.get('radius') || '2000')
  
  try {
    const allPlaces: PlaceDetails[] = []
    const seenPlaceIds = new Set<string>()

    // Process areas sequentially to avoid rate limits
    for (const area of areas) {
      const results = await processArea(area, radius)
      
      // Add only unique places
      for (const place of results) {
        if (place && !seenPlaceIds.has(place.place_id)) {
          allPlaces.push(place)
          seenPlaceIds.add(place.place_id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: allPlaces.length,
      places: allPlaces
    })

  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    )
  }
}