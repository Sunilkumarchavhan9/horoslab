"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, Clock, FileJson, RefreshCw, UserCheck, Code2, Cpu, ShieldCheck, Sparkles, Search, Filter, ChevronDown, Building, Rocket, History, Scale as GovIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type EpochMissionDetail } from "@/lib/epoch-api";

function stringifyLogEntry(entry: unknown): string {
 if (typeof entry === "string") return entry;
 if (entry instanceof Error) return entry.message;
 if (entry && typeof entry === "object") {
 try {
 return JSON.stringify(entry, null, 2);
 } catch {
 return "[unserializable log entry]";
 }
 }
 return String(entry);
}

function formatDuration(startedAt?: string | null, finishedAt?: string | null): string {
 if (!startedAt) return "—";
 const start = new Date(startedAt).getTime();
 if (!Number.isFinite(start)) return "—";
 const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
 if (!Number.isFinite(end) || end < start) return "—";
 const totalSeconds = Math.max(0, Math.round((end - start) / 1000));
 if (totalSeconds < 60) return `${totalSeconds}s`;
 const minutes = Math.floor(totalSeconds / 60);
 if (minutes < 60) return `${minutes}m`;
 const hours = Math.floor(minutes / 60);
 const remainingMinutes = minutes % 60;
 return `${hours}h ${remainingMinutes}m`;
}

function readState(value?: string | null): string {
 return (value ?? "draft").replace(/_/g, " ");
}

export function MissionDetailExecution({ mission }: { mission: EpochMissionDetail }) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const execution = mission.executionRun;
 const logs = Array.isArray(execution?.logs) ? execution.logs : [];
 const startedAt = execution?.startedAt ?? null;
 const finishedAt = execution?.finishedAt ?? null;
 const runtime = startedAt ? formatDuration(startedAt, finishedAt) : "Queued";
 const runStatus = finishedAt ? "Complete" : startedAt ? "Running" : "Queued";

 const checkpoints = [
 {
 label: "Planner",
 ready: Boolean(execution?.planner),
 note: execution?.planner ? "Plan output captured" : "Waiting for plan",
 icon: Cpu,
 },
 {
 label: "Executor",
 ready: Boolean(execution?.executor),
 note: execution?.executor ? "Execution output captured" : "Waiting for execution",
 icon: Code2,
 },
 {
 label: "Reviewer",
 ready: Boolean(execution?.reviewer),
 note: execution?.reviewer ? "Review output captured" : "Waiting for review",
 icon: UserCheck,
 },
 {
 label: "Human",
 ready: Boolean(execution?.human),
 note: execution?.human ? "Human checkpoint captured" : "No human checkpoint yet",
 icon: ShieldCheck,
 },
 ] as const;

 const steps = [
 {
 id: 1,
 name: "Planner",
 status: execution?.planner ? "Complete" : startedAt ? "Running" : "Pending",
 started: execution?.startedAt ?? "Not started",
 duration: runtime,
 logs: logs.length,
 output: Boolean(execution?.planner),
 icon: Cpu,
 },
 {
 id: 2,
 name: "Executor",
 status: execution?.executor ? "Complete" : startedAt ? "Running" : "Pending",
 started: execution?.startedAt ?? "Not started",
 duration: runtime,
 logs: logs.length,
 output: Boolean(execution?.executor),
 icon: Code2,
 },
 {
 id: 3,
 name: "Reviewer",
 status: execution?.reviewer ? "Complete" : finishedAt ? "Waiting" : "Pending",
 started: finishedAt ?? "Not started",
 duration: finishedAt ? "Complete" : "Pending",
 logs: logs.length,
 output: Boolean(execution?.reviewer),
 icon: UserCheck,
 },
 {
 id: 4,
 name: "Human Approval",
 status: execution?.human ? "Complete" : "Pending",
 started: "Not started",
 duration: "Pending",
 logs: 0,
 output: Boolean(execution?.human),
 icon: ShieldCheck,
 },
 ];

 return (
 <div className="w-full flex flex-col gap-6 pt-4 pb-16 px-6 font-sans">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Sparkles className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Run Status</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{runStatus}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">{readState(mission.state)}</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Clock className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Runtime</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{runtime}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">{startedAt ? "Live from the execution run" : "Waiting to start"}</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <FileJson className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Logs</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{logs.length}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Execution log entries</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <ShieldCheck className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Evidence</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{mission.evidence?.length ?? 0}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Attached to this mission</div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="flex items-center justify-between gap-6 border-b border-border bg-card px-6 py-6">
 <div>
 <h2 className="text-[18px] font-semibold text-foreground">Execution Stages</h2>
 <p className="text-[13px] text-muted-foreground">Planner, executor, reviewer, and human checkpoint state.</p>
 </div>
 <div className="text-[12px] text-muted-foreground">Run {execution?.id ?? "pending"}</div>
 </div>

 <div className="divide-y divide-[#eee]">
 {steps.map((step) => {
 const isComplete = step.status === "Complete";
 const isRunning = step.status === "Running";
 const StepIcon = step.icon;

 return (
 <div key={step.id} className="px-6 py-6 flex items-start gap-6">
 <div className={cn(
 "size-11 rounded-md flex items-center justify-center shrink-0 border",
 isComplete ? "bg-emerald-50 border-emerald-100 text-emerald-600" : isRunning ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-gray-50 border-gray-100 text-gray-400",
 )}>
 {isComplete ? <CheckCircle2 className="size-5" /> : isRunning ? <RefreshCw className="size-5 animate-spin" /> : <CircleDashed className="size-5" />}
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-6">
 <div className="flex items-center gap-3">
 <div className="size-10 rounded-md border border-border bg-muted/50 flex items-center justify-center text-muted-foreground">
 <StepIcon className="size-5" />
 </div>
 <div>
 <div className="text-[15px] font-semibold text-foreground">{step.name}</div>
 <div className="text-[13px] text-muted-foreground">{step.output ? "Output captured" : "No output yet"}</div>
 </div>
 </div>
 <span className={cn(
 "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
 isComplete ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : isRunning ? "bg-blue-50 text-blue-700 border-blue-200/50" : "bg-gray-50 text-gray-500 border-gray-200/50",
 )}>
 {step.status}
 </span>
 </div>
 <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="rounded-md border border-border bg-muted/50 p-3">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Started</div>
 <div className="mt-1 text-[13px] text-foreground">{step.started}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-3">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</div>
 <div className="mt-1 text-[13px] text-foreground">{step.duration}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-3">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Log entries</div>
 <div className="mt-1 text-[13px] text-foreground">{step.logs}</div>
 </div>
 </div>
 </div>
 <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-md transition-all" title="View Logs">
 <FileJson className="size-4" />
 </button>
 </div>
 );
 })}
 </div>
 </div>

 <div className="flex flex-col gap-6">
 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="flex items-center justify-between gap-6 border-b border-border bg-card px-6 py-6">
 <div>
 <h2 className="text-[18px] font-semibold text-foreground">Live Execution Logs</h2>
 <p className="text-[13px] text-muted-foreground">Current stream from the mission execution run.</p>
 </div>
 <div className="text-[12px] text-muted-foreground">Execution run {execution?.id ?? "pending"}</div>
 </div>

 {/* Search & Filter Toolbar */}
 <div className="flex items-center gap-4 px-6 py-3 bg-card border-b border-border shrink-0">
   <div className="flex items-center gap-2 flex-1 relative">
     <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
     <input 
       type="text" 
       placeholder="Search logs by action or evidence ID..." 
       className="w-full bg-muted/30 border border-border rounded-sm pl-9 pr-4 py-1.5 text-[13px] text-foreground focus:outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/70"
       onFocus={() => setIsSearchFocused(true)}
       onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
     />
     <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
       <span className="text-[10px] font-mono text-muted-foreground border border-border bg-card px-1.5 py-0.5 rounded-sm">⌘K</span>
     </div>

     {/* Search Dropdown Popover */}
     {isSearchFocused && (
       <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-card border border-border rounded-sm shadow-md z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
         <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
           <span className="text-[11px] font-bold text-muted-foreground">Search tips</span>
         </div>
         
         <div className="flex flex-col py-2">
           <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
             <div className="flex items-center gap-3">
               <Building className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
               <span className="text-[13px] font-medium text-foreground"><span className="font-bold">inst:</span> — Search Institutions</span>
             </div>
             <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>
           <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
             <div className="flex items-center gap-3">
               <Rocket className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
               <span className="text-[13px] font-medium text-foreground"><span className="font-bold">mis:</span> — Search Missions</span>
             </div>
             <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>
           <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
             <div className="flex items-center gap-3">
               <GovIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
               <span className="text-[13px] font-medium text-foreground"><span className="font-bold">gov:</span> — Search Governance Policies</span>
             </div>
             <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>
         </div>
       </div>
     )}
   </div>
   
   <div className="h-5 w-px bg-border shrink-0" />
   
   <div className="flex items-center gap-2 shrink-0">
     <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
       <Filter className="size-3.5" /> Mission <ChevronDown className="size-3" />
     </button>
     <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
       Worker <ChevronDown className="size-3" />
     </button>
     <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
       Time: Last 24h <ChevronDown className="size-3" />
     </button>
   </div>
 </div>

 <div className="bg-card p-6 font-mono text-[11px] leading-[1.7] text-gray-600 h-[320px] overflow-y-auto custom-scrollbar">
 <div className="text-emerald-600 font-semibold">[INFO] mission {mission.id}</div>
 <div>[INFO] title: {mission.title ?? mission.objective ?? "Untitled mission"}</div>
 <div>[INFO] state: {readState(mission.state)}</div>
 <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Execution Logs</div>
 {logs.length > 0 ? (
 logs.map((entry, index) => (
 <div key={index}>[{String(index + 1).padStart(2, "0")}] {stringifyLogEntry(entry)}</div>
 ))
 ) : (
 <>
 <div>[INFO] Planner ready.</div>
 <div>[INFO] Executor waiting for next stage.</div>
 </>
 )}
 </div>
 
 {/* Pagination Footer */}
 <div className="flex items-center justify-center py-6 bg-card shrink-0 border-t border-border">
   <div className="flex items-center border border-border rounded-sm bg-background shadow-sm overflow-hidden">
     <button className="px-3 py-1.5 hover:bg-muted/50 transition-colors border-r border-border disabled:opacity-50" disabled>
       <span className="text-[12px] font-medium text-muted-foreground tracking-widest">{'<<'}</span>
     </button>
     <button className="px-3 py-1.5 hover:bg-muted/50 transition-colors border-r border-border disabled:opacity-50" disabled>
       <span className="text-[12px] font-medium text-muted-foreground tracking-widest">{'<'}</span>
     </button>
     <button className="px-4 py-1.5 bg-muted transition-colors border-r border-border">
       <span className="text-[13px] font-medium text-foreground">1</span>
     </button>
     <button className="px-4 py-1.5 hover:bg-muted/50 transition-colors border-r border-border">
       <span className="text-[13px] font-medium text-muted-foreground">2</span>
     </button>
     <button className="px-4 py-1.5 hover:bg-muted/50 transition-colors border-r border-border">
       <span className="text-[13px] font-medium text-muted-foreground">3</span>
     </button>
     <button className="px-3 py-1.5 hover:bg-muted/50 transition-colors border-r border-border">
       <span className="text-[12px] font-medium text-muted-foreground tracking-widest">{'>'}</span>
     </button>
     <button className="px-3 py-1.5 hover:bg-muted/50 transition-colors">
       <span className="text-[12px] font-medium text-muted-foreground tracking-widest">{'>>'}</span>
     </button>
   </div>
 </div>

 </div>

 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="border-b border-border bg-card px-6 py-6">
 <h2 className="text-[18px] font-semibold text-foreground">Stage Checkpoints</h2>
 <p className="text-[13px] text-muted-foreground">What has been captured in the run so far.</p>
 </div>
 <div className="p-6 space-y-3">
 {checkpoints.map((checkpoint) => (
 <div key={checkpoint.label} className="flex items-start justify-between gap-6 rounded-md border border-border bg-muted/50 p-3">
 <div>
 <div className="text-[14px] font-semibold text-foreground">{checkpoint.label}</div>
 <div className="text-[13px] text-muted-foreground">{checkpoint.note}</div>
 </div>
 <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", checkpoint.ready ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
 {checkpoint.ready ? "Captured" : "Missing"}
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
