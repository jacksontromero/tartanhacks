"use client";

import { signIn } from "next-auth/react";

export default function SignInButtonClient() {
  return (
    <button
      onClick={() => signIn()}
      className="rounded-full bg-secondary px-10 py-3 font-semibold text-secondary-foreground shadow-lg transition hover:bg-secondary/90"
      type="button"
    >
      Sign In
    </button>
  );
}
