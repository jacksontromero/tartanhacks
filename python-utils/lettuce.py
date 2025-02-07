import aiohttp
import asyncio
from dotenv import load_dotenv
import os
import json
import time
from typing import List, Dict, Set
import backoff  # You'll need to: pip install backoff

# Load API key
load_dotenv()
API_KEY = os.getenv('API_KEY')

# Maximum concurrent requests
CONCURRENT_REQUESTS = 3
semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

async def get_place_details(session: aiohttp.ClientSession, place_id: str) -> Dict:
    """Get detailed information about a specific place with retries."""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    
    # Fields we want to retrieve
    fields = [
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
        'geometry/location'  # This will give us lat/lng
    ]
    
    params = {
        'place_id': place_id,
        'fields': ','.join(fields),
        'key': API_KEY
    }
    
    async with semaphore:  # Limit concurrent requests
        try:
            async with session.get(url, params=params) as response:
                result = await response.json()
                
                if result.get('status') == 'OK':
                    place = result.get('result', {})
                    # Get coordinates from geometry/location
                    location = place.get('geometry', {}).get('location', {})
                    return {
                        'name': place.get('name'),
                        'address': place.get('formatted_address'),
                        'coordinates': {
                            'lat': location.get('lat'),
                            'lng': location.get('lng')
                        },
                        'rating': place.get('rating'),
                        'total_ratings': place.get('user_ratings_total'),
                        'price_level': place.get('price_level'),
                        'phone_number': place.get('formatted_phone_number'),
                        'website': place.get('website'),
                        'opening_hours': place.get('opening_hours', {}).get('weekday_text'),
                        'place_id': place_id,
                        'types': place.get('types', []),
                        'features': {
                            'wheelchair_accessible': place.get('wheelchair_accessible_entrance', False),
                            'serves_vegetarian': place.get('serves_vegetarian_food', False),
                            'delivery': place.get('delivery', False),
                            'dine_in': place.get('dine_in', False),
                            'takeout': place.get('takeout', False)
                        }
                    }
                else:
                    if result.get('status') != 'ZERO_RESULTS':
                        print(f"Error getting details for place {place_id}: {result.get('status')}")
                        if result.get('error_message'):
                            print(f"Error message: {result.get('error_message')}")
                    return None
                
        except Exception as e:
            print(f"Exception getting details for place {place_id}: {str(e)}")
            return None

async def search_places(session: aiohttp.ClientSession, latitude: float, longitude: float, 
                       radius: int, place_type: str) -> List[Dict]:
    """Search for places of a specific type in a given area."""
    base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    places = []
    next_page_token = None
    
    while True:
        params = {
            'location': f"{latitude},{longitude}",
            'radius': radius,
            'type': place_type,
            'key': API_KEY
        }
        
        if next_page_token:
            params['pagetoken'] = next_page_token
        
        try:
            async with session.get(base_url, params=params) as response:
                result = await response.json()
                
                if result['status'] != 'OK':
                    if result['status'] != 'ZERO_RESULTS':
                        print(f"Error in nearby search: {result['status']}")
                        if 'error_message' in result:
                            print(f"Error message: {result['error_message']}")
                    break
                
                # Process places in smaller batches
                for batch in [result['results'][i:i + 5] for i in range(0, len(result['results']), 5)]:
                    detail_tasks = [get_place_details(session, place['place_id']) for place in batch]
                    details = await asyncio.gather(*detail_tasks)
                    places.extend([d for d in details if d])
                    await asyncio.sleep(1)  # Rate limiting between batches
                
                next_page_token = result.get('next_page_token')
                if not next_page_token:
                    break
                
                # Wait before using the page token
                await asyncio.sleep(2)
                
        except Exception as e:
            print(f"Error in nearby search: {str(e)}")
            break
    
    return places

async def process_area(session: aiohttp.ClientSession, area: Dict, radius: int) -> List[Dict]:
    """Process a single area for all place types."""
    print(f"\nSearching in {area['name']}...")
    all_results = []
    
    for place_type in ['restaurant', 'cafe', 'meal_takeaway']:
        print(f"Searching for {place_type}s...")
        results = await search_places(session, area['lat'], area['lng'], radius, place_type)
        all_results.extend(results)
        await asyncio.sleep(1)  # Rate limiting between place types
    
    return all_results

async def main():
    # Pittsburgh areas (central areas first)
    areas = [
        {"name": "Downtown", "lat": 40.4406, "lng": -79.9959},
        # {"name": "Strip District", "lat": 40.4513, "lng": -79.9761},
        # {"name": "Oakland", "lat": 40.4421, "lng": -79.9568},
        # {"name": "South Side", "lat": 40.4282, "lng": -79.9729},
        # {"name": "Shadyside", "lat": 40.4552, "lng": -79.9329}
    ]
    
    timeout = aiohttp.ClientTimeout(total=30)
    connector = aiohttp.TCPConnector(limit=CONCURRENT_REQUESTS)
    
    async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
        all_places = []
        seen_place_ids = set()
        
        # Process areas sequentially to avoid rate limits
        for area in areas:
            results = await process_area(session, area, radius=2000)
            
            # Add only unique places
            for place in results:
                if place and place['place_id'] not in seen_place_ids:
                    all_places.append(place)
                    seen_place_ids.add(place['place_id'])
        
        print(f"\nTotal unique places found: {len(all_places)}")
        
        # Save results
        filename = "pittsburgh_restaurants.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(all_places, f, indent=2, ensure_ascii=False)
        print(f"\nResults saved to {filename}")

if __name__ == "__main__":
    asyncio.run(main())