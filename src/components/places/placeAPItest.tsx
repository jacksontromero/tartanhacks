import React, { useState } from 'react';
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Loader2, MapPin, Phone, Globe, DollarSign, Star } from "lucide-react";

const PlacesFinder = () => {
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);

  const fetchPlaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/places');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch places');
      }
      
      setPlaces(data.places);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriceLevel = (level) => {
    return level ? '$'.repeat(level) : 'N/A';
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Pittsburgh Places Finder</h1>
        <button onClick={fetchPlaces}
          className="rounded-full bg-primary px-10 py-3 font-semibold text-secondary-foreground shadow-lg transition hover:bg-primary/90">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
              ) : (
              'Find Places'
            )}
          </button>
    
      </div>

      {error && (
        <div className="text-red-500 text-center mb-4">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {places.map((place) => (
          <Card key={place.place_id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">{place.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                  <span>{place.address}</span>
                </div>
                
                {place.phone_number && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{place.phone_number}</span>
                  </div>
                )}
                
                {place.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    <a 
                      href={place.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline truncate"
                    >
                      {place.website}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  {place.price_level !== undefined && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{getPriceLevel(place.price_level)}</span>
                    </div>
                  )}
                  
                  {place.rating && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      <span>{place.rating} ({place.total_ratings} reviews)</span>
                    </div>
                  )}
                </div>

                {place.features && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(place.features)
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <span 
                          key={key} 
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {key.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlacesFinder;