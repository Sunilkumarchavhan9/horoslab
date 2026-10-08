"use client";

import { ShieldCheck, CheckCircle2, AlertTriangle, Eye, ShieldAlert, BadgeCheck, FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type HorosMissionDetail } from "@/lib/horos-api";

function toStringList(value: unknown): string[] {
 if (!Array.isArray(value)) return [];
 return value.map((item) => (typeof item === "string" ? item : String(item))).map((item) => item.trim()).filter(Boolean);
}

function formatPercent(value?: number | null): string {
 return typeof value === "number" && Number.isFinite(value) ? `${value}%` : "—";
}

export function MissionDetailVerification({ mission }: { mission: HorosMissionDetail }) {
 const decision = (mission.verificationRun?.finalDecision ?? "REVIEW").toUpperCase();
 const isVerified = decision === "PASS";
 const checklist = toStringList(mission.verificationRun?.checklist);
 const evidenceCount = mission.evidence?.length ?? 0;
 const policyCount = mission.authorityPolicies?.length ?? 0;
 const confidence = formatPercent(mission.verificationRun?.confidence ?? null);

 return (
 <div className="w-full flex flex-col pt-4 gap-6 pb-12 px-6">
      <div className={cn("w-full rounded-md p-6 flex items-center justify-between border", isVerified ? "bg-green-500/10 border-green-500/20" : decision === "FAIL" ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20")}>
        <div className="flex items-center gap-6">
          {isVerified ? <ShieldCheck className="size-6 text-green-500" /> : decision === "FAIL" ? <ShieldAlert className="size-6 text-red-500" /> : <ShieldAlert className="size-6 text-amber-500" />}
          <div className="flex flex-col">
            <h1 className={cn("text-[15px] font-bold tracking-tight", isVerified ? "text-green-600 dark:text-green-500" : decision === "FAIL" ? "text-red-600 dark:text-red-500" : "text-amber-600 dark:text-amber-500")}>
              {isVerified ? "MISSION VERIFIED" : decision === "FAIL" ? "MISSION FAILED" : "NEEDS REVIEW"}
            </h1>
            <p className={cn("text-[13px] font-medium", isVerified ? "text-green-600/80 dark:text-green-500/80" : decision === "FAIL" ? "text-red-600/80 dark:text-red-500/80" : "text-amber-600/80 dark:text-amber-500/80")}>
              {isVerified
                ? "All policy checks, evidence requirements, and confidence thresholds have been successfully met."
                : "The mission execution requires human review before the final output can be committed."}
            </p>
          </div>
        </div>
      </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <BadgeCheck className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Decision</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{decision}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Final verification result</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <CheckCircle2 className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Confidence</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{confidence}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Verification confidence score</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <FileCheck2 className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Evidence</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{evidenceCount}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Mission evidence items</div>
 </div>

 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-center gap-2 text-muted-foreground">
 <ShieldCheck className="size-4" />
 <span className="text-[13px] font-medium uppercase tracking-wider">Policies</span>
 </div>
 <div className="mt-3 text-[26px] font-semibold text-foreground">{policyCount}</div>
 <div className="mt-1 text-[12px] text-muted-foreground">Authority checks evaluated</div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6">
 <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
 <h2 className="text-[14px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
 <CheckCircle2 className="size-4 text-muted-foreground" />
 Core Verification
 </h2>
 <div className="flex flex-col gap-6">
 <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-4">
 <span className="text-[14px] font-medium text-muted-foreground">Policy Checks</span>
 <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[12px] font-bold", isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
 {decision === "PASS" ? "PASS" : "REVIEW"}
 </span>
 </div>
 <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-4">
 <span className="text-[14px] font-medium text-muted-foreground">Evidence Requirements</span>
 <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[12px] font-bold", evidenceCount > 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
 {evidenceCount > 0 ? "PASS" : "REVIEW"}
 </span>
 </div>
 <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-4">
 <div className="flex flex-col">
 <span className="text-[14px] font-medium text-muted-foreground">Confidence Score</span>
 <span className="text-[12px] text-muted-foreground">Based on verification output</span>
 </div>
 <span className="text-[24px] font-bold text-green-600">{confidence}</span>
 </div>
 <div className="flex items-center justify-between pb-2">
 <div className="flex flex-col">
 <span className="text-[14px] font-medium text-muted-foreground">Human Reviewer</span>
 <span className="text-[12px] text-muted-foreground">Live mission control</span>
 </div>
 <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-bold bg-green-100 text-green-700">{decision}</span>
 </div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
 <h2 className="text-[14px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
 <Eye className="size-4 text-muted-foreground" />
 Policy Check Breakdown
 </h2>
 <div className="flex flex-col gap-3">
 {(mission.authorityPolicies ?? []).map((policy) => (
 <div key={policy.id} className="flex items-start gap-3 p-3 rounded-md bg-card border border-border">
 <CheckCircle2 className={cn("size-5 shrink-0 mt-0.5", policy.blocked ? "text-red-500" : "text-green-500")} />
 <div className="flex flex-col">
 <span className="text-[14px] font-semibold text-foreground">{policy.name ?? "Policy"}</span>
 <span className="text-[13px] text-muted-foreground">
 {policy.blocked ? "Blocked by policy" : policy.needsApproval ? "Waiting for approval" : "Policy passed"}
 </span>
 </div>
 </div>
 ))}
 {(mission.authorityPolicies ?? []).length === 0 ? (
 <div className="flex items-start gap-3 p-3 rounded-md bg-card border border-amber-200 border-dashed">
 <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
 <div className="flex flex-col">
 <span className="text-[14px] font-semibold text-foreground">No policies attached yet</span>
 <span className="text-[13px] text-muted-foreground">This mission has no live policy evaluation records yet.</span>
 </div>
 </div>
 ) : null}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
 <h2 className="text-[14px] font-bold text-foreground uppercase tracking-wider">Verification Checklist</h2>
 {checklist.length > 0 ? (
 <div className="space-y-2">
 {checklist.map((item, index) => (
 <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-md border border-border bg-muted/50 p-3">
 <CheckCircle2 className="size-4 text-green-500 mt-0.5" />
 <span className="text-[13px] text-muted-foreground">{item}</span>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-[13px] text-muted-foreground">No verification checklist was attached to this run.</div>
 )}
 </div>

 <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
 <h2 className="text-[14px] font-bold text-foreground uppercase tracking-wider">What verification means</h2>
 <p className="text-[13px] text-muted-foreground leading-6">
 Verification belongs to the mission. It combines evidence, policy checks, and confidence thresholds before the result is committed or a human review is requested.
 </p>
 </div>
 </div>

 </div>
 );
}
