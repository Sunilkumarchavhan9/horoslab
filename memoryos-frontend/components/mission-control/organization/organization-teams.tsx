"use client";

import React, { useState } from "react";
import { Network, Plus, Users2, Activity, Building, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationLayout, OrganizationHeader, StatusBadge } from "./organization-shared-components";

// --- Mock Data ---
const TEAMS = [
 { id: "team_eng", name: "Engineering", members: 24, institutions: 8, missions: 342, status: "Healthy" },
 { id: "team_plat", name: "Platform", members: 12, institutions: 4, missions: 112, status: "Healthy" },
 { id: "team_sec", name: "Security", members: 4, institutions: 2, missions: 45, status: "Warning" },
 { id: "team_ops", name: "Operations", members: 8, institutions: 3, missions: 18, status: "Healthy" }
];

export function OrganizationTeams() {
 const [selectedTeam, setSelectedTeam] = useState(TEAMS[1]); // Default to Platform

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[900px]">
 <div className="flex items-start justify-between mb-8">
 <OrganizationHeader 
 title="Teams" 
 description="Structure your organization into teams. Teams can be mapped to Institutions for granular AI runtime authority."
 />
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-white dark:text-black rounded-md text-[13px] font-medium flex items-center gap-2 hover:opacity-90">
 <Plus className="size-4" />
 Create Team
 </button>
 </div>

 <div className="flex gap-8 mb-12">
 {/* Organization Tree */}
 <div className="w-[240px] shrink-0 border-r border-border dark:border-white/10 pr-6">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 block">Hierarchy</span>
 <div className="flex flex-col gap-1 text-[13px]">
 <div className="flex items-center gap-2 font-semibold text-foreground dark:text-white mb-2">
 <Building className="size-4" />
 Epoch Inc.
 </div>
 
 <div className="flex flex-col ml-4 border-l border-border dark:border-white/10 pl-3 gap-2">
 <div className="flex items-center gap-2 font-medium text-foreground dark:text-white cursor-pointer hover:text-[#0f52ff] transition-colors">
 <ChevronRight className="size-3 text-muted-foreground" />
 Engineering
 </div>
 
 <div className="flex flex-col ml-3 border-l border-border dark:border-white/10 pl-3 gap-2">
 <div className="flex items-center gap-2 font-medium text-[#0f52ff] cursor-pointer">
 Platform
 </div>
 <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
 Security
 </div>
 </div>

 <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground hover:text-foreground cursor-pointer transition-colors pt-1">
 <ChevronRight className="size-3 text-muted-foreground" />
 Operations
 </div>
 </div>
 </div>
 </div>

 {/* Team Grid */}
 <div className="flex-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4 block">Departments</span>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {TEAMS.map((team) => (
 <div 
 key={team.id} 
 onClick={() => setSelectedTeam(team)}
 className={cn(
 "flex flex-col p-6 rounded-md border cursor-pointer transition-all",
 selectedTeam.id === team.id 
 ? "border-[#111] dark:border-white bg-muted dark:bg-white/10" 
 : "border-border dark:border-white/10 bg-card dark:bg-[#111] hover:border-black/20 dark:hover:border-white/20 hover:bg-muted/50 dark:hover:bg-[#1a1a1a]"
 )}
 >
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Network className="size-4 text-foreground dark:text-white" />
 <span className="text-[14px] font-semibold text-foreground dark:text-white">{team.name}</span>
 </div>
 <button className="text-muted-foreground hover:text-foreground transition-colors">
 <Settings className="size-4" />
 </button>
 </div>
 <div className="flex items-center gap-6 text-[12px] text-muted-foreground dark:text-muted-foreground mt-auto">
 <span className="flex items-center gap-1.5">
 <Users2 className="size-3.5" /> {team.members}
 </span>
 <span className="flex items-center gap-1.5">
 <Building className="size-3.5" /> {team.institutions}
 </span>
 <span className="flex items-center gap-1.5">
 <Activity className="size-3.5" /> {team.missions}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Network className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">{selectedTeam.name} Team</span>
 <div className="ml-auto">
 <StatusBadge status={selectedTeam.status} />
 </div>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Overview</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6 text-[13px]">
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2">
 <span className="text-muted-foreground">Members</span>
 <span className="font-mono text-foreground dark:text-white">{selectedTeam.members}</span>
 </div>
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2 pt-2">
 <span className="text-muted-foreground">Mapped Institutions</span>
 <span className="font-mono text-foreground dark:text-white">{selectedTeam.institutions}</span>
 </div>
 <div className="flex justify-between pt-2">
 <span className="text-muted-foreground">Active Missions</span>
 <span className="font-mono text-foreground dark:text-white">{selectedTeam.missions}</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Recent Activity</span>
 <button className="text-[11px] text-[#0f52ff] hover:underline font-medium">View All</button>
 </div>
 <div className="flex flex-col gap-3">
 <div className="flex items-start gap-3">
 <Users2 className="size-4 text-muted-foreground mt-0.5" />
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-white">Alice Chen joined the team</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">2 hours ago</span>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Building className="size-4 text-muted-foreground mt-0.5" />
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-white">Mapped to "Platform Orchestrator" institution</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">Yesterday</span>
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 );

 return (
 <OrganizationLayout inspector={renderInspector()}>
 {renderMain()}
 </OrganizationLayout>
 );
}
