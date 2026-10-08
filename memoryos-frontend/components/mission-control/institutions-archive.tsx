"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Building2, Clock3, Search, AlertTriangle, Loader2 } from "lucide-react";
import { listHorosInstitutions, readActiveHorosWorkspaceId, type HorosInstitution } from "@/lib/horos-api";
import { Button } from "@/components/ui/button";

type ArchiveStatusFilter = "All statuses" | "archived" | "paused" | "deleted";

function formatTimestamp(value?: string | null): string {
 if (!value) return "Never";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return value;
 return parsed.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
}

function statusTone(status?: string | null): string {
 switch ((status ?? "").toLowerCase()) {
 case "paused":
 return "border-amber-200 bg-amber-50 text-amber-700";
 case "archived":
 return "border-blue-200 bg-blue-50 text-blue-700";
 case "deleted":
 return "border-red-200 bg-red-50 text-red-700";
 default:
 return "border-border bg-muted text-foreground/70";
 }
}

export function InstitutionsArchive() {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveHorosWorkspaceId());
 const [institutions, setInstitutions] = useState<HorosInstitution[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [query, setQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState<ArchiveStatusFilter>("All statuses");

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

 useEffect(() => {
 let canceled = false;

 async function load() {
 if (!workspaceId) {
 setInstitutions([]);
 setLoading(false);
 setError("Select a workspace to view institution archive.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const liveInstitutions = await listHorosInstitutions(workspaceId);
 if (!canceled) setInstitutions(liveInstitutions);
 } catch (loadError) {
 if (!canceled) {
 setInstitutions([]);
 setError(loadError instanceof Error ? loadError.message : "Failed to load institution archive.");
 }
 } finally {
 if (!canceled) setLoading(false);
 }
 }

 void load();
 return () => {
 canceled = true;
 };
 }, [workspaceId]);

 const archivedInstitutions = useMemo(
 () => institutions.filter((institution) => (institution.status ?? "").toLowerCase() === "archived"),
 [institutions],
 );

 const visibleInstitutions = useMemo(() => {
 const needle = query.trim().toLowerCase();
 return archivedInstitutions.filter((institution) => {
 const status = (institution.status ?? "archived").toLowerCase();
 const statusOk = statusFilter === "All statuses" || status === statusFilter;
 const queryOk =
 !needle ||
 [institution.name, institution.summary ?? "", institution.version ?? "", institution.currentState ?? ""]
 .join(" ")
 .toLowerCase()
 .includes(needle);
 return statusOk && queryOk;
 });
 }, [archivedInstitutions, query, statusFilter]);

 return (
 <div className="w-full flex flex-col pt-2 pb-12 font-sans">
 <div className="flex items-center justify-between mb-8">
 <div>
 <div className="flex items-center gap-2.5 mb-1">
 <Archive className="size-6 text-foreground" strokeWidth={1.6} />
 <h1 className="text-[28px] font-medium text-foreground tracking-tight">Archive</h1>
 </div>
 <p className="text-[15px] text-muted-foreground">Archived institutions from the active workspace.</p>
 </div>
 <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground ">
 <Clock3 className="size-3.5 text-muted-foreground" />
 {archivedInstitutions.length} archived
 </div>
 </div>

 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
 <label className="relative flex-1 max-w-[420px]">
 <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
 <input
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 placeholder="Search archive..."
 className="h-10 w-full rounded-md border border-border bg-card pl-10 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff]/15"
 />
 </label>

 <div className="flex items-center gap-2">
 <select
 value={statusFilter}
 onChange={(event) => setStatusFilter(event.target.value as ArchiveStatusFilter)}
 className="h-10 rounded-md border border-border bg-card px-3.5 text-[13px] text-foreground outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff]/15"
 >
 <option>All statuses</option>
 <option value="archived">Archived</option>
 <option value="paused">Paused</option>
 <option value="deleted">Deleted</option>
 </select>
 </div>
 </div>

 {loading ? (
 <div className="rounded-md border border-border bg-card p-10 text-center ">
 <Loader2 className="mx-auto mb-3 size-6 animate-spin text-[#0f52ff]" />
 <p className="text-[15px] text-muted-foreground">Loading archive.</p>
 </div>
 ) : error ? (
 <div className="rounded-md border border-[#f3c4c4] bg-card p-10 text-center ">
 <AlertTriangle className="mx-auto mb-3 size-8 text-[#c2410c]" />
 <p className="text-[15px] font-medium text-foreground mb-1">Archive unavailable</p>
 <p className="text-[14px] text-muted-foreground">{error}</p>
 <Button
 type="button"
 variant="outline"
 className="mt-4 h-9 rounded-md border-border bg-card px-3 text-[13px] text-foreground hover:bg-card"
 onClick={() => {
 if (!workspaceId) return;
 setLoading(true);
 setError(null);
 void listHorosInstitutions(workspaceId)
 .then((rows) => setInstitutions(rows))
 .catch((retryError) => setError(retryError instanceof Error ? retryError.message : "Failed to load institution archive."))
 .finally(() => setLoading(false));
 }}
 >
 Retry
 </Button>
 </div>
 ) : visibleInstitutions.length === 0 ? (
 <div className="rounded-md border border-border bg-card p-12 text-center ">
 <Building2 className="mx-auto mb-3 size-9 text-[#bbb]" />
 <p className="text-[16px] font-medium text-foreground mb-1">
 {archivedInstitutions.length === 0 ? "No archived institutions yet." : "No matching archived institutions."}
 </p>
 <p className="text-[14px] text-muted-foreground">
 {archivedInstitutions.length === 0
 ? "Archived institutions will appear here after they are removed from active use."
 : "Try a different search or status filter."}
 </p>
 </div>
 ) : (
 <div className="overflow-hidden rounded-md border border-border bg-card ">
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Institution</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Status</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Updated</th>
 <th className="px-6 py-3.5 text-[13px] font-semibold text-foreground">Summary</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e5e5e5]">
 {visibleInstitutions.map((institution) => (
 <tr key={institution.id} className="hover:bg-card transition-colors">
 <td className="px-6 py-6">
 <div className="flex items-center gap-3">
 <div className="flex size-9 items-center justify-center rounded-md border border-border bg-card">
 <Building2 className="size-4 text-muted-foreground" />
 </div>
 <div className="min-w-0">
 <div className="text-[14px] font-semibold text-foreground truncate">{institution.name}</div>
 <div className="text-[12px] text-muted-foreground truncate">
 {institution.template?.name ?? "No template"} · {institution.version ?? "v0"}
 </div>
 </div>
 </div>
 </td>
 <td className="px-6 py-6">
 <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold ${statusTone(institution.status ?? "archived")}`}>
 {(institution.status ?? "archived").toUpperCase()}
 </span>
 </td>
 <td className="px-6 py-6 text-[13px] text-muted-foreground">
 {formatTimestamp(institution.updatedAt)}
 </td>
 <td className="px-6 py-6 text-[13px] text-muted-foreground">
 {institution.summary?.trim() || "No summary recorded."}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 );
}
