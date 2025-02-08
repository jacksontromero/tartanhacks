// src/app/api/notify/route.ts
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { events, users } from '~/server/db/schema';
import { sendRSVPNotification } from '~/lib/notifications';
import { eq } from "drizzle-orm";

interface EventDetails {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  hostEmail: string;
  hostName: string;
}

async function getEventDetails(eventId: string): Promise<EventDetails> {
  try {
    const result = await db
      .select({
        eventId: events.id,
        eventTitle: events.title,
        eventDate: events.date,
        hostEmail: users.email,
        hostName: users.name,
      })
      .from(events)
      .leftJoin(users, eq(events.hostId, users.id))
      .where(eq(events.id, eventId))
      .limit(1);

    if (!result[0]) {
      throw new Error('Event not found');
    }
    return result[0] as EventDetails;
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw new Error('Failed to fetch event details');
  }
}

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();

    // Update or create RSVP
    const { eventTitle, eventDate, hostEmail, hostName } = await getEventDetails(eventId);

    // Send notification to host
    await sendRSVPNotification({
      eventTitle,
      eventDate,
      hostEmail,
      hostName
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
