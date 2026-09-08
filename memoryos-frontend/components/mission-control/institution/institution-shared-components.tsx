import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";

export function StatusBadge({ status }: { status: "ACTIVE" | "DEGRADED" | "OFFLINE" | "PAUSED" }) {
 if (status === "ACTIVE") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold tracking-wider">
 <span className="relative flex h-1.5 w-1.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
 </span>
 ACTIVE
 </div>
 );
 }
 if (status === "DEGRADED") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold tracking-wider">
 <div className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
 DEGRADED
 </div>
 );
 }
 if (status === "OFFLINE") {
 return (
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-wider opacity-70">
 <div className="size-1.5 rounded-full bg-red-500" />
 OFFLINE
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

export function CommandBar({ children, className }: { children: React.ReactNode; className?: string }) {
 return (
 <div className={cn("flex items-center justify-between px-6 py-2 border-b border-border dark:border-white/10 bg-card dark:bg-[#121212]", className)}>
 {children}
 </div>
 );
}

export function SplitPane({ left, right, leftWidth = "300px" }: { left: React.ReactNode, right: React.ReactNode, leftWidth?: string }) {
 return (
 <div className="flex w-full h-full divide-x divide-black/10 dark:divide-white/10 overflow-hidden">
 <div className="shrink-0 overflow-y-auto custom-scrollbar bg-card dark:bg-[#0a0a0a]" style={{ width: leftWidth }}>
 {left}
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar bg-card dark:bg-[#050505]">
 {right}
 </div>
 </div>
 );
}

export function SectionHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
 return (
 <div className="flex items-start justify-between mb-6">
 <div className="flex flex-col gap-1">
 <h2 className="text-[20px] font-semibold text-foreground dark:text-[#F0EFE2] tracking-tight">{title}</h2>
 {description && <p className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50">{description}</p>}
 </div>
 {action && <div>{action}</div>}
 </div>
 );
}
