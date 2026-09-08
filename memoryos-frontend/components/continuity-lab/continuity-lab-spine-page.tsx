"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  Code2,
  FileText,
  GitBranch,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { readAskStorage } from "@/lib/continuity-lab/ask-storage";
import { projectIdForLab } from "@/lib/continuity-lab/resume-brief";
import { consoleApiFetch } from "@/lib/console-api";
import { cn } from "@/lib/utils";

type SpinePhase = {
  id: string;
  title: string;
  status: "ready" | "partial" | "blocked";
  ready: boolean;
  metrics: Record<string, number | string | boolean | null>;
  proof: string[];
  blockers: string[];
};

type InheritanceSpineOverview = {
  generatedAt: string;
  localProductionReady: boolean;
  readyPhaseCount: number;
  totalPhaseCount: number;
  blockers: string[];
  phases: SpinePhase[];
  proofChain?: {
    lineage?: string;
  };
  memoryIgnition?: {
    relevantMemoryCount: number;
    executableSkillCount: number;
    traceProofCount: number;
    approvalRequired: boolean;
    recommendedFirstAction?: string | null;
  };
  accessLayer?: {
    activeApiKeyCount?: number;
    sdkPackageExists?: boolean;
    mcpPackageExists?: boolean;
    mcpBuildExists?: boolean;
    compatibilityReady?: boolean;
    compatibilityStatus?: "ready" | "partial" | "blocked";
    standardPackageVersion?: string | null;
    apiStandardPackageRequestCount?: number;
    mcpStandardPackageRequestCount?: number;
    standardPackageRequestCount?: number;
    packageMemoryCount?: number;
    packageSkillCount?: number;
    packageTraceProofCount?: number;
  };
  agentAccessCompatibility?: {
    version: string;
    ready: boolean;
    status: "ready" | "partial" | "blocked";
    passed: number;
    total: number;
    summary: {
      standardPackageVersion: string | null;
      apiStandardPackageRequestCount: number;
      mcpStandardPackageRequestCount: number;
      standardPackageRequestCount: number;
      packageMemoryCount: number;
      packageSkillCount: number;
      packageTraceProofCount: number;
    };
  };
};

type ExperienceOverview = {
  project: string | null;
  generatedAt: string;
  totalExperienceRecords: number;
  reviewedCount: number;
  skillCandidateCount: number;
  highRiskCount: number;
  traceProofCoverage: number;
  records: Array<{
    id: string;
    task: string;
    outcome: string;
    lesson: string;
    futureAgentInstruction: string;
    sourceRef: string;
    status: string;
    updatedAt: string;
  }>;
};

type SkillGraphOverview = {
  project: string | null;
  generatedAt: string;
  totalCandidates: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  outcomeCount?: number;
  successfulOutcomeCount?: number;
  failedOutcomeCount?: number;
  averageSuccessRate?: number | null;
  traceProofCoverage: number;
  approvedSkills: Array<{
    id: string;
    name: string;
    trigger: string;
    riskLevel: string;
    status: "approved";
    evidence: string[];
    steps?: string[];
    requiredTests: string[];
    supportedAgents: string[];
    sourceExperienceId?: string;
    inheritanceRules?: string[];
    successRate?: number | null;
    outcomeCount?: number;
    failureCount?: number;
    updatedAt: string;
  }>;
};

type FetchState = {
  spine: InheritanceSpineOverview | null;
  experience: ExperienceOverview | null;
  skills: SkillGraphOverview | null;
};

type MemoryStreamRequestEvent = {
  path?: string;
  method?: string;
  routeType?: string;
  status?: string;
  createdAt?: string;
};

type MemoryStreamEvent = {
  kind?: string;
  status?: string;
  payload?: {
    request?: MemoryStreamRequestEvent;
    [key: string]: unknown;
  };
};

const REFRESHABLE_MEMORY_EVENT_KINDS = new Set([
  "request_logged",
  "memory_processed",
  "timeline_updated",
  "handoff_generated",
  "resume_generated",
  "governance_review_queued",
  "api_keys_changed",
  "service_users_changed",
]);

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function phaseStatusClass(status: SpinePhase["status"]) {
  if (status === "ready") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "partial") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-rose-500/30 bg-rose-500/10 text-rose-200";
}

function scoreClass(ok: boolean) {
  return ok ? "text-emerald-300" : "text-[#F0EFE2]/45";
}

function describeMemoryStreamEvent(payload: MemoryStreamEvent): string {
  if (payload.kind === "request_logged") {
    const request = payload.payload?.request;
    if (request) {
      const method = request.method ? `${request.method} ` : "";
      const route = request.routeType ?? request.path ?? "memory request";
      return `${method}${route}`.trim();
    }
  }

  if (payload.kind === "memory_processed") return "Memory processed";
  if (payload.kind === "timeline_updated") return "Timeline updated";
  if (payload.kind === "handoff_generated") return "Handoff generated";
  if (payload.kind === "resume_generated") return "Resume generated";
  if (payload.kind === "governance_review_queued") return "Governance review queued";
  if (payload.kind === "api_keys_changed") return "API keys changed";
  if (payload.kind === "service_users_changed") return "Service users changed";

  return payload.kind ?? "Memory event";
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03] py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] text-[#F0EFE2]/45">{label}</p>
          <span className="grid size-7 place-items-center rounded-[4px] border border-white/10 bg-white/[0.04] text-[#F0EFE2]/65">
            <Icon className="size-3.5" strokeWidth={1.8} />
          </span>
        </div>
        {loading ? (
          <Loader2 className="mt-7 size-5 animate-spin text-[#F0EFE2]/35" />
        ) : (
          <p className="mt-6 text-[28px] font-semibold leading-none tracking-[-0.035em] text-[#F0EFE2]">
            {value}
          </p>
        )}
        <p className="mt-3 min-h-8 text-[12px] leading-4 text-[#F0EFE2]/45">{detail}</p>
      </CardContent>
    </Card>
  );
}

function LoopChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-[#F0EFE2]/70">
      {children}
    </span>
  );
}

function PhaseCard({ phase }: { phase: SpinePhase }) {
  const hiddenMetrics = Object.entries(phase.metrics).slice(0, 4);
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F0EFE2]/35">{phase.id}</p>
          <h3 className="mt-1 text-[14px] font-semibold text-[#F0EFE2]">{phase.title}</h3>
        </div>
        <Badge variant="outline" className={cn("rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.14em]", phaseStatusClass(phase.status))}>
          {phase.status}
        </Badge>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-[#F0EFE2]/55">
        {phase.ready ? "Ready to use." : phase.status === "partial" ? "Partially shipped." : "Still blocked."}
      </p>
      {hiddenMetrics.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {hiddenMetrics.map(([key, value]) => (
            <div key={key} className="rounded-md border border-white/8 bg-black/20 p-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#F0EFE2]/35">{key.replace(/_/g, " ")}</p>
              <p className="mt-1 text-[12px] font-medium text-[#F0EFE2]">{String(value ?? "-")}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {phase.proof.slice(0, 3).map((item) => (
          <LoopChip key={item}>{item}</LoopChip>
        ))}
      </div>
      {phase.blockers.length > 0 ? (
        <div className="mt-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-[12px] text-rose-100/90">
          <p className="font-medium">Blockers</p>
          <ul className="mt-1 space-y-1">
            {phase.blockers.slice(0, 2).map((blocker) => (
              <li key={blocker} className="leading-5">
                {blocker}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function RecentList({
  title,
  description,
  emptyLabel,
  children,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03] py-0 shadow-none">
      <CardHeader className="border-b border-white/10 p-4">
        <CardTitle className="text-[13px] font-medium text-[#F0EFE2]">{title}</CardTitle>
        <CardDescription className="text-[12px] text-[#F0EFE2]/45">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {children ?? (
          <Empty className="min-h-[220px] border border-white/8 bg-black/15">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-white/[0.03] text-[#F0EFE2]/60 ring-1 ring-white/10">
                <FileText className="size-4" />
              </EmptyMedia>
              <EmptyTitle className="text-[13px] text-[#F0EFE2]">{emptyLabel}</EmptyTitle>
              <EmptyDescription className="max-w-md text-[#F0EFE2]/45">
                Connect GitHub and capture real work to populate this view.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

export function ContinuityLabSpinePage() {
  const { connector, openCompanyModelModal, canStartSession } = useContinuityLab();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedSkillsCount, setGeneratedSkillsCount] = useState<number | null>(null);
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [streamOnline, setStreamOnline] = useState(false);
  const [streamLastEvent, setStreamLastEvent] = useState<{ kind: string; detail: string; at: string } | null>(null);
  const [data, setData] = useState<FetchState>({
    spine: null,
    experience: null,
    skills: null,
  });
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const queryProject = query.get("project")?.trim() || "";
    const queryRepo = query.get("repo")?.trim() || "";
    const stored = readAskStorage();
    const repo =
      queryRepo ||
      stored.repos[0] ||
      connector.payload.github.repos[0]?.fullName ||
      null;

    setSelectedRepo(repo);
    setProjectId(queryProject || (repo ? projectIdForLab({ repoFullName: repo }) : null));
  }, [connector.payload.github.repos]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGenerateError(null);

    const task = encodeURIComponent("Prepare MemoryOS inheritance package for the current workspace.");
    const base = projectId ? `?project=${encodeURIComponent(projectId)}&task=${task}&agentId=codex` : `?task=${task}&agentId=codex`;
    const experienceUrl = projectId ? `/api/memory/company-brain/experience/overview?project=${encodeURIComponent(projectId)}` : "/api/memory/company-brain/experience/overview";
    const skillsUrl = projectId ? `/api/memory/company-brain/skills/overview?project=${encodeURIComponent(projectId)}` : "/api/memory/company-brain/skills/overview";

    void (async () => {
      try {
        const [spineRes, experienceRes, skillsRes] = await Promise.all([
          consoleApiFetch(`/api/memory/company-brain/inheritance-spine${base}`),
          consoleApiFetch(experienceUrl),
          consoleApiFetch(skillsUrl),
        ]);

        const [spinePayload, experiencePayload, skillsPayload] = await Promise.all([
          spineRes.json().catch(() => null),
          experienceRes.json().catch(() => null),
          skillsRes.json().catch(() => null),
        ]);

        if (cancelled) return;

        const nextSpine = unwrapData<InheritanceSpineOverview>(spinePayload);
        const nextExperience = unwrapData<ExperienceOverview>(experiencePayload);
        const nextSkills = unwrapData<SkillGraphOverview>(skillsPayload);

        setData({
          spine: nextSpine,
          experience: nextExperience,
          skills: nextSkills,
        });
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load the continuity spine.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, refreshIndex]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    let disposed = false;
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let reconnectAttempts = 0;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current !== null) return;
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        setRefreshIndex((value) => value + 1);
      }, 350);
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null) return;
      const delay = Math.min(30_000, 1_500 * Math.max(1, reconnectAttempts + 1));
      reconnectAttempts += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connectStream();
      }, delay);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as MemoryStreamEvent;
        if (!payload || typeof payload !== "object") return;
        if (payload.status === "offline") return;

        const kind = typeof payload.kind === "string" && payload.kind.length > 0 ? payload.kind : "memory_event";
        const detail = describeMemoryStreamEvent(payload);

        setStreamLastEvent({
          kind,
          detail,
          at: new Date().toISOString(),
        });

        if (REFRESHABLE_MEMORY_EVENT_KINDS.has(kind)) {
          scheduleRefresh();
        }
      } catch {
        // Ignore malformed SSE payloads and wait for the next event.
      }
    };

    function connectStream() {
      if (disposed) return;
      try {
        source?.close();
        source = new EventSource("/api/memory/events");
        source.onopen = () => {
          reconnectAttempts = 0;
          setStreamOnline(true);
        };
        source.onmessage = handleMessage;
        source.onerror = () => {
          setStreamOnline(false);
          source?.close();
          source = null;
          scheduleReconnect();
        };
      } catch {
        setStreamOnline(false);
        scheduleReconnect();
      }
    }

    connectStream();

    return () => {
      disposed = true;
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      source?.close();
    };
  }, []);

  async function handleGenerateSkills() {
    if (!projectId) {
      setGenerateError("Select a repository or project first.");
      return;
    }

    setGeneratingSkills(true);
    setGenerateError(null);
    try {
      const response = await consoleApiFetch("/api/memory/company-brain/skills/candidates/generate", {
        method: "POST",
        body: JSON.stringify({ project: projectId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? payload?.message ?? "Could not generate skills.");
      }
      setGeneratedSkillsCount(typeof payload?.generatedCount === "number" ? payload.generatedCount : null);
      setRefreshIndex((value) => value + 1);
    } catch (caught) {
      setGenerateError(caught instanceof Error ? caught.message : "Could not generate skills.");
    } finally {
      setGeneratingSkills(false);
    }
  }

  const spine = data.spine;
  const experience = data.experience;
  const skills = data.skills;
  const phases = spine?.phases ?? [];
  const recentExperience = experience?.records?.[0] ?? null;
  const recentSkill = skills?.approvedSkills?.[0] ?? null;

  const stats = useMemo(
    () => [
      {
        label: "Phase readiness",
        value: spine ? `${spine.readyPhaseCount}/${spine.totalPhaseCount}` : "—",
        detail: spine?.localProductionReady
          ? "The local product loop is ready to use."
          : "The product loop still has blockers.",
        icon: BadgeCheck,
      },
      {
        label: "Experience records",
        value: experience?.totalExperienceRecords?.toString() ?? "—",
        detail: "Real work outcomes captured as structured experiences.",
        icon: FileText,
      },
      {
        label: "Approved skills",
        value: skills?.approvedCount?.toString() ?? "—",
        detail: "Reusable instructions ready for future inheritance.",
        icon: Code2,
      },
      {
        label: "MemoryIgnition",
        value: spine?.memoryIgnition?.executableSkillCount?.toString() ?? "—",
        detail: spine?.memoryIgnition?.recommendedFirstAction ?? "No recommendation returned yet.",
        icon: Sparkles,
      },
      {
        label: "Trace proof",
        value: spine?.memoryIgnition?.traceProofCount?.toString() ?? "—",
        detail: "Source and outcome proof that future agents can inherit.",
        icon: ShieldCheck,
      },
      {
        label: "Live stream",
        value: streamOnline ? "Live" : "Offline",
        detail: streamLastEvent
          ? `${streamLastEvent.detail} at ${formatDate(streamLastEvent.at)}`
          : "Waiting for the canonical memory event stream.",
        icon: GitBranch,
      },
    ],
    [experience?.totalExperienceRecords, skills?.approvedCount, spine, streamLastEvent, streamOnline],
  );

  return (
    <div className="min-h-full bg-[#0b0b0b] text-[#F0EFE2]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 pb-10 pt-5 sm:px-6">
        <header className="rounded-md border border-white/10 bg-white/[0.03] p-5 shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F0EFE2]/35">
                Continuity Lab / Inheritance Spine
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">
                Build the loop that compounds company memory.
              </h1>
              <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#F0EFE2]/55">
                This page connects Company Brain, Experience, Skills, and MemoryIgnition into one live view so we can ship the master plan in the order the product actually works.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/[0.04] text-[#F0EFE2] hover:bg-white/[0.08]"
                onClick={() => {
                  if (!canStartSession) {
                    openCompanyModelModal();
                    return;
                  }
                  window.location.href = "/continuity-lab";
                }}
              >
                Open Continuity Lab
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/[0.04] text-[#F0EFE2] hover:bg-white/[0.08]"
                onClick={() => setRefreshIndex((value) => value + 1)}
              >
                Refresh live data
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#F0EFE2]/45">
            <LoopChip>Repo: {selectedRepo ?? "not selected"}</LoopChip>
            <LoopChip>Project: {projectId ?? "workspace-wide"}</LoopChip>
            <LoopChip>Generated: {spine ? formatDate(spine.generatedAt) : "waiting"}</LoopChip>
            <LoopChip>
              Access: {spine?.agentAccessCompatibility?.status ?? "unknown"}
            </LoopChip>
            <LoopChip>Stream: {streamOnline ? "live" : "reconnecting"}</LoopChip>
            <LoopChip>
              Event: {streamLastEvent?.kind ?? "none"}
            </LoopChip>
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              detail={stat.detail}
              icon={stat.icon}
              loading={loading}
            />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
          <Card className="border-white/10 bg-white/[0.03] py-0 shadow-none">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-[13px] font-medium text-[#F0EFE2]">Product phases</CardTitle>
              <CardDescription className="text-[12px] text-[#F0EFE2]/45">
                The master plan is only real where the phase readiness is real.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-[#F0EFE2]/45">
                  <Loader2 className="size-4 animate-spin" />
                  Loading phase readiness...
                </div>
              ) : phases.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {phases.map((phase) => (
                    <PhaseCard key={phase.id} phase={phase} />
                  ))}
                </div>
              ) : (
                <Empty className="min-h-[240px] border border-white/8 bg-black/15">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-white/[0.03] text-[#F0EFE2]/60 ring-1 ring-white/10">
                      <BrainCircuit className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle className="text-[13px] text-[#F0EFE2]">No spine returned yet</EmptyTitle>
                    <EmptyDescription className="max-w-md text-[#F0EFE2]/45">
                      Connect a repo or select a project so the inheritance spine can calculate live readiness.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.03] py-0 shadow-none">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-[13px] font-medium text-[#F0EFE2]">Live loop status</CardTitle>
              <CardDescription className="text-[12px] text-[#F0EFE2]/45">
                What the product can inherit, execute, and prove right now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="rounded-md border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#F0EFE2]/35">Proof chain</p>
                    <p className="mt-1 text-[13px] font-medium text-[#F0EFE2]">
                      {spine?.proofChain?.lineage ?? "Source -> Memory -> Experience -> Skill -> Outcome"}
                    </p>
                  </div>
                  <GitBranch className="size-4 text-[#F0EFE2]/50" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <LoopChip>MemoryIgnition {spine?.memoryIgnition ? "live" : "pending"}</LoopChip>
                  <LoopChip>Access {spine?.accessLayer?.compatibilityStatus ?? "unknown"}</LoopChip>
                  <LoopChip>Agent API {spine?.agentAccessCompatibility?.status ?? "unknown"}</LoopChip>
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#F0EFE2]/35">MemoryIgnition</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                  <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[#F0EFE2]/40">Relevant memories</p>
                    <p className="mt-1 text-lg font-semibold text-[#F0EFE2]">
                      {spine?.memoryIgnition?.relevantMemoryCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[#F0EFE2]/40">Executable skills</p>
                    <p className="mt-1 text-lg font-semibold text-[#F0EFE2]">
                      {spine?.memoryIgnition?.executableSkillCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[#F0EFE2]/40">Trace proofs</p>
                    <p className="mt-1 text-lg font-semibold text-[#F0EFE2]">
                      {spine?.memoryIgnition?.traceProofCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[#F0EFE2]/40">Approval required</p>
                    <p className="mt-1 text-lg font-semibold text-[#F0EFE2]">
                      {spine?.memoryIgnition?.approvalRequired ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                {spine?.memoryIgnition?.recommendedFirstAction ? (
                  <p className="mt-3 text-[12px] leading-5 text-[#F0EFE2]/55">
                    Next: {spine.memoryIgnition.recommendedFirstAction}
                  </p>
                ) : null}
              </div>

              <div className="rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#F0EFE2]/35">Access layer</p>
                <div className="mt-3 grid gap-2 text-[12px]">
                  {[
                    ["API keys", spine?.accessLayer?.activeApiKeyCount ?? 0],
                    ["SDK package", spine?.accessLayer?.sdkPackageExists ?? false],
                    ["MCP package", spine?.accessLayer?.mcpPackageExists ?? false],
                    ["MCP build", spine?.accessLayer?.mcpBuildExists ?? false],
                    ["Compatibility", spine?.accessLayer?.compatibilityStatus ?? "unknown"],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
                      <span className="text-[#F0EFE2]/45">{String(label)}</span>
                      <span className="font-medium text-[#F0EFE2]">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="border-white/10 bg-white/[0.03] py-0 shadow-none">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-[13px] font-medium text-[#F0EFE2]">Company Brain</CardTitle>
              <CardDescription className="text-[12px] text-[#F0EFE2]/45">
                Structured memory, proof quality, and learning signals from the current workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Experience records", experience?.totalExperienceRecords ?? 0, "Outcome-backed work captured as experience."],
                  ["Reviewed", experience?.reviewedCount ?? 0, "Human-reviewed records ready to reuse."],
                  ["Skill candidates", experience?.skillCandidateCount ?? 0, "Lessons waiting to become skills."],
                  ["High risk", experience?.highRiskCount ?? 0, "Work that needs extra caution before inheritance."],
                  ["Approved skills", skills?.approvedCount ?? 0, "Executable skills already approved."],
                  ["Trace coverage", `${skills?.traceProofCoverage ?? 0}%`, "How much of the skill graph has proof."],
                ].map(([label, value, detail]) => (
                  <div key={String(label)} className="rounded-md border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#F0EFE2]/35">{String(label)}</p>
                    <p className="mt-2 text-[24px] font-semibold tracking-[-0.035em] text-[#F0EFE2]">{String(value)}</p>
                    <p className="mt-2 text-[12px] leading-5 text-[#F0EFE2]/50">{String(detail)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-4 text-[12px] text-[#F0EFE2]/55">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[#F0EFE2]/80">Latest experience</p>
                    <p className="mt-1 text-[#F0EFE2]">{recentExperience?.task ?? "No experience records yet"}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-[0.14em] text-[#F0EFE2]/60">
                    {recentExperience?.status ?? "empty"}
                  </Badge>
                </div>
                {recentExperience ? (
                  <p className="mt-2 text-[#F0EFE2]/45">{recentExperience.outcome}</p>
                ) : null}
              </div>
              <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-4 text-[12px] text-[#F0EFE2]/55">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[#F0EFE2]/80">Latest approved skill</p>
                    <p className="mt-1 text-[#F0EFE2]">{recentSkill?.name ?? "No approved skills yet"}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-[10px] uppercase tracking-[0.14em] text-emerald-100">
                    {recentSkill ? "approved" : "waiting"}
                  </Badge>
                </div>
                {recentSkill ? (
                  <p className="mt-2 text-[#F0EFE2]/45">{recentSkill.trigger}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.03] py-0 shadow-none">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-[13px] font-medium text-[#F0EFE2]">Skill compiler</CardTitle>
              <CardDescription className="text-[12px] text-[#F0EFE2]/45">
                Turn new experience records into reviewable skill candidates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#F0EFE2]/35">Generate skill candidates</p>
                <p className="mt-2 text-[13px] leading-5 text-[#F0EFE2]/60">
                  Runs the live company-brain compiler against the selected project and refreshes the skills overview.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleGenerateSkills()}
                    disabled={generatingSkills || !projectId}
                    className="bg-[#4338ca] text-[#F0EFE2] hover:bg-[#4f46e5]"
                  >
                    {generatingSkills ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate skills
                        <Sparkles className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/10 bg-white/[0.04] text-[#F0EFE2] hover:bg-white/[0.08]"
                    onClick={() => setRefreshIndex((value) => value + 1)}
                  >
                    Refresh overview
                  </Button>
                </div>
                {generatedSkillsCount !== null ? (
                  <p className="mt-3 text-[12px] text-emerald-200">
                    Generated {generatedSkillsCount} new skill candidate{generatedSkillsCount === 1 ? "" : "s"}.
                  </p>
                ) : null}
                {generateError ? (
                  <p className="mt-3 text-[12px] text-rose-200">{generateError}</p>
                ) : null}
              </div>
              <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-[12px] text-[#F0EFE2]/55">
                <p className="text-[#F0EFE2]/80">What this does</p>
                <ul className="mt-2 space-y-2 leading-5">
                  <li>1. Scans experience records for reusable patterns.</li>
                  <li>2. Emits skill candidates for human review.</li>
                  <li>3. Refreshes the inheritance view after generation.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <RecentList
            title="Recent experience records"
            description="Outcome-backed work that can become future-agent inheritance."
            emptyLabel="No experience records yet"
          >
            {experience?.records?.length ? (
              <ScrollArea className="max-h-[360px] pr-3">
                <div className="space-y-3">
                  {experience.records.slice(0, 6).map((record) => (
                    <div key={record.id} className="rounded-md border border-white/8 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#F0EFE2]">{record.task}</p>
                          <p className="mt-1 text-[11px] text-[#F0EFE2]/40">{record.sourceRef}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-[0.14em] text-[#F0EFE2]/60">
                          {record.status}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-[12px] sm:grid-cols-2">
                        <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                          <p className="text-[#F0EFE2]/40">Outcome</p>
                          <p className="mt-1 text-[#F0EFE2]">{record.outcome}</p>
                        </div>
                        <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                          <p className="text-[#F0EFE2]/40">Lesson</p>
                          <p className="mt-1 text-[#F0EFE2]">{record.lesson}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-[#F0EFE2]/45">
                        Updated {formatDate(record.updatedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : null}
          </RecentList>

          <RecentList
            title="Approved skills"
            description="Reusable instructions ready to inject before the next agent acts."
            emptyLabel="No approved skills yet"
          >
            {skills?.approvedSkills?.length ? (
              <ScrollArea className="max-h-[360px] pr-3">
                <div className="space-y-3">
                  {skills.approvedSkills.slice(0, 6).map((skill) => (
                    <div key={skill.id} className="rounded-md border border-white/8 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#F0EFE2]">{skill.name}</p>
                          <p className="mt-1 text-[11px] text-[#F0EFE2]/40">{skill.trigger}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-[10px] uppercase tracking-[0.14em] text-emerald-100">
                          approved
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-[12px] sm:grid-cols-2">
                        <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                          <p className="text-[#F0EFE2]/40">Success rate</p>
                          <p className="mt-1 text-[#F0EFE2]">
                            {skill.successRate == null ? "Awaiting outcomes" : `${skill.successRate}%`}
                          </p>
                        </div>
                        <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                          <p className="text-[#F0EFE2]/40">Source experience</p>
                          <p className="mt-1 truncate text-[#F0EFE2]">{skill.sourceExperienceId ?? "not linked"}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(skill.requiredTests ?? []).slice(0, 2).map((test) => (
                          <LoopChip key={test}>{test}</LoopChip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : null}
          </RecentList>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="border-white/10 bg-white/[0.03] py-0 shadow-none">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-[13px] font-medium text-[#F0EFE2]">Working order</CardTitle>
              <CardDescription className="text-[12px] text-[#F0EFE2]/45">
                The shortest build path from company knowledge to inherited agent work.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid gap-3 lg:grid-cols-4">
                {[
                  {
                    title: "Company Brain",
                    detail: "Structured memory becomes the source of truth.",
                    icon: BrainCircuit,
                    ok: (experience?.totalExperienceRecords ?? 0) > 0,
                  },
                  {
                    title: "Experience",
                    detail: "Real outcomes become reusable lessons.",
                    icon: FileText,
                    ok: (experience?.reviewedCount ?? 0) > 0,
                  },
                  {
                    title: "Skills",
                    detail: "Approved patterns become executable instructions.",
                    icon: Code2,
                    ok: (skills?.approvedCount ?? 0) > 0,
                  },
                  {
                    title: "Inheritance",
                    detail: "MemoryIgnition injects the right context before action.",
                    icon: Zap,
                    ok: Boolean(spine?.memoryIgnition?.executableSkillCount),
                  },
                ].map((step, index, items) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="rounded-md border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className={cn("grid size-8 place-items-center rounded-md border", step.ok ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-[#F0EFE2]/55")}>
                          <Icon className="size-4" strokeWidth={1.8} />
                        </span>
                        <span className={cn("text-[10px] uppercase tracking-[0.14em]", scoreClass(step.ok))}>
                          {step.ok ? "live" : "pending"}
                        </span>
                      </div>
                      <p className="mt-4 text-[13px] font-medium text-[#F0EFE2]">{step.title}</p>
                      <p className="mt-1 text-[12px] leading-5 text-[#F0EFE2]/50">{step.detail}</p>
                      {index < items.length - 1 ? (
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#F0EFE2]/30">
                          <ArrowRight className="size-3.5" />
                          feeds next stage
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.03] py-0 shadow-none">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-[13px] font-medium text-[#F0EFE2]">What to do next</CardTitle>
              <CardDescription className="text-[12px] text-[#F0EFE2]/45">
                Follow the live product loop instead of broadening scope.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#F0EFE2]/35">Recommended next action</p>
                <p className="mt-2 text-[13px] leading-5 text-[#F0EFE2]">
                  {spine?.memoryIgnition?.recommendedFirstAction ?? "Generate a live MemoryIgnition brief for the current workspace."}
                </p>
              </div>
              <div className="grid gap-2">
                {[
                  {
                    label: "Open MemoryIgnition",
                    href: "/mission-control?view=memory-ignition",
                    note: "Inspect the live before/after inheritance package.",
                  },
                  {
                    label: "Review Company Brain",
                    href: "/mission-control?view=company-brain",
                    note: "Check the structured memory graph behind the loop.",
                  },
                  {
                    label: "Inspect Skills & Inheritance",
                    href: "/mission-control?view=skills",
                    note: "Review approved skills before a future agent inherits them.",
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-md border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium text-[#F0EFE2]">{item.label}</p>
                        <p className="mt-1 text-[12px] leading-5 text-[#F0EFE2]/45">{item.note}</p>
                      </div>
                      <ArrowRight className="size-4 text-[#F0EFE2]/35" />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-4 text-[12px] text-[#F0EFE2]/55">
                <div className="flex items-center gap-2 text-[#F0EFE2]/80">
                  <CheckCircle2 className="size-4 text-emerald-300" />
                  What this page proves
                </div>
                <ul className="mt-3 space-y-2">
                  <li>Memory feeds experience.</li>
                  <li>Experience compiles into skills.</li>
                  <li>Skills become inherited agent behavior.</li>
                  <li>The product can show the proof chain instead of a static roadmap.</li>
                </ul>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-4 text-[12px] text-[#F0EFE2]/55">
                <p className="text-[#F0EFE2]/80">Current status</p>
                <p className="mt-2 leading-5">
                  {spine?.localProductionReady
                    ? "The live loop is ready to use."
                    : "The live loop is partially ready and still has blockers to clear."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <LoopChip>Phase {spine?.readyPhaseCount ?? 0}/{spine?.totalPhaseCount ?? 0}</LoopChip>
                  <LoopChip>{spine?.agentAccessCompatibility?.status ?? "unknown"} agent access</LoopChip>
                  <LoopChip>{spine?.accessLayer?.compatibilityStatus ?? "unknown"} package access</LoopChip>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
