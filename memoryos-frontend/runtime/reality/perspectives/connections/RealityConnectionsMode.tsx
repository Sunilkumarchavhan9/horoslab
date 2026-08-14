"use client";

import { useEffect, useState } from "react";
import { useRealityStore } from "../../runtime/store";
import { connectionsService } from "../../services/connections-service";
import { RealityEntity } from "../../entities/types";
import { Box, MessageSquare, Triangle, Layout, LoaderCircle, RefreshCcw, PlugZap } from "lucide-react";
import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { authorizeConnector } from "@/lib/continuity-lab/connector-actions";

const getIconForConnection = (id: string) => {
 if (id.includes('github')) return <Box className="size-4" />;
 if (id.includes('slack')) return <MessageSquare className="size-4" />;
 if (id.includes('vercel')) return <Triangle className="size-4" />;
 if (id.includes('jira')) return <Layout className="size-4" />;
 return <Box className="size-4" />;
}

export function RealityConnectionsMode() {
 const [connections, setConnections] = useState<RealityEntity[]>([]);
 const [loading, setLoading] = useState(false);
 const [connectingSystem, setConnectingSystem] = useState<"github" | "slack" | null>(null);
 const [error, setError] = useState<string | null>(null);
 const { selection, setSelection, searchQuery } = useRealityStore();

 const fetchConnections = async () => {
 setLoading(true);
 setError(null);
 try {
 const items = await connectionsService.fetchConnections();
 setConnections(items);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Failed to load Reality connections.");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 void fetchConnections();
 }, []);

 const handleConnect = async (system: "github" | "slack") => {
 setConnectingSystem(system);
 setError(null);
 try {
 await authorizeConnector(system);
 } catch (err) {
 setError(err instanceof Error ? err.message : `Failed to connect ${system}.`);
 setConnectingSystem(null);
 }
 };

 const isProviderConnected = (provider: "github" | "slack") => connections.some((connection) => {
 const title = connection.title.toLowerCase();
 const linkedProvider = typeof connection.metadata?.provider === "string"
 ? connection.metadata.provider.toLowerCase()
 : "";
 return title === provider || linkedProvider === provider;
 });

 const filteredConnections = connections.filter(c => 
 c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
 (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
 );

 return (
 <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
 
 <div className="flex items-center gap-2 px-8 py-3 border-b border-border dark:border-[#333] bg-muted/30 dark:bg-[#1a1a1a]">
 {(["github", "slack"] as const).map((system) => {
 const connected = isProviderConnected(system);
 const label = system === "github" ? "GitHub" : "Slack";
 return (
 <button
 key={system}
 onClick={() => void handleConnect(system)}
 disabled={loading || connectingSystem !== null || connected}
 className="flex items-center gap-2 px-3 py-2 bg-[#111] dark:bg-white text-white dark:text-foreground rounded-md text-[12px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors disabled:opacity-60"
 >
 {connectingSystem === system ? <LoaderCircle className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />}
 {connectingSystem === system ? `Connecting ${label}...` : connected ? `${label} Connected` : `Connect ${label}`}
 </button>
 );
 })}
 {connectingSystem && (
 <span className="text-[12px] font-medium text-blue-600 dark:text-blue-400">
 Opening secure {connectingSystem === "github" ? "GitHub" : "Slack"} authorization…
 </span>
 )}
 {error && <span className="text-[12px] font-medium text-red-500">{error}</span>}
 <button onClick={() => void fetchConnections()} className="ml-auto flex items-center gap-2 px-3 py-2 bg-card dark:bg-[#111] border border-border dark:border-[#333] rounded-md text-[12px] font-bold text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-[#eee] transition-colors">
 <RefreshCcw className="size-3.5" />
 Refresh
 </button>
 </div>

 <div className="flex flex-col w-full overflow-y-auto divide-y divide-[#eee] dark:divide-[#333]">
 
 <div className="flex items-center px-8 py-4 bg-muted/50 dark:bg-[#1a1a1a]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground w-1/3">Integration</span>
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground w-1/4">Workspace</span>
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground w-1/6">Status</span>
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex-1 text-right">Volume</span>
 </div>

 {loading && <div className="px-8 py-6 text-[13px] text-muted-foreground dark:text-muted-foreground">Loading live connections...</div>}
 {filteredConnections.map(conn => {
 const isActive = selection?.id === conn.id;
 return (
 <div
 key={conn.id}
 onClick={() => setSelection({ type: conn.type, id: conn.id, sourceView: 'connections' })}
 className={`flex items-center px-8 py-6 cursor-pointer transition-colors group ${
 isActive ? "bg-muted/50 dark:bg-[#1a1a1a]" : "bg-card dark:bg-[#111] hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 }`}
 >
 <div className="flex items-center gap-4 w-1/3 min-w-0">
 <div className={`shrink-0 transition-colors ${isActive ? "text-foreground dark:text-[#eee]" : "text-muted-foreground dark:text-muted-foreground"}`}>
 {getIconForConnection(conn.id)}
 </div>
 <span className={`text-[15px] font-bold truncate transition-colors ${
 isActive ? "text-foreground dark:text-[#eee]" : "text-foreground/90 dark:text-[#ccc] group-hover:text-blue-600 dark:group-hover:text-blue-400"
 }`}>
 {conn.title}
 </span>
 </div>
 
 <div className="w-1/4 min-w-0">
 <span className="text-[13px] text-muted-foreground dark:text-muted-foreground font-medium truncate">{conn.subtitle || "—"}</span>
 </div>

 <div className="w-1/6">
 <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 ${
 conn.status === 'healthy' 
 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
 : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
 }`}>
 {conn.status === 'healthy' ? 'Connected' : 'Warning'}
 </span>
 </div>

 <div className="flex-1 text-right min-w-0">
 <span className="text-[14px] font-mono font-bold text-muted-foreground dark:text-muted-foreground truncate">
 {typeof conn.metadata?.volume === "string" ? conn.metadata.volume : "0"}
 </span>
 </div>
 </div>
 );
 })}

 {filteredConnections.length === 0 && (
 <div className="px-8 py-12 text-center text-muted-foreground dark:text-muted-foreground text-[13px] font-medium">
 {`No connections found matching "${searchQuery}"`}
 </div>
 )}
 </div>
 </div>
 );
}

GlobalRealityRegistry.register({
 id: 'connections',
 title: 'Connections',
 component: RealityConnectionsMode,
});
