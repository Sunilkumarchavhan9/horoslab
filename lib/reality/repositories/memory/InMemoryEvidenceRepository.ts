import type { RealityEvidence } from "../../models/RealityTypes";
import type { EvidenceRepository } from "../EvidenceRepository";

function cloneEvidence(evidence: RealityEvidence): RealityEvidence {
  return {
    ...evidence,
    metadata: { ...evidence.metadata },
  };
}

export class InMemoryEvidenceRepository implements EvidenceRepository {
  private readonly records = new Map<string, RealityEvidence>();

  reset(): void {
    this.records.clear();
  }

  save(evidence: RealityEvidence): RealityEvidence {
    const stored = cloneEvidence(evidence);
    this.records.set(stored.id, stored);
    return cloneEvidence(stored);
  }

  getById(evidenceId: string): RealityEvidence | null {
    const evidence = this.records.get(evidenceId);
    return evidence ? cloneEvidence(evidence) : null;
  }

  list(): RealityEvidence[] {
    return [...this.records.values()].map(cloneEvidence).sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }
}

export function createMemoryEvidenceRepository(): EvidenceRepository {
  return new InMemoryEvidenceRepository();
}
