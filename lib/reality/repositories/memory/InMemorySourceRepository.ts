import { randomUUID } from "node:crypto";
import type { RealitySource } from "../../sources/SourceService";
import type { SourceRepository } from "../SourceRepository";

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

export class InMemorySourceRepository implements SourceRepository {
  private seedSources: RealitySource[];

  private sources: Map<string, RealitySource>;

  constructor(
    seedSources: RealitySource[] = [
      seedSource("github", { connector: "github", content: "repositories, pull requests, issues" }),
      seedSource("slack", { connector: "slack", content: "channels, messages, workflows" }),
      seedSource("jira", { connector: "jira", content: "tickets, epics, workflows" }),
      seedSource("drive", { connector: "google_drive", content: "docs, notes, attachments" }),
      seedSource("confluence", { connector: "confluence", content: "pages, knowledge base" }),
    ],
  ) {
    this.seedSources = seedSources.map(cloneSource);
    this.sources = new Map();
    this.replace(seedSources);
  }

  replace(sources: RealitySource[]): void {
    this.seedSources = sources.map(cloneSource);
    this.sources = new Map(sources.map((source) => [source.id, cloneSource(source)]));
  }

  reset(): void {
    this.sources = new Map(this.seedSources.map((source) => [source.id, cloneSource(source)]));
  }

  save(source: RealitySource): RealitySource {
    const stored = cloneSource(source);
    this.sources.set(stored.id, stored);
    return cloneSource(stored);
  }

  getById(sourceId: string): RealitySource | null {
    const source = this.sources.get(sourceId);
    return source ? cloneSource(source) : null;
  }

  findBySystem(system: string): RealitySource | null {
    const source = [...this.sources.values()].find((entry) => entry.system === system);
    return source ? cloneSource(source) : null;
  }

  list(): RealitySource[] {
    return [...this.sources.values()].map(cloneSource);
  }
}

export function createMemorySourceRepository(): SourceRepository {
  return new InMemorySourceRepository();
}
