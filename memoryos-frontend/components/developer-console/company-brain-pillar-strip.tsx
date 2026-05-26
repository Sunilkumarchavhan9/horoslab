"use client";

import type { CompanyBrainPillarId } from "@/lib/company-brain";
import { COMPANY_BRAIN_PILLARS } from "@/lib/company-brain";
import { cn } from "@/lib/utils";

export function CompanyBrainPillarStrip({
  pillars,
  purpose,
  executionTier,
  className,
}: {
  pillars: CompanyBrainPillarId[];
  purpose?: string;
  executionTier?: "live" | "partial" | "planned";
  className?: string;
}) {
  const pillarSet = new Set(pillars);

  return (
    <div
      className={cn(
        "rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
          Company Brain
        </span>
        {executionTier ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              executionTier === "live"
                ? "bg-[#D1FAE5] text-[#065F46]"
                : executionTier === "partial"
                  ? "bg-[#FEF3C7] text-[#92400E]"
                  : "bg-[#F3F4F6] text-[#6B7280]",
            )}
          >
            {executionTier === "live" ? "Live data" : executionTier === "partial" ? "Partial" : "Planned"}
          </span>
        ) : null}
        {COMPANY_BRAIN_PILLARS.map((pillar) => (
          <span
            key={pillar.id}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              pillarSet.has(pillar.id)
                ? "border-[#111827] bg-[#111827] text-white"
                : "border-[#E5E7EB] bg-white text-[#9CA3AF]",
            )}
            title={pillar.short}
          >
            {pillar.label}
          </span>
        ))}
      </div>
      {purpose ? (
        <p className="mt-2 text-xs leading-5 text-[#6B7280]">{purpose}</p>
      ) : null}
    </div>
  );
}
