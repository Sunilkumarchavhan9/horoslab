import type { MemoryCandidate, MemoryType } from "./types";

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
};

const GREETING_REGEX = /^(hi|hello|hey|thanks|ok|okay|good morning|good night)[!. ]*$/i;

const RULES: Rule[] = [
  {
    type: "preference",
    regex: /\bI\s+prefer\s+(.+?)\s+over\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User prefers ${m[1].trim()} over ${m[2].trim()}`,
    toSummary: (m) => `Prefers ${m[1].trim()} over ${m[2].trim()}`,
  },
  {
    type: "preference",
    regex: /\bI\s+prefer\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User prefers ${m[1].trim()}`,
    toSummary: (m) => `Prefers ${m[1].trim()}`,
  },
  {
    type: "learning",
    regex: /\bI(?:'m| am)\s+learning\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User is learning ${m[1].trim()}`,
    toSummary: (m) => `Learning ${m[1].trim()}`,
  },
  {
    type: "learning",
    regex: /\bI\s+trained\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User trained ${m[1].trim()}`,
    toSummary: (m) => `Trained ${m[1].trim()}`,
  },
  {
    type: "project",
    regex: /\bI(?:'m| am)\s+(?:building|working on)\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User is building ${m[1].trim()}`,
    toSummary: (m) => `Building ${m[1].trim()}`,
  },
  {
    type: "profile",
    regex: /\bMy\s+goal\s+is\s+to\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User goal is to ${m[1].trim()}`,
    toSummary: (m) => `Goal: ${m[1].trim()}`,
  },
  {
    type: "profile",
    regex: /\bI\s+want\s+to\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User wants to ${m[1].trim()}`,
    toSummary: (m) => `Wants to ${m[1].trim()}`,
  },
  {
    type: "episodic",
    regex: /\bI\s+solved\s+(.+?)(?:[.!?]|$)/gi,
    toContent: (m) => `User solved ${m[1].trim()}`,
    toSummary: (m) => `Solved: ${m[1].trim()}`,
  },
];

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function splitIntoClauses(message: string): string[] {
  return message
    .split(/[.!?]/)
    .flatMap((segment) => segment.split(/\band\b/i))
    .map(cleanText)
    .filter(Boolean);
}

function dedupeByContent(candidates: MemoryCandidate[]): MemoryCandidate[] {
  const seen = new Set<string>();
  const out: MemoryCandidate[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.type}:${candidate.content.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }

  return out;
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
        });
      }
    }
  }

  return dedupeByContent(candidates);
}
