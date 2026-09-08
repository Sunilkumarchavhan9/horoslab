import React from "react";
import { Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ApprovalCardProps = {
 title: string;
 requester: string;
 timestamp: string;
 status: "pending" | "approved" | "rejected";
 onApprove?: () => void;
 onReject?: () => void;
 className?: string;
};

export function ApprovalCard({
 title,
 requester,
 timestamp,
 status,
 onApprove,
 onReject,
 className = "",
}: ApprovalCardProps) {
 return (
 <div className={`w-full bg-card border border-border rounded-[6px] p-6 flex flex-col ${className}`}>
 <div className="flex items-start justify-between mb-4 gap-6">
 <div>
 <h4 className="text-[14px] font-semibold text-foreground leading-tight mb-1">{title}</h4>
 <div className="flex items-center gap-2 text-[11px] text-foreground/50">
 <span>Requested by <strong className="text-foreground/70 font-medium">{requester}</strong></span>
 <span className="w-1 h-1 rounded-full bg-black/20" />
 <span className="flex items-center gap-1"><Clock className="size-3" /> {timestamp}</span>
 </div>
 </div>
 
 {status === "pending" && (
 <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[10px] font-semibold uppercase tracking-wider">
 Pending
 </span>
 )}
 {status === "approved" && (
 <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-semibold uppercase tracking-wider">
 Approved
 </span>
 )}
 {status === "rejected" && (
 <span className="px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full text-[10px] font-semibold uppercase tracking-wider">
 Rejected
 </span>
 )}
 </div>

 {status === "pending" && (
 <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
 <Button 
 onClick={onApprove}
 className="flex-1 bg-[#111] hover:bg-black text-[#F0EFE2] h-8 text-[12px] font-medium rounded-[4px]"
 >
 <Check className="size-3.5 mr-1.5" /> Approve
 </Button>
 <Button 
 onClick={onReject}
 variant="outline"
 className="flex-1 h-8 text-[12px] font-medium border-border text-foreground rounded-[4px]"
 >
 <X className="size-3.5 mr-1.5" /> Reject
 </Button>
 </div>
 )}
 </div>
 );
}
