"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { ArrowLeft, ChevronDown, RefreshCw, Trash2 } from "lucide-react";
import {
  ContinuityLabRepoSelectModal,
  type RepoOption,
} from "@/components/continuity-lab/continuity-lab-repo-select-modal";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsFlatPanel,
  SettingsPrimaryButton,
  SettingsSearchInput,
  SettingsSecondaryButton,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  compileSkillsRules,
  discoverSkillsRulesForRepo,
  fetchSkillsRulesFileContent,
  fetchLabSkillsRulesSettingsFromApi,
  loadLabSkillsRulesSettingsHybrid,
  loadLabSkillsRulesSettingsLocalFallback,
  patchLabSkillsRulesSettingsToApi,
  refreshAllSkillsRulesDiscovery,
  saveSkillsRulesFileContent,
  type RepoSkillsRulesSummary,
} from "@/lib/continuity-lab/lab-skills-rules-settings-api";
import {
  LAB_SKILLS_RULES_SETTINGS_CHANGED_EVENT,
  type LabSkillsRulesSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-skills-rules-settings-events";
import {
  readLabSkillsRulesSettings,
  saveLabSkillsRulesSettings,
  type LabSkillsRulesSettings,
} from "@/lib/continuity-lab/lab-skills-rules-settings-storage";
import { useLiveConnectors } from "@/lib/continuity-lab/use-live-connectors";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

const SKILLS_RULES_LEARN_MORE_URL =
  "https://cursor.com/docs/context/skills";

function sortReposByIndexed(repos: RepoOption[]): RepoOption[] {
  return [...repos].sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  });
}

function parseRepoParts(fullName: string): { owner: string; repo: string } | null {
  if (!fullName.includes("/")) return null;
  const [owner, repo] = fullName.split("/", 2);
  if (!owner?.trim() || !repo?.trim()) return null;
  return { owner: owner.trim(), repo: repo.trim() };
}

function formatDiscoveryLabel(summary: RepoSkillsRulesSummary | undefined): string {
  if (!summary) return "Not scanned yet";
  if (summary.error) return "Scan failed";
  const parts: string[] = [];
  if (summary.skillCount > 0) {
    parts.push(`${summary.skillCount} skill${summary.skillCount === 1 ? "" : "s"}`);
  }
  if (summary.ruleCount > 0) {
    parts.push(`${summary.ruleCount} rule${summary.ruleCount === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) return "0 skills · 0 rules";
  return parts.join(" · ");
}

function reposByName(repos: RepoSkillsRulesSummary[]): Record<string, RepoSkillsRulesSummary> {
  const out: Record<string, RepoSkillsRulesSummary> = {};
  for (const row of repos) out[row.repo] = row;
  return out;
}

function resolveReferencePath(raw: string): string | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^@([A-Za-z0-9_./-]+\.md[a-z]?)\s*$/i);
  return match?.[1] ?? null;
}

export function ContinuityLabOrgSkillsRulesSettingsSection() {
  const liveConnectors = useLiveConnectors();
  const { organization } = useOrganization();
  const github = liveConnectors.github;

  const [settings, setSettings] = useState<LabSkillsRulesSettings>(readLabSkillsRulesSettings);
  const [reposByRepo, setReposByRepo] = useState<Record<string, RepoSkillsRulesSummary>>({});
  const [githubConnectedFromApi, setGithubConnectedFromApi] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [failedPatch, setFailedPatch] = useState<Partial<LabSkillsRulesSettings> | null>(null);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set());
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshingRepo, setRefreshingRepo] = useState<string | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewSha, setPreviewSha] = useState<string | null>(null);
  const [previewRef, setPreviewRef] = useState<string>("");
  const [previewRepo, setPreviewRepo] = useState<string>("");
  const [previewPath, setPreviewPath] = useState<string>("");
  const [editingPreview, setEditingPreview] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [savePreviewState, setSavePreviewState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [compilingRepo, setCompilingRepo] = useState<string | null>(null);
  const [compilingAll, setCompilingAll] = useState(false);
  const [compileNotice, setCompileNotice] = useState<string | null>(null);
  const skipNextSaveRef = useRef(true);
  const autoRefreshAttemptedRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const githubConnected =
    githubConnectedFromApi ?? github.connected;

  const repoOptions: RepoOption[] = useMemo(
    () =>
      sortReposByIndexed(
        github.repos.map((repo) => ({
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
          updatedAt: repo.updatedAt,
        })),
      ),
    [github.repos],
  );

  const applyRemote = useCallback(
    (
      next: LabSkillsRulesSettings,
      extras?: {
        repos?: RepoSkillsRulesSummary[];
        githubConnected?: boolean;
      },
    ) => {
      skipNextSaveRef.current = true;
      setSettings(next);
      saveLabSkillsRulesSettings(next, { broadcast: false });
      if (extras?.repos) {
        setReposByRepo(reposByName(extras.repos));
        setExpandedRepos((prev) => {
          const next = new Set(prev);
          for (const row of extras.repos ?? []) {
            if (row.items.length > 0) next.add(row.repo);
          }
          return next;
        });
      }
      if (extras?.githubConnected !== undefined) {
        setGithubConnectedFromApi(extras.githubConnected);
      }
    },
    [],
  );

  const mergeRepoSummary = useCallback((summary: RepoSkillsRulesSummary) => {
    setReposByRepo((prev) => ({ ...prev, [summary.repo]: summary }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const orgId = organization?.id?.trim() ?? "";
    void (async () => {
      setLoadError(null);
      const remote = await loadLabSkillsRulesSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        applyRemote(remote.settings, {
          repos: remote.repos,
          githubConnected: remote.githubConnected,
        });
      } else {
        const local = loadLabSkillsRulesSettingsLocalFallback(orgId);
        applyRemote(local.settings);
        setLoadError("Could not load settings from the server.");
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [organization?.id, applyRemote]);

  useEffect(() => {
    function onSettingsChanged(event: Event) {
      const detail = (event as CustomEvent<LabSkillsRulesSettingsChangedDetail>).detail;
      if (detail?.settings) {
        applyRemote(detail.settings, {
          repos: detail.repos,
          githubConnected: detail.githubConnected,
        });
      }
    }
    window.addEventListener(LAB_SKILLS_RULES_SETTINGS_CHANGED_EVENT, onSettingsChanged);
    return () =>
      window.removeEventListener(LAB_SKILLS_RULES_SETTINGS_CHANGED_EVENT, onSettingsChanged);
  }, [applyRemote]);

  const githubRepoSet = useMemo(
    () => new Set(github.repos.map((repo) => repo.fullName)),
    [github.repos],
  );

  const refreshAllDiscovery = useCallback(async () => {
    if (!githubConnected) return;
    setRefreshingAll(true);
    setDiscoveryError(null);
    const repos = await refreshAllSkillsRulesDiscovery();
    if (repos) {
      setReposByRepo(reposByName(repos));
    } else {
      setDiscoveryError("Could not refresh discovery from GitHub.");
    }
    setRefreshingAll(false);
  }, [githubConnected]);

  useEffect(() => {
    if (!loaded || !githubConnected || autoRefreshAttemptedRef.current) return;
    if (settings.enrolledRepos.length === 0) return;
    if (saveState === "saving") return;
    const needsScan = settings.enrolledRepos.some((repo) => {
      const summary = reposByRepo[repo];
      return !summary || summary.stale || summary.discoveredAt === null;
    });
    if (!needsScan) return;
    autoRefreshAttemptedRef.current = true;
    void refreshAllDiscovery();
  }, [loaded, githubConnected, saveState, settings.enrolledRepos, reposByRepo, refreshAllDiscovery]);

  const persistToApi = useCallback(async (partial: Partial<LabSkillsRulesSettings>) => {
    setSaveState("saving");
    setFailedPatch(null);
    const saved = await patchLabSkillsRulesSettingsToApi(partial);
    if (saved) {
      applyRemote(saved.settings, {
        repos: saved.repos,
        githubConnected: saved.githubConnected,
      });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return true;
    }
    setFailedPatch(partial);
    setSaveState("error");
    return false;
  }, [applyRemote]);

  const retrySave = useCallback(() => {
    const partial = failedPatch ?? settingsRef.current;
    void persistToApi(partial);
  }, [failedPatch, persistToApi]);

  function updateSettingsLocal(partial: Partial<LabSkillsRulesSettings>) {
    const next = saveLabSkillsRulesSettings(partial);
    setSettings(next);
  }

  async function persistEnrolledRepos(nextEnrolled: string[]) {
    skipNextSaveRef.current = true;
    updateSettingsLocal({ enrolledRepos: nextEnrolled });
    return persistToApi({ enrolledRepos: nextEnrolled });
  }

  const filteredEnrolledRepos = useMemo(() => {
    const q = repoSearch.trim().toLowerCase();
    if (!q) return settings.enrolledRepos;
    return settings.enrolledRepos.filter((repo) => repo.toLowerCase().includes(q));
  }, [settings.enrolledRepos, repoSearch]);

  function handleAddRepos(fullNames: string[]) {
    const existing = new Set(settings.enrolledRepos);
    const added = fullNames.filter((name) => !existing.has(name));
    if (added.length === 0) return;
    const nextEnrolled = [...settings.enrolledRepos, ...added];
    autoRefreshAttemptedRef.current = false;
    void (async () => {
      const ok = await persistEnrolledRepos(nextEnrolled);
      if (ok) {
        setExpandedRepos((prev) => new Set([...prev, ...added]));
      }
    })();
  }

  function removeRepo(repo: string) {
    const nextEnrolled = settings.enrolledRepos.filter((name) => name !== repo);
    void persistEnrolledRepos(nextEnrolled);
    setExpandedRepos((prev) => {
      const next = new Set(prev);
      next.delete(repo);
      return next;
    });
  }

  function toggleExpanded(repo: string) {
    setExpandedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo);
      else next.add(repo);
      return next;
    });
  }

  async function refreshRepoDiscovery(repo: string) {
    if (!githubConnected) return;
    setRefreshingRepo(repo);
    setDiscoveryError(null);
    const summary = await discoverSkillsRulesForRepo(repo);
    if (summary) {
      mergeRepoSummary(summary);
    } else {
      setDiscoveryError(`Could not refresh discovery for ${repo}.`);
    }
    setRefreshingRepo(null);
  }

  async function refreshSettingsFromServer() {
    const remote = await fetchLabSkillsRulesSettingsFromApi();
    if (remote) {
      applyRemote(remote.settings, {
        repos: remote.repos,
        githubConnected: remote.githubConnected,
      });
    }
  }

  async function compileRepoToMemory(repo: string) {
    setCompilingRepo(repo);
    setCompileNotice(null);
    const result = await compileSkillsRules({ repo });
    if (result) {
      setCompileNotice(
        `Compiled ${result.memoryCount} memor${result.memoryCount === 1 ? "y" : "ies"} for ${repo}.`,
      );
      await refreshSettingsFromServer();
    } else {
      setCompileNotice(`Could not compile skills and rules for ${repo}.`);
    }
    setCompilingRepo(null);
  }

  async function compileAllToMemory() {
    setCompilingAll(true);
    setCompileNotice(null);
    const result = await compileSkillsRules({ force: true });
    if (result) {
      setCompileNotice(
        `Compiled ${result.memoryCount} memor${result.memoryCount === 1 ? "y" : "ies"} across ${result.repos.length} repo${result.repos.length === 1 ? "" : "s"}.`,
      );
      await refreshSettingsFromServer();
    } else {
      setCompileNotice("Could not compile skills and rules.");
    }
    setCompilingAll(false);
  }

  function formatCompileLabel(repo: string): string | null {
    const stats = settings.compileStatsByRepo?.[repo];
    if (!stats?.lastCompiledAt) return null;
    const when = new Date(stats.lastCompiledAt).toLocaleString();
    return `${stats.memoryCount} in memory · ${when}`;
  }

  async function openItemPreview(
    repo: string,
    item: { path: string; name: string; ref?: string },
  ) {
    const key = `${repo}:${item.path}`;
    if (previewKey === key && previewContent) {
      setPreviewKey(null);
      setPreviewContent(null);
      setPreviewNote(null);
      setPreviewError(null);
      setPreviewSha(null);
      setPreviewRef("");
      setPreviewRepo("");
      setPreviewPath("");
      setEditingPreview(false);
      setEditDraft("");
      setSavePreviewState("idle");
      return;
    }
    setPreviewKey(key);
    setPreviewContent(null);
    setPreviewNote(null);
    setPreviewError(null);
    setPreviewSha(null);
    setPreviewRef(item.ref ?? "");
    setPreviewRepo(repo);
    setPreviewPath(item.path);
    setEditingPreview(false);
    setEditDraft("");
    setSavePreviewState("idle");
    setPreviewLoading(true);
    const file = await fetchSkillsRulesFileContent({
      repo,
      path: item.path,
      ref: item.ref,
    });
    if (!file) {
      setPreviewLoading(false);
      setPreviewError("Could not load file from GitHub.");
      return;
    }

    const referencePath = resolveReferencePath(file.content);
    if (referencePath && referencePath !== item.path) {
      const resolved = await fetchSkillsRulesFileContent({
        repo,
        path: referencePath,
        ref: file.ref || item.ref,
      });
      setPreviewLoading(false);
      if (resolved) {
        setPreviewContent(resolved.content);
        setPreviewSha(resolved.sha);
        setPreviewRef(resolved.ref || file.ref || item.ref || "");
        setPreviewPath(referencePath);
        setPreviewNote(`${item.path} references ${referencePath}`);
      } else {
        setPreviewContent(file.content);
        setPreviewSha(file.sha);
        setPreviewRef(file.ref || item.ref || "");
        setPreviewNote(`${item.path} references ${referencePath}, but that file could not be loaded.`);
      }
      return;
    }

    setPreviewLoading(false);
    setPreviewContent(file.content);
    setPreviewSha(file.sha);
    setPreviewRef(file.ref || item.ref || "");
  }

  function startEditingPreview() {
    if (!previewContent) return;
    setEditDraft(previewContent);
    setEditingPreview(true);
    setSavePreviewState("idle");
  }

  function cancelEditingPreview() {
    setEditingPreview(false);
    setEditDraft("");
    setSavePreviewState("idle");
  }

  async function savePreviewEdit() {
    if (!previewRepo || !previewPath) return;
    setSavePreviewState("saving");
    const saved = await saveSkillsRulesFileContent({
      repo: previewRepo,
      path: previewPath,
      content: editDraft,
      sha: previewSha,
      ref: previewRef || undefined,
    });
    if (!saved) {
      setSavePreviewState("error");
      return;
    }
    setPreviewContent(saved.content);
    setPreviewSha(saved.sha);
    setPreviewRef(saved.ref);
    setEditingPreview(false);
    setEditDraft("");
    setSavePreviewState("saved");
    window.setTimeout(() => setSavePreviewState("idle"), 2000);
    void refreshRepoDiscovery(previewRepo);
    void refreshSettingsFromServer();
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="skills-rules"
      titleOverride="Skills & Rules"
      descriptionOverride="Skills and rules are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows."
      docHref={SKILLS_RULES_LEARN_MORE_URL}
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Skills & Rules" },
      ]}
    >
      <Link
        href={SETTINGS_INDEX_PATH}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to organization
      </Link>

      {loadError ? (
        <p className="mb-2 text-xs text-amber-200/90">{loadError}</p>
      ) : !loaded ? (
        <p className="mb-2 text-xs text-[#F0EFE2]/40">Loading settings…</p>
      ) : null}

      {saveState === "error" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          <span>
            Could not save to the server. Changes are kept locally until sync succeeds.
          </span>
          <button
            type="button"
            onClick={() => void retrySave()}
            className="inline-flex h-7 items-center rounded-md border border-amber-400/40 px-2.5 font-medium text-amber-50 hover:bg-amber-500/20"
          >
            Retry
          </button>
        </div>
      ) : saveState === "saving" ? (
        <p className="text-xs text-[#F0EFE2]/40">Saving…</p>
      ) : saveState === "saved" ? (
        <p className="text-xs text-emerald-300/90">Saved</p>
      ) : null}

      {discoveryError ? (
        <p className="mt-2 text-xs text-amber-200/90">{discoveryError}</p>
      ) : null}

      {compileNotice ? (
        <p className="mt-2 text-xs text-indigo-200/90">{compileNotice}</p>
      ) : null}

      {!githubConnected ? (
        <div className="mb-3 rounded-md border border-white/[0.08] bg-[#111111] px-4 py-3 text-xs text-[#F0EFE2]/55">
          Connect GitHub in{" "}
          <Link
            href="/continuity-lab/settings/connections"
            className="text-indigo-300 hover:text-indigo-200"
          >
            Organization → Connections
          </Link>{" "}
          to scan enrolled repositories for skills and rules.
        </div>
      ) : null}

      {settings.enrolledRepos.length > 0 ? (
        <SettingsToolbar className="mb-3">
          <SettingsSearchInput
            value={repoSearch}
            onChange={setRepoSearch}
            placeholder="Search repositories"
            className="max-w-xs"
          />
          <SettingsSecondaryButton
            onClick={() => void refreshAllDiscovery()}
            disabled={refreshingAll || !githubConnected}
          >
            <RefreshCw
              className={cn("mr-1.5 size-3.5", refreshingAll && "animate-spin")}
              aria-hidden
            />
            Refresh all
          </SettingsSecondaryButton>
          <SettingsSecondaryButton
            onClick={() => void compileAllToMemory()}
            disabled={compilingAll || !githubConnected}
          >
            {compilingAll ? "Compiling…" : "Compile all to memory"}
          </SettingsSecondaryButton>
          {github.connected ? (
            <SettingsPrimaryButton onClick={() => setRepoModalOpen(true)}>
              Add repositories
            </SettingsPrimaryButton>
          ) : (
            <span className="inline-flex h-9 cursor-not-allowed items-center rounded-md bg-white/30 px-3.5 text-sm font-medium text-[#0A0A0A]/60">
              Add repositories
            </span>
          )}
        </SettingsToolbar>
      ) : null}

      {settings.enrolledRepos.length === 0 ? (
        <SettingsFlatPanel className="py-10 text-center">
          <p className="text-sm text-[#F0EFE2]/55">
            No repositories yet. Add a repository to discover its skills and rules.
          </p>
          {github.connected ? (
            <div className="mt-4">
              <SettingsPrimaryButton onClick={() => setRepoModalOpen(true)}>
                Add repositories
              </SettingsPrimaryButton>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[#F0EFE2]/40">
              Connect GitHub in{" "}
              <Link
                href="/continuity-lab/settings/connections"
                className="text-indigo-300 hover:text-indigo-200"
              >
                Organization → Connections
              </Link>
              .
            </p>
          )}
        </SettingsFlatPanel>
      ) : filteredEnrolledRepos.length === 0 ? (
        <p className="text-sm text-[#F0EFE2]/50">No enrolled repos match your search.</p>
      ) : (
        <SettingsFlatPanel className="!px-0">
          <ul>
            {filteredEnrolledRepos.map((fullName) => {
              const connected = github.connected && githubRepoSet.has(fullName);
              const parts = parseRepoParts(fullName);
              const summary = reposByRepo[fullName];
              const expanded = expandedRepos.has(fullName);
              const isRefreshing = refreshingRepo === fullName;
              const hasItems = (summary?.items.length ?? 0) > 0;
              return (
                <li
                  key={fullName}
                  className="border-b border-white/[0.06] last:border-b-0"
                >
                  <div className="flex flex-wrap items-center gap-3 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(fullName)}
                      disabled={!hasItems}
                      className={cn(
                        "inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/50",
                        hasItems
                          ? "hover:bg-white/[0.06] hover:text-[#F0EFE2]"
                          : "cursor-default opacity-40",
                      )}
                      aria-expanded={expanded}
                      aria-label={hasItems ? `Expand ${fullName}` : `No items in ${fullName}`}
                    >
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform",
                          expanded && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      {parts ? (
                        <>
                          <span className="block truncate text-[11px] text-[#F0EFE2]/45">
                            {parts.owner}
                          </span>
                          <span className="block truncate font-mono text-sm text-[#F0EFE2]">
                            {parts.repo}
                          </span>
                        </>
                      ) : (
                        <span className="block truncate font-mono text-sm text-[#F0EFE2]">
                          {fullName}
                        </span>
                      )}
                      <p className="mt-0.5 text-[11px] text-[#F0EFE2]/40">
                        <span
                          className={cn(connected ? "text-emerald-300/80" : "text-amber-200/80")}
                        >
                          {connected ? "Connected" : "Disconnected"}
                        </span>
                        {" · "}
                        {isRefreshing ? (
                          <span className="text-[#F0EFE2]/45">Scanning…</span>
                        ) : (
                          formatDiscoveryLabel(summary)
                        )}
                        {summary?.error ? (
                          <span className="text-amber-200/80"> — {summary.error}</span>
                        ) : null}
                        {formatCompileLabel(fullName) ? (
                          <>
                            {" · "}
                            <span className="text-indigo-200/70">{formatCompileLabel(fullName)}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void compileRepoToMemory(fullName)}
                      disabled={!githubConnected || compilingRepo === fullName}
                      className="inline-flex h-8 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-2.5 text-[11px] font-medium text-[#F0EFE2]/90 transition hover:bg-white/[0.08] disabled:opacity-50"
                    >
                      {compilingRepo === fullName ? "Compiling…" : "Compile"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void refreshRepoDiscovery(fullName)}
                      disabled={!githubConnected || isRefreshing}
                      className="inline-flex size-8 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/50 hover:bg-white/[0.06] hover:text-[#F0EFE2] disabled:opacity-40"
                      aria-label={`Refresh ${fullName}`}
                    >
                      <RefreshCw
                        className={cn("size-3.5", isRefreshing && "animate-spin")}
                        aria-hidden
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRepo(fullName)}
                      className="inline-flex size-8 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/50 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
                      aria-label={`Remove ${fullName}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {expanded && hasItems ? (
                    <ul className="border-t border-white/[0.04] bg-black/20 px-3 py-2">
                      {summary?.items.map((item) => {
                        const itemKey = `${fullName}:${item.path}`;
                        const previewOpen = previewKey === itemKey;
                        return (
                          <li key={itemKey} className="py-1">
                            <button
                              type="button"
                              onClick={() =>
                                void openItemPreview(fullName, {
                                  path: item.path,
                                  name: item.name,
                                  ref: summary?.ref,
                                })
                              }
                              className={cn(
                                "flex w-full flex-col gap-1 rounded-md px-2 py-2 text-left transition",
                                previewOpen
                                  ? "bg-white/[0.08]"
                                  : "hover:bg-white/[0.04]",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                    item.type === "skill"
                                      ? "bg-indigo-500/20 text-indigo-200"
                                      : "bg-white/10 text-[#F0EFE2]/60",
                                  )}
                                >
                                  {item.type}
                                </span>
                                <span className="min-w-0 truncate text-sm font-medium text-[#F0EFE2]/90">
                                  {item.name}
                                </span>
                              </div>
                              <span className="truncate pl-0.5 font-mono text-[11px] text-[#F0EFE2]/40">
                                {item.path}
                              </span>
                            </button>
                            {previewOpen ? (
                              <div className="mx-2 mb-2 mt-1 rounded-md border border-white/[0.08] bg-[#0a0a0a]">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="font-mono text-[11px] text-[#F0EFE2]/50">{previewPath || item.path}</p>
                                    {previewNote ? (
                                      <p className="mt-1 text-[11px] text-indigo-200/80">{previewNote}</p>
                                    ) : null}
                                  </div>
                                  {!previewLoading && !previewError && previewContent ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      {editingPreview ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => void savePreviewEdit()}
                                            disabled={savePreviewState === "saving"}
                                            className="inline-flex h-7 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-2.5 text-[11px] font-medium text-[#F0EFE2]/90 hover:bg-white/[0.08] disabled:opacity-50"
                                          >
                                            {savePreviewState === "saving" ? "Saving…" : "Save to GitHub"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={cancelEditingPreview}
                                            disabled={savePreviewState === "saving"}
                                            className="inline-flex h-7 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-2.5 text-[11px] font-medium text-[#F0EFE2]/90 hover:bg-white/[0.08] disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={startEditingPreview}
                                          className="inline-flex h-7 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-2.5 text-[11px] font-medium text-[#F0EFE2]/90 hover:bg-white/[0.08]"
                                        >
                                          Edit
                                        </button>
                                      )}
                                      {savePreviewState === "saved" ? (
                                        <span className="text-[11px] text-emerald-300/90">Saved</span>
                                      ) : savePreviewState === "error" ? (
                                        <span className="text-[11px] text-amber-200/90">Save failed</span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="p-3">
                                  {previewLoading ? (
                                    <p className="text-xs text-[#F0EFE2]/45">Loading preview…</p>
                                  ) : previewError ? (
                                    <p className="text-xs text-amber-200/90">{previewError}</p>
                                  ) : editingPreview ? (
                                    <textarea
                                      value={editDraft}
                                      onChange={(event) => setEditDraft(event.target.value)}
                                      className="min-h-48 w-full rounded-md border border-white/[0.08] bg-black/40 p-2 font-mono text-[11px] leading-relaxed text-[#F0EFE2]/85 outline-none focus:border-indigo-400/40"
                                      spellCheck={false}
                                    />
                                  ) : (
                                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[#F0EFE2]/80">
                                      {previewContent}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </SettingsFlatPanel>
      )}

      {settings.enrolledRepos.length > 0 && githubConnected ? (
        <p className="mt-3 text-[11px] text-[#F0EFE2]/35">
          Scans{" "}
          <code className="text-[#F0EFE2]/50">.cursor/skills/**/SKILL.md</code>,{" "}
          <code className="text-[#F0EFE2]/50">.cursor/rules/**</code>,{" "}
          <code className="text-[#F0EFE2]/50">AGENTS.md</code>,{" "}
          <code className="text-[#F0EFE2]/50">CLAUDE.md</code>,{" "}
          <code className="text-[#F0EFE2]/50">.github/copilot-instructions.md</code>, and{" "}
          <code className="text-[#F0EFE2]/50">.memoryos/skills/**</code>. Results cache for one hour.
          Click a skill or rule to preview or edit file contents in GitHub. Saves re-scan and compile to memory when auto-compile is enabled.
        </p>
      ) : null}

      <ContinuityLabRepoSelectModal
        open={repoModalOpen}
        onClose={() => setRepoModalOpen(false)}
        selected={settings.enrolledRepos}
        onConfirm={handleAddRepos}
        lastSyncAt={github.lastSyncAt}
        initialRepos={repoOptions}
        title="Add repositories"
        description="Add repositories to scan for agent skills and workspace rules."
        confirmLabel="Add repositories"
      />
    </ContinuityLabSettingsSectionFrame>
  );
}
