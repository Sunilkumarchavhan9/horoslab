"use client";

import { Award, Download, ExternalLink, Hash, Calendar, ShieldCheck, CheckCircle2, FileJson, BadgeCheck } from "lucide-react";
import { type EpochMissionDetail } from "@/lib/epoch-api";

function formatDate(value?: string | null): string {
 if (!value) return "Pending";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return "Pending";
 return parsed.toLocaleString();
}

export function MissionDetailCertificate({ mission }: { mission: EpochMissionDetail }) {
 const certificate = mission.certificate;
 const summary = certificate?.summary ?? "No certificate summary recorded yet.";

 return (
 <div className="w-full flex flex-col pt-4 gap-6 pb-12 px-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Award className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Status</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{certificate?.status ?? "Pending"}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Certificate lifecycle</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Hash className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">ID</span>
 </div>
 <div className="mt-3 text-[18px] font-semibold text-foreground break-all">{certificate?.id ?? "pending"}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Mission certificate identifier</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Calendar className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Issued</span>
 </div>
 <div className="mt-3 text-[18px] font-semibold text-foreground">{formatDate(certificate?.createdAt)}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Certificate generation time</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <BadgeCheck className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Decision</span>
 </div>
 <div className="mt-3 text-[18px] font-semibold text-foreground">{mission.verificationRun?.finalDecision ?? "REVIEW"}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Verification outcome</div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md overflow-hidden flex flex-col md:flex-row">
 <div className="bg-[#111] w-full md:w-[280px] p-8 flex flex-col items-center justify-center text-center text-[#F0EFE2] shrink-0 relative overflow-hidden">
 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
 <Award className="size-16 text-[#f38020] mb-4 relative z-10" strokeWidth={1.5} />
 <h2 className="text-[20px] font-bold tracking-tight relative z-10">Verification<br />Certificate</h2>
 <span className="mt-4 px-3 py-1 bg-card/20 rounded-full text-[12px] font-medium tracking-widest uppercase relative z-10">
 {certificate?.status ?? "Pending"}
 </span>
 </div>

 <div className="p-8 flex-1 flex flex-col justify-center">
 <div className="flex items-center justify-between gap-6 mb-6">
 <div>
 <h3 className="text-[24px] font-bold text-foreground">{mission.title ?? "Untitled Mission"}</h3>
 <p className="text-[13px] text-muted-foreground mt-1">Generated after verification completes successfully.</p>
 </div>
 <button className="bg-card hover:bg-[#e5e5e5] text-foreground/90 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2">
 <Download className="size-4" />
 Download PDF
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
 <Hash className="size-3.5" /> Certificate ID
 </span>
 <span className="text-[14px] font-mono font-medium text-foreground mt-1">{certificate?.id ?? "pending"}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
 <Calendar className="size-3.5" /> Issue Date
 </span>
 <span className="text-[14px] font-medium text-foreground mt-1">{formatDate(certificate?.createdAt)}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
 <ShieldCheck className="size-3.5" /> Institution
 </span>
 <span className="text-[14px] font-medium text-foreground mt-1">{mission.institution?.name ?? "Unknown"}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
 <CheckCircle2 className="size-3.5" /> Final Result
 </span>
 <span className="text-[14px] font-bold text-green-600 mt-1">{mission.verificationRun?.finalDecision ?? "REVIEW"}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
 <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
 <h3 className="text-[14px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
 <FileJson className="size-4 text-muted-foreground" />
 Certificate Summary
 </h3>
 <p className="text-[13px] text-muted-foreground leading-relaxed">{summary}</p>
 <div className="rounded-md border border-border bg-muted/50 p-6 font-mono text-[12px] text-foreground/90 break-all">
 {JSON.stringify(certificate?.evidenceSummary ?? { missionId: mission.id }, null, 2)}
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
 <h3 className="text-[14px] font-bold text-foreground uppercase tracking-wider">Certificate Notes</h3>
 <p className="text-[13px] text-muted-foreground leading-relaxed">
 The certificate belongs to the mission. It captures the verified outcome, the evidence summary, and the timestamp used for downstream audit trails.
 </p>
 <div className="flex justify-between items-center rounded-md border border-border bg-muted/50 p-6">
 <div>
 <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Ledger</div>
 <div className="text-[13px] text-muted-foreground">Exportable mission certificate record</div>
 </div>
 <button className="text-[13px] font-medium text-[#0f52ff] hover:underline flex items-center gap-1">
 Verify on Ledger <ExternalLink className="size-3.5" />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
