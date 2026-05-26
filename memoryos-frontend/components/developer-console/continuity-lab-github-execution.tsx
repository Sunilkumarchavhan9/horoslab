"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrCreateMemoryTokenWithRetry } from "@/lib/memory-token";

type GitHubExecutionKind = "issue_comment" | "brief_file_commit" | "pull_request";

type RepoOption = {
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
};

type Proposal = {
  id: string;
  kind: GitHubExecutionKind;
  owner: string;
  repo: string;
  issueNumber: number | null;
  body: string;
  status: string;
  githubResultUrl: string | null;
  error: string | null;
};

const KIND_LABELS: Record<GitHubExecutionKind, string> = {
  issue_comment: "Comment",
  brief_file_commit: "Brief commit",
  pull_request: "Pull request",
};

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getOrCreateMemoryTokenWithRetry({ attempts: 2, delayMs: 200 });
  if (!token) throw new Error("Missing auth token");
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export function ContinuityLabGitHubExecution({
  githubConnected,
  suggestedBody,
}: {
  githubConnected: boolean;
  suggestedBody?: string;
}) {
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [kind, setKind] = useState<GitHubExecutionKind>("issue_comment");
  const [issueNumber, setIssueNumber] = useState("1");
  const [body, setBody] = useState(suggestedBody ?? "");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = repos.find((r) => r.fullName === selectedRepo);

  useEffect(() => {
    if (suggestedBody && !body) setBody(suggestedBody);
  }, [suggestedBody, body]);

  const loadRepos = useCallback(async () => {
    try {
      const res = await authFetch("/api/connector/github/repos?limit=50");
      if (!res.ok) return;
      const payload = (await res.json()) as { data?: { repos?: RepoOption[] } };
      const list = payload.data?.repos ?? [];
      setRepos(list);
      setSelectedRepo((prev) => prev || list[0]?.fullName || "");
    } catch {
      // best-effort
    }
  }, []);

  const loadProposals = useCallback(async () => {
    try {
      const res = await authFetch("/api/connector/github/execution/proposals");
      if (!res.ok) return;
      const payload = (await res.json()) as { data?: { proposals?: Proposal[] } };
      setProposals(payload.data?.proposals ?? []);
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    if (!githubConnected) return;
    void loadRepos();
    void loadProposals();
  }, [githubConnected, loadRepos, loadProposals]);

  if (!githubConnected) {
    return (
      <p className="text-xs text-[#8e8e8e]">Connect GitHub to propose write-back from the lab.</p>
    );
  }

  async function propose() {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await authFetch("/api/connector/github/execution/propose", {
        method: "POST",
        body: JSON.stringify({
          kind,
          owner: selected.owner,
          repo: selected.name,
          issueNumber: kind === "issue_comment" ? Number(issueNumber) : undefined,
          body: body.trim(),
          baseBranch: selected.defaultBranch,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: { message?: string } };
      if (!res.ok) throw new Error(payload?.error?.message ?? "Propose failed");
      setMessage("Queued — approve to run on GitHub.");
      await loadProposals();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function approve(proposalId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/connector/github/execution/${proposalId}/approve`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const payload = (await res.json().catch(() => null)) as {
        error?: { message?: string };
        data?: { proposal?: Proposal };
      };
      if (!res.ok) throw new Error(payload?.error?.message ?? "Approve failed");
      setMessage(
        payload.data?.proposal?.status === "executed"
          ? "Done"
          : payload.data?.proposal?.error ?? "Failed",
      );
      await loadProposals();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <p className="text-xs font-medium text-[#ececec]">GitHub write-back</p>

      <div className="flex flex-wrap gap-1">
        {(Object.keys(KIND_LABELS) as GitHubExecutionKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={
              kind === k
                ? "rounded-md bg-white/15 px-2 py-1 text-[10px] text-[#ececec]"
                : "rounded-md px-2 py-1 text-[10px] text-[#8e8e8e] hover:bg-white/5"
            }
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

      <select
        value={selectedRepo}
        onChange={(e) => setSelectedRepo(e.target.value)}
        className="h-8 w-full rounded-lg border border-white/10 bg-[#2f2f2f] px-2 text-xs text-[#ececec]"
      >
        {repos.length === 0 ? <option value="">Loading…</option> : null}
        {repos.map((r) => (
          <option key={r.fullName} value={r.fullName}>
            {r.fullName}
          </option>
        ))}
      </select>

      {kind === "issue_comment" ? (
        <input
          value={issueNumber}
          onChange={(e) => setIssueNumber(e.target.value)}
          placeholder="Issue #"
          className="h-8 w-full rounded-lg border border-white/10 bg-[#2f2f2f] px-2 text-xs text-[#ececec]"
        />
      ) : null}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-white/10 bg-[#2f2f2f] px-2 py-2 text-xs text-[#ececec]"
      />

      <button
        type="button"
        disabled={busy || !selected || !body.trim()}
        onClick={() => void propose()}
        className="w-full rounded-lg bg-white/10 py-2 text-xs text-[#ececec] hover:bg-white/15 disabled:opacity-40"
      >
        Propose
      </button>

      {proposals.slice(0, 4).map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 text-[10px] text-[#8e8e8e]">
          <span>
            {p.owner}/{p.repo} · {p.status}
          </span>
          {p.status === "pending" ? (
            <button type="button" onClick={() => void approve(p.id)} className="text-[#ececec]">
              Approve
            </button>
          ) : p.githubResultUrl ? (
            <a href={p.githubResultUrl} target="_blank" rel="noreferrer" className="text-[#ececec]">
              Open
            </a>
          ) : null}
        </div>
      ))}

      {message ? <p className="text-[10px] text-[#8e8e8e]">{message}</p> : null}
    </div>
  );
}
