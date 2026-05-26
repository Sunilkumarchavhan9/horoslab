"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, FileStack, Radio } from "lucide-react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import { clearFunnelFocus, isFunnelActive } from "@/lib/company-brain-funnel";
import { type BillingPlan } from "@/lib/plan-catalog";
import { connectorPanelBleed } from "@/components/developer-console/intel-design";
import { cn } from "@/lib/utils";
import { IntelEmpty, IntelPulseDot } from "@/components/developer-console/intel-section-primitives";
import {
  ConnectorBrandAvatar,
  ConnectorBrandIcon,
  connectorBrandId,
  connectorBrandIdFromName,
} from "@/components/developer-console/connector-brand-icons";
import { IntelligenceStatusBadge } from "@/components/developer-console/os-intelligence-shell";
import { PixelLoadOverlay } from "@/components/ui/pixel-load-overlay";
import { inferPixelToneFromClassName } from "@/lib/pixel-button-runtime";
import { Button } from "../console-ui";

type ConnectorStatus = "connected" | "not_connected" | "pending" | "syncing" | "error";
type HealthStatus = "good" | "watch" | "error" | "offline";

type ConnectorRow = {
  id: string;
  name: string;
  purpose: string;
  requiredPlan: BillingPlan;
  status: ConnectorStatus;
  health: HealthStatus;
  records: number;
  lastSync: string;
  contractCounts?: Record<string, number>;
  primary?: boolean;
  category: string;
  description: string;
};

type ConnectorDiagnostic = {
  type: string;
  status: string;
  auth: { configured: boolean; mode: string };
  transport: { protocol: string; healthy: boolean };
  retry: {
    enabled: boolean;
    retryCount: number;
    lastFailureAt: string | null;
    lastFailureReason: string | null;
  };
  checkpoints?: {
    lastCheckpointAt: string | null;
    recentItemKeysCount: number;
    slackCursor: string | null;
    slackLastMessageTs: string | null;
    gmailLastMessageId: string | null;
    gmailLastCheckpointEpochMs: number | null;
  };
  tokens?: {
    hasRefreshToken: boolean;
    lastTokenRefreshAt: string | null;
    hasAccessToken: boolean;
  };
  contractCounts?: Record<string, number>;
  safety: { mcpSafeMetadata: boolean; policyCompatible: boolean };
};

type ConnectorSyncLog = {
  id: string;
  type: string;
  status: "success" | "error";
  extractedCount: number;
  contractCounts?: Record<string, number>;
  message: string;
  at: string;
};

const INITIAL_CONNECTORS: ConnectorRow[] = [
  {
    id: "github",
    name: "GitHub",
    purpose: "Best for developer continuity: PRs, issues, repo decisions, bug history",
    description: "PRs, issues, commits, repo decisions",
    requiredPlan: "Free",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    primary: true,
    category: "Recommended",
  },
  {
    id: "local-files",
    name: "Local Files",
    purpose: "Import markdown/json context from local workspace",
    description: "Markdown, JSON, workspace context",
    requiredPlan: "Free",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    category: "Recommended",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    purpose: "Shared documents and project specs",
    description: "Shared documents and project specs",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Knowledge Sources",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    purpose: "Enterprise docs and shared folders",
    description: "Enterprise docs and shared folders",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Knowledge Sources",
  },
  {
    id: "gmail",
    name: "Gmail",
    purpose: "Email threads and follow-up context",
    description: "Email threads and follow-up context",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Communication",
  },
  {
    id: "slack",
    name: "Slack",
    purpose: "Workspace channels, threads, and team decisions for agent continuity",
    description: "Public and private channel messages",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Communication",
  },
  {
    id: "zendesk",
    name: "Zendesk",
    purpose: "Support tickets, incident handling, and customer escalation memory",
    description: "Tickets, incidents, runbooks, escalation signals",
    requiredPlan: "Pro",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    category: "Knowledge Sources",
  },
  {
    id: "jira",
    name: "Jira",
    purpose: "Engineering tickets, triage decisions, and execution history",
    description: "Issues, triage, assignment, resolution history",
    requiredPlan: "Pro",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    category: "Knowledge Sources",
  },
  {
    id: "web-crawler",
    name: "Web Crawler",
    purpose: "Capture public docs and release notes",
    description: "Capture public docs and release notes",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Advanced",
  },
  {
    id: "amazon-s3",
    name: "Amazon S3",
    purpose: "Import knowledge snapshots from object storage",
    description: "Import knowledge snapshots from object storage",
    requiredPlan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Advanced",
  },
];

const EXTRACTS = [
  {
    source: "GitHub",
    items: ["Decisions", "Bugs and blockers", "Previous attempts", "Risky files", "Next actions"],
  },
  {
    source: "Local Files",
    items: ["Runbooks", "Policies", "Architecture notes", "Preferences", "Project goals"],
  },
  {
    source: "Slack",
    items: ["Channel decisions", "Thread context", "Mentions", "Incident threads", "Handoff notes"],
  },
];

const INITIAL_ACTIVITY: Array<{ time: string; message: string; status: string }> = [];
const PLAN_ORDER: BillingPlan[] = ["Free", "Pro", "Scale", "Enterprise"];
const FOUNDER_EMAIL = "chavhansunilkumar753@gmail.com";

function canUseConnector(currentPlan: BillingPlan, requiredPlan: BillingPlan): boolean {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

function nextUpgradeLabel(currentPlan: BillingPlan, requiredPlan: BillingPlan): string {
  if (canUseConnector(currentPlan, requiredPlan)) return "Connect";
  if (requiredPlan === "Enterprise") return "Contact Sales";
  return `Upgrade to ${requiredPlan}`;
}

function connectorSeverity(item: ConnectorDiagnostic): "good" | "watch" | "error" {
  if (!item.transport.healthy || item.status === "error") return "error";
  if ((item.retry.retryCount ?? 0) > 0 || Boolean(item.retry.lastFailureReason)) return "watch";
  return "good";
}

function isActiveStatus(status: ConnectorStatus | undefined): boolean {
  return status === "connected" || status === "syncing";
}

function formatContractCounts(counts?: Record<string, number>): string {
  if (!counts) return "";
  return Object.entries(counts)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key.replace(/_/g, " ")}=${value}`)
    .join(" · ");
}

function connectorTypeFromId(id: string): string {
  return id.replace(/-/g, "_");
}

function titleFromType(type: string): string {
  return type
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatConnectorDate(value?: string | null): string {
  if (!value) return "Not yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function compactConnectorMessage(value?: string | null): string {
  if (!value) return "";
  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/Invalid `prisma\.[^`]+` invocation:.*/i, "Database schema mismatch. Apply the production database migration.")
    .trim();
  return cleaned.length > 150 ? `${cleaned.slice(0, 150).trim()}...` : cleaned;
}

type HealthTone = "good" | "watch" | "error" | "neutral";

function healthToneFromLabel(label: string): HealthTone {
  if (label === "Ready" || label === "Connected" || label === "Syncing now") return "good";
  if (label === "Needs attention" || label === "Not connected") return label === "Needs attention" ? "error" : "neutral";
  if (label === "Watch") return "watch";
  return "neutral";
}

function severityTone(severity: "good" | "watch" | "error"): HealthTone {
  if (severity === "error") return "error";
  if (severity === "watch") return "watch";
  return "good";
}

function IntelHealthPill({ label, tone }: { label: string; tone: HealthTone }) {
  const classes: Record<HealthTone, string> = {
    good: "bg-[#D1FAE5] text-[#047857] ring-[#A7F3D0]",
    watch: "bg-[#FEF3C7] text-[#B45309] ring-[#FDE68A]",
    error: "bg-[#FEE2E2] text-[#B91C1C] ring-[#FECACA]",
    neutral: "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]",
  };
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", classes[tone])}>
      {label}
    </span>
  );
}

function PlanPill({ plan }: { plan: BillingPlan }) {
  return (
    <span className="border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
      {plan}
    </span>
  );
}

const LINE_GRID_LINE = "bg-[#E5E7EB]";
const LINE_CELL = "bg-white p-5";
const CONNECTOR_GRID_COLS = 4;

const COMING_SOON_SLOTS: Record<string, Array<{ title: string; detail: string }>> = {
  Recommended: [{ title: "Notion", detail: "Docs & wikis · in review" }],
  Communication: [{ title: "Microsoft Teams", detail: "Enterprise chat · queued" }],
  Advanced: [
    { title: "Confluence", detail: "Knowledge base · planned" },
    { title: "SharePoint", detail: "Enterprise files · planned" },
  ],
};

type CategoryGridItem =
  | { kind: "connector"; connector: ConnectorRow }
  | { kind: "coming-soon"; title: string; detail: string }
  | { kind: "reserved" };

function buildCategoryGridItems(connectors: ConnectorRow[], category: string): CategoryGridItem[] {
  const items: CategoryGridItem[] = connectors.map((connector) => ({ kind: "connector", connector }));
  for (const slot of COMING_SOON_SLOTS[category] ?? []) {
    items.push({ kind: "coming-soon", title: slot.title, detail: slot.detail });
  }
  const target = padGridSlotCount(items.length);
  while (items.length < target) {
    items.push({ kind: "reserved" });
  }
  return items;
}

function ConnectorActionButton({
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { loading?: boolean }) {
  const resolvedClassName = cn(
    "connector-action-btn pixel-load-btn",
    loading && "pixel-load-btn--loading",
    className,
  );
  const pixelTone = inferPixelToneFromClassName(resolvedClassName);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-busy={loading || undefined}
      data-pixel-loading={loading ? "true" : undefined}
      className={resolvedClassName}
      {...props}
    >
      {loading ? <PixelLoadOverlay tone={pixelTone} /> : null}
      <span className="pixel-load-btn__label">{children}</span>
    </button>
  );
}

function ConnectorComingSoonCell({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[220px] flex-1 flex-col items-center justify-center border-dashed px-6 text-center",
        LINE_CELL,
        "bg-[#FAFAFA]",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Coming soon</p>
      <p className="mt-4 text-base font-semibold text-[#374151]">{title}</p>
      <p className="mt-2 text-sm leading-5 text-[#6B7280]">{detail}</p>
      <p className="mt-4 border border-[#E5E7EB] bg-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#9CA3AF]">
        Next connectors shipping
      </p>
    </div>
  );
}

function ConnectorPlaceholderCell() {
  return (
    <div
      className={cn(
        "flex h-full min-h-[220px] flex-1 flex-col items-center justify-center px-6 text-center",
        LINE_CELL,
        "bg-[#FAFAFA]",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Slot reserved</p>
      <p className="mt-4 text-sm font-medium text-[#6B7280]">Another source connector</p>
      <p className="mt-2 text-xs text-[#9CA3AF]">Waiting for next release</p>
    </div>
  );
}

function LineGridFrame({
  children,
  className,
  flush,
}: {
  children: ReactNode;
  className?: string;
  /** Inside connector-page-stack — no per-card border/radius */
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        flush ? "bg-white" : "overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** One continuous full-bleed column: KPI → ingestion → health → categories */
function ConnectorPageStack({ children }: { children: ReactNode }) {
  return <div className="connector-page-stack">{children}</div>;
}

/** Prody hatch band between stacked section panels (replaces plain white space-y gap). */
function ConnectorSectionGutter() {
  return <div className="connector-section-gutter" role="presentation" aria-hidden="true" />;
}

/** Integrations-style 1px gutters — styled in globals.css so lines always tile full height. */
function ConnectorTileGrid({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "tall" | "short" | "health" | "kpi";
}) {
  return (
    <div
      className={cn(
        "connector-tile-grid",
        variant === "tall" && "connector-tile-grid--tall",
        variant === "short" && "connector-tile-grid--short",
        variant === "health" && "connector-tile-grid--health",
        variant === "kpi" && "connector-tile-grid--kpi",
        className,
      )}
    >
      {children}
    </div>
  );
}

function padGridSlotCount(length: number, cols = CONNECTOR_GRID_COLS) {
  return Math.max(cols, Math.ceil(length / cols) * cols);
}

type HealthGridSlot = { kind: "diagnostic"; item: ConnectorDiagnostic } | { kind: "empty" };

function buildHealthGridSlots(diagnostics: ConnectorDiagnostic[]): HealthGridSlot[] {
  const slots: HealthGridSlot[] = diagnostics.map((item) => ({ kind: "diagnostic", item }));
  const target = padGridSlotCount(slots.length);
  while (slots.length < target) {
    slots.push({ kind: "empty" });
  }
  return slots;
}

function SourceHealthPlaceholderCell() {
  return (
    <div className="flex h-full min-h-[200px] flex-1 flex-col items-center justify-center bg-[#FAFAFA] px-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Open slot</p>
      <p className="mt-3 text-sm font-medium text-[#6B7280]">Awaiting source diagnostic</p>
      <p className="mt-2 text-xs text-[#9CA3AF]">Connect another source to fill this column</p>
    </div>
  );
}

function ConnectorGridCell({
  connector,
  diagnostic,
  active,
  locked,
  currentPlan,
  health,
  connectLoading,
  onConnect,
  onDisconnect,
  onUpgrade,
}: {
  connector: ConnectorRow;
  diagnostic?: ConnectorDiagnostic;
  active: boolean;
  locked: boolean;
  currentPlan: BillingPlan;
  health: string;
  connectLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div
      id={connector.id === "github" ? "connector-card-github" : undefined}
      className={cn("flex h-full min-h-[220px] flex-1 flex-col text-left transition hover:bg-[#FAFAFA]", LINE_CELL, active && "bg-[#FAFAFA]")}
    >
      <div className="flex items-start justify-between gap-3">
        <ConnectorBrandAvatar
          connectorId={connector.id}
          className="size-10 rounded-md border-[#E5E7EB] shadow-none"
          iconClassName="size-6"
        />
        <div className="flex flex-col items-end gap-1.5">
          <PlanPill plan={connector.requiredPlan} />
          <IntelHealthPill label={health} tone={healthToneFromLabel(health)} />
        </div>
      </div>
      <p className="mt-6 text-base font-semibold text-[#111827]">{connector.name}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#6B7280]">{connector.purpose}</p>

      <div className={cn("mt-5 grid grid-cols-3 gap-px border border-[#E5E7EB]", LINE_GRID_LINE)}>
        {[
          { label: "Status", value: statusLabel(connector.status) },
          { label: "Records", value: String(connector.records) },
          { label: "Recent keys", value: String(diagnostic?.checkpoints?.recentItemKeysCount ?? 0) },
        ].map((metric) => (
          <div key={metric.label} className={cn(LINE_CELL, "p-3")}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">{metric.label}</p>
            <p className="mt-1 truncate text-sm font-semibold tabular-nums text-[#111827]">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex-1 border-t border-[#E5E7EB] pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#111827]">Last sync</p>
        <p className="mt-1 text-sm text-[#374151]">{connector.lastSync}</p>
        {formatContractCounts(connector.contractCounts) ? (
          <p className="mt-2 text-xs font-medium text-[#0F766E]">{formatContractCounts(connector.contractCounts)}</p>
        ) : null}
        {diagnostic?.retry.lastFailureReason ? (
          <p className="mt-2 text-xs leading-5 text-[#B91C1C]">{compactConnectorMessage(diagnostic.retry.lastFailureReason)}</p>
        ) : (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6B7280]">{connector.description}</p>
        )}
      </div>

      <div className={cn("mt-4 grid gap-px border border-[#E5E7EB]", locked || active ? "grid-cols-2" : "grid-cols-1", LINE_GRID_LINE)}>
        {locked ? (
          <ConnectorActionButton
            className="flex h-10 w-full items-center justify-center bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937]"
            onClick={onUpgrade}
          >
            {nextUpgradeLabel(currentPlan, connector.requiredPlan)}
          </ConnectorActionButton>
        ) : active ? (
          <>
            <ConnectorActionButton
              loading={connectLoading}
              className="flex h-10 w-full items-center justify-center bg-[#F3F4F6] text-sm font-semibold text-[#111827] hover:bg-[#E5E7EB] disabled:opacity-50"
              disabled={connector.status === "syncing"}
              onClick={onConnect}
            >
              {connector.status === "syncing" ? "Syncing" : "Sync now"}
            </ConnectorActionButton>
            <ConnectorActionButton
              className="connector-action-btn--disconnect flex h-10 w-full items-center justify-center text-sm font-semibold"
              onClick={onDisconnect}
            >
              Disconnect
            </ConnectorActionButton>
          </>
        ) : (
          <ConnectorActionButton
            loading={connectLoading}
            className="flex h-10 w-full items-center justify-center bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937]"
            onClick={onConnect}
          >
            Connect {connector.name}
          </ConnectorActionButton>
        )}
      </div>
    </div>
  );
}

function diagnosticForConnector(diagnostics: ConnectorDiagnostic[], connectorId: string): ConnectorDiagnostic | undefined {
  const type = connectorTypeFromId(connectorId);
  return diagnostics.find((item) => item.type === type);
}

function healthLabel(diagnostic?: ConnectorDiagnostic, connector?: ConnectorRow): string {
  if (diagnostic?.status === "syncing" || connector?.status === "syncing") return "Syncing now";
  if (diagnostic && connectorSeverity(diagnostic) === "error") return "Needs attention";
  if (diagnostic && connectorSeverity(diagnostic) === "watch") return "Watch";
  if (diagnostic?.transport.healthy || connector?.status === "connected") return "Ready";
  return "Not connected";
}

function statusLabel(status: ConnectorStatus): string {
  if (status === "connected") return "Connected";
  if (status === "syncing") return "Syncing";
  if (status === "pending") return "Pending";
  if (status === "error") return "Needs attention";
  return "Not connected";
}

function authLabel(diagnostic?: ConnectorDiagnostic): string {
  if (!diagnostic) return "Not checked yet";
  if (!diagnostic.auth.configured) return "Auth not configured";
  if (diagnostic.tokens?.hasAccessToken) return "Access token active";
  if (diagnostic.tokens?.hasRefreshToken) return "Refresh token available";
  return `${titleFromType(diagnostic.auth.mode)} configured`;
}

function syncLogSummary(log: ConnectorSyncLog): string {
  const contracts = formatContractCounts(log.contractCounts);
  const extracted = `${log.extractedCount} ${log.extractedCount === 1 ? "memory" : "memories"}`;
  return contracts ? `${extracted} · ${contracts}` : extracted;
}

async function unlockConnector(type: string, addActivity: (message: string, status?: string) => void): Promise<void> {
  try {
    const token = await getOrCreateMemoryToken();
    if (!token) throw new Error("Missing auth token.");
    const response = await fetch(`/api/connector/${type}/unlock`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const payload = await response.json().catch(() => null) as { data?: { message?: string }; error?: string; message?: string } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? payload?.message ?? `Unlock failed (${response.status})`);
    }
    addActivity(payload?.data?.message ?? `Unlocked ${type}`, "success");
  } catch (error) {
    addActivity(error instanceof Error ? error.message : `Failed to unlock ${type}`, "error");
  }
}

export function ConnectorsSection({ 
  liveMemoryCount = 0, 
  liveRequestCount = 0,
  realtimeVersion = 0,
}: { 
  liveMemoryCount?: number; 
  liveRequestCount?: number;
  realtimeVersion?: number;
}) {
  const [connectors, setConnectors] = useState<ConnectorRow[]>(INITIAL_CONNECTORS);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [internalRecords] = useState(0);
  const [diagnostics, setDiagnostics] = useState<ConnectorDiagnostic[]>([]);
  const [syncLogs, setSyncLogs] = useState<ConnectorSyncLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<BillingPlan>("Free");
  const [realtimeTick, setRealtimeTick] = useState(0);
  const [connectorReloadNonce, setConnectorReloadNonce] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);

  const connectedCount = connectors.filter((connector) => isActiveStatus(connector.status)).length;
  const totalRecords = liveMemoryCount + internalRecords;
  const githubStatus = connectors.find((c) => c.id === "github")?.status;
  const githubConnected = isActiveStatus(githubStatus);
  const [funnelFocusGithub, setFunnelFocusGithub] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !isFunnelActive()) return;
    const focus = window.sessionStorage.getItem("memoryos.company-brain.funnel.focus");
    if (focus === "github") {
      setFunnelFocusGithub(true);
      window.requestAnimationFrame(() => {
        document.getElementById("connector-card-github")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [connectorReloadNonce]);

// Simulation Engine removed for real implementation
useEffect(() => {
  if (realtimeVersion <= 0) return;
  setRealtimeTick((value) => value + 1);
  setConnectorReloadNonce((value) => value + 1);
}, [realtimeVersion]);

useEffect(() => {
  if (realtimeTick <= 0) return;
  setConnectorReloadNonce((value) => value + 1);
}, [realtimeTick]);

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const connectedType = urlParams.get("connected");

  if (connectedType) {
    addActivity(
      `${connectedType.charAt(0).toUpperCase() + connectedType.slice(1)} connected successfully!`,
      "success",
    );

    // Clean up URL
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + (window.location.hash || ""),
    );
  }
}, []);

  // Fetch real connector status from backend
useEffect(() => {
  let cancelled = false;
  async function loadConnectors() {
    if (cancelled) return;
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) return;

      const response = await fetch("/api/connector", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null) as {
        data?: {
          connectors?: Array<{
            type: string;
            status: ConnectorStatus;
            recordCount: number;
            lastSyncAt: string | null;
            contractCounts?: Record<string, number>;
          }>;
        };
      } | null;

      if (!response.ok) {
        return;
      }

      const dbConnectors = payload?.data?.connectors || [];

      if (cancelled) return;
      setConnectors((prev) =>
        prev.map((c) => {
          const dbMatch = dbConnectors.find((dbc) => dbc.type === c.id.replace("-", "_"));

          if (dbMatch) {
            const allowed = canUseConnector(currentPlan, c.requiredPlan);
            return {
              ...c,
              status: allowed ? (dbMatch.status as ConnectorStatus) : "not_connected",
              records: dbMatch.recordCount,
              contractCounts: allowed ? dbMatch.contractCounts : undefined,
              lastSync: allowed
                ? (dbMatch.lastSyncAt
                    ? new Date(dbMatch.lastSyncAt).toLocaleString()
                    : "Connected (not synced yet)")
                : `Locked on ${currentPlan} plan`,
            };
          }

          return c;
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      const transient =
        message.includes("failed to fetch") ||
        message.includes("networkerror") ||
        message.includes("network request failed");
      if (!transient) {
        console.error("Failed to load real connectors:", err);
      }
    }
  }

  loadConnectors();
  const timer = window.setInterval(() => {
    void loadConnectors();
  }, 30000);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [currentPlan, connectorReloadNonce]);

useEffect(() => {
  let cancelled = false;
  async function loadDiagnostics() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) return;
      const response = await fetch("/api/connector/health", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      const list = payload?.data?.diagnostics;
      if (!cancelled && Array.isArray(list)) {
        setDiagnostics(list);
      }
    } catch {
      // non-blocking
    }
  }
  void loadDiagnostics();
  const timer = window.setInterval(() => {
    void loadDiagnostics();
  }, 30000);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [connectorReloadNonce]);

useEffect(() => {
  let cancelled = false;
  async function loadSyncLogs() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) return;
      const response = await fetch("/api/connector/logs", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      const logs = payload?.data?.logs;
      if (!cancelled && Array.isArray(logs)) {
        setSyncLogs(logs as ConnectorSyncLog[]);
      }
    } catch {
      // non-blocking
    }
  }
  void loadSyncLogs();
  const timer = window.setInterval(() => {
    void loadSyncLogs();
  }, 30000);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [connectorReloadNonce]);

useEffect(() => {
  let stream: EventSource | null = null;
  let disposed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;

  async function openStream() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token || disposed) return;
      stream = new EventSource("/api/connector/events");
      stream.onopen = () => {
        reconnectAttempts = 0;
      };
      stream.onmessage = (event) => {
        if (disposed) return;
        setRealtimeTick((value) => value + 1);
        setConnectorReloadNonce((value) => value + 1);
        try {
          const payload = JSON.parse(event.data) as {
            kind?: string;
            payload?: { type?: string; status?: string; message?: string };
          };
          if (payload.kind === "sync_log" && payload.payload?.type) {
            const label = titleFromType(payload.payload.type);
            const status = payload.payload.status === "error" ? "error" : "success";
            addActivity(
              payload.payload.message?.trim() ||
                `${label} sync ${payload.payload.status ?? "updated"}`,
              status,
            );
          }
        } catch {
          // ignore malformed connector stream payloads
        }
      };
      stream.onerror = () => {
        if (stream) {
          stream.close();
          stream = null;
        }
        if (disposed) return;
        const nextDelay = Math.min(15000, 1000 * Math.max(1, reconnectAttempts + 1));
        reconnectAttempts += 1;
        reconnectTimer = setTimeout(() => {
          void openStream();
        }, nextDelay);
      };
    } catch {
      // Polling fallback remains active.
    }
  }

  void openStream();
  return () => {
    disposed = true;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    if (stream) stream.close();
  };
}, []);

useEffect(() => {
  let cancelled = false;
  async function loadCurrentPlan() {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) return;
      const response = await fetch("/api/memory/billing", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json().catch(() => null)) as { currentPlan?: BillingPlan } | null;
      const plan = payload?.currentPlan;
      if (!cancelled && plan && PLAN_ORDER.includes(plan)) {
        setCurrentPlan(plan);
      }
    } catch {
      // non-blocking
    }
  }
  void loadCurrentPlan();
  return () => {
    cancelled = true;
  };
}, []);

async function routeToUpgrade(requiredPlan: BillingPlan) {
  if (requiredPlan === "Enterprise") {
    window.location.href = `mailto:${FOUNDER_EMAIL}`;
    return;
  }
  try {
    const token = await getOrCreateMemoryToken();
    if (!token) throw new Error("Missing auth token.");
    const response = await fetch("/api/memory/billing/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan: requiredPlan }),
    });
    const payload = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? `Checkout failed (${response.status})`);
    }
    if (payload?.checkoutUrl) {
      window.open(payload.checkoutUrl, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    addActivity(error instanceof Error ? error.message : "Could not start checkout", "error");
  }
}

async function connectConnector(connectorId: string) {
  const connectorMeta = connectors.find((entry) => entry.id === connectorId);
  if (!connectorMeta) return;
  if (!canUseConnector(currentPlan, connectorMeta.requiredPlan)) {
    addActivity(
      `${connectorMeta.name} requires ${connectorMeta.requiredPlan}. You are on ${currentPlan}.`,
      "info",
    );
    await routeToUpgrade(connectorMeta.requiredPlan);
    return;
  }

  setActionLoading(connectorId);
  let keepLoading = false;

  const typeMap: Record<string, string> = {
    github: "github",
    "local-files": "local_files",
    "google-drive": "google_drive",
    onedrive: "onedrive",
    gmail: "gmail",
    slack: "slack",
    zendesk: "zendesk",
    jira: "jira",
  };

  const type = typeMap[connectorId];
  if (!type) {
    setActionLoading((current) => (current === connectorId ? null : current));
    return;
  }

  if (connectorMeta.status === "syncing") {
    addActivity(`${connectorMeta.name} sync already in progress`, "info");
    setActionLoading((current) => (current === connectorId ? null : current));
    return;
  }

  if (connectorMeta.status === "connected") {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token");
      setConnectors((current) =>
        current.map((connector) =>
          connector.id === connectorId
            ? { ...connector, status: "syncing" as const, health: "good" }
            : connector,
        ),
      );
      const response = await fetch(`/api/connector/${type}/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => null) as { data?: { extractedCount?: number; message?: string } } | null;
      if (!response.ok) {
        throw new Error("Sync failed");
      }
      const extractedCount = data?.data?.extractedCount ?? 0;
      const queued = response.status === 202 || Boolean(data?.data?.message);
      setConnectors((current) =>
        current.map((connector) =>
          connector.id === connectorId
            ? {
                ...connector,
                status: "connected",
                health: "good",
                records: connector.records + extractedCount,
                lastSync: "Just now",
              }
            : connector,
        ),
      );
      addActivity(
        queued
          ? `${connectorMeta.name} sync queued`
          : `${connectorMeta.name} synced ${extractedCount} memories`,
        "success",
      );
      if (connectorId === "github") {
        clearFunnelFocus();
        setFunnelFocusGithub(false);
      }
    } catch (error) {
      setConnectors((current) =>
        current.map((connector) =>
          connector.id === connectorId
            ? { ...connector, status: "connected" as const, health: "watch" }
            : connector,
        ),
      );
      addActivity(error instanceof Error ? error.message : `Failed to sync ${connectorMeta.name}`, "error");
    } finally {
      if (!keepLoading) {
        setActionLoading((current) => (current === connectorId ? null : current));
      }
    }
    return;
  }

  if (type === "local_files") {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token. Sign in again.");
      const connectRes = await fetch("/api/connector/local_files/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!connectRes.ok) {
        throw new Error(`Failed to enable local files (${connectRes.status})`);
      }
      const syncRes = await fetch("/api/connector/local_files/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const syncPayload = await syncRes.json().catch(() => null) as { data?: { extractedCount?: number } } | null;
      if (!syncRes.ok) {
        throw new Error(`Local files sync failed (${syncRes.status})`);
      }
      const extracted = syncPayload?.data?.extractedCount ?? 0;
      setConnectors((current) =>
        current.map((connector) =>
          connector.id === connectorId
            ? {
                ...connector,
                status: "connected",
                health: "good",
                records: extracted,
                lastSync: "Just now",
              }
            : connector,
        ),
      );
      addActivity(`Local Files connected and synced ${extracted} memories.`, "success");
    } catch (error) {
      addActivity(error instanceof Error ? error.message : "Failed to connect Local Files", "error");
    } finally {
      if (!keepLoading) {
        setActionLoading((current) => (current === connectorId ? null : current));
      }
    }
    return;
  }

  if (
    type === "github"
    || type === "google_drive"
    || type === "onedrive"
    || type === "gmail"
    || type === "slack"
    || type === "zendesk"
    || type === "jira"
  ) {
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token. Sign in again.");
      const response = await fetch(`/api/connector/${type}/authorize`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { authorizeUrl?: string }; error?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? payload?.message ?? `OAuth authorize failed (${response.status})`);
      }
      const authorizeUrl = payload?.data?.authorizeUrl;
      if (!authorizeUrl) {
        throw new Error("Missing authorize URL from connector endpoint.");
      }
      keepLoading = true;
      window.location.href = authorizeUrl;
    } catch (error) {
      addActivity(error instanceof Error ? error.message : "Could not start connector OAuth", "error");
    } finally {
      if (!keepLoading) {
        setActionLoading((current) => (current === connectorId ? null : current));
      }
    }
    return;
  }

  setConnectors((current) =>
    current.map((connector) =>
      connector.id === connectorId
        ? { ...connector, status: "pending" as const }
        : connector,
    ),
  );

  try {
    const token = await getOrCreateMemoryToken();
    if (!token) throw new Error("Missing auth token");

    const response = await fetch(`/api/connector/${type}/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Sync failed");
    }

    const data = await response.json();
    const extractedCount = data?.data?.extractedCount ?? 0;

    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              status: "connected",
              health: "good",
              records:
                connector.records > 0
                  ? connector.records + extractedCount
                  : 128 + extractedCount,
              lastSync: "Just now",
            }
          : connector,
      ),
    );

    const connectorName =
      connectors.find((c) => c.id === connectorId)?.name || connectorId;

    addActivity(
      `${connectorName} connected and synced ${extractedCount} memories`,
      "success",
    );
  } catch (error) {
    console.error("Failed to connect connector:", error);

    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              status: connector.status === "syncing" ? "connected" : "not_connected",
              health: connector.status === "syncing" ? "watch" : "error",
            }
          : connector,
      ),
    );

    addActivity(`Failed to connect ${connectorId}`, "error");
  } finally {
    if (!keepLoading) {
      setActionLoading((current) => (current === connectorId ? null : current));
    }
  }
}

function disconnectConnector(connectorId: string) {
  setConnectors((current) =>
    current.map((connector) =>
      connector.id === connectorId
        ? {
            ...connector,
            status: "not_connected",
            health: "offline",
            records: connector.requiredPlan === "Scale" ? 0 : connector.records,
            lastSync:
              connector.requiredPlan === "Scale"
                ? "Requires Scale plan"
                : "Disconnected",
          }
        : connector,
    ),
  );

  addActivity(`${connectorId} disconnected`, "info");
}

async function runConnectedSync() {
  const connected = connectors.filter((c) => c.status === "connected");
  if (connected.length === 0) {
    addActivity("No connected sources to sync.", "info");
    return;
  }
  setSyncAllLoading(true);
  try {
    await Promise.all(connected.map((c) => connectConnector(c.id)));
  } finally {
    setSyncAllLoading(false);
  }
}

function addActivity(message: string, status: string = "info") {
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  setActivity((prev) => [{ time: now, message, status }, ...prev].slice(0, 10));
}

  const categories = ["Recommended", "Knowledge Sources", "Communication", "Advanced"];
  const failedSyncs = diagnostics.filter((item) => connectorSeverity(item) === "error").length;
  const latestSyncLog = syncLogs[0];
  const realtimeOnline = realtimeTick > 0 || activity.some((item) => item.message.toLowerCase().includes("stream"));
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((category) => [category, true])),
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="w-full min-w-0">
      {isFunnelActive() ? (
        <div className="mb-4 rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3 text-sm text-[#374151]">
          <span className="font-semibold text-[#4338CA]">Company Brain setup · </span>
          Connect GitHub first, run sync, then open Continuity Lab from Overview.
          {funnelFocusGithub ? (
            <span className="mt-1 block text-xs text-[#6B7280]">Step 1–2: connect and sync GitHub below.</span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="max-w-2xl text-sm leading-relaxed text-[#6B7280]">
            Connect company knowledge sources, watch ingestion health, and keep agent memory synchronized with real
            workspace context.
          </p>
          {realtimeOnline ? (
            <IntelligenceStatusBadge live>Live source events</IntelligenceStatusBadge>
          ) : (
            <IntelligenceStatusBadge>Waiting for source stream</IntelligenceStatusBadge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!githubConnected ? (
            <ConnectorActionButton
              loading={actionLoading === "github" || githubStatus === "syncing" || githubStatus === "pending"}
              className="flex h-10 items-center justify-center bg-[#111827] px-4 text-sm font-semibold text-white hover:bg-[#1F2937]"
              onClick={() => void connectConnector("github")}
            >
              Connect GitHub
            </ConnectorActionButton>
          ) : null}
          <ConnectorActionButton
            loading={syncAllLoading}
            className="flex h-10 items-center justify-center border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB]"
            onClick={() => void runConnectedSync()}
          >
            Sync active sources
          </ConnectorActionButton>
          <ConnectorActionButton
            className="flex h-10 items-center justify-center border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB]"
            onClick={() => setShowLogs((current) => !current)}
          >
            {showLogs ? "Hide logs" : "View logs"}
          </ConnectorActionButton>
        </div>
      </div>

      <div className={connectorPanelBleed}>
        <ConnectorPageStack>
        <ConnectorSectionGutter />
        <LineGridFrame flush>
        <ConnectorTileGrid variant="kpi">
          {[
            { label: "Records indexed", value: String(totalRecords), detail: "Live memory records from backend" },
            { label: "Active sources", value: String(connectedCount), detail: `${connectors.length} configured source slots` },
            {
              label: "Failed syncs",
              value: String(failedSyncs),
              detail: failedSyncs ? "Needs operator review" : "No failing diagnostics",
            },
            {
              label: "Source events",
              value: String(realtimeTick),
              detail: realtimeOnline ? "Live connector updates received" : "Waiting for first source event",
            },
          ].map((stat) => (
            <div key={stat.label} className={LINE_CELL}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#111827]">{stat.value}</p>
              <p className="mt-1 text-xs text-[#6B7280]">{stat.detail}</p>
            </div>
          ))}
        </ConnectorTileGrid>
      </LineGridFrame>

      <ConnectorSectionGutter />
      <LineGridFrame flush>
        <div className={cn("border-b border-[#E5E7EB] px-5 py-4", LINE_CELL)}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Ingestion control</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Run source syncs without blocking the console. Connector events refresh this page automatically.
          </p>
        </div>
        <ConnectorTileGrid variant="tall">
          {/* Col 1 — primary action */}
          <div className="flex flex-col p-0">
            <div className="border-b border-[#E5E7EB] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Primary next step</p>
            </div>
            <div className="flex flex-1 flex-col px-4 py-4">
              <p className="text-base font-semibold text-[#111827]">
                {githubConnected ? "Refresh GitHub memory" : "Connect GitHub source"}
              </p>
              <p className="mt-2 text-sm leading-5 text-[#6B7280]">
                {githubConnected
                  ? "Pull latest PRs, issues, commits, and repo decisions into the company graph."
                  : "Give agents repo-aware history before handoffs, debugging, and planning."}
              </p>
              <div className="mt-4 grid gap-px border border-[#E5E7EB] bg-[#E5E7EB] text-xs">
                <div className="grid grid-cols-[7rem_1fr] gap-px bg-[#E5E7EB]">
                  <div className="bg-[#F9FAFB] px-2 py-1.5 font-semibold uppercase tracking-wide text-[#9CA3AF]">Source</div>
                  <div className="flex items-center gap-2 bg-white px-2 py-1.5 text-[#111827]">
                    <ConnectorBrandIcon id="github" className="size-4" />
                    GitHub
                  </div>
                </div>
                <div className="grid grid-cols-[7rem_1fr] gap-px bg-[#E5E7EB]">
                  <div className="bg-[#F9FAFB] px-2 py-1.5 font-semibold uppercase tracking-wide text-[#9CA3AF]">State</div>
                  <div className="bg-white px-2 py-1.5 font-medium text-[#111827]">
                    {githubConnected ? "Connected" : "Not connected"}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-[#E5E7EB] p-4">
              <ConnectorActionButton
                loading={
                  actionLoading === "github" || githubStatus === "syncing" || githubStatus === "pending"
                }
                className="flex h-10 w-full items-center justify-center bg-[#111827] text-sm font-semibold text-white hover:bg-[#1F2937] disabled:opacity-50"
                disabled={githubStatus === "syncing"}
                onClick={() => void connectConnector("github")}
              >
                {githubStatus === "syncing" ? "Syncing GitHub…" : githubConnected ? "Sync GitHub" : "Connect GitHub"}
              </ConnectorActionButton>
            </div>
          </div>

          {/* Col 2 — latest sync */}
          <div className="flex flex-col p-0">
            <div className="border-b border-[#E5E7EB] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Latest ingestion</p>
            </div>
            <div className="flex flex-1 flex-col px-4 py-4">
              {latestSyncLog ? (
                <div className="grid gap-px border border-[#E5E7EB] bg-[#E5E7EB] text-sm">
                  <div className="grid grid-cols-[6.5rem_1fr] gap-px bg-[#E5E7EB]">
                    <div className="bg-[#F9FAFB] px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                      Source
                    </div>
                    <div className="bg-white px-2 py-2 font-semibold text-[#111827]">{titleFromType(latestSyncLog.type)}</div>
                  </div>
                  <div className="grid grid-cols-[6.5rem_1fr] gap-px bg-[#E5E7EB]">
                    <div className="bg-[#F9FAFB] px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                      Result
                    </div>
                    <div className="bg-white px-2 py-2 text-[#374151]">{syncLogSummary(latestSyncLog)}</div>
                  </div>
                  <div className="grid grid-cols-[6.5rem_1fr] gap-px bg-[#E5E7EB]">
                    <div className="bg-[#F9FAFB] px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                      When
                    </div>
                    <div className="bg-white px-2 py-2 text-xs text-[#6B7280]">{formatConnectorDate(latestSyncLog.at)}</div>
                  </div>
                  <div className="grid grid-cols-[6.5rem_1fr] gap-px bg-[#E5E7EB]">
                    <div className="bg-[#F9FAFB] px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                      Status
                    </div>
                    <div className="bg-white px-2 py-2">
                      <IntelHealthPill label={latestSyncLog.status} tone={latestSyncLog.status === "success" ? "good" : "error"} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col justify-center border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-6 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Queue empty</p>
                  <p className="mt-3 text-sm font-medium text-[#374151]">Waiting for first sync</p>
                  <p className="mt-2 text-xs leading-5 text-[#6B7280]">Connect GitHub or sync a source to record ingestion here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Col 3 — live activity */}
          <div className="flex flex-col p-0">
            <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Live activity</p>
              {realtimeOnline ? <IntelPulseDot tone="emerald" /> : null}
            </div>
            <div className="flex flex-1 flex-col px-4 py-4">
              {activity.slice(0, 5).length > 0 ? (
                <div className="overflow-hidden border border-[#E5E7EB]">
                  <div className="grid grid-cols-[1fr_3.5rem] gap-px border-b border-[#E5E7EB] bg-[#F9FAFB] text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <div className="px-2 py-1.5">Event</div>
                    <div className="px-2 py-1.5 text-right">Time</div>
                  </div>
                  {activity.slice(0, 5).map((item, index) => (
                    <div
                      key={`${item.time}-${index}`}
                      className={cn(
                        "grid grid-cols-[1fr_3.5rem] gap-2 border-[#E5E7EB] px-2 py-2 text-sm",
                        index > 0 && "border-t",
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <span
                          className={cn(
                            "mt-1.5 size-1.5 shrink-0",
                            item.status === "error" ? "bg-[#EF4444]" : item.status === "success" ? "bg-[#10B981]" : "bg-[#14B8A6]",
                          )}
                        />
                        <span className="truncate text-[#374151]">{item.message}</span>
                      </div>
                      <span className="text-right text-xs tabular-nums text-[#9CA3AF]">{item.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col overflow-hidden border border-[#E5E7EB]">
                  <div className="grid grid-cols-[1fr_3.5rem] gap-px border-b border-[#E5E7EB] bg-[#F9FAFB] text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <div className="px-2 py-1.5">Event</div>
                    <div className="px-2 py-1.5 text-right">Time</div>
                  </div>
                  {["Listening for connector events", "Next: OAuth callbacks", "Next: sync completions"].map((row, index) => (
                    <div
                      key={row}
                      className={cn(
                        "grid grid-cols-[1fr_3.5rem] gap-2 border-[#E5E7EB] bg-[#FAFAFA] px-2 py-2.5 text-xs text-[#9CA3AF]",
                        index > 0 && "border-t",
                      )}
                    >
                      <span className="italic">{row}</span>
                      <span className="text-right">—</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Col 4 — extracts */}
          <div className="flex flex-col p-0">
            <div className="border-b border-[#E5E7EB] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">What MemoryOS extracts</p>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              {EXTRACTS.map((extract, index) => (
                <div
                  key={extract.source}
                  className={cn("px-4 py-3", index > 0 && "border-t border-[#E5E7EB]")}
                >
                  <div className="flex items-center gap-2">
                    <ConnectorBrandIcon id={connectorBrandIdFromName(extract.source)} className="size-5" />
                    <p className="text-sm font-semibold text-[#111827]">{extract.source}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {extract.items.map((item) => (
                      <span
                        key={item}
                        className="border border-[#E5E7EB] bg-[#F9FAFB] px-1.5 py-0.5 text-[11px] text-[#374151]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ConnectorTileGrid>
      </LineGridFrame>

      {showLogs ? (
        <>
          <ConnectorSectionGutter />
          <LineGridFrame flush>
          <div className={cn("border-b border-[#E5E7EB] px-5 py-4", LINE_CELL)}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Connector sync logs</p>
            <p className="mt-1 text-sm text-[#6B7280]">Recent backend ingestion jobs and extracted memory contracts.</p>
          </div>
          {syncLogs.length === 0 ? (
            <div className={cn("px-5 py-12 text-center text-sm text-[#6B7280]", LINE_CELL)}>No sync logs yet.</div>
          ) : (
            <div className={cn("grid gap-px", LINE_GRID_LINE)}>
              {syncLogs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className={cn("grid gap-px md:grid-cols-[12rem_minmax(0,1fr)_auto]", LINE_GRID_LINE)}
                >
                  <div className={LINE_CELL}>
                    <p className="text-sm font-semibold text-[#111827]">{titleFromType(log.type)}</p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">{formatConnectorDate(log.at)}</p>
                  </div>
                  <div className={LINE_CELL}>
                    <p className="text-sm text-[#374151]">{syncLogSummary(log)}</p>
                    {log.message ? (
                      <p className="mt-1 text-xs text-[#6B7280]">{compactConnectorMessage(log.message)}</p>
                    ) : null}
                  </div>
                  <div className={cn("flex items-center px-4", LINE_CELL)}>
                    <IntelHealthPill label={log.status} tone={log.status === "success" ? "good" : "error"} />
                  </div>
                </div>
              ))}
            </div>
          )}
          </LineGridFrame>
        </>
      ) : null}

      <ConnectorSectionGutter />
      <LineGridFrame flush>
        <div className={cn("border-b border-[#E5E7EB] px-5 py-4", LINE_CELL)}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Source health</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Connector diagnostics — auth, transport, and checkpoints summarized for operators.
          </p>
        </div>
        {diagnostics.length === 0 ? (
          <div className={LINE_CELL}>
            <IntelEmpty
              icon={Radio}
              title="No diagnostics yet"
              description="The backend has not returned source health diagnostics for this workspace."
            />
          </div>
        ) : (
          <ConnectorTileGrid variant="health">
            {buildHealthGridSlots(diagnostics).map((slot, index) =>
              slot.kind === "empty" ? (
                <SourceHealthPlaceholderCell key={`health-empty-${index}`} />
              ) : (
                <div key={slot.item.type} className={cn("flex h-full flex-1 flex-col", LINE_CELL)}>
                    {(() => {
                      const item = slot.item;
                      const severity = connectorSeverity(item);
                      const label = healthLabel(item);
                      return (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <ConnectorBrandAvatar
                              connectorId={connectorBrandId(item.type)}
                              className="size-10 rounded-md border-[#E5E7EB] shadow-none"
                              iconClassName="size-5"
                            />
                            <IntelHealthPill label={label} tone={severityTone(severity)} />
                          </div>
                          <p className="mt-6 text-base font-semibold text-[#111827]">{titleFromType(item.type)}</p>
                          <p className="mt-2 text-sm leading-5 text-[#6B7280]">
                            {item.transport.protocol.toUpperCase()} transport · {authLabel(item)}
                          </p>
                          <div className={cn("mt-5 grid grid-cols-2 gap-px border border-[#E5E7EB]", LINE_GRID_LINE)}>
                            <div className={cn("p-3", LINE_CELL)}>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Recent keys</p>
                              <p className="mt-1 text-lg font-semibold tabular-nums text-[#111827]">
                                {item.checkpoints?.recentItemKeysCount ?? 0}
                              </p>
                            </div>
                            <div className={cn("p-3", LINE_CELL)}>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Retries</p>
                              <p className="mt-1 text-lg font-semibold tabular-nums text-[#111827]">{item.retry.retryCount}</p>
                            </div>
                          </div>
                          <div className="mt-5 flex-1 border-t border-[#E5E7EB] pt-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#111827]">Checkpoint</p>
                            <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                              {formatConnectorDate(item.checkpoints?.lastCheckpointAt)}
                            </p>
                            {formatContractCounts(item.contractCounts) ? (
                              <p className="mt-2 text-xs font-medium text-[#0F766E]">{formatContractCounts(item.contractCounts)}</p>
                            ) : null}
                            {item.retry.lastFailureReason ? (
                              <p className="mt-2 text-xs text-[#B91C1C]">{compactConnectorMessage(item.retry.lastFailureReason)}</p>
                            ) : (
                              <p className="mt-2 text-xs text-[#9CA3AF]">No recent sync failure reported.</p>
                            )}
                          </div>
                          {item.status === "syncing" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="mt-4 h-10 w-full rounded-none border border-[#E5E7EB] bg-white"
                              variant="outline"
                              onClick={() => void unlockConnector(item.type, addActivity)}
                            >
                              Force unlock stuck sync
                            </Button>
                          ) : null}
                        </>
                      );
                    })()}
                </div>
              ),
            )}
          </ConnectorTileGrid>
        )}
      </LineGridFrame>

      {categories.map((category) => {
        const categoryConnectors = connectors.filter((connector) => connector.category === category);
        if (categoryConnectors.length === 0) return null;
        const open = expandedCategories[category] ?? true;
        return (
          <Fragment key={category}>
            <ConnectorSectionGutter />
            <LineGridFrame flush>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4 text-left transition hover:bg-[#FAFAFA]",
                  LINE_CELL,
                )}
                aria-expanded={open}
              >
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#111827]">{category}</h3>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {categoryConnectors.length} live
                    {(COMING_SOON_SLOTS[category]?.length ?? 0) > 0
                      ? ` · ${COMING_SOON_SLOTS[category]!.length} coming soon`
                      : ""}
                  </p>
                </div>
                <ChevronDown
                  className={cn("size-4 shrink-0 text-[#9CA3AF] transition-transform duration-200", open && "rotate-180")}
                />
              </button>
              {open ? (
                <ConnectorTileGrid>
                  {buildCategoryGridItems(categoryConnectors, category).map((item, index) => {
                    if (item.kind === "coming-soon") {
                      return (
                        <ConnectorComingSoonCell
                          key={`${category}-soon-${item.title}`}
                          title={item.title}
                          detail={item.detail}
                        />
                      );
                    }
                    if (item.kind === "reserved") {
                      return <ConnectorPlaceholderCell key={`${category}-reserved-${index}`} />;
                    }
                    const connector = item.connector;
                    return (
                      <ConnectorGridCell
                        key={connector.id}
                        connector={connector}
                        diagnostic={diagnosticForConnector(diagnostics, connector.id)}
                        active={isActiveStatus(connector.status)}
                        locked={!canUseConnector(currentPlan, connector.requiredPlan)}
                        currentPlan={currentPlan}
                        health={healthLabel(diagnosticForConnector(diagnostics, connector.id), connector)}
                        connectLoading={
                          actionLoading === connector.id
                          || connector.status === "syncing"
                          || connector.status === "pending"
                        }
                        onConnect={() => void connectConnector(connector.id)}
                        onDisconnect={() => disconnectConnector(connector.id)}
                        onUpgrade={() => void routeToUpgrade(connector.requiredPlan)}
                      />
                    );
                  })}
                </ConnectorTileGrid>
              ) : null}
            </LineGridFrame>
          </Fragment>
        );
      })}
        </ConnectorPageStack>
      </div>
    </div>
  );
}
