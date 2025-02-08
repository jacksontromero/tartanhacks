"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function HostEventButton() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleClick = () => {
    if (!session) return;
    router.push("/create-event");
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-full bg-primary px-10 py-3 font-semibold text-secondary-foreground shadow-lg transition hover:bg-primary/90"
    >
      Host Event
    </button>
  );
}
