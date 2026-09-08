"use client";

import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { bannerStrip } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type ContinuityLabConnectCodebaseBannerProps = {
  variant?: "home" | "ask";
  className?: string;
};

export function ContinuityLabConnectCodebaseBanner({
  variant = "home",
  className,
}: ContinuityLabConnectCodebaseBannerProps) {
  const isAsk = variant === "ask";

  return (
    <div className={cn(bannerStrip(), className)}>
      <p className="flex min-w-0 flex-1 items-center gap-2 leading-snug">
        <GitBranch className="size-3.5 shrink-0 text-[#F0EFE2]/40" aria-hidden />
        <span>
          {isAsk
            ? "Connect GitHub to scope Ask to your repositories."
            : "Connect GitHub to scope repos and company memory."}
        </span>
      </p>
      <Link
        href="/continuity-lab?select_org=true"
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#F0EFE2]/80 hover:text-[#F0EFE2]"
      >
        Connect GitHub
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

type ContinuityLabConnectCompanyModelBannerProps = {
  onConnect: () => void;
  className?: string;
};

export function ContinuityLabConnectCompanyModelBanner({
  onConnect,
  className,
}: ContinuityLabConnectCompanyModelBannerProps) {
  return (
    <div className={cn(bannerStrip(), className)}>
      <p className="min-w-0 flex-1 leading-snug">
        Add your OpenRouter key so agents can run in Continuity Lab.
      </p>
      <button
        type="button"
        onClick={onConnect}
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#F0EFE2]/80 hover:text-[#F0EFE2]"
      >
        Connect model
        <ArrowRight className="size-3" />
      </button>
    </div>
  );
}
