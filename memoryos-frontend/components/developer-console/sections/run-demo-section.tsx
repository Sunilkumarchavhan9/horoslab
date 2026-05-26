"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/developer-console/console-ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContinuityLabSessionView } from "@/components/developer-console/continuity-lab-session-view";
import { UsageMeter } from "@/components/developer-console/usage-meter";
import {
  fetchMemoryTokenFromBridge,
  getOrCreateMemoryTokenWithRetry,
  readMemoryTokenFromStorage,
} from "@/lib/memory-token";
import type { BillingPlan } from "@/lib/plan-catalog";

type VoiceSpeaker = "user" | "assistant" | "system";
type MicState = "disabled" | "requesting" | "enabled" | "error";
type DemoRunState = "idle" | "starting" | "recording" | "ending" | "ended";
type AgentId = string;
type AgentModel = string;
type ChatMode = "chat" | "handoff" | "next_step" | "execute";
type RetentionClass = "short" | "standard" | "long";
type GovernanceMode = "balanced" | "strict" | "enterprise";

type BillingSnapshot = {
  currentPlan: BillingPlan;
  usage: {
    tokenLimit: number;
    tokenUsed: number;
    searchLimit: number;
    searchUsed: number;
    resetInDays: number;
  };
};

type DemoMessage = {
  speaker: VoiceSpeaker;
  text: string;
  agentId?: AgentId;
  model?: AgentModel;
  tags?: string[];
  createdAt: string;
};

type ProjectState = {
  projectName?: string;
  systemGoal?: string;
  activeConstraints?: string[];
  preferences?: string[];
  executionPlan?: string[];
  confidence?: number;
  missingInfo?: string[];
};

type MutationEvent = {
  type: string;
  label: string;
  detail: string;
  timestamp?: string;
};

type TimelineEventRecord = {
  id: string;
  eventType: string;
  reason: string;
  timestamp: string;
};

type VoiceSession = {
  sessionId: string;
  userId: string;
  source: "pipecat";
  status: "active" | "ended";
  workspace?: string;
  project?: string;
  threadId?: string;
  startedAt: string;
  endedAt?: string;
  chunkCount: number;
  totalCharacters: number;
  lastChunkAt?: string;
};

type StartSessionResponse = {
  session: VoiceSession;
};

type EndSessionResponse = {
  session: VoiceSession;
};

type VoiceChatResponse = {
  session: VoiceSession;
  reply: string;
  projectState: ProjectState;
  mutations: MutationEvent[];
  acceptedMemories: unknown[];
  timelineEvents: TimelineEventRecord[];
  contractQuality?: {
    score: number;
    grade: "A" | "B" | "C" | "D";
    presentFields: string[];
    missingFields: string[];
    reasons: string[];
  };
};

type RetrieveResponseData = {
  memories: Array<{
    memory: string;
    memoryType?: string;
  }>;
};

type SpeechRecognitionResultLike = {
  0: {
    transcript: string;
  };
  isFinal?: boolean;
};

type SpeechRecognitionEventLike = {
  results: Iterable<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type DecisionNode = {
  id: string;
  label: string;
  status: "active" | "rejected" | "reason" | "neutral";
  children?: DecisionNode[];
};

type RuntimeAgent = {
  id: string;
  label: string;
  model: string;
  description: string;
};

type GovernancePolicy = {
  ttlHours: number;
  retentionClass: RetentionClass;
  pinCriticalDecisions: boolean;
  redactSecrets: boolean;
  requireManualReviewForHighRisk: boolean;
  mode: GovernanceMode;
};

const FALLBACK_RUNTIME_AGENT: RuntimeAgent = {
  id: "unassigned",
  label: "Unassigned Agent",
  model: "unknown",
  description: "No live agent runtime connected",
};

const EMPTY_PROJECT: ProjectState = {
  projectName: "Untitled project",
  systemGoal: undefined,
  activeConstraints: [],
  preferences: [],
  executionPlan: [],
  confidence: 12,
  missingInfo: ["Define the project goal"],
};

const WORKSPACE = "memoryosTM";
const PROJECT = "continuity-lab";
const DEFAULT_GOVERNANCE_POLICY: GovernancePolicy = {
  mode: "balanced",
  retentionClass: "standard",
  ttlHours: 168,
  redactSecrets: true,
  pinCriticalDecisions: true,
  requireManualReviewForHighRisk: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

function formatTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "--";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseJwtUserId(token: string | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return null;

  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const parsed: unknown = JSON.parse(window.atob(payload));
    return isRecord(parsed) && typeof parsed.sub === "string" ? parsed.sub.trim() : null;
  } catch {
    return null;
  }
}

function compactId(value: string): string {
  if (value.length <= 28) return value;
  return `${value.slice(0, 13)}...${value.slice(-9)}`;
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && /unauthorized|status 401/i.test(error.message);
}

function normalizeApiPayload<T>(payload: unknown): T {
  if (isRecord(payload) && payload.ok === true && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload)) {
    if (
      isRecord(payload.error) &&
      payload.error.code === "UPGRADE_REQUIRED" &&
      typeof payload.error.message === "string"
    ) {
      return `${payload.error.message} Upgrade in Developer Console > Billing to continue.`;
    }
    if (typeof payload.error === "string") return payload.error;
    if (isRecord(payload.error) && typeof payload.error.message === "string") {
      const details = payload.error.details;
      if (details && typeof details === "object") {
        const compact = JSON.stringify(details);
        if (compact && compact !== "{}") {
          return `${payload.error.message} | details: ${compact}`;
        }
      }
      return payload.error.message;
    }
    if (typeof payload.message === "string") return payload.message;
  }
  return fallback;
}

class ApiRequestError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

async function fetchMemoryApi<T>(routePath: string, token: string, init?: RequestInit): Promise<T> {
  const configuredOrigin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim();
  const origin =
    configuredOrigin && configuredOrigin !== "same-origin"
      ? configuredOrigin.replace(/\/+$/, "")
      : "";
  const path = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const response = await fetch(`${origin}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiRequestError(
      extractErrorMessage(payload, `Request failed (${response.status}) for ${path}`),
      response.status,
      payload,
    );
  }

  return normalizeApiPayload<T>(payload);
}

function stopMediaStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function mergeTimeline(current: TimelineEventRecord[], incoming: TimelineEventRecord[]): TimelineEventRecord[] {
  const byId = new Map<string, TimelineEventRecord>();
  for (const item of current) byId.set(item.id, item);
  for (const item of incoming) byId.set(item.id, item);
  return Array.from(byId.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function uniqueList(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function sanitizeProjectState(next: ProjectState, previous: ProjectState): ProjectState {
  const preferences = uniqueList([...(next.preferences ?? []), ...(previous.preferences ?? [])]);
  const constraints = uniqueList([...(next.activeConstraints ?? []), ...(previous.activeConstraints ?? [])]);
  const plan = uniqueList([...(next.executionPlan ?? []), ...(previous.executionPlan ?? [])]);
  const gaps = uniqueList(next.missingInfo ?? previous.missingInfo ?? []);
  const fastifyChosen = preferences.some((item) => /fastify/i.test(item));

  return {
    projectName: next.projectName || previous.projectName || EMPTY_PROJECT.projectName,
    systemGoal: next.systemGoal || previous.systemGoal || EMPTY_PROJECT.systemGoal,
    activeConstraints: constraints,
    preferences: fastifyChosen ? uniqueList([...preferences, "Fastify backend"]) : preferences,
    executionPlan: fastifyChosen
      ? uniqueList(["Implement the Fastify backend slice for the current project", ...plan])
      : plan,
    confidence: Math.max(0, Math.min(100, next.confidence ?? previous.confidence ?? 50)),
    missingInfo: gaps,
  };
}

function buildDecisionGraph(projectState: ProjectState): DecisionNode {
  const constraints = projectState.activeConstraints ?? [];
  const decisions = projectState.preferences ?? [];
  const plan = projectState.executionPlan ?? [];
  const gaps = projectState.missingInfo ?? [];

  return {
    id: "goal",
    label: projectState.systemGoal || "Goal not defined",
    status: projectState.systemGoal ? "active" : "neutral",
    children: [
      {
        id: "constraints",
        label: constraints.length ? `Constraints: ${constraints.join(", ")}` : "Constraints: not locked",
        status: constraints.length ? "active" : "neutral",
      },
      {
        id: "decisions",
        label: decisions.length ? `Decisions: ${decisions.join(", ")}` : "Decisions: pending",
        status: decisions.length ? "reason" : "neutral",
      },
      {
        id: "plan",
        label: plan.length ? `Plan: ${plan[0]}` : "Plan: waiting for next move",
        status: plan.length ? "active" : "neutral",
        children: plan.slice(1, 4).map((step, index) => ({
          id: `plan-${index}`,
          label: step,
          status: "reason",
        })),
      },
      {
        id: "gaps",
        label: gaps.length ? `Gaps: ${gaps.join(", ")}` : "Gaps: none detected",
        status: gaps.length ? "rejected" : "active",
      },
    ],
  };
}

type DecisionSignal = {
  label: string;
  source: string;
  value: number;
  color: string;
};

function decisionSignals(projectState: ProjectState, visibleTimeline: TimelineEventRecord[]): DecisionSignal[] {
  const confidence = projectState.confidence ?? 0;
  const constraints = projectState.activeConstraints?.length ?? 0;
  const decisions = projectState.preferences?.length ?? 0;
  const plan = projectState.executionPlan?.length ?? 0;
  const gaps = projectState.missingInfo?.length ?? 0;

  return [
    {
      label: "Goal clarity",
      source: projectState.systemGoal ? "from current goal" : "waiting for goal",
      value: projectState.systemGoal ? Math.max(42, confidence) : 14,
      color: "var(--chart-1)",
    },
    {
      label: "Decision capture",
      source: `${decisions} decisions`,
      value: Math.min(96, decisions * 22 + visibleTimeline.length * 4 + 8),
      color: "var(--chart-2)",
    },
    {
      label: "Constraint signal",
      source: `${constraints} constraints`,
      value: Math.min(92, constraints * 28 + 10),
      color: "var(--chart-3)",
    },
    {
      label: "Plan readiness",
      source: `${plan} execution steps`,
      value: Math.min(90, plan * 24 + confidence * 0.35),
      color: "var(--chart-4)",
    },
    {
      label: "Open gaps",
      source: gaps ? `${gaps} unresolved` : "none detected",
      value: gaps ? Math.min(72, gaps * 18 + 12) : 6,
      color: "var(--chart-5)",
    },
  ].sort((a, b) => b.value - a.value);
}

function stackedDecisionBars(signals: DecisionSignal[]): number[][] {
  const base = signals.map((signal) => Math.max(4, Math.round(signal.value / 8)));
  return Array.from({ length: 18 }, (_, index) =>
    base.map((value, signalIndex) => {
      const wave = ((index + 1) * (signalIndex + 2)) % 7;
      const ramp = index < 11 ? index * 0.7 : 14 - index * 0.45;
      return Math.max(2, Math.min(18, Math.round(value + wave + ramp)));
    }),
  );
}

function renderDecisionGraphCanvas(
  graph: DecisionNode,
  projectState: ProjectState,
  visibleTimeline: TimelineEventRecord[],
): React.ReactNode {
  const isBlocked = !projectState.systemGoal;
  const signals = decisionSignals(projectState, visibleTimeline);
  const bars = stackedDecisionBars(signals);
  const maxStack = Math.max(...bars.map((bar) => bar.reduce((sum, value) => sum + value, 0)), 1);
  const heatCells = bars.flatMap((bar, barIndex) =>
    bar.slice(0, 3).map((height, signalIndex) => ({
      id: `${barIndex}-${signalIndex}`,
      intensity: Math.min(1, height / 18),
      color: isBlocked ? "var(--destructive)" : (signals[signalIndex]?.color ?? "var(--chart-2)"),
      label: signals[signalIndex]?.label ?? "Signal",
    })),
  );

  return (
    <div className="min-h-full space-y-8 px-1 py-1 text-foreground">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
          Decision Intelligence: {isBlocked ? <span className="text-destructive">BLOCKED</span> : <span className="text-primary">ACTIVE</span>}
        </h2>
        {isBlocked && <p className="mt-1 text-sm text-muted-foreground">No goal &rarr; no decisions &rarr; no execution possible</p>}
      </div>

      {isBlocked && (
        <div className="rounded-md border-2 border-destructive/40 bg-destructive/10 p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-destructive text-destructive">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </span>
            <p className="font-mono text-sm font-bold uppercase tracking-wider text-destructive">Primary Blocker</p>
          </div>
          <p className="mt-2 text-base font-semibold text-destructive">Define the project goal</p>
          <div className="mt-4 border-t border-destructive/20 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Impact:</p>
            <ul className="mt-2 space-y-1.5 text-sm text-destructive/90">
              <li className="flex items-center gap-2"><span>•</span> Decision system inactive</li>
              <li className="flex items-center gap-2"><span>•</span> Planning disabled</li>
              <li className="flex items-center gap-2"><span>•</span> Execution blocked</li>
            </ul>
          </div>
        </div>
      )}

      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <svg className="inline-block h-4 w-4 mr-1 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Decision Diagnostics
        </p>
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-background p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              {projectState.systemGoal ? (
                <span className="flex items-center text-primary">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Goal defined
                </span>
              ) : (
                <span className="flex items-center text-chart-2">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Goal missing
                </span>
              )}
            </p>
            <p className="ml-6 mt-1 text-sm text-muted-foreground">
              &rarr; {projectState.systemGoal ? "Decision foundation active" : "No decisions possible"}
            </p>
          </div>
          <div className="rounded-md bg-background p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              {(projectState.activeConstraints ?? []).length > 0 ? (
                <span className="flex items-center text-primary">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Constraints active
                </span>
              ) : (
                <span className="flex items-center text-chart-2">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  No constraints
                </span>
              )}
            </p>
            <p className="ml-6 mt-1 text-sm text-muted-foreground">
              &rarr; {(projectState.activeConstraints ?? []).length > 0 ? "System optimization enabled" : "Cannot optimize system"}
            </p>
          </div>
          <div className="rounded-md bg-background p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              {(projectState.preferences ?? []).length > 0 ? (
                <span className="flex items-center text-primary">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Decisions recorded
                </span>
              ) : (
                <span className="flex items-center text-chart-2">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  No decisions
                </span>
              )}
            </p>
            <p className="ml-6 mt-1 text-sm text-muted-foreground">
              &rarr; {(projectState.preferences ?? []).length > 0 ? "Execution plan building" : "Execution plan empty"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-md bg-background p-5">
        <div className="mb-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">📉 Decision Progression</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isBlocked ? "Decision system stalled due to missing goal" : "Tracking structural context over time"}
          </p>
        </div>
        <div className="relative h-52 border-b border-border bg-background">
          <div className="absolute inset-0 flex flex-col justify-between pb-6">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="h-px w-full bg-border" />
            ))}
          </div>

          <div className="relative z-10 flex h-full items-end gap-1.5 pb-6 px-2">
            {bars.map((bar, barIndex) => (
              <div key={barIndex} className="group relative flex h-full flex-1 items-end">
                <div
                  className="flex w-full origin-bottom animate-pulse flex-col-reverse overflow-hidden rounded-t-sm transition-all duration-700"
                  style={{ animationDelay: `${barIndex * 70}ms`, animationDuration: "1800ms" }}
                >
                  {bar.map((height, signalIndex) => (
                    <span
                      key={`${barIndex}-${signalIndex}`}
                      className="w-full transition-all duration-700"
                      style={{
                        height: `${(height / maxStack) * 170}px`,
                        backgroundColor: isBlocked
                          ? (signalIndex % 2 === 0 ? "color-mix(in oklab, var(--destructive) 35%, var(--background))" : "var(--destructive)")
                          : (signals[signalIndex]?.color ?? "var(--chart-2)"),
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {isBlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="rounded-md border border-destructive/50 bg-background px-3 py-1.5 text-xs font-semibold text-destructive">
                No decision progression detected
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4 px-2 font-mono text-xs text-muted-foreground">
            <span>Start</span>
            <span>Constraints</span>
            <span>Decisions</span>
            <span className="text-right">Now</span>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Memory Signal Activity</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-destructive" />
            Missing structure &nbsp;
            <span className="ml-2 mr-1 inline-block h-2 w-2 rounded-full bg-primary" />
            Strong decision signals
          </p>
        </div>
        <div className="grid grid-cols-9 gap-1 rounded-md bg-background p-3">
          {heatCells.slice(0, 45).map((cell) => (
            <span
              key={cell.id}
              title={`${isBlocked ? "Missing structure signal" : (cell.label || "Signal active")}`}
              className="h-4 rounded-sm transition-all duration-700 hover:scale-110"
              style={{
                backgroundColor: cell.color,
                opacity: 0.2 + cell.intensity * 0.8,
                boxShadow: cell.intensity > 0.6 ? `0 0 8px ${cell.color}` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function statusLabel(runState: DemoRunState): string {
  if (runState === "starting") return "starting";
  if (runState === "recording") return "live";
  if (runState === "ending") return "ending";
  if (runState === "ended") return "ended";
  return "ready";
}

function micLabel(micState: MicState): string {
  if (micState === "requesting") return "permission pending";
  if (micState === "enabled") return "mic enabled";
  if (micState === "error") return "mic blocked";
  return "mic disabled";
}

function cleanTimelineLabel(value: string): string {
  const lower = value.toLowerCase();
  if (lower === "memory_created" || lower === "memory created") {
    return "Agent turn stored";
  }
  return value.replace(/_/g, " ");
}

function cleanTimelineReason(value: string): string {
  return value
    .replace(/^stored full chat turn with\s*/i, "Stored chat turn with ")
    .replace(/\bagent=[^\s]+\b/g, "active runtime")
    .replace(/\bagent=agent-b\b/g, "handoff model")
    .replace(/\bmodel=/g, "model ")
    .replace(/\bmode=/g, "mode ");
}

function ComposerIcon({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}): React.ReactNode {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function MicIcon(): React.ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function HandoffIcon(): React.ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 7h10l-3-3" />
      <path d="M17 7l-3 3" />
      <path d="M17 17H7l3 3" />
      <path d="M7 17l3-3" />
    </svg>
  );
}

function NextIcon(): React.ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />
    </svg>
  );
}

function GraphIcon(): React.ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4" />
      <path d="M12 16V8" />
      <path d="M16 16v-6" />
    </svg>
  );
}

function SendIcon(): React.ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function speechRecognitionErrorMessage(error: string): string {
  if (error === "network") {
    return "Browser speech recognition could not reach its speech service. Type your message, or try voice again after checking browser/network access.";
  }
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone or speech recognition permission is blocked for this browser.";
  }
  if (error === "audio-capture") {
    return "No microphone input was detected. Check the selected mic device.";
  }
  if (error === "no-speech") {
    return "No speech was detected. Try again or type your message.";
  }
  if (error === "aborted") {
    return "Voice input stopped.";
  }
  return `Speech recognition error: ${error}`;
}

export function RunDemoSection({
  autostart = false,
  autobrief = false,
  initialLayoutMode,
  forceDesktop = false,
}: {
  autostart?: boolean;
  autobrief?: boolean;
  initialLayoutMode?: "agent" | "editor";
  forceDesktop?: boolean;
} = {}) {
  const [runState, setRunState] = useState<DemoRunState>("idle");
  const [micState, setMicState] = useState<MicState>("disabled");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [intakeGoal, setIntakeGoal] = useState("");
  const [intakeOwner, setIntakeOwner] = useState("");
  const [intakeDeadline, setIntakeDeadline] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projectState, setProjectState] = useState<ProjectState>(EMPTY_PROJECT);
  const [mutationHistory, setMutationHistory] = useState<MutationEvent[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventRecord[]>([]);
  const [conversation, setConversation] = useState<DemoMessage[]>([]);
  const [runtimeAgents, setRuntimeAgents] = useState<RuntimeAgent[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentId>("");
  const [isRuntimeAgentsLoading, setIsRuntimeAgentsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "graph">("timeline");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSwitchingAgent, setIsSwitchingAgent] = useState(false);
  const [isNextStepLoading, setIsNextStepLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [lastContractQuality, setLastContractQuality] = useState<VoiceChatResponse["contractQuality"] | null>(null);
  const [sessionIdentity, setSessionIdentity] = useState({ sessionId: "session-pending", threadId: "voice:pending" });
  const [displayUserId, setDisplayUserId] = useState("user-live");
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [isSendingIdePacket, setIsSendingIdePacket] = useState(false);
  const [governancePolicy, setGovernancePolicy] = useState<GovernancePolicy>(DEFAULT_GOVERNANCE_POLICY);
  const [applyCompanyBrainSkills, setApplyCompanyBrainSkills] = useState(true);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const shouldSendTranscriptRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const didAutostartRef = useRef(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const isStarting = runState === "starting";
  const isEnding = runState === "ending";
  const hasActiveSession = Boolean(session && session.status === "active");
  const canStart = runState === "idle" || runState === "ended";
  const canEnd = hasActiveSession && runState !== "ending";
  const micEnabled = micState === "enabled" || micState === "requesting";
  const availableRuntimeAgents = runtimeAgents.length > 0 ? runtimeAgents : [FALLBACK_RUNTIME_AGENT];
  const hasRuntimeAgents = availableRuntimeAgents.length > 0;
  const activeAgentConfig =
    availableRuntimeAgents.find((agent) => agent.id === activeAgent) ?? availableRuntimeAgents[0] ?? FALLBACK_RUNTIME_AGENT;
  const nextAgent: AgentId =
    availableRuntimeAgents.length > 1
      ? availableRuntimeAgents[(availableRuntimeAgents.findIndex((agent) => agent.id === activeAgent) + 1) % availableRuntimeAgents.length]?.id ?? activeAgent
      : activeAgent;
  const decisionGraph = useMemo(() => buildDecisionGraph(projectState), [projectState]);
  const visibleTimeline = useMemo(() => {
    const mutationTimeline = mutationHistory.map((mutation, index) => ({
      id: `${mutation.label}-${mutation.timestamp ?? index}`,
      eventType: cleanTimelineLabel(mutation.label),
      reason: cleanTimelineReason(mutation.detail),
      timestamp: mutation.timestamp ?? nowIso(),
    }));
    return mergeTimeline(
      timelineEvents.map((event) => ({
        ...event,
        eventType: cleanTimelineLabel(event.eventType),
        reason: cleanTimelineReason(event.reason),
      })),
      mutationTimeline,
    );
  }, [mutationHistory, timelineEvents]);

  useEffect(() => {
    let mounted = true;

    async function loadToken(): Promise<void> {
      const token = await getOrCreateMemoryTokenWithRetry({ attempts: 3, delayMs: 250 });
      if (!mounted) return;
      setAuthToken(token);
      const parsedUserId = parseJwtUserId(token);
      if (parsedUserId) setDisplayUserId(parsedUserId);
    }

    void loadToken();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadRuntimeAgents(): Promise<void> {
      try {
        if (mounted) setIsRuntimeAgentsLoading(true);
        const token = await getOrCreateMemoryTokenWithRetry({ attempts: 3, delayMs: 250 });
        if (!token) {
          if (!mounted) return;
          setRuntimeAgents([]);
          setActiveAgent("");
          setErrorMessage("Missing auth token. Sign in again.");
          return;
        }
        const response = await fetch("/api/agents", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json();
        const source = isRecord(payload) && "data" in payload ? (payload as { data?: unknown }).data : payload;
        const list = isRecord(source) && Array.isArray((source as { agents?: unknown }).agents)
          ? (source as { agents: Array<Record<string, unknown>> }).agents
          : [];
        const mapped = list
          .map((agent) => {
            const id = typeof agent.id === "string" ? agent.id : "";
            const label = typeof agent.name === "string" ? agent.name : "Agent";
            const model = typeof agent.runtime === "string" && agent.runtime.trim().length > 0
              ? agent.runtime
              : "openai/gpt-oss-20b:free";
            const description = typeof agent.category === "string" ? agent.category : "Runtime agent";
            if (!id) return null;
            return { id, label, model, description } as RuntimeAgent;
          })
          .filter((item): item is RuntimeAgent => Boolean(item));

        if (!mounted) return;
        setRuntimeAgents(mapped);
        setActiveAgent((current) => (mapped.some((agent) => agent.id === current) ? current : (mapped[0]?.id ?? "")));
      } catch {
        if (!mounted) return;
        setRuntimeAgents([]);
        setActiveAgent("");
      } finally {
        if (mounted) setIsRuntimeAgentsLoading(false);
      }
    }
    void loadRuntimeAgents();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopMediaStream(micStream);
    };
  }, [micStream]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation, isChatLoading]);

  const withAuthorizedToken = useCallback(
    async <T,>(work: (token: string) => Promise<T>): Promise<T> => {
      const cached = authToken ?? readMemoryTokenFromStorage();
      const initialToken = cached ?? (await getOrCreateMemoryTokenWithRetry({ attempts: 3, delayMs: 250 }));
      if (!initialToken) throw new Error("Missing API token. Sign in again so MemoryOS can mint one.");

      setAuthToken(initialToken);
      try {
        return await work(initialToken);
      } catch (error) {
        if (!isUnauthorizedError(error)) throw error;
        const refreshedToken = await fetchMemoryTokenFromBridge();
        if (!refreshedToken) throw error;
        setAuthToken(refreshedToken);
        return work(refreshedToken);
      }
    },
    [authToken],
  );

  const refreshBilling = useCallback(async (): Promise<void> => {
    try {
      const payload = await withAuthorizedToken((token) =>
        fetchMemoryApi<BillingSnapshot>("/api/memory/billing", token),
      );
      setBilling(payload);
    } catch {
      // billing meter is best-effort in the lab UI
    }
  }, [withAuthorizedToken]);

  const syncBillingFromUpgradeError = useCallback((error: unknown): void => {
    if (!(error instanceof ApiRequestError)) return;
    if (!isRecord(error.payload) || !isRecord(error.payload.error)) return;
    if (error.payload.error.code !== "UPGRADE_REQUIRED") return;
    const details = isRecord(error.payload.error.details) ? error.payload.error.details : null;
    if (!details) return;

    const meter = details.meter === "searches" ? "searches" : "tokens";
    const used = typeof details.used === "number" ? details.used : 0;
    const limit = typeof details.limit === "number" ? details.limit : 0;
    const plan = details.plan === "Pro" || details.plan === "Scale" || details.plan === "Enterprise" ? details.plan : "Free";

    setBilling((current) => ({
      currentPlan: plan,
      usage: {
        tokenLimit: meter === "tokens" ? limit : current?.usage.tokenLimit ?? 1_000_000,
        tokenUsed: meter === "tokens" ? used : current?.usage.tokenUsed ?? 0,
        searchLimit: meter === "searches" ? limit : current?.usage.searchLimit ?? 10_000,
        searchUsed: meter === "searches" ? used : current?.usage.searchUsed ?? 0,
        resetInDays: current?.usage.resetInDays ?? 30,
      },
    }));
  }, []);

  useEffect(() => {
    void refreshBilling();
    const timer = window.setInterval(() => {
      void refreshBilling();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [refreshBilling]);

  useEffect(() => {
    const canLoadGovernancePolicy =
      billing?.currentPlan === "Scale" || billing?.currentPlan === "Enterprise";
    if (!canLoadGovernancePolicy) {
      return;
    }

    let mounted = true;
    async function loadGovernancePolicy(): Promise<void> {
      try {
        const payload = await withAuthorizedToken((token) =>
          fetchMemoryApi<{ governance?: GovernancePolicy }>("/api/memory/governance-policy", token),
        );
        if (!mounted || !payload?.governance) return;
        setGovernancePolicy({
          mode: payload.governance.mode ?? DEFAULT_GOVERNANCE_POLICY.mode,
          retentionClass: payload.governance.retentionClass ?? DEFAULT_GOVERNANCE_POLICY.retentionClass,
          ttlHours: payload.governance.ttlHours ?? DEFAULT_GOVERNANCE_POLICY.ttlHours,
          redactSecrets: payload.governance.redactSecrets ?? DEFAULT_GOVERNANCE_POLICY.redactSecrets,
          pinCriticalDecisions:
            payload.governance.pinCriticalDecisions ?? DEFAULT_GOVERNANCE_POLICY.pinCriticalDecisions,
          requireManualReviewForHighRisk:
            payload.governance.requireManualReviewForHighRisk ??
            DEFAULT_GOVERNANCE_POLICY.requireManualReviewForHighRisk,
        });
      } catch {
        // Keep defaults when policy fetch fails.
      }
    }
    void loadGovernancePolicy();
    return () => {
      mounted = false;
    };
  }, [billing?.currentPlan, withAuthorizedToken]);

  const appendSystemMessage = useCallback((text: string): void => {
    setConversation((current) => [
      ...current,
      {
        speaker: "system",
        text,
        createdAt: nowIso(),
      },
    ]);
  }, []);

  const callAgent = useCallback(
    async (message: string, mode: ChatMode, agentId: AgentId): Promise<VoiceChatResponse> => {
      const activeSessionId = session?.sessionId ?? sessionIdentity.sessionId;
      const activeThreadId = session?.threadId ?? sessionIdentity.threadId;
      if (activeSessionId.endsWith("pending") || activeThreadId.endsWith("pending")) {
        throw new Error("Start the Continuity Lab session before sending messages.");
      }

      const agent =
        runtimeAgents.find((entry) => entry.id === agentId) ??
        activeAgentConfig;
      return withAuthorizedToken(async (token) => {
        return fetchMemoryApi<VoiceChatResponse>("/api/memory/voice/chat", token, {
          method: "POST",
          body: JSON.stringify({
            sessionId: activeSessionId,
            message,
            threadId: activeThreadId,
            workspace: WORKSPACE,
            project: PROJECT,
            agentId,
            model: agent.model,
            mode,
            useCompanyBrain: applyCompanyBrainSkills,
            injectedProjectState: projectState,
            governance: governancePolicy,
          }),
        });
      });
    },
    [
      activeAgentConfig,
      applyCompanyBrainSkills,
      governancePolicy,
      projectState,
      runtimeAgents,
      session?.sessionId,
      session?.threadId,
      sessionIdentity.sessionId,
      sessionIdentity.threadId,
      withAuthorizedToken,
    ],
  );

  const applyAgentResponse = useCallback(
    (payload: VoiceChatResponse, agentId: AgentId): void => {
      const timestamp = nowIso();
      const nextState = sanitizeProjectState(payload.projectState, projectState);
      setSession(payload.session);
      setProjectState(nextState);
      setMutationHistory((current) => [
        ...payload.mutations.map((mutation) => ({ ...mutation, timestamp: mutation.timestamp ?? timestamp })),
        ...current,
      ].slice(0, 30));
      setTimelineEvents((current) => mergeTimeline(current, payload.timelineEvents ?? []));
      setLastContractQuality(payload.contractQuality ?? null);
      setConversation((current) => [
        ...current,
        {
          speaker: "assistant",
          text: payload.reply,
          agentId,
          model:
            runtimeAgents.find((entry) => entry.id === agentId)?.model ??
            activeAgentConfig.model,
          tags: payload.acceptedMemories.length > 0 ? ["memory-used"] : ["state-used"],
          createdAt: timestamp,
        },
      ]);
    },
    [activeAgentConfig.model, projectState, runtimeAgents],
  );

  async function startConversation(): Promise<void> {
    setErrorMessage(null);
    setMicError(null);
    setRunState("starting");
    setConversation([]);
    setTimelineEvents([]);
    setProjectState(EMPTY_PROJECT);
    setMutationHistory([]);
    setNextStep(null);
    setActiveAgent(availableRuntimeAgents[0]?.id ?? "");

    const nextSessionId = `session-${crypto.randomUUID().slice(0, 8)}`;
    const nextThreadId = `voice:${crypto.randomUUID().slice(0, 8)}`;
    setSessionIdentity({ sessionId: nextSessionId, threadId: nextThreadId });

    try {
      const payload = await withAuthorizedToken((token) =>
        fetchMemoryApi<StartSessionResponse>("/api/memory/voice/sessions/start", token, {
          method: "POST",
          body: JSON.stringify({
            sessionId: nextSessionId,
            source: "pipecat",
            workspace: WORKSPACE,
            project: PROJECT,
            threadId: nextThreadId,
          }),
        }),
      );
      setSession(payload.session);
      setRunState("recording");
    } catch (error) {
      setRunState("idle");
      setErrorMessage(error instanceof Error ? error.message : "Could not start the live MemoryOS session.");
    }
  }

  useEffect(() => {
    if (!autostart || didAutostartRef.current || !authToken) return;
    if (runState !== "idle" && runState !== "ended") return;
    didAutostartRef.current = true;
    void startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- funnel autostart once when token is ready
  }, [autostart, authToken, runState]);

  async function enableMic(): Promise<void> {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("error");
      setMicError("This browser does not expose microphone permissions.");
      return;
    }

    setMicState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stopMediaStream(micStream);
      setMicStream(stream);
      setMicState("enabled");
    } catch (error) {
      setMicState("error");
      setMicStream(null);
      setMicError(error instanceof Error ? error.message : "Microphone permission was not granted.");
    }
  }

  const disableMic = useCallback(() => {
    shouldSendTranscriptRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    transcriptRef.current = "";
    setIsVoiceRecording(false);
    stopMediaStream(micStream);
    setMicStream(null);
    setMicState("disabled");
    setMicError(null);
  }, [micStream]);

  async function sendTextMessage(overrideText?: string): Promise<void> {
    const text = (overrideText ?? chatInput).trim();
    if (!text || !hasActiveSession || isEnding || isChatLoading) return;

    setChatInput("");
    setErrorMessage(null);
    setIsChatLoading(true);
    setConversation((current) => [
      ...current,
      {
        speaker: "user",
        text,
        agentId: activeAgent,
        createdAt: nowIso(),
      },
    ]);

    try {
      const payload = await callAgent(text, "chat", activeAgent);
      applyAgentResponse(payload, activeAgent);
    } catch (error) {
      syncBillingFromUpgradeError(error);
      const message = error instanceof Error ? error.message : "Agent reply failed.";
      setErrorMessage(message);
      if (/goal intake required/i.test(message)) {
        setIntakeGoal("Build MemoryOS continuity workflow");
        setIntakeOwner("Platform team");
        setIntakeDeadline("End of this sprint");
        setToolsOpen(true);
      }
      setConversation((current) => [
        ...current,
        {
          speaker: "system",
          text: /goal intake required/i.test(message)
            ? "Goal intake required. Send: Goal: <success>; Owner: <name/team>; Deadline: <date/timeframe>."
            : `Agent reply failed: ${message}`,
          createdAt: nowIso(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
      void refreshBilling();
    }
  }

  async function submitGoalIntake(): Promise<void> {
    const goal = intakeGoal.trim();
    const owner = intakeOwner.trim();
    const deadline = intakeDeadline.trim();
    if (!goal || !owner || !deadline) {
      setErrorMessage("Goal intake requires goal, owner, and deadline.");
      return;
    }
    const intakeMessage = `Goal: ${goal}; Owner: ${owner}; Deadline: ${deadline}`;
    await sendTextMessage(intakeMessage);
  }

  async function sendToIdeAgent(): Promise<void> {
    if (!hasActiveSession) return;
    setIsSendingIdePacket(true);
    setErrorMessage(null);
    try {
      const payload = await withAuthorizedToken((token) =>
        fetchMemoryApi<{
          agentsMd: string;
          snapshot: {
            contract?: {
              goal?: string;
              constraints?: string[];
              decisions?: string[];
              open_risks?: string[];
              next_actions?: string[];
            };
          };
        }>(
          `/api/memory/portability/export?workspace=${encodeURIComponent(WORKSPACE)}&project=${encodeURIComponent(PROJECT)}`,
          token,
        ),
      );
      const packet = [
        "# MemoryOS IDE Handoff",
        "",
        "## Contract",
        `Goal: ${payload.snapshot?.contract?.goal ?? projectState.systemGoal ?? "not_set"}`,
        `Constraints: ${(payload.snapshot?.contract?.constraints ?? projectState.activeConstraints ?? []).join(" | ") || "none"}`,
        `Decisions: ${(payload.snapshot?.contract?.decisions ?? projectState.preferences ?? []).join(" | ") || "none"}`,
        `Open Risks: ${(payload.snapshot?.contract?.open_risks ?? projectState.missingInfo ?? []).join(" | ") || "none"}`,
        `Next Actions: ${(payload.snapshot?.contract?.next_actions ?? projectState.executionPlan ?? []).join(" | ") || "none"}`,
        "",
        payload.agentsMd ?? "",
      ].join("\n");
      await navigator.clipboard.writeText(packet);
      appendSystemMessage("IDE handoff packet copied. Paste into your coding agent context.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not generate IDE packet.");
    } finally {
      setIsSendingIdePacket(false);
    }
  }

  async function startVoiceRecording(): Promise<void> {
    if (!hasActiveSession || isEnding || isVoiceRecording) return;
    setMicError(null);

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition is unavailable in this browser. Use text chat or Chrome voice input.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      transcriptRef.current = "";
      shouldSendTranscriptRef.current = true;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("")
          .trim();
        transcriptRef.current = transcript;
        setChatInput(transcript);
      };
      recognition.onerror = (event) => {
        const transcript = transcriptRef.current.trim();
        shouldSendTranscriptRef.current = false;
        setIsVoiceRecording(false);
        recognitionRef.current = null;
        setMicError(speechRecognitionErrorMessage(event.error));
        if (transcript) {
          setChatInput(transcript);
        }
      };
      recognition.onend = () => {
        const transcript = transcriptRef.current.trim();
        const shouldSend = shouldSendTranscriptRef.current;
        shouldSendTranscriptRef.current = false;
        transcriptRef.current = "";
        setIsVoiceRecording(false);
        recognitionRef.current = null;
        if (shouldSend && transcript) void sendTextMessage(transcript);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsVoiceRecording(true);
      setMicState("enabled");
    } catch {
      setMicError("Could not start speech recognition. Use text chat or retry microphone access.");
    }
  }

  function stopVoiceRecording(): void {
    recognitionRef.current?.stop();
  }

  async function generateNextStep(): Promise<void> {
    if (!hasActiveSession || isNextStepLoading) return;
    setErrorMessage(null);
    setIsNextStepLoading(true);
    const prompt =
      "Give the single next execution step from the current MemoryOS project state. Keep it concrete and do not assume a project domain unless MemoryOS already contains one.";
    try {
      const payload = await callAgent(prompt, "next_step", activeAgent);
      applyAgentResponse(payload, activeAgent);
      setNextStep(payload.reply);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not generate next step.");
    } finally {
      setIsNextStepLoading(false);
    }
  }

  async function executeNextStep(): Promise<void> {
    if (!hasActiveSession || isExecuting) return;
    setErrorMessage(null);
    setIsExecuting(true);
    const prompt =
      nextStep ??
      "Execute the next step from the current MemoryOS project state. If the goal is still undefined, ask for the missing project goal instead of inventing one.";
    try {
      const payload = await callAgent(prompt, "execute", activeAgent);
      applyAgentResponse(payload, activeAgent);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not execute next step.");
    } finally {
      setIsExecuting(false);
    }
  }

  async function switchAgent(): Promise<void> {
    if (!hasActiveSession || isSwitchingAgent) return;
    setErrorMessage(null);
    setIsSwitchingAgent(true);

    try {
      let retrievedContext = "";
      try {
        const retrieval = await withAuthorizedToken((token) =>
          fetchMemoryApi<RetrieveResponseData>("/api/memory/retrieve", token, {
            method: "POST",
            body: JSON.stringify({
              question: "Current project goal, constraints, decisions, and next execution step for agent continuation.",
              topK: 8,
              workspace: WORKSPACE,
              project: PROJECT,
              threadId: session?.threadId ?? sessionIdentity.threadId,
            }),
          }),
        );
        retrievedContext = retrieval.memories
          .map((memory) => memory.memory)
          .filter(Boolean)
          .slice(0, 4)
          .join("\n");
      } catch {
        retrievedContext = "Memory retrieval returned no extra context; using injected structured state.";
      }

      const targetAgent = nextAgent;
      appendSystemMessage("Injecting MemoryOS state into the next model.");
      const handoffPrompt = `Continue this project from MemoryOS state only. Retrieved context:\n${retrievedContext}\n\nExpected concise continuation format: Understood, goal, constraint, decision, then continuing execution plan.`;
      const payload = await callAgent(handoffPrompt, "handoff", targetAgent);
      setActiveAgent(targetAgent);
      applyAgentResponse(payload, targetAgent);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Agent switch failed.");
    } finally {
      setIsSwitchingAgent(false);
    }
  }

  async function endConversation(): Promise<void> {
    setRunState("ending");
    setErrorMessage(null);
    shouldSendTranscriptRef.current = false;
    recognitionRef.current?.stop();
    try {
      const activeSessionId = session?.sessionId ?? sessionIdentity.sessionId;
      const payload = await withAuthorizedToken((token) =>
        fetchMemoryApi<EndSessionResponse>("/api/memory/voice/sessions/end", token, {
          method: "POST",
          body: JSON.stringify({
            sessionId: activeSessionId,
            finalSummary: `Session captured ${conversation.length} messages for ${displayUserId}.`,
          }),
        }),
      );
      setSession(payload.session);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not end the session cleanly.");
      setSession((current) => (current ? { ...current, status: "ended", endedAt: nowIso() } : current));
    } finally {
      setRunState("ended");
      disableMic();
    }
  }

  const brandHeader = (
    <div className="flex min-w-0 flex-wrap items-center gap-3 font-mono">
      <span className="inline-flex scale-90 origin-left">
        <MemoryStarLogo tone="white" />
      </span>
      <span className="ml-2 text-sm text-muted-foreground">x</span>
      <span className="inline-flex h-8 w-28 items-center">
        <Image
          src="/pipecat.png"
          alt="Pipecat"
          width={116}
          height={32}
          className="h-8 w-28 object-contain object-left"
          priority
        />
      </span>
    </div>
  );

  const contrastOverrideStyles = (
    <style jsx global>{`
      .run-demo-dark {
        --background: oklch(0 0 0);
        --foreground: oklch(0.985 0 0);
        --card: oklch(0.145 0 0);
        --card-foreground: oklch(0.985 0 0);
        --popover: oklch(0.145 0 0);
        --popover-foreground: oklch(0.985 0 0);
        --primary: oklch(0.55 0.22 264);
        --primary-foreground: oklch(0.985 0 0);
        --secondary: oklch(0.18 0 0);
        --secondary-foreground: oklch(0.985 0 0);
        --muted: oklch(0.18 0 0);
        --muted-foreground: oklch(0.72 0 0);
        --accent: oklch(0.18 0 0);
        --accent-foreground: oklch(0.985 0 0);
        --destructive: oklch(0.704 0.191 22.216);
        --border: oklch(1 0 0 / 12%);
        --input: oklch(1 0 0 / 16%);
        --ring: oklch(0.55 0.22 264);
        --chart-1: oklch(0.55 0.22 264);
        --chart-2: oklch(0.696 0.17 162.48);
        --chart-3: oklch(0.769 0.188 70.08);
        --chart-4: oklch(0.627 0.265 303.9);
        --chart-5: oklch(0.645 0.246 16.439);
        background: var(--background) !important;
        color: var(--foreground) !important;
      }

      .run-demo-dark,
      .run-demo-dark .bg-background,
      .run-demo-dark .bg-card,
      .run-demo-dark .bg-muted {
        background-color: var(--background) !important;
      }

      .run-demo-dark .text-muted-foreground {
        color: var(--muted-foreground) !important;
      }

      .run-demo-dark .text-foreground,
      .run-demo-dark .text-card-foreground {
        color: var(--foreground) !important;
      }

      .run-demo-dark .border,
      .run-demo-dark [class*="border-"] {
        border-color: var(--border) !important;
      }

      .run-demo-dark button,
      .run-demo-dark [role="tab"],
      .run-demo-dark [data-slot="select-trigger"] {
        color: var(--foreground) !important;
      }

      .run-demo-dark [role="tab"],
      .run-demo-dark [data-slot="tabs-list"],
      .run-demo-dark [data-slot="tabs-trigger"] {
        background-color: var(--background) !important;
        color: var(--foreground) !important;
      }

      .run-demo-dark [data-slot="tabs-trigger"][data-state="active"] {
        background-color: var(--primary) !important;
        color: var(--primary-foreground) !important;
      }

      .run-demo-dark [data-slot="select-content"],
      .run-demo-dark [data-slot="select-item"] {
        background-color: var(--background) !important;
        color: var(--foreground) !important;
        border-color: var(--border) !important;
      }

      .run-demo-dark button:disabled {
        opacity: 0.55 !important;
      }
    `}</style>
  );

  async function handleSendMessage(): Promise<void> {
    if (canStart) {
      await startConversation();
    }
    await sendTextMessage();
  }

  return (
    <ContinuityLabSessionView
      canStartSession={canStart}
      isStartingSession={isStarting}
      toolsOpen={toolsOpen}
      onToolsOpenChange={setToolsOpen}
      activeAgent={activeAgent}
      onActiveAgentChange={setActiveAgent}
      availableRuntimeAgents={availableRuntimeAgents}
      hasRuntimeAgents={hasRuntimeAgents}
      isRuntimeAgentsLoading={isRuntimeAgentsLoading}
      hasActiveSession={hasActiveSession}
      isEnding={isEnding}
      canEnd={canEnd}
      onEndConversation={() => void endConversation()}
      onNewChat={() => {
        void (async () => {
          if (canEnd) await endConversation();
          void startConversation();
        })();
      }}
      micError={micError}
      errorMessage={errorMessage}
      workspace={WORKSPACE}
      project={PROJECT}
      threadId={session?.threadId ?? sessionIdentity.threadId}
      autobrief={autobrief}
      onBriefLoaded={(loaded) => {
        if (loaded.currentGoal) {
          setProjectState((current) => ({
            ...current,
            systemGoal: loaded.currentGoal ?? current.systemGoal,
            missingInfo: loaded.openBlockers?.length ? loaded.openBlockers : current.missingInfo,
          }));
        }
      }}
      onAnalyzeRisk={(summary) => {
        appendSystemMessage(summary.length > 400 ? `${summary.slice(0, 400)}…` : summary);
      }}
      conversation={conversation}
      isChatLoading={isChatLoading}
      chatScrollRef={chatScrollRef}
      chatInput={chatInput}
      onChatInputChange={(value) => {
        transcriptRef.current = value;
        setChatInput(value);
      }}
      onSendMessage={() => void handleSendMessage()}
      onKeyDownSend={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          void sendTextMessage();
        }
      }}
      isSwitchingAgent={isSwitchingAgent}
      onSwitchAgent={() => void switchAgent()}
      isNextStepLoading={isNextStepLoading}
      onGenerateNextStep={() => void generateNextStep()}
      onExecuteNextStep={() => void executeNextStep()}
      isExecuting={isExecuting}
      applyCompanyBrainSkills={applyCompanyBrainSkills}
      onToggleCompanyBrainSkills={() => setApplyCompanyBrainSkills((c) => !c)}
      isVoiceRecordingActive={isVoiceRecording}
      onStartVoice={() => void startVoiceRecording()}
      onStopVoice={stopVoiceRecording}
      billing={billing}
      projectState={projectState}
      visibleTimeline={visibleTimeline}
      onSubmitGoalIntake={() => void submitGoalIntake()}
      intakeGoal={intakeGoal}
      onIntakeGoalChange={setIntakeGoal}
      intakeOwner={intakeOwner}
      onIntakeOwnerChange={setIntakeOwner}
      intakeDeadline={intakeDeadline}
      onIntakeDeadlineChange={setIntakeDeadline}
      onSendToIde={() => void sendToIdeAgent()}
      isSendingIdePacket={isSendingIdePacket}
      mutationHistory={mutationHistory}
      initialLayoutMode={initialLayoutMode}
      forceDesktop={forceDesktop}
      onExplainPlan={() =>
        void (async () => {
          if (canStart) await startConversation();
          await sendTextMessage(
            "Explain the current project plan from organizational memory. Include: current goal, open blockers, risky files, and the recommended next step before I write any code.",
          );
        })()
      }
    />
  );
}

