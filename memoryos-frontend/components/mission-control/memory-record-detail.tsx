"use client";

import { useEffect, useState } from "react";
import { ChevronRight, CheckCircle2, FileText, Database, Shield, Zap, Lightbulb, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDhyraMemoryRecord, readActiveDhyraWorkspaceId, type DhyraMemoryRecordDetail } from "@/lib/dhyra-api";

function formatTimestamp(value?: string | null): string {
 if (!value) return "Unknown";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return "Unknown";
 return parsed.toLocaleString();
}

export function MemoryRecordDetail({ id, onBack }: { id: string; onBack: () => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId());
 const [record, setRecord] = useState<DhyraMemoryRecordDetail | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

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
 setRecord(null);
 setLoading(false);
 setError("Select a workspace to view memory records.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const result = await getDhyraMemoryRecord(workspaceId, id);
 if (!canceled) setRecord(result);
 } catch (loadError) {
 if (!canceled) {
 setRecord(null);
 setError(loadError instanceof Error ? loadError.message : "Failed to load memory record.");
 }
 } finally {
 if (!canceled) setLoading(false);
 }
 }

 void load();
 return () => {
 canceled = true;
 };
 }, [id, workspaceId]);

 const missionTitle = record?.mission?.title ?? record?.mission?.objective ?? id;
 const institutionTitle = record?.institution?.name ?? "Unknown institution";
 const outcomes = [
 { label: "Lessons", value: String(record?.lessons?.length ?? 0), color: "text-[#0f52ff]" },
 { label: "Mistakes", value: String(record?.mistakes?.length ?? 0), color: "text-red-600" },
 { label: "Improvements", value: String(record?.suggestedImprovements?.length ?? 0), color: "text-emerald-600" },
 ];

 return (
 <div className="w-full flex flex-col pt-2 h-full font-sans pb-16">
 <div className="flex items-center gap-2 mb-8 text-[14px]">
 <span className="text-muted-foreground hover:text-foreground cursor-pointer font-medium transition-colors" onClick={onBack}>
 Institution Records
 </span>
 <ChevronRight className="size-4 text-[#aaa]" />
 <span className="text-foreground font-semibold flex items-center gap-2">
 {missionTitle}
 </span>
 </div>

 {loading ? (
 <div className="bg-card border border-border rounded-md p-12 text-center">
 <p className="text-[15px] text-muted-foreground">Loading memory record.</p>
 </div>
 ) : error ? (
 <div className="bg-card border border-border rounded-md p-12 text-center">
 <AlertTriangle className="size-10 text-[#f59e0b] mx-auto mb-3" />
 <p className="text-[15px] text-foreground font-medium mb-1">Memory record unavailable</p>
 <p className="text-[14px] text-muted-foreground">{error}</p>
 </div>
 ) : record ? (
 <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="md:col-span-2">
 <div className="bg-card border border-border rounded-md p-6 mb-8">
 <h2 className="text-[20px] font-bold text-foreground mb-6">Mission Summary</h2>

 <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-[#eee] pl-10">
 <div className="relative">
 <div className="absolute -left-[40px] top-1 size-6 rounded-full bg-card border border-border flex items-center justify-center ">
 <Database className="size-3 text-muted-foreground" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground">Evidence Collected</h3>
 <p className="text-[13px] text-muted-foreground mt-1">{(record.history?.length ?? 0) || "No"} events analyzed</p>
 </div>

 <div className="relative">
 <div className="absolute -left-[40px] top-1 size-6 rounded-full bg-card border border-border flex items-center justify-center ">
 <Shield className="size-3 text-muted-foreground" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground">Lessons</h3>
 <div className="mt-2 space-y-3">
 {(record.lessons ?? []).length > 0 ? (
 (record.lessons ?? []).map((lesson, i) => (
 <div key={`${lesson}-${i}`} className="bg-card border border-border p-3 rounded-md">
 <div className="text-[13px] font-semibold text-foreground mb-1">{lesson}</div>
 <div className="text-[12px] text-muted-foreground">Captured in Dhyra memory</div>
 </div>
 ))
 ) : (
 <div className="text-[13px] text-muted-foreground">No lessons were attached to this record.</div>
 )}
 </div>
 </div>

 <div className="relative">
 <div className="absolute -left-[40px] top-1 size-6 rounded-full bg-card border border-border flex items-center justify-center ">
 <Zap className="size-3 text-muted-foreground" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground">Outcome</h3>
 <div className="mt-3 grid grid-cols-3 gap-3">
 {outcomes.map((o, i) => (
 <div key={i} className="bg-card border border-border rounded-md p-3 text-center ">
 <div className={cn("text-[18px] font-bold", o.color)}>{o.value}</div>
 <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">{o.label}</div>
 </div>
 ))}
 </div>
 </div>

 <div className="relative">
 <div className="absolute -left-[40px] top-1 size-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center ">
 <CheckCircle2 className="size-3 text-emerald-600" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground">Certificate</h3>
 <p className="text-[13px] text-muted-foreground mt-1">
 {record.certificate?.summary ?? "This memory record is linked to the mission certificate and runtime memory."}
 </p>
 </div>
 </div>
 </div>
 </div>

 <div>
 <div className="bg-card border border-border rounded-md p-6 mb-6">
 <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <FileText className="size-4" />
 Record Details
 </h3>
 <div className="space-y-4">
 <div>
 <div className="text-[12px] text-muted-foreground mb-1">Mission</div>
 <div className="text-[14px] font-semibold text-foreground">{missionTitle}</div>
 </div>
 <div>
 <div className="text-[12px] text-muted-foreground mb-1">Institution</div>
 <div className="inline-flex items-center px-2 py-1 bg-muted rounded-md text-[13px] font-medium text-foreground/90">
 {institutionTitle}
 </div>
 </div>
 <div>
 <div className="text-[12px] text-muted-foreground mb-1">Updated</div>
 <div className="text-[14px] font-semibold text-foreground">{formatTimestamp(record.updatedAt ?? record.createdAt)}</div>
 </div>
 <div>
 <div className="text-[12px] text-muted-foreground mb-1">Created</div>
 <div className="text-[14px] font-semibold text-foreground">{formatTimestamp(record.createdAt)}</div>
 </div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6">
 <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <Lightbulb className="size-4" />
 Suggested Improvements
 </h3>
 <div className="space-y-3">
 {(record.suggestedImprovements ?? []).length > 0 ? (
 (record.suggestedImprovements ?? []).map((item, i) => (
 <div key={`${item}-${i}`} className="text-[13px] text-foreground/90 border border-border rounded-md p-3 bg-muted/50">
 {item}
 </div>
 ))
 ) : (
 <div className="text-[13px] text-muted-foreground">
 No suggested improvements recorded.
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 ) : null}
 </div>
 );
}
