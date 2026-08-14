"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Filter,
  Plus,
  User,
  X,
} from "lucide-react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import {
  SettingsSearchInput,
  SettingsSecondaryButton,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatLabRelativeTime } from "@/lib/continuity-lab/format-relative-time";
import {
  displaySessionTitle,
  getLabSessionMeta,
  isLabSessionArchived,
  isLabSessionTerminated,
  LAB_SESSION_STORAGE_EVENT,
} from "@/lib/continuity-lab/session-storage";
import { fetchLabSessionsList } from "@/lib/continuity-lab/sessions-api";
import {
  loadLabSessionsSettingsHybrid,
  patchLabSessionsSettingsToApi,
} from "@/lib/continuity-lab/lab-sessions-settings-api";
import type { LabSessionSummary } from "@/lib/continuity-lab/sessions";
import {
  sessionMatchesAutomation,
  type SessionsDisplayProperty,
  type SessionsDisplayPrefs,
  type SessionsGrouping,
  type SessionsSortBy,
  type SessionsSortDirection,
  type SessionsViewMode,
} from "@/lib/continuity-lab/sessions-display-prefs";
import {
  DEFAULT_SESSIONS_FILTERS,
  patchLabSessionsSettings,
  readLabSessionsSettings,
  type SessionsArchivedFilter,
  type SessionsFilterPrefs,
} from "@/lib/continuity-lab/sessions-settings-storage";
import { readUserPreferences } from "@/lib/continuity-lab/user-preferences-storage";
import { cn } from "@/lib/utils";

const FILTER_MENU_ITEMS = [
  "Type",
  "Creator",
  "Playbook",
  "Automation",
  "Snapshot",
  "Content",
  "Status",
  "PR state",
  "Archived Status",
  "Tags",
  "Origin",
  "Created date",
  "Updated date",
  "Agent",
] as const;

type ActiveFilterPopover = "creator" | "archived" | "updated" | null;

type SessionRow = LabSessionSummary & {
  displayTitle: string;
  status: "active" | "inactive";
  creatorLabel: string;
};

export type ContinuityLabSessionsBrowserProps = {
  variant?: "standalone" | "settings";
  automationFilter?: string;
  sessionFetchLimit?: number;
  toolbarClassName?: string;
};

function sortSessions(
  rows: SessionRow[],
  sortBy: SessionsSortBy,
  direction: SessionsSortDirection,
): SessionRow[] {
  const mult = direction === "newest" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const aIso = sortBy === "created" ? a.createdAt : a.updatedAt;
    const bIso = sortBy === "created" ? b.createdAt : b.updatedAt;
    const aTime = new Date(aIso).getTime();
    const bTime = new Date(bIso).getTime();
    if (aTime !== bTime) return (aTime - bTime) * mult;
    return a.displayTitle.localeCompare(b.displayTitle) * mult;
  });
}

function exportSessionsCsv(rows: SessionRow[], displayProperties: SessionsDisplayProperty[]): void {
  const headers = ["id", "title", "source", "createdAt", "updatedAt", "repo", "status"];
  if (displayProperties.includes("tags")) headers.push("tags");
  if (displayProperties.includes("user")) headers.push("creator");
  if (displayProperties.includes("playbook")) headers.push("playbook");
  if (displayProperties.includes("prs")) headers.push("prs");
  const lines = [
    headers.join(","),
    ...rows.map((row) => {
      const meta = getLabSessionMeta(row.id);
      const tagList = [...(row.tags ?? []), ...(meta.tags ?? [])];
      const cells = [
        row.id,
        `"${row.displayTitle.replace(/"/g, '""')}"`,
        row.source,
        row.createdAt,
        row.updatedAt,
        row.repo ? `"${row.repo.replace(/"/g, '""')}"` : "",
        row.status,
      ];
      if (displayProperties.includes("tags")) {
        cells.push(`"${tagList.join("; ").replace(/"/g, '""')}"`);
      }
      if (displayProperties.includes("user")) {
        cells.push(`"${row.creatorLabel.replace(/"/g, '""')}"`);
      }
      if (displayProperties.includes("playbook")) {
        const playbook = row.playbook ?? meta.category ?? "";
        cells.push(`"${playbook.replace(/"/g, '""')}"`);
      }
      if (displayProperties.includes("prs")) {
        const prs = row.prUrls?.length ? row.prUrls.join("; ") : row.repo ?? "";
        cells.push(`"${prs.replace(/"/g, '""')}"`);
      }
      return cells.join(",");
    }),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `memoryos-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sessionIsArchived(session: LabSessionSummary): boolean {
  if (session.source === "continuity_thread" && session.status === "archived") {
    return true;
  }
  return isLabSessionArchived(session.id);
}

function sessionPassesArchivedFilter(
  session: LabSessionSummary,
  filter: SessionsArchivedFilter,
): boolean {
  if (filter === "all") return true;
  const archived = sessionIsArchived(session);
  return filter === "archived" ? archived : !archived;
}

function parseLocalDay(isoDay: string): Date {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function sessionPassesDateFilter(updatedAt: string, filters: SessionsFilterPrefs): boolean {
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return true;
  if (filters.updatedAfter) {
    const start = parseLocalDay(filters.updatedAfter);
    start.setHours(0, 0, 0, 0);
    if (updated < start) return false;
  }
  if (filters.updatedBefore) {
    const end = parseLocalDay(filters.updatedBefore);
    end.setHours(23, 59, 59, 999);
    if (updated > end) return false;
  }
  return true;
}

function formatFilterDayLabel(isoDay: string): string {
  const d = parseLocalDay(isoDay);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function DisplayMenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {title}
      </p>
      {children}
    </div>
  );
}

function DisplayMenuOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"
    >
      <span>{label}</span>
      {selected ? <Check className="size-3.5 shrink-0 text-white/70" /> : <span className="size-3.5" />}
    </button>
  );
}

function DisplayPropertyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 px-3 py-1 text-[13px] text-white/80 hover:bg-white/[0.04]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 rounded border-white/20 accent-[#6366F1]"
      />
      {label}
    </label>
  );
}

function monthMatrix(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function DualMonthCalendar({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (isoDay: string | null) => void;
}) {
  const today = new Date();
  const [anchor, setAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const leftMonth = anchor.getMonth();
  const leftYear = anchor.getFullYear();
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const renderMonth = (year: number, month: number, label: string) => (
    <div key={`${year}-${month}`} className="min-w-[11.5rem] flex-1">
      <p className="mb-2 text-center text-xs font-medium text-white/70">{label}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-white/35">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {monthMatrix(year, month).flat().map((day, idx) => {
          if (!day) return <span key={`empty-${idx}`} className="size-7" />;
          const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const selected = value === iso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(selected ? null : iso)}
              className={cn(
                "size-7 rounded text-[11px] transition",
                selected
                  ? "bg-[#4338CA] font-medium text-white"
                  : "text-white/75 hover:bg-white/[0.08]",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAnchor(new Date(leftYear, leftMonth - 1, 1))}
          className="rounded px-2 py-1 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-white/45 hover:text-white/75"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setAnchor(new Date(rightYear, rightMonth + 1, 1))}
          className="rounded px-2 py-1 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          Next
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        {renderMonth(
          leftYear,
          leftMonth,
          new Date(leftYear, leftMonth).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          }),
        )}
        {renderMonth(
          rightYear,
          rightMonth,
          new Date(rightYear, rightMonth).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          }),
        )}
      </div>
    </div>
  );
}

export function ContinuityLabSessionsBrowser({
  variant = "standalone",
  automationFilter = "",
  sessionFetchLimit = 12,
  toolbarClassName,
}: ContinuityLabSessionsBrowserProps) {
  const router = useRouter();
  const { sessions: contextSessions, refresh } = useContinuityLab();
  const [apiSessions, setApiSessions] = useState<LabSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayOpen, setDisplayOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activePopover, setActivePopover] = useState<ActiveFilterPopover>(null);
  const [settings, setSettings] = useState(readLabSessionsSettings);
  const [settingsReady, setSettingsReady] = useState(false);
  const [storageTick, setStorageTick] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const displayRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const prefs = settings.display;
  const filters = settings.filters;
  const currentUser = readUserPreferences().displayName.trim() || "You";
  const useBackendList = variant === "settings" || sessionFetchLimit > 12;

  const syncSettingsToServer = useCallback((next: typeof settings) => {
    void patchLabSessionsSettingsToApi(next);
  }, []);

  const persistDisplay = useCallback((next: SessionsDisplayPrefs) => {
    const updated = patchLabSessionsSettings({ display: next });
    setSettings(updated);
    syncSettingsToServer(updated);
  }, [syncSettingsToServer]);

  const persistFilters = useCallback((next: SessionsFilterPrefs) => {
    const updated = patchLabSessionsSettings({ filters: next });
    setSettings(updated);
    syncSettingsToServer(updated);
  }, [syncSettingsToServer]);

  const loadSessions = useCallback(async () => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoading(true);
    const result = await fetchLabSessionsList({
      limit: sessionFetchLimit,
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    setApiSessions(result.sessions);
    setFetchError(result.openhandsError);
    setLoading(false);
  }, [sessionFetchLimit]);

  useEffect(() => {
    let cancelled = false;
    void loadLabSessionsSettingsHybrid().then((remote) => {
      if (!cancelled) {
        setSettings(remote);
        setSettingsReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!useBackendList) return;
    void loadSessions();
    return () => fetchAbortRef.current?.abort();
  }, [useBackendList, loadSessions]);

  useEffect(() => {
    if (!useBackendList) return;
    const interval = window.setInterval(() => void loadSessions(), 30_000);
    return () => window.clearInterval(interval);
  }, [useBackendList, loadSessions]);

  useEffect(() => {
    if (!useBackendList) return;
    const onFocus = () => void loadSessions();
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadSessions();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [useBackendList, loadSessions]);

  useEffect(() => {
    const bump = () => {
      setStorageTick((n) => n + 1);
      void refresh();
      if (useBackendList) void loadSessions();
    };
    window.addEventListener(LAB_SESSION_STORAGE_EVENT, bump);
    return () => window.removeEventListener(LAB_SESSION_STORAGE_EVENT, bump);
  }, [refresh, useBackendList, loadSessions]);

  useEffect(() => {
    if (!displayOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (displayRef.current && !displayRef.current.contains(e.target as Node)) {
        setDisplayOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [displayOpen]);

  useEffect(() => {
    if (!activePopover) return;
    const onDoc = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [activePopover]);

  const sessions = useMemo(() => {
    const map = new Map<string, LabSessionSummary>();
    const primary = useBackendList ? apiSessions : contextSessions;
    for (const s of primary) {
      map.set(s.id, s);
    }
    if (!useBackendList) {
      for (const s of apiSessions) {
        if (!map.has(s.id)) map.set(s.id, s);
      }
    }
    return [...map.values()];
  }, [apiSessions, contextSessions, useBackendList]);

  const creatorOptions = useMemo(() => {
    const set = new Set<string>([currentUser, "MemoryOS Agent"]);
    for (const s of sessions) {
      const label = s.creator?.trim();
      if (label) set.add(label);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [currentUser, sessions]);

  const rows = useMemo((): SessionRow[] => {
    void storageTick;
    const q = searchQuery.trim().toLowerCase();
    return sessions
      .filter((session) => {
        if (automationFilter && !sessionMatchesAutomation(session, automationFilter)) {
          return false;
        }
        if (!sessionPassesArchivedFilter(session, filters.archivedStatus)) return false;
        if (!sessionPassesDateFilter(session.updatedAt, filters)) return false;
        if (filters.creators.length > 0) {
          const rowCreator = session.creator?.trim() || currentUser;
          if (!filters.creators.includes(rowCreator)) return false;
        }
        const title = displaySessionTitle(session.id, session.title);
        if (!q) return true;
        return (
          title.toLowerCase().includes(q) ||
          session.id.toLowerCase().includes(q) ||
          (session.repo?.toLowerCase().includes(q) ?? false)
        );
      })
      .map((session) => {
        const inactive =
          sessionIsArchived(session) ||
          isLabSessionTerminated(session.id) ||
          session.status === "ended" ||
          session.executionStatus === "finished" ||
          session.executionStatus === "stopped";
        return {
          ...session,
          displayTitle: displaySessionTitle(session.id, session.title),
          status: inactive ? "inactive" : "active",
          creatorLabel: session.creator?.trim() || currentUser,
        };
      });
  }, [
    sessions,
    automationFilter,
    searchQuery,
    storageTick,
    filters,
    currentUser,
  ]);

  const sortedRows = useMemo(
    () => sortSessions(rows, prefs.sortBy, prefs.direction),
    [rows, prefs.sortBy, prefs.direction],
  );

  const groups = useMemo(() => {
    if (prefs.grouping === "none") {
      return [{ id: "all", label: "All sessions", rows: sortedRows }];
    }
    const active = sortedRows.filter((r) => r.status === "active");
    const inactive = sortedRows.filter((r) => r.status === "inactive");
    const out: { id: string; label: string; rows: SessionRow[] }[] = [];
    if (active.length > 0) {
      out.push({ id: "active", label: `Active sessions (${active.length})`, rows: active });
    }
    if (inactive.length > 0) {
      out.push({
        id: "inactive",
        label: `Inactive sessions (${inactive.length})`,
        rows: inactive,
      });
    }
    if (out.length === 0) {
      out.push({ id: "empty", label: "Sessions", rows: [] });
    }
    return out;
  }, [sortedRows, prefs.grouping]);

  const filterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    if (filters.creators.length > 0) {
      chips.push({
        id: "creator",
        label: `Creator is ${filters.creators.join(", ")}`,
        onRemove: () => persistFilters({ ...filters, creators: [] }),
      });
    }
    if (filters.archivedStatus === "archived") {
      chips.push({
        id: "archived",
        label: "Archived Status is Archived",
        onRemove: () => persistFilters({ ...filters, archivedStatus: "all" }),
      });
    } else if (filters.archivedStatus === "not_archived") {
      chips.push({
        id: "not-archived",
        label: "Archived Status is Not Archived",
        onRemove: () => persistFilters({ ...filters, archivedStatus: "all" }),
      });
    }
    if (filters.updatedAfter) {
      chips.push({
        id: "updated-after",
        label: `Updated date is After ${formatFilterDayLabel(filters.updatedAfter)}`,
        onRemove: () => persistFilters({ ...filters, updatedAfter: null }),
      });
    }
    if (filters.updatedBefore) {
      chips.push({
        id: "updated-before",
        label: `Updated date is Before ${formatFilterDayLabel(filters.updatedBefore)}`,
        onRemove: () => persistFilters({ ...filters, updatedBefore: null }),
      });
    }
    if (automationFilter) {
      chips.push({
        id: "automation",
        label: `Automation is ${automationFilter}`,
        onRemove: () => router.push(variant === "settings" ? "/continuity-lab/settings/sessions" : "/continuity-lab/sessions"),
      });
    }
    return chips;
  }, [filters, automationFilter, persistFilters, router, variant]);

  const hasFilters = filterChips.length > 0;

  const clearFilters = () => {
    persistFilters(DEFAULT_SESSIONS_FILTERS);
    if (automationFilter) {
      router.push(variant === "settings" ? "/continuity-lab/settings/sessions" : "/continuity-lab/sessions");
    }
  };

  const propertyLabels: Record<SessionsDisplayProperty, string> = {
    prs: "PRs",
    created: "Created",
    updated: "Updated",
    user: "User",
    tags: "Tags",
    playbook: "Playbook",
  };

  const openFilterPopover = (item: (typeof FILTER_MENU_ITEMS)[number]) => {
    if (item === "Creator") {
      setActivePopover("creator");
      setFilterMenuOpen(false);
      return;
    }
    if (item === "Archived Status") {
      setActivePopover("archived");
      setFilterMenuOpen(false);
      return;
    }
    if (item === "Updated date") {
      setActivePopover("updated");
      setFilterMenuOpen(false);
    }
  };

  const saveFiltersAsDefault = () => {
    const updated = patchLabSessionsSettings({ defaultFilters: { ...filters } });
    setSettings(updated);
    syncSettingsToServer(updated);
    setFilterMenuOpen(false);
  };

  const displayButton = (
    <div className="relative" ref={displayRef}>
      <SettingsSecondaryButton onClick={() => setDisplayOpen((v) => !v)}>
        <span className="inline-flex items-center gap-1.5">
          Display
          <ChevronDown className={cn("size-3.5 transition", displayOpen && "rotate-180")} />
        </span>
      </SettingsSecondaryButton>
      {displayOpen ? (
        <div
          className={cn(
            subtlePanel(),
            "absolute right-0 z-30 mt-2 w-[min(100vw-2.5rem,17.5rem)] py-1 shadow-xl",
          )}
        >
          <DisplayMenuSection title="Sort by">
            <DisplayMenuOption
              label="Updated"
              selected={prefs.sortBy === "updated"}
              onSelect={() => persistDisplay({ ...prefs, sortBy: "updated" })}
            />
            <DisplayMenuOption
              label="Created"
              selected={prefs.sortBy === "created"}
              onSelect={() => persistDisplay({ ...prefs, sortBy: "created" })}
            />
          </DisplayMenuSection>
          <div className="mx-3 border-t border-white/[0.06]" />
          <DisplayMenuSection title="Direction">
            <DisplayMenuOption
              label="Newest first"
              selected={prefs.direction === "newest"}
              onSelect={() => persistDisplay({ ...prefs, direction: "newest" })}
            />
            <DisplayMenuOption
              label="Oldest first"
              selected={prefs.direction === "oldest"}
              onSelect={() => persistDisplay({ ...prefs, direction: "oldest" })}
            />
          </DisplayMenuSection>
          <div className="mx-3 border-t border-white/[0.06]" />
          <DisplayMenuSection title="Grouping">
            <DisplayMenuOption
              label="By status"
              selected={prefs.grouping === "by_status"}
              onSelect={() =>
                persistDisplay({ ...prefs, grouping: "by_status" as SessionsGrouping })
              }
            />
            <DisplayMenuOption
              label="No grouping"
              selected={prefs.grouping === "none"}
              onSelect={() => persistDisplay({ ...prefs, grouping: "none" })}
            />
          </DisplayMenuSection>
          <div className="mx-3 border-t border-white/[0.06]" />
          <DisplayMenuSection title="View">
            <DisplayMenuOption
              label="Flat list"
              selected={prefs.view === "flat"}
              onSelect={() => persistDisplay({ ...prefs, view: "flat" as SessionsViewMode })}
            />
            <DisplayMenuOption
              label="Tree view"
              selected={prefs.view === "tree"}
              onSelect={() => persistDisplay({ ...prefs, view: "tree" })}
            />
          </DisplayMenuSection>
          <div className="mx-3 border-t border-white/[0.06]" />
          <DisplayMenuSection title="Display properties">
            {(Object.keys(propertyLabels) as SessionsDisplayProperty[]).map((key) => (
              <DisplayPropertyToggle
                key={key}
                label={propertyLabels[key]}
                checked={prefs.displayProperties.includes(key)}
                onChange={(on) => {
                  const set = new Set(prefs.displayProperties);
                  if (on) set.add(key);
                  else set.delete(key);
                  persistDisplay({ ...prefs, displayProperties: [...set] });
                }}
              />
            ))}
          </DisplayMenuSection>
          <div className="mx-3 border-t border-white/[0.06]" />
          <button
            type="button"
            onClick={() => {
              exportSessionsCsv(sortedRows, prefs.displayProperties);
              setDisplayOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"
          >
            <Download className="size-3.5 text-white/55" />
            Export to CSV
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="relative flex flex-col">
      <SettingsToolbar className={cn("mb-4 justify-end gap-2", toolbarClassName)}>
        <SettingsSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search sessions"
          className="max-w-xs sm:max-w-sm"
        />
        {displayButton}
      </SettingsToolbar>

      <div className="relative mb-4 flex flex-wrap items-center gap-2">
        <input
          type="checkbox"
          className="size-3.5 rounded border-white/20 accent-[#6366F1]"
          aria-label="Select all sessions"
          disabled={sortedRows.length === 0}
        />
        {filterChips.map((chip) => (
          <span
            key={chip.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] py-1 pl-2.5 pr-1 text-[12px] text-white/85"
          >
            {chip.label}
            <button
              type="button"
              onClick={chip.onRemove}
              className="inline-flex size-5 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white"
              aria-label={`Remove filter ${chip.label}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <DropdownMenu open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex size-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
              aria-label="Add filter"
            >
              <Plus className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-[min(24rem,70vh)] w-56 overflow-y-auto border border-white/[0.06] bg-[#1a1a1a] text-white"
          >
            {FILTER_MENU_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item}
                className="flex items-center justify-between text-white/85 focus:bg-white/[0.06]"
                onSelect={() => openFilterPopover(item)}
              >
                <span className="flex items-center gap-2">
                  <Filter className="size-3 text-white/40" />
                  {item}
                </span>
                <ChevronRight className="size-3 text-white/35" />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              className="text-white/85 focus:bg-white/[0.06]"
              onSelect={saveFiltersAsDefault}
            >
              Save as Default
            </DropdownMenuItem>
            <DropdownMenuLabel className="text-[11px] font-normal text-white/40">
              {settings.defaultFilters
                ? "Default filters saved to your account"
                : "Filters apply client-side on loaded sessions"}
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto text-[12px] font-medium text-white/50 hover:text-white/80"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {activePopover ? (
        <div
          ref={popoverRef}
          className={cn(subtlePanel(), "z-20 mb-4 max-w-lg shadow-xl")}
        >
          {activePopover === "creator" ? (
            <div className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                Creator
              </p>
              <ul className="space-y-1">
                {creatorOptions.map((name) => {
                  const checked = filters.creators.includes(name);
                  return (
                    <li key={name}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-white/85 hover:bg-white/[0.04]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(filters.creators);
                            if (checked) next.delete(name);
                            else next.add(name);
                            persistFilters({ ...filters, creators: [...next] });
                          }}
                          className="size-3.5 accent-[#6366F1]"
                        />
                        <User className="size-3.5 text-white/40" />
                        {name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {activePopover === "archived" ? (
            <div className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                Archived Status
              </p>
              {(
                [
                  { value: "all" as const, label: "All" },
                  { value: "not_archived" as const, label: "Not archived" },
                  { value: "archived" as const, label: "Archived" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-white/85 hover:bg-white/[0.04]"
                >
                  <input
                    type="radio"
                    name="archived-filter"
                    checked={filters.archivedStatus === opt.value}
                    onChange={() => persistFilters({ ...filters, archivedStatus: opt.value })}
                    className="accent-[#6366F1]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          ) : null}
          {activePopover === "updated" ? (
            <div>
              <p className="border-b border-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                Updated — after date
              </p>
              <DualMonthCalendar
                value={filters.updatedAfter}
                onChange={(iso) => persistFilters({ ...filters, updatedAfter: iso })}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-[12rem]">
        {loading && sessions.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/45">Loading sessions…</p>
        ) : null}
        {!loading && fetchError && sessions.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/55">
            <p>{fetchError}</p>
            <button
              type="button"
              onClick={() => void loadSessions()}
              className="mt-3 text-[13px] font-medium text-[#A5B4FC] hover:text-white"
            >
              Retry
            </button>
          </div>
        ) : null}
        {!loading && sortedRows.length === 0 && !(fetchError && sessions.length === 0) ? (
          <p className="py-16 text-center text-sm text-white/45">
            {sessions.length === 0
              ? fetchError
                ? "No sessions loaded. Fix the runtime error above or start a session from Continuity Lab home."
                : "No sessions yet. Start one from Continuity Lab home."
              : "No sessions match your search or filters."}
          </p>
        ) : null}
        {fetchError && sessions.length > 0 ? (
          <p className="mb-3 rounded border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100/90">
            {fetchError}
          </p>
        ) : null}
        {sortedRows.length > 0 ? (
          <div className="space-y-6">
            {groups.map((group) => {
              const collapsed = collapsedGroups[group.id] ?? false;
              return (
                <section key={group.id}>
                  {prefs.grouping !== "none" ? (
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-3.5 rounded border-white/20 accent-[#6366F1]"
                        aria-label={`Select ${group.label}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedGroups((prev) => ({
                            ...prev,
                            [group.id]: !prev[group.id],
                          }))
                        }
                        className="flex items-center gap-1.5 text-[13px] font-medium text-white/70 hover:text-white"
                      >
                        <ChevronDown
                          className={cn("size-3.5 transition", collapsed && "-rotate-90")}
                        />
                        {group.label}
                      </button>
                    </div>
                  ) : null}
                  {!collapsed ? (
                    <ul className="divide-y divide-white/[0.04] border-t border-white/[0.04]">
                      {group.rows.map((row) => (
                        <SessionListRow
                          key={row.id}
                          row={row}
                          displayProperties={prefs.displayProperties}
                          treeIndent={prefs.view === "tree"}
                        />
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
      {settingsReady && variant === "settings" ? (
        <p className="mt-4 text-[11px] text-white/35">
          Display and filters sync to your account. List refreshes every 30s and when you return to
          this tab. Archive state is stored locally until a server archive field exists.
        </p>
      ) : null}
    </div>
  );
}

function SessionListRow({
  row,
  displayProperties,
  treeIndent,
}: {
  row: SessionRow;
  displayProperties: SessionsDisplayProperty[];
  treeIndent: boolean;
}) {
  const router = useRouter();
  const meta = getLabSessionMeta(row.id);
  const userName = row.creatorLabel;
  const canNavigate = row.navigable !== false;
  const href = `/continuity-lab/session/${encodeURIComponent(row.id)}`;

  const subtitleParts: string[] = [];
  if (row.repo) subtitleParts.push(row.repo);
  if (displayProperties.includes("user")) subtitleParts.push(userName);
  if (displayProperties.includes("tags") && meta.tags?.length) {
    subtitleParts.push(meta.tags.join(", "));
  }
  if (displayProperties.includes("playbook")) {
    const playbook = row.playbook ?? meta.category;
    if (playbook) subtitleParts.push(playbook);
  }
  if (!canNavigate) {
    subtitleParts.push(
      row.source === "product_agent" ? "Product agent (console)" : "Continuity thread",
    );
  }

  const dateLabel = new Date(row.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const openSession = () => {
    if (canNavigate) router.push(href);
  };

  return (
    <li className="flex items-stretch gap-3 py-3">
      <input
        type="checkbox"
        className="mt-1 size-3.5 shrink-0 rounded border-white/20 accent-[#6366F1]"
        aria-label={`Select ${row.displayTitle}`}
      />
      <div
        role={canNavigate ? "button" : undefined}
        tabIndex={canNavigate ? 0 : undefined}
        onClick={canNavigate ? openSession : undefined}
        onKeyDown={
          canNavigate
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openSession();
                }
              }
            : undefined
        }
        className={cn(
          "flex min-w-0 flex-1 items-start gap-3 rounded-md transition",
          canNavigate && "cursor-pointer hover:bg-white/[0.03]",
          treeIndent && "pl-3",
        )}
      >
        <Clock className="mt-0.5 size-4 shrink-0 text-white/35" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-white">{row.displayTitle}</p>
          {subtitleParts.length > 0 ? (
            <p className="mt-0.5 truncate text-[12px] text-white/40">{subtitleParts.join(" · ")}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-[11px] text-white/40">
          {displayProperties.includes("created") ? (
            <span>
              {new Date(row.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : null}
          {displayProperties.includes("updated") ? (
            <span>{dateLabel}</span>
          ) : (
            <span>{formatLabRelativeTime(row.updatedAt)}</span>
          )}
          {displayProperties.includes("prs") && (row.prUrls?.length || row.repo) ? (
            <DollarSign
              className="size-3 text-white/30"
              aria-label={row.prUrls?.length ? "Linked PRs" : "Linked repository"}
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}
