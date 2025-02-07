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
  const { title } = body;

  const event = await db.insert(events).values({
    title,
    hostId: session.user.id,
  }).returning();

  return NextResponse.json(event[0]);
}
