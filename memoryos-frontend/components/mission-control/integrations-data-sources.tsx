"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 Database,
 Search,
 AlertTriangle,
 Plus,
 ChevronDown,
 ChevronsUpDown,
 X,
 Check,
 RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
 readActiveHorosWorkspaceId,
 listHorosIntegrations,
} from "@/lib/horos-api";
import { authorizeConnector, disconnectConnector, syncConnector } from "@/lib/continuity-lab/connector-actions";
import { fetchConnectorList } from "@/lib/continuity-lab/connector-list";
import {
 connectSource,
 clearStickyCompanySource,
 dedupeCompanySourcesForDisplay,
 disconnectSource,
 findCompanySourceForProvider,
 isLiveCompanySource,
 listSourceProviders,
 listSources,
 mergeCompanySourcesWithSticky,
 rememberStickyCompanySource,
 type CompanySource,
 type SourceProvider,
} from "@/lib/company-sources-api";

/* Map provider ID to official image assets in /connector-icons/ */
function getConnectorLogoSrc(providerId: string, name: string): string | null {
 const key = (providerId || name).toLowerCase().trim();

 if (key.includes("github")) return "/connector-icons/github-actions.svg";
 if (key.includes("gitlab")) return "/connector-icons/gitlab.svg";
 if (key.includes("vscode") || key.includes("vs code")) return "/connector-icons/vscode.png";
 if (key.includes("sentry")) return "/connector-icons/sentry.svg";
 if (key.includes("slack")) return "/connector-icons/slack.svg";
 if (key.includes("linear")) return "/connector-icons/linear.svg";
 if (key.includes("notion")) return "/connector-icons/notion.svg";
 if (key.includes("netlify")) return "/connector-icons/netlify.svg";
 if (key.includes("datadog")) return "/connector-icons/datadog.svg";
 if (key.includes("posthog")) return "/connector-icons/posthog.svg";
 if (key.includes("figma")) return "/connector-icons/figma.svg";
 if (key.includes("hubspot")) return "/connector-icons/hubspot.svg";
 if (key.includes("intercom")) return "/connector-icons/intercom.svg";
 if (key.includes("zendesk")) return "/connector-icons/zendesk.svg";
 if (key.includes("cursor")) return "/connector-icons/cursor.ico";
 if (key.includes("claude") || key.includes("anthropic")) return "/connector-icons/claude.svg";
 if (key.includes("chatgpt") || key.includes("codex") || key.includes("openai")) return "/connector-icons/chatgpt.svg";
 if (key.includes("confluence") || key.includes("jira") || key.includes("atlassian")) return "/connector-icons/confluence.svg";
 if (key.includes("circleci")) return "/connector-icons/circleci.svg";
 if (key.includes("aws")) return "/connector-icons/aws.ico";
 if (key.includes("gcp") || key.includes("google")) return "/connector-icons/gcp.svg";
 if (key.includes("azure")) return "/connector-icons/azure.ico";
 if (key.includes("cloudflare")) return "/connector-icons/cloudflare.svg";
 if (key.includes("docker")) return "/connector-icons/docker.svg";
 if (key.includes("kubernetes")) return "/connector-icons/kubernetes.svg";
 if (key.includes("pagerduty")) return "/connector-icons/pagerduty.svg";
 if (key.includes("supabase")) return "/connector-icons/supabase.svg";
 if (key.includes("vercel")) return "/connector-icons/vercel.svg";
 if (key.includes("browser")) return "/connector-icons/framer.svg";

 return null;
}

function ProviderLogo({ providerId, name }: { providerId: string; name: string }) {
 const logoSrc = getConnectorLogoSrc(providerId, name);

 if (logoSrc) {
 return (
 <Image
 src={logoSrc}
 alt={name}
 width={16}
 height={16}
 className="size-4 object-contain shrink-0"
 onError={(e) => {
 e.currentTarget.style.display = "none";
 }}
 />
 );
 }

 return (
 <div className="size-4 rounded bg-muted flex items-center justify-center font-bold text-[10px] text-foreground uppercase shrink-0">
 {name.charAt(0)}
 </div>
 );
}

function formatTimestamp(value?: string | null): string {
 if (!value) return "Never";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return value;
 return parsed.toLocaleString();
}

function normalizeIntegrationStatus(value?: string | null): CompanySource["status"] {
 const status = (value ?? "not_connected").toLowerCase();
 if (["connected", "active", "authorized", "success"].includes(status)) return "connected";
 if (["syncing", "pending"].includes(status)) return "syncing";
 if (status === "synced") return "synced";
 if (["error", "failed"].includes(status)) return "error";
 return ["not_connected", "disconnected"].includes(status)
  ? status as CompanySource["status"]
  : "not_connected";
}

const SOURCE_CARDS = [
 {
 id: "github",
 title: "GitHub",
 suffix: "github-code-signals",
 providerTag: "github",
 typeTag: "Repositories & PRs",
 tag1: "Code Evidence",
 tag2: "First-party",
 description: "Repositories, pull requests, and code signals used as evidence.",
 },
 {
 id: "slack",
 title: "Slack",
 suffix: "slack-channel-feed",
 providerTag: "slack",
 typeTag: "Messages & Approvals",
 tag1: "Operational Context",
 tag2: "First-party",
 description: "Messages and approvals that capture operational context.",
 },
 {
 id: "linear",
 title: "Linear",
 suffix: "linear-issue-stream",
 providerTag: "linear",
 typeTag: "Issue Milestones",
 tag1: "Mission Flow",
 tag2: "First-party",
 description: "Issue state and project progress flowing into missions.",
 },
 {
 id: "browser",
 title: "Browser",
 suffix: "browser-capture",
 providerTag: "memoryos",
 typeTag: "Web Captures",
 tag1: "Screenshot Proof",
 tag2: "Native",
 description: "Web captures and screenshots used for verification.",
 },
] as const;

export function IntegrationsDataSources({ onViewDetail }: { onViewDetail: (id: string) => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveHorosWorkspaceId());
 const [companySources, setCompanySources] = useState<CompanySource[]>([]);
 const [sourceProviders, setSourceProviders] = useState<SourceProvider[]>([]);
 const [healthCounts, setHealthCounts] = useState<Record<string, number> | null>(null);
 const [loading, setLoading] = useState(true);
 const [connectingType, setConnectingType] = useState<string | null>(null);
 const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
 const [syncingId, setSyncingId] = useState<string | null>(null);
 const [refreshTick, setRefreshTick] = useState(0);
 const [error, setError] = useState<string | null>(null);

 /* Search & Filter States */
 const [searchQuery, setSearchQuery] = useState<string>("");
 const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

 const [selectedSourceType, setSelectedSourceType] = useState<string>("All");
 const [selectedStatus, setSelectedStatus] = useState<string>("All");
 const [sortBy, setSortBy] = useState<string>("Date added");

 /* Internal Search inside Dropdown Popups */
 const [typeSearch, setTypeSearch] = useState<string>("");

 /* Click Outside Popover Listener */
 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 const target = e.target as HTMLElement;
 if (!target.closest("[data-filter-popover]")) {
 setActiveDropdown(null);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveHorosWorkspaceId());
 syncWorkspace();
 window.addEventListener("focus", syncWorkspace);
 window.addEventListener("storage", syncWorkspace);
 return () => {
 window.removeEventListener("focus", syncWorkspace);
 window.removeEventListener("storage", syncWorkspace);
 };
 }, []);

 const uniqueCompanySources = useMemo(
 () => dedupeCompanySourcesForDisplay(companySources),
 [companySources],
 );

 useEffect(() => {
 let canceled = false;

 async function load() {
 if (!workspaceId) {
 setCompanySources([]);
 setSourceProviders([]);
 setLoading(false);
 setError("Select a workspace to view data sources.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const [sourcesResult, providersResult, horosResult, connectorRows] = await Promise.all([
 listSources(),
 listSourceProviders(),
 listHorosIntegrations(workspaceId, { limit: 100 }),
  fetchConnectorList(),
 ]);
 const connectorByProvider = new Map(
  connectorRows.map((connector) => [connector.type.toLowerCase(), connector]),
 );
 const horosByProvider = new Map(
  (horosResult.integrations ?? []).map((integration) => {
   const liveConnector = connectorByProvider.get(integration.provider.toLowerCase());
   return [
    integration.provider.toLowerCase(),
    liveConnector ? { ...integration, status: liveConnector.status } : integration,
   ] as const;
  }),
 );
 const sourceByProvider = new Set((sourcesResult ?? []).map((source) => source.provider.toLowerCase()));
  const normalizedSources = (sourcesResult ?? []).map((source) => {
  const integration = horosByProvider.get(source.provider.toLowerCase());
  const liveConnector = connectorByProvider.get(source.provider.toLowerCase());
   return integration
   ? { ...source, status: normalizeIntegrationStatus(liveConnector?.status ?? integration.status), lastSyncedAt: integration.lastSyncAt ?? source.lastSyncedAt, itemCount: liveConnector?.sourceItemCount ?? source.itemCount, syncError: liveConnector?.lastFailureReason ?? null }
   : liveConnector
    ? { ...source, status: normalizeIntegrationStatus(liveConnector.status) }
   : source;
 });
 const missingHorosSources = (horosResult.integrations ?? [])
  .filter((integration) => !sourceByProvider.has(integration.provider.toLowerCase()))
  .map((integration) => ({
   id: integration.id,
   workspaceId,
   provider: integration.provider,
   providerName: integration.name,
   type: "external",
   status: normalizeIntegrationStatus(integration.status),
   permissions: {},
   lastSyncedAt: integration.lastSyncAt,
   createdAt: integration.createdAt ?? new Date().toISOString(),
   itemCount: 0,
   memoryCount: 0,
   health: null,
  } satisfies CompanySource));
 if (!canceled) {
 setCompanySources((current) =>
 mergeCompanySourcesWithSticky(workspaceId, [...normalizedSources, ...missingHorosSources], current),
 );
 setSourceProviders(providersResult ?? []);
 }
 } catch (loadError) {
 if (!canceled) {
 setCompanySources([]);
 setSourceProviders([]);
 setError(loadError instanceof Error ? loadError.message : "Failed to load data sources.");
 }
 } finally {
 if (!canceled) setLoading(false);
 }
 }

 void load();
 const handleConnectorResult = (event: MessageEvent) => {
  if (event.origin !== window.location.origin || event.data?.type !== "memoryos:connector-result") return;
  void load();
 };
 window.addEventListener("message", handleConnectorResult);
 const refreshTimer = window.setInterval(() => void load(), 5000);
 return () => {
 canceled = true;
 window.removeEventListener("message", handleConnectorResult);
 window.clearInterval(refreshTimer);
 };
 }, [workspaceId]);

 const handleConnect = useCallback(async (type: string) => {
 setConnectingType(type);
 setError(null);
 try {
 if (["github", "slack", "linear", "jira"].includes(type)) {
  await authorizeConnector(type);
  return;
 }
 const source = await connectSource(type);
 setCompanySources((current) =>
 mergeCompanySourcesWithSticky(workspaceId ?? "", [source], current),
 );
 if (workspaceId) {
 rememberStickyCompanySource(workspaceId, source);
 }
 } catch (connectError) {
 setError(connectError instanceof Error ? connectError.message : `Failed to connect ${type}.`);
 } finally {
 setConnectingType(null);
 }
 }, [workspaceId, refreshTick]);

 const handleDisconnect = useCallback(async (source: CompanySource) => {
 setDisconnectingId(source.id);
 setError(null);
 try {
 if (["github", "slack", "linear", "jira"].includes(source.provider)) {
  await disconnectConnector(source.provider);
  // OAuth connectors are also retained in the local sticky list so a
  // background refresh cannot resurrect a successfully disconnected card.
  if (workspaceId) {
   clearStickyCompanySource(workspaceId, source);
  }
  setCompanySources((current) => current.map((item) => item.id === source.id ? { ...item, status: "disconnected" } : item));
  // Re-read the canonical connector row so the UI cannot remain on a stale
  // connected status after the mutation completes.
  setRefreshTick((value) => value + 1);
  return;
 }
 const updated = await disconnectSource(source.id);
 if (workspaceId) {
 clearStickyCompanySource(workspaceId, updated);
 }
 setCompanySources((current) => current.map((item) => (item.id === updated.id ? updated : item)));
 } catch (disconnectError) {
 setError(disconnectError instanceof Error ? disconnectError.message : `Failed to disconnect ${source.providerName ?? source.provider ?? source.id}.`);
 } finally {
 setDisconnectingId(null);
 }
 }, [workspaceId]);

 const handleSync = useCallback(async (source: CompanySource) => {
  setSyncingId(source.id);
  setError(null);
  try {
   await syncConnector(source.provider);
   setRefreshTick((value) => value + 1);
  } catch (syncError) {
   setError(syncError instanceof Error ? syncError.message : `Failed to sync ${source.providerName ?? source.provider}.`);
  } finally {
   setSyncingId(null);
  }
 }, []);

 const rows = useMemo(() => {
 return [...uniqueCompanySources].sort((a, b) => (b.lastSyncedAt ?? b.createdAt ?? "").localeCompare(a.lastSyncedAt ?? a.createdAt ?? ""));
 }, [uniqueCompanySources]);

 useEffect(() => {
 const counts = {
 connected: uniqueCompanySources.filter((source) => isLiveCompanySource(source)).length,
 syncing: uniqueCompanySources.filter((source) => source.status === "syncing").length,
 synced: uniqueCompanySources.filter((source) => source.status === "synced").length,
 disconnected: uniqueCompanySources.filter((source) => ["not_connected", "disconnected"].includes(source.status)).length,
 error: uniqueCompanySources.filter((source) => source.status === "error").length,
 };

 const hasAnyHealth = Object.values(counts).some((value) => value > 0);
 setHealthCounts(hasAnyHealth ? counts : null);
 }, [uniqueCompanySources]);

 const sourceCards = useMemo(() => {
 if (sourceProviders.length > 0) {
 return sourceProviders.map((provider) => {
 const linked = findCompanySourceForProvider(uniqueCompanySources, provider.id, provider.name);
 const connected = Boolean(linked) && isLiveCompanySource(linked);

 return {
 id: provider.id,
 title: provider.name,
 suffix: `${provider.id}-source`,
 providerTag: provider.id,
 typeTag: provider.category || "Integration",
 tag1: connected ? "Connected" : provider.status === "available" ? "Available" : "Later",
 tag2: linked ? "Live" : provider.firstLaunch ? "First-party" : "Third-party",
 description: provider.description || "Seamlessly integrate with your workflow.",
 connected,
 };
 });
 }

 return SOURCE_CARDS.map((card) => {
 const linked = findCompanySourceForProvider(uniqueCompanySources, card.id, card.title);
 const connected = Boolean(linked) && isLiveCompanySource(linked);
 return {
 ...card,
 connected,
 tag1: connected ? "Connected" : card.tag1,
 tag2: connected ? "Live" : card.tag2,
 };
 });
 }, [uniqueCompanySources, sourceProviders]);

 const displayedHealthCounts = healthCounts;

 const filteredCards = useMemo(() => {
 return sourceCards.filter((card) => {
 const matchesSearch =
 !searchQuery.trim() ||
 card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 card.description.toLowerCase().includes(searchQuery.toLowerCase());

 const matchesType =
 selectedSourceType === "All" ||
 card.typeTag.toLowerCase().includes(selectedSourceType.toLowerCase());

 return matchesSearch && matchesType;
 });
 }, [searchQuery, selectedSourceType, sourceCards]);

 return (
 <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-[#FBFBFB] text-foreground font-sans flex flex-col">
 
 {/* Top Header */}
 <div className="mb-8">
 <div className="flex items-center gap-2.5 mb-1">
 <Database className="size-7 text-foreground" strokeWidth={1.5} />
 <h1 className="text-[32px] font-bold text-foreground tracking-tight">Data Sources</h1>
 </div>
 <p className="text-[15px] text-muted-foreground">Live source connections and evidence feeds used by missions.</p>
 </div>

 <div className="mb-8 rounded-md border border-border bg-card px-6 py-6 flex flex-wrap items-center justify-between gap-6">
 <div>
 <div className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[#2457ff] mb-1">Current connectors</div>
 <p className="text-[14px] text-muted-foreground">
 Live company source links feeding evidence and mission execution.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {uniqueCompanySources.filter((source) => isLiveCompanySource(source)).length > 0 ? (
 uniqueCompanySources
 .filter((source) => isLiveCompanySource(source))
 .slice(0, 5)
 .map((source) => (
 <span
 key={source.id.trim().toLowerCase()}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-[#1f2f57]"
 >
 <span className="size-2 rounded-full bg-emerald-500" />
 {source.providerName ?? source.provider}
 </span>
 ))
 ) : (
 <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground">
 No connectors linked yet
 </span>
 )}
 </div>
 </div>

 {/* Search & Dropdown Filter Header Bar (Crisp Line Borders & Rectangle Geometry) */}
 <div className="w-full mb-8 pb-6 border-b border-border flex flex-wrap items-center justify-between gap-3">
 
 {/* Left: Main Search Input Box */}
 <div className="relative flex-1 min-w-[260px] max-w-[420px]">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
 <input
 type="text"
 placeholder="Search data sources..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full h-9.5 pl-10 pr-4 bg-card border border-border rounded-md text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff]/20 shadow-xs transition-all"
 />
 {searchQuery && (
 <button
 onClick={() => setSearchQuery("")}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
 >
 <X className="size-3.5" />
 </button>
 )}
 </div>

 {/* Right: Dropdown Filter Buttons */}
 <div className="flex items-center gap-2 flex-wrap" data-filter-popover>
 
 {/* 1. Source Types Dropdown */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setActiveDropdown(activeDropdown === "types" ? null : "types")}
 className={cn(
 "h-9.5 px-3.5 bg-card border rounded-md text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-xs transition-all select-none",
 selectedSourceType !== "All" ? "border-[#0f52ff] bg-blue-50/40 text-[#0f52ff]" : "border-border"
 )}
 >
 <span>{selectedSourceType === "All" ? "Source Types" : selectedSourceType}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>

 {activeDropdown === "types" && (
 <div className="absolute right-0 top-11 z-50 w-[220px] bg-card border border-border rounded-md shadow-xl p-2.5 animate-in fade-in zoom-in-95">
 <input
 type="text"
 placeholder="Search type..."
 value={typeSearch}
 onChange={(e) => setTypeSearch(e.target.value)}
 className="w-full h-8 px-3 mb-2 bg-card border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#0f52ff]"
 />
 <div className="max-h-[180px] overflow-y-auto space-y-0.5 custom-scrollbar">
 {["All", "Repositories", "Messages", "Issue Sync", "Web Captures"]
 .filter((t) => t.toLowerCase().includes(typeSearch.toLowerCase()))
 .map((t) => (
 <button
 key={t}
 onClick={() => {
 setSelectedSourceType(t);
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors block",
 selectedSourceType === t ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 {t === "All" ? "All Source Types" : t}
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* 2. Status Dropdown */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setActiveDropdown(activeDropdown === "status" ? null : "status")}
 className={cn(
 "h-9.5 px-3.5 bg-card border rounded-md text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-xs transition-all select-none",
 selectedStatus !== "All" ? "border-[#0f52ff] bg-blue-50/40 text-[#0f52ff]" : "border-border"
 )}
 >
 <span>{selectedStatus === "All" ? "Status" : selectedStatus}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>

 {activeDropdown === "status" && (
 <div className="absolute right-0 top-11 z-50 w-[180px] bg-card border border-border rounded-md shadow-xl p-2.5 animate-in fade-in zoom-in-95">
 {["All", "Connected", "Not linked", "Active"].map((st) => (
 <button
 key={st}
 onClick={() => {
 setSelectedStatus(st);
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors block",
 selectedStatus === st ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 {st === "All" ? "All Statuses" : st}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* 3. Sort By Dropdown */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setActiveDropdown(activeDropdown === "sort" ? null : "sort")}
 className="h-9.5 px-3.5 bg-card border border-border rounded-md text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-xs transition-all select-none"
 >
 <span>{sortBy}</span>
 <ChevronsUpDown className="size-3.5 text-muted-foreground" />
 </button>

 {activeDropdown === "sort" && (
 <div className="absolute right-0 top-11 z-50 w-[180px] bg-card border border-border rounded-md shadow-xl p-2 animate-in fade-in zoom-in-95">
 {["Date added", "Name (A-Z)", "Status"].map((option) => (
 <button
 key={option}
 onClick={() => {
 setSortBy(option);
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors block",
 sortBy === option ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 {option}
 </button>
 ))}
 </div>
 )}
 </div>

 </div>
 </div>

 {/* Results Header Count */}
 <div className="mb-6 flex items-center justify-between">
 <p className="text-[14px] font-normal text-muted-foreground">
 We found <span className="font-semibold text-foreground">{filteredCards.length}</span> data sources
 </p>
 </div>

 {/* Error Banners */}
 {error && (
 <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 p-6 text-amber-800 text-sm flex items-center gap-3">
 <AlertTriangle className="size-5 text-amber-600 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {loading ? (
 <div className="w-full overflow-hidden rounded-md border border-border bg-card shadow-xs">
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Source</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Type</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Institution</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Status</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Last Sync</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e7]">
 <tr key="data-sources-loading">
 <td className="px-6 py-10 text-[14px] text-muted-foreground text-center" colSpan={5}>
 Loading data sources...
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 ) : (
 <>
 {/* Inventory Cards Grid (Line Borders & Rectangle Geometry) */}
 <div className="mb-10">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {filteredCards.map((source) => {
 const matchesSource = (item: CompanySource) =>
  item.provider.toLowerCase().includes(source.id) ||
  item.type.toLowerCase().includes(source.id) ||
  (item.providerName ?? "").toLowerCase() === source.title.toLowerCase();
 const row = rows.find((item) => matchesSource(item) && isLiveCompanySource(item)) ?? rows.find(matchesSource);
 const connected = Boolean(row && isLiveCompanySource(row));
 const statusLabel = row?.status === "syncing"
  ? "Syncing"
  : row?.status === "error"
    ? "Connection error"
    : connected
      ? "Connected"
      : "Not connected";
 const isConnecting = connectingType === source.id;
 const isDisconnecting = Boolean(row && disconnectingId === row.id);
 const isSyncing = Boolean(row && syncingId === row.id);

 return (
 <div
 key={source.id}
 className="bg-card border border-border hover:border-[#c5c5cf] hover:bg-card rounded-md transition-all duration-200 ease-out shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] group flex flex-col justify-between overflow-hidden"
 >
 <div className="p-6">
 {/* Top Logo & Title Row */}
 <div className="flex items-center gap-3 mb-3">
 <div className="size-9 rounded-md bg-card border border-border flex items-center justify-center shrink-0 shadow-xs group-hover:bg-card transition-colors overflow-hidden">
 <ProviderLogo providerId={source.id} name={source.title} />
 </div>
 <span className="font-semibold text-[16px] text-foreground tracking-tight truncate">
 {source.title}
 </span>
 </div>

 {/* Provider & Type Pill Row */}
 <div className="flex items-center gap-2 mb-3 flex-wrap">
 <span className="font-medium text-[13.5px] text-foreground">
 {source.providerTag}
 </span>
 <span className="inline-flex items-center rounded-full bg-card border border-border px-3 py-0.5 text-[12px] font-medium text-foreground/90">
 {source.typeTag}
 </span>
 </div>

 {/* Description */}
 <p className="text-[13.5px] leading-relaxed text-muted-foreground font-normal min-h-[42px]">
 {source.description}
 </p>

 {/* Tag Badges */}
 <div className="flex items-center gap-2 mt-4 flex-wrap">
 <span className="inline-flex items-center rounded-full bg-[#eaeaea] text-foreground/90 px-3 py-0.5 text-[12px] font-medium">
 {source.tag1}
 </span>
 <span className="inline-flex items-center rounded-full bg-[#eaeaea] text-foreground/90 px-3 py-0.5 text-[12px] font-medium">
 {source.tag2}
 </span>
 </div>
 </div>

 {/* Card Footer Row (Turns Light Grey on Hover) */}
 <div className="border-t border-[#f0f0f2] bg-card group-hover:bg-card px-6 py-3 transition-colors flex items-center justify-between">
 <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
 {connected ? (
 <span className="text-emerald-700 flex items-center gap-1 font-semibold">
 <Check className="size-3.5" /> {statusLabel}
 </span>
 ) : (
 <span className={row?.status === "error" ? "text-red-700" : "text-muted-foreground"}>{statusLabel}</span>
 )}
 {row && typeof row.itemCount === "number" ? (
  <span className="text-[11px] text-muted-foreground">
   {row.itemCount} provider record{row.itemCount === 1 ? "" : "s"} read
  </span>
 ) : null}
 </div>
 {row?.syncError ? (
  <p className="mt-2 text-[11px] leading-4 text-red-700" title={row.syncError}>
   Sync issue: {row.syncError}
  </p>
 ) : null}

 {/* Action Button */}
 <div className="flex items-center gap-2">
 {connected ? (
 <>
 <button
 type="button"
 onClick={() => row && onViewDetail(row.id)}
 className="inline-flex items-center gap-1.5 px-3 h-7.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-semibold hover:bg-emerald-100 transition-all"
 >
 <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Open
 </button>
 {row && ["github", "slack", "linear", "jira"].includes(row.provider) ? (
  <button
   type="button"
   onClick={() => void handleSync(row)}
   disabled={syncingId !== null || disconnectingId !== null}
   className="inline-flex items-center gap-1.5 px-3 h-7.5 rounded-md border border-border text-foreground text-[12px] font-semibold hover:bg-accent transition-all disabled:opacity-60"
  >
   <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
   {isSyncing ? "Syncing..." : "Sync"}
  </button>
 ) : null}
 {row ? (
 <button
 type="button"
 onClick={() => void handleDisconnect(row)}
 disabled={disconnectingId !== null}
 className="inline-flex items-center gap-1.5 px-3 h-7.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[12px] font-semibold hover:bg-red-100 transition-all disabled:opacity-60"
 >
 <X className="size-3.5" />
 {isDisconnecting ? "Disconnecting..." : "Disconnect"}
 </button>
 ) : null}
 </>
 ) : (
 <button
 type="button"
 onClick={() => void handleConnect(source.id)}
 disabled={connectingType !== null}
 className="btn-glossy-blue px-3.5 h-7.5 text-[12px] font-medium gap-1 disabled:opacity-60"
 >
 <Plus className="size-3.5" />
 {isConnecting ? "Connecting..." : row?.status === "error" ? "Reconnect" : "Connect"}
 </button>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Connector Health Banner */}
 {displayedHealthCounts ? (
 <div className="bg-blue-50/60 border border-blue-200/80 rounded-md p-6 mb-8 flex items-start gap-3 shadow-xs">
 <div className="size-5 rounded-full bg-blue-600 text-[#F0EFE2] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">i</div>
 <div className="text-[14px] text-blue-900 leading-relaxed">
 <strong className="font-semibold">Connector health</strong>
 <p className="mt-0.5 text-blue-800 text-[13.5px]">
 {Object.entries(displayedHealthCounts).map(([key, value]) => `${key}: ${value}`).join(" • ") || "No health counts returned."}
 </p>
 </div>
 </div>
 ) : null}

 {/* Data Sources Table (Line Border & White Theme) */}
 <div className="w-full overflow-hidden rounded-md border border-border bg-card shadow-xs">
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Source</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Type</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Institution</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Status</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Last Sync</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e7]">
 {rows.length === 0 ? (
 <tr>
 <td className="px-6 py-8 text-[14px] text-muted-foreground text-center" colSpan={5}>
 No data source connections yet.
 </td>
 </tr>
 ) : (
 rows.map((source) => (
 <tr
 key={source.id.trim().toLowerCase()}
 className="hover:bg-card transition-colors group cursor-pointer"
 onClick={() => onViewDetail(source.id)}
 >
 <td className="px-6 py-6">
 <div className="flex items-center gap-3">
 <ProviderLogo providerId={source.provider} name={source.providerName ?? source.provider} />
 <span className="font-semibold text-[14px] text-foreground group-hover:text-[#0f52ff] transition-colors">{source.providerName ?? source.provider}</span>
 </div>
 </td>
 <td className="px-6 py-6">
 <span className="text-[13px] font-medium text-muted-foreground">{source.category ?? source.provider}</span>
 </td>
 <td className="px-6 py-6">
 <span className="text-[13px] text-foreground/90 font-medium bg-muted px-2.5 py-1 rounded-md">{source.workspaceId ?? "Global"}</span>
 </td>
 <td className="px-6 py-6">
 <span className={cn(
 "inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold",
 (source.status ?? "").toLowerCase() === "connected"
 ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
 : "bg-muted text-muted-foreground border border-border",
 )}>
 {source.status ?? "Unknown"}
 </span>
 </td>
 <td className="px-6 py-6">
 <span className="text-[13px] font-medium text-muted-foreground">{formatTimestamp(source.lastSyncedAt ?? source.createdAt)}</span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </>
 )}
 </div>
 );
}
