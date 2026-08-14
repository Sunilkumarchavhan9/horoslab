import type { RealityEntity } from '../entities/types';
import {
  dedupeCompanySourcesForDisplay,
  isLiveCompanySource,
  listSources,
} from '@/lib/company-sources-api';

function mapStatus(status: string): RealityEntity["status"] {
  if (status === "connected" || status === "synced" || status === "healthy" || status === "indexed") return "healthy";
  if (status === "syncing") return "warning";
  if (status === "error" || status === "disconnected") return "error";
  return "unknown";
}

export class ConnectionsService {
  async fetchConnections(): Promise<RealityEntity[]> {
    const liveSources = dedupeCompanySourcesForDisplay(await listSources())
      .filter((source) => isLiveCompanySource(source));
    const sources = Array.from(new Map(
      liveSources.map((source) => [
        (source.provider || source.providerName || source.type || source.id).trim().toLowerCase(),
        source,
      ]),
    ).values());

    return sources.map((source) => ({
      id: source.id,
      type: "connection",
      title: source.providerName ?? source.provider ?? source.type,
      subtitle: source.lastSyncedAt
        ? `Synced ${new Date(source.lastSyncedAt).toLocaleString()}`
        : "Awaiting first sync",
      status: mapStatus(source.status),
      metadata: {
        provider: source.provider,
        sourceType: source.type,
        lastSyncedAt: source.lastSyncedAt,
        volume: typeof source.itemCount === "number" ? String(source.itemCount) : "—",
      },
    }));
  }
}

export const connectionsService = new ConnectionsService();
