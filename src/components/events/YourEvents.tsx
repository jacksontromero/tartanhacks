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
  const [showPastEvents, setShowPastEvents] = useState(false);

  const currentDate = new Date();
  const futureEvents = events.filter(event => new Date(event.date) >= currentDate);
  const pastEvents = events.filter(event => new Date(event.date) < currentDate);

  return (
    <div className="w-full max-w-6xl px-6">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary-foreground">Your Events</h2>
        <Button
          variant="ghost"
          onClick={() => setShowPastEvents(!showPastEvents)}
        >
          {showPastEvents ? "Hide Past Events" : "Show Past Events"}
        </Button>
      </div>

      {futureEvents.length > 0 && (
        <div className="mb-12">
          <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Upcoming Events</h3>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {futureEvents.map((event) => (
                <CarouselItem key={event.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Link href={`/event/${event.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardHeader>
                        <CardTitle>{event.title}</CardTitle>
                        {event.description && (
                          <CardDescription>{event.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{event.startTime} - {event.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{event.responses.length} responses</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}

      {showPastEvents && pastEvents.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Past Events</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((event) => (
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
                      <span>{new Date(event.date).toLocaleDateString()}</span>
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
