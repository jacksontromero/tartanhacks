"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SavePreferencesButton() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleClick = () => {
    if (!session) return;
    router.push("/save-preference");
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-full bg-primary px-10 py-3 font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
    >
      Save User Preferences
    </button>
  );
}
