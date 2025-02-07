"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function HostEventButton() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleCreateEvent = async () => {
    if (!session) return;

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Event", // We'll make this dynamic later
        }),
      });

      const data = await response.json();
      router.push(`/event/${data.id}`);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  return (
    <button
      onClick={handleCreateEvent}
      className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
    >
      Host Event
    </button>
  );
}
