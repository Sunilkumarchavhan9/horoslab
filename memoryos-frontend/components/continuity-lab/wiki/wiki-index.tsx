"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Globe,
  Grid3x3,
  LayoutList,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import {
  ContinuityLabRepoSelectModal,
  type RepoOption,
} from "@/components/continuity-lab/continuity-lab-repo-select-modal";
import { projectIdFromRepo } from "@/lib/continuity-lab/company-model";
import {
  fetchLabWikiSettingsFromApi,
  loadLabWikiSettingsHybrid,
} from "@/lib/continuity-lab/lab-wiki-settings-api";
import {
  LAB_WIKI_SETTINGS_CHANGED_EVENT,
  type LabWikiSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-wiki-settings-events";
import { filterReposForWikiIndex } from "@/lib/continuity-lab/lab-wiki-settings-runtime";
import {
  defaultLabWikiSettings,
  readLabWikiSettings,
  type LabWikiSettings,
} from "@/lib/continuity-lab/lab-wiki-settings-storage";
import {
  fetchAllRepoIndexStatuses,
  fetchOrgGraph,
  type GraphSummary,
  type RepoIndexStatus,
} from "@/lib/continuity-lab/wiki-api";
import {
  formatWikiRelativeTime,
  parseWikiRepoFullName,
  readWikiStorage,
  saveWikiStorage,
  touchRecentWikiRepo,
  wikiRepoHref,
  type WikiIndexFilter,
  type WikiViewMode,
} from "@/lib/continuity-lab/wiki";
import { cn } from "@/lib/utils";
import { WikiGithubIcon } from "@/components/continuity-lab/wiki/wiki-github-icon";

const FILTER_OPTIONS: Array<{ id: WikiIndexFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "indexed", label: "Indexed" },
  { id: "generating", label: "Generating" },
  { id: "not_indexed", label: "Not indexed" },
];

export function WikiIndex() {
  const { connector, refresh } = useContinuityLab();
  const github = connector.payload.github;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WikiIndexFilter>("all");
  const [viewMode, setViewMode] = useState<WikiViewMode>("grid");
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [cards, setCards] = useState<RepoIndexStatus[]>([]);
  const [graph, setGraph] = useState<GraphSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wikiSettings, setWikiSettings] = useState<LabWikiSettings>(defaultLabWikiSettings);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const remote = await loadLabWikiSettingsHybrid();
      if (cancelled) return;
      setWikiSettings(remote?.settings ?? readLabWikiSettings());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onWikiSettingsChanged(event: Event) {
      const detail = (event as CustomEvent<LabWikiSettingsChangedDetail>).detail;
      if (detail?.settings) setWikiSettings(detail.settings);
    }
    window.addEventListener(LAB_WIKI_SETTINGS_CHANGED_EVENT, onWikiSettingsChanged);
    return () => window.removeEventListener(LAB_WIKI_SETTINGS_CHANGED_EVENT, onWikiSettingsChanged);
  }, []);

  const repoOptions: RepoOption[] = useMemo(
    () =>
      github.repos.map((r) => ({
        fullName: r.fullName,
        private: r.private,
        defaultBranch: r.defaultBranch,
        updatedAt: r.updatedAt,
      })),
    [github.repos],
  );
  const loadIndex = useCallback(async () => {
    const settings =
      (await fetchLabWikiSettingsFromApi())?.settings ?? readLabWikiSettings();
    setWikiSettings(settings);
    const visibleNames = filterReposForWikiIndex(
      github.repos.map((r) => r.fullName),
      settings,
    );
    const repos = github.repos.filter((r) => visibleNames.includes(r.fullName));
    if (!repos.length) {
      setCards([]);
      setGraph(null);
      return;
    }
    setLoading(true);
    try {
      const [graphData, statuses] = await Promise.all([fetchOrgGraph(), fetchAllRepoIndexStatuses()]);
      const statusByFullName = new Map(statuses.map((entry) => [entry.fullName, entry]));
      setGraph(graphData);
      setCards(
        repos.map((repo) => {
          const projectId = projectIdFromRepo(repo.fullName);
          return (
            statusByFullName.get(repo.fullName) ?? {
              projectId,
              fullName: repo.fullName,
              status: "not_indexed" as const,
              indexed: false,
              generating: false,
              goal: null,
              confidence: null,
              updatedAt: repo.updatedAt ?? null,
            }
          );
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [github.repos]);

  useEffect(() => {
    const stored = readWikiStorage();
    setFilter(stored.filter);
    setViewMode(stored.viewMode);
  }, []);

  useEffect(() => {
    void loadIndex();
  }, [loadIndex]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
      await loadIndex();
    } finally {
      setRefreshing(false);
    }
  }

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => {
      if (filter === "indexed" && card.status !== "indexed") return false;
      if (filter === "generating" && card.status !== "generating") return false;
      if (filter === "not_indexed" && card.status !== "not_indexed") return false;
      if (q && !card.fullName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cards, filter, search]);

  const nodeCount = graph?.nodes?.length ?? 0;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[#2F2F2F] bg-[#0A0A0A] px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[#F0EFE2] sm:text-2xl">
              Operational Wiki
            </h1>
            <p className="mt-1 text-xs text-[#F0EFE2]/45">
              Repo-scoped memory from Company Brain — not generated prose.
              {wikiSettings.enrolledRepos.length > 0 ? (
                <>
                  {" "}
                  Showing {wikiSettings.enrolledRepos.length} enrolled{" "}
                  {wikiSettings.enrolledRepos.length === 1 ? "repo" : "repos"}.
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#F0EFE2]/40">
            <span>{github.repos.length} repos</span>
            <span>·</span>
            <span>{nodeCount} map nodes</span>
            {graph?.updatedAt ? (
              <>
                <span>·</span>
                <span>Map {formatWikiRelativeTime(graph.updatedAt)}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#F0EFE2]/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories…"
              className="h-9 w-full rounded-md border border-[#3A3A3A] bg-[#111111] pl-9 pr-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-[#4338CA] focus:outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={filter}
              onChange={(e) => {
                const next = e.target.value as WikiIndexFilter;
                setFilter(next);
                saveWikiStorage({ filter: next });
              }}
              className="h-9 appearance-none rounded-md border border-[#3A3A3A] bg-[#111111] py-0 pl-3 pr-8 text-[11px] font-medium text-[#F0EFE2]/85 focus:border-[#4338CA] focus:outline-none"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#F0EFE2]/45" />
          </div>

          <div className="flex overflow-hidden rounded-md border border-[#3A3A3A]">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                saveWikiStorage({ viewMode: "grid" });
              }}
              className={cn(
                "inline-flex size-9 items-center justify-center",
                viewMode === "grid" ? "bg-[#1a1a2e] text-[#F0EFE2]" : "text-[#F0EFE2]/50 hover:text-[#F0EFE2]",
              )}
              aria-label="Grid view"
            >
              <Grid3x3 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                saveWikiStorage({ viewMode: "list" });
              }}
              className={cn(
                "inline-flex size-9 items-center justify-center border-l border-[#3A3A3A]",
                viewMode === "list" ? "bg-[#1a1a2e] text-[#F0EFE2]" : "text-[#F0EFE2]/50 hover:text-[#F0EFE2]",
              )}
              aria-label="List view"
            >
              <LayoutList className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing || loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#3A3A3A] px-3 text-[11px] font-medium text-[#F0EFE2]/80 hover:border-[#4A4A4A] disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", (refreshing || loading) && "animate-spin")} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setRepoModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#4338CA] px-3 text-[11px] font-semibold text-[#F0EFE2] hover:bg-[#4f46e5]"
          >
            Add repo
          </button>
        </div>
      </header>

      <div className="flex-1 px-5 py-6 sm:px-8">
        {!github.connected ? (
          <div className={cn(subtlePanel(), "border-[#4338CA]/40 bg-[#4338CA]/10 px-4 py-4 text-sm text-[#F0EFE2]/70")}>
            Connect GitHub to browse repositories in the operational wiki.{" "}
            <Link
              href="/mission-control?section=connectors"
              className="font-semibold text-indigo-300 underline hover:text-indigo-200"
            >
              Connect GitHub
            </Link>
          </div>
        ) : loading && cards.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-[#F0EFE2]/50">
            <Loader2 className="size-4 animate-spin" />
            Loading repositories…
          </p>
        ) : github.repos.length === 0 ? (
          <div className={cn(subtlePanel(), "px-4 py-4 text-sm text-[#F0EFE2]/60")}>
            Sync repo to index operational memory.{" "}
            <Link href="/mission-control?section=connectors" className="text-indigo-300 underline">
              Sync GitHub
            </Link>
          </div>
        ) : wikiSettings.enrolledRepos.length > 0 && cards.length === 0 ? (
          <div className={cn(subtlePanel(), "px-4 py-4 text-sm text-[#F0EFE2]/60")}>
            No enrolled repositories are connected yet.{" "}
            <Link
              href="/continuity-lab/settings/wiki"
              className="text-indigo-300 underline hover:text-indigo-200"
            >
              Manage Wiki settings
            </Link>
          </div>
        ) : filteredCards.length === 0 ? (
          <p className="text-sm text-[#F0EFE2]/50">No repositories match your search or filter.</p>
        ) : (
          <ul
            className={cn(
              viewMode === "grid"
                ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-2",
            )}
          >
            {filteredCards.map((card) => {
              const parts = parseWikiRepoFullName(card.fullName);
              const repoMeta = github.repos.find((r) => r.fullName === card.fullName);
              const relativeAt = card.updatedAt ?? repoMeta?.updatedAt ?? github.lastSyncAt;

              return (
              <li key={card.fullName}>
                <Link
                  href={wikiRepoHref(card.projectId)}
                  onClick={() => touchRecentWikiRepo(card.fullName)}
                  className={cn(
                    cn(
                      subtlePanel(),
                      "block transition hover:border-[#4338CA]/45 hover:bg-[#222222]",
                    ),
                    viewMode === "grid" ? "p-4" : "flex items-center gap-4 px-4 py-3",
                  )}
                >
                  <div className={cn("flex min-w-0 flex-1 items-start gap-3", viewMode === "list" && "items-center")}>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#3A3A3A] bg-[#0A0A0A]">
                      <Globe className="size-4 text-[#6366F1]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {parts ? (
                        <>
                          <p className="truncate text-[11px] text-[#F0EFE2]/45">{parts.owner}</p>
                          <p className="truncate font-mono text-sm font-medium text-[#F0EFE2]">
                            {parts.repo}
                          </p>
                        </>
                      ) : (
                        <p className="truncate font-mono text-sm font-medium text-[#F0EFE2]">
                          {card.fullName}
                        </p>
                      )}
                      {viewMode === "grid" ? (
                        card.goal ? (
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#F0EFE2]/55">
                            {card.goal}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-[#F0EFE2]/40">
                            {card.indexed
                              ? "Indexed — open for contract sections."
                              : "Sync repo to index operational memory."}
                          </p>
                        )
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-[#F0EFE2]/40">
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5",
                            card.status === "indexed"
                              ? "border-emerald-500/30 text-emerald-200/90"
                              : card.status === "generating"
                                ? "border-amber-500/30 text-amber-100/90"
                                : "border-[#3A3A3A] text-[#F0EFE2]/45",
                          )}
                        >
                          {card.status === "indexed"
                            ? "Indexed"
                            : card.status === "generating"
                              ? "Generating"
                              : "Not indexed"}
                        </span>
                        <span className="inline-flex items-center gap-1 normal-case text-[#F0EFE2]/45">
                          <WikiGithubIcon className="size-3" />
                          {formatWikiRelativeTime(relativeAt)}
                        </span>
                        {card.confidence != null ? (
                          <span>Resume {Math.round(card.confidence * 100)}%</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
            })}
          </ul>
        )}
      </div>

      <ContinuityLabRepoSelectModal
        open={repoModalOpen}
        onClose={() => setRepoModalOpen(false)}
        selected={[]}
        onConfirm={(repos) => {
          const first = repos[0];
          if (first) {
            touchRecentWikiRepo(first);
            window.location.href = wikiRepoHref(projectIdFromRepo(first));
          }
        }}
        lastSyncAt={github.lastSyncAt}
        initialRepos={repoOptions}
      />
    </div>
  );
}
