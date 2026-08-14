import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { isClerkEnabled } from "@/lib/clerk";
import { DatadogRumInitLoader } from "@/components/observability/datadog-rum-init-loader";
import { GlobalPixelButtonLoader } from "@/components/ui/global-pixel-button-loader";
import { ThemePreferenceRoot } from "@/components/memoryos/theme-preference-root";
import { ClerkRootProvider } from "@/components/auth/clerk-root-provider";
import { KernelProvider } from "@/components/providers/kernel-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Epoch",
  description:
    "Epoch is the agent work control plane for AI-native companies: inheritance, control, proof, and outcome learning before and after agent work.",
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
    <html lang="en" className={cn(sora.variable, spaceGrotesk.variable, plexMono.variable, jetbrainsMono.variable)} suppressHydrationWarning>
      <body>
        {process.env.NODE_ENV !== "development" ? (
          <DatadogRumInitLoader />
        ) : null}
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
