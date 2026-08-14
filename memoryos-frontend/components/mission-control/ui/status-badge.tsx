import React from "react";
import { RealtimeIndicator } from "./realtime-indicator";

export type StatusBadgeProps = {
 status: "running" | "idle" | "error" | "success" | "pending";
 className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
 const styles = {
 running: "bg-[#0f52ff]/10 text-[#0f52ff] border-[#0f52ff]/20",
 idle: "bg-muted text-foreground/60 border-border",
 error: "bg-red-500/10 text-red-600 border-red-500/20",
 success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
 pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
 };

 return (
 <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] border text-[11px] font-semibold uppercase tracking-wider ${styles[status]} ${className}`}>
 {status === "running" && <RealtimeIndicator className="mr-0.5" />}
 {status}
 </div>
 );
}
