import type { RealityDecision } from "../../decisions/DecisionService";
import type { DecisionRepository } from "../DecisionRepository";

function cloneDecision(decision: RealityDecision): RealityDecision {
  return {
    ...decision,
    evidenceIds: [...decision.evidenceIds],
    impactIds: [...decision.impactIds],
  };
}

function buildSeedDecision(): RealityDecision {
  return {
    id: "decision-reality-fabric",
    subjectId: "reality-fabric",
    subjectType: "institution",
    outcome: "approve",
    reason: "Reality Fabric is the correct root aggregate for the backend runtime.",
    evidenceIds: ["event-reality-online"],
    impactIds: ["mission-runtime", "execution-runtime", "evidence-index"],
    confidence: 0.92,
    createdAt: "2026-07-27T00:00:00.000Z",
    createdBy: "system",
  };
}

export class InMemoryDecisionRepository implements DecisionRepository {
  private seedDecisions: RealityDecision[];

  private decisions: RealityDecision[];

  constructor(seedDecisions: RealityDecision[] = [buildSeedDecision()]) {
    this.seedDecisions = seedDecisions.map(cloneDecision);
    this.decisions = [];
    this.replace(seedDecisions);
  }

  replace(decisions: RealityDecision[]): void {
    this.seedDecisions = decisions.map(cloneDecision);
    this.decisions = decisions.map(cloneDecision);
  }

  reset(): void {
    this.decisions = this.seedDecisions.map(cloneDecision);
  }

  save(decision: RealityDecision): RealityDecision {
    const stored = cloneDecision(decision);
    this.decisions.unshift(stored);
    return cloneDecision(stored);
  }

  getById(decisionId: string): RealityDecision | null {
    const decision = this.decisions.find((entry) => entry.id === decisionId);
    return decision ? cloneDecision(decision) : null;
  }

  list(): RealityDecision[] {
    return this.decisions.map(cloneDecision);
  }
}

export function createMemoryDecisionRepository(): DecisionRepository {
  return new InMemoryDecisionRepository();
}
