"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pillActionButton } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type ContinuityLabPlaceholderProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ContinuityLabPlaceholder({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: ContinuityLabPlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-5 py-16">
      <p className="text-xs text-[#F0EFE2]/45">Continuity Lab</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#F0EFE2]">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#F0EFE2]/45">{description}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {primaryHref && primaryLabel ? (
          <Link
            href={primaryHref}
            className="inline-flex h-10 items-center gap-2 bg-[#4338CA] px-4 text-sm font-semibold text-[#F0EFE2] hover:bg-[#4f46e5]"
          >
            {primaryLabel}
            <ArrowRight className="size-4" />
          </Link>
        ) : null}
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className={cn(pillActionButton, "h-10 px-4")}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
