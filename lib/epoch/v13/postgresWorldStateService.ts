import { Client } from "pg";
import { prisma } from "../../storage/prismaClient";
import { toWorldStateV1 } from "./controlPlane";
import { resolveSoftwareWorldStateScope, type WorldStateScope, WorldStateBoundaryError } from "./softwareWorldStateService";
import type { WorldStateV1 } from "./contracts";

type TableRecord = { table_schema: string; table_name: string; table_type: string };
type ColumnRecord = { table_schema: string; table_name: string; column_name: string; data_type: string; is_nullable: string };

function connectionString(envVar: string) {
  if (!/^EPOCH_V13_POSTGRES_[A-Z0-9_]+$/.test(envVar)) {
    throw new WorldStateBoundaryError("PostgreSQL connection must use an EPOCH_V13_POSTGRES_* environment variable");
  }
  const value = process.env[envVar]?.trim();
  if (!value) throw new WorldStateBoundaryError(`PostgreSQL connection variable ${envVar} is not configured`);
  if (!value.startsWith("postgres://") && !value.startsWith("postgresql://")) {
    throw new WorldStateBoundaryError("PostgreSQL connection must use a postgres:// or postgresql:// URL");
  }
  return value;
}

function correlation(scope: WorldStateScope) {
  return { correlationId: scope.correlationId, traceId: scope.traceId };
}

function freshness(observedAt: Date): WorldStateV1["freshness"] {
  return Date.now() - observedAt.getTime() <= 15 * 60 * 1000 ? "fresh" : "stale";
}

export async function discoverEpochPostgresWorldState(
  scope: WorldStateScope,
  input: { projectId: string; environmentId: string; connectionEnvVar: string },
) {
  await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId);
  const client = new Client({
    connectionString: connectionString(input.connectionEnvVar),
    connectionTimeoutMillis: 5_000,
    statement_timeout: 5_000,
    query_timeout: 5_000,
  });
  try {
    await client.connect();
    const [databaseResult, tablesResult, columnsResult] = await Promise.all([
      client.query<{ database: string; user: string; server_version: string }>("SELECT current_database() AS database, current_user AS user, current_setting('server_version') AS server_version"),
      client.query<TableRecord>("SELECT table_schema, table_name, table_type FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name LIMIT 500"),
      client.query<ColumnRecord>("SELECT table_schema, table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name, ordinal_position LIMIT 2000"),
    ]);
    const observedAt = new Date();
    const snapshot = {
      adapter: "postgres",
      database: databaseResult.rows[0]?.database ?? null,
      serverVersion: databaseResult.rows[0]?.server_version ?? null,
      authenticatedRole: databaseResult.rows[0]?.user ?? null,
      tables: tablesResult.rows,
      columns: columnsResult.rows,
      tableCount: tablesResult.rowCount ?? tablesResult.rows.length,
      capturedAt: observedAt.toISOString(),
    };
    const source = await prisma.epochIntegrationConnection.findFirst({
      where: { workspaceId: scope.workspaceId, environmentId: input.environmentId, provider: { in: ["postgres", "postgresql"] }, status: { in: ["connected", "syncing", "error"] } },
      select: { id: true },
    });
    const latest = await prisma.epochWorldState.findFirst({
      where: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const record = await prisma.epochWorldState.create({
      data: {
        workspaceId: scope.workspaceId,
        projectId: input.projectId,
        environmentId: input.environmentId,
        version: (latest?.version ?? 0) + 1,
        snapshot,
        sourceIds: source ? [source.id] : [],
        freshness: "fresh",
        correlationId: scope.correlationId,
        traceId: scope.traceId,
        observedAt,
      },
    });
    return toWorldStateV1({
      id: record.id,
      workspaceId: record.workspaceId,
      environment: "software",
      version: record.version,
      snapshot,
      sourceIds: source ? [source.id] : [],
      freshness: freshness(record.observedAt),
      observedAt: record.observedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      correlation: correlation(scope),
    });
  } finally {
    await client.end().catch(() => undefined);
  }
}
