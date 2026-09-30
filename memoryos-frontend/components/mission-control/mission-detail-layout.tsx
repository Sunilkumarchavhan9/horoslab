"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, LayoutDashboard, Play, FileText, ShieldCheck, Award, Database, AlertTriangle, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDhyraMission, readActiveDhyraWorkspaceId, type DhyraMissionDetail } from "@/lib/dhyra-api";
import { MissionDetailOverview } from "./mission-detail-overview";
import { MissionDetailExecution } from "./mission-detail-execution";
import { MissionDetailEvidence } from "./mission-detail-evidence";
import { MissionDetailVerification } from "./mission-detail-verification";
import { MissionDetailLogs } from "./mission-detail-logs";
import { MissionDetailCertificate } from "./mission-detail-certificate";

function normalizeMissionTab(tab: string): string {
 return tab === "Timeline" ? "Logs" : tab;
}

export function MissionDetailLayout({
 missionId,
 activeTab = "Overview",
 onTabChange,
 onBack,
}: {
 missionId: string;
 activeTab?: string;
 onTabChange?: (tab: string) => void;
 onBack: () => void;
}) {
 const [localActiveTab, setLocalActiveTab] = useState(activeTab);
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId());
 const [mission, setMission] = useState<DhyraMissionDetail | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 setLocalActiveTab(normalizeMissionTab(activeTab));
 }, [activeTab]);

 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveDhyraWorkspaceId());
 syncWorkspace();
 window.addEventListener("focus", syncWorkspace);
 window.addEventListener("storage", syncWorkspace);
 return () => {
 window.removeEventListener("focus", syncWorkspace);
 window.removeEventListener("storage", syncWorkspace);
 };
 }, []);

 useEffect(() => {
 let canceled = false;

 async function loadMission() {
 if (!workspaceId) {
 setMission(null);
 setLoading(false);
 setError("Select a workspace to view mission details.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const detail = await getDhyraMission(workspaceId, missionId);
 if (!canceled) setMission(detail);
 } catch (loadError) {
 if (!canceled) {
 setMission(null);
 setError(loadError instanceof Error ? loadError.message : "Failed to load mission.");
 }
 } finally {
 if (!canceled) setLoading(false);
 }
 }

 void loadMission();
 return () => {
 canceled = true;
 };
 }, [missionId, workspaceId]);

 const currentTab = onTabChange ? normalizeMissionTab(activeTab) : localActiveTab;
 const handleTabChange = (tab: string) => {
 const nextTab = normalizeMissionTab(tab);
 setLocalActiveTab(nextTab);
 onTabChange?.(nextTab);
 };

 const memoryRecord = mission?.memoryRecord;
 const memoryLessons = Array.isArray(memoryRecord?.lessons) ? memoryRecord.lessons : [];
 const memoryMistakes = Array.isArray(memoryRecord?.mistakes) ? memoryRecord.mistakes : [];
 const memoryImprovements = Array.isArray(memoryRecord?.suggestedImprovements) ? memoryRecord.suggestedImprovements : [];

 const missionStatus = (mission?.state ?? "draft").replace(/_/g, " ");
 const isHistoricalMission = useMemo(() => {
 const state = (mission?.state ?? "").toLowerCase();
 return state === "completed" || state === "failed" || state === "cancelled";
 }, [mission?.state]);
 const isMissingMission = Boolean(error) && /not found|unavailable/i.test(error ?? "");

 const activeTabs = [
 { name: "Overview", icon: <LayoutDashboard className="size-4" /> },
 { name: "Execution", icon: <Play className="size-4" /> },
 { name: "Evidence", icon: <FileText className="size-4" /> },
 { name: "Verification", icon: <ShieldCheck className="size-4" /> },
 { name: "Logs", icon: <ScrollText className="size-4" /> },
 ];

 const historicalTabs = [
 { name: "Overview", icon: <LayoutDashboard className="size-4" /> },
 { name: "Execution", icon: <Play className="size-4" /> },
 { name: "Evidence", icon: <FileText className="size-4" /> },
 { name: "Certificate", icon: <Award className="size-4" /> },
 { name: "Institution Record", icon: <Database className="size-4" /> },
 { name: "Logs", icon: <ScrollText className="size-4" /> },
 ];

 const tabs = isHistoricalMission ? historicalTabs : activeTabs;

 return (
 <div className="w-full flex flex-col pt-2 h-full font-sans">
 <div className="flex items-center gap-2 mb-6 text-[14px]">
 <span className="text-muted-foreground hover:text-foreground cursor-pointer font-medium transition-colors" onClick={onBack}>
 {isHistoricalMission ? "Mission History" : "Active Missions"}
 </span>
 <ChevronRight className="size-4 text-[#aaa]" />
 <span className="text-foreground font-semibold flex items-center gap-2">
 {mission?.title ?? `Mission ${missionId}`}
 <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium h-5 bg-card text-foreground/80 border border-border")}>
 {(mission?.state ?? missionStatus).replace(/_/g, " ")}
 </span>
 </span>
 </div>

 {mission && !error ? (
 <div className="border-b border-border mb-6">
 <div className="flex items-center gap-6">
 {tabs.map((tab) => (
 <button
 key={tab.name}
 onClick={() => handleTabChange(tab.name)}
 className={cn(
 "flex items-center gap-2 pb-3 px-1 text-[14px] font-medium transition-all relative outline-none",
 currentTab === tab.name ? "text-foreground" : "text-muted-foreground hover:text-foreground/90",
 )}
 >
 <span className={cn("flex items-center justify-center transition-colors", currentTab === tab.name ? "text-foreground" : "text-muted-foreground")}>
 {tab.icon}
 </span>
 {tab.name}
 {currentTab === tab.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f38020] rounded-t-sm" />}
 </button>
 ))}
 </div>
 </div>
 ) : null}

 <div className="flex-1 overflow-y-auto">
 {loading ? (
 <div className="bg-card border border-border rounded-md p-12 flex flex-col items-center justify-center text-center h-[400px]">
 <h2 className="text-[20px] font-semibold text-foreground mb-2">Loading mission</h2>
 <p className="text-[15px] text-muted-foreground max-w-md">Fetching live mission data from Dhyra.</p>
 </div>
 ) : isMissingMission ? (
 <div className="bg-card border border-border rounded-md p-12 flex flex-col items-center justify-center text-center h-[400px]">
 <AlertTriangle className="size-12 text-[#C8C7BA] mb-4" />
 <h2 className="text-[20px] font-semibold text-foreground mb-2">No mission yet</h2>
 <p className="text-[15px] text-muted-foreground max-w-md">
 This workspace does not have a live mission loaded yet. Create one from Active Missions to see the overview, execution, evidence, verification, certificate, institution record, and logs tabs.
 </p>
 <button
 type="button"
 onClick={onBack}
 className="mt-6 btn-glossy-blue h-9 px-6 text-[13.5px] font-medium"
 >
 Back to Active Missions
 </button>
 </div>
 ) : error ? (
 <div className="bg-card border border-border rounded-md p-12 flex flex-col items-center justify-center text-center h-[400px]">
 <AlertTriangle className="size-12 text-[#C8C7BA] mb-4" />
 <h2 className="text-[20px] font-semibold text-foreground mb-2">Mission unavailable</h2>
 <p className="text-[15px] text-muted-foreground max-w-md">{error}</p>
 </div>
 ) : mission ? (
 <>
 {currentTab === "Overview" && <MissionDetailOverview mission={mission} />}
 {currentTab === "Execution" && <MissionDetailExecution mission={mission} />}
 {currentTab === "Evidence" && <MissionDetailEvidence mission={mission} />}
 {currentTab === "Verification" && <MissionDetailVerification mission={mission} />}
 {currentTab === "Logs" && <MissionDetailLogs mission={mission} />}
 {currentTab === "Certificate" && <MissionDetailCertificate mission={mission} />}
 {currentTab === "Institution Record" && (
 <div className="bg-card border border-border rounded-md p-8 flex flex-col gap-6">
 <div className="flex items-center gap-3">
 <div className="size-12 rounded-full bg-card border border-border flex items-center justify-center">
 <Database className="size-6 text-muted-foreground" />
 </div>
 <div>
 <h2 className="text-[20px] font-semibold text-foreground">Institution Record</h2>
 <p className="text-[15px] text-muted-foreground max-w-md">
 Live memory record written after execution and verification.
 </p>
 </div>
 </div>

 {memoryRecord ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary</div>
 <div className="text-[14px] text-foreground">{memoryRecord.summary ?? "No summary recorded."}</div>
 </div>

 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</div>
 <div className="text-[14px] text-foreground">{memoryRecord.status ?? "Unknown"}</div>
 </div>

 <div className="rounded-md border border-border bg-muted/50 p-6 md:col-span-2">
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Lessons</div>
 <div className="flex flex-wrap gap-2">
 {memoryLessons.length > 0 ? memoryLessons.map((lesson, index) => (
 <span key={`${lesson}-${index}`} className="px-2.5 py-1 rounded-full bg-card border border-border text-[13px] text-foreground/90">
 {lesson}
 </span>
 )) : <span className="text-[14px] text-muted-foreground">No lessons stored yet.</span>}
 </div>
 </div>

 <div className="rounded-md border border-border bg-muted/50 p-6 md:col-span-2">
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mistakes</div>
 <div className="flex flex-wrap gap-2">
 {memoryMistakes.length > 0 ? memoryMistakes.map((mistake, index) => (
 <span key={`${mistake}-${index}`} className="px-2.5 py-1 rounded-full bg-card border border-border text-[13px] text-foreground/90">
 {mistake}
 </span>
 )) : <span className="text-[14px] text-muted-foreground">No mistakes stored yet.</span>}
 </div>
 </div>

 <div className="rounded-md border border-border bg-muted/50 p-6 md:col-span-2">
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Suggested Improvements</div>
 <div className="flex flex-wrap gap-2">
 {memoryImprovements.length > 0 ? memoryImprovements.map((item, index) => (
 <span key={`${item}-${index}`} className="px-2.5 py-1 rounded-full bg-card border border-border text-[13px] text-foreground/90">
 {item}
 </span>
 )) : <span className="text-[14px] text-muted-foreground">No suggestions stored yet.</span>}
 </div>
 </div>
 </div>
 ) : (
 <div className="rounded-md border border-dashed border-border bg-muted/50 p-6 text-[14px] text-muted-foreground">
 This mission has not been written to institution memory yet.
 </div>
 )}
 </div>
 )}
 </>
 ) : null}
 </div>
 </div>
 );
}
