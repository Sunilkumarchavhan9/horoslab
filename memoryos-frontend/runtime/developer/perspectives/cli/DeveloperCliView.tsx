"use client";

import React, { useEffect, useState } from "react";
import { 
    Search, ChevronDown, ChevronLeft, ChevronRight,
    Terminal, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInspector } from "@/components/mission-control/universal-inspector";
import { getHorosCliCatalog } from "@/lib/horos-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { exportLiveRows } from "@/components/mission-control/export-live-rows";

type CliRow = {
    id: string;
    version: string;
    platform: "macOS" | "Linux" | "Windows" | "Docker";
    release: string;
    downloads: string;
    status: "Stable" | "Beta" | "Deprecated";
};

export function DeveloperCliView({ workspaceId }: { workspaceId?: string | null }) {
    const { openInspector } = useInspector();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [cliRecords, setCliRecords] = useState<CliRow[]>([]);
    const [isLoading, setIsLoading] = useState(Boolean(workspaceId));
    const [versionFilter, setVersionFilter] = useState("All");
    const [platformFilter, setPlatformFilter] = useState("All");
    const [packageInfo, setPackageInfo] = useState({ name: "@horostm/v12-cli", version: "0.1.3", status: "Published" });

    useEffect(() => {
        if (!workspaceId) return;
        let active = true;
        const load = () => getHorosCliCatalog(workspaceId).then((payload) => {
            if (!active) return;
            const cli = payload.cli && typeof payload.cli === "object" ? payload.cli as Record<string, unknown> : {};
            const version = String(cli.version ?? "-");
            setPackageInfo({ name: String(cli.name ?? "@horostm/v12-cli"), version, status: String(cli.status ?? "Published") });
            const releases = Array.isArray(cli.releases)
                ? cli.releases
                : Array.isArray(cli.platforms)
                    ? cli.platforms
                    : [];
            setCliRecords(releases.map((item, index) => {
                const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
                const platform = String(row.platform ?? row.os ?? "");
                return {
                    id: String(row.id ?? `cli-release-${index}`),
                    version: String(row.version ?? version),
                    platform: (["macOS", "Linux", "Windows", "Docker"] as const).includes(platform as CliRow["platform"]) ? platform as CliRow["platform"] : "Linux",
                    release: String(row.release ?? row.publishedAt ?? "-"),
                    downloads: String(row.downloads ?? "-"),
                    status: (["Stable", "Beta", "Deprecated"] as const).includes(String(row.status ?? "Stable") as CliRow["status"]) ? String(row.status ?? "Stable") as CliRow["status"] : "Stable",
                } satisfies CliRow;
            }));
        }).catch(() => { if (active) setCliRecords([]); }).finally(() => { if (active) setIsLoading(false); });
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
    const visibleRecords = cliRecords.filter((record) => (versionFilter === "All" || record.version === versionFilter) && (platformFilter === "All" || record.platform === platformFilter) && `${record.version} ${record.platform} ${record.status}`.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Header & Toolbar */}
            <div className="flex flex-col shrink-0 bg-background">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Terminal className="size-5 text-indigo-500" />
                            CLI Dashboard
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">Manage the HOROS command-line runtime.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => exportLiveRows("horos-cli-releases.json", visibleRecords)} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <Download className="size-3.5" />
                            Export
                        </button>
                    </div>
                </div>
                <div className="mx-6 mb-4 rounded-md border border-border bg-card p-4"><p className="text-sm font-semibold text-foreground">{packageInfo.name} <span className="font-mono text-xs text-muted-foreground">v{packageInfo.version}</span></p><p className="mt-1 text-xs text-muted-foreground">{packageInfo.status}. Install the published CLI to operate missions and workers from your terminal.</p><div className="mt-3 grid gap-2 md:grid-cols-3"><code className="rounded bg-muted px-3 py-2 text-xs text-foreground">npm install -g @horostm/v12-cli</code><code className="rounded bg-muted px-3 py-2 text-xs text-foreground">pnpm add -g @horostm/v12-cli</code><code className="rounded bg-muted px-3 py-2 text-xs text-foreground">bun add -g @horostm/v12-cli</code></div></div>

                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 overflow-visible">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-64 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search CLI binaries..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-9 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70 text-foreground"
                            />
                        </div>
                        <LiveFilterDropdown label="Version" value={versionFilter} options={["All", ...Array.from(new Set(cliRecords.map((record) => record.version)))]} onChange={setVersionFilter} />
                        <LiveFilterDropdown label="Platform" value={platformFilter} options={["All", "macOS", "Linux", "Windows", "Docker"]} onChange={setPlatformFilter} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-background custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 bg-card z-10">
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-3 font-semibold w-10">
                                <input type="checkbox" className="rounded border-border bg-muted/50 text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.size === visibleRecords.length && visibleRecords.length > 0} onChange={toggleAll} />
                            </th>
                            <th className="px-4 py-3 font-semibold w-40">Version</th>
                            <th className="px-4 py-3 font-semibold w-48">Platform</th>
                            <th className="px-4 py-3 font-semibold w-40">Release</th>
                            <th className="px-4 py-3 font-semibold w-32">Downloads</th>
                            <th className="px-4 py-3 font-semibold w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-sm">
                        {isLoading ? <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading CLI catalog...</td></tr> : visibleRecords.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No platform release matches the current filters.</td></tr> : visibleRecords.map((record) => (
                            <tr 
                                key={record.id} 
                                onClick={() => openInspector("cli" as any, { ...record, context: 'developer', name: `HOROS CLI ${record.version}` })}
                                className={cn(
                                    "group hover:bg-muted/30 transition-colors cursor-pointer",
                                    selectedRows.has(record.id) ? "bg-primary/5 hover:bg-primary/10" : ""
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => toggleRow(record.id, e)}>
                                    <input type="checkbox" className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background size-3.5" checked={selectedRows.has(record.id)} readOnly />
                                </td>
                                <td className="px-4 py-4 font-mono font-bold text-foreground">
                                    {record.version}
                                </td>
                                <td className="px-4 py-4 font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="size-4 text-muted-foreground/70" />
                                        {record.platform}
                                    </div>
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.release}
                                </td>
                                <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                                    {record.downloads}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        record.status === "Stable" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
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
