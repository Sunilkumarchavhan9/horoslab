import { describe, expect, it } from "vitest";
import {
  buildConnectorFreshness,
  resolveConnectorStaleThresholdSeconds,
} from "@/lib/integrations/connectorFreshness";

describe("Connector freshness contract", () => {
  it("uses a 30 minute stale threshold for slack by default", () => {
    expect(resolveConnectorStaleThresholdSeconds("slack")).toBe(1800);
  });

  it("marks connected slack as stale after 30 minutes without sync", () => {
    const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    const snapshot = buildConnectorFreshness({
      type: "slack",
      status: "connected",
      lastSyncAt: thirtyOneMinutesAgo,
      recordCount: 12,
    });
    expect(snapshot.staleThresholdSeconds).toBe(1800);
    expect(snapshot.stale).toBe(true);
    expect(snapshot.freshness).toBe("stale");
  });

  it("surfaces slack sync errors in lastError for operator diagnostics", () => {
    const snapshot = buildConnectorFreshness({
      type: "slack",
      status: "connected",
      lastSyncAt: new Date().toISOString(),
      recordCount: 0,
      lastSyncLogError: "Slack conversations.history failed (not_in_channel): Invite the Slack app to the channel",
    });
    expect(snapshot.lastError).toContain("not_in_channel");
    expect(snapshot.freshness).toBe("error");
  });
});
