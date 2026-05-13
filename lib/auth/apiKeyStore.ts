import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomBytes, randomUUID } from "crypto";

export type ApiKeyPermissionMode = "full" | "scoped";

type ApiKeyRecord = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  mode: ApiKeyPermissionMode;
  endpoints: string[];
  contentTag: string;
  expires: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: "active" | "revoked";
  revokedAt: string | null;
};

type ApiKeyStore = {
  keys: ApiKeyRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "api-keys.json");

function ensureStoreDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): ApiKeyStore {
  ensureStoreDir();
  if (!existsSync(STORE_PATH)) {
    return { keys: [] };
  }

  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<ApiKeyStore>;
    if (!parsed || !Array.isArray(parsed.keys)) {
      return { keys: [] };
    }
    return { keys: parsed.keys as ApiKeyRecord[] };
  } catch {
    return { keys: [] };
  }
}

function writeStore(store: ApiKeyStore): void {
  ensureStoreDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function makeApiKeyValue(): string {
  return `mk_${randomBytes(24).toString("hex")}`;
}

export function listApiKeysForUser(userId: string): ApiKeyRecord[] {
  return readStore().keys.filter((key) => key.userId === userId);
}

export function createApiKeyForUser(input: {
  userId: string;
  name: string;
  expires: string;
  mode: ApiKeyPermissionMode;
  endpoints: string[];
  contentTag: string;
}): { key: ApiKeyRecord; token: string } {
  const token = makeApiKeyValue();
  const keyPrefix = token.slice(0, 10);
  const now = new Date().toISOString();

  const record: ApiKeyRecord = {
    id: `key_${randomUUID().slice(0, 12)}`,
    userId: input.userId,
    name: input.name,
    keyPrefix,
    keyHash: token,
    mode: input.mode,
    endpoints: input.endpoints,
    contentTag: input.contentTag,
    expires: input.expires,
    createdAt: now,
    lastUsedAt: null,
    status: "active",
    revokedAt: null,
  };

  const store = readStore();
  store.keys.unshift(record);
  writeStore(store);

  return { key: record, token };
}

export function revokeApiKeyForUser(userId: string, keyId: string): ApiKeyRecord | null {
  const store = readStore();
  const target = store.keys.find((key) => key.userId === userId && key.id === keyId);
  if (!target) {
    return null;
  }

  target.status = "revoked";
  target.revokedAt = new Date().toISOString();
  writeStore(store);
  return target;
}

export function verifyApiKeyToken(token: string): { userId: string } | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const nowMs = Date.now();
  const store = readStore();
  const key = store.keys.find((entry) => entry.keyHash === token);
  if (!key) {
    return null;
  }

  if (key.status !== "active") {
    return null;
  }

  const expiresAtMs = Date.parse(key.expires);
  if (Number.isFinite(expiresAtMs) && expiresAtMs < nowMs) {
    return null;
  }

  key.lastUsedAt = new Date(nowMs).toISOString();
  writeStore(store);
  return { userId: key.userId };
}
