"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function CommandBar({ children, className }: { children?: React.ReactNode; className?: string }) {
 return (
 <div className={cn("flex items-center justify-between px-6 py-3 border-b border-border dark:border-white/10 bg-card/70 dark:bg-[#050505]/70 backdrop-blur-xl shrink-0 sticky top-0 z-50", className)}>
 {children}
 </div>
 );
}

export function SectionHeader({ title, description, action, className }: { title: string, description?: string, action?: React.ReactNode, className?: string }) {
 return (
 <div className={cn("flex items-start justify-between mb-8 shrink-0 relative", className)}>
 <div className="absolute -inset-8 bg-gradient-to-b from-[#0f52ff]/5 to-transparent opacity-50 pointer-events-none" />
 <div className="flex flex-col gap-1.5 relative z-10">
 <h2 className="text-[24px] font-bold text-foreground dark:text-white tracking-tight leading-none">{title}</h2>
 {description && <p className="text-[14px] text-foreground/50 dark:text-white/50 max-w-2xl">{description}</p>}
 </div>
 {action && <div className="relative z-10">{action}</div>}
 </div>
 );
}

export function SplitPane({ left, right, rightWidth = "420px" }: { left: React.ReactNode, right: React.ReactNode, rightWidth?: string }) {
 return (
 <div className="flex w-full h-full divide-x divide-black/10 dark:divide-white/10 overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,rgba(15,82,255,0.03)_0%,transparent_50%)]">
 <div className="flex-1 overflow-hidden flex flex-col relative z-0">
 {left}
 </div>
 <div className="shrink-0 overflow-hidden bg-card/50 dark:bg-[#0a0a0a]/50 backdrop-blur-3xl border-l border-border dark:border-white/10 relative z-10 shadow-[-10px_0_40px_rgba(0,0,0,0.05)] dark:shadow-[-10px_0_40px_rgba(0,0,0,0.4)]" style={{ width: rightWidth }}>
 {right}
 </div>
 </div>
 );
}

export function KPICard({ title, value, subtext, trend, trendValue, index = 0 }: { title: string, value: string | React.ReactNode, subtext?: string, trend?: "up" | "down" | "neutral", trendValue?: string, index?: number }) {
 return (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
 className="bg-card/60 dark:bg-[#121212]/60 backdrop-blur-md border border-border dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 rounded-md p-6 flex flex-col gap-2 relative overflow-hidden group hover:"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
 <span className="text-[12px] font-bold uppercase tracking-widest text-foreground/50 dark:text-white/50 z-10">{title}</span>
 <div className="flex items-end justify-between mt-2 z-10">
 <span className="text-[32px] font-mono font-bold text-foreground dark:text-white leading-none tracking-tight">{value}</span>
 {trend && (
 <div className={cn(
 "text-[12px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm",
 trend === "up" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
 trend === "down" ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" :
 "text-foreground/60 dark:text-white/60 bg-muted dark:bg-white/5 border-border dark:border-white/10"
 )}>
 {trend === "up" ? "↑" : trend === "down" ? "↓" : "-"} {trendValue}
 </div>
 )}
 </div>
 {subtext && <span className="text-[12px] text-foreground/40 dark:text-white/40 mt-1 z-10">{subtext}</span>}
 </motion.div>
 );
}

// Global Mock Data for Governance
export const MOCK_AUTHORITY_GRANTS = [
 { id: "g_1", target: "Claude Reviewer", scope: "GitHub PRs", risk: "LOW", status: "ACTIVE", grantedAt: "2026-07-24T10:00:00Z" },
 { id: "g_2", target: "Deploy Agent", scope: "Production EKS", risk: "HIGH", status: "PENDING", grantedAt: "2026-07-25T14:30:00Z" },
 { id: "g_3", target: "Finance Agent", scope: "Stripe API", risk: "CRITICAL", status: "REVOKED", grantedAt: "2026-07-10T09:15:00Z" },
 { id: "g_4", target: "Data Sync Worker", scope: "Snowflake Read", risk: "MEDIUM", status: "ACTIVE", grantedAt: "2026-07-26T08:00:00Z" },
];

export const MOCK_AUDIT_LOGS = [
 { id: "a_981", timestamp: "2026-07-26T12:00:01Z", actor: "Engineering Manager", action: "Approved HIGH RISK Grant", target: "Deploy Agent", signature: "0x8f...4a2b" },
 { id: "a_980", timestamp: "2026-07-26T11:58:22Z", actor: "Policy Engine", action: "Denied Auto-Deploy", target: "Deploy Agent", signature: "0x3b...9c1d" },
 { id: "a_979", timestamp: "2026-07-26T11:45:00Z", actor: "Claude Reviewer", action: "Read Repository", target: "github/core-api", signature: "0x1a...f55e" },
 { id: "a_978", timestamp: "2026-07-26T10:12:34Z", actor: "System Verifier", action: "Validated Signature", target: "Deploy Payload", signature: "0x9d...22b1" },
];
