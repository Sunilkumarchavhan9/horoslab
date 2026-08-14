import { connectorUserFilter, resolveRequestOrgId } from "../../auth/orgScope";
import type { ConnectorType } from "../../integrations/connectorManager";
import { prisma } from "../../storage/prismaClient";
import type { ExecutionScope } from "../executionTypes";

export type ConnectorExecutionCredentials = {
  accessToken: string;
  config: Record<string, unknown>;
};

export async function loadConnectorCredentials(
  scope: ExecutionScope,
  type: ConnectorType,
): Promise<ConnectorExecutionCredentials> {
  const scopedOrgId = resolveRequestOrgId(scope.orgId);
  const connector = await prisma.connector.findFirst({
    where: {
      ...connectorUserFilter({ userId: scope.userId, orgId: scopedOrgId }),
      type,
      status: "connected",
    },
    select: { configJson: true },
  });
  if (!connector?.configJson) {
    throw new Error(
      `${type} connector is not connected. Connect ${type} in Connected Intelligence Sources first.`,
    );
  }
  let config: Record<string, unknown>;
  try {
    const parsed = JSON.parse(connector.configJson) as unknown;
    config = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw new Error(`${type} connector config is invalid. Reconnect the ${type} connector.`);
  }
  const accessToken = typeof config.accessToken === "string" ? config.accessToken.trim() : "";
  if (!accessToken) {
    throw new Error(`${type} connector token missing. Reconnect ${type} first.`);
  }
  return { accessToken, config };
}
