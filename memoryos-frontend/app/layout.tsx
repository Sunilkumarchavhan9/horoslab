import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { IBM_Plex_Mono, Sora, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { isClerkEnabled } from "@/lib/clerk";
import { DatadogRumInit } from "@/components/observability/datadog-rum-init";
import { GlobalPixelButtonLoader } from "@/components/ui/global-pixel-button-loader";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

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
  title: "memoryos™",
  description:
    "MemoryOS helps AI remember developer context across projects, decisions, and workflows.",
  icons: {
    icon: "/memoryostmlogoofficial.png",
    shortcut: "/memoryostmlogoofficial.png",
    apple: "/memoryostmlogoofficial.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkEnabled = isClerkEnabled();

  return (
    <html lang="en" className={cn(sora.variable, spaceGrotesk.variable, plexMono.variable, "font-mono", jetbrainsMono.variable)}>
      <body>
        <DatadogRumInit />
        <GlobalPixelButtonLoader />
        {clerkEnabled ? (
          <ClerkProvider
            signInUrl="/developer-console/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/developer-console"
            signUpFallbackRedirectUrl="/developer-console"
            prefetchUI={false}
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
