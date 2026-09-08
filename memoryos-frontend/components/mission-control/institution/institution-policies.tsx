"use client";

import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, Database, CreditCard, XSquare, FileOutput, Users, ArrowRight, GitCommit } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./institution-shared-components";

const POLICY_GROUPS = [
 {
 id: "authority",
 title: "Authority",
 description: "Rules governing what this institution and its agents are allowed to do.",
 icon: <ShieldAlert className="size-5 text-amber-500" />,
 policies: [
 { id: "p1", name: "Require human approval for external requests", status: "Active", severity: "High" },
 { id: "p2", name: "Max 50 API calls per minute", status: "Active", severity: "Medium" },
 ]
 },
 {
 id: "evidence",
 title: "Evidence",
 description: "Requirements for logging, tracing, and storing proofs of work.",
 icon: <Database className="size-5 text-[#0f52ff]" />,
 policies: [
 { id: "p3", name: "Store all LLM prompts in audit log", status: "Active", severity: "High" },
 { id: "p4", name: "Retain evidence for 90 days", status: "Active", severity: "Low" },
 ]
 },
 {
 id: "budget",
 title: "Budget",
 description: "Financial and compute constraints placed on the institution.",
 icon: <CreditCard className="size-5 text-emerald-500" />,
 policies: [
 { id: "p5", name: "Max $50 daily spend limit", status: "Active", severity: "High" },
 ]
 },
 {
 id: "verification",
 title: "Verification",
 description: "Rules for reviewing and verifying output before settlement.",
 icon: <ShieldCheck className="size-5 text-purple-500" />,
 policies: [
 { id: "p6", name: "Auto-verify low risk missions", status: "Active", severity: "Medium" },
 ]
 }
];

export function InstitutionPolicies() {
 const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

 if (selectedPolicyId) {
 const allPolicies = POLICY_GROUPS.flatMap(g => g.policies);
 const policy = allPolicies.find(p => p.id === selectedPolicyId);
 
 if (!policy) return null;

 return (
 <div className="flex flex-col h-full bg-card dark:bg-[#050505] overflow-hidden">
 <div className="px-8 py-6 border-b border-border dark:border-white/10 shrink-0 bg-card dark:bg-[#0a0a0a]">
 <button 
 onClick={() => setSelectedPolicyId(null)}
 className="flex items-center gap-1.5 text-foreground/50 dark:text-[#F0EFE2]/50 hover:text-foreground dark:text-[#F0EFE2] transition-colors text-[13px] font-medium mb-4"
 >
 ← Back to Policies
 </button>
 <div className="flex items-start justify-between">
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-3">
 <h1 className="text-[24px] font-semibold text-foreground dark:text-[#F0EFE2] tracking-tight">{policy.name}</h1>
 <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[11px] font-bold uppercase tracking-wider">Active</span>
 </div>
 <p className="text-foreground/60 dark:text-[#F0EFE2]/60 text-[14px] max-w-2xl">
 This policy enforces strict constraints on the agent's behavior during mission execution. Any violations will immediately halt the mission and require human intervention.
 </p>
 </div>
 <button className="px-6 py-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:bg-white/20 text-foreground dark:text-[#F0EFE2] rounded-md text-[13px] font-medium transition-colors">
 Edit Policy
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
 <div className="max-w-4xl grid grid-cols-3 gap-8">
 <div className="col-span-2 space-y-8">
 <div>
 <h3 className="text-[14px] font-semibold text-foreground dark:text-[#F0EFE2] mb-4">Revision History</h3>
 <div className="space-y-4">
 {[1, 2, 3].map(i => (
 <div key={i} className="p-6 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5 flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="size-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
 <Users className="size-3 text-foreground/70 dark:text-[#F0EFE2]/70" />
 </div>
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">Alice Engineer</span>
 <span className="text-[13px] text-foreground/40 dark:text-[#F0EFE2]/40">updated this policy</span>
 </div>
 <span className="text-[12px] text-foreground/40 dark:text-[#F0EFE2]/40">{i * 2} days ago</span>
 </div>
 <div className="p-3 rounded-md bg-black/40 border border-border dark:border-white/5 font-mono text-[12px] text-foreground/70 dark:text-[#F0EFE2]/70">
 - Max spend: $100<br/>
 + Max spend: $50
 </div>
 <div className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60">
 <strong className="text-foreground/90 dark:text-[#F0EFE2]/90 font-medium">Reason:</strong> Budget cuts for Q3 required lowering the daily spend limits across all non-critical institutions.
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="col-span-1 space-y-6">
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5">
 <h3 className="text-[13px] font-semibold text-foreground dark:text-[#F0EFE2] mb-3">Affected Missions</h3>
 <div className="space-y-2">
 <div className="flex items-center justify-between text-[13px]">
 <span className="text-foreground/60 dark:text-[#F0EFE2]/60">Running Missions</span>
 <span className="text-foreground dark:text-[#F0EFE2] font-mono">14</span>
 </div>
 <div className="flex items-center justify-between text-[13px]">
 <span className="text-foreground/60 dark:text-[#F0EFE2]/60">Blocked by Policy</span>
 <span className="text-amber-500 font-mono">2</span>
 </div>
 </div>
 <button className="w-full mt-4 py-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:bg-white/20 text-foreground dark:text-[#F0EFE2] rounded-md text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5">
 View Blocked Missions <ArrowRight className="size-3.5" />
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-8 bg-card dark:bg-[#050505]">
 <SectionHeader 
 title="Institution Policies" 
 description="Like branch protection rules for your operational units. These policies constrain behavior, enforce evidence collection, and manage budgets."
 />

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
 {POLICY_GROUPS.map(group => (
 <div key={group.id} className="flex flex-col rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] overflow-hidden">
 <div className="p-6 border-b border-border dark:border-white/10 flex flex-col gap-2 bg-card/[0.02]">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-md bg-muted dark:bg-white/5 border border-border dark:border-white/10">
 {group.icon}
 </div>
 <h3 className="text-[16px] font-semibold text-foreground dark:text-[#F0EFE2] tracking-tight">{group.title}</h3>
 </div>
 <p className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50">{group.description}</p>
 </div>
 <div className="flex flex-col p-2">
 {group.policies.map(policy => (
 <div 
 key={policy.id} 
 onClick={() => setSelectedPolicyId(policy.id)}
 className="flex items-center justify-between p-3 rounded-md hover:bg-accent dark:bg-white/5 cursor-pointer transition-colors group/item"
 >
 <div className="flex flex-col gap-1">
 <span className="text-[13px] font-medium text-foreground/90 dark:text-[#F0EFE2]/90 group-hover/item:text-[#0f52ff] transition-colors">{policy.name}</span>
 <span className="text-[11px] text-foreground/40 dark:text-[#F0EFE2]/40 uppercase tracking-wider">{policy.severity} severity</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">{policy.status}</span>
 <ArrowRight className="size-4 text-foreground/30 dark:text-[#F0EFE2]/30 group-hover/item:text-foreground dark:text-[#F0EFE2] transition-colors" />
 </div>
 </div>
 ))}
 <button className="flex items-center gap-2 p-3 mt-2 text-[13px] font-medium text-foreground/50 dark:text-[#F0EFE2]/50 hover:text-foreground dark:text-[#F0EFE2] transition-colors rounded-md hover:bg-accent dark:bg-white/5 border border-dashed border-border dark:border-white/10">
 <PlusIcon className="size-4" /> Add {group.title} Policy
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}

function PlusIcon(props: any) {
 return (
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
 <path d="M5 12h14" />
 <path d="M12 5v14" />
 </svg>
 );
}
