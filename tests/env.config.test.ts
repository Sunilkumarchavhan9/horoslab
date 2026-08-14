import { afterEach, describe, expect, it } from "vitest";
import { __resetEnvCacheForTests, loadEnvConfig } from "../lib/config/env";

describe("Environment config loader", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    __resetEnvCacheForTests();
  });

  it("loads valid env values", () => {
    process.env.MEMORY_STORE_PROVIDER = "prisma";
    process.env.JWT_SECRET = "this-is-a-long-test-secret";
    process.env.JWT_ISSUER = "memoryos-test";
    process.env.JWT_AUDIENCE = "memoryos-api";
    process.env.PORT = "3001";

    const env = loadEnvConfig();
    expect(env.port).toBe(3001);
    expect(env.jwtIssuer).toBe("memoryos-test");
    expect(env.jwtAudience).toBe("memoryos-api");
  });

  it("throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    process.env.JWT_ISSUER = "memoryos-test";
    process.env.JWT_AUDIENCE = "memoryos-api";

    expect(() => loadEnvConfig()).toThrow();
  });
});

