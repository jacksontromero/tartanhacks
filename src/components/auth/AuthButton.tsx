"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  return (
    <button
      onClick={() => (session ? signOut() : signIn())}
      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium shadow-sm transition"
      type="button"
    >
      {session ? "Sign Out" : "Sign In"}
    </button>
  );
}
