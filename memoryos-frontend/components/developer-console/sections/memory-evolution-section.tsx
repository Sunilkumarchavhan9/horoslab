"use client";

import { useState } from "react";

import {
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Database,
  FileText,
  Filter,
  GitBranch,
  HelpCircle,
  Link2,
  ListChecks,
  Search,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
import { cn } from "@/lib/utils";

type MemoryEvolutionRecord = {
  id: string;
  type: string;
  summary: string;
  content: string;
  status: string;
  confidence: number;
  updatedAt: string;
  source?: string;
};

type TimelineSignal = {
  id: string;
  eventType: string;
  timestamp: string;
};

type MemoryEvolutionSectionProps = {
  workspaceName?: string;
  memories: MemoryEvolutionRecord[];
  requestEvents: RequestSectionEvent[];
  timelineEvents?: TimelineSignal[];
  openLoops: string[];
  timelineCount: number;
  experienceOverview?: ExperienceOverview | null;
  isLoading?: boolean;
  errorMessage?: string | null;
};

type ExperienceRecord = {
  id: string;
  task: string;
  source: string;
  status: string;
  outcome: string;
  updated: string;
  content: string;
  problem?: string;
  context?: string;
  action?: string;
  mistake?: string;
  lesson?: string;
  futureAgentInstruction?: string;
  evidence?: string[];
  files?: string[];
  tests?: string[];
  riskLevel?: string;
  sourceRef?: string;
  traceProof?: {
    sourceType?: string;
    sourceRef?: string;
    evidence?: string[];
    confidence?: number;
    capturedAt?: string;
  } | null;
  graph?: {
    nodes?: Array<{ id: string; kind: string; label: string }>;
    edges?: Array<{ from: string; to: string; type: string }>;
  } | null;
};

export type ExperienceOverview = {
  project: string | null;
  generatedAt: string;
  totalExperienceRecords: number;
  reviewedCount: number;
  skillCandidateCount: number;
  highRiskCount: number;
  traceProofCoverage: number;
  graph?: {
    nodes?: Array<{ id: string; kind: string; label: string }>;
    edges?: Array<{ from: string; to: string; type: string }>;
  };
  inheritanceReadiness?: {
    version: "experience_inheritance_readiness.v1";
    readyForNextBrief: number;
    needsReviewForNextBrief: number;
    blockedFromNextBrief: number;
    score: number;
    nextAction: string;
    records: Array<{
      experienceId: string;
      task: string;
      sourceRef: string;
      status: "ready" | "needs_review" | "blocked";
      score: number;
      readyForNextBrief: boolean;
      missing: string[];
      nextAction: string;
      checks: Array<{
        id: string;
        label: string;
        ok: boolean;
        detail: string;
      }>;
    }>;
  };
  records: Array<{
    id: string;
    task: string;
    problem: string;
    context: string;
    action: string;
    mistake: string;
    outcome: string;
    lesson: string;
    futureAgentInstruction: string;
    sourceType: string;
    sourceRef: string;
  evidence: string[];
  files: string[];
  tests: string[];
  relatedReasoningIds?: string[];
  riskLevel: string;
  status: string;
    confidence: number;
    updatedAt: string;
    traceProof?: {
      sourceType?: string;
      sourceRef?: string;
      evidence?: string[];
      confidence?: number;
      capturedAt?: string;
    } | null;
    graph?: {
      nodes?: Array<{ id: string; kind: string; label: string }>;
      edges?: Array<{ from: string; to: string; type: string }>;
    };
  }>;
  inheritanceAdditions: Array<{
    task: string;
    lesson: string;
    futureAgentInstruction: string;
  }>;
  outcomeLearningTimeline?: Array<{
    id: string;
    task: string;
    sourceRef: string;
    experienceRef: string;
    outcome: string;
    lesson: string;
    futureAgentInstruction: string;
    files: string[];
    tests: string[];
    riskLevel: string;
    status: string;
    updatedAt: string;
    traceProofComplete: boolean;
    lineage: string;
  }>;
};

const DETAIL_ROWS: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Problem", icon: HelpCircle },
  { label: "Context", icon: Database },
  { label: "Action", icon: Workflow },
  { label: "Mistake", icon: CircleDashed },
  { label: "Outcome", icon: CheckCircle2 },
  { label: "Lesson", icon: BookOpen },
];

function isExperienceMemory(memory: MemoryEvolutionRecord) {
  const haystack = `${memory.type} ${memory.summary} ${memory.content}`.toLowerCase();
  return haystack.includes("experience") || haystack.includes("lesson") || haystack.includes("outcome");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function compactText(value: string, fallback = "Untitled experience") {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 86 ? `${text.slice(0, 86)}...` : text;
}

function compactGraphText(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "Unlabeled";
  return text.length > 44 ? `${text.slice(0, 44)}...` : text;
}

function buildExperienceRecords(memories: MemoryEvolutionRecord[]): ExperienceRecord[] {
  return memories.filter(isExperienceMemory).map((memory) => ({
    id: memory.id,
    task: compactText(memory.summary || memory.content),
    source: memory.source ?? "Company Brain",
    status: memory.status || "Captured",
    outcome: memory.content.toLowerCase().includes("outcome") ? "Outcome captured" : "Needs review",
    updated: formatDate(memory.updatedAt),
    content: memory.content,
  }));
}

function recordsFromOverview(overview?: ExperienceOverview | null): ExperienceRecord[] {
  return (overview?.records ?? []).map((record) => ({
    id: record.id,
    task: compactText(record.task),
    source: record.sourceType,
    status: record.status,
    outcome: record.outcome,
    updated: formatDate(record.updatedAt),
    content: [
      `Problem: ${record.problem}`,
      `Context: ${record.context}`,
      `Action: ${record.action}`,
      `Mistake: ${record.mistake}`,
      `Outcome: ${record.outcome}`,
      `Lesson: ${record.lesson}`,
      `Future-agent instruction: ${record.futureAgentInstruction}`,
    ].join("\n"),
    problem: record.problem,
    context: record.context,
    action: record.action,
    mistake: record.mistake,
    lesson: record.lesson,
    futureAgentInstruction: record.futureAgentInstruction,
    evidence: record.evidence,
    files: record.files,
    tests: record.tests,
    relatedReasoningIds: record.relatedReasoningIds,
    riskLevel: record.riskLevel,
    sourceRef: record.sourceRef,
  }));
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  progress,
  loading,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  progress: number;
  loading?: boolean;
}) {
  return (
    <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] text-[#697386]">{label}</p>
          <span className="grid size-7 place-items-center rounded-[3px] border border-[#e5e7eb] bg-[#fafafa] text-[#4b5563]">
            <Icon className="size-3.5" strokeWidth={1.8} />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-7 h-7 w-16 bg-[#eef0f3]" />
        ) : (
          <p className="mt-7 text-[28px] font-semibold leading-none tracking-[-0.035em] text-[#050505]">{value}</p>
        )}
        <p className="mt-3 min-h-8 text-[12px] leading-4 text-[#697386]">{detail}</p>
        <Progress value={progress} className="mt-5 h-1 rounded-none bg-[#f0f1f3]" />
      </CardContent>
    </Card>
  );
}

function FilterRail({
  requestCount,
  timelineCount,
  experienceCount,
}: {
  requestCount: number;
  timelineCount: number;
  experienceCount: number;
}) {
  const filters = [
    ["Captured", experienceCount],
    ["Reviewed", 0],
    ["Candidate skill", 0],
    ["Needs evidence", experienceCount],
  ] as const;

  return (
    <aside className="hidden min-h-[720px] border-r border-[#e5e7eb] bg-[#fafafa] xl:block">
      <div className="sticky top-0 w-[260px] space-y-5 p-4">
        <div>
          <p className="text-[13px] font-semibold text-[#111827]">Filters</p>
          <div className="mt-4 rounded-[4px] border border-[#e5e7eb] bg-white">
            <div className="flex items-center gap-2 border-b border-[#eef0f3] px-3 py-2 text-[12px] text-[#4b5563]">
              <Clock3 className="size-4" strokeWidth={1.8} />
              Last 7 Days
            </div>
            <div className="px-3 py-2 text-[12px] text-[#697386]">
              Real work signals only
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#111827]">
            <Filter className="size-4" strokeWidth={1.8} />
            Type
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa4b2]" />
            <Input
              readOnly
              placeholder="Search types..."
              className="h-9 rounded-[4px] border-[#dfe3e8] bg-white pl-8 text-[12px] shadow-none"
            />
          </div>
          <div className="mt-3 space-y-1">
            {filters.map(([label, count]) => (
              <label key={label} className="flex items-center justify-between rounded-[4px] px-1 py-1.5 text-[12px] text-[#4b5563]">
                <span className="flex items-center gap-2">
                  <Checkbox checked={count > 0} className="size-3.5 rounded-[2px]" />
                  {label}
                </span>
                <span className="text-[#9aa4b2]">{count}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] border border-[#e5e7eb] bg-white p-3">
          <p className="text-[12px] font-medium text-[#111827]">Signal inputs</p>
          <div className="mt-3 space-y-2 text-[12px] text-[#697386]">
            <div className="flex justify-between"><span>Runtime events</span><span>{requestCount}</span></div>
            <div className="flex justify-between"><span>Trace events</span><span>{timelineCount}</span></div>
            <div className="flex justify-between"><span>Experiences</span><span>{experienceCount}</span></div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 rounded-[3px] border-[#dfe3e8] bg-white px-1.5 text-[11px] font-medium text-[#4b5563]",
        normalized.includes("review") && "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
        normalized.includes("approved") && "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
      )}
    >
      {value || "Captured"}
    </Badge>
  );
}

function ExperienceRecordsTable({
  records,
  loading,
}: {
  records: ExperienceRecord[];
  loading?: boolean;
}) {
  return (
    <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
      <CardHeader className="border-b border-[#eef0f3] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[13px] font-medium text-[#111827]">Experience Records</CardTitle>
            <CardDescription className="text-[12px] text-[#697386]">
              Real work becomes structured learning only after experience records exist.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa4b2]" />
            <Input
              readOnly
              placeholder="Search experiences..."
              className="h-8 rounded-[4px] border-[#dfe3e8] bg-white pl-8 text-[12px] shadow-none"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 bg-[#eef0f3]" />
            ))}
          </div>
        ) : records.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-[#eef0f3] hover:bg-transparent">
                <TableHead className="h-9 px-4 text-[11px] text-[#697386]">Task</TableHead>
                <TableHead className="h-9 px-4 text-[11px] text-[#697386]">Source</TableHead>
                <TableHead className="h-9 px-4 text-[11px] text-[#697386]">Status</TableHead>
                <TableHead className="h-9 px-4 text-[11px] text-[#697386]">Outcome</TableHead>
                <TableHead className="h-9 px-4 text-[11px] text-[#697386]">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="border-[#eef0f3] hover:bg-[#fafafa]">
                  <TableCell className="max-w-[420px] px-4 py-3 text-[12px] font-medium text-[#111827]">
                    <span className="line-clamp-1">{record.task}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[12px] text-[#697386]">{record.source}</TableCell>
                  <TableCell className="px-4 py-3"><StatusBadge value={record.status} /></TableCell>
                  <TableCell className="px-4 py-3 text-[12px] text-[#4b5563]">{record.outcome}</TableCell>
                  <TableCell className="px-4 py-3 text-[12px] text-[#697386]">{record.updated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="min-h-[260px]">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white text-[#697386] ring-1 ring-[#e5e7eb]">
                <FileText className="size-4" />
              </EmptyMedia>
              <EmptyTitle className="text-[13px] text-[#111827]">No experience records yet</EmptyTitle>
              <EmptyDescription className="max-w-md text-[#8a94a6]">
                Experience rows will appear after real work is captured as Problem, Context, Action, Mistake, Outcome, and Lesson.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function ExperienceDetails({ record }: { record?: ExperienceRecord }) {
  return (
    <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
      <CardHeader className="border-b border-[#eef0f3] p-4">
        <CardTitle className="text-[13px] font-medium text-[#111827]">Experience Details</CardTitle>
        <CardDescription className="text-[12px] text-[#697386]">
          The contract that turns work into reusable learning.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {DETAIL_ROWS.map((row) => {
          const Icon = row.icon;
          const value = record
            ? row.label === "Problem"
              ? record.problem
              : row.label === "Context"
                ? record.context
                : row.label === "Action"
                  ? record.action
                  : row.label === "Mistake"
                    ? record.mistake
                    : row.label === "Outcome"
                      ? record.outcome
                      : row.label === "Lesson"
                        ? record.lesson
                        : ""
            : "";
          return (
            <div key={row.label} className="grid grid-cols-[132px_minmax(0,1fr)] border-b border-[#eef0f3] last:border-b-0">
              <div className="flex items-center gap-2 border-r border-[#eef0f3] bg-[#fafafa] px-4 py-3">
                <Icon className="size-3.5 text-[#697386]" strokeWidth={1.8} />
                <span className="text-[12px] font-medium text-[#111827]">{row.label}</span>
              </div>
              <p className="min-h-10 px-4 py-3 text-[12px] leading-5 text-[#697386]">
                {value || "Not captured yet"}
              </p>
            </div>
          );
        })}
        <div className="border-t border-[#eef0f3]">
          <div className="grid grid-cols-[132px_minmax(0,1fr)] border-b border-[#eef0f3]">
            <div className="flex items-center gap-2 border-r border-[#eef0f3] bg-[#fafafa] px-4 py-3">
              <Link2 className="size-3.5 text-[#697386]" strokeWidth={1.8} />
              <span className="text-[12px] font-medium text-[#111827]">Trace proof</span>
            </div>
            <div className="px-4 py-3 text-[12px] leading-5 text-[#697386]">
              {record?.traceProof?.sourceRef ? (
                <div className="space-y-2">
                  <p className="break-all font-mono text-[11px] text-[#111827]">{record.traceProof.sourceRef}</p>
                  <p>
                    {record.traceProof.sourceType ?? "source"} ·{" "}
                    {typeof record.traceProof.confidence === "number"
                      ? `${Math.round(record.traceProof.confidence * 100)}% confidence`
                      : "confidence pending"}
                  </p>
                  <p>{record.traceProof.capturedAt ? formatDate(record.traceProof.capturedAt) : "captured time pending"}</p>
                  <div className="flex flex-wrap gap-2">
                    {(record.traceProof.evidence ?? []).slice(0, 3).map((item) => (
                      <Badge key={item} variant="outline" className="rounded-[3px] border-[#e5e7eb] bg-white text-[10px] text-[#4b5563]">
                        {compactText(item, "evidence")}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                "No trace proof captured yet."
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OutcomeLearningTimeline({
  timeline = [],
}: {
  timeline?: NonNullable<ExperienceOverview["outcomeLearningTimeline"]>;
}) {
  return (
    <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
      <CardHeader className="border-b border-[#eef0f3] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[13px] font-medium text-[#111827]">Outcome Learning Timeline</CardTitle>
            <CardDescription className="text-[12px] text-[#697386]">
              Live records created from agent outcomes and ready for the next MemoryIgnition brief.
            </CardDescription>
          </div>
          <Badge variant="outline" className="rounded-[3px] border-[#dfe3e8] bg-white text-[11px] text-[#697386]">
            {timeline.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {timeline.length > 0 ? (
          <div className="divide-y divide-[#eef0f3]">
            {timeline.map((item) => (
              <div key={item.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={item.status} />
                    <span className="text-[11px] text-[#697386]">{formatDate(item.updatedAt)}</span>
                    <span className={cn(
                      "text-[11px] font-medium",
                      item.traceProofComplete ? "text-[#047857]" : "text-[#b45309]",
                    )}>
                      {item.traceProofComplete ? "trace proof complete" : "trace proof needs evidence"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-1 text-[12px] font-medium text-[#111827]">{item.task}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#4b5563]">{compactText(item.outcome, "Outcome captured")}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#697386]">{compactText(item.lesson, "Lesson pending")}</p>
                  <p className="mt-2 break-all font-mono text-[11px] text-[#8a94a6]">{item.sourceRef}</p>
                </div>
                <div className="space-y-2 text-[11px] text-[#697386]">
                  <div className="border border-[#eef0f3] bg-[#fafafa] p-2">
                    <p className="mb-1 font-medium uppercase tracking-[0.12em] text-[#8a94a6]">Files</p>
                    <p>{item.files.length > 0 ? item.files.slice(0, 3).join(", ") : "No files reported"}</p>
                  </div>
                  <div className="border border-[#eef0f3] bg-[#fafafa] p-2">
                    <p className="mb-1 font-medium uppercase tracking-[0.12em] text-[#8a94a6]">Tests</p>
                    <p>{item.tests.length > 0 ? item.tests.slice(0, 3).join(", ") : "No tests reported"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="min-h-[220px]">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white text-[#697386] ring-1 ring-[#e5e7eb]">
                <GitBranch className="size-4" />
              </EmptyMedia>
              <EmptyTitle className="text-[13px] text-[#111827]">No outcome learning yet</EmptyTitle>
              <EmptyDescription className="max-w-md text-[#8a94a6]">
                Records appear after MemoryIgnition saves an agent outcome into experience.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function ExperienceGraphPanel({
  overview,
  selectedExperienceId,
  onSelectExperience,
}: {
  overview?: ExperienceOverview | null;
  selectedExperienceId?: string | null;
  onSelectExperience?: (experienceId: string) => void;
}) {
  const nodes = overview?.graph?.nodes ?? [];
  const edges = overview?.graph?.edges ?? [];
  const nodeToExperienceIds = new Map<string, string[]>();
  const addExperienceId = (nodeId: string, experienceId: string) => {
    const current = nodeToExperienceIds.get(nodeId) ?? [];
    if (!current.includes(experienceId)) current.push(experienceId);
    nodeToExperienceIds.set(nodeId, current);
  };
  for (const edge of edges) {
    const sourceExperienceId = edge.from.startsWith("experience:") ? edge.from.slice("experience:".length) : null;
    const targetExperienceId = edge.to.startsWith("experience:") ? edge.to.slice("experience:".length) : null;
    if (sourceExperienceId) {
      addExperienceId(edge.from, sourceExperienceId);
      addExperienceId(edge.to, sourceExperienceId);
    }
    if (targetExperienceId) {
      addExperienceId(edge.from, targetExperienceId);
      addExperienceId(edge.to, targetExperienceId);
    }
  }
  for (const node of nodes) {
    if (node.id.startsWith("experience:")) {
      addExperienceId(node.id, node.id.slice("experience:".length));
    }
  }
  function pickExperienceId(nodeId: string) {
    const experienceId = nodeToExperienceIds.get(nodeId)?.[0];
    if (experienceId) {
      onSelectExperience?.(experienceId);
    }
  }

  return (
    <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
      <CardHeader className="border-b border-[#eef0f3] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[13px] font-medium text-[#111827]">Experience Graph</CardTitle>
            <CardDescription className="text-[12px] text-[#697386]">
              Live nodes and edges built from outcomes, lessons, and linked source memory.
            </CardDescription>
          </div>
          <Badge variant="outline" className="rounded-[3px] border-[#dfe3e8] bg-white text-[11px] text-[#697386]">
            {overview?.traceProofCoverage ?? 0}% trace proof coverage
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-0 p-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="border-b border-[#eef0f3] p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#111827]">
            <GitBranch className="size-4 text-[#4b5563]" strokeWidth={1.8} />
            Graph nodes
          </div>
          <ScrollArea className="mt-3 max-h-[280px]">
            <div className="space-y-2 pr-3">
              {nodes.length > 0 ? nodes.slice(0, 12).map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => pickExperienceId(node.id)}
                  className={cn(
                    "w-full border border-[#eef0f3] bg-[#fafafa] p-3 text-left transition hover:bg-white",
                    selectedExperienceId && nodeToExperienceIds.get(node.id)?.includes(selectedExperienceId)
                      ? "border-[#bfdbfe] bg-[#eff6ff]"
                      : "",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[12px] font-medium text-[#111827]">{compactGraphText(node.label)}</p>
                    <Badge variant="outline" className="rounded-[3px] border-[#e5e7eb] bg-white text-[10px] text-[#697386]">
                      {compactGraphText(node.kind)}
                    </Badge>
                  </div>
                  <p className="mt-1 break-all font-mono text-[11px] text-[#8a94a6]">{compactGraphText(node.id)}</p>
                </button>
              )) : (
                <Empty className="min-h-[180px] rounded-none border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-white text-[#697386] ring-1 ring-[#e5e7eb]">
                      <GitBranch className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle className="text-[13px] text-[#111827]">No experience graph nodes yet</EmptyTitle>
                    <EmptyDescription className="max-w-md text-[#8a94a6]">
                      Capture a real experience record so it can produce graph nodes and lineage.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#111827]">
            <Link2 className="size-4 text-[#4b5563]" strokeWidth={1.8} />
            Graph edges
          </div>
          <ScrollArea className="mt-3 max-h-[280px]">
            <div className="space-y-2 pr-3">
              {edges.length > 0 ? edges.slice(0, 12).map((edge, index) => (
                <button
                  key={`${edge.from}-${edge.to}-${edge.type}-${index}`}
                  type="button"
                  onClick={() => pickExperienceId(edge.from.startsWith("experience:") ? edge.from : edge.to)}
                  className={cn(
                    "w-full border border-[#eef0f3] bg-white p-3 text-left transition hover:bg-[#fafafa]",
                    selectedExperienceId &&
                      nodeToExperienceIds.get(edge.from.startsWith("experience:") ? edge.from : edge.to)?.includes(selectedExperienceId)
                      ? "border-[#bfdbfe] bg-[#eff6ff]"
                      : "",
                  )}
                >
                  <p className="text-[12px] font-medium text-[#111827]">{compactGraphText(edge.type)}</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#697386]">
                    {compactGraphText(edge.from)} → {compactGraphText(edge.to)}
                  </p>
                </button>
              )) : (
                <Empty className="min-h-[180px] rounded-none border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-white text-[#697386] ring-1 ring-[#e5e7eb]">
                      <Link2 className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle className="text-[13px] text-[#111827]">No experience graph edges yet</EmptyTitle>
                    <EmptyDescription className="max-w-md text-[#8a94a6]">
                      Edges appear when an experience links a lesson to outcomes, files, tests, or source memory.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function ExperienceInheritanceReadiness({
  readiness,
}: {
  readiness?: ExperienceOverview["inheritanceReadiness"];
}) {
  return (
    <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
      <CardHeader className="border-b border-[#eef0f3] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[13px] font-medium text-[#111827]">Future-Agent Inheritance Readiness</CardTitle>
            <CardDescription className="text-[12px] text-[#697386]">
              Backend proof gate for whether an experience can safely appear in the next MemoryIgnition brief.
            </CardDescription>
          </div>
          <Badge variant="outline" className="rounded-[3px] border-[#dfe3e8] bg-white text-[11px] text-[#697386]">
            {readiness?.version ?? "experience_inheritance_readiness.v1"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid border-b border-[#eef0f3] sm:grid-cols-4">
          {[
            ["Ready", readiness?.readyForNextBrief ?? 0],
            ["Needs review", readiness?.needsReviewForNextBrief ?? 0],
            ["Blocked", readiness?.blockedFromNextBrief ?? 0],
            ["Score", `${readiness?.score ?? 0}/100`],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-[#eef0f3] p-3 last:border-r-0 sm:border-b-0">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a94a6]">{label}</p>
              <p className="mt-2 text-[20px] font-semibold leading-none text-[#050505]">{value}</p>
            </div>
          ))}
        </div>
        {readiness?.records.length ? (
          <div className="divide-y divide-[#eef0f3]">
            {readiness.records.slice(0, 6).map((record) => (
              <div key={record.experienceId} className="grid gap-3 p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={record.status.replace(/_/g, " ")} />
                    <span className="text-[11px] text-[#697386]">{record.score}/100</span>
                    <span className={cn(
                      "text-[11px] font-medium",
                      record.readyForNextBrief ? "text-[#047857]" : "text-[#b45309]",
                    )}>
                      {record.readyForNextBrief ? "eligible for next brief" : "not ready for next brief"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-1 text-[12px] font-medium text-[#111827]">{record.task}</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-[#8a94a6]">{record.sourceRef}</p>
                  <p className="mt-2 text-[12px] text-[#697386]">{record.nextAction}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {record.checks.slice(0, 6).map((check) => (
                    <div key={check.id} className="border border-[#eef0f3] bg-[#fafafa] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-medium text-[#111827]">{check.label}</p>
                        <span className={cn("size-2 rounded-full", check.ok ? "bg-[#10b981]" : "bg-[#f59e0b]")} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#697386]">{check.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="min-h-[220px]">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white text-[#697386] ring-1 ring-[#e5e7eb]">
                <Sparkles className="size-4" />
              </EmptyMedia>
              <EmptyTitle className="text-[13px] text-[#111827]">No inheritance-ready experiences yet</EmptyTitle>
              <EmptyDescription className="max-w-md text-[#8a94a6]">
                Save an outcome with source proof, lesson, files or tests so future agents can inherit it.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {readiness?.nextAction ? (
          <div className="border-t border-[#eef0f3] bg-[#fafafa] px-4 py-3 text-[12px] text-[#697386]">
            Next: {readiness.nextAction}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReviewQueue({ records }: { records: ExperienceRecord[] }) {
  const queue = records.filter((record) => !record.status.toLowerCase().includes("reviewed"));

  return (
    <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
      <CardHeader className="border-b border-[#eef0f3] p-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-[13px] font-medium text-[#111827]">Experience Review Queue</CardTitle>
          <Badge variant="outline" className="rounded-[3px] border-[#dfe3e8] bg-white text-[11px] text-[#697386]">
            {queue.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {queue.length > 0 ? (
          <div className="divide-y divide-[#eef0f3]">
            {queue.map((record) => (
              <div key={record.id} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-4 px-4 py-3">
                <div>
                  <p className="line-clamp-1 text-[12px] font-medium text-[#111827]">{record.task}</p>
                  <p className="mt-1 text-[11px] text-[#697386]">{record.source}</p>
                </div>
                <StatusBadge value={record.status} />
              </div>
            ))}
          </div>
        ) : (
          <Empty className="min-h-[180px]">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white text-[#697386] ring-1 ring-[#e5e7eb]">
                <ListChecks className="size-4" />
              </EmptyMedia>
              <EmptyTitle className="text-[13px] text-[#111827]">No experiences waiting for review</EmptyTitle>
              <EmptyDescription className="text-[#8a94a6]">
                Captured work will wait here before it becomes a skill candidate.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function EvidenceLinks({ records }: { records: ExperienceRecord[] }) {
  const withEvidence = records.filter(
    (record) =>
      (record.evidence?.length ?? 0) > 0 ||
      (record.sourceRef?.length ?? 0) > 0 ||
      (record.futureAgentInstruction?.length ?? 0) > 0,
  );
  return (
    <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
      <CardHeader className="border-b border-[#eef0f3] p-4">
        <CardTitle className="text-[13px] font-medium text-[#111827]">Experience Proof Links</CardTitle>
        <CardDescription className="text-[12px] text-[#697386]">
          Source evidence and future-agent instructions from live experience records.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
        {withEvidence.length > 0 ? withEvidence.slice(0, 6).map((record) => (
          <div key={record.id} className="border border-[#eef0f3] bg-[#fafafa] p-4">
            <Link2 className="size-4 text-[#697386]" strokeWidth={1.8} />
            <h3 className="mt-3 line-clamp-1 text-[12px] font-medium text-[#111827]">{record.task}</h3>
            <p className="mt-1 break-all font-mono text-[11px] leading-4 text-[#697386]">
              {record.sourceRef ?? "source ref pending"}
            </p>
            <div className="mt-3 space-y-1 text-[11px] leading-4 text-[#4b5563]">
              {(record.evidence ?? []).slice(0, 3).map((item) => (
                <p key={item} className="break-all">{item}</p>
              ))}
              {record.futureAgentInstruction ? (
                <p className="pt-2 text-[#697386]">{compactText(record.futureAgentInstruction, "Instruction captured")}</p>
              ) : null}
            </div>
          </div>
        )) : (
          <Empty className="col-span-full min-h-[180px]">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white text-[#697386] ring-1 ring-[#e5e7eb]">
                <GitBranch className="size-4" />
              </EmptyMedia>
              <EmptyTitle className="text-[13px] text-[#111827]">No proof links yet</EmptyTitle>
              <EmptyDescription className="text-[#8a94a6]">
                Proof links appear only after real outcomes create source-backed experience records.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

export function MemoryEvolutionSection({
  workspaceName = "MemoryOS",
  memories,
  requestEvents,
  timelineEvents = [],
  openLoops,
  timelineCount,
  experienceOverview = null,
  isLoading = false,
  errorMessage = null,
}: MemoryEvolutionSectionProps) {
  const liveRecords = recordsFromOverview(experienceOverview);
  const records = liveRecords.length > 0 ? liveRecords : buildExperienceRecords(memories);
  const reviewedCount = experienceOverview?.reviewedCount ?? records.filter((record) => record.status.toLowerCase().includes("reviewed")).length;
  const candidateCount = experienceOverview?.skillCandidateCount ?? openLoops.length;
  const lessonsCaptured = experienceOverview?.totalExperienceRecords ?? records.filter((record) => record.content.toLowerCase().includes("lesson")).length;
  const signalCount = requestEvents.length + timelineEvents.length + timelineCount;
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(records[0]?.id ?? null);
  const selectedRecord = records.find((record) => record.id === selectedExperienceId) ?? records[0];

  const metrics = [
    {
      label: "Experience Records",
      value: String(records.length),
      detail: errorMessage ?? "Structured records created from real work.",
      icon: FileText,
      progress: Math.min(100, records.length * 12),
    },
    {
      label: "Reviewed Experiences",
      value: String(reviewedCount),
      detail: "Human-reviewed experience records.",
      icon: ListChecks,
      progress: Math.min(100, reviewedCount * 16),
    },
    {
      label: "Candidate Skills",
      value: String(candidateCount),
      detail: "Open lessons waiting to become reusable skills.",
      icon: Sparkles,
      progress: Math.min(100, candidateCount * 20),
    },
    {
      label: "Lessons Captured",
      value: String(lessonsCaptured),
      detail: signalCount > 0 ? `${signalCount} live signals available for future capture.` : "No lesson records yet.",
      icon: BookOpen,
      progress: Math.min(100, lessonsCaptured * 16),
    },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-white text-[#111827]">
      <FilterRail requestCount={requestEvents.length} timelineCount={timelineCount} experienceCount={records.length} />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 pb-8 pt-4 sm:px-6">
          <header className="border-b border-[#e5e7eb] pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-2 text-[11px] text-[#697386]">{workspaceName} / Product</p>
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.035em] text-[#050505]">
                  Experience
                </h1>
                <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[#697386]">
                  MemoryOS captures real work as structured experience records that future agents can learn from.
                </p>
              </div>
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} loading={isLoading} />
            ))}
          </section>

          <ExperienceInheritanceReadiness readiness={experienceOverview?.inheritanceReadiness} />

          <OutcomeLearningTimeline timeline={experienceOverview?.outcomeLearningTimeline ?? []} />

          <ExperienceGraphPanel
            overview={experienceOverview}
            selectedExperienceId={selectedExperienceId}
            onSelectExperience={setSelectedExperienceId}
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0">
              <ExperienceRecordsTable records={records} loading={isLoading} />
            </div>
            <div>
              <ExperienceDetails record={selectedRecord} />
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <ReviewQueue records={records} />
            <EvidenceLinks records={records} />
          </section>
        </div>
      </main>
    </div>
  );
}

