import type { RealitySource } from "../sources/SourceService";

export interface SourceRepository {
  replace(sources: RealitySource[]): void;
  reset(): void;
  save(source: RealitySource): RealitySource;
  getById(sourceId: string): RealitySource | null;
  findBySystem(system: string): RealitySource | null;
  list(): RealitySource[];
}
