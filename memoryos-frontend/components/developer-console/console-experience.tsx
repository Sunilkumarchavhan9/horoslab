"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { AgentsSection } from "@/components/developer-console/sections/agents-section";
import { ApiKeysSection } from "@/components/developer-console/sections/api-keys-section";
import {
  BenchmarksSection,
  type BenchmarkRunItem,
} from "@/components/developer-console/sections/benchmarks-section";
import { BillingSection } from "@/components/developer-console/sections/billing-section";
import { ConnectorsSection } from "@/components/developer-console/sections/connectors-section";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import { IntegrationsSection } from "@/components/developer-console/sections/integrations-section";
import { ImportsSection } from "@/components/developer-console/sections/imports-section";
import { MemoriesSection } from "@/components/developer-console/sections/memories-section";
import { OverviewSection } from "@/components/developer-console/sections/overview-section";
import { PluginsSection } from "@/components/developer-console/sections/plugins-section";
import { RunDemoSection } from "@/components/developer-console/sections/run-demo-section";
import {
  RequestsSection,
  type RequestSectionEvent,
} from "@/components/developer-console/sections/requests-section";
import { SettingsSection } from "@/components/developer-console/sections/settings-section";
import { TeamSection } from "@/components/developer-console/sections/team-section";
import { fetchMemoryTokenFromBridge, readMemoryTokenFromStorage } from "@/lib/memory-token";

const STORAGE_KEY = "memoryos.developer-console.onboarding";
const DEFAULT_TOTAL_STEPS = 5;
const MEMORYOS_TOTAL_STEPS = 7;

const COMPANY_SIZES = ["Just me", "2-10", "11-50", "51-200", "201-1,000", "1,000+"] as const;

const ENTRY_OPTIONS = [
  {
    id: "plugins",
    title: "Plugins",
    description: "Connect Claude Code, Cursor, OpenCode, or OpenClaw",
    eyebrow: "Best for IDE and agent workflows",
  },
  {
    id: "memoryos",
    title: "MemoryOS API",
    description: "Retrieve, resume, handoff, and continuity APIs",
    eyebrow: "Best for product and platform builds",
  },
] as const;

const USE_CASES = [
  {
    id: "personal-assistant",
    title: "Personal Assistant",
    description: "AI assistants that remember user preferences and context",
    category: "Personal Assistant",
  },
  {
    id: "customer-support",
    title: "Customer Support",
    description: "Support agents with verified solutions and documentation",
    category: "Customer Support",
  },
  {
    id: "legal-assistant",
    title: "Legal Assistant",
    description: "Focus on precedents and current regulations",
    category: "Legal Assistant",
  },
  {
    id: "finance-agent",
    title: "Finance Agent",
    description: "Latest reports and verified financial data",
    category: "Finance Agent",
  },
  {
    id: "healthcare",
    title: "Healthcare",
    description: "Evidence-based guidelines and approved information",
    category: "Healthcare",
  },
  {
    id: "developer-docs",
    title: "Developer Continuity",
    description: "Memory-aware tooling, coding agents, and project recall",
    category: "Developer Docs",
  },
] as const;

const TEMPLATE_TABS = [
  "All",
  "Personal Assistant",
  "Customer Support",
  "Legal Assistant",
  "Finance Agent",
  "Healthcare",
  "Developer Docs",
] as const;

const TEMPLATE_CARDS = [
  {
    id: "general-personal-assistant",
    title: "General Personal Assistant",
    category: "Personal Assistant",
    preview: "{{Company name}} personal assistant. Users save conversations, notes, and daily context.",
  },
  {
    id: "productivity-assistant",
    title: "Productivity Assistant",
    category: "Personal Assistant",
    preview: "{{Company name}} productivity tool. Users save meeting notes, task updates, and plans.",
  },
  {
    id: "general-support-agent",
    title: "General Support Agent",
    category: "Customer Support",
    preview: "{{Company name}} customer support knowledge base. Content includes resolved tickets and SOPs.",
  },
  {
    id: "technical-support-agent",
    title: "Technical Support Agent",
    category: "Customer Support",
    preview: "{{Company name}} technical support. Content includes API docs, error guides, and fixes.",
  },
  {
    id: "general-legal-assistant",
    title: "General Legal Assistant",
    category: "Legal Assistant",
    preview: "{{Company name}} legal knowledge. Content includes contracts, regulations, and case summaries.",
  },
  {
    id: "general-finance-agent",
    title: "General Finance Agent",
    category: "Finance Agent",
    preview: "{{Company name}} financial knowledge. Content includes reports, budgets, and compliance docs.",
  },
  {
    id: "healthcare-assistant",
    title: "Healthcare Assistant",
    category: "Healthcare",
    preview: "{{Company name}} healthcare knowledge. Content includes clinical guidelines and approved references.",
  },
  {
    id: "developer-documentation",
    title: "Continuity API Reference",
    category: "Developer Docs",
    preview: "{{Company name}} developer platform. Content includes retrieve, resume, handoff, and architecture notes.",
  },
  {
    id: "sdk-documentation",
    title: "SDK Quickstart",
    category: "Developer Docs",
    preview: "{{Company name}} SDK reference. Content includes beforeModel, afterModel, and handoff examples.",
  },
] as const;

const PLUGIN_CHOICES = [
  {
    id: "claude-code",
    title: "Claude Code",
    subtitle: "Memory layer for Claude Code",
    accent: "</>",
    benefits: [
      "Semantic search across previous sessions",
      "Auto-capture of coding decisions",
      "Context injection before each prompt",
    ],
    steps: [
      "Open API Keys in the MemoryOS developer console and create a token.",
      "Export `MEMORYOS_API_KEY` in your shell profile.",
      "Add the MemoryOS MCP server to Claude Code.",
      "Run `claude mcp list` and confirm MemoryOS is connected.",
    ],
  },
  {
    id: "opencode",
    title: "OpenCode",
    subtitle: "Memory layer for OpenCode. Enhances your coding assistant with long-term memory capabilities.",
    accent: "[]",
    benefits: [
      "Semantic search across previous sessions",
      "Auto-capture of coding decisions",
      "Context injection before each prompt",
    ],
    steps: [
      "Create an API key from the MemoryOS developer console.",
      "Add `MEMORYOS_API_KEY` to your shell profile.",
      "Install the MemoryOS plugin for OpenCode.",
      "Verify your OpenCode config includes the MemoryOS plugin.",
    ],
  },
  {
    id: "openclaw",
    title: "OpenClaw",
    subtitle: "Memory integration for OpenClaw workflows",
    accent: "<>",
    benefits: [
      "Shared memory across OpenClaw sessions",
      "Fast recall of previous coding actions",
      "Lightweight setup for local tooling",
    ],
    steps: [
      "Create an API key in the MemoryOS developer console.",
      "Add `MEMORYOS_API_KEY` to your environment variables.",
      "Install the OpenClaw adapter package.",
      "Restart OpenClaw and verify the MemoryOS adapter loads.",
    ],
  },
  {
    id: "hermes",
    title: "Hermes",
    subtitle: "Persistent context for Hermes sessions",
    accent: "H",
    benefits: [
      "Session recall between Hermes runs",
      "Persistent workspace context",
      "Fast retrieval for repeated tasks",
    ],
    steps: [
      "Create an API key in the MemoryOS developer console.",
      "Save `MEMORYOS_API_KEY` in your Hermes environment.",
      "Install the Hermes plugin package.",
      "Run a sample retrieve/resume cycle to confirm setup.",
    ],
  },
  {
    id: "cursor",
    title: "Cursor",
    subtitle: "Memory layer for Cursor coding sessions",
    accent: "</>",
    benefits: [
      "Remember decisions across coding sessions",
      "Attach memory to project workflows",
      "Recover context quickly after restarts",
    ],
    steps: [
      "Create an API key in the MemoryOS developer console.",
      "Set `MEMORYOS_API_KEY` in your terminal environment.",
      "Install the Cursor memory integration package.",
      "Open Cursor settings and verify MemoryOS is enabled.",
    ],
  },
] as const;

const PRODUCT_TABS = ["All", "Platform", "Search", "Assistants", "Workflows"] as const;

const PRODUCT_INTEGRATIONS = [
  { id: "api-integration", title: "API Integration", subtitle: "Direct retrieve, resume, and handoff APIs", tab: "Platform", accent: "API" },
  { id: "chatbot", title: "Chatbot", subtitle: "Embed continuity into your assistant", tab: "Assistants", accent: "BOT" },
  { id: "rag", title: "RAG Pipeline", subtitle: "Grounded retrieval with project memory", tab: "Search", accent: "RAG" },
  { id: "copilot", title: "Internal Copilot", subtitle: "Team knowledge and handoff assistant", tab: "Assistants", accent: "CO" },
  { id: "workflow", title: "Automation Workflow", subtitle: "Event-driven continuity sync", tab: "Workflows", accent: "WF" },
  { id: "docs-search", title: "Developer Recall", subtitle: "Search docs, bugs, and prior decisions", tab: "Search", accent: "DR" },
  { id: "playground", title: "Playground", subtitle: "Test continuity flows interactively", tab: "Platform", accent: "PG" },
] as const;

const MEMORY_TAG_OPTIONS = ["project", "debug", "decision", "handoff", "open-loop", "preference"] as const;

const GLITCH_ASCII_PATTERN = Array.from({ length: 18 }, (_, row) =>
  Array.from({ length: 70 }, (_, col) => ["2", "3", "4", "5", "x", "+"][((row * 3) + (col * 5)) % 6]).join(" "),
).join("\n");

const DASHBOARD_NAV = [
  { section: "", items: ["Overview", "Memories", "Requests", "Benchmarks"] },
  { section: "Data", items: ["Connectors", "Integrations", "Imports"] },
  { section: "Developer", items: ["API Keys", "Agents", "Plugins", "Playground"] },
  { section: "Organization", items: ["Team", "Billing", "Settings"] },
] as const;

type EntryPath = (typeof ENTRY_OPTIONS)[number]["id"] | null;
type UseCaseId = (typeof USE_CASES)[number]["id"] | null;
type TemplateTab = (typeof TEMPLATE_TABS)[number];
type ProductTab = (typeof PRODUCT_TABS)[number];
type WizardStep =
  | "organization-select"
  | "org"
  | "entry"
  | "category"
  | "context"
  | "integration"
  | "setup"
  | "dashboard";

type StoredOrganization = {
  id: string;
  name: string;
  plan: "Free Plan";
  docs: number;
  connectors: number;
  tags: number;
  companySize: string | null;
};

type PluginChoice = (typeof PLUGIN_CHOICES)[number];
type ProductIntegration = (typeof PRODUCT_INTEGRATIONS)[number];

function hasPluginSetupDetails(integration: PluginChoice | ProductIntegration): integration is PluginChoice {
  return "steps" in integration && "benefits" in integration;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function totalStepsFor(entryPath: EntryPath) {
  return entryPath === "memoryos" ? MEMORYOS_TOTAL_STEPS : DEFAULT_TOTAL_STEPS;
}

function onboardingStepNumber(step: WizardStep, entryPath: EntryPath) {
  switch (step) {
    case "organization-select":
      return 1;
    case "org":
      return 1;
    case "entry":
      return 2;
    case "category":
      return 3;
    case "context":
      return 4;
    case "integration":
      return entryPath === "plugins" ? 3 : 5;
    case "setup":
      return entryPath === "plugins" ? 4 : 6;
    default:
      return totalStepsFor(entryPath);
  }
}

function nextWizardStep(step: WizardStep, entryPath: EntryPath, integrationSelected: boolean) {
  switch (step) {
    case "organization-select":
      return "org";
    case "org":
      return "entry";
    case "entry":
      return entryPath === "plugins" ? "integration" : "category";
    case "category":
      return "context";
    case "context":
      return "integration";
    case "integration":
      return integrationSelected ? "setup" : "dashboard";
    case "setup":
      return "dashboard";
    default:
      return "dashboard";
  }
}

function previousWizardStep(step: WizardStep, entryPath: EntryPath) {
  switch (step) {
    case "org":
      return "organization-select";
    case "entry":
      return "org";
    case "category":
      return "entry";
    case "context":
      return "category";
    case "integration":
      return entryPath === "plugins" ? "entry" : "context";
    case "setup":
      return "integration";
    default:
      return "organization-select";
  }
}

function IconBadge({ label }: { label: string }) {
  return (
    <div className="grid h-11 w-11 place-items-center rounded-[8px] border border-white/10 bg-[#151515] text-[13px] font-semibold tracking-[0.08em] text-white/90">
      {label}
    </div>
  );
}

function HoverGlitchAsciiBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const target = { x: 50, y: 50, r: 0 };
    const current = { x: 50, y: 50, r: 0 };
    let frameId = 0;

    const updateTargetFromPointer = (clientX: number, clientY: number) => {
      const rect = root.getBoundingClientRect();
      const withinX = clientX >= rect.left && clientX <= rect.right;
      const withinY = clientY >= rect.top && clientY <= rect.bottom;

      if (!withinX || !withinY) {
        target.r = 0;
        return;
      }

      target.x = ((clientX - rect.left) / rect.width) * 100;
      target.y = ((clientY - rect.top) / rect.height) * 100;
      target.r = Math.min(rect.width * 0.16, 220);
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateTargetFromPointer(event.clientX, event.clientY);
    };

    const handlePointerLeave = () => {
      target.r = 0;
    };

    const loop = (time: number) => {
      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;
      current.r += (target.r - current.r) * 0.12;

      const shiftA = Math.sin(time * 0.012) * 10 + Math.cos(time * 0.007) * 4;
      const shiftB = Math.cos(time * 0.009) * 8 - Math.sin(time * 0.014) * 3;
      const flicker = 0.62 + ((Math.sin(time * 0.004) + 1) * 0.12);

      root.style.setProperty("--cursor-x", `${current.x}%`);
      root.style.setProperty("--cursor-y", `${current.y}%`);
      root.style.setProperty("--cursor-r", `${current.r}px`);
      root.style.setProperty("--glitch-shift-a", `${shiftA}px`);
      root.style.setProperty("--glitch-shift-b", `${shiftB}px`);
      root.style.setProperty("--glitch-flicker", `${flicker}`);

      frameId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    frameId = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={
        {
          ["--cursor-x" as const]: "50%",
          ["--cursor-y" as const]: "50%",
          ["--cursor-r" as const]: "0px",
          ["--glitch-shift-a" as const]: "0px",
          ["--glitch-shift-b" as const]: "0px",
          ["--glitch-flicker" as const]: "0.7",
        } as CSSProperties
      }
    >
      <div className="absolute inset-0 bg-[#070707]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.03),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%,rgba(255,255,255,0.01))]" />
      <div className="glitch-reveal absolute inset-0">
        <div className="glitch-halo absolute inset-0" />
        <div className="glitch-layer glitch-layer-a">
          <pre>{GLITCH_ASCII_PATTERN}</pre>
        </div>
        <div className="glitch-layer glitch-layer-b">
          <pre>{GLITCH_ASCII_PATTERN}</pre>
        </div>
        <div className="glitch-layer glitch-layer-c">
          <pre>{GLITCH_ASCII_PATTERN}</pre>
        </div>
        <div className="glitch-scan absolute inset-0" />
      </div>

      <style jsx>{`
        .glitch-reveal {
          opacity: 1;
          -webkit-mask-image: radial-gradient(circle var(--cursor-r) at var(--cursor-x) var(--cursor-y), rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.92) 42%, rgba(0, 0, 0, 0.18) 66%, transparent 78%);
          mask-image: radial-gradient(circle var(--cursor-r) at var(--cursor-x) var(--cursor-y), rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.92) 42%, rgba(0, 0, 0, 0.18) 66%, transparent 78%);
        }

        .glitch-halo {
          background:
            radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03) 42%, transparent 72%),
            radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(114, 164, 255, 0.16), transparent 58%);
          filter: blur(18px);
        }

        .glitch-layer {
          position: absolute;
          inset: -6%;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.92);
          white-space: pre;
          font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 18px;
          line-height: 1.4;
          letter-spacing: 0.16em;
          text-shadow:
            0 0 8px rgba(255, 255, 255, 0.16),
            0 0 20px rgba(255, 255, 255, 0.08);
          opacity: var(--glitch-flicker);
        }

        .glitch-layer pre {
          margin: 0;
          min-width: 120%;
        }

        .glitch-layer-a {
          transform: translateX(var(--glitch-shift-a));
          opacity: calc(var(--glitch-flicker) * 0.95);
          -webkit-mask-image: repeating-linear-gradient(180deg, black 0 12px, transparent 12px 16px, black 16px 28px);
          mask-image: repeating-linear-gradient(180deg, black 0 12px, transparent 12px 16px, black 16px 28px);
        }

        .glitch-layer-b {
          transform: translateX(var(--glitch-shift-b));
          opacity: calc(var(--glitch-flicker) * 0.45);
          filter: blur(0.4px);
          -webkit-mask-image: repeating-linear-gradient(180deg, transparent 0 6px, black 6px 15px, transparent 15px 19px, black 19px 30px);
          mask-image: repeating-linear-gradient(180deg, transparent 0 6px, black 6px 15px, transparent 15px 19px, black 19px 30px);
        }

        .glitch-layer-c {
          transform: translateX(calc(var(--glitch-shift-a) * -0.35));
          opacity: calc(var(--glitch-flicker) * 0.22);
          filter: blur(1.2px);
        }

        .glitch-scan {
          background:
            repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 8px),
            linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          mix-blend-mode: screen;
          opacity: 0.42;
        }
      `}</style>
    </div>
  );
}

function ProgressHeader({ step, entryPath }: { step: WizardStep; entryPath: EntryPath }) {
  const totalSteps = totalStepsFor(entryPath);
  const currentStep = onboardingStepNumber(step, entryPath);
  const progress = `${(currentStep / totalSteps) * 100}%`;

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <MemoryStarLogo tone="white"  />
        </Link>
        <div className="mx-auto hidden w-full max-w-[410px] items-center gap-3 sm:flex">
          <div className="h-1.5 flex-1 rounded-full bg-white/12">
            <div className="h-full rounded-full bg-[#2678ff] transition-[width] duration-300" style={{ width: progress }} />
          </div>
        </div>
        <div className="ml-auto text-[13px] font-medium tracking-[0.14em] text-white/80">
          {currentStep}/{totalSteps}
        </div>
      </div>
      <div className="px-4 pb-4 sm:hidden">
        <div className="h-1.5 rounded-full bg-white/12">
          <div className="h-full rounded-full bg-[#2678ff] transition-[width] duration-300" style={{ width: progress }} />
        </div>
      </div>
    </header>
  );
}

type MemoryListItem = {
  id: string;
  type: string;
  summary: string;
  content: string;
  status: string;
  confidence: number;
  updatedAt: string;
};

type MemoryListResponse = {
  memories: MemoryListItem[];
  count: number;
};

type InsightsResponse = {
  totalsByType: Record<string, number>;
  totalsByStatus: Record<string, number>;
  topSkills: string[];
  activeProjects: string[];
  recentMilestones: string[];
};

type ResumeResponseData = {
  summary: string;
  lastKnownState: string;
  openLoops: string[];
  recommendedNextStep: string;
  usedMemories: Array<{
    id: string;
    content: string;
    summary?: string;
    memoryType?: string;
    updatedAt?: string;
  }>;
};

type HandoffResponseData = {
  summary: string;
  currentState: string;
  openLoops: string[];
  recommendedNextActions: string[];
  keyMemories: Array<{
    id: string;
    content: string;
    summary?: string;
    memoryType?: string;
    updatedAt?: string;
  }>;
};

type MvpStatusResponse = {
  status: string;
  checks?: {
    storesIntegrity?: boolean;
    retrievalConfigLoaded?: boolean;
    baselineReportPresent?: boolean;
    evalPassRateAtLeast90?: boolean;
  };
  metrics?: {
    evalPassRate?: number | null;
    totalEvalCases?: number | null;
  };
  completed?: string[];
  pending?: string[];
};

type RequestHistoryResponse = {
  requests: Array<{
    id: string;
    method: string;
    path: string;
    routeType: string;
    statusCode: number;
    status: "Success" | "Error";
    durationMs: number;
    createdAt: string;
  }>;
};

type TimelineHistoryResponse = {
  count: number;
  events: Array<{
    id: string;
    eventType: string;
    timestamp: string;
  }>;
};

type BenchmarkReportResponse = {
  generatedAt: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  kpis: {
    top3_retrieval_precision: number | null;
    resume_success_rate: number | null;
    contradiction_miss_rate: number | null;
    wrong_merge_rate: number | null;
    p95_retrieve_latency: number | null;
  };
  declaredCasesByType?: {
    retrieve?: number;
    resume?: number;
    contradiction?: number;
  };
  results?: Array<{
    id: string;
    type: "retrieve" | "resume" | "contradiction";
    passed: boolean;
    details?: unknown;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeApiPayload<T>(payload: unknown): T {
  if (
    isRecord(payload) &&
    payload.ok === true &&
    "data" in payload
  ) {
    return payload.data as T;
  }
  return payload as T;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload)) {
    if (typeof payload.error === "string" && payload.error.length > 0) {
      return payload.error;
    }
    if (isRecord(payload.error) && typeof payload.error.message === "string") {
      return payload.error.message;
    }
    if (typeof payload.message === "string" && payload.message.length > 0) {
      return payload.message;
    }
  }
  return fallback;
}

function getConsoleAuthTokenFromEnv(): string | null {
  const envToken =
    process.env.NEXT_PUBLIC_MEMORYOS_CONSOLE_TOKEN ??
    process.env.NEXT_PUBLIC_MEMORYOS_API_TOKEN ??
    null;
  return envToken?.trim() || null;
}

async function getConsoleAuthToken(): Promise<string | null> {
  const storageToken = readMemoryTokenFromStorage();
  if (storageToken) {
    return storageToken;
  }

  const envToken = getConsoleAuthTokenFromEnv();
  if (envToken) {
    return envToken;
  }

  return fetchMemoryTokenFromBridge();
}

async function fetchMemoryApi<T>(
  routePath: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const backendOrigin =
    process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() ??
    "http://localhost:3001";
  const normalizedOrigin = backendOrigin.replace(/\/+$/, "");
  const normalizedPath = routePath.startsWith("/")
    ? routePath
    : `/${routePath}`;
  const requestUrl = /^https?:\/\//i.test(routePath)
    ? routePath
    : `${normalizedOrigin}${normalizedPath}`;

  const response = await fetch(requestUrl, {
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
    throw new Error(
      extractErrorMessage(
        payload,
        `Request failed (${response.status}) for ${requestUrl}`,
      ),
    );
  }

  return normalizeApiPayload<T>(payload);
}

function toPercentLabel(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
}

function summarizeBenchmarkFailure(details: unknown): string {
  if (!isRecord(details)) {
    return "Benchmark case failed.";
  }
  if (Array.isArray(details.missing) && details.missing.length > 0) {
    return `Missing: ${details.missing.join(", ")}`;
  }
  if (
    Array.isArray(details.missingTypes) &&
    details.missingTypes.length > 0
  ) {
    return `Missing types: ${details.missingTypes.join(", ")}`;
  }
  if (
    Array.isArray(details.forbiddenPresentTypes) &&
    details.forbiddenPresentTypes.length > 0
  ) {
    return `Forbidden types present: ${details.forbiddenPresentTypes.join(", ")}`;
  }
  if (typeof details.summary === "string" && details.summary.length > 0) {
    return details.summary;
  }
  return "Benchmark case failed.";
}

function mapBenchmarkReportToRun(report: BenchmarkReportResponse): BenchmarkRunItem {
  const generatedAtMs = new Date(report.generatedAt).getTime();
  const safeGeneratedAtId = Number.isFinite(generatedAtMs)
    ? new Date(generatedAtMs).toISOString()
    : report.generatedAt;
  const failedDetails =
    (report.results ?? [])
      .filter((item) => !item.passed)
      .map((item) => ({
        id: item.id,
        type: item.type,
        reason: summarizeBenchmarkFailure(item.details),
      })) ?? [];

  return {
    id: `run_${safeGeneratedAtId}`,
    generatedAt: report.generatedAt,
    status: report.failedCases > 0 ? "Failed" : "Passed",
    mode: "local",
    totalCases: report.totalCases,
    passedCases: report.passedCases,
    failedCases: report.failedCases,
    passRate: report.passRate,
    top3RetrievalPrecision: report.kpis.top3_retrieval_precision ?? 0,
    resumeSuccessRate: report.kpis.resume_success_rate ?? 0,
    contradictionMissRate: report.kpis.contradiction_miss_rate ?? 0,
    wrongMergeRate: report.kpis.wrong_merge_rate ?? 0,
    p95RetrieveLatencyMs: report.kpis.p95_retrieve_latency,
    suites: {
      retrieve: {
        passed:
          (report.results ?? []).filter(
            (item) => item.type === "retrieve" && item.passed,
          ).length,
        total: report.declaredCasesByType?.retrieve ?? 0,
      },
      resume: {
        passed:
          (report.results ?? []).filter(
            (item) => item.type === "resume" && item.passed,
          ).length,
        total: report.declaredCasesByType?.resume ?? 0,
      },
      contradiction: {
        passed:
          (report.results ?? []).filter(
            (item) => item.type === "contradiction" && item.passed,
          ).length,
        total: report.declaredCasesByType?.contradiction ?? 0,
      },
    },
    failedDetails,
  };
}

function readStoredState() {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as Record<string, string | boolean | null | undefined>;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function DeveloperConsoleExperience() {
  const { user } = useUser();
  const clerk = useClerk();
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const storedState = readStoredState();
  const storedOrganizations = Array.isArray(storedState?.organizations)
    ? (storedState.organizations as StoredOrganization[])
    : [];
  const [step, setStep] = useState<WizardStep>(() => {
    if (storedOrganizations.length > 0 && !storedState?.currentOrganizationId) return "organization-select";
    if (storedState?.completed) return "dashboard";
    if (
      storedState?.step === "organization-select" ||
      storedState?.step === "entry" ||
      storedState?.step === "category" ||
      storedState?.step === "context" ||
      storedState?.step === "integration" ||
      storedState?.step === "setup"
    ) {
      return storedState.step;
    }
    return "org";
  });
  const [orgName, setOrgName] = useState(() => (typeof storedState?.orgName === "string" ? storedState.orgName : ""));
  const [companySize, setCompanySize] = useState<string | null>(() =>
    typeof storedState?.companySize === "string" ? storedState.companySize : null,
  );
  const [entryPath, setEntryPath] = useState<EntryPath>(() =>
    storedState?.entryPath === "plugins" || storedState?.entryPath === "memoryos" ? storedState.entryPath : null,
  );
  const [useCaseId, setUseCaseId] = useState<UseCaseId>(() =>
    typeof storedState?.useCaseId === "string" ? (storedState.useCaseId as UseCaseId) : null,
  );
  const [orgContext, setOrgContext] = useState(() =>
    typeof storedState?.orgContext === "string" ? storedState.orgContext : "",
  );
  const [templateQuery, setTemplateQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(() =>
    typeof storedState?.selectedTemplate === "string" ? storedState.selectedTemplate : null,
  );
  const [templateTab, setTemplateTab] = useState<TemplateTab>("All");
  const [integrationQuery, setIntegrationQuery] = useState("");
  const [productTab, setProductTab] = useState<ProductTab>("All");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(() =>
    typeof storedState?.selectedIntegration === "string" ? storedState.selectedIntegration : null,
  );
  const [organizations, setOrganizations] = useState<StoredOrganization[]>(storedOrganizations);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(() =>
    typeof storedState?.currentOrganizationId === "string" ? storedState.currentOrganizationId : null,
  );
  const [expandedSetupSection, setExpandedSetupSection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showOrganizationMenu, setShowOrganizationMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSupportWidget, setShowSupportWidget] = useState(false);
  const [showSupportComposer, setShowSupportComposer] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [activeDashboardItem, setActiveDashboardItem] = useState("Overview");
  const [memoryLegendExpanded, setMemoryLegendExpanded] = useState(true);
  const [showMemoryTagFilter, setShowMemoryTagFilter] = useState(false);
  const [memoryTagQuery, setMemoryTagQuery] = useState("");
  const [selectedMemoryTags, setSelectedMemoryTags] = useState<string[]>([]);
  const [dashboardDataLoading, setDashboardDataLoading] = useState(false);
  const [dashboardDataError, setDashboardDataError] = useState<string | null>(null);
  const [liveMemories, setLiveMemories] = useState<MemoryListItem[]>([]);
  const [liveInsights, setLiveInsights] = useState<InsightsResponse | null>(null);
  const [liveTimelineCount, setLiveTimelineCount] = useState(0);
  const [liveResume, setLiveResume] = useState<ResumeResponseData | null>(null);
  const [liveHandoff, setLiveHandoff] = useState<HandoffResponseData | null>(null);
  const [liveMvpStatus, setLiveMvpStatus] = useState<MvpStatusResponse | null>(null);
  const [liveRequestEvents, setLiveRequestEvents] = useState<RequestSectionEvent[]>([]);
  const [liveBenchmarkRuns, setLiveBenchmarkRuns] = useState<BenchmarkRunItem[]>([]);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completed: step === "dashboard",
        step,
        orgName,
        companySize,
        entryPath,
        useCaseId,
        orgContext,
        selectedTemplate,
        selectedIntegration,
        organizations,
        currentOrganizationId,
      }),
    );
  }, [
    hydrated,
    step,
    orgName,
    companySize,
    entryPath,
    useCaseId,
    orgContext,
    selectedTemplate,
    selectedIntegration,
    organizations,
    currentOrganizationId,
  ]);

  const selectedUseCase = USE_CASES.find((item) => item.id === useCaseId) ?? null;
  const currentOrganization = organizations.find((organization) => organization.id === currentOrganizationId) ?? null;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "developer@memoryos.local";
  const userDisplayName = currentOrganization?.name ?? user?.firstName ?? user?.username ?? "MemoryOS User";
  const userInitial = userDisplayName.slice(0, 1).toUpperCase();
  const templateCards = useMemo(() => {
    return TEMPLATE_CARDS.filter((card) => {
      const matchesTab = templateTab === "All" || card.category === templateTab;
      const matchesSearch =
        templateQuery.trim().length === 0 ||
        `${card.title} ${card.preview}`.toLowerCase().includes(templateQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [templateQuery, templateTab]);

  const integrationOptions = entryPath === "plugins" ? PLUGIN_CHOICES : PRODUCT_INTEGRATIONS;
  const integrationTab = entryPath === "plugins" ? "All" : productTab;
  const integrationCards = useMemo(() => {
    if (entryPath === "plugins") {
      return PLUGIN_CHOICES.filter((option) => {
        return (
          integrationQuery.trim().length === 0 ||
          `${option.title} ${option.subtitle}`.toLowerCase().includes(integrationQuery.toLowerCase())
        );
      });
    }

    return PRODUCT_INTEGRATIONS.filter((option) => {
      const matchesTab = integrationTab === "All" || option.tab === integrationTab;
      const matchesSearch =
        integrationQuery.trim().length === 0 ||
        `${option.title} ${option.subtitle}`.toLowerCase().includes(integrationQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [entryPath, integrationQuery, integrationTab]);

  const selectedIntegrationDetails =
    integrationOptions.find((integration) => integration.id === selectedIntegration) ?? integrationOptions[0];
  const pluginIntegrationDetails = hasPluginSetupDetails(selectedIntegrationDetails) ? selectedIntegrationDetails : null;
  const activeProjectName = currentOrganization?.name
    ? `${currentOrganization.name} Continuity Workspace`
    : "MemoryOS Continuity Workspace";
  const activeProjectUseCase = selectedUseCase?.title ?? "Developer Continuity";
  const activeProjectIntegration = selectedIntegrationDetails?.title ?? "MemoryOS API";
  const activeProjectEntry = entryPath === "plugins" ? "Plugin / MCP" : "API / Platform";

  useEffect(() => {
    if (!hydrated || step !== "dashboard") {
      return;
    }

    let cancelled = false;
    const workspace = currentOrganization?.name ?? "memoryos";
    const resumePayload = {
      project: activeProjectName,
      question: "What should I resume next for this project?",
      workspace,
    };
    const handoffPayload = {
      project: activeProjectName,
      question: "Generate a continuity handoff for this project.",
      workspace,
    };

    async function loadDashboardData() {
      const token = await getConsoleAuthToken();
      if (!token) {
        if (!cancelled) {
          setDashboardDataError(
            "Sign in first so MemoryOS can mint your API token, or set memoryos.apiToken manually.",
          );
          setDashboardDataLoading(false);
        }
        return;
      }
      const authToken: string = token;

      setDashboardDataLoading(true);
      setDashboardDataError(null);
      setLiveMemories([]);
      setLiveInsights(null);
      setLiveTimelineCount(0);
      setLiveResume(null);
      setLiveHandoff(null);
      setLiveMvpStatus(null);
      setLiveRequestEvents([]);
      setLiveBenchmarkRuns([]);

      const results = await Promise.allSettled([
        fetchMemoryApi<MemoryListResponse>("/api/memory/list?limit=120", authToken),
        fetchMemoryApi<InsightsResponse>("/api/memory/insights", authToken),
        fetchMemoryApi<MvpStatusResponse>("/api/memory/mvp/status", authToken),
        fetchMemoryApi<RequestHistoryResponse>(
          "/api/memory/requests?limit=200&range=all",
          authToken,
        ),
        fetchMemoryApi<TimelineHistoryResponse>("/api/memory/timeline?limit=200", authToken),
        fetchMemoryApi<BenchmarkReportResponse>(
          "/api/memory/benchmark/report",
          authToken,
        ),
        fetchMemoryApi<ResumeResponseData>("/api/memory/resume", authToken, {
          method: "POST",
          body: JSON.stringify(resumePayload),
        }),
        fetchMemoryApi<HandoffResponseData>("/api/memory/handoff", authToken, {
          method: "POST",
          body: JSON.stringify(handoffPayload),
        }),
      ]);

      if (cancelled) {
        return;
      }

      const [
        memoriesResult,
        insightsResult,
        mvpStatusResult,
        requestsResult,
        timelineResult,
        benchmarkResult,
        resumeResult,
        handoffResult,
      ] = results;

      if (memoriesResult.status === "fulfilled") {
        setLiveMemories(
          [...memoriesResult.value.memories].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        );
      }

      if (insightsResult.status === "fulfilled") {
        setLiveInsights(insightsResult.value);
      }

      if (mvpStatusResult.status === "fulfilled") {
        setLiveMvpStatus(mvpStatusResult.value);
      }

      if (requestsResult.status === "fulfilled") {
        setLiveRequestEvents(
          requestsResult.value.requests.map((entry) => ({
            id: entry.id,
            createdAt: entry.createdAt,
            type: entry.routeType,
            status: entry.status,
            latencyMs: entry.durationMs,
            route: entry.path,
            method: entry.method,
            statusCode: entry.statusCode,
          })),
        );
      }

      if (timelineResult.status === "fulfilled") {
        setLiveTimelineCount(timelineResult.value.count ?? 0);
      }

      if (benchmarkResult.status === "fulfilled") {
        setLiveBenchmarkRuns([mapBenchmarkReportToRun(benchmarkResult.value)]);
      } else {
        setLiveBenchmarkRuns([]);
      }

      if (resumeResult.status === "fulfilled") {
        setLiveResume(resumeResult.value);
      }

      if (handoffResult.status === "fulfilled") {
        setLiveHandoff(handoffResult.value);
      }

      const firstError = results.find(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      if (firstError) {
        setDashboardDataError(firstError.reason instanceof Error ? firstError.reason.message : "Some live dashboard data could not be loaded.");
      } else {
        setDashboardDataError(null);
      }

      setDashboardDataLoading(false);
    }

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [hydrated, step, currentOrganization?.name, activeProjectName, dashboardRefreshKey]);

  const hasLiveContinuityData =
    liveMemories.length > 0 || Boolean(liveResume) || Boolean(liveHandoff);
  const currentSummary =
    liveHandoff?.summary ??
    liveResume?.summary ??
    "No live project summary yet. Save one real project update to generate continuity state.";
  const lastKnownState =
    liveResume?.lastKnownState ??
    liveHandoff?.currentState ??
    "No live state yet. Run a retrieve/resume cycle from Playground to populate current state.";
  const nextRecommendedAction =
    liveResume?.recommendedNextStep ??
    liveHandoff?.recommendedNextActions?.[0] ??
    "Run /api/memory/process with a real update, then generate a handoff to validate end-to-end continuity.";
  const openLoops =
    (liveResume?.openLoops && liveResume.openLoops.length > 0
      ? liveResume.openLoops
      : liveHandoff?.openLoops && liveHandoff.openLoops.length > 0
        ? liveHandoff.openLoops
        : ["No open loops yet. Add a live update to create actionable follow-ups."]
    ).slice(0, 4);

  const activeProjectStatus = dashboardDataLoading
    ? "Syncing"
    : dashboardDataError
      ? "Needs attention"
      : hasLiveContinuityData
        ? "Live"
        : "Awaiting first memory";
  const activeProjectLastUpdated = (() => {
    const updatedAt =
      liveMemories[0]?.updatedAt ??
      liveRequestEvents[0]?.createdAt ??
      liveBenchmarkRuns[0]?.generatedAt ??
      null;
    if (!updatedAt) return "During onboarding";
    const date = new Date(updatedAt);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString()
      : "During onboarding";
  })();

  const activeWorkstreams = [
    {
      title: "Continuity setup",
      status:
        liveMvpStatus?.checks?.storesIntegrity &&
        liveMvpStatus?.checks?.retrievalConfigLoaded
          ? "Ready"
          : "Pending",
      detail:
        "Project metadata, integration surface, and continuity checks are configured.",
    },
    {
      title: "First memory capture",
      status: liveMemories.length > 0 ? "Ready" : "Pending",
      detail:
        "Store at least one real work update so resume flows have project state.",
    },
    {
      title: "Handoff validation",
      status:
        liveHandoff?.keyMemories && liveHandoff.keyMemories.length > 0
          ? "Ready"
          : "Pending",
      detail:
        "Generate and inspect a handoff for another human or coding agent.",
    },
  ];

  const recentMemories =
    liveMemories.length > 0
      ? liveMemories.slice(0, 3).map((memory) => ({
          type: memory.type.slice(0, 1).toUpperCase() + memory.type.slice(1),
          detail: memory.summary || memory.content,
          confidence:
            memory.confidence <= 1
              ? memory.confidence.toFixed(2)
              : (memory.confidence / 100).toFixed(2),
        }))
      : [];

  const latestHandoff =
    liveHandoff && liveHandoff.keyMemories.length > 0
      ? {
          title: "Latest handoff generated",
          detail: liveHandoff.summary,
          status: "Ready",
        }
      : {
          title: "No handoff generated yet",
          detail:
            "Create the first handoff after a retrieve/resume run to preserve current state, open loops, and next actions.",
          status: "Pending",
        };

  const handoffUsedMemories =
    liveHandoff?.keyMemories && liveHandoff.keyMemories.length > 0
      ? liveHandoff.keyMemories.slice(0, 6).map((memory) => ({
          id: memory.id,
          type: memory.memoryType ?? "memory",
          content: memory.summary ?? memory.content,
          updatedAt: memory.updatedAt ?? "",
        }))
      : liveResume?.usedMemories && liveResume.usedMemories.length > 0
        ? liveResume.usedMemories.slice(0, 6).map((memory) => ({
            id: memory.id,
            type: memory.memoryType ?? "memory",
            content: memory.summary ?? memory.content,
            updatedAt: memory.updatedAt ?? "",
          }))
        : [];

  const handoffRequestEvents = liveRequestEvents
    .filter((request) => request.route.includes("/api/memory/handoff"))
    .slice(0, 6)
    .map((request) => ({
      id: request.id,
      createdAt: request.createdAt,
      status: request.status,
      route: request.route,
      latencyMs: request.latencyMs,
    }));

  const handoffRecommendedActions =
    liveHandoff?.recommendedNextActions && liveHandoff.recommendedNextActions.length > 0
      ? liveHandoff.recommendedNextActions.slice(0, 4)
      : [nextRecommendedAction];

  const latestBenchmark = liveBenchmarkRuns[0] ?? null;
  const qualityStatus: [string, string][] = latestBenchmark
    ? [
        [
          "Retrieve quality",
          toPercentLabel(latestBenchmark.top3RetrievalPrecision),
        ],
        [
          "Resume quality",
          toPercentLabel(latestBenchmark.resumeSuccessRate),
        ],
        [
          "Contradiction miss rate",
          toPercentLabel(latestBenchmark.contradictionMissRate),
        ],
      ]
    : [
        ["Retrieve quality", "No run yet"],
        ["Resume quality", "No run yet"],
        ["Contradiction miss rate", "No run yet"],
      ];

  const integrationHealth: [string, string][] = [
    ["Primary surface", activeProjectIntegration],
    ["Entry path", activeProjectEntry],
    [
      "MVP status",
      liveMvpStatus?.status ? liveMvpStatus.status.replace("_", " ") : "Unknown",
    ],
  ];

  const recentRequests =
    liveRequestEvents.length > 0
      ? liveRequestEvents.slice(0, 3).map((request) => ({
          method: request.type,
          detail: `${request.method} ${request.route} · ${request.latencyMs}ms`,
          state: request.status,
        }))
      : [];

  const memoryStats: [string, string][] = [
    ["Memories", `${liveMemories.length}`],
    [
      "Project facts",
      `${liveMemories.filter((memory) => memory.type === "project").length}`,
    ],
    ["Open loops", `${openLoops.length}`],
    ["Connections", `${liveInsights?.activeProjects?.length ?? 0}`],
    ["Timeline events", `${liveTimelineCount}`],
  ];
  const memoryRelations = [
    { label: "Derives", tone: "bg-[#ffd34d]" },
    { label: "Updates", tone: "bg-[#9b7bff]" },
    { label: "Extends", tone: "bg-[#4bb7ff]" },
    { label: "Contradicts", tone: "bg-[#ff6d6d]" },
  ];
  const memoryStatuses = [
    { label: "Recent (< 24h)", tone: "border-[#14c38e] text-[#8ce6c7]" },
    { label: "Active", tone: "border-[#2678ff] text-[#8bb5ff]" },
    { label: "Needs review", tone: "border-[#f0b429] text-[#ffd27a]" },
    { label: "Forgotten", tone: "border-[#ff6d6d] text-[#ff9a9a]" },
  ];
  const filteredMemoryTagOptions = useMemo(
    () => MEMORY_TAG_OPTIONS.filter((tag) => tag.includes(memoryTagQuery.toLowerCase())),
    [memoryTagQuery],
  );

  const canContinue =
    step === "org"
      ? orgName.trim().length > 1 && Boolean(companySize)
      : step === "entry"
        ? Boolean(entryPath)
        : step === "category"
          ? Boolean(useCaseId)
          : step === "context"
            ? true
            : step === "integration"
              ? Boolean(selectedIntegration)
              : true;

  async function advance(skip = false) {
    if (!skip && !canContinue) return;

    setIsSaving(true);
    await sleep(520);
    setIsSaving(false);
    setStep(nextWizardStep(step, entryPath, Boolean(selectedIntegration) && !skip));
  }

  async function completeOnboarding() {
    setIsSaving(true);
    await sleep(600);
    setIsSaving(false);
    const newOrganization: StoredOrganization = {
      id: `${Date.now()}`,
      name: orgName.trim() || "Untitled Organization",
      plan: "Free Plan",
      docs: 0,
      connectors: 0,
      tags: 0,
      companySize,
    };
    setOrganizations((current) => [...current, newOrganization]);
    setCurrentOrganizationId(newOrganization.id);
    setActiveDashboardItem("Overview");
    setStep("dashboard");
  }

  function goBack() {
    if (step === "org" || step === "dashboard" || isSaving) return;
    setStep(previousWizardStep(step, entryPath));
  }

  function startNewOrganization() {
    setOrgName("");
    setCompanySize(null);
    setEntryPath(null);
    setUseCaseId(null);
    setOrgContext("");
    setTemplateQuery("");
    setSelectedTemplate(null);
    setIntegrationQuery("");
    setSelectedIntegration(null);
    setExpandedSetupSection(1);
    setCurrentOrganizationId(null);
    setActiveDashboardItem("Overview");
    setShowOrganizationMenu(false);
    setStep("org");
  }

  function selectOrganization(organizationId: string) {
    setCurrentOrganizationId(organizationId);
    setActiveDashboardItem("Overview");
    setShowOrganizationMenu(false);
    setStep("dashboard");
  }

  async function seedFirstWorkspaceMemory() {
    const token = await getConsoleAuthToken();
    if (!token) {
      setDashboardDataError(
        "Sign in first so MemoryOS can mint your API token, or set memoryos.apiToken manually.",
      );
      return;
    }

    const workspace = currentOrganization?.name ?? "memoryos";
    const workspaceSlug = workspace.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 48) || "memoryos";

    setIsSeedingFirstMemory(true);
    setDashboardDataError(null);

    try {
      await fetchMemoryApi("/api/memory/process", token, {
        method: "POST",
        body: JSON.stringify({
          threadId: `projects-seed-${workspaceSlug}-${Date.now()}`,
          workspace,
          project: activeProjectName,
          message:
            "Seeded from Developer Console Projects. This workspace is now live for retrieve, resume, and handoff continuity flows.",
        }),
      });
      setDashboardRefreshKey((current) => current + 1);
    } catch (error) {
      setDashboardDataError(
        error instanceof Error ? error.message : "Failed to seed first workspace memory.",
      );
    } finally {
      setIsSeedingFirstMemory(false);
    }
  }

  function renderDashboardMain() {
    if (activeDashboardItem === "Overview") {
      return (
        <OverviewSection
          actions={{
            "Quick Start": () => setActiveDashboardItem("Integrations"),
            "Run Demo": () => window.open("/run-demo", "_blank", "noopener,noreferrer"),
            Playground: () => window.open("/playground", "_blank", "noopener,noreferrer"),
            Documentation: () => setActiveDashboardItem("Integrations"),
          }}
        />
      );
    }

    if (activeDashboardItem === "Memories") {
      return (
        <MemoriesSection
          selectedMemoryTags={selectedMemoryTags}
          workspaceName={currentOrganization?.name ?? "MemoryOS"}
          showMemoryTagFilter={showMemoryTagFilter}
          memoryLegendExpanded={memoryLegendExpanded}
          memoryTagQuery={memoryTagQuery}
          filteredMemoryTagOptions={filteredMemoryTagOptions}
          memoryStats={memoryStats}
          memoryRelations={memoryRelations}
          memoryStatuses={memoryStatuses}
          onToggleLegend={() => setMemoryLegendExpanded((current) => !current)}
          onOpenTagFilter={() => setShowMemoryTagFilter(true)}
          onCloseTagFilter={() => setShowMemoryTagFilter(false)}
          onApplyTagFilter={() => setShowMemoryTagFilter(false)}
          onResetTagFilter={() => {
            setSelectedMemoryTags([]);
            setMemoryTagQuery("");
            setShowMemoryTagFilter(false);
          }}
          onTagQueryChange={setMemoryTagQuery}
          onToggleTag={(tag: string) =>
            setSelectedMemoryTags((current) =>
              current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
            )
          }
        />
      );
    }

    if (activeDashboardItem === "Requests") {
      return (
        <RequestsSection
          requestEvents={liveRequestEvents}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
        />
      );
    }

    if (activeDashboardItem === "Benchmarks") {
      return (
        <BenchmarksSection
          runs={liveBenchmarkRuns}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
        />
      );
    }

    if (activeDashboardItem === "Connectors") {
      return <ConnectorsSection />;
    }

    if (activeDashboardItem === "Integrations") {
      return <IntegrationsSection />;
    }

    if (activeDashboardItem === "Run Demo" || activeDashboardItem === "RunDemo") {
      return <RunDemoSection />;
    }

    if (activeDashboardItem === "Imports") {
      return <ImportsSection />;
    }

    if (activeDashboardItem === "API Keys") {
      return <ApiKeysSection />;
    }

    if (activeDashboardItem === "Agents") {
      return <AgentsSection />;
    }

    if (activeDashboardItem === "Plugins") {
      return <PluginsSection />;
    }

    if (activeDashboardItem === "Team") {
      return (
        <TeamSection
          workspaceName={currentOrganization?.name ?? "MemoryOS"}
          ownerName={userDisplayName}
          ownerEmail={userEmail}
          plan="Free"
        />
      );
    }

    if (activeDashboardItem === "Billing") {
      return <BillingSection workspaceName={currentOrganization?.name ?? "MemoryOS"} currentPlan="Free" />;
    }

    if (activeDashboardItem === "Settings") {
      return (
        <SettingsSection
          workspaceName={currentOrganization?.name ?? "MemoryOS"}
          ownerName={userDisplayName}
          ownerEmail={userEmail}
          organizationId={currentOrganization?.id ?? ""}
        />
      );
    }

    return (
      <>
        <h1 className="text-[22px] font-semibold tracking-[-0.05em]">{activeDashboardItem}</h1>
        <div className="mt-4 rounded-[10px] border border-dashed border-white/12 bg-[#151515] px-6 py-8">
          <p className="text-[15px] leading-7 text-white/56">
            {activeDashboardItem} is next in the console buildout. We&apos;ve wired the navigation now, and this section can be
            filled with MemoryOS-specific workflows after Projects.
          </p>
        </div>
      </>
    );
  }

  async function handleSignOut() {
    setCurrentOrganizationId(null);
    setShowAccountMenu(false);
    setShowOrganizationMenu(false);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completed: true,
        step: "organization-select",
        organizations,
        currentOrganizationId: null,
      }),
    );
    await clerk.signOut({ redirectUrl: "/developer-console/sign-in" });
  }

  if (!hydrated) {
    return <div className="min-h-svh bg-[#070707]" />;
  }

  if ((step === "organization-select" || (step === "dashboard" && organizations.length > 0 && !currentOrganizationId)) && organizations.length > 0) {
    return (
      <div className="relative min-h-svh overflow-hidden bg-[#070707] px-4 py-10 text-white sm:px-6 lg:px-8">
        <HoverGlitchAsciiBackground />
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-80px)] max-w-[760px] flex-col items-center justify-center">
          <div className="mb-8">
            <MemoryStarLogo tone="white" />
          </div>
          <h1 className="text-center text-[34px] font-semibold tracking-[-0.05em] sm:text-[44px]">
            Select an organization
          </h1>
          <p className="mt-3 text-center text-[16px] leading-7 text-white/56 sm:text-[18px]">
            Choose which organization you&apos;d like to work with.
          </p>

          <div className="mt-12 w-full space-y-3">
            {organizations.map((organization) => (
              <button
                key={organization.id}
                type="button"
                onClick={() => selectOrganization(organization.id)}
                className="flex w-full items-center justify-between gap-4 rounded-[8px] border border-white/10 bg-[#0f0f0f] px-5 py-5 text-left transition hover:border-white/20 hover:bg-[#141414]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-[#2678ff] text-[22px] font-semibold">
                    {organization.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[26px] font-semibold tracking-[-0.04em]">{organization.name}</p>
                    <p className="mt-1 text-[15px] text-white/34">
                      {organization.connectors} connectors · {organization.docs} docs · {organization.tags} tags
                    </p>
                  </div>
                </div>
                <span className="rounded-[6px] bg-[#2b2b2b] px-3 py-2 font-mono text-[13px] text-white/74">
                  {organization.plan}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={startNewOrganization}
            className="mt-10 rounded-[8px] border border-white/12 px-6 py-4 text-[18px] font-medium tracking-[0.06em] text-white transition hover:border-white/24 hover:bg-white/5"
          >
            + CREATE NEW ORGANIZATION
          </button>
        </div>
      </div>
    );
  }

  if (step === "dashboard") {
    return (
      <div className="h-dvh overflow-hidden bg-[#080808] text-white lg:grid lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col border-b border-white/10 bg-[#111111] lg:h-dvh lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 px-4 pt-[clamp(9px,1vh,11px)] pb-[clamp(14px,1.5vh,18px)] sm:px-5 lg:px-4">
            <Link href="/">
              <div className="origin-left scale-100">
                <MemoryStarLogo tone="white" />
              </div>
            </Link>
          </div>

          <div className="px-4 pb-[clamp(7px,0.8vh,10px)] sm:px-5 lg:px-4 mt-5">
            <div className="rounded-[8px] border border-white/8 bg-[#181818] px-4 py-[clamp(8px,0.9vh,10px)] text-[14px] text-white/50">
              Search...
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-[clamp(9px,1vh,13px)] overflow-y-auto px-4 pb-4 sm:px-5 lg:px-4">
            {DASHBOARD_NAV.map((group) => (
              <div key={group.section || "main"}>
                {group.section ? (
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/32">
                    {group.section}
                  </p>
                ) : null}
                <div className="space-y-[3px]">
                  {group.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (item === "Playground") {
                          window.open("/playground", "_blank", "noopener,noreferrer");
                          return;
                        }

                        setActiveDashboardItem(item);
                      }}
                      className={`flex w-full items-center rounded-[8px] px-4 py-[clamp(6px,0.7vh,8px)] text-left text-[14px] leading-[1.25] transition ${
                        item === activeDashboardItem
                          ? "bg-[#232323] font-semibold text-white"
                          : "text-white/72 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-col overflow-hidden">
          <div className="border-b border-white/10 px-4 py-[clamp(9px,1vh,11px)] sm:px-5 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrganizationMenu((current) => !current);
                    setShowAccountMenu(false);
                  }}
                  className="flex items-center gap-2 rounded-[8px] px-2.5 py-1 transition hover:bg-white/5"
                >
                  <span className="text-[17px] font-semibold tracking-[-0.04em] uppercase">
                    {currentOrganization?.name ?? "MEMORYOS"}
                  </span>
                  <span className="rounded-[6px] border border-white/10 px-2 py-0.5 text-[10px] tracking-[0.14em] text-white/56">
                    FREE
                  </span>
                  <span className="text-white/56">⌄</span>
                </button>

                {showOrganizationMenu ? (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[336px] overflow-hidden rounded-[8px] border border-white/10 bg-[#1d1d1d] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                    {organizations.map((organization) => (
                      <button
                        key={organization.id}
                        type="button"
                        onClick={() => selectOrganization(organization.id)}
                        className="flex w-full items-center justify-between gap-4 border-b border-white/8 px-4 py-4 text-left transition hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#2a2a2a] text-[14px] font-semibold">
                            {organization.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[17px] font-semibold">{organization.name}</p>
                            <p className="text-[13px] text-white/42">Free</p>
                          </div>
                        </div>
                        {organization.id === currentOrganizationId ? <span className="text-[#4f93ff]">✓</span> : null}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={startNewOrganization}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left text-[16px] font-medium transition hover:bg-white/5"
                    >
                      <span className="text-[22px] leading-none">+</span>
                      Create organization
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-4 text-[13px] font-medium tracking-[0.08em] text-white/78">
                <a href="#" className="hover:text-white">DOCS</a>
                <button type="button" onClick={() => setShowSupportWidget(true)} className="hover:text-white">
                  SUPPORT
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu((current) => !current);
                      setShowOrganizationMenu(false);
                    }}
                    className="grid h-10 w-10 place-items-center rounded-full bg-[#2a2a2a] text-[14px] font-semibold"
                  >
                    {userInitial}
                  </button>
                  {showAccountMenu ? (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[296px] overflow-hidden rounded-[8px] border border-white/10 bg-[#1d1d1d] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                      <div className="border-b border-white/8 px-4 py-4">
                        <p className="text-[22px] font-semibold">{userDisplayName}</p>
                        <p className="mt-1 text-[14px] text-white/34">{userEmail}</p>
                      </div>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 border-b border-white/8 px-4 py-4 text-left text-[16px] font-medium transition hover:bg-white/5"
                      >
                        Account settings
                      </button>
                      <div className="border-b border-white/8 px-4 py-3">
                        <div className="grid grid-cols-3 gap-2 rounded-[8px] border border-white/10 bg-[#262626] p-1 text-[14px] text-white/34">
                          <div className="rounded-[6px] px-3 py-2 text-center">Light</div>
                          <div className="rounded-[6px] px-3 py-2 text-center">Dark</div>
                          <div className="rounded-[6px] bg-[#1c1c1c] px-3 py-2 text-center text-white">System</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-4 text-left text-[16px] font-medium text-[#ff7d7d] transition hover:bg-white/5"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="memoryos-console-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
            <div className="mx-auto w-full max-w-[1360px]">
              {renderDashboardMain()}
            </div>
          </div>
        </main>

        {showSupportWidget ? (
          <div className="fixed bottom-5 right-5 z-30 w-[min(520px,calc(100vw-24px))] overflow-hidden rounded-[10px] border border-white/10 bg-[#0d0d0d] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            {!showSupportComposer ? (
              <div className="p-8">
                <button
                  type="button"
                  onClick={() => setShowSupportWidget(false)}
                  className="absolute right-5 top-5 text-[28px] text-white/52"
                >
                  ×
                </button>
                <div className="grid h-16 w-16 place-items-center rounded-[8px] bg-[#1a1f2a]">
                  <MemoryStarLogo tone="white" />
                </div>
                <h3 className="mt-10 text-[46px] font-semibold leading-[1.02] tracking-[-0.06em]">
                  Hey {currentOrganization?.name ?? "there"}
                  <br />
                  How can we help?
                </h3>
                <button type="button" className="mt-8 text-[20px] font-medium text-white/86">
                  View documentation
                </button>
                <button
                  type="button"
                  onClick={() => setShowSupportComposer(true)}
                  className="mt-8 flex h-20 w-full items-center rounded-[8px] border-2 border-[#2678ff] px-6 text-[22px] font-medium text-white/84"
                >
                  Start a conversation
                </button>
                <p className="mt-3 text-center text-[14px] text-white/34">Powered by Plain</p>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowSupportComposer(false)}
                    className="text-[28px] text-white/62"
                  >
                    ‹
                  </button>
                  <p className="text-[30px] font-semibold tracking-[-0.04em]">Send us a message</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupportComposer(false);
                      setShowSupportWidget(false);
                    }}
                    className="text-[28px] text-white/62"
                  >
                    ×
                  </button>
                </div>
                <p className="mx-auto mt-20 max-w-[420px] text-center text-[18px] leading-8 text-white/46">
                  We&apos;re happy to help. Message us whenever you need and we&apos;ll get back to you as soon as possible.
                </p>
                <div className="mt-24 rounded-[8px] border-2 border-[#5d60ff] p-4">
                  <textarea
                    value={supportMessage}
                    onChange={(event) => setSupportMessage(event.target.value)}
                    placeholder="Start typing"
                    className="min-h-[120px] w-full resize-none bg-transparent text-[18px] text-white outline-none placeholder:text-white/30"
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[22px] text-white/70">
                      <span>⌂</span>
                      <span className="font-semibold">B</span>
                      <span className="italic">I</span>
                      <span>{"</>"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!supportMessage.trim()) return;
                        setSupportMessage("");
                        setShowSupportComposer(false);
                        setShowSupportWidget(false);
                      }}
                      className="rounded-[8px] bg-[#2678ff] px-6 py-3 text-[18px] font-medium text-white disabled:opacity-50"
                      disabled={!supportMessage.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-center text-[14px] text-white/34">Powered by Plain</p>
              </div>
            )}
          </div>
        ) : null}

        <style jsx>{`
          .memoryos-console-scroll {
            scrollbar-width: thin;
            scrollbar-color: #1f1f1f #070707;
          }

          .memoryos-console-scroll::-webkit-scrollbar {
            width: 10px;
          }

          .memoryos-console-scroll::-webkit-scrollbar-track {
            background: #070707;
          }

          .memoryos-console-scroll::-webkit-scrollbar-thumb {
            background: #1f1f1f;
            border-radius: 999px;
            border: 2px solid #070707;
          }

          .memoryos-console-scroll::-webkit-scrollbar-thumb:hover {
            background: #2a2a2a;
          }

          .memoryos-console-scroll::-webkit-scrollbar-button {
            background: #070707;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-[#070707] text-white">
      <ProgressHeader step={step} entryPath={entryPath} />

      <div className="mx-auto flex min-h-[calc(100svh-89px)] w-full max-w-[1440px] flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex-1 py-8 sm:py-10 lg:py-14">
          {step === "org" ? (
            <section className="mx-auto max-w-[920px]">
              <div className="text-center">
                <h1 className="text-balance text-[36px] font-semibold tracking-[-0.05em] sm:text-[44px]">
                  Create Your Organization
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-white/56 sm:text-[18px]">
                  Set up your team&apos;s workspace in MemoryOS.
                </p>
              </div>

              <div className="mx-auto mt-12 max-w-[760px]">
                <label className="block text-[15px] font-medium text-white/84">
                  Organization name <span className="text-[#ff6b6b]">*</span>
                </label>
                <input
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  placeholder="Acme Inc."
                  className="mt-4 h-14 w-full rounded-[8px] border border-white/10 bg-[#0f0f0f] px-5 text-[18px] text-white outline-none transition placeholder:text-white/26 focus:border-[#2678ff]"
                />

                <div className="mt-9">
                  <p className="text-[15px] font-medium text-white/84">Company size</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCompanySize(size)}
                        className={`rounded-[8px] border px-4 py-4 text-[18px] transition ${
                          companySize === size
                            ? "border-[#2678ff] bg-[#0f2649] text-white"
                            : "border-white/10 bg-[#0b0b0b] text-white/86 hover:border-white/20"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {step === "entry" ? (
            <section className="mx-auto max-w-[920px]">
              <div className="text-center">
                <h1 className="text-balance text-[34px] font-semibold tracking-[-0.05em] sm:text-[42px]">
                  What brings you here?
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-white/56 sm:text-[18px]">
                  This helps us tailor your experience. You can always change this later.
                </p>
              </div>

              <div className="mx-auto mt-12 grid max-w-[760px] gap-4 md:grid-cols-2">
                {ENTRY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setEntryPath(option.id);
                      setSelectedIntegration(null);
                    }}
                    className={`rounded-[8px] border p-6 text-left transition ${
                      entryPath === option.id
                        ? "border-[#2678ff] bg-[#0d1d35]"
                        : "border-white/10 bg-[#0b0b0b] hover:border-white/20"
                    }`}
                  >
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/38">{option.eyebrow}</p>
                    <p className="mt-5 text-[30px] font-semibold tracking-[-0.04em]">{option.title}</p>
                    <p className="mt-3 max-w-[260px] text-[18px] leading-8 text-white/48">{option.description}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "category" ? (
            <section className="mx-auto max-w-[1240px]">
              <div className="text-center">
                <h1 className="text-balance text-[34px] font-semibold tracking-[-0.05em] sm:text-[42px]">
                  What are you building?
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-white/56 sm:text-[18px]">
                  Choose the category that best describes your use case with MemoryOS.
                </p>
              </div>

              <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {USE_CASES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setUseCaseId(item.id);
                      setTemplateTab(item.category as TemplateTab);
                    }}
                    className={`rounded-[8px] border p-6 text-left transition ${
                      useCaseId === item.id
                        ? "border-[#2678ff] bg-[#0d1d35]"
                        : "border-white/10 bg-[#0b0b0b] hover:border-white/20"
                    }`}
                  >
                    <p className="text-[30px] font-semibold tracking-[-0.04em]">{item.title}</p>
                    <p className="mt-3 max-w-[300px] text-[18px] leading-8 text-white/46">{item.description}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "context" ? (
            <section className="mx-auto max-w-[1240px]">
              <div className="text-center">
                <h1 className="text-balance text-[34px] font-semibold tracking-[-0.05em] sm:text-[42px]">
                  Set Up Organization Context
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-white/56 sm:text-[18px]">
                  Define how content should be filtered and processed for your use case.
                </p>
              </div>

              <div className="mt-12">
                <label className="block text-[15px] font-medium text-white/84">Organizational Context</label>
                <textarea
                  value={orgContext}
                  onChange={(event) => setOrgContext(event.target.value)}
                  placeholder={`Describe how content should be processed for your organization${selectedUseCase ? ` and ${selectedUseCase.title.toLowerCase()} use case` : ""}...`}
                  className="mt-4 min-h-[210px] w-full rounded-[8px] border border-white/10 bg-[#0b0b0b] px-5 py-5 text-[18px] text-white outline-none transition placeholder:text-white/26 focus:border-[#2678ff]"
                />
              </div>

              <div className="mt-8 max-w-[380px]">
                <input
                  value={templateQuery}
                  onChange={(event) => setTemplateQuery(event.target.value)}
                  placeholder="Search templates..."
                  className="h-14 w-full rounded-[8px] border border-white/10 bg-[#181818] px-5 text-[18px] text-white outline-none transition placeholder:text-white/28 focus:border-[#2678ff]"
                />
              </div>

              <div className="mt-7 flex gap-6 overflow-x-auto pb-2 text-[16px]">
                {TEMPLATE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTemplateTab(tab)}
                    className={`shrink-0 border-b pb-3 transition ${
                      templateTab === tab ? "border-[#2678ff] text-[#2678ff]" : "border-transparent text-white/46 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {templateCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(card.id);
                      setOrgContext((current) =>
                        current.trim().length > 0
                          ? current
                          : `${orgName || "Your company"} uses ${card.title.toLowerCase()} with continuity retrieval, trusted memory recall, and clear handoff context.`,
                      );
                    }}
                    className={`rounded-[8px] border p-5 text-left transition ${
                      selectedTemplate === card.id
                        ? "border-[#2678ff] bg-[#171f2d]"
                        : "border-white/10 bg-[#1a1a1a] hover:border-white/20"
                    }`}
                  >
                    <p className="text-[18px] font-semibold">{card.title}</p>
                    <p className="mt-3 text-[15px] leading-7 text-white/36">{card.preview}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "integration" ? (
            <section className="mx-auto max-w-[1240px]">
              <div className="text-center">
                <h1 className="text-balance text-[34px] font-semibold tracking-[-0.05em] sm:text-[42px]">
                  {entryPath === "plugins" ? "Choose your plugin" : "What are you building?"}
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-white/56 sm:text-[18px]">
                  {entryPath === "plugins"
                    ? "Select the plugin you'd like to set up first."
                    : "Choose a MemoryOS surface to launch first."}
                </p>
              </div>

              {entryPath === "plugins" ? null : (
                <>
                  <div className="mt-12 max-w-[380px]">
                    <input
                      value={integrationQuery}
                      onChange={(event) => setIntegrationQuery(event.target.value)}
                      placeholder="Search solutions..."
                      className="h-14 w-full rounded-[8px] border border-white/10 bg-[#181818] px-5 text-[18px] text-white outline-none transition placeholder:text-white/28 focus:border-[#2678ff]"
                    />
                  </div>

                  <div className="mt-7 flex gap-6 overflow-x-auto pb-2 text-[16px]">
                    {PRODUCT_TABS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setProductTab(tab as ProductTab)}
                        className={`shrink-0 border-b pb-3 transition ${
                          integrationTab === tab
                            ? "border-[#2678ff] text-[#2678ff]"
                            : "border-transparent text-white/46 hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className={`mt-6 grid gap-4 ${entryPath === "plugins" ? "mx-auto max-w-[640px] md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}>
                {integrationCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedIntegration(card.id)}
                    className={`rounded-[8px] border p-5 text-left transition ${
                      selectedIntegration === card.id
                        ? "border-[#2678ff] bg-[#171f2d]"
                        : "border-white/10 bg-[#1a1a1a] hover:border-white/20"
                    }`}
                  >
                    <IconBadge label={card.accent} />
                    <p className="mt-8 text-[18px] font-semibold">{card.title}</p>
                    {entryPath === "plugins" ? null : (
                      <p className="mt-3 text-[15px] leading-7 text-white/36">{card.subtitle}</p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "setup" ? (
            <section className="mx-auto max-w-[1240px]">
              <div className="text-center">
                <h1 className="text-balance text-[34px] font-semibold tracking-[-0.05em] sm:text-[42px]">
                  {entryPath === "plugins" ? `Set up ${selectedIntegrationDetails.title}` : `Set up your ${selectedIntegrationDetails.title} integration`}
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-white/56 sm:text-[18px]">
                  {entryPath === "plugins" ? "Follow the docs to connect your plugin." : "Follow these steps to connect."}
                </p>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-white/10 bg-[#0d0d0d] px-5 py-5">
                <div className="flex items-center gap-4">
                  <IconBadge label={selectedIntegrationDetails.accent} />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[20px] font-semibold">{selectedIntegrationDetails.title}</p>
                      <span className="rounded-[6px] bg-[#17381f] px-3 py-1 text-[12px] font-medium uppercase tracking-[0.12em] text-[#8de2a5]">
                        {entryPath === "plugins" ? "TypeScript" : "MemoryOS"}
                      </span>
                    </div>
                    <p className="mt-1 text-[16px] text-white/42">{selectedIntegrationDetails.subtitle}</p>
                  </div>
                </div>
                <a href="#" className="text-[14px] font-medium tracking-[0.06em] text-white/48 hover:text-white">
                  Docs
                </a>
              </div>

              <div className="mt-6 space-y-3">
                {(entryPath === "plugins"
                  ? (pluginIntegrationDetails?.steps ?? []).map((copy, index) => ({
                      id: index + 1,
                      title:
                        index === 0
                          ? "Get your API key"
                          : index === 1
                            ? "Set your API key as an environment variable"
                            : index === 2
                              ? "Install the plugin"
                              : "Verify your config",
                      copy,
                    }))
                  : [
                      {
                        id: 1,
                        title: "Install the package",
                        copy: "Create your first MemoryOS workspace and choose a starter endpoint.",
                      },
                      {
                        id: 2,
                        title: "Add your API key",
                        copy: "Set environment variables and connect the MemoryOS project token.",
                      },
                      {
                        id: 3,
                        title: "Verify installation",
                        copy: "Run a quick test to confirm setup and data flow.",
                      },
                    ]).map((section) => {
                  const expanded = expandedSetupSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setExpandedSetupSection(section.id)}
                      className="w-full rounded-[8px] border border-white/10 bg-[#121212] p-5 text-left"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-[16px] font-semibold text-white/72">
                            {section.id}
                          </div>
                          <div>
                            <p className="text-[20px] font-semibold">{section.title}</p>
                            {!expanded ? <p className="mt-1 text-[15px] text-white/36">{section.copy}</p> : null}
                          </div>
                        </div>
                        <span className="text-[22px] text-white/34">{expanded ? "−" : "+"}</span>
                      </div>
                      {expanded ? (
                        <div className="mt-5 border-t border-white/10 pt-5">
                          <p className="text-[15px] leading-7 text-white/58">
                            {entryPath === "plugins"
                              ? section.copy
                              : section.id === 1
                                ? "Run this command in your project directory:"
                                : section.id === 2
                                  ? "Add these values in your environment file:"
                                  : "Run a test command to confirm setup:"}
                          </p>
                          <div className={`mt-4 rounded-[8px] border border-white/10 bg-[#0d0d0d] px-5 py-5 ${entryPath === "plugins" ? "text-[16px] leading-7 text-white/84" : "font-mono text-[15px] text-white/92"}`}>
                            {entryPath === "plugins"
                              ? section.copy
                              : section.id === 1
                                ? section.copy
                                : section.id === 2
                                  ? "MEMORYOS_API_KEY=mo_xxxxx\nMEMORYOS_PROJECT=memoryos"
                                  : "npm run memoryos:verify"}
                          </div>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {entryPath === "plugins" ? (
                <div className="mt-10 text-[18px] leading-9 text-white/62">
                  <p className="font-medium text-white/72">What you get</p>
                  <ul className="mt-4 list-disc space-y-1 pl-6">
                    {(pluginIntegrationDetails?.benefits ?? []).map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <p className="mt-10 text-white/42">
                    Click &quot;Get started&quot; to finish onboarding. You can configure this plugin from the Plugins page.
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <footer className="border-t border-white/10 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[15px] leading-7 text-white/52">
              {step === "org"
                ? "This creates your workspace for your organisation."
                : step === "entry"
                  ? "You can always change this later in settings."
                  : step === "category"
                    ? "This helps us tailor templates and recommendations."
                    : step === "context"
                      ? "You can always update this later in settings."
                      : step === "integration"
                        ? "You can explore other products later."
                        : "You can skip this and set up later."}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={step === "org" || isSaving}
                className="rounded-[8px] px-4 py-3 text-[15px] font-medium text-white/92 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/24"
              >
                PREVIOUS
              </button>

              {step === "context" || step === "integration" || step === "setup" ? (
                <button
                  type="button"
                  onClick={() => (step === "setup" ? completeOnboarding() : advance(true))}
                  disabled={isSaving}
                  className="rounded-[8px] px-4 py-3 text-[15px] font-medium text-white/72 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/24"
                >
                  SKIP
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => (step === "setup" ? completeOnboarding() : advance())}
                disabled={(!canContinue && step !== "setup") || isSaving}
                className="rounded-[8px] bg-[#2678ff] px-5 py-3 text-[15px] font-semibold tracking-[0.06em] text-white transition hover:bg-[#3d88ff] disabled:cursor-not-allowed disabled:bg-[#173e7b] disabled:text-white/45"
              >
                {isSaving ? "SAVING..." : step === "setup" ? "GET STARTED" : "NEXT STEP"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
