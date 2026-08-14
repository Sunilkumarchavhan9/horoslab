"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  FolderGit2,
  Info,
  MoreHorizontal,
  Pin,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  ContinuityLabRepoSelectModal,
  type RepoOption,
} from "@/components/continuity-lab/continuity-lab-repo-select-modal";
import { ContinuityLabRepoEnvironmentBlueprintEditor } from "@/components/continuity-lab/settings/continuity-lab-repo-environment-blueprint-editor";
import { ContinuityLabBlueprintYamlPreview } from "@/components/continuity-lab/settings/continuity-lab-blueprint-yaml-preview";
import { BlueprintToast } from "@/components/continuity-lab/settings/continuity-lab-blueprint-yaml-ide";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SettingsCard,
  SettingsFlatPanel,
  SettingsSearchInput,
  SettingsSecondaryButton,
  SettingsSelectDropdown,
  SettingsToggle,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  activateLabEnvironmentSnapshotToApi,
  buildLabEnvironmentSnapshot,
  deleteLabEnvironmentSnapshotFromApi,
  loadLabEnvironmentSettingsHybrid,
  loadLabEnvironmentSettingsLocalFallback,
  patchLabEnvironmentSettingsToApi,
} from "@/lib/continuity-lab/lab-environment-settings-api";
import {
  LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT,
  type LabEnvironmentSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-environment-settings-events";
import {
  ENVIRONMENT_SNAPSHOT_BUILD_NOTE,
  saveLabEnvironmentSettings,
  normalizeLabEnvironmentSettings,
  readLabEnvironmentSettings,
  environmentSnapshotPath,
  repoBlueprintSettingsPath,
  type LabEnvironmentEnrolledRepo,
  type LabEnvironmentSettings,
  type LabEnvironmentSnapshot,
} from "@/lib/continuity-lab/lab-environment-settings-storage";
import type { MemoryOsConnectorState } from "@/lib/continuity-lab/runtime";
import { useLiveConnectors } from "@/lib/continuity-lab/use-live-connectors";
import { SETTINGS_INDEX_PATH, settingsSectionPath } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

type EnvironmentTab = "blueprints" | "snapshots" | "migration";
type RepoFilter = "all" | "connection_issues";

const ENVIRONMENT_BLUEPRINT_PATH = `${settingsSectionPath("environment")}/blueprint`;

const REPO_FILTER_OPTIONS: { value: RepoFilter; label: string }[] = [
  { value: "all", label: "All repositories" },
  { value: "connection_issues", label: "Connection issues" },
];

const ENVIRONMENT_LEARN_MORE_URL =
  "https://docs.memoryos.dev/continuity-lab/environment";

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

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
    return date.toLocaleString();
  } catch {
    return iso;
  }
}

function formatRelativeAdded(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "Added just now";
    if (diff < 3_600_000) return `Added ${Math.floor(diff / 60_000)} minutes ago`;
    if (diff < 86_400_000) return `Added ${Math.floor(diff / 3_600_000)} hours ago`;
    return `Added ${new Date(iso).toLocaleDateString()}`;
  } catch {
    return "Added recently";
  }
}

function hasRepoConnectionIssue(
  repo: string,
  github: MemoryOsConnectorState["payload"]["github"],
): boolean {
  if (!github.connected) return true;
  const status = github.status.toLowerCase();
  if (
    status === "error" ||
    status === "sync_failed" ||
    status === "disconnected" ||
    status === "not_connected"
  ) {
    return true;
  }
  const indexed = new Set(github.repos.map((row) => row.fullName));
  return !indexed.has(repo);
}

function activeSnapshot(settings: LabEnvironmentSettings): LabEnvironmentSnapshot | null {
  return settings.snapshots.find((row) => row.active) ?? settings.snapshots[0] ?? null;
}

function snapshotStatusLabel(snapshot: LabEnvironmentSnapshot | null): string {
  if (!snapshot) return "No snapshot yet";
  if (snapshot.status === "success") return "Success";
  if (snapshot.status === "failed") return "Failed";
  return "Building";
}

function EnvironmentTabs({
  active,
  onChange,
}: {
  active: EnvironmentTab;
  onChange: (tab: EnvironmentTab) => void;
}) {
  const tabs: { id: EnvironmentTab; label: string }[] = [
    { id: "blueprints", label: "Blueprints" },
    { id: "snapshots", label: "Snapshots" },
    { id: "migration", label: "Migration" },
  ];

  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Environment settings">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "h-9 rounded-md px-3 text-sm font-semibold transition",
            active === item.id
              ? "bg-white/[0.06] text-white"
              : "text-white/45 hover:bg-white/[0.03] hover:text-white/70",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function EnvironmentMetricCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-md border border-white/[0.07] bg-[#1a1a1a] px-5 py-5">
      <div className="flex items-center gap-1.5 text-sm font-medium text-white/45">
        <span>{label}</span>
        <Info className="size-3.5 text-white/35" aria-hidden />
      </div>
      <div className="mt-2 min-h-8 text-[22px] font-medium leading-snug text-white">{value}</div>
    </div>
  );
}

function MigrationSessionDialog({
  open,
  onClose,
  repos,
  search,
  selected,
  onSearchChange,
  onSelectionChange,
  onRun,
  running,
}: {
  open: boolean;
  onClose: () => void;
  repos: LabEnvironmentEnrolledRepo[];
  search: string;
  selected: string[];
  onSearchChange: (value: string) => void;
  onSelectionChange: (repos: string[]) => void;
  onRun: () => void;
  running: boolean;
}) {
  const query = search.trim().toLowerCase();
  const filtered = repos.filter((row) => !query || row.repo.toLowerCase().includes(query));
  const selectedSet = new Set(selected);
  const allSelected = repos.length > 0 && selected.length === repos.length;

  function toggleAll() {
    onSelectionChange(allSelected ? [] : repos.map((row) => row.repo));
  }

  function toggleRepo(repo: string) {
    if (selectedSet.has(repo)) {
      onSelectionChange(selected.filter((item) => item !== repo));
      return;
    }
    onSelectionChange([...selected, repo]);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100vw-2rem)] rounded-md border border-white/[0.1] bg-[#1f1f1f] p-6 text-white shadow-2xl shadow-black/50 sm:max-w-[820px]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white/75"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Run migration session
          </DialogTitle>
          <DialogDescription className="max-w-[720px] text-base font-medium leading-snug text-white/45">
            Starts a session to draft or refine blueprints for the selected repositories. MemoryOS
            inspects your current snapshot and writes blueprints for the declarative environment.{" "}
            <a
              href={ENVIRONMENT_LEARN_MORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38BDF8] underline decoration-[#38BDF8]/40 underline-offset-2"
            >
              Learn more
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3">
          <p className="text-base font-semibold text-white">
            Repositories for this session ({selected.length})
          </p>
          <div className="mt-3 overflow-hidden rounded-md border border-white/[0.08] bg-[#1b1b1b]">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
              <button
                type="button"
                onClick={toggleAll}
                disabled={repos.length === 0}
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded border border-white/[0.14] bg-white/[0.03]",
                  repos.length === 0 && "cursor-not-allowed opacity-40",
                )}
                aria-label={allSelected ? "Clear selected repositories" : "Select all repositories"}
              >
                {allSelected ? <Check className="size-3.5 text-white/75" /> : null}
              </button>
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search repositories..."
                  className="h-8 w-full bg-transparent pl-8 text-base font-medium text-white outline-none placeholder:text-white/35"
                />
              </div>
            </div>
            <div className="min-h-[124px] max-h-[300px] overflow-y-auto">
              {repos.length === 0 ? (
                <div className="flex min-h-[124px] items-center justify-center px-6 text-center text-base font-semibold text-white/45">
                  All repositories have been migrated
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex min-h-[124px] items-center justify-center px-6 text-center text-sm text-white/45">
                  No repositories match your search.
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.06]">
                  {filtered.map((row) => {
                    const parts = parseRepoParts(row.repo);
                    const checked = selectedSet.has(row.repo);
                    return (
                      <li key={row.repo}>
                        <button
                          type="button"
                          onClick={() => toggleRepo(row.repo)}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-white/[0.03]"
                        >
                          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded border border-white/[0.14] bg-white/[0.03]">
                            {checked ? <Check className="size-3.5 text-white/75" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-white">
                              {parts?.repo ?? row.repo}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-white/45">
                              {parts ? `${parts.owner} · ` : ""}
                              {formatRelativeAdded(row.addedAt)}
                            </span>
                          </span>
                          <span className="text-xs text-white/45">
                            {row.included ? "Included" : "Excluded"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/[0.08]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onRun}
            disabled={selected.length === 0 || running}
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-[#2F6FEA] px-3.5 text-sm font-semibold text-white transition hover:bg-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {running
              ? "Running..."
              : `Run migration session (${selected.length} ${selected.length === 1 ? "repository" : "repositories"})`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RevertClassicDialog({
  open,
  onClose,
  onConfirm,
  blueprintCount,
  latestBuild,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  blueprintCount: number;
  latestBuild: string;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100vw-2rem)] rounded-md border border-white/[0.1] bg-[#1f1f1f] p-6 text-white shadow-2xl shadow-black/50 sm:max-w-[760px]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white/75"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Revert to classic environment?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-base font-semibold text-white/45">
          <ul className="ml-5 list-disc space-y-1.5">
            <li>New sessions will use the classic environment</li>
            <li>Active sessions continue on declarative until they end</li>
            <li>
              {blueprintCount} {blueprintCount === 1 ? "blueprint" : "blueprints"} preserved
            </li>
            <li>Latest build: {latestBuild}</li>
          </ul>
          <p>You can switch back anytime.</p>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/[0.08]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-md bg-[#FF3B3B] px-3.5 text-sm font-semibold text-white transition hover:bg-[#FF4B4B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Reverting..." : "Revert to classic"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ContinuityLabOrgEnvironmentSettingsSection() {
  const liveConnectors = useLiveConnectors();
  const { organization } = useOrganization();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const github = liveConnectors.github;

  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<EnvironmentTab>(
    initialTab === "snapshots" || initialTab === "migration" ? initialTab : "blueprints",
  );
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [settings, setSettings] = useState<LabEnvironmentSettings>(() =>
    normalizeLabEnvironmentSettings(undefined),
  );
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [failedPatch, setFailedPatch] = useState<Partial<LabEnvironmentSettings> | null>(null);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoFilter, setRepoFilter] = useState<RepoFilter>("all");
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [migrationSearch, setMigrationSearch] = useState("");
  const [migrationSelection, setMigrationSelection] = useState<string[]>([]);
  const [buildingSnapshot, setBuildingSnapshot] = useState(false);
  const [revertingClassic, setRevertingClassic] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [buildToast, setBuildToast] = useState<string | null>(null);
  const skipNextSaveRef = useRef(true);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const applyRemote = useCallback((next: LabEnvironmentSettings) => {
    const normalized = normalizeLabEnvironmentSettings(next);
    skipNextSaveRef.current = true;
    setSettings(normalized);
    saveLabEnvironmentSettings(normalized, { broadcast: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const orgId = organization?.id?.trim() ?? "";
    void (async () => {
      setLoadError(null);
      const localBeforeFetch = readLabEnvironmentSettings();
      const remote = await loadLabEnvironmentSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        let nextSettings = remote.settings;
        if (
          nextSettings.enrolledRepos.length === 0 &&
          localBeforeFetch.enrolledRepos.length > 0
        ) {
          nextSettings = normalizeLabEnvironmentSettings({
            ...nextSettings,
            enrolledRepos: localBeforeFetch.enrolledRepos,
          });
          void patchLabEnvironmentSettingsToApi({
            enrolledRepos: localBeforeFetch.enrolledRepos,
          });
        }
        applyRemote(nextSettings);
      } else {
        applyRemote(loadLabEnvironmentSettingsLocalFallback(orgId).settings);
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
      const detail = (event as CustomEvent<LabEnvironmentSettingsChangedDetail>).detail;
      if (detail?.settings) applyRemote(detail.settings);
    }
    window.addEventListener(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, onSettingsChanged);
    return () =>
      window.removeEventListener(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, onSettingsChanged);
  }, [applyRemote]);

  const persistToApi = useCallback(async (partial: Partial<LabEnvironmentSettings>) => {
    setSaveState("saving");
    setFailedPatch(null);
    const saved = await patchLabEnvironmentSettingsToApi(partial);
    if (saved) {
      applyRemote(saved.settings);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return true;
    }
    setFailedPatch(partial);
    setSaveState("error");
    return false;
  }, [applyRemote]);

  useEffect(() => {
    if (!loaded || skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void persistToApi(settingsRef.current);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [settings, loaded, persistToApi]);

  useEffect(() => {
    if (!loaded) return;
    return () => {
      void patchLabEnvironmentSettingsToApi(settingsRef.current);
    };
  }, [loaded]);

  function updateSettingsLocal(partial: Partial<LabEnvironmentSettings>) {
    const next = saveLabEnvironmentSettings(partial);
    setSettings(next);
  }

  async function persistEnrolledRepos(nextRepos: LabEnvironmentEnrolledRepo[]) {
    skipNextSaveRef.current = true;
    updateSettingsLocal({ enrolledRepos: nextRepos });
    await persistToApi({ enrolledRepos: nextRepos });
  }

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

  const filteredRepos = useMemo(() => {
    const q = repoSearch.trim().toLowerCase();
    return settings.enrolledRepos.filter((row) => {
      if (repoFilter === "connection_issues" && !hasRepoConnectionIssue(row.repo, github)) {
        return false;
      }
      if (q && !row.repo.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [settings.enrolledRepos, repoSearch, repoFilter, github]);

  const includedCount = settings.enrolledRepos.filter((row) => row.included).length;
  const active = activeSnapshot(settings);
  const orgBlueprintContent = settings.blueprintMarkdown?.trim() || null;
  const orgBlueprintUpdatedAt = settings.blueprintVersions[0]?.savedAt ?? null;
  const repoBlueprintCount = Object.values(settings.repoBlueprints).filter((blueprint) =>
    blueprint.content?.trim(),
  ).length;
  const totalBlueprintCount = (orgBlueprintContent ? 1 : 0) + repoBlueprintCount;
  const migratedCount = settings.migrationCompletedAt ? includedCount : 0;
  const latestBuildLabel = active ? `${snapshotStatusLabel(active)} · ${formatWhen(active.builtAt)}` : "—";
  const migrationProgressLabel =
    includedCount === 0 ? "—" : settings.migrationCompletedAt ? "Complete" : "Pending";
  const migrationCandidates = useMemo(
    () => (settings.migrationCompletedAt ? [] : settings.enrolledRepos.filter((row) => row.included)),
    [settings.enrolledRepos, settings.migrationCompletedAt],
  );

  function openMigrationModal() {
    setMigrationSearch("");
    setMigrationSelection(migrationCandidates.map((row) => row.repo));
    setMigrationModalOpen(true);
  }

  function handleAddRepos(fullNames: string[]) {
    const existing = new Set(settings.enrolledRepos.map((row) => row.repo));
    const added = fullNames.filter((name) => !existing.has(name));
    if (added.length === 0) return;
    const now = new Date().toISOString();
    const nextRepos: LabEnvironmentEnrolledRepo[] = [
      ...settings.enrolledRepos,
      ...added.map((repo) => ({ repo, addedAt: now, included: true })),
    ];
    void persistEnrolledRepos(nextRepos);
  }

  function removeRepo(repo: string) {
    const nextRepos = settings.enrolledRepos.filter((row) => row.repo !== repo);
    void persistEnrolledRepos(nextRepos);
    if (selectedRepo === repo) setSelectedRepo(null);
  }

  function moveRepo(repo: string, direction: -1 | 1) {
    const index = settings.enrolledRepos.findIndex((row) => row.repo === repo);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= settings.enrolledRepos.length) return;
    const next = [...settings.enrolledRepos];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    void persistEnrolledRepos(next);
  }

  async function handleBuildSnapshot(nextTab: EnvironmentTab = "snapshots") {
    setBuildingSnapshot(true);
    setBuildError(null);
    const saved = await buildLabEnvironmentSnapshot({
      triggeredBy: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? null,
    });
    if (saved) {
      applyRemote(saved.settings);
      setBuildToast("Build started");
      setTab(nextTab);
    } else {
      setBuildError("Could not record snapshot. Check server connection.");
    }
    setBuildingSnapshot(false);
  }

  async function handleRunMigrationSession() {
    if (migrationSelection.length === 0) return;
    setMigrationModalOpen(false);
    await handleBuildSnapshot("migration");
  }

  async function handleRevertClassic() {
    setRevertingClassic(true);
    skipNextSaveRef.current = true;
    updateSettingsLocal({ migrationCompletedAt: null });
    const saved = await persistToApi({ migrationCompletedAt: null });
    if (saved) {
      setRevertModalOpen(false);
      setBuildToast("Classic environment enabled for new sessions");
    }
    setRevertingClassic(false);
  }

  async function handleActivateSnapshot(snapshotId: string) {
    const saved = await activateLabEnvironmentSnapshotToApi(snapshotId);
    if (saved) applyRemote(saved.settings);
  }

  async function handleDeleteSnapshot(snapshotId: string) {
    const saved = await deleteLabEnvironmentSnapshotFromApi(snapshotId);
    if (saved) applyRemote(saved.settings);
  }

  function snapshotBlueprintLabel(snapshot: LabEnvironmentSnapshot): string {
    const orgCount = snapshot.blueprintSummary ? 1 : 0;
    const total = orgCount + (snapshot.enrolledRepoNames?.length ?? snapshot.repoCount);
    if (total === 0) return "No blueprints";
    return `${total} ${total === 1 ? "blueprint" : "blueprints"}`;
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="environment"
      titleOverride="Environment"
      descriptionOverride="Configure how MemoryOS environment is set up for your organization."
      docHref={ENVIRONMENT_LEARN_MORE_URL}
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Environment" },
      ]}
      contentClassName="max-w-[875px]"
    >
      <Link
        href={SETTINGS_INDEX_PATH}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to organization
      </Link>

      {loadError ? (
        <p className="mb-2 text-xs text-amber-200/90">{loadError}</p>
      ) : !loaded ? (
        <p className="mb-2 text-xs text-white/40">Loading settings…</p>
      ) : null}

      {saveState === "error" ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          <span>Could not save to the server.</span>
          <button
            type="button"
            onClick={() => void persistToApi(failedPatch ?? settingsRef.current)}
            className="inline-flex h-7 items-center rounded-md border border-amber-400/40 px-2.5 font-medium text-amber-50 hover:bg-amber-500/20"
          >
            Retry
          </button>
        </div>
      ) : saveState === "saving" ? (
        <p className="mb-2 text-xs text-white/40">Saving…</p>
      ) : saveState === "saved" ? (
        <p className="mb-2 text-xs text-emerald-300/90">Saved</p>
      ) : null}

      <EnvironmentTabs active={tab} onChange={setTab} />

      {tab === "blueprints" ? (
        <div className="mt-6 space-y-8">
          <div>
            <h2 className="mb-4 text-sm font-semibold text-white">Configuration</h2>
            <SettingsCard
              title="Organization blueprint"
              description="Runs on every build"
              actions={
                <Link
                  href={ENVIRONMENT_BLUEPRINT_PATH}
                  className="inline-flex h-9 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-medium text-white/90 transition hover:bg-white/[0.08]"
                >
                  Edit
                </Link>
              }
            >
              {orgBlueprintContent ? (
                <ContinuityLabBlueprintYamlPreview
                  content={orgBlueprintContent}
                  updatedAt={orgBlueprintUpdatedAt}
                  editHref={ENVIRONMENT_BLUEPRINT_PATH}
                />
              ) : (
                <SettingsFlatPanel className="py-8 text-center">
                  <p className="text-sm text-white/55">
                    No organization blueprint yet. Add setup scripts shared across all repos.
                  </p>
                  <Link
                    href={ENVIRONMENT_BLUEPRINT_PATH}
                    className="mt-4 inline-flex h-9 items-center rounded-md bg-[#2563EB] px-4 text-sm font-medium text-white transition hover:bg-[#3B82F6]"
                  >
                    Create blueprint
                  </Link>
                </SettingsFlatPanel>
              )}
            </SettingsCard>
          </div>

          <SettingsCard
            title="Repositories"
            description="Added repositories are cloned and set up in the order shown during snapshot builds. Drag to reorder."
          >
            <SettingsToolbar className="mb-3">
              <SettingsSearchInput
                value={repoSearch}
                onChange={setRepoSearch}
                placeholder={`Search ${settings.enrolledRepos.length} added ${settings.enrolledRepos.length === 1 ? "repository" : "repositories"}…`}
                className="max-w-xs"
              />
              <div className="w-[180px] shrink-0">
                <SettingsSelectDropdown<RepoFilter>
                  value={repoFilter}
                  onChange={setRepoFilter}
                  options={REPO_FILTER_OPTIONS}
                />
              </div>
              {github.connected ? (
                <button
                  type="button"
                  onClick={() => setRepoModalOpen(true)}
                  className="inline-flex h-9 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.08]"
                >
                  Add
                </button>
              ) : (
                <span className="inline-flex h-9 cursor-not-allowed items-center rounded-md bg-white/30 px-3.5 text-sm font-medium text-[#0A0A0A]/60">
                  Add
                </span>
              )}
            </SettingsToolbar>

            {settings.enrolledRepos.length === 0 ? (
              <SettingsFlatPanel className="py-10 text-center">
                <p className="text-sm text-white/55">
                  No repositories yet. Add repositories to include in environment builds.
                </p>
              </SettingsFlatPanel>
            ) : filteredRepos.length === 0 ? (
              <p className="text-sm text-white/50">
                {repoFilter === "connection_issues"
                  ? "No repositories with connection issues."
                  : "No repositories match your search."}
              </p>
            ) : (
              <SettingsFlatPanel className="!px-0">
                <ul>
                  {filteredRepos.map((row) => {
                    const parts = parseRepoParts(row.repo);
                    const index = settings.enrolledRepos.findIndex((r) => r.repo === row.repo);
                    const displayName = parts?.repo ?? row.repo;
                    const subtitle = parts
                      ? `${parts.owner} · ${formatRelativeAdded(row.addedAt)}`
                      : formatRelativeAdded(row.addedAt);
                    return (
                      <li
                        key={row.repo}
                        className="group flex items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0"
                      >
                        <div className="flex shrink-0 flex-col gap-0 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => moveRepo(row.repo, -1)}
                            disabled={index <= 0}
                            className="text-white/25 hover:text-white/55 disabled:opacity-20"
                            aria-label={`Move ${row.repo} up`}
                          >
                            <ChevronDown className="size-2.5 rotate-180" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRepo(row.repo, 1)}
                            disabled={index >= settings.enrolledRepos.length - 1}
                            className="text-white/25 hover:text-white/55 disabled:opacity-20"
                            aria-label={`Move ${row.repo} down`}
                          >
                            <ChevronDown className="size-2.5" />
                          </button>
                        </div>
                        <FolderGit2 className="size-4 shrink-0 text-white/35" aria-hidden />
                        <button
                          type="button"
                          onClick={() => setSelectedRepo(row.repo)}
                          className={cn(
                            "min-w-0 flex-1 rounded-md py-1 text-left transition -my-1 px-1 -mx-1",
                            selectedRepo === row.repo
                              ? "bg-white/[0.06]"
                              : "hover:bg-white/[0.03]",
                          )}
                        >
                          <p className="truncate text-sm font-medium text-white">{displayName}</p>
                          <p className="mt-0.5 truncate text-xs text-white/45">{subtitle}</p>
                        </button>
                        <Link
                          href={repoBlueprintSettingsPath(row.repo)}
                          className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-white/30 hover:text-white/55"
                          title="Open full page"
                        >
                          Open
                        </Link>
                        <span className="shrink-0 text-xs text-white/50">
                          {row.included ? "Included" : "Excluded"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRepo(row.repo)}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent text-white/0 transition hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-white/50 group-hover:border-white/[0.08] group-hover:text-white/40"
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
          </SettingsCard>

          {selectedRepo ? (
            <ContinuityLabRepoEnvironmentBlueprintEditor
              key={selectedRepo}
              repo={selectedRepo}
              embedded
              onClose={() => setSelectedRepo(null)}
            />
          ) : null}
        </div>
      ) : null}

      {tab === "snapshots" ? (
        <div className="mt-6 space-y-8">
          <SettingsCard title="Active snapshot">
            {active ? (
              <SettingsFlatPanel className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{formatWhen(active.builtAt)}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {snapshotBlueprintLabel(active)} ·{" "}
                      {active.repoCount}{" "}
                      {active.repoCount === 1 ? "repository" : "repositories"}
                    </p>
                  </div>
                  <Link
                    href={environmentSnapshotPath(active.id)}
                    className="inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-white transition hover:bg-[#3B82F6]"
                  >
                    View snapshot
                  </Link>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                  <p className="text-xs text-white/45">
                    Understand how this snapshot was built.
                  </p>
                  <Link
                    href={`${environmentSnapshotPath(active.id)}#build-logs`}
                    className="text-xs font-medium text-[#60A5FA] hover:underline"
                  >
                    View logs
                  </Link>
                </div>
              </SettingsFlatPanel>
            ) : (
              <SettingsFlatPanel className="py-8 text-center">
                <p className="text-sm text-white/55">No snapshots yet. Build one from your blueprint and repos.</p>
              </SettingsFlatPanel>
            )}
          </SettingsCard>

          <SettingsCard
            title="Advanced settings"
            description="Control when new snapshots are built."
          >
            <SettingsFlatPanel className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-medium text-white">Auto-build snapshots</p>
                <p className="mt-1 text-xs text-white/45">
                  Rebuild when blueprints change or on a refresh schedule.
                </p>
              </div>
              <SettingsToggle
                checked={settings.autoBuildSnapshots}
                onChange={(checked) => updateSettingsLocal({ autoBuildSnapshots: checked })}
                label="Auto-build snapshots"
              />
            </SettingsFlatPanel>
          </SettingsCard>

          <SettingsCard
            title="Recent snapshots"
            description="MemoryOS can use these when starting sessions."
            actions={
              <button
                type="button"
                onClick={() => void handleBuildSnapshot()}
                disabled={buildingSnapshot}
                className="inline-flex h-9 items-center rounded-md bg-[#2F6FEA] px-3.5 text-sm font-semibold text-white transition hover:bg-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buildingSnapshot ? "Building…" : "Build snapshot"}
              </button>
            }
          >
            {buildError ? (
              <p className="mb-2 text-xs text-amber-200/90">{buildError}</p>
            ) : null}
            {settings.snapshots.length === 0 ? (
              <SettingsFlatPanel className="py-8 text-center">
                <p className="text-sm text-white/55">No snapshots recorded yet.</p>
              </SettingsFlatPanel>
            ) : (
              <SettingsFlatPanel className="!px-0">
                <ul>
                  {settings.snapshots.map((snapshot) => (
                    <li
                      key={snapshot.id}
                      className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {formatWhen(snapshot.builtAt)}
                          </span>
                          {snapshot.active ? (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                              Active
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-white/45">
                          {snapshot.repoCount}{" "}
                          {snapshot.repoCount === 1 ? "repository" : "repositories"}
                        </p>
                      </div>
                      {snapshot.status === "success" ? (
                        <Check className="size-4 text-emerald-300/80" aria-hidden />
                      ) : snapshot.status === "building" ? (
                        <RefreshCw className="size-4 animate-spin text-white/45" aria-hidden />
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-md border border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white"
                            aria-label="Snapshot options"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-[180px] border border-[#2F2F2F] bg-[#0A0A0A] p-1 text-white"
                        >
                          <DropdownMenuItem asChild className="gap-2 text-xs text-white/85 focus:bg-[#141414] focus:text-white">
                            <Link href={environmentSnapshotPath(snapshot.id)}>
                              <Eye className="size-3.5" />
                              View details
                            </Link>
                          </DropdownMenuItem>
                          {!snapshot.active ? (
                            <DropdownMenuItem
                              className="gap-2 text-xs text-white/85 focus:bg-[#141414] focus:text-white"
                              onSelect={() => void handleActivateSnapshot(snapshot.id)}
                            >
                              <Pin className="size-3.5" />
                              Use this build
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator className="bg-white/[0.08]" />
                          <DropdownMenuItem
                            className="gap-2 text-xs text-red-300/90 focus:bg-[#141414] focus:text-red-200"
                            onSelect={() => void handleDeleteSnapshot(snapshot.id)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ))}
                </ul>
              </SettingsFlatPanel>
            )}
            <p className="mt-3 text-[11px] text-white/35">{ENVIRONMENT_SNAPSHOT_BUILD_NOTE}</p>
          </SettingsCard>
        </div>
      ) : null}

      {tab === "migration" ? (
        <div className="mt-6 space-y-11">
          <div className="grid gap-5 md:grid-cols-3">
            <EnvironmentMetricCard
              label="Repositories migrated"
              value={`${migratedCount} / ${settings.enrolledRepos.length}`}
            />
            <EnvironmentMetricCard label="Migration progress" value={migrationProgressLabel} />
            <EnvironmentMetricCard label="Latest build" value={latestBuildLabel} />
          </div>

          <SettingsCard title="Migration">
            <SettingsFlatPanel className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div className="flex min-w-[260px] items-start gap-3">
                {settings.migrationCompletedAt ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-300/90" aria-hidden />
                ) : (
                  <RefreshCw className="mt-0.5 size-4 shrink-0 text-white/40" aria-hidden />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">
                    {settings.migrationCompletedAt ? "Migration complete" : "Migration pending"}
                  </p>
                  <p className="mt-1 max-w-lg text-sm font-medium text-white/50">
                    {totalBlueprintCount}{" "}
                    {totalBlueprintCount === 1 ? "blueprint" : "blueprints"} ·{" "}
                    {active ? latestBuildLabel : "No snapshot built yet"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SettingsSecondaryButton onClick={() => setTab("blueprints")}>
                  Open blueprints
                </SettingsSecondaryButton>
                <button
                  type="button"
                  onClick={openMigrationModal}
                  disabled={buildingSnapshot}
                  className="inline-flex h-9 items-center rounded-md bg-[#2F6FEA] px-3.5 text-sm font-semibold text-white transition hover:bg-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {buildingSnapshot ? "Running..." : "Run migration session"}
                </button>
                <button
                  type="button"
                  onClick={() => setRevertModalOpen(true)}
                  className="inline-flex h-9 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.08]"
                >
                  Revert to classic
                </button>
              </div>
            </SettingsFlatPanel>
          </SettingsCard>
        </div>
      ) : null}

      <ContinuityLabRepoSelectModal
        open={repoModalOpen}
        onClose={() => setRepoModalOpen(false)}
        selected={settings.enrolledRepos.map((row) => row.repo)}
        onConfirm={handleAddRepos}
        lastSyncAt={github.lastSyncAt}
        initialRepos={repoOptions}
        title="Add repositories"
        description="Add repositories to your environment configuration"
        confirmLabel="Add repositories"
      />

      <MigrationSessionDialog
        open={migrationModalOpen}
        onClose={() => setMigrationModalOpen(false)}
        repos={migrationCandidates}
        search={migrationSearch}
        selected={migrationSelection}
        onSearchChange={setMigrationSearch}
        onSelectionChange={setMigrationSelection}
        onRun={() => void handleRunMigrationSession()}
        running={buildingSnapshot}
      />

      <RevertClassicDialog
        open={revertModalOpen}
        onClose={() => setRevertModalOpen(false)}
        onConfirm={() => void handleRevertClassic()}
        blueprintCount={totalBlueprintCount}
        latestBuild={active ? latestBuildLabel : "none"}
        saving={revertingClassic}
      />

      {buildToast ? (
        <BlueprintToast message={buildToast} onDismiss={() => setBuildToast(null)} />
      ) : null}
    </ContinuityLabSettingsSectionFrame>
  );
}
