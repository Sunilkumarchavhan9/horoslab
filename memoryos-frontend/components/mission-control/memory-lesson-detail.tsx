"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Target, Building, ShieldCheck, Download, Archive, Edit3, ArrowUpRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
 applyEpochMemoryLesson,
 listEpochMemoryLessons,
 readActiveEpochWorkspaceId,
 rejectEpochMemoryLesson,
 type EpochMemoryLesson,
} from "@/lib/epoch-api";

function lessonTitle(slug: string): string {
 return slug
 .replace(/[-_]+/g, " ")
 .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatConfidence(value?: number | null): string {
 if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
 return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function sourceLabel(lesson: EpochMemoryLesson): string {
 const source = lesson.sourceRecords?.[0];
 return source?.summary || source?.institutionId || lesson.workspaceId || "Live workspace";
}

export function MemoryLessonDetail({ id, onBack }: { id: string; onBack: () => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [lesson, setLesson] = useState<EpochMemoryLesson | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [actionState, setActionState] = useState<"apply" | "reject" | null>(null);

 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveEpochWorkspaceId());
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
 setLesson(null);
 setLoading(false);
 setError("Select a workspace to view lessons.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const result = await listEpochMemoryLessons(workspaceId);
 if (canceled) return;
 const all = result.lessons ?? [];
 const normalizedId = id.toLowerCase();
 const match =
 all.find((item) => item.id === id) ??
 all.find((item) => item.id === `derived:${normalizedId}`) ??
 all.find((item) => lessonTitle(item.id).toLowerCase() === normalizedId) ??
 all.find((item) => lessonTitle(item.title ?? item.content ?? item.id).toLowerCase() === normalizedId) ??
 null;

 if (match) {
 setLesson(match);
 } else {
 setLesson(null);
 setError("No matching lesson was found in live Epoch memory records.");
 }
 } catch (loadError) {
 if (!canceled) {
 setLesson(null);
 setError(loadError instanceof Error ? loadError.message : "Failed to load lesson detail.");
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

 const relatedRecords = useMemo(() => lesson?.sourceRecords ?? [], [lesson]);

 const summaryRows = [
 { label: "Lesson", value: lesson?.title ?? lessonTitle(id) },
 { label: "Summary", value: lesson?.content ?? error ?? "No live lesson data is available for this workspace." },
 { label: "Created From", value: lesson?.sourceRecords?.[0]?.summary ?? "No matching mission found" },
 { label: "Institution", value: sourceLabel(lesson ?? { id, title: id } as EpochMemoryLesson) },
 { label: "Used By", value: lesson ? `${lesson.count ?? 0} Records` : "0 Records" },
 { label: "Confidence", value: formatConfidence(lesson?.confidence) },
 ];

 async function refreshLesson() {
 if (!workspaceId) return;
 const result = await listEpochMemoryLessons(workspaceId);
 const updated = result.lessons?.find((item) => item.id === lesson?.id) ?? lesson;
 setLesson(updated ?? null);
 }

 async function handleApply() {
 if (!workspaceId || !lesson) return;
 setActionState("apply");
 try {
 await applyEpochMemoryLesson(workspaceId, lesson.id);
 await refreshLesson();
 } finally {
 setActionState(null);
 }
 }

 async function handleReject() {
 if (!workspaceId || !lesson) return;
 setActionState("reject");
 try {
 await rejectEpochMemoryLesson(workspaceId, lesson.id);
 await refreshLesson();
 } finally {
 setActionState(null);
 }
 }

 return (
 <div className="w-full flex flex-col pt-2 h-full font-sans pb-16">
 <div className="flex items-center gap-2 mb-8 text-[14px]">
 <span className="text-muted-foreground hover:text-foreground cursor-pointer font-medium transition-colors" onClick={onBack}>
 Lessons Learned
 </span>
 <ChevronRight className="size-4 text-[#aaa]" />
 <span className="text-foreground font-semibold flex items-center gap-2">
 {lesson?.title ?? lessonTitle(id)}
 </span>
 </div>

 {loading ? (
 <div className="bg-card border border-border rounded-md p-12 text-center">
 <p className="text-[15px] text-muted-foreground">Loading lesson detail.</p>
 </div>
 ) : error ? (
 <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="md:col-span-2">
 <div className="bg-card border border-border rounded-md overflow-hidden">
 <div className="px-6 py-6 border-b border-border bg-card">
 <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
 <AlertTriangle className="size-5 text-[#f59e0b]" />
 Lesson detail
 </h2>
 <p className="text-[13px] text-muted-foreground mt-1">{error}</p>
 </div>
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Field</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Value</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e2]">
 {summaryRows.map((row) => (
 <tr key={row.label}>
 <td className="px-6 py-6 text-[13px] font-medium text-foreground">{row.label}</td>
 <td className="px-6 py-6 text-[13px] text-muted-foreground">{row.value}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div>
 <div className="bg-card border border-border rounded-md p-6 mb-6">
 <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <FileText className="size-4" />
 Source Records
 </h3>
 <div className="overflow-hidden rounded-md border border-border">
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mission</th>
 <th className="px-6 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Institution</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e2]">
 <tr key="lesson-empty-source-row">
 <td className="px-6 py-6 text-[13px] text-muted-foreground" colSpan={2}>
 No matching lesson was found in live Epoch memory records.
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6">
 <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <ShieldCheck className="size-4" />
 Suggested Actions
 </h3>
 <div className="space-y-3">
 <div className="text-[13px] text-muted-foreground border border-border rounded-md p-3 bg-muted/50">
 Create or run a mission that emits lessons into live memory.
 </div>
 <div className="text-[13px] text-muted-foreground border border-border rounded-md p-3 bg-muted/50">
 Revisit the workspace and refresh the snapshot after new evidence lands.
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : lesson ? (
 <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="md:col-span-2">
 <div className="bg-card border border-border rounded-md p-8 mb-6">
 <h2 className="text-[24px] font-bold text-foreground leading-tight mb-4">{lesson.title ?? lessonLabelFallback(lesson)}</h2>
 <div className="text-[15px] leading-relaxed text-foreground/90">
 <span className="font-semibold text-foreground">Summary: </span>
 {lesson.content ?? "No content stored for this lesson."}
 </div>

 <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-border">
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <FileText className="size-3.5" /> Created From
 </div>
 <div className="text-[15px] font-medium text-[#0f52ff] cursor-pointer hover:underline flex items-center gap-1">
 {lesson.sourceRecords?.[0]?.summary ?? "Live memory record"} <ArrowUpRight className="size-3" />
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <Building className="size-3.5" /> Institution
 </div>
 <div className="text-[15px] font-medium text-foreground bg-muted px-2 py-1 rounded-md inline-block">
 {sourceLabel(lesson)}
 </div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <Target className="size-3.5" /> Used By
 </div>
 <div className="text-[15px] font-bold text-foreground">{lesson.count ?? 0} Records</div>
 </div>
 <div>
 <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <ShieldCheck className="size-3.5" /> Confidence
 </div>
 <div className="text-[15px] font-bold text-emerald-600">{formatConfidence(lesson.confidence)}</div>
 </div>
 </div>
 </div>
 </div>

 <div>
 <div className="bg-card border border-border rounded-md p-6 space-y-3">
 <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Suggested Actions</h3>

 <Button className="btn-glossy-blue w-full justify-start h-9 gap-2" onClick={handleApply} disabled={actionState !== null}>
 <Edit3 className="size-4" />
 {actionState === "apply" ? "Applying..." : "Apply to Future Records"}
 </Button>

 <Button variant="outline" className="w-full justify-start" onClick={handleApply} disabled={actionState !== null}>
 <Target className="size-4 mr-2" />
 Apply Lesson
 </Button>

 <div className="pt-3 pb-2 border-t border-border mt-4">
 <Button
 variant="ghost"
 className="w-full justify-start text-muted-foreground"
 onClick={() => {
 const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = `${lesson.id}.json`;
 link.click();
 URL.revokeObjectURL(url);
 }}
 >
 <Download className="size-4 mr-2" />
 Export
 </Button>
 <Button
 variant="ghost"
 className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
 onClick={handleReject}
 disabled={actionState !== null}
 >
 <Archive className="size-4 mr-2" />
 {actionState === "reject" ? "Rejecting..." : "Reject Lesson"}
 </Button>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6 mt-6">
 <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <ShieldCheck className="size-4" />
 Source Records
 </h3>
 <div className="space-y-3">
 {relatedRecords.length > 0 ? (
 relatedRecords.map((record) => (
 <div key={record.id} className="text-[13px] text-foreground/90 border border-border rounded-md p-3 bg-muted/50">
 <div className="font-medium text-foreground">{record.summary ?? record.id}</div>
 <div className="text-muted-foreground mt-1">{record.missionId ? `Mission ${record.missionId}` : "Mission not linked"}</div>
 </div>
 ))
 ) : (
 <div className="overflow-hidden rounded-md border border-border">
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mission</th>
 <th className="px-6 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Institution</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e2]">
 <tr key="lesson-empty-source-row">
 <td className="px-6 py-6 text-[13px] text-muted-foreground" colSpan={2}>
 No source records were matched.
 </td>
 </tr>
 </tbody>
 </table>
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

function lessonLabelFallback(lesson: EpochMemoryLesson): string {
 return lesson.title?.trim() || lesson.content?.trim() || lesson.id;
}
