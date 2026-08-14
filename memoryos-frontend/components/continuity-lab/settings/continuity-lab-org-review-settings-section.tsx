"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  ContinuityLabRepoSelectModal,
  type RepoOption,
} from "@/components/continuity-lab/continuity-lab-repo-select-modal";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsPrimaryButton,
  SettingsRowLink,
  SettingsSearchInput,
  SettingsSecondaryButton,
  SettingsSelect,
  SettingsTabPills,
  SettingsToggle,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  fetchLabReviewSettingsFromApi,
  loadLabReviewSettingsHybrid,
  loadLabReviewSettingsLocalFallback,
  patchLabReviewSettingsToApi,
} from "@/lib/continuity-lab/lab-review-settings-api";
import {
  LAB_REVIEW_SETTINGS_CHANGED_EVENT,
  type LabReviewSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-review-settings-events";
import { resolveReviewTriggerForEnrollment } from "@/lib/continuity-lab/lab-review-settings-runtime";
import { readLabPreferences } from "@/lib/continuity-lab/lab-preferences-storage";
import { fetchRepoIndexStatuses, type RepoIndexStatus } from "@/lib/continuity-lab/wiki-api";
import { useLiveConnectors } from "@/lib/continuity-lab/use-live-connectors";
import {
  DEFAULT_REVIEW_RULE_FILE,
  readLabReviewSettings,
  saveLabReviewSettings,
  type LabReviewEnrollMode,
  type LabReviewEnrolledRepo,
  type LabReviewEnrolledUser,
  type LabReviewSettings,
} from "@/lib/continuity-lab/lab-review-settings-storage";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 450;

type EnrollTab = "repositories" | "users";
type RepoModeFilter = "all_modes" | LabReviewEnrollMode;

const inputClass =
  "h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none";

const MODE_OPTIONS: { value: LabReviewEnrollMode; label: string }[] = [
  { value: "auto_review", label: "Auto review" },
  { value: "on_pr_creation", label: "On PR creation" },
];

const FILTER_OPTIONS: { value: RepoModeFilter; label: string }[] = [
  { value: "all_modes", label: "All modes" },
  { value: "auto_review", label: "Auto review" },
  { value: "on_pr_creation", label: "On PR creation" },
];

function sortReposByIndexed(repos: RepoOption[]): RepoOption[] {
  return [...repos].sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  });
}

function formatIndexLabel(entry: RepoIndexStatus | undefined): string {
  if (!entry) return "Index status unknown";
  if (entry.status === "indexed") {
    return entry.updatedAt ? `Indexed · ${formatRelativeTime(entry.updatedAt)}` : "Indexed";
  }
  if (entry.status === "generating") return "Indexing…";
  return "Not indexed";
}

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}

export function ContinuityLabOrgReviewSettingsSection() {
  const liveConnectors = useLiveConnectors();
  const { organization } = useOrganization();
  const { user } = useUser();
  const github = liveConnectors.github;

  const [settings, setSettings] = useState<LabReviewSettings>(readLabReviewSettings);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [failedPatch, setFailedPatch] = useState<Partial<LabReviewSettings> | null>(null);
  const [enrollTab, setEnrollTab] = useState<EnrollTab>("repositories");
  const [repoFilter, setRepoFilter] = useState<RepoModeFilter>("all_modes");
  const [repoSearch, setRepoSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [ruleGlobDraft, setRuleGlobDraft] = useState("");
  const [indexByRepo, setIndexByRepo] = useState<Record<string, RepoIndexStatus>>({});
  const skipNextSaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

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

  const applyRemote = useCallback((next: LabReviewSettings) => {
    skipNextSaveRef.current = true;
    setSettings(next);
    saveLabReviewSettings(next, { broadcast: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const orgId = organization?.id?.trim() ?? "";
    void (async () => {
      const remote = await loadLabReviewSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        applyRemote(remote.settings);
      } else {
        const local = loadLabReviewSettingsLocalFallback(orgId);
        applyRemote(local.settings);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [organization?.id, applyRemote]);

  useEffect(() => {
    function onSettingsChanged(event: Event) {
      const detail = (event as CustomEvent<LabReviewSettingsChangedDetail>).detail;
      if (detail?.settings) applyRemote(detail.settings);
    }
    window.addEventListener(LAB_REVIEW_SETTINGS_CHANGED_EVENT, onSettingsChanged);
    return () => window.removeEventListener(LAB_REVIEW_SETTINGS_CHANGED_EVENT, onSettingsChanged);
  }, [applyRemote]);

  const enrolledRepoNamesKey = useMemo(
    () => settings.enrolledRepos.map((r) => r.repo).sort().join(","),
    [settings.enrolledRepos],
  );

  useEffect(() => {
    const names = settings.enrolledRepos.map((r) => r.repo);
    if (names.length === 0) {
      setIndexByRepo({});
      return;
    }
    let cancelled = false;
    void fetchRepoIndexStatuses(names).then((entries) => {
      if (cancelled) return;
      const next: Record<string, RepoIndexStatus> = {};
      for (const entry of entries) next[entry.fullName] = entry;
      setIndexByRepo(next);
    });
    return () => {
      cancelled = true;
    };
  }, [enrolledRepoNamesKey, github.connected, github.lastSyncAt]);

  const githubRepoSet = useMemo(
    () => new Set(github.repos.map((repo) => repo.fullName)),
    [github.repos],
  );

  const persistToApi = useCallback(async (partial: Partial<LabReviewSettings>) => {
    setSaveState("saving");
    setFailedPatch(null);
    const saved = await patchLabReviewSettingsToApi(partial);
    if (saved) {
      applyRemote(saved.settings);
      const refreshed = await fetchLabReviewSettingsFromApi();
      if (refreshed) applyRemote(refreshed.settings);
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

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persistToApi(settingsRef.current);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [settings, loaded, persistToApi]);

  function updateSettings(partial: Partial<LabReviewSettings>) {
    const next = saveLabReviewSettings(partial);
    setSettings(next);
  }

  const filteredEnrolledRepos = useMemo(() => {
    const q = repoSearch.trim().toLowerCase();
    return settings.enrolledRepos.filter((row) => {
      if (repoFilter !== "all_modes" && row.mode !== repoFilter) return false;
      if (q && !row.repo.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [settings.enrolledRepos, repoFilter, repoSearch]);

  const filteredEnrolledUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return settings.enrolledUsers;
    return settings.enrolledUsers.filter((u) => {
      const name = (u.displayName ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || u.id.toLowerCase().includes(q);
    });
  }, [settings.enrolledUsers, userSearch]);

  const enrolledRepoNames = useMemo(
    () => settings.enrolledRepos.map((r) => r.repo),
    [settings.enrolledRepos],
  );

  function handleAddRepos(fullNames: string[]) {
    const existing = new Set(settings.enrolledRepos.map((r) => r.repo));
    const added: LabReviewEnrolledRepo[] = fullNames
      .filter((name) => !existing.has(name))
      .map((repo) => ({ repo, mode: "auto_review" as LabReviewEnrollMode }));
    if (added.length === 0) return;
    updateSettings({ enrolledRepos: [...settings.enrolledRepos, ...added] });
  }

  function updateRepoMode(repo: string, mode: LabReviewEnrollMode) {
    updateSettings({
      enrolledRepos: settings.enrolledRepos.map((row) =>
        row.repo === repo ? { ...row, mode } : row,
      ),
    });
  }

  function removeRepo(repo: string) {
    updateSettings({
      enrolledRepos: settings.enrolledRepos.filter((row) => row.repo !== repo),
    });
  }

  function enrollSelf() {
    const id = user?.id?.trim();
    if (!id) return;
    if (settings.enrolledUsers.some((u) => u.id === id)) return;
    const entry: LabReviewEnrolledUser = {
      id,
      displayName:
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
        undefined,
      email: user?.primaryEmailAddress?.emailAddress?.trim() || undefined,
    };
    updateSettings({ enrolledUsers: [...settings.enrolledUsers, entry] });
  }

  function removeUser(id: string) {
    updateSettings({
      enrolledUsers: settings.enrolledUsers.filter((u) => u.id !== id),
    });
  }

  function addRuleFile() {
    const glob = ruleGlobDraft.trim();
    if (!glob || glob === DEFAULT_REVIEW_RULE_FILE.glob) return;
    if (settings.ruleFiles.some((f) => f.glob === glob)) {
      setRuleGlobDraft("");
      return;
    }
    updateSettings({
      ruleFiles: [
        ...settings.ruleFiles,
        { id: `rule-${Date.now()}`, glob },
      ],
    });
    setRuleGlobDraft("");
  }

  function removeRuleFile(id: string) {
    updateSettings({
      ruleFiles: settings.ruleFiles.filter((f) => f.id !== id || f.isDefault),
    });
  }

  const customRuleFiles = settings.ruleFiles.filter((f) => !f.isDefault);
  const selfEnrolled = user?.id
    ? settings.enrolledUsers.some((u) => u.id === user.id)
    : false;

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="review"
      titleOverride="Review"
      descriptionOverride="Organization preferences and settings for MemoryOS Review"
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Review" },
      ]}
    >
      <Link
        href={SETTINGS_INDEX_PATH}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to organization
      </Link>

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
        <p className="text-xs text-white/40">Saving…</p>
      ) : saveState === "saved" ? (
        <p className="text-xs text-emerald-300/90">Saved</p>
      ) : null}

      <SettingsCard title="PR descriptions">
        <SettingsFlatPanel>
          <SettingsFieldRow
            label='Add "MemoryOS Review" link in PR description'
            hint="Appends a link to your MemoryOS Review panel on enrolled pull requests"
          >
            <SettingsToggle
              label='Add "MemoryOS Review" link in PR description'
              checked={settings.addReviewLinkInPrDescription}
              onChange={(next) => updateSettings({ addReviewLinkInPrDescription: next })}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard
        title="Post as PR comments"
        description="Choose which analysis types are posted to your git provider on pull requests."
      >
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Bugs — likely errors"
            hint="High-confidence issues that should be fixed before merge"
          >
            <SettingsToggle
              label="Bugs — likely errors"
              checked={settings.postCommentsBugs}
              onChange={(next) => updateSettings({ postCommentsBugs: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Flags (investigate) — potential issues"
            hint="Findings that may need human judgment"
          >
            <SettingsToggle
              label="Flags (investigate) — potential issues"
              checked={settings.postCommentsFlagsInvestigate}
              onChange={(next) => updateSettings({ postCommentsFlagsInvestigate: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Flags (note) — informational"
            hint="Non-blocking notes and context for reviewers"
          >
            <SettingsToggle
              label="Flags (note) — informational"
              checked={settings.postCommentsFlagsNote}
              onChange={(next) => updateSettings({ postCommentsFlagsNote: next })}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Post GitHub CI checks">
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Commit status check"
            hint="Publish a GitHub check run summarizing MemoryOS Review results (requires GitHub connector)"
          >
            <SettingsToggle
              label="Commit status check"
              checked={settings.postGithubCiChecks}
              onChange={(next) => updateSettings({ postGithubCiChecks: next })}
              disabled={!github.connected}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
        {!github.connected ? (
          <p className="text-xs text-white/40">
            Connect GitHub in{" "}
            <Link
              href="/continuity-lab/settings/connections"
              className="text-indigo-300 hover:text-indigo-200"
            >
              Organization → Connections
            </Link>{" "}
            to enable CI checks.
          </p>
        ) : null}
      </SettingsCard>

      <SettingsCard
        title="Automatic review"
        description="MemoryOS Review runs on enrolled repositories and for enrolled users. Automation hooks into the execution engine when enabled."
        actions={
          <Link
            href="/continuity-lab/review"
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Open Review
          </Link>
        }
      >
        <SettingsTabPills
          tabs={[
            {
              id: "repositories" as const,
              label: "Repositories",
              count: settings.enrolledRepos.length,
            },
            {
              id: "users" as const,
              label: "Users",
              count: settings.enrolledUsers.length,
            },
          ]}
          active={enrollTab}
          onChange={setEnrollTab}
        />

        {enrollTab === "repositories" ? (
          <div className="mt-4 space-y-3">
            <SettingsToolbar>
              <SettingsSearchInput
                value={repoSearch}
                onChange={setRepoSearch}
                placeholder="Search repositories"
                className="max-w-xs"
              />
              <SettingsSelect<RepoModeFilter>
                value={repoFilter}
                onChange={setRepoFilter}
                options={FILTER_OPTIONS}
              />
              {github.connected ? (
                <SettingsPrimaryButton onClick={() => setRepoModalOpen(true)}>
                  Add repository
                </SettingsPrimaryButton>
              ) : (
                <span className="inline-flex h-9 cursor-not-allowed items-center rounded-md bg-white/30 px-3.5 text-sm font-medium text-[#0A0A0A]/60">
                  Add repository
                </span>
              )}
            </SettingsToolbar>

            {settings.enrolledRepos.length === 0 ? (
              <div className="rounded-md border border-white/[0.08] bg-[#111111] px-4 py-8 text-center">
                <p className="text-sm text-white/55">No repositories enrolled yet.</p>
                <p className="mt-1 text-xs text-white/40">
                  Add repos to run automatic MemoryOS Review on pull requests.
                </p>
                {github.connected ? (
                  <div className="mt-4">
                    <SettingsPrimaryButton onClick={() => setRepoModalOpen(true)}>
                      Add repository
                    </SettingsPrimaryButton>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-white/40">
                    Connect GitHub to browse and enroll repositories.
                  </p>
                )}
              </div>
            ) : filteredEnrolledRepos.length === 0 ? (
              <p className="text-sm text-white/50">No enrolled repos match your filters.</p>
            ) : (
              <SettingsFlatPanel className="!px-0">
                <ul>
                  {filteredEnrolledRepos.map((row) => {
                    const connected = github.connected && githubRepoSet.has(row.repo);
                    const indexEntry = indexByRepo[row.repo];
                    const triggerLabel = resolveReviewTriggerForEnrollment(
                      row.mode,
                      readLabPreferences(),
                    );
                    return (
                    <li
                      key={row.repo}
                      className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-sm text-white">
                          {row.repo}
                        </span>
                        <p className="mt-0.5 text-[11px] text-white/40">
                          <span
                            className={cn(
                              connected ? "text-emerald-300/80" : "text-amber-200/80",
                            )}
                          >
                            {connected ? "Connected" : "Disconnected"}
                          </span>
                          {" · "}
                          {formatIndexLabel(indexEntry)}
                          {" · "}
                          Trigger: {triggerLabel.replace(/_/g, " ")}
                        </p>
                      </div>
                      <SettingsSelect<LabReviewEnrollMode>
                        value={row.mode}
                        onChange={(mode) => updateRepoMode(row.repo, mode)}
                        options={MODE_OPTIONS}
                      />
                      <button
                        type="button"
                        onClick={() => removeRepo(row.repo)}
                        className="inline-flex size-8 items-center justify-center rounded-md border border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white"
                        aria-label={`Remove ${row.repo}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                  })}
                </ul>
              </SettingsFlatPanel>
            )}
            <p className="text-[11px] text-white/35">
              Batch PR automation on GitHub webhooks is not wired yet; enrollment and comment
              preferences sync to the server on every change.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <SettingsToolbar>
              <SettingsSearchInput
                value={userSearch}
                onChange={setUserSearch}
                placeholder="Search users"
                className="max-w-xs"
              />
              {!selfEnrolled && user?.id ? (
                <SettingsSecondaryButton onClick={enrollSelf}>
                  Enroll me
                </SettingsSecondaryButton>
              ) : null}
            </SettingsToolbar>

            {settings.enrolledUsers.length === 0 ? (
              <div className="rounded-md border border-white/[0.08] bg-[#111111] px-4 py-8 text-center">
                <p className="text-sm text-white/55">No users enrolled yet.</p>
                <p className="mt-1 text-xs text-white/40">
                  Enroll yourself or teammates to trigger review on their pull requests.
                </p>
                {user?.id ? (
                  <div className="mt-4">
                    <SettingsSecondaryButton onClick={enrollSelf}>
                      Enroll me for automatic review
                    </SettingsSecondaryButton>
                  </div>
                ) : null}
              </div>
            ) : filteredEnrolledUsers.length === 0 ? (
              <p className="text-sm text-white/50">No enrolled users match your search.</p>
            ) : (
              <SettingsFlatPanel className="!px-0">
                <ul>
                  {filteredEnrolledUsers.map((row) => {
                    const isSelf = user?.id === row.id;
                    return (
                    <li
                      key={row.id}
                      className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {row.displayName ?? row.email ?? row.id}
                          {isSelf ? (
                            <span className="ml-2 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200/90">
                              You
                            </span>
                          ) : null}
                        </p>
                        {row.email && row.displayName ? (
                          <p className="text-xs text-white/45">{row.email}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUser(row.id)}
                        className="inline-flex size-8 items-center justify-center rounded-md border border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white"
                        aria-label="Remove user"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                  })}
                </ul>
              </SettingsFlatPanel>
            )}
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        title="Rules"
        description="Add context to help MemoryOS find bugs. Rule files are matched against changed paths in each pull request."
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-xs font-medium text-white/70">
            Files
            <input
              type="text"
              value={ruleGlobDraft}
              onChange={(e) => setRuleGlobDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRuleFile();
                }
              }}
              placeholder="e.g. docs/**/*.md"
              className={cn(inputClass, "mt-1 font-mono text-xs")}
            />
          </label>
          <SettingsSecondaryButton onClick={addRuleFile} disabled={!ruleGlobDraft.trim()}>
            <Plus className="size-3.5" aria-hidden />
            Add
          </SettingsSecondaryButton>
        </div>

        <SettingsFlatPanel className="mt-3 !px-0">
          <ul>
            <li className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
              <span className="font-mono text-sm text-white">{DEFAULT_REVIEW_RULE_FILE.glob}</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                Default
              </span>
            </li>
            {customRuleFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-white">
                  {file.glob}
                </span>
                <button
                  type="button"
                  onClick={() => removeRuleFile(file.id)}
                  className="inline-flex size-8 items-center justify-center rounded-md border border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white"
                  aria-label={`Remove ${file.glob}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </SettingsFlatPanel>
        <p className="text-xs text-white/40">
          Rule files closest to changed files in the diff are preferred. Keep repo-specific guidance
          in <span className="font-mono text-white/55">/REVIEW.md</span> at the repository root.
        </p>
      </SettingsCard>

      <SettingsRowLink
        href="/continuity-lab/review"
        label="MemoryOS Review"
        detail="Run ad-hoc PR reviews with organizational memory"
      />

      <ContinuityLabRepoSelectModal
        open={repoModalOpen}
        onClose={() => setRepoModalOpen(false)}
        selected={enrolledRepoNames}
        onConfirm={handleAddRepos}
        lastSyncAt={github.lastSyncAt}
        initialRepos={repoOptions}
      />
    </ContinuityLabSettingsSectionFrame>
  );
}
