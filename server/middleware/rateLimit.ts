import type { NextFunction, Request, Response } from "express";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

const requestBuckets = new Map<string, number[]>();

function getBucketKey(req: Request): string {
  return req.authUserId || "anonymous";
}

export function rateLimitMemoryApi(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const now = Date.now();
  const key = getBucketKey(req);
  const existing = requestBuckets.get(key) ?? [];
  const withinWindow = existing.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (withinWindow.length >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  withinWindow.push(now);
  requestBuckets.set(key, withinWindow);
  next();
}

export function __resetRateLimitForTests(): void {
  requestBuckets.clear();
}
