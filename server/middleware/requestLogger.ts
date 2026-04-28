import type { NextFunction, Request, Response } from "express";

const MAX_REQUEST_LOG_ENTRIES = 400;

export interface RequestHistoryEntry {
  id: string;
  method: string;
  path: string;
  routeType: string;
  statusCode: number;
  status: "Success" | "Error";
  durationMs: number;
  userId: string;
  requestId: string;
  createdAt: string;
}

const requestHistory: RequestHistoryEntry[] = [];

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

function pushRequestHistoryEntry(entry: RequestHistoryEntry): void {
  requestHistory.unshift(entry);
  if (requestHistory.length > MAX_REQUEST_LOG_ENTRIES) {
    requestHistory.length = MAX_REQUEST_LOG_ENTRIES;
  }
}

export function listRequestHistory(options?: {
  userId?: string;
  limit?: number;
  memoryOnly?: boolean;
}): RequestHistoryEntry[] {
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
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  res.on("finish", () => {
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAt;
    const userId = req.authUserId ?? "anonymous";
    const requestId = req.requestId ?? "unknown";
    const statusCode = res.statusCode;
    const status: "Success" | "Error" = statusCode < 400 ? "Success" : "Error";
    const routeType = inferRouteType(req.method, req.originalUrl);

    pushRequestHistoryEntry({
      id: requestId,
      method: req.method.toUpperCase(),
      path: req.originalUrl,
      routeType,
      statusCode,
      status,
      durationMs,
      userId,
      requestId,
      createdAt: finishedAt,
    });

    console.log(
      `[request] method=${req.method} path=${req.originalUrl} status=${statusCode} durationMs=${durationMs} userId=${userId} requestId=${requestId}`,
    );
  });

  next();
}
