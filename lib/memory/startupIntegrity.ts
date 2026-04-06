import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { isSqliteRuntimeStore } from "../storage/runtimeStoreBackend";
import { ensureRuntimeStoreDb } from "../storage/runtimeStoreDb";

const DATA_DIR = path.join(process.cwd(), "data");
const RECENT_MEMORY_STORE_PATH = path.join(DATA_DIR, "recent-memories.json");
const TIMELINE_STORE_PATH = path.join(DATA_DIR, "timeline-events.json");
const REVISION_STORE_PATH = path.join(DATA_DIR, "revision-events.json");

function writeJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function isObjectRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecentStoreShape(value: unknown): boolean {
  if (!isObjectRecord(value)) {
    return false;
  }

  return Object.values(value).every((entry) => Array.isArray(entry));
}

function ensureJsonFile(
  filePath: string,
  fallback: unknown,
  isValid: (value: unknown) => boolean,
): void {
  if (!existsSync(filePath)) {
    writeJson(filePath, fallback);
    return;
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!isValid(parsed)) {
      writeJson(filePath, fallback);
    }
  } catch {
    writeJson(filePath, fallback);
  }
}

export function ensureMemoryStoreIntegrity(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (isSqliteRuntimeStore()) {
    ensureRuntimeStoreDb();
    return;
  }

  ensureJsonFile(RECENT_MEMORY_STORE_PATH, {}, isRecentStoreShape);
  ensureJsonFile(TIMELINE_STORE_PATH, [], Array.isArray);
  ensureJsonFile(REVISION_STORE_PATH, [], Array.isArray);
}
