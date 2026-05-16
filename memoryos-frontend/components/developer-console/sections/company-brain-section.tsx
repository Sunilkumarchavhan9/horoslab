"use client";

import { useEffect, useState } from "react";
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

export function CompanyBrainSection() {
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sreRunbook, setSreRunbook] = useState<SreRunbook | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadSkills();
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

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Company Brain</h1>
        <p className="mt-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
          Generate executable company skills from live memory, incidents, decisions, and runbooks.
        </p>
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Thesis</p>
        <p className="mt-2 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
          Models are ready. Company knowledge is the bottleneck. MemoryOS converts scattered operational knowledge
          into a living map of decisions, constraints, incidents, and policies, then compiles that map into executable skills.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-[8px] border border-border bg-muted/30 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">What It Is</p>
            <p className="mt-1 text-[12px] text-foreground">Evidence-backed skills + policy-gated execution + auditability.</p>
          </div>
          <div className="rounded-[8px] border border-border bg-muted/30 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">What It Is Not</p>
            <p className="mt-1 text-[12px] text-foreground">Not a static document bot or simple keyword search.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-muted-foreground">
            Status: {loading ? "Generating..." : errorMessage ? "Error" : "Live"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void Promise.all([loadSkills(), loadCompanyBrainControlPlane()])}
              className="rounded-[7px] border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={downloadSkills}
              disabled={!payload?.skillsMarkdown}
              className="rounded-[7px] border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary disabled:opacity-50"
            >
              Export COMPANY_BRAIN.md
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 rounded-[8px] border border-destructive/35 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {errorMessage}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="mt-3 rounded-[8px] border border-primary/30 bg-primary/10 px-3 py-2 text-[12px] text-primary">
            {statusMessage}
          </p>
        ) : null}

        {payload ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-7">
            <Stat label="Active Memory" value={payload.stats.activeMemoryCount} />
            <Stat label="Timeline" value={payload.stats.totalTimelineEvents} />
            <Stat label="Decisions" value={payload.stats.decisions} />
            <Stat label="Constraints" value={payload.stats.constraints} />
            <Stat label="Incidents" value={payload.stats.incidents} />
            <Stat label="Runbooks" value={payload.stats.runbooks} />
            <Stat label="Open Risks" value={payload.stats.openRisks} />
          </div>
        ) : null}
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Control Plane Health</p>
        {controlStatus ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Scheduler" value={controlStatus.scheduler.enabled ? 1 : 0} suffix={controlStatus.scheduler.enabled ? "on" : "off"} />
            <Stat label="Queue (queued)" value={controlStatus.queue.queued} />
            <Stat label="Queue (failed)" value={controlStatus.queue.failed} />
            <Stat label="Dead Letter" value={controlStatus.sourceEvents.deadLetter} />
            <Stat label="Graph Nodes" value={controlStatus.graph.nodes} />
            <Stat label="Graph Edges" value={controlStatus.graph.edges} />
            <Stat label="Skills" value={controlStatus.skills.count} />
            <Stat label="Pending Approvals" value={controlStatus.approvals.pending} />
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-muted-foreground">Loading control plane status...</p>
        )}
        <div className="mt-2 text-[11px] text-muted-foreground">
          <p>last tick: {controlStatus?.scheduler.lastTickAt ? new Date(controlStatus.scheduler.lastTickAt).toLocaleString() : "n/a"}</p>
          <p>last error: {controlStatus?.scheduler.lastError ?? "none"}</p>
          <p>graph updated: {controlStatus?.graph.updatedAt ? new Date(controlStatus.graph.updatedAt).toLocaleString() : "n/a"}</p>
          <p>skills updated: {controlStatus?.skills.updatedAt ? new Date(controlStatus.skills.updatedAt).toLocaleString() : "n/a"}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runSreRecoverQueue()}
            className="rounded-[7px] border border-border bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground"
          >
            SRE Recover Queue
          </button>
          <button
            type="button"
            onClick={() => void runSreBackfillDeadLetter()}
            className="rounded-[7px] border border-border bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground"
          >
            SRE Backfill Dead Letter
          </button>
        </div>
        {sreRunbook ? (
          <div className="mt-3 rounded-[8px] border border-border bg-muted/30 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">runbook backend={sreRunbook.queueBackendMode}</p>
            {sreRunbook.warnings.length > 0 ? (
              <p className="mt-1 text-[11px] text-amber-500">warnings: {sreRunbook.warnings.join(" | ")}</p>
            ) : (
              <p className="mt-1 text-[11px] text-emerald-500">warnings: none</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Business Source Config (No Manual API Calls)</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Configure `support`, `crm`, or `db` pull source directly from console.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as "support" | "crm" | "db")}
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px]"
          >
            <option value="support">support</option>
            <option value="crm">crm</option>
            <option value="db">db</option>
          </select>
          <select
            value={sourceProvider}
            onChange={(event) => setSourceProvider(event.target.value)}
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px]"
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
          <label className="flex items-center gap-2 rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px]">
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
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px] md:col-span-2"
          />
          <input
            value={sourceApiKey}
            onChange={(event) => setSourceApiKey(event.target.value)}
            placeholder="apiKey (optional)"
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px]"
          />
          <input
            value={sourceBearerToken}
            onChange={(event) => setSourceBearerToken(event.target.value)}
            placeholder="bearerToken (optional)"
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px]"
          />
          <input
            value={sourceAuthHeader}
            onChange={(event) => setSourceAuthHeader(event.target.value)}
            placeholder="Authorization"
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px] md:col-span-2"
          />
        </div>
        <button
          type="button"
          onClick={() => void saveBusinessSource()}
          className="mt-3 rounded-[7px] border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary"
        >
          Save Business Source
        </button>

        <div className="mt-3 space-y-2">
          {sources.filter((source) => source.type === "support" || source.type === "crm" || source.type === "db").length === 0 ? (
            <p className="text-[12px] text-muted-foreground">No business sources configured yet.</p>
          ) : (
            sources
              .filter((source) => source.type === "support" || source.type === "crm" || source.type === "db")
              .map((source) => (
                <div key={source.id} className="rounded-[8px] border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[12px] font-medium">
                    {source.type} · {source.enabled ? "enabled" : "disabled"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    apiUrl={typeof source.config.apiUrl === "string" ? source.config.apiUrl : "not set"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    provider={typeof source.config.provider === "string" ? source.config.provider : "generic"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    updated={new Date(source.updatedAt).toLocaleString()}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Governance Policy Matrix</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(["low", "medium", "high"] as const).map((risk) => (
            <div key={risk} className="rounded-[8px] border border-border bg-muted/30 px-3 py-3">
              <p className="text-[12px] font-semibold uppercase">{risk}</p>
              <label className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
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
                className="mt-2 w-full rounded-[7px] border border-border bg-background px-2 py-1 text-[11px]"
              />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void saveGovernance()}
            className="rounded-[7px] border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary"
          >
            Save Governance Policy
          </button>
        </div>
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Role Assignment</p>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <input
            value={roleTargetUserId}
            onChange={(event) => setRoleTargetUserId(event.target.value)}
            placeholder="target user id"
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px]"
          />
          <select
            value={roleValue}
            onChange={(event) => setRoleValue(event.target.value as "owner" | "admin" | "operator" | "viewer")}
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px]"
          >
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="operator">operator</option>
            <option value="viewer">viewer</option>
          </select>
          <input
            value={roleScopes}
            onChange={(event) => setRoleScopes(event.target.value)}
            placeholder="comma scopes"
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px] md:col-span-2"
          />
        </div>
        <button
          type="button"
          onClick={() => void assignRole()}
          className="mt-2 rounded-[7px] border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary"
        >
          Assign Role
        </button>
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Action Runner</p>
        <div className="mt-2 grid gap-2">
          <input
            value={newActionName}
            onChange={(event) => setNewActionName(event.target.value)}
            className="rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px]"
          />
          <textarea
            value={newActionPayload}
            onChange={(event) => setNewActionPayload(event.target.value)}
            className="min-h-[90px] rounded-[7px] border border-border bg-background px-2 py-1.5 text-[11px] font-mono"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void simulateCurrentAction()}
              disabled={isSimulating}
              className="w-fit rounded-[7px] border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground disabled:opacity-50"
            >
              {isSimulating ? "Simulating..." : "Simulate Action"}
            </button>
            <button
              type="button"
              onClick={() => void requestAction()}
              className="w-fit rounded-[7px] border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary"
            >
              Create Action Request
            </button>
          </div>
        </div>

        {simulation ? (
          <div className="mt-3 rounded-[8px] border border-border bg-muted/30 px-3 py-2">
            <p className="text-[12px] font-medium">Simulation Result</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              risk={simulation.risk} · autoExecutable={simulation.autoExecutable ? "yes" : "no"} · complianceBlocked={simulation.complianceBlocked ? "yes" : "no"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              required approvals: {simulation.requiredApprovals.length ? simulation.requiredApprovals.join(",") : "none"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              constraints: {simulation.executionConstraints.join(" | ")}
            </p>
            {simulation.complianceBlockReason ? (
              <p className="mt-1 text-[11px] text-amber-500">{simulation.complianceBlockReason}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 space-y-2">
          {actions.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">No action requests yet.</p>
          ) : (
            actions.slice(0, 12).map((action) => (
              <div key={action.id} className="rounded-[8px] border border-border bg-muted/30 px-3 py-2">
                <p className="text-[12px] font-medium">{action.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  risk={action.risk} · status={action.status} · required={action.requiredApprovals.join(",")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  approvals progress: {
                    action.requiredApprovals.length === 0
                      ? "none required"
                      : `${new Set((action.approvals ?? []).filter((entry) => entry.decision === "approve").map((entry) => entry.reviewerRole)).size}/${action.requiredApprovals.length}`
                  }
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  constraints: {action.executionConstraints.join(" | ")}
                </p>
                {action.executionResult ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    result: {action.executionResult.ok ? "ok" : "failed"} · {action.executionResult.detail}
                  </p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void reviewAction(action.id, "approve")}
                    className="rounded-[7px] border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] text-primary"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void reviewAction(action.id, "reject")}
                    className="rounded-[7px] border border-border bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void executeAction(action.id)}
                    className="rounded-[7px] border border-border bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    Execute
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Generated Skills File</p>
        <textarea
          value={payload?.skillsMarkdown ?? ""}
          readOnly
          placeholder="Generate to view Company Brain skills..."
          className="mt-2 min-h-[360px] w-full rounded-[8px] border border-border bg-muted/30 px-3 py-2 font-mono text-[12px] text-foreground outline-none"
        />
      </div>

      <div className="rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Recent Exports</p>
        <div className="mt-2 space-y-2">
          {exportsHistory.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">No previous exports yet.</p>
          ) : (
            exportsHistory.slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded-[8px] border border-border bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-[12px] font-medium">{new Date(entry.generatedAt).toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.workspace} · {entry.stats.activeMemoryCount} memories · {entry.stats.decisions} decisions
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-[8px] border border-border bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[18px] font-semibold">
        {value}
        {suffix ? <span className="ml-1 text-[11px] font-normal text-muted-foreground">{suffix}</span> : null}
      </p>
    </div>
  );
}
