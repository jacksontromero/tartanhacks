import SignOutButton from "~/components/auth/SignOutButton";
import { auth } from "~/server/auth";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b border-secondary bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="text-xl font-semibold text-secondary-foreground">
          Where2Eat
        </div>
        {session?.user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary-foreground">
              {session.user.name}
            </span>
            <SignOutButton />
          </div>
        )}
      </div>
    </nav>
  );
}
