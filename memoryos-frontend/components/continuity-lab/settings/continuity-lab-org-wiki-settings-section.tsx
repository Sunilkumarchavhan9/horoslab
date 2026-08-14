"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
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
  SettingsSearchInput,
  SettingsSecondaryButton,
  SettingsSelect,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  fetchLabWikiSettingsFromApi,
  loadLabWikiSettingsHybrid,
  loadLabWikiSettingsLocalFallback,
  patchLabWikiSettingsToApi,
} from "@/lib/continuity-lab/lab-wiki-settings-api";
import {
  LAB_WIKI_SETTINGS_CHANGED_EVENT,
  type LabWikiSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-wiki-settings-events";
import {
  formatWikiBranchIndexLabel,
  shouldShowWikiReindexHint,
  WIKI_SCHEDULED_REGENERATION_NOTE,
} from "@/lib/continuity-lab/lab-wiki-settings-runtime";
import {
  readLabWikiSettings,
  saveLabWikiSettings,
  WIKI_EFFORT_OPTIONS,
  WIKI_FREQUENCY_OPTIONS,
  WIKI_LANGUAGE_OPTIONS,
  type LabWikiEffort,
  type LabWikiEnrolledRepo,
  type LabWikiFrequency,
  type LabWikiLanguageCode,
  type LabWikiSettings,
} from "@/lib/continuity-lab/lab-wiki-settings-storage";
import { fetchRepoIndexStatuses, type RepoIndexStatus } from "@/lib/continuity-lab/wiki-api";
import { useLiveConnectors } from "@/lib/continuity-lab/use-live-connectors";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 450;

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

function wikiRepoIndexingPath(fullName: string): string {
  const parts = parseRepoParts(fullName);
  if (!parts) return "/continuity-lab/settings/wiki";
  return `/continuity-lab/settings/wiki/repositories/${[
    parts.owner,
    parts.repo,
  ]
    .map(encodeURIComponent)
    .join("/")}`;
}

export function ContinuityLabOrgWikiSettingsSection() {
  const router = useRouter();
  const liveConnectors = useLiveConnectors();
  const { organization } = useOrganization();
  const github = liveConnectors.github;

  const [settings, setSettings] = useState<LabWikiSettings>(readLabWikiSettings);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [failedPatch, setFailedPatch] = useState<Partial<LabWikiSettings> | null>(null);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [indexByRepo, setIndexByRepo] = useState<Record<string, RepoIndexStatus>>({});
  const [reindexHint, setReindexHint] = useState(false);
  const [refreshingIndex, setRefreshingIndex] = useState(false);
  const skipNextSaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  const prevSettingsRef = useRef<LabWikiSettings | null>(null);
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

  const applyRemote = useCallback((next: LabWikiSettings) => {
    skipNextSaveRef.current = true;
    setSettings(next);
    saveLabWikiSettings(next, { broadcast: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const orgId = organization?.id?.trim() ?? "";
    void (async () => {
      const remote = await loadLabWikiSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        applyRemote(remote.settings);
      } else {
        const local = loadLabWikiSettingsLocalFallback(orgId);
        applyRemote(local.settings);
      }
      prevSettingsRef.current = readLabWikiSettings();
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [organization?.id, applyRemote]);

  useEffect(() => {
    function onSettingsChanged(event: Event) {
      const detail = (event as CustomEvent<LabWikiSettingsChangedDetail>).detail;
      if (detail?.settings) applyRemote(detail.settings);
    }
    window.addEventListener(LAB_WIKI_SETTINGS_CHANGED_EVENT, onSettingsChanged);
    return () => window.removeEventListener(LAB_WIKI_SETTINGS_CHANGED_EVENT, onSettingsChanged);
  }, [applyRemote]);

  const enrolledRepoNamesKey = useMemo(
    () => settings.enrolledRepos.map((r) => r.repo).sort().join(","),
    [settings.enrolledRepos],
  );

  const refreshIndexStatuses = useCallback(async () => {
    const names = settingsRef.current.enrolledRepos.map((r) => r.repo);
    if (names.length === 0) {
      setIndexByRepo({});
      return;
    }
    setRefreshingIndex(true);
    try {
      const entries = await fetchRepoIndexStatuses(names);
      const next: Record<string, RepoIndexStatus> = {};
      for (const entry of entries) next[entry.fullName] = entry;
      setIndexByRepo(next);
    } finally {
      setRefreshingIndex(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const names = settings.enrolledRepos.map((r) => r.repo);
      if (names.length === 0) {
        if (!cancelled) setIndexByRepo({});
        return;
      }
      const entries = await fetchRepoIndexStatuses(names);
      if (cancelled) return;
      const next: Record<string, RepoIndexStatus> = {};
      for (const entry of entries) next[entry.fullName] = entry;
      setIndexByRepo(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [enrolledRepoNamesKey, settings.enrolledRepos, github.connected, github.lastSyncAt]);

  const githubRepoSet = useMemo(
    () => new Set(github.repos.map((repo) => repo.fullName)),
    [github.repos],
  );

  const persistToApi = useCallback(async (partial: Partial<LabWikiSettings>) => {
    setSaveState("saving");
    setFailedPatch(null);
    const saved = await patchLabWikiSettingsToApi(partial);
    if (saved) {
      applyRemote(saved.settings);
      const refreshed = await fetchLabWikiSettingsFromApi();
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

  function updateSettingsLocal(
    partial: Partial<LabWikiSettings>,
    options?: { skipReindexHint?: boolean },
  ) {
    const prev = prevSettingsRef.current ?? readLabWikiSettings();
    const next = saveLabWikiSettings(partial);
    if (!options?.skipReindexHint && shouldShowWikiReindexHint(prev, next)) {
      setReindexHint(true);
    }
    prevSettingsRef.current = next;
    setSettings(next);
  }

  const filteredEnrolledRepos = useMemo(() => {
    const q = repoSearch.trim().toLowerCase();
    if (!q) return settings.enrolledRepos;
    return settings.enrolledRepos.filter((row) => row.repo.toLowerCase().includes(q));
  }, [settings.enrolledRepos, repoSearch]);

  const enrolledRepoNames = useMemo(
    () => settings.enrolledRepos.map((r) => r.repo),
    [settings.enrolledRepos],
  );

  function handleAddRepos(fullNames: string[]) {
    const existing = new Set(settings.enrolledRepos.map((r) => r.repo));
    const added: LabWikiEnrolledRepo[] = fullNames
      .filter((name) => !existing.has(name))
      .map((repo) => ({ repo }));
    if (added.length === 0) return;
    updateSettingsLocal({ enrolledRepos: [...settings.enrolledRepos, ...added] });
    setRepoModalOpen(false);
    router.push(wikiRepoIndexingPath(added[0]!.repo));
  }

  function removeRepo(repo: string) {
    updateSettingsLocal({
      enrolledRepos: settings.enrolledRepos.filter((row) => row.repo !== repo),
    });
  }

  function toggleLanguage(code: LabWikiLanguageCode) {
    const current = new Set(settings.languages);
    if (code === "en") {
      if (!current.has("en")) current.add("en");
      return;
    }
    if (current.has(code)) {
      current.delete(code);
    } else {
      current.add(code);
    }
    if (!current.has("en")) current.add("en");
    updateSettingsLocal({ languages: [...current] });
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="wiki"
      titleOverride="Wiki"
      descriptionOverride="Choose how MemoryOS Wiki generates and displays content for your organization"
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Wiki" },
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

      {reindexHint ? (
        <div className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100/90">
          <p className="font-medium text-indigo-50">Re-index scheduled (preference saved)</p>
          <p className="mt-1 text-indigo-100/80">{WIKI_SCHEDULED_REGENERATION_NOTE}</p>
          <button
            type="button"
            onClick={() => setReindexHint(false)}
            className="mt-2 text-[11px] font-medium text-indigo-200 underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <SettingsCard
        title="Generation"
        description="Indexes repo source for MemoryOS Wiki and Ask using your GitHub connector."
        actions={
          <Link
            href="/continuity-lab/wiki"
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Open Wiki
          </Link>
        }
      >
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Effort"
            hint="Higher effort uses more model capacity per regeneration run."
          >
            <SettingsSelect<LabWikiEffort>
              value={settings.effort}
              onChange={(effort) => updateSettingsLocal({ effort })}
              options={WIKI_EFFORT_OPTIONS.map((opt) => ({
                value: opt.value,
                label: `${opt.label} — ${opt.hint}`,
              }))}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Frequency"
            hint="How often enrolled repositories are regenerated from source."
          >
            <SettingsSelect<LabWikiFrequency>
              value={settings.frequency}
              onChange={(frequency) => updateSettingsLocal({ frequency })}
              options={WIKI_FREQUENCY_OPTIONS}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
        <p className="mt-3 text-[11px] text-white/35">{WIKI_SCHEDULED_REGENERATION_NOTE}</p>
      </SettingsCard>

      <SettingsCard
        title="Languages"
        description="Wiki and diagram generation prefer these locales. English is always included."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {WIKI_LANGUAGE_OPTIONS.map((lang) => {
            const checked = settings.languages.includes(lang.code);
            const isEnglish = lang.code === "en";
            return (
              <label
                key={lang.code}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
                  checked
                    ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                    : "border-white/[0.08] bg-[#111111] text-white/70 hover:border-white/15",
                  isEnglish && "cursor-default",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isEnglish}
                  onChange={() => toggleLanguage(lang.code)}
                  className="size-3.5 rounded border-white/20 accent-[#4338CA]"
                />
                <span>
                  {lang.label}
                  {isEnglish ? (
                    <span className="ml-1 text-[10px] text-white/40">(default)</span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Repositories"
        description="Enrolled repos appear in the MemoryOS Wiki index. Index status updates live from the connector."
      >
        <SettingsToolbar>
          <SettingsSearchInput
            value={repoSearch}
            onChange={setRepoSearch}
            placeholder="Search repositories"
            className="max-w-xs"
          />
          <SettingsSecondaryButton
            onClick={() => void refreshIndexStatuses()}
            disabled={refreshingIndex || settings.enrolledRepos.length === 0}
          >
            <RefreshCw
              className={cn("mr-1.5 size-3.5", refreshingIndex && "animate-spin")}
              aria-hidden
            />
            Refresh
          </SettingsSecondaryButton>
          {github.connected ? (
            <SettingsPrimaryButton onClick={() => setRepoModalOpen(true)}>
              Add
            </SettingsPrimaryButton>
          ) : (
            <span className="inline-flex h-9 cursor-not-allowed items-center rounded-md bg-white/30 px-3.5 text-sm font-medium text-[#0A0A0A]/60">
              Add
            </span>
          )}
        </SettingsToolbar>

        {settings.enrolledRepos.length === 0 ? (
          <div className="mt-3 rounded-md border border-white/[0.08] bg-[#111111] px-4 py-8 text-center">
            <p className="text-sm text-white/55">No repositories enrolled yet.</p>
            <p className="mt-1 text-xs text-white/40">
              Add repos to scope MemoryOS Wiki generation and the wiki home index.
            </p>
            {github.connected ? (
              <div className="mt-4">
                <SettingsPrimaryButton onClick={() => setRepoModalOpen(true)}>
                  Add repositories
                </SettingsPrimaryButton>
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/40">
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
          </div>
        ) : filteredEnrolledRepos.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">No enrolled repos match your search.</p>
        ) : (
          <SettingsFlatPanel className="mt-3 !px-0">
            <ul>
              {filteredEnrolledRepos.map((row) => {
                const connected = github.connected && githubRepoSet.has(row.repo);
                const indexEntry = indexByRepo[row.repo];
                const parts = parseRepoParts(row.repo);
                return (
                  <li
                    key={row.repo}
                    className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0"
                  >
                    <Link
                      href={wikiRepoIndexingPath(row.repo)}
                      className="min-w-0 flex-1 rounded-md outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      {parts ? (
                        <>
                          <span className="block truncate text-[11px] text-white/45">
                            {parts.owner}
                          </span>
                          <span className="block truncate font-mono text-sm text-white">
                            {parts.repo}
                          </span>
                        </>
                      ) : (
                        <span className="block truncate font-mono text-sm text-white">
                          {row.repo}
                        </span>
                      )}
                      <p className="mt-0.5 text-[11px] text-white/40">
                        <span
                          className={cn(
                            connected ? "text-emerald-300/80" : "text-amber-200/80",
                          )}
                        >
                          {connected ? "Connected" : "Disconnected"}
                        </span>
                        {" · "}
                        {formatWikiBranchIndexLabel(indexEntry, row.branchesIndexed)}
                      </p>
                    </Link>
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
        <p className="mt-3 text-[11px] text-white/35">
          Branch counts reflect default-branch index status from{" "}
          <code className="text-white/50">/api/connector/index-status</code>. Connector SSE
          refreshes GitHub repos and re-fetches index status for enrolled repos.
        </p>
      </SettingsCard>

      <ContinuityLabRepoSelectModal
        open={repoModalOpen}
        onClose={() => setRepoModalOpen(false)}
        selected={enrolledRepoNames}
        onConfirm={handleAddRepos}
        lastSyncAt={github.lastSyncAt}
        initialRepos={repoOptions}
        title="Add repositories"
        description="Choose GitHub repositories to enroll in MemoryOS Wiki."
        confirmLabel="Add repositories"
      />
    </ContinuityLabSettingsSectionFrame>
  );
}
