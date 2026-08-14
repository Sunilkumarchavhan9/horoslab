import { normalizeOrgId } from "../auth/orgScope";
import { getRedisClient } from "../cache/redisClient";
import { prisma } from "../storage/prismaClient";

export const ORG_SETTINGS_OWNER_ID = "__org__";

export type ScopedSettingsIdentity = {
  userId: string;
  orgId?: string;
  section: string;
};

export function orgScopedSettingsIdentity(
  orgId: string,
  section: string,
): ScopedSettingsIdentity {
  return {
    userId: ORG_SETTINGS_OWNER_ID,
    orgId,
    section,
  };
}

export function userScopedSettingsIdentity(
  userId: string,
  section: string,
  orgId?: string,
): ScopedSettingsIdentity {
  return {
    userId,
    orgId,
    section,
  };
}

function dbOrgId(orgId?: string): string {
  return normalizeOrgId(orgId) ?? "";
}

function settingsCacheTtlSeconds(): number {
  const configured = Number(process.env.MEMORYOS_SETTINGS_CACHE_TTL_SECONDS);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }
  return 60;
}

function settingsCacheKey(identity: ScopedSettingsIdentity): string {
  const prefix = process.env.MEMORYOS_SETTINGS_CACHE_PREFIX?.trim() || "memoryos:settings:v1";
  return [
    prefix,
    encodeURIComponent(identity.userId),
    encodeURIComponent(dbOrgId(identity.orgId)),
    encodeURIComponent(identity.section),
  ].join(":");
}

async function readCachedScopedSetting<T>(
  identity: ScopedSettingsIdentity,
  coerce: (raw: unknown) => T,
): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) return null;

  const key = settingsCacheKey(identity);
  try {
    const cached = await client.get(key);
    if (!cached) return null;
    return coerce(JSON.parse(cached) as unknown);
  } catch {
    try {
      await client.del(key);
    } catch {
      // Cache invalidation failure should not block the durable read path.
    }
    return null;
  }
}

async function cacheScopedSetting(
  identity: ScopedSettingsIdentity,
  dataJson: string,
): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.set(settingsCacheKey(identity), dataJson, {
      EX: settingsCacheTtlSeconds(),
    });
  } catch {
    // Redis is an optional read-through cache; Postgres remains the source of truth.
  }
}

export async function readScopedSetting<T>(
  identity: ScopedSettingsIdentity,
  coerce: (raw: unknown) => T,
): Promise<T> {
  const cached = await readCachedScopedSetting(identity, coerce);
  if (cached) return cached;

  const row = await prisma.scopedSetting.findUnique({
    where: {
      userId_orgId_section: {
        userId: identity.userId,
        orgId: dbOrgId(identity.orgId),
        section: identity.section,
      },
    },
  });
  if (!row) return coerce(null);

  try {
    const record = coerce(JSON.parse(row.dataJson) as unknown);
    await cacheScopedSetting(identity, row.dataJson);
    return record;
  } catch {
    return coerce(null);
  }
}

export async function writeScopedSetting<T>(
  identity: ScopedSettingsIdentity,
  record: T,
): Promise<boolean> {
  const maybeRecord = record && typeof record === "object" ? record as { updatedAt?: unknown } : {};
  const updatedAt =
    typeof maybeRecord.updatedAt === "string" && maybeRecord.updatedAt.trim()
      ? maybeRecord.updatedAt
      : new Date().toISOString();
  const dataJson = JSON.stringify(record);

  await prisma.scopedSetting.upsert({
    where: {
      userId_orgId_section: {
        userId: identity.userId,
        orgId: dbOrgId(identity.orgId),
        section: identity.section,
      },
    },
    create: {
      userId: identity.userId,
      orgId: dbOrgId(identity.orgId),
      section: identity.section,
      updatedAt,
      dataJson,
    },
    update: {
      updatedAt,
      dataJson,
    },
  });
  await cacheScopedSetting(identity, dataJson);
  return true;
}
