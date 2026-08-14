"use client";

import { useEffect, useMemo, useState } from "react";
import { getEpochMissionSettlement, listEpochCertificates, listEpochMemoryLessons, listEpochMemoryRecords, listEpochMissions } from "@/lib/epoch-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { useInspector } from "@/components/mission-control/universal-inspector";

type Row = Record<string, unknown>;
type View = "memory-preflight" | "mission-outcomes" | "learning-handoff" | "settlement" | "certificates";

const value = (input: unknown) => input === null || input === undefined || input === "" ? "-" : typeof input === "object" ? JSON.stringify(input) : String(input);

export function SettlementWorkspace({ activeSection, workspaceId }: { activeSection: string; workspaceId: string }) {
  const { openInspector } = useInspector();
  const view = (activeSection.replace("settlement-", "") || "memory-preflight") as View;
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const missions = await listEpochMissions(workspaceId);
        let next: Row[] = [];
        if (view === "memory-preflight" || view === "mission-outcomes") {
          const result = await listEpochMemoryRecords(workspaceId);
          next = result.memoryRecords as unknown as Row[];
        } else if (view === "learning-handoff") {
          const result = await listEpochMemoryLessons(workspaceId);
          next = result.lessons as unknown as Row[];
        } else if (view === "certificates") {
          const result = await listEpochCertificates(workspaceId, { limit: 100 });
          next = result.certificates as unknown as Row[];
        } else {
          next = (await Promise.all(missions.map(async (mission) => {
            try { return await getEpochMissionSettlement(workspaceId, mission.id); } catch { return null; }
          }))).filter(Boolean) as Row[];
        }
        if (!cancelled) { setRows(next); setError(null); }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load memory and settlement data.");
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    const timer = window.setInterval(load, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [view, workspaceId]);

  const visible = useMemo(() => rows.filter((row) => {
    if (!JSON.stringify(row).toLowerCase().includes(query.toLowerCase())) return false;
    return filter === "All" || value(row.status ?? row.decision) === filter;
  }), [filter, query, rows]);

  const columns = view === "memory-preflight"
    ? ["id", "missionId", "summary", "status", "createdAt"]
    : view === "mission-outcomes"
      ? ["id", "missionId", "lessons", "mistakes", "suggestedImprovements", "updatedAt"]
      : view === "learning-handoff"
        ? ["id", "missionId", "status", "lesson", "createdAt"]
        : view === "certificates"
          ? ["id", "status", "summary", "createdAt"]
          : ["id", "missionId", "decision", "status", "reason", "createdAt"];
  const title = view === "memory-preflight" ? "Memory Preflight" : view === "mission-outcomes" ? "Mission Outcomes" : view === "learning-handoff" ? "Learning Handoff" : view[0].toUpperCase() + view.slice(1);
  const statuses = Array.from(new Set(rows.map((row) => value(row.status ?? row.decision)).filter((item) => item !== "-")));
  const exportRows = () => {
    const blob = new Blob([JSON.stringify(visible, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `epoch-${view}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading live {title.toLowerCase()}...</div>;
  if (error) return <div className="p-8 text-sm text-red-500">{error}</div>;
  return <div className="flex h-full min-h-0 flex-col bg-background">
    <div className="shrink-0 border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4"><div><h1 className="text-xl font-bold text-foreground">{title}</h1><p className="mt-1 text-xs text-muted-foreground">Live workspace data. No demo records are shown.</p></div><div className="flex items-center gap-3"><button type="button" onClick={exportRows} disabled={visible.length === 0} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50">Export</button><span className="text-xs text-muted-foreground">{visible.length} records</span></div></div>
      <div className="relative z-30 flex items-center gap-2 overflow-visible border-t border-border bg-muted/20 px-6 py-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} className="h-8 w-64 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none" /><LiveFilterDropdown label="Status" value={filter} options={["All", ...statuses]} onChange={setFilter} /></div>
    </div>
    {visible.length === 0 ? <div className="p-8 text-sm text-muted-foreground">{rows.length === 0 ? `No ${title.toLowerCase()} records exist in this workspace yet.` : "No records match the current filters."}</div> : <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="sticky top-0 bg-card"><tr>{columns.map((column) => <th key={column} className="border-b border-border px-5 py-3 text-[11px] uppercase tracking-wide text-muted-foreground">{column}</th>)}</tr></thead><tbody>{visible.map((row, index) => <tr key={value(row.id) === "-" ? String(index) : value(row.id)} onClick={() => openInspector(view === "memory-preflight" ? "memory_preflight" : view === "mission-outcomes" ? "mission_outcome" : view === "learning-handoff" ? "learning_handoff" : view === "certificates" ? "certificate" : "settlement", { ...row, context: "settlement", name: `${title} ${value(row.id)}` })} className="cursor-pointer border-b border-border/50 hover:bg-muted/30">{columns.map((column) => <td key={column} className="max-w-[300px] truncate px-5 py-3 text-xs text-foreground" title={value(row[column])}>{value(row[column])}</td>)}</tr>)}</tbody></table></div>}
  </div>;
}
