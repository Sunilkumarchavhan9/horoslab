import { randomUUID } from "node:crypto";
import type { SourceRepository } from "../repositories/SourceRepository";
import { createMemorySourceRepository } from "../repositories/memory/InMemorySourceRepository";

export type SourceState = "registered" | "syncing" | "indexed" | "error" | "archived";

export interface RealitySource {
  id: string;
  system: string;
  state: SourceState;
  indexedAt: string | null;
  lastSyncedAt: string | null;
  documentsIndexed: number;
  metadata: Record<string, unknown>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneSource(source: RealitySource): RealitySource {
  return {
    ...source,
    metadata: { ...source.metadata },
  };
}

function seedSource(system: string, metadata: Record<string, unknown> = {}): RealitySource {
  const seedId = randomUUID().slice(0, 8);
  return {
    id: `source-${system.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${seedId}`,
    system,
    state: "indexed",
    indexedAt: "2026-07-27T00:00:00.000Z",
    lastSyncedAt: "2026-07-27T00:00:00.000Z",
    documentsIndexed: 1,
    metadata,
  };
}

export class SourceService {
  constructor(private readonly repository: SourceRepository = createMemorySourceRepository()) {}

  reset(): void {
    this.repository.reset();
  }

  register(system: string, metadata: Record<string, unknown> = {}): RealitySource {
    const existing = this.repository.findBySystem(system);
    if (existing) {
      const updated: RealitySource = {
        ...existing,
        state: "registered",
        lastSyncedAt: nowIso(),
        metadata: { ...existing.metadata, ...metadata },
      };
      return this.repository.save(updated);
    }

    return this.repository.save({
      ...seedSource(system, metadata),
      state: "registered",
      indexedAt: null,
      lastSyncedAt: null,
      documentsIndexed: 0,
    });
  }

  sync(sourceId: string): RealitySource | null {
    const existing = this.repository.getById(sourceId);
    if (!existing) return null;
    return this.repository.save({
      ...existing,
      state: "registered",
      lastSyncedAt: nowIso(),
    });
  }

  index(sourceId: string, documentsIndexed = 1): RealitySource | null {
    const existing = this.repository.getById(sourceId);
    if (!existing) return null;
    return this.repository.save({
      ...existing,
      state: "indexed",
      indexedAt: nowIso(),
      lastSyncedAt: nowIso(),
      documentsIndexed: Math.max(0, existing.documentsIndexed + Math.max(0, Math.floor(documentsIndexed))),
    });
  }

  status(sourceId: string): RealitySource | null {
    const source = this.repository.getById(sourceId);
    return source ? cloneSource(source) : null;
  }

  list(): RealitySource[] {
    return this.repository.list().map(cloneSource);
  }

  summary(): {
    total: number;
    registered: number;
    syncing: number;
    indexed: number;
    error: number;
  } {
    const sources = this.list();
    return {
      total: sources.length,
      registered: sources.filter((source) => source.state === "registered").length,
      syncing: sources.filter((source) => source.state === "syncing").length,
      indexed: sources.filter((source) => source.state === "indexed").length,
      error: sources.filter((source) => source.state === "error").length,
    };
  }
}
