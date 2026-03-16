import type { MemoryCandidate } from "./types";

export interface ScoredMemoryCandidate extends MemoryCandidate {
  importanceScore: number;
  confidence: number;
  scoreReasons: string[];
}

export const MVP_ACCEPT_THRESHOLD = 0.65;

const TYPE_BASE_WEIGHT: Record<MemoryCandidate["type"], number> = {
  profile: 0.45,
  preference: 0.55,
  learning: 0.58,
  project: 0.6,
  episodic: 0.5,
};

const HIGH_SIGNAL_PATTERNS = [
  { regex: /\b(goal|want to|plan to)\b/i, reason: "goal-intent", weight: 0.22 },
  { regex: /\b(prefer|prefers|like|likes|dislike|dislikes)\b/i, reason: "preference-signal", weight: 0.2 },
  { regex: /\b(learning|studying|practicing|trained)\b/i, reason: "learning-signal", weight: 0.2 },
  { regex: /\b(building|working on|shipping|built|implemented|deployed)\b/i, reason: "project-signal", weight: 0.24 },
  { regex: /\b(solved|fixed|debugged|shipped|completed)\b/i, reason: "milestone-signal", weight: 0.22 },
] as const;

const LOW_VALUE_PATTERNS = [
  /\b(hi|hello|hey|thanks|ok|okay)\b/i,
  /\bhow are you\b/i,
  /\bjust checking\b/i,
];

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
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

  let score = TYPE_BASE_WEIGHT[candidate.type];
  scoreReasons.push(`base:${candidate.type}`);

  for (const signal of HIGH_SIGNAL_PATTERNS) {
    if (signal.regex.test(text)) {
      score += signal.weight;
      scoreReasons.push(`+${signal.weight.toFixed(2)}:${signal.reason}`);
    }
  }

  for (const lowValue of LOW_VALUE_PATTERNS) {
    if (lowValue.test(text)) {
      score -= 0.25;
      scoreReasons.push("-0.25:low-value-noise");
      break;
    }
  }

  const repetitionKey = `${candidate.type}:${text}`;
  const repeats = repetitionMap?.get(repetitionKey) ?? 0;
  if (repeats > 1) {
    const bump = Math.min(0.12, 0.04 * (repeats - 1));
    score += bump;
    scoreReasons.push(`+${bump.toFixed(2)}:repetition(${repeats})`);
  }

  const importanceScore = clamp01(score);
  const confidence = clamp01(0.55 + importanceScore * 0.4);

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
