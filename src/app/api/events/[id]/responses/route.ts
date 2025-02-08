import { db } from "~/server/db";
import { eventResponses } from "~/server/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const responseSchema = z.object({
  email: z.string().email(),
  dietaryRestrictions: z.array(z.string()),
  preferredCuisines: z.array(z.string()),
  antiPreferredCuisines: z.array(z.string()),
  acceptablePriceRanges: z.array(z.string()),
  comments: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }>; }
) {
  const body = await req.json();

  const result = responseSchema.safeParse(body);

  if (!result.success) {
    return new NextResponse(`Invalid request body ${result.error}`, { status: 400 });
  }

  const response = await db.insert(eventResponses).values({
    eventId: (await params).id,
    email: result.data.email,
    dietaryRestrictions: JSON.stringify(result.data.dietaryRestrictions),
    preferredCuisines: JSON.stringify(result.data.preferredCuisines),
    antiPreferredCuisines: JSON.stringify(result.data.antiPreferredCuisines),
    acceptablePriceRanges: JSON.stringify(result.data.acceptablePriceRanges),
    comments: result.data.comments,
  }).returning();

  return NextResponse.json(response[0]);
}
