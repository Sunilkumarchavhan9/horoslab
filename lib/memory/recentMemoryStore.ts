import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Memory } from "./types";
import { withFileLock } from "./jsonStoreLock";

const DATA_DIR = path.join(process.cwd(), "data");
const RECENT_MEMORY_STORE_PATH = path.join(DATA_DIR, "recent-memories.json");
const MAX_RECENT_MEMORIES_PER_USER = 20;

function ensureRecentMemoryStore(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(RECENT_MEMORY_STORE_PATH)) {
    writeFileSync(RECENT_MEMORY_STORE_PATH, "{}", "utf8");
  }
}

function readRecentMemoryStore(): Record<string, Memory[]> {
  ensureRecentMemoryStore();

  try {
    const raw = readFileSync(RECENT_MEMORY_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, Memory[]>)
      : {};
  } catch {
    return {};
  }
}

function writeRecentMemoryStore(store: Record<string, Memory[]>): void {
  ensureRecentMemoryStore();
  writeFileSync(
    RECENT_MEMORY_STORE_PATH,
    JSON.stringify(store, null, 2),
    "utf8",
  );
}

export function getRecentMemories(userId: string): Memory[] {
  const store = readRecentMemoryStore();
  return store[userId] ?? [];
}

export async  function upsertRecentMemory(memory: Memory): Promise<void> {
  await withFileLock(RECENT_MEMORY_STORE_PATH, async () => {
    const store = readRecentMemoryStore();
    const current = store[memory.userId] ?? [];
    const existingIndex = current.findIndex((item) => item.id === memory.id);

    let next: Memory[];

    if (existingIndex !== -1) {
      next = [...current];
      next[existingIndex] = memory;
    } else {
      next = [...current, memory];
    }

    store[memory.userId] = next.slice(-MAX_RECENT_MEMORIES_PER_USER);
    writeRecentMemoryStore(store);
  });
  
}

export function listRecentMemories(): Memory[] {
  const store = readRecentMemoryStore();
  return Object.values(store).flat();
}
