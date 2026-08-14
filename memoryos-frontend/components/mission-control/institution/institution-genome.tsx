"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, FileJson, History, Network, ShieldCheck, Cpu, Database, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplitPane } from "./institution-shared-components";

type TreeNode = {
 id: string;
 label: string;
 icon: React.ReactNode;
 children?: TreeNode[];
};

const GENOME_TREE: TreeNode[] = [
 {
 id: "identity", label: "Identity", icon: <Fingerprint className="size-3.5" />,
 children: [
 { id: "id_name", label: "Name & Description", icon: <FileJson className="size-3.5" /> },
 { id: "id_tags", label: "Tags & Classifications", icon: <FileJson className="size-3.5" /> },
 ]
 },
 {
 id: "mission", label: "Mission", icon: <Cpu className="size-3.5" />,
 children: [
 { id: "mis_obj", label: "Core Objective", icon: <FileJson className="size-3.5" /> },
 { id: "mis_bound", label: "Boundaries", icon: <FileJson className="size-3.5" /> },
 ]
 },
 {
 id: "roles", label: "Roles", icon: <Network className="size-3.5" />,
 children: [
 { id: "rol_planner", label: "Epoch Planner", icon: <FileJson className="size-3.5" /> },
 { id: "rol_reviewer", label: "Security Reviewer", icon: <FileJson className="size-3.5" /> },
 ]
 },
 {
 id: "authority", label: "Authority", icon: <ShieldCheck className="size-3.5" />,
 children: [
 { id: "auth_limits", label: "Rate Limits", icon: <FileJson className="size-3.5" /> },
 { id: "auth_approvals", label: "Required Approvals", icon: <FileJson className="size-3.5" /> },
 ]
 },
 {
 id: "policies", label: "Policies", icon: <ShieldCheck className="size-3.5" />,
 children: [
 { id: "pol_budget", label: "Budget Constraints", icon: <FileJson className="size-3.5" /> },
 { id: "pol_privacy", label: "Data Privacy", icon: <FileJson className="size-3.5" /> },
 ]
 },
 {
 id: "evidence", label: "Evidence Duties", icon: <Database className="size-3.5" />,
 children: [
 { id: "ev_audit", label: "Audit Logging", icon: <FileJson className="size-3.5" /> },
 ]
 }
];

function TreeItem({ node, depth = 0, selectedId, onSelect }: { node: TreeNode, depth?: number, selectedId: string, onSelect: (id: string) => void }) {
 const [isExpanded, setIsExpanded] = useState(true);
 const hasChildren = node.children && node.children.length > 0;
 const isSelected = selectedId === node.id;

 return (
 <div>
 <div 
 onClick={() => {
 if (hasChildren) setIsExpanded(!isExpanded);
 onSelect(node.id);
 }}
 className={cn(
 "flex items-center gap-1.5 px-2 py-1 cursor-pointer select-none transition-colors group",
 isSelected ? "bg-[#0f52ff]/20 text-foreground dark:text-white" : "hover:bg-accent dark:bg-white/5 text-foreground/70 dark:text-white/70 hover:text-foreground dark:text-white"
 )}
 style={{ paddingLeft: `${depth * 12 + 8}px` }}
 >
 <div className="size-4 flex items-center justify-center shrink-0">
 {hasChildren ? (
 isExpanded ? <ChevronDown className="size-3.5 opacity-50 group-hover:opacity-100" /> : <ChevronRight className="size-3.5 opacity-50 group-hover:opacity-100" />
 ) : (
 <span className="size-1 bg-black/20 dark:bg-white/20 rounded-full" />
 )}
 </div>
 {node.icon}
 <span className="text-[13px] truncate">{node.label}</span>
 </div>
 {hasChildren && isExpanded && (
 <div className="flex flex-col">
 {node.children!.map(child => (
 <TreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
 ))}
 </div>
 )}
 </div>
 );
}

export function InstitutionGenome() {
 const [selectedNode, setSelectedNode] = useState("auth_approvals");
 const [rightTab, setRightTab] = useState<"JSON" | "History" | "Dependencies">("JSON");

 return (
 <SplitPane 
 leftWidth="280px"
 left={
 <div className="py-2 bg-card dark:bg-[#0a0a0a] min-h-full">
 <div className="px-6 py-2 text-[11px] font-semibold text-foreground/40 dark:text-white/40 uppercase tracking-wider mb-1">
 Genome Explorer
 </div>
 {GENOME_TREE.map(node => (
 <TreeItem key={node.id} node={node} selectedId={selectedNode} onSelect={setSelectedNode} />
 ))}
 </div>
 }
 right={
 <div className="flex flex-col h-full bg-card dark:bg-[#121212]">
 <div className="flex items-center justify-between px-6 py-6 border-b border-border dark:border-white/10 shrink-0">
 <div className="flex flex-col">
 <h2 className="text-[18px] font-semibold text-foreground dark:text-white tracking-tight">Required Approvals</h2>
 <span className="text-[12px] text-foreground/50 dark:text-white/50 font-mono mt-0.5">authority.approvals</span>
 </div>
 <div className="flex items-center gap-1 bg-muted dark:bg-white/5 p-1 rounded-md">
 {(["JSON", "History", "Dependencies"] as const).map(t => (
 <button
 key={t}
 onClick={() => setRightTab(t)}
 className={cn(
 "px-3 py-1.5 rounded text-[12px] font-medium transition-colors",
 rightTab === t ? "bg-black/10 dark:bg-white/10 text-foreground dark:text-white " : "text-foreground/50 dark:text-white/50 hover:text-foreground dark:text-white hover:bg-accent dark:bg-white/5"
 )}
 >
 {t}
 </button>
 ))}
 </div>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6">
 {rightTab === "JSON" && (
 <div className="bg-card dark:bg-[#050505] border border-border dark:border-white/10 rounded-md p-6 font-mono text-[13px] text-emerald-400">
 <pre>
{`{
 "authority": {
 "approvals": {
 "required": true,
 "quorum": 2,
 "roles": [
 "sec_reviewer",
 "sys_admin"
 ],
 "auto_approve_threshold": "low_risk"
 }
 }
}`}
 </pre>
 </div>
 )}

 {rightTab === "History" && (
 <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-black/10 dark:via-white/10 before:to-transparent">
 {[1, 2, 3].map((i) => (
 <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
 <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border dark:border-white/10 bg-card dark:bg-[#121212] group-[.is-active]:text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
 <History className="size-4" />
 </div>
 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5 ">
 <div className="flex items-center justify-between space-x-2 mb-1">
 <div className="font-semibold text-foreground dark:text-white text-[13px]">Updated Quorum size</div>
 <time className="font-mono text-foreground/40 dark:text-white/40 text-[11px]">v{14-i}</time>
 </div>
 <div className="text-foreground/60 dark:text-white/60 text-[12px]">Changed quorum requirement from 1 to 2 for extra security.</div>
 </div>
 </div>
 ))}
 </div>
 )}
 
 {rightTab === "Dependencies" && (
 <div className="flex items-center justify-center h-full text-foreground/30 dark:text-white/30 text-[13px]">
 Dependency graph visualization coming soon
 </div>
 )}
 </div>
 </div>
 }
 />
 );
}
