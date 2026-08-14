"use client";

import { useEffect, useMemo, useState } from "react";
import { createEpochAuthorityPolicy, getEpochAuditTrail, listEpochMissions, listEpochRecoveryEscalations } from "@/lib/epoch-api";
import { LiveFilterDropdown } from "@/components/mission-control/ui/live-filter-dropdown";
import { useInspector } from "@/components/mission-control/universal-inspector";

type Row = Record<string, unknown>;
type View = "policies" | "budgets" | "approvals" | "recovery" | "ledger";

function text(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function Empty({ message }: { message: string }) {
  return <div className="p-8 text-sm text-muted-foreground">{message}</div>;
}

export function LiveGovernanceView({ workspaceId, view }: { workspaceId: string; view: View }) {
  const { openInspector } = useInspector();
  const [missions, setMissions] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Row[]>([]);
  const [recovery, setRecovery] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [policyName, setPolicyName] = useState("Safe GitHub Coding Policy");
  const [policyMissionId, setPolicyMissionId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [missionRows, auditRows, recoveryRows] = await Promise.all([
          listEpochMissions(workspaceId),
          getEpochAuditTrail(workspaceId),
          listEpochRecoveryEscalations(workspaceId),
        ]);
        if (cancelled) return;
        setMissions(missionRows as unknown as Row[]);
        setAudit([...auditRows.auditLogs, ...auditRows.runtimeEvents, ...auditRows.deadLetters]);
        setRecovery(recoveryRows);
        setError(null);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load governance data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [workspaceId, refreshVersion]);

  const createPolicy = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!policyMissionId || !policyName.trim()) {
      setCreateError("Select a mission and enter a policy name.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createEpochAuthorityPolicy(workspaceId, policyMissionId, {
        name: policyName.trim(),
        canExecute: false,
        needsApproval: true,
        blocked: false,
        permissions: ["repository.read", "repository.write", "branch.create", "pull_request.create", "checks.read", "tests.run", "evidence.write"],
        checks: ["branch_is_not_main", "pull_request_required", "tests_pass", "typecheck_pass", "lint_pass", "evidence_required", "secret_scan_pass", "human_approval_required", "no_destructive_commands"],
        approvals: ["human", "repository_owner"],
        budgets: { maxCents: 1000, maxAttempts: 3 },
      });
      setCreateOpen(false);
      setPolicyMissionId("");
      setRefreshVersion((value) => value + 1);
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : "Could not create policy.");
    } finally {
      setCreating(false);
    }
  };

  const policyRows = useMemo(() => missions.flatMap((mission) =>
    (Array.isArray(mission.authorityPolicies) ? mission.authorityPolicies as Row[] : []).map((policy) => ({
      ...policy,
      missionId: mission.id,
      missionTitle: mission.title ?? mission.id,
      institutionId: (mission as Row).institutionId ?? "-",
    } as Row))), [missions]);
  const budgetRows = useMemo(() => missions.flatMap((mission) => {
    const missionRow = mission as Row;
    const policies = Array.isArray(mission.authorityPolicies) ? mission.authorityPolicies as Row[] : [];
    return policies
      .filter((policy) => policy.budgets && Object.keys(policy.budgets).length > 0)
      .map((policy) => ({
        id: `${mission.id}:${policy.id}`,
        missionId: mission.id,
        title: mission.title ?? mission.id,
        budget: policy.budgets,
        state: mission.state,
        updatedAt: mission.updatedAt,
      } as Row))
      .concat(missionRow.budgetCents !== undefined ? [{
        id: `${mission.id}:mission-budget`,
        missionId: mission.id,
        title: mission.title ?? mission.id,
        budgetCents: missionRow.budgetCents,
        state: mission.state,
        updatedAt: mission.updatedAt,
      } as Row] : []);
  }), [missions]);
  const approvalRows = useMemo(() => policyRows.filter((policy) => policy.needsApproval === true), [policyRows]);
  const rows = useMemo(() => {
    if (view === "ledger") return audit;
    if (view === "recovery") return recovery;
    if (view === "policies") return policyRows;
    if (view === "budgets") return budgetRows;
    if (view === "approvals") return approvalRows;
    return missions;
  }, [approvalRows, audit, budgetRows, missions, policyRows, recovery, view]);

  const visible = useMemo(() => rows.filter((row) => {
    const haystack = JSON.stringify(row).toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (filter === "all") return true;
    const status = text(row.status ?? row.state).toLowerCase();
    return status === filter.toLowerCase();
  }), [filter, query, rows]);

  const title = view === "ledger" ? "Audit Explorer" : view[0].toUpperCase() + view.slice(1);
  const columns = view === "ledger"
    ? ["createdAt", "event", "missionId", "actorId", "correlationId", "result", "status"]
    : view === "recovery"
      ? ["createdAt", "missionId", "reason", "status", "resolution", "resolvedAt"]
      : view === "policies"
        ? ["id", "name", "status", "missionId", "permissions", "budgets", "updatedAt"]
        : view === "budgets"
          ? ["id", "title", "missionId", "budget", "budgetCents", "state", "updatedAt"]
          : view === "approvals"
            ? ["id", "name", "missionId", "needsApproval", "status", "updatedAt"]
            : ["id", "title", "state", "budgetCents", "currentStep", "updatedAt"];

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading live governance data...</div>;
  if (error) return <div className="p-8 text-sm text-red-500">{error}</div>;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 flex-col border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div><h1 className="text-xl font-bold text-foreground">{title}</h1><p className="mt-1 text-xs text-muted-foreground">Live workspace data. No demo records are shown.</p></div>
          <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{visible.length} records</span>{view === "policies" ? <button onClick={() => { setCreateError(null); setCreateOpen(true); }} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Create Policy</button> : null}</div>
        </div>
        <div className="relative z-30 flex items-center gap-2 overflow-visible border-t border-border bg-muted/20 px-6 py-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} className="h-8 w-64 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none" />
          <LiveFilterDropdown label="Status" value={filter === "all" ? "All" : filter} options={["All", ...Array.from(new Set(rows.map((row) => text(row.status ?? row.state))).values()).filter((value) => value !== "-")]} onChange={(value) => setFilter(value === "All" ? "all" : value)} />
        </div>
      </div>
      {createOpen && view === "policies" ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><form onSubmit={createPolicy} className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl"><h2 className="text-base font-semibold text-foreground">Create mission policy</h2><p className="mt-1 text-sm text-muted-foreground">This policy will govern one mission and use live backend authority checks.</p><label className="mt-5 block text-xs font-semibold text-foreground">Policy name<input value={policyName} onChange={(event) => setPolicyName(event.target.value)} className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" /></label><label className="mt-4 block text-xs font-semibold text-foreground">Mission<select value={policyMissionId} onChange={(event) => setPolicyMissionId(event.target.value)} className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="">Select a mission</option>{missions.map((mission) => <option key={text(mission.id)} value={text(mission.id)}>{text(mission.title ?? mission.id)}</option>)}</select></label><div className="mt-4 rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">Enforced checks: branch protection, pull request required, tests, typecheck, lint, secret scan, evidence, human approval, and no destructive commands.</div>{createError ? <p className="mt-3 text-xs text-red-500">{createError}</p> : null}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCreateOpen(false)} className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground">Cancel</button><button type="submit" disabled={creating || missions.length === 0} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{creating ? "Creating..." : "Create policy"}</button></div></form></div> : null}
      {visible.length === 0 ? <Empty message={rows.length === 0 ? "No live governance records exist in this workspace yet." : "No records match the current filters."} /> : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[900px] text-left text-sm"><thead className="sticky top-0 bg-card"><tr>{columns.map((column) => <th key={column} className="border-b border-border px-5 py-3 text-[11px] uppercase tracking-wide text-muted-foreground">{column}</th>)}</tr></thead>
            <tbody>{visible.map((row, index) => <tr key={text(row.id) === "-" ? `${index}` : text(row.id)} onClick={() => openInspector("governance", { ...row, context: view, name: `${title} ${text(row.id)}` })} className="cursor-pointer border-b border-border/50 hover:bg-muted/30">{columns.map((column) => <td key={column} className="max-w-[280px] truncate px-5 py-3 text-xs text-foreground" title={text(row[column])}>{text(row[column])}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
