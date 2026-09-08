"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { MemoryosLogoMark } from "@/components/continuity-lab/memoryos-logo-mark";
import { ContinuityLabAskInput } from "@/components/continuity-lab/continuity-lab-ask-input";
import { ContinuityLabConnectCodebaseBanner } from "@/components/continuity-lab/continuity-lab-connect-codebase-banner";
import { cn } from "@/lib/utils";
import { ContinuityLabUnderstandingCheckSheet } from "@/components/continuity-lab/continuity-lab-understanding-check-sheet";
import { readAskMemoryPrefsForSession } from "@/components/continuity-lab/ask/continuity-lab-ask-memory-toggles";
import {
  ContinuityLabRepoSelectModal,
  type RepoOption,
} from "@/components/continuity-lab/continuity-lab-repo-select-modal";
import { markAskOnboardingStep } from "@/lib/continuity-lab/ask-onboarding";
import { readAskStorage, saveAskStorage, type AskMode } from "@/lib/continuity-lab/ask-storage";
import { readPrefillPrompt } from "@/lib/continuity-lab/prefill-prompt";
import {
  compactBriefSummary,
  fetchResumeBrief,
  projectIdForLab,
} from "@/lib/continuity-lab/resume-brief";
import { saveResumeProject } from "@/lib/continuity-launch-context";
import { readConfirmBeforeWork } from "@/lib/continuity-lab/confirm-before-work";
import type { PromptUnderstandingSummary } from "@/lib/continuity-lab/prompt-understanding-stub";
import { startLabSessionWithBrief } from "@/lib/continuity-lab/sessions";

export function ContinuityLabAsk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connector, canStartSession, refresh, openCompanyModelModal } = useContinuityLab();
  const github = connector.payload.github;

  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<AskMode>("auto");
  const [deep, setDeep] = useState(false);
  const [attachmentNote, setAttachmentNote] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [understandingOpen, setUnderstandingOpen] = useState(false);
  const [understandingPrompt, setUnderstandingPrompt] = useState("");

  const primaryRepo = github.repos[0]?.fullName ?? null;
  const defaultBranch = github.repos[0]?.defaultBranch || "main";
  const projectId = projectIdForLab({
    repoFullName: primaryRepo,
    fallbackProject: "continuity-lab-workspace",
  });

  useEffect(() => {
    const stored = readAskStorage();
    setMode(stored.mode);
    setDeep(stored.deep);
    const fromQuery = searchParams.get("prefill") ?? searchParams.get("prompt");
    const prefill = fromQuery?.trim() || readPrefillPrompt();
    if (prefill) setQuestion(prefill);
  }, [github.repos, searchParams]);

  const persistMode = useCallback((next: AskMode) => {
    setMode(next);
    saveAskStorage({ mode: next });
  }, []);

  const persistDeep = useCallback((next: boolean) => {
    setDeep(next);
    saveAskStorage({ deep: next });
  }, []);

  const persistBranch = useCallback((next: string) => {
    saveAskStorage({ branch: next });
  }, []);

  function requestStartSession() {
    const q = question.trim();
    if (!q) return;
    if (!canStartSession) {
      setError("Save your Company Model before starting a session.");
      openCompanyModelModal();
      return;
    }
    setError(null);
    markAskOnboardingStep("ask_codebase");
    if (readConfirmBeforeWork()) {
      setUnderstandingPrompt(q);
      setUnderstandingOpen(true);
      return;
    }
    void runStartSession(q, null);
  }

  async function runStartSession(q: string, understanding: PromptUnderstandingSummary | null) {
    setStartingSession(true);
    setError(null);
    try {
      saveResumeProject(projectId);
      saveAskStorage({ branch: defaultBranch, mode, deep });
      const memoryPrefs = readAskMemoryPrefsForSession();
      const modeLabel = mode === "qa" ? "Q&A" : mode === "plan" ? "Plan" : "Auto";
      const scopeBlock = [
        "[Ask scope]",
        `Mode: ${deep ? "Deep " : ""}${modeLabel}`,
        primaryRepo ? `Repository: ${primaryRepo}` : null,
        `Branch: ${defaultBranch}`,
      ]
        .filter(Boolean)
        .join("\n");
      let finalPrompt = [q, scopeBlock, attachmentNote].filter(Boolean).join("\n\n");
      if (memoryPrefs.injectResumeBrief && primaryRepo) {
        const brief = await fetchResumeBrief({
          projectId,
          repo: primaryRepo,
          question: q,
        });
        if (brief) {
          finalPrompt = `${finalPrompt}\n\n[Resume brief]\n${compactBriefSummary(brief)}`;
        }
      }
      const { sessionPath } = await startLabSessionWithBrief({
        prompt: finalPrompt,
        project: projectId,
        repo: primaryRepo,
        briefQuestion: q,
        useCompanyMemory: memoryPrefs.useCompanyMemory,
        understandingApprovedSummary: understanding,
      });
      markAskOnboardingStep("first_session");
      await refresh();
      router.push(sessionPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setStartingSession(false);
      setUnderstandingOpen(false);
    }
  }

  return (
    <div className="flex min-h-full w-full flex-col">
      {!github.connected ? (
        <div className="sticky top-0 z-30 w-full shrink-0 border-b border-white/[0.06] bg-[#0f0f0f]/95 backdrop-blur-sm">
          <div className={cn("mx-auto w-full max-w-5xl px-4 py-2 sm:px-6")}>
            <ContinuityLabConnectCodebaseBanner variant="ask" />
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-1 flex-col items-center justify-center pb-20">
        <MemoryosLogoMark className="text-[#F0EFE2]/10" size={68} variant="mark" />
        <h1 className="mt-7 text-center text-2xl font-semibold tracking-tight text-[#F0EFE2]">
          What questions do you have?
        </h1>

        <div className="mt-9 w-full">
          <ContinuityLabAskInput
            value={question}
            onChange={setQuestion}
            mode={mode}
            onModeChange={persistMode}
            deep={deep}
            onDeepChange={persistDeep}
            repo={primaryRepo}
            branch={defaultBranch}
            defaultBranch={defaultBranch}
            onBranchChange={persistBranch}
            onOpenRepoModal={() => {}}
            onSubmit={requestStartSession}
            loading={startingSession}
            placeholder="Ask MemoryOS questions about your code"
            onAttachmentNote={setAttachmentNote}
            showRepoControls={false}
          />

          {attachmentNote ? (
            <p className="mt-2 text-[11px] text-[#F0EFE2]/40">{attachmentNote}</p>
          ) : null}

          {startingSession ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#F0EFE2]/50">
              <Loader2 className="size-4 animate-spin" />
              Starting session…
            </div>
          ) : null}

          {error ? <p className="mt-4 text-center text-sm text-rose-300">{error}</p> : null}
        </div>
      </div>

      <ContinuityLabUnderstandingCheckSheet
        open={understandingOpen}
        prompt={understandingPrompt}
        loading={startingSession}
        onEdit={() => setUnderstandingOpen(false)}
        onClose={() => setUnderstandingOpen(false)}
        onConfirm={(summary) => void runStartSession(understandingPrompt, summary)}
      />

      </div>
    </div>
  );
}
