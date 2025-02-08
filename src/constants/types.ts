import { PriceLevel } from '~/constants/cuisines'

// Types
export interface Area {
    name: string
    lat: number
    lng: number
  };
  
export interface PlaceFeatures {
    wheelchair_accessible: boolean
    serves_vegetarian: boolean
    delivery: boolean
    dine_in: boolean
    takeout: boolean
  };
  
export interface PlaceReview {
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
  };
  
export interface PlaceDetails {
    name: string
    address: string
    coordinates: {
      lat: number
      lng: number
    }
    rating: number
    total_ratings: number
    price_level: PriceLevel
    phone_number: string
    website: string
    opening_hours: string[]
    place_id: string
    types: string[]
    cuisines: string[]
    features: PlaceFeatures
    reviews: PlaceReview[]
  };

export interface HostDetails {
    restaraunt: PlaceDetails,
    score: number,
  };
  