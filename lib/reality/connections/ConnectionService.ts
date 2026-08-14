import { randomUUID } from "node:crypto";
import type { ConnectionRepository } from "../repositories/ConnectionRepository";
import { createMemoryConnectionRepository } from "../repositories/memory/InMemoryConnectionRepository";

export type ConnectionState = "connected" | "disconnected" | "syncing" | "error";

export interface RealityConnection {
  id: string;
  system: string;
  state: ConnectionState;
  lastSyncedAt: string | null;
  healthy: boolean;
  metadata: Record<string, unknown>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneConnection(connection: RealityConnection): RealityConnection {
  return {
    ...connection,
    metadata: { ...connection.metadata },
  };
}

function seedConnection(system: string, metadata: Record<string, unknown> = {}): RealityConnection {
  return {
    id: `connection-${system.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomUUID().slice(0, 8)}`,
    system,
    state: "connected",
    lastSyncedAt: "2026-07-27T00:00:00.000Z",
    healthy: true,
    metadata,
  };
}

export class ConnectionService {
  constructor(
    private readonly repository: ConnectionRepository = createMemoryConnectionRepository(),
  ) {}

  reset(): void {
    this.repository.reset();
  }

  connectSystem(system: string, metadata: Record<string, unknown> = {}): RealityConnection {
    const existing = this.repository.findBySystem(system);
    if (existing) {
      const updated: RealityConnection = {
        ...existing,
        state: "connected",
        healthy: true,
        lastSyncedAt: nowIso(),
        metadata: { ...existing.metadata, ...metadata },
      };
      return this.repository.save(updated);
    }

    return this.repository.save({
      ...seedConnection(system, metadata),
      lastSyncedAt: nowIso(),
    });
  }

  disconnect(connectionId: string): boolean {
    const existing = this.repository.getById(connectionId);
    if (!existing) return false;
    this.repository.save({
      ...existing,
      state: "disconnected",
      healthy: false,
      lastSyncedAt: nowIso(),
    });
    return true;
  }

  sync(connectionId: string): RealityConnection | null {
    const existing = this.repository.getById(connectionId);
    if (!existing) return null;
    const syncing: RealityConnection = {
      ...existing,
      state: "syncing",
      lastSyncedAt: nowIso(),
    };
    return this.repository.save({
      ...syncing,
      state: "connected",
      healthy: true,
      lastSyncedAt: nowIso(),
    });
  }

  health(connectionId: string): RealityConnection | null {
    const connection = this.repository.getById(connectionId);
    return connection ? cloneConnection(connection) : null;
  }

  list(): RealityConnection[] {
    return this.repository.list().map(cloneConnection);
  }

  summary(): {
    total: number;
    connected: number;
    disconnected: number;
    healthy: number;
    unhealthy: number;
  } {
    const connections = this.list();
    return {
      total: connections.length,
      connected: connections.filter((connection) => connection.state === "connected").length,
      disconnected: connections.filter((connection) => connection.state === "disconnected").length,
      healthy: connections.filter((connection) => connection.healthy).length,
      unhealthy: connections.filter((connection) => !connection.healthy).length,
    };
  }
}
