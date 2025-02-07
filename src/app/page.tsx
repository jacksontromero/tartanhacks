import Link from "next/link";
import SignInButton from "~/components/auth/SignInButton";
import HostEventButton from "~/components/events/HostEventButton";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1 className="text-4xl font-bold">Where2Eat</h1>
      <div className="flex flex-col gap-4">
        <SignInButton />
        <HostEventButton />
      </div>
    </main>
  );
}
