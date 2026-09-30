"use client";

import React, { useState } from "react";
import { Download, ShieldCheck, Zap, ServerCrash, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./institution-shared-components";

const TEMPLATES = [
 {
 id: "t1",
 name: "Release Engineering",
 description: "Standard institution for coordinating safe code deployments, managing release branches, and communicating changes.",
 icon: <Zap className="size-6 text-[#0f52ff]" />,
 color: "bg-[#0f52ff]/10 text-[#0f52ff] border-[#0f52ff]/20",
 features: ["Auto-generates changelogs", "Enforces code freeze rules", "Coordinates with QA agents"],
 runtime: "~45 mins per release"
 },
 {
 id: "t2",
 name: "Security Review",
 description: "Rigorous analysis unit that isolates code, runs SAST/DAST tools, and generates compliance reports.",
 icon: <ShieldCheck className="size-6 text-emerald-500" />,
 color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
 features: ["Air-gapped execution", "Mandatory human sign-off", "Generates SOC2 evidence"],
 runtime: "Continuous or triggered"
 },
 {
 id: "t3",
 name: "Incident Response",
 description: "Emergency unit that spins up immediately upon PagerDuty alerts to gather logs and suggest mitigations.",
 icon: <ServerCrash className="size-6 text-amber-500" />,
 color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
 features: ["Bypasses budget limits", "Highest priority routing", "Notifies all stakeholders"],
 runtime: "Until resolution"
 }
];

export function InstitutionTemplates() {
 const [selectedId, setSelectedId] = useState<string | null>(null);

 if (selectedId) {
 const template = TEMPLATES.find(t => t.id === selectedId)!;
 return (
 <div className="flex flex-col h-full bg-card dark:bg-[#050505] overflow-y-auto custom-scrollbar p-8">
 <div className="max-w-4xl w-full mx-auto">
 <button 
 onClick={() => setSelectedId(null)}
 className="flex items-center gap-1.5 text-foreground/50 dark:text-[#F0EFE2]/50 hover:text-foreground dark:text-[#F0EFE2] transition-colors text-[13px] font-medium mb-8"
 >
 ← Back to Templates
 </button>
 
 <div className="flex items-start justify-between mb-8 pb-8 border-b border-border dark:border-white/10">
 <div className="flex items-center gap-6">
 <div className={cn("size-16 rounded-md border flex items-center justify-center", template.color)}>
 {template.icon}
 </div>
 <div className="flex flex-col gap-2">
 <h1 className="text-[28px] font-bold text-foreground dark:text-[#F0EFE2] tracking-tight leading-none">{template.name}</h1>
 <p className="text-[15px] text-foreground/60 dark:text-[#F0EFE2]/60 max-w-xl">{template.description}</p>
 </div>
 </div>
 <button className="flex items-center gap-2 px-6 py-3 bg-[#0f52ff] hover:bg-[#0042e6] text-foreground dark:text-[#F0EFE2] rounded-md text-[14px] font-bold transition-colors ">
 <Download className="size-4" /> Install Institution
 </button>
 </div>

 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-8">
 <div>
 <h3 className="text-[14px] font-semibold text-foreground dark:text-[#F0EFE2] mb-4">Included Roles</h3>
 <div className="space-y-3">
 {["Lead Coordinator", "Research Agent", "Reviewer"].map((role, i) => (
 <div key={i} className="p-3 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5 flex items-center justify-between">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">{role}</span>
 <span className="text-[11px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-foreground/60 dark:text-[#F0EFE2]/60">GPT-4</span>
 </div>
 ))}
 </div>
 </div>
 <div>
 <h3 className="text-[14px] font-semibold text-foreground dark:text-[#F0EFE2] mb-4">Default Policies</h3>
 <div className="space-y-3">
 <div className="p-3 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5">
 <div className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2] mb-1">Human-in-the-loop</div>
 <div className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">Requires explicit approval before merging code or sending external communications.</div>
 </div>
 <div className="p-3 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5">
 <div className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2] mb-1">Evidence Retention</div>
 <div className="text-[12px] text-foreground/50 dark:text-[#F0EFE2]/50">All agent reasoning traces are kept for 90 days.</div>
 </div>
 </div>
 </div>
 </div>
 
 <div className="space-y-6">
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a]">
 <h3 className="text-[14px] font-semibold text-foreground dark:text-[#F0EFE2] mb-4">Quick Facts</h3>
 <div className="space-y-4 text-[13px]">
 <div className="flex flex-col gap-1">
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40">Estimated Runtime</span>
 <span className="text-foreground dark:text-[#F0EFE2]">{template.runtime}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-foreground/40 dark:text-[#F0EFE2]/40">Required Capabilities</span>
 <span className="text-foreground dark:text-[#F0EFE2]">File System, Network, Git</span>
 </div>
 </div>
 </div>

 <div className="p-6 rounded-md border border-emerald-500/20 bg-emerald-500/5">
 <h3 className="text-[14px] font-semibold text-emerald-500 mb-4 flex items-center gap-2">
 <ShieldCheck className="size-4" /> Pre-verified
 </h3>
 <p className="text-[13px] text-foreground/70 dark:text-[#F0EFE2]/70 leading-relaxed">
 This template has been officially verified by the Dhyra team. It contains no unsafe syscalls and complies with standard AI safety bounds.
 </p>
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
 title="Institution Templates" 
 description="Choose a pre-configured template to spin up a new operational unit. Templates contain optimized genomes, roles, and safety policies."
 />

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
 {TEMPLATES.map(template => (
 <div 
 key={template.id} 
 onClick={() => setSelectedId(template.id)}
 className="flex flex-col rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#0a0a0a] hover:border-black/20 dark:border-white/20 hover:bg-card dark:bg-[#121212] transition-all cursor-pointer group"
 >
 <div className="p-6 flex flex-col gap-6">
 <div className={cn("size-12 rounded-md border flex items-center justify-center mb-2", template.color)}>
 {template.icon}
 </div>
 <div>
 <h3 className="text-[18px] font-semibold text-foreground dark:text-[#F0EFE2] tracking-tight mb-2 group-hover:text-[#0f52ff] transition-colors">{template.name}</h3>
 <p className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50 leading-relaxed h-16">{template.description}</p>
 </div>
 </div>
 
 <div className="px-6 py-6 border-t border-border dark:border-white/5 bg-card/[0.02] flex-1">
 <ul className="space-y-2">
 {template.features.map((feat, i) => (
 <li key={i} className="flex items-start gap-2 text-[12px] text-foreground/70 dark:text-[#F0EFE2]/70">
 <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
 {feat}
 </li>
 ))}
 </ul>
 </div>

 <div className="px-6 py-6 border-t border-border dark:border-white/5 flex items-center justify-between">
 <span className="text-[11px] text-foreground/40 dark:text-[#F0EFE2]/40">{template.runtime}</span>
 <button className="flex items-center gap-1 text-[12px] font-medium text-[#0f52ff] group-hover:underline">
 Preview <ArrowRight className="size-3.5" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
