import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const eventId = (await params).id;

    // Get event to verify host
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event || event.hostId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update event to remove final restaurant
    await db
      .update(events)
      .set({
        finalRestaurantId: null,
        finalRestaurantDetails: null,
      })
      .where(eq(events.id, eventId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unpick restaurant:", error);
    return NextResponse.json(
      { error: "Failed to unpick restaurant" },
      { status: 500 }
    );
  }
}
