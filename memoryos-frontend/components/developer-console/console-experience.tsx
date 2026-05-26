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
import { ApiKeysSection } from "@/components/developer-console/sections/api-keys-section";
import { BillingSection } from "@/components/developer-console/sections/billing-section";
import { ConnectorsSection } from "@/components/developer-console/sections/connectors-section";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import { IntegrationsSection } from "@/components/developer-console/sections/integrations-section";
import { FlightRecorderSection } from "@/components/developer-console/sections/flight-recorder-section";
import { MemoryEvolutionSection } from "@/components/developer-console/sections/memory-evolution-section";
import { MemoryGraphSection } from "@/components/developer-console/sections/memory-graph-section";
import { OverviewSection } from "@/components/developer-console/sections/overview-section";
import { GovernanceSection } from "@/components/developer-console/sections/governance-section";
import { buildHeaderNotifications } from "@/components/developer-console/intel-console-header-bar";
import { IntelligenceConsoleLayout } from "@/components/developer-console/intelligence-console-layout";
import {
  RequestsSection,
  type RequestSectionEvent,
} from "@/components/developer-console/sections/requests-section";
import { SettingsSection } from "@/components/developer-console/sections/settings-section";
import { TeamSection } from "@/components/developer-console/sections/team-section";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/developer-console/console-ui";
import { IntelligenceSectionWrap } from "@/components/developer-console/intelligence-section-wrap";
import { osNavIcon } from "@/components/developer-console/os-nav-icons";
import { Button } from "@/components/ui/button";
import type { BillingPlan } from "@/lib/plan-catalog";
import {
  activateCompanyBrainFunnel,
  focusFunnelOnGithub,
  markFunnelLabOpened,
} from "@/lib/company-brain-funnel";

import {
  clearStoredMemoryTokens,
  fetchMemoryTokenFromBridge,
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

/**
 * Company Brain execution blueprint — canonical developer console IA.
 * @see product vision: ingestion → memory → agents → continuity → execution
 */
const DASHBOARD_NAV = [
  {
    section: "Intelligence",
    items: [
      "Overview",
      "Connected Intelligence Sources",
      "Memory Graph",
      "Runtime Activity",
      "Agent Activity Timeline",
      "Memory Evolution Timeline",
      "Security + Governance",
    ],
  },
  {
    section: "Workspaces",
    items: ["Continuity Lab", "Playground"],
  },
  {
    section: "Developer",
    items: ["Integrations & SDK"],
  },
  {
    section: "Organization",
    items: ["Team", "Billing", "Settings", "API Keys"],
  },
] as const;

const CONSOLE_NAV_ITEMS = new Set<string>(
  DASHBOARD_NAV.flatMap((group) => group.items as readonly string[]),
);

/** Old sidebar labels → current routes (bookmarks / saved state). */
const LEGACY_NAV_ALIASES: Record<string, string> = {
  "Command Center": "Overview",
  "Overview Dashboard": "Overview",
  "Data Sources": "Connected Intelligence Sources",
  Connectors: "Connected Intelligence Sources",
  Integrations: "Integrations & SDK",
  Frameworks: "Integrations & SDK",
  Plugins: "Integrations & SDK",
  Adapters: "Integrations & SDK",
  Imports: "Connected Intelligence Sources",
  "Ingestion Control Center": "Connected Intelligence Sources",
  "API Requests": "Runtime Activity",
  Requests: "Runtime Activity",
  "Agent Flight Recorder": "Agent Activity Timeline",
  "Flight Recorder": "Agent Activity Timeline",
  "Memory Vault": "Memory Graph",
  Memories: "Memory Graph",
  "Memory Store": "Memory Graph",
  "Company Brain": "Memory Graph",
  "Agent Profiles": "Integrations & SDK",
  Governance: "Security + Governance",
  Preflight: "Playground",
  Benchmarks: "Runtime Activity",
  "Conflict + Staleness": "Memory Evolution Timeline",
  "Context Inspector": "Memory Graph",
  "Workflow OS": "Runtime Activity",
  Agents: "Agent Activity Timeline",
  "Run Demo": "Playground",
  Projects: "Overview",
  Handoffs: "Continuity Lab",
  Portability: "Integrations & SDK",
  "Contract Console": "Integrations & SDK",
};

function resolveDashboardItem(item: string): string {
  const mapped = LEGACY_NAV_ALIASES[item] ?? item;
  if (CONSOLE_NAV_ITEMS.has(mapped)) {
    return mapped;
  }
  return "Overview";
}

function isWorkspaceTabItem(item: string): boolean {
  return item === "Continuity Lab" || item === "Playground";
}

function openWorkspaceTab(item: string, options?: { autostartLab?: boolean }) {
  if (item === "Continuity Lab") {
    markFunnelLabOpened();
    const params = options?.autostartLab ? "?autostart=1&autobrief=1" : "";
    window.open(`/continuity-lab${params}`, "_blank", "noopener,noreferrer");
    return;
  }
  if (item === "Playground") {
    window.open("/playground", "_blank", "noopener,noreferrer");
  }
}

function dashboardItemIcon(item: string): IconName {
  const resolved = resolveDashboardItem(item);
  const map: Record<string, IconName> = {
    Overview: "radar",
    "Connected Intelligence Sources": "search",
    "Memory Graph": "graph",
    "Runtime Activity": "timeline",
    "Agent Activity Timeline": "agent",
    "Memory Evolution Timeline": "vault",
    "Security + Governance": "settings",
    "Integrations & SDK": "memory",
    "API Keys": "vault",
    Team: "agent",
    Billing: "graph",
    Settings: "settings",
  };
  return map[resolved] ?? "memory";
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
    <div className="grid h-11 w-11 place-items-center rounded-lg border-transparent bg-background text-sm font-semibold tracking-wider text-foreground/90">
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
      <div className="absolute inset-0 bg-muted/30" />
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
            var(--foreground) 0%,
            color-mix(in oklch, var(--foreground) 92%, transparent) 42%,
            color-mix(in oklch, var(--foreground) 18%, transparent) 66%,
            transparent 78%
          );
          mask-image: radial-gradient(
            circle var(--cursor-r) at var(--cursor-x) var(--cursor-y),
            var(--foreground) 0%,
            color-mix(in oklch, var(--foreground) 92%, transparent) 42%,
            color-mix(in oklch, var(--foreground) 18%, transparent) 66%,
            transparent 78%
          );
        }

        .glitch-halo {
          background:
            radial-gradient(
              circle at var(--cursor-x) var(--cursor-y),
              color-mix(in oklch, var(--foreground) 14%, transparent),
              color-mix(in oklch, var(--foreground) 3%, transparent) 42%,
              transparent 72%
            ),
            radial-gradient(
              circle at var(--cursor-x) var(--cursor-y),
              color-mix(in oklch, var(--primary) 16%, transparent),
              transparent 58%
            );
          filter: blur(18px);
        }

        .glitch-layer {
          position: absolute;
          inset: -6%;
          overflow: hidden;
          color: color-mix(in oklch, var(--foreground) 92%, transparent);
          white-space: pre;
          font-family:
            "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 18px;
          line-height: 1.4;
          letter-spacing: 0.16em;
          text-shadow:
            0 0 8px color-mix(in oklch, var(--foreground) 16%, transparent),
            0 0 20px color-mix(in oklch, var(--foreground) 8%, transparent);
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
            var(--foreground) 0 12px,
            transparent 12px 16px,
            var(--foreground) 16px 28px
          );
          mask-image: repeating-linear-gradient(
            180deg,
            var(--foreground) 0 12px,
            transparent 12px 16px,
            var(--foreground) 16px 28px
          );
        }

        .glitch-layer-b {
          transform: translateX(var(--glitch-shift-b));
          opacity: calc(var(--glitch-flicker) * 0.45);
          filter: blur(0.4px);
          -webkit-mask-image: repeating-linear-gradient(
            180deg,
            transparent 0 6px,
            var(--foreground) 6px 15px,
            transparent 15px 19px,
            var(--foreground) 19px 30px
          );
          mask-image: repeating-linear-gradient(
            180deg,
            transparent 0 6px,
            var(--foreground) 6px 15px,
            transparent 15px 19px,
            var(--foreground) 19px 30px
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
              color-mix(in oklch, var(--foreground) 4%, transparent) 0 1px,
              transparent 1px 8px
            ),
            linear-gradient(
              90deg,
              transparent,
              color-mix(in oklch, var(--foreground) 5%, transparent),
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
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <MemoryStarLogo tone="black" />
        </Link>
        <div className="mx-auto hidden w-full max-w-md items-center gap-3 sm:flex">
          <div className="h-1.5 flex-1 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: progress }}
            />
          </div>
        </div>
        <div className="ml-auto text-sm font-medium tracking-widest text-foreground">
          {currentStep}/{totalSteps}
        </div>
      </div>
      <div className="px-4 pb-4 sm:hidden">
        <div className="h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
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
  warning?: string;
};

type InsightsResponse = {
  totalsByType: Record<string, number>;
  totalsByStatus: Record<string, number>;
  topSkills: string[];
  activeProjects: string[];
  recentMilestones: string[];
  warning?: string;
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

type ContinueProjectBriefData = {
  whatChangedRecently: string[];
  currentGoal: string;
  keyDecisions: string[];
  openBlockers: string[];
  riskyFiles: string[];
  nextBestAction: string;
  mustKnowContextForAgent: string[];
};

function mapContinueBriefToResume(brief: ContinueProjectBriefData): ResumeResponseData {
  const contextLines = brief.mustKnowContextForAgent.filter((line) => line.trim().length > 0);
  const recentChanges = brief.whatChangedRecently.filter((line) => line.trim().length > 0);
  const openLoops = [...brief.openBlockers, ...brief.keyDecisions]
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 6);

  return {
    summary:
      brief.currentGoal.trim() ||
      contextLines[0] ||
      "Continue from the latest indexed organizational memory.",
    lastKnownState:
      recentChanges.length > 0
        ? recentChanges.join(" ")
        : "No recent indexed changes yet.",
    openLoops:
      openLoops.length > 0
        ? openLoops
        : ["No blockers indexed yet. Add memory from a connector or continuity run."],
    recommendedNextStep:
      brief.nextBestAction.trim() ||
      "Connect GitHub or local files, sync once, then open Continuity Lab.",
    usedMemories: [],
  };
}

function continuityProjectName(workspaceLabel: string): string {
  return workspaceLabel.replace(/ Continuity Workspace$/i, "").trim() || "MemoryOS";
}

type HandoffApiPayload = {
  summary?: string;
  lastKnownState?: string;
  currentState?: string;
  openLoops?: string[];
  nextRecommendedAction?: string;
  recommendedNextActions?: string[];
  keyMemories?: HandoffResponseData["keyMemories"];
  keyDecisions?: string[];
};

function mapHandoffPayload(payload: HandoffApiPayload): HandoffResponseData {
  const recommended =
    Array.isArray(payload.recommendedNextActions) && payload.recommendedNextActions.length > 0
      ? payload.recommendedNextActions
      : payload.nextRecommendedAction
        ? [payload.nextRecommendedAction]
        : [];

  return {
    summary: payload.summary?.trim() || "Handoff package ready from live memory.",
    currentState:
      payload.currentState?.trim() ||
      payload.lastKnownState?.trim() ||
      "Latest organizational state indexed.",
    openLoops: Array.isArray(payload.openLoops)
      ? payload.openLoops.filter((loop) => typeof loop === "string" && loop.trim().length > 0)
      : [],
    recommendedNextActions: recommended,
    keyMemories: Array.isArray(payload.keyMemories) ? payload.keyMemories : [],
  };
}

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
    agent?: string;
    payloadSummary?: unknown;
    responseSummary?: unknown;
    errorDetails?: unknown;
  }>;
  warning?: string;
};

type RequestHistoryEntry = RequestHistoryResponse["requests"][number];

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function mapRequestHistoryEntryToEvent(entry: RequestHistoryEntry): RequestSectionEvent {
  return {
    id: entry.id,
    createdAt: entry.createdAt,
    type: entry.routeType,
    status: entry.status,
    latencyMs: entry.durationMs,
    route: entry.path,
    method: entry.method,
    statusCode: entry.statusCode,
    agent: entry.agent,
    payloadSummary: toOptionalString(entry.payloadSummary),
    responseSummary: toOptionalString(entry.responseSummary),
    errorDetails: toOptionalString(entry.errorDetails),
  };
}

type TimelineHistoryResponse = {
  count: number;
  events: Array<{
    id: string;
    eventType: string;
    timestamp: string;
  }>;
  warning?: string;
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

function extractApiWarning(payload: unknown): string | null {
  if (isRecord(payload) && typeof payload.warning === "string") {
    return payload.warning;
  }

  return null;
}

function formatApiWarning(warning: string): string {
  return warning.replace(/^memory_/, "").replace(/_/g, " ");
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
  const bridgeToken = await fetchMemoryTokenFromBridge().catch(() => null);
  if (bridgeToken) {
    return bridgeToken;
  }

  const envToken = getConsoleAuthTokenFromEnv();
  if (envToken) {
    return envToken;
  }

  return null;
}

const DASHBOARD_SSE_REFRESH_KINDS = new Set([
  "resume_generated",
  "handoff_generated",
  "memory_processed",
  "connector_update",
  "sync_log",
  "governance_review_queued",
]);

const DASHBOARD_SSE_REFRESH_DEBOUNCE_MS = 5_000;
const BILLING_REFRESH_KINDS = new Set([
  "request_logged",
  "memory_processed",
  "resume_generated",
  "handoff_generated",
]);

async function fetchMemoryApi<T>(
  routePath: string,
  token: string,
  init?: RequestInit,
  attempt = 0,
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
    if (response.status === 429 && attempt < 2) {
      const retryAfterHeader = Number(response.headers.get("retry-after"));
      const retryAfterMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : 1500;
      await new Promise((resolve) => window.setTimeout(resolve, retryAfterMs));
      return fetchMemoryApi<T>(routePath, token, init, attempt + 1);
    }

    throw new Error(
      extractErrorMessage(
        payload,
        `Request failed (${response.status}) for ${requestUrl}`,
      ),
    );
  }

  return normalizeApiPayload<T>(payload);
}

function compactDashboardLimit(path: string): string {
  return path.replace("limit=200", "limit=80").replace("limit=120", "limit=80");
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
  const [activeDashboardItem, setActiveDashboardItem] = useState("Overview");
  const [navSearchQuery, setNavSearchQuery] = useState("");
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
  const [liveTimelineEvents, setLiveTimelineEvents] = useState<
    Array<{ id: string; eventType: string; timestamp: string }>
  >([]);
  const [liveResume, setLiveResume] = useState<ResumeResponseData | null>(null);
  const [liveHandoff, setLiveHandoff] = useState<HandoffResponseData | null>(
    null,
  );
  const [liveCurrentPlan, setLiveCurrentPlan] = useState<BillingPlan>("Free");
  const [githubFunnelStatus, setGithubFunnelStatus] = useState({
    connected: false,
    synced: false,
  });
  const [liveRequestEvents, setLiveRequestEvents] = useState<
    RequestSectionEvent[]
  >([]);
  const continuityLoadedProjectRef = useRef<string | null>(null);
  const loadDashboardDataRef = useRef<
    ((hasRetriedAuth?: boolean) => Promise<void>) | null
  >(null);
  const loadLiveBillingRef = useRef<(() => Promise<void>) | null>(null);
  const lastBillingFetchAtRef = useRef(0);
  // Benchmark state is now self-contained inside BenchmarksSection via useBenchmarks hook
  const installationEventCount =
    liveRequestEvents.length + liveMemories.length + liveTimelineCount;
  const realtimeVersion = dashboardRefreshKey + installationEventCount;
  const isLightTheme = resolvedTheme === "light";
  const headerNotifications = useMemo(
    () =>
      buildHeaderNotifications({
        requestEvents: liveRequestEvents,
        memoryCount: liveMemories.length,
        hasConnectedSource: liveMemories.length > 0 || liveTimelineCount > 0,
        installationConnected: installationVerificationStatus === "connected",
      }),
    [
      liveRequestEvents,
      liveMemories.length,
      liveTimelineCount,
      installationVerificationStatus,
    ],
  );
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
      void loadDashboardDataRef.current?.(false);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [
    installationEventCount,
    installationVerificationBaseline,
    installationVerificationStatus,
  ]);

  useEffect(() => {
    if (!hydrated || step !== "dashboard") return;

    let memoryStream: EventSource | null = null;
    let connectorStream: EventSource | null = null;
    let disposed = false;
    let memoryReconnectTimer: number | null = null;
    let connectorReconnectTimer: number | null = null;
    let memoryReconnectAttempts = 0;
    let connectorReconnectAttempts = 0;
    let lastRefreshAt = 0;
    let lastBillingRefreshAt = 0;

    const queueBillingRefresh = () => {
      const now = Date.now();
      if (now - lastBillingRefreshAt < 4_000) return;
      lastBillingRefreshAt = now;
      void loadLiveBillingRef.current?.();
    };

    const queueDashboardRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt < DASHBOARD_SSE_REFRESH_DEBOUNCE_MS) return;
      lastRefreshAt = now;
      void loadDashboardDataRef.current?.(false);
    };
    const handleRealtimeMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as {
          kind?: string;
          status?: string;
          payload?: Record<string, unknown>;
        };
        if (payload.status === "offline") {
          return;
        }
        if (payload.kind === "request_logged" && isRecord(payload.payload?.request)) {
          const request = payload.payload.request as RequestHistoryEntry;
          setLiveRequestEvents((current) => {
            const next = [mapRequestHistoryEntryToEvent(request), ...current];
            return Array.from(
              new Map(next.map((entry) => [entry.id, entry])).values(),
            )
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .slice(0, 200);
          });
          queueBillingRefresh();
          return;
        }
        if (payload.kind && BILLING_REFRESH_KINDS.has(payload.kind)) {
          queueBillingRefresh();
        }
        if (payload.kind && DASHBOARD_SSE_REFRESH_KINDS.has(payload.kind)) {
          queueDashboardRefresh();
        }
      } catch {
        // Ignore malformed SSE payloads; live request rows are patched inline above.
      }
    };

    const scheduleMemoryReconnect = () => {
      if (disposed || memoryReconnectTimer) return;
      const delay = Math.min(
        60000,
        5000 * Math.max(1, memoryReconnectAttempts + 1),
      );
      memoryReconnectAttempts += 1;
      memoryReconnectTimer = window.setTimeout(() => {
        memoryReconnectTimer = null;
        void openMemoryStream();
      }, delay);
    };

    const scheduleConnectorReconnect = () => {
      if (disposed || connectorReconnectTimer) return;
      const delay = Math.min(
        60000,
        5000 * Math.max(1, connectorReconnectAttempts + 1),
      );
      connectorReconnectAttempts += 1;
      connectorReconnectTimer = window.setTimeout(() => {
        connectorReconnectTimer = null;
        void openConnectorStream();
      }, delay);
    };

    async function openMemoryStream() {
      const token = await getConsoleAuthToken();
      if (!token || disposed) return;

      try {
        memoryStream?.close();
        memoryStream = new EventSource("/api/memory/events");
        memoryStream.onopen = () => {
          memoryReconnectAttempts = 0;
        };
        memoryStream.onmessage = handleRealtimeMessage;
        memoryStream.onerror = () => {
          memoryStream?.close();
          memoryStream = null;
          scheduleMemoryReconnect();
        };
      } catch {
        scheduleMemoryReconnect();
      }
    }

    async function openConnectorStream() {
      const token = await getConsoleAuthToken();
      if (!token || disposed) return;

      try {
        connectorStream?.close();
        connectorStream = new EventSource("/api/connector/events");
        connectorStream.onopen = () => {
          connectorReconnectAttempts = 0;
        };
        connectorStream.onmessage = handleRealtimeMessage;
        connectorStream.onerror = () => {
          connectorStream?.close();
          connectorStream = null;
          scheduleConnectorReconnect();
        };
      } catch {
        scheduleConnectorReconnect();
      }
    }

    void openMemoryStream();
    void openConnectorStream();

    return () => {
      disposed = true;
      if (memoryReconnectTimer) window.clearTimeout(memoryReconnectTimer);
      if (connectorReconnectTimer) window.clearTimeout(connectorReconnectTimer);
      memoryStream?.close();
      connectorStream?.close();
    };
  }, [hydrated, step]);

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
    let lastDashboardFetchAt = 0;
    async function loadDashboardData(hasRetriedAuth = false) {
      const now = Date.now();
      if (!hasRetriedAuth && now - lastDashboardFetchAt < 8_000) {
        return;
      }
      lastDashboardFetchAt = now;
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

      setDashboardDataLoading(liveMemories.length === 0 && liveRequestEvents.length === 0);
      setDashboardDataError(null);
      const shouldResetContinuity =
        continuityLoadedProjectRef.current !== activeProjectName;
      if (shouldResetContinuity) {
        setLiveResume(null);
        setLiveHandoff(null);
      }

      const results = await Promise.allSettled([
        fetchMemoryApi<MemoryListResponse>(
          compactDashboardLimit("/api/memory/list?limit=120"),
          authToken,
        ),
        fetchMemoryApi<InsightsResponse>("/api/memory/insights", authToken),
        fetchMemoryApi<RequestHistoryResponse>(
          compactDashboardLimit("/api/memory/requests?limit=200&range=all"),
          authToken,
        ),
        fetchMemoryApi<TimelineHistoryResponse>(
          compactDashboardLimit("/api/memory/timeline?limit=200"),
          authToken,
        ),
        fetchMemoryApi<{
          connectors?: Array<{
            type: string;
            status: string;
            recordCount?: number;
            lastSyncAt?: string | null;
          }>;
        }>("/api/connector", authToken),
      ]);

      if (cancelled) {
        return;
      }

      const [
        memoriesResult,
        insightsResult,
        requestsResult,
        timelineResult,
        connectorsResult,
      ] = results;

      if (memoriesResult.status === "fulfilled") {
        const memories = Array.isArray(memoriesResult.value.memories)
          ? memoriesResult.value.memories
          : [];
        setLiveMemories(
          [...memories].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        );
      }

      if (insightsResult.status === "fulfilled") {
        setLiveInsights(insightsResult.value);
      }

      if (requestsResult.status === "fulfilled") {
        const requests = Array.isArray(requestsResult.value.requests)
          ? requestsResult.value.requests
          : [];
        setLiveRequestEvents(
          requests.map(mapRequestHistoryEntryToEvent),
        );
      }

      if (timelineResult.status === "fulfilled") {
        const events = Array.isArray(timelineResult.value.events)
          ? timelineResult.value.events
          : [];
        setLiveTimelineEvents(events);
        setLiveTimelineCount(
          typeof timelineResult.value.count === "number"
            ? timelineResult.value.count
            : events.length,
        );
      }

      if (connectorsResult.status === "fulfilled") {
        const github = connectorsResult.value.connectors?.find((c) => c.type === "github");
        const connected = github?.status === "connected";
        const synced = Boolean(
          connected &&
            ((github?.recordCount ?? 0) > 0 ||
              (github?.lastSyncAt && github.lastSyncAt.length > 0)),
        );
        if (!cancelled) {
          setGithubFunnelStatus({ connected, synced });
        }
      }

      if (shouldResetContinuity) {
        continuityLoadedProjectRef.current = activeProjectName;
      }

      if (
        !cancelled &&
        memoriesResult.status === "fulfilled" &&
        Array.isArray(memoriesResult.value.memories) &&
        memoriesResult.value.memories.length > 0
      ) {
        const continuityProject = continuityProjectName(activeProjectName);
        const continuityQuestion =
          "Where should we continue from the latest organizational memory?";
        const continuityBody = {
          project: continuityProject,
          question: continuityQuestion,
          topK: 8,
        };

        try {
          const brief = await fetchMemoryApi<ContinueProjectBriefData>(
            "/api/memory/resume/brief",
            authToken,
            {
              method: "POST",
              body: JSON.stringify(continuityBody),
            },
          );
          if (!cancelled) {
            setLiveResume(mapContinueBriefToResume(brief));
          }
        } catch {
          if (!cancelled && shouldResetContinuity) {
            setLiveResume(null);
          }
        }

        try {
          const handoff = await fetchMemoryApi<HandoffApiPayload>(
            "/api/memory/handoff",
            authToken,
            {
              method: "POST",
              body: JSON.stringify(continuityBody),
            },
          );
          if (!cancelled) {
            setLiveHandoff(mapHandoffPayload(handoff));
          }
        } catch {
          if (!cancelled && shouldResetContinuity) {
            setLiveHandoff(null);
          }
        }
      } else if (!cancelled && shouldResetContinuity) {
        setLiveResume(null);
        setLiveHandoff(null);
      }

      const rejected = results
        .map((result, index) => ({ result, index }))
        .filter(
          (entry): entry is { result: PromiseRejectedResult; index: number } =>
            entry.result.status === "rejected",
        );
      const firstError = rejected[0]?.result;
      const hasAnySuccess = results.some((result) => result.status === "fulfilled");
      const rateLimited = rejected.some((entry) => {
        const reason = entry.result.reason;
        return (
          reason instanceof Error &&
          (reason.message.includes("(429)") ||
            reason.message.toLowerCase().includes("too many requests"))
        );
      });
      const hasUnauthorizedError = rejected.some((entry) =>
        isUnauthorizedError(entry.result.reason),
      );
      const warnings = results
        .map((result) =>
          result.status === "fulfilled" ? extractApiWarning(result.value) : null,
        )
        .filter((warning): warning is string => Boolean(warning));

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
            rateLimited
              ? "MemoryOS API rate limit reached. Wait a few seconds and refresh, or reduce parallel console tabs."
              : firstError.reason instanceof Error
                ? firstError.reason.message
                : "Some live dashboard data could not be loaded.",
          );
        } else if (rateLimited) {
          setDashboardDataError(
            "Some dashboard data is temporarily rate-limited. Charts use the latest loaded events; retrying shortly.",
          );
        } else {
          setDashboardDataError(null);
        }
      } else if (warnings.length > 0) {
        setDashboardDataError(
          `MemoryOS backend returned fallback data: ${[
            ...new Set(warnings.map(formatApiWarning)),
          ].join(", ")}.`,
        );
      } else {
        setDashboardDataError(null);
      }

      setDashboardDataLoading(false);
    }

    async function loadLiveBilling() {
      const token = await getConsoleAuthToken();
      if (!token || cancelled) return;
      const now = Date.now();
      if (now - lastBillingFetchAtRef.current < 4_000) return;
      lastBillingFetchAtRef.current = now;
      try {
        const payload = await fetchMemoryApi<{
          currentPlan?: BillingPlan;
        }>("/api/memory/billing", token);
        const plan = payload?.currentPlan;
        if (
          !cancelled &&
          (plan === "Free" ||
            plan === "Pro" ||
            plan === "Scale" ||
            plan === "Enterprise")
        ) {
          setLiveCurrentPlan(plan);
        }
      } catch {
        // non-blocking — Billing section still loads its own snapshot
      }
    }

    loadDashboardDataRef.current = loadDashboardData;
    loadLiveBillingRef.current = loadLiveBilling;
    void loadDashboardData();
    void loadLiveBilling();

    return () => {
      cancelled = true;
      loadDashboardDataRef.current = null;
      loadLiveBillingRef.current = null;
    };
  }, [hydrated, step, currentOrganization?.name, activeProjectName]);

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
      accent: "var(--primary)",
    },
    {
      label: "Resume Runs",
      value: `${liveRequestEvents.filter((request) => request.route.includes("/api/memory/resume")).length}`,
      accent: "var(--chart-2)",
    },
    {
      label: "Retrieve Requests",
      value: `${liveRequestEvents.filter((request) => request.route.includes("/api/memory/retrieve")).length}`,
      accent: "var(--chart-3)",
    },
    {
      label: "Handoffs Generated",
      value: `${liveRequestEvents.filter((request) => request.route.includes("/api/memory/handoff")).length}`,
      accent: "var(--chart-4)",
    },
    {
      label: "Active Projects",
      value: `${liveInsights?.activeProjects?.length ?? 0}`,
      accent: "var(--primary)",
    },
  ];

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
    activateCompanyBrainFunnel();
    if (!useCaseId) {
      setUseCaseId("developer-docs");
    }
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
    void loadDashboardDataRef.current?.(false);
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
      void loadDashboardDataRef.current?.(false);
    } catch (error) {
      setSupportSendState("error");
      setSupportErrorMessage(
        error instanceof Error ? error.message : "Could not send support message.",
      );
    }
  }

  function renderDashboardMain(item = resolveDashboardItem(activeDashboardItem)) {
    const workspace = currentOrganization?.name ?? "MemoryOS";
    const memoryPayload = liveMemories.map((memory) => ({
      id: memory.id,
      type: memory.type,
      summary: memory.content.slice(0, 120),
      content: memory.content,
      status: memory.status,
      confidence: memory.confidence ?? 0,
      updatedAt: memory.updatedAt,
    }));

    if (item === "Overview") {
      return (
        <OverviewSection
          workspaceName={workspace}
          ownerName={userDisplayName}
          stats={overviewStats}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
          memories={liveMemories}
          requestEvents={liveRequestEvents}
          insights={liveInsights}
          resumeData={liveResume}
          handoffData={liveHandoff}
          timelineCount={liveTimelineCount}
          timelineEvents={liveTimelineEvents}
          installationVerification={{
            status: installationVerificationStatus,
            message: installationVerificationMessage,
            onVerify: verifyInstallation,
          }}
          githubFunnel={githubFunnelStatus}
          hasResumeBrief={Boolean(liveResume?.summary)}
          funnelActions={{
            onConnectGithub: () => {
              focusFunnelOnGithub();
              setActiveDashboardItem("Connected Intelligence Sources");
            },
            onSyncGithub: () => {
              focusFunnelOnGithub();
              setActiveDashboardItem("Connected Intelligence Sources");
            },
            onContinueBrief: () => openWorkspaceTab("Continuity Lab", { autostartLab: true }),
            onOpenLab: () => openWorkspaceTab("Continuity Lab", { autostartLab: true }),
          }}
          actions={{
            "Quick Start": () => {
              focusFunnelOnGithub();
              setActiveDashboardItem("Connected Intelligence Sources");
            },
            "Continuity Lab": () => openWorkspaceTab("Continuity Lab", { autostartLab: true }),
            Playground: () => openWorkspaceTab("Playground"),
            Documentation: () => setActiveDashboardItem("Integrations & SDK"),
          }}
        />
      );
    }

    if (item === "Connected Intelligence Sources") {
      return (
        <IntelligenceSectionWrap workspaceName={workspace} sectionLabel={item}>
          <ConnectorsSection
            liveMemoryCount={liveMemories.length}
            liveRequestCount={liveRequestEvents.length}
            realtimeVersion={realtimeVersion}
          />
        </IntelligenceSectionWrap>
      );
    }

    if (item === "Memory Graph") {
      return (
        <MemoryGraphSection
          workspaceName={workspace}
          memories={memoryPayload}
          requestEvents={liveRequestEvents}
          timelineEvents={liveTimelineEvents}
          timelineCount={liveTimelineCount}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
        />
      );
    }

    if (item === "Runtime Activity") {
      return (
        <RequestsSection
          workspaceName={workspace}
          requestEvents={liveRequestEvents}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
        />
      );
    }

    if (item === "Agent Activity Timeline") {
      return (
        <FlightRecorderSection
          workspaceName={workspace}
          requestEvents={liveRequestEvents}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
        />
      );
    }

    if (item === "Memory Evolution Timeline") {
      return (
        <MemoryEvolutionSection
          workspaceName={workspace}
          memories={memoryPayload}
          requestEvents={liveRequestEvents}
          timelineEvents={liveTimelineEvents}
          openLoops={openLoops}
          timelineCount={liveTimelineCount}
          isLoading={dashboardDataLoading}
          errorMessage={dashboardDataError}
        />
      );
    }

    if (item === "Security + Governance") {
      return (
        <GovernanceSection
          workspaceName={workspace}
          realtimeVersion={realtimeVersion}
        />
      );
    }

    if (item === "Integrations & SDK") {
      const latestRequest = liveRequestEvents[0] ?? null;
      return (
        <IntegrationsSection
          workspaceName={workspace}
          currentPlan={liveCurrentPlan}
          realtimeVersion={realtimeVersion}
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

    if (item === "API Keys") {
      return (
        <ApiKeysSection
          workspaceName={workspace}
          currentPlan={liveCurrentPlan}
          realtimeVersion={realtimeVersion}
        />
      );
    }

    if (item === "Team") {
      return (
        <TeamSection
          workspaceName={workspace}
          ownerName={userDisplayName}
          ownerEmail={userEmail}
          plan={liveCurrentPlan}
          realtimeVersion={realtimeVersion}
        />
      );
    }

    if (item === "Billing") {
      return (
        <BillingSection
          workspaceName={workspace}
          currentPlan={liveCurrentPlan}
          realtimeVersion={realtimeVersion}
        />
      );
    }

    if (item === "Settings") {
      return (
        <SettingsSection
          workspaceName={workspace}
          ownerName={userDisplayName}
          ownerEmail={userEmail}
          organizationId={currentOrganization?.id ?? ""}
          currentPlan={liveCurrentPlan}
          realtimeVersion={realtimeVersion}
        />
      );
    }

    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-8">
        <p className="text-sm text-muted-foreground">
          Unknown section. Choose a page from the sidebar.
        </p>
      </div>
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
      <div className="developer-console-root relative min-h-svh overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center">
          <div className="mb-8">
            <MemoryStarLogo tone="black" />
          </div>
          <h1 className="text-center text-4xl font-semibold tracking-tighter sm:text-5xl">
            Select an organization
          </h1>
          <p className="mt-3 text-center text-base leading-7 text-muted-foreground sm:text-lg">
            Choose which organization you&apos;d like to work with.
          </p>

          <div className="mt-12 w-full space-y-3">
            {organizations.map((organization) => (
              <button
                key={organization.id}
                type="button"
                onClick={() => selectOrganization(organization.id)}
                className="flex w-full items-center justify-between gap-4 rounded-md border-transparent bg-background px-5 py-5 text-left transition hover:border-border hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-primary text-xl font-semibold">
                    {organization.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tighter">
                      {organization.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {organization.connectors} data sources ·{" "}
                      {organization.docs} docs · {organization.tags} tags
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-secondary px-3 py-2 font-mono text-sm text-muted-foreground">
                  {organization.plan}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={startNewOrganization}
            className="mt-10 rounded-md border-transparent px-6 py-4 text-lg font-medium tracking-wide text-foreground transition hover:border-border hover:bg-transparent hover:text-foreground transition-colors duration-200"
          >
            + CREATE NEW ORGANIZATION
          </button>
        </div>
      </div>
    );
  }

  if (step === "dashboard") {
    return (
      <>
      <IntelligenceConsoleLayout
        navGroups={filteredDashboardNav}
        activeItem={activeDashboardItem}
        navSearchQuery={navSearchQuery}
        onNavSearchChange={setNavSearchQuery}
        resolveItem={resolveDashboardItem}
        isWorkspaceTab={isWorkspaceTabItem}
        onNavSelect={(item) => {
          if (isWorkspaceTabItem(item)) {
            openWorkspaceTab(item);
            return;
          }
          setActiveDashboardItem(resolveDashboardItem(item));
        }}
        orgName={currentOrganization?.name ?? "MemoryOS"}
        userInitial={userInitial}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        memoryCount={liveMemories.length}
        runtimeHealthy={
          liveMemories.length > 0 ||
          liveRequestEvents.some((event) => event.status === "Success")
        }
        notifications={headerNotifications}
        onHeaderNavigate={(item) => {
          if (isWorkspaceTabItem(item)) {
            openWorkspaceTab(item);
            return;
          }
          setActiveDashboardItem(resolveDashboardItem(item));
        }}
        navBadges={{
          ...(liveMemories.length > 0
            ? { "Connected Intelligence Sources": Math.min(liveMemories.length, 99) }
            : {}),
          ...(liveRequestEvents.length > 0
            ? { "Runtime Activity": liveRequestEvents.length }
            : {}),
          ...(liveMemories.length > 0 ? { "Memory Graph": liveMemories.length } : {}),
          "Continuity Lab": "Core",
        }}
        headerRight={
          <>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-[#6B7280] hover:bg-black/[0.04] hover:text-[#111827]"
            >
              <a href="#">Docs</a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSupportWidget(true)}
              className="text-[#6B7280] hover:bg-black/[0.04] hover:text-[#111827]"
            >
              Support
            </Button>
            <div className="relative z-50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowOrganizationMenu((current) => !current);
                  setShowAccountMenu(false);
                }}
                className="h-auto gap-2 rounded-xl border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[#111827] shadow-sm hover:bg-[#F9FAFB]"
              >
                <span className="text-sm font-semibold tracking-tight">
                  {currentOrganization?.name ?? "MemoryOS"}
                </span>
                <Badge
                  variant="secondary"
                  className="rounded-md border-[#E5E7EB] bg-[#F9FAFB] px-1.5 py-0 text-xs font-medium normal-case text-[#6B7280]"
                >
                  Free
                </Badge>
              </Button>
              {showOrganizationMenu ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white text-[#111827] shadow-xl">
                  {organizations.map((organization) => (
                    <button
                      key={organization.id}
                      type="button"
                      onClick={() => selectOrganization(organization.id)}
                      className="flex w-full items-center justify-between gap-4 border-b border-[#F3F4F6] px-4 py-4 text-left transition hover:bg-[#F9FAFB]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E0E7FF] text-sm font-semibold text-[#4338CA]">
                          {organization.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-semibold">{organization.name}</p>
                          <p className="text-sm text-[#6B7280]">Free</p>
                        </div>
                      </div>
                      {organization.id === currentOrganizationId ? (
                        <span className="text-[#059669]">✓</span>
                      ) : null}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={startNewOrganization}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left text-base font-medium transition hover:bg-[#F9FAFB]"
                  >
                    <span className="text-xl leading-none">+</span>
                    Create organization
                  </button>
                </div>
              ) : null}
            </div>
            <div className="relative z-50">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => {
                  setShowAccountMenu((current) => !current);
                  setShowOrganizationMenu(false);
                }}
                className="size-9 rounded-full border border-[#E5E7EB] bg-white text-sm font-semibold text-[#111827] shadow-sm"
              >
                {userInitial}
              </Button>
              {showAccountMenu ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 isolate overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white text-[#111827] shadow-xl">
                  <div className="border-b border-[#F3F4F6] px-4 py-4">
                    <p className="truncate text-lg font-semibold">{userDisplayName}</p>
                    <p className="mt-1 truncate text-sm text-[#6B7280]">{userEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDashboardItem("Settings");
                      setShowAccountMenu(false);
                    }}
                    className="flex w-full items-center gap-3 border-b border-[#F3F4F6] px-4 py-4 text-left text-sm font-medium transition hover:bg-[#F9FAFB]"
                  >
                    Account settings
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left text-sm font-medium text-[#DC2626] transition hover:bg-[#F9FAFB]"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </>
        }
      >
        <div key={activeDashboardItem}>{renderDashboardMain(activeDashboardItem)}</div>
      </IntelligenceConsoleLayout>

        {showSupportWidget ? (
          <div className="fixed bottom-5 right-5 z-30 w-full max-w-xl overflow-hidden rounded-md border border-border bg-card">
            {!showSupportComposer ? (
              <div className="p-7 sm:p-8">
                <button
                  type="button"
                  onClick={() => setShowSupportWidget(false)}
                  className="absolute right-5 top-4 text-3xl leading-none text-muted-foreground transition hover:text-foreground"
                >
                  ×
                </button>
                <div className="grid h-16 w-16 place-items-center ">
                  <MemoryStarLogo tone="black" />
                </div>
                <h3 className="mt-9 text-balance text-5xl font-semibold leading-tight tracking-tighter">
                  Hey {currentOrganization?.name ?? "there"}
                  <br />
                  How can we help?
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDashboardItem("Integrations & SDK");
                    setShowSupportWidget(false);
                  }}
                  className="mt-8 text-xl font-medium text-foreground transition hover:text-foreground"
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
                  className="mt-8 flex h-20 w-full items-center rounded-md border border-primary/50 bg-primary/15 px-6 text-xl font-medium text-foreground transition hover:bg-primary/20"
                >
                  Start a conversation
                </button>
                <p className="mt-3 text-center text-sm text-muted-foreground">
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
                    className="text-3xl text-muted-foreground transition hover:text-foreground"
                  >
                    ‹
                  </button>
                  <p className="text-3xl font-semibold tracking-tight">
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
                    className="text-3xl text-muted-foreground transition hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
                <p className="mx-auto mt-12 max-w-md text-center text-base leading-8 text-muted-foreground">
                  We&apos;re happy to help. Message us whenever you need and
                  we&apos;ll get back to you as soon as possible.
                </p>
                <div className="mt-10 rounded-md border border-primary/35 bg-muted/50 p-4">
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
                    className="min-h-32 w-full resize-none bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xl text-muted-foreground">
                      <span>⌂</span>
                      <span className="font-semibold">B</span>
                      <span className="italic">I</span>
                      <span>{"</>"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={sendSupportMessage}
                      className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!supportMessage.trim() || supportSendState === "sending"}
                    >
                      {supportSendState === "sending" ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
                {supportSendState === "error" && supportErrorMessage ? (
                  <p className="mt-3 text-sm text-destructive">
                    {supportErrorMessage}
                  </p>
                ) : null}
                {supportSendState === "sent" ? (
                  <p className="mt-3 text-sm text-chart-2">
                    Message sent. Thank you.
                  </p>
                ) : null}
                <p className="mt-4 text-center text-sm text-muted-foreground">
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
            border-radius: 0;
            border: 2px solid var(--background);
          }

          .memoryos-console-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--border);
          }

          .memoryos-console-scroll::-webkit-scrollbar-button {
            background: var(--background);
          }
        `}</style>
      </>
    );
  }

  return (
    <div
      className={`min-h-svh ${
        isLightTheme ? "bg-muted/40 text-foreground" : "bg-background text-foreground"
      }`}
    >
      <ProgressHeader step={step} entryPath={entryPath} />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex-1 py-8 sm:py-10 lg:py-14">
          {step === "org" ? (
            <section className="mx-auto max-w-5xl">
              <div className="text-center">
                <h1 className="text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
                  Create Your Organization
                </h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
                  Set up your team&apos;s workspace in MemoryOS.
                </p>
              </div>

              <div className="mx-auto mt-12 max-w-3xl">
                <label className="block text-sm font-medium text-foreground">
                  Organization name <span className="text-destructive">*</span>
                </label>
                <input
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  placeholder="Acme Inc."
                  className="mt-4 h-14 w-full rounded-md border-transparent bg-background px-5 text-lg text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />

                <div className="mt-9">
                  <p className="text-sm font-medium text-foreground">
                    Company size
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCompanySize(size)}
                        className={`rounded-md border px-4 py-4 text-lg transition ${
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
            <section className="mx-auto max-w-5xl">
              <div className="text-center">
                <h1 className="text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
                  What brings you here?
                </h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
                  This helps us tailor your experience. You can always change
                  this later.
                </p>
              </div>

              <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
                {ENTRY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setEntryPath(option.id);
                      setSelectedIntegration(null);
                    }}
                    className={`rounded-md border p-6 text-left transition ${
                      entryPath === option.id
                        ? "border-primary bg-primary/15"
                        : "border-transparent bg-card hover:border-border"
                    }`}
                  >
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      {option.eyebrow}
                    </p>
                    <p className="mt-5 text-3xl font-semibold tracking-tighter">
                      {option.title}
                    </p>
                    <p className="mt-3 max-w-xs text-lg leading-8 text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "category" ? (
            <section className="mx-auto max-w-6xl">
              <div className="text-center">
                <h1 className="text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
                  What are you building?
                </h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
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
                    className={`rounded-md border p-6 text-left transition ${
                      useCaseId === item.id
                        ? "border-primary bg-primary/15"
                        : "border-transparent bg-card hover:border-border"
                    }`}
                  >
                    <p className="text-3xl font-semibold tracking-tighter">
                      {item.title}
                    </p>
                    <p className="mt-3 max-w-sm text-lg leading-8 text-muted-foreground">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "context" ? (
            <section className="mx-auto max-w-6xl">
              <div className="text-center">
                <h1 className="text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
                  Set Up Organization Context
                </h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
                  Define how content should be filtered and processed for your
                  use case.
                </p>
              </div>

              <div className="mt-12">
                <label className="block text-sm font-medium text-foreground">
                  Organizational Context
                </label>
                <textarea
                  value={orgContext}
                  onChange={(event) => setOrgContext(event.target.value)}
                  placeholder={`Describe how content should be processed for your organization${selectedUseCase ? ` and ${selectedUseCase.title.toLowerCase()} use case` : ""}...`}
                  className="mt-4 min-h-52 w-full rounded-md border-transparent bg-card px-5 py-5 text-lg text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="mt-8 max-w-md">
                <input
                  value={templateQuery}
                  onChange={(event) => setTemplateQuery(event.target.value)}
                  placeholder="Search templates..."
                  className="h-14 w-full rounded-md border-transparent bg-background px-5 text-lg text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="mt-7 flex gap-6 overflow-x-auto pb-2 text-base">
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
                    className={`rounded-md border p-5 text-left transition ${
                      selectedTemplate === card.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/30 hover:border-border"
                    }`}
                  >
                    <p className="text-lg font-semibold">{card.title}</p>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {card.preview}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "integration" ? (
            <section className="mx-auto max-w-6xl">
              <div className="text-center">
                <h1 className="text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
                  {entryPath === "plugins"
                    ? "Choose your plugin"
                    : "What are you building?"}
                </h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
                  {entryPath === "plugins"
                    ? "Select the plugin you'd like to set up first."
                    : "Choose a MemoryOS surface to launch first."}
                </p>
              </div>

              {entryPath === "plugins" ? null : (
                <>
                  <div className="mt-12 max-w-md">
                    <input
                      value={integrationQuery}
                      onChange={(event) =>
                        setIntegrationQuery(event.target.value)
                      }
                      placeholder="Search solutions..."
                      className="h-14 w-full rounded-md border-transparent bg-background px-5 text-lg text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>

                  <div className="mt-7 flex gap-6 overflow-x-auto pb-2 text-base">
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
                className={`mt-6 grid gap-4 ${entryPath === "plugins" ? "mx-auto max-w-2xl md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}
              >
                {integrationCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedIntegration(card.id)}
                    className={`rounded-md border p-5 text-left transition ${
                      selectedIntegration === card.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/30 hover:border-border"
                    }`}
                  >
                    <IconBadge label={card.accent} />
                    <p className="mt-8 text-lg font-semibold">
                      {card.title}
                    </p>
                    {entryPath === "plugins" ? null : (
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {card.subtitle}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === "setup" ? (
            <section className="mx-auto max-w-6xl">
              <div className="text-center">
                <h1 className="text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
                  {entryPath === "plugins"
                    ? `Set up ${selectedIntegrationDetails.title}`
                    : `Set up your ${selectedIntegrationDetails.title} integration`}
                </h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
                  {entryPath === "plugins"
                    ? "Follow the docs to connect your plugin."
                    : "Follow these steps to connect."}
                </p>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card px-5 py-5">
                <div className="flex items-center gap-4">
                  <IconBadge label={selectedIntegrationDetails.accent} />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xl font-semibold">
                        {selectedIntegrationDetails.title}
                      </p>
                      <span className="rounded-md bg-chart-2/15 px-3 py-1 text-xs font-medium uppercase tracking-widest text-chart-2">
                        {entryPath === "plugins" ? "TypeScript" : "MemoryOS"}
                      </span>
                    </div>
                    <p className="mt-1 text-base text-muted-foreground">
                      {selectedIntegrationDetails.subtitle}
                    </p>
                  </div>
                </div>
                <a
                  href="#"
                  className="text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground"
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
                      className="w-full rounded-md border border-border bg-muted/40 p-5 text-left transition hover:bg-muted/60"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-base font-semibold text-muted-foreground">
                            {section.id}
                          </div>
                          <div>
                            <p className="text-xl font-semibold">
                              {section.title}
                            </p>
                            {!expanded ? (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {section.copy}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span className="text-xl text-muted-foreground">
                          {expanded ? "−" : "+"}
                        </span>
                      </div>
                      {expanded ? (
                        <div className="mt-5 border-t border-transparent pt-5">
                          <p className="text-sm leading-7 text-muted-foreground">
                            {entryPath === "plugins"
                              ? section.copy
                              : section.id === 1
                                ? "Run this command in your project directory:"
                                : section.id === 2
                                  ? "Add these values in your environment file:"
                                  : "Run a test command to confirm setup:"}
                          </p>
                          <div
                            className={`mt-4 rounded-md border border-border bg-muted/50 px-5 py-5 ${entryPath === "plugins" ? "text-base leading-7 text-foreground" : "font-mono text-sm text-foreground/92"}`}
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
                <div className="mt-10 text-lg leading-9 text-muted-foreground">
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
            <p className="text-sm leading-7 text-muted-foreground">
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
                className="rounded-md px-4 py-3 text-sm font-medium text-foreground/92 transition hover:bg-transparent hover:text-foreground transition-colors duration-200 disabled:cursor-not-allowed disabled:text-muted-foreground"
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
                  className="rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-transparent hover:text-foreground transition-colors duration-200 disabled:cursor-not-allowed disabled:text-muted-foreground"
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
                className="rounded-md bg-primary px-5 py-3 text-sm font-semibold tracking-wide text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
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
