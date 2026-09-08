"use client";

import React, { useState } from "react";
import { Key, ShieldAlert, Clock, GitCommit, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, SplitPane } from "./agent-shared-components";

const MOCK_LEASES = [
 { id: "lease_01", agent: "Claude Reviewer", institution: "Engineering", capability: "Deploy Production", budget: "$15.00", expires: "5 min", status: "ACTIVE" },
 { id: "lease_02", agent: "Epoch Planner", institution: "Architecture", capability: "Read IAM Roles", budget: "Unlimited", expires: "2 hrs", status: "ACTIVE" },
 { id: "lease_03", agent: "Security Verifier", institution: "Red Team", capability: "Pen Test Core", budget: "$100.00", expires: "Expired", status: "EXPIRED" },
 { id: "lease_04", agent: "Onboarding Coordinator", institution: "People", capability: "Send Emails", budget: "500 ops", expires: "45 min", status: "REVOKED" },
];

export function AgentsCapabilityLeases() {
 const [selectedLease, setSelectedLease] = useState(MOCK_LEASES[0].id);

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#0a0a0a] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar>
 <div className="flex items-center gap-6 w-1/2">
 <div className="relative w-full max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40 dark:text-[#F0EFE2]/40" />
 <input 
 type="text" 
 placeholder="Search leases or capabilities..." 
 className="w-full bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-md h-9 pl-9 pr-4 text-[13px] focus:outline-none focus:border-[#0f52ff]/50"
 />
 </div>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-hidden relative">
 <SplitPane 
 rightWidth="450px"
 left={
 <div className="flex flex-col h-full p-8 bg-card dark:bg-[#050505]">
 <SectionHeader 
 title="Capability Leases" 
 description="Manage temporary, scoped credentials granted to agents for specific missions."
 />
 
 <div className="border border-border dark:border-white/10 rounded-md bg-card dark:bg-[#0a0a0a] overflow-hidden">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-border dark:border-white/10 bg-muted dark:bg-white/5">
 <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50">Agent</th>
 <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50">Institution</th>
 <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50">Capability</th>
 <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50">Budget</th>
 <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50">Expires</th>
 <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50">Status</th>
 </tr>
 </thead>
 <tbody>
 {MOCK_LEASES.map(lease => (
 <tr 
 key={lease.id} 
 onClick={() => setSelectedLease(lease.id)}
 className={cn(
 "border-b border-border dark:border-white/5 cursor-pointer transition-colors group",
 selectedLease === lease.id ? "bg-[#0f52ff]/5" : "hover:bg-muted/50 dark:hover:bg-card/[0.02]"
 )}
 >
 <td className="px-6 py-6 text-[13px] font-medium group-hover:text-[#0f52ff] transition-colors">{lease.agent}</td>
 <td className="px-6 py-6 text-[13px] text-foreground/70 dark:text-[#F0EFE2]/70">{lease.institution}</td>
 <td className="px-6 py-6 text-[13px] font-mono text-[#0f52ff]">{lease.capability}</td>
 <td className="px-6 py-6 text-[13px] font-mono text-foreground/60 dark:text-[#F0EFE2]/60">{lease.budget}</td>
 <td className="px-6 py-6 text-[13px] font-mono text-foreground/60 dark:text-[#F0EFE2]/60">{lease.expires}</td>
 <td className="px-6 py-6">
 <span className={cn(
 "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
 lease.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" :
 lease.status === "EXPIRED" ? "bg-black/10 dark:bg-white/10 text-foreground/50 dark:text-[#F0EFE2]/50" :
 "bg-red-500/10 text-red-500"
 )}>
 {lease.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 }
 right={
 <div className="flex flex-col h-full bg-card dark:bg-[#0a0a0a]">
 <div className="p-6 border-b border-border dark:border-white/10 shrink-0 bg-card dark:bg-[#121212]">
 <div className="flex items-center gap-2 mb-2">
 <div className="p-2 bg-[#0f52ff]/10 text-[#0f52ff] rounded-md">
 <Key className="size-5" />
 </div>
 <h3 className="text-[18px] font-bold tracking-tight">Deploy Production</h3>
 </div>
 <p className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">Temporary access lease granted for Mission #193 execution.</p>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
 {/* Authority Chain */}
 <div>
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-4">Authority Chain</h4>
 <div className="bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md p-6 font-mono text-[13px] flex flex-col gap-3 relative">
 <div className="absolute left-[31px] top-8 bottom-8 w-px bg-black/10 dark:bg-white/10" />
 
 <div className="flex items-center gap-3 relative z-10">
 <div className="size-6 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center border border-border dark:border-white/10 shrink-0">
 <ShieldAlert className="size-3" />
 </div>
 <span className="text-foreground/50 dark:text-[#F0EFE2]/50">Granted By:</span>
 <span className="text-foreground dark:text-[#F0EFE2] font-semibold">Alice (DevOps Lead)</span>
 </div>
 <div className="flex items-center gap-3 relative z-10">
 <div className="size-6 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center border border-border dark:border-white/10 shrink-0">
 <GitCommit className="size-3" />
 </div>
 <span className="text-foreground/50 dark:text-[#F0EFE2]/50">Mission:</span>
 <span className="text-[#0f52ff]">#193 Review SDK</span>
 </div>
 <div className="flex items-center gap-3 relative z-10">
 <div className="size-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shrink-0">
 <ShieldCheck className="size-3" />
 </div>
 <span className="text-foreground/50 dark:text-[#F0EFE2]/50">Policy:</span>
 <span className="text-emerald-500">Auto-approve minor deploys</span>
 </div>
 </div>
 </div>

 {/* Scope */}
 <div>
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-4">Granted Scope</h4>
 <div className="flex flex-col gap-2">
 <div className="flex items-center justify-between p-3 rounded-md bg-emerald-500/5 border border-emerald-500/10">
 <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-mono">aws:eks:updateCluster</span>
 <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Allowed</span>
 </div>
 <div className="flex items-center justify-between p-3 rounded-md bg-emerald-500/5 border border-emerald-500/10">
 <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-mono">github:repo:mergePR</span>
 <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Allowed</span>
 </div>
 <div className="flex items-center justify-between p-3 rounded-md bg-red-500/5 border border-red-500/10">
 <span className="text-[13px] text-red-600 dark:text-red-400 font-mono">aws:iam:*</span>
 <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Blocked</span>
 </div>
 </div>
 </div>

 {/* Limits */}
 <div className="grid grid-cols-2 gap-6">
 <div className="p-6 bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 block mb-1">Budget Used</span>
 <span className="text-[18px] font-mono font-bold">$12.45 / $15.00</span>
 </div>
 <div className="p-6 bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 block mb-1">Time Remaining</span>
 <span className="text-[18px] font-mono font-bold text-amber-500 flex items-center gap-1">
 <Clock className="size-4" /> 04:22
 </span>
 </div>
 </div>
 </div>
 </div>
 }
 />
 </div>
 </div>
 );
}
