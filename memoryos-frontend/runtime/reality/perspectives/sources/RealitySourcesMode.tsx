"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import { useRealityStore } from "../../runtime/store";
import { ChevronRight, ChevronDown, Folder, Triangle, Box, MessageSquare, Database, RefreshCcw, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { sourcesService } from "../../services/sources-service";
import { registerRealitySource } from "@/lib/reality-api";
import type { RealityEntity, RealityEntityType } from "../../entities/types";

type SourceTreeNode = {
 id: string;
 name: string;
 type: string;
 icon?: JSX.Element;
 children?: SourceTreeNode[];
};

const EXPLORER_TREE = [
  {
    id: "src_github",
    name: "GitHub",
    type: "provider",
    icon: <Box className="size-4" />,
    children: [
      { id: "repo_1", name: "memoryos-core", type: "repository" },
      { id: "repo_2", name: "memoryos-web", type: "repository" },
      { id: "repo_3", name: "dhyra-docs", type: "repository" },
    ]
  },
  {
    id: "src_slack",
    name: "Slack",
    type: "provider",
    icon: <MessageSquare className="size-4" />,
    children: [
      { id: "chan_1", name: "#engineering-alerts", type: "channel" },
      { id: "chan_2", name: "#backend-ops", type: "channel" },
      { id: "chan_3", name: "#product-sync", type: "channel" },
    ]
  },
];

const hiddenPhysicalKeywords = ["sensor", "robot", "camera", "warehouse", "machine", "bay"];

export function RealitySourcesMode() {
 const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ "src_github": true });
 const [sources, setSources] = useState<RealityEntity[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const { selection, setSelection, searchQuery } = useRealityStore();

 const fetchSources = async () => {
 setLoading(true);
 setError(null);
 try {
 const items = await sourcesService.fetchSources();
 setSources(items);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Failed to load Reality sources.");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 void fetchSources();
 }, []);

 const sourceTree = useMemo<SourceTreeNode[]>(() => {
 if (sources.length === 0) {
 return EXPLORER_TREE;
 }

 return sources
  .filter((source) => !hiddenPhysicalKeywords.some((keyword) => source.title.toLowerCase().includes(keyword)))
  .map((source) => ({
   id: source.id,
   name: source.title,
   type: source.type,
   icon: source.title.toLowerCase().includes("slack") ? <MessageSquare className="size-4" /> : 
         source.title.toLowerCase().includes("jira") ? <Triangle className="size-4" /> : 
         <Box className="size-4" />,
   children: [
    { id: `${source.id}-indexed`, name: `${typeof source.metadata?.documentsIndexed === "number" ? source.metadata.documentsIndexed : 0} indexed records`, type: "version" },
    { id: `${source.id}-status`, name: source.status ?? "unknown", type: "unknown" },
   ],
  }));
 }, [sources]);

 const handleConnect = async (system: string) => {
 setLoading(true);
 setError(null);
 try {
 await registerRealitySource(system, { provider: system.toLowerCase() });
 await fetchSources();
 } catch (err) {
 setError(err instanceof Error ? err.message : `Failed to connect ${system}.`);
 } finally {
 setLoading(false);
 }
 };

 const toggleNode = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
 };

 const renderTree = (nodes: SourceTreeNode[], level = 0) => {
 return nodes.map((node) => {
 const isExpanded = expandedNodes[node.id] || (searchQuery.length > 0);
 const isSelected = selection?.id === node.id;
 
 let hasChildren = node.children && node.children.length > 0;
 let children = node.children || [];

 if (searchQuery) {
 children = children.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
 hasChildren = children.length > 0;
 
 const selfMatch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
 if (!selfMatch && !hasChildren) return null;
 }

 return (
 <div key={node.id} className="flex flex-col w-full">
 <div 
 onClick={() => setSelection({ type: (node.type || 'unknown') as RealityEntityType, id: node.id, sourceView: 'sources' })}
 className={cn(
 "flex items-center gap-3 py-3 px-8 cursor-pointer transition-colors border-b border-border dark:border-[#333] group",
 isSelected ? "bg-muted/50 dark:bg-[#1a1a1a]" : "bg-card dark:bg-[#111] hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 )}
 >
 <div 
 className="flex items-center w-full"
 style={{ paddingLeft: `${level * 24}px` }}
 >
 {node.children && node.children.length > 0 ? (
 <button 
 onClick={(e) => toggleNode(node.id, e)} 
 className="flex items-center justify-center size-5 mr-2 shrink-0 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-[#eee] transition-colors"
 >
 {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
 </button>
 ) : (
 <span className="flex items-center justify-center size-5 mr-2 shrink-0">
 <span className="size-1 bg-[#ccc] dark:bg-[#555] rounded-full" />
 </span>
 )}
 
 {node.icon ? (
 <span className={cn("shrink-0 mr-3", isSelected ? "text-foreground dark:text-[#eee]" : "text-muted-foreground dark:text-muted-foreground")}>
 {node.icon}
 </span>
 ) : (
 <Folder className={cn("size-4 shrink-0 mr-3", isSelected ? "text-foreground dark:text-[#eee]" : "text-muted-foreground dark:text-muted-foreground")} />
 )}
 
 <span className={cn(
 "text-[14px] font-bold truncate leading-none",
 isSelected ? "text-foreground dark:text-[#eee]" : "text-foreground/90 dark:text-[#ccc] group-hover:text-foreground dark:group-hover:text-eee"
 )}>
 {node.name}
 </span>

 <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-muted-foreground dark:text-muted-foreground bg-[#eee] dark:bg-[#222] px-2 py-0.5">
 {node.type}
 </span>
 </div>
 </div>

 {hasChildren && isExpanded && (
 <div className="flex flex-col w-full">
 {renderTree(children, level + 1)}
 </div>
 )}
 </div>
 );
 });
 };

 return (
 <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
 
 <div className="flex items-center justify-between px-8 py-6 border-b border-border dark:border-[#333]">
 <div className="flex items-center gap-3">
 <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
 <Database className="size-4" />
 </div>
 <div>
  <h1 className="text-[18px] font-bold leading-none">Data Sources</h1>
  <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">Connect software systems that feed the Reality Graph and the live mission loop.</p>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 {["GitHub", "Slack", "Jira", "Notion"].map((system) => (
 <button
 key={system}
 onClick={() => void handleConnect(system)}
 disabled={loading}
 className="flex items-center gap-2 px-3 py-2 bg-[#111] dark:bg-white text-white dark:text-foreground rounded-md text-[12px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors disabled:opacity-60"
 >
 <PlugZap className="size-3.5" />
 Connect {system}
 </button>
 ))}
 </div>
 </div>

 <div className="flex flex-col w-full overflow-y-auto">
 <div className="flex items-center px-8 py-4 bg-muted/50 dark:bg-[#1a1a1a] border-b border-border dark:border-[#333]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Source Tree</span>
 <button onClick={() => void fetchSources()} className="ml-auto flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-[#eee] transition-colors">
 <RefreshCcw className="size-3.5" />
 Refresh
 </button>
 </div>
 {loading && <div className="px-8 py-6 text-[13px] text-muted-foreground dark:text-muted-foreground">Loading live sources...</div>}
 {error && <div className="px-8 py-4 text-[13px] text-red-500">{error}</div>}
 {renderTree(sourceTree)}
 </div>

 </div>
 );
}

GlobalRealityRegistry.register({
 id: 'sources',
 title: 'Data Sources',
 component: RealitySourcesMode,
});
