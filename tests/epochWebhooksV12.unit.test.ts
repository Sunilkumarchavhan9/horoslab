import { describe, expect, it } from "vitest";
import { createEpochWebhook, verifyEpochWebhook } from "../lib/epoch/webhooksV12";

describe("Phase I signed V12 webhooks", () => {
  it("signs and verifies a recent workspace-scoped envelope", () => {
    const occurredAt = "2026-01-01T00:00:00.000Z";
    const webhook = createEpochWebhook({ version: "epoch.webhook.v1", eventId: "e1", eventType: "mission.completed", workspaceId: "ws1", occurredAt, payload: { missionId: "m1" } }, "secret");
    expect(verifyEpochWebhook(webhook, "secret", { now: new Date("2026-01-01T00:01:00.000Z") })).toBe(true);
    expect(verifyEpochWebhook({ ...webhook, payload: { missionId: "m2" } }, "secret", { now: new Date("2026-01-01T00:01:00.000Z") })).toBe(false);
  });

  it("rejects replayed old envelopes", () => {
    const webhook = createEpochWebhook({ version: "epoch.webhook.v1", eventId: "e2", eventType: "mission.failed", workspaceId: "ws1", occurredAt: "2026-01-01T00:00:00.000Z", payload: {} }, "secret");
    expect(verifyEpochWebhook(webhook, "secret", { now: new Date("2026-01-01T01:00:00.000Z") })).toBe(false);
  });
});
