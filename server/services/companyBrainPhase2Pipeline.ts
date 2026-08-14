import { createHash } from "crypto";
import type { JiraMemoryMapInput } from "../../lib/integrations/jiraMemoryMapper";
import type { SlackMemoryMapInput } from "../../lib/integrations/slackMemoryMapper";
import type { CompanyBrainMemoryType, Memory } from "../../lib/memory/types";
import { redactSensitiveText } from "./secret-policy";

export type Phase2RawSignal = {
  sourceType: string;
  sourceRef: string;
  body: string;
  title?: string;
  occurredAt?: string;
  author?: string;
  url?: string;
  type?: CompanyBrainMemoryType;
  tags?: string[];
};

export type Phase2StructuredMemoryInput = {
  type: CompanyBrainMemoryType;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  evidence: string[];
  source: string;
  project?: string;
  workspace?: string;
  threadId?: string;
  confidence?: number;
  freshness?: "fresh" | "aging" | "stale";
  conflictsWith?: string[];
  shouldInheritBy?: string[];
  tags?: string[];
};

export type Phase2PreparedMemory = Phase2StructuredMemoryInput & {
  dedupeKey: string;
  graphNodeId: string;
};

export type Phase2RejectedMemory = {
  title: string;
  type: CompanyBrainMemoryType;
  reason: "duplicate";
  duplicateOf: string;
  dedupeKey: string;
};

const OPPOSITION_PAIRS: Array<[RegExp, RegExp]> = [
  [/\b(require|needs?|must|approval|approved|gate|review)\b/i, /\b(skip|bypass|without approval|unrestricted|auto[-\s]?approve)\b/i],
  [/\b(enable|enabled|allow|allowed|use|adopt)\b/i, /\b(disable|disabled|block|blocked|forbid|avoid|reject)\b/i],
  [/\b(active|open|pending|investigating|broken|failing)\b/i, /\b(resolved|fixed|closed|shipped|completed|passing)\b/i],
];

function compact(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function redact(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  let redacted = redactSensitiveText(value) ?? value;
  redacted = redacted.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]");
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");
  redacted = redacted.replace(/\b(?:\+?\d[\d\s().-]{8,}\d)\b/g, "[REDACTED_PHONE]");
  return redacted;
}

function unique(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }
  return output;
}

function inferType(raw: Phase2RawSignal): CompanyBrainMemoryType {
  if (raw.type) return raw.type;
  const text = compact(`${raw.sourceType} ${raw.title ?? ""} ${raw.body} ${(raw.tags ?? []).join(" ")}`);
  if (/\b(secret|token|credential|security|permission|production|prod|delete|billing|payment|schema|migration|risky|risk)\b/.test(text)) {
    return "risk";
  }
  if (/\b(incident|outage|regression|sev|error|failed|failure|root cause|postmortem)\b/.test(text)) {
    return "incident";
  }
  if (/\b(decided|decision|choose|chose|approved|adr|rfc)\b/.test(text)) {
    return "decision";
  }
  if (/\b(architecture|service|dependency|database|queue|cache|api|schema)\b/.test(text)) {
    return "architecture";
  }
  if (/\b(runbook|workflow|process|steps|procedure|onboarding|escalation)\b/.test(text)) {
    return "process";
  }
  if (/\b(customer|user reported|support|zendesk|intercom|feedback|ticket)\b/.test(text)) {
    return "customer_issue";
  }
  if (/\b(test|coverage|spec|e2e|unit|integration|vitest|playwright)\b/.test(text)) {
    return "test";
  }
  if (/\b(codex|cursor|devin|claude|windsurf|agent)\b/.test(text)) {
    return "agent_action";
  }
  if (/\b(deployed|merged|executed|ran|build|release)\b/.test(text)) {
    return "execution";
  }
  if (/\b(context|background|state|current)\b/.test(text)) {
    return "context";
  }
  return "knowledge";
}

function inferFreshness(occurredAt: string | undefined, explicit?: "fresh" | "aging" | "stale"): "fresh" | "aging" | "stale" {
  if (explicit) return explicit;
  if (!occurredAt) return "fresh";
  const time = Date.parse(occurredAt);
  if (!Number.isFinite(time)) return "fresh";
  const ageDays = (Date.now() - time) / (24 * 60 * 60 * 1000);
  if (ageDays >= 90) return "stale";
  if (ageDays >= 30) return "aging";
  return "fresh";
}

function contentFor(memory: Pick<Memory, "summary" | "content"> | Phase2StructuredMemoryInput): string {
  if ("whatHappened" in memory) {
    return `${memory.title} ${memory.whatHappened} ${memory.whyItMatters}`;
  }
  return `${memory.summary} ${memory.content}`;
}

function hasOpposition(a: string, b: string): boolean {
  return OPPOSITION_PAIRS.some(([left, right]) => (left.test(a) && right.test(b)) || (right.test(a) && left.test(b)));
}

function hasSubjectOverlap(a: string, b: string): boolean {
  const aTokens = new Set(compact(a).split(" ").filter((token) => token.length > 3));
  const bTokens = compact(b).split(" ").filter((token) => token.length > 3);
  const overlap = bTokens.filter((token) => aTokens.has(token)).length;
  return overlap >= Math.min(2, aTokens.size, bTokens.length);
}

export function phase2DedupeKey(input: Phase2StructuredMemoryInput): string {
  return `${input.type}:${hash(`${input.source}|${compact(input.title)}|${compact(input.whatHappened)}`)}`;
}

export function extractRawSignalsToPhase2Memories(input: {
  rawSignals: Phase2RawSignal[];
  project?: string;
  workspace?: string;
  threadId?: string;
}): Phase2StructuredMemoryInput[] {
  return input.rawSignals.map((raw) => {
    const body = redact(raw.body) ?? raw.body;
    const title = redact(raw.title)?.trim() || body.split(/\r?\n/)[0]?.slice(0, 100).trim() || `${raw.sourceType} signal`;
    const source = `${raw.sourceType}:${raw.sourceRef}`;
    const type = inferType(raw);
    return {
      type,
      title,
      whatHappened: body,
      whyItMatters: `This ${type.replace(/_/g, " ")} signal can change what future agents should inherit before acting.`,
      evidence: unique([source, redact(raw.url), redact(raw.author), raw.occurredAt]),
      source,
      project: input.project,
      workspace: input.workspace,
      threadId: input.threadId,
      confidence: 0.82,
      freshness: inferFreshness(raw.occurredAt),
      tags: raw.tags,
    };
  });
}

export function mapSlackSignalToPhase2RawSignal(input: SlackMemoryMapInput): Phase2RawSignal {
  const channel = input.channelName?.trim() || input.channelId.trim();
  const corpus = `${input.channelName ?? ""} ${input.text}`.toLowerCase();
  const type: CompanyBrainMemoryType | undefined =
    /\b(incident|outage|sev|p0|p1|production down|degraded|rollback)\b/.test(corpus)
      ? "incident"
      : /\b(secret|token|credential|security|permission|approval|production|prod|delete|billing|schema|migration|risky|risk)\b/.test(corpus)
        ? "risk"
        : undefined;
  return {
    sourceType: "slack",
    sourceRef: `${channel}:${input.threadTs ?? input.messageTs}:${input.messageTs}`,
    title: `Slack ${channel} signal`,
    body: input.text,
    occurredAt: undefined,
    author: input.userId,
    url: input.permalink,
    type,
    tags: [channel, input.threadTs ? "thread" : "message"],
  };
}

export function mapJiraSignalToPhase2RawSignal(input: JiraMemoryMapInput): Phase2RawSignal {
  const issueRef = input.issueKey.trim() || input.issueId.trim();
  const corpus = `${input.summary} ${input.description ?? ""} ${input.commentBody ?? ""} ${(input.labels ?? []).join(" ")}`.toLowerCase();
  const type: CompanyBrainMemoryType | undefined =
    /\b(decision|decided|approved|agreed|chose|going with)\b/.test(corpus)
      ? "decision"
      : /\b(incident|outage|sev|p0|p1|production down|degraded|rollback)\b/.test(corpus)
        ? "incident"
        : /\b(customer|support|feedback|reported)\b/.test(corpus)
          ? "customer_issue"
          : undefined;
  return {
    sourceType: "jira",
    sourceRef: issueRef,
    title: input.summary,
    body: input.commentBody
      ? `${input.summary}\nComment: ${input.commentBody}`
      : `${input.summary}${input.description ? `\n${input.description}` : ""}`,
    occurredAt: input.updatedAt,
    author: input.commentAuthor ?? input.assignee,
    url: input.url,
    type,
    tags: [input.status, input.priority, ...(input.labels ?? [])].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    ),
  };
}

export function preparePhase2Memory(input: {
  memory: Phase2StructuredMemoryInput;
  existingMemories: Memory[];
  acceptedMemories: Memory[];
}): { accepted: Phase2PreparedMemory } | { rejected: Phase2RejectedMemory } {
  const redacted: Phase2StructuredMemoryInput = {
    ...input.memory,
    title: redact(input.memory.title) ?? input.memory.title,
    whatHappened: redact(input.memory.whatHappened) ?? input.memory.whatHappened,
    whyItMatters: redact(input.memory.whyItMatters) ?? input.memory.whyItMatters,
    evidence: input.memory.evidence.map((item) => redact(item) ?? item),
    source: redact(input.memory.source) ?? input.memory.source,
  };
  const dedupeKey = phase2DedupeKey(redacted);
  const candidates = [...input.existingMemories, ...input.acceptedMemories];
  const duplicate = candidates.find((memory) => {
    const storedDedupeKey = memory.graph?.edgeRefs
      .find((edgeRef) => edgeRef.startsWith("dedupe:"))
      ?.replace(/^dedupe:/, "");
    const sourceMatch = memory.traceProof?.sourceRef === redacted.source || memory.sourceRef === redacted.source;
    const sameType = memory.companyBrainType === redacted.type || (memory.sourceRef ?? "").startsWith(`phase2:${redacted.type}:`);
    const sameText = phase2DedupeKey({
      type: redacted.type,
      title: memory.summary,
      whatHappened: memory.content,
      whyItMatters: "",
      evidence: [memory.sourceRef ?? memory.id],
      source: memory.traceProof?.sourceRef ?? memory.sourceRef ?? "",
    }) === dedupeKey;
    return storedDedupeKey === dedupeKey || sourceMatch || (sameType && sameText);
  });

  if (duplicate) {
    return {
      rejected: {
        title: redacted.title,
        type: redacted.type,
        reason: "duplicate",
        duplicateOf: duplicate.id,
        dedupeKey,
      },
    };
  }

  const autoConflicts = candidates
    .filter((memory) => {
      if (memory.companyBrainType && memory.companyBrainType !== redacted.type) return false;
      const existingText = contentFor(memory);
      const incomingText = contentFor(redacted);
      return hasSubjectOverlap(existingText, incomingText) && hasOpposition(existingText, incomingText);
    })
    .map((memory) => memory.id);

  const conflictsWith = unique([...(redacted.conflictsWith ?? []), ...autoConflicts]);
  const accepted: Phase2PreparedMemory = {
    ...redacted,
    conflictsWith,
    freshness: inferFreshness(undefined, redacted.freshness),
    dedupeKey,
    graphNodeId: `phase2:${redacted.type}:${hash(dedupeKey)}`,
  };
  return { accepted };
}
