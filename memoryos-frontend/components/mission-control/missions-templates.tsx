"use client";

import { useState } from "react";
import { Search, ShieldAlert, Zap, BookOpen, Scale, FileSignature, GitPullRequest, ArrowRight, Activity, Users, Settings } from "lucide-react";
import { RealityFabricShell, RealityFabricInspector } from "./reality-fabric-shell";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { cn } from "@/lib/utils";

type MissionTemplate = {
 id: string;
 name: string;
 category: "Security" | "Operations" | "Compliance" | "Engineering";
 description: string;
 runtime: string;
 roles: string[];
 policies: string[];
 authority: string;
};

const TEMPLATES: MissionTemplate[] = [
 {
 id: "tpl-sec-01",
 name: "Security Review",
 category: "Security",
 description: "Deep vulnerability scan and dependency audit.",
 runtime: "~15m",
 roles: ["Security Engineer", "Auditor"],
 policies: ["Zero-Trust", "No-External-API"],
 authority: "SecOps Team",
 },
 {
 id: "tpl-ops-02",
 name: "Production Deployment",
 category: "Operations",
 description: "Multi-stage rollout with progressive traffic routing.",
 runtime: "~45m",
 roles: ["SRE", "Release Manager"],
 policies: ["Require-Approval", "Rollback-Ready"],
 authority: "Platform Eng",
 },
 {
 id: "tpl-comp-03",
 name: "Compliance Audit",
 category: "Compliance",
 description: "Quarterly SOC2 and ISO27001 data gathering.",
 runtime: "~4h",
 roles: ["Compliance Officer", "DBA"],
 policies: ["Read-Only", "Pll-Redaction"],
 authority: "Legal & Compliance",
 },
 {
 id: "tpl-eng-04",
 name: "Incident Response",
 category: "Engineering",
 description: "Automated triage, evidence gathering, and mitigation.",
 runtime: "~5m",
 roles: ["On-Call", "Incident Commander"],
 policies: ["Emergency-Access", "All-Systems"],
 authority: "Emergency Response",
 },
];

export function MissionsTemplates() {
 const [query, setQuery] = useState("");
 const [selectedTemplate, setSelectedTemplate] = useState<MissionTemplate | null>(null);
 const [inspectorTab, setInspectorTab] = useState("Genome");

 const { resolved } = useThemePreference();
 const isDark = resolved === "dark";
 const bgCard = isDark ? "bg-[#121212] border-white/10" : "bg-card border-border";
 const textMuted = isDark ? "text-white/50" : "text-foreground/50";

 const visibleTemplates = TEMPLATES.filter(t => 
 `${t.name} ${t.category} ${t.description}`.toLowerCase().includes(query.toLowerCase())
 );

 const getCategoryIcon = (category: string) => {
 switch (category) {
 case "Security": return <ShieldAlert className="size-4 text-red-500" />;
 case "Operations": return <Activity className="size-4 text-blue-500" />;
 case "Compliance": return <Scale className="size-4 text-amber-500" />;
 case "Engineering": return <Zap className="size-4 text-purple-500" />;
 default: return <BookOpen className="size-4 text-slate-500" />;
 }
 };

 return (
 <div className={cn("flex flex-col h-full w-full relative", isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]")}>
 
 {/* Header */}
 <header className={cn("px-6 py-6 border-b shrink-0 z-10 flex flex-col gap-6", isDark ? "border-white/5 bg-[#0a0a0a]" : "border-border bg-[#F9F9F9]")}>
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3">
 <h1 className={cn("text-xl font-semibold tracking-tight", isDark ? "text-white" : "text-foreground")}>Mission Templates</h1>
 </div>
 <p className={cn("text-[13px] mt-1", textMuted)}>Standardized workflows and operational contracts.</p>
 </div>
 
 <button className="flex items-center gap-2 px-6 py-1.5 bg-[#0f52ff] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f52ff]/90 transition-colors ">
 + New Template
 </button>
 </div>
 </header>

 {/* Main Workspace Area */}
 <div className="flex-1 flex overflow-hidden">
 
 {/* Center Grid */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
 <div className="flex items-center gap-3 mb-6">
 <div className={cn("flex items-center gap-2 px-3 py-1.5 bg-card dark:bg-[#121212] border rounded-md text-[13px] flex-1 max-w-sm transition-colors cursor-text", isDark ? "border-white/10 text-white" : "border-border text-foreground")}>
 <Search className="size-4 shrink-0 opacity-50" />
 <input 
 type="text" 
 placeholder="Search templates..." 
 value={query}
 onChange={e => setQuery(e.target.value)}
 className="bg-transparent border-none outline-none w-full placeholder:opacity-50" 
 />
 </div>
 
 <div className="flex gap-2">
 <button className={cn("px-3 py-1.5 border rounded-md text-[12.5px] font-medium transition-colors", 
 isDark ? "bg-[#121212] border-white/10 hover:bg-card/5 text-white/80" : "bg-card border-border hover:bg-accent text-foreground/80"
 )}>
 Category <span className="ml-1 opacity-50">▾</span>
 </button>
 <button className={cn("px-3 py-1.5 border rounded-md text-[12.5px] font-medium transition-colors", 
 isDark ? "bg-[#121212] border-white/10 hover:bg-card/5 text-white/80" : "bg-card border-border hover:bg-accent text-foreground/80"
 )}>
 Risk Level <span className="ml-1 opacity-50">▾</span>
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max pb-10 pr-2">
 {visibleTemplates.map(template => (
 <div 
 key={template.id} 
 onClick={() => setSelectedTemplate(template)}
 className={cn("group rounded-md border p-6 flex flex-col hover: transition-all relative overflow-hidden cursor-pointer", bgCard, selectedTemplate?.id === template.id ? "ring-2 ring-[#0f52ff] ring-offset-2 dark:ring-offset-[#0a0a0a]" : "")}
 >
 <div className="flex items-center gap-2 mb-3">
 <div className="p-2 rounded-md bg-muted dark:bg-white/10">
 {getCategoryIcon(template.category)}
 </div>
 <div className="flex flex-col">
 <h3 className="font-semibold text-[15px]">{template.name}</h3>
 <span className={cn("text-[12px]", textMuted)}>{template.category}</span>
 </div>
 </div>

 <p className={cn("text-[13px] mb-4 flex-1", textMuted)}>{template.description}</p>

 <div className="flex flex-wrap gap-1.5 mb-4">
 {template.roles.map(role => (
 <span key={role} className={cn("px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border", isDark ? "bg-card/5 border-white/10 text-white/70" : "bg-muted border-border text-foreground/70")}>
 {role}
 </span>
 ))}
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-border dark:border-white/5">
 <div className="flex items-center gap-1.5 text-[12px] font-medium opacity-70">
 <Activity className="size-3.5" /> {template.runtime}
 </div>
 <div className="flex items-center gap-1 text-[12px] font-medium text-[#0f52ff] opacity-0 group-hover:opacity-100 transition-opacity">
 View Genome <ArrowRight className="size-3.5" />
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Right Context Inspector */}
 {selectedTemplate && (
 <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
 <div className={cn("w-[450px] h-full shadow-2xl border-l flex flex-col animate-in slide-in-from-right-10 duration-200", isDark ? "bg-[#121212] border-white/10" : "bg-card border-border")}>
 
 <div className={cn("px-6 py-6 border-b shrink-0 flex items-start justify-between", isDark ? "border-white/10" : "border-border")}>
 <div>
 <h2 className={cn("text-[15px] font-semibold tracking-tight", isDark ? "text-white" : "text-foreground")}>{selectedTemplate.name}</h2>
 <p className={cn("text-[12px] mt-0.5", textMuted)}>{selectedTemplate.category}</p>
 </div>
 <button 
 onClick={() => setSelectedTemplate(null)}
 className={cn("p-1.5 rounded-md transition-colors", isDark ? "hover:bg-card/10 text-white/50 hover:text-white" : "hover:bg-black/10 text-foreground/50 hover:text-foreground")}
 >
 <Search className="size-4 opacity-0" /> {/* Spacer */}
 <span className="absolute top-4 right-4">✕</span>
 </button>
 </div>

 <div className={cn("flex px-6 gap-6 border-b shrink-0 overflow-x-auto custom-scrollbar", isDark ? "border-white/10" : "border-border")}>
 {["Genome", "Policies", "Contract", "Roles"].map((tab) => (
 <button
 key={tab}
 onClick={() => setInspectorTab(tab)}
 className={cn(
 "py-3 text-[12.5px] font-medium transition-all relative whitespace-nowrap",
 inspectorTab === tab ? (isDark ? "text-white" : "text-foreground") : cn(textMuted, isDark ? "hover:text-white/70" : "hover:text-foreground/70")
 )}
 >
 {tab}
 {inspectorTab === tab && (
 <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", isDark ? "bg-card" : "bg-black")} />
 )}
 </button>
 ))}
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
 {inspectorTab === "Genome" && (
 <div className="space-y-4">
 <div className={cn("p-3 rounded-md border text-[13px]", isDark ? "bg-card/[0.02] border-white/10" : "bg-muted/50 border-border")}>
 <div className="flex justify-between mb-2">
 <span className={textMuted}>Authority</span>
 <span className={cn("font-semibold", isDark ? "text-white" : "text-foreground")}>{selectedTemplate.authority}</span>
 </div>
 <div className="flex justify-between">
 <span className={textMuted}>Est. Runtime</span>
 <span className={cn("font-semibold", isDark ? "text-white" : "text-foreground")}>{selectedTemplate.runtime}</span>
 </div>
 </div>

 <div className="space-y-2">
 <div className={cn("text-[12px] font-semibold uppercase tracking-wider", textMuted)}>Required Roles</div>
 <div className="flex flex-wrap gap-2">
 {selectedTemplate.roles.map(role => (
 <div key={role} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] border font-medium", isDark ? "bg-card/5 border-white/10" : "bg-muted border-border")}>
 <Users className="size-3.5 opacity-70" /> {role}
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-2 mt-4">
 <div className={cn("text-[12px] font-semibold uppercase tracking-wider", textMuted)}>Governing Policies</div>
 <div className="flex flex-col gap-1.5">
 {selectedTemplate.policies.map(policy => (
 <div key={policy} className={cn("flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-md border", isDark ? "bg-card/5 border-white/10 text-white" : "bg-muted border-border text-foreground")}>
 <FileSignature className="size-3.5 text-amber-500" />
 <span className="font-medium">{policy}</span>
 </div>
 ))}
 </div>
 </div>

 <button className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#0f52ff] text-white text-[13px] font-medium hover:bg-[#0f52ff]/90 transition-colors ">
 <GitPullRequest className="size-4" /> Instantiate Mission
 </button>
 </div>
 )}
 {inspectorTab !== "Genome" && (
 <div className={cn("flex flex-col items-center justify-center py-10 text-center opacity-50", textMuted)}>
 <Settings className="size-8 mb-2 opacity-50" />
 <p className="text-[13px] font-medium">{inspectorTab} configuration viewing not implemented yet.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
