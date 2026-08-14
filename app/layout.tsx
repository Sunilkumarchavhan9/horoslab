import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MythicShell from "../src/components/MythicShell";
import { featureFlags } from "../src/features/featureFlags";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemoryOS",
  description: "MemoryOS session workspace and Devin-style continuity shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {featureFlags.isEnabled("mythic_ui") ? (
          <MythicShell>{children}</MythicShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
