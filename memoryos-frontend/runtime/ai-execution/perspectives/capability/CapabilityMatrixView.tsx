"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import {
    siDeepseek,
    siLmstudio,
    siNvidia,
    siOllama,
    siOpenrouter,
    siVllm,
} from "simple-icons";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { useAiExecutionOverview } from "../../use-ai-execution-overview";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { CATALOG_BRAND_PATHS } from "@/components/continuity-lab/brand-icons/catalog-brand-paths";
import { PathBrandIcon } from "@/components/continuity-lab/brand-icons/path-brand-icon";

type SimpleIconData = { path: string; hex: string };

function SimpleProviderIcon({ icon, label }: { icon: SimpleIconData; label: string }) {
    return (
        <svg
            aria-label={`${label} logo`}
            className="size-4 shrink-0"
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <title>{label}</title>
            <path d={icon.path} fill={`#${icon.hex}`} />
        </svg>
    );
}

function RuntimeProviderIcon({ label, tone }: { label: string; tone: string }) {
    return (
        <span
            aria-label={`${label} runtime`}
            className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] text-[8px] font-bold text-white", tone)}
            title={`${label} runtime`}
        >
            {label.slice(0, 2).toUpperCase()}
        </span>
    );
}

function ProviderBrandIcon({ provider }: { provider: string }) {
    const normalized = provider.toLowerCase().replace(/[\s-]+/g, "_");
    const catalogIcon = normalized === "openai" ? CATALOG_BRAND_PATHS.openai : normalized === "anthropic" ? CATALOG_BRAND_PATHS.anthropic : null;

    if (catalogIcon?.d) {
        return <PathBrandIcon className="size-4" d={catalogIcon.d} fill={catalogIcon.fill} />;
    }

    const simpleIcon: [SimpleIconData, string] | null = normalized === "openrouter" ? [siOpenrouter, "OpenRouter"] :
        normalized === "deepseek" ? [siDeepseek, "DeepSeek"] :
        normalized === "ollama" ? [siOllama, "Ollama"] :
        normalized === "vllm" ? [siVllm, "vLLM"] :
        normalized === "lm_studio" ? [siLmstudio, "LM Studio"] :
        normalized === "nvidia_nim" ? [siNvidia, "NVIDIA"] : null;

    if (simpleIcon) {
        return <SimpleProviderIcon icon={simpleIcon[0]} label={simpleIcon[1]} />;
    }

    if (normalized === "local") return <RuntimeProviderIcon label="L" tone="bg-emerald-600" />;
    if (normalized === "private") return <RuntimeProviderIcon label="P" tone="bg-slate-700" />;
    if (normalized === "google" || normalized === "gemini") return <RuntimeProviderIcon label="G" tone="bg-blue-600" />;
    return <RuntimeProviderIcon label="AI" tone="bg-primary" />;
}

type CapabilityRow = {
    id: string;
    provider: string;
    model: string;
    worker: string;
    coding: boolean;
    vision: boolean;
    ocr: boolean;
    audio: boolean;
    toolCalling: boolean;
    reasoning: boolean;
    structuredOutput: boolean;
    contextSize: string;
};

function hasCapability(capabilities: string[], ...names: string[]): boolean {
    const normalized = new Set(capabilities.map((capability) => capability.toLowerCase().replace(/[-\s]/g, "_")));
    return names.some((name) => normalized.has(name));
}

export function CapabilityMatrixView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [providerFilter, setProviderFilter] = useState("All");
    const [modelFilter, setModelFilter] = useState("All");
    const [workerFilter, setWorkerFilter] = useState("All");
    const [capabilityFilter, setCapabilityFilter] = useState("All");
    const [capabilities, setCapabilities] = useState<CapabilityRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const overview = useAiExecutionOverview(workspaceId);

    const fetchCapabilities = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setCapabilities(overview.catalog.map((item) => {
                const rawCapabilities = Array.isArray(item.capabilities) ? item.capabilities.filter((value): value is string => typeof value === "string") : [];
                return {
                    id: String(item.id ?? "capability"),
                    provider: String(item.provider ?? "-"),
                    model: String(item.model ?? item.name ?? "-"),
                    worker: String(item.worker ?? "-"),
                    coding: hasCapability(rawCapabilities, "coding", "code"),
                    vision: hasCapability(rawCapabilities, "vision"),
                    ocr: hasCapability(rawCapabilities, "ocr"),
                    audio: hasCapability(rawCapabilities, "audio"),
                    toolCalling: hasCapability(rawCapabilities, "tools", "tool_calling", "function_calling"),
                    reasoning: hasCapability(rawCapabilities, "reasoning"),
                    structuredOutput: hasCapability(rawCapabilities, "structured_output", "structuredoutput"),
                    contextSize: typeof item.contextWindow === "number" ? item.contextWindow.toLocaleString() : "-",
                };
            }) as CapabilityRow[]);
            /* 
            if (res.ok) {
                const { data } = await res.json();
                setCapabilities(data);
            }
        */
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [overview.catalog]);

    useEffect(() => {
        fetchCapabilities();
    }, [fetchCapabilities]);

    const visibleCapabilities = capabilities.filter((capability) => {
        const capabilityText = [capability.coding && "Coding", capability.vision && "Vision", capability.ocr && "OCR", capability.audio && "Audio", capability.toolCalling && "Tool Calling", capability.reasoning && "Reasoning", capability.structuredOutput && "Structured Output"].filter(Boolean) as string[];
        return (providerFilter === "All" || capability.provider === providerFilter) &&
            (modelFilter === "All" || capability.model === modelFilter) &&
            (workerFilter === "All" || capability.worker === workerFilter) &&
            (capabilityFilter === "All" || capabilityText.includes(capabilityFilter)) &&
            `${capability.provider} ${capability.model} ${capability.worker}`.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleCapabilities.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleCapabilities.map(c => c.id)));
    };

    const renderCheck = (value: boolean) => {
        return value ? <CheckCircle2 className="size-4 text-emerald-500 mx-auto" /> : <XCircle className="size-4 text-zinc-600 mx-auto opacity-50" />;
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Capability Explorer</h1>
                    <button 
                        onClick={fetchCapabilities}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
                        Refresh
                    </button>
                </div>

                {/* Toolbar */}
                <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-48 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        
                        <LiveFilterDropdown label="Provider" value={providerFilter} options={["All", ...Array.from(new Set(capabilities.map((capability) => capability.provider)))]} onChange={setProviderFilter} />
                        <LiveFilterDropdown label="Model" value={modelFilter} options={["All", ...Array.from(new Set(capabilities.map((capability) => capability.model)))]} onChange={setModelFilter} />
                        <LiveFilterDropdown label="Worker" value={workerFilter} options={["All", ...Array.from(new Set(capabilities.map((capability) => capability.worker)))]} onChange={setWorkerFilter} />
                        <LiveFilterDropdown label="Capability" value={capabilityFilter} options={["All", "Coding", "Vision", "OCR", "Audio", "Tool Calling", "Reasoning", "Structured Output"]} onChange={setCapabilityFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleCapabilities.length && visibleCapabilities.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-40">Provider</th>
                            <th className="px-4 py-3 font-semibold w-40">Model</th>
                            <th className="px-4 py-3 font-semibold w-40">Worker</th>
                            <th className="px-4 py-3 font-semibold w-24 text-center">Coding</th>
                            <th className="px-4 py-3 font-semibold w-24 text-center">Vision</th>
                            <th className="px-4 py-3 font-semibold w-24 text-center">OCR</th>
                            <th className="px-4 py-3 font-semibold w-24 text-center">Audio</th>
                            <th className="px-4 py-3 font-semibold w-32 text-center">Tool Calling</th>
                            <th className="px-4 py-3 font-semibold w-32 text-center">Reasoning</th>
                            <th className="px-4 py-3 font-semibold w-40 text-center">Structured Output</th>
                            <th className="px-4 py-3 font-semibold w-32 text-right">Context Size</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading && capabilities.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading capabilities...</td>
                            </tr>
                        ) : visibleCapabilities.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-6 py-8 text-center text-muted-foreground text-sm">No capabilities found.</td>
                            </tr>
                        ) : visibleCapabilities.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("intelligence", { ...record, name: `${record.provider} ${record.model}` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-bold text-foreground flex items-center gap-2">
                                    <ProviderBrandIcon provider={record.provider} />
                                    {record.provider}
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.model}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    {record.worker}
                                </td>
                                <td className="px-4 py-4">
                                    {renderCheck(record.coding)}
                                </td>
                                <td className="px-4 py-4">
                                    {renderCheck(record.vision)}
                                </td>
                                <td className="px-4 py-4">
                                    {renderCheck(record.ocr)}
                                </td>
                                <td className="px-4 py-4">
                                    {renderCheck(record.audio)}
                                </td>
                                <td className="px-4 py-4">
                                    {renderCheck(record.toolCalling)}
                                </td>
                                <td className="px-4 py-4">
                                    {renderCheck(record.reasoning)}
                                </td>
                                <td className="px-4 py-4">
                                    {renderCheck(record.structuredOutput)}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground text-right">
                                    {record.contextSize}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
