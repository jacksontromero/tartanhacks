import { db } from "~/server/db";
import { eventResponses } from "~/server/db/schema";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();

    const response = await db.insert(eventResponses).values({
      eventId: (await params).id,
      email: body.email,
      dietaryRestrictions: JSON.stringify(body.dietaryRestrictions),
      preferredCuisines: JSON.stringify(body.preferredCuisines),
      rankedCuisines: JSON.stringify(body.rankedCuisines),
      antiPreferredCuisines: JSON.stringify(body.antiPreferredCuisines),
      acceptablePriceRanges: JSON.stringify(body.acceptablePriceRanges),
      comments: body.comments,
    }).returning();

    return NextResponse.json(response[0]);
  } catch (error) {
    console.error("Server error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
