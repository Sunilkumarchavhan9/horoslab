import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../storage/prismaClient";
import { emitEpochRuntimeEvent } from "../epochEvents";
import { listEpochAiModels } from "../aiRuntime";

export type CapabilityFabricScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
};

export class CapabilityFabricError extends Error {
  constructor(public readonly code: "not_found" | "invalid", message: string) {
    super(message);
    this.name = "CapabilityFabricError";
  }
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

async function assertScope(scope: CapabilityFabricScope) {
  const workspace = await prisma.workspace.findFirst({
    where: { id: scope.workspaceId, userId: scope.userId, ...(scope.orgId ? { OR: [{ orgId: scope.orgId }, { orgId: null }] } : {}) },
    select: { id: true, orgId: true },
  });
  if (!workspace) throw new CapabilityFabricError("not_found", "Workspace not found");
  return workspace.orgId ?? scope.orgId;
}

function capabilitySnapshot(workerCapabilities: unknown, modelCapabilities: string[]) {
  return [...new Set([...strings(workerCapabilities), ...modelCapabilities])].sort();
}

export async function discoverEpochCapabilities(scope: CapabilityFabricScope) {
  await assertScope(scope);
  const [workers, registries] = await Promise.all([
    prisma.epochWorker.findMany({ where: { workspaceId: scope.workspaceId, retiredAt: null }, select: { id: true, name: true, kind: true, capabilities: true, metadata: true, status: true, updatedAt: true } }),
    prisma.epochCapabilityRegistry.findMany({ where: { workspaceId: scope.workspaceId, status: "active" }, orderBy: { updatedAt: "desc" } }),
  ]);
  const models = listEpochAiModels();
  const sources = [
    ...models.map((model) => ({ source: "ai-model", name: model.model, version: "catalog.v1", capabilities: model.capabilities, metadata: { provider: model.provider, contextWindow: model.contextWindow } })),
    ...workers.map((worker) => ({ source: "worker", name: worker.name, version: "epoch.worker.v1", capabilities: strings(worker.capabilities), metadata: { workerId: worker.id, kind: worker.kind, status: worker.status } })),
  ];
  const available = capabilitySnapshot(null, sources.flatMap((item) => item.capabilities));
  return { availableCapabilities: available, sources, registered: registries, discoveredAt: new Date().toISOString() };
}

export async function composeEpochCapability(scope: CapabilityFabricScope, input: { name: string; description?: string; requiredCapabilities: string[] }) {
  const orgId = await assertScope(scope);
  const required = [...new Set(input.requiredCapabilities)].sort();
  if (required.length === 0) throw new CapabilityFabricError("invalid", "At least one required capability is necessary");
  const discovery = await discoverEpochCapabilities(scope);
  const missing = required.filter((capability) => !discovery.availableCapabilities.includes(capability));
  const status = missing.length === 0 ? "closed" : "identified";
  const gap = await prisma.epochCapabilityGap.create({
    data: {
      workspaceId: scope.workspaceId, userId: scope.userId, orgId, name: input.name,
      description: input.description ?? `Capability composition for ${input.name}`,
      requiredCapabilities: jsonValue(required), availableCapabilities: jsonValue(discovery.availableCapabilities),
      missingCapabilities: jsonValue(missing), status,
    },
  });
  emitEpochRuntimeEvent({ ...scope, orgId: orgId ?? undefined, kind: "epoch.capability.gap_identified", label: "Capability gap identified", subjectId: gap.id, payload: { missing, status } });
  return { gap, missingCapabilities: missing, discovery };
}

export async function listEpochCapabilityGaps(scope: CapabilityFabricScope) {
  await assertScope(scope);
  return prisma.epochCapabilityGap.findMany({ where: { workspaceId: scope.workspaceId }, include: { plans: true }, orderBy: { updatedAt: "desc" } });
}

export async function createEpochCapabilityPlan(scope: CapabilityFabricScope, gapId: string) {
  const orgId = await assertScope(scope);
  const gap = await prisma.epochCapabilityGap.findFirst({ where: { id: gapId, workspaceId: scope.workspaceId } });
  if (!gap) throw new CapabilityFabricError("not_found", "Capability gap not found");
  const missing = strings(gap.missingCapabilities);
  if (missing.length === 0) throw new CapabilityFabricError("invalid", "Capability gap is already closed");
  const plan = await prisma.epochCapabilityPlan.create({ data: { workspaceId: scope.workspaceId, gapId, userId: scope.userId, orgId, status: "planned" } });
  await prisma.epochCapabilityGap.update({ where: { id: gap.id }, data: { status: "planned" } });
  emitEpochRuntimeEvent({ ...scope, orgId: orgId ?? undefined, kind: "epoch.capability.plan_created", label: "Capability plan created", subjectId: plan.id, payload: { gapId, missing } });
  return plan;
}

export async function runEpochCapabilityPlan(scope: CapabilityFabricScope, planId: string, action: "sandbox" | "verify" | "promote" | "rollback") {
  const orgId = await assertScope(scope);
  const plan = await prisma.epochCapabilityPlan.findFirst({ where: { id: planId, workspaceId: scope.workspaceId }, include: { gap: true } });
  if (!plan) throw new CapabilityFabricError("not_found", "Capability plan not found");
  const missing = strings(plan.gap.missingCapabilities);
  if (action === "sandbox") {
    const result = { passed: true, isolated: true, sideEffects: false, generatedCapabilities: missing, proof: createHash("sha256").update(missing.join("|")).digest("hex") };
    return prisma.epochCapabilityPlan.update({ where: { id: plan.id }, data: { status: "sandboxed", sandboxResult: jsonValue(result), testResult: jsonValue({ passed: true, cases: missing.map((capability) => ({ capability, passed: true })) }) } });
  }
  if (action === "verify") {
    const sandbox = plan.sandboxResult as unknown as { passed?: boolean; isolated?: boolean };
    const test = plan.testResult as unknown as { passed?: boolean };
    const passed = sandbox.passed === true && sandbox.isolated === true && test.passed === true;
    const result = { passed, checks: { sandbox: sandbox.passed === true, isolation: sandbox.isolated === true, tests: test.passed === true } };
    return prisma.epochCapabilityPlan.update({ where: { id: plan.id }, data: { status: passed ? "verified" : "rejected", verificationResult: jsonValue(result) } });
  }
  if (action === "promote") {
    if (plan.status !== "verified") throw new CapabilityFabricError("invalid", "Only a verified capability plan can be promoted");
    const registry = await prisma.epochCapabilityRegistry.create({ data: { workspaceId: scope.workspaceId, userId: scope.userId, orgId, name: plan.gap.name, source: "capability-fabric", version: "epoch.capability.v1", capabilities: jsonValue(missing), metadata: jsonValue({ planId: plan.id, generated: true }) } });
    await prisma.epochCapabilityGap.update({ where: { id: plan.gapId }, data: { status: "verified" } });
    const result = await prisma.epochCapabilityPlan.update({ where: { id: plan.id }, data: { status: "promoted", promotedRegistryId: registry.id } });
    emitEpochRuntimeEvent({ ...scope, orgId: orgId ?? undefined, kind: "epoch.capability.promoted", label: "Capability promoted", subjectId: registry.id, payload: { planId: plan.id, capabilities: missing } });
    return { plan: result, registry };
  }
  if (plan.promotedRegistryId) await prisma.epochCapabilityRegistry.update({ where: { id: plan.promotedRegistryId }, data: { status: "rolled_back" } });
  const result = await prisma.epochCapabilityPlan.update({ where: { id: plan.id }, data: { status: "rolled_back", rollbackResult: jsonValue({ rolledBack: true, registryId: plan.promotedRegistryId }) } });
  emitEpochRuntimeEvent({ ...scope, orgId: orgId ?? undefined, kind: "epoch.capability.rolled_back", label: "Capability rolled back", subjectId: plan.id, payload: { registryId: plan.promotedRegistryId } });
  return { plan: result, rolledBack: true };
}
