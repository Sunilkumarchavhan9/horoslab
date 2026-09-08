"use client";

import React from "react";
import { MessageSquare, GitCommit, FileText, CheckCircle2, AlertTriangle, AlertCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, SplitPane } from "./execution-shared-components";

export function ExecutionReviews() {
 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#050505] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar className="border-b-0" />

 <div className="flex-1 overflow-hidden relative">
 <SplitPane 
 rightWidth="400px"
 left={
 <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-8">
 <SectionHeader 
 title="Reviews & Evaluation" 
 description="Worker outputs pending verification by automated Reviewers."
 />

 <div className="flex flex-col gap-6 max-w-4xl">
 {/* Active Review Card */}
 <div className="bg-card dark:bg-[#0a0a0a] border border-[#0f52ff]/30 shadow-[0_4px_30px_rgba(15,82,255,0.05)] rounded-md overflow-hidden relative">
 <div className="absolute top-0 left-0 w-1 h-full bg-[#0f52ff]" />
 <div className="p-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-full bg-[#0f52ff]/10 text-[#0f52ff] flex items-center justify-center">
 <MessageSquare className="size-4" />
 </div>
 <div className="flex flex-col">
 <h3 className="text-[16px] font-bold">Security Review</h3>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">Evaluating output from Coding Agent</span>
 </div>
 </div>
 <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#0f52ff]/20 bg-[#0f52ff]/10 text-[#0f52ff] text-[11px] font-bold uppercase tracking-wider animate-pulse">
 REVIEWING
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6 mt-6">
 <div className="p-6 bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-md">
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-3 flex items-center gap-1.5"><GitCommit className="size-3" /> Output Diff</h4>
 <div className="font-mono text-[11px] space-y-1">
 <div className="text-red-500">- const apiKey = "sk-12345";</div>
 <div className="text-emerald-500">+ const apiKey = process.env.API_KEY;</div>
 <div className="text-foreground/50 dark:text-[#F0EFE2]/50">&nbsp;&nbsp;await db.connect(apiKey);</div>
 </div>
 </div>
 <div className="p-6 bg-[#0f52ff]/5 border border-[#0f52ff]/10 rounded-md">
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0f52ff]/70 mb-3 flex items-center gap-1.5"><FileText className="size-3" /> Reviewer Notes</h4>
 <div className="text-[12px] text-foreground/70 dark:text-[#F0EFE2]/70 space-y-2">
 <p>Analyzing commit for common vulnerabilities...</p>
 <ul className="list-disc pl-4 space-y-1 text-foreground/50 dark:text-[#F0EFE2]/50">
 <li>Secrets exposure: <span className="text-emerald-500">Fixed</span></li>
 <li>SQL Injection: <span className="text-amber-500 animate-pulse">Scanning...</span></li>
 </ul>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Completed Review Card */}
 <div className="bg-card dark:bg-[#0a0a0a] border border-border dark:border-white/10 rounded-md overflow-hidden relative">
 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
 <div className="p-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
 <CheckCircle2 className="size-4" />
 </div>
 <div className="flex flex-col">
 <h3 className="text-[16px] font-bold">Architecture Review</h3>
 <span className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">Evaluating output from Planner</span>
 </div>
 </div>
 <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[11px] font-bold uppercase tracking-wider">
 APPROVED
 </div>
 </div>
 
 <div className="text-[13px] text-foreground/60 dark:text-[#F0EFE2]/60 bg-muted dark:bg-white/5 p-6 rounded-md">
 "The execution graph correctly isolates the coding environment from the deployment agent. Proceeding with execution."
 </div>
 </div>
 </div>
 </div>
 </div>
 }
 right={
 <div className="flex flex-col h-full bg-card dark:bg-[#121212]">
 <div className="p-6 border-b border-border dark:border-white/10 shrink-0">
 <h3 className="text-[16px] font-bold tracking-tight">Review Requirements</h3>
 <p className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50 mt-1">Policy gates for this mission</p>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
 <div>
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50 dark:text-[#F0EFE2]/50 mb-3">Required Checks</h4>
 <div className="flex flex-col gap-2">
 <div className="flex items-center justify-between p-3 rounded-md border border-emerald-500/20 bg-emerald-500/5">
 <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">Architecture</span>
 <CheckCircle2 className="size-4 text-emerald-500" />
 </div>
 <div className="flex items-center justify-between p-3 rounded-md border border-[#0f52ff]/20 bg-[#0f52ff]/5">
 <span className="text-[13px] font-semibold text-[#0f52ff]">Security</span>
 <span className="text-[11px] font-bold text-[#0f52ff] uppercase tracking-wider animate-pulse">Running</span>
 </div>
 <div className="flex items-center justify-between p-3 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5 opacity-50">
 <span className="text-[13px] font-semibold text-foreground dark:text-[#F0EFE2]">Human Approval</span>
 <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
 </div>
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
