import type { NextFunction, Request, Response } from "express";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

const requestBuckets = new Map<string, number[]>();

function getBucketKey(req: Request): string {
  return req.authUserId || "anonymous";
}

/** Lightweight billing reads are polled by the console; do not count toward the API burst limit. */
function isBillingReadRequest(req: Request): boolean {
  if (req.method !== "GET") return false;
  const path = (req.path || req.url || "").split("?")[0] ?? "";
  return /\/billing(\/events)?$/i.test(path);
}

export function rateLimitMemoryApi(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (isBillingReadRequest(req)) {
    next();
    return;
  }

  const now = Date.now();
  const key = getBucketKey(req);
  const existing = requestBuckets.get(key) ?? [];
  const withinWindow = existing.filter((timestamp) => now - timestamp < WINDOW_MS);
  const oldest = withinWindow[0] ?? now;
  const resetMs = Math.max(0, WINDOW_MS - (now - oldest));
  const resetSeconds = Math.ceil(resetMs / 1000);
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - withinWindow.length - 1);

  res.setHeader("x-ratelimit-limit", String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader("x-ratelimit-remaining", String(remaining));
  res.setHeader("x-ratelimit-reset", String(resetSeconds));

  if (withinWindow.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - withinWindow[0])) / 1000),
    );
    res.setHeader("retry-after", String(retryAfterSeconds));
    res.status(429).json({
      error: "Too many requests",
      retryAfterSeconds,
    });
    return;
  }

  withinWindow.push(now);
  requestBuckets.set(key, withinWindow);
  next();
}

export function __resetRateLimitForTests(): void {
  requestBuckets.clear();
}
