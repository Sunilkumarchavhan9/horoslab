"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  GitBranch,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsSelectDropdown,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  fetchLabWikiSettingsFromApi,
  loadLabWikiSettingsHybrid,
  patchLabWikiSettingsToApi,
} from "@/lib/continuity-lab/lab-wiki-settings-api";
import {
  WIKI_EFFORT_OPTIONS,
  WIKI_FREQUENCY_OPTIONS,
  defaultLabWikiSettings,
  saveLabWikiSettings,
  type LabWikiEffort,
  type LabWikiFrequency,
  type LabWikiSettings,
} from "@/lib/continuity-lab/lab-wiki-settings-storage";
import { branchesIndexedFromStatus } from "@/lib/continuity-lab/lab-wiki-settings-runtime";
import {
  fetchGitHubRepoBranches,
  fetchRepoIndexStatuses,
  type GitHubRepoBranchEntry,
  type RepoIndexStatus,
} from "@/lib/continuity-lab/wiki-api";
import { useLiveConnectors } from "@/lib/continuity-lab/use-live-connectors";
import { SETTINGS_INDEX_PATH, settingsSectionPath } from "@/lib/continuity-lab/settings-nav";
import { projectIdFromRepo } from "@/lib/continuity-lab/company-model";
import { wikiRepoHref } from "@/lib/continuity-lab/wiki";
import { consoleApiFetch } from "@/lib/console-api";
import { cn } from "@/lib/utils";

type RepoParts = {
  owner: string;
  repo: string;
  fullName: string;
};

type OverrideValue<T extends string> = "__default__" | T;

function parseRepoParts(slug: string[]): RepoParts | null {
  const decoded = slug.map((part) => decodeURIComponent(part).trim()).filter(Boolean);
  if (decoded.length < 2) return null;
  const owner = decoded[0];
  const repo = decoded.slice(1).join("/");
  if (!owner || !repo) return null;
  return { owner, repo, fullName: `${owner}/${repo}` };
}

function githubUrl(fullName: string): string {
  return `https://github.com/${fullName}`;
}

function wikiRepoPath(fullName: string): string {
  const [owner, ...repoParts] = fullName.split("/");
  return `/continuity-lab/settings/wiki/repositories/${[owner, repoParts.join("/")]
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/")}`;
}

function formatRelativeDate(value: string | null | undefined): string {
  if (!value) return "Not indexed yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const deltaMs = Date.now() - date.getTime();
  const deltaHours = Math.max(1, Math.round(deltaMs / 3_600_000));
  if (deltaHours < 24) return `${deltaHours} hour${deltaHours === 1 ? "" : "s"} ago`;
  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays} day${deltaDays === 1 ? "" : "s"} ago`;
}

function defaultBranchLabel(branch: string | null): string {
  return branch?.trim() ? branch.trim() : "default branch";
}

function indexedBranchesFrom(
  settings: LabWikiSettings,
  repoFullName: string,
  defaultBranch: string | null,
  indexEntry: RepoIndexStatus | undefined,
): string[] {
  const enrolled = settings.enrolledRepos.find((row) => row.repo === repoFullName);
  if (enrolled && Array.isArray(enrolled.indexedBranches)) return enrolled.indexedBranches;
  const storedCount = enrolled?.branchesIndexed ?? 0;
  const indexedCount = Math.max(storedCount, branchesIndexedFromStatus(indexEntry));
  if (indexedCount > 0 && defaultBranch?.trim()) return [defaultBranch.trim()];
  return [];
}

export function ContinuityLabWikiRepoIndexingSection({ slug }: { slug: string[] }) {
  const repoParts = useMemo(() => parseRepoParts(slug), [slug]);
  const repoFullName = repoParts?.fullName ?? "";
  const liveConnectors = useLiveConnectors();
  const githubRepo = liveConnectors.github.repos.find((repo) => repo.fullName === repoFullName);
  const connectorDefaultBranch = githubRepo?.defaultBranch?.trim() || null;
  const [remoteDefaultBranch, setRemoteDefaultBranch] = useState<string | null>(null);
  const defaultBranch = remoteDefaultBranch || connectorDefaultBranch;
  const defaultBranchName = defaultBranchLabel(defaultBranch);
  const [settings, setSettings] = useState<LabWikiSettings>(defaultLabWikiSettings);
  const [indexEntry, setIndexEntry] = useState<RepoIndexStatus | undefined>();
  const [repoBranches, setRepoBranches] = useState<GitHubRepoBranchEntry[]>([]);
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">("idle");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");
  const branchMenuRef = useRef<HTMLDivElement>(null);

  const closeBranchMenu = useCallback(() => {
    setBranchMenuOpen(false);
    setBranchSearch("");
  }, []);

  const applySettings = useCallback((next: LabWikiSettings) => {
    setSettings(next);
    saveLabWikiSettings(next, { broadcast: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [remote, statuses, branchPayload] = await Promise.all([
        loadLabWikiSettingsHybrid(),
        repoFullName ? fetchRepoIndexStatuses([repoFullName]) : Promise.resolve([]),
        repoParts
          ? fetchGitHubRepoBranches(repoParts.owner, repoParts.repo, 100)
          : Promise.resolve(null),
      ]);
      if (cancelled) return;
      if (remote) applySettings(remote.settings);
      setIndexEntry(statuses[0]);
      setRepoBranches(branchPayload?.branches ?? []);
      setRemoteDefaultBranch(branchPayload?.defaultBranch?.trim() || null);
      setBranchesLoaded(true);
      setBranchLoadError(
        branchPayload || connectorDefaultBranch ? null : "No GitHub branches available.",
      );
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [applySettings, connectorDefaultBranch, repoFullName, repoParts]);

  useEffect(() => {
    if (!branchMenuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!branchMenuRef.current?.contains(event.target as Node)) closeBranchMenu();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [branchMenuOpen, closeBranchMenu]);

  const repoOverride = settings.repoOverrides[repoFullName] ?? {};
  const indexedBranches = indexedBranchesFrom(settings, repoFullName, defaultBranch, indexEntry);
  const branchNames = useMemo(() => {
    const names = repoBranches.map((branch) => branch.name).filter(Boolean);
    if (names.length > 0) return names;
    return defaultBranch ? [defaultBranch] : [];
  }, [repoBranches, defaultBranch]);
  const availableBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    return branchNames.filter(
      (branch) =>
        !indexedBranches.includes(branch) &&
        (!q || branch.toLowerCase().includes(q)),
    );
  }, [branchNames, branchSearch, indexedBranches]);

  async function persist(next: LabWikiSettings): Promise<boolean> {
    applySettings(next);
    setSaveState("saving");
    const saved = await patchLabWikiSettingsToApi(next);
    if (!saved) {
      setSaveState("error");
      return false;
    }
    const refreshed = await fetchLabWikiSettingsFromApi();
    applySettings(refreshed?.settings ?? saved.settings);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1800);
    return true;
  }

  async function refreshIndexStatus() {
    if (!repoFullName) return;
    const statuses = await fetchRepoIndexStatuses([repoFullName]);
    setIndexEntry(statuses[0]);
  }

  async function queueGitHubSync() {
    setSyncState("syncing");
    const res = await consoleApiFetch("/api/connector/github/sync", { method: "POST" });
    if (!res.ok) {
      setSyncState("error");
      return false;
    }
    await refreshIndexStatus();
    setSyncState("idle");
    return true;
  }

  async function updateRepoBranches(branches: string[]): Promise<boolean> {
    if (!repoFullName) return false;
    const uniqueBranches = [...new Set(branches.map((branch) => branch.trim()).filter(Boolean))];
    const existing = settings.enrolledRepos;
    const hasRepo = existing.some((row) => row.repo === repoFullName);
    const nextRepos = hasRepo
      ? existing.map((row) =>
          row.repo === repoFullName
            ? {
                ...row,
                branchesIndexed: uniqueBranches.length,
                indexedBranches: uniqueBranches,
              }
            : row,
        )
      : [
          ...existing,
          {
            repo: repoFullName,
            branchesIndexed: uniqueBranches.length,
            indexedBranches: uniqueBranches,
          },
        ];
    return persist({ ...settings, enrolledRepos: nextRepos });
  }

  async function reindexBranches(branches: string[]) {
    const saved = await updateRepoBranches(branches);
    if (!saved) return;
    await queueGitHubSync();
  }

  function updateOverride(partial: { effort?: LabWikiEffort | null; frequency?: LabWikiFrequency | null }) {
    if (!repoFullName) return;
    const nextOverride = {
      ...repoOverride,
      ...partial,
    };
    const nextOverrides = { ...settings.repoOverrides };
    if (!nextOverride.effort && !nextOverride.frequency) {
      delete nextOverrides[repoFullName];
    } else {
      nextOverrides[repoFullName] = nextOverride;
    }
    void persist({
      ...settings,
      repoOverrides: nextOverrides,
    });
  }

  if (!repoParts) {
    return (
      <ContinuityLabSettingsSectionFrame
        sectionId="wiki"
        titleOverride="Repository not found"
        descriptionOverride="The repository path is invalid."
        contentClassName="max-w-3xl"
      >
        <Link href={settingsSectionPath("repositories")} className="text-sm text-white/60 hover:text-white">
          Back to repositories
        </Link>
      </ContinuityLabSettingsSectionFrame>
    );
  }

  const effortValue: OverrideValue<LabWikiEffort> = repoOverride.effort ?? "__default__";
  const frequencyValue: OverrideValue<LabWikiFrequency> = repoOverride.frequency ?? "__default__";

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="wiki"
      titleOverride={repoFullName}
      descriptionOverride={repoParts.owner}
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Wiki", href: settingsSectionPath("wiki") },
        { label: repoParts.repo },
      ]}
      contentClassName="max-w-4xl"
    >
      <Link
        href={settingsSectionPath("wiki")}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to Wiki
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{repoFullName}</h2>
          <p className="mt-1 text-sm text-white/45">
            {indexEntry?.status === "generating"
              ? "Indexing in progress"
              : indexEntry?.indexed
                ? `Last indexed ${formatRelativeDate(indexEntry.updatedAt)}`
                : "No index found yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={wikiRepoHref(projectIdFromRepo(repoFullName))}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.04] px-3 text-sm font-medium text-white/80 hover:bg-white/[0.08]"
          >
            <BookOpen className="size-3.5" aria-hidden />
            Wiki
            <ExternalLink className="size-3" aria-hidden />
          </Link>
          <a
            href={githubUrl(repoFullName)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.04] px-3 text-sm font-medium text-white/80 hover:bg-white/[0.08]"
          >
            <GitBranch className="size-3.5" aria-hidden />
            GitHub
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>
      </div>

      {saveState === "saving" ? <p className="text-xs text-white/40">Saving...</p> : null}
      {saveState === "saved" ? <p className="text-xs text-emerald-300">Saved</p> : null}
      {saveState === "error" ? <p className="text-xs text-red-300">Could not save wiki repo settings.</p> : null}
      {syncState === "syncing" ? <p className="text-xs text-white/40">GitHub sync queued...</p> : null}
      {syncState === "error" ? <p className="text-xs text-red-300">Could not queue GitHub sync.</p> : null}
      {!loaded ? <p className="text-sm text-white/45">Loading repository settings...</p> : null}

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-white">Indexed branches</h3>
        <SettingsFlatPanel className="!px-0">
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Indexing</p>
              <p className="mt-1 text-sm text-white/45">
                Branches indexed for wiki generation and code search
              </p>
            </div>
            <div ref={branchMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (branchMenuOpen) {
                    closeBranchMenu();
                  } else {
                    setBranchMenuOpen(true);
                  }
                }}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-white/[0.1] bg-white/[0.04] px-3 text-sm font-semibold text-white hover:bg-white/[0.08]"
              >
                Add branch
                <ChevronDown className="size-3.5 text-white/45" aria-hidden />
              </button>
              {branchMenuOpen ? (
                <div className="absolute right-0 top-full z-40 mt-1 w-80 overflow-hidden rounded-md border border-white/[0.08] bg-[#181818] py-1 shadow-2xl">
                  <div className="border-b border-white/[0.06] px-3 py-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-white/30" />
                      <input
                        type="search"
                        value={branchSearch}
                        onChange={(event) => setBranchSearch(event.target.value)}
                        placeholder="Search branches..."
                        className="h-8 w-full rounded-md border border-white/[0.08] bg-[#111111] pl-7 pr-2 text-xs text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none"
                      />
                    </div>
                  </div>
                  {!branchesLoaded ? (
                    <p className="px-3 py-3 text-sm text-white/40">Loading branches...</p>
                  ) : availableBranches.length > 0 ? (
                    availableBranches.map((branch) => (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => {
                          void updateRepoBranches([...indexedBranches, branch]);
                          closeBranchMenu();
                        }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.04]"
                      >
                        {branch}
                        <Check className="size-3.5 text-white/35" aria-hidden />
                      </button>
                    ))
                  ) : branchLoadError && branchNames.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-white/40">{branchLoadError}</p>
                  ) : (
                    <p className="px-3 py-3 text-sm text-white/40">No branches found</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void reindexBranches(branchNames.length ? branchNames : indexedBranches);
                      closeBranchMenu();
                    }}
                    disabled={syncState === "syncing" || branchNames.length + indexedBranches.length === 0}
                    className="w-full border-t border-white/[0.06] px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.04]"
                  >
                    Re-index all branches
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void updateRepoBranches([]);
                      closeBranchMenu();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-white/[0.04]"
                  >
                    Remove all branches
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="min-h-[72px] px-4 py-3">
            {indexedBranches.length > 0 ? (
              <ul className="space-y-2">
                {indexedBranches.map((branch) => (
                  <li key={branch} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-mono text-white">
                        {branch}
                        {branch === defaultBranchName ? (
                          <span className="ml-1 font-sans text-white/45">(default)</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-white/45">
                      <span>{indexEntry?.updatedAt ? formatRelativeDate(indexEntry.updatedAt) : "Not indexed"}</span>
                      {indexEntry?.indexed ? <Check className="size-3.5 text-emerald-300" aria-hidden /> : null}
                      <button
                        type="button"
                        onClick={() => void reindexBranches(indexedBranches)}
                        disabled={syncState === "syncing"}
                        className="inline-flex size-7 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                        aria-label={`Re-index ${branch}`}
                      >
                        <RefreshCw
                          className={cn("size-3.5", syncState === "syncing" && "animate-spin")}
                          aria-hidden
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void updateRepoBranches(indexedBranches.filter((item) => item !== branch))
                        }
                        className="inline-flex size-7 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white"
                        aria-label={`Remove ${branch}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/45">No branches indexed.</p>
            )}
          </div>
        </SettingsFlatPanel>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-white">Wiki</h3>
        <p className="text-sm text-white/45">Per-repository overrides for organization-wide defaults</p>
        <SettingsFlatPanel>
          <SettingsFieldRow label="Wiki effort level" hint="Higher effort generates more detailed wikis">
            <SettingsSelectDropdown<OverrideValue<LabWikiEffort>>
              value={effortValue}
              onChange={(value) =>
                updateOverride({ effort: value === "__default__" ? null : value })
              }
              options={[
                {
                  value: "__default__",
                  label: "Organization default",
                  description: `Level: ${settings.effort}`,
                },
                ...WIKI_EFFORT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  description: option.hint,
                })),
              ]}
            />
          </SettingsFieldRow>
          <SettingsFieldRow label="Auto-refresh frequency" hint="How often the wiki is regenerated to reflect code changes">
            <SettingsSelectDropdown<OverrideValue<LabWikiFrequency>>
              value={frequencyValue}
              onChange={(value) =>
                updateOverride({ frequency: value === "__default__" ? null : value })
              }
              options={[
                {
                  value: "__default__",
                  label: "Organization default",
                  description: `Frequency: ${settings.frequency}`,
                },
                ...WIKI_FREQUENCY_OPTIONS.map((option) => ({
                  ...option,
                  description:
                    option.value === "daily"
                      ? "Regenerate every day"
                      : option.value === "weekly"
                        ? "Regenerate once a week"
                        : option.value === "monthly"
                          ? "Regenerate once a month"
                          : "Disable automatic regeneration",
                })),
              ]}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </section>
    </ContinuityLabSettingsSectionFrame>
  );
}

export { wikiRepoPath };
