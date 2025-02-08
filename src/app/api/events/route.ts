import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { title, description, date, priceRange, cuisinePreference, dietaryRestrictions } = body;

  const event = await db.insert(events).values({
    title,
    description,
    date: new Date(date),
    priceRange,
    cuisinePreference,
    dietaryRestrictions: dietaryRestrictions ? JSON.stringify(dietaryRestrictions) : null,
    hostId: session.user.id,
  }).returning();

  return NextResponse.json(event[0]);
}
