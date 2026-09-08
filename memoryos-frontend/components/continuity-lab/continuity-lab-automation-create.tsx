"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Maximize2,
  MessageCircle,
  Send,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  ConnectorBrandIcon,
  GitHubBrandIcon,
  LinearBrandIcon,
  MemoryOsBrandIcon,
  ScheduleTriggerIcon,
  SlackBrandIcon,
  WebhookTriggerIcon,
} from "@/components/continuity-lab/connector-brand-icons";
import {
  connectionsMcpsHref,
  customMcpSetupHref,
} from "@/lib/continuity-lab/connections-settings-urls";
import { cn } from "@/lib/utils";
import { consoleAuthHeaders } from "@/lib/console-api";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import {
  clearAutomationDraft,
  defaultAutomationForm,
  defaultScheduleConfig,
  type AutomationInstruction,
  type AutomationInstructionEmailWhen,
  newTrigger,
  readAutomationDraft,
  readAutomationStorage,
  touchRecentAutomation,
  triggerDisplayLabel,
  type AutomationAgentMode,
  type AutomationConnectorId,
  type AutomationMemoryFeatures,
  type AutomationTrigger,
  type AutomationTriggerType,
  type SavedAutomation,
} from "@/lib/continuity-lab/automation-storage";
import {
  createAutomationOnApi,
  fetchAutomationFromApi,
  patchAutomationOnApi,
  subscribeAutomationEvents,
  touchAutomationOnApi,
  triggerAutomationOnApi,
} from "@/lib/continuity-lab/automation-api";
import { AUTOMATIONS_CHANGED_EVENT } from "@/lib/continuity-lab/automation-events";
import {
  isScheduleTriggerType,
  ScheduleTriggerRow,
} from "@/components/continuity-lab/continuity-lab-schedule-trigger";
import {
  findTemplate,
  isTemplateAvailable,
  normalizeTemplateId,
  templateToDraft,
  type AutomationTemplate,
} from "@/lib/continuity-lab/automation-templates";
import { buildSessionsListHref } from "@/lib/continuity-lab/sessions-display-prefs";
import { readUserPreferences } from "@/lib/continuity-lab/user-preferences-storage";
import { readDevConsoleOrgDisplayName } from "@/lib/continuity-lab/settings-org";
import { pillActionButton, subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";

type ConnectorRow = {
  id: AutomationConnectorId;
  label: string;
  connected: boolean;
  status: string;
};

type AutomationForm = ReturnType<typeof defaultAutomationForm>;

function formFromAutomation(automation: SavedAutomation): AutomationForm {
  return {
    name: automation.name,
    goal: automation.goal ?? automation.name,
    instructions: automation.instructions,
    instructionsV2: automation.instructionsV2 ?? [],
    triggers: automation.triggers,
    connectors: automation.connectors,
    memoryFeatures: automation.memoryFeatures,
    sessionOptions: automation.sessionOptions,
    agentMode: automation.agentMode,
    limits: automation.limits,
    networkPolicy: automation.networkPolicy,
    sharedScratchpad: automation.sharedScratchpad ?? "",
    templateId: automation.templateId,
    emailNotification: automation.emailNotification ?? false,
    notificationEmail: automation.notificationEmail ?? "",
  };
}

type MemoryOsConnectorStateRepos = Array<{
  fullName: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string | null;
}>;

type RunHistoryPoint = {
  label: string;
  count: number;
};

type RunHistorySummary = {
  points: RunHistoryPoint[];
  totalRuns: number;
  attentionRuns: number;
  maxCount: number;
};

type TriggerConditionOperator = "equals" | "not equals" | "in" | "not in";
type TriggerCondition = {
  id: string;
  field: string;
  operator: TriggerConditionOperator;
  value: string;
};

type TriggerMenuGroup = {
  id: "github" | "schedule" | "slack" | "linear" | "webhook";
  label: string;
  icon: ComponentType<{ className?: string }>;
  options?: Array<{ type: AutomationTriggerType; label: string }>;
  directType?: AutomationTriggerType;
};

const TRIGGER_GROUPS: TriggerMenuGroup[] = [
  {
    id: "github",
    label: "GitHub",
    icon: GitHubBrandIcon,
    options: [
      { type: "github_issue_comment", label: "Issue comment" },
      { type: "github_issue", label: "Issue" },
      { type: "github_pull_request", label: "Pull request" },
      { type: "github_pr_review", label: "PR review" },
      { type: "github_pr_review_comment", label: "PR review comment" },
      { type: "github_check_run", label: "Check run" },
      { type: "github_push", label: "Push" },
    ],
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: ScheduleTriggerIcon,
    options: [
      { type: "schedule_hourly", label: "Every hour" },
      { type: "schedule_daily", label: "Every day" },
      { type: "schedule_weekly", label: "Every week" },
      { type: "schedule", label: "Custom schedule" },
    ],
  },
  {
    id: "slack",
    label: "Slack",
    icon: SlackBrandIcon,
    options: [
      { type: "slack_message", label: "Watch channel" },
      { type: "slack_message_advanced", label: "Message advanced" },
      { type: "slack_reaction_added", label: "Reaction added" },
    ],
  },
  {
    id: "linear",
    label: "Linear",
    icon: LinearBrandIcon,
    options: [{ type: "linear_issue_event", label: "Issue" }],
  },
  {
    id: "webhook",
    label: "Webhook",
    icon: WebhookTriggerIcon,
    directType: "webhook",
  },
];

const GITHUB_TRIGGER_TYPES: AutomationTriggerType[] = [
  "ci_failure",
  "github_issue_comment",
  "github_issue",
  "github_pull_request",
  "github_pr_review",
  "github_pr_review_comment",
  "github_check_run",
  "github_push",
];

const CONDITION_OPERATORS: TriggerConditionOperator[] = ["equals", "not equals", "in", "not in"];

const MEMORY_FEATURE_OPTIONS: Array<{
  key: keyof AutomationMemoryFeatures;
  label: string;
  description: string;
}> = [
  {
    key: "injectResumeBrief",
    label: "Inject resume brief",
    description: "Load continuity resume brief when the automation starts a session",
  },
  {
    key: "writeActionMemoryOnComplete",
    label: "Write action memory on complete",
    description: "Persist outcomes to action memory for future runs",
  },
  {
    key: "requireGovernanceApproval",
    label: "Require governance approval",
    description: "Block connector execution until an approver signs off",
  },
  {
    key: "attachOperationalWiki",
    label: "Attach operational wiki context",
    description: "Include wiki and operational map sections for the repo",
  },
  {
    key: "continuityHandoffOnComplete",
    label: "Continuity handoff on complete",
    description: "Queue a handoff thread for the next teammate or session",
  },
  {
    key: "useCompanyBrainContext",
    label: "Use Company Brain context",
    description: "Pull company brain funnel and operational loop context",
  },
];

const GENERIC_AGENT_MODES: Array<{ id: AutomationAgentMode; label: string; description: string }> = [
  { id: "normal", label: "Normal", description: "Balanced execution with continuity memory" },
  { id: "plan", label: "Plan", description: "Plan before making changes" },
  { id: "debug", label: "Debug", description: "Investigate root cause with extra logging" },
];

function agentModeOptionLabel(mode: (typeof GENERIC_AGENT_MODES)[number]): string {
  return `${mode.label} – ${mode.description}`;
}

function AgentModeDropdown({
  value,
  onChange,
}: {
  value: AutomationAgentMode;
  onChange: (mode: AutomationAgentMode) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<AutomationAgentMode | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    GENERIC_AGENT_MODES.find((mode) => mode.id === value) ?? GENERIC_AGENT_MODES[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setHoveredId(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setHoveredId(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-[#0A0A0A] px-3 text-left text-sm leading-5 text-[#F0EFE2]/90 hover:border-white/15"
      >
        <span className="min-w-0 truncate">{agentModeOptionLabel(selected)}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-[#F0EFE2]/45 transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.ul
            role="listbox"
            aria-label="MemoryOS mode"
            initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.99 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? {} : { opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-black/10 bg-white py-1 shadow-lg"
          >
            {GENERIC_AGENT_MODES.map((mode) => {
              const isSelected = mode.id === value;
              const isHighlighted = isSelected || hoveredId === mode.id;
              return (
                <li key={mode.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHoveredId(mode.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => {
                      onChange(mode.id);
                      setOpen(false);
                      setHoveredId(null);
                    }}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-sm leading-5 transition-colors",
                      isHighlighted
                        ? "bg-[#2563EB] text-[#F0EFE2]"
                        : "text-[#111827] hover:bg-[#2563EB] hover:text-[#F0EFE2]",
                    )}
                  >
                    {agentModeOptionLabel(mode)}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type ContinuityLabAutomationCreateProps = {
  editId?: string;
  templateQuery?: string;
};

function unwrapConnectors(payload: unknown): Array<{ type: string; status: string }> {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as { data?: { connectors?: Array<{ type: string; status: string }> } };
  const inner = record.data ?? payload;
  const connectors = (inner as { connectors?: Array<{ type: string; status: string }> }).connectors;
  return Array.isArray(connectors) ? connectors : [];
}

const CONNECTORS_CONSOLE_HREF = "/mission-control?section=connectors";

const AUTOMATION_CONNECTOR_ROWS: Array<{
  id: AutomationConnectorId;
  label: string;
  mcp: boolean;
  builtIn?: boolean;
  mcpCatalogId?: string;
}> = [
  { id: "github", label: "GitHub", mcp: false },
  { id: "slack", label: "Slack", mcp: true, builtIn: true },
  { id: "jira", label: "Jira", mcp: false },
  { id: "notion", label: "Notion", mcp: true },
  { id: "stripe", label: "Stripe", mcp: true },
  { id: "datadog", label: "Datadog (API key)", mcp: true, mcpCatalogId: "datadog-api-key" },
  { id: "sentry", label: "Sentry", mcp: true },
  { id: "circleci", label: "CircleCI", mcp: true },
  { id: "cloudflare", label: "Cloudflare", mcp: true, mcpCatalogId: "cloudflare-observability" },
  { id: "metabase", label: "Metabase", mcp: true },
  { id: "hubspot", label: "HubSpot", mcp: true },
  { id: "jam", label: "Jam", mcp: true },
  { id: "asana", label: "Asana", mcp: true },
  { id: "figma", label: "Figma", mcp: true },
  { id: "sonarqube", label: "SonarQube", mcp: true },
  { id: "pagerduty", label: "PagerDuty", mcp: true },
  { id: "linear", label: "Linear", mcp: false },
];

const MCP_CONNECTOR_IDS = new Set<AutomationConnectorId>(
  AUTOMATION_CONNECTOR_ROWS.filter((row) => row.mcp).map((row) => row.id),
);
const DEFAULT_VISIBLE_MCP_CONNECTOR_IDS = new Set<AutomationConnectorId>(["slack", "notion"]);
const AUTOMATION_CONNECTOR_META_BY_ID = new Map(
  AUTOMATION_CONNECTOR_ROWS.map((row) => [row.id, row]),
);

function formatConnectorStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function mergeFormFromDraft(
  prev: AutomationForm,
  draft: ReturnType<typeof readAutomationDraft>,
): AutomationForm {
  if (!draft) return prev;
  return {
    ...prev,
    name: draft.name ?? prev.name,
    goal: draft.goal ?? prev.goal,
    instructions: draft.instructions ?? prev.instructions,
    instructionsV2: draft.instructionsV2 ?? prev.instructionsV2,
    triggers: draft.triggers ?? prev.triggers,
    connectors: draft.connectors ?? prev.connectors,
    memoryFeatures: draft.memoryFeatures ?? prev.memoryFeatures,
    sessionOptions: draft.sessionOptions ?? prev.sessionOptions,
    agentMode: draft.agentMode ?? prev.agentMode,
    limits: draft.limits ?? prev.limits,
    networkPolicy: draft.networkPolicy ?? prev.networkPolicy,
    sharedScratchpad: draft.sharedScratchpad ?? prev.sharedScratchpad,
    templateId: draft.templateId,
    emailNotification: draft.emailNotification ?? prev.emailNotification,
    notificationEmail: draft.notificationEmail ?? prev.notificationEmail,
  };
}

function makeCondition(overrides?: Partial<TriggerCondition>): TriggerCondition {
  return {
    id: `cond_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    field: "action",
    operator: "equals",
    value: "",
    ...overrides,
  };
}

function parseConditions(raw: string | undefined): TriggerCondition[] {
  if (!raw) return [makeCondition()];
  try {
    const parsed = JSON.parse(raw) as TriggerCondition[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [makeCondition()];
    return parsed.map((cond) => makeCondition(cond));
  } catch {
    return [makeCondition()];
  }
}

function serializeConditions(rows: TriggerCondition[]): string {
  return JSON.stringify(rows.map((row) => ({ ...row, value: row.value.trimStart() })));
}

function defaultConfigForType(type: AutomationTriggerType): Record<string, string> {
  if (isScheduleTriggerType(type)) return defaultScheduleConfig(type);
  if (type === "webhook") {
    return {
      payloadFilter: "",
      webhookSecret: `whsec_${Math.random().toString(36).slice(2, 18)}`,
    };
  }
  if (type === "ci_failure") {
    return {
      repo: "",
      conditions: serializeConditions([
        makeCondition({ field: "action", operator: "equals", value: "completed" }),
        makeCondition({ field: "conclusion", operator: "equals", value: "failure" }),
      ]),
    };
  }
  if (GITHUB_TRIGGER_TYPES.includes(type)) {
    return {
      repo: "",
      conditions: serializeConditions([makeCondition({ field: "action", operator: "equals" })]),
    };
  }
  if (type === "slack_message" || type === "slack_message_advanced") {
    return {
      channel: "",
      keywords: "bug, crash, regression, outage",
      matchMode: type === "slack_message_advanced" ? "advanced" : "simple",
      threadReply: "true",
    };
  }
  if (type === "linear_issue_event") {
    return {
      teamKey: "",
      event: "created,updated",
    };
  }
  if (type === "jira_issue_event") {
    return {
      projectKey: "",
      event: "created,updated",
    };
  }
  return {};
}

export function ContinuityLabAutomationCreate({
  editId,
  templateQuery,
}: ContinuityLabAutomationCreateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const manageConnectionsHref = useMemo(
    () => connectionsMcpsHref(currentHref),
    [currentHref],
  );
  const { connector, refresh, sessions } = useContinuityLab();
  const repos = connector.payload.github.repos;
  const defaultRepo = repos[0]?.fullName ?? null;

  const [form, setForm] = useState(() => defaultAutomationForm());
  const [resolvedTemplate, setResolvedTemplate] = useState<AutomationTemplate | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(() => Boolean(editId));
  const [connectorSearch, setConnectorSearch] = useState("");
  const [connectorRows, setConnectorRows] = useState<ConnectorRow[]>([]);
  const [loadingConnectors, setLoadingConnectors] = useState(true);
  const [triggerPickerOpen, setTriggerPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAutomation, setExistingAutomation] = useState<SavedAutomation | null>(null);

  const isEdit = Boolean(editId);
  const isCreate = !isEdit;
  const templateSlug = resolvedTemplate?.id ?? normalizeTemplateId(form.templateId);
  const isTemplateFlow = Boolean(templateSlug) && !isEdit;
  const templateUnavailable =
    resolvedTemplate !== null && !isTemplateAvailable(resolvedTemplate);

  const loadConnectors = useCallback(async () => {
    setLoadingConnectors(true);
    try {
      const headers = await consoleAuthHeaders();
      const res = await fetch("/api/connector", { headers, cache: "no-store" });
      const list = res.ok ? unwrapConnectors(await res.json()) : [];
      const isConnected = (type: string) => {
        const row = list.find((c) => c.type === type);
        return row?.status === "connected" || row?.status === "syncing";
      };
      setConnectorRows(
        AUTOMATION_CONNECTOR_ROWS.map((row) => {
          const remoteStatus = list.find((c) => c.type === row.id)?.status;
          const githubStatus =
            row.id === "github" ? connector.payload.github.status : undefined;
          return {
            id: row.id,
            label: row.label,
            connected:
              row.id === "github"
                ? isConnected(row.id) || connector.payload.github.connected
                : isConnected(row.id),
            status: remoteStatus ?? githubStatus ?? "not_connected",
          };
        }),
      );
    } finally {
      setLoadingConnectors(false);
    }
  }, [connector.payload.github.connected, connector.payload.github.status]);

  useEffect(() => {
    void loadConnectors();
  }, [loadConnectors]);

  useEffect(() => subscribeAutomationEvents(), []);

  useEffect(() => {
    const slugFromQuery = normalizeTemplateId(templateQuery);
    const draft = readAutomationDraft();

    if (slugFromQuery) {
      const template = findTemplate(slugFromQuery);
      if (template) {
        setResolvedTemplate(template);
        if (isTemplateAvailable(template)) {
          const draftForm = templateToDraft(template, { repoFullName: defaultRepo });
          setForm((prev) => mergeFormFromDraft(prev, { ...draftForm, templateId: template.id }));
        }
      }
      if (draft) clearAutomationDraft();
      return;
    }

    if (draft) {
      const slug = normalizeTemplateId(draft.templateId);
      if (slug) setResolvedTemplate(findTemplate(slug) ?? null);
      setForm((prev) => mergeFormFromDraft(prev, draft));
      clearAutomationDraft();
    }
  }, [templateQuery, defaultRepo]);

  useEffect(() => {
    if (!editId) {
      setExistingAutomation(null);
      return;
    }

    let active = true;
    const applyExisting = (existing: SavedAutomation, options?: { touchRecent?: boolean }) => {
      if (!active) return;
      const slug = normalizeTemplateId(existing.templateId);
      if (slug) setResolvedTemplate(findTemplate(slug) ?? null);
      setForm(formFromAutomation(existing));
      setExistingAutomation(existing);
      if (options?.touchRecent) touchRecentAutomation({ id: existing.id, name: existing.name });
    };

    const cached = readAutomationStorage().automations.find((a) => a.id === editId);
    if (cached) applyExisting(cached);

    void fetchAutomationFromApi(editId).then((response) => {
      if (!active) return;
      if (response?.automation) {
        applyExisting(response.automation, { touchRecent: true });
        void touchAutomationOnApi(response.automation.id);
        return;
      }
      if (!cached) setError("Automation not found.");
    });

    const onAutomationsChanged = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { automation?: SavedAutomation; automationId?: string; reason?: string }
        | undefined;
      if (detail?.automation?.id === editId) {
        applyExisting(detail.automation);
        return;
      }
      if (detail?.automationId === editId && detail.reason?.includes("delete")) {
        router.push("/continuity-lab/automations");
        return;
      }
      const latest = readAutomationStorage().automations.find((a) => a.id === editId);
      if (latest) applyExisting(latest);
    };
    window.addEventListener(AUTOMATIONS_CHANGED_EVENT, onAutomationsChanged);

    return () => {
      active = false;
      window.removeEventListener(AUTOMATIONS_CHANGED_EVENT, onAutomationsChanged);
    };
  }, [editId, router]);

  const connectorById = useMemo(() => {
    const map = new Map<AutomationConnectorId, ConnectorRow>();
    for (const row of connectorRows) map.set(row.id, row);
    return map;
  }, [connectorRows]);

  const filteredConnectors = useMemo(() => {
    const q = connectorSearch.trim().toLowerCase();
    if (!q) return connectorRows;
    return connectorRows.filter((c) => c.label.toLowerCase().includes(q) || c.id.includes(q));
  }, [connectorRows, connectorSearch]);

  function toggleConnector(id: AutomationConnectorId) {
    setForm((prev) => ({
      ...prev,
      connectors: prev.connectors.includes(id)
        ? prev.connectors.filter((c) => c !== id)
        : [...prev.connectors, id],
    }));
  }

  function addTrigger(type: AutomationTriggerType) {
    const baseConfig = defaultConfigForType(type);
    setForm((prev) => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger(type, baseConfig)],
    }));
    setTriggerPickerOpen(false);
  }

  function removeTrigger(id: string) {
    setForm((prev) => ({
      ...prev,
      triggers: prev.triggers.filter((t) => t.id !== id),
    }));
  }

  function updateTriggerConfig(triggerId: string, key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      triggers: prev.triggers.map((t) => {
        if (t.id !== triggerId) return t;
        const config = { ...t.config, [key]: value };
        return { ...t, config, label: triggerDisplayLabel(t.type, config) };
      }),
    }));
  }

  function replaceTriggerConfig(triggerId: string, config: Record<string, string>) {
    setForm((prev) => ({
      ...prev,
      triggers: prev.triggers.map((t) => {
        if (t.id !== triggerId) return t;
        return { ...t, config, label: triggerDisplayLabel(t.type, config) };
      }),
    }));
  }

  function patchMemoryFeature(key: keyof AutomationMemoryFeatures, value: boolean) {
    setForm((prev) => ({
      ...prev,
      memoryFeatures: { ...prev.memoryFeatures, [key]: value },
    }));
  }

  function patchSessionOption<K extends keyof AutomationForm["sessionOptions"]>(
    key: K,
    value: AutomationForm["sessionOptions"][K],
  ) {
    setForm((prev) => ({
      ...prev,
      sessionOptions: { ...prev.sessionOptions, [key]: value },
    }));
  }

  async function handleCreate(runSession: boolean) {
    setError(null);

    if (templateUnavailable) {
      setError("This template requires a connector that is not available yet.");
      return;
    }

    const name = (form.name || (isTemplateFlow && resolvedTemplate ? resolvedTemplate.title : "")).trim();
    if (!name) {
      setError("Enter an automation name.");
      return;
    }
    if (form.triggers.length === 0) {
      setError("Add at least one trigger.");
      return;
    }
    if (!form.instructions.trim()) {
      setError("Add instructions for what the operational agent does when triggers activate.");
      return;
    }

    const sessionOptions = {
      ...form.sessionOptions,
      emailNotification:
        form.sessionOptions.emailNotification || Boolean(form.emailNotification),
      notificationEmail:
        form.sessionOptions.notificationEmail || form.notificationEmail || "",
    };

    setSubmitting(true);
    try {
      let saved: SavedAutomation;
      const payload = {
        name,
        goal: form.goal?.trim() || name,
        triggers: form.triggers,
        instructions: form.instructions.trim(),
        instructionsV2: form.instructionsV2 ?? [],
        connectors: form.connectors,
        memoryFeatures: form.memoryFeatures,
        sessionOptions,
        agentMode: form.agentMode,
        limits: form.limits,
        networkPolicy: form.networkPolicy,
        sharedScratchpad: form.sharedScratchpad,
        templateId: form.templateId,
        emailNotification: sessionOptions.emailNotification,
        notificationEmail: sessionOptions.notificationEmail || undefined,
      };

      if (isEdit && editId) {
        const updated = await patchAutomationOnApi(editId, payload);
        if (!updated) {
          setError("Could not save automation on the backend.");
          return;
        }
        saved = updated;
      } else {
        const created = await createAutomationOnApi(payload);
        if (!created) {
          setError("Could not create automation on the backend.");
          return;
        }
        saved = created;
      }
      setExistingAutomation(saved);

      if (runSession) {
        const job = await triggerAutomationOnApi(saved.id, {
          triggerType: "manual",
          payload: {
            automationName: saved.name,
            templateId: saved.templateId ?? null,
            triggeredFrom: "automation_editor",
          },
        });
        if (!job) {
          throw new Error("Could not queue automation trigger.");
        }
        await refresh();
        return;
      }

      router.push("/continuity-lab/automations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save automation.");
    } finally {
      setSubmitting(false);
    }
  }

  const createLabel = isEdit
    ? "Save automation"
    : resolvedTemplate?.createLabel ?? "Create automation";

  const pageTitle = isEdit ? "Edit automation" : resolvedTemplate?.title ?? "New automation";
  const createdMeta = existingAutomation?.createdAt ?? null;
  const [clientIdentityReady, setClientIdentityReady] = useState(false);
  useEffect(() => setClientIdentityReady(true), []);
  const creatorIdentity = clientIdentityReady ? readCreatorIdentity() : "you";
  const runHistory = useMemo(
    () => deriveRunHistory({
      automationName: existingAutomation?.name ?? form.name ?? "",
      sessions,
    }),
    [existingAutomation?.name, form.name, sessions],
  );

  if (templateUnavailable) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8 pb-20">
        <nav className="text-xs text-[#F0EFE2]/45">
          <Link href="/continuity-lab/automations" className="hover:text-[#F0EFE2]/70">
            Automations
          </Link>
        </nav>
        <h1 className="mt-6 text-2xl font-semibold text-[#F0EFE2]">{resolvedTemplate?.title}</h1>
        <p className="mt-4 rounded-md border border-[#2F2F2F] bg-[#111111] px-4 py-3 text-sm text-[#F0EFE2]/55">
          {resolvedTemplate?.description}
        </p>
        <p className="mt-4 text-sm text-amber-200/90">
          This template is not available yet — it requires a third-party connector MemoryOS does not
          ship today.
        </p>
        <Link
          href="/continuity-lab/automations/templates"
          className="mt-6 inline-flex text-xs font-semibold text-indigo-300 hover:text-indigo-200"
        >
          Browse live templates
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto px-5 py-8 pb-20", isCreate ? "max-w-[820px]" : "max-w-2xl")}>
      <div className="flex items-center justify-between gap-4">
        <nav className="text-xs text-[#F0EFE2]/45" aria-label="Breadcrumb">
          <Link href="/continuity-lab/automations" className="hover:text-[#F0EFE2]/70">
            Automations
          </Link>
          <span className="mx-1.5 text-[#F0EFE2]/25">/</span>
          <span className="text-[#F0EFE2]/60">{isEdit ? pageTitle : "New Automation"}</span>
        </nav>

        {isEdit ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleCreate(true)}
              className="inline-flex h-8 items-center rounded-md border border-white/10 bg-[#1A1A1A] px-3 text-xs font-semibold text-[#F0EFE2]/85 hover:bg-[#242424] disabled:opacity-40"
            >
              Trigger now
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleCreate(false)}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 bg-[#1A1A1A] px-3 text-xs font-semibold text-[#F0EFE2]/75 hover:bg-[#242424] disabled:opacity-40"
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save
            </button>
          </div>
        ) : null}
      </div>

      {isCreate ? (
        <CreateAutomationNameInput
          name={form.name}
          onNameChange={(name) =>
            setForm((p) => ({
              ...p,
              name,
              goal: p.goal || name,
            }))
          }
        />
      ) : null}

      {!isCreate ? (
        <EditAutomationGraphMeta
          name={form.name || pageTitle}
          createdAt={createdMeta}
          createdBy={creatorIdentity}
          history={runHistory}
        />
      ) : null}

      <div className={cn(isCreate ? "mt-5" : "mt-6", "space-y-6")}>
        {!isTemplateFlow && !isCreate ? (
          <section>
            <label className="text-xs font-semibold text-[#F0EFE2]/80">Automation name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value, goal: p.goal || e.target.value }))
              }
              placeholder="CI failure with continuity resume"
              className="mt-2 h-10 w-full rounded-md border border-[#3A3A3A] bg-[#111111] px-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-[#6366F1] focus:outline-none"
            />
          </section>
        ) : null}

        <TriggersSection
          triggers={form.triggers}
          triggerPickerOpen={triggerPickerOpen}
          onTogglePicker={() => setTriggerPickerOpen((v) => !v)}
          onAddTrigger={addTrigger}
          onRemoveTrigger={removeTrigger}
          onConfigChange={updateTriggerConfig}
          onConfigReplace={replaceTriggerConfig}
          repos={repos}
          connectorById={connectorById}
          loadingConnectors={loadingConnectors}
          createMode={isCreate}
        />

        <InstructionsSection
          instructions={form.instructions}
          instructionsV2={form.instructionsV2 ?? []}
          onInstructionsChange={(v) => setForm((p) => ({ ...p, instructions: v }))}
          onInstructionsV2Change={(next) => setForm((p) => ({ ...p, instructionsV2: next }))}
          autoStartChildSessions={form.sessionOptions.autoStartChildSessions}
          onAutoStartChildSessionsChange={(value) =>
            patchSessionOption("autoStartChildSessions", value)
          }
          sessions={sessions}
        />

        <ConnectorsSection
          loading={loadingConnectors}
          filtered={filteredConnectors}
          selected={form.connectors}
          search={connectorSearch}
          onSearchChange={setConnectorSearch}
          onToggle={toggleConnector}
          manageConnectionsHref={manageConnectionsHref}
          setupReturnTo={currentHref}
        />

        <AdvancedSection
          open={advancedOpen}
          onToggle={() => setAdvancedOpen((v) => !v)}
          form={form}
          setForm={setForm}
        />

        {!isCreate ? (
          <>
            <MemoryContinuitySection
              features={form.memoryFeatures}
              onChange={patchMemoryFeature}
            />

            <SessionOptionsSection options={form.sessionOptions} onChange={patchSessionOption} />
          </>
        ) : null}

        {error ? (
          <p className="text-xs text-red-300/90" role="alert">
            {error}
          </p>
        ) : null}

        {isCreate ? (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleCreate(false)}
            className="inline-flex h-8 items-center gap-2 rounded-md bg-white px-3 text-xs font-semibold text-[#0A0A0A] hover:bg-white/90 disabled:opacity-40"
          >
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {createLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

const META_DATE_LOCALE = "en-US";

function formatMetaDate(iso: string | null): string {
  if (!iso) return "recently";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString(META_DATE_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDateLabel(date: Date): string {
  return date.toLocaleDateString(META_DATE_LOCALE, { month: "short", day: "numeric" });
}

function readCreatorIdentity(): string {
  if (typeof window === "undefined") return "you";
  const preferenceName = readUserPreferences().displayName.trim();
  if (preferenceName) return preferenceName;

  const orgName = readDevConsoleOrgDisplayName()?.trim();
  if (orgName) return orgName;

  const clerkOrgName = (
    window as unknown as {
      Clerk?: { organization?: { name?: string } };
    }
  ).Clerk?.organization?.name;
  if (typeof clerkOrgName === "string" && clerkOrgName.trim().length > 0) {
    return clerkOrgName.trim();
  }

  return "you";
}

function deriveRunHistory(input: { automationName: string; sessions: Array<{ title: string; updatedAt: string }> }): RunHistorySummary {
  const points: RunHistoryPoint[] = [];
  const byDay = new Map<string, number>();
  const automationName = input.automationName.trim().toLowerCase();
  const titleNeedle = automationName ? `automation: ${automationName}` : "";
  let totalRuns = 0;
  let attentionRuns = 0;

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    byDay.set(key, 0);
    points.push({ label: shortDateLabel(day), count: 0 });
  }

  if (!automationName) {
    return { points, totalRuns: 0, attentionRuns: 0, maxCount: 1 };
  }

  for (const session of input.sessions) {
    const title = session.title.toLowerCase();
    const matches =
      titleNeedle.length > 0
        ? title.includes(titleNeedle)
        : false;
    if (!matches) continue;
    const date = new Date(session.updatedAt);
    if (Number.isNaN(date.getTime())) continue;
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    if (!byDay.has(key)) continue;
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
    totalRuns += 1;
    if (/fail|error|attention|incident|blocked/i.test(title)) {
      attentionRuns += 1;
    }
  }

  const keyedDays = Array.from(byDay.values());
  const maxCount = Math.max(1, ...keyedDays);
  for (let i = 0; i < points.length; i += 1) {
    points[i].count = keyedDays[i] ?? 0;
  }
  return { points, totalRuns, attentionRuns, maxCount };
}

function EditAutomationGraphMeta({
  name,
  createdAt,
  createdBy,
  history,
}: {
  name: string;
  createdAt: string | null;
  createdBy: string;
  history: RunHistorySummary;
}) {
  const yLabels = [history.maxCount, Math.max(1, Math.ceil(history.maxCount * 0.66)), Math.max(1, Math.ceil(history.maxCount * 0.33)), 1];
  const createdLabel = `Created by ${createdBy} on ${formatMetaDate(createdAt)}`;
  const hasData = history.points.some((point) => point.count > 0);
  const polyline = history.points
    .map((point, index) => {
      const x = history.points.length > 1 ? (index / (history.points.length - 1)) * 100 : 0;
      const y = 100 - (point.count / history.maxCount) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="mt-4 space-y-4">
      <div className={cn(subtlePanel(), "px-4 py-2.5 text-[17px] font-semibold leading-6 tracking-[-0.01em] text-[#F0EFE2]/92")}>
        {name}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[13px] leading-5 text-[#F0EFE2]/60">
        <ToggleSwitch checked onChange={() => undefined} className="h-6 w-10" />
        <span className="rounded-full bg-[#2563EB]/20 px-2 py-0.5 text-[12px] font-medium text-[#F0EFE2]/88">
          Active
        </span>
        <span className="text-[#F0EFE2]/25">|</span>
        <span>{createdLabel}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] leading-5 text-[#F0EFE2]/70">
          <span className="font-semibold text-[#F0EFE2]/90">{history.totalRuns} total runs</span>
          <span className="mx-1 text-[#F0EFE2]/35">•</span>
          <span>{history.attentionRuns} require attention</span>
        </p>
        <Link
          href={buildSessionsListHref(name)}
          className="text-[13px] font-medium text-[#3B82F6] transition hover:text-[#60A5FA]"
        >
          View sessions
        </Link>
      </div>

      <div className="mt-3 px-2 py-2">
        <div className="grid grid-cols-[24px_1fr] gap-2">
          <div className="space-y-2.5 pt-0.5">
            {yLabels.map((label, idx) => (
              <div key={`${label}-${idx}`} className="h-4 text-right text-[11px] text-[#F0EFE2]/40">
                {label}
              </div>
            ))}
          </div>
          <div
            className="relative h-[146px]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0 1px, transparent 1px calc((100% - 1px)/7)), repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0 1px, transparent 1px 36px)",
              backgroundSize: "calc((100% - 1px)/7) 100%, 100% 36px",
              backgroundPosition: "0 0, 0 0",
              backgroundRepeat: "repeat, repeat",
            }}
          >
            <div className="absolute inset-0 border-y border-dashed border-white/10" />
            <div className="absolute bottom-0 top-0 right-[17%] w-px bg-white/40" />
            {hasData ? (
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="rgba(96, 165, 250, 0.95)"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                />
                {history.points.map((point, index) => {
                  const x = history.points.length > 1 ? (index / (history.points.length - 1)) * 100 : 0;
                  const y = 100 - (point.count / history.maxCount) * 100;
                  return (
                    <circle
                      key={`${point.label}-${index}`}
                      cx={x}
                      cy={y}
                      r="1.7"
                      fill="rgba(96, 165, 250, 0.95)"
                      stroke="rgba(13, 14, 17, 1)"
                      strokeWidth="0.8"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
            ) : null}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[12px] text-[#F0EFE2]/55">
          {history.points.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CreateAutomationNameInput({
  name,
  onNameChange,
}: {
  name: string;
  onNameChange: (value: string) => void;
}) {
  return (
    <section className="mt-7">
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Automation name"
        className="h-10 w-full rounded-md border border-white/10 bg-[#1D1D1D] px-3 text-lg font-semibold leading-6 text-[#F0EFE2] placeholder:text-[#F0EFE2]/45 focus:border-[#3B82F6] focus:outline-none"
      />
    </section>
  );
}

function TriggersSection({
  triggers,
  triggerPickerOpen,
  onTogglePicker,
  onAddTrigger,
  onRemoveTrigger,
  onConfigChange,
  onConfigReplace,
  repos,
  connectorById,
  loadingConnectors,
  createMode,
}: {
  triggers: AutomationTrigger[];
  triggerPickerOpen: boolean;
  onTogglePicker: () => void;
  onAddTrigger: (type: AutomationTriggerType) => void;
  onRemoveTrigger: (id: string) => void;
  onConfigChange: (triggerId: string, key: string, value: string) => void;
  onConfigReplace: (triggerId: string, config: Record<string, string>) => void;
  repos: MemoryOsConnectorStateRepos;
  connectorById: Map<AutomationConnectorId, ConnectorRow>;
  loadingConnectors: boolean;
  createMode?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [submenu, setSubmenu] = useState<TriggerMenuGroup["id"] | null>(null);
  const activeGroup = submenu ? TRIGGER_GROUPS.find((group) => group.id === submenu) : null;

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold leading-5 text-[#F0EFE2]">Triggers</h2>
          <p className="mt-1 text-xs leading-5 text-[#F0EFE2]/45">
            Run automation when any of these conditions are met
          </p>
        </div>
        <div className="relative">
          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : { scale: 1.01 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={() => {
              if (triggerPickerOpen) setSubmenu(null);
              onTogglePicker();
            }}
            className={pillActionButton}
          >
            <Plus className="size-3.5" />
            Add trigger
          </motion.button>
          <AnimatePresence initial={false}>
            {triggerPickerOpen ? (
              <motion.div
                key="trigger-menu"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: -4 }}
                animate={reduceMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? {} : { opacity: 0, scale: 0.98, y: -4 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-md border border-white/10 bg-[#0E0E10] py-1 shadow-xl"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {activeGroup && activeGroup.options ? (
                    <motion.div
                      key={`submenu-${activeGroup.id}`}
                      initial={reduceMotion ? false : { opacity: 0, x: 14 }}
                      animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
                      exit={reduceMotion ? {} : { opacity: 0, x: 14 }}
                      transition={{ duration: 0.14, ease: "easeOut" }}
                    >
                      <button
                        type="button"
                        onClick={() => setSubmenu(null)}
                        className="mb-1 flex w-full items-center gap-1 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45 hover:bg-[#141414]"
                      >
                        <ChevronLeft className="size-3.5" />
                        {activeGroup.label}
                      </button>
                      {activeGroup.options.map((option) => (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => onAddTrigger(option.type)}
                          className="block w-full px-3 py-2 text-left text-xs text-[#F0EFE2]/80 hover:bg-[#141414]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu-root"
                      initial={reduceMotion ? false : { opacity: 0, x: -14 }}
                      animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
                      exit={reduceMotion ? {} : { opacity: 0, x: -14 }}
                      transition={{ duration: 0.14, ease: "easeOut" }}
                    >
                      {TRIGGER_GROUPS.map((group) => {
                        const Icon = group.icon;
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => {
                              if (group.directType) {
                                onAddTrigger(group.directType);
                                return;
                              }
                              setSubmenu(group.id);
                            }}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs text-[#F0EFE2]/85 hover:bg-[#141414]"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Icon className="size-3.5 text-[#F0EFE2]/65" />
                              {group.label}
                            </span>
                            {group.options ? <ChevronRight className="size-3.5 text-[#F0EFE2]/45" /> : null}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {triggers.length === 0 ? (
        <div className={cn(subtlePanel(), "mt-4 flex min-h-12 items-center justify-between gap-3 px-3 py-2.5")}>
          <button
            type="button"
            onClick={onTogglePicker}
            className="inline-flex items-center rounded-[5px] bg-[#2563EB]/20 px-2 py-1 text-xs font-medium text-[#60A5FA] hover:bg-[#2563EB]/30"
          >
            Add Trigger
          </button>
          <Trash2 className="size-3.5 text-[#F0EFE2]/35" aria-hidden />
        </div>
      ) : (
        <>
          {createMode
            ? triggers.some((t) => !isScheduleTriggerType(t.type)) ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {triggers
                    .filter((t) => !isScheduleTriggerType(t.type))
                    .map((trigger) => (
                      <li key={`${trigger.id}-chip`}>
                        <button
                          type="button"
                          onClick={() => onRemoveTrigger(trigger.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs text-[#F0EFE2]/80 hover:border-[#6366F1]/40"
                          title="Remove trigger"
                        >
                          {trigger.label}
                          <span className="text-[#F0EFE2]/45">×</span>
                        </button>
                      </li>
                    ))}
                </ul>
              ) : null
            : null}
          <motion.ul layout className="mt-4 space-y-2">
            <AnimatePresence initial={false}>
              {triggers.map((trigger) => (
                <motion.li
                  key={trigger.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <TriggerEditor
                    trigger={trigger}
                    repos={repos}
                    connectorById={connectorById}
                    loadingConnectors={loadingConnectors}
                    onRemove={() => onRemoveTrigger(trigger.id)}
                    onConfigChange={(key, value) => onConfigChange(trigger.id, key, value)}
                    onConfigReplace={(config) => onConfigReplace(trigger.id, config)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </>
      )}
    </section>
  );
}

const INSTRUCTION_PILL_CLASS =
  "inline-flex items-center gap-1 rounded-[5px] bg-[#2563EB]/20 px-2 py-0.5 text-xs font-medium text-[#60A5FA] hover:bg-[#2563EB]/30";

const INSTRUCTION_STATIC_TEXT_CLASS = "text-xs text-[#F0EFE2]/70";

const INSTRUCTION_ICON_BUTTON_CLASS =
  "rounded p-1 text-[#F0EFE2]/40 transition hover:bg-white/[0.06] hover:text-[#F0EFE2]/75";

function useInstructionDropdownDismiss(
  open: boolean,
  onClose: () => void,
  rootRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, rootRef]);
}

function StartSessionInstructionCard({
  instructions,
  onInstructionsChange,
  autoStartChildSessions,
  onAutoStartChildSessionsChange,
}: {
  instructions: string;
  onInstructionsChange: (v: string) => void;
  autoStartChildSessions: boolean;
  onAutoStartChildSessionsChange: (value: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [autoStartOpen, setAutoStartOpen] = useState(false);
  const autoStartRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const closeAutoStartMenu = useCallback(() => setAutoStartOpen(false), []);

  useInstructionDropdownDismiss(autoStartOpen, closeAutoStartMenu, autoStartRef);

  function handleClearInstructions() {
    if (!instructions.trim()) return;
    if (window.confirm("Clear start session instructions?")) {
      onInstructionsChange("");
    }
  }

  const autoStartLabel = autoStartChildSessions ? "Yes" : "No";
  const autoStartOptions: Array<{ value: boolean; label: string }> = [
    { value: false, label: "No" },
    { value: true, label: "Yes" },
  ];

  return (
    <div className={cn(subtlePanel(), "mt-3 px-3 py-3")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-3.5 text-[#F0EFE2]/55" />
          <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#2563EB]/20 px-2 py-0.5 text-xs font-medium text-[#60A5FA]">
            Start session
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={INSTRUCTION_ICON_BUTTON_CLASS}
            aria-label="Session instruction settings"
            onClick={() => textareaRef.current?.focus()}
          >
            <SlidersHorizontal className="size-3.5" />
          </button>
          <button
            type="button"
            className={INSTRUCTION_ICON_BUTTON_CLASS}
            aria-label="Clear start session instructions"
            onClick={handleClearInstructions}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={instructions}
        onChange={(e) => onInstructionsChange(e.target.value)}
        rows={6}
        placeholder="i.e. Write a summary of the session"
        className="mt-3 w-full resize-y bg-transparent text-sm leading-relaxed text-[#F0EFE2] placeholder:text-[#F0EFE2]/30 focus:outline-none"
      />
      <div className="mt-3 flex justify-end">
        <div ref={autoStartRef} className="relative">
          <button
            type="button"
            onClick={() => setAutoStartOpen((open) => !open)}
            className={cn(
              INSTRUCTION_PILL_CLASS,
              "gap-1.5 text-[#F0EFE2]/85 hover:text-[#F0EFE2]",
            )}
            aria-expanded={autoStartOpen}
            aria-haspopup="listbox"
            aria-label={`Auto-start child sessions: ${autoStartLabel}`}
          >
            <span>Auto-start child sessions</span>
            <span className="rounded-[4px] bg-[#2563EB]/25 px-1.5 py-px text-[#93C5FD]">
              {autoStartLabel}
            </span>
            <ChevronRight className="size-3 shrink-0 text-[#60A5FA]" />
          </button>
          <AnimatePresence initial={false}>
            {autoStartOpen ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -4, scale: 0.98 }}
                animate={reduceMotion ? {} : { opacity: 1, x: 0, scale: 1 }}
                exit={reduceMotion ? {} : { opacity: 0, x: -4, scale: 0.98 }}
                transition={{ duration: 0.13, ease: "easeOut" }}
                role="listbox"
                aria-label="Auto-start child sessions"
                className="absolute left-full top-1/2 z-20 ml-1 w-44 -translate-y-1/2 overflow-hidden rounded-md border border-white/10 bg-[#0E0E10] py-1 shadow-xl"
              >
                {autoStartOptions.map((opt) => {
                  const selected = opt.value === autoStartChildSessions;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onAutoStartChildSessionsChange(opt.value);
                        setAutoStartOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-[#F0EFE2]/85 hover:bg-[#141414]",
                        selected && "text-[#F0EFE2]",
                      )}
                    >
                      <span>{opt.label}</span>
                      {selected ? <Check className="size-3 text-[#F0EFE2]/85" /> : null}
                    </button>
                  );
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InstructionsSection({
  instructions,
  instructionsV2,
  onInstructionsChange,
  onInstructionsV2Change,
  autoStartChildSessions,
  onAutoStartChildSessionsChange,
  sessions,
}: {
  instructions: string;
  instructionsV2: AutomationInstruction[];
  onInstructionsChange: (v: string) => void;
  onInstructionsV2Change: (next: AutomationInstruction[]) => void;
  autoStartChildSessions: boolean;
  onAutoStartChildSessionsChange: (value: boolean) => void;
  sessions: Array<{ id: string; title: string }>;
}) {
  const reduceMotion = useReducedMotion();
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!addMenuRef.current?.contains(event.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [addMenuOpen]);

  function addInstruction(kind: AutomationInstruction["kind"]) {
    const id = `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    if (kind === "email_notification") {
      onInstructionsV2Change([
        ...instructionsV2,
        {
          id,
          kind,
          emailRecipient: "owner",
          emailWhen: "always",
        },
      ]);
    } else if (kind === "message_session") {
      onInstructionsV2Change([
        ...instructionsV2,
        {
          id,
          kind,
          messageSessionId: undefined,
          messageSessionTitle: undefined,
          messagePrompt: "",
        },
      ]);
    }
    setAddMenuOpen(false);
  }

  function updateInstruction(id: string, patch: Partial<AutomationInstruction>) {
    onInstructionsV2Change(
      instructionsV2.map((inst) =>
        inst.id === id ? ({ ...inst, ...patch } as AutomationInstruction) : inst,
      ),
    );
  }

  function removeInstruction(id: string) {
    onInstructionsV2Change(instructionsV2.filter((inst) => inst.id !== id));
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#F0EFE2]">Instructions</h2>
          <p className="mt-1 text-xs text-[#F0EFE2]/45">
            What MemoryOS does when triggers are activated
          </p>
        </div>
        <div className="shrink-0">
          <div ref={addMenuRef} className="relative">
            <motion.button
              type="button"
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={() => setAddMenuOpen((open) => !open)}
              className={cn(pillActionButton, "text-xs")}
            >
              <Plus className="size-3.5" />
              Add instruction
            </motion.button>
            <AnimatePresence initial={false}>
              {addMenuOpen ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: -4 }}
                  animate={reduceMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, scale: 0.98, y: -4 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                  className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-md border border-white/10 bg-[#0E0E10] py-1 shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => addInstruction("message_session")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#F0EFE2]/85 hover:bg-[#141414]"
                  >
                    <Send className="size-3.5 text-[#F0EFE2]/70" />
                    Message session
                  </button>
                  <button
                    type="button"
                    onClick={() => addInstruction("email_notification")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#F0EFE2]/85 hover:bg-[#141414]"
                  >
                    <Bell className="size-3.5 text-[#F0EFE2]/70" />
                    Email notification
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <StartSessionInstructionCard
        instructions={instructions}
        onInstructionsChange={onInstructionsChange}
        autoStartChildSessions={autoStartChildSessions}
        onAutoStartChildSessionsChange={onAutoStartChildSessionsChange}
      />

      {instructionsV2.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {instructionsV2.map((inst) => {
            if (inst.kind === "email_notification") {
              return (
                <li key={inst.id}>
                  <InstructionEmailRow
                    instruction={inst}
                    onChange={(patch) => updateInstruction(inst.id, patch)}
                    onRemove={() => removeInstruction(inst.id)}
                  />
                </li>
              );
            }
            if (inst.kind === "message_session") {
              return (
                <li key={inst.id}>
                  <InstructionMessageRow
                    instruction={inst}
                    sessions={sessions}
                    onChange={(patch) => updateInstruction(inst.id, patch)}
                    onRemove={() => removeInstruction(inst.id)}
                  />
                </li>
              );
            }
            return null;
          })}
        </ul>
      ) : null}
    </section>
  );
}

function InstructionEmailRow({
  instruction,
  onChange,
  onRemove,
}: {
  instruction: Extract<AutomationInstruction, { kind: "email_notification" }>;
  onChange: (patch: Partial<AutomationInstruction>) => void;
  onRemove: () => void;
}) {
  const [whenOpen, setWhenOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!whenOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setWhenOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setWhenOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [whenOpen]);

  const options: AutomationInstructionEmailWhen[] = ["always", "on_failure", "on_success"];

  function labelForWhen(value: AutomationInstructionEmailWhen): string {
    if (value === "on_failure") return "On failure";
    if (value === "on_success") return "On success";
    return "Always";
  }

  return (
    <div className={cn(subtlePanel(), "flex items-center gap-3 px-3 py-2.5")}>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 text-[#F0EFE2]/55" />
          <button type="button" className={INSTRUCTION_PILL_CLASS} onClick={() => undefined}>
            Email notification
          </button>
          <span className={INSTRUCTION_STATIC_TEXT_CLASS}>to</span>
          <span className={INSTRUCTION_STATIC_TEXT_CLASS}>owner</span>
          <div ref={rootRef} className="relative">
            <button
              type="button"
              onClick={() => setWhenOpen((open) => !open)}
              className={INSTRUCTION_PILL_CLASS}
            >
              {labelForWhen(instruction.emailWhen)}
              <ChevronDown className="ml-1 size-3 text-[#60A5FA]" />
            </button>
            <AnimatePresence initial={false}>
              {whenOpen ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? {} : { opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.13, ease: "easeOut" }}
                  className="absolute left-0 z-20 mt-1 w-40 rounded-md border border-white/10 bg-[#0E0E10] py-1 shadow-xl"
                >
                  {options.map((opt) => {
                    const selected = opt === instruction.emailWhen;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          onChange({ emailWhen: opt });
                          setWhenOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-[#F0EFE2]/85 hover:bg-[#141414]",
                          selected && "text-[#F0EFE2]",
                        )}
                      >
                        <span>{labelForWhen(opt)}</span>
                        {selected ? <Check className="size-3 text-[#F0EFE2]/85" /> : null}
                      </button>
                    );
                  })}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-[#F0EFE2]/40 hover:text-[#F0EFE2]"
        aria-label="Remove email instruction"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function InstructionMessageRow({
  instruction,
  sessions,
  onChange,
  onRemove,
}: {
  instruction: Extract<AutomationInstruction, { kind: "message_session" }>;
  sessions: Array<{ id: string; title: string }>;
  onChange: (patch: Partial<AutomationInstruction>) => void;
  onRemove: () => void;
}) {
  const [sessionOpen, setSessionOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!sessionOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setSessionOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSessionOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sessionOpen]);

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const selectedTitle =
    instruction.messageSessionTitle ||
    sessions.find((s) => s.id === instruction.messageSessionId)?.title ||
    "Select a session";

  return (
    <div className={cn(subtlePanel(), "px-3 py-2.5")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Send className="size-3.5 text-[#F0EFE2]/55" />
            <button type="button" className={INSTRUCTION_PILL_CLASS} onClick={() => undefined}>
              Message session
            </button>
            <span className={INSTRUCTION_STATIC_TEXT_CLASS}>to</span>
            <div ref={rootRef} className="relative">
              <button
                type="button"
                onClick={() => setSessionOpen((open) => !open)}
                className={INSTRUCTION_PILL_CLASS}
              >
                {selectedTitle}
                <ChevronDown className="ml-1 size-3 text-[#60A5FA]" />
              </button>
              <AnimatePresence initial={false}>
                {sessionOpen ? (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
                    animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? {} : { opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.13, ease: "easeOut" }}
                    className="absolute left-0 z-20 mt-1 w-64 rounded-md border border-white/10 bg-[#0E0E10] p-2 shadow-xl"
                  >
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-[#F0EFE2]/40" />
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search sessions"
                        className="h-8 w-full rounded-md border border-white/10 bg-transparent pl-7 pr-2 text-xs text-[#F0EFE2] placeholder:text-[#F0EFE2]/35"
                      />
                    </div>
                    <div className="mt-2 max-h-52 overflow-y-auto">
                      {filtered.map((session) => (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => {
                            onChange({
                              messageSessionId: session.id,
                              messageSessionTitle: session.title,
                            });
                            setSessionOpen(false);
                          }}
                          className="block w-full truncate rounded px-2 py-1.5 text-left text-xs text-[#F0EFE2]/85 hover:bg-[#141414]"
                        >
                          {session.title}
                        </button>
                      ))}
                      {filtered.length === 0 ? (
                        <p className="px-2 py-1.5 text-xs text-[#F0EFE2]/45">No matching sessions</p>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#F0EFE2]/45">i.e. Write a prompt</p>
          <textarea
            value={instruction.messagePrompt}
            onChange={(e) => onChange({ messagePrompt: e.target.value })}
            rows={2}
            placeholder="Write a prompt"
            className="mt-1 w-full resize-y bg-transparent text-xs leading-snug text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-[#F0EFE2]/40 hover:text-[#F0EFE2]"
          aria-label="Remove message instruction"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function MemoryContinuitySection({
  features,
  onChange,
}: {
  features: AutomationMemoryFeatures;
  onChange: (key: keyof AutomationMemoryFeatures, value: boolean) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <MemoryOsBrandIcon className="size-4" />
        <h2 className="text-sm font-semibold text-[#F0EFE2]">Memory & continuity</h2>
      </div>
      <p className="mt-1 text-xs text-[#F0EFE2]/45">
        MemoryOS-native capabilities — always honest, no fake third-party memory.
      </p>
      <ul className="mt-4 space-y-2">
        {MEMORY_FEATURE_OPTIONS.map((opt) => (
          <li key={opt.key}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md px-3 py-3 transition",
                features[opt.key]
                  ? "border border-[#6366F1]/35 bg-[#4338CA]/8"
                  : "border border-transparent hover:border-white/10 hover:bg-white/[0.02]",
              )}
            >
              <input
                type="checkbox"
                checked={features[opt.key]}
                onChange={(e) => onChange(opt.key, e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[#6366F1]"
              />
              <span className="min-w-0">
                <span className="text-xs font-semibold text-[#F0EFE2]">{opt.label}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-[#F0EFE2]/45">
                  {opt.description}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SessionOptionsSection({
  options,
  onChange,
}: {
  options: AutomationForm["sessionOptions"];
  onChange: <K extends keyof AutomationForm["sessionOptions"]>(
    key: K,
    value: AutomationForm["sessionOptions"][K],
  ) => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[#F0EFE2]">Notifications & sessions</h2>
      <p className="mt-1 text-xs text-[#F0EFE2]/45">
        Optional Slack, email, and child session behavior on completion
      </p>
      <ul className="mt-4 space-y-2">
        <li className={cn(subtlePanel(), "flex items-center gap-3 px-4 py-3")}>
          <Bell className="size-4 shrink-0 text-[#F0EFE2]/35" />
          <label className="flex flex-1 cursor-pointer items-center justify-between gap-3 text-xs text-[#F0EFE2]/70">
            <span>Slack notification on complete</span>
            <input
              type="checkbox"
              checked={options.slackNotificationOnComplete}
              onChange={(e) => onChange("slackNotificationOnComplete", e.target.checked)}
              className="size-4 accent-[#6366F1]"
            />
          </label>
        </li>
        <li className={cn(subtlePanel(), "px-4 py-3")}>
          <div className="flex items-center gap-3">
            <Mail className="size-4 shrink-0 text-[#F0EFE2]/35" />
            <label className="flex flex-1 cursor-pointer items-center justify-between gap-3 text-xs text-[#F0EFE2]/70">
              <span>Email notification</span>
              <input
                type="checkbox"
                checked={options.emailNotification}
                onChange={(e) => onChange("emailNotification", e.target.checked)}
                className="size-4 accent-[#6366F1]"
              />
            </label>
          </div>
          {options.emailNotification ? (
            <input
              type="email"
              value={options.notificationEmail}
              onChange={(e) => onChange("notificationEmail", e.target.value)}
              placeholder="you@company.com"
              className="mt-2 h-9 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-3 text-xs text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:outline-none"
            />
          ) : null}
        </li>
      </ul>
    </section>
  );
}

function ConnectorsSection({
  loading,
  filtered,
  selected,
  search,
  onSearchChange,
  onToggle,
  manageConnectionsHref,
  setupReturnTo,
}: {
  loading: boolean;
  filtered: ConnectorRow[];
  selected: AutomationConnectorId[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggle: (id: AutomationConnectorId) => void;
  manageConnectionsHref: string;
  setupReturnTo: string;
}) {
  const selectedMcpIds: ReadonlySet<AutomationConnectorId> = new Set<AutomationConnectorId>(
    selected.filter((id) => MCP_CONNECTOR_IDS.has(id)),
  );
  const hasSearch = search.trim().length > 0;
  const visibleRows = filtered.filter((row) => {
    if (!MCP_CONNECTOR_IDS.has(row.id)) return false;
    if (hasSearch) return true;
    return selectedMcpIds.size > 0
      ? selectedMcpIds.has(row.id)
      : DEFAULT_VISIBLE_MCP_CONNECTOR_IDS.has(row.id);
  });
  const selectedCount = selectedMcpIds.size;

  function statusText(row: ConnectorRow): string {
    if (row.id === "slack") return "No Slack channels";
    if (row.connected) return formatConnectorStatus(row.status);
    return "Setup";
  }

  function badgeText(row: ConnectorRow): string {
    const meta = AUTOMATION_CONNECTOR_META_BY_ID.get(row.id);
    if (meta?.builtIn) return "Built-in";
    if (row.connected) return "Connected";
    return "Setup";
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#F0EFE2]">MCPs</h2>
          <p className="mt-1 text-xs text-[#F0EFE2]/45">
            Select which connectors you&apos;d like this automation to use
          </p>
        </div>
        <Link
          href={manageConnectionsHref}
          className="shrink-0 pt-1 text-xs font-medium text-indigo-300 hover:text-indigo-200"
        >
          Manage MCPs
        </Link>
      </div>

      <div className={cn(subtlePanel(), "mt-4 overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#F0EFE2]/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search MCPs..."
              className="h-8 w-full rounded-md border border-transparent bg-transparent pl-9 pr-3 text-xs leading-4 text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/10 focus:outline-none"
            />
          </div>
          {selectedCount > 0 ? (
            <span className="shrink-0 rounded-full border border-white/10 bg-transparent px-2.5 py-1 text-[11px] leading-4 text-[#F0EFE2]/55">
              {selectedCount} selected
            </span>
          ) : null}
        </div>

        <ul>
          {loading ? (
            <li className="flex items-center gap-2 px-3 py-3 text-xs text-[#F0EFE2]/45">
              <Loader2 className="size-3 animate-spin" />
              Loading MCPs...
            </li>
          ) : (
            visibleRows.map((row) => {
              const isSelected = selectedMcpIds.has(row.id);
              const badge = badgeText(row);
              const meta = AUTOMATION_CONNECTOR_META_BY_ID.get(row.id);
              const setupHref = customMcpSetupHref({
                template: meta?.mcpCatalogId ?? row.id,
                returnTo: setupReturnTo,
              });
              return (
                <li key={row.id}>
                  <div
                    className={cn(
                      "flex min-h-12 items-center gap-3 border-b border-white/[0.06] px-3 py-2.5 transition last:border-b-0",
                      isSelected
                        ? "bg-[#4338CA]/8"
                        : "hover:bg-white/[0.03]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(row.id)}
                      className="size-4 accent-[#6366F1]"
                    />
                    <span className="inline-flex size-6 items-center justify-center">
                      <ConnectorBrandIcon id={row.id} className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <p className="text-sm font-medium text-[#F0EFE2]">{row.label}</p>
                      <p className="truncate text-xs text-[#F0EFE2]/35">
                        {statusText(row)}
                      </p>
                    </div>
                    {badge === "Setup" ? (
                      <Link
                        href={setupHref}
                        className="rounded border border-white/10 bg-transparent px-2 py-0.5 text-[10px] font-semibold leading-4 text-[#F0EFE2]/75 hover:border-white/20 hover:bg-white/[0.04] hover:text-[#F0EFE2]"
                      >
                        Setup
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          "rounded border px-2 py-0.5 text-[10px] font-semibold leading-4",
                          badge === "Built-in"
                            ? "border-[#4338CA]/35 bg-[#4338CA]/14 text-[#60A5FA]"
                            : "border-white/10 bg-transparent text-[#F0EFE2]/65",
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {!loading && visibleRows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm font-semibold text-[#F0EFE2]">
            No MCPs available
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AdvancedSection({
  open,
  onToggle,
  form,
  setForm,
}: {
  open: boolean;
  onToggle: () => void;
  form: AutomationForm;
  setForm: Dispatch<SetStateAction<AutomationForm>>;
}) {
  const [scratchpadMode, setScratchpadMode] = useState<"view" | "edit">("view");
  const [scratchpadTab, setScratchpadTab] = useState<"edit" | "preview">("edit");
  const [scratchpadDraft, setScratchpadDraft] = useState(form.sharedScratchpad ?? "");
  const limitsEnabled = form.limits.costLimitEnabled || form.limits.invocationLimitEnabled;

  function patchLimits<K extends keyof AutomationForm["limits"]>(
    key: K,
    value: AutomationForm["limits"][K],
  ) {
    setForm((prev) => ({
      ...prev,
      limits: { ...prev.limits, [key]: value },
    }));
  }

  function patchNetwork<K extends keyof AutomationForm["networkPolicy"]>(
    key: K,
    value: AutomationForm["networkPolicy"][K],
  ) {
    setForm((prev) => ({
      ...prev,
      networkPolicy: { ...prev.networkPolicy, [key]: value },
    }));
  }

  function patchDomain(index: number, value: string) {
    const next = [...form.networkPolicy.allowedDomains];
    next[index] = value;
    patchNetwork("allowedDomains", next);
  }

  function addDomainRow() {
    patchNetwork("allowedDomains", [...form.networkPolicy.allowedDomains, ""]);
  }

  function removeDomain(index: number) {
    patchNetwork(
      "allowedDomains",
      form.networkPolicy.allowedDomains.filter((_, i) => i !== index),
    );
  }

  function openScratchpadEditor() {
    setScratchpadDraft(form.sharedScratchpad ?? "");
    setScratchpadMode("edit");
    setScratchpadTab("edit");
  }

  function cancelScratchpadEditor() {
    setScratchpadDraft(form.sharedScratchpad ?? "");
    setScratchpadMode("view");
    setScratchpadTab("edit");
  }

  function saveScratchpadEditor() {
    setForm((prev) => ({ ...prev, sharedScratchpad: scratchpadDraft }));
    setScratchpadMode("view");
  }

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left text-sm font-semibold leading-5 text-[#F0EFE2] hover:text-[#F0EFE2]/85"
      >
        Advanced
        {open ? (
          <ChevronDown className="size-4 text-[#F0EFE2]/55" />
        ) : (
          <ChevronRight className="size-4 text-[#F0EFE2]/55" />
        )}
      </button>
      {open ? (
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F0EFE2]/75">
                  <Shield className="size-3.5" />
                  Limits
                </div>
                <p className="mt-1 text-xs leading-5 text-[#F0EFE2]/45">
                  Set cost and invocation limits for sessions this automation starts
                </p>
              </div>
              <ToggleSwitch
                checked={limitsEnabled}
                onChange={(next) => {
                  setForm((prev) => ({
                    ...prev,
                    limits: {
                      ...prev.limits,
                      costLimitEnabled: next,
                      invocationLimitEnabled: next,
                    },
                  }));
                }}
              />
            </div>

            {limitsEnabled ? (
              <div className={cn(subtlePanel(), "mt-3 space-y-2.5 p-3")}>
                <label className="flex items-center justify-between gap-3 text-xs leading-5 text-[#F0EFE2]/80">
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <span>Set limit of</span>
                    <span className="rounded bg-[#141722] px-1.5 py-0.5 text-[#60A5FA]">
                      ${form.limits.costLimitUsd}
                    </span>
                    <span>per session</span>
                  </span>
                  <ToggleSwitch
                    checked={form.limits.costLimitEnabled}
                    onChange={(next) => patchLimits("costLimitEnabled", next)}
                  />
                </label>
                {form.limits.costLimitEnabled ? (
                  <input
                    type="number"
                    min={1}
                    value={form.limits.costLimitUsd}
                    onChange={(e) => patchLimits("costLimitUsd", Number(e.target.value) || 10)}
                    className="h-8 w-28 rounded-md border border-white/10 bg-transparent px-2 text-xs leading-4 text-[#F0EFE2]"
                  />
                ) : null}

                <label className="flex items-center justify-between gap-3 text-xs leading-5 text-[#F0EFE2]/80">
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <span>Set limit of</span>
                    <span className="rounded bg-[#141722] px-1.5 py-0.5 text-[#60A5FA]">
                      {form.limits.invocationLimit}
                    </span>
                    <span>invocations per</span>
                    <span className="rounded bg-[#141722] px-1.5 py-0.5 text-[#60A5FA]">
                      {Math.max(1, form.limits.invocationWindowHours)} hour
                    </span>
                  </span>
                  <ToggleSwitch
                    checked={form.limits.invocationLimitEnabled}
                    onChange={(next) => patchLimits("invocationLimitEnabled", next)}
                  />
                </label>
                {form.limits.invocationLimitEnabled ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={1}
                      value={form.limits.invocationLimit}
                      onChange={(e) => patchLimits("invocationLimit", Number(e.target.value) || 50)}
                      className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs leading-4 text-[#F0EFE2]"
                      aria-label="Invocation limit"
                    />
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={Math.max(1, form.limits.invocationWindowHours)}
                      onChange={(e) =>
                        patchLimits(
                          "invocationWindowHours",
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                      className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs leading-4 text-[#F0EFE2]"
                      aria-label="Invocation window hours"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold leading-4 text-[#F0EFE2]/75">
              <Bot className="size-3.5" />
              MemoryOS mode
            </label>
            <p className="mt-1 text-xs leading-5 text-[#F0EFE2]/45">
              Select the agent mode for sessions spawned by this automation
            </p>
            <AgentModeDropdown
              value={form.agentMode}
              onChange={(agentMode) => setForm((p) => ({ ...p, agentMode }))}
            />
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold leading-4 text-[#F0EFE2]/75">
                  <WebhookTriggerIcon className="size-3.5 text-[#F0EFE2]/65" />
                  Network policy
                </div>
                <p className="mt-1 text-xs leading-5 text-[#F0EFE2]/45">
                  Control which network destinations sessions can access
                </p>
              </div>
              <ToggleSwitch
                checked={form.networkPolicy.enabled}
                onChange={(next) => patchNetwork("enabled", next)}
              />
            </div>

            {form.networkPolicy.enabled ? (
              <div className={cn(subtlePanel(), "mt-3 overflow-hidden")}>
                {form.networkPolicy.allowedDomains.map((domain, idx) => (
                  <div
                    key={`${idx}-${domain}`}
                    className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2 last:border-b-0"
                  >
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => patchDomain(idx, e.target.value)}
                      placeholder="example.com"
                      className="h-8 flex-1 rounded-md border border-white/10 bg-transparent px-2 text-xs leading-4 text-[#F0EFE2] placeholder:text-[#F0EFE2]/35"
                    />
                    <ToggleSwitch checked onChange={(next) => !next && removeDomain(idx)} />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDomainRow}
                  className="inline-flex h-9 w-full items-center gap-1 px-3 text-[11px] font-semibold leading-4 text-[#F0EFE2]/65 hover:bg-white/[0.03]"
                >
                  <Plus className="size-3.5" />
                  Add domain
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold leading-4 text-[#F0EFE2]/80">Shared scratchpad</p>
                <p className="mt-1 text-xs leading-5 text-[#F0EFE2]/45">
                  Shared notes MemoryOS can read and write across every session this automation starts.
                </p>
              </div>
              {scratchpadMode === "edit" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelScratchpadEditor}
                    className="inline-flex h-8 items-center rounded-md border border-white/10 bg-transparent px-3 text-xs font-semibold text-[#F0EFE2]/75 hover:bg-white/[0.03]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveScratchpadEditor}
                    className="inline-flex h-8 items-center rounded-md bg-white px-3 text-xs font-semibold text-[#0A0A0A] hover:bg-white/90"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openScratchpadEditor}
                  className="inline-flex h-8 items-center rounded-md border border-white/10 bg-transparent px-3 text-xs font-semibold text-[#F0EFE2]/80 hover:bg-white/[0.03]"
                >
                  Edit
                </button>
              )}
            </div>
            {scratchpadMode === "edit" ? (
              <ScratchpadEditorShell
                className="mt-3"
                tab={scratchpadTab}
                onTabChange={setScratchpadTab}
                value={scratchpadDraft}
                onChange={setScratchpadDraft}
              />
            ) : (
              <div className={cn(subtlePanel(), "mt-3 px-3 py-4")}>
                <p className="max-h-[84px] overflow-hidden text-xs leading-5 text-[#F0EFE2]/45">
                  {form.sharedScratchpad.trim().length
                    ? form.sharedScratchpad
                    : "No shared content yet. Add notes MemoryOS should carry across every session - learnings, flaky tests, or anything future runs should know."}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition",
        checked ? "border-[#3B82F6] bg-[#3B82F6]" : "border-white/20 bg-white/10",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

function ScratchpadEditorShell({
  tab,
  onTabChange,
  value,
  onChange,
  className,
}: {
  tab: "edit" | "preview";
  onTabChange: (next: "edit" | "preview") => void;
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  return (
    <div className={cn(subtlePanel(), "overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-2.5 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange("edit")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium leading-5 transition",
              tab === "edit" ? "bg-white/10 text-[#F0EFE2]" : "text-[#F0EFE2]/55 hover:text-[#F0EFE2]/80",
            )}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onTabChange("preview")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium leading-5 transition",
              tab === "preview" ? "bg-white/10 text-[#F0EFE2]" : "text-[#F0EFE2]/55 hover:text-[#F0EFE2]/80",
            )}
          >
            Preview
          </button>
        </div>
        <Maximize2 className="size-3.5 text-[#F0EFE2]/40" />
      </div>

      {tab === "edit" ? (
        <textarea
          rows={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your playbook here..."
          className="min-h-[320px] w-full resize-y bg-transparent px-4 py-3 text-sm leading-6 text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:outline-none"
        />
      ) : (
        <div className="min-h-[320px] whitespace-pre-wrap px-4 py-3 text-sm leading-6 text-[#F0EFE2]/85">
          {value.trim().length ? value : "No scratchpad content yet."}
        </div>
      )}
    </div>
  );
}

function TriggerEditor({
  trigger,
  repos,
  connectorById,
  loadingConnectors,
  onRemove,
  onConfigChange,
  onConfigReplace,
}: {
  trigger: AutomationTrigger;
  repos: MemoryOsConnectorStateRepos;
  connectorById: Map<AutomationConnectorId, ConnectorRow>;
  loadingConnectors: boolean;
  onRemove: () => void;
  onConfigChange: (key: string, value: string) => void;
  onConfigReplace: (config: Record<string, string>) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [repoPickerOpen, setRepoPickerOpen] = useState(false);
  const [repoQuery, setRepoQuery] = useState("");
  const [operatorOpenId, setOperatorOpenId] = useState<string | null>(null);
  const conditions = useMemo(() => parseConditions(trigger.config.conditions), [trigger.config.conditions]);
  const isGithubTrigger = GITHUB_TRIGGER_TYPES.includes(trigger.type);
  const isScheduleTrigger = isScheduleTriggerType(trigger.type);
  const isWebhookTrigger = trigger.type === "webhook";
  const selectedRepo = trigger.config.repo ?? "";
  const triggerDisplayText = trigger.type === "ci_failure" ? "Check run" : trigger.label;

  const filteredRepos = useMemo(() => {
    const q = repoQuery.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((repo) => repo.fullName.toLowerCase().includes(q));
  }, [repoQuery, repos]);

  const fieldOptions = useMemo(() => {
    if (!isGithubTrigger) return [];
    if (trigger.type === "github_push") return ["ref", "head_commit.author.name", "repository.full_name"];
    if (trigger.type === "github_check_run" || trigger.type === "ci_failure") {
      return ["action", "conclusion", "name", "check_suite.head_branch"];
    }
    return ["action", "sender.login", "repository.full_name", "pull_request.base.ref", "issue.state"];
  }, [isGithubTrigger, trigger.type]);

  function patchConditions(next: TriggerCondition[]) {
    onConfigChange("conditions", serializeConditions(next));
  }

  function updateCondition(id: string, patch: Partial<TriggerCondition>) {
    patchConditions(conditions.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addCondition() {
    const nextField = fieldOptions[0] ?? "action";
    patchConditions([...conditions, makeCondition({ field: nextField })]);
  }

  function removeCondition(id: string) {
    if (conditions.length <= 1) return;
    patchConditions(conditions.filter((row) => row.id !== id));
  }

  const needsGithub = isGithubTrigger;
  const needsSlack =
    trigger.type === "slack_message" || trigger.type === "slack_message_advanced" || trigger.type === "slack_reaction_added";
  const needsJira = trigger.type === "jira_issue_event";
  const githubOk = connectorById.get("github")?.connected;
  const slackOk = connectorById.get("slack")?.connected;
  const jiraOk = connectorById.get("jira")?.connected;

  if (isScheduleTrigger) {
    return (
      <ScheduleTriggerRow
        trigger={trigger}
        onRemove={onRemove}
        onConfigPatch={onConfigReplace}
      />
    );
  }

  return (
    <div className={cn(subtlePanel(), "p-3")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#F0EFE2]">{trigger.label}</p>
          <p className="mt-0.5 font-mono text-[10px] text-[#F0EFE2]/40">{trigger.type}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-[#F0EFE2]/40 hover:text-[#F0EFE2]"
          aria-label="Remove trigger"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {needsGithub ? renderConnectBanner("GitHub", githubOk, loadingConnectors) : null}
      {needsSlack ? renderConnectBanner("Slack", slackOk, loadingConnectors) : null}
      {needsJira ? renderConnectBanner("Jira", jiraOk, loadingConnectors) : null}

      {trigger.type === "slack_message" || trigger.type === "slack_message_advanced" ? (
        <div className="mt-3 space-y-2">
          <select
            value={trigger.config.channel ?? ""}
            onChange={(e) => onConfigChange("channel", e.target.value)}
            className="h-9 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          >
            <option value="">Select channel…</option>
            <option value="#engineering-bugs">#engineering-bugs</option>
            <option value="#bugs">#bugs</option>
            <option value="#incidents">#incidents</option>
            <option value="#support">#support</option>
          </select>
          <input
            type="text"
            value={trigger.config.keywords ?? ""}
            onChange={(e) => onConfigChange("keywords", e.target.value)}
            placeholder="Keywords (comma-separated)"
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          />
          <label className="flex items-center justify-between gap-2 text-[11px] text-[#F0EFE2]/60">
            <span>Advanced match (thread + keywords)</span>
            <input
              type="checkbox"
              checked={trigger.type === "slack_message_advanced" || trigger.config.matchMode === "advanced"}
              onChange={(e) =>
                onConfigChange("matchMode", e.target.checked ? "advanced" : "simple")
              }
              className="size-3.5 accent-[#6366F1]"
            />
          </label>
        </div>
      ) : null}

      {trigger.type === "slack_reaction_added" ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={trigger.config.channel ?? ""}
            onChange={(e) => onConfigChange("channel", e.target.value)}
            placeholder="Channel (e.g. #incident-room)"
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          />
          <input
            type="text"
            value={trigger.config.emoji ?? ""}
            onChange={(e) => onConfigChange("emoji", e.target.value)}
            placeholder="Reaction filter (optional)"
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          />
        </div>
      ) : null}

      {isGithubTrigger ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#F0EFE2]/80">
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                {triggerDisplayText}
              </span>
              <span className="text-[#F0EFE2]/45">in repo</span>
              <div className="relative min-w-[220px] flex-1">
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { opacity: 0.92 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  onClick={() => setRepoPickerOpen((open) => !open)}
                  className="flex h-8 w-full items-center justify-between rounded-md border border-white/10 bg-transparent px-2 text-left text-xs text-[#F0EFE2]/85"
                >
                  <span className="truncate">{selectedRepo || "Select repository"}</span>
                  <ChevronDown className="size-3.5 text-[#F0EFE2]/45" />
                </motion.button>
                <AnimatePresence initial={false}>
                  {repoPickerOpen ? (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.99 }}
                      animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? {} : { opacity: 0, y: -4, scale: 0.99 }}
                      transition={{ duration: 0.13, ease: "easeOut" }}
                      className="absolute z-20 mt-1 w-full rounded-md border border-white/10 bg-[#0F1013] p-2 shadow-xl"
                    >
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-[#F0EFE2]/40" />
                        <input
                          type="search"
                          value={repoQuery}
                          onChange={(e) => setRepoQuery(e.target.value)}
                          placeholder="Search repos"
                          className="h-8 w-full rounded-md border border-white/10 bg-transparent pl-7 pr-2 text-xs text-[#F0EFE2]"
                        />
                      </div>
                      <div className="mt-1 max-h-44 overflow-y-auto">
                        {filteredRepos.map((repo) => (
                          <button
                            key={repo.fullName}
                            type="button"
                            onClick={() => {
                              onConfigChange("repo", repo.fullName);
                              setRepoPickerOpen(false);
                            }}
                            className="block w-full truncate rounded px-2 py-1.5 text-left text-xs text-[#F0EFE2]/80 hover:bg-white/[0.04]"
                          >
                            {repo.fullName}
                          </button>
                        ))}
                        {filteredRepos.length === 0 ? (
                          <p className="px-2 py-1.5 text-xs text-[#F0EFE2]/45">No matching repositories</p>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

          <div className="space-y-2">
            {conditions.map((row) => (
              <div key={row.id} className="grid grid-cols-12 items-center gap-2">
                <input
                  type="text"
                  value={row.field}
                  onChange={(e) => updateCondition(row.id, { field: e.target.value })}
                  list={`field-options-${trigger.id}`}
                  className="col-span-4 h-8 rounded-md border border-white/10 bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
                  placeholder="field"
                />
                <div className="relative col-span-3">
                  <button
                    type="button"
                    onClick={() => setOperatorOpenId((open) => (open === row.id ? null : row.id))}
                    className="flex h-8 w-full items-center justify-between rounded-md border border-white/10 bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
                  >
                    {row.operator}
                    <ChevronDown className="size-3 text-[#F0EFE2]/45" />
                  </button>
                  <AnimatePresence initial={false}>
                    {operatorOpenId === row.id ? (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? {} : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-10 mt-1 w-full rounded-md border border-white/10 bg-[#0F1013] p-1"
                      >
                        {CONDITION_OPERATORS.map((operator) => (
                          <button
                            key={operator}
                            type="button"
                            onClick={() => {
                              updateCondition(row.id, { operator });
                              setOperatorOpenId(null);
                            }}
                            className="block w-full rounded px-2 py-1 text-left text-xs text-[#F0EFE2]/80 hover:bg-white/[0.04]"
                          >
                            {operator}
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateCondition(row.id, { value: e.target.value })}
                  className="col-span-4 h-8 rounded-md border border-white/10 bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
                  placeholder="value"
                />
                <button
                  type="button"
                  onClick={() => removeCondition(row.id)}
                  className="col-span-1 inline-flex h-8 items-center justify-center rounded-md border border-white/10 text-[#F0EFE2]/65 hover:text-[#F0EFE2] disabled:opacity-35"
                  disabled={conditions.length <= 1}
                  aria-label="Remove condition"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <datalist id={`field-options-${trigger.id}`}>
              {fieldOptions.map((fieldOption) => (
                <option key={fieldOption} value={fieldOption} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={addCondition}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 px-2.5 text-xs text-[#F0EFE2]/75 hover:bg-white/[0.03]"
            >
              <Plus className="size-3.5" />
              Add condition
            </button>
          </div>
          <p className="rounded-md border border-white/[0.06] bg-[#111111] px-3 py-2 text-[11px] leading-5 text-[#F0EFE2]/65">
            For security reasons, automations don&apos;t trigger for events from public GitHub
            repositories, and public repos aren&apos;t shown in the repository picker.
          </p>
        </div>
      ) : null}

      {trigger.type === "github_issue_comment" ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={trigger.config.command ?? "/memoryos"}
            onChange={(e) => onConfigChange("command", e.target.value)}
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 font-mono text-xs text-[#F0EFE2]"
          />
          <select
            value={trigger.config.repo ?? ""}
            onChange={(e) => onConfigChange("repo", e.target.value)}
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          >
            <option value="">All repos</option>
            {repos.map((r) => (
              <option key={r.fullName} value={r.fullName}>
                {r.fullName}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {trigger.type === "jira_issue_event" ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={trigger.config.projectKey ?? ""}
            onChange={(e) => onConfigChange("projectKey", e.target.value)}
            placeholder="Project key (e.g. ENG)"
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          />
          <input
            type="text"
            value={trigger.config.event ?? "created,updated"}
            onChange={(e) => onConfigChange("event", e.target.value)}
            placeholder="Events: created, updated"
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          />
        </div>
      ) : null}

      {trigger.type === "linear_issue_event" ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={trigger.config.teamKey ?? ""}
            onChange={(e) => onConfigChange("teamKey", e.target.value)}
            placeholder="Linear team key"
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          />
          <input
            type="text"
            value={trigger.config.event ?? "created,updated"}
            onChange={(e) => onConfigChange("event", e.target.value)}
            placeholder="Events: created, updated"
            className="h-8 w-full rounded-md border border-[#3A3A3A] bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
          />
        </div>
      ) : null}

      {isWebhookTrigger ? (
        <div className="mt-3 space-y-2">
          <div className="space-y-1">
            <label className="text-[11px] text-[#F0EFE2]/55">Payload filter</label>
            <input
              type="text"
              value={trigger.config.payloadFilter ?? ""}
              onChange={(e) => onConfigChange("payloadFilter", e.target.value)}
              placeholder='e.g. payload.repository.full_name equals "memoryos/repo"'
              className="h-8 w-full rounded-md border border-white/10 bg-[#0A0A0A] px-2 text-xs text-[#F0EFE2]"
            />
            <p className="text-[11px] leading-4 text-[#F0EFE2]/45">
              Optional expression to filter webhook payloads before starting the automation.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 px-2 py-2">
            <span className="font-mono text-[11px] text-[#F0EFE2]/70">
              {trigger.config.webhookSecret ?? "whsec_••••••••"}
            </span>
            <button
              type="button"
              onClick={() =>
                onConfigChange("webhookSecret", `whsec_${Math.random().toString(36).slice(2, 18)}`)
              }
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-[#F0EFE2]/75 hover:bg-white/[0.04]"
            >
              <RefreshCcw className="size-3" />
              Regenerate secret
            </button>
          </div>
        </div>
      ) : null}

      {trigger.type === "memoryos_handoff" ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[#F0EFE2]/45">
          Fires when a continuity handoff is queued from a session or automation run.
        </p>
      ) : null}
    </div>
  );
}

function renderConnectBanner(label: string, ok: boolean | undefined, loadingConnectors: boolean) {
  if (loadingConnectors || ok) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#2F2F2F] bg-[#0A0A0A] px-3 py-2">
      <p className="text-[11px] text-[#F0EFE2]/55">Connect {label} to use this trigger</p>
      <Link
        href={CONNECTORS_CONSOLE_HREF}
        className="inline-flex h-7 items-center rounded-md bg-white px-3 text-[10px] font-semibold text-[#0A0A0A]"
      >
        Connect
      </Link>
    </div>
  );
}
