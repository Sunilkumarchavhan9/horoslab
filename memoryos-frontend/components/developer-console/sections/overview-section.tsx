"use client";

import { Button } from "@/components/ui/button";
import {
  ConsoleGrid,
  ConsolePage,
  ConsolePageHeader,
  ConsoleSurface,
  ConsoleStatusBadge,
} from "@/components/developer-console/console-ui";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";

type ActionCardTitle = "Quick Start" | "Continuity Lab" | "Playground" | "Documentation";
type OverviewActionHandlers = Partial<Record<ActionCardTitle, () => void>>;
type InstallationVerificationStatus = "idle" | "waiting" | "connected" | "error";

type OverviewSectionProps = {
  actions?: OverviewActionHandlers;
  stats?: Array<{ label: string; value: string; accent?: string }>;
  isLoading?: boolean;
  errorMessage?: string | null;
  memories?: Array<{ content: string; type?: string; updatedAt: string }>;
  requestEvents?: RequestSectionEvent[];
  insights?: {
    activeProjects?: string[];
  } | null;
  resumeData?: {
    summary?: string;
    recommendedNextStep?: string;
    openLoops?: string[];
  } | null;
  handoffData?: {
    openLoops?: string[];
  } | null;
  timelineCount?: number;
  installationVerification?: {
    status: InstallationVerificationStatus;
    message: string;
    onVerify: () => void;
  };
};

function cleanNoise(input: string | undefined | null): string {
  if (!input) return "";
  let text = input;

  // Remove common noisy fragments leaking from serialized benchmark payloads.
  text = text.replace(/,\s*"expectedType"\s*:\s*"[^"]*"/g, "");
  text = text.replace(/,\s*expectedType\s*:\s*"[^"]*"/g, "");
  text = text.replace(/,\s*"input"\s*:\s*\{[^}]*\}/g, "");
  text = text.replace(/,\s*input\s*:\s*\{[^}]*\}/g, "");
  text = text.replace(/\{\s*"text"\s*:\s*"([^"]+)"\s*\}/g, "$1");
  text = text.replace(/["{}[\]]/g, "");
  text = text.replace(/,\s*id\s*:\s*[^,]+/gi, "");
  text = text.replace(/\bmustMention\b\s*:\s*[^,]+/gi, "");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

function toSentenceChunks(input: string | undefined | null, maxItems = 4): string[] {
  const cleaned = cleanNoise(input);
  if (!cleaned) return [];
  const parts = cleaned
    .split(/(?:\s+-\s+|[.]\s+|,\s+(?=[A-Z]))/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 16 && !/^input\b/i.test(part));
  return parts.slice(0, maxItems);
}

function shortText(input: string | undefined | null, max = 180): string {
  const cleaned = cleanNoise(input);
  if (!cleaned) return "Not available yet.";
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}...`;
}

function isCompletionSignal(input: string | undefined | null): boolean {
  const cleaned = cleanNoise(input).toLowerCase();
  if (!cleaned) return false;
  return /\b(shipped|completed|complete|done|solved|resolved|fixed|closed|delivered|released|validated|merged)\b/.test(
    cleaned,
  );
}

function isPendingLoop(input: string | undefined | null): boolean {
  const cleaned = cleanNoise(input).toLowerCase();
  if (!cleaned || isCompletionSignal(cleaned)) return false;
  return /\b(problem|risk|blocked|blocker|todo|next|continue|open|pending|needs|follow[- ]?up)\b/.test(
    cleaned,
  );
}

function isSuccessfulRoute(event: RequestSectionEvent, fragment: string): boolean {
  return event.status === "Success" && event.route.includes(fragment);
}

function eventHasTraceProofSignal(event: RequestSectionEvent): boolean {
  const text = `${event.responseSummary ?? ""} ${event.payloadSummary ?? ""}`;
  return /\b(traceProof|trace proof|contractCategory|memoryUsedCount|whySelected|confidence)\b/i.test(text);
}

export function OverviewSection({
  actions,
  stats = [],
  isLoading = false,
  errorMessage = null,
  memories = [],
  requestEvents = [],
  insights = null,
  resumeData = null,
  handoffData = null,
  timelineCount = 0,
  installationVerification,
}: OverviewSectionProps) {
  const verificationStatus = installationVerification?.status ?? "idle";
  const isConnected = verificationStatus === "connected";
  const successfulEvents = requestEvents.filter((event) => event.status === "Success");
  const hasSourceConnected =
    memories.length > 0 ||
    successfulEvents.some(
      (event) =>
        isSuccessfulRoute(event, "/api/connector") ||
        isSuccessfulRoute(event, "/api/memory/process") ||
        isSuccessfulRoute(event, "/api/memory/list"),
    );
  const hasContinueBrief =
    Boolean(resumeData?.summary) ||
    successfulEvents.some(
      (event) =>
        isSuccessfulRoute(event, "/api/memory/resume") &&
        !event.route.includes("/resume/prompt"),
    );
  const hasIdePrompt = successfulEvents.some((event) =>
    isSuccessfulRoute(event, "/api/memory/resume/prompt"),
  );
  const hasTraceProof =
    hasIdePrompt &&
    (successfulEvents.some(
      (event) =>
        isSuccessfulRoute(event, "/api/memory/resume/prompt") &&
        eventHasTraceProofSignal(event),
    ) ||
      timelineCount > 0 ||
      memories.length > 1);
  const graphSynced = timelineCount > 0 || memories.length > 0;

  const statusPills = [
    { label: "Workspace Active", active: hasSourceConnected },
    { label: "SDK Connected", active: isConnected },
    { label: "Graph Synced", active: graphSynced },
    { label: "Trace Proof Ready", active: hasTraceProof },
  ];

  const metricCards = stats.map((entry) => ({
    title: entry.label,
    value: entry.value,
    delta: null as string | null,
    accentClass: "text-primary",
    rows: [
      { label: "Source", value: "Live backend", valueClass: "text-primary" },
      { label: "Updated", value: "Realtime", valueClass: "text-foreground" },
    ],
  }));

  const primaryProjectName = shortText(
    insights?.activeProjects?.[0] ?? "No active project",
    80,
  );
  const topMemory = shortText(memories[0]?.content ?? "No memory captured yet", 200);
  const summarySentence = shortText(resumeData?.summary ?? memories[0]?.content ?? "No active summary yet.", 150);
  const focusPoints = toSentenceChunks(resumeData?.summary ?? topMemory, 3);
  const nextAction =
    shortText(
      resumeData?.recommendedNextStep ?? handoffData?.openLoops?.[0],
      180,
    ) ??
    "No next action detected yet.";
  const pendingLoops = [
    ...(resumeData?.openLoops ?? []),
    ...(handoffData?.openLoops ?? []),
  ].filter(isPendingLoop);
  const completedSignals = [
    primaryProjectName,
    topMemory,
    resumeData?.summary,
    resumeData?.recommendedNextStep,
    ...(resumeData?.openLoops ?? []),
    ...(handoffData?.openLoops ?? []),
    ...memories.slice(0, 5).map((memory) => memory.content),
  ].filter(isCompletionSignal);
  const projectCompleted = completedSignals.length > 0 && pendingLoops.length === 0;
  const completionSummary = shortText(
    completedSignals[0] ?? primaryProjectName,
    180,
  );
  const detectedProblem =
    shortText(
      pendingLoops.find((loop) =>
        loop.toLowerCase().includes("problem") ||
        loop.toLowerCase().includes("risk") ||
        loop.toLowerCase().includes("blocked") ||
        loop.toLowerCase().includes("pending"),
      ),
      180,
    ) ?? "No blocker detected from current live context.";
  const problemPoints = toSentenceChunks(detectedProblem, 2);
  const evidenceItems = memories
    .slice(0, 3)
    .map((memory) => ({
      text: shortText(memory.content, 110),
      updatedAt: new Date(memory.updatedAt).toLocaleTimeString(),
      type: (memory.type ?? "memory").toUpperCase(),
    }));

  const liveActivity = [
    ...requestEvents.slice(0, 3).map((event) => ({
      at: new Date(event.createdAt).toLocaleTimeString(),
      title: `${event.method ?? "API"} ${event.route}`,
      detail: `${event.status} · ${event.latencyMs}ms`,
    })),
    ...memories.slice(0, 2).map((memory) => ({
      at: new Date(memory.updatedAt).toLocaleTimeString(),
      title: "Memory updated",
      detail: shortText(memory.content, 220),
    })),
  ].slice(0, 4);

  const funnelSteps = [
    {
      id: "connect",
      label: "Connect GitHub Source",
      done: hasSourceConnected,
      action: actions?.["Quick Start"],
      actionLabel: "Open Integrations",
      detail: "Connect at least one source and ingest real project context.",
    },
    {
      id: "brief",
      label: "Continue Project Brief",
      done: hasContinueBrief,
      action: actions?.["Continuity Lab"],
      actionLabel: "Open Continuity Lab",
      detail: "Generate structured output: recent changes, goal, blockers, risky files, next action.",
    },
    {
      id: "prompt",
      label: "Generate IDE Prompt",
      done: hasIdePrompt,
      action: actions?.["Playground"],
      actionLabel: "Open Playground",
      detail: "Create Cursor/Codex/Claude Code ready prompts from the brief.",
    },
    {
      id: "trace",
      label: "Trace Proof Panel",
      done: hasTraceProof,
      action: actions?.["Playground"],
      actionLabel: "Inspect Trace",
      detail: "Show memory used, source, confidence, and why each item was selected.",
    },
  ];
  const missingFunnelSteps = funnelSteps.filter((step) => !step.done).map((step) => step.label);

  return (
    <ConsolePage>
      <ConsolePageHeader
        title="Memory Command Center"
        description="Live observability for agent memory, retrieval quality, and cross-session continuity."
        actions={
          <div className="flex flex-wrap gap-2">
            {statusPills.map((pill) => (
              <ConsoleStatusBadge key={pill.label} label={pill.label} active={pill.active} />
            ))}
          </div>
        }
      />

      <div className="space-y-8">
        <ConsoleSurface>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Engineering Continuity Funnel</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Ship the wedge first: source connect, continue brief, IDE prompt, and trace proof.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {missingFunnelSteps.length === 0
                  ? "Wedge shipped for this workspace."
                  : `Still needed: ${missingFunnelSteps.join(", ")}.`}
              </p>
            </div>
            <ConsoleStatusBadge
              label={`${funnelSteps.filter((step) => step.done).length}/${funnelSteps.length} complete`}
              active={funnelSteps.every((step) => step.done)}
            />
          </div>
          <ConsoleGrid columns="two">
            {funnelSteps.map((step, index) => (
              <ConsoleSurface key={step.id} tone="muted" className="console-funnel-step-card">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {index + 1}</p>
                  <ConsoleStatusBadge label={step.done ? "Done" : "Pending"} active={step.done} />
                </div>
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                <Button className="mt-3 w-full" variant={step.done ? "secondary" : "default"} onClick={step.action}>
                  {step.actionLabel}
                </Button>
              </ConsoleSurface>
            ))}
          </ConsoleGrid>
        </ConsoleSurface>

        <ConsoleGrid columns="five">
          {metricCards.map((metric) => (
            <ConsoleSurface
              key={metric.title}
              className="relative overflow-hidden"
            >
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{metric.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">{metric.value}</span>
                {metric.delta ? <span className={`text-xs font-medium ${metric.accentClass}`}>{metric.delta}</span> : null}
              </div>
              <div className="mt-4 space-y-1 text-xs font-mono text-muted-foreground">
                {metric.rows.map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span>{row.label}</span>
                    <span className={row.valueClass}>{row.value}</span>
                  </div>
                ))}
              </div>
            </ConsoleSurface>
          ))}
        </ConsoleGrid>

        <ConsoleGrid columns="two" className="gap-6">
          <ConsoleSurface className="flex flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Active Project State</h2>
              <span className="text-xs font-mono text-muted-foreground">Confidence: live</span>
            </div>
            <div className="flex-1 space-y-6 p-6">
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Project</p>
                <p className="text-sm font-medium text-foreground">{primaryProjectName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{summarySentence}</p>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-primary">Current Focus</p>
                <ConsoleSurface tone="muted" className="px-3 py-2">
                  <ul className="space-y-1.5 text-sm leading-relaxed text-foreground/90">
                    {(focusPoints.length > 0 ? focusPoints : [shortText(resumeData?.summary ?? topMemory, 260)]).map((point, idx) => (
                      <li key={`${idx}-${point}`} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </ConsoleSurface>
              </div>
              <div>
                <p className={`mb-1.5 text-xs font-bold uppercase tracking-widest ${projectCompleted ? "text-primary" : "text-destructive"}`}>
                  {projectCompleted ? "Completed State" : "Detected Problem"}
                </p>
                <ConsoleSurface tone={projectCompleted ? "primary" : "destructive"} className="px-3 py-2">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${projectCompleted ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                      {projectCompleted ? "Shipped" : "Open Loop"}
                    </span>
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {projectCompleted ? "Status: Complete" : "Severity: Medium"}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-sm leading-relaxed text-foreground/90">
                    {(projectCompleted ? [completionSummary] : problemPoints.length > 0 ? problemPoints : [detectedProblem]).map((point, idx) => (
                      <li key={`${idx}-${point}`} className="flex items-start gap-2">
                        <span className={`mt-1 inline-block h-1.5 w-1.5 rounded-full ${projectCompleted ? "bg-primary" : "bg-destructive"}`} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </ConsoleSurface>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-primary">Next Action</p>
                <ConsoleSurface tone="primary" className="px-3 py-2">
                  <p className="text-sm font-medium leading-relaxed text-primary">{nextAction}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-primary/80">Estimated time: 2-5 min</p>
                </ConsoleSurface>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Evidence</p>
                <div className="space-y-2">
                  {evidenceItems.length === 0 ? (
                    <ConsoleSurface tone="muted" className="px-3 py-2 text-xs text-muted-foreground">
                      No evidence items yet.
                    </ConsoleSurface>
                  ) : evidenceItems.map((item, idx) => (
                    <ConsoleSurface key={`${item.updatedAt}-${idx}`} tone="muted" className="px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.type}</span>
                        <span className="text-xs font-mono text-muted-foreground">{item.updatedAt}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/90">{item.text}</p>
                    </ConsoleSurface>
                  ))}
                </div>
              </div>
            </div>
          </ConsoleSurface>

          <ConsoleSurface className="flex h-full flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Live Memory Activity</h2>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {liveActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground">No live events yet.</p>
              ) : liveActivity.map((item, idx) => (
                <div key={`${item.at}-${idx}`} className="relative border-l border-border pl-4">
                  <div className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="mb-1 text-xs font-mono text-muted-foreground">{item.at}</p>
                  <p className="mb-0.5 text-xs font-bold text-foreground">{item.title}</p>
                  <p className="break-words text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </ConsoleSurface>
        </ConsoleGrid>

        <ConsoleGrid columns="two" className="gap-6">
          <ConsoleSurface className="flex flex-col p-6">
            <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-primary">Continuity Graph</h2>
            <ConsoleGrid className="mb-6 flex-1 rounded-md border border-border bg-muted p-4">
              <ConsoleSurface tone="primary" className="p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Project</p>
                <p className="mt-1 text-sm font-medium text-foreground">{primaryProjectName}</p>
              </ConsoleSurface>
              <ConsoleSurface className="p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Focus</p>
                <p className="mt-1 text-sm text-foreground/90">{shortText(resumeData?.summary, 190)}</p>
              </ConsoleSurface>
              <ConsoleSurface tone={projectCompleted ? "primary" : "destructive"} className="p-3">
                <p className={`text-xs font-bold uppercase tracking-widest ${projectCompleted ? "text-primary" : "text-destructive"}`}>
                  {projectCompleted ? "Completed" : "Problem"}
                </p>
                <p className="mt-1 text-sm text-foreground/90">
                  {projectCompleted ? completionSummary : detectedProblem}
                </p>
              </ConsoleSurface>
              <ConsoleSurface className="p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next Action</p>
                <p className="mt-1 text-sm font-medium text-primary">{nextAction}</p>
              </ConsoleSurface>
            </ConsoleGrid>
            <Button className="w-full" onClick={actions?.["Playground"]}>
              Open Memory Playground
            </Button>
          </ConsoleSurface>

          <ConsoleSurface className="flex flex-col p-6">
            <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-foreground">Recommended Actions</h2>
            <div className="space-y-3 flex-1">
              {[
                { title: "Test memory extraction in Playground", impact: "High", time: "2 min", status: "Ready", accent: "text-primary", action: actions?.["Playground"] },
                { title: "Run a continuity handoff simulation", impact: "High", time: "2 min", status: "Ready", accent: "text-primary", action: actions?.["Continuity Lab"] },
                { title: "Connect your first source", impact: "Med", time: "5 min", status: "Not started", accent: "text-muted-foreground", action: undefined },
                { title: "Generate SDK integration code", impact: "High", time: "3 min", status: "Ready", accent: "text-primary", action: actions?.["Quick Start"] },
              ].map((item, i) => (
                <ConsoleSurface key={i} tone="muted" className="flex cursor-pointer items-center justify-between p-3 transition hover:bg-accent" onClick={item.action}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-xs text-muted-foreground">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
                    <span className="hidden text-muted-foreground sm:inline-block">Impact: {item.impact}</span>
                    <span className="hidden text-muted-foreground sm:inline-block">Time: {item.time}</span>
                    <span className={`${item.accent} font-bold`}>{item.status}</span>
                  </div>
                </ConsoleSurface>
              ))}
            </div>
          </ConsoleSurface>
        </ConsoleGrid>

        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Build with MemoryOS</h2>
          <ConsoleGrid columns="four">
            <button onClick={actions?.["Quick Start"]} className="group rounded-lg border border-primary/25 bg-primary/10 p-5 text-left transition-colors hover:bg-primary/20">
              <p className="mb-2 text-sm font-bold text-primary transition-colors group-hover:text-primary">Quick Start</p>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">Add MemoryOS to your agent loop in under 5 minutes.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Install SDK →</span>
            </button>
            <button onClick={actions?.["Continuity Lab"]} className="group rounded-lg border border-primary/25 bg-primary/10 p-5 text-left transition-colors hover:bg-primary/20">
              <p className="mb-2 text-sm font-bold text-primary transition-colors group-hover:text-primary">Continuity Lab</p>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">Watch retrieve, resume, and handoff work with live workspace data.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Open Continuity Lab →</span>
            </button>
            <button onClick={actions?.["Playground"]} className="group rounded-lg border border-primary/25 bg-primary/10 p-5 text-left transition-colors hover:bg-primary/20">
              <p className="mb-2 text-sm font-bold text-primary transition-colors group-hover:text-primary">Playground</p>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">Inspect what your agent remembers and why.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Open Memory Playground →</span>
            </button>
            <button onClick={actions?.["Documentation"]} className="group rounded-lg border border-primary/25 bg-primary/10 p-5 text-left transition-colors hover:bg-primary/20">
              <p className="mb-2 text-sm font-bold text-primary transition-colors group-hover:text-primary">Docs</p>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">SDK, MCP, REST API, and LangGraph examples.</p>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Read Integration Guide →</span>
            </button>
          </ConsoleGrid>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading overview data…</p>
        ) : null}
        {errorMessage ? (
          <p className="rounded-md border border-border bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        {installationVerification?.message ? (
          <div className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            {installationVerification.message}
          </div>
        ) : null}
      </div>
    </ConsolePage>
  );
}
