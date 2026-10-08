"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
 ChevronRight,
 Settings,
 Shield,
 Activity,
 FileText,
 Globe,
 Workflow,
 Play,
 CheckCircle2,
 Edit3,
 CopyPlus,
 Archive,
 Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
 archiveHorosInstitution,
 cloneHorosInstitution,
 createHorosMission,
 deleteHorosInstitution,
 getHorosInstitution,
 readActiveHorosWorkspaceId,
 updateHorosInstitution,
 type HorosInstitutionDetail,
} from "@/lib/horos-api";
import { InstitutionDetailOverview } from "./institution-detail-overview";

type DetailTab = "Overview" | "Missions" | "Authority" | "Verification" | "Institution Record" | "Settings";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
 return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function asString(value: unknown): string | null {
 return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
 if (typeof value === "number" && Number.isFinite(value)) return value;
 if (typeof value === "string" && value.trim().length > 0) {
 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : null;
 }
 return null;
}

function asBoolean(value: unknown): boolean | null {
 if (typeof value === "boolean") return value;
 if (typeof value === "string") {
 if (value === "true") return true;
 if (value === "false") return false;
 }
 return null;
}

function asStringArray(value: unknown): string[] {
 if (!Array.isArray(value)) return [];
 return value.map((item) => (typeof item === "string" ? item.trim() : String(item).trim())).filter(Boolean);
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
 const seconds = totalSeconds % 60;
 if (minutes < 60) return `${minutes}m ${seconds}s`;
 const hours = Math.floor(minutes / 60);
 const remainingMinutes = minutes % 60;
 return `${hours}h ${remainingMinutes}m`;
}

function formatRelativeTime(value?: string): string {
 if (!value) return "Unknown";
 const timestamp = new Date(value).getTime();
 if (!Number.isFinite(timestamp)) return "Unknown";
 const deltaMs = Date.now() - timestamp;
 const deltaMinutes = Math.round(deltaMs / 60000);
 const absMinutes = Math.abs(deltaMinutes);
 if (absMinutes < 1) return "Just now";
 if (absMinutes < 60) return `${absMinutes} min${absMinutes === 1 ? "" : "s"} ago`;
 const deltaHours = Math.round(deltaMinutes / 60);
 const absHours = Math.abs(deltaHours);
 if (absHours < 24) return `${absHours} hour${absHours === 1 ? "" : "s"} ago`;
 const deltaDays = Math.round(deltaHours / 24);
 const absDays = Math.abs(deltaDays);
 return `${absDays} day${absDays === 1 ? "" : "s"} ago`;
}

function readState(missionState?: string | null): string {
 return (missionState ?? "draft").replace(/_/g, " ");
}

function getTemplateDefinition(institution: HorosInstitutionDetail): AnyRecord {
 return asRecord(institution.template?.definition);
}

function getInstitutionMetadata(institution: HorosInstitutionDetail): AnyRecord {
 return asRecord(institution.metadata);
}

function getAuthorityDefaults(institution: HorosInstitutionDetail): AnyRecord {
 const metadata = getInstitutionMetadata(institution);
 const definition = getTemplateDefinition(institution);
 return asRecord(metadata.authorityPolicy ?? metadata.authority ?? definition.authority ?? {});
}

function getVerificationPolicy(institution: HorosInstitutionDetail): AnyRecord {
 const metadata = getInstitutionMetadata(institution);
 const definition = getTemplateDefinition(institution);
 return asRecord(metadata.verificationPolicy ?? metadata.verification ?? definition.verificationPolicy ?? {});
}

function joinOrNone(values: string[]): string {
 return values.length > 0 ? values.join(" • ") : "Not configured";
}

export function InstitutionDetailLayout({ id, onBack }: { id: string; onBack: () => void }) {
 const [activeTab, setActiveTab] = useState<DetailTab>("Overview");
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveHorosWorkspaceId());
 const [institution, setInstitution] = useState<HorosInstitutionDetail | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [launching, setLaunching] = useState(false);
 const [savingAction, setSavingAction] = useState<"rename" | "archive" | "clone" | "delete" | null>(null);
 const [renameOpen, setRenameOpen] = useState(false);
 const [renameDraft, setRenameDraft] = useState("");

 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveHorosWorkspaceId());
 syncWorkspace();
 window.addEventListener("focus", syncWorkspace);
 window.addEventListener("storage", syncWorkspace);
 return () => {
 window.removeEventListener("focus", syncWorkspace);
 window.removeEventListener("storage", syncWorkspace);
 };
 }, []);

 const reloadInstitution = useCallback(async () => {
 if (!workspaceId) {
 setInstitution(null);
 setLoading(false);
 setError("Select a workspace to view institution details.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const detail = await getHorosInstitution(workspaceId, id);
 setInstitution(detail);
 } catch (loadError) {
 setInstitution(null);
 setError(loadError instanceof Error ? loadError.message : "Failed to load institution.");
 } finally {
 setLoading(false);
 }
 }, [id, workspaceId]);

 useEffect(() => {
 let canceled = false;

 async function loadInstitution() {
 if (!workspaceId) {
 setInstitution(null);
 setLoading(false);
 setError("Select a workspace to view institution details.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const detail = await getHorosInstitution(workspaceId, id);
 if (!canceled) {
 setInstitution(detail);
 }
 } catch (loadError) {
 if (!canceled) {
 setInstitution(null);
 setError(loadError instanceof Error ? loadError.message : "Failed to load institution.");
 }
 } finally {
 if (!canceled) {
 setLoading(false);
 }
 }
 }

 void loadInstitution();
 return () => {
 canceled = true;
 };
 }, [id, workspaceId]);

 const tabs = [
 { name: "Overview", icon: <Activity className="size-4" /> },
 { name: "Missions", icon: <Workflow className="size-4" /> },
 { name: "Authority", icon: <Shield className="size-4" /> },
 { name: "Verification", icon: <FileText className="size-4" /> },
 { name: "Institution Record", icon: <Globe className="size-4" /> },
 { name: "Settings", icon: <Settings className="size-4" /> },
 ] as const;

 const status = institution?.status ?? institution?.currentState ?? "draft";
 const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
 const missions = useMemo(() => institution?.missions ?? [], [institution?.missions]);
 const policies = institution?.authorityPolicies ?? [];
 const memoryRecords = institution?.memoryRecords ?? [];
 const integrations = institution?.integrations ?? [];
 const latestMission = missions[0] ?? null;

 const missionStats = useMemo(() => {
 const completed = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "completed");
 const waitingReview = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "waiting_review");
 const successful = missions.filter((mission) => mission.verificationRun?.finalDecision === "PASS").length;
 const runtimes = completed
 .map((mission) => {
 const started = mission.executionRun?.startedAt ?? mission.startedAt ?? null;
 const finished = mission.executionRun?.finishedAt ?? mission.completedAt ?? null;
 return formatDuration(started ?? undefined, finished ?? undefined);
 })
 .filter((value) => value !== "—");

 return {
 completedCount: completed.length,
 waitingReviewCount: waitingReview.length,
 successRate: missions.length > 0 ? Math.round((successful / missions.length) * 100) : null,
 averageRuntime: runtimes[0] ?? "—",
 };
 }, [missions]);

 const authorityDefaults = institution ? getAuthorityDefaults(institution) : {};
 const verificationPolicy = institution ? getVerificationPolicy(institution) : {};
 const memoryLessons = memoryRecords.flatMap((record) => (Array.isArray(record.lessons) ? record.lessons : []));
 const memoryImprovements = memoryRecords.flatMap((record) => (Array.isArray(record.suggestedImprovements) ? record.suggestedImprovements : []));
 const uniquePatternCount = new Set(memoryImprovements).size;
 const uniqueLessonCount = new Set(memoryLessons).size;

 const handleLaunchMission = async () => {
 if (!workspaceId || !institution) return;
 setLaunching(true);
 setError(null);
 try {
 await createHorosMission(workspaceId, {
 institutionId: institution.id,
 title: `${institution.name} Mission`,
 objective: `Run a live mission for ${institution.name}.`,
 plan: ["Inspect the institution", "Execute the mission", "Collect evidence", "Verify the result"],
 });
 await reloadInstitution();
 setActiveTab("Missions");
 } catch (launchError) {
 setError(launchError instanceof Error ? launchError.message : "Failed to launch mission.");
 } finally {
 setLaunching(false);
 }
 };

 const handleRename = async () => {
 if (!institution) return;
 setRenameDraft(institution.name);
 setRenameOpen(true);
 };

 const submitRename = async () => {
 if (!workspaceId || !institution) return;
 const nextName = renameDraft.trim();
 if (!nextName || nextName === institution.name) {
 setRenameOpen(false);
 return;
 }
 setSavingAction("rename");
 setError(null);
 try {
 await updateHorosInstitution(workspaceId, institution.id, { name: nextName });
 setRenameOpen(false);
 await reloadInstitution();
 } catch (renameError) {
 setError(renameError instanceof Error ? renameError.message : "Failed to rename institution.");
 } finally {
 setSavingAction(null);
 }
 };

 const handleArchive = async () => {
 if (!workspaceId || !institution) return;
 if (!window.confirm("Archive this institution?")) return;
 setSavingAction("archive");
 setError(null);
 try {
 await archiveHorosInstitution(workspaceId, institution.id);
 await reloadInstitution();
 } catch (archiveError) {
 setError(archiveError instanceof Error ? archiveError.message : "Failed to archive institution.");
 } finally {
 setSavingAction(null);
 }
 };

 const handleClone = async () => {
 if (!workspaceId || !institution) return;
 setSavingAction("clone");
 setError(null);
 try {
 const clone = await cloneHorosInstitution(workspaceId, institution.id, {
 name: `${institution.name} Clone`,
 version: institution.version ?? "1.0.0",
 });
 const detail = await getHorosInstitution(workspaceId, clone.id);
 setInstitution(detail);
 setActiveTab("Overview");
 } catch (cloneError) {
 setError(cloneError instanceof Error ? cloneError.message : "Failed to clone institution.");
 } finally {
 setSavingAction(null);
 }
 };

 const handleDelete = async () => {
 if (!workspaceId || !institution) return;
 if (!window.confirm("Delete this institution? This cannot be undone.")) return;
 setSavingAction("delete");
 setError(null);
 try {
 await deleteHorosInstitution(workspaceId, institution.id);
 onBack();
 } catch (deleteError) {
 setError(deleteError instanceof Error ? deleteError.message : "Failed to delete institution.");
 } finally {
 setSavingAction(null);
 }
 };

 return (
 <div className="w-full flex flex-col pt-2 h-full font-sans">
 {renameOpen ? (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted5 px-6">
 <div className="w-full max-w-md rounded-md border border-[#2a2a2a] bg-[#141414] shadow-2xl">
 <div className="border-b border-white/10 px-6 py-6">
 <h2 className="text-[18px] font-semibold text-[#F0EFE2]">Rename institution</h2>
 <p className="mt-1 text-[13px] text-[#F0EFE2]/60">Update the live institution name without leaving the app.</p>
 </div>
 <div className="px-6 py-6">
 <label className="text-[12px] font-semibold uppercase tracking-wider text-[#F0EFE2]/60">New name</label>
 <input
 autoFocus
 value={renameDraft}
 onChange={(event) => setRenameDraft(event.target.value)}
 onKeyDown={(event) => {
 if (event.key === "Enter") {
 event.preventDefault();
 void submitRename();
 }
 }}
 className="mt-2 w-full rounded-md border border-white/15 bg-[#0f0f0f] px-3 py-2 text-[14px] text-[#F0EFE2] outline-none ring-0 placeholder:text-[#F0EFE2]/35 focus:border-[#f38020]"
 placeholder="Enter a new institution name"
 />
 <div className="mt-5 flex items-center justify-end gap-3">
 <button
 type="button"
 onClick={() => setRenameOpen(false)}
 className="rounded-md border border-white/15 px-6 py-2 text-[13px] font-medium text-[#F0EFE2]/80 hover:bg-card/5"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={() => void submitRename()}
 disabled={savingAction === "rename"}
 className="rounded-md bg-[#f38020] px-6 py-2 text-[13px] font-semibold text-[#F0EFE2] disabled:opacity-60"
 >
 {savingAction === "rename" ? "Saving..." : "Rename"}
 </button>
 </div>
 </div>
 </div>
 </div>
 ) : null}

 <div className="flex items-center gap-2 mb-6 text-[14px]">
 <span className="text-muted-foreground hover:text-foreground cursor-pointer font-medium transition-colors" onClick={onBack}>
 Institutions
 </span>
 <ChevronRight className="size-4 text-[#aaa]" />
 <span className="text-foreground font-semibold flex items-center gap-2">
 {institution?.name ?? `Institution ${id}`}
 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-card text-foreground/80 border border-border h-5">
 <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
 {statusLabel}
 </span>
 </span>
 </div>

 <div className="border-b border-border mb-6">
 <div className="flex items-center gap-6">
 {tabs.map((tab) => (
 <button
 key={tab.name}
 onClick={() => setActiveTab(tab.name)}
 className={cn(
 "flex items-center gap-2 pb-3 px-1 text-[14px] font-medium transition-all relative outline-none",
 activeTab === tab.name ? "text-foreground" : "text-muted-foreground hover:text-foreground/90",
 )}
 >
 <span className={cn("flex items-center justify-center transition-colors", activeTab === tab.name ? "text-foreground" : "text-muted-foreground")}>
 {tab.icon}
 </span>
 {tab.name}
 {activeTab === tab.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f38020] rounded-t-sm" />}
 </button>
 ))}
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 {loading ? (
 <div className="bg-card border border-border rounded-md p-12 flex flex-col items-center justify-center text-center h-[400px]">
 <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-6" />
 <h2 className="text-[20px] font-semibold text-foreground mb-2">Loading institution</h2>
 <p className="text-[15px] text-muted-foreground max-w-md">Fetching live data from HOROS for this workspace.</p>
 </div>
 ) : error ? (
 <div className="bg-card border border-border rounded-md p-12 flex flex-col items-center justify-center text-center h-[400px]">
 <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-6">
 <FileText className="size-7 text-muted-foreground" />
 </div>
 <h2 className="text-[20px] font-semibold text-foreground mb-2">Institution unavailable</h2>
 <p className="text-[15px] text-muted-foreground max-w-md">{error}</p>
 </div>
 ) : institution && activeTab === "Overview" ? (
 <InstitutionDetailOverview institution={institution} onLaunchMission={handleLaunchMission} launching={launching} />
 ) : institution && activeTab === "Missions" ? (
 <div className="bg-card border border-border rounded-md overflow-hidden">
 <div className="p-6 border-b border-border flex items-center justify-between">
 <div>
 <h2 className="text-[18px] font-bold text-foreground">Mission Queue</h2>
 <p className="text-[14px] text-muted-foreground">
 {missions.length} live missions, {missionStats.waitingReviewCount} waiting review
 </p>
 </div>
 <div className="text-[13px] text-muted-foreground">Latest updated {latestMission?.updatedAt ? new Date(latestMission.updatedAt).toLocaleString() : "unknown"}</div>
 </div>
 <div className="divide-y divide-[#eee]">
 {missions.length === 0 ? (
 <div className="p-8 text-[14px] text-muted-foreground">No missions have been created for this institution yet.</div>
 ) : (
 missions.map((mission) => (
 <div key={mission.id} className="p-6 flex items-start justify-between gap-6 hover:bg-muted/50">
 <div className="min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <Play className="size-4 text-[#0f52ff]" />
 <span className="text-[15px] font-semibold text-foreground">{mission.title ?? "Untitled mission"}</span>
 </div>
 <p className="text-[14px] text-muted-foreground line-clamp-2">{mission.objective ?? "No objective provided."}</p>
 <div className="mt-2 text-[12px] text-muted-foreground">
 {mission.currentStep ? `Current step: ${mission.currentStep}` : "No current step"}
 </div>
 </div>
 <div className="text-right shrink-0">
 <div className="text-[12px] text-muted-foreground mb-1">{readState(mission.state)}</div>
 <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium bg-card text-foreground/80 border border-border">
 <CheckCircle2 className="size-3.5" />
 {mission.verificationRun?.finalDecision ?? "pending"}
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 ) : institution && activeTab === "Authority" ? (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-card border border-border rounded-md overflow-hidden">
 <div className="p-6 border-b border-border">
 <h2 className="text-[18px] font-bold text-foreground">Default Policies</h2>
 <p className="text-[14px] text-muted-foreground">Institution governance defaults for this workspace.</p>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Policy Name</div>
 <div className="text-[14px] font-semibold text-foreground">{asString(authorityDefaults.name) ?? "Not configured"}</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Approval Rules</div>
 <div className="text-[14px] text-foreground">
 {joinOrNone(asStringArray(authorityDefaults.approvalRules ?? authorityDefaults.approval_rules))}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Allowed Tools</div>
 <div className="text-[14px] text-foreground">
 {joinOrNone(asStringArray(authorityDefaults.allowedTools ?? authorityDefaults.allowed_tools))}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Blocked</div>
 <div className="text-[14px] text-foreground">
 {joinOrNone(asStringArray(authorityDefaults.blocked ?? authorityDefaults.blockedTools ?? authorityDefaults.blocked_tools))}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Budget</div>
 <div className="text-[14px] text-foreground">{asString(authorityDefaults.budget) ?? "Not configured"}</div>
 </div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md overflow-hidden">
 <div className="p-6 border-b border-border">
 <h2 className="text-[18px] font-bold text-foreground">Live Policy Summary</h2>
 <p className="text-[14px] text-muted-foreground">Built from the institution template and stored authority configuration.</p>
 </div>
 <div className="p-6 space-y-4 text-[14px] text-muted-foreground">
 <div>Template: <span className="font-semibold text-foreground">{institution.template?.name ?? "No template"}</span></div>
 <div>Category: <span className="font-semibold text-foreground">{institution.category ?? "general"}</span></div>
 <div>Version: <span className="font-semibold text-foreground">{institution.version ?? "1.0.0"}</span></div>
 <div>Policies attached: <span className="font-semibold text-foreground">{policies.length}</span></div>
 </div>
 </div>
 </div>
 ) : institution && activeTab === "Verification" ? (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-card border border-border rounded-md overflow-hidden">
 <div className="p-6 border-b border-border">
 <h2 className="text-[18px] font-bold text-foreground">Verification Policy</h2>
 <p className="text-[14px] text-muted-foreground">Institution verification policy. Runtime verification belongs inside each mission.</p>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Required Evidence</div>
 <div className="text-[14px] text-foreground">
 {joinOrNone(asStringArray(verificationPolicy.requiredEvidence ?? verificationPolicy.evidence))}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Required Reviewers</div>
 <div className="text-[14px] text-foreground">
 {asNumber(verificationPolicy.requiredReviewers ?? verificationPolicy.reviewers) ?? "Not configured"}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Certificate Required</div>
 <div className="text-[14px] text-foreground">
 {(() => {
 const value = asBoolean(verificationPolicy.certificateRequired ?? verificationPolicy.certificate_required);
 if (value === null) return "Not configured";
 return value ? "YES" : "NO";
 })()}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Minimum Confidence</div>
 <div className="text-[14px] text-foreground">
 {asNumber(verificationPolicy.minimumConfidence ?? verificationPolicy.minimum_confidence) !== null
 ? `${asNumber(verificationPolicy.minimumConfidence ?? verificationPolicy.minimum_confidence)}%`
 : "Not configured"}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">PASS Threshold</div>
 <div className="text-[14px] text-foreground">
 {asNumber(verificationPolicy.passThreshold ?? verificationPolicy.pass_threshold) !== null
 ? `${asNumber(verificationPolicy.passThreshold ?? verificationPolicy.pass_threshold)}%`
 : "Not configured"}
 </div>
 </div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md overflow-hidden">
 <div className="p-6 border-b border-border">
 <h2 className="text-[18px] font-bold text-foreground">Policy Notes</h2>
 <p className="text-[14px] text-muted-foreground">If this institution has a template policy, the details above reflect it.</p>
 </div>
 <div className="p-6 space-y-3 text-[14px] text-muted-foreground">
 <div>Template: <span className="font-semibold text-foreground">{institution.template?.name ?? "No template"}</span></div>
 <div>Members: <span className="font-semibold text-foreground">{institution.memberCount ?? 0}</span></div>
 <div>Integrations: <span className="font-semibold text-foreground">{integrations.length}</span></div>
 <div>Mission queue is shown in the Missions tab, not here.</div>
 </div>
 </div>
 </div>
 ) : institution && activeTab === "Institution Record" ? (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-card border border-border rounded-md overflow-hidden">
 <div className="p-6 border-b border-border">
 <h2 className="text-[18px] font-bold text-foreground">Institution Memory</h2>
 <p className="text-[14px] text-muted-foreground">{memoryRecords.length} records captured in memory</p>
 </div>
 <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lessons</div>
 <div className="mt-1 text-[18px] font-semibold text-foreground">{uniqueLessonCount}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reusable Patterns</div>
 <div className="mt-1 text-[18px] font-semibold text-foreground">{uniquePatternCount}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Improved Policies</div>
 <div className="mt-1 text-[18px] font-semibold text-foreground">{policies.length}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Generated Templates</div>
 <div className="mt-1 text-[18px] font-semibold text-foreground">{institution.versions?.length ?? 0}</div>
 </div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md overflow-hidden">
 <div className="p-6 border-b border-border">
 <h2 className="text-[18px] font-bold text-foreground">Recent Memory Entries</h2>
 <p className="text-[14px] text-muted-foreground">No mission details here, only institution learning.</p>
 </div>
 <div className="divide-y divide-[#eee]">
 {memoryRecords.length === 0 ? (
 <div className="p-8 text-[14px] text-muted-foreground">No institution records have been captured yet.</div>
 ) : (
 memoryRecords.map((record) => (
 <div key={record.id} className="p-6">
 <div className="text-[15px] font-semibold text-foreground">{record.summary ?? record.id}</div>
 <div className="mt-1 text-[13px] text-muted-foreground">
 Updated {record.updatedAt ? formatRelativeTime(record.updatedAt) : "Unknown"}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 ) : institution && activeTab === "Settings" ? (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-card border border-border rounded-md p-6">
 <h2 className="text-[18px] font-bold text-foreground mb-4">Institution Settings</h2>
 <div className="space-y-3 text-[14px] text-muted-foreground">
 <div>Name: <span className="font-semibold text-foreground">{institution.name}</span></div>
 <div>Category: <span className="font-semibold text-foreground">{institution.category ?? "Uncategorized"}</span></div>
 <div>Template: <span className="font-semibold text-foreground">{institution.template?.name ?? "No template"}</span></div>
 <div>Version: <span className="font-semibold text-foreground">{institution.version ?? "v1"}</span></div>
 <div>Status: <span className="font-semibold text-foreground">{statusLabel}</span></div>
 <div>Members: <span className="font-semibold text-foreground">{institution.memberCount ?? 0}</span></div>
 <div>Integrations: <span className="font-semibold text-foreground">{integrations.length}</span></div>
 <div>Memory records: <span className="font-semibold text-foreground">{memoryRecords.length}</span></div>
 <div>Authority policies: <span className="font-semibold text-foreground">{policies.length}</span></div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6">
 <h2 className="text-[18px] font-bold text-foreground mb-4">Actions</h2>
 <div className="space-y-3">
 <button
 type="button"
 onClick={() => void handleRename()}
 disabled={savingAction !== null}
 className="w-full flex items-center justify-between rounded-md border border-border bg-muted/50 px-6 py-3 text-left hover:bg-card disabled:opacity-60"
 >
 <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
 <Edit3 className="size-4" />
 Rename
 </span>
 <span className="text-[12px] text-muted-foreground">{savingAction === "rename" ? "Saving..." : "Live"}</span>
 </button>
 <button
 type="button"
 onClick={() => void handleClone()}
 disabled={savingAction !== null}
 className="w-full flex items-center justify-between rounded-md border border-border bg-muted/50 px-6 py-3 text-left hover:bg-card disabled:opacity-60"
 >
 <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
 <CopyPlus className="size-4" />
 Clone
 </span>
 <span className="text-[12px] text-muted-foreground">{savingAction === "clone" ? "Cloning..." : "Live"}</span>
 </button>
 <button
 type="button"
 onClick={() => void handleArchive()}
 disabled={savingAction !== null}
 className="w-full flex items-center justify-between rounded-md border border-border bg-muted/50 px-6 py-3 text-left hover:bg-card disabled:opacity-60"
 >
 <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
 <Archive className="size-4" />
 Archive
 </span>
 <span className="text-[12px] text-muted-foreground">{savingAction === "archive" ? "Archiving..." : "Live"}</span>
 </button>
 <button
 type="button"
 onClick={() => void handleDelete()}
 disabled={savingAction !== null}
 className="w-full flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-6 py-3 text-left hover:bg-red-100 disabled:opacity-60"
 >
 <span className="flex items-center gap-2 text-[14px] font-medium text-red-700">
 <Trash2 className="size-4" />
 Delete
 </span>
 <span className="text-[12px] text-red-600">{savingAction === "delete" ? "Deleting..." : "Danger"}</span>
 </button>
 </div>

 <div className="mt-6 rounded-md border border-border bg-muted/50 p-6">
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Versions</div>
 <div className="space-y-3">
 {institution.versions?.length ? (
 institution.versions.map((version) => (
 <div key={version.id} className="text-[14px] text-muted-foreground border border-border rounded-md p-3 bg-card">
 <div className="font-semibold text-foreground">{version.version ?? version.id}</div>
 <div>{version.createdAt ? new Date(version.createdAt).toLocaleString() : "Unknown"}</div>
 </div>
 ))
 ) : (
 <div className="text-[14px] text-muted-foreground">No version history available yet.</div>
 )}
 </div>
 </div>
 </div>
 </div>
 ) : null}
 </div>
 </div>
 );
}
