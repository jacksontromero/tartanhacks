"use client";

import { motion } from "framer-motion";
import { HostDetails } from "~/constants/types";
import RestaurantCard from "./RestaurantCard";

interface RankedRestaurantsProps {
  rankings: HostDetails[];
  eventId: string;
  finalRestaurant?: HostDetails;
}

export default function RankedRestaurants({
  rankings,
  eventId,
  finalRestaurant
}: RankedRestaurantsProps) {
  if (finalRestaurant) {
    return (
      <RestaurantCard
        restaurant={finalRestaurant.restaraunt}
        score={finalRestaurant.score}
        rank={1}
        eventId={eventId}
        isFinal={true}
      />
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {rankings.map((ranking, index) => (
        <motion.div
          key={ranking.restaraunt.place_id}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 12,
            delay: index * 0.1
          }}
          whileHover={{
            scale: 1.02,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
        >
          <RestaurantCard
            restaurant={ranking.restaraunt}
            score={ranking.score}
            rank={index + 1}
            eventId={eventId}
            allRankings={rankings.map(r => ({ score: r.score }))}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
