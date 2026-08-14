import type { RealityDecision } from "../decisions/DecisionService";

export interface DecisionRepository {
  replace(decisions: RealityDecision[]): void;
  reset(): void;
  save(decision: RealityDecision): RealityDecision;
  getById(decisionId: string): RealityDecision | null;
  list(): RealityDecision[];
}
