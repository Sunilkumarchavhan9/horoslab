/**
 * Backfill Connector.orgId (and org-scoped ids) from Company Brain platform state.
 *
 * Usage (dev server stopped):
 *   npx tsx scripts/migrate-connector-org-from-default.ts
 *   npx tsx scripts/migrate-connector-org-from-default.ts --dry-run
 */
import { config } from "dotenv";
import path from "path";
import { connectorStorageId, normalizeOrgId } from "../lib/auth/orgScope";
import { prisma } from "../lib/storage/prismaClient";

const repoRoot = process.cwd();
config({ path: path.join(repoRoot, ".env") });

const dryRun = process.argv.includes("--dry-run");

type MigrationStats = {
  scanned: number;
  skipped: number;
  updated: number;
  reIded: number;
  errors: string[];
};

async function resolveOrgIdForUser(userId: string): Promise<string | undefined> {
  const envDefault = normalizeOrgId(process.env.MEMORYOS_MIGRATE_DEFAULT_ORG_ID);
  if (envDefault) return envDefault;

  const platformRows = await prisma.companyBrainPlatformState.findMany({
    where: { userId },
    select: { orgId: true },
    orderBy: { updatedAt: "desc" },
  });
  const orgIds = platformRows
    .map((row) => normalizeOrgId(row.orgId))
    .filter((value): value is string => Boolean(value));
  if (orgIds.length === 1) return orgIds[0];
  if (orgIds.length > 1) return orgIds[0];
  return undefined;
}

async function main(): Promise<void> {
  const stats: MigrationStats = {
    scanned: 0,
    skipped: 0,
    updated: 0,
    reIded: 0,
    errors: [],
  };

  const connectors = await prisma.connector.findMany({
    where: { orgId: null },
  });

  for (const row of connectors) {
    stats.scanned += 1;
    const orgId = await resolveOrgIdForUser(row.userId);
    if (!orgId) {
      stats.skipped += 1;
      continue;
    }

    const targetId = connectorStorageId(row.userId, row.type, orgId);
    try {
      if (dryRun) {
        if (targetId !== row.id) stats.reIded += 1;
        else stats.updated += 1;
        continue;
      }

      if (targetId === row.id) {
        await prisma.connector.update({
          where: { id: row.id },
          data: { orgId },
        });
        stats.updated += 1;
        continue;
      }

      const conflict = await prisma.connector.findUnique({ where: { id: targetId } });
      if (conflict) {
        stats.errors.push(
          `Conflict: cannot re-id ${row.id} → ${targetId} (target exists for user=${row.userId} type=${row.type})`,
        );
        continue;
      }

      await prisma.$transaction([
        prisma.connector.create({
          data: {
            ...row,
            id: targetId,
            orgId,
            createdAt: row.createdAt,
            updatedAt: new Date(),
          },
        }),
        prisma.connector.delete({ where: { id: row.id } }),
      ]);
      stats.reIded += 1;
      stats.updated += 1;
    } catch (error) {
      stats.errors.push(
        `${row.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        ...stats,
      },
      null,
      2,
    ),
  );

  if (stats.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
