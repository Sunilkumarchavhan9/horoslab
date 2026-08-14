"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Info, Loader2 } from "lucide-react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { ContinuityLabAskPrompt } from "@/components/continuity-lab/ask/continuity-lab-ask-prompt";
import {
  ContinuityLabRepoSelectModal,
  type RepoOption,
} from "@/components/continuity-lab/continuity-lab-repo-select-modal";
import {
  ASK_ADVANCED_SECTIONS,
  BATCH_SESSIONS_EXAMPLE_PROMPT,
  type AskAdvancedSectionId,
} from "@/lib/continuity-lab/ask-advanced";
import { markAskOnboardingStep } from "@/lib/continuity-lab/ask-onboarding";
import { readAskStorage, saveAskStorage } from "@/lib/continuity-lab/ask-storage";
import { readAskMemoryPrefsForSession } from "@/components/continuity-lab/ask/continuity-lab-ask-memory-toggles";
import { readPrefillPrompt, savePrefillPrompt } from "@/lib/continuity-lab/prefill-prompt";
import { projectIdForLab } from "@/lib/continuity-lab/resume-brief";
import { saveResumeProject } from "@/lib/continuity-launch-context";
import { startLabSessionWithBrief } from "@/lib/continuity-lab/sessions";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

export function ContinuityLabAskAdvanced() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connector, canStartSession, refresh, openCompanyModelModal } = useContinuityLab();
  const github = connector.payload.github;

  const initialSection =
    (searchParams.get("section") as AskAdvancedSectionId | null) ?? "batch";
  const [activeSection, setActiveSection] = useState<AskAdvancedSectionId>(
    ASK_ADVANCED_SECTIONS.some((s) => s.id === initialSection) ? initialSection : "batch",
  );
  const [prompt, setPrompt] = useState(BATCH_SESSIONS_EXAMPLE_PROMPT);
  const [repos, setRepos] = useState<string[]>([]);
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const active = ASK_ADVANCED_SECTIONS.find((s) => s.id === activeSection) ?? ASK_ADVANCED_SECTIONS[0];

  useEffect(() => {
    markAskOnboardingStep("explore_advanced");
    const stored = readAskStorage();
    if (stored.repos.length) {
      setRepos(stored.repos);
    } else if (github.repos[0]?.fullName) {
      setRepos([github.repos[0].fullName]);
    }
    const prefill = readPrefillPrompt();
    if (prefill) setPrompt(prefill);
  }, [github.repos]);

  useEffect(() => {
    const fromQuery = searchParams.get("prefill");
    if (fromQuery?.trim()) setPrompt(fromQuery.trim());
    const section = searchParams.get("section") as AskAdvancedSectionId | null;
    if (section && ASK_ADVANCED_SECTIONS.some((s) => s.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleReposConfirm = useCallback((next: string[]) => {
    setRepos(next);
    saveAskStorage({ repos: next });
    const first = next[0];
    if (first) saveResumeProject(projectIdForLab({ repoFullName: first }));
  }, []);

  async function handleStartSession(overridePrompt?: string) {
    const text = (overridePrompt ?? prompt).trim();
    if (!text) return;
    if (!canStartSession) {
      setError("Save your Company Model before starting a session.");
      openCompanyModelModal();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const projectId = projectIdForLab({
        repoFullName: primaryRepo,
        fallbackProject: "continuity-lab-workspace",
      });
      saveResumeProject(projectId);
      const memoryPrefs = readAskMemoryPrefsForSession();
      const { sessionPath } = await startLabSessionWithBrief({
        prompt: text,
        project: projectId,
        repo: primaryRepo,
        briefQuestion: text,
        useCompanyMemory: memoryPrefs.useCompanyMemory,
      });
      await refresh();
      router.push(sessionPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setSubmitting(false);
    }
  }

  function useCard(card: (typeof active.cards)[number]) {
    if (card.href && !card.prompt) {
      router.push(card.href);
      return;
    }
    if (card.prompt) {
      setPrompt(card.prompt);
      savePrefillPrompt(card.prompt);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/continuity-lab"
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-white/55 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to Sessions
      </Link>

      <div className={cn(subtlePanel(), "mb-6 flex border-[#4338CA]/35 bg-[#4338CA]/10 px-4 py-3 text-sm text-white/80")}>
        <Info className="mr-3 mt-0.5 size-4 shrink-0 text-indigo-300" />
        <p>
          Every session uses MemoryOS continuity — resume context, governance, and company
          memory. MCP connectors extend reach to Slack, Jira, and GitHub; OpenHands sandbox is
          for execution only.
        </p>
      </div>

      <div className="mb-8 max-w-3xl">
        <ContinuityLabAskPrompt
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => void handleStartSession()}
          loading={submitting}
          repoCount={repos.length || github.repos.length || 0}
          onOpenRepos={() => setRepoModalOpen(true)}
          placeholder={
            activeSection === "batch"
              ? BATCH_SESSIONS_EXAMPLE_PROMPT
              : "Describe what MemoryOS should work on…"
          }
          hideContextBar
        />
        {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
        <nav className="shrink-0 lg:w-56">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Capabilities
          </p>
          <ul className="space-y-0.5">
            {ASK_ADVANCED_SECTIONS.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition",
                    activeSection === section.id
                      ? "bg-[#4338CA]/20 font-medium text-white"
                      : "text-white/60 hover:bg-[#141414] hover:text-white",
                  )}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-white">{active.label}</h2>
          <p className="mt-1 text-xs text-white/45">Pick a capability card to prefill or start a session.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.cards.map((card) => (
              <article
                key={card.id}
                className={cn(subtlePanel(), "flex flex-col p-4 transition hover:bg-[#222222]")}
              >
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-white/50">
                  {card.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {card.prompt ? (
                    <button
                      type="button"
                      onClick={() => useCard(card)}
                      className="inline-flex h-8 items-center gap-1 rounded-md bg-white px-3 text-xs font-semibold text-[#0A0A0A] hover:bg-white/90"
                    >
                      Use prompt
                    </button>
                  ) : null}
                  {card.href ? (
                    <Link
                      href={card.href}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#3A3A3A] px-3 text-xs text-white/80 hover:bg-[#141414]"
                    >
                      Open
                      <ArrowRight className="size-3" />
                    </Link>
                  ) : null}
                  {card.prompt ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleStartSession(card.prompt)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[#4338CA] px-3 text-xs text-indigo-200 hover:bg-[#4338CA]/15 disabled:opacity-40"
                    >
                      {submitting ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <ArrowRight className="size-3" />
                      )}
                      Start session
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <ContinuityLabRepoSelectModal
        open={repoModalOpen}
        onClose={() => setRepoModalOpen(false)}
        selected={repos}
        onConfirm={handleReposConfirm}
        lastSyncAt={github.lastSyncAt}
        initialRepos={repoOptions}
      />
    </div>
  );
}
