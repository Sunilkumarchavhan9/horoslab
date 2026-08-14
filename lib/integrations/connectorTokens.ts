import { connectorUserFilter, resolveRequestOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";
import { hasPrismaConnectorDatasourceUrl } from "../storage/prismaErrorUtils";
import type { ConnectorType } from "./connectorManager";

type ConnectorConfig = {
  accessToken?: unknown;
};

function parseConnectorConfig(configJson: string | null | undefined): ConnectorConfig {
  if (!configJson) return {};
  try {
    const parsed = JSON.parse(configJson) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as ConnectorConfig) : {};
  } catch {
    return {};
  }
}

export async function getConnectedConnectorTypes(
  userId: string,
  orgId?: string,
): Promise<ConnectorType[]> {
  if (!hasPrismaConnectorDatasourceUrl()) {
    return [];
  }
  const scopedOrgId = resolveRequestOrgId(orgId);
  const connectors = await prisma.connector.findMany({
    where: {
      ...connectorUserFilter({ userId, orgId: scopedOrgId }),
      status: { in: ["connected", "syncing"] },
    },
    select: { type: true },
  });

  return connectors
    .map((connector) => connector.type)
    .filter((type): type is ConnectorType =>
      [
        "github",
        "notion",
        "google_drive",
        "onedrive",
        "gmail",
        "slack",
        "local_files",
        "ide_chats",
        "cursor_chats",
        "vs_code_chats",
        "codex_chats",
        "chatgpt_chats",
        "windsurf_chats",
        "devin_chats",
        "ci_cd_logs",
        "deployment_errors",
        "zendesk",
        "jira",
        "linear",
      ].includes(type),
    );
}

export async function getConnectorAccessToken(
  userId: string,
  type: ConnectorType,
  orgId?: string,
): Promise<string | null> {
  if (!hasPrismaConnectorDatasourceUrl()) {
    return null;
  }
  const scopedOrgId = resolveRequestOrgId(orgId);
  const connector = await prisma.connector.findFirst({
    where: {
      ...connectorUserFilter({ userId, orgId: scopedOrgId }),
      type,
      status: "connected",
    },
    select: { configJson: true },
  });
  const config = parseConnectorConfig(connector?.configJson);
  return typeof config.accessToken === "string" && config.accessToken.length > 0
    ? config.accessToken
    : null;
}
