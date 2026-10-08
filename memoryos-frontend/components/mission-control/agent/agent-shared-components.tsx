"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, AlertCircle, Clock, CheckCircle2, ShieldCheck, Activity, Terminal } from "lucide-react";

export type AgentStatus = "RUNNING" | "WAITING" | "FAILED" | "REVIEWING" | "ACTIVE" | "PAUSED";

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
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
 if (status === "ACTIVE") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold tracking-wider">
 <div className="size-1.5 rounded-full bg-emerald-500" />
 ACTIVE
 </div>
 );
 }
 if (status === "WAITING") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold tracking-wider">
 <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
 WAITING
 </div>
 );
 }
 if (status === "REVIEWING") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0f52ff]/10 border border-[#0f52ff]/20 text-[#0f52ff] text-[10px] font-bold tracking-wider">
 <div className="size-1.5 rounded-full bg-[#0f52ff] shadow-[0_0_8px_rgba(15,82,255,0.8)]" />
 REVIEWING
 </div>
 );
 }
 if (status === "FAILED") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-wider opacity-90">
 <div className="size-1.5 rounded-full bg-red-500" />
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

export function SectionHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
 return (
 <div className="flex items-start justify-between mb-6 shrink-0">
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
 <div className="flex-1 overflow-y-auto custom-scrollbar bg-card dark:bg-[#050505] flex flex-col relative z-0">
 {left}
 </div>
 <div className="shrink-0 overflow-y-auto custom-scrollbar bg-card dark:bg-[#0a0a0a] border-l border-border dark:border-white/10 relative z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.4)]" style={{ width: rightWidth }}>
 {right}
 </div>
 </div>
 );
}

// Mock Data Models
export const MOCK_AGENTS = [
 {
 id: "agt_rev_01",
 name: "Claude Reviewer",
 status: "ACTIVE" as AgentStatus,
 institution: "Engineering",
 provider: "Anthropic (Claude 3.5 Sonnet)",
 capabilities: ["Code Review", "Security"],
 currentMission: "#193",
 health: 98,
 lastActivity: "15 sec ago",
 team: "Core Platform"
 },
 {
 id: "agt_plan_02",
 name: "HOROS Planner",
 status: "RUNNING" as AgentStatus,
 institution: "Engineering",
 provider: "OpenAI (GPT-4o)",
 capabilities: ["Planning", "System Architecture"],
 currentMission: "#194",
 health: 100,
 lastActivity: "Live",
 team: "Architecture"
 },
 {
 id: "agt_sec_03",
 name: "Security Verifier",
 status: "WAITING" as AgentStatus,
 institution: "Security Auditing",
 provider: "OpenAI (o1-preview)",
 capabilities: ["Pen Testing", "Audit"],
 currentMission: "#193",
 health: 100,
 lastActivity: "2 mins ago",
 team: "Red Team"
 },
 {
 id: "agt_hr_04",
 name: "Onboarding Coordinator",
 status: "PAUSED" as AgentStatus,
 institution: "HR Onboarding",
 provider: "Anthropic (Claude 3 Haiku)",
 capabilities: ["Email", "Scheduling"],
 currentMission: "None",
 health: 99,
 lastActivity: "4 hrs ago",
 team: "People"
 }
];
