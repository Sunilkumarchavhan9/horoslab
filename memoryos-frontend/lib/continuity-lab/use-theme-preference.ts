"use client";

import { useThemePreferenceContext } from "@/components/memoryos/theme-preference-provider";

export function useThemePreference() {
  const context = useThemePreferenceContext();
  if (!context) {
    throw new Error("useThemePreference must be used within ThemePreferenceProvider");
  }
  return context;
}
