import type { MemoryCandidate } from "./types";
import { MEMORY_RULES } from "../config/memoryRules";

export interface ScoredMemoryCandidate extends MemoryCandidate {
  importanceScore: number;
  confidence: number;
  scoreReasons: string[];
}

export const MVP_ACCEPT_THRESHOLD = MEMORY_RULES.scoring.acceptThreshold;

const HIGH_SIGNAL_PATTERNS = [
  { regex: /\b(goal|want to|plan to)\b/i, reason: "goal-intent", weight: 0.22 },
  { regex: /\bwant(s)?\s+to\s+work\s+on\b/i, reason: "career-direction-signal", weight: 0.22 },
  { regex: /\bwant(s)?\s+to\s+learn\b/i, reason: "learning-goal-signal", weight: 0.2 },
  { regex: /\b(prefer|prefers|like|likes|dislike|dislikes)\b/i, reason: "preference-signal", weight: 0.2 },
  { regex: /\b(prefer|prefers).+\bover\b/i, reason: "technical-preference-comparison", weight: 0.08 },
  { regex: /\buses\b.+\bwith\b/i, reason: "stack-usage-signal", weight: 0.16 },
  { regex: /\b(learning|studying|practicing|trained)\b/i, reason: "learning-signal", weight: 0.2 },
  { regex: /\b(building|working on|shipping|built|implemented|deployed)\b/i, reason: "project-signal", weight: 0.24 },
  { regex: /\b(currently working on)\b/i, reason: "active-work-signal", weight: 0.18 },
  { regex: /\b(debugging|fixing)\b/i, reason: "active-debug-signal", weight: 0.18 },
  { regex: /\b(needs?\s+to\s+finish|needs?\s+to\s+complete|still\s+need\s+to)\b/i, reason: "open-loop-signal", weight: 0.18 },
  { regex: /\b(solved|fixed|debugged|shipped|completed)\b/i, reason: "milestone-signal", weight: 0.22 },
  { regex: /\b(solved|fixed|debugged)\b.+\b(bug|issue|error|latency|locking|crash)\b/i, reason: "bug-solving-signal", weight: 0.1 },
  { regex: /\b(shipped|deployed)\b/i, reason: "delivery-signal", weight: 0.1 },
] as const;

const LOW_VALUE_PATTERNS = [
  /\b(hi|hello|hey|thanks|ok|okay)\b/i,
  /\bhow are you\b/i,
  /\bjust checking\b/i,
];

const DEVELOPER_SIGNAL_WEIGHTS = {
  stack: 0.04,
  framework: 0.04,
  projectArea: 0.05,
  goal: 0.08,
  bugType: 0.1,
} as const;

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function applyDeveloperSignalBoost(
  candidate: MemoryCandidate,
  scoreReasons: string[],
): number {
  const signals = candidate.developerSignals;
  if (!signals) {
    return 0;
  }

  let boost = 0;

  if ((signals.stack?.length ?? 0) > 0) {
    boost += DEVELOPER_SIGNAL_WEIGHTS.stack;
    scoreReasons.push(
      `+${DEVELOPER_SIGNAL_WEIGHTS.stack.toFixed(2)}:developer-stack-signal`,
    );
  }

  if ((signals.framework?.length ?? 0) > 0) {
    boost += DEVELOPER_SIGNAL_WEIGHTS.framework;
    scoreReasons.push(
      `+${DEVELOPER_SIGNAL_WEIGHTS.framework.toFixed(2)}:developer-framework-signal`,
    );
  }

  if ((signals.projectArea?.length ?? 0) > 0) {
    boost += DEVELOPER_SIGNAL_WEIGHTS.projectArea;
    scoreReasons.push(
      `+${DEVELOPER_SIGNAL_WEIGHTS.projectArea.toFixed(2)}:developer-project-area-signal`,
    );
  }

  if ((signals.goal?.length ?? 0) > 0) {
    boost += DEVELOPER_SIGNAL_WEIGHTS.goal;
    scoreReasons.push(
      `+${DEVELOPER_SIGNAL_WEIGHTS.goal.toFixed(2)}:developer-goal-signal`,
    );
  }

  if ((signals.bugType?.length ?? 0) > 0) {
    boost += DEVELOPER_SIGNAL_WEIGHTS.bugType;
    scoreReasons.push(
      `+${DEVELOPER_SIGNAL_WEIGHTS.bugType.toFixed(2)}:developer-bug-signal`,
    );
  }

  return boost;
}

export function buildRepetitionMap(
  candidates: MemoryCandidate[],
): Map<string, number> {
  const repetitionMap = new Map<string, number>();

  for (const candidate of candidates) {
    const key = `${candidate.type}:${candidate.content.toLowerCase()}`;
    repetitionMap.set(key, (repetitionMap.get(key) ?? 0) + 1);
  }

  return repetitionMap;
}

export function scoreMemory(
  candidate: MemoryCandidate,
  repetitionMap?: Map<string, number>,
): ScoredMemoryCandidate {
  const text = candidate.content.toLowerCase();
  const scoreReasons: string[] = [];

  let score = MEMORY_RULES.scoring.typeBaseWeight[candidate.type];
  scoreReasons.push(`base:${candidate.type}`);

  for (const signal of HIGH_SIGNAL_PATTERNS) {
    if (signal.regex.test(text)) {
      score += signal.weight;
      scoreReasons.push(`+${signal.weight.toFixed(2)}:${signal.reason}`);
    }
  }

  score += applyDeveloperSignalBoost(candidate, scoreReasons);

  for (const lowValue of LOW_VALUE_PATTERNS) {
    if (lowValue.test(text)) {
      score -= MEMORY_RULES.scoring.lowValuePenalty;
      scoreReasons.push(
        `-${MEMORY_RULES.scoring.lowValuePenalty.toFixed(2)}:low-value-noise`,
      );
      break;
    }
  }

  const repetitionKey = `${candidate.type}:${text}`;
  const repeats = repetitionMap?.get(repetitionKey) ?? 0;
  if (repeats > 1) {
    const bump = Math.min(
      MEMORY_RULES.scoring.repetitionBumpMax,
      MEMORY_RULES.scoring.repetitionBumpPerRepeat * (repeats - 1),
    );
    score += bump;
    scoreReasons.push(`+${bump.toFixed(2)}:repetition(${repeats})`);
  }

  const importanceScore = clamp01(score);
  const confidence = clamp01(
    MEMORY_RULES.scoring.confidenceBase +
      importanceScore * MEMORY_RULES.scoring.confidenceMultiplier,
  );

  return {
    ...candidate,
    importanceScore,
    confidence,
    scoreReasons,
  };
}

export function filterAcceptedMemories(
  scored: ScoredMemoryCandidate[],
  threshold = MVP_ACCEPT_THRESHOLD,
) {
  const accepted = scored.filter((candidate) => candidate.importanceScore >= threshold);
  const rejected = scored.filter((candidate) => candidate.importanceScore < threshold);

  return { accepted, rejected, threshold };
}
