import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string(),
  priceRanges: z.array(z.string()),
  cuisineTypes: z.array(z.string()),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const result = eventSchema.safeParse(body);

  if (!result.success) {
    return new NextResponse("Invalid request body", { status: 400 });
  }

  const { date, ...rest } = result.data;
  const localDate = new Date(date);
  const utcDate = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate()
  ));

  const event = await db.insert(events).values({
    ...rest,
    date: utcDate,
    hostId: session.user.id,
    priceRanges: JSON.stringify(rest.priceRanges),
    cuisineTypes: JSON.stringify(rest.cuisineTypes),
  }).returning();

  return NextResponse.json(event[0]);
}
