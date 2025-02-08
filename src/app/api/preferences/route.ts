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

    if (!existingPreference) {
        return NextResponse.json({ message: "No preferences found." }, { status: 404 });
    }

    return NextResponse.json(existingPreference, { status: 200 });
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

    const { acceptablePriceRanges, preferredCuisines } = result.data;
    const value = {
        userId: session.user.id,
        acceptablePriceRanges: JSON.stringify(acceptablePriceRanges),
        preferredCuisines: JSON.stringify(preferredCuisines),
        rankedCuisines: JSON.stringify(body.rankedCuisines),
        antiPreferredCuisines: JSON.stringify(body.antiPreferredCuisines),
    };

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
        return NextResponse.json(updated, { status: 200 });
    } else {
        // Insert new record
        const [inserted] = await db
            .insert(preferences)
            .values(value)
            .returning();
        return NextResponse.json(inserted, { status: 201 });
    }
}
