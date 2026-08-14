"use client";

import { useState } from "react";
import { useRealityStore } from "../../runtime/store";
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronRight, Package, Box, GitCommit, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { RealityEntityType } from "../../entities/types";

// --- Mock Data ---
const PACKAGES = [
 {
 id: "pkg_openai",
 name: "OpenAI SDK",
 version: "v4.2.0",
 status: "Breaking",
 type: "api" as RealityEntityType,
 icon: <Package className="size-4" />,
 children: [
 { 
 id: "v_4_2", 
 name: "v4.2.0 Release", 
 type: "version" as RealityEntityType,
 children: [
 {
 id: "b_change",
 name: "Breaking Change: chat.completions API structure",
 type: "breaking_change" as RealityEntityType,
 children: [
 { id: "repo_1", name: "memoryos-core", type: "repository" as RealityEntityType },
 { id: "repo_2", name: "memoryos-worker", type: "repository" as RealityEntityType },
 { id: "miss_1", name: "Auto-Patch Mission (In Progress)", type: "mission" as RealityEntityType }
 ]
 }
 ]
 }
 ]
 },
 {
 id: "pkg_stripe",
 name: "Stripe Node",
 version: "v14.1.0",
 status: "Warning",
 type: "api" as RealityEntityType,
 icon: <Box className="size-4" />,
 children: [
 {
 id: "v_14_1",
 name: "v14.1.0 Release",
 type: "version" as RealityEntityType,
 children: [
 {
 id: "w_change",
 name: "Deprecation: charges API",
 type: "warning" as RealityEntityType,
 children: [
 { id: "repo_3", name: "payment-gateway", type: "repository" as RealityEntityType }
 ]
 }
 ]
 }
 ]
 }
];

export function RealityApiWatcherMode() {
 const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ "pkg_openai": true, "v_4_2": true, "b_change": true });
 const { selection, setSelection, searchQuery } = useRealityStore();

 const toggleNode = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
 };

 const renderIcon = (type: RealityEntityType) => {
 switch (type) {
 case "version": return <GitCommit className="size-4 text-muted-foreground dark:text-muted-foreground" />;
 case "breaking_change": return <ShieldAlert className="size-4 text-red-500 dark:text-red-400" />;
 case "warning": return <AlertTriangle className="size-4 text-amber-500 dark:text-amber-400" />;
 case "repository": return <GitCommit className="size-4 text-muted-foreground dark:text-muted-foreground" />;
 case "mission": return <Target className="size-4 text-rose-500 dark:text-rose-400" />;
 default: return <Box className="size-4 text-muted-foreground dark:text-muted-foreground" />;
 }
 };

 const renderTree = (nodes: any[], level = 0) => {
 return nodes.map((node) => {
 const isExpanded = expandedNodes[node.id] || searchQuery.length > 0;
 const isSelected = selection?.id === node.id;
 const hasChildren = node.children && node.children.length > 0;

 return (
 <div key={node.id} className="flex flex-col w-full relative group">
 <div 
 onClick={() => setSelection({ type: node.type, id: node.id, sourceView: 'watcher' })}
 className={cn(
 "flex items-center gap-3 py-3 px-8 cursor-pointer transition-colors border-b border-border dark:border-[#333] relative z-10 bg-card dark:bg-[#111]",
 isSelected ? "bg-muted/50 dark:bg-[#1a1a1a]" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 )}
 >
 <div className="flex items-center w-full" style={{ paddingLeft: `${level * 24}px` }}>
 {hasChildren ? (
 <button 
 onClick={(e) => toggleNode(node.id, e)} 
 className="flex items-center justify-center size-5 shrink-0 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-[#eee] transition-colors mr-2"
 >
 {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
 </button>
 ) : (
 <span className="flex items-center justify-center size-5 shrink-0 mr-2">
 <span className="size-1 bg-[#ccc] dark:bg-[#555] rounded-full" />
 </span>
 )}
 
 <span className="shrink-0 mr-3 transition-colors">{node.icon || renderIcon(node.type)}</span>
 
 <span className={cn(
 "text-[14px] font-bold truncate leading-none transition-colors",
 isSelected ? "text-foreground dark:text-[#eee]" : "text-foreground/90 dark:text-[#ccc] group-hover:text-blue-600 dark:group-hover:text-blue-400",
 (node.type === "breaking_change" && isSelected) && "text-red-600 dark:text-red-400"
 )}>
 {node.name}
 </span>

 {node.status && (
 <span className={cn(
 "ml-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
 node.status === 'Breaking' ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
 )}>
 {node.status}
 </span>
 )}
 
 <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-muted-foreground dark:text-muted-foreground bg-[#eee] dark:bg-[#222] px-2 py-0.5">
 {node.type}
 </span>
 </div>
 </div>

 {hasChildren && isExpanded && (
 <div className="flex flex-col w-full">
 {renderTree(node.children, level + 1)}
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
 <Zap className="size-4" />
 </div>
 <div>
 <h1 className="text-[18px] font-bold leading-none">API Watcher</h1>
 <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">Real-time dependency tracking and breaking change simulation.</p>
 </div>
 </div>
 
 <button className="flex items-center gap-2 px-4 py-2 border border-[#ccc] dark:border-[#555] rounded-md text-[13px] font-bold hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors">
 <Package className="size-4" /> Add Dependency
 </button>
 </div>

 <div className="flex flex-col w-full overflow-y-auto">
 <div className="flex items-center px-8 py-4 bg-muted/50 dark:bg-[#1a1a1a] border-b border-border dark:border-[#333]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Tracked APIs</span>
 </div>
 <div className="flex flex-col w-full">
 {renderTree(PACKAGES)}
 </div>
 </div>
 </div>
 );
}

GlobalRealityRegistry.register({
 id: 'watcher',
 title: 'API Watcher',
 component: RealityApiWatcherMode,
});
