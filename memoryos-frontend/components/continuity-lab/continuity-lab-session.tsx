"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useContinuityLabIframe } from "@/components/continuity-lab/use-continuity-lab-iframe";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";

type ContinuityLabSessionProps = {
  conversationId: string;
};

export function ContinuityLabSession({ conversationId }: ContinuityLabSessionProps) {
  const { modelReady, openCompanyModelModal } = useContinuityLab();
  const { iframeRef, labSrc, launchContext, onIframeLoad } = useContinuityLabIframe(conversationId);

  const repoLabel = launchContext?.repo ?? "No repo scoped";
  const sessionLabel =
    launchContext?.project ??
    (conversationId && conversationId !== "new"
      ? `Session ${conversationId.slice(0, 8)}`
      : "Session");

  return (
    <div className="continuity-lab-session-root flex h-full min-h-0 flex-col" suppressHydrationWarning>
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[#2F2F2F] bg-[#0A0A0A] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/continuity-lab"
            className="inline-flex size-8 shrink-0 items-center justify-center border border-[#3A3A3A] text-[#F0EFE2]/70 hover:bg-[#141414] hover:text-[#F0EFE2]"
            aria-label="Back to Continuity Lab home"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#F0EFE2]">{sessionLabel}</p>
            <p className="truncate text-[10px] text-[#F0EFE2]/45">{repoLabel}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openCompanyModelModal}
            className={
              modelReady
                ? "hidden h-8 items-center border border-emerald-500/40 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-200 sm:inline-flex"
                : "inline-flex h-8 items-center border border-amber-500/40 bg-amber-500/10 px-2.5 text-[11px] font-semibold text-amber-100"
            }
          >
            {modelReady ? "Model ready" : "Set Company Model"}
          </button>
          <Link
            href="/mission-control"
            className="hidden h-8 items-center border border-[#3A3A3A] px-2.5 text-[11px] font-semibold text-[#F0EFE2] sm:inline-flex"
          >
            Mission Control
          </Link>
        </div>
      </header>

      {launchContext?.briefSummary ? (
        <div className="border-b border-[#4338CA]/40 bg-[#4338CA]/15 px-4 py-2 text-xs leading-5 text-indigo-100">
          Brief: {launchContext.briefSummary.slice(0, 200)}
          {launchContext.briefSummary.length > 200 ? "…" : ""}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <iframe
          ref={iframeRef}
          title="MemoryOS Continuity Labs"
          src={labSrc}
          className="absolute inset-0 size-full border-0"
          allow="clipboard-read; clipboard-write"
          onLoad={onIframeLoad}
        />
      </div>
    </div>
  );
}
