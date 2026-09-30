"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Hexagon,
  HelpCircle,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { ConsolePage } from "@/components/developer-console/console-ui";
import { ConnectorBrandIcon } from "@/components/developer-console/connector-brand-icons";
import {
  connectSource,
  disconnectSource,
  getSourceErrors,
  getSourceItems,
  getSourceMemories,
  getSourceSyncEvents,
  getSourcesSummary,
  listSourceProviders,
  listSources,
  manualImport,
  pasteAgentChat,
  reconnectSource,
  syncSourceNow,
  type CompanySource,
  type SourceEvent,
  type SourceItem,
  type SourceMemory,
  type SourceProvider,
} from "@/lib/company-sources-api";
import { cn } from "@/lib/utils";

type SourceFilter = "All Sources" | "Engineering" | "Support" | "Cloud" | "Communication" | "Docs" | "Manual";
type DetailTab = "Overview" | "Items" | "Memories" | "Errors" | "Sync Events";
type SourceCard = {
  id: string;
  providerId: string;
  name: string;
  category: SourceFilter;
  icon: string;
  description: string;
  firstLaunch: boolean;
  catalogStatus: SourceProvider["status"];
  source?: CompanySource;
  status: CompanySource["status"];
  lastSyncedAt?: string | null;
  itemCount?: number;
  memoryCount?: number;
  health?: number | null;
};

const filters: SourceFilter[] = ["All Sources", "Engineering", "Support", "Cloud", "Communication", "Docs", "Manual"];
const SOURCE_EVENT_TYPES = new Set([
  "source.connected",
  "source.sync_started",
  "source.item_imported",
  "source.memory_extracted",
  "source.sync_failed",
  "source.sync_completed",
]);
const FALLBACK_SOURCE_SUMMARY = {
  connectedSources: 0,
  totalSources: 0,
  itemsImported: 0,
  memoriesExtracted: 0,
  syncHealth: 100,
  syncErrors: 0,
  lastSyncAt: null,
};
const FALLBACK_SOURCE_PROVIDERS: SourceProvider[] = [
  { id: "github", name: "GitHub", category: "Engineering", firstLaunch: true, status: "available", icon: "github", description: "Repositories, issues, pull requests, and engineering activity." },
  { id: "slack", name: "Slack", category: "Communication", firstLaunch: true, status: "available", icon: "slack", description: "Team conversations, decisions, and operational context." },
  { id: "notion", name: "Notion", category: "Docs", firstLaunch: true, status: "available", icon: "notion", description: "Docs, runbooks, and shared knowledge pages." },
  { id: "linear", name: "Linear", category: "Engineering", firstLaunch: true, status: "available", icon: "linear", description: "Issues, projects, and execution tracking." },
  { id: "google-drive", name: "Google Drive", category: "Docs", firstLaunch: true, status: "available", icon: "google-drive", description: "Markdown docs, exports, and shared files." },
  { id: "jira", name: "Jira", category: "Engineering", firstLaunch: true, status: "available", icon: "jira", description: "Backlog items, tickets, and delivery state." },
  { id: "confluence", name: "Confluence", category: "Docs", firstLaunch: true, status: "available", icon: "confluence", description: "Internal documentation and project specs." },
  { id: "microsoft-teams", name: "Microsoft Teams", category: "Communication", firstLaunch: true, status: "available", icon: "microsoft-teams", description: "Meeting notes, chat context, and team updates." },
];

function formatNumber(value?: number | null): string {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat().format(value);
}

function formatTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusTone(status: CompanySource["status"]): string {
  if (status === "syncing") return "bg-blue-50 text-blue-700 border-blue-100";
  if (status === "error") return "bg-red-50 text-red-700 border-red-100";
  if (status === "disconnected" || status === "not_connected") return "bg-slate-50 text-slate-500 border-slate-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

function SourceIcon({ source, size = "md" }: { source: { icon?: string; provider?: string }; size?: "sm" | "md" }) {
  return <ConnectorBrandIcon id={source.icon ?? source.provider ?? "local-files"} className={size === "sm" ? "size-5" : "size-8"} />;
}

function asSourceFilter(value?: string): SourceFilter {
  return filters.includes(value as SourceFilter) ? (value as SourceFilter) : "Manual";
}

export function CompanySourcesSection() {
  const [activeFilter, setActiveFilter] = useState<SourceFilter>("All Sources");
  const [search, setSearch] = useState("");
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<CompanySource | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [status, setStatus] = useState("Sources ready.");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: summary, error: summaryError, isLoading: summaryLoading, mutate: mutateSummary } = useSWR(
    "/api/sources/summary",
    getSourcesSummary,
    { fallbackData: FALLBACK_SOURCE_SUMMARY },
  );
  const { data: sources = [], error: sourcesError, isLoading: sourcesLoading, mutate: mutateSources } = useSWR(
    ["/api/sources", activeFilter],
    ([, category]) => listSources(category),
  );
  const { data: providers = [], error: providersError, isLoading: providersLoading, mutate: mutateProviders } = useSWR(
    "/api/sources/providers",
    listSourceProviders,
    { fallbackData: FALLBACK_SOURCE_PROVIDERS },
  );
  const activeSourceId = activeSource?.id ?? null;
  const { data: items = [], mutate: mutateItems } = useSWR<SourceItem[]>(
    activeSourceId ? ["/api/sources/items", activeSourceId] : null,
    ([, id]: [string, string]) => getSourceItems(id),
  );
  const { data: memories = [], mutate: mutateMemories } = useSWR<SourceMemory[]>(
    activeSourceId ? ["/api/sources/memories", activeSourceId] : null,
    ([, id]: [string, string]) => getSourceMemories(id),
  );
  const { data: errors = [], mutate: mutateErrors } = useSWR<SourceEvent[]>(
    activeSourceId ? ["/api/sources/errors", activeSourceId] : null,
    ([, id]: [string, string]) => getSourceErrors(id),
  );
  const { data: syncEvents = [], mutate: mutateSyncEvents } = useSWR<SourceEvent[]>(
    activeSourceId ? ["/api/sources/sync-events", activeSourceId] : null,
    ([, id]: [string, string]) => getSourceSyncEvents(id),
  );

  useEffect(() => {
    const stream = new EventSource("/api/events/stream");
    stream.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { payload?: { eventType?: string } };
        const eventType = parsed.payload?.eventType;
        if (eventType && SOURCE_EVENT_TYPES.has(eventType)) {
          setStatus(`Live update: ${eventType}`);
          void mutateSummary();
          void mutateSources();
          void mutateItems();
          void mutateMemories();
          void mutateErrors();
          void mutateSyncEvents();
        }
      } catch {
        // Ignore malformed stream payloads.
      }
    };
    stream.onerror = () => setStatus("Realtime stream reconnecting...");
    return () => stream.close();
  }, [mutateErrors, mutateItems, mutateMemories, mutateSources, mutateSummary, mutateSyncEvents]);

  const sourceCards = useMemo<SourceCard[]>(() => {
    const sourceByProvider = new Map(sources.map((source) => [source.provider, source]));
    const providerIds = new Set(providers.map((provider) => provider.id));
    const cards = providers.map((provider) => {
      const source = sourceByProvider.get(provider.id);
      return {
        id: source?.id ?? `provider-${provider.id}`,
        providerId: provider.id,
        name: source?.providerName ?? provider.name,
        category: asSourceFilter(source?.category ?? provider.category),
        icon: source?.icon ?? provider.icon,
        description: provider.description,
        firstLaunch: provider.firstLaunch,
        catalogStatus: provider.status,
        source,
        status: source?.status ?? "not_connected",
        lastSyncedAt: source?.lastSyncedAt ?? null,
        itemCount: source?.itemCount ?? 0,
        memoryCount: source?.memoryCount ?? 0,
        health: source?.health ?? null,
      } satisfies SourceCard;
    });

    for (const source of sources) {
      if (providerIds.has(source.provider)) continue;
      cards.push({
        id: source.id,
        providerId: source.provider,
        name: source.providerName ?? source.provider,
        category: asSourceFilter(source.category),
        icon: source.icon ?? source.provider,
        description: "Connected custom source syncing into the MemoryOS company brain.",
        firstLaunch: true,
        catalogStatus: "available",
        source,
        status: source.status,
        lastSyncedAt: source.lastSyncedAt ?? null,
        itemCount: source.itemCount ?? 0,
        memoryCount: source.memoryCount ?? 0,
        health: source.health ?? null,
      });
    }
    return cards;
  }, [providers, sources]);

  const visibleSourceCards = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sourceCards.filter((card) => {
      const matchesCategory = activeFilter === "All Sources" || card.category === activeFilter;
      const matchesSearch = `${card.name} ${card.providerId} ${card.category} ${card.description}`.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, search, sourceCards]);

  const counts = useMemo(() => {
    const byCategory = Object.fromEntries(filters.map((filter) => [filter, 0])) as Record<SourceFilter, number>;
    byCategory["All Sources"] = sourceCards.length;
    for (const card of sourceCards) {
      byCategory[card.category] += 1;
    }
    return byCategory;
  }, [sourceCards]);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setActionError(null);
    try {
      await action();
      setStatus(success);
      await Promise.all([mutateSummary(), mutateSources(), mutateItems(), mutateMemories(), mutateErrors(), mutateSyncEvents()]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "action_failed");
    }
  }

  const metrics = [
    { label: "Connected Sources", value: summary?.connectedSources ?? 0, icon: CheckCircle2, color: "text-amber-500", drawer: sources.filter((source) => !["disconnected", "not_connected"].includes(source.status)) },
    { label: "Items Imported", value: summary?.itemsImported ?? 0, icon: Database, color: "text-amber-500", drawer: { total: summary?.itemsImported, hint: "Open a source to inspect imported SourceItems." } },
    { label: "Memories Extracted", value: summary?.memoriesExtracted ?? 0, icon: Hexagon, color: "text-amber-500", drawer: { total: summary?.memoriesExtracted, loop: "SourceItems trigger MemoryExtractionJob and update Company Brain + MemoryIgnition." } },
    { label: "Sync Health", value: `${summary?.syncHealth ?? 100}%`, icon: CheckCircle2, color: "text-emerald-500", drawer: summary },
    { label: "Sync Errors", value: summary?.syncErrors ?? 0, icon: AlertTriangle, color: "text-red-500", drawer: errors },
  ];

  return (
    <ConsolePage className="h-full w-full overflow-y-auto bg-[#FAFAFA] pb-16 text-slate-950 memoryos-console-scroll">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-5 md:px-6 md:pt-6">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Company Sources</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Connect, import, sync, and extract memory from the systems where company work happens.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search sources..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 w-full rounded-full border border-slate-200 py-1.5 pl-9 pr-4 text-[13px] focus:outline-none md:w-[240px]"
              />
            </div>
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 text-[12px] font-medium text-slate-500 xl:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Last sync: {formatTime(summary?.lastSyncAt)}
            </div>
            <button className="hidden h-8 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-[12.5px] font-medium text-[#1d4ed8] lg:flex">
              <HelpCircle className="size-3.5" /> Help
            </button>
            <button className="relative flex h-8 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-[12.5px] font-medium text-[#1d4ed8]">
              <Bell className="size-3.5" /> Alerts
              {(summary?.syncErrors ?? 0) > 0 ? <span className="absolute right-[3px] top-[1px] size-[7px] rounded-full bg-[#ef4444]" /> : null}
            </button>
            <button
              onClick={() => setProviderModalOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[#0a0f1c] px-4 font-medium text-white"
            >
              <Plus className="size-4" />
              <span className="text-[13px]">Connect Source</span>
            </button>
          </div>
        </div>

        {actionError || summaryError || sourcesError || providersError ? (
          <div className="mb-5 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
            {actionError ?? summaryError?.message ?? sourcesError?.message ?? providersError?.message}
          </div>
        ) : null}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryLoading
            ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-[180px] animate-pulse rounded-[20px] bg-slate-200" />)
            : metrics.map((metric) => (
                <button
                  key={metric.label}
                  onClick={() => {
                    setActiveSource(null);
                    setActiveTab("Overview");
                    setStatus(`${metric.label} detail opened.`);
                  }}
                  className="flex h-[180px] flex-col rounded-[20px] border border-black/5 bg-[#E2E4E9] text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative z-10 flex flex-1 flex-col overflow-hidden rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <div className="relative z-10 mb-2 flex items-center gap-2">
                      <metric.icon className={cn("size-4", metric.color)} strokeWidth={2.5} />
                      <span className="text-[13px] font-bold text-slate-700">{metric.label}</span>
                    </div>
                    <div className="relative z-10 mt-1 text-[40px] font-black leading-none tracking-tighter text-slate-900">
                      {typeof metric.value === "number" ? formatNumber(metric.value) : metric.value}
                    </div>
                  </div>
                  <div className="flex h-10 shrink-0 items-center justify-center px-4">
                    <div className="inline-flex items-center gap-1.5 rounded bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      <span className="text-emerald-600">live</span>
                      <span>{status}</span>
                    </div>
                  </div>
                </button>
              ))}
        </div>

        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors",
                  activeFilter === filter
                    ? "border-amber-100 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {filter}
                <span className={cn("rounded px-1.5 py-0.5 text-[10px]", activeFilter === filter ? "bg-amber-200/50 text-amber-900" : "bg-slate-100 text-slate-500")}>
                  {counts[filter] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setManualModalOpen(true)} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50">
              <Upload className="size-3.5" /> Manual import
            </button>
            <button onClick={() => setPasteModalOpen(true)} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50">
              Agent chat paste <ChevronDown className="size-3 text-slate-400" strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sourcesLoading && providersLoading ? (
            Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[170px] animate-pulse rounded-[16px] bg-slate-200" />)
          ) : visibleSourceCards.length === 0 ? (
            <div className="col-span-full rounded-[16px] border border-dashed border-slate-300 bg-white p-10 text-center text-[13px] font-semibold text-slate-500">
              No sources match this filter. Connect GitHub, import markdown docs, add manual notes, or paste an agent chat.
            </div>
          ) : (
            visibleSourceCards.map((card) => (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (card.source) {
                    setActiveSource(card.source);
                    setActiveTab("Overview");
                    return;
                  }
                  if (card.catalogStatus !== "available") {
                    setStatus(`${card.name} is in the full source catalog. Sync adapter not enabled yet.`);
                    return;
                  }
                  void runAction(async () => {
                    const source = await connectSource(card.providerId);
                    setActiveSource(source);
                  }, `${card.name} connected.`);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (card.source) {
                      setActiveSource(card.source);
                      setActiveTab("Overview");
                      return;
                    }
                    if (card.catalogStatus !== "available") {
                      setStatus(`${card.name} is coming soon. Sync adapter not enabled yet.`);
                      return;
                    }
                    void runAction(async () => {
                      const source = await connectSource(card.providerId);
                      setActiveSource(source);
                    }, `${card.name} connected.`);
                  }
                }}
                className="relative rounded-[16px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-2">
                      <SourceIcon source={{ icon: card.icon, provider: card.providerId }} />
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <h3 className="text-[14px] font-bold leading-none text-slate-900">{card.name}</h3>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold", statusTone(card.status))}>
                        <span className={cn("size-1.5 rounded-full", card.status === "error" ? "bg-red-500" : card.status === "syncing" ? "bg-blue-500" : card.status === "not_connected" || card.status === "disconnected" ? "bg-slate-400" : "bg-emerald-500")} />
                        {card.status === "not_connected" ? "available" : card.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {card.source ? (
                    <div className="relative">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(openMenuId === card.source?.id ? null : card.source?.id ?? null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") setOpenMenuId(openMenuId === card.source?.id ? null : card.source?.id ?? null);
                      }}
                      className="block rounded-md p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    >
                      <MoreVertical className="size-4" />
                    </span>
                    {openMenuId === card.source.id ? (
                      <SourceMenu
                        source={card.source}
                        onClose={() => setOpenMenuId(null)}
                        onOpen={(tab) => {
                          setActiveSource(card.source ?? null);
                          setActiveTab(tab);
                        }}
                        onAction={runAction}
                      />
                    ) : null}
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                        card.catalogStatus === "available"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-slate-50 text-slate-500",
                      )}
                    >
                      {card.catalogStatus === "available" ? "Connect" : "Coming soon"}
                    </span>
                  )}
                </div>
                <div className="mb-4 text-[11px] font-medium text-slate-500">
                  {card.source ? `Last sync: ${formatTime(card.lastSyncedAt)}` : card.description}
                </div>
                <div className="flex items-center justify-between">
                  <Stat icon={FileText} label="Items" value={formatNumber(card.itemCount)} />
                  <Stat icon={Hexagon} label="Memories" value={formatNumber(card.memoryCount)} />
                  <Stat icon={CheckCircle2} label="Health" value={card.health == null ? "-" : `${card.health}%`} />
                  <div className="flex flex-col gap-0.5">
                    <div className="text-right text-[12px] font-bold text-slate-900">Read</div>
                    <span className="text-right text-[9px] font-bold uppercase tracking-wider text-slate-400">Permissions</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ActivityTable events={syncEvents} sources={sources} />
          <HealthAlerts errors={errors} />
        </div>
      </div>

      {providerModalOpen ? (
        <ProviderModal
          providers={providers}
          onClose={() => setProviderModalOpen(false)}
          onConnect={(provider) => runAction(async () => {
            const source = await connectSource(provider.id);
            setActiveSource(source);
            await mutateProviders();
          }, `${provider.name} connected.`)}
        />
      ) : null}
      {manualModalOpen ? (
        <ManualImportModal
          onClose={() => setManualModalOpen(false)}
          onImport={(input) => runAction(async () => {
            const result = await manualImport(input);
            setActiveSource(result.source);
          }, "Manual import completed and memory extraction finished.")}
        />
      ) : null}
      {pasteModalOpen ? (
        <AgentPasteModal
          onClose={() => setPasteModalOpen(false)}
          onPaste={(input) => runAction(async () => {
            const result = await pasteAgentChat(input);
            setActiveSource(result.source);
          }, "Agent chat imported and memory extraction finished.")}
        />
      ) : null}
      {activeSource ? (
        <SourceDetailDrawer
          source={activeSource}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          items={items}
          memories={memories}
          errors={errors}
          events={syncEvents}
          onClose={() => setActiveSource(null)}
          onAction={runAction}
        />
      ) : null}
    </ConsolePage>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-slate-500">
        <Icon className="size-3" />
        <span className="ml-0.5 text-[13px] font-bold text-slate-900">{value}</span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}

function SourceMenu({
  source,
  onClose,
  onOpen,
  onAction,
}: {
  source: CompanySource;
  onClose: () => void;
  onOpen: (tab: DetailTab) => void;
  onAction: (action: () => Promise<unknown>, success: string) => void;
}) {
  const actions: Array<{ label: string; run: () => void }> = [
    { label: "Sync now", run: () => onAction(() => syncSourceNow(source.id), `${source.providerName ?? source.provider} sync completed.`) },
    { label: "View items", run: () => onOpen("Items") },
    { label: "View memories", run: () => onOpen("Memories") },
    { label: "View errors", run: () => onOpen("Errors") },
    { label: "Reconnect", run: () => onAction(() => reconnectSource(source.id), `${source.providerName ?? source.provider} reconnected.`) },
    { label: "Disconnect", run: () => onAction(() => disconnectSource(source.id), `${source.providerName ?? source.provider} disconnected.`) },
  ];
  return (
    <div className="absolute right-0 top-7 z-30 w-44 rounded-[10px] border border-slate-200 bg-white p-1 shadow-xl">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={(event) => {
            event.stopPropagation();
            action.run();
            onClose();
          }}
          className="w-full rounded-md px-3 py-2 text-left text-[12px] font-bold text-slate-600 hover:bg-slate-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function ActivityTable({ events, sources }: { events: SourceEvent[]; sources: CompanySource[] }) {
  const fallback: SourceEvent[] = sources.slice(0, 5).map((source) => ({
    id: source.id,
    sourceId: source.id,
    eventType: source.status === "syncing" ? "source.sync_started" : "source.sync_completed",
    occurredAt: source.lastSyncedAt ?? source.createdAt,
    itemCount: source.itemCount,
    memoryCount: source.memoryCount,
  }));
  const rows = events.length ? events : fallback;
  return (
    <div className="rounded-[20px] border border-black/5 bg-[#E2E4E9] xl:col-span-2">
      <div className="flex h-14 items-center justify-between px-6">
        <h2 className="text-[15px] font-bold text-slate-900">Recent Sync Activity</h2>
        <span className="text-[12px] font-bold text-blue-600">live SSE</span>
      </div>
      <div className="overflow-hidden rounded-[20px] border border-black/[0.04] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <table className="w-full text-left">
          <thead>
            <tr>
              {["Source", "Event", "Items", "Memories", "Status", "Started", ""].map((header) => (
                <th key={header} className="pb-3 text-[11px] font-medium text-slate-400">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(0, 8).map((event) => {
              const source = sources.find((item) => item.id === event.sourceId);
              return (
                <tr key={event.id} className="group hover:bg-slate-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <SourceIcon source={source ?? { provider: "local-files" }} size="sm" />
                      <span className="text-[13px] font-bold text-slate-900">{source?.providerName ?? source?.provider ?? event.sourceId ?? "Source"}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[12px] font-medium text-slate-700">{event.eventType ?? event.kind}</td>
                  <td className="py-3 text-[12px] font-bold text-slate-700">{formatNumber(event.itemCount)}</td>
                  <td className="py-3 text-[12px] font-bold text-slate-700">{formatNumber(event.memoryCount)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                      <Check className="size-3" strokeWidth={3} /> {event.eventType?.includes("failed") ? "Failed" : "Success"}
                    </span>
                  </td>
                  <td className="py-3 text-[12px] font-medium text-slate-500">{formatTime(event.occurredAt)}</td>
                  <td className="py-3 text-right"><ChevronRight className="size-4 text-slate-300 group-hover:text-slate-500" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HealthAlerts({ errors }: { errors: SourceEvent[] }) {
  const rows = errors.length
    ? errors.slice(0, 4).map((error) => ({
        title: error.error ?? "Source sync failed",
        sub: error.eventType ?? "source.sync_failed",
        time: formatTime(error.occurredAt),
        tone: "red" as const,
      }))
    : [{ title: "All first-launch sources operational", sub: "No source errors detected", time: "live", tone: "green" as const }];
  return (
    <div className="rounded-[20px] border border-black/5 bg-[#E2E4E9]">
      <div className="flex h-14 items-center justify-between px-6">
        <h2 className="text-[15px] font-bold text-slate-900">Source Health Alerts</h2>
        <span className="text-[12px] font-bold text-amber-600">View all</span>
      </div>
      <div className="rounded-[20px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="space-y-4">
          {rows.map((alert) => (
            <div key={`${alert.title}-${alert.time}`} className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className={cn("mt-0.5 rounded-md p-1.5", alert.tone === "red" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                  {alert.tone === "red" ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900">{alert.title}</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">{alert.sub}</p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-slate-400">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProviderModal({ providers, onClose, onConnect }: { providers: SourceProvider[]; onClose: () => void; onConnect: (provider: SourceProvider) => void }) {
  return (
    <Modal title="Connect Source" onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        {providers.map((provider) => (
          <button
            key={provider.id}
            disabled={provider.status !== "available"}
            onClick={() => {
              onConnect(provider);
              onClose();
            }}
            className="rounded-[14px] border border-slate-200 p-4 text-left transition hover:border-amber-200 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="mb-2 flex items-center gap-3">
              <ConnectorBrandIcon id={provider.icon} className="size-7" />
              <div>
                <div className="text-[13px] font-black text-slate-900">{provider.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {provider.status === "available" ? "First product" : "Coming soon"}
                </div>
              </div>
            </div>
            <p className="text-[12px] font-medium leading-relaxed text-slate-500">{provider.description}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ManualImportModal({ onClose, onImport }: { onClose: () => void; onImport: (input: { title?: string; content?: string; files?: Array<{ name: string; content: string }> }) => void }) {
  const [title, setTitle] = useState("Manual import");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<Array<{ name: string; content: string }>>([]);
  async function readFiles(fileList: FileList | null) {
    if (!fileList) return;
    const accepted = Array.from(fileList).filter((file) => /\.(md|markdown|txt)$/i.test(file.name));
    const loaded = await Promise.all(accepted.map(async (file) => ({ name: file.name, content: await file.text() })));
    setFiles(loaded);
  }
  return (
    <Modal title="Manual Import" onClose={onClose}>
      <input value={title} onChange={(event) => setTitle(event.target.value)} className="mb-3 w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] font-semibold outline-none" />
      <input type="file" multiple accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={(event) => void readFiles(event.target.files)} className="mb-3 w-full text-[12px]" />
      <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste markdown or notes..." className="mb-4 min-h-[180px] w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] outline-none" />
      <button
        onClick={() => {
          onImport(files.length ? { files } : { title, content });
          onClose();
        }}
        className="w-full rounded-[10px] bg-slate-950 py-3 text-[13px] font-black text-white"
      >
        Import and Extract Memory
      </button>
    </Modal>
  );
}

function AgentPasteModal({ onClose, onPaste }: { onClose: () => void; onPaste: (input: { title?: string; agent?: string; content: string }) => void }) {
  const [agent, setAgent] = useState("Codex");
  const [content, setContent] = useState("");
  return (
    <Modal title="Agent Chat Paste" onClose={onClose}>
      <select value={agent} onChange={(event) => setAgent(event.target.value)} className="mb-3 w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] font-semibold outline-none">
        {["Codex", "Cursor", "Claude Code", "Windsurf", "Cline"].map((item) => <option key={item}>{item}</option>)}
      </select>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste the agent session transcript..." className="mb-4 min-h-[240px] w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] outline-none" />
      <button
        disabled={!content.trim()}
        onClick={() => {
          onPaste({ title: `${agent} session`, agent, content });
          onClose();
        }}
        className="w-full rounded-[10px] bg-slate-950 py-3 text-[13px] font-black text-white disabled:opacity-50"
      >
        Create SourceItem and Extract Memory
      </button>
    </Modal>
  );
}

function SourceDetailDrawer({
  source,
  activeTab,
  setActiveTab,
  items,
  memories,
  errors,
  events,
  onClose,
  onAction,
}: {
  source: CompanySource;
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;
  items: SourceItem[];
  memories: SourceMemory[];
  errors: SourceEvent[];
  events: SourceEvent[];
  onClose: () => void;
  onAction: (action: () => Promise<unknown>, success: string) => void;
}) {
  const content =
    activeTab === "Items" ? items :
    activeTab === "Memories" ? memories :
    activeTab === "Errors" ? errors :
    activeTab === "Sync Events" ? events :
    source;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[1px]">
      <button aria-label="Close source detail overlay" className="flex-1 cursor-default" onClick={onClose} />
      <aside className="h-full w-full max-w-[520px] overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SourceIcon source={source} />
            <div>
              <h3 className="text-[18px] font-black text-slate-900">{source.providerName ?? source.provider}</h3>
              <p className="text-[12px] font-semibold text-slate-500">
                {"Source -> SourceItem -> MemoryExtractionJob -> Company Brain -> MemoryIgnition"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X className="size-4" />
          </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-1">
          {(["Overview", "Items", "Memories", "Errors", "Sync Events"] as DetailTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("rounded-full px-3 py-1.5 text-[11px] font-black", activeTab === tab ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-500")}>
              {tab}
            </button>
          ))}
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <button onClick={() => onAction(() => syncSourceNow(source.id), "Sync completed.")} className="rounded-[10px] border border-slate-200 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50">
            <RefreshCw className="mx-auto mb-1 size-3.5" /> Sync now
          </button>
          <button onClick={() => onAction(() => reconnectSource(source.id), "Source reconnected.")} className="rounded-[10px] border border-slate-200 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50">Reconnect</button>
          <button onClick={() => onAction(() => disconnectSource(source.id), "Source disconnected.")} className="rounded-[10px] border border-red-100 py-2 text-[11px] font-black text-red-600 hover:bg-red-50">Disconnect</button>
        </div>
        <pre className="min-h-[360px] overflow-auto rounded-[14px] border border-slate-200 bg-slate-950 p-4 text-[12px] leading-relaxed text-slate-100">
          {JSON.stringify(content, null, 2)}
        </pre>
      </aside>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]">
      <div className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-[20px] border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
