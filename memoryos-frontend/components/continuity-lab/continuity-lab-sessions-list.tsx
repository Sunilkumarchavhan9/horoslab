"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ContinuityLabSessionsBrowser } from "@/components/continuity-lab/continuity-lab-sessions-browser";
import { ContinuityLabBannerStack } from "@/components/continuity-lab/continuity-lab-banner-stack";
import { labMainBg } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

function ContinuityLabSessionsListInner() {
  const searchParams = useSearchParams();
  const automationFilter = searchParams.get("automation")?.trim() ?? "";

  return (
    <div className={cn("flex min-h-full w-full flex-col", labMainBg)}>
      <ContinuityLabBannerStack innerClassName="mx-auto w-full max-w-5xl px-5" />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8 pb-20">
        <nav className="text-xs text-white/45" aria-label="Breadcrumb">
          <Link href="/continuity-lab" className="hover:text-white/70">
            Continuity Lab
          </Link>
          <span className="mx-1.5 text-white/25">/</span>
          <span className="text-white/88">Sessions</span>
        </nav>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">Sessions</h1>
        <div className="mt-6 flex-1">
          <ContinuityLabSessionsBrowser
            variant="standalone"
            automationFilter={automationFilter}
            sessionFetchLimit={100}
          />
        </div>
      </div>
    </div>
  );
}

export function ContinuityLabSessionsList() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-8 text-sm text-white/45">Loading sessions…</div>
      }
    >
      <ContinuityLabSessionsListInner />
    </Suspense>
  );
}
