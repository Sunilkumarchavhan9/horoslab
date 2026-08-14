import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPrismaConnectorDatasourceWarning,
  hasPrismaCompatibleDatasourceUrl,
  hasPrismaConnectorDatasourceUrl,
} from "../lib/storage/prismaErrorUtils";
import {
  isPostgresRuntimeStore,
  isRelationalRuntimeStore,
} from "../lib/storage/runtimeStoreBackend";

describe("Prisma connector datasource compatibility", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts Prisma-compatible connector datasource URLs", () => {
    vi.stubEnv("DATABASE_URL", "prisma+postgres://connector.example");
    expect(hasPrismaCompatibleDatasourceUrl()).toBe(true);
    expect(hasPrismaConnectorDatasourceUrl()).toBe(true);
    expect(getPrismaConnectorDatasourceWarning()).toBeNull();
  });

  it("accepts standard Postgres URLs for connector Prisma reads", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/memoryos");
    expect(hasPrismaCompatibleDatasourceUrl()).toBe(true);
    expect(hasPrismaConnectorDatasourceUrl()).toBe(true);
    expect(getPrismaConnectorDatasourceWarning()).toBeNull();
  });

  it("routes runtime stores through Prisma when postgres is configured with a standard URL", () => {
    vi.stubEnv("MEMORY_STORE_BACKEND", "postgres");
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/memoryos");

    expect(isPostgresRuntimeStore()).toBe(true);
    expect(isRelationalRuntimeStore()).toBe(true);
  });

  it("flags a missing DATABASE_URL as unsupported", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(hasPrismaConnectorDatasourceUrl()).toBe(false);
    expect(getPrismaConnectorDatasourceWarning()).toContain("DATABASE_URL is not set");
  });

  it("keeps connector background schedulers inactive when datasource is unsupported", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const autoSync = await import("../lib/integrations/connectorAutoSyncScheduler");
    const liveWatcher = await import("../lib/integrations/engineeringSignalLiveWatcher");

    autoSync.stopConnectorAutoSyncScheduler();
    liveWatcher.stopEngineeringSignalLiveWatcher();

    const autoSyncStatus = autoSync.startConnectorAutoSyncScheduler();
    const liveWatcherStatus = liveWatcher.startEngineeringSignalLiveWatcher();

    expect(autoSyncStatus.active).toBe(false);
    expect(autoSyncStatus.nextSweepAt).toBeNull();
    expect(autoSyncStatus.lastError).toContain("DATABASE_URL is not set");
    expect(liveWatcherStatus.active).toBe(false);
    expect(liveWatcherStatus.nextSweepAt).toBeNull();
    expect(liveWatcherStatus.lastError).toContain("DATABASE_URL is not set");
  });
});
