import Link from "next/link";
import SignOutButton from "~/components/auth/SignOutButton";
import { auth } from "~/server/auth";
import SavePreferencesButton from "~/components/preferenceRanks/SavePreferencesButton"

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b border-secondary bg-white">
      <div className="min-w-full mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-semibold text-secondary-foreground hover:text-secondary-foreground/80 transition"
        >
          HostTable
        </Link>

        {session?.user && (
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-secondary-foreground">
              {session.user.name}
            </span>
            {session && <SavePreferencesButton />}
            <SignOutButton />
          </div>
        )}
      </div>
    </nav>
  );
}
