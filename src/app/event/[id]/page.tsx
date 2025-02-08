import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import CopyInviteButton from "~/components/events/CopyInviteButton";
import RankedRestaurants from "~/components/rankings/RankedRestaurants";
import { getRankingsForEvent } from "~/lib/ranking";
import { auth } from "~/server/auth";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) {
    notFound();
  }

  const isHost = session?.user?.id === event.hostId;
  let rankings = null;

  if (isHost) {
    try {
      const rankingData = await getRankingsForEvent(id);
      rankings = rankingData.rankings;
    } catch (error) {
      // If there are no responses yet, getRankingsForEvent will throw
      console.log("No rankings available yet");
    }
  }

  // Parse JSON strings back to arrays
  const priceRanges = JSON.parse(event.priceRanges) as string[];
  const cuisineTypes = JSON.parse(event.cuisineTypes) as string[];

  return (
    <main className="bg-background min-h-screen">
      <div className="w-full p-8">
        <div className="flex gap-12 w-full justify-around">
          {/* Event Details Card - Full width if not host, left side if host */}
          <div className={`rounded-lg h-fit bg-white p-8 shadow-lg ${isHost ? 'w-[300px] flex-shrink-0' : 'w-full max-w-2xl mx-auto'}`}>
            <h1 className="text-3xl font-bold text-primary">{event.title}</h1>

            {event.description && (
              <p className="mt-4 text-muted-foreground">{event.description}</p>
            )}

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-5 w-5" />
                <span>{new Date(event.date).toLocaleDateString(undefined, {
                  timeZone: 'UTC'
                })}</span>
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
              <h2 className="font-semibold text-primary">Price Ranges</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {priceRanges.map((range) => (
                  <span
                    key={range}
                    className="rounded-full bg-secondary px-3 py-1 text-sm text-primary"
                  >
                    {range}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold text-primary">Cuisine Types</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {cuisineTypes.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="rounded-full bg-secondary px-3 py-1 text-sm text-primary"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <CopyInviteButton eventId={event.id} />
            </div>
          </div>

          {/* Rankings Section - Only show for host */}
          {isHost && (
            <div className="flex-1">
              <h2 className="mb-8 text-3xl font-bold text-primary">
                Restaurant Rankings
              </h2>
              {rankings && rankings.length > 0 ? (
                <RankedRestaurants rankings={rankings} />
              ) : (
                <div className="rounded-lg bg-white p-8 shadow-lg text-center">
                  <p className="text-lg text-muted-foreground">
                    Waiting for responses from your guests...
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Rankings will appear here once people start responding.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
