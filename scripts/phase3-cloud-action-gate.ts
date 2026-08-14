import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/storage/prismaClient";
import { createEpochAuthorityPolicy } from "../lib/epoch/epochStore";
import { createEpochV13Environment } from "../lib/epoch/v13/environmentService";
import { createEpochV13Project } from "../lib/epoch/v13/projectService";
import { CloudActionBoundaryError, executeEpochCloudAction } from "../lib/epoch/v13/cloudActionService";

const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID;
const userId = process.env.EPOCH_V13_GATE_USER_ID;
const orgId = process.env.EPOCH_V13_GATE_ORG_ID;

async function main() {
  if (!workspaceId || !userId) {
    throw new Error("Set EPOCH_V13_GATE_WORKSPACE_ID and EPOCH_V13_GATE_USER_ID before running this gate.");
  }

  const workspace = await prisma.workspace.findFirst({
  where: { id: workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
  select: { id: true, orgId: true },
});
  if (!workspace) throw new Error("The configured V13 gate workspace was not found for this user.");

  const organizationId = workspace.orgId ?? orgId;
  if (!organizationId) throw new Error("The configured V13 gate workspace has no organization boundary.");

  let institution = await prisma.epochInstitution.findFirst({
    where: { workspaceId, userId, ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}) },
    select: { id: true },
});
  let fixtureInstitutionId: string | null = null;
  if (!institution) {
    institution = await prisma.epochInstitution.create({
      data: {
        workspaceId,
        userId,
        orgId: organizationId,
        name: `V13 cloud acceptance fixture ${Date.now()}`,
        category: "acceptance-test",
        summary: "Temporary V13 cloud-action gate fixture.",
        metadata: { source: "backend:v13:acceptance" },
      },
      select: { id: true },
    });
    fixtureInstitutionId = institution.id;
    console.log(`[INFO] Created temporary V13 cloud acceptance institution ${institution.id}.`);
  }

  const server = createServer((request, response) => {
  const payload = JSON.stringify({ ok: true, method: request.method, path: request.url });
  response.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
  response.end(payload);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not start local cloud mock.");

  const scope = {
  workspaceId,
  userId,
  orgId: organizationId,
  correlationId: randomUUID(),
  traceId: randomUUID(),
  };
  const fixtureName = `V13 local cloud gate ${new Date().toISOString()}`;
  const project = await createEpochV13Project(scope, { name: fixtureName, metadata: { purpose: "phase3-local-gate" } });
  const environment = await createEpochV13Environment(scope, {
  projectId: project.id,
  kind: "cloud",
  name: `${fixtureName} environment`,
  status: "connected",
  region: "local",
  });
  const policy = await createEpochAuthorityPolicy({
  workspaceId,
  institutionId: institution.id,
  userId,
  orgId: organizationId,
  name: `${fixtureName} policy`,
  canExecute: true,
  needsApproval: true,
  permissions: ["cloud.action", "cloud:cloud:read", "cloud:cloud:execute"],
  checks: ["local-mock-only", "approval-required-for-mutations"],
  });

  process.env.EPOCH_V13_CLOUD_URL_TEST = `http://127.0.0.1:${address.port}/health`;
  process.env.EPOCH_V13_CLOUD_APPROVAL_SECRET = "phase3-local-approval";

  try {
  const read = await executeEpochCloudAction(scope, {
    projectId: project.id,
    environmentId: environment.id,
    provider: "custom",
    policyId: policy.id,
    endpointEnvVar: "EPOCH_V13_CLOUD_URL_TEST",
    resourceType: "cloud",
    action: "read",
    method: "GET",
    dryRun: true,
    idempotencyKey: randomUUID(),
  });
  console.log(`[PASS] Read-only cloud probe recorded world state ${read.id}.`);

  try {
    await executeEpochCloudAction(scope, {
      projectId: project.id,
      environmentId: environment.id,
      provider: "custom",
      policyId: policy.id,
      endpointEnvVar: "EPOCH_V13_CLOUD_URL_TEST",
      resourceType: "cloud",
      action: "execute",
      method: "POST",
      dryRun: false,
      idempotencyKey: randomUUID(),
      body: { operation: "local-gate-only" },
    });
    throw new Error("Mutation unexpectedly bypassed the approval boundary.");
  } catch (error) {
    if (!(error instanceof CloudActionBoundaryError) || error.code !== "approval_required") throw error;
    console.log("[PASS] Mutating cloud action was blocked without approval.");
  }

  const approved = await executeEpochCloudAction(scope, {
    projectId: project.id,
    environmentId: environment.id,
    provider: "custom",
    policyId: policy.id,
    endpointEnvVar: "EPOCH_V13_CLOUD_URL_TEST",
    resourceType: "cloud",
    action: "execute",
    method: "POST",
    dryRun: false,
    approvalToken: "phase3-local-approval",
    idempotencyKey: randomUUID(),
    body: { operation: "local-gate-only" },
  });
  const [worldStates, auditRecords] = await Promise.all([
    prisma.epochWorldState.count({ where: { workspaceId, projectId: project.id, environmentId: environment.id } }),
    prisma.auditLog.count({ where: { workspaceId, resourceId: approved.id } }),
  ]);
  if (worldStates < 2 || auditRecords < 1) throw new Error("Cloud action proof records were not persisted.");
  console.log(`[PASS] Approved local cloud action recorded world state ${approved.id}, worldStates=${worldStates}, auditRecords=${auditRecords}.`);
  console.log(`[PASS] Fixture project=${project.id} environment=${environment.id} policy=${policy.id}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (fixtureInstitutionId) {
      await prisma.epochAuthorityPolicy.deleteMany({ where: { institutionId: fixtureInstitutionId } });
      await prisma.epochInstitution.delete({ where: { id: fixtureInstitutionId } });
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
