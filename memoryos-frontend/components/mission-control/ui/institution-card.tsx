import React from "react";
import { ShieldCheck, ShieldAlert, Activity, CheckCircle2 } from "lucide-react";
import { HoverLift } from "./animations";

export type InstitutionCardProps = {
 name: string;
 version: string;
 policyCount: number;
 health: "healthy" | "degraded" | "critical";
 className?: string;
};

export function InstitutionCard({
 name,
 version,
 policyCount,
 health,
 className = "",
}: InstitutionCardProps) {
 return (
 <HoverLift className={`group w-full bg-card border border-border rounded-[6px] p-6 ${className}`}>
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-md bg-muted border border-border text-foreground">
 <ShieldCheck className="size-5" />
 </div>
 <div>
 <h4 className="text-[14px] font-semibold text-foreground leading-tight">{name}</h4>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[10px] font-medium px-1.5 py-0.5 bg-muted text-foreground/60 rounded-[4px]">v{version}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div>
 <div className="text-[10px] text-foreground/40 font-medium uppercase mb-1">Active Policies</div>
 <div className="text-[14px] font-semibold text-foreground">{policyCount}</div>
 </div>
 <div>
 <div className="text-[10px] text-foreground/40 font-medium uppercase mb-1">System Health</div>
 <div className="text-[12px] font-medium text-foreground flex items-center gap-1.5">
 {health === "healthy" && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="size-3"/> Stable</span>}
 {health === "critical" && <span className="text-red-500 flex items-center gap-1"><ShieldAlert className="size-3"/> Critical</span>}
 {health === "degraded" && <span className="text-amber-500 flex items-center gap-1"><Activity className="size-3"/> Degraded</span>}
 </div>
 </div>
 </div>
 </HoverLift>
 );
}
