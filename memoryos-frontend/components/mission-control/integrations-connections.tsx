"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 Search,
 AlertTriangle,
 Plus,
 Check,
 Blocks,
 ChevronDown,
 ChevronsUpDown,
 X,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MemoryOSIcon } from "@/components/landing/memoryos-icon";
import {
 listDhyraIntegrations,
 readActiveDhyraWorkspaceId,
 type DhyraIntegrationConnection,
} from "@/lib/dhyra-api";
import { authorizeConnector, disconnectConnector } from "@/lib/continuity-lab/connector-actions";
import { fetchConnectorList } from "@/lib/continuity-lab/connector-list";
import {
 connectSource,
 disconnectSource,
 findCompanySourceForProvider,
 isLiveCompanySource,
 listSourceProviders,
 listSources,
 dedupeCompanySourcesForDisplay,
 type CompanySource,
 type SourceProvider,
} from "@/lib/company-sources-api";

function normalizeConnectionStatus(value?: string | null): CompanySource["status"] {
 const status = (value ?? "not_connected").toLowerCase();
 if (["connected", "active", "authorized", "success"].includes(status)) return "connected";
 if (["syncing", "pending"].includes(status)) return "syncing";
 if (status === "synced") return "synced";
 if (["error", "failed"].includes(status)) return "error";
 return ["not_connected", "disconnected"].includes(status)
  ? status as CompanySource["status"]
  : "not_connected";
}

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
 if (key.includes("asana")) return "/connector-icons/asana.svg";
 if (key.includes("bitbucket")) return "/connector-icons/bitbucket.svg";
 if (key.includes("discord")) return "/connector-icons/discord.svg";
 if (key.includes("dropbox")) return "/connector-icons/dropbox.svg";
 if (key.includes("freshdesk")) return "/connector-icons/freshdesk.png";
 if (key.includes("framer")) return "/connector-icons/framer.svg";
 if (key.includes("grafana")) return "/connector-icons/grafana.svg";
 if (key.includes("jenkins")) return "/connector-icons/jenkins.svg";
 if (key.includes("mixpanel")) return "/connector-icons/mixpanel.svg";
 if (key.includes("new-relic") || key.includes("newrelic")) return "/connector-icons/new-relic.svg";
 if (key.includes("okta")) return "/connector-icons/okta.svg";
 if (key.includes("onepassword") || key.includes("1password")) return "/connector-icons/onepassword.svg";
 if (key.includes("planetscale")) return "/connector-icons/planetscale.svg";
 if (key.includes("prometheus")) return "/connector-icons/prometheus.svg";
 if (key.includes("railway")) return "/connector-icons/railway.svg";
 if (key.includes("render")) return "/connector-icons/render.svg";
 if (key.includes("salesforce")) return "/connector-icons/salesforce.ico";
 if (key.includes("snyk")) return "/connector-icons/snyk.svg";
 if (key.includes("trello")) return "/connector-icons/trello.svg";
 if (key.includes("windsurf")) return "/connector-icons/windsurf.ico";
 if (key.includes("zoom")) return "/connector-icons/zoom.svg";
 if (key.includes("raycast")) return "/connector-icons/cline.png";
 if (key.includes("incident")) return "/connector-icons/opsgenie.ico";
 if (key.includes("retool")) return "/connector-icons/box.svg";

 return null;
}

/* Provider Logomark renderer using public/connector-icons/ brand assets */
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

/* Static Catalog Items */
const ALL_CATALOG_ITEMS = [
 {
 id: "github",
 name: "GitHub",
 suffix: "github-256k",
 providerTag: "github",
 typeTag: "Pull Request & Code",
 tag1: "262,144 max context",
 tag2: "First-party",
 category: "Engineering",
 author: "GitHub",
 capability: "Reasoning",
 providerType: "First-party",
 description: "Import repositories, issues, pull requests, and engineering decisions.",
 starBadge: true,
 },
 {
 id: "gitlab",
 name: "GitLab",
 suffix: "gitlab-ci-256k",
 providerTag: "gitlab",
 typeTag: "Merge Request & CI",
 tag1: "262,144 max context",
 tag2: "First-party",
 category: "Engineering",
 author: "GitLab",
 capability: "Reasoning",
 providerType: "First-party",
 description: "Full source catalog connector. Roadmap until its sync adapter is enabled.",
 starBadge: true,
 },
 {
 id: "vscode",
 name: "VS Code",
 suffix: "vscode-extension",
 providerTag: "microsoft",
 typeTag: "IDE Extension",
 tag1: "128,000 max context",
 tag2: "Official",
 category: "Engineering",
 author: "Microsoft",
 capability: "Function calling",
 providerType: "First-party",
 description: "Easily build VS Code extensions with MemoryOS Connect.",
 starBadge: true,
 },
 {
 id: "sentry",
 name: "Sentry",
 suffix: "sentry-exception-log",
 providerTag: "sentry",
 typeTag: "Exception Tracking",
 tag1: "Error Traces",
 tag2: "Third-party",
 category: "Bug Tracking",
 author: "Sentry",
 capability: "Zero data retention",
 providerType: "Third-party",
 description: "Connect and sync this source into the MemoryOS company brain.",
 starBadge: true,
 },
 {
 id: "slack",
 name: "Slack",
 suffix: "slack-sync-v2",
 providerTag: "slack",
 typeTag: "Team Messaging",
 tag1: "Channel Sync",
 tag2: "First-party",
 category: "Collaboration",
 author: "Slack",
 capability: "Real-time",
 providerType: "First-party",
 description: "Connect and sync this source into the MemoryOS company brain.",
 starBadge: true,
 },
 {
 id: "linear",
 name: "Linear",
 suffix: "linear-connect",
 providerTag: "linear",
 typeTag: "Issue Sync",
 tag1: "Sprint Milestones",
 tag2: "First-party",
 category: "Engineering",
 author: "Linear",
 capability: "Reasoning",
 providerType: "First-party",
 description: "Connect and sync this source into the MemoryOS company brain.",
 starBadge: true,
 },
 {
 id: "notion",
 name: "Notion",
 suffix: "notion-workspace",
 providerTag: "notion",
 typeTag: "Knowledge Base",
 tag1: "Wiki Import",
 tag2: "First-party",
 category: "Docs & Memory",
 author: "Notion",
 capability: "Vision",
 providerType: "First-party",
 description: "Import company documentation, product specs, and wiki knowledge bases.",
 },
 {
 id: "jira",
 name: "Jira",
 suffix: "jira-software",
 providerTag: "atlassian",
 typeTag: "Project Management",
 tag1: "Sprint Epics",
 tag2: "Third-party",
 category: "Engineering",
 author: "Atlassian",
 capability: "Partner",
 providerType: "Third-party",
 description: "Connect Jira project management, sprint epics, and engineering tasks.",
 },
 {
 id: "datadog",
 name: "Datadog",
 suffix: "datadog-observability",
 providerTag: "datadog",
 typeTag: "Metrics & Logs",
 tag1: "Real-time Metrics",
 tag2: "Third-party",
 category: "Analytics",
 author: "Datadog",
 capability: "Real-time",
 providerType: "Third-party",
 description: "Monitor application performance, RUM traces, and operational metrics.",
 },
 {
 id: "posthog",
 name: "PostHog",
 suffix: "posthog-analytics",
 providerTag: "posthog",
 typeTag: "Product Analytics",
 tag1: "Session Replays",
 tag2: "Third-party",
 category: "Analytics",
 author: "PostHog",
 capability: "Batch",
 providerType: "Third-party",
 description: "Analyze product usage, user funnels, feature flags, and session recordings.",
 },
 {
 id: "figma",
 name: "Figma",
 suffix: "figma-design-tokens",
 providerTag: "figma",
 typeTag: "UI/UX Design",
 tag1: "Design Specs",
 tag2: "Third-party",
 category: "Media & Design",
 author: "Figma",
 capability: "Vision",
 providerType: "Third-party",
 description: "Connect Figma design specs, component tokens, and prototype feedback.",
 },
 {
 id: "hubspot",
 name: "HubSpot",
 suffix: "hubspot-crm",
 providerTag: "hubspot",
 typeTag: "CRM & Sales",
 tag1: "Customer Records",
 tag2: "Third-party",
 category: "Customer Experience",
 author: "HubSpot",
 capability: "Partner",
 providerType: "Third-party",
 description: "Sync customer deals, sales conversations, and CRM contact timelines.",
 },
 {
 id: "intercom",
 name: "Intercom",
 suffix: "intercom-support",
 providerTag: "intercom",
 typeTag: "Customer Support",
 tag1: "Support Chats",
 tag2: "Third-party",
 category: "Customer Experience",
 author: "Intercom",
 capability: "Real-time",
 providerType: "Third-party",
 description: "Import customer support conversations, ticket resolutions, and user feedback.",
 },
 {
 id: "zendesk",
 name: "Zendesk",
 suffix: "zendesk-tickets",
 providerTag: "zendesk",
 typeTag: "Helpdesk",
 tag1: "Ticket History",
 tag2: "Third-party",
 category: "Customer Experience",
 author: "Zendesk",
 capability: "Batch",
 providerType: "Third-party",
 description: "Sync helpdesk tickets, knowledge base articles, and customer resolution data.",
 },
 {
 id: "netlify",
 name: "Netlify",
 suffix: "netlify-deploys",
 providerTag: "netlify",
 typeTag: "Web Deployments",
 tag1: "Preview Builds",
 tag2: "Third-party",
 category: "Engineering",
 author: "Netlify",
 capability: "Cloudflare-hosted",
 providerType: "Third-party",
 description: "Share, review, and manage feedback on web preview deployments.",
 },
 {
 id: "retool",
 name: "Retool",
 suffix: "retool-internal",
 providerTag: "retool",
 typeTag: "Internal Tooling",
 tag1: "Custom Admin UI",
 tag2: "Third-party",
 category: "Engineering",
 author: "Retool",
 capability: "Function calling",
 providerType: "Third-party",
 description: "Create, update, and analyze memory issues in custom internal admin tools.",
 },
 {
 id: "raycast",
 name: "Raycast",
 suffix: "raycast-extension",
 providerTag: "raycast",
 typeTag: "Mac Workflow",
 tag1: "Global Shortcut",
 tag2: "Third-party",
 category: "Engineering",
 author: "Raycast",
 capability: "Function calling",
 providerType: "Third-party",
 description: "Create, search, and modify your company memory & issues from anywhere on your Mac.",
 },
 {
 id: "incident",
 name: "incident.io",
 suffix: "incident-manager",
 providerTag: "incidentio",
 typeTag: "Incident Management",
 tag1: "Real-time Slack",
 tag2: "Third-party",
 category: "Engineering",
 author: "incident.io",
 capability: "Real-time",
 providerType: "Third-party",
 description: "Manage and respond to incidents directly in Slack and Mission Control.",
 },
];

/* Authors list with company icons */
const AUTHORS_LIST = [
 { id: "Anthropic", name: "Anthropic", iconKey: "claude" },
 { id: "AssemblyAI", name: "AssemblyAI", iconKey: "assembly" },
 { id: "Atlassian", name: "Atlassian", iconKey: "jira" },
 { id: "DeepSeek", name: "DeepSeek", iconKey: "deepseek" },
 { id: "ElevenLabs", name: "ElevenLabs", iconKey: "eleven" },
 { id: "Figma", name: "Figma", iconKey: "figma" },
 { id: "GitHub", name: "GitHub", iconKey: "github" },
 { id: "GitLab", name: "GitLab", iconKey: "gitlab" },
 { id: "Google", name: "Google", iconKey: "gcp" },
 { id: "Linear", name: "Linear", iconKey: "linear" },
 { id: "Microsoft", name: "Microsoft", iconKey: "vscode" },
 { id: "Notion", name: "Notion", iconKey: "notion" },
 { id: "OpenAI", name: "OpenAI", iconKey: "chatgpt" },
 { id: "Slack", name: "Slack", iconKey: "slack" },
 { id: "Thinking Machines", name: "thinkingmachines", iconKey: "thinking" },
];

export function IntegrationsConnections({ onViewDetail }: { onViewDetail: (id: string) => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId());
 const [connections, setConnections] = useState<DhyraIntegrationConnection[]>([]);
 const [sourceProviders, setSourceProviders] = useState<SourceProvider[]>([]);
 const [companySources, setCompanySources] = useState<CompanySource[]>([]);
 const [connectingType, setConnectingType] = useState<string | null>(null);
 const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
 const [refreshTick, setRefreshTick] = useState(0);
 const [error, setError] = useState<string | null>(null);

 /* Search & Dropdown Filter States */
 const [searchQuery, setSearchQuery] = useState<string>("");
 const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

 const [selectedTaskType, setSelectedTaskType] = useState<string>("All");
 const [selectedCapability, setSelectedCapability] = useState<string>("All");
 const [selectedAuthor, setSelectedAuthor] = useState<string>("All");
 const [selectedProvider, setSelectedProvider] = useState<string>("All");
 const [sortBy, setSortBy] = useState<string>("Date added");

 /* Internal Search inside Dropdown Popups */
 const [taskTypeSearch, setTaskTypeSearch] = useState<string>("");
 const [capabilitySearch, setCapabilitySearch] = useState<string>("");
 const [authorSearch, setAuthorSearch] = useState<string>("");
 const [providerSearch, setProviderSearch] = useState<string>("");

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
 const syncWorkspace = () => setWorkspaceId(readActiveDhyraWorkspaceId());
 syncWorkspace();
 window.addEventListener("focus", syncWorkspace);
 window.addEventListener("storage", syncWorkspace);
 return () => {
 window.removeEventListener("focus", syncWorkspace);
 window.removeEventListener("storage", syncWorkspace);
 };
 }, []);

 useEffect(() => {
 let canceled = false;

 async function load() {
 if (!workspaceId) {
 setConnections([]);
 setSourceProviders([]);
 setCompanySources([]);
 setError("Select a workspace to view integrations.");
 return;
 }

 setError(null);
 try {
 const [listResult, providerResult, sourcesResult, connectorRows] = await Promise.all([
  listDhyraIntegrations(workspaceId, { limit: 100 }),
  listSourceProviders(),
  listSources(),
  fetchConnectorList(),
 ]);
 if (!canceled) {
  const connectorByProvider = new Map(
   connectorRows.map((connector) => [connector.type.toLowerCase(), connector]),
  );
  const dhyraIntegrations = (listResult.integrations ?? []).map((integration) => {
   const liveConnector = connectorByProvider.get(integration.provider.toLowerCase());
   return liveConnector ? { ...integration, status: liveConnector.status } : integration;
  });
 const byProvider = new Map(dhyraIntegrations.map((integration) => [integration.provider.toLowerCase(), integration]));
 const sourceProvidersByName = new Set((sourcesResult ?? []).map((source) => source.provider.toLowerCase()));
  const normalizedSources = (sourcesResult ?? []).map((source) => {
   const integration = byProvider.get(source.provider.toLowerCase());
   const liveConnector = connectorByProvider.get(source.provider.toLowerCase());
   return integration
    ? { ...source, status: normalizeConnectionStatus(liveConnector?.status ?? integration.status), lastSyncedAt: integration.lastSyncAt ?? source.lastSyncedAt }
    : liveConnector
     ? { ...source, status: normalizeConnectionStatus(liveConnector.status) }
    : source;
  });
 const missingSources = dhyraIntegrations
  .filter((integration) => !sourceProvidersByName.has(integration.provider.toLowerCase()))
  .map((integration) => ({
   id: integration.id,
   workspaceId,
   provider: integration.provider,
   providerName: integration.name,
   type: "external",
   status: normalizeConnectionStatus(integration.status),
   permissions: {},
   lastSyncedAt: integration.lastSyncAt,
   createdAt: integration.createdAt ?? new Date().toISOString(),
   itemCount: 0,
   memoryCount: 0,
   health: null,
  } satisfies CompanySource));
 setConnections(dhyraIntegrations);
 setSourceProviders(providerResult ?? []);
 setCompanySources([...normalizedSources, ...missingSources]);
 }
 } catch (loadError) {
 if (!canceled) {
 setConnections([]);
 setSourceProviders([]);
 setCompanySources([]);
 setError(loadError instanceof Error ? loadError.message : "Failed to load integrations.");
 }
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
 }, [workspaceId, refreshTick]);

 const handleConnect = useCallback(async (type: string) => {
 setConnectingType(type);
 setError(null);
 try {
 if (["github", "slack", "linear", "jira"].includes(type)) {
  await authorizeConnector(type);
  return;
 }
 const source = await connectSource(type);
 setCompanySources((current) => [source, ...current.filter((item) => item.id !== source.id)]);
 setRefreshTick((value) => value + 1);
 } catch (connectError) {
 setError(connectError instanceof Error ? connectError.message : `Failed to connect ${type}.`);
 } finally {
 setConnectingType(null);
 }
 }, [workspaceId]);

 const handleDisconnect = useCallback(async (source: CompanySource) => {
 setDisconnectingId(source.id);
 setError(null);
 try {
 if (["github", "slack", "linear", "jira"].includes(source.provider)) {
  await disconnectConnector(source.provider);
  setRefreshTick((value) => value + 1);
  return;
 }
 const updated = await disconnectSource(source.id);
 setCompanySources((current) => current.map((item) => (item.id === updated.id ? updated : item)));
 setRefreshTick((value) => value + 1);
 } catch (disconnectError) {
 setError(disconnectError instanceof Error ? disconnectError.message : `Failed to disconnect ${source.providerName ?? source.provider ?? source.id}.`);
 } finally {
 setDisconnectingId(null);
 }
 }, [workspaceId]);

 /* Merge API catalog + static catalog items */
 const cardList = useMemo(() => {
 type CatalogCard = {
 id: string;
 name: string;
 suffix: string;
 providerTag: string;
 typeTag: string;
 tag1: string;
 tag2: string;
 category: string;
 author: string;
 capability: string;
 providerType: string;
 description: string;
 starBadge?: boolean;
 connected?: boolean;
 status?: string;
 linked?: CompanySource | null;
 dhyraCount: number;
 };
 const mergedMap = new Map<string, CatalogCard>();

 ALL_CATALOG_ITEMS.forEach((item) => {
  const linked = findCompanySourceForProvider(companySources, item.id, item.name);
  const dhyraConnections = connections.filter((c) =>
   c.provider.toLowerCase().includes(item.id)
  );
  const isConnected = Boolean(linked && isLiveCompanySource(linked));

 mergedMap.set(item.id, {
 ...item,
 connected: isConnected,
 status: linked?.status ?? (isConnected ? "Connected" : "Available"),
 linked,
 dhyraCount: dhyraConnections.length,
 });
 });

sourceProviders.forEach((provider) => {
 const key = provider.id.toLowerCase();
 const existing = mergedMap.get(key);
 const linked = findCompanySourceForProvider(companySources, provider.id, provider.name);
 const isConnected = Boolean(linked && isLiveCompanySource(linked));

 if (existing) {
 mergedMap.set(key, {
  ...existing,
  name: provider.name || existing.name,
  description: provider.description || existing.description,
  category: provider.category || existing.category,
  connected: isConnected,
  linked: linked ?? null,
 });
 } else {
 mergedMap.set(key, {
 id: provider.id,
 name: provider.name,
 suffix: `${provider.id}-connection`,
 providerTag: provider.id,
 typeTag: provider.category || "Integration",
 tag1: "Available",
 tag2: "Third-party",
 category: provider.category || "Engineering",
 author: provider.name,
 capability: "Reasoning",
 providerType: "Third-party",
 description: provider.description || "Seamlessly integrate with your workflow.",
 connected: isConnected,
 linked: linked ?? null,
 dhyraCount: 0,
 });
 }
 });

 return Array.from(mergedMap.values());
 }, [companySources, connections, sourceProviders]);

 const connectedSources = useMemo(
  () => dedupeCompanySourcesForDisplay(companySources).filter((source) => isLiveCompanySource(source)),
  [companySources],
 );

 /* Live Counts for Dropdown Items */
 const taskTypeCounts = useMemo(() => {
 const counts: Record<string, number> = {};
 cardList.forEach((c) => {
 const cat = c.category || "Engineering";
 counts[cat] = (counts[cat] || 0) + 1;
 });
 return counts;
 }, [cardList]);

 /* Filter & Sort logic */
 const filteredCards = useMemo(() => {
 const result = cardList.filter((card) => {
 const matchesSearch =
 !searchQuery.trim() ||
 card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
 card.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
 card.author?.toLowerCase().includes(searchQuery.toLowerCase());

 const matchesTaskType =
 selectedTaskType === "All" ||
 card.category.toLowerCase() === selectedTaskType.toLowerCase();

 const matchesCapability =
 selectedCapability === "All" ||
 card.capability?.toLowerCase() === selectedCapability.toLowerCase() ||
 (selectedCapability === "Connected" && card.connected);

 const matchesAuthor =
 selectedAuthor === "All" ||
 card.author?.toLowerCase().includes(selectedAuthor.toLowerCase()) ||
 card.name.toLowerCase().includes(selectedAuthor.toLowerCase());

 const matchesProvider =
 selectedProvider === "All" ||
 card.providerType?.toLowerCase() === selectedProvider.toLowerCase();

 return matchesSearch && matchesTaskType && matchesCapability && matchesAuthor && matchesProvider;
 });

 if (sortBy === "Name (A-Z)") {
 result.sort((a, b) => a.name.localeCompare(b.name));
 } else if (sortBy === "Most connected") {
 result.sort((a, b) => (b.connected ? 1 : 0) - (a.connected ? 1 : 0));
 }

 return result;
 }, [cardList, searchQuery, selectedTaskType, selectedCapability, selectedAuthor, selectedProvider, sortBy]);

return (
 <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-[#FBFBFB] text-foreground font-sans flex flex-col">
 <div className="mb-8 flex items-center justify-between gap-4 border-b border-border pb-5">
 <div className="flex items-center gap-3">
 <div className="size-10 rounded-md border border-border bg-card flex items-center justify-center overflow-hidden">
 <MemoryOSIcon className="size-7 text-foreground" />
 </div>
 <div className="flex flex-col">
 <div className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[#2457ff]">MemoryOS</div>
 <div className="text-[22px] font-bold tracking-tight text-foreground">Connections</div>
 </div>
 </div>
 <div className="text-[13px] text-muted-foreground max-w-xl text-right">
 Connect and disconnect real systems so the graph reflects live backend state, not just a catalog of vendors.
 </div>
 </div>
 
 {/* Search & Dropdown Filter Header Bar (Rectangle Line Borders - Not Full Rounded Pills) */}
 <div className="w-full mb-8 pb-6 border-b border-border flex flex-wrap items-center justify-between gap-3">
 
 {/* Left: Main Search Input Box (Rectangle Line Border) */}
 <div className="relative flex-1 min-w-[260px] max-w-[420px]">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
 <input
 type="text"
 placeholder="Search..."
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

 {/* Right: Dropdown Filter Buttons (Line Borders & Rectangle Corners) */}
 <div className="flex items-center gap-2 flex-wrap" data-filter-popover>
 
 {/* 1. Task Types Dropdown */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setActiveDropdown(activeDropdown === "taskTypes" ? null : "taskTypes")}
 className={cn(
 "h-9.5 px-3.5 bg-card border rounded-md text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-xs transition-all select-none",
 selectedTaskType !== "All" ? "border-[#0f52ff] bg-blue-50/40 text-[#0f52ff]" : "border-border"
 )}
 >
 <span>{selectedTaskType === "All" ? "Task Types" : selectedTaskType}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>

 {activeDropdown === "taskTypes" && (
 <div className="absolute right-0 top-11 z-50 w-[240px] bg-card border border-border rounded-md shadow-xl p-2.5 animate-in fade-in zoom-in-95">
 <input
 type="text"
 placeholder="Search..."
 value={taskTypeSearch}
 onChange={(e) => setTaskTypeSearch(e.target.value)}
 className="w-full h-8 px-3 mb-2 bg-card border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#0f52ff]"
 />
 <div className="max-h-[220px] overflow-y-auto space-y-0.5 custom-scrollbar">
 <button
 onClick={() => {
 setSelectedTaskType("All");
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors",
 selectedTaskType === "All" ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 <span>All Task Types</span>
 <span className="text-muted-foreground text-[11px] font-mono">{cardList.length}</span>
 </button>
 {[
 { label: "Engineering", count: taskTypeCounts["Engineering"] || 8 },
 { label: "Analytics", count: taskTypeCounts["Analytics"] || 4 },
 { label: "Media & Design", count: taskTypeCounts["Media & Design"] || 2 },
 { label: "Collaboration", count: taskTypeCounts["Collaboration"] || 4 },
 { label: "Customer Experience", count: taskTypeCounts["Customer Experience"] || 3 },
 { label: "Bug Tracking", count: taskTypeCounts["Bug Tracking"] || 5 },
 { label: "Docs & Memory", count: taskTypeCounts["Docs & Memory"] || 3 },
 ]
 .filter((item) => item.label.toLowerCase().includes(taskTypeSearch.toLowerCase()))
 .map((item) => (
 <button
 key={item.label}
 onClick={() => {
 setSelectedTaskType(item.label);
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors",
 selectedTaskType === item.label ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 <span>{item.label}</span>
 <span className="text-muted-foreground text-[11px] font-mono">{item.count}</span>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* 2. Capabilities Dropdown */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setActiveDropdown(activeDropdown === "capabilities" ? null : "capabilities")}
 className={cn(
 "h-9.5 px-3.5 bg-card border rounded-md text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-xs transition-all select-none",
 selectedCapability !== "All" ? "border-[#0f52ff] bg-blue-50/40 text-[#0f52ff]" : "border-border"
 )}
 >
 <span>{selectedCapability === "All" ? "Capabilities" : selectedCapability}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>

 {activeDropdown === "capabilities" && (
 <div className="absolute right-0 top-11 z-50 w-[220px] bg-card border border-border rounded-md shadow-xl p-2.5 animate-in fade-in zoom-in-95">
 <input
 type="text"
 placeholder="Search..."
 value={capabilitySearch}
 onChange={(e) => setCapabilitySearch(e.target.value)}
 className="w-full h-8 px-3 mb-2 bg-card border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#0f52ff]"
 />
 <div className="max-h-[200px] overflow-y-auto space-y-0.5 custom-scrollbar">
 {["All", "Function calling", "Reasoning", "Vision", "Zero data retention", "Real-time", "Batch", "Connected"]
 .filter((c) => c.toLowerCase().includes(capabilitySearch.toLowerCase()))
 .map((cap) => (
 <button
 key={cap}
 onClick={() => {
 setSelectedCapability(cap);
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors block",
 selectedCapability === cap ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 {cap === "All" ? "All Capabilities" : cap}
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* 3. Authors Dropdown */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setActiveDropdown(activeDropdown === "authors" ? null : "authors")}
 className={cn(
 "h-9.5 px-3.5 bg-card border rounded-md text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-xs transition-all select-none",
 selectedAuthor !== "All" ? "border-[#0f52ff] bg-blue-50/40 text-[#0f52ff]" : "border-border"
 )}
 >
 <span>{selectedAuthor === "All" ? "Authors" : selectedAuthor}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>

 {activeDropdown === "authors" && (
 <div className="absolute right-0 top-11 z-50 w-[240px] bg-card border border-border rounded-md shadow-xl p-2.5 animate-in fade-in zoom-in-95">
 <input
 type="text"
 placeholder="Search..."
 value={authorSearch}
 onChange={(e) => setAuthorSearch(e.target.value)}
 className="w-full h-8 px-3 mb-2 bg-card border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#0f52ff]"
 />
 <div className="max-h-[220px] overflow-y-auto space-y-0.5 custom-scrollbar">
 <button
 onClick={() => {
 setSelectedAuthor("All");
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors block",
 selectedAuthor === "All" ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 All Authors
 </button>
 {AUTHORS_LIST.filter((author) => author.name.toLowerCase().includes(authorSearch.toLowerCase())).map((author) => (
 <button
 key={author.id}
 onClick={() => {
 setSelectedAuthor(author.id);
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2.5 transition-colors",
 selectedAuthor === author.id ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 <ProviderLogo providerId={author.iconKey} name={author.name} />
 <span>{author.name}</span>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* 4. Providers Dropdown */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setActiveDropdown(activeDropdown === "providers" ? null : "providers")}
 className={cn(
 "h-9.5 px-3.5 bg-card border rounded-md text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-xs transition-all select-none",
 selectedProvider !== "All" ? "border-[#0f52ff] bg-blue-50/40 text-[#0f52ff]" : "border-border"
 )}
 >
 <span>{selectedProvider === "All" ? "Providers" : selectedProvider}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>

 {activeDropdown === "providers" && (
 <div className="absolute right-0 top-11 z-50 w-[200px] bg-card border border-border rounded-md shadow-xl p-2.5 animate-in fade-in zoom-in-95">
 <input
 type="text"
 placeholder="Search..."
 value={providerSearch}
 onChange={(e) => setProviderSearch(e.target.value)}
 className="w-full h-8 px-3 mb-2 bg-card border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#0f52ff]"
 />
 <div className="max-h-[180px] overflow-y-auto space-y-0.5 custom-scrollbar">
 {["All", "First-party", "Third-party", "Cloud-hosted"]
 .filter((p) => p.toLowerCase().includes(providerSearch.toLowerCase()))
 .map((prov) => (
 <button
 key={prov}
 onClick={() => {
 setSelectedProvider(prov);
 setActiveDropdown(null);
 }}
 className={cn(
 "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors block",
 selectedProvider === prov ? "bg-card text-[#0f52ff]" : "hover:bg-card text-foreground/90"
 )}
 >
 {prov === "All" ? "All Providers" : prov}
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* 5. Sort By / Date Added Dropdown */}
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
 {["Date added", "Name (A-Z)", "Most connected"].map((option) => (
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

 {/* Live connector strip */}
 <div className="mb-8 rounded-md border border-border bg-card px-6 py-6 flex flex-wrap items-center justify-between gap-6">
 <div>
 <div className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[#2457ff] mb-1">Current connectors</div>
 <p className="text-[14px] text-muted-foreground">
 Live workspace connector links used by Mission Control.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {connectedSources.length > 0 ? (
 connectedSources.map((source) => (
 <span
 key={source.id}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-[#1f2f57]"
 >
 <span className="size-2 rounded-full bg-emerald-500" />
 {source.providerName ?? source.provider ?? source.type ?? source.id}
 </span>
 ))
 ) : (
 <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground">
 No connectors linked yet
 </span>
 )}
 </div>
 </div>

 {/* Results Header Count (Matching Reference Screenshot Text: "We found X models") */}
 <div className="mb-6 flex items-center justify-between">
 <p className="text-[14px] font-normal text-muted-foreground">
 We found <span className="font-semibold text-foreground">{filteredCards.length}</span> connectors
 </p>

 {/* Active Filter Clear Chips if any filter active */}
 {(selectedTaskType !== "All" || selectedCapability !== "All" || selectedAuthor !== "All" || selectedProvider !== "All" || searchQuery) && (
 <button
 onClick={() => {
 setSearchQuery("");
 setSelectedTaskType("All");
 setSelectedCapability("All");
 setSelectedAuthor("All");
 setSelectedProvider("All");
 }}
 className="text-xs font-semibold text-[#0f52ff] hover:underline flex items-center gap-1"
 >
 <X className="size-3" /> Clear filters
 </button>
 )}
 </div>

 {/* Error Banners */}
 {error && (
 <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 p-6 text-amber-800 text-sm flex items-center gap-3">
 <AlertTriangle className="size-5 text-amber-600 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {/* Cards Grid with Crisp Line Borders (Matching Reference Image) */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredCards.map((card) => {
 const isConnecting = connectingType === card.id;
 const isDisconnecting = Boolean(card.linked && disconnectingId === card.linked.id);

 return (
 <div
 key={card.id}
 className="bg-card border border-border hover:border-[#c5c5cf] hover:bg-card rounded-md transition-all duration-200 ease-out shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] group flex flex-col justify-between overflow-hidden"
 >
 <div className="p-6">
 {/* Top Logo & Title Row */}
 <div className="flex items-center gap-3 mb-3">
 <div className="size-9 rounded-md bg-card border border-border flex items-center justify-center shrink-0 shadow-xs group-hover:bg-card transition-colors overflow-hidden">
 <ProviderLogo providerId={card.id} name={card.name} />
 </div>
 <span className="font-semibold text-[16px] text-foreground tracking-tight truncate">
 {card.name.toLowerCase()}
 </span>
 </div>

 {/* Provider & Category Pill Row */}
 <div className="flex items-center gap-2 mb-3 flex-wrap">
 <span className="font-medium text-[13.5px] text-foreground">
 {card.providerTag || card.name.toLowerCase()}
 </span>
 <span className="inline-flex items-center rounded-full bg-card border border-border px-3 py-0.5 text-[12px] font-medium text-foreground/90">
 {card.typeTag || card.category}
 </span>
 </div>

 {/* Description */}
 <p className="text-[13.5px] leading-relaxed text-muted-foreground font-normal min-h-[42px]">
 {card.description}
 </p>

 {/* Tag Badges Row */}
 <div className="flex items-center gap-2 mt-4 flex-wrap">
 <span className="inline-flex items-center rounded-full bg-[#eaeaea] text-foreground/90 px-3 py-0.5 text-[12px] font-medium">
 {card.tag1 || "262,144 max context"}
 </span>
 <span className="inline-flex items-center rounded-full bg-[#eaeaea] text-foreground/90 px-3 py-0.5 text-[12px] font-medium">
 {card.tag2 || (card.dhyraCount > 0 ? `${card.dhyraCount} Links` : "Third-party")}
 </span>
 </div>
 </div>

 {/* Card Footer Row (Turns Light Grey on Hover) */}
 <div className="border-t border-[#f0f0f2] bg-card group-hover:bg-card px-6 py-3 transition-colors flex items-center justify-between">
  <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium">
   {card.connected ? (
    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
     <Check className="size-3.5" /> {card.status ?? "Connected"}
    </span>
   ) : (
    <span className="text-muted-foreground">Not connected</span>
   )}
  </div>

 {/* Action Button */}
 <div className="flex items-center gap-2">
 {card.connected ? (
 <>
 <button
 type="button"
 onClick={() => {
 if (card.linked) onViewDetail(card.linked.id);
 }}
 className="inline-flex items-center gap-1.5 px-3 h-7.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-semibold hover:bg-emerald-100 transition-all"
 >
 <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
 Open
 </button>
 {card.linked ? (
 <button
 type="button"
 onClick={() => void handleDisconnect(card.linked!)}
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
 onClick={() => void handleConnect(card.id)}
  disabled={connectingType !== null}
  className="btn-glossy-blue px-3.5 h-7.5 text-[12px] font-medium gap-1 disabled:opacity-60"
 >
 <Plus className="size-3.5" />
 {isConnecting ? "Connecting..." : "Connect"}
 </button>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* Empty State */}
 {filteredCards.length === 0 && (
 <div className="my-12 p-12 rounded-md border border-border bg-card text-center flex flex-col items-center justify-center shadow-xs">
 <Blocks className="size-12 text-muted-foreground mb-3" />
 <h3 className="text-[18px] font-semibold text-foreground mb-1">No connectors found</h3>
 <p className="text-muted-foreground text-sm max-w-sm mb-4">
 No connectors match your active search and filter options.
 </p>
 <button
 onClick={() => {
 setSearchQuery("");
 setSelectedTaskType("All");
 setSelectedCapability("All");
 setSelectedAuthor("All");
 setSelectedProvider("All");
 }}
 className="btn-glossy-blue h-9 px-6 text-xs font-medium"
 >
 Clear all filters
 </button>
 </div>
 )}
 </div>
 );
}
