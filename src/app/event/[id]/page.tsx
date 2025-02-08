import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) {
    notFound();
  }

  // Parse JSON strings back to arrays
  const priceRanges = JSON.parse(event.priceRanges) as string[];
  const cuisineTypes = JSON.parse(event.cuisineTypes) as string[];

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-secondary-foreground">{event.title}</h1>

        {event.description && (
          <p className="mt-4 text-muted-foreground">{event.description}</p>
        )}

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-5 w-5" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-secondary-foreground">Price Ranges</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {priceRanges.map((range) => (
              <span
                key={range}
                className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
              >
                {range}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-secondary-foreground">Cuisine Types</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {cuisineTypes.map((cuisine) => (
              <span
                key={cuisine}
                className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
              >
                {cuisine}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
