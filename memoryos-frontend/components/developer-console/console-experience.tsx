"use client";

import Link from "next/link";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { AgentsSection } from "@/components/developer-console/sections/agents-section";
import { ApiKeysSection } from "@/components/developer-console/sections/api-keys-section";
import { BenchmarksSection } from "@/components/developer-console/sections/benchmarks-section";
import { BillingSection } from "@/components/developer-console/sections/billing-section";
import { ConnectorsSection } from "@/components/developer-console/sections/connectors-section";
import { ConflictStalenessSection } from "@/components/developer-console/sections/conflict-staleness-section";
import { ContextInspectorSection } from "@/components/developer-console/sections/context-inspector-section";
import { ContractConsoleSection } from "@/components/developer-console/sections/contract-console-section";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import { IntegrationsSection } from "@/components/developer-console/sections/integrations-section";
import { ImportsSection } from "@/components/developer-console/sections/imports-section";
import { PreflightSection } from "@/components/developer-console/sections/preflight-section";
import { WorkflowOsSection } from "@/components/developer-console/sections/workflow-os-section";
import { MemoriesSection } from "@/components/developer-console/sections/memories-section";
import { FlightRecorderSection } from "@/components/developer-console/sections/flight-recorder-section";
import { OverviewSection } from "@/components/developer-console/sections/overview-section";
import { PluginsSection } from "@/components/developer-console/sections/plugins-section";
import { PlaygroundSection } from "@/components/developer-console/sections/playground-section";
import { PortabilitySection } from "@/components/developer-console/sections/portability-section";
import { GovernanceSection } from "@/components/developer-console/sections/governance-section";
import {
  RequestsSection,
  type RequestSectionEvent,
} from "@/components/developer-console/sections/requests-section";
import { SettingsSection } from "@/components/developer-console/sections/settings-section";
import { TeamSection } from "@/components/developer-console/sections/team-section";
import { CompanyBrainSection } from "@/components/developer-console/sections/company-brain-section";
import { Icon, type IconName } from "@/components/ui/icon";

import {
  clearStoredMemoryTokens,
  fetchMemoryTokenFromBridge,
  readMemoryTokenFromStorage,
} from "@/lib/memory-token";

const STORAGE_KEY = "memoryos.developer-console.onboarding";
const THEME_STORAGE_KEY = "memoryos.theme.preference";
const DEFAULT_TOTAL_STEPS = 5;
const MEMORYOS_TOTAL_STEPS = 7;
type ThemePreference = "light" | "dark" | "system";

const COMPANY_SIZES = [
  "Just me",
  "2-10",
  "11-50",
  "51-200",
  "201-1,000",
  "1,000+",
] as const;

const ENTRY_OPTIONS = [
  {
    id: "plugins",
    title: "MCP / Plugins",
    description: "Connect any MCP-compatible agent runtime",
    eyebrow: "Best for universal agent workflows",
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
    preview:
      "{{Company name}} personal assistant. Users save conversations, notes, and daily context.",
  },
  {
    id: "productivity-assistant",
    title: "Productivity Assistant",
    category: "Personal Assistant",
    preview:
      "{{Company name}} productivity tool. Users save meeting notes, task updates, and plans.",
  },
  {
    id: "general-support-agent",
    title: "General Support Agent",
    category: "Customer Support",
    preview:
      "{{Company name}} customer support knowledge base. Content includes resolved tickets and SOPs.",
  },
  {
    id: "technical-support-agent",
    title: "Technical Support Agent",
    category: "Customer Support",
    preview:
      "{{Company name}} technical support. Content includes API docs, error guides, and fixes.",
  },
  {
    id: "general-legal-assistant",
    title: "General Legal Assistant",
    category: "Legal Assistant",
    preview:
      "{{Company name}} legal knowledge. Content includes contracts, regulations, and case summaries.",
  },
  {
    id: "general-finance-agent",
    title: "General Finance Agent",
    category: "Finance Agent",
    preview:
      "{{Company name}} financial knowledge. Content includes reports, budgets, and compliance docs.",
  },
  {
    id: "healthcare-assistant",
    title: "Healthcare Assistant",
    category: "Healthcare",
    preview:
      "{{Company name}} healthcare knowledge. Content includes clinical guidelines and approved references.",
  },
  {
    id: "developer-documentation",
    title: "Continuity API Reference",
    category: "Developer Docs",
    preview:
      "{{Company name}} developer platform. Content includes retrieve, resume, handoff, and architecture notes.",
  },
  {
    id: "sdk-documentation",
    title: "SDK Quickstart",
    category: "Developer Docs",
    preview:
      "{{Company name}} SDK reference. Content includes beforeModel, afterModel, and handoff examples.",
  },
] as const;

const PLUGIN_CHOICES = [
  {
    id: "mcp",
    title: "Universal MCP",
    subtitle: "Memory layer for any MCP-compatible agent",
    accent: "MCP",
    benefits: [
      "Semantic search across previous sessions",
      "Auto-capture of coding decisions",
      "Context injection before each prompt",
    ],
    steps: [
      "Open API Keys in the MemoryOS developer console and create a token.",
      "Export `MEMORYOS_API_KEY` in your shell profile.",
      "Add the MemoryOS MCP server to your agent runtime.",
      "Run your agent's MCP health check and confirm MemoryOS is connected.",
    ],
  },
  {
    id: "sdk",
    title: "TypeScript SDK",
    subtitle:
      "Memory layer for Node agents, product backends, and orchestration workers.",
    accent: "SDK",
    benefits: [
      "Semantic search across previous sessions",
      "Auto-capture of coding decisions",
      "Context injection before each prompt",
    ],
    steps: [
      "Create an API key from the MemoryOS developer console.",
      "Add `MEMORYOS_API_KEY` to your shell profile.",
      "Install `@memoryostm/sdk` in your project.",
      "Call `beforeModel()` and `afterModel()` around your model turn.",
    ],
  },
  {
    id: "http-api",
    title: "HTTP API",
    subtitle: "Direct memory calls for hosted platforms and custom agents",
    accent: "API",
    benefits: [
      "Shared memory across OpenClaw sessions",
      "Fast recall of previous coding actions",
      "Lightweight setup for local tooling",
    ],
    steps: [
      "Create an API key in the MemoryOS developer console.",
      "Add `MEMORYOS_API_KEY` to your environment variables.",
      "Call `/api/memory/process` after useful work.",
      "Call `/api/memory/retrieve` before the next model response.",
    ],
  },
  {
    id: "local-models",
    title: "Local Models",
    subtitle:
      "Persistent context for Ollama, Qwen, DeepSeek, Llama, and other local agents",
    accent: "LM",
    benefits: [
      "Session recall between Hermes runs",
      "Persistent workspace context",
      "Fast retrieval for repeated tasks",
    ],
    steps: [
      "Create an API key in the MemoryOS developer console.",
      "Save `MEMORYOS_API_KEY` in your model runner environment.",
      "Connect through MCP, SDK, or HTTP.",
      "Run a retrieve/resume cycle to confirm setup.",
    ],
  },
] as const;

const PRODUCT_TABS = [
  "All",
  "Platform",
  "Search",
  "Assistants",
  "Workflows",
] as const;

const PRODUCT_INTEGRATIONS = [
  {
    id: "api-integration",
    title: "API Integration",
    subtitle: "Direct retrieve, resume, and handoff APIs",
    tab: "Platform",
    accent: "API",
  },
  {
    id: "chatbot",
    title: "Chatbot",
    subtitle: "Embed continuity into your assistant",
    tab: "Assistants",
    accent: "BOT",
  },
  {
    id: "rag",
    title: "RAG Pipeline",
    subtitle: "Grounded retrieval with project memory",
    tab: "Search",
    accent: "RAG",
  },
  {
    id: "copilot",
    title: "Internal Copilot",
    subtitle: "Team knowledge and handoff assistant",
    tab: "Assistants",
    accent: "CO",
  },
  {
    id: "workflow",
    title: "Automation Workflow",
    subtitle: "Event-driven continuity sync",
    tab: "Workflows",
    accent: "WF",
  },
  {
    id: "docs-search",
    title: "Developer Recall",
    subtitle: "Search docs, bugs, and prior decisions",
    tab: "Search",
    accent: "DR",
  },
  {
    id: "playground",
    title: "Playground",
    subtitle: "Test continuity flows interactively",
    tab: "Platform",
    accent: "PG",
  },
] as const;

const MEMORY_TAG_OPTIONS = [
  "project",
  "debug",
  "decision",
  "handoff",
  "open-loop",
  "preference",
] as const;

const GLITCH_ASCII_PATTERN = Array.from({ length: 18 }, (_, row) =>
  Array.from(
    { length: 70 },
    (_, col) => ["2", "3", "4", "5", "x", "+"][(row * 3 + col * 5) % 6],
  ).join(" "),
).join("\n");

const DASHBOARD_NAV = [
  {
    section: "",
    items: [
      "Command Center",
      "Preflight Console",
      "Agent Workflow OS",
      "Memory Vault",
      "Agent Flight Recorder",
    ],
  },
  {
    section: "Test",
    items: ["API Requests", "Evaluation", "Conflict & Staleness"],
  },
  {
    section: "Data",
    items: [
      "Data Sources",
      "Frameworks",
      "Ingestion Control Center",
      "Portability",
      "Company Brain",
      "Governance",
      "Contract Console",
      "Context Inspector",
    ],
  },
  { section: "Developer", items: ["API Keys", "Agent Profiles", "Adapters"] },
  { section: "Organization", items: ["Team", "Billing", "Settings"] },
] as const;

function dashboardItemIcon(item: string): IconName {
  const map: Record<string, IconName> = {
    "Command Center": "radar",
    "Preflight Console": "terminal",
    "Agent Workflow OS": "agent",
    "Memory Vault": "vault",
    "Agent Flight Recorder": "timeline",
    "API Requests": "timeline",
    Evaluation: "graph",
    "Data Sources": "search",
    Frameworks: "memory",
    "Ingestion Control Center": "send",
    Portability: "memory",
    "Company Brain": "graph",
    Governance: "settings",
    "Contract Console": "terminal",
    "Context Inspector": "timeline",
    "API Keys": "vault",
    "Agent Profiles": "agent",
    Adapters: "settings",
    Team: "agent",
    Billing: "graph",
    Settings: "settings",
  };

  return map[item] ?? "memory";
}

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

function hasPluginSetupDetails(
  integration: PluginChoice | ProductIntegration,
): integration is PluginChoice {
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

function nextWizardStep(
  step: WizardStep,
  entryPath: EntryPath,
  integrationSelected: boolean,
) {
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
    <div className="grid h-11 w-11 place-items-center rounded-lg border-transparent bg-background text-[13px] font-semibold tracking-[0.08em] text-foreground/90">
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
      const flicker = 0.62 + (Math.sin(time * 0.004) + 1) * 0.12;

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
      <div className="absolute inset-0 bg-background" />
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
          -webkit-mask-image: radial-gradient(
            circle var(--cursor-r) at var(--cursor-x) var(--cursor-y),
            rgba(0, 0, 0, 1) 0%,
            rgba(0, 0, 0, 0.92) 42%,
            rgba(0, 0, 0, 0.18) 66%,
            transparent 78%
          );
          mask-image: radial-gradient(
            circle var(--cursor-r) at var(--cursor-x) var(--cursor-y),
            rgba(0, 0, 0, 1) 0%,
            rgba(0, 0, 0, 0.92) 42%,
            rgba(0, 0, 0, 0.18) 66%,
            transparent 78%
          );
        }

        .glitch-halo {
          background:
            radial-gradient(
              circle at var(--cursor-x) var(--cursor-y),
              rgba(255, 255, 255, 0.14),
              rgba(255, 255, 255, 0.03) 42%,
              transparent 72%
            ),
            radial-gradient(
              circle at var(--cursor-x) var(--cursor-y),
              rgba(114, 164, 255, 0.16),
              transparent 58%
            );
          filter: blur(18px);
        }

        .glitch-layer {
          position: absolute;
          inset: -6%;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.92);
          white-space: pre;
          font-family:
            "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
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
          -webkit-mask-image: repeating-linear-gradient(
            180deg,
            black 0 12px,
            transparent 12px 16px,
            black 16px 28px
          );
          mask-image: repeating-linear-gradient(
            180deg,
            black 0 12px,
            transparent 12px 16px,
            black 16px 28px
          );
        }

        .glitch-layer-b {
          transform: translateX(var(--glitch-shift-b));
          opacity: calc(var(--glitch-flicker) * 0.45);
          filter: blur(0.4px);
          -webkit-mask-image: repeating-linear-gradient(
            180deg,
            transparent 0 6px,
            black 6px 15px,
            transparent 15px 19px,
            black 19px 30px
          );
          mask-image: repeating-linear-gradient(
            180deg,
            transparent 0 6px,
            black 6px 15px,
            transparent 15px 19px,
            black 19px 30px
          );
        }

        .glitch-layer-c {
          transform: translateX(calc(var(--glitch-shift-a) * -0.35));
          opacity: calc(var(--glitch-flicker) * 0.22);
          filter: blur(1.2px);
        }

        .glitch-scan {
          background:
            repeating-linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.04) 0 1px,
              transparent 1px 8px
            ),
            linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.05),
              transparent
            );
          mix-blend-mode: screen;
          opacity: 0.42;
        }
      `}</style>
    </div>
  );
}

function ProgressHeader({
  step,
  entryPath,
}: {
  step: WizardStep;
  entryPath: EntryPath;
}) {
  const totalSteps = totalStepsFor(entryPath);
  const currentStep = onboardingStepNumber(step, entryPath);
  const progress = `${(currentStep / totalSteps) * 100}%`;

  return (
    <header className="border-b border-transparent">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <MemoryStarLogo tone="white" />
        </Link>
        <div className="mx-auto hidden w-full max-w-[410px] items-center gap-3 sm:flex">
          <div className="h-1.5 flex-1 rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: progress }}
            />
          </div>
        </div>
        <div className="ml-auto text-[13px] font-medium tracking-[0.14em] text-foreground">
          {currentStep}/{totalSteps}
        </div>
      </div>
      <div className="px-4 pb-4 sm:hidden">
        <div className="h-1.5 rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: progress }}
          />
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeApiPayload<T>(payload: unknown): T {
  if (isRecord(payload) && payload.ok === true && "data" in payload) {
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

function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("unauthorized")
  );
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
  const configuredOrigin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim();
  const normalizedOrigin =
    configuredOrigin && configuredOrigin !== "same-origin"
      ? configuredOrigin.replace(/\/+$/, "")
      : "";
  const normalizedPath = routePath.startsWith("/")
    ? routePath
    : `/${routePath}`;
  const requestUrl = /^https?:\/\//i.test(routePath)
    ? routePath
    : `${normalizedOrigin}${normalizedPath}`;

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      error instanceof TypeError
        ? `MemoryOS backend is not reachable at ${normalizedOrigin}. Start the backend with npm run dev from C:\\projects\\MemoryOS.`
        : `Could not reach MemoryOS backend at ${normalizedOrigin}.`,
    );
  }

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

function readStoredState() {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as Record<
      string,
      string | boolean | null | undefined
    >;
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
    if (storedOrganizations.length > 0 && !storedState?.currentOrganizationId)
      return "organization-select";
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
  const [orgName, setOrgName] = useState(() =>
    typeof storedState?.orgName === "string" ? storedState.orgName : "",
  );
  const [companySize, setCompanySize] = useState<string | null>(() =>
    typeof storedState?.companySize === "string"
      ? storedState.companySize
      : null,
  );
  const [entryPath, setEntryPath] = useState<EntryPath>(() =>
    storedState?.entryPath === "plugins" ||
    storedState?.entryPath === "memoryos"
      ? storedState.entryPath
      : null,
  );
  const [useCaseId, setUseCaseId] = useState<UseCaseId>(() =>
    typeof storedState?.useCaseId === "string"
      ? (storedState.useCaseId as UseCaseId)
      : null,
  );
  const [orgContext, setOrgContext] = useState(() =>
    typeof storedState?.orgContext === "string" ? storedState.orgContext : "",
  );
  const [templateQuery, setTemplateQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(() =>
    typeof storedState?.selectedTemplate === "string"
      ? storedState.selectedTemplate
      : null,
  );
  const [templateTab, setTemplateTab] = useState<TemplateTab>("All");
  const [integrationQuery, setIntegrationQuery] = useState("");
  const [productTab, setProductTab] = useState<ProductTab>("All");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    () =>
      typeof storedState?.selectedIntegration === "string"
        ? storedState.selectedIntegration
        : null,
  );
  const [organizations, setOrganizations] =
    useState<StoredOrganization[]>(storedOrganizations);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    string | null
  >(() =>
    typeof storedState?.currentOrganizationId === "string"
      ? storedState.currentOrganizationId
      : null,
  );
  const [expandedSetupSection, setExpandedSetupSection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showOrganizationMenu, setShowOrganizationMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [showSupportWidget, setShowSupportWidget] = useState(false);
  const [showSupportComposer, setShowSupportComposer] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSendState, setSupportSendState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [supportErrorMessage, setSupportErrorMessage] = useState<string | null>(
    null,
  );
  const [activeDashboardItem, setActiveDashboardItem] =
    useState("Command Center");
  const [navSearchQuery, setNavSearchQuery] = useState("");
  const [mountedDashboardItems, setMountedDashboardItems] = useState<string[]>([
    "Command Center",
  ]);
  const [memoryLegendExpanded, setMemoryLegendExpanded] = useState(true);
  const [showMemoryTagFilter, setShowMemoryTagFilter] = useState(false);
  const [memoryTagQuery, setMemoryTagQuery] = useState("");
  const [selectedMemoryTags, setSelectedMemoryTags] = useState<string[]>([]);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [dashboardDataLoading, setDashboardDataLoading] = useState(false);
  const [dashboardDataError, setDashboardDataError] = useState<string | null>(
    null,
  );
  const [installationVerificationStatus, setInstallationVerificationStatus] =
    useState<"idle" | "waiting" | "connected" | "error">("idle");
  const [installationVerificationMessage, setInstallationVerificationMessage] =
    useState(
      "Click to confirm MemoryOS is receiving SDK, MCP, or HTTP events.",
    );
  const [
    installationVerificationBaseline,
    setInstallationVerificationBaseline,
  ] = useState(0);
  const [liveMemories, setLiveMemories] = useState<MemoryListItem[]>([]);
  const [liveInsights, setLiveInsights] = useState<InsightsResponse | null>(
    null,
  );
  const [liveTimelineCount, setLiveTimelineCount] = useState(0);
  const [liveResume, setLiveResume] = useState<ResumeResponseData | null>(null);
  const [liveHandoff, setLiveHandoff] = useState<HandoffResponseData | null>(
    null,
  );
  const [liveRequestEvents, setLiveRequestEvents] = useState<
    RequestSectionEvent[]
  >([]);
  // Benchmark state is now self-contained inside BenchmarksSection via useBenchmarks hook
  const installationEventCount =
    liveRequestEvents.length + liveMemories.length + liveTimelineCount;
  const isLightTheme = resolvedTheme === "light";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemePreference(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const nextResolved =
        themePreference === "system"
          ? media.matches
            ? "dark"
            : "light"
          : themePreference;
      setResolvedTheme(nextResolved);
      document.documentElement.setAttribute("data-theme", nextResolved);
      document.documentElement.style.colorScheme = nextResolved;
    };
    applyTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [themePreference]);

  useEffect(() => {
    if (step !== "dashboard") return;
    setMountedDashboardItems((current) =>
      current.includes(activeDashboardItem)
        ? current
        : [...current, activeDashboardItem],
    );
  }, [activeDashboardItem, step]);

  useEffect(() => {
    if (installationVerificationStatus !== "waiting") {
      return;
    }

    if (installationEventCount > installationVerificationBaseline) {
      const timeout = window.setTimeout(() => {
        setInstallationVerificationStatus("connected");
        setInstallationVerificationMessage(
          "Connected. MemoryOS received a live event from this workspace.",
        );
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const interval = window.setInterval(() => {
      setDashboardRefreshKey((current) => current + 1);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [
    installationEventCount,
    installationVerificationBaseline,
    installationVerificationStatus,
  ]);

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

  const selectedUseCase =
    USE_CASES.find((item) => item.id === useCaseId) ?? null;
  const filteredDashboardNav = useMemo(() => {
    const query = navSearchQuery.trim().toLowerCase();
    if (!query) return DASHBOARD_NAV;

    return DASHBOARD_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.toLowerCase().includes(query)),
    })).filter((group) => group.items.length > 0);
  }, [navSearchQuery]);
  const currentOrganization =
    organizations.find(
      (organization) => organization.id === currentOrganizationId,
    ) ?? null;
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ?? "developer@memoryos.local";
  const userDisplayName =
    currentOrganization?.name ??
    user?.firstName ??
    user?.username ??
    "MemoryOS User";
  const userInitial = userDisplayName.slice(0, 1).toUpperCase();
  const templateCards = useMemo(() => {
    return TEMPLATE_CARDS.filter((card) => {
      const matchesTab = templateTab === "All" || card.category === templateTab;
      const matchesSearch =
        templateQuery.trim().length === 0 ||
        `${card.title} ${card.preview}`
          .toLowerCase()
          .includes(templateQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [templateQuery, templateTab]);

  const integrationOptions =
    entryPath === "plugins" ? PLUGIN_CHOICES : PRODUCT_INTEGRATIONS;
  const integrationTab = entryPath === "plugins" ? "All" : productTab;
  const integrationCards = useMemo(() => {
    if (entryPath === "plugins") {
      return PLUGIN_CHOICES.filter((option) => {
        return (
          integrationQuery.trim().length === 0 ||
          `${option.title} ${option.subtitle}`
            .toLowerCase()
            .includes(integrationQuery.toLowerCase())
        );
      });
    }

    return PRODUCT_INTEGRATIONS.filter((option) => {
      const matchesTab =
        integrationTab === "All" || option.tab === integrationTab;
      const matchesSearch =
        integrationQuery.trim().length === 0 ||
        `${option.title} ${option.subtitle}`
          .toLowerCase()
          .includes(integrationQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [entryPath, integrationQuery, integrationTab]);

  const selectedIntegrationDetails =
    integrationOptions.find(
      (integration) => integration.id === selectedIntegration,
    ) ?? integrationOptions[0];
  const pluginIntegrationDetails = hasPluginSetupDetails(
    selectedIntegrationDetails,
  )
    ? selectedIntegrationDetails
    : null;
  const activeProjectName = currentOrganization?.name
    ? `${currentOrganization.name} Continuity Workspace`
    : "MemoryOS Continuity Workspace";

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

    async function loadDashboardData(hasRetriedAuth = false) {
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
      setLiveRequestEvents([]);

      const results = await Promise.allSettled([
        fetchMemoryApi<MemoryListResponse>(
          "/api/memory/list?limit=120",
          authToken,
        ),
        fetchMemoryApi<InsightsResponse>("/api/memory/insights", authToken),
        fetchMemoryApi<RequestHistoryResponse>(
          "/api/memory/requests?limit=200&range=all",
          authToken,
        ),
        fetchMemoryApi<TimelineHistoryResponse>(
          "/api/memory/timeline?limit=200",
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
        requestsResult,
        timelineResult,
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

      if (requestsResult.status === "fulfilled") {
        setLiveRequestEvents(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          requestsResult.value.requests.map((entry: any) => ({
            id: entry.id,
            createdAt: entry.createdAt,
            type: entry.routeType,
            status:
              entry.status >= 200 && entry.status < 400 ? "Success" : "Error",
            latencyMs: entry.durationMs,
            route: entry.path,
            method: entry.method,
            statusCode: entry.statusCode,
            agent: entry.agent,
            payloadSummary: entry.payloadSummary,
            responseSummary: entry.responseSummary,
            errorDetails: entry.errorDetails,
          })),
        );
      }

      if (timelineResult.status === "fulfilled") {
        setLiveTimelineCount(timelineResult.value.count ?? 0);
      }

      if (resumeResult.status === "fulfilled") {
        setLiveResume(resumeResult.value);
      }

      if (handoffResult.status === "fulfilled") {
        setLiveHandoff(handoffResult.value);
      }

      const rejected = results
        .map((result, index) => ({ result, index }))
        .filter(
          (entry): entry is { result: PromiseRejectedResult; index: number } =>
            entry.result.status === "rejected",
        );
      const firstError = rejected[0]?.result;
      const hasAnySuccess = results.some((result) => result.status === "fulfilled");
      const hasUnauthorizedError = rejected.some((entry) =>
        isUnauthorizedError(entry.result.reason),
      );

      if (firstError) {
        if (!hasRetriedAuth && hasUnauthorizedError) {
          clearStoredMemoryTokens();
          await fetchMemoryTokenFromBridge();
          if (!cancelled) {
            await loadDashboardData(true);
          }
          return;
        }

        if (!hasAnySuccess) {
          setDashboardDataError(
            firstError.reason instanceof Error
              ? firstError.reason.message
              : "Some live dashboard data could not be loaded.",
          );
        } else {
          setDashboardDataError(null);
        }
      } else {
        setDashboardDataError(null);
      }

      setDashboardDataLoading(false);
    }

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    step,
    currentOrganization?.name,
    activeProjectName,
    dashboardRefreshKey,
  ]);

  const openLoops = (
    liveResume?.openLoops && liveResume.openLoops.length > 0
      ? liveResume.openLoops
      : liveHandoff?.openLoops && liveHandoff.openLoops.length > 0
        ? liveHandoff.openLoops
        : [
            "No open loops yet. Add a live update to create actionable follow-ups.",
          ]
  ).slice(0, 4);

  const overviewStats = [
    {
      label: "Memories Stored",
      value: `${liveMemories.length}`,
      accent: "var(--color-primary)",
    },
    {
      label: "Resume Runs",
      value: `${liveRequestEvents.filter((request) => request.route.includes("/api/memory/resume")).length}`,
      accent: "var(--color-chart-2)",
    },
    {
      label: "Retrieve Requests",
      value: `${liveRequestEvents.filter((request) => request.route.includes("/api/memory/retrieve")).length}`,
      accent: "var(--color-chart-4)",
    },
    {
      label: "Handoffs Generated",
      value: `${liveRequestEvents.filter((request) => request.route.includes("/api/memory/handoff")).length}`,
      accent: "var(--color-chart-5)",
    },
    {
      label: "Active Projects",
      value: `${liveInsights?.activeProjects?.length ?? 0}`,
      accent: "var(--color-primary)",
    },
  ];

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
    { label: "Derives", tone: "bg-chart-5" },
    { label: "Updates", tone: "bg-chart-4" },
    { label: "Extends", tone: "bg-primary" },
    { label: "Contradicts", tone: "bg-destructive" },
  ];
  const memoryStatuses = [
    { label: "Recent (< 24h)", tone: "border-chart-2 text-chart-2" },
    { label: "Active", tone: "border-primary text-primary" },
    { label: "Needs review", tone: "border-chart-5 text-chart-5" },
    { label: "Forgotten", tone: "border-destructive text-destructive" },
  ];
  const filteredMemoryTagOptions = useMemo(
    () =>
      MEMORY_TAG_OPTIONS.filter((tag) =>
        tag.includes(memoryTagQuery.toLowerCase()),
      ),
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
    setStep(
      nextWizardStep(step, entryPath, Boolean(selectedIntegration) && !skip),
    );
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
    setActiveDashboardItem("Command Center");
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
    setActiveDashboardItem("Command Center");
    setShowOrganizationMenu(false);
    setStep("org");
  }

  function selectOrganization(organizationId: string) {
    setCurrentOrganizationId(organizationId);
    setActiveDashboardItem("Command Center");
    setShowOrganizationMenu(false);
    setStep("dashboard");
  }

  function verifyInstallation() {
    if (dashboardDataError) {
      setInstallationVerificationStatus("error");
      setInstallationVerificationMessage(
        "Fix the sync error first, then run Verify installation again.",
      );
      return;
    }

    const currentEventCount =
      liveRequestEvents.length + liveMemories.length + liveTimelineCount;
    if (currentEventCount > 0) {
      setInstallationVerificationStatus("connected");
      setInstallationVerificationMessage(
        "Connected. MemoryOS already sees live workspace events.",
      );
      return;
    }

    setInstallationVerificationStatus("waiting");
    setInstallationVerificationBaseline(currentEventCount);
    setInstallationVerificationMessage(
      "Waiting for events. Run your SDK, MCP, HTTP quickstart, or the playground.",
    );
    setDashboardRefreshKey((current) => current + 1);
  }

  async function sendSupportMessage() {
    const trimmedMessage = supportMessage.trim();
    if (!trimmedMessage || supportSendState === "sending") return;

    setSupportSendState("sending");
    setSupportErrorMessage(null);
    try {
      const organizationName = currentOrganization?.name ?? "memoryos";
      const subject = encodeURIComponent(`MemoryOS Support: ${organizationName}`);
      const body = encodeURIComponent(
        `Organization: ${organizationName}\nUser: ${userEmail || "unknown"}\n\n${trimmedMessage}`,
      );
      const authToken = await getConsoleAuthToken();
      if (authToken) {
        await fetchMemoryApi("/api/memory/process", authToken, {
          method: "POST",
          body: JSON.stringify({
            message: `[Support request] Org: ${organizationName}\nUser: ${userEmail || "unknown"}\n${trimmedMessage}`,
            threadId: "support-widget",
          }),
        });
      }
      window.location.href = `mailto:chavhansunilkumar753@gmail.com?subject=${subject}&body=${body}`;

      setSupportMessage("");
      setSupportSendState("sent");
      window.setTimeout(() => {
        setShowSupportComposer(false);
        setShowSupportWidget(false);
        setSupportSendState("idle");
      }, 650);
      setDashboardRefreshKey((current) => current + 1);
    } catch (error) {
      setSupportSendState("error");
      setSupportErrorMessage(
        error instanceof Error ? error.message : "Could not send support message.",
      );
    }
  }

  function renderDashboardMain(item = activeDashboardItem) {
    if (
      item === "Overview" ||
      item === "Command Center" ||
      item === "Command Center"
    ) {
      return (
        <OverviewSection
          stats={overviewStats}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
          memories={liveMemories}
          requestEvents={liveRequestEvents}
          insights={liveInsights}
          resumeData={liveResume}
          handoffData={liveHandoff}
          timelineCount={liveTimelineCount}
          installationVerification={{
            status: installationVerificationStatus,
            message: installationVerificationMessage,
            onVerify: verifyInstallation,
          }}
          actions={{
            "Quick Start": () => setActiveDashboardItem("Integrations"),
            "Continuity Lab": () => {
              window.location.href = "/developer-console/continuity-lab";
            },
            Playground: () => {
              window.location.href = "/playground";
            },
            Documentation: () => setActiveDashboardItem("Integrations"),
          }}
        />
      );
    }

    if (
      item === "Memories" ||
      item === "Memory Store" ||
      item === "Memory Vault" ||
      item === "Memory Store"
    ) {
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
          memories={
            selectedMemoryTags.length > 0
              ? liveMemories.filter(
                  (memory) =>
                    selectedMemoryTags.includes(memory.type) ||
                    selectedMemoryTags.includes(memory.status),
                )
              : liveMemories
          }
          requestEvents={liveRequestEvents}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
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
              current.includes(tag)
                ? current.filter((item) => item !== tag)
                : [...current, tag],
            )
          }
        />
      );
    }

    if (item === "Preflight Console") {
      return <PreflightSection />;
    }

    if (item === "Agent Workflow OS") {
      return <WorkflowOsSection />;
    }

    if (
      item === "Requests" ||
      item === "API Requests" ||
      item === "API Requests"
    ) {
      return (
        <RequestsSection
          requestEvents={liveRequestEvents}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
        />
      );
    }

    if (
      item === "Benchmarks" ||
      item === "Evaluation" ||
      item === "Evaluation"
    ) {
      return <BenchmarksSection />;
    }

    if (item === "Conflict & Staleness") {
      return (
        <ConflictStalenessSection
          requestEvents={liveRequestEvents}
          openLoops={openLoops}
        />
      );
    }

    if (
      item === "Connectors" ||
      item === "Data Sources" ||
      item === "Data Sources"
    ) {
      return (
        <ConnectorsSection
          liveMemoryCount={liveMemories.length}
          liveRequestCount={liveRequestEvents.length}
        />
      );
    }

    if (
      item === "Integrations" ||
      item === "Frameworks" ||
      item === "Frameworks"
    ) {
      const latestRequest = liveRequestEvents[0] ?? null;
      return (
        <IntegrationsSection
          installationVerification={{
            status: installationVerificationStatus,
            message: installationVerificationMessage,
            onVerify: verifyInstallation,
          }}
          liveSignals={{
            memoryCount: liveMemories.length,
            requestCount: liveRequestEvents.length,
            timelineCount: liveTimelineCount,
            lastRequestRoute: latestRequest?.route ?? null,
            lastRequestAt: latestRequest?.createdAt ?? null,
          }}
        />
      );
    }

    if (
      item === "Imports" ||
      item === "Bulk Import" ||
      item === "Ingestion Control Center"
    ) {
      return <ImportsSection liveMemoryCount={liveMemories.length} />;
    }

    if (item === "Portability") {
      return (
        <PortabilitySection
          workspaceName={currentOrganization?.name ?? "MemoryOS"}
        />
      );
    }

    if (item === "Company Brain") {
      return <CompanyBrainSection />;
    }

    if (item === "Governance") {
      return <GovernanceSection />;
    }

    if (item === "Contract Console") {
      const contract = {
        goal: liveResume?.summary?.slice(0, 140) ?? "",
        constraints: liveResume?.openLoops?.slice(0, 3) ?? [],
        decisions: liveHandoff?.recommendedNextActions?.slice(0, 3) ?? [],
        openRisks: liveResume?.openLoops?.slice(0, 3) ?? [],
        nextActions: liveHandoff?.recommendedNextActions?.slice(0, 3) ?? [],
      };
      return <ContractConsoleSection contract={contract} />;
    }

    if (item === "Context Inspector") {
      return <ContextInspectorSection requestEvents={liveRequestEvents} />;
    }

    if (
      item === "Playground" ||
      item === "Memory Playground" ||
      item === "Live Memory Playground" ||
      item === "Memory Playground"
    ) {
      return <PlaygroundSection variant="embedded" />;
    }

    if (item === "API Keys") {
      return <ApiKeysSection />;
    }

    if (
      item === "Agents" ||
      item === "Agent Profiles" ||
      item === "Agent Profiles"
    ) {
      return <AgentsSection />;
    }

    if (
      item === "Plugins" ||
      item === "Adapters" ||
      item === "Adapters"
    ) {
      return <PluginsSection />;
    }

    if (item === "Team") {
      return (
        <TeamSection
          workspaceName={currentOrganization?.name ?? "MemoryOS"}
          ownerName={userDisplayName}
          ownerEmail={userEmail}
          plan="Free"
        />
      );
    }

    if (item === "Billing") {
      return (
        <BillingSection
          workspaceName={currentOrganization?.name ?? "MemoryOS"}
          currentPlan="Free"
        />
      );
    }

    if (item === "Settings") {
      return (
        <SettingsSection
          workspaceName={currentOrganization?.name ?? "MemoryOS"}
          ownerName={userDisplayName}
          ownerEmail={userEmail}
          organizationId={currentOrganization?.id ?? ""}
        />
      );
    }

    if (item === "Agent Flight Recorder") {
      return <FlightRecorderSection requestEvents={liveRequestEvents} />;
    }

    return (
      <>
        <h1 className="text-[22px] font-semibold tracking-[-0.05em]">
            {item}
        </h1>
        <div className="mt-4 rounded-[10px] border border-dashed border-transparent bg-background px-6 py-8">
          <p className="text-[15px] leading-7 text-muted-foreground">
            {item} is next in the console buildout. We&apos;ve
            wired the navigation now, and this section can be filled with
            MemoryOS-specific workflows after the live data surfaces are stable.
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
    return <div className="min-h-svh bg-background" />;
  }

  if (
    (step === "organization-select" ||
      (step === "dashboard" &&
        organizations.length > 0 &&
        !currentOrganizationId)) &&
    organizations.length > 0
  ) {
    return (
      <div className="developer-console-root dark relative min-h-svh overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <HoverGlitchAsciiBackground />
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-80px)] max-w-[760px] flex-col items-center justify-center">
          <div className="mb-8">
            <MemoryStarLogo tone="white" />
          </div>
          <h1 className="text-center text-[34px] font-semibold tracking-[-0.05em] sm:text-[44px]">
            Select an organization
          </h1>
          <p className="mt-3 text-center text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
            Choose which organization you&apos;d like to work with.
          </p>

          <div className="mt-12 w-full space-y-3">
            {organizations.map((organization) => (
              <button
                key={organization.id}
                type="button"
                onClick={() => selectOrganization(organization.id)}
                className="flex w-full items-center justify-between gap-4 rounded-[8px] border-transparent bg-background px-5 py-5 text-left transition hover:border-border hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-primary text-[22px] font-semibold">
                    {organization.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[26px] font-semibold tracking-[-0.04em]">
                      {organization.name}
                    </p>
                    <p className="mt-1 text-[15px] text-muted-foreground">
                      {organization.connectors} data sources ·{" "}
                      {organization.docs} docs · {organization.tags} tags
                    </p>
                  </div>
                </div>
                <span className="rounded-[6px] bg-secondary px-3 py-2 font-mono text-[13px] text-muted-foreground">
                  {organization.plan}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={startNewOrganization}
            className="mt-10 rounded-[8px] border-transparent px-6 py-4 text-[18px] font-medium tracking-[0.06em] text-foreground transition hover:border-border hover:bg-transparent hover:text-foreground transition-colors duration-200"
          >
            + CREATE NEW ORGANIZATION
          </button>
        </div>
      </div>
    );
  }

  if (step === "dashboard") {
    return (
      <div className="developer-console-root dark h-dvh overflow-hidden bg-background text-foreground lg:grid lg:grid-cols-[268px_1fr]">
        <aside className="flex flex-col overflow-hidden border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:h-dvh lg:border-b-0 lg:border-r lg:border-r-sidebar-border">
          <div className="flex items-center justify-between border-b border-sidebar-border px-4 pt-[clamp(9px,1vh,11px)] pb-[clamp(14px,1.5vh,18px)] sm:px-5 lg:px-4">
            <Link href="/">
              <div className="origin-left scale-100 w-full max-w-[210px]">
                <MemoryStarLogo tone="white" />
              </div>
            </Link>
          </div>

          <div className="px-4 pb-[clamp(7px,0.8vh,10px)] sm:px-5 lg:px-4 mt-5">
            <div className="border-b border-sidebar-border pb-2">
              <input
                value={navSearchQuery}
                onChange={(event) => setNavSearchQuery(event.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-[14px] text-sidebar-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <nav className="relative min-h-0 flex-1 space-y-[clamp(9px,1vh,13px)] overflow-y-auto px-0 pb-4 mt-4">
            {filteredDashboardNav.map((group) => (
              <div
                key={group.section || "main"}
                className="px-4 sm:px-5 lg:px-4"
              >
                {group.section ? (
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {group.section}
                  </p>
                ) : null}
                <div className="space-y-[2px] -ml-4 -mr-4 lg:-ml-4 lg:-mr-4">
                  {group.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setActiveDashboardItem(item);
                      }}
                      className={`flex w-full items-center gap-2.5 py-[clamp(8px,0.9vh,10px)] px-4 text-left text-[14px] leading-[1.25] transition-all duration-300 ${
                        item === activeDashboardItem
                          ? "border-l-[3px] border-primary bg-transparent font-bold text-sidebar-foreground"
                          : "border-l-[3px] border-transparent text-muted-foreground hover:border-sidebar-border hover:text-sidebar-foreground"
                      }`}
                      title={item}
                    >
                      <Icon
                        name={dashboardItemIcon(item)}
                        className={`h-3.5 w-3.5 shrink-0 ${item === activeDashboardItem ? "text-sidebar-foreground" : "text-muted-foreground"}`}
                      />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-col overflow-hidden bg-background text-foreground">
          <div className="border-b border-border bg-background px-4 py-[clamp(9px,1vh,11px)] sm:px-5 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrganizationMenu((current) => !current);
                    setShowAccountMenu(false);
                  }}
                  className="flex items-center gap-2 rounded-[8px] px-2.5 py-1 transition hover:bg-transparent hover:text-foreground transition-colors duration-200"
                >
                  <span className="text-[17px] font-semibold tracking-[-0.04em] uppercase">
                    {currentOrganization?.name ?? "MEMORYOS"}
                  </span>
                  <span className="rounded-[6px] border-transparent px-2 py-0.5 text-[10px] tracking-[0.14em] text-muted-foreground">
                    FREE
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {showOrganizationMenu ? (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[336px] overflow-hidden rounded-[8px] border border-border bg-popover text-popover-foreground shadow-lg">
                    {organizations.map((organization) => (
                      <button
                        key={organization.id}
                        type="button"
                        onClick={() => selectOrganization(organization.id)}
                        className="flex w-full items-center justify-between gap-4 border-b border-border px-4 py-4 text-left transition hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[14px] font-semibold text-secondary-foreground">
                            {organization.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[17px] font-semibold">
                              {organization.name}
                            </p>
                            <p className="text-[13px] text-muted-foreground">Free</p>
                          </div>
                        </div>
                        {organization.id === currentOrganizationId ? (
                          <span className="text-primary">✓</span>
                        ) : null}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={startNewOrganization}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left text-[16px] font-medium transition hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                    >
                      <span className="text-[22px] leading-none">+</span>
                      Create organization
                    </button>
                  </div>
                ) : null}
              </div>

              <div
                className={`flex items-center gap-4 text-[13px] font-medium tracking-[0.08em] ${
                  isLightTheme ? "text-black/70" : "text-muted-foreground"
                }`}
              >
                <a href="#" className={isLightTheme ? "hover:text-black" : "hover:text-foreground"}>
                  DOCS
                </a>
                <button
                  type="button"
                  onClick={() => setShowSupportWidget(true)}
                  className={isLightTheme ? "hover:text-black" : "hover:text-foreground"}
                >
                  SUPPORT
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu((current) => !current);
                      setShowOrganizationMenu(false);
                    }}
                    className={`grid h-10 w-10 place-items-center rounded-full text-[14px] font-semibold ${
                      isLightTheme
                        ? "bg-muted text-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {userInitial}
                  </button>
                  {showAccountMenu ? (
                    <div
                      className={`absolute right-0 top-[calc(100%+10px)] z-20 w-[296px] overflow-hidden rounded-[8px] border shadow-lg ${
                        isLightTheme
                          ? "border-black/10 bg-white text-foreground"
                          : "border-border bg-popover text-popover-foreground"
                      }`}
                    >
                      <div className="border-b border-border px-4 py-4">
                        <p className="text-[22px] font-semibold">
                          {userDisplayName}
                        </p>
                        <p
                          className={`mt-1 text-[14px] ${
                            isLightTheme ? "text-black/45" : "text-muted-foreground"
                          }`}
                        >
                          {userEmail}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDashboardItem("Settings");
                          setShowAccountMenu(false);
                        }}
                        className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left text-[16px] font-medium transition hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      >
                        Account settings
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-4 text-left text-[16px] font-medium text-destructive transition hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="memoryos-console-scroll min-h-0 flex-1 overflow-y-auto bg-background px-4 py-4 sm:px-5 lg:px-6">
            <div className="developer-console-sections mx-auto w-full max-w-[1360px] bg-background">
              {mountedDashboardItems.map((item) => (
                <div key={item} className={item === activeDashboardItem ? "block" : "hidden"}>
                  {renderDashboardMain(item)}
                </div>
              ))}
            </div>
          </div>
        </main>

        {showSupportWidget ? (
          <div className="fixed bottom-5 right-5 z-30 w-[min(560px,calc(100vw-24px))] overflow-hidden rounded-[8px] border border-border bg-card shadow-2xl shadow-black/30 dark:shadow-black/50">
            {!showSupportComposer ? (
              <div className="p-7 sm:p-8">
                <button
                  type="button"
                  onClick={() => setShowSupportWidget(false)}
                  className="absolute right-5 top-4 text-[28px] leading-none text-muted-foreground transition hover:text-foreground"
                >
                  ×
                </button>
                <div className="grid h-16 w-16 place-items-center ">
                  <MemoryStarLogo tone="white" />
                </div>
                <h3 className="mt-9 text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.045em]">
                  Hey {currentOrganization?.name ?? "there"}
                  <br />
                  How can we help?
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDashboardItem("Integrations");
                    setShowSupportWidget(false);
                  }}
                  className="mt-8 text-[20px] font-medium text-foreground transition hover:text-foreground"
                >
                  View documentation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSupportSendState("idle");
                    setSupportErrorMessage(null);
                    setShowSupportComposer(true);
                  }}
                  className="mt-8 flex h-20 w-full items-center rounded-[8px] border border-primary/50 bg-primary/15 px-6 text-[22px] font-medium text-foreground transition hover:bg-primary/20"
                >
                  Start a conversation
                </button>
                <p className="mt-3 text-center text-[14px] text-muted-foreground">
                  Powered by  memoryOS support system
                </p>
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSupportSendState("idle");
                      setSupportErrorMessage(null);
                      setShowSupportComposer(false);
                    }}
                    className="text-[28px] text-muted-foreground transition hover:text-foreground"
                  >
                    ‹
                  </button>
                  <p className="text-[28px] font-semibold tracking-[-0.03em]">
                    Send us a message
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSupportSendState("idle");
                      setSupportErrorMessage(null);
                      setShowSupportComposer(false);
                      setShowSupportWidget(false);
                    }}
                    className="text-[28px] text-muted-foreground transition hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
                <p className="mx-auto mt-12 max-w-[420px] text-center text-[17px] leading-8 text-muted-foreground">
                  We&apos;re happy to help. Message us whenever you need and
                  we&apos;ll get back to you as soon as possible.
                </p>
                <div className="mt-10 rounded-[8px] border border-primary/35 bg-muted/50 p-4">
                  <textarea
                    value={supportMessage}
                    onChange={(event) => {
                      setSupportMessage(event.target.value);
                      if (supportSendState === "error") {
                        setSupportSendState("idle");
                        setSupportErrorMessage(null);
                      }
                    }}
                    placeholder="Start typing"
                    className="min-h-[130px] w-full resize-none bg-transparent text-[18px] text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[22px] text-muted-foreground">
                      <span>⌂</span>
                      <span className="font-semibold">B</span>
                      <span className="italic">I</span>
                      <span>{"</>"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={sendSupportMessage}
                      className="rounded-[8px] bg-primary px-6 py-3 text-[17px] font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!supportMessage.trim() || supportSendState === "sending"}
                    >
                      {supportSendState === "sending" ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
                {supportSendState === "error" && supportErrorMessage ? (
                  <p className="mt-3 text-[13px] text-destructive">
                    {supportErrorMessage}
                  </p>
                ) : null}
                {supportSendState === "sent" ? (
                  <p className="mt-3 text-[13px] text-chart-2">
                    Message sent. Thank you.
                  </p>
                ) : null}
                <p className="mt-4 text-center text-[14px] text-muted-foreground">
                  Powered by Plain
                </p>
              </div>
            )}
          </div>
        ) : null}

        <style jsx>{`
          .memoryos-console-scroll {
            scrollbar-width: thin;
            scrollbar-color: var(--muted) var(--background);
          }

          .memoryos-console-scroll::-webkit-scrollbar {
            width: 10px;
          }

          .memoryos-console-scroll::-webkit-scrollbar-track {
            background: var(--background);
          }

          .memoryos-console-scroll::-webkit-scrollbar-thumb {
            background: var(--muted);
            border-radius: 999px;
            border: 2px solid var(--background);
          }

          .memoryos-console-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--border);
          }

          .memoryos-console-scroll::-webkit-scrollbar-button {
            background: var(--background);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`min-h-svh ${
        isLightTheme ? "bg-muted/40 text-foreground" : "bg-background text-foreground"
      }`}
    >
      <ProgressHeader step={step} entryPath={entryPath} />

      <div className="mx-auto flex min-h-[calc(100svh-89px)] w-full max-w-[1440px] flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex-1 py-8 sm:py-10 lg:py-14">
          {step === "org" ? (
            <section className="mx-auto max-w-[920px]">
              <div className="text-center">
                <h1 className="text-balance text-[36px] font-semibold tracking-[-0.05em] sm:text-[44px]">
                  Create Your Organization
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
                  Set up your team&apos;s workspace in MemoryOS.
                </p>
              </div>

              <div className="mx-auto mt-12 max-w-[760px]">
                <label className="block text-[15px] font-medium text-foreground">
                  Organization name <span className="text-destructive">*</span>
                </label>
                <input
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  placeholder="Acme Inc."
                  className="mt-4 h-14 w-full rounded-[8px] border-transparent bg-background px-5 text-[18px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />

                <div className="mt-9">
                  <p className="text-[15px] font-medium text-foreground">
                    Company size
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCompanySize(size)}
                        className={`rounded-[8px] border px-4 py-4 text-[18px] transition ${
                          companySize === size
                            ? "border-primary bg-primary/15 text-foreground"
                            : "border-transparent bg-card text-foreground hover:border-border"
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
                <p className="mt-3 text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
                  This helps us tailor your experience. You can always change
                  this later.
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
                        ? "border-primary bg-primary/15"
                        : "border-transparent bg-card hover:border-border"
                    }`}
                  >
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {option.eyebrow}
                    </p>
                    <p className="mt-5 text-[30px] font-semibold tracking-[-0.04em]">
                      {option.title}
                    </p>
                    <p className="mt-3 max-w-[260px] text-[18px] leading-8 text-muted-foreground">
                      {option.description}
                    </p>
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
                <p className="mt-3 text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
                  Choose the category that best describes your use case with
                  MemoryOS.
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
                        ? "border-primary bg-primary/15"
                        : "border-transparent bg-card hover:border-border"
                    }`}
                  >
                    <p className="text-[30px] font-semibold tracking-[-0.04em]">
                      {item.title}
                    </p>
                    <p className="mt-3 max-w-[300px] text-[18px] leading-8 text-muted-foreground">
                      {item.description}
                    </p>
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
                <p className="mt-3 text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
                  Define how content should be filtered and processed for your
                  use case.
                </p>
              </div>

              <div className="mt-12">
                <label className="block text-[15px] font-medium text-foreground">
                  Organizational Context
                </label>
                <textarea
                  value={orgContext}
                  onChange={(event) => setOrgContext(event.target.value)}
                  placeholder={`Describe how content should be processed for your organization${selectedUseCase ? ` and ${selectedUseCase.title.toLowerCase()} use case` : ""}...`}
                  className="mt-4 min-h-[210px] w-full rounded-[8px] border-transparent bg-card px-5 py-5 text-[18px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="mt-8 max-w-[380px]">
                <input
                  value={templateQuery}
                  onChange={(event) => setTemplateQuery(event.target.value)}
                  placeholder="Search templates..."
                  className="h-14 w-full rounded-[8px] border-transparent bg-background px-5 text-[18px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="mt-7 flex gap-6 overflow-x-auto pb-2 text-[16px]">
                {TEMPLATE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTemplateTab(tab)}
                    className={`shrink-0 border-b pb-3 transition ${
                      templateTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
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
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/30 hover:border-border"
                    }`}
                  >
                    <p className="text-[18px] font-semibold">{card.title}</p>
                    <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                      {card.preview}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "integration" ? (
            <section className="mx-auto max-w-[1240px]">
              <div className="text-center">
                <h1 className="text-balance text-[34px] font-semibold tracking-[-0.05em] sm:text-[42px]">
                  {entryPath === "plugins"
                    ? "Choose your plugin"
                    : "What are you building?"}
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
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
                      onChange={(event) =>
                        setIntegrationQuery(event.target.value)
                      }
                      placeholder="Search solutions..."
                      className="h-14 w-full rounded-[8px] border-transparent bg-background px-5 text-[18px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
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
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div
                className={`mt-6 grid gap-4 ${entryPath === "plugins" ? "mx-auto max-w-[640px] md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}
              >
                {integrationCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedIntegration(card.id)}
                    className={`rounded-[8px] border p-5 text-left transition ${
                      selectedIntegration === card.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/30 hover:border-border"
                    }`}
                  >
                    <IconBadge label={card.accent} />
                    <p className="mt-8 text-[18px] font-semibold">
                      {card.title}
                    </p>
                    {entryPath === "plugins" ? null : (
                      <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                        {card.subtitle}
                      </p>
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
                  {entryPath === "plugins"
                    ? `Set up ${selectedIntegrationDetails.title}`
                    : `Set up your ${selectedIntegrationDetails.title} integration`}
                </h1>
                <p className="mt-3 text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
                  {entryPath === "plugins"
                    ? "Follow the docs to connect your plugin."
                    : "Follow these steps to connect."}
                </p>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-border bg-card px-5 py-5">
                <div className="flex items-center gap-4">
                  <IconBadge label={selectedIntegrationDetails.accent} />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[20px] font-semibold">
                        {selectedIntegrationDetails.title}
                      </p>
                      <span className="rounded-[6px] bg-chart-2/15 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.12em] text-chart-2">
                        {entryPath === "plugins" ? "TypeScript" : "MemoryOS"}
                      </span>
                    </div>
                    <p className="mt-1 text-[16px] text-muted-foreground">
                      {selectedIntegrationDetails.subtitle}
                    </p>
                  </div>
                </div>
                <a
                  href="#"
                  className="text-[14px] font-medium tracking-[0.06em] text-muted-foreground hover:text-foreground"
                >
                  Docs
                </a>
              </div>

              <div className="mt-6 space-y-3">
                {(entryPath === "plugins"
                  ? (pluginIntegrationDetails?.steps ?? []).map(
                      (copy, index) => ({
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
                      }),
                    )
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
                    ]
                ).map((section) => {
                  const expanded = expandedSetupSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setExpandedSetupSection(section.id)}
                      className="w-full rounded-[8px] border border-border bg-muted/40 p-5 text-left transition hover:bg-muted/60"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-[16px] font-semibold text-muted-foreground">
                            {section.id}
                          </div>
                          <div>
                            <p className="text-[20px] font-semibold">
                              {section.title}
                            </p>
                            {!expanded ? (
                              <p className="mt-1 text-[15px] text-muted-foreground">
                                {section.copy}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span className="text-[22px] text-muted-foreground">
                          {expanded ? "−" : "+"}
                        </span>
                      </div>
                      {expanded ? (
                        <div className="mt-5 border-t border-transparent pt-5">
                          <p className="text-[15px] leading-7 text-muted-foreground">
                            {entryPath === "plugins"
                              ? section.copy
                              : section.id === 1
                                ? "Run this command in your project directory:"
                                : section.id === 2
                                  ? "Add these values in your environment file:"
                                  : "Run a test command to confirm setup:"}
                          </p>
                          <div
                            className={`mt-4 rounded-[8px] border border-border bg-muted/50 px-5 py-5 ${entryPath === "plugins" ? "text-[16px] leading-7 text-foreground" : "font-mono text-[15px] text-foreground/92"}`}
                          >
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
                <div className="mt-10 text-[18px] leading-9 text-muted-foreground">
                  <p className="font-medium text-muted-foreground">What you get</p>
                  <ul className="mt-4 list-disc space-y-1 pl-6">
                    {(pluginIntegrationDetails?.benefits ?? []).map(
                      (benefit) => (
                        <li key={benefit}>{benefit}</li>
                      ),
                    )}
                  </ul>
                  <p className="mt-10 text-muted-foreground">
                    Click &quot;Get started&quot; to finish onboarding. You can
                    configure this plugin from the Plugins page.
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <footer className="border-t border-transparent py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[15px] leading-7 text-muted-foreground">
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
                className="rounded-[8px] px-4 py-3 text-[15px] font-medium text-foreground/92 transition hover:bg-transparent hover:text-foreground transition-colors duration-200 disabled:cursor-not-allowed disabled:text-muted-foreground"
              >
                PREVIOUS
              </button>

              {step === "context" ||
              step === "integration" ||
              step === "setup" ? (
                <button
                  type="button"
                  onClick={() =>
                    step === "setup" ? completeOnboarding() : advance(true)
                  }
                  disabled={isSaving}
                  className="rounded-[8px] px-4 py-3 text-[15px] font-medium text-muted-foreground transition hover:bg-transparent hover:text-foreground transition-colors duration-200 disabled:cursor-not-allowed disabled:text-muted-foreground"
                >
                  SKIP
                </button>
              ) : null}

              <button
                type="button"
                onClick={() =>
                  step === "setup" ? completeOnboarding() : advance()
                }
                disabled={(!canContinue && step !== "setup") || isSaving}
                className="rounded-[8px] bg-primary px-5 py-3 text-[15px] font-semibold tracking-[0.06em] text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                {isSaving
                  ? "SAVING..."
                  : step === "setup"
                    ? "GET STARTED"
                    : "NEXT STEP"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
