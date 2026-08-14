import { afterEach, describe, expect, it } from "vitest";
import { probeEpochAiProvider } from "../lib/epoch/aiHealth";

describe("AI provider health probes", () => {
  const previousEndpoint = process.env.EPOCH_OPENROUTER_AI_ENDPOINT;
  const previousKey = process.env.EPOCH_OPENROUTER_AI_API_KEY;

  afterEach(() => {
    if (previousEndpoint === undefined) delete process.env.EPOCH_OPENROUTER_AI_ENDPOINT;
    else process.env.EPOCH_OPENROUTER_AI_ENDPOINT = previousEndpoint;
    if (previousKey === undefined) delete process.env.EPOCH_OPENROUTER_AI_API_KEY;
    else process.env.EPOCH_OPENROUTER_AI_API_KEY = previousKey;
  });

  it("reports configured provider reachability without making a completion request", async () => {
    process.env.EPOCH_OPENROUTER_AI_ENDPOINT = "https://provider.test/v1/chat/completions";
    process.env.EPOCH_OPENROUTER_AI_API_KEY = "test-key";
    const result = await probeEpochAiProvider({
      provider: "openrouter",
      fetch: async (_url, init) => {
        expect(init?.method).toBe("HEAD");
        expect(init?.body).toBeUndefined();
        return new Response(null, { status: 204 });
      },
    });
    expect(result).toMatchObject({ provider: "openrouter", configured: true, reachable: true, status: "healthy", httpStatus: 204 });
  });

  it("fails closed on an unreachable provider and distinguishes unconfigured providers", async () => {
    process.env.EPOCH_OPENROUTER_AI_ENDPOINT = "https://provider.test/v1/chat/completions";
    process.env.EPOCH_OPENROUTER_AI_API_KEY = "test-key";
    const offline = await probeEpochAiProvider({ provider: "openrouter", fetch: async () => { throw new Error("network down"); } });
    const unconfigured = await probeEpochAiProvider({ provider: "private" });
    expect(offline.status).toBe("offline");
    expect(unconfigured.status).toBe("unconfigured");
  });
});
