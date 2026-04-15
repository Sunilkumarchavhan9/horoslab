import type { DeveloperSignals, MemoryCandidate, MemoryType } from "./types";

export interface ExtractMemoryInput {
  userId: string;
  threadId?: string;
  message: string;
}

type Rule = {
  type: MemoryType;
  regex: RegExp;
  toContent: (match: RegExpMatchArray) => string;
  toSummary: (match: RegExpMatchArray) => string;
  toDeveloperSignals?: (match: RegExpMatchArray) => DeveloperSignals | undefined;
};

const GREETING_REGEX = /^(hi|hello|hey|thanks|ok|okay|good morning|good night)[!. ]*$/i;

const RULES: Rule[] = [
  {
    type: "preference",
    regex: /\bI\s+use\s+(.+?)\s+with\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User uses ${m[1].trim()} with ${m[2].trim()}`,
    toSummary: (m) => `Uses ${m[1].trim()} with ${m[2].trim()}`,
    toDeveloperSignals: (m) => ({
      framework: normalizeSignalTokens(m[1]),
      stack: normalizeSignalTokens(m[2]),
    }),
  },
  {
    type: "preference",
    regex: /\bI\s+prefer\s+(.+?)\s+over\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User prefers ${m[1].trim()} over ${m[2].trim()}`,
    toSummary: (m) => `Prefers ${m[1].trim()} over ${m[2].trim()}`,
    toDeveloperSignals: (m) => ({
      stack: [...normalizeSignalTokens(m[1]), ...normalizeSignalTokens(m[2])],
    }),
  },
  {
    type: "preference",
    regex: /\bI\s+prefer\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User prefers ${m[1].trim()}`,
    toSummary: (m) => `Prefers ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      stack: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "learning",
    regex: /\bI(?:'m| am)\s+learning\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User is learning ${m[1].trim()}`,
    toSummary: (m) => `Learning ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      goal: normalizeSignalTokens(`learn ${m[1].trim()}`),
      projectArea: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "learning",
    regex: /\bI\s+trained\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User trained ${m[1].trim()}`,
    toSummary: (m) => `Trained ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      projectArea: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "project",
    regex: /\bI(?:'m| am)\s+(?:building|working on)\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User is building ${m[1].trim()}`,
    toSummary: (m) => `Building ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      projectArea: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "project",
    regex: /\bI\s+shipped\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User shipped ${m[1].trim()}`,
    toSummary: (m) => `Shipped ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      projectArea: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "project",
    regex: /\bI\s+deployed\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User deployed ${m[1].trim()}`,
    toSummary: (m) => `Deployed ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      projectArea: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "profile",
    regex: /\bMy\s+goal\s+is\s+to\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User goal is to ${m[1].trim()}`,
    toSummary: (m) => `Goal: ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      goal: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "profile",
    regex: /\bI\s+want\s+to\s+work\s+on\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User wants to work on ${m[1].trim()}`,
    toSummary: (m) => `Wants to work on ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      goal: normalizeSignalTokens(`work on ${m[1].trim()}`),
      projectArea: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "profile",
    regex: /\bI\s+want\s+to\s+(?!work\s+on)(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User wants to ${m[1].trim()}`,
    toSummary: (m) => `Wants to ${m[1].trim()}`,
    toDeveloperSignals: (m) => ({
      goal: normalizeSignalTokens(m[1]),
    }),
  },
  {
    type: "episodic",
    regex: /\bI(?:'m| am)\s+debugging\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User is debugging ${m[1].trim()}`,
    toSummary: (m) => `Debugging: ${m[1].trim()}`,
    toDeveloperSignals: (m) => buildBugSignals(m[1]),
  },
  {
    type: "episodic",
    regex: /\bI(?:'m| am)\s+fixing\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User is fixing ${m[1].trim()}`,
    toSummary: (m) => `Fixing: ${m[1].trim()}`,
    toDeveloperSignals: (m) => buildBugSignals(m[1]),
  },
  {
    type: "episodic",
    regex: /\bI\s+solved\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User solved ${m[1].trim()}`,
    toSummary: (m) => `Solved: ${m[1].trim()}`,
    toDeveloperSignals: (m) => buildBugSignals(m[1]),
  },
  {
    type: "episodic",
    regex: /\bI\s+fixed\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User fixed ${m[1].trim()}`,
    toSummary: (m) => `Fixed: ${m[1].trim()}`,
    toDeveloperSignals: (m) => buildBugSignals(m[1]),
  },
  {
    type: "episodic",
    regex: /\bI\s+debugged\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User debugged ${m[1].trim()}`,
    toSummary: (m) => `Debugged: ${m[1].trim()}`,
    toDeveloperSignals: (m) => buildBugSignals(m[1]),
  },
];

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeSignalTokens(raw: string): string[] {
  return raw
    .split(/,|\/|\band\b/i)
    .map((value) => cleanText(value))
    .filter((value) => value.length > 0);
}

function compactDeveloperSignals(
  signals: DeveloperSignals | undefined,
): DeveloperSignals | undefined {
  if (!signals) {
    return undefined;
  }

  const compact: DeveloperSignals = {};
  const keys: Array<keyof DeveloperSignals> = [
    "stack",
    "framework",
    "bugType",
    "goal",
    "projectArea",
  ];

  for (const key of keys) {
    const values = signals[key];
    if (!values || values.length === 0) {
      continue;
    }

    const unique = Array.from(
      new Set(values.map((value) => cleanText(value)).filter(Boolean)),
    );

    if (unique.length > 0) {
      compact[key] = unique;
    }
  }

  return Object.keys(compact).length > 0 ? compact : undefined;
}

function mergeDeveloperSignals(
  a: DeveloperSignals | undefined,
  b: DeveloperSignals | undefined,
): DeveloperSignals | undefined {
  if (!a && !b) {
    return undefined;
  }

  return compactDeveloperSignals({
    stack: [...(a?.stack ?? []), ...(b?.stack ?? [])],
    framework: [...(a?.framework ?? []), ...(b?.framework ?? [])],
    bugType: [...(a?.bugType ?? []), ...(b?.bugType ?? [])],
    goal: [...(a?.goal ?? []), ...(b?.goal ?? [])],
    projectArea: [...(a?.projectArea ?? []), ...(b?.projectArea ?? [])],
  });
}

function buildBugSignals(raw: string): DeveloperSignals {
  const text = cleanText(raw);
  const bugTokens = normalizeSignalTokens(raw);

  const bugType = /\b(bug|issue|error|latency|timeout|crash|lock|deadlock)\b/i.test(
    text,
  )
    ? bugTokens
    : [];

  return {
    bugType,
    projectArea: bugTokens,
  };
}

function splitIntoClauses(message: string): string[] {
  return message
    .split(/(?:[!?]+|[.](?=\s|$))/)
    .flatMap((segment) => segment.split(/\band\b/i))
    .map(cleanText)
    .filter(Boolean);
}

function dedupeByContent(candidates: MemoryCandidate[]): MemoryCandidate[] {
  const byKey = new Map<string, MemoryCandidate>();

  for (const candidate of candidates) {
    const key = `${candidate.type}:${candidate.content.toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }

    byKey.set(key, {
      ...existing,
      developerSignals: mergeDeveloperSignals(
        existing.developerSignals,
        candidate.developerSignals,
      ),
    });
  }

  return Array.from(byKey.values());
}

export function extractMemory(input: ExtractMemoryInput): MemoryCandidate[] {
  const message = cleanText(input.message);

  if (!message || GREETING_REGEX.test(message)) {
    return [];
  }

  const clauses = splitIntoClauses(message);
  const candidates: MemoryCandidate[] = [];

  for (const clause of clauses) {
    for (const rule of RULES) {
      for (const match of clause.matchAll(rule.regex)) {
        const content = cleanText(rule.toContent(match));
        const summary = cleanText(rule.toSummary(match));

        candidates.push({
          userId: input.userId,
          threadId: input.threadId,
          type: rule.type,
          content,
          summary,
          source: "chat",
          developerSignals: compactDeveloperSignals(
            rule.toDeveloperSignals?.(match),
          ),
        });
      }
    }
  }

  return dedupeByContent(candidates);
}
