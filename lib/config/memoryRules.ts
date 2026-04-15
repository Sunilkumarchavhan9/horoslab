import type { MemoryType } from "../memory/types";

export type RetrievalIntent =
  | "build_next"
  | "stack_fit"
  | "study_next"
  | "resume_project"
  | "handoff"
  | "decision_recall"
  | "bug_recall"
  | "backend_fit"
  | "general";

export interface RetrievalWeights {
  semantic: number;
  typeRelevance: number;
  importance: number;
  recency: number;
}

export const MEMORY_RULES = {
  scoring: {
    acceptThreshold: 0.65,
    typeBaseWeight: {
      profile: 0.45,
      preference: 0.55,
      learning: 0.58,
      project: 0.6,
      episodic: 0.5,
    } as Record<MemoryType, number>,
    lowValuePenalty: 0.25,
    repetitionBumpPerRepeat: 0.04,
    repetitionBumpMax: 0.12,
    confidenceBase: 0.55,
    confidenceMultiplier: 0.4,
  },
  merge: {
    similarityThreshold: 0.55,
  },
  evolve: {
    minImportanceDelta: 0.02,
    minConfidenceDelta: 0.02,
  },
  retrieval: {
    weights: {
      semantic: 0.4,
      typeRelevance: 0.25,
      importance: 0.2,
      recency: 0.15,
    } as RetrievalWeights,
    intentTypeBoosts: {
      build_next: {
        project: 0.18,
        learning: 0.1,
        profile: 0.06,
      },
      stack_fit: {
        preference: 0.2,
        project: 0.08,
        learning: 0.05,
      },
      study_next: {
        learning: 0.18,
        project: 0.08,
        profile: 0.05,
      },
      resume_project: {
        project: 0.2,
        episodic: 0.1,
      },
      handoff: {
        project: 0.2,
        episodic: 0.12,
        profile: 0.06,
      },
      decision_recall: {
        preference: 0.22,
        project: 0.08,
        episodic: 0.08,
      },
      bug_recall: {
        episodic: 0.2,
        project: 0.1,
        preference: 0.06,
      },
      backend_fit: {
        episodic: 0.16,
        project: 0.12,
        preference: 0.08,
      },
      general: {},
    } as Record<RetrievalIntent, Partial<Record<MemoryType, number>>>,
    evidenceBoostPerHit: 0.02,
    evidenceBoostMax: 0.08,
    freshnessBoostThreshold: 0.8,
    freshnessBoostValue: 0.02,
    resumeProjectBoost: 0.05,
  },
};
