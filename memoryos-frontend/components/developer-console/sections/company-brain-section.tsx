"use client";

import { useEffect, useRef, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type CompanyBrainPayload = {
  workspace: string;
  generatedAt: string;
  exportId?: string;
  stats: {
    activeMemoryCount: number;
    totalTimelineEvents: number;
    decisions: number;
    constraints: number;
    incidents: number;
    runbooks: number;
    openRisks: number;
  };
  skillsMarkdown: string;
};

type CompanyBrainExportSummary = {
  id: string;
  workspace: string;
  generatedAt: string;
  stats: CompanyBrainPayload["stats"];
};

type GovernancePolicy = {
  riskPolicy: Record<"low" | "medium" | "high", {
    autoExecute: boolean;
    requiredApprovals: Array<"owner" | "admin" | "operator">;
  }>;
};

type ActionItem = {
  id: string;
  name: string;
  risk: "low" | "medium" | "high";
  status: "pending" | "approved" | "executed" | "rejected" | "failed";
  requiredApprovals: Array<"owner" | "admin" | "operator">;
  approvals?: Array<{
    reviewerUserId: string;
    reviewerRole: "owner" | "admin" | "operator" | "viewer";
    decision: "approve" | "reject";
    at: string;
  }>;
  executionConstraints: string[];
  executionResult?: { ok: boolean; detail: string; externalRef?: string };
  createdAt: string;
};

type ActionSimulation = {
  name: string;
  risk: "low" | "medium" | "high";
  requiredApprovals: Array<"owner" | "admin" | "operator">;
  executionConstraints: string[];
  complianceBlocked: boolean;
  complianceBlockReason: string | null;
  autoExecutable: boolean;
};

type CompanyBrainStatus = {
  scheduler: {
    enabled: boolean;
    intervalSeconds: number;
    lastTickAt: string | null;
    lastError: string | null;
  };
  queue: { queued: number; running: number; failed: number };
  graph: { nodes: number; edges: number; updatedAt: string | null };
  skills: { count: number; updatedAt: string | null };
  sourceEvents: { pending: number; failed: number; deadLetter: number };
  approvals: { pending: number };
  sre: { alerts: number; workers: number };
};

type SreRunbook = {
  queueBackendMode: "file" | "redis";
  steps: string[];
  warnings: string[];
};

type CompanyBrainSource = {
  id: string;
  type: "github" | "notion" | "local_files" | "slack" | "gmail" | "support" | "crm" | "db";
  enabled: boolean;
  config: Record<string, unknown>;
  updatedAt: string;
};

const DEFAULT_GOVERNANCE: GovernancePolicy = {
  riskPolicy: {
    low: { autoExecute: true, requiredApprovals: ["operator"] },
    medium: { autoExecute: false, requiredApprovals: ["admin", "operator"] },
    high: { autoExecute: false, requiredApprovals: ["owner", "admin"] },
  },
};

type CompanyBrainSectionProps = {
  realtimeVersion?: number;
};

export function CompanyBrainSection({ realtimeVersion = 0 }: CompanyBrainSectionProps) {
  const [payload, setPayload] = useState<CompanyBrainPayload | null>(null);
  const [exportsHistory, setExportsHistory] = useState<CompanyBrainExportSummary[]>([]);
  const [governance, setGovernance] = useState<GovernancePolicy>(DEFAULT_GOVERNANCE);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [controlStatus, setControlStatus] = useState<CompanyBrainStatus | null>(null);
  const [sources, setSources] = useState<CompanyBrainSource[]>([]);
  const [sourceType, setSourceType] = useState<"support" | "crm" | "db">("support");
  const [sourceProvider, setSourceProvider] = useState("zendesk");
  const [sourceEnabled, setSourceEnabled] = useState(true);
  const [sourceApiUrl, setSourceApiUrl] = useState("");
  const [sourceApiKey, setSourceApiKey] = useState("");
  const [sourceBearerToken, setSourceBearerToken] = useState("");
  const [sourceAuthHeader, setSourceAuthHeader] = useState("Authorization");
  const [newActionName, setNewActionName] = useState("github_create_issue");
  const [newActionPayload, setNewActionPayload] = useState('{"repo":"Sunilkumarchavhan9/MemoryOS","title":"Company Brain follow-up"}');
  const [simulation, setSimulation] = useState<ActionSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [roleTargetUserId, setRoleTargetUserId] = useState("");
  const [roleValue, setRoleValue] = useState<"owner" | "admin" | "operator" | "viewer">("operator");
  const [roleScopes, setRoleScopes] = useState("actions.execute,actions.approve,governance.policy.write,governance.roles.write");
  const [loading, setLoading] = useState(true);
  const [compilingSkills, setCompilingSkills] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sreRunbook, setSreRunbook] = useState<SreRunbook | null>(null);
  const didInitialLoadRef = useRef(false);

  async function authHeaders(): Promise<HeadersInit> {
    const token = await getOrCreateMemoryToken();
    if (!token) throw new Error("Missing auth token.");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }

  async function loadSkills(): Promise<void> {
    const headers = await authHeaders();
    const response = await fetch("/api/memory/company-brain/skills", {
      headers,
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as CompanyBrainPayload | { error?: string } | null;
    if (!response.ok || !data || !("skillsMarkdown" in data)) {
      throw new Error((data as { error?: string } | null)?.error ?? "Failed to generate Company Brain skills.");
    }
    setPayload(data);
    const historyResponse = await fetch("/api/memory/company-brain/exports", {
      headers,
      cache: "no-store",
    });
    const historyJson = (await historyResponse.json().catch(() => null)) as { exports?: CompanyBrainExportSummary[] } | null;
    setExportsHistory(Array.isArray(historyJson?.exports) ? historyJson.exports : []);
  }

  async function loadCompanyBrainControlPlane(): Promise<void> {
    const headers = await authHeaders();
    const [governanceRes, actionsRes, statusRes, sourcesRes, runbookRes] = await Promise.all([
      fetch("/api/company-brain/governance", { headers, cache: "no-store" }),
      fetch("/api/company-brain/actions", { headers, cache: "no-store" }),
      fetch("/api/company-brain/status", { headers, cache: "no-store" }),
      fetch("/api/company-brain/sources", { headers, cache: "no-store" }),
      fetch("/api/company-brain/sre/runbook", { headers, cache: "no-store" }),
    ]);
    const governanceJson = (await governanceRes.json().catch(() => null)) as { governance?: GovernancePolicy } | null;
    const actionsJson = (await actionsRes.json().catch(() => null)) as { actions?: ActionItem[] } | null;
    const statusJson = (await statusRes.json().catch(() => null)) as CompanyBrainStatus | null;
    const sourcesJson = (await sourcesRes.json().catch(() => null)) as { sources?: CompanyBrainSource[] } | null;
    const runbookJson = (await runbookRes.json().catch(() => null)) as SreRunbook | null;

    if (governanceRes.ok && governanceJson?.governance) {
      setGovernance(governanceJson.governance);
    }
    if (actionsRes.ok && Array.isArray(actionsJson?.actions)) {
      setActions(actionsJson.actions);
    }
    if (statusRes.ok && statusJson && typeof statusJson === "object") {
      setControlStatus(statusJson);
    }
    if (sourcesRes.ok && Array.isArray(sourcesJson?.sources)) {
      setSources(sourcesJson.sources);
    }
    if (runbookRes.ok && runbookJson) {
      setSreRunbook(runbookJson);
    }
  }

  async function runSreRecoverQueue(): Promise<void> {
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/company-brain/sre/recover-queue", {
        method: "POST",
        headers,
      });
      const data = (await response.json().catch(() => null)) as { recovered?: number; error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? "Failed to recover queue.");
      setStatusMessage(`Recovered failed queue jobs: ${data?.recovered ?? 0}`);
      await loadCompanyBrainControlPlane();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to recover queue.");
    }
  }

  async function runSreBackfillDeadLetter(): Promise<void> {
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/company-brain/sre/backfill-dead-letter", {
        method: "POST",
        headers,
      });
      const data = (await response.json().catch(() => null)) as { requeued?: number; error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? "Failed to backfill dead-letter events.");
      setStatusMessage(`Requeued dead-letter events: ${data?.requeued ?? 0}`);
      await loadCompanyBrainControlPlane();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to backfill dead-letter events.");
    }
  }

  async function saveBusinessSource(): Promise<void> {
    try {
      if (!sourceApiUrl.trim()) throw new Error("apiUrl is required");
      const headers = await authHeaders();
      const response = await fetch("/api/company-brain/sources", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: sourceType,
          enabled: sourceEnabled,
          config: {
            provider: sourceProvider,
            apiUrl: sourceApiUrl.trim(),
            ...(sourceApiKey.trim() ? { apiKey: sourceApiKey.trim() } : {}),
            ...(sourceBearerToken.trim() ? { bearerToken: sourceBearerToken.trim() } : {}),
            ...(sourceAuthHeader.trim() ? { authHeader: sourceAuthHeader.trim() } : {}),
          },
        }),
      });
      const data = (await response.json().catch(() => null)) as { source?: CompanyBrainSource; error?: string } | null;
      if (!response.ok || !data?.source) throw new Error(data?.error ?? "Failed to save source");
      setStatusMessage(`Saved source ${data.source.type} (${data.source.enabled ? "enabled" : "disabled"}).`);
      await loadCompanyBrainControlPlane();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save business source.");
    }
  }

  useEffect(() => {
    if (sourceType === "support") setSourceProvider("zendesk");
    if (sourceType === "crm") setSourceProvider("hubspot");
    if (sourceType === "db") setSourceProvider("postgres");
  }, [sourceType]);

  async function saveGovernance(): Promise<void> {
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/company-brain/governance", {
        method: "POST",
        headers,
        body: JSON.stringify({ riskPolicy: governance.riskPolicy }),
      });
      const data = (await response.json().catch(() => null)) as { governance?: GovernancePolicy; error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? "Failed to save governance");
      if (data?.governance) setGovernance(data.governance);
      setStatusMessage("Governance policy saved.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save governance.");
    }
  }

  async function assignRole(): Promise<void> {
    try {
      if (!roleTargetUserId.trim()) throw new Error("target user id is required");
      const headers = await authHeaders();
      const scopes = roleScopes.split(",").map((value) => value.trim()).filter(Boolean);
      const response = await fetch("/api/company-brain/roles", {
        method: "POST",
        headers,
        body: JSON.stringify({
          targetUserId: roleTargetUserId.trim(),
          role: roleValue,
          scopes,
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error ?? "Failed to assign role");
      setStatusMessage(`Role ${roleValue} assigned to ${roleTargetUserId.trim()}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to assign role.");
    }
  }

  async function requestAction(): Promise<void> {
    try {
      const headers = await authHeaders();
      const parsedPayload = JSON.parse(newActionPayload || "{}") as Record<string, unknown>;
      const response = await fetch("/api/company-brain/actions/request", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: newActionName, payload: parsedPayload }),
      });
      const data = (await response.json().catch(() => null)) as { action?: ActionItem; error?: string } | null;
      if (!response.ok || !data?.action) throw new Error(data?.error ?? "Failed to create action");
      setStatusMessage(`Action created: ${data.action.name} (${data.action.status}).`);
      await loadCompanyBrainControlPlane();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create action.");
    }
  }

  async function simulateCurrentAction(): Promise<void> {
    try {
      setIsSimulating(true);
      setSimulation(null);
      const headers = await authHeaders();
      const parsedPayload = JSON.parse(newActionPayload || "{}") as Record<string, unknown>;
      const response = await fetch("/api/company-brain/actions/simulate", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: newActionName, payload: parsedPayload }),
      });
      const data = (await response.json().catch(() => null)) as { simulation?: ActionSimulation; error?: string } | null;
      if (!response.ok || !data?.simulation) throw new Error(data?.error ?? "Failed to simulate action");
      setSimulation(data.simulation);
      setStatusMessage(`Simulation ready: ${data.simulation.name} (${data.simulation.risk})`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to simulate action.");
    } finally {
      setIsSimulating(false);
    }
  }

  async function reviewAction(actionId: string, decision: "approve" | "reject"): Promise<void> {
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/company-brain/actions/review", {
        method: "POST",
        headers,
        body: JSON.stringify({ actionId, decision }),
      });
      const data = (await response.json().catch(() => null)) as { action?: ActionItem; error?: string } | null;
      if (!response.ok || !data?.action) throw new Error(data?.error ?? "Failed to review action");
      setStatusMessage(`Action ${decision}d: ${data.action.name}`);
      await loadCompanyBrainControlPlane();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to review action.");
    }
  }

  async function executeAction(actionId: string): Promise<void> {
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/company-brain/actions/execute", {
        method: "POST",
        headers,
        body: JSON.stringify({ actionId }),
      });
      const data = (await response.json().catch(() => null)) as { action?: ActionItem; error?: string } | null;
      if (!response.ok || !data?.action) throw new Error(data?.error ?? "Failed to execute action");
      setStatusMessage(`Action executed: ${data.action.name} (${data.action.status})`);
      await loadCompanyBrainControlPlane();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to execute action.");
    }
  }

  function downloadSkills(): void {
    if (!payload?.skillsMarkdown) return;
    const blob = new Blob([payload.skillsMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "COMPANY_BRAIN.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function compileAndDownloadSkills(): Promise<void> {
    try {
      setCompilingSkills(true);
      setErrorMessage(null);
      setStatusMessage("Compiling Company Brain export...");
      await loadSkills();
      setStatusMessage("Company Brain export compiled. Download is ready.");
    } catch (error) {
      setStatusMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to compile Company Brain export.");
    } finally {
      setCompilingSkills(false);
    }
  }

  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    let cancelled = false;
    void (async () => {
      try {
        await loadCompanyBrainControlPlane();
        if (!cancelled) {
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load Company Brain.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const companyStats = payload?.stats;
  const activeSources = sources.filter((source) => source.enabled).length;
  const businessSources = sources.filter((source) => source.type === "support" || source.type === "crm" || source.type === "db");
  const pendingActions = actions.filter((action) => action.status === "pending").length;
  const blockedActions = actions.filter((action) => action.status === "failed" || action.status === "rejected").length;
  const controlPlaneReady = Boolean(controlStatus) && !controlStatus?.scheduler.lastError;
  const companyBrainLocked = errorMessage?.toLowerCase().includes("pro") ?? false;
  const runtimeStatus = controlPlaneReady
    ? "Operational"
    : companyBrainLocked
      ? "Plan required"
      : loading
        ? "Checking"
        : "Idle";

  function formatDate(value: string | null | undefined): string {
    if (!value) return "Not seen yet";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not seen yet";
    return date.toLocaleString();
  }

  function sourceLabel(source: CompanyBrainSource): string {
    const provider = typeof source.config.provider === "string" ? source.config.provider : source.type;
    return provider.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return (
    <div className="space-y-6">
      <section className="border border-border bg-muted/30">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Company Brain</p>
            <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground">
              Turn source memory into an operating layer for agent teams.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Company Brain compiles decisions, incidents, runbooks, risks, and source signals into a reusable
              company memory contract that agents can execute against with governance.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <StatusTile label="Runtime" value={runtimeStatus} tone={controlPlaneReady ? "good" : "neutral"} />
            <StatusTile label="Workspace graph" value={`${controlStatus?.graph.nodes ?? 0} nodes`} detail={`${controlStatus?.graph.edges ?? 0} edges`} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active memory" value={companyStats?.activeMemoryCount ?? 0} detail="usable company context" />
        <Stat label="Decisions captured" value={companyStats?.decisions ?? 0} detail="contract evidence" />
        <Stat label="Connected sources" value={activeSources} detail={`${sources.length} configured`} />
        <Stat label="Pending approvals" value={controlStatus?.approvals.pending ?? pendingActions} detail="human gates" />
      </div>

      {(errorMessage || statusMessage) ? (
        <div
          className={`border px-4 py-3 text-sm ${
            companyBrainLocked
              ? "border-border bg-muted/40 text-muted-foreground"
              : errorMessage
                ? "border-destructive/35 bg-destructive/10 text-destructive"
                : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          {companyBrainLocked ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Company Brain export is available on Pro and Scale.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Runtime health, source setup, governance, and action control remain visible here. Upgrade unlocks compiled COMPANY_BRAIN.md exports.
                </p>
              </div>
              <span className="border border-border bg-background px-2 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Upgrade feature
              </span>
            </div>
          ) : errorMessage ?? statusMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Control Plane</p>
              <p className="mt-1 text-sm text-muted-foreground">Live backend health for graph, scheduler, queues, and compiled skills.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadCompanyBrainControlPlane()}
              className="border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground hover:border-primary"
            >
              Refresh
            </button>
          </div>
          <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
            <HealthCell label="Scheduler" value={controlStatus?.scheduler.enabled ? "Running" : "Idle"} detail={`Last tick: ${formatDate(controlStatus?.scheduler.lastTickAt)}`} />
            <HealthCell label="Queue" value={`${controlStatus?.queue.queued ?? 0} queued`} detail={`${controlStatus?.queue.failed ?? 0} failed`} />
            <HealthCell label="Source events" value={`${controlStatus?.sourceEvents.pending ?? 0} pending`} detail={`${controlStatus?.sourceEvents.deadLetter ?? 0} dead-letter`} />
            <HealthCell label="Skills compiler" value={`${controlStatus?.skills.count ?? 0} skills`} detail={`Updated: ${formatDate(controlStatus?.skills.updatedAt)}`} />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() => void runSreRecoverQueue()}
              className="border border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-foreground"
            >
              Recover Queue
            </button>
            <button
              type="button"
              onClick={() => void runSreBackfillDeadLetter()}
              className="border border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-foreground"
            >
              Backfill Dead Letter
            </button>
          </div>
        </div>

        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Company Contract</p>
            <p className="mt-1 text-sm text-muted-foreground">Exportable operating memory for coding agents, support agents, and platform teams.</p>
          </div>
          <div className="grid grid-cols-2 border-b border-border">
            <HealthCell label="Incidents" value={`${companyStats?.incidents ?? 0}`} detail="debug memory" />
            <HealthCell label="Runbooks" value={`${companyStats?.runbooks ?? 0}`} detail="repeatable ops" />
            <HealthCell label="Constraints" value={`${companyStats?.constraints ?? 0}`} detail="guardrails" />
            <HealthCell label="Open risks" value={`${companyStats?.openRisks ?? 0}`} detail="needs attention" />
          </div>
          <div className="flex flex-wrap gap-2 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                if (payload?.skillsMarkdown) {
                  downloadSkills();
                  return;
                }
                void compileAndDownloadSkills();
              }}
              disabled={compilingSkills}
              className="border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary disabled:cursor-not-allowed disabled:opacity-45"
            >
              {compilingSkills ? "Compiling..." : payload?.skillsMarkdown ? "Download COMPANY_BRAIN.md" : "Compile COMPANY_BRAIN.md"}
            </button>
            <span className="px-3 py-2 text-xs text-muted-foreground">
              {payload?.generatedAt ? `Generated ${formatDate(payload.generatedAt)}` : "Generate requires eligible workspace plan"}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Source Intake</p>
            <p className="mt-1 text-sm text-muted-foreground">Configure support, CRM, or database sources without manual API calls.</p>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as "support" | "crm" | "db")}
              className="border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="support">support</option>
            <option value="crm">crm</option>
            <option value="db">db</option>
          </select>
          <select
            value={sourceProvider}
            onChange={(event) => setSourceProvider(event.target.value)}
              className="border border-border bg-background px-3 py-2 text-sm"
          >
            {sourceType === "support" ? (
              <>
                <option value="zendesk">zendesk</option>
                <option value="freshdesk">freshdesk</option>
              </>
            ) : null}
            {sourceType === "crm" ? (
              <option value="hubspot">hubspot</option>
            ) : null}
            {sourceType === "db" ? (
              <>
                <option value="postgres">postgres</option>
                <option value="mysql">mysql</option>
              </>
            ) : null}
          </select>
            <label className="flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={sourceEnabled}
              onChange={(event) => setSourceEnabled(event.target.checked)}
            />
            Enabled
          </label>
          <input
            value={sourceApiUrl}
            onChange={(event) => setSourceApiUrl(event.target.value)}
            placeholder="https://api.yourtool.com/v1/events"
              className="border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={sourceApiKey}
            onChange={(event) => setSourceApiKey(event.target.value)}
            placeholder="apiKey (optional)"
              className="border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={sourceBearerToken}
            onChange={(event) => setSourceBearerToken(event.target.value)}
            placeholder="bearerToken (optional)"
              className="border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={sourceAuthHeader}
            onChange={(event) => setSourceAuthHeader(event.target.value)}
            placeholder="Authorization"
              className="border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          />
            <button
              type="button"
              onClick={() => void saveBusinessSource()}
              className="border border-primary bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground md:col-span-2"
            >
              Save Source
            </button>
        </div>
        </div>

        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Source Inventory</p>
            <p className="mt-1 text-sm text-muted-foreground">What the company brain can currently learn from.</p>
          </div>
          <div className="divide-y divide-border">
            {businessSources.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">No business sources configured yet.</div>
            ) : (
              businessSources.map((source) => (
                <div key={source.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_120px_160px] md:items-center">
                  <div>
                    <p className="font-medium text-foreground">{sourceLabel(source)}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {typeof source.config.apiUrl === "string" ? source.config.apiUrl : "No endpoint configured"}
                    </p>
                  </div>
                  <span className={`w-fit border px-2 py-1 text-xs font-semibold uppercase tracking-widest ${source.enabled ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"}`}>
                    {source.enabled ? "Enabled" : "Paused"}
                  </span>
                  <p className="text-xs text-muted-foreground md:text-right">{formatDate(source.updatedAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Governance Matrix</p>
            <p className="mt-1 text-sm text-muted-foreground">Decide which agent actions can execute and which need human approval.</p>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-1">
          {(["low", "medium", "high"] as const).map((risk) => (
              <div key={risk} className="border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest">{risk} risk</p>
                  <span className="text-xs text-muted-foreground">
                    {governance.riskPolicy[risk].autoExecute ? "Auto" : "Review"}
                  </span>
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={governance.riskPolicy[risk].autoExecute}
                  onChange={(event) =>
                    setGovernance((prev) => ({
                      ...prev,
                      riskPolicy: {
                        ...prev.riskPolicy,
                        [risk]: {
                          ...prev.riskPolicy[risk],
                          autoExecute: event.target.checked,
                        },
                      },
                    }))
                  }
                />
                Auto execute
              </label>
              <input
                value={governance.riskPolicy[risk].requiredApprovals.join(",")}
                onChange={(event) => {
                  const approvals = event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter((value): value is "owner" | "admin" | "operator" =>
                      value === "owner" || value === "admin" || value === "operator");
                  setGovernance((prev) => ({
                    ...prev,
                    riskPolicy: {
                      ...prev.riskPolicy,
                      [risk]: {
                        ...prev.riskPolicy[risk],
                        requiredApprovals: approvals.length ? approvals : prev.riskPolicy[risk].requiredApprovals,
                      },
                    },
                  }));
                }}
                  className="mt-3 w-full border border-border bg-background px-3 py-2 text-xs"
              />
            </div>
          ))}
        </div>
          <div className="border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => void saveGovernance()}
              className="border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary"
          >
            Save Governance Policy
          </button>
        </div>
      </div>

        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Agent Action Queue</p>
            <p className="mt-1 text-sm text-muted-foreground">Create, simulate, approve, and execute governed actions from one place.</p>
          </div>
          <div className="grid gap-3 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={newActionName}
                onChange={(event) => setNewActionName(event.target.value)}
                className="border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                value={roleValue}
                onChange={(event) => setRoleValue(event.target.value as "owner" | "admin" | "operator" | "viewer")}
                className="border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="owner">owner</option>
                <option value="admin">admin</option>
                <option value="operator">operator</option>
                <option value="viewer">viewer</option>
              </select>
            </div>
            <textarea
              value={newActionPayload}
              onChange={(event) => setNewActionPayload(event.target.value)}
              className="min-h-24 border border-border bg-background px-3 py-2 font-mono text-xs"
            />
            <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void simulateCurrentAction()}
              disabled={isSimulating}
                className="border border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground disabled:opacity-50"
            >
              {isSimulating ? "Simulating..." : "Simulate Action"}
            </button>
            <button
              type="button"
              onClick={() => void requestAction()}
                className="border border-primary bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground"
            >
              Create Action Request
            </button>
              <button
                type="button"
                onClick={() => void assignRole()}
                className="border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                Assign {roleValue} Role
              </button>
            </div>
            <input
              value={roleTargetUserId}
              onChange={(event) => setRoleTargetUserId(event.target.value)}
              placeholder="target user id for role assignment"
              className="border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={roleScopes}
              onChange={(event) => setRoleScopes(event.target.value)}
              placeholder="comma scopes"
              className="border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

        {simulation ? (
            <div className="border-t border-border bg-muted/20 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground">Simulation Result</p>
            <p className="mt-1 text-xs text-muted-foreground">
              risk={simulation.risk} · autoExecutable={simulation.autoExecutable ? "yes" : "no"} · complianceBlocked={simulation.complianceBlocked ? "yes" : "no"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              required approvals: {simulation.requiredApprovals.length ? simulation.requiredApprovals.join(",") : "none"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              constraints: {simulation.executionConstraints.join(" | ")}
            </p>
            {simulation.complianceBlockReason ? (
              <p className="mt-1 text-xs text-chart-2">{simulation.complianceBlockReason}</p>
            ) : null}
          </div>
        ) : null}

          <div className="border-t border-border">
          {actions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No action requests yet.</p>
          ) : (
            actions.slice(0, 12).map((action) => (
                <div key={action.id} className="grid gap-3 border-b border-border px-4 py-3 md:grid-cols-[1fr_120px_210px] md:items-center">
                  <div>
                    <p className="font-medium text-foreground">{action.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {action.risk} risk · approvals {
                        action.requiredApprovals.length === 0
                          ? "not required"
                          : `${new Set((action.approvals ?? []).filter((entry) => entry.decision === "approve").map((entry) => entry.reviewerRole)).size}/${action.requiredApprovals.length}`
                      }
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {action.executionConstraints.length ? action.executionConstraints.join(" | ") : "No runtime constraints"}
                    </p>
                  </div>
                  <span className={`w-fit border px-2 py-1 text-xs font-semibold uppercase tracking-widest ${action.status === "approved" || action.status === "executed" ? "border-primary/30 bg-primary/10 text-primary" : action.status === "failed" || action.status === "rejected" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-muted text-muted-foreground"}`}>
                    {action.status}
                  </span>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => void reviewAction(action.id, "approve")}
                      className="border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void reviewAction(action.id, "reject")}
                      className="border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void executeAction(action.id)}
                      className="border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
                  >
                    Execute
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Generated Skills File</p>
            <p className="mt-1 text-sm text-muted-foreground">A portable COMPANY_BRAIN.md contract for agents and teams.</p>
          </div>
        <textarea
          value={payload?.skillsMarkdown ?? ""}
          readOnly
          placeholder="Generate to view Company Brain skills..."
            className="min-h-96 w-full border-0 bg-muted/20 px-4 py-3 font-mono text-xs text-foreground outline-none"
        />
      </div>

        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recent Exports</p>
            <p className="mt-1 text-sm text-muted-foreground">Audit trail for generated company memory contracts.</p>
          </div>
          <div className="divide-y divide-border">
          {exportsHistory.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No previous exports yet.</p>
          ) : (
            exportsHistory.slice(0, 8).map((entry) => (
                <div key={entry.id} className="px-4 py-3">
                <div>
                    <p className="text-sm font-medium">{formatDate(entry.generatedAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.workspace} · {entry.stats.activeMemoryCount} memories · {entry.stats.decisions} decisions
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </section>
    </div>
  );
}

function Stat({ label, value, suffix, detail }: { label: string; value: number; suffix?: string; detail?: string }) {
  return (
    <div className="border border-border bg-card px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums">
        {value}
        {suffix ? <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span> : null}
      </p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function StatusTile({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail?: string; tone?: "good" | "warn" | "neutral" }) {
  return (
    <div className="border border-border bg-background px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className={`h-2 w-2 rounded-full ${tone === "good" ? "bg-primary" : tone === "warn" ? "bg-destructive" : "bg-muted-foreground"}`} />
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function HealthCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-b border-border px-4 py-4 md:border-r xl:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
