import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { events, eventResponses } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendFinalRestaurantNotification } from "~/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { restaurant } = await req.json();
    const eventId = (await params).id;

    // Get event to verify host
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event || event.hostId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update event with final restaurant
    await db
      .update(events)
      .set({
        finalRestaurantId: restaurant.place_id,
        finalRestaurantDetails: restaurant,
      })
      .where(eq(events.id, eventId));

    // Get all responses to notify guests
    const responses = await db.query.eventResponses.findMany({
      where: eq(eventResponses.eventId, eventId),
    });

    // Send notifications to all guests
    await Promise.all(
      responses.map((response) =>
        sendFinalRestaurantNotification({
          guestEmail: response.email,
          guestName: response.name,
          eventName: event.title,
          eventDate: event.date,
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.address,
          restaurantWebsite: restaurant.website,
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to select restaurant:", error);
    return NextResponse.json(
      { error: "Failed to select restaurant" },
      { status: 500 }
    );
  }
}
