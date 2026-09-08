"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Check,
  Download,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsFlatPanel,
  SettingsPrimaryButton,
  SettingsSecondaryButton,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  activateLabEnvironmentSnapshotToApi,
  deleteLabEnvironmentSnapshotFromApi,
  loadLabEnvironmentSettingsHybrid,
  loadLabEnvironmentSettingsLocalFallback,
} from "@/lib/continuity-lab/lab-environment-settings-api";
import {
  LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT,
  type LabEnvironmentSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-environment-settings-events";
import {
  environmentSnapshotPath,
  normalizeLabEnvironmentSettings,
  readLabEnvironmentSettings,
  saveLabEnvironmentSettings,
  type LabEnvironmentSnapshot,
  type LabEnvironmentSnapshotLogSection,
  type LabEnvironmentSettings,
} from "@/lib/continuity-lab/lab-environment-settings-storage";
import { SETTINGS_INDEX_PATH, settingsSectionPath } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

const ENVIRONMENT_PATH = settingsSectionPath("environment");

function formatSnapshotTitle(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDuration(ms: number | undefined): string {
  if (!ms || ms < 1000) return "<1s";
  return `${Math.round(ms / 1000)}s`;
}

function legacyLogSections(snapshot: LabEnvironmentSnapshot): LabEnvironmentSnapshotLogSection[] {
  if (snapshot.logSections?.length) return snapshot.logSections;
  const fallback = snapshot.buildLog?.trim() || "No build logs recorded.";
  return [
    {
      id: "all",
      label: "All",
      kind: "organization",
      status: snapshot.status === "failed" ? "failed" : "success",
      durationMs: snapshot.durationMs ?? 0,
      log: fallback,
    },
  ];
}

function ActivateSnapshotDialog({
  open,
  onClose,
  onConfirm,
  confirming,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-md border border-white/[0.1] bg-[#1a1a1a] p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-[#F0EFE2]">Activate this snapshot?</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#F0EFE2]/55">
          All new sessions will use this snapshot instead of automatically picking the latest build.
          Scheduled environment refreshes will pause until you resume auto-updates.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <SettingsSecondaryButton onClick={onClose} disabled={confirming}>
            Cancel
          </SettingsSecondaryButton>
          <SettingsPrimaryButton onClick={onConfirm} disabled={confirming}>
            {confirming ? "Activating…" : "Confirm"}
          </SettingsPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function ContinuityLabEnvironmentSnapshotDetail({ snapshotId }: { snapshotId: string }) {
  const router = useRouter();
  const { user } = useUser();
  const [settings, setSettings] = useState<LabEnvironmentSettings>(() =>
    normalizeLabEnvironmentSettings(undefined),
  );
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [repoFilter, setRepoFilter] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>("all");
  const [activateOpen, setActivateOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const applyRemote = useCallback((next: LabEnvironmentSettings) => {
    const normalized = normalizeLabEnvironmentSettings(next);
    setSettings(normalized);
    saveLabEnvironmentSettings(normalized, { broadcast: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const localBeforeFetch = readLabEnvironmentSettings();
      const remote = await loadLabEnvironmentSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        applyRemote(remote.settings);
      } else {
        applyRemote(loadLabEnvironmentSettingsLocalFallback(null).settings);
        setLoadError("Could not load settings from the server.");
      }
      if (
        remote &&
        remote.settings.snapshots.length === 0 &&
        localBeforeFetch.snapshots.some((row) => row.id === snapshotId)
      ) {
        applyRemote(localBeforeFetch);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [snapshotId, applyRemote]);

  useEffect(() => {
    function onSettingsChanged(event: Event) {
      const detail = (event as CustomEvent<LabEnvironmentSettingsChangedDetail>).detail;
      if (detail?.settings) applyRemote(detail.settings);
    }
    window.addEventListener(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, onSettingsChanged);
    return () =>
      window.removeEventListener(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, onSettingsChanged);
  }, [applyRemote]);

  const snapshot = useMemo(
    () => settings.snapshots.find((row) => row.id === snapshotId) ?? null,
    [settings.snapshots, snapshotId],
  );

  const sections = useMemo(
    () => (snapshot ? legacyLogSections(snapshot) : []),
    [snapshot],
  );

  const sidebarSections = useMemo(() => {
    const all: LabEnvironmentSnapshotLogSection = {
      id: "all",
      label: "All",
      kind: "organization",
      status: "success",
      durationMs: sections.reduce((sum, row) => sum + row.durationMs, 0),
      log: sections.map((row) => row.log).join("\n\n"),
    };
    return [all, ...sections.filter((row) => row.id !== "all")];
  }, [sections]);

  const filteredSidebar = useMemo(() => {
    const q = repoFilter.trim().toLowerCase();
    if (!q) return sidebarSections;
    return sidebarSections.filter((row) => row.label.toLowerCase().includes(q));
  }, [sidebarSections, repoFilter]);

  const activeSection = useMemo(
    () => sidebarSections.find((row) => row.id === activeSectionId) ?? sidebarSections[0],
    [sidebarSections, activeSectionId],
  );

  const displayedLog = useMemo(() => {
    const raw = activeSection?.log ?? "";
    const q = logSearch.trim().toLowerCase();
    if (!q) return raw;
    return raw
      .split("\n")
      .filter((line) => line.toLowerCase().includes(q))
      .join("\n");
  }, [activeSection, logSearch]);

  const blueprintCount =
    (snapshot?.blueprintSummary ? 1 : 0) +
    (snapshot?.enrolledRepoNames?.length ?? snapshot?.repoCount ?? 0);

  async function handleActivate() {
    if (!snapshot) return;
    setActivating(true);
    const saved = await activateLabEnvironmentSnapshotToApi(snapshot.id);
    setActivating(false);
    setActivateOpen(false);
    if (saved) applyRemote(saved.settings);
  }

  async function handleDelete() {
    if (!snapshot || !window.confirm("Delete this snapshot from build history?")) return;
    setDeleting(true);
    const saved = await deleteLabEnvironmentSnapshotFromApi(snapshot.id);
    setDeleting(false);
    if (saved) {
      applyRemote(saved.settings);
      router.push(`${ENVIRONMENT_PATH}?tab=snapshots`);
    }
  }

  function downloadLogs() {
    const content = sidebarSections[0]?.log ?? snapshot?.buildLog ?? "";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `snapshot-${snapshotId.slice(0, 8)}.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return (
      <ContinuityLabSettingsSectionFrame sectionId="environment" titleOverride="Snapshot">
        <p className="text-sm text-[#F0EFE2]/45">Loading snapshot…</p>
      </ContinuityLabSettingsSectionFrame>
    );
  }

  if (!snapshot) {
    return (
      <ContinuityLabSettingsSectionFrame sectionId="environment" titleOverride="Snapshot">
        {loadError ? <p className="mb-2 text-xs text-amber-200/90">{loadError}</p> : null}
        <p className="text-sm text-[#F0EFE2]/55">Snapshot not found.</p>
        <Link
          href={`${ENVIRONMENT_PATH}?tab=snapshots`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#F0EFE2]/60 hover:text-[#F0EFE2]"
        >
          <ArrowLeft className="size-3.5" />
          Back to snapshots
        </Link>
      </ContinuityLabSettingsSectionFrame>
    );
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="environment"
      titleOverride={`Snapshot on ${formatSnapshotTitle(snapshot.builtAt)}`}
      descriptionOverride="View, inspect, and debug details about this environment snapshot."
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Environment", href: ENVIRONMENT_PATH },
        { label: "Snapshots", href: `${ENVIRONMENT_PATH}?tab=snapshots` },
        { label: formatSnapshotTitle(snapshot.builtAt) },
      ]}
    >
      <Link
        href={`${ENVIRONMENT_PATH}?tab=snapshots`}
        className="-mt-2 mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to snapshots
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {snapshot.active ? (
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              Active
            </span>
          ) : null}
          <h1 className="text-lg font-semibold text-[#F0EFE2]">
            Snapshot on {formatSnapshotTitle(snapshot.builtAt)}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="inline-flex h-9 items-center rounded-md border border-red-500/40 bg-red-500/10 px-3.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      <SettingsFlatPanel className="mb-6 grid gap-4 py-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-[#F0EFE2]/45">Status</p>
          <p className="mt-1 text-sm font-medium text-emerald-300/90">
            {snapshot.status === "failed" ? "Build failed" : "Build successful"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#F0EFE2]/45">Trigger</p>
          <p className="mt-1 text-sm font-medium text-[#F0EFE2] capitalize">
            {snapshot.trigger ?? "manual"}
          </p>
          <p className="text-xs text-[#F0EFE2]/40">
            {snapshot.triggeredBy ?? user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#F0EFE2]/45">Started</p>
          <p className="mt-1 text-sm font-medium text-[#F0EFE2]">{formatSnapshotTitle(snapshot.builtAt)}</p>
        </div>
        <div>
          <p className="text-xs text-[#F0EFE2]/45">Duration</p>
          <p className="mt-1 text-sm font-medium text-[#F0EFE2]">
            {formatDuration(snapshot.durationMs)}
          </p>
        </div>
      </SettingsFlatPanel>

      {!snapshot.active ? (
        <SettingsFlatPanel className="mb-6 flex flex-wrap items-center justify-between gap-3 py-4">
          <p className="text-sm text-[#F0EFE2]/55">Use this build for new sessions.</p>
          <SettingsPrimaryButton onClick={() => setActivateOpen(true)}>
            Activate this snapshot
          </SettingsPrimaryButton>
        </SettingsFlatPanel>
      ) : null}

      <div id="build-logs" className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#F0EFE2]">Build logs</h2>
        <p className="text-xs text-[#F0EFE2]/40">
          {blueprintCount} {blueprintCount === 1 ? "blueprint" : "blueprints"} ·{" "}
          {snapshot.repoCount}{" "}
          {snapshot.repoCount === 1 ? "repository" : "repositories"}
        </p>
      </div>

      <SettingsFlatPanel className="!px-0 overflow-hidden">
        <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-white/[0.06] p-3 md:border-b-0 md:border-r">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#F0EFE2]/30" />
              <input
                value={repoFilter}
                onChange={(e) => setRepoFilter(e.target.value)}
                placeholder="Filter repositories"
                className="h-8 w-full rounded-md border border-white/[0.08] bg-black/40 pl-8 pr-2 text-xs text-[#F0EFE2] placeholder:text-[#F0EFE2]/30 focus:border-white/[0.16] focus:outline-none"
              />
            </div>
            <ul className="space-y-0.5">
              {filteredSidebar.map((section) => {
                const active = section.id === activeSectionId;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition",
                        active
                          ? "bg-white/[0.08] text-[#F0EFE2]"
                          : "text-[#F0EFE2]/60 hover:bg-white/[0.04] hover:text-[#F0EFE2]/85",
                      )}
                    >
                      {section.status === "success" ? (
                        <Check className="size-3 shrink-0 text-emerald-400/80" aria-hidden />
                      ) : (
                        <span className="inline-block size-3 shrink-0" />
                      )}
                      <span className="min-w-0 truncate">{section.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-[#F0EFE2]">{activeSection?.label ?? "All"}</p>
                <p className="text-xs text-[#F0EFE2]/40">
                  Finished in {formatDuration(activeSection?.durationMs)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#F0EFE2]/30" />
                  <input
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs"
                    className="h-8 w-40 rounded-md border border-white/[0.08] bg-black/40 pl-8 pr-2 text-xs text-[#F0EFE2] placeholder:text-[#F0EFE2]/30 focus:border-white/[0.16] focus:outline-none"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-md text-[#F0EFE2]/45 hover:bg-white/[0.06] hover:text-[#F0EFE2]/75"
                      aria-label="Log options"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="min-w-[160px] border border-[#2F2F2F] bg-[#0A0A0A] p-1 text-[#F0EFE2]"
                  >
                    <DropdownMenuItem
                      className="gap-2 text-xs text-[#F0EFE2]/85 focus:bg-[#141414] focus:text-[#F0EFE2]"
                      onSelect={downloadLogs}
                    >
                      <Download className="size-3.5" />
                      Download logs
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <pre className="min-h-[320px] flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-[#F0EFE2]/75">
              {displayedLog || "No log lines match your search."}
            </pre>
          </div>
        </div>
      </SettingsFlatPanel>

      <ActivateSnapshotDialog
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        onConfirm={() => void handleActivate()}
        confirming={activating}
      />
    </ContinuityLabSettingsSectionFrame>
  );
}
