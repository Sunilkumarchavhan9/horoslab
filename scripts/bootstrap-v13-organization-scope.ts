import { prisma } from "../lib/storage/prismaClient";

const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID;
const userId = process.env.EPOCH_V13_GATE_USER_ID;
const organizationId = process.env.EPOCH_V13_GATE_ORG_ID;
const confirmed = process.env.EPOCH_V13_SCOPE_CONFIRM === "YES";

async function main() {
  if (!workspaceId || !userId || !organizationId) {
    throw new Error(
      "Set EPOCH_V13_GATE_WORKSPACE_ID, EPOCH_V13_GATE_USER_ID, and EPOCH_V13_GATE_ORG_ID.",
    );
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId },
    select: { id: true, userId: true, orgId: true, name: true },
  });

  if (!workspace) {
    throw new Error("Workspace was not found for the supplied user. Nothing was changed.");
  }

  if (workspace.orgId && workspace.orgId !== organizationId) {
    throw new Error(
      `Workspace is already bound to organization ${workspace.orgId}; refusing to rebind it to ${organizationId}.`,
    );
  }

  console.log(JSON.stringify({
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    userId: workspace.userId,
    currentOrgId: workspace.orgId,
    requestedOrgId: organizationId,
    action: workspace.orgId === organizationId ? "already_bound" : confirmed ? "bind" : "dry_run",
  }, null, 2));

  if (workspace.orgId === organizationId) return;
  if (!confirmed) {
    console.log("Dry run only. Set EPOCH_V13_SCOPE_CONFIRM=YES to apply this exact binding.");
    return;
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { orgId: organizationId },
  });

  console.log(`[PASS] Workspace ${workspace.id} is now bound to organization ${organizationId}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
