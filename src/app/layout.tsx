import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Navbar from "~/components/nav/Navbar";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "Where2Eat",
  description: "TartanHacks 2025 Project",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="h-screen bg-background font-sans antialiased">
        <Navbar />
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
