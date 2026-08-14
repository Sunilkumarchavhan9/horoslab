"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Code, Link2, CheckCircle2, RefreshCw, Box, Shield, Building, AlertTriangle, DatabaseZap, ArrowLeft } from "lucide-react";
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

function providerIcon(provider: string) {
 const key = provider.toLowerCase();
 if (key.includes("github")) return <Code className="size-6 text-foreground" />;
 if (key.includes("slack")) return <DatabaseZap className="size-6 text-[#e01e5a]" />;
 if (key.includes("browser")) return <Box className="size-6 text-[#0f52ff]" />;
 return <DatabaseZap className="size-6 text-[#0f52ff]" />;
}

function formatTimestamp(value?: string | null): string {
 if (!value) return "Unknown";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return "Unknown";
 return parsed.toLocaleString();
}

function summarizeConfig(config?: Record<string, unknown> | null): string {
 if (!config || typeof config !== "object") return "No configuration stored.";
 const keys = Object.keys(config);
 return keys.length > 0 ? keys.map((key) => key.replace(/_/g, " ")).join(", ") : "No configuration stored.";
}

export function IntegrationsConnectionDetail({ id, onBack }: { id: string; onBack: () => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [connection, setConnection] = useState<CompanySource | null>(null);
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
 setConnection(null);
 setLoading(false);
 setError("Select a workspace to view integration details.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const result = await getSource(id);
 if (!canceled) setConnection((current) => mergeCompanySourceWithSticky(workspaceId, result, current) ?? result);
 } catch (loadError) {
 if (!canceled) {
 setConnection(null);
 setError(loadError instanceof Error ? loadError.message : "Failed to load integration.");
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

 const connected = ["connected", "syncing", "synced"].includes((connection?.status ?? "").toLowerCase());

 const details = useMemo(() => {
 return {
 name: connection?.providerName ?? connection?.provider ?? id,
 icon: providerIcon(connection?.provider ?? id),
 organization: connection?.workspaceId ?? "Workspace",
 repositories: connection?.type ?? connection?.provider ?? "Integration",
 permissions: summarizeConfig(connection?.permissions),
 syncStatus: connection?.status ?? "unknown",
 lastSync: formatTimestamp(connection?.lastSyncedAt ?? connection?.createdAt),
 };
 }, [connection, id]);

 async function handleDisconnect() {
 if (!workspaceId || !connection) return;
 setDisconnecting(true);
 try {
 const updated = await disconnectSource(connection.id);
 if (workspaceId) {
 clearStickyCompanySource(workspaceId, updated);
 }
 setConnection(updated);
 } catch (disconnectError) {
 setError(disconnectError instanceof Error ? disconnectError.message : "Failed to disconnect integration.");
 } finally {
 setDisconnecting(false);
 }
 }

 async function handleReconnect() {
 if (!connection) return;
 setReconnecting(true);
 try {
 const updated = await reconnectSource(connection.id);
 if (workspaceId) {
 rememberStickyCompanySource(workspaceId, updated);
 }
 setConnection(updated);
 } catch (reconnectError) {
 setError(reconnectError instanceof Error ? reconnectError.message : "Failed to reconnect integration.");
 } finally {
 setReconnecting(false);
 }
 }

 async function handleSync() {
 if (!connection) return;
 setSyncing(true);
 try {
 const result = await syncSourceNow(connection.id);
 if (workspaceId) {
 rememberStickyCompanySource(workspaceId, result.source);
 }
 setConnection(result.source);
 } catch (syncError) {
 setError(syncError instanceof Error ? syncError.message : "Failed to sync integration.");
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
 Connections
 </button>
 <ChevronRight className="size-4 text-[#aaa]" />
 <span className="text-foreground font-semibold flex items-center gap-2">
 {details.name}
 </span>
 </div>

 {loading ? (
 <div className="bg-card border border-border rounded-md p-12 text-center max-w-3xl ">
 <p className="text-[15px] text-muted-foreground">Loading integration detail...</p>
 </div>
 ) : error ? (
 <div className="bg-card border border-amber-200 bg-amber-50 rounded-md p-12 text-center max-w-3xl ">
 <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3" />
 <p className="text-[15px] text-foreground font-medium mb-1">Integration detail unavailable</p>
 <p className="text-[14px] text-muted-foreground">{error}</p>
 </div>
 ) : connection ? (
 <div className="max-w-3xl">
 <div className="bg-card border border-border rounded-md p-8 mb-8 ">
 <div className="flex items-start justify-between mb-8 gap-6">
 <div className="flex items-center gap-6">
 <div className="size-16 rounded-md bg-card border border-border flex items-center justify-center shrink-0">
 {details.icon}
 </div>
 <div>
 <h2 className="text-[26px] font-bold text-foreground leading-tight tracking-tight">{details.name}</h2>
 <div className="flex items-center gap-2 mt-1.5">
 <div className={connected ? "size-2 rounded-full bg-emerald-500 animate-pulse" : "size-2 rounded-full bg-gray-400"} />
 <span className={connected ? "text-[14px] font-semibold text-emerald-700" : "text-[14px] font-medium text-gray-700"}>
 {connection.status ?? "Unknown"}
 </span>
 </div>
 </div>
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
 <Link2 className="size-4 mr-2" />
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

 <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 pt-6 border-t border-[#f0f0f2]">
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <Building className="size-3.5" />
 Organization
 </div>
 <div className="text-[15px] font-semibold text-foreground">{details.organization}</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <Box className="size-3.5" />
 Provider
 </div>
 <div className="text-[15px] font-semibold text-foreground">{connection.providerName ?? connection.provider}</div>
 </div>
 <div className="md:col-span-2">
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <Shield className="size-3.5" />
 Configuration
 </div>
 <div className="text-[14px] font-mono text-foreground/90 bg-card border border-border px-3 py-2 rounded-md inline-block">
 {details.permissions}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <CheckCircle2 className="size-3.5" />
 Sync Status
 </div>
 <div className="text-[14px] font-semibold text-emerald-600">{details.syncStatus}</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <RefreshCw className="size-3.5" />
 Last Sync
 </div>
 <div className="text-[14px] font-medium text-muted-foreground">{details.lastSync}</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <DatabaseZap className="size-3.5" />
 Created
 </div>
 <div className="text-[14px] font-medium text-muted-foreground">{formatTimestamp(connection.createdAt)}</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <CheckCircle2 className="size-3.5" />
 Updated
 </div>
 <div className="text-[14px] font-medium text-muted-foreground">{formatTimestamp(connection.lastSyncedAt ?? connection.createdAt)}</div>
 </div>
 </div>
 </div>
 </div>
 ) : null}
 </div>
 );
}
