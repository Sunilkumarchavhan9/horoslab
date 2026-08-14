import { randomUUID } from "node:crypto";
import { prisma } from "../lib/storage/prismaClient";
import { composeEpochCapability, createEpochCapabilityPlan, discoverEpochCapabilities, runEpochCapabilityPlan } from "../lib/epoch/v13/capabilityFabricService";

const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID;
const userId = process.env.EPOCH_V13_GATE_USER_ID;
const orgId = process.env.EPOCH_V13_GATE_ORG_ID;
const scope = () => ({ workspaceId: workspaceId!, userId: userId!, orgId, correlationId: randomUUID(), traceId: randomUUID() });
function assertCondition(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main() {
  assertCondition(workspaceId && userId, "Set EPOCH_V13_GATE_WORKSPACE_ID and EPOCH_V13_GATE_USER_ID before running this gate.");
  const discovery = await discoverEpochCapabilities(scope());
  assertCondition(discovery.sources.length > 0, "Capability discovery returned no live worker or model sources.");
  console.log(`[PASS] Capability discovery found ${discovery.availableCapabilities.length} capabilities from ${discovery.sources.length} sources.`);

  const missing = `phase9.synthetic.${Date.now()}`;
  const composed = await composeEpochCapability(scope(), { name: `Phase 9 capability ${missing}`, description: "Deterministic capability acquisition proof.", requiredCapabilities: [missing] });
  assertCondition(composed.missingCapabilities.includes(missing), "Capability composition failed to identify the missing capability.");
  console.log("[PASS] Capability gap identified from live discovery.");

  const plan = await createEpochCapabilityPlan(scope(), composed.gap.id);
  const sandboxed = await runEpochCapabilityPlan(scope(), plan.id, "sandbox");
  assertCondition(sandboxed && "status" in sandboxed && sandboxed.status === "sandboxed", "Capability sandbox did not complete.");
  const verified = await runEpochCapabilityPlan(scope(), plan.id, "verify");
  assertCondition(verified && "status" in verified && verified.status === "verified", "Capability verification did not pass.");
  const promoted = await runEpochCapabilityPlan(scope(), plan.id, "promote");
  assertCondition("registry" in promoted, "Capability promotion did not create a registry record.");
  console.log("[PASS] Capability sandbox, tests, verification, and promotion passed.");

  const rolledBack = await runEpochCapabilityPlan(scope(), plan.id, "rollback");
  assertCondition("rolledBack" in rolledBack && rolledBack.rolledBack === true, "Capability rollback did not complete.");
  const registry = await prisma.epochCapabilityRegistry.findFirst({ where: { id: (promoted as { registry: { id: string } }).registry.id }, select: { status: true } });
  assertCondition(registry?.status === "rolled_back", "Promoted capability remained active after rollback.");
  console.log("[PASS] Capability rollback removed the promoted registry from active use.");
  console.log("[PASS] Phase 9 capability fabric gate passed.");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
