"use client";

import { useState } from "react";
import { useRealityStore } from "../../runtime/store";
import { BrainCircuit, Search, ChevronRight, FileText, CheckCircle2, ShieldCheck, Building, Download, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { RealityEntityType } from "../../entities/types";

// --- Mock Data ---
const DECISION_TREE = [
 {
 id: "dec_1",
 name: "Decision: Migrate User Table to UUID",
 type: "decision" as RealityEntityType,
 status: "approved",
 children: [
 {
 id: "ev_1",
 name: "Evidence: Performance bottleneck in JOINs",
 type: "evidence" as RealityEntityType,
 children: [
 {
 id: "ver_1",
 name: "Verification: pg_stat_statements analysis (PASS)",
 type: "evidence" as RealityEntityType,
 children: [
 {
 id: "out_1",
 name: "Outcome: PR #1042 Merged",
 type: "evidence" as RealityEntityType,
 children: [
 { id: "inst_1", name: "Institution: Database Architecture", type: "institution" as RealityEntityType }
 ]
 }
 ]
 }
 ]
 }
 ]
 },
 {
 id: "dec_2",
 name: "Decision: Reject Dependency Upgrade (React 19)",
 type: "decision" as RealityEntityType,
 status: "rejected",
 children: [
 {
 id: "ev_2",
 name: "Evidence: 42 breaking changes in internal UI Kit",
 type: "evidence" as RealityEntityType,
 children: [
 {
 id: "ver_2",
 name: "Verification: Automated e2e test suite (FAIL)",
 type: "evidence" as RealityEntityType,
 children: [
 {
 id: "out_2",
 name: "Outcome: Upgrade deferred to Q4",
 type: "evidence" as RealityEntityType,
 children: [
 { id: "inst_2", name: "Institution: Frontend Guild", type: "institution" as RealityEntityType }
 ]
 }
 ]
 }
 ]
 }
 ]
 }
];

export function RealityDecisionMode() {
 const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ "dec_1": true, "ev_1": true, "ver_1": true, "out_1": true, "dec_2": true, "ev_2": true, "ver_2": true });
 const { selection, setSelection, searchQuery } = useRealityStore();

 const toggleNode = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
 };

 const renderIcon = (type: string) => {
 switch (type) {
 case "decision": return <BrainCircuit className="size-4 text-blue-600 dark:text-blue-400" />;
 case "evidence": return <FileText className="size-4 text-muted-foreground dark:text-muted-foreground" />;
 case "institution": return <Building className="size-4 text-foreground dark:text-[#eee]" />;
 default: return <FileText className="size-4 text-muted-foreground dark:text-muted-foreground" />;
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
 onClick={() => setSelection({ type: node.type || 'unknown', id: node.id, sourceView: 'decisions' })}
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
 
 <span className="shrink-0 mr-3 transition-colors">{renderIcon(node.type)}</span>
 
 <span className={cn(
 "text-[14px] font-bold truncate leading-none transition-colors",
 isSelected ? "text-foreground dark:text-[#eee]" : "text-foreground/90 dark:text-[#ccc] group-hover:text-blue-600 dark:group-hover:text-blue-400"
 )}>
 {node.name}
 </span>

 {node.status && (
 <span className={cn(
 "ml-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
 node.status === 'approved' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
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
 <BrainCircuit className="size-4" />
 </div>
 <div>
 <h1 className="text-[18px] font-bold leading-none">Decision Graph</h1>
 <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">Trace every organizational decision back to its evidence and verification.</p>
 </div>
 </div>
 
 <button className="flex items-center gap-2 px-4 py-2 border border-[#ccc] dark:border-[#555] rounded-md text-[13px] font-bold hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors">
 <Download className="size-4" /> Export Report
 </button>
 </div>

 <div className="flex flex-col w-full overflow-y-auto">
 <div className="flex items-center px-8 py-4 bg-muted/50 dark:bg-[#1a1a1a] border-b border-border dark:border-[#333]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Provenance Tree</span>
 </div>
 <div className="flex flex-col w-full relative">
 <div className="absolute left-[54px] top-4 bottom-4 w-px bg-[#eee] dark:bg-[#333] z-0 hidden" />
 {renderTree(DECISION_TREE)}
 </div>
 </div>
 </div>
 );
}

GlobalRealityRegistry.register({
 id: 'decisions',
 title: 'Decision Graph',
 component: RealityDecisionMode,
});
