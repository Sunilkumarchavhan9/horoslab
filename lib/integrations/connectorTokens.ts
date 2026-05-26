import { prisma } from "../storage/prismaClient";
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

export async function getConnectedConnectorTypes(userId: string): Promise<ConnectorType[]> {
  const connectors = await prisma.connector.findMany({
    where: {
      userId,
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
        "zendesk",
        "jira",
      ].includes(type),
    );
}

export async function getConnectorAccessToken(
  userId: string,
  type: ConnectorType,
): Promise<string | null> {
  const connector = await prisma.connector.findFirst({
    where: { userId, type, status: "connected" },
    select: { configJson: true },
  });
  const config = parseConnectorConfig(connector?.configJson);
  return typeof config.accessToken === "string" && config.accessToken.length > 0
    ? config.accessToken
    : null;
}
