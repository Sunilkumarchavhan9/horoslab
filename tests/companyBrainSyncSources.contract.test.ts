import { afterEach, describe, expect, it, vi } from "vitest";

const connectorManagerMocks = vi.hoisted(() => ({
  triggerSync: vi.fn(),
}));

vi.mock("@/lib/integrations/connectorManager", () => ({
  ConnectorManager: {
    triggerSync: connectorManagerMocks.triggerSync,
  },
}));

vi.mock("../lib/integrations/connectorManager", () => ({
  ConnectorManager: {
    triggerSync: connectorManagerMocks.triggerSync,
  },
}));

import { listSources, syncAllSources, upsertSource } from "@/lib/companyBrain/platform";

describe("Company Brain source sync", () => {
  afterEach(() => {
    connectorManagerMocks.triggerSync.mockReset();
  });

  it("skips GitHub sync when the connector has no access token", async () => {
    const userId = `user_sync_skip_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    await upsertSource(userId, {
      type: "github",
      enabled: true,
      config: {},
    });

    const result = await syncAllSources(userId);

    expect(result.syncedSources).toBe(1);
    expect(result.extractedCount).toBe(0);
    expect(connectorManagerMocks.triggerSync).not.toHaveBeenCalled();
  });

  it("passes the stored GitHub token into the sync engine", async () => {
    const userId = `user_sync_token_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    connectorManagerMocks.triggerSync.mockResolvedValue({
      success: true,
      extractedCount: 7,
    });
    await upsertSource(userId, {
      type: "github",
      enabled: true,
      config: { accessToken: "gh-token-123" },
    });

    const result = await syncAllSources(userId);

    expect(result.syncedSources).toBe(1);
    expect(result.extractedCount).toBe(7);
    expect(connectorManagerMocks.triggerSync).toHaveBeenCalledWith(
      userId,
      "github",
      "gh-token-123",
      undefined,
      undefined,
      { accessToken: "gh-token-123" },
    );
  });

  it("disables a source and requires reconnect after an auth failure", async () => {
    const userId = `user_sync_bad_token_${Date.now()}`;
    const badCredentials = Object.assign(new Error("Bad credentials"), { status: 401 });
    connectorManagerMocks.triggerSync.mockRejectedValue(badCredentials);
    await upsertSource(userId, {
      type: "github",
      enabled: true,
      config: { accessToken: "expired-gh-token" },
    });

    const firstResult = await syncAllSources(userId);
    const sourcesAfterFailure = await listSources(userId);
    connectorManagerMocks.triggerSync.mockClear();

    const secondResult = await syncAllSources(userId);

    expect(firstResult.failedSources).toBe(1);
    expect(sourcesAfterFailure[0]).toEqual(expect.objectContaining({
      enabled: false,
      config: expect.objectContaining({
        tokenHealth: "invalid",
        reconnectRequired: true,
        lastFailureReason: "Bad credentials",
      }),
    }));
    expect(sourcesAfterFailure[0].config).not.toHaveProperty("accessToken");
    expect(secondResult.syncedSources).toBe(0);
    expect(connectorManagerMocks.triggerSync).not.toHaveBeenCalled();
  });
});
