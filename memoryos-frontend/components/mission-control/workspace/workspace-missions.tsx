"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, 
    MoreHorizontal, CheckCircle2, XCircle, Clock, 
    ChevronLeft, ChevronRight, Activity, Zap, Server, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { Progress } from "@/components/ui/progress";
import { createDhyraMission, decideDhyraMissionApproval, listDhyraInstitutions, listDhyraMissions, queueDhyraMission, type DhyraInstitution, type DhyraMissionDetail } from "@/lib/dhyra-api";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

type MissionRow = {
    id: string;
    name: string;
    objective: string;
    repository: string;
    baseBranch: string;
    workingBranch: string;
    institution: string;
    owner: string;
    priority: "P0" | "P1" | "P2" | "P3" | "-";
    state: "Draft" | "Running" | "Failed" | "Success" | "Cancelled" | "Recovering" | "Queued" | "Waiting Review";
    currentStep: string;
    worker: string;
    progress: number;
    verification: "Passed" | "Failed" | "Pending" | "N/A";
    approval: "Required" | "Approved" | "Auto";
    evidenceCount: number;
    started: string;
    updated: string;
    duration: string;
    cost: string;
};

function StateBadge({ state }: { state: MissionRow["state"] }) {
    switch (state) {
        case "Draft": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border uppercase tracking-wider"><Clock className="size-3" /> Draft</span>;
        case "Running": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider"><Activity className="size-3" /> Running</span>;
        case "Failed": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider"><XCircle className="size-3" /> Failed</span>;
        case "Cancelled": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border uppercase tracking-wider"><XCircle className="size-3" /> Cancelled</span>;
        case "Success": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider"><CheckCircle2 className="size-3" /> Success</span>;
        case "Recovering": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase tracking-wider"><RefreshCw className="size-3" /> Recovering</span>;
        case "Waiting Review": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider"><Clock className="size-3" /> Waiting Review</span>;
        case "Queued": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border uppercase tracking-wider"><Clock className="size-3" /> Queued</span>;
    }
}

function PriorityBadge({ priority }: { priority: MissionRow["priority"] }) {
    switch (priority) {
        case "P0": return <span className="text-[11px] font-bold text-red-500 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">P0</span>;
        case "P1": return <span className="text-[11px] font-bold text-orange-500 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">P1</span>;
        case "P2": return <span className="text-[11px] font-bold text-yellow-500 px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">P2</span>;
        case "P3": return <span className="text-[11px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50 border border-border">P3</span>;
        case "-": return <span className="text-[11px] text-muted-foreground">-</span>;
    }
}

function toMissionRow(mission: DhyraMissionDetail | null | undefined): MissionRow | null {
    if (!mission || typeof mission !== "object" || !mission.id) return null;
    const normalizedState = (mission.state || "queued").toLowerCase();
    const state: MissionRow["state"] = normalizedState === "draft" ? "Draft" : normalizedState === "completed" ? "Success" : normalizedState === "failed" ? "Failed" : normalizedState === "cancelled" ? "Cancelled" : normalizedState === "recovering" ? "Recovering" : normalizedState === "running" ? "Running" : normalizedState === "waiting_review" ? "Waiting Review" : "Queued";
    // A prior failed attempt must not make an active review row look failed.
    // The mission lifecycle is authoritative until the current attempt has a
    // terminal verification result.
    const verification = ["waiting_review", "running", "queued", "recovering", "cancelled"].includes(normalizedState)
        ? undefined
        : mission.verificationRun?.finalDecision?.toUpperCase();
    const humanApproval = (mission.executionRun as any)?.human?.status;

    return {
        id: mission.id,
        name: mission.title || mission.id,
        objective: mission.objective || "No objective recorded",
        repository: mission.repository || "-",
        baseBranch: mission.baseBranch || "-",
        workingBranch: mission.workingBranch || "-",
        institution: mission.institution?.name || "Unassigned institution",
        owner: String((mission as any).owner?.name ?? (mission as any).owner ?? "-"),
        priority: (String((mission as any).priority ?? "-").toUpperCase() as MissionRow["priority"]),
        state,
        currentStep: mission.currentStep || "Awaiting execution",
        worker: String((mission as any).worker?.name ?? (mission as any).workerId ?? "-"),
        progress: Number((mission as any).progress ?? (state === "Success" ? 100 : 0)),
        verification: verification === "PASS" ? "Passed" : verification === "FAIL" ? "Failed" : "Pending",
        approval: humanApproval === "approved" ? "Approved" : !mission.authorityPolicies?.length || mission.authorityPolicies.some((policy) => policy.needsApproval) ? "Required" : "Auto",
        evidenceCount: mission.evidence?.length || 0,
        started: mission.startedAt ? new Date(mission.startedAt).toLocaleTimeString() : "-",
        updated: mission.updatedAt ? new Date(mission.updatedAt).toLocaleTimeString() : "-",
        duration: mission.executionRun?.finishedAt ? "Completed" : "-",
        cost: "-",
    };
}

export function WorkspaceMissions({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [missions, setMissions] = useState<MissionRow[]>([]);
    const [institutions, setInstitutions] = useState<DhyraInstitution[]>([]);
    const [institutionsLoading, setInstitutionsLoading] = useState(Boolean(workspaceId));
    const [loading, setLoading] = useState(Boolean(workspaceId));
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [stateFilter, setStateFilter] = useState<"All" | MissionRow["state"]>("All");
    const [view, setView] = useState<"all" | "mine" | "failed">("all");
    const [dateRange, setDateRange] = useState<"all" | "24h" | "7d">("all");
    const [institutionFilter, setInstitutionFilter] = useState("All");
    const [ownerFilter, setOwnerFilter] = useState("All");
    const [workerFilter, setWorkerFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [composerOpen, setComposerOpen] = useState(false);
    const [newInstitutionId, setNewInstitutionId] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [newObjective, setNewObjective] = useState("");
    const [newRepository, setNewRepository] = useState("");
    const [newBaseBranch, setNewBaseBranch] = useState("main");
    const [newWorkingBranch, setNewWorkingBranch] = useState("");
    const [newAllowedFiles, setNewAllowedFiles] = useState("");
    const [newChange, setNewChange] = useState("");
    const [newTests, setNewTests] = useState("");
    const [newValidation, setNewValidation] = useState("");
    const [requireHumanApproval, setRequireHumanApproval] = useState(true);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [actingMissionId, setActingMissionId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const exportMissions = () => {
        const blob = new Blob([JSON.stringify(visibleMissions, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dhyra-missions-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const submitMission = async (event: React.FormEvent) => {
        event.preventDefault();
        const repository = newRepository.trim();
        const baseBranch = newBaseBranch.trim() || "main";
        const workingBranch = newWorkingBranch.trim();
        const allowedFiles = newAllowedFiles.trim();
        const change = newChange.trim();
        const tests = newTests.trim();
        const validation = newValidation.trim();
        if (!workspaceId || !newInstitutionId.trim() || !newTitle.trim() || !newObjective.trim()) {
            setCreateError(institutions.length === 0 ? "Create an institution before creating a mission." : "Institution, title, and objective are required.");
            return;
        }
        if ((repository || workingBranch) && !repository) {
            setCreateError("Repository is required when a branch target is provided.");
            return;
        }
        if (repository && !workingBranch) {
            setCreateError("Working branch is required for repository missions.");
            return;
        }
        if (repository && (!allowedFiles || !change || !tests || !validation)) {
            setCreateError("Repository missions require allowed files, change, tests, and validation.");
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            const mission = await createDhyraMission(workspaceId, {
                institutionId: newInstitutionId.trim(),
                title: newTitle.trim(),
                objective: newObjective.trim(),
                repository: repository || undefined,
                baseBranch: repository ? baseBranch : undefined,
                workingBranch: workingBranch || undefined,
                acceptanceCriteria: repository
                    ? [
                        "Allowed files: " + allowedFiles,
                        "Requested change: " + change,
                        "Tests: " + tests,
                        "Validation: " + validation,
                        "Pull request required",
                        "Merge forbidden",
                    ]
                    : undefined,
                authority: requireHumanApproval
                    ? {
                        name: "Mission Control human approval",
                        canExecute: true,
                        needsApproval: true,
                        permissions: ["mission.execute", "evidence.write", "mission.verify"],
                        approvals: ["human"],
                        checks: ["authority", "execution", "verification"],
                    }
                    : undefined,
                proof: repository
                    ? {
                        executionSpec: {
                            allowedFiles: allowedFiles.split(",").map((value) => value.trim()).filter(Boolean),
                            change,
                            tests,
                            validation,
                            pullRequestRequired: true,
                            mergeAllowed: false,
                        },
                    }
                    : undefined,
            });
            const row = toMissionRow(mission);
            if (row) setMissions((current) => [row, ...current.filter((item) => item.id !== mission.id)]);
            setComposerOpen(false);
            setNewInstitutionId("");
            setNewTitle("");
            setNewObjective("");
            setNewRepository("");
            setNewBaseBranch("main");
            setNewWorkingBranch("");
            setNewAllowedFiles("");
            setNewChange("");
            setNewTests("");
            setNewValidation("");
            setRequireHumanApproval(true);
        } catch (reason) {
            setCreateError(reason instanceof Error ? reason.message : "Could not create mission.");
        } finally {
            setCreating(false);
        }
    };

    const approveMission = async (missionId: string) => {
        if (!workspaceId) return;
        setActingMissionId(missionId);
        setActionError(null);
        try {
            const result = await decideDhyraMissionApproval(workspaceId, missionId, "approved", "Approved by Mission Control operator.");
            const row = toMissionRow(result);
            if (row) setMissions((current) => [row, ...current.filter((item) => item.id !== missionId)]);
        } catch (reason) {
            setActionError(reason instanceof Error ? reason.message : "Could not approve mission.");
        } finally {
            setActingMissionId(null);
        }
    };

    const queueMission = async (missionId: string) => {
        if (!workspaceId) return;
        setActingMissionId(missionId);
        setActionError(null);
        try {
            await queueDhyraMission(workspaceId, missionId);
            const refreshed = await listDhyraMissions(workspaceId);
            setMissions(refreshed.map(toMissionRow).filter((row): row is MissionRow => row !== null));
        } catch (reason) {
            setActionError(reason instanceof Error ? reason.message : "Could not queue mission.");
        } finally {
            setActingMissionId(null);
        }
    };

    useEffect(() => {
        let cancelled = false;
        if (!workspaceId) {
            setLoading(false);
            return;
        }

        const load = () => listDhyraMissions(workspaceId)
            .then((items) => {
                if (!cancelled) {
                    setMissions(items.map(toMissionRow).filter((row): row is MissionRow => row !== null));
                    setError(null);
                }
            })
            .catch((reason) => {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load missions.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        void load();
        setInstitutionsLoading(true);
        void listDhyraInstitutions(workspaceId)
            .then((items) => {
                if (!cancelled) {
                    setInstitutions(items);
                    setNewInstitutionId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id ?? "");
                }
            })
            .catch((reason) => {
                if (!cancelled) setCreateError(reason instanceof Error ? reason.message : "Could not load institutions.");
            })
            .finally(() => {
                if (!cancelled) setInstitutionsLoading(false);
            });
        const interval = window.setInterval(() => void load(), 5000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [workspaceId]);

    const visibleMissions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const cutoff = dateRange === "24h" ? Date.now() - 24 * 60 * 60 * 1000 : dateRange === "7d" ? Date.now() - 7 * 24 * 60 * 60 * 1000 : 0;
        return missions.filter((mission) => {
            const matchesSearch = !query || [mission.id, mission.name, mission.objective, mission.institution, mission.owner, mission.worker].some((value) => value.toLowerCase().includes(query));
            const matchesState = stateFilter === "All" || mission.state === stateFilter;
            const matchesView = view !== "failed" || mission.state === "Failed";
            const matchesInstitution = institutionFilter === "All" || mission.institution === institutionFilter;
            const matchesOwner = ownerFilter === "All" || mission.owner === ownerFilter;
            const matchesWorker = workerFilter === "All" || mission.worker === workerFilter;
            const matchesPriority = priorityFilter === "All" || mission.priority === priorityFilter;
            const timestamp = Date.parse(mission.updated);
            const matchesDate = !cutoff || (Number.isFinite(timestamp) && timestamp >= cutoff);
            return matchesSearch && matchesState && matchesView && matchesInstitution && matchesOwner && matchesWorker && matchesPriority && matchesDate;
        });
    }, [missions, searchQuery, stateFilter, view, dateRange, institutionFilter, ownerFilter, workerFilter, priorityFilter]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleMissions.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleMissions.map(m => m.id)));
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                     <div>
                         <h1 className="text-xl font-bold tracking-tight text-foreground">Missions</h1>
                         {loading ? <p className="text-xs text-muted-foreground mt-1">Loading live mission data...</p> : null}
                         {error ? <p className="text-xs text-amber-600 mt-1">{error}</p> : null}
                         {actionError ? <p className="text-xs text-red-500 mt-1">{actionError}</p> : null}
                     </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportMissions} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button onClick={() => setComposerOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                            <Zap className="size-3.5" />
                            New Mission
                        </button>
                    </div>
                </div>

                <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search missions, workers, IDs..." 
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="State" value={stateFilter} options={["All", "Draft", "Running", "Failed", "Recovering", "Waiting Review", "Queued", "Success"]} onChange={(value) => setStateFilter(value as typeof stateFilter)} />
                        <LiveFilterDropdown label="Institution" value={institutionFilter} options={["All", ...Array.from(new Set(missions.map((mission) => mission.institution)))]} onChange={setInstitutionFilter} />
                        <LiveFilterDropdown label="Owner" value={ownerFilter} options={["All", ...Array.from(new Set(missions.map((mission) => mission.owner)))]} onChange={setOwnerFilter} />
                        <LiveFilterDropdown label="Worker" value={workerFilter} options={["All", ...Array.from(new Set(missions.map((mission) => mission.worker)))]} onChange={setWorkerFilter} />
                        <LiveFilterDropdown label="Priority" value={priorityFilter} options={["All", "P0", "P1", "P2", "P3"]} onChange={setPriorityFilter} />
                        <LiveFilterDropdown label="Date Range" value={dateRange === "all" ? "All" : dateRange} options={["All", "24h", "7d"]} onChange={(value) => setDateRange(value === "All" ? "all" : value as typeof dateRange)} />
                        <button onClick={() => setStateFilter("All")} className="flex items-center gap-1.5 text-[11px] font-medium text-blue-500 hover:text-blue-400 transition-colors px-2 py-1 shrink-0">
                            Saved Views <ChevronDown className="size-3" />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="flex items-center gap-1 text-xs font-medium shrink-0">
                            <button onClick={() => setView("all")} className={cn("px-3 py-1.5 rounded-md", view === "all" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 transition-colors")}>All Missions</button>
                            <button onClick={() => setView("mine")} className={cn("px-3 py-1.5 rounded-md", view === "mine" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 transition-colors")}>My Operations</button>
                            <button onClick={() => setView("failed")} className={cn("px-3 py-1.5 rounded-md", view === "failed" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 transition-colors")}>Failed</button>
                        </div>
                        {selectedRows.size > 0 ? <span className="text-[11px] font-medium text-muted-foreground">{selectedRows.size} selected</span> : null}
                    </div>
                </div>
            </div>

            {composerOpen ? (
                <div className="border-b border-border bg-card px-6 py-4">
                    <form onSubmit={submitMission} className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Institution
                            <select
                                value={newInstitutionId}
                                onChange={(event) => setNewInstitutionId(event.target.value)}
                                disabled={institutionsLoading || institutions.length === 0}
                                className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <option value="">{institutionsLoading ? "Loading institutions..." : institutions.length === 0 ? "No institutions available" : "Select institution"}</option>
                                {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
                            </select>
                        </label>
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Mission title
                            <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="GitHub coding safety test" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                        </label>
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:col-span-2">
                            Objective
                            <input value={newObjective} onChange={(event) => setNewObjective(event.target.value)} placeholder="Describe the outcome to verify" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                        </label>
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Repository
                            <input value={newRepository} onChange={(event) => setNewRepository(event.target.value)} placeholder="owner/repository" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                        </label>
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Base branch
                            <input value={newBaseBranch} onChange={(event) => setNewBaseBranch(event.target.value)} placeholder="main" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                        </label>
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Working branch
                            <input value={newWorkingBranch} onChange={(event) => setNewWorkingBranch(event.target.value)} placeholder="dhyra/fix-auth" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                        </label>
                        <div className="border-t border-border pt-3 md:col-span-4">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Execution specification</p>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Allowed files
                                    <input value={newAllowedFiles} onChange={(event) => setNewAllowedFiles(event.target.value)} placeholder="README.md" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                                </label>
                                <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:col-span-2">
                                    Requested change
                                    <input value={newChange} onChange={(event) => setNewChange(event.target.value)} placeholder="Add a short local-development setup section" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                                </label>
                                <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Tests
                                    <input value={newTests} onChange={(event) => setNewTests(event.target.value)} placeholder="npm test" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                                </label>
                                <label className="flex min-w-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:col-span-2">
                                    Validation
                                    <input value={newValidation} onChange={(event) => setNewValidation(event.target.value)} placeholder="npm run lint && npm run typecheck" className="h-8 border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground" />
                                </label>
                                <div className="flex items-end pb-1 text-[11px] text-muted-foreground md:col-span-2">Pull request required. Merge is forbidden by this mission spec.</div>
                                <label className="flex items-center gap-2 text-[11px] font-medium normal-case tracking-normal text-foreground md:col-span-2">
                                    <input type="checkbox" checked={requireHumanApproval} onChange={(event) => setRequireHumanApproval(event.target.checked)} className="size-3.5 rounded border-border text-primary focus:ring-primary" />
                                    Require human approval before execution
                                </label>
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground md:col-span-4">Repository missions require both a base branch and an isolated working branch. Leave all three blank for non-repository missions.</p>
                        <div className="flex items-center gap-2 md:col-span-4">
                            <button type="submit" disabled={creating || institutionsLoading || institutions.length === 0} className="bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{creating ? "Creating..." : "Create mission"}</button>
                            <button type="button" onClick={() => setComposerOpen(false)} className="border border-border px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
                            {createError ? <span className="text-xs text-red-500">{createError}</span> : null}
                        </div>
                    </form>
                </div>
            ) : null}

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleMissions.length && visibleMissions.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold">State</th>
                            <th className="px-4 py-3 font-semibold">Mission</th>
                            <th className="px-4 py-3 font-semibold">Objective / Step</th>
                            <th className="px-4 py-3 font-semibold">Context</th>
                            <th className="px-4 py-3 font-semibold">Worker</th>
                            <th className="px-4 py-3 font-semibold w-32">Progress</th>
                            <th className="px-4 py-3 font-semibold">Validation</th>
                            <th className="px-4 py-3 font-semibold">Evidence</th>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold text-right">Cost</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {visibleMissions.map((m) => (
                            <tr 
                                key={m.id} 
                                onClick={() => openInspector("mission", { ...m, workspaceId })}
                                className={cn(
                                    "group cursor-pointer transition-colors text-sm hover:bg-muted/30",
                                    selectedRows.has(m.id) ? "bg-muted/40" : ""
                                )}
                            >
                                <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(m.id)} onChange={(e) => toggleRow(m.id, e as any)} />
                                </td>
                                <td className="px-4 py-3"><StateBadge state={m.state} /></td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{m.name}</span>
                                            <PriorityBadge priority={m.priority} />
                                        </div>
                                        <span className="text-[11px] font-mono text-muted-foreground mt-0.5">{m.id}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-foreground text-[13px] truncate max-w-[200px]">{m.objective}</span>
                                        <span className="text-[11.5px] text-muted-foreground truncate max-w-[200px] mt-0.5">{m.currentStep}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[12px] font-medium text-foreground">{m.institution}</span>
                                        <span className="text-[11px] text-muted-foreground mt-0.5">{m.repository === "-" ? m.owner : m.repository}</span>
                                        {m.repository !== "-" ? <span className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">{m.baseBranch} {"->"} {m.workingBranch}</span> : null}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="size-5 rounded bg-muted border border-border flex items-center justify-center shrink-0">
                                            <Server className="size-3 text-muted-foreground" />
                                        </div>
                                        <span className="text-[12px] font-medium text-foreground">{m.worker}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                            <span>Progress</span>
                                            <span>{m.progress}%</span>
                                        </div>
                                        <Progress value={m.progress} className={cn("h-1.5", m.state === "Failed" ? "bg-red-500/20" : "")} indicatorClassName={m.state === "Failed" ? "bg-red-500" : ""} />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col min-w-0 gap-1 text-[11px] font-medium">
                                        <span className={cn(
                                            m.verification === "Passed" ? "text-emerald-500" : 
                                            m.verification === "Failed" ? "text-red-500" : "text-muted-foreground"
                                        )}>Verif: {m.verification}</span>
                                        <span className={cn(
                                            m.approval === "Approved" ? "text-emerald-500" : 
                                            m.approval === "Required" ? "text-orange-500" : "text-muted-foreground"
                                        )}>Auth: {m.approval}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[12px] font-bold text-foreground">{m.evidenceCount}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase">Items</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col min-w-0 gap-1 text-[11px] font-mono text-muted-foreground">
                                        <span>Start: {m.started}</span>
                                        <span>Upd: {m.updated}</span>
                                        <span>Dur: {m.duration}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="text-[12px] font-mono font-medium text-foreground">{m.cost}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                    {m.state === "Waiting Review" && m.currentStep === "human_review" && m.approval === "Required" ? <button disabled={actingMissionId === m.id} className="rounded border border-amber-500/40 px-2 py-1 text-[10px] font-semibold text-amber-600 disabled:opacity-50" onClick={(e) => { e.stopPropagation(); void approveMission(m.id); }}>{actingMissionId === m.id ? "Approving..." : "Approve"}</button> : null}
                                        {m.state === "Queued" ? <button disabled={actingMissionId === m.id} className="rounded border border-blue-500/40 px-2 py-1 text-[10px] font-semibold text-blue-600 disabled:opacity-50" onClick={(e) => { e.stopPropagation(); void queueMission(m.id); }}>{actingMissionId === m.id ? "Queueing..." : "Queue"}</button> : null}
                                        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); openInspector("mission", { ...m, workspaceId }); }}>
                                            <MoreHorizontal className="size-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
