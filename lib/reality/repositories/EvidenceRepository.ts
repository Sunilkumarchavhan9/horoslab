import type { RealityEvidence } from "../models/RealityTypes";

export interface EvidenceRepository {
  reset(): void;
  save(evidence: RealityEvidence): RealityEvidence;
  getById(evidenceId: string): RealityEvidence | null;
  list(): RealityEvidence[];
}
