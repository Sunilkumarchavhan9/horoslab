import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { isEpochEdgeEnrollmentValid, issueEpochEdgeEnrollment, replayEpochEdgeQueue, replayEpochEdgeQueueOrdered, runEpochEdgeSimulation, signEpochEdgeEnrollment, signEpochEdgeTelemetry, validateEpochEdgeTelemetrySequence, validateEpochEdgeUpdate, verifyEpochEdgeEnrollment, verifyEpochEdgeTelemetry } from "../lib/epoch/edgeRuntime";

describe("Phase H edge runtime", () => {
  it("issues expiring Worker Protocol enrollment", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const enrollment = issueEpochEdgeEnrollment({ workerId: "w1", workspaceId: "ws1", now, ttlMs: 60_000 });
    expect(enrollment.protocol).toBe("epoch.worker.v1");
    expect(isEpochEdgeEnrollmentValid(enrollment, new Date("2026-01-01T00:00:30.000Z"))).toBe(true);
    expect(isEpochEdgeEnrollmentValid(enrollment, new Date("2026-01-01T00:02:00.000Z"))).toBe(false);
  });

  it("signs telemetry and rejects tampering", () => {
    const telemetry = { workerId: "w1", sequence: 1, observedAt: "2026-01-01T00:00:00.000Z", connectivity: "offline" as const, metrics: { queueDepth: 2 } };
    const signed = { ...telemetry, signature: signEpochEdgeTelemetry(telemetry, "secret") };
    expect(verifyEpochEdgeTelemetry(signed, "secret")).toBe(true);
    expect(verifyEpochEdgeTelemetry({ ...signed, sequence: 2 }, "secret")).toBe(false);
  });

  it("replays only accepted offline jobs and increments failed attempts", () => {
    const result = replayEpochEdgeQueue([{ id: "a", payload: {}, queuedAt: "now", attempts: 0 }, { id: "b", payload: {}, queuedAt: "now", attempts: 1 }], (job) => job.id === "a");
    expect(result.completed).toEqual(["a"]);
    expect(result.remaining[0]).toMatchObject({ id: "b", attempts: 2 });
  });

  it("requires signed update metadata", () => {
    const payload = "binary"; const version = "1.0.1"; const checksum = "sha256:abc";
    const signature = createHmac("sha256", "secret").update(`${version}:${checksum}:${payload}`).digest("hex");
    expect(validateEpochEdgeUpdate({ version, checksum, signature, payload }, "secret")).toBe(true);
  });

  it("verifies signed enrollment identity and expiry", () => {
    const enrollment = issueEpochEdgeEnrollment({ workerId: "w1", workspaceId: "ws1", now: new Date("2026-01-01T00:00:00.000Z") });
    const signed = { ...enrollment, signature: signEpochEdgeEnrollment(enrollment, "secret") };
    expect(verifyEpochEdgeEnrollment(signed, "secret", new Date("2026-01-01T00:01:00.000Z"))).toBe(true);
    expect(verifyEpochEdgeEnrollment({ ...signed, workspaceId: "other" }, "secret", new Date("2026-01-01T00:01:00.000Z"))).toBe(false);
  });

  it("preserves ordered offline execution after a failed head job", () => {
    const queue = [
      { id: "second", payload: {}, queuedAt: "2026-01-01T00:00:02Z", attempts: 0, sequence: 2 },
      { id: "first", payload: {}, queuedAt: "2026-01-01T00:00:01Z", attempts: 0, sequence: 1 },
    ];
    const result = replayEpochEdgeQueueOrdered(queue, () => false);
    expect(result.completed).toEqual([]);
    expect(result.remaining.map((job) => job.id)).toEqual(["first", "second"]);
    expect(result.remaining[1].attempts).toBe(0);
  });

  it("rejects telemetry duplicates, gaps, and regressions", () => {
    expect(validateEpochEdgeTelemetrySequence({ currentSequence: 1 })).toMatchObject({ accepted: true, reason: "initial" });
    expect(validateEpochEdgeTelemetrySequence({ previousSequence: 1, currentSequence: 2 })).toMatchObject({ accepted: true, reason: "next" });
    expect(validateEpochEdgeTelemetrySequence({ previousSequence: 1, currentSequence: 1 }).accepted).toBe(false);
    expect(validateEpochEdgeTelemetrySequence({ previousSequence: 1, currentSequence: 3 }).reason).toBe("gap");
    expect(validateEpochEdgeTelemetrySequence({ previousSequence: 2, currentSequence: 1 }).reason).toBe("regression");
  });

  it("runs a signed simulated edge mission without bypassing ordered replay", () => {
    const enrollment = issueEpochEdgeEnrollment({ workerId: "w1", workspaceId: "ws1", now: new Date("2026-01-01T00:00:00.000Z") });
    const signedEnrollment = { ...enrollment, signature: signEpochEdgeEnrollment(enrollment, "enrollment-secret") };
    const telemetry = { workerId: "w1", sequence: 1, observedAt: "2026-01-01T00:00:10.000Z", connectivity: "online" as const, metrics: { queueDepth: 1 } };
    const signedTelemetry = { ...telemetry, signature: signEpochEdgeTelemetry(telemetry, "telemetry-secret") };
    const result = runEpochEdgeSimulation({ enrollment: signedEnrollment, enrollmentSecret: "enrollment-secret", telemetry: signedTelemetry, telemetrySecret: "telemetry-secret", queue: [{ id: "job-1", payload: {}, queuedAt: "2026-01-01T00:00:11Z", attempts: 0, sequence: 1 }], execute: () => true, now: new Date("2026-01-01T00:00:20.000Z") });
    expect(result).toMatchObject({ enrollmentValid: true, telemetryValid: true, telemetrySequence: { accepted: true }, replay: { completed: ["job-1"], remaining: [] } });
  });
});
