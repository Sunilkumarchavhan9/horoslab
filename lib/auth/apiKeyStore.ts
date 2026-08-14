import { createHash, randomBytes, randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";

export type ApiKeyPermissionMode = "full" | "scoped";

export type ApiKeyRecord = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  mode: ApiKeyPermissionMode;
  endpoints: string[];
  contentTag: string;
  creditLimit: number | null;
  resetLimitEvery: string | null;
  expires: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: "active" | "revoked";
  revokedAt: string | null;
};

type ApiKeyRow = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  mode: string;
  endpointsJson: string;
  contentTag: string;
  creditLimit: number | null;
  resetLimitEvery: string | null;
  expires: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: string;
  revokedAt: string | null;
};

function makeApiKeyValue(): string {
  return `mk_${randomBytes(24).toString("hex")}`;
}

function hashApiKeyToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isPermissionMode(value: unknown): value is ApiKeyPermissionMode {
  return value === "full" || value === "scoped";
}

function parseEndpointsJson(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((endpoint): endpoint is string => typeof endpoint === "string");
  } catch {
    return [];
  }
}

function toApiKeyRecord(row: ApiKeyRow): ApiKeyRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    keyPrefix: row.keyPrefix,
    keyHash: row.keyHash,
    mode: isPermissionMode(row.mode) ? row.mode : "scoped",
    endpoints: parseEndpointsJson(row.endpointsJson),
    contentTag: row.contentTag,
    creditLimit: row.creditLimit,
    resetLimitEvery: row.resetLimitEvery,
    expires: row.expires,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    status: row.status === "revoked" ? "revoked" : "active",
    revokedAt: row.revokedAt,
  };
}

export async function listApiKeysForUser(userId: string): Promise<ApiKeyRecord[]> {
  const rows = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toApiKeyRecord);
}

export async function createApiKeyForUser(input: {
  userId: string;
  name: string;
  expires: string;
  mode: ApiKeyPermissionMode;
  endpoints: string[];
  contentTag: string;
  creditLimit?: number | null;
  resetLimitEvery?: string | null;
}): Promise<{ key: ApiKeyRecord; token: string }> {
  const token = makeApiKeyValue();
  const keyPrefix = token.slice(0, 10);
  const now = new Date().toISOString();

  const row = await prisma.apiKey.create({
      data: {
        id: `key_${randomUUID().slice(0, 12)}`,
        userId: input.userId,
        name: input.name,
        keyPrefix,
        keyHash: hashApiKeyToken(token),
        mode: input.mode,
        endpointsJson: JSON.stringify(input.endpoints),
        contentTag: input.contentTag,
        creditLimit: typeof input.creditLimit === "number" && Number.isFinite(input.creditLimit) ? Math.max(0, Math.trunc(input.creditLimit)) : null,
        resetLimitEvery: typeof input.resetLimitEvery === "string" && input.resetLimitEvery.trim().length > 0 ? input.resetLimitEvery.trim() : null,
        expires: input.expires,
        createdAt: now,
        lastUsedAt: null,
        status: "active",
      revokedAt: null,
    },
  });
  return { key: toApiKeyRecord(row), token };
}

export async function revokeApiKeyForUser(
  userId: string,
  keyId: string,
): Promise<ApiKeyRecord | null> {
  const target = await prisma.apiKey.findFirst({ where: { id: keyId, userId } });
  if (!target) {
    return null;
  }
  const row = await prisma.apiKey.update({
    where: { id: target.id },
    data: {
      status: "revoked",
      revokedAt: new Date().toISOString(),
    },
  });
  return toApiKeyRecord(row);
}

export async function verifyApiKeyToken(
  token: string,
): Promise<{
  userId: string;
  keyId: string;
  mode: ApiKeyPermissionMode;
  endpoints: string[];
  contentTag: string;
} | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  const nowMs = Date.now();
  const hashed = hashApiKeyToken(token);
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hashed } });
  if (!key || key.status !== "active") {
    return null;
  }

  const expiresAtMs = Date.parse(key.expires);
  if (Number.isFinite(expiresAtMs) && expiresAtMs < nowMs) {
    return null;
  }

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date(nowMs).toISOString() },
  });
  return {
    userId: key.userId,
    keyId: key.id,
    mode: isPermissionMode(key.mode) ? key.mode : "scoped",
    endpoints: parseEndpointsJson(key.endpointsJson),
    contentTag: key.contentTag,
  };
}
