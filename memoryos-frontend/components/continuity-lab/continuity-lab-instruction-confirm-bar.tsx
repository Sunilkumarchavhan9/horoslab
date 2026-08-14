"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  CONFIRM_BEFORE_WORK_CHANGED,
  readConfirmBeforeWork,
  saveConfirmBeforeWork,
} from "@/lib/continuity-lab/confirm-before-work";
import { bannerStrip } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type BannerVariant = "default" | "stickyStrip" | "devinBlue";

type ContinuityLabInstructionConfirmBarProps = {
  className?: string;
  variant?: BannerVariant;
};

function isStickyStripVariant(variant: BannerVariant): boolean {
  return variant === "stickyStrip" || variant === "devinBlue";
}

export function ContinuityLabInstructionConfirmBar({
  className,
  variant = "default",
}: ContinuityLabInstructionConfirmBarProps) {
  const isStickyStrip = isStickyStripVariant(variant);
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEnabled(readConfirmBeforeWork());
    setHydrated(true);
    function onChanged() {
      setEnabled(readConfirmBeforeWork());
    }
    window.addEventListener(CONFIRM_BEFORE_WORK_CHANGED, onChanged);
    return () => window.removeEventListener(CONFIRM_BEFORE_WORK_CHANGED, onChanged);
  }, []);

  function handleToggle(next: boolean) {
    setEnabled(next);
    saveConfirmBeforeWork(next);
  }

  const stickyStripLayoutClass =
    "grid w-full min-w-0 grid-cols-[1fr_auto_1fr] items-center overflow-hidden text-[13px] leading-none text-white sm:text-sm";

  if (!hydrated) {
    return (
      <div
        className={cn(
          isStickyStrip ? cn(stickyStripLayoutClass, "h-9 opacity-0") : bannerStrip(),
          !isStickyStrip && "opacity-0",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        isStickyStrip ? stickyStripLayoutClass : bannerStrip(),
        className,
      )}
    >
      {isStickyStrip ? <div aria-hidden /> : null}
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 overflow-hidden",
          isStickyStrip ? "justify-center" : "min-w-0 flex-1",
        )}
      >
        <ClipboardCheck
          className={cn("size-3.5 shrink-0", isStickyStrip ? "text-white/90" : "text-white/40")}
          aria-hidden
        />
        <p
          className={cn(
            "min-w-0 max-sm:leading-tight",
            isStickyStrip && "truncate text-center",
          )}
        >
          <span className={isStickyStrip ? "text-white" : "text-white/80"}>
            Confirm understanding before work
          </span>
          <span
            className={cn(
              "hidden sm:inline",
              isStickyStrip ? "text-white/85" : "text-white/45",
            )}
          >
            {" "}
            — review a short summary before the agent runs
          </span>
        </p>
      </div>
      <label
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center gap-2",
          isStickyStrip ? "justify-self-end" : undefined,
        )}
      >
        <span className={cn("text-[11px]", isStickyStrip ? "text-white/85" : "text-white/50")}>
          {enabled ? "On" : "Off"}
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          className={
            isStickyStrip
              ? "data-checked:bg-white/40 data-unchecked:bg-white/20"
              : "data-checked:bg-white/25 data-unchecked:bg-white/10"
          }
          aria-label="Confirm understanding before work"
        />
      </label>
    </div>
  );
}
