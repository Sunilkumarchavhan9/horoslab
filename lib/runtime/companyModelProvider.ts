import { connectorStorageId, connectorUserFilter } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";

export type CompanyModelConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string | null;
  providerName?: string | null;
};

const CONNECTOR_TYPE = "openrouter";

function parseConfig(configJson: string | null | undefined): Partial<CompanyModelConfig> {
  if (!configJson) return {};
  try {
    const parsed = JSON.parse(configJson) as Record<string, unknown>;
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : undefined,
      model: typeof parsed.model === "string" ? parsed.model : undefined,
      baseUrl:
        typeof parsed.baseUrl === "string"
          ? parsed.baseUrl
          : parsed.baseUrl === null
            ? null
            : undefined,
      providerName:
        typeof parsed.providerName === "string" ? parsed.providerName : undefined,
    };
  } catch {
    return {};
  }
}

export async function getCompanyModelConfig(
  userId: string,
  orgId?: string,
): Promise<CompanyModelConfig | null> {
  const row = await prisma.connector.findFirst({
    where: {
      ...connectorUserFilter({ userId, orgId }),
      type: CONNECTOR_TYPE,
      status: "connected",
    },
    select: { configJson: true },
  });

  const config = parseConfig(row?.configJson);
  const apiKey = config.apiKey?.trim();
  const model = config.model?.trim();
  if (!apiKey || !model) return null;

  return {
    apiKey,
    model,
    baseUrl: config.baseUrl ?? null,
    providerName: config.providerName ?? null,
  };
}

export async function saveCompanyModelConfig(
  userId: string,
  input: {
    apiKey?: string;
    model: string;
    baseUrl?: string | null;
    providerName?: string | null;
  },
  orgId?: string,
): Promise<CompanyModelConfig> {
  const connectorId = connectorStorageId(userId, CONNECTOR_TYPE, orgId);
  const existing = await prisma.connector.findFirst({
    where: { id: connectorId },
    select: { configJson: true },
  });
  const prior = parseConfig(existing?.configJson);

  const apiKey = input.apiKey?.trim() || prior.apiKey?.trim();
  const model = input.model.trim();
  if (!apiKey) {
    throw new Error("OpenRouter API key is required.");
  }
  if (!model) {
    throw new Error("Model id is required.");
  }

  const configJson = JSON.stringify({
    apiKey,
    model,
    baseUrl: input.baseUrl ?? prior.baseUrl ?? null,
    providerName: input.providerName ?? prior.providerName ?? null,
  });

  await prisma.connector.upsert({
    where: { id: connectorId },
    create: {
      id: connectorId,
      userId,
      orgId: orgId ?? null,
      type: CONNECTOR_TYPE,
      name: "OpenRouter",
      status: "connected",
      configJson,
      lastSyncAt: new Date().toISOString(),
    },
    update: {
      status: "connected",
      orgId: orgId ?? null,
      configJson,
      updatedAt: new Date(),
    },
  });

  return {
    apiKey,
    model,
    baseUrl: input.baseUrl ?? prior.baseUrl ?? null,
    providerName: input.providerName ?? prior.providerName ?? null,
  };
}
