import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { IBM_Plex_Mono, Sora, Space_Grotesk } from "next/font/google";
import { isClerkEnabled } from "@/lib/clerk";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MemoryOS | Developer Memory Infrastructure",
  description:
    "MemoryOS helps AI remember developer context across projects, decisions, and workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkEnabled = isClerkEnabled();

  return (
    <html lang="en" className={`${sora.variable} ${spaceGrotesk.variable} ${plexMono.variable}`}>
      <body>{clerkEnabled ? <ClerkProvider>{children}</ClerkProvider> : children}</body>
    </html>
  );
}
