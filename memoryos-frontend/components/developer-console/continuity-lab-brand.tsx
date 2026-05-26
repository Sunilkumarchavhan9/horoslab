"use client";

import { MemoryStarLogo } from "@/components/landing/memory-star-logo";

/** Sidebar brand block — logo + labels stacked so nothing clips in 260px rail. */
export function ContinuityLabBrandMark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="max-w-[160px] overflow-hidden">
        <span className="inline-flex origin-left scale-[0.68]">
          <MemoryStarLogo tone="white" />
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="w-full max-w-[200px] overflow-hidden">
        <span className="inline-flex origin-left scale-[0.82]">
          <MemoryStarLogo tone="white" />
        </span>
      </div>
      <div className="border-t border-white/10 pt-3">
        <p className="text-sm font-medium leading-snug text-[#ececec]">Continuity Lab</p>
        <p className="mt-0.5 text-xs leading-snug text-[#8e8e8e]">Company Brain</p>
      </div>
    </div>
  );
}
