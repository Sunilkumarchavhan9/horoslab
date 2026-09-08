"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { bannerStrip } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type BannerVariant = "default" | "stickyStrip" | "devinBlue";

type ContinuityLabMcpInfoBannerProps = {
  className?: string;
  variant?: BannerVariant;
};

function isStickyStripVariant(variant: BannerVariant): boolean {
  return variant === "stickyStrip" || variant === "devinBlue";
}

export function ContinuityLabMcpInfoBanner({
  className,
  variant = "default",
}: ContinuityLabMcpInfoBannerProps) {
  const isStickyStrip = isStickyStripVariant(variant);

  return (
    <div
      className={cn(
        isStickyStrip
          ? "flex w-full min-w-0 items-center justify-center gap-2 overflow-hidden text-[13px] leading-none text-[#F0EFE2] sm:text-sm"
          : bannerStrip(),
        className,
      )}
    >
      <Info
        className={cn("size-3.5 shrink-0", isStickyStrip ? "text-[#F0EFE2]/90" : "text-[#F0EFE2]/40")}
        aria-hidden
      />
      <span
        className={cn(
          isStickyStrip && "min-w-0 truncate max-sm:leading-tight",
        )}
      >
        MCP connectors are built in — manage Slack, Jira, and GitHub in{" "}
        <Link
          href="/continuity-lab/settings"
          className={cn(
            "underline-offset-2 hover:underline",
            isStickyStrip ? "text-[#F0EFE2]" : "text-[#F0EFE2]/80",
          )}
        >
          settings
        </Link>
        . Continuity runs on every session.
      </span>
    </div>
  );
}
