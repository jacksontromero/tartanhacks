import { motion } from "framer-motion";
import { PlaceDetails } from "~/constants/types";
import Image from "next/image";
import { Star, Check, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface RestaurantCardProps {
  restaurant: PlaceDetails;
  score: number;
  rank: number;
  eventId: string;
  isFinal?: boolean;
}

export default function RestaurantCard({
  restaurant,
  score,
  rank,
  eventId,
  isFinal = false
}: RestaurantCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const priceLevel = "💰".repeat(restaurant.price_level || 0);

  const imageUrl = restaurant.main_image_url;
  const uniqueCuisines = [...new Set(restaurant.cuisines)];

  const handleSelectRestaurant = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/select-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurant }),
      });

      if (!response.ok) {
        throw new Error('Failed to select restaurant');
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error selecting restaurant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="relative overflow-hidden rounded-xl bg-white p-6 shadow-lg"
        initial={false}
        animate={{ y: [0, -5, 0] }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
          delay: rank * 0.2
        }}
      >
        <div className="flex gap-6">
          <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={restaurant.name}
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">{restaurant.name}</h2>
              <div className="flex items-center gap-2">
                {!isFinal && (
                  <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                    Score: {score.toFixed(1)}
                  </span>
                )}
                {!isFinal && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDialogOpen(true)}
                    className="ml-2"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                {isFinal && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-5 w-5" />
                    Final Pick
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{restaurant.rating.toFixed(1)} ({restaurant.total_ratings})</span>
              </div>
              <span>{priceLevel}</span>
            </div>

            <div className="mb-2 flex flex-wrap gap-2">
              {uniqueCuisines.map((cuisine) => (
                <span
                  key={cuisine}
                  className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                >
                  {cuisine}
                </span>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
          </div>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Restaurant Selection</DialogTitle>
            <DialogDescription>
              Are you sure you want to select {restaurant.name} as the final restaurant?
              This will notify all participants of the decision.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSelectRestaurant}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Selection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
