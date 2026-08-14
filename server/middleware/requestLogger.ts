import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { redactSensitiveText as redactSecretLikeText } from "../services/secret-policy";

const MAX_REQUEST_LOG_ENTRIES = 400;
const MAX_CAPTURED_JSON_CHARS = 20_000;
const MAX_STRING_FIELD_CHARS = 500;
const MAX_RESPONSE_SUMMARY_CHARS = 2_000;

export interface RequestHistoryEntry {
  id: string;
  method: string;
  path: string;
  routeType: string;
  statusCode: number;
  status: "Success" | "Error";
  durationMs: number;
  userId: string;
  apiKeyId?: string;
  requestId: string;
  createdAt: string;
  agent?: string;
  payloadSummary?: any;
  responseSummary?: any;
  errorDetails?: any;
}

type RequestHistoryListener = (entry: RequestHistoryEntry) => void;

const requestHistory: RequestHistoryEntry[] = [];
const requestHistoryListeners = new Set<RequestHistoryListener>();

export function subscribeRequestHistory(listener: RequestHistoryListener): () => void {
  requestHistoryListeners.add(listener);
  return () => {
    requestHistoryListeners.delete(listener);
  };
}

function inferRouteType(method: string, path: string): string {
  const loweredPath = path.toLowerCase();
  const loweredMethod = method.toUpperCase();

  if (loweredPath.includes("/memoryignition/brief")) return "memoryignition_brief";
  if (loweredPath.includes("/memoryignition/send-now")) return "memoryignition_send_now";
  if (loweredPath.includes("/memoryignition/risk-check")) return "memoryignition_risk_check";
  if (loweredPath.includes("/memoryignition/outcome")) return "memoryignition_outcome";
  if (loweredPath.includes("/memoryignition/handoff")) return "memoryignition_handoff";
  if (loweredPath.includes("/trace-proof")) return "trace_proof";
  if (loweredPath.includes("/api-keys")) return "api_keys";
  if (loweredPath.includes("/api/mcp") || loweredPath.includes("/mcp/")) return "mcp";
  if (loweredPath.includes("/retrieve/why-not")) return "retrieve_why_not";
  if (loweredPath.includes("/retrieve/explain")) return "retrieve_explain";
  if (loweredPath.includes("/retrieve/debug")) return "retrieve_debug";
  if (loweredPath.includes("/retrieve")) return "retrieve";
  if (loweredPath.includes("/resume")) return "resume";
  if (loweredPath.includes("/handoff")) return "handoff";
  if (loweredPath.includes("/continue")) return "continue";
  if (loweredPath.includes("/insights")) return "insights";
  if (loweredPath.includes("/list")) return "memory_list";
  if (loweredPath.includes("/requests")) return "request_history";
  if (loweredPath.includes("/timeline")) return "timeline";
  if (loweredPath.includes("/revisions")) return "revisions";
  if (loweredPath.includes("/explain")) return "explain";
  if (loweredPath.includes("/process")) return loweredMethod === "POST" ? "memory_add" : "memory_process";
  if (loweredMethod === "PATCH" && loweredPath.includes("/archive")) return "memory_update";
  if (loweredMethod === "PATCH" && loweredPath.includes("/status")) return "memory_update";

  return "other";
}

function shouldSkipRequestHistory(path: string): boolean {
  const normalizedPath = path.split("?")[0]?.toLowerCase() ?? path.toLowerCase();
  return (
    normalizedPath.endsWith("/api/memory/events") ||
    normalizedPath.endsWith("/api/connector/events")
  );
}

function sanitizeRequestPath(path: string): string {
  try {
    const [pathname, query = ""] = path.split("?");
    if (!query) return pathname;
    const params = new URLSearchParams(query);
    for (const key of Array.from(params.keys())) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes("token") ||
        normalizedKey.includes("secret") ||
        normalizedKey.includes("key") ||
        normalizedKey.includes("code")
      ) {
        params.set(key, "[redacted]");
      }
    }
    const sanitized = params.toString();
    return sanitized ? `${pathname}?${sanitized}` : pathname;
  } catch {
    return path.replace(/([?&](?:token|secret|key|code)=)[^&]+/gi, "$1[redacted]");
  }
}

function pushRequestHistoryEntry(entry: RequestHistoryEntry): void {
  requestHistory.unshift(entry);
  if (requestHistory.length > MAX_REQUEST_LOG_ENTRIES) {
    requestHistory.length = MAX_REQUEST_LOG_ENTRIES;
  }

  for (const listener of requestHistoryListeners) {
    try {
      listener(entry);
    } catch {
      // Request logging must never fail the request that just completed.
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findStandardInheritancePackage(value: unknown, depth = 0): Record<string, unknown> | null {
  if (!isRecord(value) || depth > 8) return null;
  if (isRecord(value.standard_inheritance_package)) {
    return value.standard_inheritance_package;
  }
  for (const nested of Object.values(value)) {
    const found = findStandardInheritancePackage(nested, depth + 1);
    if (found) return found;
  }
  return null;
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function compactStandardInheritancePackage(value: unknown): Record<string, unknown> | null {
  const pkg = findStandardInheritancePackage(value);
  if (!pkg) return null;
  const gates = isRecord(pkg.gates) ? pkg.gates : {};
  const proofGate = isRecord(gates.proof) ? gates.proof : {};
  const task = isRecord(pkg.task) ? pkg.task : {};
  const outcomeContract = isRecord(pkg.outcome_contract)
    ? pkg.outcome_contract
    : isRecord(pkg.outcome) && isRecord(pkg.outcome.contract)
      ? pkg.outcome.contract
      : null;
  return {
    version: typeof pkg.version === "string" ? pkg.version : null,
    delivery: typeof pkg.delivery === "string" ? pkg.delivery : null,
    target_agent: typeof task.target_agent === "string" ? task.target_agent : null,
    memories: countArray(pkg.memories),
    experiences: countArray(pkg.experiences),
    executable_skills: countArray(pkg.executable_skills),
    required_tests: countArray(pkg.required_tests),
    trace_proof: countArray(pkg.trace_proof),
    gate_status: typeof proofGate.status === "string" ? proofGate.status : null,
    outcome_contract: outcomeContract
      ? {
          version: typeof outcomeContract.version === "string" ? outcomeContract.version : null,
          required: typeof outcomeContract.required === "boolean" ? outcomeContract.required : null,
          endpoint: typeof outcomeContract.endpoint === "string" ? outcomeContract.endpoint : null,
          sdk_method: typeof outcomeContract.sdk_method === "string" ? outcomeContract.sdk_method : null,
          mcp_tool: typeof outcomeContract.mcp_tool === "string" ? outcomeContract.mcp_tool : null,
        }
      : null,
  };
}

function compactForHistory(value: any, maxChars = MAX_RESPONSE_SUMMARY_CHARS): any {
  if (value === undefined || value === null) return value;
  try {
    const standardPackage = compactStandardInheritancePackage(value);
    const seen = new WeakSet<object>();
    const raw = JSON.stringify(value, (_key, nested) => {
      if (typeof nested === "string") {
        const redacted = redactSecretLikeText(nested) ?? nested;
        return redacted.length > MAX_STRING_FIELD_CHARS
          ? `${redacted.slice(0, MAX_STRING_FIELD_CHARS)}...[TRUNCATED]`
          : redacted;
      }
      if (typeof nested === "object" && nested !== null) {
        if (seen.has(nested)) return "[Circular]";
        seen.add(nested);
      }
      return nested;
    });
    if (raw.length <= maxChars) return JSON.parse(raw);
    return {
      truncated: true,
      preview: raw.slice(0, maxChars),
      originalChars: raw.length,
      ...(standardPackage ? { standard_inheritance_package: standardPackage } : {}),
    };
  } catch {
    const text = String(value);
    return text.length > maxChars
      ? { truncated: true, preview: text.slice(0, maxChars), originalChars: text.length }
      : text;
  }
}

export function countApiKeyRequests24h(userId: string, apiKeyId: string): number {
  const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
  return requestHistory.filter((entry) => {
    if (entry.userId !== userId || entry.apiKeyId !== apiKeyId) return false;
    const createdMs = Date.parse(entry.createdAt);
    return Number.isFinite(createdMs) && createdMs >= cutoffMs;
  }).length;
}

export function listRequestHistory(options?: {
  userId?: string;
  limit?: number;
  memoryOnly?: boolean;
}): RequestHistoryEntry[] {
  try {
    const requestedLimit = options?.limit ?? 100;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_REQUEST_LOG_ENTRIES);
    const userId = options?.userId;
    const memoryOnly = options?.memoryOnly ?? true;

    return requestHistory
      .filter((entry) => {
        if (userId && entry.userId !== userId) return false;
        if (
          memoryOnly &&
          !entry.path.startsWith("/api/memory") &&
          !entry.path.startsWith("/api/v1/memory")
        ) {
          return false;
        }
        return true;
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function recordRequestHistoryEntry(input: {
  method: string;
  path: string;
  statusCode: number;
  userId: string;
  durationMs?: number;
  requestId?: string;
  apiKeyId?: string;
  payloadSummary?: any;
  responseSummary?: any;
  errorDetails?: any;
}): RequestHistoryEntry {
  const method = input.method.toUpperCase();
  const path = sanitizeRequestPath(input.path);
  const status: "Success" | "Error" = input.statusCode < 400 ? "Success" : "Error";
  const requestId = input.requestId ?? `synthetic_${randomUUID()}`;
  const entry: RequestHistoryEntry = {
    id: requestId,
    method,
    path,
    routeType: inferRouteType(method, path),
    statusCode: input.statusCode,
    status,
    durationMs: input.durationMs ?? 0,
    userId: input.userId,
    ...(input.apiKeyId ? { apiKeyId: input.apiKeyId } : {}),
    requestId,
    createdAt: new Date().toISOString(),
    payloadSummary: compactForHistory(redactPayload(input.payloadSummary)),
    responseSummary:
      status === "Success" ? compactForHistory(redactPayload(input.responseSummary)) : undefined,
    errorDetails:
      status === "Error" ? compactForHistory(redactPayload(input.errorDetails ?? input.responseSummary)) : undefined,
  };
  pushRequestHistoryEntry(entry);
  return entry;
}

function redactPayload(payload: any): any {
  if (!payload) return payload;
  try {
    const raw = JSON.stringify(payload);
    const stringified =
      raw.length > MAX_CAPTURED_JSON_CHARS
        ? `${raw.slice(0, MAX_CAPTURED_JSON_CHARS)}...[TRUNCATED]`
        : raw;
    const parsed = JSON.parse(stringified);

    // Recursive redaction function
    const redactSensitiveText = (value: string): string => {
      const patterns: Array<[RegExp, string]> = [
        [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]"],
        [/\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, "[REDACTED_PHONE]"],
        [/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CARD]"],
        [/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]"],
        [/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/g, "Bearer [REDACTED_TOKEN]"],
      ];
      let next = value;
      for (const [pattern, replacement] of patterns) {
        next = next.replace(pattern, replacement);
      }
      return redactSecretLikeText(next) ?? next;
    };

    const redact = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          const lowerKey = key.toLowerCase();
          if (
            lowerKey.includes('token') ||
            lowerKey.includes('key') ||
            lowerKey.includes('secret') ||
            lowerKey.includes('password') ||
            lowerKey.includes('authorization')
          ) {
            obj[key] = '[REDACTED]';
          } else if (obj[key].length > MAX_STRING_FIELD_CHARS) {
            obj[key] = obj[key].substring(0, MAX_STRING_FIELD_CHARS) + '...[TRUNCATED]';
          } else {
            obj[key] = redactSensitiveText(obj[key]);
          }
        } else if (typeof obj[key] === 'object') {
          redact(obj[key]);
        }
      }
    };

    redact(parsed);
    return parsed;
  } catch (e) {
    return "[Unparseable Payload]";
  }
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  // Capture response body
  let responseBody: any;
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.send = function (body) {
    if (!responseBody) {
      try {
        responseBody = typeof body === "string" ? JSON.parse(body) : body;
      } catch (e) {
        responseBody = body;
      }
    }
    return originalSend.call(this, body);
  };

  res.on("finish", () => {
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAt;
    const userId = req.authUserId ?? "anonymous";
    const requestId = req.requestId ?? "unknown";
    const statusCode = res.statusCode;
    const status: "Success" | "Error" = statusCode < 400 ? "Success" : "Error";
    const routeType = inferRouteType(req.method, req.originalUrl);

    if (shouldSkipRequestHistory(req.originalUrl)) {
      return;
    }

    let agent = undefined;
    if (routeType === "handoff" || routeType === "resume") {
      agent = req.body?.agentId || "Agent A";
    }

    const shouldCaptureResponseBody =
      routeType !== "memory_list" &&
      routeType !== "request_history" &&
      routeType !== "timeline" &&
      routeType !== "revisions" &&
      routeType !== "insights";

    const payloadSummary = Object.keys(req.body || {}).length > 0 ? redactPayload(req.body) : undefined;
    const responseSummary =
      status === "Success" && shouldCaptureResponseBody
        ? compactForHistory(redactPayload(responseBody))
        : undefined;
    const errorDetails = status === "Error" ? compactForHistory(redactPayload(responseBody)) : undefined;

    pushRequestHistoryEntry({
      id: requestId,
      method: req.method.toUpperCase(),
      path: sanitizeRequestPath(req.originalUrl),
      routeType,
      statusCode,
      status,
      durationMs,
      userId,
      ...(req.authApiKeyId ? { apiKeyId: req.authApiKeyId } : {}),
      requestId,
      createdAt: finishedAt,
      agent,
      payloadSummary: compactForHistory(payloadSummary),
      responseSummary,
      errorDetails,
    });

    console.log(
      `[request] method=${req.method} path=${req.originalUrl} status=${statusCode} durationMs=${durationMs} userId=${userId} requestId=${requestId}`,
    );
  });

  next();
}
