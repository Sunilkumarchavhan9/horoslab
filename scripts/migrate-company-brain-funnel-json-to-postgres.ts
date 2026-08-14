import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";
import {
  defaultCompanyBrainFunnelProgress,
  type CompanyBrainFunnelProgress,
} from "../lib/companyBrain/funnelStore";
import { companyBrainPlatformOrgId } from "../lib/auth/orgScope";
import { prisma } from "../lib/storage/prismaClient";
import { isPostgresRuntimeStore } from "../lib/storage/runtimeStoreBackend";

const repoRoot = process.cwd();
config({ path: path.join(repoRoot, ".env") });

const FUNNEL_PATH = path.join(repoRoot, "data", "company-brain-funnel.json");

type JsonStore = {
  byUser: Record<string, CompanyBrainFunnelProgress>;
};

type MigrationSummary = {
  rowsImported: number;
  rowsSkipped: number;
  errors: string[];
};

function readFunnelFile(): JsonStore {
  if (!existsSync(FUNNEL_PATH)) {
    return { byUser: {} };
  }
  try {
    const parsed = JSON.parse(readFileSync(FUNNEL_PATH, "utf8")) as Partial<JsonStore>;
    return {
      byUser: parsed.byUser && typeof parsed.byUser === "object" ? parsed.byUser : {},
    };
  } catch (error) {
    throw new Error(
      `Failed to read ${FUNNEL_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function parseUserKey(key: string): { userId: string; orgId: string } {
  const splitAt = key.indexOf("::");
  if (splitAt < 0) {
    return { userId: key, orgId: companyBrainPlatformOrgId(undefined) };
  }
  return {
    userId: key.slice(0, splitAt),
    orgId: companyBrainPlatformOrgId(key.slice(splitAt + 2)),
  };
}

function normalizeProgress(
  key: string,
  raw: Partial<CompanyBrainFunnelProgress>,
): CompanyBrainFunnelProgress | null {
  const { userId } = parseUserKey(key);
  if (!userId) return null;
  const base = defaultCompanyBrainFunnelProgress(userId);
  return {
    ...base,
    ...raw,
    userId,
    connectGithub: Boolean(raw.connectGithub ?? base.connectGithub),
    syncGithub: Boolean(raw.syncGithub ?? base.syncGithub),
    briefLoaded: Boolean(raw.briefLoaded ?? base.briefLoaded),
    labOpened: Boolean(raw.labOpened ?? base.labOpened),
    dismissed: Boolean(raw.dismissed ?? base.dismissed),
    contractCountsByCategory:
      raw.contractCountsByCategory && typeof raw.contractCountsByCategory === "object"
        ? (raw.contractCountsByCategory as Record<string, number>)
        : base.contractCountsByCategory,
    lastSyncSource:
      typeof raw.lastSyncSource === "string" && raw.lastSyncSource.length > 0
        ? raw.lastSyncSource
        : base.lastSyncSource,
    lastSyncAt:
      typeof raw.lastSyncAt === "string" && raw.lastSyncAt.length > 0
        ? raw.lastSyncAt
        : base.lastSyncAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
  };
}

async function upsertProgress(userId: string, orgId: string, progress: CompanyBrainFunnelProgress): Promise<void> {
  await prisma.companyBrainFunnel.upsert({
    where: { userId_orgId: { userId, orgId } },
    create: {
      userId,
      orgId,
      updatedAt: progress.updatedAt,
      dataJson: JSON.stringify(progress),
    },
    update: {
      updatedAt: progress.updatedAt,
      dataJson: JSON.stringify(progress),
    },
  });
}

async function migrate(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    rowsImported: 0,
    rowsSkipped: 0,
    errors: [],
  };

  const store = readFunnelFile();
  const keys = Object.keys(store.byUser);
  if (keys.length === 0) {
    console.log(`No funnel rows to import (${FUNNEL_PATH} missing or empty).`);
    return summary;
  }

  console.log(`Importing ${keys.length} funnel row(s) from ${FUNNEL_PATH}...`);

  for (const key of keys) {
    const progress = normalizeProgress(key, store.byUser[key]);
    if (!progress) {
      summary.rowsSkipped += 1;
      summary.errors.push(`key ${key}: invalid progress`);
      continue;
    }
    const { userId, orgId } = parseUserKey(key);
    try {
      await upsertProgress(userId, orgId, progress);
      summary.rowsImported += 1;
    } catch (error) {
      summary.rowsSkipped += 1;
      summary.errors.push(
        `key ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}

function printSummary(summary: MigrationSummary): void {
  console.log("\n--- Company Brain funnel JSON → Postgres migration ---");
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
  const summary = await migrate();
  printSummary(summary);

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
