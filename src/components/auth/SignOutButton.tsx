"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium shadow-sm transition"
      type="button"
    >
      Sign Out
    </button>
  );
}
