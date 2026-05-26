import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export type CompanyBrainFunnelProgress = {
  userId: string;
  connectGithub: boolean;
  syncGithub: boolean;
  briefLoaded: boolean;
  labOpened: boolean;
  dismissed: boolean;
  updatedAt: string;
};

type Store = {
  byUser: Record<string, CompanyBrainFunnelProgress>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "company-brain-funnel.json");

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readStore(): Store {
  ensureDir();
  if (!existsSync(STORE_PATH)) return { byUser: {} };
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<Store>;
    return { byUser: parsed.byUser && typeof parsed.byUser === "object" ? parsed.byUser : {} };
  } catch {
    return { byUser: {} };
  }
}

function writeStore(store: Store): void {
  ensureDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function defaultProgress(userId: string): CompanyBrainFunnelProgress {
  return {
    userId,
    connectGithub: false,
    syncGithub: false,
    briefLoaded: false,
    labOpened: false,
    dismissed: false,
    updatedAt: new Date().toISOString(),
  };
}

export function getCompanyBrainFunnelProgress(userId: string): CompanyBrainFunnelProgress {
  const store = readStore();
  return store.byUser[userId] ?? defaultProgress(userId);
}

export function patchCompanyBrainFunnelProgress(
  userId: string,
  patch: Partial<Omit<CompanyBrainFunnelProgress, "userId" | "updatedAt">>,
): CompanyBrainFunnelProgress {
  const store = readStore();
  const current = store.byUser[userId] ?? defaultProgress(userId);
  const next: CompanyBrainFunnelProgress = {
    ...current,
    ...patch,
    userId,
    updatedAt: new Date().toISOString(),
  };
  store.byUser[userId] = next;
  writeStore(store);
  return next;
}
