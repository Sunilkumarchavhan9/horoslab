"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContinuityLabAskInput } from "@/components/continuity-lab/continuity-lab-ask-input";
import { ContinuityLabCollapsibleAskShell } from "@/components/continuity-lab/continuity-lab-collapsible-ask-shell";
import {
  ContinuityLabRepoSelectModal,
  type RepoOption,
} from "@/components/continuity-lab/continuity-lab-repo-select-modal";
import { runAsk } from "@/lib/continuity-lab/ask-api";
import { readAskStorage, saveAskStorage, type AskMode } from "@/lib/continuity-lab/ask-storage";
import { savePrefillPrompt } from "@/lib/continuity-lab/prefill-prompt";
import { projectIdFromRepo } from "@/lib/continuity-lab/company-model";
import { saveResumeProject } from "@/lib/continuity-launch-context";

type WikiAskBarProps = {
  repoFullName: string;
  defaultBranch: string;
  projectId: string;
  githubConnected: boolean;
  repoOptions: RepoOption[];
  lastSyncAt: string | null;
};

export function WikiAskBar({
  repoFullName,
  defaultBranch,
  projectId,
  githubConnected,
  repoOptions,
  lastSyncAt,
}: WikiAskBarProps) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<AskMode>("auto");
  const [deep, setDeep] = useState(false);
  const [branch, setBranch] = useState(defaultBranch);
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = readAskStorage();
    setMode(stored.mode);
    setDeep(stored.deep);
    setBranch(stored.branch || defaultBranch);
  }, [defaultBranch]);

  const persistPrefs = useCallback((partial: Parameters<typeof saveAskStorage>[0]) => {
    saveAskStorage(partial);
  }, []);

  async function handleSubmit() {
    const q = question.trim();
    if (!q || !githubConnected) return;
    setLoading(true);
    try {
      saveResumeProject(projectId);
      persistPrefs({ repos: [repoFullName], branch, mode, deep });
      await runAsk({
        projectId,
        question: q,
        repo: repoFullName,
        repos: [repoFullName],
        mode,
        deep,
      });
      savePrefillPrompt(q);
      router.push("/continuity-lab/ask");
    } catch {
      savePrefillPrompt(q);
      router.push("/continuity-lab/ask");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ContinuityLabCollapsibleAskShell
      scope="wiki"
      layout="floating"
      expandLabel={`Ask about ${repoFullName}`}
      header={
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Ask about {repoFullName}
        </p>
      }
      footer={
        <ContinuityLabRepoSelectModal
          open={repoModalOpen}
          onClose={() => setRepoModalOpen(false)}
          selected={[repoFullName]}
          onConfirm={(repos) => {
            const first = repos[0];
            if (first) {
              router.push(
                `/continuity-lab/wiki/${encodeURIComponent(projectIdFromRepo(first))}`,
              );
            }
          }}
          lastSyncAt={lastSyncAt}
          initialRepos={repoOptions}
        />
      }
    >
      <ContinuityLabAskInput
        value={question}
        onChange={setQuestion}
        mode={mode}
        onModeChange={(next) => {
          setMode(next);
          persistPrefs({ mode: next });
        }}
        deep={deep}
        onDeepChange={(next) => {
          setDeep(next);
          persistPrefs({ deep: next });
        }}
        repo={repoFullName}
        branch={branch}
        defaultBranch={defaultBranch}
        onBranchChange={(next) => {
          setBranch(next);
          persistPrefs({ branch: next });
        }}
        onOpenRepoModal={() => setRepoModalOpen(true)}
        onSubmit={() => void handleSubmit()}
        loading={loading}
        disabled={!githubConnected}
      />
    </ContinuityLabCollapsibleAskShell>
  );
}
