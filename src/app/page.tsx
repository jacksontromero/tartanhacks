import SignInButton from "~/components/auth/SignInButton";
import HostEventButton from "~/components/events/HostEventButton";
import PlacesFinder from "~/components/places/placeAPItest";
import { auth } from "~/server/auth";

export default async function HomePage() {

  const session = await auth();

  return (
    <main className="flex h-[calc(100vh-66px)] flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-secondary-foreground">
          Where2Eat
        </h1>
        <div className="flex flex-col items-center gap-4">
          <SignInButton />
          {session && <HostEventButton />}
        </div>
      </div>
    </main>
  );
}
