"use client";

import React, { useState } from "react";
import { ShieldAlert, FileText, CheckCircle2, XCircle, Search, Clock, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, SplitPane } from "./execution-shared-components";

export function ExecutionHumanApprovals() {
 const [activeTab, setActiveTab] = useState("Pending");

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#050505] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar>
 <div className="flex items-center gap-6 w-1/2">
 <div className="flex bg-muted dark:bg-white/5 p-0.5 rounded-md border border-border dark:border-white/10">
 {["Pending", "Approved", "Rejected", "Expired"].map(tab => (
 <button 
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn(
 "px-6 py-1.5 rounded-md text-[13px] font-medium transition-all",
 activeTab === tab ? "bg-card dark:bg-[#121212] text-foreground dark:text-[#F0EFE2] " : "text-foreground/50 dark:text-[#F0EFE2]/50 hover:text-foreground dark:hover:text-[#F0EFE2]"
 )}
 >
 {tab}
 {tab === "Pending" && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px]">1</span>}
 </button>
 ))}
 </div>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-hidden relative">
 <SplitPane 
 rightWidth="500px"
 left={
 <div className="flex flex-col h-full p-8">
 <SectionHeader 
 title="Approval Center" 
 description="High-risk actions requiring explicit human authorization."
 />

 <div className="flex flex-col gap-6">
 <div className="bg-card dark:bg-[#0a0a0a] border border-amber-500/30 rounded-md overflow-hidden shadow-[0_4px_30px_rgba(245,158,11,0.05)] cursor-pointer hover:border-amber-500/50 transition-colors">
 <div className="p-6 flex items-center justify-between border-b border-border dark:border-white/5 bg-amber-500/5">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
 <ShieldAlert className="size-4" />
 </div>
 <div className="flex flex-col">
 <h3 className="text-[16px] font-bold">Deploy Production</h3>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">Requested by Dhyra Planner</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
 <Clock className="size-3" /> Waiting
 </span>
 </div>
 </div>

 <div className="p-6 flex flex-col gap-6">
 <div className="grid grid-cols-2 gap-6">
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40">Mission</span>
 <span className="text-[13px] font-semibold text-[#0f52ff]">#193 Update SDK</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40">Policy</span>
 <span className="text-[13px] font-mono text-foreground dark:text-[#F0EFE2]">require_human_prod</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40">Risk Level</span>
 <span className="text-[13px] font-bold text-red-500">HIGH</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 dark:text-[#F0EFE2]/40">Approver Role</span>
 <span className="text-[13px] font-semibold text-foreground dark:text-[#F0EFE2]">Engineering Manager</span>
 </div>
 </div>

 <div className="mt-2 flex items-center gap-3">
 <button className="flex-1 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-[#F0EFE2] text-[13px] font-bold transition-colors">
 Approve Action
 </button>
 <button className="flex-1 py-2 rounded-md bg-muted dark:bg-white/5 border border-border dark:border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-foreground dark:text-[#F0EFE2] text-[13px] font-bold transition-colors">
 Reject
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 }
 right={
 <div className="flex flex-col h-full bg-card dark:bg-[#121212]">
 <div className="p-6 border-b border-border dark:border-white/10 shrink-0">
 <h3 className="text-[16px] font-bold tracking-tight">Evidence Context</h3>
 <p className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50 mt-1">Review the execution chain before deciding</p>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
 <div>
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0f52ff]/70 mb-3 flex items-center gap-1.5">
 <FileText className="size-3" /> Reason for Request
 </h4>
 <div className="text-[13px] text-foreground/70 dark:text-[#F0EFE2]/70 bg-[#0f52ff]/5 border border-[#0f52ff]/10 p-6 rounded-md">
 "I have successfully patched the authentication vulnerability and passed all automated security scans. The policy `require_human_prod` dictates that an Engineering Manager must review the artifact before deployment to the production EKS cluster."
 </div>
 </div>

 <div>
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-3 flex items-center gap-1.5">
 <FileJson className="size-3" /> Execution Payload
 </h4>
 <div className="bg-[#050505] rounded-md p-6 font-mono text-[11px] text-emerald-400 overflow-x-auto">
 <pre>
{`{
 "action": "aws:eks:updateCluster",
 "target": "prod-cluster-us-east",
 "image": "registry/auth-service:v2.4.1",
 "pre_checks": {
 "security_scan": "PASS",
 "unit_tests": "PASS"
 }
}`}
 </pre>
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
