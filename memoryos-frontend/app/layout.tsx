import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, JetBrains_Mono } from "next/font/google";
import { isClerkEnabled } from "@/lib/clerk";
import { DatadogRumInitLoader } from "@/components/observability/datadog-rum-init-loader";
import { GlobalPixelButtonLoader } from "@/components/ui/global-pixel-button-loader";
import { ThemePreferenceRoot } from "@/components/memoryos/theme-preference-root";
import { ClerkRootProvider } from "@/components/auth/clerk-root-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { KernelProvider } from "@/components/providers/kernel-provider";
import { GlobalScrollbar } from "@/components/ui/global-scrollbar";
import { RouteTitleUpdater } from "@/components/layout/route-title-updater";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
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
      { url: "/horos-icon.svg", type: "image/svg+xml" },
      { url: "/horos-icon.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.ico",
    apple: "/horos-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkEnabled = isClerkEnabled();

  return (
    <html lang="en" className={cn(inter.variable, inter.className, plexMono.variable, jetbrainsMono.variable)} suppressHydrationWarning>
      <body>
        <RouteTitleUpdater />
        {process.env.NODE_ENV !== "development" ? (
          <DatadogRumInitLoader />
        ) : null}
        <GlobalScrollbar />
        <KernelProvider>
          <AuthProvider>
          <PostHogProvider>
            <ThemePreferenceRoot>
              {clerkEnabled ? (
                <ClerkRootProvider>{children}</ClerkRootProvider>
              ) : (
                children
              )}
            </ThemePreferenceRoot>
          </PostHogProvider>
          </AuthProvider>
        </KernelProvider>
      </body>
    </html>
  );
}
 
