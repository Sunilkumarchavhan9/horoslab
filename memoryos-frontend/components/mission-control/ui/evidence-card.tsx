import React from "react";
import { FileCheck, BadgeCheck } from "lucide-react";

export type EvidenceCardProps = {
 title: string;
 type: string;
 verified: boolean;
 timestamp: string;
 className?: string;
};

export function EvidenceCard({
 title,
 type,
 verified,
 timestamp,
 className = "",
}: EvidenceCardProps) {
 return (
 <div className={`group flex items-start gap-6 p-6 bg-card border border-border rounded-[6px] hover:border-black/20 transition-colors ${className}`}>
 <div className={`p-2 rounded-md border shrink-0 ${verified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-muted border-border text-foreground/50'}`}>
 <FileCheck className="size-4" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <h4 className="text-[13px] font-semibold text-foreground truncate">{title}</h4>
 {verified && <BadgeCheck className="size-4 text-emerald-500 shrink-0" />}
 </div>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-[11px] font-medium text-foreground/50">{type}</span>
 <span className="w-1 h-1 rounded-full bg-black/20" />
 <span className="text-[11px] text-foreground/40">{timestamp}</span>
 </div>
 </div>
 </div>
 );
}
