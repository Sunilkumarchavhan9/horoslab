"use client";

import React, { useState } from "react";
import { ArrowLeft, Share2, MoreHorizontal, Activity, GitCommit, Settings2, FileCode2, History, Network, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, CommandBar } from "./institution-shared-components";

// Placeholder components for the tabs
import { InstitutionGenome } from "./institution-genome";
import { InstitutionPolicies } from "./institution-policies";
import { InstitutionVersions } from "./institution-versions";
import { InstitutionEvolution } from "./institution-evolution";
import { InstitutionChangeProposals } from "./institution-change-proposals";

type TabType = "Overview" | "Genome" | "Policies" | "Missions" | "Versions" | "Proposals" | "Evolution" | "Audit";

export function InstitutionDetails({ id, onBack }: { id: string, onBack: () => void }) {
 const [activeTab, setActiveTab] = useState<TabType>("Genome");

 const TABS: { id: TabType, label: string, icon: React.ReactNode }[] = [
 { id: "Overview", label: "Overview", icon: <Activity className="size-3.5" /> },
 { id: "Genome", label: "Genome", icon: <Network className="size-3.5" /> },
 { id: "Policies", label: "Policies", icon: <ShieldCheck className="size-3.5" /> },
 { id: "Missions", label: "Missions", icon: <Settings2 className="size-3.5" /> },
 { id: "Versions", label: "Versions", icon: <GitCommit className="size-3.5" /> },
 { id: "Proposals", label: "Proposals", icon: <FileCode2 className="size-3.5" /> },
 { id: "Evolution", label: "Evolution", icon: <History className="size-3.5" /> },
 ];

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#0a0a0a] text-foreground dark:text-white font-sans">
 <CommandBar className="border-b-0 h-14 shrink-0">
 <div className="flex items-center gap-6">
 <button 
 onClick={onBack}
 className="p-1.5 rounded-md hover:bg-black/10 dark:bg-white/10 text-foreground/70 dark:text-white/70 hover:text-foreground dark:text-white transition-colors"
 >
 <ArrowLeft className="size-4" />
 </button>
 <div className="flex items-center gap-3 border-l border-border dark:border-white/10 pl-4">
 <h1 className="text-[15px] font-bold tracking-tight">Engineering Institution</h1>
 <StatusBadge status="ACTIVE" />
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-black/10 dark:bg-white/10 text-[12px] font-medium text-foreground/70 dark:text-white/70 hover:text-foreground dark:text-white transition-colors">
 <Share2 className="size-3.5" /> Share
 </button>
 <button className="p-1.5 rounded-md hover:bg-black/10 dark:bg-white/10 text-foreground/70 dark:text-white/70 hover:text-foreground dark:text-white transition-colors">
 <MoreHorizontal className="size-4" />
 </button>
 </div>
 </CommandBar>

 <div className="flex items-center gap-1 px-6 border-b border-border dark:border-white/10 bg-card dark:bg-[#121212] shrink-0">
 {TABS.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors relative top-[1px]",
 activeTab === tab.id 
 ? "border-[#0f52ff] text-foreground dark:text-white" 
 : "border-transparent text-foreground/50 dark:text-white/50 hover:text-foreground/80 dark:text-white/80 hover:border-black/20 dark:border-white/20"
 )}
 >
 {tab.icon}
 {tab.label}
 </button>
 ))}
 </div>

 <div className="flex-1 overflow-hidden relative">
 {activeTab === "Genome" && <InstitutionGenome />}
 {activeTab === "Policies" && <InstitutionPolicies />}
 {activeTab === "Versions" && <InstitutionVersions />}
 {activeTab === "Evolution" && <InstitutionEvolution />}
 {activeTab === "Proposals" && <InstitutionChangeProposals />}
 
 {/* Placeholders for tabs not explicitly detailed yet */}
 {["Overview", "Missions", "Audit"].includes(activeTab) && (
 <div className="flex items-center justify-center h-full text-foreground/40 dark:text-white/40">
 {activeTab} view coming soon
 </div>
 )}
 </div>
 </div>
 );
}
