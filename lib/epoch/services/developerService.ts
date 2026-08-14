import { prisma } from "../../storage/prismaClient";

export async function summarizeDeveloperService(workspaceId: string) {
  const [apiKeys, mcpConnections, webhooks, deliveries] = await Promise.all([
    prisma.agentAccessKey.count({ where: { workspaceId } }),
    prisma.mCPConnection.count({ where: { workspaceId } }),
    prisma.webhookEndpoint.count({ where: { workspaceId } }),
    prisma.webhookDelivery.count({ where: { workspaceId } }),
  ]);

  return {
    workspaceId,
    counts: {
      apiKeys,
      mcpConnections,
      webhooks,
      deliveries,
    },
    recent: [],
  };
}
