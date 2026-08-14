import type { NextFunction, Request, Response } from "express";
import { getRedisClient } from "../../lib/cache/redisClient";

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  keyResolver: (req: Request) => string;
  skip?: (req: Request) => boolean;
};

const WINDOW_MS = 60_000;
const DEFAULT_REDIS_PREFIX = "memoryos:ratelimit";

function resolveRateLimitMaxRequests(defaultProd: number): number {
  const configured = Number(process.env.MEMORYOS_RATE_LIMIT_MAX);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }
  // Local console polls memory + connector endpoints together; avoid 429 during dev.
  if (process.env.NODE_ENV !== "production") {
    return 300;
  }
  return defaultProd;
}

const MAX_REQUESTS_PER_WINDOW = resolveRateLimitMaxRequests(60);
const MAX_MODERATE_REQUESTS_PER_WINDOW = resolveRateLimitMaxRequests(120);

const inMemoryBuckets = new Map<string, number[]>();

function getUserBucketKey(req: Request): string {
  return req.authUserId || "anonymous";
}

function getIpBucketKey(req: Request): string {
  const forwarded = req.header("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();
  const ip = firstForwarded || req.ip || "unknown";
  return `ip:${ip}`;
}

/** Lightweight billing reads are polled by the console; do not count toward the API burst limit. */
function isBillingReadRequest(req: Request): boolean {
  if (req.method !== "GET") return false;
  const path = (req.path || req.url || "").split("?")[0] ?? "";
  return /\/billing(\/events)?$/i.test(path);
}

/** Long-lived SSE streams should not consume API burst quota. */
function isRealtimeStreamRequest(req: Request): boolean {
  if (req.method !== "GET") return false;
  const path = (req.path || req.url || "").split("?")[0] ?? "";
  return /\/events$/i.test(path) || /\/events\/stream$/i.test(path) || path === "/stream";
}

function isMemoryRateLimitExempt(req: Request): boolean {
  return isBillingReadRequest(req) || isRealtimeStreamRequest(req) || isLocalConsoleReadRequest(req);
}

function isLocalConsoleReadRequest(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (req.method !== "GET") return false;
  const path = (req.path || req.url || "").split("?")[0] ?? "";
  return (
    path === "/" ||
    path === "" ||
    path === "/list" ||
    path === "/insights" ||
    path === "/requests" ||
    path === "/timeline" ||
    path === "/summary" ||
    path === "/status" ||
    path === "/usage" ||
    path === "/events" ||
    path === "/connected-agents" ||
    path === "/runtime-proof" ||
    path === "/records" ||
    path === "/sensitive-systems" ||
    path === "/risk-trend" ||
    path === "/approval-throughput" ||
    path === "/memoryignition/runtime-timeline"
  );
}

/** Connector dashboards poll these read-only status endpoints. Writes/sync/OAuth stay limited. */
function isConnectorReadRequest(req: Request): boolean {
  if (req.method !== "GET") return false;
  const path = (req.path || req.url || "").split("?")[0] ?? "";
  return (
    path === "/" ||
    path === "" ||
    path === "/health" ||
    path === "/logs" ||
    path === "/events" ||
    path === "/github/profile" ||
    path === "/github/repos"
  );
}

async function applyInMemoryLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number; resetSeconds: number; retryAfterSeconds?: number }> {
  const now = Date.now();
  const existing = inMemoryBuckets.get(key) ?? [];
  const withinWindow = existing.filter((timestamp) => now - timestamp < windowMs);
  const oldest = withinWindow[0] ?? now;
  const resetMs = Math.max(0, windowMs - (now - oldest));
  const resetSeconds = Math.ceil(resetMs / 1000);
  const remaining = Math.max(0, maxRequests - withinWindow.length - 1);

  if (withinWindow.length >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - withinWindow[0])) / 1000),
    );
    return { allowed: false, remaining: 0, resetSeconds, retryAfterSeconds };
  }

  withinWindow.push(now);
  inMemoryBuckets.set(key, withinWindow);
  return { allowed: true, remaining, resetSeconds };
}

async function applyRedisLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number; resetSeconds: number; retryAfterSeconds?: number } | null> {
  const client = await getRedisClient();
  if (!client) return null;

  const now = Date.now();
  const windowStart = now - windowMs;
  const prefix = process.env.RATE_LIMIT_REDIS_PREFIX?.trim() || DEFAULT_REDIS_PREFIX;
  const redisKey = `${prefix}:${key}`;

  await client.multi()
    .zRemRangeByScore(redisKey, 0, windowStart)
    .zAdd(redisKey, { score: now, value: `${now}-${Math.random().toString(36).slice(2, 10)}` })
    .expire(redisKey, Math.ceil(windowMs / 1000))
    .exec();

  const count = await client.zCard(redisKey);
  const oldest = await client.zRangeWithScores(redisKey, 0, 0);
  const oldestScore = oldest[0]?.score ?? now;
  const resetMs = Math.max(0, windowMs - (now - oldestScore));
  const resetSeconds = Math.ceil(resetMs / 1000);
  const remaining = Math.max(0, maxRequests - count);

  if (count > maxRequests) {
    const retryAfterSeconds = Math.max(1, resetSeconds);
    return { allowed: false, remaining: 0, resetSeconds, retryAfterSeconds };
  }

  return { allowed: true, remaining, resetSeconds };
}

async function runUpstashRestCommand<T>(command: unknown[]): Promise<T | null> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!restUrl || !restToken) return null;

  try {
    const response = await fetch(restUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${restToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { result?: T; error?: unknown };
    if (payload.error) return null;
    return payload.result ?? null;
  } catch {
    return null;
  }
}

async function applyUpstashRestLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number; resetSeconds: number; retryAfterSeconds?: number } | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL?.trim() || !process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) {
    return null;
  }

  const now = Date.now();
  const windowSeconds = Math.ceil(windowMs / 1000);
  const windowId = Math.floor(now / windowMs);
  const prefix = process.env.RATE_LIMIT_REDIS_PREFIX?.trim() || DEFAULT_REDIS_PREFIX;
  const redisKey = `${prefix}:${key}:${windowId}`;
  const count = await runUpstashRestCommand<number>(["INCR", redisKey]);
  if (count === null || !Number.isFinite(count)) return null;

  if (count === 1) {
    await runUpstashRestCommand<number>(["EXPIRE", redisKey, windowSeconds]);
  }

  const resetSeconds = Math.max(1, Math.ceil(((windowId + 1) * windowMs - now) / 1000));
  const remaining = Math.max(0, maxRequests - count);
  if (count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      retryAfterSeconds: resetSeconds,
    };
  }

  return { allowed: true, remaining, resetSeconds };
}

function buildRateLimiter(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (config.skip?.(req)) {
      next();
      return;
    }

    const key = config.keyResolver(req);
    const redisResult =
      await applyUpstashRestLimit(key, config.windowMs, config.maxRequests) ??
      await applyRedisLimit(key, config.windowMs, config.maxRequests);
    const result = redisResult ?? await applyInMemoryLimit(key, config.windowMs, config.maxRequests);

    res.setHeader("x-ratelimit-limit", String(config.maxRequests));
    res.setHeader("x-ratelimit-remaining", String(result.remaining));
    res.setHeader("x-ratelimit-reset", String(result.resetSeconds));

    if (!result.allowed) {
      res.setHeader("retry-after", String(result.retryAfterSeconds ?? 1));
      res.status(429).json({
        error: "Too many requests",
        retryAfterSeconds: result.retryAfterSeconds ?? 1,
      });
      return;
    }

    next();
  };
}

export const rateLimitMemoryApi = buildRateLimiter({
  windowMs: WINDOW_MS,
  maxRequests: MAX_REQUESTS_PER_WINDOW,
  keyResolver: getUserBucketKey,
  skip: isMemoryRateLimitExempt,
});

export const rateLimitModerateApi = buildRateLimiter({
  windowMs: WINDOW_MS,
  maxRequests: MAX_MODERATE_REQUESTS_PER_WINDOW,
  keyResolver: getUserBucketKey,
  skip: (req) => isRealtimeStreamRequest(req) || isConnectorReadRequest(req) || isLocalConsoleReadRequest(req),
});

export const rateLimitStrictApi = buildRateLimiter({
  windowMs: WINDOW_MS,
  maxRequests: 30,
  keyResolver: getUserBucketKey,
});

export const rateLimitWebhookIp = buildRateLimiter({
  windowMs: WINDOW_MS,
  maxRequests: 30,
  keyResolver: getIpBucketKey,
});

export function __resetRateLimitForTests(): void {
  inMemoryBuckets.clear();
}
