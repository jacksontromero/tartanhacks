import { eq } from "drizzle-orm";
import SignInButton from "~/components/auth/SignInButton";
import HostEventButton from "~/components/events/HostEventButton";
import YourEvents from "~/components/events/YourEvents";
import TestInput from "~/components/gemini/TestInput";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";

async function getEvents(userId: string) {
  const myEvents = await db.query.events.findMany({
    where: eq(events.hostId, userId),
    with: {
      responses: true,
    },
  });
  return myEvents;
}

export type EventWithResponses = Awaited<ReturnType<typeof getEvents>>[number];

export default async function HomePage() {

  const session = await auth();

  let events: EventWithResponses[] = [];

  if (session && session.user) {
    events = await getEvents(session.user.id);
  }

  return (
    <main className="flex h-[calc(100vh-66px)] flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-secondary-foreground">
          Where2Eat
        </h1>
        <div className="flex flex-col items-center gap-4">
          <SignInButton />
          {session && <HostEventButton />}
        </div>
        <YourEvents events={events} />
        <TestInput />
      </div>
    </main>
  );
}
