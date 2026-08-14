import { describe, expect, it } from "vitest";
import { resolveAllowedCorsOrigins } from "../server/middleware/cors";

describe("CORS config", () => {
  it("uses explicit production origins when configured", () => {
    expect(
      resolveAllowedCorsOrigins({
        MEMORYOS_CORS_ORIGINS: "https://app.memoryos.dev, https://console.memoryos.dev/",
      } as NodeJS.ProcessEnv),
    ).toEqual(["https://app.memoryos.dev", "https://console.memoryos.dev"]);
  });

  it("derives an origin from the connector callback URL", () => {
    expect(
      resolveAllowedCorsOrigins({
        NEXT_PUBLIC_CONNECTOR_CALLBACK_URL: "https://app.memoryos.dev/api/connector/callback",
      } as NodeJS.ProcessEnv),
    ).toEqual(["https://app.memoryos.dev"]);
  });

  it("falls back to localhost only when no deployment origin is configured", () => {
    expect(resolveAllowedCorsOrigins({} as NodeJS.ProcessEnv)).toEqual([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]);
  });
});
