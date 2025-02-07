"use client";

import { useSession, signIn } from "next-auth/react";

export default function SignInButton() {
  const { data: session } = useSession();

  return (
    <>
      {session ? (
        <div className="mt-4">
          Welcome, {session.user?.name}!
        </div>
      ) : (
        <button
          className="mt-4 rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
          onClick={() => void signIn()}
        >
          Sign In
        </button>
      )}
    </>
  );
}
