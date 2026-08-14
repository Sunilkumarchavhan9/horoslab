"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { pillActionButton } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import {
  ASK_ONBOARDING_ADVANCED,
  ASK_ONBOARDING_MAIN,
  deriveAskOnboardingProgress,
  emptyAskOnboardingProgress,
  markAskOnboardingStep,
  type AskOnboardingStepId,
} from "@/lib/continuity-lab/ask-onboarding";

export function ContinuityLabAskChecklist({ variant = "ask" }: { variant?: "home" | "ask" }) {
  const { connector, funnel, sessions } = useContinuityLab();
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const onAskPage = variant === "ask";
  const [progress, setProgress] = useState(emptyAskOnboardingProgress);

  useEffect(() => {
    if (onAskPage) markAskOnboardingStep("ask_codebase");
    setProgress(
      deriveAskOnboardingProgress({
        funnel,
        connector,
        hasSessions: sessions.length > 0,
        onAskPage,
      }),
    );
  }, [funnel, connector, sessions.length, onAskPage]);

  const progressPct = Math.round((progress.doneCount / progress.total) * 100);

  function handleStepClick(id: AskOnboardingStepId) {
    if (id === "explore_advanced") {
      markAskOnboardingStep("explore_advanced");
    }
  }

  function renderStep(
    step: (typeof ASK_ONBOARDING_MAIN)[number],
    done: boolean,
  ) {
    const content = (
      <div
        className={cn(
          "flex items-start gap-3 rounded-md px-1 py-2 transition",
          !done && "hover:bg-white/[0.03]",
          done && "opacity-75",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
            done
              ? "border-sky-500/60 bg-sky-500/20 text-sky-100"
              : "border-white/20 text-white/25",
          )}
        >
          {done ? <Check className="size-3" /> : <Circle className="size-2 fill-current" />}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className={cn("text-sm font-medium", done ? "text-white/70" : "text-sky-400/95")}>
            {step.title}
            {step.strikethrough && !done ? (
              <span className="ml-2 text-xs font-normal text-white/35 line-through">
                {step.strikethrough}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-white/45">{step.description}</p>
        </div>
        {!done && step.href ? (
          <ArrowRight className="mt-1 size-4 shrink-0 text-white/30" />
        ) : null}
      </div>
    );

    if (step.href && !done) {
      return (
        <li key={step.id}>
          <Link href={step.href} onClick={() => handleStepClick(step.id)}>
            {content}
          </Link>
        </li>
      );
    }
    return <li key={step.id}>{content}</li>;
  }

  return (
    <section className="mt-12 w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Get started with MemoryOS</h2>
          <p className="mt-1 text-xs text-white/45">
            {progress.doneCount} of {progress.total} complete
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#1f1f1f]">
            <div
              className="h-full rounded-full bg-sky-500/70 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-white/45">{progressPct}%</span>
        </div>
      </div>

      <ul className="space-y-1">{ASK_ONBOARDING_MAIN.map((s) => renderStep(s, progress.completed[s.id]))}</ul>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-t border-white/[0.06] pt-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/50 hover:text-white/70"
      >
        Advanced
        {advancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {advancedOpen ? (
        <ul className="mt-2 space-y-1">
          {ASK_ONBOARDING_ADVANCED.map((step) =>
            renderStep(step, progress.completed[step.id]),
          )}
        </ul>
      ) : null}

      <div className="pt-4">
        <h3 className="text-sm font-semibold text-white">MemoryOS continuity</h3>
        <p className="mt-1 text-xs text-white/45">Resume context, wiki memory, and session rail.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/continuity-lab" className={cn(pillActionButton, "text-xs")}>
            Load resume context
          </Link>
          <Link href="/continuity-lab/wiki" className={cn(pillActionButton, "text-xs")}>
            Record action memory
          </Link>
          <span className={cn(pillActionButton, "cursor-default text-xs text-white/40")}>
            Continuity rail — open any session
          </span>
        </div>
      </div>
    </section>
  );
}
