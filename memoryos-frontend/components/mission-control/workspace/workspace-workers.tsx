"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight,
    Server, Cpu, Activity, Play, Pause, Zap, CheckCircle2,
    XCircle, Clock, PauseCircle, Power, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "../universal-inspector";
import { createHorosWorker, listHorosAiCatalog, listHorosWorkers } from "@/lib/horos-api";
import { LiveFilterDropdown } from "../ui/live-filter-dropdown";

type WorkerRow = {
    id: string;
    name: string;
    type: string;
    provider: string;
    version: string;
    capabilities: string[];
    status: "Running" | "Available" | "Idle" | "Offline" | "Draining";
    heartbeat: "Live" | "Warning" | "Offline";
    assignments: number;
    leases: number;
    reliability: number;
    failureRate: number;
    latency: number; // ms
    cost: string;
};

const WORKER_CAPABILITY_OPTIONS = [
    "code", "tests", "files", "migration", "verification", "reasoning", "tools", "structured_output",
    "vision", "ocr", "embeddings", "audio", "browser", "repository.read", "repository.write", "test.run",
    "approval", "review", "judgement", "offline_queue", "telemetry", "edge_execution", "github", "slack", "linear", "jira",
];

function StatusBadge({ status }: { status: WorkerRow["status"] }) {
    switch (status) {
        case "Running": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider"><Play className="size-3" /> Running</span>;
        case "Available": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider"><CheckCircle2 className="size-3" /> Available</span>;
        case "Idle": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider"><CheckCircle2 className="size-3" /> Idle</span>;
        case "Offline": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border uppercase tracking-wider"><XCircle className="size-3" /> Offline</span>;
        case "Draining": return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase tracking-wider"><Clock className="size-3" /> Draining</span>;
    }
}

function HeartbeatIndicator({ heartbeat }: { heartbeat: WorkerRow["heartbeat"] }) {
    if (heartbeat === "Live") return <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span></span>;
    if (heartbeat === "Warning") return <span className="flex h-2 w-2 rounded-full bg-orange-500" />;
    return <span className="flex h-2 w-2 rounded-full bg-muted-foreground/50" />;
}

function mapWorkerStatus(value: unknown): WorkerRow["status"] {
    switch (String(value ?? "offline").toLowerCase()) {
        case "available":
        case "ready":
            return "Available";
        case "running":
        case "busy":
        case "executing":
            return "Running";
        case "draining":
            return "Draining";
        case "idle":
            return "Idle";
        default:
            return "Offline";
    }
}

function mapHeartbeat(value: unknown): WorkerRow["heartbeat"] {
    if (!value) return "Offline";
    const ageMs = Date.now() - new Date(String(value)).getTime();
    if (!Number.isFinite(ageMs) || ageMs > 120_000) return "Offline";
    if (ageMs > 30_000) return "Warning";
    return "Live";
}

function toWorkerRow(item: Record<string, unknown>): WorkerRow {
    const metadata = item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? item.metadata as Record<string, unknown>
        : {};
    const lastHeartbeat = item.lastHeartbeat;
    return {
        id: String(item.id ?? "worker"),
        name: String(item.name ?? item.id ?? "Worker"),
        type: String(item.kind ?? "Agent"),
        provider: String(item.provider ?? metadata.provider ?? "Local"),
        version: String(item.version ?? metadata.model ?? "-"),
        capabilities: Array.isArray(item.capabilities) ? item.capabilities.map(String) : [],
        status: mapWorkerStatus(item.status),
        heartbeat: mapHeartbeat(lastHeartbeat),
        assignments: Number(item.assignments ?? 0),
        leases: Number(item.leases ?? 0),
        reliability: Number(item.reliability ?? 0),
        failureRate: Number(item.failureRate ?? 0),
        latency: Number(item.latency ?? 0),
        cost: String(item.cost ?? "-"),
    };
}

export function WorkspaceWorkers({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [workers, setWorkers] = useState<WorkerRow[]>([]);
    const [loading, setLoading] = useState(Boolean(workspaceId));
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [providerFilter, setProviderFilter] = useState("All");
    const [capabilityFilter, setCapabilityFilter] = useState("All");
    const [registering, setRegistering] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [workerName, setWorkerName] = useState("");
    const [workerKind, setWorkerKind] = useState<"software" | "ai_agent" | "simulated_edge" | "human">("ai_agent");
    const [workerProvider, setWorkerProvider] = useState("OpenRouter");
    const [workerModel, setWorkerModel] = useState("");
    const [workerCapabilities, setWorkerCapabilities] = useState("code, repository.read, repository.write, tests, verification, review, github");
    const [workerMaxConcurrency, setWorkerMaxConcurrency] = useState("1");
    const [capabilitiesOpen, setCapabilitiesOpen] = useState(false);
    const [modelOptions, setModelOptions] = useState<string[]>([]);
    const [modelCatalogLoading, setModelCatalogLoading] = useState(false);
    const [registerError, setRegisterError] = useState<string | null>(null);
    useEffect(() => {
        if (!registerOpen) return;
        let cancelled = false;
        setModelCatalogLoading(true);
        void listHorosAiCatalog().then((catalog) => {
            if (cancelled) return;
            const provider = workerProvider.toLowerCase().replace(/\s+/g, "_");
            const models = catalog.models
                .filter((model) => String(model.provider ?? "").toLowerCase().replace(/\s+/g, "_") === provider)
                .map((model) => String(model.model ?? ""))
                .filter(Boolean);
            setModelOptions(Array.from(new Set(models)));
            if (!workerModel && models.length > 0) setWorkerModel(models[0]);
        }).catch(() => {
            if (!cancelled) setModelOptions([]);
        }).finally(() => {
            if (!cancelled) setModelCatalogLoading(false);
        });
        return () => { cancelled = true; };
    }, [registerOpen, workerProvider, workerModel]);
    const exportWorkers = () => {
        const blob = new Blob([JSON.stringify(visibleWorkers, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "horos-workers.json";
        anchor.click();
        URL.revokeObjectURL(url);
    };
    useEffect(() => {
        if (!workspaceId) return;
        let cancelled = false;
        const load = () => listHorosWorkers(workspaceId).then((items) => {
            if (cancelled) return;
            setLoadError(null);
            setWorkers(items.map((item) => toWorkerRow(item as unknown as Record<string, unknown>)));
        }).catch((reason) => {
            if (!cancelled) setLoadError(reason instanceof Error ? reason.message : "Could not load workers.");
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        void load();
        const interval = window.setInterval(() => void load(), 5000);
        return () => { cancelled = true; window.clearInterval(interval); };
    }, [workspaceId]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleWorkers.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleWorkers.map(m => m.id)));
    };

    const visibleWorkers = workers.filter((worker) => {
        const query = searchQuery.trim().toLowerCase();
        return (!query || JSON.stringify(worker).toLowerCase().includes(query)) &&
            (statusFilter === "All" || worker.status === statusFilter) &&
            (typeFilter === "All" || worker.type === typeFilter) &&
            (providerFilter === "All" || worker.provider === providerFilter) &&
            (capabilityFilter === "All" || worker.capabilities.includes(capabilityFilter));
    });

    const registerWorker = async () => {
        if (!workspaceId || registering) return;
        if (!workerName.trim()) {
            setRegisterError("Enter a worker name.");
            return;
        }
        setRegistering(true);
        setRegisterError(null);
        try {
            const capabilities = workerCapabilities
                .split(",")
                .map((capability) => capability.trim())
                .filter(Boolean);
            const maxConcurrency = Number(workerMaxConcurrency);
            if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1 || maxConcurrency > 100) {
                setRegisterError("Max concurrency must be a whole number from 1 to 100.");
                return;
            }
            if (workerKind === "ai_agent" && workerProvider === "Local") {
                setRegisterError("AI agents must use a configured model provider. Select OpenRouter or another provider, not Local.");
                return;
            }
            if (workerKind === "ai_agent" && !workerModel.trim()) {
                setRegisterError("Select a model for the AI agent before registering it.");
                return;
            }
            if (workerKind === "ai_agent" && !capabilities.includes("verification")) {
                setRegisterError("AI agents must include the verification capability.");
                return;
            }
            await createHorosWorker(workspaceId, {
                kind: workerKind,
                name: workerName.trim(),
                capabilities,
                maxConcurrency,
                metadata: {
                    provider: workerProvider.trim() || "Local",
                    ...(workerModel.trim() ? { model: workerModel.trim() } : {}),
                },
            });
            const items = await listHorosWorkers(workspaceId);
            setWorkers(items.map((item) => toWorkerRow(item as unknown as Record<string, unknown>)));
            setWorkerName("");
            setWorkerKind("ai_agent");
            setWorkerProvider("OpenRouter");
            setWorkerModel("");
            setWorkerCapabilities("code, repository.read, repository.write, tests, verification, review, github");
            setWorkerMaxConcurrency("1");
            setCapabilitiesOpen(false);
            setRegisterOpen(false);
        } catch (cause) {
            setRegisterError(cause instanceof Error ? cause.message : "Worker registration failed.");
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 border-b border-border bg-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Worker Registry</h1>
                    {loading ? <span className="text-xs text-muted-foreground">Loading live workers...</span> : null}
                    {loadError ? <span className="text-xs text-red-500">{loadError}</span> : null}
                    <div className="flex items-center gap-2">
                        <button onClick={exportWorkers} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                        <button onClick={() => { setRegisterError(null); setRegisterOpen(true); }} disabled={registering} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                            <Plus className="size-3.5" />
                            Register Worker
                        </button>
                    </div>
                </div>

                <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search workers, models..." 
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Worker Type" value={typeFilter} options={["All", ...Array.from(new Set(workers.map((worker) => worker.type)))]} onChange={setTypeFilter} />
                        <LiveFilterDropdown label="Provider" value={providerFilter} options={["All", ...Array.from(new Set(workers.map((worker) => worker.provider)))]} onChange={setProviderFilter} />
                        <LiveFilterDropdown label="Status" value={statusFilter} options={["All", ...Array.from(new Set(workers.map((worker) => worker.status)))]} onChange={setStatusFilter} />
                        <LiveFilterDropdown label="Capabilities" value={capabilityFilter} options={["All", ...Array.from(new Set(workers.flatMap((worker) => worker.capabilities)))]} onChange={setCapabilityFilter} />
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                        {selectedRows.size > 0 ? <span className="text-[11px] font-medium text-muted-foreground">{selectedRows.size} selected</span> : null}
                    </div>
                </div>
            </div>

            {registerOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="register-worker-title">
                <form onSubmit={(event) => { event.preventDefault(); void registerWorker(); }} className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl">
                    <h2 id="register-worker-title" className="text-base font-semibold text-foreground">Register worker</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Register a governed execution worker in this workspace.</p>
                    <label className="mt-5 block text-xs font-semibold text-foreground">Worker name<input autoFocus value={workerName} onChange={(event) => setWorkerName(event.target.value)} placeholder="e.g. Build Worker" className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="block text-xs font-semibold text-foreground">Kind<select value={workerKind} onChange={(event) => setWorkerKind(event.target.value as typeof workerKind)} className="mt-2 h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary"><option value="software">Software</option><option value="ai_agent">AI agent</option><option value="simulated_edge">Simulated edge</option><option value="human">Human reviewer</option></select></label>
                        <label className="block text-xs font-semibold text-foreground">Max concurrency<input type="number" min="1" max="100" value={workerMaxConcurrency} onChange={(event) => setWorkerMaxConcurrency(event.target.value)} className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="block text-xs font-semibold text-foreground">Provider<select value={workerProvider} onChange={(event) => setWorkerProvider(event.target.value)} className="mt-2 h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary"><option value="Local">Local</option><option value="OpenRouter">OpenRouter</option><option value="OpenAI">OpenAI</option><option value="Anthropic">Anthropic</option><option value="Gemini">Gemini</option><option value="DeepSeek">DeepSeek</option><option value="Ollama">Ollama</option><option value="vLLM">vLLM</option><option value="LM Studio">LM Studio</option><option value="NVIDIA NIM">NVIDIA NIM</option><option value="Human">Human</option><option value="Custom">Custom</option></select></label>
                        <label className="block text-xs font-semibold text-foreground">Model <span className="font-normal text-muted-foreground">(optional)</span><select value={workerModel} onChange={(event) => setWorkerModel(event.target.value)} className="mt-2 h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary"><option value="">{modelCatalogLoading ? "Loading models..." : "No model selected"}</option>{modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}<option value="__custom__">Custom model...</option></select>{workerModel === "__custom__" && <input autoFocus onChange={(event) => setWorkerModel(event.target.value)} placeholder="provider/model-id" className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" />}</label>
                    </div>
                    <div className="relative mt-4">
                        <span className="block text-xs font-semibold text-foreground">Capabilities <span className="font-normal text-muted-foreground">(select one or more)</span></span>
                        <button type="button" onClick={() => setCapabilitiesOpen((open) => !open)} className="mt-2 flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-left text-sm outline-none focus:ring-2 focus:ring-primary">
                            <span className="truncate">{workerCapabilities || "Select capabilities"}</span>
                            <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", capabilitiesOpen && "rotate-180")} />
                        </button>
                        {capabilitiesOpen && <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-card p-2 shadow-xl">
                            {WORKER_CAPABILITY_OPTIONS.map((capability) => {
                                const selected = workerCapabilities.split(",").map((item) => item.trim()).filter(Boolean).includes(capability);
                                return <label key={capability} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground hover:bg-muted"><input type="checkbox" checked={selected} onChange={() => { const values = new Set(workerCapabilities.split(",").map((item) => item.trim()).filter(Boolean)); if (values.has(capability)) values.delete(capability); else values.add(capability); setWorkerCapabilities(Array.from(values).join(", ")); }} className="size-3.5 rounded border-border text-primary focus:ring-primary" />{capability}</label>;
                            })}
                        </div>}
                        <span className="mt-1 block text-[11px] font-normal text-muted-foreground">Choose the capabilities this worker can actually perform.</span>
                    </div>
                    {registerError && <p className="mt-2 text-xs text-red-500">{registerError}</p>}
                    <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { setRegisterOpen(false); setRegisterError(null); }} className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Cancel</button><button type="submit" disabled={registering} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{registering ? "Registering..." : "Register worker"}</button></div>
                </form>
            </div>}

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === workers.length && workers.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Worker / Version</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Provider</th>
                            <th className="px-4 py-3 font-semibold">Capabilities</th>
                            <th className="px-4 py-3 font-semibold text-center">Heartbeat</th>
                            <th className="px-4 py-3 font-semibold text-center">Assignments</th>
                            <th className="px-4 py-3 font-semibold text-center">Leases</th>
                            <th className="px-4 py-3 font-semibold text-right">Reliability</th>
                            <th className="px-4 py-3 font-semibold text-right">Fail Rate</th>
                            <th className="px-4 py-3 font-semibold text-right">Latency</th>
                            <th className="px-4 py-3 font-semibold text-right">Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {visibleWorkers.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-6 py-20 text-center">
                                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                                        <Server className="size-7 text-muted-foreground/50" />
                                        <p className="text-sm font-semibold text-foreground">{loading ? "Loading workers" : "No workers registered"}</p>
                                        <p className="text-xs text-muted-foreground">{loadError ? "The worker registry could not be loaded. Refresh after the backend is available." : "This workspace has no worker records yet. Register a worker to make it available for missions."}</p>
                                        {!loading && !loadError ? <button type="button" onClick={() => setRegisterOpen(true)} className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Register Worker</button> : null}
                                    </div>
                                </td>
                            </tr>
                        ) : visibleWorkers.map((worker) => (
                            <tr 
                                key={worker.id} 
                                onClick={() => openInspector("worker", worker)}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(worker.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(worker.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(worker.id)} readOnly />
                                </td>
                                <td className="px-4 py-4">
                                    <StatusBadge status={worker.status} />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{worker.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-mono text-muted-foreground">{worker.id}</span>
                                            <span className="text-[10px] bg-muted px-1.5 rounded text-muted-foreground">{worker.version}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-muted-foreground">{worker.type}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <Server className="size-4 text-muted-foreground" />
                                        <span className="text-foreground">{worker.provider}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {worker.capabilities.map(cap => (
                                            <span key={cap} className="px-1.5 py-0.5 border border-border/50 bg-card rounded text-[10px] text-muted-foreground">{cap}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex justify-center">
                                        <HeartbeatIndicator heartbeat={worker.heartbeat} />
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-medium text-foreground">{worker.assignments}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="font-medium text-foreground">{worker.leases}</span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className={cn(
                                        "font-mono font-medium text-xs",
                                        worker.reliability > 99 ? "text-emerald-500" : worker.reliability > 95 ? "text-yellow-500" : "text-red-500"
                                    )}>
                                        {worker.reliability.toFixed(1)}%
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className={cn(
                                        "font-mono font-medium text-xs",
                                        worker.failureRate < 1 ? "text-emerald-500" : worker.failureRate < 5 ? "text-yellow-500" : "text-red-500"
                                    )}>
                                        {worker.failureRate.toFixed(1)}%
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className={cn(
                                        "font-mono text-xs text-muted-foreground",
                                        worker.latency === 0 ? "opacity-50" : ""
                                    )}>
                                        {worker.latency}ms
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right text-foreground font-mono text-xs">
                                    {worker.cost}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
