import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, JetBrains_Mono } from "next/font/google";
import { isClerkEnabled } from "@/lib/clerk";
import { DatadogRumInitLoader } from "@/components/observability/datadog-rum-init-loader";
import { GlobalPixelButtonLoader } from "@/components/ui/global-pixel-button-loader";
import { ThemePreferenceRoot } from "@/components/memoryos/theme-preference-root";
import { ClerkRootProvider } from "@/components/auth/clerk-root-provider";
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
  title: {
    default: "HOROS",
    template: "HOROS | %s",
  },
  description:
    "HOROS is the agent work control plane for AI-native companies: inheritance, control, proof, and outcome learning before and after agent work.",
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
          <ThemePreferenceRoot>
            {clerkEnabled ? (
              <ClerkRootProvider>{children}</ClerkRootProvider>
            ) : (
              children
            )}
          </ThemePreferenceRoot>
        </KernelProvider>
      </body>
    </html>
  );
}
 
