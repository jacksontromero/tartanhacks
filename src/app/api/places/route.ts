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
  features: PlaceFeatures
  reviews: PlaceReview[]
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY

async function searchPlaces(
  latitude: number,
  longitude: number,
  radius: number,
  placeTypes: string[],
  pageToken?: string
): Promise<{ places: PlaceDetails[], nextPageToken?: string }> {
  console.log(`🔍 Searching places - Lat: ${latitude}, Lng: ${longitude}, Radius: ${radius}m`)
  console.log(`📍 Place types: ${placeTypes.join(', ')}`)
  if (pageToken) console.log(`📄 Using page token: ${pageToken.substring(0, 20)}...`)

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
    maxResultCount: 20,
    rankPreference: "DISTANCE",  // Changed from "RATING" to "DISTANCE"
    pageToken: pageToken
  }

  try {
    console.log('📤 Request body:', JSON.stringify(body, null, 2))
    console.time('🕒 Places API Request')

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
          'places.types',
          'places.priceLevel',
          'places.internationalPhoneNumber',
          'places.websiteUri',
          'places.regularOpeningHours',
          'places.delivery',
          'places.dineIn',
          'places.takeout',
          // 'places.accessibility',
          'places.servesVegetarianFood',
          'places.reviews',
          // 'nextPageToken'
        ].join(',')
      },
      body: JSON.stringify(body)
    })
    console.timeEnd('🕒 Places API Request')

    const result = await response.json()

    console.log('📥 Response status:', response.status, response.statusText)
    console.log('📦 Raw API response:', JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.error('❌ Error from Google Places API:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      })
      return { places: [] }
    }

    if (!result.places || result.places.length === 0) {
      console.warn('⚠️ No places found in API response. Response structure:', {
        hasPlacesArray: !!result.places,
        placesLength: result.places?.length,
        responseKeys: Object.keys(result)
      })
    }

    const placesCount = result.places?.length || 0
    console.log(`✅ Found ${placesCount} places${result.nextPageToken ? ' (more available)' : ''}`)

    const places: PlaceDetails[] = (result.places || []).map(place => {
      if (!place.id) {
        console.warn('⚠️ Place without ID:', place)
      }
      
      return {
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        coordinates: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0
        },
        rating: place.rating || 0,
        total_ratings: place.userRatingCount || 0,
        price_level: place.priceLevel || 0,
        phone_number: place.internationalPhoneNumber || '',
        website: place.websiteUri || '',
        opening_hours: place.regularOpeningHours?.weekdayDescriptions || [],
        place_id: place.id,
        types: place.types || [],
        features: {
          wheelchair_accessible: place.accessibility?.wheelchairAccessibleEntrance || false,
          serves_vegetarian: place.servesVegetarianFood || false,
          delivery: place.delivery || false,
          dine_in: place.dineIn || false,
          takeout: place.takeout || false
        },
        reviews: (place.reviews || []).map(review => ({
          name: review.name || '',
          text: review.text || '',
          rating: review.rating || 0,
          relativePublishTimeDescription: review.relativePublishTimeDescription || '',
          publishTime: review.publishTime || '',
          authorAttribution: review.authorAttribution ? {
            displayName: review.authorAttribution.displayName || '',
            photoUri: review.authorAttribution.photoUri,
            uri: review.authorAttribution.uri
          } : undefined
        }))
      }
    })

    return {
      places,
      nextPageToken: result.nextPageToken
    }
  } catch (error) {
    console.error('❌ Error in nearby search:', error)
    return { places: [] }
  }
}

async function processArea(area: Area, radius: number): Promise<PlaceDetails[]> {
  console.log(`🎯 Processing area: ${area.name}`)
  console.time(`⏱️ Total processing time for ${area.name}`)
  
  const allResults: PlaceDetails[] = []
  const placeTypes = ['restaurant', 'cafe', 'meal_takeaway']

  for (const placeType of placeTypes) {
    console.log(`\n📍 Searching for ${placeType}s in ${area.name}...`)
    let pageToken: string | undefined
    let pageCount = 0
    
    do {
      pageCount++
      console.log(`\n📄 Fetching page ${pageCount}${pageToken ? ' with token' : ''}...`)
      
      const result = await searchPlaces(area.lat, area.lng, radius, [placeType], pageToken)
      allResults.push(...result.places)
      pageToken = result.nextPageToken
      
      console.log(`📊 Current total places found in ${area.name}: ${allResults.length}`)
      
      if (pageToken) {
        console.log('⏳ Waiting before fetching next page...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } while (pageToken)

    if (placeTypes.indexOf(placeType) < placeTypes.length - 1) {
      console.log('⏳ Rate limiting between place types...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.timeEnd(`⏱️ Total processing time for ${area.name}`)
  console.log(`✨ Found total of ${allResults.length} places in ${area.name}`)
  
  return allResults
}

export async function GET(request: Request) {
  console.log('\n🚀 Starting places API request...')
  
  if (!API_KEY) {
    console.error('❌ API key not configured')
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const areaParam = searchParams.get('area')
  const radius = parseInt(searchParams.get('radius') || '4000')
  
  console.log('📝 Request parameters:', {
    area: areaParam || 'Default (Downtown Pittsburgh)',
    radius: `${radius}m`
  })

  // Default to Downtown Pittsburgh if no area specified
  const areas: Area[] = areaParam ? 
    JSON.parse(areaParam) : 
    [{
      name: "Downtown",
      lat: 40.4406,
      lng: -79.9959
    }]

  try {
    console.time('⏱️ Total API request time')
    const allPlaces: PlaceDetails[] = []
    const seenPlaceIds = new Set<string>()

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

    console.timeEnd('⏱️ Total API request time')
    console.log(`✅ Request completed successfully. Found ${allPlaces.length} unique places.`)

    return NextResponse.json({
      success: true,
      total: allPlaces.length,
      places: allPlaces
    })

  } catch (error) {
    console.error('❌ Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    )
  }
}