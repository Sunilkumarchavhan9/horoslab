    "use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Play,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Button,
  ConsoleGrid,
  ConsolePage,
  ConsolePageHeader,
  ConsoleSectionCard,
  ConsoleStatCard,
  ConsoleStatGrid,
  ConsoleStatusBadge,
  ConsoleSurface,
} from "@/components/horos/console-ui";
import {
  createMasterplanEvaluationRun,
  createMasterplanWorkspace,
  getMasterplanEvaluationResults,
  getMasterplanEvaluationSummary,
  listMasterplanEvaluationRuns,
  listMasterplanWorkspaces,
  type MasterplanEvaluationReplaySummary,
  type MasterplanEvaluationResult,
  type MasterplanEvaluationRun,
} from "@/lib/masterplan-api";
import { cn } from "@/lib/utils";

type EvaluationLabSectionProps = {
  workspaceName?: string;
  memoryCount?: number;
  requestCount?: number;
  timelineCount?: number;
  onOpenAgentRuns?: () => void;
  onOpenMemoryIgnition?: () => void;
};

const LIVE_EVENTS = [
  "evaluation.replay_created",
  "agent_run.updated",
  "outcome.captured",
  "future_instruction.created",
  "mistake_rule.created",
  "skill_candidate.created",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function shortId(value?: string | null) {
  if (!value) return "none";
  return value.length > 12 ? `${value.slice(0, 12)}...` : value;
}

function formatDate(value?: string | null) {
  if (!value) return "not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function boolLabel(value: boolean) {
  return value ? "Yes" : "No";
}

function latestResultFor(
  latest: { evaluationRun: MasterplanEvaluationRun; results: MasterplanEvaluationResult[] } | undefined,
  summary: MasterplanEvaluationReplaySummary | undefined,
) {
  return latest?.results[0] ?? summary?.latestResult ?? null;
}

export function EvaluationLabSection({
  workspaceName = "MemoryOS Workspace",
  memoryCount = 0,
  requestCount = 0,
  timelineCount = 0,
  onOpenAgentRuns,
  onOpenMemoryIgnition,
}: EvaluationLabSectionProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const workspaces = useSWR("masterplan-workspaces", listMasterplanWorkspaces);
  const summary = useSWR("masterplan-evaluation-summary", () => getMasterplanEvaluationSummary());
  const evaluations = useSWR("masterplan-evaluations", () => listMasterplanEvaluationRuns());
  const latestEvaluationId = summary.data?.latestRun?.id ?? evaluations.data?.[0]?.id ?? null;
  const activeEvaluationId = selectedEvaluationId ?? latestEvaluationId;
  const latest = useSWR(
    activeEvaluationId ? ["masterplan-evaluation-results", activeEvaluationId] : null,
    () => getMasterplanEvaluationResults(activeEvaluationId ?? ""),
  );
  const result = latestResultFor(latest.data, summary.data);
  const run = latest.data?.evaluationRun ?? summary.data?.latestRun ?? evaluations.data?.[0] ?? null;
  const metrics = summary.data?.metrics;
  const proof = summary.data?.proof;
  const runMetrics = asRecord(run?.metrics);
  const baseline = asRecord(runMetrics.baseline);
  const inherited = asRecord(runMetrics.inherited);
  const baselineFailed = baseline.mistakeRepeated === true || baseline.success === false;
  const inheritedSucceeded = inherited.mistakeRepeated === false && inherited.success !== false && Boolean(run);
  const mistakeRepeatRateDropped = (metrics?.mistakeRepeatRateAfter ?? 1) < (metrics?.mistakeRepeatRateBefore ?? 0);
  const outcomeProofExists = Boolean(proof?.baselineOutcomeId && proof.inheritedOutcomeId);
  const testsRemembered = (metrics?.testsRememberedScore ?? result?.testsRememberedScore ?? 0) > 0;
  const launchProofReady = Boolean(
    proof?.promiseProven &&
      baselineFailed &&
      inheritedSucceeded &&
      mistakeRepeatRateDropped &&
      outcomeProofExists,
  );
  const loading = summary.isLoading || evaluations.isLoading || latest.isLoading || workspaces.isLoading;
  const backendError =
    error ??
    summary.error?.message ??
    evaluations.error?.message ??
    latest.error?.message ??
    workspaces.error?.message ??
    null;

  async function refresh() {
    await Promise.all([summary.mutate(), evaluations.mutate(), latest.mutate(), workspaces.mutate()]);
  }

  useEffect(() => {
    const source = new EventSource("/api/events/stream");
    const listener = () => void refresh();
    LIVE_EVENTS.forEach((event) => source.addEventListener(event, listener));
    source.onerror = () => source.close();
    return () => {
      LIVE_EVENTS.forEach((event) => source.removeEventListener(event, listener));
      source.close();
    };
  }, []);

  async function ensureWorkspaceId() {
    const existing = workspaces.data?.[0];
    if (existing) return existing.id;
    const created = await createMasterplanWorkspace({
      name: workspaceName,
      plan: "developer",
      region: "local",
    });
    await workspaces.mutate();
    return created.id;
  }

  async function runReplay() {
    setBusy("evaluation");
    setError(null);
    try {
      const workspaceId = await ensureWorkspaceId();
      const created = await createMasterplanEvaluationRun({
        workspaceId,
        name: "Agent Inheritance Lift Evaluation",
        task: "Prove the second agent avoids the first agent's mistake with inherited MemoryOS context.",
        agent: "Codex",
        baselinePrompt: "Complete the task without inherited company memory, rules, risks, required tests, or proof.",
      });
      setSelectedEvaluationId(created.evaluationRun.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "evaluation_replay_failed");
    } finally {
      setBusy(null);
    }
  }

  const statCards = useMemo(() => {
    return [
      {
        label: "Mistake Repeat Rate",
        value: loading ? "..." : `${metrics?.mistakeRepeatRateBefore ?? 0} -> ${metrics?.mistakeRepeatRateAfter ?? 0}`,
        hint: "baseline vs inherited",
      },
      {
        label: "Inheritance Lift",
        value: loading ? "..." : `+${metrics?.inheritanceLift ?? result?.inheritanceLift ?? 0}%`,
        hint: "EvaluationResult.inheritanceLift",
      },
      {
        label: "Tests Remembered",
        value: loading ? "..." : `${metrics?.testsRememberedScore ?? result?.testsRememberedScore ?? 0}%`,
        hint: "required tests carried forward",
      },
      {
        label: "Human Correction",
        value: loading ? "..." : boolLabel(metrics?.humanCorrectionRequired ?? result?.humanCorrectionRequired ?? false),
        hint: "should drop after inheritance",
      },
      {
        label: "Proof Coverage",
        value: loading ? "..." : `${summary.data?.totals.proofCoverage ?? 0}%`,
        hint: `${summary.data?.totals.successfulResults ?? 0}/${summary.data?.totals.results ?? 0} successful`,
      },
    ];
  }, [loading, metrics, result, summary.data]);

  return (
    <ConsolePage className="px-8 py-7">
      <ConsolePageHeader
        title="Evaluation Lab"
        description="Prove the core memoryosTM promise: the second agent does not repeat the first agent's mistake."
        meta={`${workspaceName} · ${memoryCount} memories · ${requestCount} runtime requests · ${timelineCount} timeline events`}
        badge={<ConsoleStatusBadge label={proof?.promiseProven ? "proof passed" : "proof needed"} active={Boolean(proof?.promiseProven)} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void refresh()} disabled={Boolean(busy)}>
              <RefreshCcw className="mr-2 size-4" /> Refresh
            </Button>
            <Button type="button" onClick={runReplay} disabled={Boolean(busy)}>
              <Play className="mr-2 size-4" /> {busy ? "Running..." : "Run evaluation replay"}
            </Button>
          </div>
        }
      />

      {backendError ? (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          Evaluation replay could not load: {backendError}
        </div>
      ) : null}

      <ConsoleSectionCard
        title="MVP Launch Proof"
        description="This is the v0.1 launch gate: prove that inherited context makes the next agent avoid the previous agent's mistake."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <ConsoleSurface className={cn(
            "rounded-none border p-5",
            launchProofReady ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10",
          )}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Core promise</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  The second agent does not repeat the first agent&apos;s mistake.
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Baseline agent runs without inheritance, fails, and needs correction. Inherited agent receives contract, package proof, tests, risks, and mistake immunity before work.
                </p>
              </div>
              <ConsoleStatusBadge label={launchProofReady ? "launch proof ready" : "proof still needed"} active={launchProofReady} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {["Source", "Memory", "Package", "AgentRun", "Outcome", "Future Instruction", "Mistake Immunity", "Skill", "Replay"].map((item, index, items) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="border border-border bg-background px-2 py-1 text-foreground">{item}</span>
                  {index < items.length - 1 ? <ArrowRight className="size-3" /> : null}
                </span>
              ))}
            </div>
          </ConsoleSurface>

          <div className="grid gap-2 sm:grid-cols-2">
            <ProofGate label="Baseline failed" ready={baselineFailed} detail="Agent 1 repeats the mistake." />
            <ProofGate label="Inherited succeeded" ready={inheritedSucceeded} detail="Agent 2 avoids it." />
            <ProofGate label="Repeat rate dropped" ready={mistakeRepeatRateDropped} detail={`${metrics?.mistakeRepeatRateBefore ?? 0} -> ${metrics?.mistakeRepeatRateAfter ?? 0}`} />
            <ProofGate label="Outcome proof exists" ready={outcomeProofExists} detail={proof?.inheritedOutcomeId ? shortId(proof.inheritedOutcomeId) : "missing"} />
            <ProofGate label="Tests remembered" ready={testsRemembered} detail={`${metrics?.testsRememberedScore ?? result?.testsRememberedScore ?? 0}%`} />
            <ProofGate label="Human correction reduced" ready={!Boolean(metrics?.humanCorrectionRequired ?? result?.humanCorrectionRequired ?? false)} detail="Inherited run needs no correction." />
          </div>
        </div>
      </ConsoleSectionCard>

      <ConsoleStatGrid>
        {statCards.map((metric) => (
          <ConsoleStatCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
        ))}
      </ConsoleStatGrid>

      <ConsoleGrid columns="two">
        <ConsoleSectionCard
          title="Replay Proof"
          description="Baseline run fails without inherited context; inherited run succeeds with contract, package proof, tests, and outcome learning."
        >
          {!run ? (
            <div className="border border-dashed border-border bg-background px-4 py-10 text-sm text-muted-foreground">
              No evaluation replay yet. Run the replay to create baseline and inherited AgentRun evidence.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <ProofCard
                  tone="red"
                  title="Baseline Agent"
                  status={baseline.success === true ? "Succeeded" : "Failed"}
                  detail={`Mistake repeated: ${boolLabel(baseline.mistakeRepeated === true)} · tests ${String(baseline.testsRemembered ?? 0)}`}
                  id={run.baselineAgentRunId}
                />
                <ProofCard
                  tone="green"
                  title="Inherited Agent"
                  status={inherited.success === false ? "Failed" : "Succeeded"}
                  detail={`Mistake repeated: ${boolLabel(inherited.mistakeRepeated === true)} · tests ${String(inherited.testsRemembered ?? 0)}`}
                  id={run.inheritedAgentRunId}
                />
                <ProofCard
                  tone="blue"
                  title="Core Promise"
                  status={proof?.promiseProven ? "Passed" : "Waiting"}
                  detail={summary.data?.primaryPromise ?? "The second agent does not repeat the first agent's mistake."}
                  id={run.contractId}
                />
              </div>

              <div className="border border-border bg-background px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proof chain</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {["Baseline AgentRun", "Baseline Outcome", "Inheritance Contract", "Inherited AgentRun", "Inherited Outcome", "Mistake Immunity"].map((item, index, items) => (
                    <span key={item} className="flex items-center gap-2">
                      <span className="border border-border bg-card px-2 py-1 text-foreground">{item}</span>
                      {index < items.length - 1 ? <ArrowRight className="size-3 text-muted-foreground" /> : null}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <EvidenceRow label="Contract" value={proof?.contractId ?? run.contractId} />
                <EvidenceRow label="Baseline Outcome" value={proof?.baselineOutcomeId} />
                <EvidenceRow label="Inherited Outcome" value={proof?.inheritedOutcomeId} />
                <EvidenceRow label="Last replay" value={formatDate(run.createdAt)} />
              </div>
            </div>
          )}
        </ConsoleSectionCard>

        <ConsoleSectionCard title="Evaluation Runs" description="Historical proof records from Prisma-backed EvaluationRun and EvaluationResult rows.">
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-16 animate-pulse border border-border bg-background" />
              ))
            ) : evaluations.data?.length ? (
              evaluations.data.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedEvaluationId(item.id)}
                  className={cn(
                    "w-full border border-border bg-background px-3 py-3 text-left transition hover:border-primary/40",
                    item.id === run?.id && "border-primary/50 bg-primary/5",
                  )}
                  aria-pressed={item.id === run?.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                    <span className="text-xs text-muted-foreground">{item.status}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.task}</p>
                </button>
              ))
            ) : (
              <div className="border border-dashed border-border bg-background px-4 py-10 text-sm text-muted-foreground">
                No replay history yet. The first run creates both baseline and inherited AgentRuns.
              </div>
            )}
          </div>
        </ConsoleSectionCard>
      </ConsoleGrid>

      <ConsoleGrid columns="two">
        <ConsoleSectionCard title="What This Proves" description="This is the investor/customer proof loop for memoryosTM.">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Baseline agent failed", baselineFailed],
              ["Inherited agent succeeded", inheritedSucceeded],
              ["Mistake repeat rate dropped", mistakeRepeatRateDropped],
              ["Outcome proof exists", outcomeProofExists],
              ["Tests remembered increased", testsRemembered],
              ["MVP launch proof ready", launchProofReady],
            ].map(([label, ok]) => (
              <ConsoleSurface key={String(label)} className="rounded-none">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-muted-foreground" />}
                  {label}
                </div>
              </ConsoleSurface>
            ))}
          </div>
        </ConsoleSectionCard>

        <ConsoleSectionCard title="Next Actions" description="Move from proof into the operational product spine.">
          <div className="grid gap-2">
            <Button type="button" variant="outline" onClick={onOpenMemoryIgnition}>
              <FlaskConical className="mr-2 size-4" /> Prepare another task in MemoryIgnition
            </Button>
            <Button type="button" variant="outline" onClick={onOpenAgentRuns}>
              <ShieldCheck className="mr-2 size-4" /> Inspect Agent Black Box runs
            </Button>
          </div>
        </ConsoleSectionCard>
      </ConsoleGrid>

      <ConsoleSectionCard
        title="Selected Replay Detail"
        description="Open any replay to compare the baseline mistake, inherited correction, and the proof artifacts that made the second run succeed."
      >
        {!run ? (
          <div className="border border-dashed border-border bg-background px-4 py-10 text-sm text-muted-foreground">
            Select a replay run to inspect its baseline and inherited evidence.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <EvidenceRow label="Selected Run" value={run.id} />
                <EvidenceRow label="Baseline AgentRun" value={run.baselineAgentRunId} />
                <EvidenceRow label="Inherited AgentRun" value={run.inheritedAgentRunId} />
                <EvidenceRow label="Contract" value={run.contractId ?? proof?.contractId} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ConsoleSurface className="rounded-none border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Baseline vs inherited</p>
                  <div className="mt-3 space-y-2 text-sm text-foreground">
                    <p>Baseline failed or repeated the original mistake: {boolLabel(Boolean(Number(baseline.mistakeRepeated ?? baseline.mistakesRepeated ?? 0) > 0 || baseline.success === false))}</p>
                    <p>Inherited run avoided the mistake: {boolLabel(Boolean(Number(inherited.mistakeRepeated ?? inherited.mistakesRepeated ?? 0) === 0 && inherited.success !== false))}</p>
                    <p>Mistake repeat rate changed from {metrics?.mistakeRepeatRateBefore ?? 0}% to {metrics?.mistakeRepeatRateAfter ?? 0}%.</p>
                  </div>
                </ConsoleSurface>

                <ConsoleSurface className="rounded-none border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Replay proof</p>
                  <div className="mt-3 space-y-2 text-sm text-foreground">
                    <p>Tests remembered: {result?.testsRememberedScore ?? metrics?.testsRememberedScore ?? 0}%</p>
                    <p>Risk detection: {result?.riskDetectionScore ?? metrics?.riskDetectionScore ?? 0}%</p>
                    <p>Human correction required: {boolLabel(Boolean(result?.humanCorrectionRequired ?? metrics?.humanCorrectionRequired ?? false))}</p>
                    <p>Proof lineage: {summary.data?.proof.lineage ?? "not recorded"}</p>
                  </div>
                </ConsoleSurface>
              </div>
            </div>

            <ConsoleSurface className="rounded-none border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Replay summary</p>
              <div className="mt-3 space-y-3 text-sm text-foreground">
                <p className="font-medium">{run.task}</p>
                <p className="text-muted-foreground">{run.baselinePrompt ?? "Baseline prompt not recorded."}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Created: {formatDate(run.createdAt)}</p>
                  <p>Status: {run.status}</p>
                  <p>Latest result: {result ? `${result.inheritanceLift}% lift` : "not recorded"}</p>
                </div>
              </div>
            </ConsoleSurface>
          </div>
        )}
      </ConsoleSectionCard>
    </ConsolePage>
  );
}

function ProofGate({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return (
    <ConsoleSurface className="rounded-none border border-border bg-background p-3">
      <div className="flex items-start gap-2">
        {ready ? <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" /> : <XCircle className="mt-0.5 size-4 text-muted-foreground" />}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </ConsoleSurface>
  );
}

function ProofCard({
  tone,
  title,
  status,
  detail,
  id,
}: {
  tone: "red" | "green" | "blue";
  title: string;
  status: string;
  detail: string;
  id?: string | null;
}) {
  const classes = {
    red: "border-red-500/25 bg-red-500/5 text-red-600",
    green: "border-emerald-500/25 bg-emerald-500/5 text-emerald-600",
    blue: "border-primary/25 bg-primary/10 text-primary",
  }[tone];
  return (
    <ConsoleSurface className={cn("rounded-none", classes)}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{status}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">{shortId(id)}</p>
    </ConsoleSurface>
  );
}

function EvidenceRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border border-border bg-background px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xs text-foreground">{shortId(value)}</p>
    </div>
  );
}

