"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition hover:bg-secondary/90"
      type="button"
    >
      Sign Out
    </button>
  );
}
