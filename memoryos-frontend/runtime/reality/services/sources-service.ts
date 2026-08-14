import type { RealityEntity } from '../entities/types';
import { listRealitySources } from '@/lib/reality-api';

function mapStatus(status: string): RealityEntity["status"] {
  if (status === "indexed" || status === "registered") return "healthy";
  if (status === "syncing") return "warning";
  if (status === "error") return "error";
  return "unknown";
}

export class SourcesService {
  async fetchSources(): Promise<RealityEntity[]> {
    const payload = await listRealitySources();
    const baseSources = payload.sources.map((source) => ({
      id: source.id,
      type: "source" as const,
      title: source.system,
      subtitle: source.state === "indexed" ? "Indexed and searchable" : "Awaiting sync",
      status: mapStatus(source.state),
      metadata: {
        documentsIndexed: source.documentsIndexed,
        lastSyncedAt: source.lastSyncedAt,
        indexedAt: source.indexedAt,
        ...source.metadata,
      },
    }));
    return baseSources;
  }
}

export const sourcesService = new SourcesService();
