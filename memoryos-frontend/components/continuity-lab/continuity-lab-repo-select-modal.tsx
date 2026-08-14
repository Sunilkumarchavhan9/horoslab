"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { consoleApiFetch } from "@/lib/console-api";
import { cn } from "@/lib/utils";

export type RepoOption = {
  fullName: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string | null;
};

type ContinuityLabRepoSelectModalProps = {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onConfirm: (repos: string[]) => void;
  lastSyncAt: string | null;
  initialRepos?: RepoOption[];
  title?: string;
  description?: string;
  confirmLabel?: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

function formatLastIndexed(lastSyncAt: string | null): string {
  if (!lastSyncAt) return "Not synced";
  try {
    const d = new Date(lastSyncAt);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 30 * 86_400_000) {
      const days = Math.floor(diff / 86_400_000);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
    return d.toLocaleDateString();
  } catch {
    return "Not synced";
  }
}

export function ContinuityLabRepoSelectModal({
  open,
  onClose,
  selected,
  onConfirm,
  lastSyncAt,
  initialRepos = [],
  title = "Select repositories",
  description = "Scope Ask answers to connected GitHub repositories.",
  confirmLabel,
}: ContinuityLabRepoSelectModalProps) {
  const [search, setSearch] = useState("");
  const [fetchedRepos, setFetchedRepos] = useState<RepoOption[]>([]);
  const [fetchSettled, setFetchSettled] = useState(false);
  const selectedKey = selected.join("\u0000");
  const [draftState, setDraftState] = useState<{ key: string; values: string[] }>({
    key: selectedKey,
    values: selected,
  });
  const draft = draftState.key === selectedKey ? draftState.values : selected;
  const repos = initialRepos.length > 0 ? initialRepos : fetchedRepos;
  const loading = open && initialRepos.length === 0 && !fetchSettled;

  function setDraft(updater: string[] | ((prev: string[]) => string[])) {
    setDraftState((prev) => {
      const current = prev.key === selectedKey ? prev.values : selected;
      const values = typeof updater === "function" ? updater(current) : updater;
      return { key: selectedKey, values };
    });
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (initialRepos.length > 0) return;
    let cancelled = false;
    void consoleApiFetch("/api/connector/github/repos?limit=100")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        const data = unwrapData<{ repos?: RepoOption[] }>(payload);
        setFetchedRepos(Array.isArray(data?.repos) ? data.repos : []);
      })
      .finally(() => {
        if (!cancelled) setFetchSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, initialRepos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? repos.filter((r) => r.fullName.toLowerCase().includes(q))
      : repos;
    return [...list].sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    });
  }, [repos, search]);

  function toggleRepo(fullName: string) {
    setDraft((prev) =>
      prev.includes(fullName) ? prev.filter((r) => r !== fullName) : [...prev, fullName],
    );
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((repo) => draft.includes(repo.fullName));

  function toggleFilteredRepos() {
    if (filtered.length === 0) return;
    setDraft((prev) => {
      const filteredNames = filtered.map((repo) => repo.fullName);
      if (filteredNames.every((name) => prev.includes(name))) {
        return prev.filter((name) => !filteredNames.includes(name));
      }
      return [...new Set([...prev, ...filteredNames])];
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close repository selector"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="repo-select-title"
        className="relative z-10 flex max-h-[min(85vh,670px)] w-full max-w-[676px] flex-col rounded-md border border-[#303030] bg-[#202020] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-6">
          <div>
            <h2 id="repo-select-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm text-white/50">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6">
          <span className="inline-flex h-9 items-center rounded-md bg-white/[0.07] px-3 text-sm font-semibold text-white">
            Your repos {repos.length}
          </span>
        </div>

        <div className="mx-6 mt-3 min-h-0 flex-1 overflow-hidden rounded-md border border-[#303030]">
          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_9rem] items-center border-b border-[#303030] bg-[#1d1d1d] text-sm">
            <label className="flex h-14 items-center justify-center">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleFilteredRepos}
                className="size-5 rounded accent-[#3b82f6]"
                aria-label="Select all filtered repositories"
              />
            </label>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="h-14 w-full bg-transparent pl-7 pr-3 text-sm font-medium text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
            <div className="px-3 text-xs font-semibold text-white/45">Last indexed</div>
          </div>

          <div className="min-h-[330px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/50">
                <Loader2 className="size-4 animate-spin" />
                Loading repositories…
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-12 text-center text-sm text-white/45">
                {repos.length === 0
                  ? "No repositories found. Connect GitHub in settings first."
                  : "No repositories match your search."}
              </p>
            ) : (
              <ul>
                {filtered.map((repo) => {
                  const checked = draft.includes(repo.fullName);
                  const repoName = repo.fullName.split("/").pop() ?? repo.fullName;
                  return (
                    <li key={repo.fullName} className="border-b border-[#303030]/70 last:border-b-0">
                      <label
                        className={cn(
                          "grid cursor-pointer grid-cols-[2.25rem_minmax(0,1fr)_9rem] items-center px-0 py-4 hover:bg-white/[0.04]",
                          checked && "bg-white/[0.03]",
                        )}
                      >
                        <span className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRepo(repo.fullName)}
                            className="size-5 rounded accent-[#3b82f6]"
                          />
                        </span>
                        <span className="min-w-0 px-0">
                          <span className="block truncate text-base font-semibold text-white/85">
                            {repoName}
                          </span>
                          <span className="mt-1 block truncate text-xs text-white/35">
                            {repo.fullName}
                            {repo.private ? " · Private" : ""}
                          </span>
                        </span>
                        <span className="px-3 text-sm font-medium text-white/45">
                          {formatLastIndexed(repo.updatedAt ?? lastSyncAt)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <Link
            href="/continuity-lab/settings/repositories"
            className="text-sm font-semibold text-white/45 hover:text-white/70"
          >
            Manage repositories
          </Link>
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-[#3A3A3A] px-4 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={draft.length === 0}
            onClick={() => {
              onConfirm(draft);
              onClose();
            }}
            className="h-9 rounded-md bg-[#3b82f6] px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {confirmLabel ??
              `Select ${draft.length} ${draft.length === 1 ? "repository" : "repositories"}`}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
