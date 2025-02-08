import { auth } from "~/server/auth";
import SignInButtonClient from "./SignInButtonClient";

export default async function SignInButton() {
  const session = await auth();

  return (
    <>
      {session?.user ? (
        <div className="text-lg font-medium text-secondary-foreground">
          Welcome, {session.user.name}!
        </div>
      ) : (
        <SignInButtonClient />
      )}
    </>
  );
}
