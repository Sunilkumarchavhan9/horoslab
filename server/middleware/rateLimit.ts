import type { NextFunction, Request, Response } from "express";
import type { RedisClientType } from "redis";

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  keyResolver: (req: Request) => string;
  skip?: (req: Request) => boolean;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const DEFAULT_REDIS_PREFIX = "memoryos:ratelimit";

const inMemoryBuckets = new Map<string, number[]>();
let redisClientPromise: Promise<RedisClientType | null> | null = null;

async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClientPromise) return redisClientPromise;

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) return null;

  redisClientPromise = (async () => {
    try {
      const redisModule = await import("redis");
      const client = redisModule.createClient({ url: redisUrl });
      client.on("error", () => {
        // Degrade to in-memory limiter on redis errors.
      });
      await client.connect();
      return client as RedisClientType;
    } catch {
      return null;
    }
  })();

  return redisClientPromise;
}

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
    const redisResult = await applyRedisLimit(key, config.windowMs, config.maxRequests);
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
  skip: isBillingReadRequest,
});

export const rateLimitModerateApi = buildRateLimiter({
  windowMs: WINDOW_MS,
  maxRequests: 120,
  keyResolver: getUserBucketKey,
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
