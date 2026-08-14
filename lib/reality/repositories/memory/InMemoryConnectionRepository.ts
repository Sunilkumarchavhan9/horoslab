import { randomUUID } from "node:crypto";
import type { RealityConnection } from "../../connections/ConnectionService";
import type { ConnectionRepository } from "../ConnectionRepository";

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

export class InMemoryConnectionRepository implements ConnectionRepository {
  private seedConnections: RealityConnection[];

  private connections: Map<string, RealityConnection>;

  constructor(
    seedConnections: RealityConnection[] = [
      seedConnection("github", { provider: "github" }),
      seedConnection("slack", { provider: "slack" }),
      seedConnection("jira", { provider: "jira" }),
      seedConnection("drive", { provider: "google_drive" }),
      seedConnection("stripe", { provider: "stripe" }),
      seedConnection("openai", { provider: "openai" }),
      seedConnection("aws", { provider: "aws" }),
    ],
  ) {
    this.seedConnections = seedConnections.map(cloneConnection);
    this.connections = new Map();
    this.replace(seedConnections);
  }

  replace(connections: RealityConnection[]): void {
    this.seedConnections = connections.map(cloneConnection);
    this.connections = new Map(connections.map((connection) => [connection.id, cloneConnection(connection)]));
  }

  reset(): void {
    this.connections = new Map(
      this.seedConnections.map((connection) => [connection.id, cloneConnection(connection)]),
    );
  }

  save(connection: RealityConnection): RealityConnection {
    const stored = cloneConnection(connection);
    this.connections.set(stored.id, stored);
    return cloneConnection(stored);
  }

  getById(connectionId: string): RealityConnection | null {
    const connection = this.connections.get(connectionId);
    return connection ? cloneConnection(connection) : null;
  }

  findBySystem(system: string): RealityConnection | null {
    const connection = [...this.connections.values()].find((entry) => entry.system === system);
    return connection ? cloneConnection(connection) : null;
  }

  list(): RealityConnection[] {
    return [...this.connections.values()].map(cloneConnection);
  }
}

export function createMemoryConnectionRepository(): ConnectionRepository {
  return new InMemoryConnectionRepository();
}
