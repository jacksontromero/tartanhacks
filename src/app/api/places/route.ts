// app/api/places/route.ts
import { NextResponse } from 'next/server'
import { db } from "src/server/db";
import { places, placeReviews } from "src/server/db/schema";

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
  price_level: string
  phone_number: string
  website: string
  opening_hours: string[]
  place_id: string
  types: string[]
  cuisines: string[]
  features: PlaceFeatures
  reviews: PlaceReview[]
}

interface GooglePlacesApiResponse {
  places?: {
    id: string
    displayName?: { text: string }
    formattedAddress?: string
    location?: { latitude: number; longitude: number }
    rating?: number
    userRatingCount?: number
    priceLevel?: string
    internationalPhoneNumber?: string
    websiteUri?: string
    currentOpeningHours?: { weekdayDescriptions: string[] }
    types?: string[]
    cuisines?: string[]
    accessibility?: { wheelchairAccessibleEntrance: boolean }
    servesVegetarianFood?: boolean
    delivery?: boolean
    dineIn?: boolean
    takeout?: boolean
    reviews?: Array<{
      name?: string
      text?: string
      rating?: number
      relativePublishTimeDescription?: string
      publishTime?: string
      authorAttribution?: {
        displayName?: string
        photoUri?: string
        uri?: string
      }
    }>
  }[]
  nextPageToken?: string
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY

function mapPriceLevel(priceLevel: string | undefined): number {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
      return 0;
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4;
    default:
      return 0;
  }
}


async function searchPlaces(
  latitude: number,
  longitude: number,
  radius: number,
  placeTypes: string[],
  pageToken?: string
): Promise<{ places: PlaceDetails[], nextPageToken?: string }> {
  const logData = {
    search: {
      location: { latitude, longitude },
      radius,
      placeTypes,
      pageToken: pageToken ? `${pageToken.substring(0, 20)}...` : null
    }
  };

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
    rankPreference: "DISTANCE",
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
          'places.types',
          'places.priceLevel',
          'places.internationalPhoneNumber',
          'places.websiteUri',
          'places.currentOpeningHours',
          'places.delivery',
          'places.dineIn',
          'places.takeout',
          'places.servesVegetarianFood',
          'places.cuisines',
          'places.reviews',
        ].join(',')
      },
      body: JSON.stringify(body)
    })

    const result = (await response.json()) as GooglePlacesApiResponse

    if (!response.ok) {
      Object.assign(logData, {
        error: {
          status: response.status,
          statusText: response.statusText,
          message: result.error?.message
        }
      });
      return { places: [] }
    }

    Object.assign(logData, {
      results: {
        count: result.places?.length || 0,
        hasMorePages: !!result.nextPageToken
      }
    });

    return {
      places: (result.places || []).map(place => ({
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        coordinates: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0
        },
        rating: place.rating || 0,
        total_ratings: place.userRatingCount || 0,
        price_level: mapPriceLevel(place.priceLevel),
        phone_number: place.internationalPhoneNumber || '',
        website: place.websiteUri || '',
        opening_hours: place.currentOpeningHours?.weekdayDescriptions || [],
        place_id: place.id,
        types: place.types || [],
        cuisines: place.cuisines || [],
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
      })),
      nextPageToken: result.nextPageToken
    }
  } catch (error) {
    Object.assign(logData, { error: error });
    return { places: [] }
  }
}

async function processArea(area: Area, radius: number): Promise<PlaceDetails[]> {
  const allResults: PlaceDetails[] = []
  const foodRelatedTypes = [
    'restaurant',
    'cafe',
    'bakery',
    'meal_takeaway',
    'bar'
  ]

  const areaLog = {
    area: area.name,
    results: [] as Array<{ type: string; count: number }>
  };

  for (const placeType of foodRelatedTypes) {
    let pageToken: string | undefined
    let pageCount = 0
    let maxPages = 3
    let typeResults = 0;
    
    do {
      pageCount++
      const result = await searchPlaces(area.lat, area.lng, radius, [placeType], pageToken)
      allResults.push(...result.places)
      typeResults += result.places.length;
      pageToken = result.nextPageToken
      
      if (pageToken && pageCount < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        pageToken = undefined
      }
    } while (pageToken)

    areaLog.results.push({
      type: placeType,
      count: typeResults
    });

    if (foodRelatedTypes.indexOf(placeType) < foodRelatedTypes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return allResults
}

async function savePlacesToDatabase(eventId: string, placesToSave: PlaceDetails[]) {
  const dbLog = {
    eventId,
    totalPlaces: placesToSave.length,
    savedPlaces: 0,
    savedReviews: 0
  };

  try {
    for (const place of placesToSave) {
      const savedPlace = await db.insert(places).values({
        eventId: eventId,
        name: place.name,
        address: place.address,
        latitude: place.coordinates.lat,
        longitude: place.coordinates.lng,
        rating: place.rating,
        totalRatings: place.total_ratings,
        priceLevel: place.price_level,
        phoneNumber: place.phone_number,
        website: place.website,
        placeId: place.place_id,
        types: place.types,
        cuisineTypes: place.cuisines,
        features: place.features,
        openingHours: place.opening_hours,
      }).returning().then(results => results[0]);

      if (!savedPlace) {
        throw new Error(`Failed to save place: ${place.name}`);
      }
      dbLog.savedPlaces++;

      if (place.reviews?.length > 0) {
        await db.insert(placeReviews).values(
          place.reviews.map(review => ({
            placeId: savedPlace.id,
            name: review.name,
            text: review.text,
            rating: review.rating.toString(),
            publishTime: review.publishTime ? new Date(review.publishTime) : null,
            relativePublishTime: review.relativePublishTimeDescription,
            authorName: review.authorAttribution?.displayName,
            authorPhotoUrl: review.authorAttribution?.photoUri,
            authorUrl: review.authorAttribution?.uri,
          }))
        );
        dbLog.savedReviews += place.reviews.length;
      }
    }
    return dbLog;
  } catch (error) {
    return { ...dbLog, error };
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventId: null as string | null,
    request: {} as any,
    response: {} as any,
    duration: 0
  };

  if (!API_KEY) {
    console.table([{ ...logEntry, error: 'API key not configured' }]);
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event_id')
  const areaParam = searchParams.get('area')
  const radius = parseInt(searchParams.get('radius') || '2000')
  
  logEntry.eventId = eventId;
  logEntry.request = {
    eventId,
    area: areaParam || 'Default (Downtown Pittsburgh)',
    radius: `${radius}m`
  };

  if (!eventId) {
    console.table([{ ...logEntry, error: 'event_id is required' }]);
    return NextResponse.json(
      { error: 'event_id is required' },
      { status: 400 }
    )
  }

  const areas: Area[] = areaParam ? 
    JSON.parse(areaParam) : 
    [{
      name: "Downtown",
      lat: 40.4406,
      lng: -79.9959
    }]

  try {
    const allPlaces: PlaceDetails[] = []
    const seenPlaceIds = new Set<string>()

    for (const area of areas) {
      const results = await processArea(area, radius)
      for (const place of results) {
        if (place && !seenPlaceIds.has(place.place_id)) {
          allPlaces.push(place)
          seenPlaceIds.add(place.place_id)
        }
      }
    }

    const dbResult = await savePlacesToDatabase(eventId, allPlaces);
    
    logEntry.response = {
      uniquePlaces: allPlaces.length,
      savedToDb: dbResult
    };
    logEntry.duration = Date.now() - startTime;

    console.table([logEntry]);

    return NextResponse.json({
      success: true,
      total: allPlaces.length,
      places: allPlaces
    })

  } catch (error) {
    logEntry.response = { error };
    logEntry.duration = Date.now() - startTime;
    console.table([logEntry]);
    
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    )
  }
}