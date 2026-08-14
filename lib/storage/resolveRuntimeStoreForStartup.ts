import { prisma } from "./prismaClient";
import {
  getRuntimeStoreBackend,
  type RuntimeStoreBackend,
} from "./runtimeStoreBackend";

function databaseTargetLabel(): string {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url) return "(DATABASE_URL not set)";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "5432"}`;
  } catch {
    return "configured DATABASE_URL";
  }
}

/**
 * Verify the Prisma/Postgres database is reachable before hydrating stores.
 * MemoryOS product runtime is Prisma/Postgres-only, so a missing database
 * fails loudly instead of silently writing local JSON or SQLite state.
 */
function isTruthyEnv(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

async function maybePushPrismaSchemaOnStartup(): Promise<void> {
  if (!isTruthyEnv(process.env.PRISMA_DB_PUSH_ON_START)) return;
  if (process.env.NODE_ENV === "production") return;

  const { execFileSync } = await import("node:child_process");
  const prismaCli = require.resolve("prisma/build/index.js");
  console.log("[MemoryOS] PRISMA_DB_PUSH_ON_START: syncing schema to Postgres");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--accept-data-loss", "--skip-generate"], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
}

export async function resolveRuntimeStoreForStartup(): Promise<RuntimeStoreBackend> {
  const configured = getRuntimeStoreBackend();

  try {
    await prisma.$connect();
    await maybePushPrismaSchemaOnStartup();
    return configured;
  } catch (error) {
    throw new Error(
      `Cannot reach Postgres at ${databaseTargetLabel()}. ` +
        "Start the database (docker compose up -d postgres) or fix DATABASE_URL. " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}
