"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Rocket } from "lucide-react";
import { readActiveEpochWorkspaceId, listEpochMissions, listEpochInstitutions, createEpochInstitution, createEpochMission } from "@/lib/epoch-api";
import { RealityFabricShell } from "../../reality-fabric-shell";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { cn } from "@/lib/utils";
import { MissionRow, formatRelativeTime, missionRisk, missionPlanner, missionProgress } from "./types";
import { ActiveMissionCard } from "./active-mission-card";
import { ActiveMissionInspector } from "./active-mission-inspector";
import { isLiveCompanySource, listSources } from "@/lib/company-sources-api";

export function MissionsActive({ onViewMission }: { onViewMission?: (id: string) => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [missions, setMissions] = useState<MissionRow[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [creating, setCreating] = useState(false);
 const [query, setQuery] = useState("");
 const [institutionId, setInstitutionId] = useState<string | null>(null);
 const [githubConnected, setGithubConnected] = useState(false);
 const [githubStateLoaded, setGithubStateLoaded] = useState(false);
 
 const [selectedMission, setSelectedMission] = useState<MissionRow | null>(null);
 const [inspectorTab, setInspectorTab] = useState("Mission");

 const { resolved } = useThemePreference();
 const isDark = resolved === "dark";
 const bgCard = isDark ? "bg-[#121212] border-white/10" : "bg-card border-border";
 const textMuted = isDark ? "text-[#F0EFE2]/50" : "text-foreground/50";

 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveEpochWorkspaceId());
 window.addEventListener("focus", syncWorkspace);
 return () => window.removeEventListener("focus", syncWorkspace);
 }, []);

 const refresh = useCallback(async () => {
 if (!workspaceId) return;
 setLoading(true);
 setError(null);
 try {
  const [liveMissions, institutions] = await Promise.all([
   listEpochMissions(workspaceId),
   listEpochInstitutions(workspaceId),
  ]);
  setInstitutionId(institutions[0]?.id ?? null);
  setMissions(
   liveMissions.map((mission) => ({
 id: mission.id,
 name: mission.title ?? mission.objective ?? "Untitled mission",
 institution: mission.institution?.name ?? "Unknown",
 planner: missionPlanner(mission),
 status: mission.state ?? "draft",
 risk: missionRisk(mission),
 progress: missionProgress(mission),
 started: formatRelativeTime(mission.updatedAt),
 workers: Math.floor(Math.random() * 8) + 1, // Mock live workers
 evidence: Math.floor(Math.random() * 50) + 10,
 executionStatus: mission.executionRun?.status ?? (mission.state === "running" ? "running" : "idle"),
 verificationDecision: mission.verificationRun?.finalDecision ?? (mission.state === "completed" ? "PASS" : mission.state === "failed" ? "FAIL" : "pending"),
   }))
  );
 } catch (e) {
 setError(e instanceof Error ? e.message : "Failed to load missions.");
 } finally {
 setLoading(false);
 }
 }, [workspaceId]);

 useEffect(() => {
 let canceled = false;

 async function loadGithubStatus() {
 if (!workspaceId) return;
 try {
 const sources = await listSources();
 if (canceled) return;
 setGithubConnected(
  sources.some((source) =>
   isLiveCompanySource(source) &&
   (source.provider?.toLowerCase() === "github" ||
    source.type?.toLowerCase() === "github" ||
    source.providerName?.toLowerCase().includes("github")),
  ),
 );
 setGithubStateLoaded(true);
 } catch {
 if (!canceled) {
  setGithubConnected(false);
  setGithubStateLoaded(true);
 }
 }
 }

 void refresh();
 void loadGithubStatus();

 return () => {
 canceled = true;
 };
 }, [refresh, workspaceId]);

 const summary = useMemo(() => {
 return {
 active: missions.filter(m => m.status === "running").length,
 workers: missions.reduce((acc, m) => acc + (m.status === "running" ? m.workers : 0), 0),
 waiting: missions.filter(m => m.status === "waiting_review").length,
 blocked: missions.filter(m => m.status === "failed" || m.risk === "High").length,
 completedToday: missions.filter(m => m.progress >= 100).length,
 avgDuration: "14m 20s",
 };
 }, [missions]);

 const handleCreateMission = async () => {
 if (!workspaceId) {
 setError("Select a workspace to launch a mission.");
 return;
 }
 setCreating(true);
 setError(null);
 try {
 let targetInstitutionId = institutionId;
 if (!targetInstitutionId) {
 const createdInstitution = await createEpochInstitution(workspaceId, {
 name: "Software Release",
 category: "engineering",
 version: "1.0.0",
 summary: "Default institution for demo mission launches.",
 metadata: {
 source: "active-missions",
 kind: "demo-release",
 },
 });
 targetInstitutionId = createdInstitution.id;
 setInstitutionId(createdInstitution.id);
 }
 await createEpochMission(workspaceId, {
 institutionId: targetInstitutionId,
 title: "Release v1.0",
 objective: "Run the software release mission from planning through learning.",
 plan: [
 "Connect GitHub",
 "Sync reality",
 "Review the graph",
 "Execute the mission",
 "Collect evidence",
 "Verify the result",
 "Settle the outcome",
 "Store the learning artifact",
 ],
 });
 await refresh();
 } catch (createError) {
 setError(createError instanceof Error ? createError.message : "Failed to launch mission.");
 } finally {
 setCreating(false);
 }
 };

 const visibleMissions = missions.filter(m => 
 `${m.name} ${m.institution} ${m.status}`.toLowerCase().includes(query.toLowerCase())
 );

 return (
 <div className={cn("flex flex-col h-full w-full relative", isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]")}>
 
 {/* ATC Header & KPI Bar */}
 <header className={cn("px-6 py-6 border-b shrink-0 z-10 flex flex-col gap-6", isDark ? "border-white/5 bg-[#0a0a0a]" : "border-border bg-[#F9F9F9]")}>
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3">
 <h1 className={cn("text-xl font-semibold tracking-tight", isDark ? "text-[#F0EFE2]" : "text-foreground")}>Active Missions</h1>
 <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5", isDark ? "bg-[#eef7ee]/10 text-[#4ade80]" : "bg-[#eef7ee] text-[#2a7b2a]")}>
 <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isDark ? "bg-[#4ade80]" : "bg-[#2a7b2a]")} />
 Live Control
 </span>
 </div>
 <p className={cn("text-[13px] mt-1", textMuted)}>Air Traffic Control for Operational Work</p>
 </div>
 
 <div className="flex items-center gap-6">
 <div className={cn("flex items-center gap-6 mr-4 border-r pr-6", isDark ? "border-white/10" : "border-border")}>
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Active Missions</span>
 <span className={cn("text-[18px] font-semibold", isDark ? "text-[#F0EFE2]" : "text-foreground")}>{summary.active}</span>
 </div>
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Running Agents</span>
 <span className={cn("text-[18px] font-semibold", isDark ? "text-[#F0EFE2]" : "text-foreground")}>{summary.workers}</span>
 </div>
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Waiting Approval</span>
 <span className={cn("text-[18px] font-semibold text-amber-500")}>{summary.waiting}</span>
 </div>
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Blocked</span>
 <span className={cn("text-[18px] font-semibold text-red-500")}>{summary.blocked}</span>
 </div>
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Completed Today</span>
 <span className={cn("text-[18px] font-semibold", isDark ? "text-[#4ade80]" : "text-[#2a7b2a]")}>{summary.completedToday}</span>
 </div>
 <div className="flex flex-col">
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textMuted)}>Average Duration</span>
 <span className={cn("text-[18px] font-semibold", isDark ? "text-[#F0EFE2]" : "text-foreground")}>{summary.avgDuration}</span>
 </div>
 </div>

 <button onClick={handleCreateMission} disabled={creating} className="flex items-center gap-2 px-6 py-1.5 bg-[#0f52ff] text-[#F0EFE2] rounded-md text-[13px] font-semibold hover:bg-[#0f52ff]/90 transition-colors ">
 <Plus className="size-4" /> {creating ? "Launching..." : "Launch Mission"}
 </button>
 </div>
 </div>
 </header>

 {/* Main Workspace Area */}
 <div className="flex-1 flex overflow-hidden">
 
 {/* Center Grid */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
 <div className="flex items-center gap-3 mb-6">
 <div className={cn("flex items-center gap-2 px-3 py-1.5 bg-card dark:bg-[#121212] border rounded-md text-[13px] flex-1 max-w-sm transition-colors cursor-text", isDark ? "border-white/10 text-[#F0EFE2]" : "border-border text-foreground")}>
 <Search className="size-4 shrink-0 opacity-50" />
 <input 
 type="text" 
 placeholder="Search active missions..." 
 value={query}
 onChange={e => setQuery(e.target.value)}
 className="bg-transparent border-none outline-none w-full placeholder:opacity-50" 
 />
 </div>
 
 <div className="flex gap-2">
 {['Filter', 'Priority', 'Institution', 'Status'].map(filter => (
 <button key={filter} className={cn("px-3 py-1.5 border rounded-md text-[12.5px] font-medium transition-colors", 
 isDark ? "bg-[#121212] border-white/10 hover:bg-card/5 text-[#F0EFE2]/80" : "bg-card border-border hover:bg-accent text-foreground/80"
 )}>
 {filter} <span className="ml-1 opacity-50">▾</span>
 </button>
 ))}
 </div>
 </div>

 {visibleMissions.length === 0 ? (
 <div className="flex flex-col items-center justify-center w-full min-h-[400px] text-center border-2 border-dashed rounded-md border-border dark:border-white/10 bg-muted/50 dark:bg-white/[0.02]">
 <Rocket className="size-12 mb-4 text-foreground/20 dark:text-[#F0EFE2]/20" />
 <h3 className="text-lg font-semibold mb-1 text-foreground/80 dark:text-[#F0EFE2]/80">
 {query
  ? "No missions found"
  : githubConnected
   ? "GitHub connected, no mission launched yet"
   : "No Active Missions"}
 </h3>
 <p className={cn("text-[14px] max-w-sm mb-6", textMuted)}>
 {query
  ? "Try adjusting your search filters."
  : githubConnected
   ? "GitHub is live. Launch Release v1.0 to start planning, execution, evidence, verification, and learning."
   : "There are currently no active missions in this workspace. Launch a new mission to begin."}
 </p>
 {!query && (
  <button
   type="button"
   onClick={() => void handleCreateMission()}
   disabled={creating || !workspaceId}
   className="flex items-center gap-2 px-5 py-2 bg-[#0f52ff] text-[#F0EFE2] rounded-md text-[13px] font-semibold hover:bg-[#0f52ff]/90 transition-colors disabled:opacity-60"
  >
   <Plus className="size-4" />
   {creating ? "Launching..." : githubConnected ? "Launch Release v1.0" : "Launch Mission"}
  </button>
 )}
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max pb-10 pr-2">
 {visibleMissions.map(mission => (
 <ActiveMissionCard 
 key={mission.id}
 mission={mission}
 bgCard={bgCard}
 textMuted={textMuted}
 isDark={isDark}
 onViewMission={onViewMission}
 onSelectMission={setSelectedMission}
 />
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Right Context Inspector */}
 {selectedMission && (
 <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
 <div className="w-[450px] h-full shadow-2xl border-l animate-in slide-in-from-right-10 duration-200">
 <ActiveMissionInspector 
 mission={selectedMission}
 onClose={() => setSelectedMission(null)}
 activeTab={inspectorTab}
 setActiveTab={setInspectorTab}
 isDark={isDark}
 textMuted={textMuted}
 />
 </div>
 </div>
 )}
 </div>
 );
}
