"use client";

import type { ReactNode } from "react";
import { ThemePreferenceProvider } from "@/components/horos/theme-preference-provider";

export function ThemePreferenceRoot({ children }: { children: ReactNode }) {
  return <ThemePreferenceProvider>{children}</ThemePreferenceProvider>;
}
