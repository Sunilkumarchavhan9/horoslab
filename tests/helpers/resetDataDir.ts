import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const RUNTIME_STORE_FILES = [
  "recent-memories.json",
  "timeline-events.json",
  "revision-events.json",
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
