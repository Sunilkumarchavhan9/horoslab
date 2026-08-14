"use client";

import { Target, Building, User, BrainCircuit, Calendar, DollarSign, Wrench, AlertTriangle } from "lucide-react";
import { type EpochMissionDetail } from "@/lib/epoch-api";

function asRecord(value: unknown): Record<string, unknown> | null {
 return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
 for (const value of values) {
 if (typeof value === "string" && value.trim()) return value.trim();
 }
 return null;
}

function formatTimestamp(value?: string | null): string {
 if (!value) return "Not set";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return "Not set";
 return parsed.toLocaleString();
}

function budgetEntries(budgets?: Record<string, unknown> | null): Array<[string, string]> {
 if (!budgets || typeof budgets !== "object") return [];
 return Object.entries(budgets).map(([label, value]) => [label, typeof value === "string" ? value : JSON.stringify(value)] as [string, string]);
}

export function MissionDetailOverview({ mission }: { mission: EpochMissionDetail }) {
 const institutionName = mission.institution?.name ?? "Unknown";
 const missionRecord = asRecord(mission);
 const executionPlanner = asRecord(mission.executionRun?.planner);
 const executionExecutor = asRecord(mission.executionRun?.executor);
 const executionReviewer = asRecord(mission.executionRun?.reviewer);
 const executionHuman = asRecord(mission.executionRun?.human);
 const authorityBudget = mission.authorityPolicies?.[0]?.budgets ?? null;

 const owner =
 firstString(
 missionRecord?.owner,
 missionRecord?.assignee,
 missionRecord?.assignedTo,
 missionRecord?.createdBy,
 executionHuman?.owner,
 executionHuman?.assignee,
 executionHuman?.name,
 executionExecutor?.owner,
 executionExecutor?.assignee,
 executionExecutor?.name,
 executionReviewer?.owner,
 executionReviewer?.assignee,
 executionReviewer?.name,
 ) ?? "Unassigned";

 const planner =
 firstString(
 executionPlanner?.planner,
 executionPlanner?.model,
 executionPlanner?.name,
 executionPlanner?.role,
 executionPlanner?.stage,
 ) ?? "Epoch Planner";

 const deadline =
 firstString(
 missionRecord?.deadlineAt,
 missionRecord?.dueAt,
 missionRecord?.dueDate,
 missionRecord?.targetDate,
 ) ?? formatTimestamp(mission.updatedAt);

 const budgetValues = budgetEntries(authorityBudget);
 const budget =
 firstString(
 missionRecord?.budgetCents != null ? String(missionRecord.budgetCents) : null,
 missionRecord?.budget != null ? String(missionRecord.budget) : null,
 budgetValues[0]?.[1],
 ) ?? "Not set";

 const risk = mission.authorityPolicies?.[0]?.blocked ? "High" : mission.authorityPolicies?.[0]?.needsApproval ? "Medium" : "Low";
 const tools = [
 mission.executionRun?.planner ? "Planner" : null,
 mission.executionRun?.executor ? "Executor" : null,
 mission.verificationRun ? "Verification" : null,
 mission.certificate ? "Certificate" : null,
 mission.memoryRecord ? "Memory" : null,
 mission.evidence?.length ? "Evidence" : null,
 ].filter((tool): tool is string => Boolean(tool));

 return (
 <div className="w-full flex flex-col gap-6 px-6">
 <div className="bg-card border border-border rounded-md p-6">
 <h2 className="text-[14px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
 <Target className="size-4 text-muted-foreground" />
 Mission Goal
 </h2>
 <p className="text-[15px] text-foreground/90 leading-relaxed">
 {mission.objective || mission.title || "No objective recorded for this mission yet."}
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-card border border-border rounded-md p-6 flex items-center gap-6">
 <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
 <Building className="size-5 text-blue-600" />
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Institution</span>
 <span className="text-[15px] font-semibold text-foreground">{institutionName}</span>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6 flex items-center gap-6">
 <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
 <User className="size-5 text-purple-600" />
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Owner</span>
 <span className="text-[15px] font-semibold text-foreground">{owner}</span>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6 flex items-center gap-6">
 <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
 <BrainCircuit className="size-5 text-emerald-600" />
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Planner</span>
 <span className="text-[15px] font-semibold text-foreground">{planner}</span>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6 flex items-center gap-6">
 <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
 <Calendar className="size-5 text-amber-600" />
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Deadline</span>
 <span className="text-[15px] font-semibold text-foreground">{deadline}</span>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6 flex items-center gap-6">
 <div className="size-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
 <DollarSign className="size-5 text-green-600" />
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Budget</span>
 <span className="text-[15px] font-semibold text-foreground">{budget}</span>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6 flex items-center gap-6">
 <div className="size-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
 <AlertTriangle className="size-5 text-indigo-600" />
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Risk Level</span>
 <span className="text-[15px] font-semibold text-foreground">{risk}</span>
 </div>
 </div>
 </div>

 <div className="bg-card border border-border rounded-md p-6">
 <h2 className="text-[14px] font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
 <Wrench className="size-4 text-muted-foreground" />
 Allowed Tools
 </h2>
 <div className="flex flex-wrap gap-2">
 {tools.map((tool) => (
 <span key={tool} className="px-3 py-1 bg-card border border-border rounded text-[13px] font-medium text-foreground/80">
 {tool}
 </span>
 ))}
 </div>
 </div>
 </div>
 );
}
