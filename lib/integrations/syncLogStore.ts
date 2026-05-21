import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_PATH = path.join(DATA_DIR, "connector-sync-logs.json");

export type ConnectorSyncLog = {
  id: string;
  userId: string;
  type: string;
  status: "success" | "error";
  extractedCount: number;
  contractCounts?: Record<string, number>;
  message: string;
  at: string;
};

function readLogs(): ConnectorSyncLog[] {
  if (!existsSync(LOG_PATH)) return [];
  try {
    const raw = readFileSync(LOG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConnectorSyncLog[]) : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: ConnectorSyncLog[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2), "utf8");
}

export function appendConnectorSyncLog(entry: ConnectorSyncLog): void {
  const next = [entry, ...readLogs()].slice(0, 200);
  writeLogs(next);
}

export function listConnectorSyncLogs(userId: string): ConnectorSyncLog[] {
  return readLogs().filter((entry) => entry.userId === userId).slice(0, 50);
}

