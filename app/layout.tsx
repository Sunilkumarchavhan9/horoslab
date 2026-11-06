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
  metadataBase: new URL("https://www.horoslab.org"),
  title: {
    default: "HOROS | Frontier AI Research & Physical Intelligence Infrastructure",
    template: "HOROS | %s",
  },
  description:
    "High-throughput model endpoints, autonomous post-training loops, and physical AI compute for humanoid robotics and aerospace.",
  openGraph: {
    title: "HOROS | Frontier AI Research & Physical Intelligence Infrastructure",
    description:
      "High-throughput model endpoints, autonomous post-training loops, and physical AI compute for humanoid robotics and aerospace.",
    url: "https://www.horoslab.org",
    siteName: "HOROS Lab",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HOROS Lab",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HOROS | Frontier AI Research & Physical Intelligence Infrastructure",
    description:
      "High-throughput model endpoints, autonomous post-training loops, and physical AI compute for humanoid robotics and aerospace.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.ico",
  },
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
