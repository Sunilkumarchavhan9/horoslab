import { afterEach, describe, expect, it, vi } from "vitest";

describe("Context adapter registry defaults", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("falls back to no-op context adapter when Supermemory is not configured", async () => {
    delete process.env.SUPERMEMORY_API_KEY;
    delete process.env.SUPERMEMORY_BASE_URL;
    delete process.env.SUPERMEMORY_PROJECT;
    process.env.SUPERMEMORY_API_KEY = "";
    process.env.SUPERMEMORY_BASE_URL = "";
    process.env.SUPERMEMORY_PROJECT = "";

    const { getContextAdapter, resetContextAdapter } = await import(
      "../lib/adapters/registry.js"
    );
    const { SupermemoryContextAdapter } = await import(
      "../lib/adapters/supermemoryContextAdapter.js"
    );

    resetContextAdapter();
    const adapter = getContextAdapter();

    expect(adapter).not.toBeInstanceOf(SupermemoryContextAdapter);

    resetContextAdapter();
  });

  it("returns a SupermemoryContextAdapter when Supermemory env is configured", async () => {
    process.env.SUPERMEMORY_API_KEY = "sm_test_key";
    process.env.SUPERMEMORY_PROJECT = "memoryos";

    const { getContextAdapter, resetContextAdapter } = await import(
      "../lib/adapters/registry.js"
    );
    const { SupermemoryContextAdapter } = await import(
      "../lib/adapters/supermemoryContextAdapter.js"
    );

    resetContextAdapter();
    const adapter = getContextAdapter();

    expect(adapter).toBeInstanceOf(SupermemoryContextAdapter);

    resetContextAdapter();
  });
});
