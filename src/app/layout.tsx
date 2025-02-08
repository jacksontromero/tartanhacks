import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Navbar from "~/components/nav/Navbar";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "HostTable",
  description: "TartanHacks 2025 Project",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full`}>
      <body className="min-h-full bg-background font-sans antialiased">
        <SessionProvider>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
