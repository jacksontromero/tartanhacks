import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  // Await the params
  const { id } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1 className="text-4xl font-bold">{event.title}</h1>
      <p className="mt-4">Event ID: {event.id}</p>
    </main>
  );
}
