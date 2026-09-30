"use client";

import { useEffect, useMemo, useState } from "react";
import {
 Database,
 CheckCircle2,
 XCircle,
 Filter,
 Search,
 ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 listDhyraMemoryRecords,
 readActiveDhyraWorkspaceId,
 type DhyraMemoryRecordDetail,
} from "@/lib/dhyra-api";

function formatTimestamp(value?: string | null): string {
 if (!value) return "Unknown";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return "Unknown";
 return parsed.toLocaleString();
}

function recordStatus(record: DhyraMemoryRecordDetail): string {
 const value = (record.certificate?.status ?? record.status ?? "review").toString().toUpperCase();
 if (value === "PASS" || value === "FAIL" || value === "REVIEW") return value;
 return value === "APPROVED" ? "PASS" : value === "REJECTED" ? "FAIL" : "REVIEW";
}

function resultTone(result: string): string {
 if (result === "PASS") return "text-emerald-700 bg-emerald-50 border-emerald-200";
 if (result === "FAIL") return "text-rose-700 bg-rose-50 border-rose-200";
 return "text-amber-700 bg-amber-50 border-amber-200";
}

function normalizeText(value: string): string {
 return value.trim().toLowerCase();
}

function getRecordInstitutionName(record: DhyraMemoryRecordDetail): string {
 return record.institution?.name?.trim() || "Unknown institution";
}

function getRecordMissionType(record: DhyraMemoryRecordDetail): string {
 const category = record.institution?.category?.trim();
 if (category) return category;
 const templateName = record.institution?.template?.name?.trim();
 if (templateName) return templateName;
 return "General";
}

const DEFAULT_MISSION_TYPES = [
 "General",
 "Institution",
 "Governance",
 "Memory",
 "Integration",
 "Developer",
 "Execution",
 "Verification",
 "Evidence",
 "Certificate",
];

function filterTriggerClassName(active: boolean): string {
 return cn(
 "h-10 px-6 rounded-md border bg-card text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors select-none whitespace-nowrap",
 active ? "border-[#0f52ff] bg-[#eef4ff] text-[#0f52ff]" : "border-border"
 );
}

function filterContentClassName(widthClass = "w-[220px]"): string {
 return cn(
 "z-50 rounded-md border border-border bg-card p-2 shadow-[0_12px_30px_rgba(0,0,0,0.1)]",
 widthClass
 );
}

function getRecordCreatedAtMs(record: DhyraMemoryRecordDetail): number | null {
 if (!record.createdAt) return null;
 const parsed = new Date(record.createdAt).getTime();
 return Number.isFinite(parsed) ? parsed : null;
}

function matchesDateFilter(record: DhyraMemoryRecordDetail, filter: string): boolean {
 if (filter === "all") return true;
 const createdAtMs = getRecordCreatedAtMs(record);
 if (createdAtMs === null) return false;
 const ageMs = Date.now() - createdAtMs;
 const day = 24 * 60 * 60 * 1000;
 if (filter === "24h") return ageMs <= day;
 if (filter === "7d") return ageMs <= 7 * day;
 if (filter === "30d") return ageMs <= 30 * day;
 if (filter === "90d") return ageMs <= 90 * day;
 return true;
}

export function MemoryRecords({ onViewDetail }: { onViewDetail?: (id: string) => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId());
 const [records, setRecords] = useState<DhyraMemoryRecordDetail[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [institutionFilter, setInstitutionFilter] = useState("all");
 const [missionTypeFilter, setMissionTypeFilter] = useState("all");
 const [resultFilter, setResultFilter] = useState("all");
 const [dateFilter, setDateFilter] = useState("all");

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

 async function load() {
 if (!workspaceId) {
 setRecords([]);
 setLoading(false);
 setError("Select a workspace to view institution records.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const result = await listDhyraMemoryRecords(workspaceId, { limit: 200 });
 if (!canceled) setRecords(result.memoryRecords ?? []);
 } catch (loadError) {
 if (!canceled) {
 setRecords([]);
 setError(loadError instanceof Error ? loadError.message : "Failed to load records.");
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

 const stats = useMemo(() => {
 const total = records.length;
 const successful = records.filter((record) => recordStatus(record) === "PASS").length;
 const failed = records.filter((record) => recordStatus(record) === "FAIL").length;
 const confidence = total > 0 ? Math.round((successful / total) * 100) : 0;
 return { total, successful, failed, confidence };
 }, [records]);

 const institutionOptions = useMemo(() => {
 const values = new Set<string>();
 for (const record of records) {
 values.add(getRecordInstitutionName(record));
 }
 return Array.from(values).sort((left, right) => left.localeCompare(right));
 }, [records]);

 const missionTypeOptions = useMemo(() => {
 const values = new Set<string>();
 for (const record of records) {
 values.add(getRecordMissionType(record));
 }
 for (const type of DEFAULT_MISSION_TYPES) {
 values.add(type);
 }
 return Array.from(values).sort((left, right) => left.localeCompare(right));
 }, [records]);

 const filteredRecords = useMemo(() => {
 const query = normalizeText(searchQuery);
 return records.filter((record) => {
 const missionText = normalizeText(
 [record.mission?.title, record.mission?.objective, record.summary, record.certificate?.summary, record.id]
 .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
 .join(" "),
 );
 const institutionName = getRecordInstitutionName(record);
 const missionType = getRecordMissionType(record);
 const result = recordStatus(record);

 const matchesSearch =
 query.length === 0 ||
 missionText.includes(query) ||
 normalizeText(institutionName).includes(query) ||
 normalizeText(missionType).includes(query) ||
 normalizeText(result).includes(query);

 const matchesInstitution = institutionFilter === "all" || institutionName === institutionFilter;
 const matchesMissionType = missionTypeFilter === "all" || missionType === missionTypeFilter;
 const matchesResult = resultFilter === "all" || result === resultFilter;
 const matchesDate = matchesDateFilter(record, dateFilter);

 return matchesSearch && matchesInstitution && matchesMissionType && matchesResult && matchesDate;
 });
 }, [dateFilter, institutionFilter, missionTypeFilter, records, resultFilter, searchQuery]);

 return (
 <div className="w-full flex flex-col pt-2 pb-12 font-sans min-h-screen relative isolate">
 <div className="mb-8">
 <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-1">Institution Records</h1>
 <p className="text-[15px] text-muted-foreground">The complete history of every mission executed by an institution.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="bg-card border border-border rounded-md p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Records</div>
 <div className="text-[24px] font-semibold text-foreground">{stats.total}</div>
 </div>
 <div className="bg-card border border-border rounded-md p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Successful Missions</div>
 <div className="text-[24px] font-semibold text-emerald-600">{stats.successful}</div>
 </div>
 <div className="bg-card border border-border rounded-md p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Failed Missions</div>
 <div className="text-[24px] font-semibold text-rose-600">{stats.failed}</div>
 </div>
 <div className="bg-card border border-border rounded-md p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Institution Confidence</div>
 <div className="text-[24px] font-semibold text-foreground">{stats.confidence}%</div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6">
 <div className="space-y-6">
 <div className="relative z-20 pointer-events-auto rounded-md border border-border bg-card px-6 py-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="flex flex-col xl:flex-row xl:items-center gap-3">
 <div className="relative flex-1 min-w-[260px] pointer-events-auto">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search..."
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-[14px] focus:outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff] pointer-events-auto"
 />
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className={filterTriggerClassName(institutionFilter !== "all")}
 aria-label="Institution filter"
 >
 <span>{institutionFilter === "all" ? "Institution" : institutionFilter}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className={filterContentClassName("w-[240px]")}>
 <DropdownMenuItem
 onSelect={() => setInstitutionFilter("all")}
 className={cn("rounded-md px-3 py-2 text-[13px]", institutionFilter === "all" && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 All Institutions
 </DropdownMenuItem>
 {institutionOptions.map((institution) => (
 <DropdownMenuItem
 key={institution}
 onSelect={() => setInstitutionFilter(institution)}
 className={cn("rounded-md px-3 py-2 text-[13px]", institutionFilter === institution && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 {institution}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className={filterTriggerClassName(missionTypeFilter !== "all")}
 aria-label="Mission type filter"
 >
 <span>{missionTypeFilter === "all" ? "Mission Type" : missionTypeFilter}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className={filterContentClassName("w-[260px]")}>
 <DropdownMenuItem
 onSelect={() => setMissionTypeFilter("all")}
 className={cn("rounded-md px-3 py-2 text-[13px]", missionTypeFilter === "all" && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 All Mission Types
 </DropdownMenuItem>
 {missionTypeOptions.map((missionType) => (
 <DropdownMenuItem
 key={missionType}
 onSelect={() => setMissionTypeFilter(missionType)}
 className={cn("rounded-md px-3 py-2 text-[13px]", missionTypeFilter === missionType && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 {missionType}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className={filterTriggerClassName(resultFilter !== "all")}
 aria-label="Result filter"
 >
 <span>{resultFilter === "all" ? "Result" : resultFilter}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className={filterContentClassName("w-[190px]")}>
 <DropdownMenuItem
 onSelect={() => setResultFilter("all")}
 className={cn("rounded-md px-3 py-2 text-[13px]", resultFilter === "all" && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 All Results
 </DropdownMenuItem>
 {(["PASS", "FAIL", "REVIEW"] as const).map((value) => (
 <DropdownMenuItem
 key={value}
 onSelect={() => setResultFilter(value)}
 className={cn("rounded-md px-3 py-2 text-[13px]", resultFilter === value && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 {value}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className={filterTriggerClassName(dateFilter !== "all")}
 aria-label="Date filter"
 >
 <span>{dateFilter === "all" ? "Date added" : dateFilter}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className={filterContentClassName("w-[220px]")}>
 <DropdownMenuItem
 onSelect={() => setDateFilter("all")}
 className={cn("rounded-md px-3 py-2 text-[13px]", dateFilter === "all" && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 All Dates
 </DropdownMenuItem>
 {[
 { value: "24h", label: "Last 24 hours" },
 { value: "7d", label: "Last 7 days" },
 { value: "30d", label: "Last 30 days" },
 { value: "90d", label: "Last 90 days" },
 ].map((option) => (
 <DropdownMenuItem
 key={option.value}
 onSelect={() => setDateFilter(option.value)}
 className={cn("rounded-md px-3 py-2 text-[13px]", dateFilter === option.value && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 {option.label}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 <button
 type="button"
 onClick={() => {
 setSearchQuery("");
 setInstitutionFilter("all");
 setMissionTypeFilter("all");
 setResultFilter("all");
 setDateFilter("all");
 }}
 className="h-10 px-6 rounded-md border border-border bg-card text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 transition-colors"
 >
 <Filter className="size-4" />
 Reset
 </button>
 </div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
 <div className="px-6 py-6 border-b border-border flex items-center justify-between bg-card">
 <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
 <Database className="size-4" />
 Records Table
 </h2>
 </div>
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Mission</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Institution</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Result</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Certificate</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider text-right">Created</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e2]">
 {loading ? (
 <tr>
 <td className="px-6 py-8 text-[13px] text-muted-foreground" colSpan={5}>
 Loading live institution records.
 </td>
 </tr>
 ) : error ? (
 <tr>
 <td className="px-6 py-8 text-[13px] text-rose-600" colSpan={5}>
 {error}
 </td>
 </tr>
 ) : filteredRecords.length === 0 ? (
 <tr>
 <td className="px-6 py-10" colSpan={5}>
 <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card px-6 py-10 text-center">
 <div className="size-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground">
 <Database className="size-5" />
 </div>
 <div className="space-y-1">
 <p className="text-[14px] font-semibold text-foreground">
 {records.length === 0 ? "No live records yet" : "No matching records"}
 </p>
 <p className="text-[13px] text-muted-foreground max-w-[34rem]">
 {records.length === 0
 ? "Run a mission in Mission Control and this table will fill with institution records, evidence, and verification outcomes."
 : "The current filters hide every record in this workspace. Clear them to bring the rows back."}
 </p>
 </div>
 {records.length > 0 ? (
 <button
 type="button"
 onClick={() => {
 setSearchQuery("");
 setInstitutionFilter("all");
 setMissionTypeFilter("all");
 setResultFilter("all");
 setDateFilter("all");
 }}
 className="mt-1 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground/90 hover:bg-card"
 >
 <Filter className="size-4" />
 Clear filters
 </button>
 ) : null}
 </div>
 </td>
 </tr>
 ) : (
 filteredRecords.map((record) => {
 const result = recordStatus(record);
 return (
 <tr
 key={record.id}
 className="hover:bg-card transition-colors cursor-pointer group"
 onClick={() => onViewDetail?.(record.id)}
 >
 <td className="px-6 py-3 text-[14px] font-medium text-foreground">
 {record.mission?.title ?? record.mission?.objective ?? record.summary ?? record.id}
 </td>
 <td className="px-6 py-3 text-[13px] text-muted-foreground">
 {record.institution?.name ?? "Unknown institution"}
 </td>
 <td className="px-6 py-3">
 <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium border", resultTone(result))}>
 {result === "PASS" ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
 {result}
 </span>
 </td>
 <td className="px-6 py-3 text-[13px] font-medium text-[#0f52ff] hover:underline">
 {record.certificate?.status ?? record.certificate?.id ?? "View"}
 </td>
 <td className="px-6 py-3 text-[13px] text-muted-foreground text-right">{formatTimestamp(record.createdAt)}</td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 );
}
