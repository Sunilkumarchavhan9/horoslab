import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { prisma } from "../../lib/storage/prismaClient";

const DATA_DIR = path.join(process.cwd(), "data");
const RUNTIME_STORE_FILES = [
  "recent-memories.json",
  "memory-embeddings.json",
  "timeline-events.json",
  "realtime-events.json",
  "realtime-event-projections.json",
  "revision-events.json",
  "workflow-state.json",
  "memoryos.db",
  "memoryos.db-shm",
  "memoryos.db-wal",
];

export function resetRuntimeDataStores(): void {
  mkdirSync(DATA_DIR, { recursive: true });

  for (const fileName of RUNTIME_STORE_FILES) {
    const filePath = path.join(DATA_DIR, fileName);
    if (existsSync(filePath)) {
      rmSync(filePath, { force: true });
    }
  }
}

export async function resetPrismaRuntimeDataStores(): Promise<void> {
  await prisma.memoryEmbedding.deleteMany();
  await prisma.revisionEvent.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.recentMemory.deleteMany();
  await prisma.operationalArtifact.deleteMany();
  await prisma.connectorSyncLog.deleteMany();
  await prisma.experienceRecord.deleteMany();
}

export async function resetRuntimeDataStoresForTests(): Promise<void> {
  resetRuntimeDataStores();
  await resetPrismaRuntimeDataStores();
}
