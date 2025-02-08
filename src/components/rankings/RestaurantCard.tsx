import { motion } from "framer-motion";
import { PlaceDetails } from "~/constants/types";
import Image from "next/image";
import { Star, DollarSign } from "lucide-react";

interface RestaurantCardProps {
  restaurant: PlaceDetails;
  score: number;
  rank: number;
}

export default function RestaurantCard({ restaurant, score, rank }: RestaurantCardProps) {
  const priceLevel = "💰".repeat(restaurant.price_level || 0);

  // Use a placeholder image or another available property for the image source
  const imageUrl = restaurant.main_image_url

  return (
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
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
              Score: {score.toFixed(1)}
            </span>
          </div>

          <div className="mb-4 flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{restaurant.rating.toFixed(1)} ({restaurant.total_ratings})</span>
            </div>
            <span>{priceLevel}</span>
          </div>

          <div className="mb-2 flex flex-wrap gap-2">
            {restaurant.cuisines.map((cuisine) => (
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
  );
}
