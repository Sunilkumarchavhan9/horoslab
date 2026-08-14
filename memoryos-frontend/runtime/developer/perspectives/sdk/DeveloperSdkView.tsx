"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    Download, Code2, Copy, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { getEpochSdkSnapshot } from "@/lib/epoch-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { exportLiveRows } from "@/components/mission-control/export-live-rows";

type SdkRow = {
    id: string;
    sdkName: string;
    language: "TypeScript" | "Python" | "Go" | "Rust";
    version: string;
    compatibility: string;
    published: string;
    status: "Active" | "Beta" | "Deprecated";
};

export function DeveloperSdkView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [sdkRecords, setSdkRecords] = useState<SdkRow[]>([]);
    const [isLoading, setIsLoading] = useState(Boolean(workspaceId));
    const [language, setLanguage] = useState("All");
    const [version, setVersion] = useState("All");
    const [status, setStatus] = useState("All");

    useEffect(() => {
        if (!workspaceId) return;
        let active = true;
        setIsLoading(true);
        const load = () => getEpochSdkSnapshot(workspaceId).then((snapshot) => {
            if (!active) return;
            const sdk = snapshot.sdk && typeof snapshot.sdk === "object" ? snapshot.sdk as Record<string, unknown> : snapshot;
            const sourceRecords = Array.isArray(sdk.releases)
                ? sdk.releases
                : Array.isArray(sdk.versions)
                    ? sdk.versions
                    : [];
            const records = sourceRecords.map((item, index) => {
                const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
                const language = String(row.language ?? row.runtime ?? "TypeScript");
                return {
                    id: String(row.id ?? `sdk-${index}`),
                    sdkName: String(row.name ?? row.package ?? row.packageName ?? "Epoch SDK"),
                    language: (["TypeScript", "Python", "Go", "Rust"] as const).includes(language as "TypeScript" | "Python" | "Go" | "Rust") ? language as SdkRow["language"] : "TypeScript",
                    version: String(row.version ?? "-"),
                    compatibility: String(row.compatibility ?? row.runtime ?? "Epoch V12"),
                    published: String(row.publishedAt ?? row.createdAt ?? "-"),
                    status: (["Active", "Beta", "Deprecated"] as const).includes(String(row.status ?? "Active") as SdkRow["status"]) ? String(row.status ?? "Active") as SdkRow["status"] : "Active",
                } satisfies SdkRow;
            });
            setSdkRecords(records);
        }).catch(() => { if (active) setSdkRecords([]); }).finally(() => { if (active) setIsLoading(false); });
        void load();
        const timer = window.setInterval(() => void load(), 5000);
        return () => { active = false; window.clearInterval(timer); };
    }, [workspaceId]);

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === visibleRecords.length) setSelectedRows(new Set());
        else setSelectedRows(new Set(visibleRecords.map(m => m.id)));
    };
    const visibleRecords = sdkRecords.filter((record) => (language === "All" || record.language === language) && (version === "All" || record.version === version) && (status === "All" || record.status === status) && `${record.sdkName} ${record.language} ${record.version}`.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Code2 className="size-5 text-indigo-500" />
                            SDK Registry
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Manage SDK versions and worker contracts.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => exportLiveRows("epoch-sdk-catalog.json", visibleRecords)} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search SDKs..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Language" value={language} options={["All", "TypeScript", "Python", "Go", "Rust"]} onChange={setLanguage} />
                        <LiveFilterDropdown label="Version" value={version} options={["All", ...Array.from(new Set(sdkRecords.map((record) => record.version)))]} onChange={setVersion} />
                        <LiveFilterDropdown label="Status" value={status} options={["All", "Active", "Beta", "Deprecated"]} onChange={setStatus} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === sdkRecords.length && sdkRecords.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-64">SDK</th>
                            <th className="px-4 py-3 font-semibold w-40">Language</th>
                            <th className="px-4 py-3 font-semibold w-32">Version</th>
                            <th className="px-4 py-3 font-semibold w-48">Runtime Compatibility</th>
                            <th className="px-4 py-3 font-semibold w-32">Published</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading ? <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading SDK catalog...</td></tr> : visibleRecords.length === 0 ? <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No SDK releases found.</td></tr> : visibleRecords.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("sdk" as any, { ...record, context: 'developer', name: record.sdkName })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-medium text-foreground">
                                    {record.sdkName}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted/50 border border-border/50",
                                        record.language === "TypeScript" ? "text-blue-400" :
                                        record.language === "Python" ? "text-yellow-500" :
                                        record.language === "Go" ? "text-cyan-400" :
                                        "text-orange-500"
                                    )}>
                                        {record.language}
                                    </span>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] font-bold text-muted-foreground">
                                    {record.version}
                                </td>
                                <td className="px-4 py-4 text-[13px] text-muted-foreground">
                                    {record.compatibility}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.published}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        record.status === "Beta" ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" :
                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                        {record.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
