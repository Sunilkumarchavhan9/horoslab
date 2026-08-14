import type { RealityConnection } from "../connections/ConnectionService";

export interface ConnectionRepository {
  replace(connections: RealityConnection[]): void;
  reset(): void;
  save(connection: RealityConnection): RealityConnection;
  getById(connectionId: string): RealityConnection | null;
  findBySystem(system: string): RealityConnection | null;
  list(): RealityConnection[];
}
