"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { ContinuityLabAskChecklist } from "@/components/continuity-lab/ask/continuity-lab-ask-checklist";
import { ContinuityLabAskPrompt } from "@/components/continuity-lab/ask/continuity-lab-ask-prompt";
import { ContinuityLabUnderstandingCheckSheet } from "@/components/continuity-lab/continuity-lab-understanding-check-sheet";
import { readAskMemoryPrefsForSession } from "@/components/continuity-lab/ask/continuity-lab-ask-memory-toggles";
import {
  ContinuityLabRepoSelectModal,
  type RepoOption,
} from "@/components/continuity-lab/continuity-lab-repo-select-modal";
import { ContinuityLabOperationalWorkflows } from "@/components/continuity-lab/continuity-lab-operational-workflows";
import { MemoryosLogoMark } from "@/components/continuity-lab/memoryos-logo-mark";
import { MemoryRealtimeLoopPanel } from "@/components/memoryos/memory-realtime-loop-panel";
import { ContinuityLabWorkspaceOnboarding } from "@/components/continuity-lab/continuity-lab-workspace-onboarding";
import { markAskOnboardingStep } from "@/lib/continuity-lab/ask-onboarding";
import {
  readAskStorage,
  saveAskStorage,
} from "@/lib/continuity-lab/ask-storage";
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
import Link from "next/link";
import { Float, Reveal } from "@/components/landing/motion";

export function ContinuityLabHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const {
    connector,
    canStartSession,
    modelReady,
    refresh,
    openCompanyModelModal,
  } = useContinuityLab();
  const github = connector.payload.github;
  // Debugging: expose connector payload so we can see whether the backend
  // is returning repo data during development. Toggle with ?debug=1 or via
  // the DEV_DEBUG_CONNECTOR env var.
  const showConnectorDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "1";
  const [connectorDebug, setConnectorDebug] = useState<Record<string, unknown> | null>(null);
  const showWorkspaceOnboarding = searchParams.get("select_org") === "true";

  const [prompt, setPrompt] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [repos, setRepos] = useState<string[]>([]);
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [understandingOpen, setUnderstandingOpen] = useState(false);
  const [understandingPrompt, setUnderstandingPrompt] = useState("");

  // Dev-only: if backend provides repos but none are enrolled for this workspace,
  // open the repo selection modal automatically (mirrors Devin flow).
  useEffect(() => {
    const devAutoOpen =
      showConnectorDebug || process.env.NODE_ENV !== "production";
    if (!devAutoOpen) return;
    if (github.repos && github.repos.length > 0 && repos.length === 0) {
      setRepoModalOpen(true);
    }
  }, [github.repos, repos, showConnectorDebug]);

  async function forceSyncConnectors() {
    try {
      setSyncing(true);
      const res = await fetch("/api/connector/github/sync", {
        method: "POST",
        credentials: "include",
      });
      const text = await res.text().catch(() => null);
      if (!res.ok) {
        throw new Error(`Sync failed (${res.status}) ${text ?? ""}`);
      }
      // Refresh provider state after sync
      await refresh();

      // fetch connector for debug and update
      const conn = await fetch("/api/connector", {
        cache: "no-store",
        credentials: "include",
      });
      const json = await conn.json().catch(() => null);
      setConnectorDebug(json);

      setSyncing(false);
      setError(null);
      alert("Connector sync completed and UI refreshed.");
    } catch (err) {
      setSyncing(false);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      alert("Sync failed: " + message);
    }
  }

  const repoOptions: RepoOption[] = useMemo(
    () =>
      github.repos.map((r) => ({
        fullName: r.fullName,
        private: r.private,
        defaultBranch: r.defaultBranch,
        updatedAt: r.updatedAt,
      })),
    [github.repos],
  );

  const primaryRepo = repos[0] ?? github.repos[0]?.fullName ?? null;
  const repoCount = repos.length;
  const projectId = projectIdForLab({
    repoFullName: primaryRepo,
    fallbackProject: "continuity-lab-workspace",
  });

  useEffect(() => {
    const stored = readAskStorage();
    if (stored.repos.length) {
      setRepos(stored.repos);
    } else if (github.repos[0]?.fullName) {
      setRepos([github.repos[0].fullName]);
    }
    const fromQuery = searchParams.get("prefill") ?? searchParams.get("prompt");
    const prefill = fromQuery?.trim() || readPrefillPrompt();
    if (prefill) setPrompt(prefill);
    if (searchParams.get("companyModel") === "1") {
      openCompanyModelModal();
    }
  }, [github.repos, searchParams, openCompanyModelModal]);

  const persistRepos = useCallback((next: string[]) => {
    setRepos(next);
    saveAskStorage({ repos: next });
    const first = next[0];
    if (first) saveResumeProject(projectIdForLab({ repoFullName: first }));
    if (next.length > 0) markAskOnboardingStep("select_repos");
  }, []);

  async function handleInjectResumeBrief() {
    if (!primaryRepo) {
      setError("Select a repository first.");
      return;
    }
    try {
      const brief = await fetchResumeBrief({
        projectId,
        repo: primaryRepo,
        question: prompt.trim() || "What should we continue?",
      });
      if (!brief) {
        setError("No resume brief available yet — sync GitHub memory.");
        return;
      }
      const summary = compactBriefSummary(brief);
      setPrompt((prev) => {
        const base = prev.trim();
        const block = `[Resume brief]\n${summary}`;
        return base ? `${base}\n\n${block}` : block;
      });
    } catch {
      setError("Could not load resume brief");
    }
  }

  function handleAttachWiki() {
    const note = primaryRepo
      ? `[Operational wiki] Scope: ${primaryRepo} — see /continuity-lab/wiki`
      : "[Operational wiki] Open wiki to attach repo context";
    setPrompt((prev) => {
      const base = prev.trim();
      return base ? `${prev}\n\n${note}` : note;
    });
  }

  function requestStartSession() {
    const text = prompt.trim();
    if (!text) {
      setError("Describe what MemoryOS should continue, fix, or ship.");
      return;
    }
    if (!canStartSession) {
      setError(
        "Save your Company Model (OpenRouter key + model) before starting a session.",
      );
      openCompanyModelModal();
      return;
    }
    setError(null);
    if (readConfirmBeforeWork()) {
      setUnderstandingPrompt(text);
      setUnderstandingOpen(true);
      return;
    }
    void runStartSession(text, null);
  }

  async function runStartSession(
    text: string,
    understanding: PromptUnderstandingSummary | null,
  ) {
    setSubmitting(true);
    setError(null);
    try {
      saveResumeProject(projectId);
      saveAskStorage({ repos });
      const memoryPrefs = readAskMemoryPrefsForSession();
      let finalPrompt = text;
      if (memoryPrefs.injectResumeBrief && primaryRepo) {
        const brief = await fetchResumeBrief({
          projectId,
          repo: primaryRepo,
          question: text,
        });
        if (brief) {
          finalPrompt = `${text}\n\n[Resume brief]\n${compactBriefSummary(brief)}`;
        }
      }
      const { sessionPath } = await startLabSessionWithBrief({
        prompt: finalPrompt,
        project: projectId,
        repo: primaryRepo,
        briefQuestion: text,
        useCompanyMemory: memoryPrefs.useCompanyMemory,
        understandingApprovedSummary: understanding,
      });
      markAskOnboardingStep("first_session");
      await refresh();
      router.push(sessionPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setSubmitting(false);
      setUnderstandingOpen(false);
    }
  }

  return (
    <div className="relative flex min-h-full w-full flex-col overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <motion.div
          className="absolute left-1/2 top-[-8rem] h-80 w-80 -translate-x-1/2 rounded-full bg-[#2563EB]/12 blur-3xl"
          animate={reduceMotion ? undefined : { y: [0, 16, 0], scale: [1, 1.06, 1] }}
          transition={reduceMotion ? undefined : { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-6rem] top-[12rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -18, 0], y: [0, 12, 0] }}
          transition={reduceMotion ? undefined : { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[length:100%_56px] opacity-40" />
      </motion.div>

      {showWorkspaceOnboarding ? (
        <ContinuityLabWorkspaceOnboarding />
      ) : (
        <>
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
            <Reveal className="mb-4 flex justify-end" delay={0.05}>
              <button
                type="button"
                onClick={forceSyncConnectors}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white/85 shadow-[0_0_0_1px_rgba(37,99,235,0.08)] transition hover:border-white/15 hover:bg-white/[0.06] disabled:opacity-50"
              >
                <span className="relative flex size-2 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-[#60A5FA]/70 opacity-70 blur-[3px]" />
                  <span className="relative size-1.5 rounded-full bg-[#93C5FD]" />
                </span>
                {syncing ? "Syncing…" : "Force sync connectors"}
              </button>
            </Reveal>
            <div className="flex flex-col items-center text-center">
              <Reveal>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  What should MemoryOS work on?
                </h1>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-3 max-w-lg text-sm text-white/50">
                  Resume work instead of restarting it — continue incidents, PR
                  reviews, and governed agent execution from company memory.
                </p>
              </Reveal>

              <Reveal delay={0.14} className="mt-5">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/continuity-lab/spine"
                    className="group inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/90 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08]"
                  >
                    Open inheritance spine
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/mission-control?view=skills"
                    className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/80 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08]"
                  >
                    Review skills
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <Float className="mt-8">
                  <MemoryosLogoMark size={56} variant="tile" />
                </Float>
              </Reveal>

              <Reveal delay={0.24} className="mt-10 w-full">
                <div className="relative overflow-hidden rounded-md border border-white/10 bg-white/[0.025] p-1 shadow-[0_24px_80px_-32px_rgba(37,99,235,0.28)]">
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#60A5FA] to-transparent"
                    animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
                    transition={reduceMotion ? undefined : { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                  <ContinuityLabAskPrompt
                    value={prompt}
                    onChange={setPrompt}
                    onSubmit={requestStartSession}
                    loading={submitting}
                    repoCount={repoCount}
                    selectedRepos={repos}
                    onOpenRepos={() => setRepoModalOpen(true)}
                    onInjectResumeBrief={() => void handleInjectResumeBrief()}
                    onAttachWiki={handleAttachWiki}
                    copyLinkBase="/continuity-lab"
                    placeholder="Ask MemoryOS to continue work, fix bugs, or ship features…"
                  />
                </div>
                {showConnectorDebug && connectorDebug ? (
                  <pre className="mt-3 max-w-full overflow-auto text-xs text-white/60">
                    {JSON.stringify(connectorDebug, null, 2)}
                  </pre>
                ) : null}
                {error ? (
                  <p className="mt-4 text-center text-sm text-rose-300">
                    {error}
                  </p>
                ) : null}
              </Reveal>

              <Reveal delay={0.32} className="w-full">
                <ContinuityLabOperationalWorkflows
                  projectId={projectId}
                  defaultRepo={primaryRepo}
                  onPrefillPrompt={setPrompt}
                />
              </Reveal>

              <Reveal delay={0.4} className="mt-10 w-full text-left">
                <div className="relative overflow-hidden rounded-md border border-white/10 bg-white/[0.03] shadow-[0_30px_90px_-44px_rgba(15,23,42,0.7)]">
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#60A5FA]/70 to-transparent"
                    animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35], y: [0, 12, 0] }}
                    transition={reduceMotion ? undefined : { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                  <MemoryRealtimeLoopPanel
                    title="Live loop"
                    description="The same canonical event stream that powers the Mission Control runtime."
                    className="border-0 bg-transparent shadow-none"
                  />
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.48} className="mt-10">
              <ContinuityLabAskChecklist variant="home" />
            </Reveal>

            <ContinuityLabRepoSelectModal
              open={repoModalOpen}
              onClose={() => setRepoModalOpen(false)}
              selected={repos}
              onConfirm={persistRepos}
              lastSyncAt={github.lastSyncAt}
              initialRepos={repoOptions}
              description="Choose which GitHub repositories this session can use."
            />

            <ContinuityLabUnderstandingCheckSheet
              open={understandingOpen}
              prompt={understandingPrompt}
              loading={submitting}
              onEdit={() => setUnderstandingOpen(false)}
              onClose={() => setUnderstandingOpen(false)}
              onConfirm={(summary) =>
                void runStartSession(understandingPrompt, summary)
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
