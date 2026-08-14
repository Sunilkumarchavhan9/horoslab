import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  adaptEpochEvidence,
  adaptEpochExecution,
  adaptEpochMission,
  adaptEpochPolicyDecision,
  adaptEpochVerification,
} from "../lib/epoch/v12/adapters";
import { EPOCH_V12_CONTRACT_VERSION, RuntimeEventV1Schema } from "../lib/epoch/v12/contracts";

describe("Epoch V12 contract adapters", () => {
  it("read legacy Epoch records through one versioned vocabulary", () => {
    const mission = adaptEpochMission({
      id: "mission-1",
      workspaceId: "workspace-1",
      institutionId: "institution-1",
      title: "Legacy mission",
      objective: "Read without rewriting",
      state: "draft",
      plan: ["one"],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const execution = adaptEpochExecution({ id: "exec-1", missionId: mission.id, status: "running", retries: 0 });
    const evidence = adaptEpochEvidence({ id: "evidence-1", missionId: mission.id, kind: "test" });
    const verification = adaptEpochVerification({ id: "verify-1", missionId: mission.id, finalDecision: "review" });
    const policy = adaptEpochPolicyDecision({ id: "policy-1", missionId: mission.id, needsApproval: true });

    expect(mission.contractVersion).toBe(EPOCH_V12_CONTRACT_VERSION);
    expect(execution.state).toBe("running");
    expect(evidence.missionId).toBe(mission.id);
    expect(verification.decision).toBe("UNKNOWN");
    expect(policy.decision).toBe("review");
  });

  it("requires correlation and trace IDs on runtime events", () => {
    expect(() => RuntimeEventV1Schema.parse({
      contractVersion: EPOCH_V12_CONTRACT_VERSION,
      id: "event-1",
      type: "mission.started",
      occurredAt: "2026-01-01T00:00:00.000Z",
      subjectType: "mission",
      subjectId: "mission-1",
      payload: {},
      correlation: { correlationId: "corr-1", traceId: "trace-1" },
    })).not.toThrow();
  });

  it("keeps the three Phase A fixtures present", async () => {
    for (const fixture of ["software-mission", "ai-agent-mission", "simulated-edge-mission"]) {
      const raw = await readFile(`fixtures/epoch/v12/${fixture}.json`, "utf8");
      expect(JSON.parse(raw).contractVersion).toBe(EPOCH_V12_CONTRACT_VERSION);
    }
  });
});
