import { randomUUID } from "node:crypto";
import type { DecisionRepository } from "../repositories/DecisionRepository";
import { createMemoryDecisionRepository } from "../repositories/memory/InMemoryDecisionRepository";

export type DecisionOutcome = "approve" | "reject" | "review" | "escalate";

export interface RealityDecision {
  id: string;
  subjectId: string;
  subjectType: string;
  outcome: DecisionOutcome;
  reason: string;
  evidenceIds: string[];
  impactIds: string[];
  confidence: number;
  createdAt: string;
  createdBy: string;
}

export interface DecisionDraft {
  subjectId: string;
  subjectType: string;
  evidenceIds?: string[];
  impactIds?: string[];
  reason: string;
  confidence?: number;
  createdBy?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function clampConfidence(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0.75;
  return Math.min(1, Math.max(0, value));
}

function cloneDecision(decision: RealityDecision): RealityDecision {
  return {
    ...decision,
    evidenceIds: [...decision.evidenceIds],
    impactIds: [...decision.impactIds],
  };
}

export class DecisionService {
  constructor(private readonly repository: DecisionRepository = createMemoryDecisionRepository()) {}

  reset(): void {
    this.repository.reset();
  }

  evaluate(input: DecisionDraft): RealityDecision {
    const reason = input.reason.trim();
    const outcome =
      input.evidenceIds && input.evidenceIds.length > 0
        ? input.impactIds && input.impactIds.length > 0
          ? "approve"
          : "review"
        : "escalate";
    const decision: RealityDecision = {
      id: `decision-${randomUUID()}`,
      subjectId: input.subjectId,
      subjectType: input.subjectType,
      outcome,
      reason,
      evidenceIds: [...(input.evidenceIds ?? [])],
      impactIds: [...(input.impactIds ?? [])],
      confidence: clampConfidence(input.confidence),
      createdAt: nowIso(),
      createdBy: input.createdBy?.trim() || "system",
    };
    return this.repository.save(decision);
  }

  record(input: DecisionDraft & { outcome: DecisionOutcome }): RealityDecision {
    const decision: RealityDecision = {
      id: `decision-${randomUUID()}`,
      subjectId: input.subjectId,
      subjectType: input.subjectType,
      outcome: input.outcome,
      reason: input.reason.trim(),
      evidenceIds: [...(input.evidenceIds ?? [])],
      impactIds: [...(input.impactIds ?? [])],
      confidence: clampConfidence(input.confidence),
      createdAt: nowIso(),
      createdBy: input.createdBy?.trim() || "system",
    };
    return this.repository.save(decision);
  }

  get(decisionId: string): RealityDecision | null {
    const decision = this.repository.getById(decisionId);
    return decision ? cloneDecision(decision) : null;
  }

  list(): RealityDecision[] {
    return this.repository.list().map(cloneDecision);
  }

  latest(): RealityDecision | null {
    return this.list()[0] ?? null;
  }

  summary(): {
    total: number;
    approve: number;
    reject: number;
    review: number;
    escalate: number;
  } {
    return this.list().reduce(
      (acc, decision) => {
        acc.total += 1;
        acc[decision.outcome] += 1;
        return acc;
      },
      { total: 0, approve: 0, reject: 0, review: 0, escalate: 0 },
    );
  }
}
