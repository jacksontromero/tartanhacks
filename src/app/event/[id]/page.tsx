import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import CopyInviteButton from "~/components/events/CopyInviteButton";
import RankedRestaurants from "~/components/rankings/RankedRestaurants";
import { getRankingsForEvent } from "~/lib/ranking";
import { auth } from "~/server/auth";
import { INVERSE_CUISINE_MAPPINGS } from "~/constants/cuisines";

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
  let finalRestaurant = null;
  let data = null;

  // If there's a final restaurant, create a HostDetails object for it
  if (event.finalRestaurantDetails) {
    finalRestaurant = {
      restaraunt: event.finalRestaurantDetails,
      score: 0, // Score doesn't matter for final selection
      ProsCons: ""
    };
  }

  // Only fetch rankings if we're the host and no final restaurant is selected
  if (isHost && !finalRestaurant) {
    try {
      data = await getRankingsForEvent(id);
      rankings = data.rankings;
    } catch (error) {
      console.log("No rankings available yet");
    }
  }

  // Parse JSON strings back to arrays
  const priceRanges = JSON.parse(event.priceRanges) as string[];
  const cuisineTypes = JSON.parse(event.cuisineTypes) as string[];

  if (!data && !finalRestaurant && isHost) return <div>Loading...</div>;

  return (
    <main className="bg-background min-h-screen">
      <div className="w-full p-8">
        <div className="flex gap-12 w-full justify-around">
          {/* Event Details Card - Keep consistent width */}
          <div className="w-[300px] flex-shrink-0 rounded-lg bg-white p-8 shadow-lg">
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

            {!finalRestaurant && (
              <>
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
            {/* Metadata Card */}{
              isHost && rankings && rankings.length > 0 && (
                <div className="mt-8 p-6 bg-secondary/30 rounded-lg">
                  <h2 className="text-xl font-semibold text-primary mb-4">Event Overview</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {data.totalParticipants} {data.totalParticipants === 1 ? 'Response' : 'Responses'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-primary">Top Cuisine Preferences</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.overallPreferences.preferred_cuisines.map(cuisine => (
                          <span key={cuisine} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {INVERSE_CUISINE_MAPPINGS[cuisine]}
                          </span>
                        ))}
                      </div>
                    </div>
                    {data.overallPreferences.antiPreferred_cuisines.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-primary">Cuisines to Avoid</h3>
                        <div className="flex flex-wrap gap-2">
                          {data.overallPreferences.antiPreferred_cuisines.map(cuisine => (
                            <span key={cuisine} className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                              {INVERSE_CUISINE_MAPPINGS[cuisine]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.overallPreferences.dietaryRestrictions.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-primary">Dietary Restrictions</h3>
                        <div className="flex flex-wrap gap-2">
                          {data.overallPreferences.dietaryRestrictions.map(restriction => (
                            <span key={restriction} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                              {restriction}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

          {/* Restaurant Section - Keep consistent width */}
          {(isHost || finalRestaurant) && (
            <div className="flex-1">
              <h2 className="mb-8 text-3xl font-bold text-primary">
                {finalRestaurant ? 'Selected Restaurant' : 'Restaurant Rankings'}
              </h2>

              {finalRestaurant ? (
                <RankedRestaurants
                  rankings={[]}
                  eventId={event.id}
                  finalRestaurant={finalRestaurant}
                />
              ) : rankings && rankings.length > 0 ? (
                <RankedRestaurants
                  rankings={rankings}
                  eventId={event.id}
                />
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
