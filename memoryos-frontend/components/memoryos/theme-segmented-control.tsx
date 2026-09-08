"use client";

import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/lib/continuity-lab/lab-preferences-storage";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

type ThemeSegmentedControlProps = {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  variant?: "light" | "dark";
  className?: string;
};

export function ThemeSegmentedControl({
  value,
  onChange,
  variant = "dark",
  className,
}: ThemeSegmentedControlProps) {
  const dark = variant === "dark";

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "grid grid-cols-3 gap-0.5 rounded-md p-0.5",
        dark ? "bg-white/[0.06]" : "bg-[#F3F4F6]",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium transition",
              active
                ? dark
                  ? "bg-white/[0.12] text-[#F0EFE2] shadow-sm"
                  : "bg-white text-[#111827] shadow-sm"
                : dark
                  ? "text-[#F0EFE2]/55 hover:text-[#F0EFE2]/80"
                  : "text-[#6B7280] hover:text-[#111827]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
