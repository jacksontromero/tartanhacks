import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { preferences } from "~/server/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

const preferencesSchema = z.object({
    dietaryRestrictions: z.array(z.string()),
    acceptablePriceRanges: z.array(z.string()).min(1, {
      message: "Please select at least one price range.",
    }),
    preferredCuisines: z.array(z.string()).min(1, {
      message: "Please select at least one cuisine type.",
    }),
    rankedCuisines: z.array(z.string()),
    antiPreferredCuisines: z.array(z.string()),
});

export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingPreference = await db.query.preferences.findFirst({
        where: eq(preferences.userId, session.user.id),
      });

    return existingPreference;
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const result = preferencesSchema.safeParse(body);

  if (!result.success) {
    return new NextResponse("Invalid request body", { status: 400 });
  }

  const { priceRanges, cuisineTypes } = result.data;
  const value = {
    userId: session.user.id,
    priceRanges: JSON.stringify(priceRanges),
    cuisineTypes: JSON.stringify(cuisineTypes),
    rankedCuisines: JSON.stringify(body.rankedCuisines),
  }
  // Check if a record exists for this user
  const existingPreference = await db.query.preferences.findFirst({
    where: eq(preferences.userId, value.userId),
  });

  if (existingPreference) {
    // Update existing record
    const [updated] = await db
      .update(preferences)
      .set(value)
      .where(eq(preferences.userId, value.userId))
      .returning();
    return updated;
  } else {
    // Insert new record
    const [inserted] = await db
      .insert(preferences)
      .values(value)
      .returning();
    return inserted;
  };
}
