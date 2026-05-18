/** Keys shown only in raw trace — hidden from card / summary UI */
const HIDDEN_FIELD_KEYS = new Set([
  "id",
  "type",
  "userid",
  "user_id",
  "sessionid",
  "session_id",
  "threadid",
  "thread_id",
  "workspace",
  "project",
  "agent",
  "model",
  "mode",
  "ttlhours",
  "ttl_hours",
  "ttl",
  "policymode",
  "policy_mode",
  "pincriticaldecisions",
  "pin_critical_decisions",
  "redaction",
  "expectedtype",
  "expected_type",
  "input",
  "expected",
  "createdat",
  "created_at",
  "updatedat",
  "updated_at",
  "metadata",
  "status",
  "confidence",
  "mustmention",
  "must_mention",
]);

const READABLE_FIELD_KEYS = new Set([
  "text",
  "summary",
  "content",
  "message",
  "description",
  "value",
  "seedmemories",
  "seed_memories",
  "preference",
  "note",
  "body",
  "title",
  "label",
]);

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_\s-]+/g, "");
}

function cleanSentence(text: string): string {
  return text
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTechnicalSlug(value: string): boolean {
  const v = value.trim();
  if (v.length < 8) return false;
  if (/^user-[a-z0-9-]+$/i.test(v)) return true;
  if (/^[a-z]+-[a-z0-9-]{8,}$/i.test(v)) return true;
  if (/^session-[a-f0-9-]+$/i.test(v)) return true;
  if (/^voice:[a-f0-9-]+$/i.test(v)) return true;
  return false;
}

function collectReadableFromObject(
  value: unknown,
  parts: string[],
  depth = 0,
): void {
  if (depth > 4 || value === null || value === undefined) return;

  if (typeof value === "string") {
    const sentence = cleanSentence(value);
    if (sentence.length > 2 && !isTechnicalSlug(sentence)) {
      parts.push(sentence);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectReadableFromObject(item, parts, depth + 1);
    }
    return;
  }

  if (typeof value !== "object") return;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nk = normalizeKey(key);
    if (HIDDEN_FIELD_KEYS.has(nk)) continue;
    if (READABLE_FIELD_KEYS.has(nk) || nk.includes("memory") || nk.includes("prefer")) {
      collectReadableFromObject(nested, parts, depth + 1);
    }
  }
}

function parseKeyValueSegment(segment: string): string | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;

  const colonMatch = trimmed.match(/^([a-zA-Z_][\w-]*)\s*:\s*([\s\S]+)$/);
  const eqMatch = trimmed.match(/^([a-zA-Z_][\w-]*)\s*=\s*([\s\S]+)$/);
  const match = colonMatch ?? eqMatch;
  if (!match) {
    if (/^[\w-]+:\s*/.test(trimmed)) return null;
    const sentence = cleanSentence(trimmed);
    if (!sentence || isTechnicalSlug(sentence)) return null;
    if (/^(id|type|userid|sessionid|threadid)\b/i.test(sentence)) return null;
    return sentence.length >= 4 ? sentence : null;
  }

  const [, rawKey, rawValue] = match;
  const key = normalizeKey(rawKey);
  if (HIDDEN_FIELD_KEYS.has(key)) return null;

  const value = cleanSentence(rawValue);
  if (!value || isTechnicalSlug(value)) return null;

  if (READABLE_FIELD_KEYS.has(key) || key.includes("memory") || key.includes("prefer")) {
    return value;
  }

  return null;
}

function stripInlineMetadata(text: string): string {
  return text
    .replace(
      /\b(sessionId|threadId|workspace|project|agent|model|mode|ttlHours|policyMode|pinCriticalDecisions|redaction)\s*=\s*[^\s·•]+/gi,
      "",
    )
    .replace(/\b(id|type|userId|sessionId|threadId)\s*:\s*[^\s·•]+/gi, "")
    .replace(/,\s*"expectedType"\s*:\s*"[^"]*"/g, "")
    .replace(/,\s*"input"\s*:\s*\{[^}]*\}/g, "")
    .replace(/\{\s*"text"\s*:\s*"([^"]+)"\s*\}/g, "$1");
}

function dedupeParts(parts: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(part);
  }
  return result;
}

/**
 * Turn memory summary/content (often serialized benchmark or API payloads)
 * into human-readable prose for the dashboard.
 */
export function formatMemoryForDisplay(input: string | undefined | null): string {
  if (!input) return "";

  let text = stripInlineMetadata(input.trim());
  if (!text) return "";

  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      const parts: string[] = [];
      collectReadableFromObject(parsed, parts);
      const joined = dedupeParts(parts).join(" ");
      if (joined.length > 0) return joined;
    } catch {
      // fall through to segment parsing
    }
  }

  const parts: string[] = [];
  const segments = text.split(/\s*[•·]\s*/);

  for (const segment of segments) {
    const readable = parseKeyValueSegment(segment);
    if (readable) parts.push(readable);
  }

  if (parts.length > 0) {
    return dedupeParts(parts).join(" ");
  }

  const legacy = text
    .replace(/["{}[\]]/g, "")
    .replace(/,\s*id\s*:\s*[^,]+/gi, "")
    .replace(/\bmustMention\b\s*:\s*[^,]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return legacy.length > 3 ? legacy : "";
}

/** Whether there is extra raw payload worth showing behind “Inspect raw trace”. */
const INSIGHT_NOISE_TOKENS = new Set([
  ...HIDDEN_FIELD_KEYS,
  "memoryos",
  "question",
  "json",
  "null",
  "undefined",
  "the",
  "and",
  "for",
  "with",
]);

export function isTechnicalInsightToken(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const nk = normalizeKey(trimmed);
  if (INSIGHT_NOISE_TOKENS.has(nk)) return true;
  if (trimmed.length < 3) return true;
  if (/^\d+$/.test(trimmed)) return true;
  return false;
}

/** Single-word or short insight labels from /insights (filters JSON field names). */
export function formatInsightDisplay(value: string | undefined | null): string | null {
  if (!value?.trim()) return null;
  if (isTechnicalInsightToken(value)) return null;
  const formatted = formatMemoryForDisplay(value);
  if (!formatted) return null;
  const firstToken = formatted.split(/\s+/)[0] ?? "";
  if (isTechnicalInsightToken(firstToken)) return null;
  return formatted.length > 120 ? `${formatted.slice(0, 117).trimEnd()}…` : formatted;
}

export function hasRawMemoryPayload(
  content: string | undefined | null,
  summary: string | undefined | null,
): boolean {
  const c = (content ?? "").trim();
  const s = (summary ?? "").trim();
  if (!c) return false;
  if (c !== s) return true;
  return c.startsWith("{") || c.includes("sessionId=") || /\bid:\s*\S+/i.test(c);
}
