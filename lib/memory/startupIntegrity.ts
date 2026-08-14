import { ensureRuntimeStoreDb } from "../storage/runtimeStoreDb";

export function ensureMemoryStoreIntegrity(): void {
  void ensureRuntimeStoreDb();
}
