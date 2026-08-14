import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { normalizeOrgId } from "../lib/auth/orgScope";
import type { ConnectorSyncLog } from "../lib/integrations/connectorSyncLogStore";
import { prisma } from "../lib/storage/prismaClient";
import { isPostgresRuntimeStore } from "../lib/storage/runtimeStoreBackend";

const repoRoot = process.cwd();
config({ path: path.join(repoRoot, ".env") });

const LOG_PATH = path.join(repoRoot, "data", "connector-sync-logs.json");

type MigrationSummary = {
  rowsImported: number;
  rowsSkipped: number;
  errors: string[];
};

function readLogFile(): ConnectorSyncLog[] {
  if (!existsSync(LOG_PATH)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(LOG_PATH, "utf8"));
    return Array.isArray(parsed) ? (parsed as ConnectorSyncLog[]) : [];
  } catch (error) {
    throw new Error(
      `Failed to read ${LOG_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function normalizeRow(raw: ConnectorSyncLog): ConnectorSyncLog | null {
  if (!raw?.id || !raw.userId || !raw.type) return null;
  const status = raw.status === "error" ? "error" : "success";
  return {
    id: raw.id,
    userId: raw.userId,
    orgId: normalizeOrgId(raw.orgId),
    type: raw.type,
    status,
    extractedCount:
      typeof raw.extractedCount === "number" && Number.isFinite(raw.extractedCount)
        ? raw.extractedCount
        : 0,
    contractCounts:
      raw.contractCounts && typeof raw.contractCounts === "object" ? raw.contractCounts : undefined,
    message: typeof raw.message === "string" ? raw.message : status === "error" ? "sync_failed" : "",
    at: typeof raw.at === "string" && raw.at.length > 0 ? raw.at : new Date().toISOString(),
  };
}

async function upsertLog(entry: ConnectorSyncLog): Promise<void> {
  const at = entry.at;
  const status = entry.status;
  const metadata: Record<string, unknown> = {};
  if (entry.contractCounts && Object.keys(entry.contractCounts).length > 0) {
    metadata.contractCounts = entry.contractCounts;
  }
  if (status === "success" && entry.message.trim()) {
    metadata.message = entry.message.trim();
  }

  await prisma.connectorSyncLog.upsert({
    where: { id: entry.id },
    create: {
      id: entry.id,
      userId: entry.userId,
      orgId: normalizeOrgId(entry.orgId) ?? null,
      connectorType: entry.type,
      status,
      startedAt: at,
      finishedAt: at,
      itemsSynced: entry.extractedCount,
      errorMessage: status === "error" ? entry.message.trim() || "sync_failed" : null,
      metadataJson: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
    },
    update: {
      userId: entry.userId,
      orgId: normalizeOrgId(entry.orgId) ?? null,
      connectorType: entry.type,
      status,
      startedAt: at,
      finishedAt: at,
      itemsSynced: entry.extractedCount,
      errorMessage: status === "error" ? entry.message.trim() || "sync_failed" : null,
      metadataJson: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
    },
  });
}

async function migrate(dryRun: boolean): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    rowsImported: 0,
    rowsSkipped: 0,
    errors: [],
  };

  const rows = readLogFile();
  if (rows.length === 0) {
    console.log(`No connector sync logs to import (${LOG_PATH} missing or empty).`);
    return summary;
  }

  console.log(
    `${dryRun ? "[dry-run] Would import" : "Importing"} ${rows.length} log row(s) from ${LOG_PATH}...`,
  );

  for (const raw of rows) {
    const entry = normalizeRow(raw);
    if (!entry) {
      summary.rowsSkipped += 1;
      summary.errors.push(`id ${raw?.id ?? "?"}: invalid row`);
      continue;
    }
    try {
      if (!dryRun) {
        await upsertLog(entry);
      }
      summary.rowsImported += 1;
    } catch (error) {
      summary.rowsSkipped += 1;
      summary.errors.push(
        `id ${entry.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}

function printSummary(summary: MigrationSummary, dryRun: boolean): void {
  console.log(`\n--- Connector sync logs JSON → Postgres migration${dryRun ? " (dry-run)" : ""} ---`);
  console.log(`Rows imported: ${summary.rowsImported}`);
  console.log(`Rows skipped:  ${summary.rowsSkipped}`);
  if (summary.errors.length > 0) {
    console.log(`Errors (${summary.errors.length}):`);
    for (const message of summary.errors) {
      console.log(`  - ${message}`);
    }
  } else {
    console.log("Errors: none");
  }
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set. Configure Postgres in .env before migrating.");
  }

  if (!isPostgresRuntimeStore() && !force) {
    throw new Error(
      "MEMORY_STORE_BACKEND is not postgres. Set MEMORY_STORE_BACKEND=postgres or pass --force.",
    );
  }

  if (force && !isPostgresRuntimeStore()) {
    console.warn("Running with --force despite MEMORY_STORE_BACKEND != postgres.");
  }

  await prisma.$connect();
  const summary = await migrate(dryRun);
  printSummary(summary, dryRun);

  if (summary.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
