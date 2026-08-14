import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { normalizeOrgId } from "../lib/auth/orgScope";
import {
  normalizeCompanyBrainExportRow,
  type CompanyBrainExportRecord,
} from "../lib/companyBrain/exportStore";
import { prisma } from "../lib/storage/prismaClient";
import { isPostgresRuntimeStore } from "../lib/storage/runtimeStoreBackend";

const repoRoot = process.cwd();
config({ path: path.join(repoRoot, ".env") });

const EXPORT_PATH = path.join(repoRoot, "data", "company-brain-exports.json");

type MigrationSummary = {
  rowsImported: number;
  rowsSkipped: number;
  errors: string[];
};

function readExportFile(): Partial<CompanyBrainExportRecord>[] {
  if (!existsSync(EXPORT_PATH)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(EXPORT_PATH, "utf8"));
    return Array.isArray(parsed) ? (parsed as Partial<CompanyBrainExportRecord>[]) : [];
  } catch (error) {
    throw new Error(
      `Failed to read ${EXPORT_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function upsertExport(record: CompanyBrainExportRecord): Promise<void> {
  await prisma.companyBrainExport.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      userId: record.userId,
      orgId: normalizeOrgId(record.orgId) ?? null,
      workspace: record.workspace,
      format: record.format ?? "skills_markdown",
      status: record.status ?? "completed",
      generatedAt: record.generatedAt,
      dataJson: JSON.stringify({
        stats: record.stats,
        skillsMarkdown: record.skillsMarkdown,
      }),
    },
    update: {
      userId: record.userId,
      orgId: normalizeOrgId(record.orgId) ?? null,
      workspace: record.workspace,
      format: record.format ?? "skills_markdown",
      status: record.status ?? "completed",
      generatedAt: record.generatedAt,
      dataJson: JSON.stringify({
        stats: record.stats,
        skillsMarkdown: record.skillsMarkdown,
      }),
    },
  });
}

async function migrate(dryRun: boolean, defaultUserId?: string): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    rowsImported: 0,
    rowsSkipped: 0,
    errors: [],
  };

  const rows = readExportFile();
  if (rows.length === 0) {
    console.log(`No Company Brain exports to import (${EXPORT_PATH} missing or empty).`);
    return summary;
  }

  console.log(
    `${dryRun ? "[dry-run] Would import" : "Importing"} ${rows.length} export row(s) from ${EXPORT_PATH}...`,
  );

  for (const raw of rows) {
    const record = normalizeCompanyBrainExportRow(raw, defaultUserId);
    if (!record) {
      summary.rowsSkipped += 1;
      const hint = defaultUserId
        ? "invalid row"
        : "invalid row (legacy rows lack userId; pass --default-user-id <id>)";
      summary.errors.push(`id ${raw?.id ?? "?"}: ${hint}`);
      continue;
    }
    try {
      if (!dryRun) {
        await upsertExport(record);
      }
      summary.rowsImported += 1;
    } catch (error) {
      summary.rowsSkipped += 1;
      summary.errors.push(
        `id ${record.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}

function readDefaultUserIdArg(): string | undefined {
  const index = process.argv.indexOf("--default-user-id");
  if (index < 0) return undefined;
  const value = process.argv[index + 1]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function printSummary(summary: MigrationSummary, dryRun: boolean): void {
  console.log(
    `\n--- Company Brain exports JSON → Postgres migration${dryRun ? " (dry-run)" : ""} ---`,
  );
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
  const defaultUserId = readDefaultUserIdArg();

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
  const summary = await migrate(dryRun, defaultUserId);
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
