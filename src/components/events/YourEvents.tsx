"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";
import { EventWithResponses } from "~/app/page";

export default function YourEvents({ events }: { events: EventWithResponses[] }) {
  const [showPastEvents, setShowPastEvents] = useState(true);

  const currentDate = new Date();
  // Subtract one day from current date for the buffer
  const bufferDate = new Date(currentDate.setDate(currentDate.getDate() - 1));

  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate < bufferDate;
  });

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return showPastEvents ? true : eventDate >= bufferDate;
  });

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-primary">Your Events</h2>
        {pastEvents.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => setShowPastEvents(!showPastEvents)}
          >
            {showPastEvents ? "Hide" : "Show"} Past Events
          </Button>
        )}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No events found. Create one to get started!
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/event/${event.id}`}>
                <Card className={cn(
                  "hover:bg-accent/50 transition-colors",
                  "opacity-75 hover:opacity-100"
                )}>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    {event.description && (
                      <CardDescription>{event.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString(undefined, {
                          timeZone: 'UTC'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{event.responses.length} responses</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
