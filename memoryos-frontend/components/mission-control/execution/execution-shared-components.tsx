"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock, Zap, Loader2, Play, GitCommit, Search, ShieldCheck } from "lucide-react";

export type ExecutionStatus = "RUNNING" | "WAITING" | "COMPLETED" | "FAILED" | "PAUSED" | "REVIEWING";

export function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
 if (status === "RUNNING") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold tracking-wider">
 <span className="relative flex h-1.5 w-1.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
 </span>
 RUNNING
 </div>
 );
 }
 if (status === "COMPLETED") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold tracking-wider">
 <CheckCircle2 className="size-3" />
 COMPLETED
 </div>
 );
 }
 if (status === "WAITING") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold tracking-wider">
 <Clock className="size-3" />
 WAITING
 </div>
 );
 }
 if (status === "REVIEWING") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0f52ff]/10 border border-[#0f52ff]/20 text-[#0f52ff] text-[10px] font-bold tracking-wider">
 <div className="size-1.5 rounded-full bg-[#0f52ff] shadow-[0_0_8px_rgba(15,82,255,0.8)] animate-pulse" />
 REVIEWING
 </div>
 );
 }
 if (status === "FAILED") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-wider opacity-90">
 <AlertCircle className="size-3" />
 FAILED
 </div>
 );
 }
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-foreground/70 dark:text-[#F0EFE2]/70 text-[10px] font-bold tracking-wider">
 <div className="size-1.5 rounded-full bg-muted0 dark:bg-white/50" />
 PAUSED
 </div>
 );
}

export function CommandBar({ children, className }: { children?: React.ReactNode; className?: string }) {
 return (
 <div className={cn("flex items-center justify-between px-6 py-2 border-b border-border dark:border-white/10 bg-card dark:bg-[#121212]", className)}>
 {children}
 </div>
 );
}

export function SectionHeader({ title, description, action, className }: { title: string, description?: string, action?: React.ReactNode, className?: string }) {
 return (
 <div className={cn("flex items-start justify-between mb-6 shrink-0", className)}>
 <div className="flex flex-col gap-1">
 <h2 className="text-[20px] font-semibold text-foreground dark:text-[#F0EFE2] tracking-tight">{title}</h2>
 {description && <p className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50">{description}</p>}
 </div>
 {action && <div>{action}</div>}
 </div>
 );
}

export function SplitPane({ left, right, rightWidth = "400px" }: { left: React.ReactNode, right: React.ReactNode, rightWidth?: string }) {
 return (
 <div className="flex w-full h-full divide-x divide-black/10 dark:divide-white/10 overflow-hidden relative">
 <div className="flex-1 overflow-hidden bg-card dark:bg-[#050505] flex flex-col relative z-0">
 {left}
 </div>
 <div className="shrink-0 overflow-hidden bg-card dark:bg-[#0a0a0a] border-l border-border dark:border-white/10 relative z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.4)]" style={{ width: rightWidth }}>
 {right}
 </div>
 </div>
 );
}

export const MOCK_EXECUTION_NODES = [
 { id: "node_1", type: "planner", name: "Dhyra Planner", status: "COMPLETED", duration: "12s", agent: "GPT-4o", deps: [] },
 { id: "node_2", type: "research", name: "Research Agent", status: "COMPLETED", duration: "45s", agent: "Claude 3.5 Sonnet", deps: ["node_1"] },
 { id: "node_3", type: "coding", name: "Coding Agent", status: "RUNNING", duration: "3m 12s", agent: "Claude 3.5 Sonnet", deps: ["node_2"] },
 { id: "node_4", type: "review", name: "Security Review", status: "WAITING", duration: "-", agent: "o1-preview", deps: ["node_3"] },
 { id: "node_5", type: "approval", name: "Human Approval", status: "WAITING", duration: "-", agent: "Engineering Manager", deps: ["node_4"] },
 { id: "node_6", type: "verify", name: "Verification", status: "WAITING", duration: "-", agent: "System Verifier", deps: ["node_5"] },
];
