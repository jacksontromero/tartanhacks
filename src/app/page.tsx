import Link from "next/link";
import SignInButton from "~/components/auth/SignInButton";
import HostEventButton from "~/components/events/HostEventButton";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-secondary-foreground">
          Where2Eat
        </h1>
        <div className="flex flex-col items-center gap-4">
          <SignInButton />
          <HostEventButton />
        </div>
      </div>
    </main>
  );
}
