"use client";

import { useEffect, useMemo, useState } from "react";
import {
 BrainCircuit,
 CheckCircle2,
 Filter,
 FileText,
 Sparkles,
 Settings,
 X,
 Check,
} from "lucide-react";
import {
 listEpochMemoryLessons,
 readActiveEpochWorkspaceId,
 type EpochMemoryLesson,
} from "@/lib/epoch-api";

function formatConfidence(value?: number | null): string {
 if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
 return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function lessonLabel(lesson: EpochMemoryLesson): string {
 return lesson.title?.trim() || lesson.content?.trim() || lesson.id;
}

function institutionLabel(lesson: EpochMemoryLesson): string {
 const source = lesson.sourceRecords?.[0];
 if (source?.institutionId) return source.institutionId;
 if (source?.summary) return source.summary;
 return lesson.workspaceId ? "Workspace memory" : "Unknown";
}

function statusTone(status?: string | null): string {
 const normalized = (status ?? "pending").toLowerCase();
 if (normalized === "applied") return "text-emerald-700 bg-emerald-50 border-emerald-200";
 if (normalized === "rejected") return "text-rose-700 bg-rose-50 border-rose-200";
 return "text-amber-700 bg-amber-50 border-amber-200";
}

export function MemoryLessons({ onViewDetail }: { onViewDetail?: (id: string) => void }) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveEpochWorkspaceId());
 const [lessons, setLessons] = useState<EpochMemoryLesson[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

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
 setLessons([]);
 setLoading(false);
 setError("Select a workspace to view lessons.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const result = await listEpochMemoryLessons(workspaceId);
 if (!canceled) {
 setLessons(result.lessons ?? []);
 }
 } catch (loadError) {
 if (!canceled) {
 setLessons([]);
 setError(loadError instanceof Error ? loadError.message : "Failed to load lessons.");
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
 const total = lessons.length;
 const applied = lessons.filter((lesson) => (lesson.status ?? "pending").toLowerCase() === "applied").length;
 const rejected = lessons.filter((lesson) => (lesson.status ?? "pending").toLowerCase() === "rejected").length;
 const pending = total - applied - rejected;
 return { total, applied, pending: Math.max(0, pending), rejected };
 }, [lessons]);

 const suggestions = useMemo(() => {
 const recent = [...lessons]
 .sort((a, b) => (new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()))
 .slice(0, 5);
 return recent.map((lesson) => ({
 id: lesson.id,
 title: lessonLabel(lesson),
 detail: `${institutionLabel(lesson)} · ${formatConfidence(lesson.confidence)}`,
 status: lesson.status ?? "pending",
 }));
 }, [lessons]);

 return (
 <div className="w-full flex flex-col pt-2 pb-12 font-sans min-h-screen">
 <div className="mb-8">
 <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-1">Lessons Learned</h1>
 <p className="text-[15px] text-muted-foreground">This is your live improvement engine. Every completed mission can become reusable guidance.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="bg-card border border-border rounded-md p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Lessons Generated</div>
 <div className="text-[24px] font-semibold text-foreground">{stats.total}</div>
 </div>
 <div className="bg-card border border-border rounded-md p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Applied</div>
 <div className="text-[24px] font-semibold text-emerald-600">{stats.applied}</div>
 </div>
 <div className="bg-card border border-border rounded-md p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Pending Review</div>
 <div className="text-[24px] font-semibold text-amber-600">{stats.pending}</div>
 </div>
 <div className="bg-card border border-border rounded-md p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Rejected</div>
 <div className="text-[24px] font-semibold text-rose-600">{stats.rejected}</div>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
 <div className="xl:col-span-2 space-y-6">
 <div className="bg-card border border-border rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
 <div className="px-6 py-6 border-b border-border flex items-center justify-between bg-card">
 <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
 <BrainCircuit className="size-4" />
 Lessons Table
 </h2>
 <button className="bg-card border border-border px-3 py-1.5 rounded-md text-[13px] font-medium text-foreground/90 flex items-center gap-2 hover:bg-card">
 <Filter className="size-3.5" /> Filter
 </button>
 </div>
 <table className="w-full text-left border-collapse">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Lesson</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Institution</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Confidence</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#e2e2e2]">
 {loading ? (
 <tr>
 <td className="px-6 py-8 text-[13px] text-muted-foreground" colSpan={4}>
 Loading live lessons.
 </td>
 </tr>
 ) : error ? (
 <tr>
 <td className="px-6 py-8 text-[13px] text-rose-600" colSpan={4}>
 {error}
 </td>
 </tr>
 ) : lessons.length === 0 ? (
 <tr>
 <td className="px-6 py-8 text-[13px] text-muted-foreground" colSpan={4}>
 No live lessons yet. Run a mission that produces memory records.
 </td>
 </tr>
 ) : (
 lessons.map((lesson) => (
 <tr
 key={lesson.id}
 className="hover:bg-card transition-colors cursor-pointer group"
 onClick={() => onViewDetail?.(lesson.id)}
 >
 <td className="px-6 py-6 text-[14px] font-medium text-foreground pr-4">{lessonLabel(lesson)}</td>
 <td className="px-6 py-6 text-[13px] text-muted-foreground">{institutionLabel(lesson)}</td>
 <td className="px-6 py-6 text-[13px] font-medium text-foreground">{formatConfidence(lesson.confidence)}</td>
 <td className="px-6 py-6 text-[13px]">
 <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium border ${statusTone(lesson.status)}`}>
 {(lesson.status ?? "pending").toLowerCase() === "applied" ? <CheckCircle2 className="size-3" /> : <div className="size-2 rounded-full bg-amber-500 mx-0.5" />}
 {lesson.status ?? "pending"}
 </span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-card border border-border rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
 <div className="px-6 py-6 border-b border-border bg-card">
 <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
 <Sparkles className="size-4 text-[#0f52ff]" />
 Live Suggestions
 </h2>
 <p className="text-[13px] text-muted-foreground mt-0.5">Recent memory lessons waiting to be applied or reviewed.</p>
 </div>
 <div className="p-6 space-y-4">
 {suggestions.length === 0 ? (
 <div className="text-[14px] text-muted-foreground border border-border rounded-md p-3 bg-muted/50">
 No suggestions yet.
 </div>
 ) : (
 suggestions.map((item) => (
 <div key={item.id} className="flex items-start gap-3">
 <div className="size-1.5 rounded-full bg-[#0f52ff] mt-2 shrink-0" />
 <div className="flex-1">
 <div className="text-[14px] text-foreground/90 leading-snug">{item.title}</div>
 <div className="text-[12px] text-muted-foreground mt-1">{item.detail}</div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 <div className="bg-card border border-border rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
 <div className="px-6 py-6 border-b border-border bg-card">
 <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
 <FileText className="size-4" />
 Actions
 </h2>
 </div>
 <div className="p-6 space-y-3">
 <div className="text-[13px] text-muted-foreground border border-border rounded-md p-3 bg-muted/50">
 Select a lesson from the table to view detail and apply it to future records.
 </div>
 <button className="w-full py-2 bg-card border border-border hover:bg-card text-foreground/90 rounded text-[13px] font-medium transition-colors flex items-center justify-center gap-2" disabled>
 <Settings className="size-3.5" /> Edit
 </button>
 <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[13px] font-medium transition-colors flex items-center justify-center gap-2" disabled>
 <Check className="size-3.5" /> Apply
 </button>
 <button className="w-full py-2 bg-card border border-border hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-foreground/90 rounded text-[13px] font-medium transition-colors flex items-center justify-center gap-2" disabled>
 <X className="size-3.5" /> Reject
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
