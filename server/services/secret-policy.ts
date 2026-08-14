const REDACTION_TOKEN = "[REDACTED]";

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/(authorization\s*:\s*bearer\s+)([^\s"'`]+)/gi, `$1${REDACTION_TOKEN}`],
  [/(authorization\s*:\s*token\s+)([^\s"'`]+)/gi, `$1${REDACTION_TOKEN}`],
  [/(bearer\s+)([A-Za-z0-9._\-=/+]{8,})/gi, `$1${REDACTION_TOKEN}`],
  [/(\bgh[pousr]_[A-Za-z0-9_]{20,}\b)/g, REDACTION_TOKEN],
  [/(\bgithub_pat_[A-Za-z0-9_]{20,}\b)/g, REDACTION_TOKEN],
  [/(\bsk-[A-Za-z0-9]{16,}\b)/g, REDACTION_TOKEN],
  [/(\bAKIA[0-9A-Z]{16}\b)/g, REDACTION_TOKEN],
  [/(\bxox[baprs]-[A-Za-z0-9-]{10,}\b)/g, REDACTION_TOKEN],
];

function isSensitiveKey(key: string): boolean {
  return /secret|token|password|pass|api[_-]?key|access[_-]?key|private[_-]?key/i.test(key);
}

export function redactSensitiveText(value: string | null | undefined): string | null {
  if (value == null) return null;

  let redacted = value;
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }

  redacted = redacted.replace(
    /(^|[\s;&|])(--?(?:password|token|secret|api[-_]?key))\s*[=:]\s*([^\s"'`]+)/gi,
    (fullMatch, prefix: string, flag: string) => `${prefix}${flag}=${REDACTION_TOKEN}`,
  );

  redacted = redacted.replace(
    /(^|[\s;&|])((?:export\s+)?[A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^\s"'`]+)/gi,
    (fullMatch, prefix: string, key: string) => {
      if (!isSensitiveKey(key)) {
        return fullMatch;
      }
      return `${prefix}${key}=${REDACTION_TOKEN}`;
    },
  );

  return redacted;
}

export function redactSensitiveObject<T>(value: T): T {
  if (value == null) return value;

  if (typeof value === "string") {
    return redactSensitiveText(value) as T;
  }

  if (typeof value !== "object") {
    return value;
  }

  const seen = new WeakSet<object>();

  const walk = (input: unknown): unknown => {
    if (typeof input === "string") {
      return redactSensitiveText(input);
    }
    if (typeof input !== "object" || input === null) {
      return input;
    }
    if (seen.has(input)) {
      return "[Circular]";
    }
    seen.add(input);
    if (Array.isArray(input)) {
      return input.map((item) => walk(item));
    }
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(input)) {
      if (typeof nested === "string") {
        output[key] = isSensitiveKey(key) ? REDACTION_TOKEN : redactSensitiveText(nested);
        continue;
      }
      output[key] = walk(nested);
    }
    return output;
  };

  return walk(value) as T;
}

export { REDACTION_TOKEN };
