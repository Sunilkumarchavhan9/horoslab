import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type BenchmarkScenario = {
  id: string;
  name: string;
  mode: "local" | "preview" | "production";
  caseIds: string[];
  createdAt: string;
  updatedAt: string;
};

type ScenarioStore = {
  scenarios: BenchmarkScenario[];
};

const DATA_DIR = path.join(process.cwd(), "data", "eval");
const STORE_PATH = path.join(DATA_DIR, "benchmark-scenarios.json");

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): ScenarioStore {
  ensureDir();
  if (!existsSync(STORE_PATH)) {
    return { scenarios: [] };
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as ScenarioStore;
    return Array.isArray(parsed.scenarios) ? parsed : { scenarios: [] };
  } catch {
    return { scenarios: [] };
  }
}

function writeStore(store: ScenarioStore): void {
  ensureDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function listBenchmarkScenarios(): BenchmarkScenario[] {
  return readStore().scenarios.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getBenchmarkScenario(id: string): BenchmarkScenario | null {
  return readStore().scenarios.find((s) => s.id === id) ?? null;
}

export function upsertBenchmarkScenario(input: {
  id?: string;
  name: string;
  mode: "local" | "preview" | "production";
  caseIds: string[];
}): BenchmarkScenario {
  const now = new Date().toISOString();
  const store = readStore();
  const existingIndex =
    input.id ? store.scenarios.findIndex((s) => s.id === input.id) : -1;

  if (existingIndex >= 0) {
    const updated: BenchmarkScenario = {
      ...store.scenarios[existingIndex],
      name: input.name,
      mode: input.mode,
      caseIds: input.caseIds,
      updatedAt: now,
    };
    store.scenarios[existingIndex] = updated;
    writeStore(store);
    return updated;
  }

  const created: BenchmarkScenario = {
    id: input.id ?? `scenario_${randomUUID().slice(0, 8)}`,
    name: input.name,
    mode: input.mode,
    caseIds: input.caseIds,
    createdAt: now,
    updatedAt: now,
  };
  store.scenarios.push(created);
  writeStore(store);
  return created;
}

