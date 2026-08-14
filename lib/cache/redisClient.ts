import type { RedisClientType } from "redis";

let redisClientPromise: Promise<RedisClientType | null> | null = null;

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClientPromise) return redisClientPromise;

  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) return null;

  redisClientPromise = (async () => {
    try {
      const redisModule = await import("redis");
      const client = redisModule.createClient({ url: redisUrl });
      client.on("error", () => {
        // Redis is an acceleration layer here; callers must keep a durable fallback.
      });
      await client.connect();
      return client as RedisClientType;
    } catch {
      return null;
    }
  })();

  return redisClientPromise;
}

export function __resetRedisClientForTests(): void {
  redisClientPromise = null;
}
