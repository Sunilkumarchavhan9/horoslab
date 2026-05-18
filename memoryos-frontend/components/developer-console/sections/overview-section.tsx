"use client";

import { Button } from "@/components/ui/button";
import {
  ConsolePage,
  ConsolePageHeader,
  ConsoleStatCard,
  ConsoleStatGrid,
  ConsoleStatusBadge,
} from "@/components/developer-console/console-ui";

type ActionCardTitle = "Quick Start" | "Continuity Lab" | "Playground" | "Documentation";
type OverviewActionHandlers = Partial<Record<ActionCardTitle, () => void>>;
type InstallationVerificationStatus = "idle" | "waiting" | "connected" | "error";

type OverviewSectionProps = {
  actions?: OverviewActionHandlers;
  stats?: Array<{ label: string; value: string; accent?: string }>;
  isLoading?: boolean;
  errorMessage?: string | null;
  memories?: Array<{ content: string; type?: string; updatedAt: string }>;
  requestEvents?: Array<{
    id: string;
    createdAt: string;
    type: string;
    status: "Success" | "Error";
    route: string;
    latencyMs: number;
    method?: string;
  }>;
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

  const statusPills = [
    { label: "Workspace Active", active: memories.length > 0 || requestEvents.length > 0, dotClass: "bg-primary" },
    { label: "SDK Connected", active: isConnected, dotClass: "bg-primary" },
    { label: "Graph Synced", active: timelineCount > 0, dotClass: "bg-primary" },
    { label: "Handoff Ready", active: (handoffData?.openLoops?.length ?? 0) > 0, dotClass: "bg-primary" },
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
  const detectedProblem =
    shortText(
      [...(resumeData?.openLoops ?? []), ...(handoffData?.openLoops ?? [])].find((loop) =>
      loop.toLowerCase().includes("problem") ||
      loop.toLowerCase().includes("risk") ||
      loop.toLowerCase().includes("blocked"),
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

  return (
    <ConsolePage>
      <div className="relative overflow-hidden border-b border-border bg-background px-6 py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_60%)]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Memory Command Center</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Live observability for agent memory, retrieval quality, and cross-session continuity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusPills.map((pill) => (
              <div key={pill.label} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <span className={`h-2 w-2 rounded-full ${pill.active ? `${pill.dotClass} animate-pulse` : "bg-muted-foreground/40"}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${pill.active ? "text-foreground/90" : "text-muted-foreground"}`}>
                  {pill.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metricCards.map((metric) => (
            <div
              key={metric.title}
              className="relative overflow-hidden rounded-[10px] border border-border bg-card p-5 shadow-sm"
            >
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{metric.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-bold tracking-tight text-foreground">{metric.value}</span>
                {metric.delta ? <span className={`text-[12px] font-medium ${metric.accentClass}`}>{metric.delta}</span> : null}
              </div>
              <div className="mt-4 space-y-1 text-[11px] font-mono text-muted-foreground">
                {metric.rows.map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span>{row.label}</span>
                    <span className={row.valueClass}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col overflow-hidden rounded-[12px] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-primary">Active Project State</h2>
              <span className="text-[10px] font-mono text-muted-foreground">Confidence: live</span>
            </div>
            <div className="flex-1 space-y-6 p-6">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project</p>
                <p className="text-[15px] font-medium text-foreground">{primaryProjectName}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{summarySentence}</p>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">Current Focus</p>
                <div className="rounded-[8px] border border-border bg-muted/40 px-3 py-2">
                  <ul className="space-y-1.5 text-[13px] leading-relaxed text-foreground/90">
                    {(focusPoints.length > 0 ? focusPoints : [shortText(resumeData?.summary ?? topMemory, 260)]).map((point, idx) => (
                      <li key={`${idx}-${point}`} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive">Detected Problem</p>
                <div className="rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
                      Open Loop
                    </span>
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Severity: Medium
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-[13px] leading-relaxed text-foreground/90">
                    {(problemPoints.length > 0 ? problemPoints : [detectedProblem]).map((point, idx) => (
                      <li key={`${idx}-${point}`} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">Next Action</p>
                <div className="rounded-[8px] border border-primary/20 bg-primary/5 px-3 py-2">
                  <p className="text-[14px] font-medium leading-relaxed text-primary">{nextAction}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-primary/80">Estimated time: 2-5 min</p>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Evidence</p>
                <div className="space-y-2">
                  {evidenceItems.length === 0 ? (
                    <p className="rounded-[8px] border border-border bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                      No evidence items yet.
                    </p>
                  ) : evidenceItems.map((item, idx) => (
                    <div key={`${item.updatedAt}-${idx}`} className="rounded-[8px] border border-border bg-muted/30 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.type}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{item.updatedAt}</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-foreground/90">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col overflow-hidden rounded-[12px] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-primary">Live Memory Activity</h2>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {liveActivity.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No live events yet.</p>
              ) : liveActivity.map((item, idx) => (
                <div key={`${item.at}-${idx}`} className="relative border-l border-border pl-4">
                  <div className="absolute left-[-4.5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="mb-1 text-[10px] font-mono text-muted-foreground">{item.at}</p>
                  <p className="mb-0.5 text-[12px] font-bold text-foreground">{item.title}</p>
                  <p className="break-words text-[12px] leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col rounded-[12px] border border-border bg-card p-6">
            <h2 className="mb-6 text-[12px] font-bold uppercase tracking-widest text-primary">Continuity Graph</h2>
            <div className="mb-6 grid flex-1 gap-3 rounded-[8px] border border-border bg-muted/40 p-4">
              <div className="rounded-[8px] border border-primary/20 bg-primary/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Project</p>
                <p className="mt-1 text-[13px] font-medium text-foreground">{primaryProjectName}</p>
              </div>
              <div className="rounded-[8px] border border-border bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Focus</p>
                <p className="mt-1 text-[13px] text-foreground/90">{shortText(resumeData?.summary, 190)}</p>
              </div>
              <div className="rounded-[8px] border border-destructive/25 bg-destructive/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">Problem</p>
                <p className="mt-1 text-[13px] text-foreground/90">{detectedProblem}</p>
              </div>
              <div className="rounded-[8px] border border-border bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next Action</p>
                <p className="mt-1 text-[13px] font-medium text-primary">{nextAction}</p>
              </div>
            </div>
            <Button className="w-full" onClick={actions?.["Playground"]}>
              Open Memory Playground
            </Button>
          </div>

          <div className="flex flex-col rounded-[12px] border border-border bg-card p-6">
            <h2 className="mb-6 text-[12px] font-bold uppercase tracking-widest text-foreground">Recommended Actions</h2>
            <div className="space-y-3 flex-1">
              {[
                { title: "Test memory extraction in Playground", impact: "High", time: "2 min", status: "Ready", accent: "text-primary", action: actions?.["Playground"] },
                { title: "Run a continuity handoff simulation", impact: "High", time: "2 min", status: "Ready", accent: "text-primary", action: actions?.["Continuity Lab"] },
                { title: "Connect your first source", impact: "Med", time: "5 min", status: "Not started", accent: "text-muted-foreground", action: undefined },
                { title: "Generate SDK integration code", impact: "High", time: "3 min", status: "Ready", accent: "text-primary", action: actions?.["Quick Start"] },
              ].map((item, i) => (
                <div key={i} className="flex cursor-pointer items-center justify-between rounded-[8px] border border-border bg-muted/40 p-3 transition hover:bg-accent/40" onClick={item.action}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-[10px] text-muted-foreground">{i + 1}</span>
                    <span className="text-[13px] font-medium text-foreground">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
                    <span className="hidden text-muted-foreground sm:inline-block">Impact: {item.impact}</span>
                    <span className="hidden text-muted-foreground sm:inline-block">Time: {item.time}</span>
                    <span className={`${item.accent} font-bold`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Build with MemoryOS</h2>
          <div className="grid gap-4 lg:grid-cols-4">
            <button onClick={actions?.["Quick Start"]} className="group rounded-[10px] !border !border-primary/25 !bg-primary/10 p-5 text-left shadow-sm transition-colors hover:!bg-primary/20">
              <p className="mb-2 text-[14px] font-bold !text-primary transition-colors group-hover:!text-primary">Quick Start</p>
              <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">Add MemoryOS to your agent loop in under 5 minutes.</p>
              <span className="text-[10px] font-bold uppercase tracking-widest !text-primary">Install SDK →</span>
            </button>
            <button onClick={actions?.["Continuity Lab"]} className="group rounded-[10px] !border !border-primary/25 !bg-primary/10 p-5 text-left shadow-sm transition-colors hover:!bg-primary/20">
              <p className="mb-2 text-[14px] font-bold !text-primary transition-colors group-hover:!text-primary">Continuity Lab</p>
              <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">Watch retrieve, resume, and handoff work with live workspace data.</p>
              <span className="text-[10px] font-bold uppercase tracking-widest !text-primary">Open Continuity Lab →</span>
            </button>
            <button onClick={actions?.["Playground"]} className="group rounded-[10px] !border !border-primary/25 !bg-primary/10 p-5 text-left shadow-sm transition-colors hover:!bg-primary/20">
              <p className="mb-2 text-[14px] font-bold !text-primary transition-colors group-hover:!text-primary">Playground</p>
              <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">Inspect what your agent remembers and why.</p>
              <span className="text-[10px] font-bold uppercase tracking-widest !text-primary">Open Memory Playground →</span>
            </button>
            <button onClick={actions?.["Documentation"]} className="group rounded-[10px] !border !border-primary/25 !bg-primary/10 p-5 text-left shadow-sm transition-colors hover:!bg-primary/20">
              <p className="mb-2 text-[14px] font-bold !text-primary transition-colors group-hover:!text-primary">Docs</p>
              <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">SDK, MCP, REST API, and LangGraph examples.</p>
              <span className="text-[10px] font-bold uppercase tracking-widest !text-primary">Read Integration Guide →</span>
            </button>
          </div>
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
