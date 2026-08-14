"use client";

import React from "react";
import { History, TrendingUp, GitCommit, FileCode2, Zap, AlertTriangle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./institution-shared-components";

const EVOLUTION_TIMELINE = [
 { id: "e1", type: "mutation", version: "v9", fitness: 91, description: "Auto-mutation: Reduced verification latency by parallelizing reviews.", date: "1 day ago", success: true },
 { id: "e2", type: "simulation", version: "sim", fitness: 88, description: "Simulation: Testing stricter evidence policies against historical missions.", date: "2 days ago", success: true },
 { id: "e3", type: "approval", version: "v8", fitness: 78, description: "Human Approval: Alice authorized budget increase.", date: "1 week ago", success: true },
 { id: "e4", type: "mutation", version: "v7", fitness: 65, description: "Auto-mutation: Attempted to remove human-in-loop. Failed safety constraints.", date: "2 weeks ago", success: false },
];

export function InstitutionEvolution() {
 return (
 <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-8 bg-card dark:bg-[#050505]">
 <SectionHeader 
 title="Institution Evolution" 
 description="Track how this institution adapts over time through human approvals, simulations, and automated mutations."
 action={
 <button className="px-6 py-2 bg-[#0f52ff] hover:bg-[#0042e6] text-foreground dark:text-white rounded-md text-[13px] font-medium transition-colors">
 Run Simulation
 </button>
 }
 />

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
 
 {/* Left Column: Fitness Graph & Stats */}
 <div className="lg:col-span-2 space-y-8">
 
 {/* Fitness Chart Area (Mock) */}
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] p-6 h-[320px] flex flex-col relative overflow-hidden group">
 <div className="flex items-start justify-between mb-6 relative z-10">
 <div className="flex flex-col">
 <h3 className="text-[14px] font-semibold text-foreground dark:text-white">Fitness Score</h3>
 <span className="text-[12px] text-foreground/50 dark:text-white/50">Overall capability and safety score</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[24px] font-bold text-emerald-500">91</span>
 <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px] font-bold">
 <ArrowUpRight className="size-3" /> 16%
 </div>
 </div>
 </div>
 
 {/* Mock Chart Visualization */}
 <div className="flex-1 relative w-full mt-4 border-l border-b border-border dark:border-white/10 flex items-end">
 {/* Y Axis Labels */}
 <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-[10px] text-foreground/30 dark:text-white/30 font-mono py-2">
 <span>100</span>
 <span>75</span>
 <span>50</span>
 </div>
 
 <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
 <defs>
 <linearGradient id="grad-fitness" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
 <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
 </linearGradient>
 </defs>
 <path 
 d="M0,150 L50,140 L100,160 L150,120 L200,130 L250,90 L300,100 L350,40 L400,20 L450,30 L500,10" 
 fill="url(#grad-fitness)" 
 stroke="#10b981" 
 strokeWidth="2"
 vectorEffect="non-scaling-stroke"
 className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
 />
 </svg>
 
 <div className="absolute inset-0 flex justify-between px-2">
 {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
 <div key={i} className="w-px h-full bg-muted dark:bg-white/5" />
 ))}
 </div>
 </div>
 <div className="flex justify-between w-full text-[10px] text-foreground/30 dark:text-white/30 font-mono mt-2 pl-2">
 <span>v1</span>
 <span>v3</span>
 <span>v5</span>
 <span>v7</span>
 <span>v9 (Current)</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] p-6">
 <h3 className="text-[13px] font-semibold text-foreground dark:text-white mb-4">Top Improvements</h3>
 <ul className="space-y-3">
 <li className="flex items-start gap-2 text-[12px] text-foreground/70 dark:text-white/70">
 <TrendingUp className="size-4 text-emerald-500 shrink-0" />
 Reduced average mission latency by 24% in v8.
 </li>
 <li className="flex items-start gap-2 text-[12px] text-foreground/70 dark:text-white/70">
 <TrendingUp className="size-4 text-emerald-500 shrink-0" />
 Improved evidence collection coverage to 99%.
 </li>
 </ul>
 </div>
 <div className="rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] p-6">
 <h3 className="text-[13px] font-semibold text-foreground dark:text-white mb-4">Past Failures</h3>
 <ul className="space-y-3">
 <li className="flex items-start gap-2 text-[12px] text-foreground/70 dark:text-white/70">
 <AlertTriangle className="size-4 text-amber-500 shrink-0" />
 Mutation M-452 (v7) violated budget constraints during simulation.
 </li>
 </ul>
 </div>
 </div>
 </div>

 {/* Right Column: Evolution Timeline */}
 <div className="col-span-1 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] flex flex-col h-[600px]">
 <div className="px-6 py-6 border-b border-border dark:border-white/10 shrink-0">
 <h3 className="text-[14px] font-semibold text-foreground dark:text-white">Mutation History</h3>
 </div>
 
 <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
 <div className="absolute left-9 top-5 bottom-5 w-px bg-black/10 dark:bg-white/10" />
 
 <div className="space-y-8 relative z-10">
 {EVOLUTION_TIMELINE.map((item) => (
 <div key={item.id} className="flex gap-6">
 <div className={cn(
 "size-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-card dark:bg-[#0a0a0a]",
 item.success ? "border-emerald-500/50 text-emerald-500" : "border-red-500/50 text-red-500"
 )}>
 {item.type === "mutation" && <Zap className="size-4" />}
 {item.type === "simulation" && <FileCode2 className="size-4" />}
 {item.type === "approval" && <GitCommit className="size-4" />}
 </div>
 
 <div className="flex flex-col pt-1.5 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <span className="font-mono text-[12px] font-bold text-foreground dark:text-white uppercase tracking-wider">{item.version}</span>
 <span className="text-[10px] text-foreground/40 dark:text-white/40">{item.date}</span>
 </div>
 <span className="text-[12px] text-foreground/70 dark:text-white/70 leading-snug mb-2">{item.description}</span>
 <div className="flex items-center gap-2 text-[11px] font-mono">
 <span className="text-foreground/40 dark:text-white/40">Fitness:</span>
 <span className={item.success ? "text-emerald-500" : "text-red-500"}>{item.fitness}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
