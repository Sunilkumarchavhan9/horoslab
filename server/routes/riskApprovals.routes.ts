import { Prisma } from "@prisma/client";
import { Router, type Request } from "express";
import { emitMemoryRealtimeEvent } from "../../lib/memory/realtimeEventBus";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";

export const riskApprovalsRouter = Router();
export const approvalsRouter = Router();
export const policiesRouter = Router();
export const policyCenterRouter = Router();

type RiskEventType =
  | "risk_record.created"
  | "risk_record.updated"
  | "approval.approved"
  | "approval.reviewed"
  | "approval.rejected"
  | "approval.responded"
  | "policy.checked"
  | "policy.created"
  | "policy.updated"
  | "policy.activated"
  | "policy.deactivated"
  | "policy.archived"
  | "policy.duplicated"
  | "policy.version_created"
  | "policy.exception_added"
  | "blocked_action.created";

type CountShape = {
  violations?: number;
  exceptions?: number;
  auditLogs?: number;
  versions?: number;
  checks?: number;
  approvals?: number;
  blockedActions?: number;
};

type PolicyRecord = {
  id: string;
  workspaceId: string;
  name: string;
  scope: string;
  condition: Prisma.JsonValue;
  action: string;
  severity: string;
  status: string;
  description: string;
  enforcement: string;
  domain: string;
  ownerName: string;
  ownerRole: string;
  version: string;
  isTemplate: boolean;
  ruleLogic: string;
  triggerConditions: Prisma.JsonValue;
  allowedActions: Prisma.JsonValue;
  blockedActionNames: Prisma.JsonValue;
  requiredApprover: string | null;
  metadata: Prisma.JsonValue;
  proof: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  _count?: CountShape;
};

type RiskRecordRoute = {
  id: string;
  displayId: string;
  workspaceId: string;
  policyId: string | null;
  agentRunId: string | null;
  type: string;
  affectedArea: string;
  severity: string;
  requiredApprover: string | null;
  status: string;
  relatedRun: string | null;
  artifacts: Prisma.JsonValue;
  proof: Prisma.JsonValue;
  reasoning: string;
  potentialImpact: Prisma.JsonValue;
  mitigation: string;
  riskyFiles: Prisma.JsonValue;
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  policy?: { name: string; id: string; severity: string } | null;
  _count?: CountShape;
};

type ApprovalRoute = {
  id: string;
  workspaceId: string;
  riskRecordId: string | null;
  policyId: string | null;
  title: string;
  requester: string | null;
  approver: string | null;
  status: string;
  decision: string | null;
  response: Prisma.JsonValue | null;
  proof: Prisma.JsonValue;
  requestedAt: Date;
  reviewedAt: Date | null;
  riskRecord?: RiskRecordRoute | null;
};

function orgIdOrNull(orgId?: string): string | null {
  return typeof orgId === "string" && orgId.trim().length > 0 ? orgId.trim() : null;
}

function scopedWorkspaceWhere(req: Request) {
  return { userId: req.authUserId, orgId: orgIdOrNull(req.authOrgId) };
}

function stringParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function stringQuery(req: Request, name: string): string | undefined {
  const value = req.query[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function stringBody(req: Request, name: string, fallback = ""): string {
  const body = req.body as Record<string, unknown> | undefined;
  const value = body?.[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function rangeDays(range?: string): number {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return 7;
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sendRouteError(res: { status: (status: number) => { json: (body: unknown) => void } }, error: unknown): void {
  const message = error instanceof Error ? error.message : "internal_error";
  res.status(message.endsWith("_not_found") ? 404 : 500).json({ error: message });
}

function emitRiskEvent(req: Request, eventType: RiskEventType, payload: Record<string, unknown>): void {
  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind: eventType.startsWith("approval.") || eventType === "policy.checked" ? "governance_review_queued" : "request_logged",
    source: "company-brain",
    subject: {
      type: "risk_approval",
      id: String(payload.riskRecordId ?? payload.approvalId ?? payload.policyId ?? ""),
      label: eventType,
    },
    payload: {
      eventType,
      ...payload,
      proofLoop: "Agent Run -> RiskRecord -> Policy -> Approval -> BlockedAction -> Outcome",
      at: new Date().toISOString(),
    },
  });
}

function bodyRecord(req: Request): Record<string, unknown> {
  return asRecord(req.body);
}

async function resolveWorkspaceId(req: Request): Promise<string> {
  const provided = stringBody(req, "workspaceId");
  if (provided) {
    const workspace = await prisma.workspace.findFirst({ where: { id: provided, ...scopedWorkspaceWhere(req) } });
    if (!workspace) throw new Error("workspace_not_found");
    return workspace.id;
  }
  const existing = await prisma.workspace.findFirst({ where: scopedWorkspaceWhere(req), orderBy: { createdAt: "desc" } });
  if (existing) return existing.id;
  const created = await prisma.workspace.create({
    data: { ...scopedWorkspaceWhere(req), name: "MemoryOS Workspace", ownerId: req.authUserId },
  });
  return created.id;
}

async function workspaceIds(req: Request): Promise<string[]> {
  const rows = await prisma.workspace.findMany({ where: scopedWorkspaceWhere(req), select: { id: true } });
  if (rows.length > 0) return rows.map((row) => row.id);
  return [await resolveWorkspaceId(req)];
}

function relativeTime(date: Date): string {
  const hours = Math.max(1, Math.round((Date.now() - date.getTime()) / 36e5));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function displayId(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "-");
  return `RR-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function compactList(value: unknown): string[] {
  return toArray(value).map((item) => String(item)).filter(Boolean);
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "PO";
}

function policyRow(policy: PolicyRecord) {
  const metadata = asRecord(policy.metadata);
  return {
    id: policy.id,
    name: policy.name,
    desc: policy.description,
    description: policy.description,
    scope: policy.scope,
    severity: severityTitle(policy.severity),
    enforcement: policy.enforcement,
    action: policy.action,
    condition: policy.condition,
    domain: policy.domain,
    status: policy.status,
    ownerInitials: initials(policy.ownerName),
    ownerName: policy.ownerName,
    ownerRole: policy.ownerRole,
    ownerColor: String(metadata.ownerColor ?? "bg-purple-100 text-purple-700"),
    version: policy.version,
    isTemplate: policy.isTemplate,
    ruleLogic: policy.ruleLogic,
    triggerConditions: compactList(policy.triggerConditions),
    allowedActions: compactList(policy.allowedActions),
    blockedActionNames: compactList(policy.blockedActionNames),
    requiredApprover: policy.requiredApprover,
    proof: policy.proof,
    metadata,
    lastUpdated: policy.updatedAt.toISOString(),
    lastUpdatedDisplay: policy.updatedAt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
    violationCount: policy._count?.violations ?? 0,
    exceptionCount: policy._count?.exceptions ?? 0,
    auditLogCount: policy._count?.auditLogs ?? 0,
    versionCount: policy._count?.versions ?? 0,
    checkCount: policy._count?.checks ?? 0,
  };
}

function templatePolicyRow(template: {
  name: string;
  description: string;
  scope: string;
  severity: string;
  enforcement: string;
  action: string;
  domain: string;
  ownerName: string;
  ownerRole: string;
  version: string;
  ruleLogic: string;
  triggerConditions: readonly string[];
  allowedActions: readonly string[];
  blockedActionNames: readonly string[];
}, index: number) {
  const now = new Date();
  return {
    id: `template-${index + 1}`,
    name: template.name,
    desc: template.description,
    description: template.description,
    scope: template.scope,
    severity: severityTitle(template.severity),
    enforcement: template.enforcement,
    action: template.action,
    condition: { rule: template.ruleLogic, triggers: template.triggerConditions },
    domain: template.domain,
    status: "template",
    ownerInitials: initials(template.ownerName),
    ownerName: template.ownerName,
    ownerRole: template.ownerRole,
    ownerColor: "bg-purple-100 text-purple-700",
    version: template.version,
    isTemplate: true,
    ruleLogic: template.ruleLogic,
    triggerConditions: [...template.triggerConditions],
    allowedActions: [...template.allowedActions],
    blockedActionNames: [...template.blockedActionNames],
    requiredApprover: template.ownerName,
    proof: { source: "first_launch_policy_template" },
    metadata: {},
    lastUpdated: now.toISOString(),
    lastUpdatedDisplay: now.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
    violationCount: 0,
    exceptionCount: 0,
    auditLogCount: 0,
    versionCount: 0,
    checkCount: 0,
  };
}

function policySnapshot(policy: PolicyRecord): Prisma.InputJsonValue {
  return inputJson(policyRow(policy));
}

function policyInput(req: Request, workspaceId: string, existing?: PolicyRecord): Prisma.PolicyUncheckedCreateInput | Prisma.PolicyUncheckedUpdateInput {
  const body = bodyRecord(req);
  const condition = body.condition ?? {
    action: stringBody(req, "action", existing?.action ?? "Require approval"),
    target: stringBody(req, "scope", existing?.scope ?? "All Workspaces"),
  };
  return {
    workspaceId,
    name: stringBody(req, "name", existing?.name ?? "New Policy"),
    scope: stringBody(req, "scope", existing?.scope ?? "All Workspaces"),
    condition: inputJson(condition),
    action: stringBody(req, "action", existing?.action ?? stringBody(req, "enforcement", existing?.enforcement ?? "Enforce")),
    severity: stringBody(req, "severity", existing?.severity ?? "medium").toLowerCase(),
    status: stringBody(req, "status", existing?.status ?? "active").toLowerCase(),
    description: stringBody(req, "description", stringBody(req, "desc", existing?.description ?? "")),
    enforcement: stringBody(req, "enforcement", existing?.enforcement ?? "Enforce"),
    domain: stringBody(req, "domain", existing?.domain ?? "Security"),
    ownerName: stringBody(req, "ownerName", existing?.ownerName ?? "Policy Owner"),
    ownerRole: stringBody(req, "ownerRole", existing?.ownerRole ?? "Governance"),
    version: stringBody(req, "version", existing?.version ?? "1.0.0"),
    isTemplate: typeof body.isTemplate === "boolean" ? body.isTemplate : existing?.isTemplate ?? false,
    ruleLogic: stringBody(req, "ruleLogic", existing?.ruleLogic ?? ""),
    triggerConditions: inputJson(body.triggerConditions ?? existing?.triggerConditions ?? []),
    allowedActions: inputJson(body.allowedActions ?? existing?.allowedActions ?? []),
    blockedActionNames: inputJson(body.blockedActionNames ?? existing?.blockedActionNames ?? []),
    requiredApprover: stringBody(req, "requiredApprover", existing?.requiredApprover ?? ""),
    metadata: inputJson(body.metadata ?? existing?.metadata ?? {}),
    proof: inputJson(body.proof ?? existing?.proof ?? { source: "policy_center", updatedAt: new Date().toISOString() }),
  };
}

async function getPolicy(req: Request, id: string) {
  const policy = await prisma.policy.findFirst({
    where: { id, workspace: scopedWorkspaceWhere(req) },
    include: { _count: { select: { violations: true, exceptions: true, auditLogs: true, versions: true, checks: true } } },
  });
  if (!policy) throw new Error("policy_not_found");
  return policy;
}

async function writePolicyAudit(req: Request, policyId: string | null, action: string, summary: string, diff: Record<string, unknown> = {}) {
  const workspaceId = await resolveWorkspaceId(req);
  return prisma.policyAuditLog.create({
    data: {
      workspaceId,
      policyId,
      action,
      actor: req.authUserId,
      summary,
      diff: inputJson(diff),
      proof: inputJson({ actor: req.authUserId, action, at: new Date().toISOString() }),
    },
  });
}

const DEFAULT_POLICY_TEMPLATES = [
  {
    name: "Data Deletion Guardrail",
    description: "Prevent irreversible deletion or corruption of production or customer data.",
    scope: "All Workspaces",
    severity: "high",
    enforcement: "Block",
    action: "block",
    domain: "Data & Privacy",
    ownerName: "Michael Chen",
    ownerRole: "Security",
    version: "1.4.2",
    ruleLogic: 'IF action in ["delete", "drop", "truncate", "purge"] AND target contains production/customer THEN block',
    triggerConditions: ["Destructive Action", "Sensitive Data", "Production Environment"],
    allowedActions: ["Soft delete", "Archive", "Export (read-only)"],
    blockedActionNames: ["Hard delete", "Drop table", "Truncate", "Purge"],
  },
  {
    name: "Production Access Policy",
    description: "Restrict writes to production unless an approval exists.",
    scope: "Production",
    severity: "high",
    enforcement: "Block",
    action: "block",
    domain: "Operations",
    ownerName: "Sarah Johnson",
    ownerRole: "Ops",
    version: "2.1.0",
    ruleLogic: "IF environment is production AND action mutates state THEN require approval or block",
    triggerConditions: ["Production Environment", "Write Action"],
    allowedActions: ["Read-only inspect", "Dry run"],
    blockedActionNames: ["Deploy without approval", "Production write"],
  },
  {
    name: "Secret Exposure Policy",
    description: "Block secrets in prompts, outputs, logs, and package payloads.",
    scope: "All Workspaces",
    severity: "high",
    enforcement: "Block + Alert",
    action: "block",
    domain: "Security",
    ownerName: "Emily Martinez",
    ownerRole: "Security",
    version: "1.7.1",
    ruleLogic: "IF content contains secret-like material THEN redact, block, and alert",
    triggerConditions: ["Secret Pattern", "External Output"],
    allowedActions: ["Redacted summary"],
    blockedActionNames: ["Token disclosure", "Credential paste"],
  },
] as const;

async function ensureDefaultPolicies(workspaceId: string): Promise<void> {
  const count = await prisma.policy.count({ where: { workspaceId } });
  if (count > 0) return;
  for (const template of DEFAULT_POLICY_TEMPLATES) {
    const policy = await prisma.policy.create({
      data: {
        workspaceId,
        name: template.name,
        scope: template.scope,
        condition: inputJson({ rule: template.ruleLogic, triggers: template.triggerConditions }),
        action: template.action,
        severity: template.severity,
        status: "active",
        description: template.description,
        enforcement: template.enforcement,
        domain: template.domain,
        ownerName: template.ownerName,
        ownerRole: template.ownerRole,
        version: template.version,
        ruleLogic: template.ruleLogic,
        triggerConditions: inputJson(template.triggerConditions),
        allowedActions: inputJson(template.allowedActions),
        blockedActionNames: inputJson(template.blockedActionNames),
        requiredApprover: template.ownerName,
        proof: inputJson({ source: "first_launch_policy_seed", at: new Date().toISOString() }),
      },
    });
    await prisma.policyVersion.create({
      data: {
        workspaceId,
        policyId: policy.id,
        version: policy.version,
        snapshot: policySnapshot(policy),
        createdBy: "system",
      },
    });
  }
}

function recordRow(record: RiskRecordRoute) {
  return {
    id: record.id,
    displayId: record.displayId,
    type: record.type,
    area: record.affectedArea,
    severity: record.severity,
    approver: record.requiredApprover ?? "Policy owner",
    status: record.status,
    run: record.relatedRun ?? record.agentRunId ?? "No linked run",
    artifacts: toArray(record.artifacts).length,
    artifactsRaw: record.artifacts,
    proof: record.proof,
    reasoning: record.reasoning,
    potentialImpact: compactList(record.potentialImpact),
    mitigation: record.mitigation,
    riskyFiles: compactList(record.riskyFiles),
    policy: record.policy ?? null,
    approvalCount: record._count?.approvals ?? 0,
    blockedActionCount: record._count?.blockedActions ?? 0,
    detectedAt: record.detectedAt.toISOString(),
    updated: relativeTime(record.updatedAt),
  };
}

function approvalRow(approval: ApprovalRoute) {
  return {
    id: approval.id,
    title: approval.title,
    requester: approval.requester ?? "Unknown requester",
    approver: approval.approver ?? "Policy owner",
    status: approval.status,
    decision: approval.decision,
    response: approval.response,
    proof: approval.proof,
    requestedAt: approval.requestedAt.toISOString(),
    reviewedAt: approval.reviewedAt?.toISOString() ?? null,
    riskRecord: approval.riskRecord ? recordRow(approval.riskRecord) : null,
  };
}

function severityTitle(value: string): string {
  const text = value.toLowerCase();
  if (text === "high") return "High";
  if (text === "low") return "Low";
  return "Medium";
}

async function getRiskRecord(req: Request, id: string) {
  const record = await prisma.riskRecord.findFirst({
    where: { id, workspace: scopedWorkspaceWhere(req) },
    include: { policy: { select: { id: true, name: true, severity: true } }, _count: { select: { approvals: true, blockedActions: true } } },
  });
  if (!record) throw new Error("risk_record_not_found");
  return record;
}

async function getApproval(req: Request, id: string) {
  const approval = await prisma.approval.findFirst({
    where: { id, workspace: scopedWorkspaceWhere(req) },
    include: { riskRecord: true },
  });
  if (!approval) throw new Error("approval_not_found");
  return approval;
}

riskApprovalsRouter.get("/summary", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [riskRecords, pendingApprovals, blockedActions, sensitiveSystems, highRiskFiles] = await Promise.all([
      prisma.riskRecord.count({ where: { workspaceId: { in: ids } } }),
      prisma.approval.count({ where: { workspaceId: { in: ids }, status: "pending" } }),
      prisma.blockedAction.count({ where: { workspaceId: { in: ids }, status: "blocked" } }),
      prisma.sensitiveSystem.count({ where: { workspaceId: { in: ids }, status: "active" } }),
      prisma.riskRecord.findMany({ where: { workspaceId: { in: ids }, detectedAt: { gte: since } }, select: { riskyFiles: true } }),
    ]);
    const highRiskFileCount = new Set(highRiskFiles.flatMap((record) => compactList(record.riskyFiles))).size;
    res.json({
      cards: [
        { key: "records", label: "Risk Records", value: riskRecords, trendValue: "live", trendSuffix: "from Prisma", trendIcon: "up", trendColor: "text-emerald-500", sparklineData: [4, 5, 7, 6, 8, 9, 12, 10, 14, 15, 14, riskRecords] },
        { key: "pending", label: "Pending Approvals", value: pendingApprovals, trendValue: "queue", trendSuffix: "waiting", trendIcon: "up", trendColor: "text-emerald-500", sparklineData: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, pendingApprovals] },
        { key: "blocked", label: "Blocked Actions", value: blockedActions, trendValue: "guarded", trendSuffix: "by policy", trendIcon: "down", trendColor: "text-red-500", sparklineData: [15, 14, 12, 13, 11, 10, 8, 9, 7, 6, 5, blockedActions] },
        { key: "systems", label: "Sensitive Systems", value: sensitiveSystems, trendValue: "mapped", trendSuffix: "systems", trendIcon: "up", trendColor: "text-emerald-500", sparklineData: [3, 3, 4, 4, 3, 5, 4, 5, 6, 5, 6, sensitiveSystems] },
        { key: "files", label: "High-Risk Files", value: highRiskFileCount, trendValue: "tracked", trendSuffix: "files", trendIcon: "up", trendColor: "text-emerald-500", sparklineData: [5, 6, 8, 7, 9, 10, 11, 10, 12, 14, 13, highRiskFileCount] },
      ],
      totals: { riskRecords, pendingApprovals, blockedActions, sensitiveSystems, highRiskFiles: highRiskFileCount },
      proofLoop: "Agent Run -> RiskRecord -> Policy -> Approval -> BlockedAction -> Outcome",
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

riskApprovalsRouter.get("/records", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const tab = stringQuery(req, "tab");
    const status = stringQuery(req, "status");
    const where: Prisma.RiskRecordWhereInput = { workspaceId: { in: ids } };
    if (status) where.status = status;
    if (tab === "blocked") where.status = "blocked";
    if (tab === "risky-files") where.riskyFiles = { not: Prisma.JsonNull };
    const records = await prisma.riskRecord.findMany({
      where,
      include: { policy: { select: { id: true, name: true, severity: true } }, _count: { select: { approvals: true, blockedActions: true } } },
      orderBy: { detectedAt: "desc" },
      take: 200,
    });
    res.json({ records: records.map(recordRow) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

riskApprovalsRouter.get("/records/:id/proof", asyncHandler(async (req, res) => {
  try {
    const record = await getRiskRecord(req, stringParam(req, "id"));
    res.json({
      proof: {
        record: recordRow(record),
        artifacts: record.artifacts,
        proof: record.proof,
        policy: record.policy,
        lineage: "Agent Run -> RiskRecord -> Policy -> Approval -> BlockedAction -> Outcome",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

riskApprovalsRouter.get("/records/:id", asyncHandler(async (req, res) => {
  try {
    const record = await getRiskRecord(req, stringParam(req, "id"));
    res.json({ record: recordRow(record) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

riskApprovalsRouter.get("/sensitive-systems", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const systems = await prisma.sensitiveSystem.findMany({ where: { workspaceId: { in: ids } }, orderBy: [{ severity: "asc" }, { updatedAt: "desc" }] });
    res.json({ systems });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

riskApprovalsRouter.get("/risk-trend", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const days = rangeDays(stringQuery(req, "range"));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const records = await prisma.riskRecord.findMany({ where: { workspaceId: { in: ids }, detectedAt: { gte: since } }, select: { severity: true, detectedAt: true } });
    const buckets = new Map<string, { name: string; High: number; Medium: number; Low: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets.set(dayKey(date), { name: dayKey(date), High: 0, Medium: 0, Low: 0 });
    }
    records.forEach((record) => {
      const bucket = buckets.get(dayKey(record.detectedAt));
      if (!bucket) return;
      bucket[severityTitle(record.severity) as "High" | "Medium" | "Low"] += 1;
    });
    res.json({ points: [...buckets.values()] });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

riskApprovalsRouter.get("/approval-throughput", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const days = rangeDays(stringQuery(req, "range"));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const approvals = await prisma.approval.findMany({ where: { workspaceId: { in: ids }, requestedAt: { gte: since } }, select: { status: true, requestedAt: true } });
    const buckets = new Map<string, { name: string; Approved: number; Reviewed: number; Rejected: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets.set(dayKey(date), { name: dayKey(date), Approved: 0, Reviewed: 0, Rejected: 0 });
    }
    approvals.forEach((approval) => {
      const bucket = buckets.get(dayKey(approval.requestedAt));
      if (!bucket) return;
      if (approval.status === "approved") bucket.Approved += 1;
      else if (approval.status === "rejected") bucket.Rejected += 1;
      else bucket.Reviewed += 1;
    });
    res.json({ points: [...buckets.values()] });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

approvalsRouter.get("/", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const status = stringQuery(req, "status");
    const approvals = await prisma.approval.findMany({
      where: { workspaceId: { in: ids }, ...(status ? { status } : {}) },
      include: { riskRecord: true },
      orderBy: { requestedAt: "desc" },
      take: 200,
    });
    res.json({ approvals: approvals.map(approvalRow) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

approvalsRouter.get("/:id", asyncHandler(async (req, res) => {
  try {
    const approval = await getApproval(req, stringParam(req, "id"));
    res.json({ approval: approvalRow(approval) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

async function updateApproval(req: Request, status: string, decision: string) {
  const approval = await getApproval(req, stringParam(req, "id"));
  const updated = await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status,
      decision,
      reviewedAt: new Date(),
      approver: stringBody(req, "approver", req.authUserId),
      response: inputJson({ ...asRecord(approval.response), note: stringBody(req, "note", ""), respondedAt: new Date().toISOString() }),
    },
    include: { riskRecord: true },
  });
  if (approval.riskRecordId) {
    await prisma.riskRecord.update({ where: { id: approval.riskRecordId }, data: { status } });
  }
  return updated;
}

approvalsRouter.post("/:id/approve", asyncHandler(async (req, res) => {
  try {
    const approval = await updateApproval(req, "approved", "approved");
    emitRiskEvent(req, "approval.approved", { approvalId: approval.id, riskRecordId: approval.riskRecordId });
    res.json({ approval: approvalRow(approval) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

approvalsRouter.post("/:id/review", asyncHandler(async (req, res) => {
  try {
    const approval = await updateApproval(req, "review", "review");
    emitRiskEvent(req, "approval.reviewed", { approvalId: approval.id, riskRecordId: approval.riskRecordId });
    res.json({ approval: approvalRow(approval) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

approvalsRouter.post("/:id/reject", asyncHandler(async (req, res) => {
  try {
    const approval = await updateApproval(req, "rejected", "rejected");
    emitRiskEvent(req, "approval.rejected", { approvalId: approval.id, riskRecordId: approval.riskRecordId });
    res.json({ approval: approvalRow(approval) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

approvalsRouter.post("/:id/respond", asyncHandler(async (req, res) => {
  try {
    const status = stringBody(req, "status", "review");
    const approval = await updateApproval(req, status, stringBody(req, "decision", status));
    emitRiskEvent(req, "approval.responded", { approvalId: approval.id, riskRecordId: approval.riskRecordId, status });
    res.json({ approval: approvalRow(approval) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policyCenterRouter.get("/summary", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    if (ids[0]) await ensureDefaultPolicies(ids[0]);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [active, highRisk, blocked, autoApprovals, domains, policies] = await Promise.all([
      prisma.policy.count({ where: { workspaceId: { in: ids }, status: "active", isTemplate: false } }),
      prisma.policy.count({ where: { workspaceId: { in: ids }, severity: "high", isTemplate: false } }),
      prisma.policyViolation.count({ where: { workspaceId: { in: ids }, status: "blocked", occurredAt: { gte: since } } }),
      prisma.policyCheck.count({ where: { workspaceId: { in: ids }, allowed: true, checkedAt: { gte: since } } }),
      prisma.policy.groupBy({ by: ["domain"], where: { workspaceId: { in: ids }, isTemplate: false }, _count: { _all: true } }),
      prisma.policy.count({ where: { workspaceId: { in: ids }, isTemplate: false } }),
    ]);
    const coveredDomains = domains.filter((domain) => domain._count._all > 0).length;
    const coverage = policies > 0 ? Math.min(100, Math.round((coveredDomains / 6) * 100)) : 0;
    res.json({
      cards: [
        { key: "active", label: "Active Policies", value: active, trend: "live from Prisma", trendColor: "text-emerald-500", sparklineData: [1, 2, 3, active] },
        { key: "highRisk", label: "High-Risk Policies", value: highRisk, trend: "guarded", trendColor: "text-emerald-500", sparklineData: [0, 1, 2, highRisk] },
        { key: "blocked", label: "Violations Blocked", value: blocked, trend: "last 7 days", trendColor: "text-emerald-500", sparklineData: [0, 2, 4, blocked] },
        { key: "autoApprovals", label: "Auto-Approvals", value: autoApprovals, trend: "checks allowed", trendColor: "text-emerald-500", sparklineData: [0, 3, 8, autoApprovals] },
        { key: "coverage", label: "Policy Coverage", value: `${coverage}%`, trend: "domains mapped", trendColor: "text-emerald-500", sparklineData: [0, 30, 60, coverage] },
      ],
      totals: { active, highRisk, blocked, autoApprovals, coverage },
      proofLoop: "Policy -> PolicyCheck -> Violation/Exception -> AuditLog -> Version",
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policyCenterRouter.get("/violations-trend", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const days = rangeDays(stringQuery(req, "range"));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [violations, checks] = await Promise.all([
      prisma.policyViolation.findMany({ where: { workspaceId: { in: ids }, occurredAt: { gte: since } }, select: { occurredAt: true, status: true } }),
      prisma.policyCheck.findMany({ where: { workspaceId: { in: ids }, checkedAt: { gte: since }, allowed: true }, select: { checkedAt: true } }),
    ]);
    const buckets = new Map<string, { name: string; Blocked: number; Allowed: number; trend: number }>();
    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(Date.now() - index * 24 * 60 * 60 * 1000);
      const name = dayKey(date);
      buckets.set(name, { name, Blocked: 0, Allowed: 0, trend: 0 });
    }
    violations.forEach((violation) => {
      const bucket = buckets.get(dayKey(violation.occurredAt));
      if (bucket) bucket.Blocked += violation.status === "blocked" ? 1 : 0;
    });
    checks.forEach((check) => {
      const bucket = buckets.get(dayKey(check.checkedAt));
      if (bucket) bucket.Allowed += 1;
    });
    const points = [...buckets.values()].map((point) => ({ ...point, trend: point.Blocked + point.Allowed }));
    res.json({ points });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policyCenterRouter.get("/coverage-by-domain", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const rows = await prisma.policy.groupBy({ by: ["domain"], where: { workspaceId: { in: ids }, isTemplate: false }, _count: { _all: true } });
    const total = rows.reduce((sum, row) => sum + row._count._all, 0) || 1;
    const colors = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#f97316", "#94a3b8"];
    const points = rows.map((row, index) => ({
      name: row.domain,
      value: Math.round((row._count._all / total) * 100),
      count: row._count._all,
      color: colors[index % colors.length],
      percent: `${Math.round((row._count._all / total) * 100)}%`,
    }));
    res.json({ points, overallCoverage: points.length ? Math.min(100, Math.round((points.length / 6) * 100)) : 0 });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.get("/templates", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    if (ids[0]) await ensureDefaultPolicies(ids[0]);
    const templates = await prisma.policy.findMany({ where: { workspaceId: { in: ids }, isTemplate: true }, orderBy: { updatedAt: "desc" } });
    const defaults = DEFAULT_POLICY_TEMPLATES.map(templatePolicyRow);
    res.json({ templates: templates.length ? templates.map(policyRow) : defaults });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.get("/exceptions", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const exceptions = await prisma.policyException.findMany({ where: { workspaceId: { in: ids } }, include: { policy: true }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ exceptions: exceptions.map((exception) => ({ ...exception, createdAt: exception.createdAt.toISOString(), updatedAt: exception.updatedAt.toISOString(), expiresAt: exception.expiresAt?.toISOString() ?? null, policy: exception.policy ? policyRow(exception.policy) : null })) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.get("/", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    if (ids[0]) await ensureDefaultPolicies(ids[0]);
    const where: Prisma.PolicyWhereInput = { workspaceId: { in: ids } };
    const tab = stringQuery(req, "tab");
    const scope = stringQuery(req, "scope");
    const severity = stringQuery(req, "severity");
    const status = stringQuery(req, "status");
    if (tab === "templates") where.isTemplate = true;
    else where.isTemplate = false;
    if (scope) where.scope = { contains: scope, mode: "insensitive" };
    if (severity) where.severity = severity.toLowerCase();
    if (status) where.status = status.toLowerCase();
    const policies = await prisma.policy.findMany({
      where,
      include: { _count: { select: { violations: true, exceptions: true, auditLogs: true, versions: true, checks: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    res.json({ policies: policies.map(policyRow) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.post("/", asyncHandler(async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    const policy = await prisma.policy.create({ data: policyInput(req, workspaceId) as Prisma.PolicyUncheckedCreateInput });
    await prisma.policyVersion.create({ data: { workspaceId, policyId: policy.id, version: policy.version, snapshot: policySnapshot(policy), createdBy: req.authUserId } });
    await writePolicyAudit(req, policy.id, "created", `Created policy ${policy.name}.`, { after: policyRow(policy) });
    emitRiskEvent(req, "policy.created", { policyId: policy.id });
    res.status(201).json({ policy: policyRow(policy) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.post("/check", asyncHandler(async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    const body = req.body as Record<string, unknown>;
    const action = stringBody(req, "action", "Unknown action");
    const target = stringBody(req, "target", stringBody(req, "area", "Unknown target"));
    await ensureDefaultPolicies(workspaceId);
    const policies = await prisma.policy.findMany({ where: { workspaceId, status: "active" } });
    const matched = policies.find((policy) => {
      const condition = asRecord(policy.condition);
      return JSON.stringify(condition).toLowerCase().includes(action.toLowerCase()) ||
        policy.action.toLowerCase().includes(action.toLowerCase()) ||
        policy.scope.toLowerCase().includes(target.toLowerCase());
    }) ?? policies.find((policy) => policy.severity === "high") ?? null;
    const blocked = Boolean(matched && (matched.action.toLowerCase().includes("block") || matched.severity === "high"));
    const check = await prisma.policyCheck.create({
      data: {
        workspaceId,
        policyId: matched?.id,
        action,
        target,
        allowed: !blocked,
        blocked,
        result: inputJson({ matchedPolicyId: matched?.id, allowed: !blocked, blocked }),
        proof: inputJson({ source: "policy_check", checkedAt: new Date().toISOString(), body }),
      },
    });
    let riskRecord: RiskRecordRoute | null = null;
    if (matched || body.createRecord) {
      riskRecord = await prisma.riskRecord.create({
        data: {
          displayId: displayId(),
          workspaceId,
          policyId: matched?.id,
          type: action,
          affectedArea: target,
          severity: matched?.severity ?? "medium",
          requiredApprover: stringBody(req, "requiredApprover", "Policy owner"),
          status: blocked ? "blocked" : "pending",
          relatedRun: stringBody(req, "relatedRun", ""),
          artifacts: inputJson(body.artifacts ?? []),
          proof: inputJson({ policyCheck: true, matchedPolicyId: matched?.id, checkedAt: new Date().toISOString() }),
          reasoning: matched ? `Matched policy ${matched.name}.` : "No active policy matched directly.",
          potentialImpact: inputJson(body.potentialImpact ?? []),
          mitigation: matched ? "Follow policy action and approval requirements." : "No mitigation required.",
          riskyFiles: inputJson(body.riskyFiles ?? []),
        },
      });
      if (blocked) {
        await prisma.policyViolation.create({
          data: {
            workspaceId,
            policyId: matched?.id,
            action,
            target,
            severity: matched?.severity ?? "medium",
            status: "blocked",
            outcome: "blocked",
            proof: inputJson({ checkId: check.id, riskRecordId: riskRecord.id, matchedPolicyId: matched?.id }),
          },
        });
        await prisma.blockedAction.create({
          data: {
            workspaceId,
            riskRecordId: riskRecord.id,
            policyId: matched?.id,
            action,
            target,
            severity: matched?.severity ?? "medium",
            reason: matched ? `Blocked by ${matched.name}` : "Blocked by policy check.",
            proof: inputJson({ riskRecordId: riskRecord.id, matchedPolicyId: matched?.id }),
          },
        });
      }
    }
    await writePolicyAudit(req, matched?.id ?? null, "checked", matched ? `Checked ${action} against ${matched.name}.` : `Checked ${action}; no policy matched.`, { checkId: check.id, blocked });
    emitRiskEvent(req, "policy.checked", { policyId: matched?.id, riskRecordId: riskRecord?.id, blocked });
    res.json({ allowed: !blocked, blocked, matchedPolicy: matched ? policyRow(matched) : null, riskRecord: riskRecord ? recordRow(riskRecord) : null, check });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.get("/:id", asyncHandler(async (req, res) => {
  try {
    const policy = await getPolicy(req, stringParam(req, "id"));
    res.json({ policy: policyRow(policy) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.patch("/:id", asyncHandler(async (req, res) => {
  try {
    const existing = await getPolicy(req, stringParam(req, "id"));
    const policy = await prisma.policy.update({ where: { id: existing.id }, data: policyInput(req, existing.workspaceId, existing) as Prisma.PolicyUncheckedUpdateInput });
    await writePolicyAudit(req, policy.id, "updated", `Updated policy ${policy.name}.`, { before: policyRow(existing), after: policyRow(policy) });
    emitRiskEvent(req, "policy.updated", { policyId: policy.id });
    res.json({ policy: policyRow(policy) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.get("/:id/audit-log", asyncHandler(async (req, res) => {
  try {
    const policy = await getPolicy(req, stringParam(req, "id"));
    const logs = await prisma.policyAuditLog.findMany({ where: { policyId: policy.id }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ auditLog: logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() })) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.get("/:id/versions", asyncHandler(async (req, res) => {
  try {
    const policy = await getPolicy(req, stringParam(req, "id"));
    const versions = await prisma.policyVersion.findMany({ where: { policyId: policy.id }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ versions: versions.map((version) => ({ ...version, createdAt: version.createdAt.toISOString() })) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.post("/:id/activate", asyncHandler(async (req, res) => {
  try {
    const existing = await getPolicy(req, stringParam(req, "id"));
    const policy = await prisma.policy.update({ where: { id: existing.id }, data: { status: "active" } });
    await writePolicyAudit(req, policy.id, "activated", `Activated policy ${policy.name}.`);
    emitRiskEvent(req, "policy.activated", { policyId: policy.id });
    res.json({ policy: policyRow(policy) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.post("/:id/deactivate", asyncHandler(async (req, res) => {
  try {
    const existing = await getPolicy(req, stringParam(req, "id"));
    const policy = await prisma.policy.update({ where: { id: existing.id }, data: { status: "inactive" } });
    await writePolicyAudit(req, policy.id, "deactivated", `Deactivated policy ${policy.name}.`);
    emitRiskEvent(req, "policy.deactivated", { policyId: policy.id });
    res.json({ policy: policyRow(policy) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.post("/:id/archive", asyncHandler(async (req, res) => {
  try {
    const existing = await getPolicy(req, stringParam(req, "id"));
    const policy = await prisma.policy.update({ where: { id: existing.id }, data: { status: "archived" } });
    await writePolicyAudit(req, policy.id, "archived", `Archived policy ${policy.name}.`);
    emitRiskEvent(req, "policy.archived", { policyId: policy.id });
    res.json({ policy: policyRow(policy) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.post("/:id/duplicate", asyncHandler(async (req, res) => {
  try {
    const existing = await getPolicy(req, stringParam(req, "id"));
    const policy = await prisma.policy.create({
      data: {
        workspaceId: existing.workspaceId,
        name: `${existing.name} Copy`,
        scope: existing.scope,
        condition: inputJson(existing.condition),
        action: existing.action,
        severity: existing.severity,
        status: "inactive",
        description: existing.description,
        enforcement: existing.enforcement,
        domain: existing.domain,
        ownerName: existing.ownerName,
        ownerRole: existing.ownerRole,
        version: "1.0.0",
        ruleLogic: existing.ruleLogic,
        triggerConditions: inputJson(existing.triggerConditions),
        allowedActions: inputJson(existing.allowedActions),
        blockedActionNames: inputJson(existing.blockedActionNames),
        requiredApprover: existing.requiredApprover,
        metadata: inputJson(existing.metadata),
        proof: inputJson({ duplicatedFrom: existing.id, at: new Date().toISOString() }),
      },
    });
    await writePolicyAudit(req, policy.id, "duplicated", `Duplicated policy from ${existing.name}.`, { sourcePolicyId: existing.id });
    emitRiskEvent(req, "policy.duplicated", { policyId: policy.id, sourcePolicyId: existing.id });
    res.status(201).json({ policy: policyRow(policy) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.post("/:id/create-version", asyncHandler(async (req, res) => {
  try {
    const policy = await getPolicy(req, stringParam(req, "id"));
    const versionLabel = stringBody(req, "version", policy.version);
    const version = await prisma.policyVersion.create({ data: { workspaceId: policy.workspaceId, policyId: policy.id, version: versionLabel, snapshot: policySnapshot(policy), createdBy: req.authUserId } });
    await writePolicyAudit(req, policy.id, "version_created", `Created policy version ${versionLabel}.`, { versionId: version.id });
    emitRiskEvent(req, "policy.version_created", { policyId: policy.id, versionId: version.id });
    res.status(201).json({ version: { ...version, createdAt: version.createdAt.toISOString() } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

policiesRouter.post("/:id/add-exception", asyncHandler(async (req, res) => {
  try {
    const policy = await getPolicy(req, stringParam(req, "id"));
    const body = bodyRecord(req);
    const exception = await prisma.policyException.create({
      data: {
        workspaceId: policy.workspaceId,
        policyId: policy.id,
        reason: stringBody(req, "reason", "Approved policy exception"),
        requester: stringBody(req, "requester", req.authUserId),
        approver: stringBody(req, "approver", policy.requiredApprover ?? policy.ownerName),
        status: stringBody(req, "status", "active"),
        expiresAt: typeof body.expiresAt === "string" ? new Date(body.expiresAt) : null,
        proof: inputJson({ source: "policy_center", policyId: policy.id, at: new Date().toISOString() }),
      },
    });
    await writePolicyAudit(req, policy.id, "exception_added", `Added exception to ${policy.name}.`, { exceptionId: exception.id });
    emitRiskEvent(req, "policy.exception_added", { policyId: policy.id, exceptionId: exception.id });
    res.status(201).json({ exception: { ...exception, createdAt: exception.createdAt.toISOString(), updatedAt: exception.updatedAt.toISOString(), expiresAt: exception.expiresAt?.toISOString() ?? null } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));
