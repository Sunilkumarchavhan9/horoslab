"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Database, Box, CheckCircle2, Files, RefreshCw, FileCheck, Target, AlertTriangle, ArrowLeft, Link2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { readActiveEpochWorkspaceId } from "@/lib/epoch-api";
import {
 clearStickyCompanySource,
 disconnectSource,
 getSource,
 mergeCompanySourceWithSticky,
 rememberStickyCompanySource,
 reconnectSource,
 syncSourceNow,
 type CompanySource,
} from "@/lib/company-sources-api";

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

 return null;
}

function ProviderLogo({ providerId, name }: { providerId: string; name: string }) {
 const logoSrc = getConnectorLogoSrc(providerId, name);

 if (logoSrc) {
 return (
 <Image
 src={logoSrc}
 alt={name}
 width={28}
 height={28}
 className="size-7 object-contain shrink-0"
 onError={(e) => {
 e.currentTarget.style.display = "none";
 }}
 />
 );
 }

 return <Database className="size-6 text-foreground" />;
}

function formatTimestamp(value?: string | null): string {
 if (!value) return "Never";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return value;
 return parsed.toLocaleString();
}

function summarizeValue(value: unknown): string {
 if (value == null) return "None";
 if (typeof value === "string") return value;
 if (typeof value === "number" || typeof value === "boolean") return String(value);
 if (Array.isArray(value)) return value.length > 0 ? `${value.length} item(s)` : "Empty";
 if (typeof value === "object") return `${Object.keys(value as Record<string, unknown>).length} field(s)`;
 return "Unknown";
}

export function IntegrationsDataSourceDetail({ id, onBack }: { id: string; onBack: () => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [source, setSource] = useState<CompanySource | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [disconnecting, setDisconnecting] = useState(false);
 const [syncing, setSyncing] = useState(false);
 const [reconnecting, setReconnecting] = useState(false);

 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveEpochWorkspaceId());
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
 setSource(null);
 setLoading(false);
 setError("Select a workspace to view data source details.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const result = await getSource(id);
 if (!canceled) setSource((current) => mergeCompanySourceWithSticky(workspaceId, result, current) ?? result);
 } catch (loadError) {
 if (!canceled) {
 setSource(null);
 setError(loadError instanceof Error ? loadError.message : "Failed to load data source.");
 }
 } finally {
 if (!canceled) setLoading(false);
 }
 }

 void load();
 return () => {
 canceled = true;
 };
 }, [id, workspaceId]);

 const details = useMemo(() => {
 return {
 name: source?.providerName ?? source?.provider ?? id,
 provider: source?.provider ?? id,
 syncStatus: source?.status ?? "unknown",
 filesIndexed: `${source?.itemCount ?? 0} items • ${source?.memoryCount ?? 0} memories`,
 lastSync: formatTimestamp(source?.lastSyncedAt ?? source?.createdAt),
 evidenceUsed: summarizeValue(source?.permissions),
 missionsUsing: source?.memoryCount ?? source?.itemCount ?? 0,
 };
 }, [id, source]);

 const connected = ["connected", "syncing", "synced"].includes((source?.status ?? "").toLowerCase());

 async function handleDisconnect() {
 if (!source) return;
 setDisconnecting(true);
 try {
 const updated = await disconnectSource(source.id);
 if (workspaceId) {
 clearStickyCompanySource(workspaceId, updated);
 }
 setSource(updated);
 } catch (disconnectError) {
 setError(disconnectError instanceof Error ? disconnectError.message : "Failed to disconnect data source.");
 } finally {
 setDisconnecting(false);
 }
 }

 async function handleReconnect() {
 if (!source) return;
 setReconnecting(true);
 try {
 const updated = await reconnectSource(source.id);
 if (workspaceId) {
 rememberStickyCompanySource(workspaceId, updated);
 }
 setSource(updated);
 } catch (reconnectError) {
 setError(reconnectError instanceof Error ? reconnectError.message : "Failed to reconnect data source.");
 } finally {
 setReconnecting(false);
 }
 }

 async function handleSync() {
 if (!source) return;
 setSyncing(true);
 try {
 const result = await syncSourceNow(source.id);
 if (workspaceId) {
 rememberStickyCompanySource(workspaceId, result.source);
 }
 setSource(result.source);
 } catch (syncError) {
 setError(syncError instanceof Error ? syncError.message : "Failed to sync data source.");
 } finally {
 setSyncing(false);
 }
 }

 return (
 <div className="-mx-8 -mt-8 p-8 md:p-12 min-h-screen bg-[#FBFBFB] text-foreground font-sans flex flex-col">
 {/* Breadcrumb Header */}
 <div className="flex items-center gap-2 mb-8 text-[14px]">
 <button
 className="text-muted-foreground hover:text-foreground cursor-pointer font-medium transition-colors flex items-center gap-1.5"
 onClick={onBack}
 >
 <ArrowLeft className="size-4" />
 Data Sources
 </button>
 <ChevronRight className="size-4 text-[#aaa]" />
 <span className="text-foreground font-semibold flex items-center gap-2">
 {details.name}
 </span>
 </div>

 {loading ? (
 <div className="bg-card border border-border rounded-md shadow-xs p-12 text-center max-w-3xl">
 <p className="text-[15px] text-muted-foreground">Loading data source detail...</p>
 </div>
 ) : error ? (
 <div className="bg-card border border-border rounded-md shadow-xs p-12 text-center max-w-3xl">
 <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3" />
 <p className="text-[15px] text-foreground font-medium mb-1">Data source unavailable</p>
 <p className="text-[14px] text-muted-foreground">{error}</p>
 </div>
 ) : source ? (
 <div className="max-w-3xl">
 <div className="bg-card border border-border rounded-md p-8 mb-8 shadow-xs">
 <div className="flex items-center gap-6 mb-8">
 <div className="size-16 rounded-md bg-card border border-border flex items-center justify-center shrink-0 shadow-xs">
 <ProviderLogo providerId={details.provider} name={details.name} />
 </div>
 <div className="min-w-0">
 <h2 className="text-[26px] font-bold text-foreground leading-tight tracking-tight">{details.name}</h2>
 <p className="text-[14px] text-muted-foreground mt-1">Live evidence source</p>
 </div>
 </div>

 <div className="flex items-start justify-between gap-6 pb-6 border-b border-[#f0f0f2]">
 <div className="flex items-center gap-2">
 <div className={connected ? "size-2 rounded-full bg-emerald-500 animate-pulse" : "size-2 rounded-full bg-gray-400"} />
 <span className={connected ? "text-[14px] font-semibold text-emerald-700" : "text-[14px] font-semibold text-gray-700"}>
 {details.syncStatus}
 </span>
 </div>

 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 className="border-border bg-card text-foreground hover:bg-card"
 onClick={handleSync}
 disabled={syncing || disconnecting || reconnecting}
 >
 <RefreshCw className="size-4 mr-2" />
 {syncing ? "Syncing..." : "Sync"}
 </Button>
 {connected ? (
 <Button
 variant="outline"
 className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
 onClick={handleDisconnect}
 disabled={disconnecting || syncing || reconnecting}
 >
 <FileCheck className="size-4 mr-2" />
 {disconnecting ? "Disconnecting..." : "Disconnect"}
 </Button>
 ) : (
 <Button
 variant="outline"
 className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
 onClick={handleReconnect}
 disabled={reconnecting || syncing || disconnecting}
 >
 <Link2 className="size-4 mr-2" />
 {reconnecting ? "Reconnecting..." : "Reconnect"}
 </Button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 pt-6">
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <Box className="size-3.5" />
 Provider
 </div>
 <div className="text-[15px] font-semibold text-foreground">{source.providerName ?? details.provider}</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <CheckCircle2 className="size-3.5" />
 Sync Status
 </div>
 <div className="text-[15px] font-semibold text-emerald-600">{details.syncStatus}</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <Files className="size-3.5" />
 Configuration
 </div>
 <div className="text-[15px] font-medium text-foreground">{details.filesIndexed}</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <RefreshCw className="size-3.5" />
 Last Sync
 </div>
 <div className="text-[15px] font-medium text-muted-foreground">{details.lastSync}</div>
 </div>
 <div className="pt-4 border-t border-[#f0f0f2] mt-2">
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <FileCheck className="size-3.5" />
 Evidence Used
 </div>
 <div className="text-[15px] font-bold text-foreground">{details.evidenceUsed}</div>
 </div>
 <div className="pt-4 border-t border-[#f0f0f2] mt-2">
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <Target className="size-3.5" />
 Missions Using
 </div>
 <div className="text-[15px] font-bold text-foreground">{details.missionsUsing} active missions</div>
 </div>
 </div>
 </div>
 </div>
 ) : null}
 </div>
 );
}
