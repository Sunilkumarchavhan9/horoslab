import type { NextFunction, Request, Response } from "express";

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

  if (loweredPath.includes("/retrieve/why-not")) return "retrieve_why_not";
  if (loweredPath.includes("/retrieve/explain")) return "retrieve_explain";
  if (loweredPath.includes("/retrieve/debug")) return "retrieve_debug";
  if (loweredPath.includes("/retrieve")) return "retrieve";
  if (loweredPath.includes("/resume")) return "resume";
  if (loweredPath.includes("/handoff")) return "handoff";
  if (loweredPath.includes("/continue")) return "continue";
  if (loweredPath.includes("/insights")) return "insights";
  if (loweredPath.includes("/list")) return "memory_list";
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

function compactForHistory(value: any, maxChars = MAX_RESPONSE_SUMMARY_CHARS): any {
  if (value === undefined || value === null) return value;
  try {
    const seen = new WeakSet<object>();
    const raw = JSON.stringify(value, (_key, nested) => {
      if (typeof nested === "string") {
        return nested.length > MAX_STRING_FIELD_CHARS
          ? `${nested.slice(0, MAX_STRING_FIELD_CHARS)}...[TRUNCATED]`
          : nested;
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
      return next;
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
