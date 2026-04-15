"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";

const STORAGE_KEY = "memoryos.developer-console.onboarding";
const DEFAULT_TOTAL_STEPS = 5;
const MEMORYOS_TOTAL_STEPS = 7;

const COMPANY_SIZES = ["Just me", "2-10", "11-50", "51-200", "201-1,000", "1,000+"] as const;

const ENTRY_OPTIONS = [
  {
    id: "plugins",
    title: "Plugins",
    description: "Use Claude Code, Cursor, OpenCode, or OpenClaw",
    eyebrow: "Best for tooling and IDE workflows",
  },
  {
    id: "memoryos",
    title: "With MemoryOS",
    description: "API integration, Chatbot, RAG, and more",
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
    title: "Developer Docs",
    description: "Current APIs and working code examples",
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
    title: "Developer Documentation",
    category: "Developer Docs",
    preview: "{{Company name}} developer platform. Content includes API docs, guides, and architecture notes.",
  },
  {
    id: "sdk-documentation",
    title: "SDK Documentation",
    category: "Developer Docs",
    preview: "{{Company name}} SDK reference. Content includes installation guides, code examples, and recipes.",
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
      "Open API Keys in the Supermemory console and create a token.",
      "Export SUPERMEMORY_API_KEY in your shell profile.",
      "Install with `claude mcp add supermemory -- npx -y @supermemory/claude-code`.",
      "Run `claude mcp list` and confirm Supermemory is connected.",
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
      "Create an API key from the Supermemory console.",
      "Add `SUPERMEMORY_API_KEY` to your shell profile.",
      "Install with `npx opencode@latest plugin add supermemory`.",
      "Verify `~/.config/opencode/opencode.jsonc` includes the plugin.",
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
      "Create an API key in the Supermemory console.",
      "Add `SUPERMEMORY_API_KEY` to your environment variables.",
      "Install the OpenClaw adapter package.",
      "Restart OpenClaw and verify the adapter loads.",
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
      "Create an API key in the Supermemory console.",
      "Save `SUPERMEMORY_API_KEY` in your Hermes environment.",
      "Install the Hermes plugin package.",
      "Run a sample memory read/write to confirm setup.",
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
      "Create an API key in the Supermemory console.",
      "Set `SUPERMEMORY_API_KEY` in your terminal environment.",
      "Install the Cursor memory integration package.",
      "Open Cursor settings and verify the integration is enabled.",
    ],
  },
] as const;

const PRODUCT_TABS = ["All", "Platform", "Search", "Assistants", "Workflows"] as const;

const PRODUCT_INTEGRATIONS = [
  { id: "api-integration", title: "API Integration", subtitle: "Direct MemoryOS API", tab: "Platform", accent: "API" },
  { id: "chatbot", title: "Chatbot", subtitle: "Embed memory into your assistant", tab: "Assistants", accent: "BOT" },
  { id: "rag", title: "RAG Pipeline", subtitle: "Grounded retrieval workflow", tab: "Search", accent: "RAG" },
  { id: "copilot", title: "Internal Copilot", subtitle: "Team knowledge assistant", tab: "Assistants", accent: "CO" },
  { id: "workflow", title: "Automation Workflow", subtitle: "Event-driven memory sync", tab: "Workflows", accent: "WF" },
  { id: "docs-search", title: "Docs Search", subtitle: "Developer-facing documentation search", tab: "Search", accent: "DS" },
  { id: "playground", title: "Playground", subtitle: "Test your API quickly", tab: "Platform", accent: "PG" },
] as const;

const GLITCH_ASCII_PATTERN = Array.from({ length: 18 }, (_, row) =>
  Array.from({ length: 70 }, (_, col) => ["2", "3", "4", "5", "x", "+"][((row * 3) + (col * 5)) % 6]).join(" "),
).join("\n");

const DASHBOARD_NAV = [
  { section: "", items: ["Overview", "Documents", "Container Tags", "Memory Graph", "Requests", "User Insights"] },
  { section: "Data", items: ["Connectors", "Import"] },
  { section: "Developer", items: ["API Keys", "Agents", "Plugins"] },
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
    setShowOrganizationMenu(false);
    setStep("org");
  }

  function selectOrganization(organizationId: string) {
    setCurrentOrganizationId(organizationId);
    setShowOrganizationMenu(false);
    setStep("dashboard");
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
      <div className="h-dvh overflow-hidden bg-[#070707] text-white lg:grid lg:grid-cols-[304px_1fr]">
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

          <nav className="min-h-0 flex-1 space-y-[clamp(9px,1vh,13px)] px-4 pb-4 sm:px-5 lg:px-4">
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
                      className={`flex w-full items-center rounded-[8px] px-4 py-[clamp(6px,0.7vh,8px)] text-left text-[14px] leading-[1.25] transition ${
                        item === "Overview"
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
                        {organization.id === currentOrganizationId ? <span className="text-[#2678ff]">✓</span> : null}
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

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-5 lg:px-6">
            <h1 className="text-[22px] font-semibold tracking-[-0.05em]">Overview</h1>

            <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Documents", "0"],
                ["Memories", "0"],
                ["Search Requests", "0"],
                ["Container Tags", "0"],
                ["Connectors", "0"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] border border-white/10 bg-[#181818] px-5 py-4.5">
                  <p className="text-[13px] text-white/42">{label}</p>
                  <p className="mt-2 text-[26px] font-semibold tracking-[-0.05em]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5.5">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/92">
                Explore the Platform
              </h2>
              <div className="mt-3 grid gap-3 lg:grid-cols-4">
                {[
                  ["Quick Setup", "Configure your workspace step by step"],
                  ["Live Demo", "See MemoryOS in action"],
                  ["Playground", "Test the API interactively"],
                  ["Documentation", "Read the full API reference"],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-[8px] border border-white/10 bg-[#181818] px-5 py-4.5">
                    <p className="text-[17px] font-semibold tracking-[-0.03em]">{title}</p>
                    <p className="mt-1.5 text-[14px] leading-5 text-white/42">{copy}</p>
                  </div>
                ))}
              </div>
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
                          : `${orgName || "Your company"} uses a ${card.title.toLowerCase()} knowledge workflow with memory retrieval, safe filtering, and source-aware responses.`,
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
                                  ? "SUPERMEMORY_API_KEY=sm_xxxxx\nSUPERMEMORY_PROJECT=memoryos"
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
