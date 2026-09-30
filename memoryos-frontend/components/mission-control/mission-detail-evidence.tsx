"use client";

import { Code, MessageSquare, Globe, Database, ExternalLink, Image as ImageIcon, FileText, Link2, Layers3 } from "lucide-react";
import { type DhyraMissionDetail } from "@/lib/dhyra-api";

function formatDate(value?: string | null): string {
 if (!value) return "Unknown";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return "Unknown";
 return parsed.toLocaleString();
}

function evidenceIcon(kind?: string | null) {
 const value = kind?.toLowerCase() ?? "";
 if (value.includes("browser")) return <Globe className="size-5 text-blue-500" />;
 if (value.includes("api")) return <Database className="size-5 text-purple-500" />;
 if (value.includes("screenshot")) return <ImageIcon className="size-5 text-green-500" />;
 if (value.includes("slack")) return <MessageSquare className="size-5 text-amber-500" />;
 if (value.includes("document")) return <FileText className="size-5 text-slate-500" />;
 return <Code className="size-5 text-foreground" />;
}

export function MissionDetailEvidence({ mission }: { mission: DhyraMissionDetail }) {
 const items = mission.evidence ?? [];
 const typeCounts = items.reduce<Record<string, number>>((counts, item) => {
 const type = item.kind ?? "evidence";
 counts[type] = (counts[type] ?? 0) + 1;
 return counts;
 }, {});
 const topTypes = Object.entries(typeCounts).slice(0, 4);

 return (
 <div className="w-full flex flex-col pt-4 gap-6 pb-12 px-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Layers3 className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Evidence</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{items.length}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Collected artifacts</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Link2 className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Linked</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{items.filter((item) => item.url || item.filePath).length}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Evidence with source</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <FileText className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Summary</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{mission.verificationRun?.evidenceSummary ? "Yes" : "—"}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Used by verification</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <ExternalLink className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Latest</span>
 </div>
 <div className="mt-3 text-[18px] font-semibold text-foreground">{formatDate(items[0]?.createdAt)}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Most recent item</div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="flex items-center justify-between gap-6 border-b border-border bg-card px-6 py-6">
 <div>
 <h2 className="text-[18px] font-semibold text-foreground">Collected Evidence</h2>
 <p className="text-[13px] text-muted-foreground">Evidence items attached to this mission.</p>
 </div>
 <div className="text-[12px] text-muted-foreground">{topTypes.length > 0 ? topTypes.map(([kind, count]) => `${kind}: ${count}`).join(" • ") : "No evidence types"}</div>
 </div>

 <div className="divide-y divide-[#eee]">
 {items.length === 0 ? (
 <div className="px-6 py-8 text-[13px] text-muted-foreground">No evidence recorded for this mission yet.</div>
 ) : (
 items.map((item) => (
 <div key={item.id} className="px-6 py-6 flex items-start gap-6">
 <div className="size-11 rounded-md border border-border bg-muted/50 flex items-center justify-center shrink-0">
 {evidenceIcon(item.kind)}
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-6">
 <div className="min-w-0">
 <div className="text-[15px] font-semibold text-foreground truncate">{item.summary ?? item.kind ?? "Evidence item"}</div>
 <div className="text-[13px] text-muted-foreground">{item.kind ?? "Evidence"}</div>
 </div>
 <span className="text-[12px] font-medium text-muted-foreground">{formatDate(item.createdAt)}</span>
 </div>
 <div className="mt-3 rounded-md border border-border bg-muted/50 p-3 font-mono text-[13px] text-foreground/90 break-all">
 {item.url ?? item.filePath ?? item.contentType ?? "attached"}
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {item.contentType ? <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-muted-foreground">{item.contentType}</span> : null}
 {item.url ? <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-muted-foreground">URL</span> : null}
 {item.filePath ? <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-muted-foreground">File</span> : null}
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 <div className="flex flex-col gap-6">
 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="border-b border-border bg-card px-6 py-6">
 <h2 className="text-[18px] font-semibold text-foreground">Evidence Summary</h2>
 <p className="text-[13px] text-muted-foreground">What verification saw from this mission.</p>
 </div>
 <div className="p-6 space-y-3">
 {mission.verificationRun?.evidenceSummary ? (
 <pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-muted/50 p-6 text-[13px] text-foreground/90">
 {JSON.stringify(mission.verificationRun.evidenceSummary, null, 2)}
 </pre>
 ) : (
 <div className="text-[13px] text-muted-foreground">No verification evidence summary has been attached yet.</div>
 )}
 </div>
 </div>

 <div className="rounded-md border border-border bg-card overflow-hidden">
 <div className="border-b border-border bg-card px-6 py-6">
 <h2 className="text-[18px] font-semibold text-foreground">Evidence Notes</h2>
 <p className="text-[13px] text-muted-foreground">Quick read on how this evidence was collected.</p>
 </div>
 <div className="p-6 text-[13px] text-muted-foreground leading-6">
 Evidence is mission-scoped. If you need browser traces, screenshots, exports, or attached files, this is the right place to inspect them.
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
