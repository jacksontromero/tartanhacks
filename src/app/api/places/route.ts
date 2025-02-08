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
  features: PlaceFeatures
}

// Constants
const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const FIELDS = [
  'name',
  'formatted_address',
  'rating',
  'user_ratings_total',
  'price_level',
  'formatted_phone_number',
  'website',
  'opening_hours/weekday_text',
  'type',
  'wheelchair_accessible_entrance',
  'serves_vegetarian_food',
  'delivery',
  'dine_in',
  'takeout',
  'geometry/location'
]

// Helper functions
async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.append('place_id', placeId)
  url.searchParams.append('fields', FIELDS.join(','))
  url.searchParams.append('key', API_KEY!)

  try {
    const response = await fetch(url.toString())
    const result = await response.json()

    if (result.status === 'OK') {
      const place = result.result
      const location = place.geometry?.location || {}

      return {
        name: place.name,
        address: place.formatted_address,
        coordinates: {
          lat: location.lat,
          lng: location.lng
        },
        rating: place.rating,
        total_ratings: place.user_ratings_total,
        price_level: place.price_level,
        phone_number: place.formatted_phone_number,
        website: place.website,
        opening_hours: place.opening_hours?.weekday_text || [],
        place_id: placeId,
        types: place.types || [],
        features: {
          wheelchair_accessible: place.wheelchair_accessible_entrance || false,
          serves_vegetarian: place.serves_vegetarian_food || false,
          delivery: place.delivery || false,
          dine_in: place.dine_in || false,
          takeout: place.takeout || false
        }
      }
    }
    return null
  } catch (error) {
    console.error(`Error getting details for place ${placeId}:`, error)
    return null
  }
}

async function searchPlaces(
  latitude: number,
  longitude: number,
  radius: number,
  placeType: string,
  pageToken?: string
): Promise<{ places: PlaceDetails[], nextPageToken?: string }> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.append('location', `${latitude},${longitude}`)
  url.searchParams.append('radius', radius.toString())
  url.searchParams.append('type', placeType)
  url.searchParams.append('key', API_KEY!)
  
  if (pageToken) {
    url.searchParams.append('pagetoken', pageToken)
  }

  try {
    const response = await fetch(url.toString())
    const result = await response.json()

    if (result.status !== 'OK' && result.status !== 'ZERO_RESULTS') {
      console.error(`Error in nearby search: ${result.status}`)
      return { places: [] }
    }

    const places: PlaceDetails[] = []
    const results = result.results || []

    // Process places in batches of 5
    for (let i = 0; i < results.length; i += 5) {
      const batch = results.slice(i, i + 5)
      const detailPromises = batch.map(place => getPlaceDetails(place.place_id))
      const details = await Promise.all(detailPromises)
      places.push(...details.filter(Boolean) as PlaceDetails[])
      
      // Add delay between batches
      if (i + 5 < results.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return {
      places,
      nextPageToken: result.next_page_token
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

// API Route Handler
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