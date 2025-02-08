import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import InviteForm from "~/components/events/InviteForm";

export default async function InvitePage({
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
        <h1 className="mb-4 text-3xl font-bold text-secondary-foreground">
          Join {event.title}
        </h1>
        <p className="mb-8 text-muted-foreground">
          Help plan this meal by sharing your preferences
        </p>
        <InviteForm
          eventId={event.id}
          availableCuisines={cuisineTypes}
          availablePriceRanges={priceRanges}
        />
      </div>
    </main>
  );
}
