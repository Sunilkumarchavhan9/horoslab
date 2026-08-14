import { Prisma } from "@prisma/client";
import { prisma } from "../../storage/prismaClient";
import { appendEpochEvidence, createEpochMission } from "../epochStore";
import { emitEpochRuntimeEvent } from "../epochEvents";
import { governEpochBudget } from "../enterpriseControls";
import { AutomationV1Schema, type AutomationV1 } from "./contracts";

export type AutomationScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
};

export type AutomationActionInput = {
  environment: "software" | "cloud" | "simulation" | "edge" | "sandbox";
  name: string;
  parameters?: Record<string, unknown>;
};

export type CreateAutomationInput = {
  name: string;
  trigger: { type: string; filter?: Record<string, unknown> };
  level: "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A6";
  status?: "draft" | "active" | "paused" | "disabled";
  policyId: string;
  institutionId?: string;
  verificationRequired?: boolean;
  budgetCents?: number;
  actions: AutomationActionInput[];
};

export class AutomationBoundaryError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "AutomationBoundaryError";
  }
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function assertScope(scope: AutomationScope, workspace: { id: string } | null): void {
  if (!workspace) throw new AutomationBoundaryError("WORKSPACE_NOT_FOUND", "Workspace is outside the authenticated boundary.");
}

async function scopedWorkspace(scope: AutomationScope) {
  const workspace = await prisma.workspace.findFirst({
    where: { id: scope.workspaceId, userId: scope.userId, ...(scope.orgId ? { OR: [{ orgId: scope.orgId }, { orgId: null }] } : {}) },
    select: { id: true },
  });
  assertScope(scope, workspace);
  return workspace;
}

async function activePolicy(scope: AutomationScope, policyId: string) {
  await scopedWorkspace(scope);
  const policy = await prisma.epochAuthorityPolicy.findFirst({ where: { id: policyId, workspaceId: scope.workspaceId, status: "active" } });
  if (!policy) throw new AutomationBoundaryError("POLICY_NOT_FOUND", "An active policy in this workspace is required.");
  return policy;
}

function toContract(row: any): AutomationV1 {
  const now = new Date(row.updatedAt).toISOString();
  return AutomationV1Schema.parse({
    contractVersion: "epoch.runtime.v13",
    id: row.id,
    workspaceId: row.workspaceId,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: now,
    correlation: { correlationId: `automation:${row.id}`, traceId: `automation:${row.id}` },
    name: row.name,
    trigger: object(row.trigger),
    level: row.level,
    status: row.status,
    policyId: row.policyId,
    actionIds: strings(row.actionIds),
    verificationRequired: row.verificationRequired,
    budgetCents: row.budgetCents,
  });
}

export async function createEpochAutomation(scope: AutomationScope, input: CreateAutomationInput) {
  const policy = await activePolicy(scope, input.policyId);
  if (input.institutionId) {
    const institution = await prisma.epochInstitution.findFirst({ where: { id: input.institutionId, workspaceId: scope.workspaceId }, select: { id: true } });
    if (!institution) throw new AutomationBoundaryError("INSTITUTION_NOT_FOUND", "Institution is outside the workspace.");
  }
  const automation = await prisma.epochAutomation.create({
    data: {
      workspaceId: scope.workspaceId,
      institutionId: input.institutionId,
      userId: scope.userId,
      orgId: scope.orgId,
      name: input.name,
      trigger: jsonValue(input.trigger),
      level: input.level,
      status: input.status ?? "draft",
      policyId: policy.id,
      verificationRequired: input.verificationRequired ?? true,
      budgetCents: input.budgetCents ?? 0,
      actions: { create: input.actions.map((action) => ({ workspace: { connect: { id: scope.workspaceId } }, userId: scope.userId, orgId: scope.orgId, environment: action.environment, name: action.name, parameters: jsonValue(action.parameters ?? {}), policyDecisionId: policy.id })) },
    },
    include: { actions: true },
  });
  const actionIds = automation.actions.map((action) => action.id);
  const saved = await prisma.epochAutomation.update({ where: { id: automation.id }, data: { actionIds }, include: { actions: true, runs: { orderBy: { createdAt: "desc" }, take: 10 } } });
  emitEpochRuntimeEvent({ ...scope, kind: "epoch.automation.created", label: `Automation ${saved.name} created`, subjectId: saved.id, payload: { automationId: saved.id, actionIds } });
  return { automation: toContract(saved), actions: saved.actions, runs: saved.runs };
}

export async function listEpochAutomations(scope: AutomationScope) {
  await scopedWorkspace(scope);
  const rows = await prisma.epochAutomation.findMany({ where: { workspaceId: scope.workspaceId }, include: { actions: true, runs: { orderBy: { createdAt: "desc" }, take: 10 } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] });
  return rows.map((row) => ({ automation: toContract(row), actions: row.actions, runs: row.runs }));
}

export async function getEpochAutomation(scope: AutomationScope, automationId: string) {
  await scopedWorkspace(scope);
  const row = await prisma.epochAutomation.findFirst({ where: { id: automationId, workspaceId: scope.workspaceId }, include: { actions: true, runs: { orderBy: { createdAt: "desc" }, take: 20 } } });
  return row ? { automation: toContract(row), actions: row.actions, runs: row.runs } : null;
}

export async function triggerEpochAutomation(scope: AutomationScope, automationId: string, input: { type: string; payload?: Record<string, unknown>; requestedCents?: number }) {
  const row = await prisma.epochAutomation.findFirst({ where: { id: automationId, workspaceId: scope.workspaceId }, include: { actions: true } });
  if (!row) throw new AutomationBoundaryError("AUTOMATION_NOT_FOUND", "Automation was not found in this workspace.");
  const policy = await activePolicy(scope, row.policyId);
  const trigger = object(row.trigger);
  if (row.status !== "active") throw new AutomationBoundaryError("AUTOMATION_NOT_ACTIVE", "Only active automations can be triggered.");
  if (trigger.type !== input.type) throw new AutomationBoundaryError("TRIGGER_NOT_MATCHED", "The event does not match this automation trigger.");
  const filter = object(trigger.filter);
  const payload = input.payload ?? {};
  if (Object.entries(filter).some(([key, value]) => payload[key] !== value)) throw new AutomationBoundaryError("TRIGGER_FILTER_NOT_MATCHED", "The trigger payload did not satisfy the automation filter.");
  const requestedCents = input.requestedCents ?? 0;
  const budget = governEpochBudget({ budgetCents: row.budgetCents, spentCents: row.spentCents, requestedCents });
  const approvalRequired = policy.blocked || !policy.canExecute || policy.needsApproval;
  const initialStatus = budget.allowed ? (approvalRequired ? "approval_required" : "executing") : "budget_denied";
  const run = await prisma.epochAutomationRun.create({ data: { workspaceId: scope.workspaceId, automationId: row.id, userId: scope.userId, orgId: scope.orgId, triggerType: input.type, triggerPayload: jsonValue(payload), status: initialStatus, requestedCents, result: jsonValue({ budget, approvalRequired }) } });
  if (!budget.allowed) {
    emitEpochRuntimeEvent({ ...scope, kind: "epoch.automation.budget_denied", label: `Automation ${row.name} exceeded budget`, subjectId: row.id, payload: { automationId: row.id, runId: run.id, budget } });
    return { automation: toContract(row), run };
  }
  if (approvalRequired) {
    emitEpochRuntimeEvent({ ...scope, kind: "epoch.automation.approval_required", label: `Automation ${row.name} requires approval`, subjectId: row.id, payload: { automationId: row.id, runId: run.id, policyId: policy.id } });
    return { automation: toContract(row), run };
  }
  emitEpochRuntimeEvent({ ...scope, kind: "epoch.automation.triggered", label: `Automation ${row.name} triggered`, subjectId: row.id, payload: { automationId: row.id, runId: run.id, triggerType: input.type } });
  let missionId: string | undefined;
  const completedActionIds: string[] = [];
  try {
    for (const action of row.actions) {
      await prisma.epochAutomationAction.update({ where: { id: action.id }, data: { status: "executing" } });
      const params = object(action.parameters);
      if (action.name === "mission.create") {
        const institutionId = typeof params.institutionId === "string" ? params.institutionId : row.institutionId;
        if (!institutionId || typeof params.title !== "string" || typeof params.objective !== "string") throw new AutomationBoundaryError("MISSION_ACTION_INVALID", "mission.create requires institutionId, title, and objective.");
        const mission = await createEpochMission({ workspaceId: scope.workspaceId, institutionId, userId: scope.userId, orgId: scope.orgId, title: params.title, objective: params.objective, repository: typeof params.repository === "string" ? params.repository : undefined, baseBranch: typeof params.baseBranch === "string" ? params.baseBranch : undefined, workingBranch: typeof params.workingBranch === "string" ? params.workingBranch : undefined, plan: Array.isArray(params.plan) ? params.plan.filter((item): item is string => typeof item === "string") : undefined, acceptanceCriteria: Array.isArray(params.acceptanceCriteria) ? params.acceptanceCriteria.filter((item): item is string => typeof item === "string") : undefined });
        missionId = mission.id;
        await appendEpochEvidence({ workspaceId: scope.workspaceId, missionId, userId: scope.userId, evidence: [{ kind: "automation.action", summary: `Automation ${row.name} created mission ${mission.id}.`, payload: { automationId: row.id, runId: run.id, actionId: action.id, triggerType: input.type }, proof: { correlationId: scope.correlationId, traceId: scope.traceId } }] });
      }
      await prisma.epochAutomationAction.update({ where: { id: action.id }, data: { status: "completed", missionId } });
      completedActionIds.push(action.id);
    }
    const status = row.verificationRequired && missionId ? "verification_required" : "completed";
    const completed = await prisma.$transaction([prisma.epochAutomationRun.update({ where: { id: run.id }, data: { status, spentCents: requestedCents, missionId, actionIds: jsonValue(completedActionIds), result: jsonValue({ missionId: missionId ?? null, verificationRequired: row.verificationRequired }) } }), prisma.epochAutomation.update({ where: { id: row.id }, data: { spentCents: { increment: requestedCents } } })]);
    emitEpochRuntimeEvent({ ...scope, kind: "epoch.automation.completed", label: `Automation ${row.name} completed`, subjectId: row.id, payload: { automationId: row.id, runId: run.id, missionId: missionId ?? null, actionIds: completedActionIds } });
    return { automation: toContract(row), run: completed[0], missionId, actionIds: completedActionIds };
  } catch (error) {
    await prisma.epochAutomationRun.update({ where: { id: run.id }, data: { status: "failed", result: jsonValue({ error: error instanceof Error ? error.message : "automation_failed", missionId: missionId ?? null, actionIds: completedActionIds }) } });
    emitEpochRuntimeEvent({ ...scope, kind: "epoch.automation.failed", label: `Automation ${row.name} failed`, subjectId: row.id, payload: { automationId: row.id, runId: run.id, error: error instanceof Error ? error.message : "automation_failed" } });
    if (error instanceof AutomationBoundaryError) throw error;
    throw new AutomationBoundaryError("AUTOMATION_FAILED", error instanceof Error ? error.message : "Automation failed.");
  }
}
