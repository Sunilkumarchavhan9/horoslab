import { randomUUID } from "node:crypto";
import { prisma } from "../lib/storage/prismaClient";
import { createEpochAuthorityPolicy } from "../lib/epoch/epochStore";
import { createEpochAutomation, triggerEpochAutomation } from "../lib/epoch/v13/automationService";

const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID;
const userId = process.env.EPOCH_V13_GATE_USER_ID;
const orgId = process.env.EPOCH_V13_GATE_ORG_ID;

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  assertCondition(workspaceId && userId, "Set EPOCH_V13_GATE_WORKSPACE_ID and EPOCH_V13_GATE_USER_ID before running this gate.");
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
    select: { id: true, orgId: true },
  });
  assertCondition(workspace, "The configured V13 automation workspace was not found for this user.");
  const organizationId = workspace.orgId ?? orgId;
  assertCondition(organizationId, "The configured V13 automation workspace has no organization boundary.");
  const institution = await prisma.epochInstitution.findFirst({ where: { workspaceId, userId }, select: { id: true } });
  assertCondition(institution, "Create an institution before running the Phase 8 automation gate.");

  const approvalPolicy = await createEpochAuthorityPolicy({
    workspaceId,
    institutionId: institution.id,
    userId,
    orgId: organizationId,
    name: `Phase 8 approval policy ${randomUUID()}`,
    canExecute: true,
    needsApproval: true,
    permissions: ["mission.create"],
    approvals: ["human"],
  });
  const approvalAutomation = await createEpochAutomation({ workspaceId, userId, orgId: organizationId, correlationId: randomUUID(), traceId: randomUUID() }, {
    name: `Phase 8 approval automation ${randomUUID()}`,
    trigger: { type: "mission.requested" }, level: "A2", status: "active", policyId: approvalPolicy.id,
    institutionId: institution.id,
    actions: [{ environment: "software", name: "mission.create", parameters: { institutionId: institution.id, title: "Approval-gated mission", objective: "Must wait for approval." } }],
  });
  const approvalRun = await triggerEpochAutomation({ workspaceId, userId, orgId: organizationId, correlationId: randomUUID(), traceId: randomUUID() }, approvalAutomation.automation.id, { type: "mission.requested" });
  assertCondition(approvalRun.run.status === "approval_required", "Approval-gated automation did not stop before execution.");
  console.log("[PASS] Automation policy gate stopped an unapproved run.");

  const executionPolicy = await createEpochAuthorityPolicy({
    workspaceId, institutionId: institution.id, userId, orgId: organizationId,
    name: `Phase 8 execution policy ${randomUUID()}`, canExecute: true, needsApproval: false,
    permissions: ["mission.create"], approvals: [],
  });
  const automation = await createEpochAutomation({ workspaceId, userId, orgId: organizationId, correlationId: randomUUID(), traceId: randomUUID() }, {
    name: `Phase 8 mission automation ${randomUUID()}`,
    trigger: { type: "mission.requested", filter: { source: "phase8" } }, level: "A3", status: "active", policyId: executionPolicy.id,
    institutionId: institution.id, budgetCents: 10,
    actions: [{ environment: "software", name: "mission.create", parameters: { institutionId: institution.id, title: `Phase 8 generated mission ${randomUUID()}`, objective: "Prove governed automation creates a durable mission.", acceptanceCriteria: ["Automation evidence exists"] } }],
  });
  const denied = await triggerEpochAutomation({ workspaceId, userId, orgId: organizationId, correlationId: randomUUID(), traceId: randomUUID() }, automation.automation.id, { type: "mission.requested", payload: { source: "phase8" }, requestedCents: 11 });
  assertCondition(denied.run.status === "budget_denied", "Automation budget gate did not deny an over-budget run.");
  console.log("[PASS] Automation budget gate denied an over-budget run.");

  const completed = await triggerEpochAutomation({ workspaceId, userId, orgId: organizationId, correlationId: randomUUID(), traceId: randomUUID() }, automation.automation.id, { type: "mission.requested", payload: { source: "phase8" }, requestedCents: 5 });
  assertCondition(completed.missionId, "Automation did not create the governed mission.");
  assertCondition(completed.run.status === "verification_required", "Automation did not stop at the verification boundary.");
  const evidence = await prisma.epochEvidence.findFirst({ where: { workspaceId, missionId: completed.missionId, kind: "automation.action" }, select: { id: true } });
  assertCondition(evidence, "Automation mission evidence was not persisted in the canonical evidence store.");
  console.log(`[PASS] Automation created mission and evidence: mission=${completed.missionId}.`);
  console.log(`[PASS] Phase 8 automation gate passed: automation=${automation.automation.id}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
