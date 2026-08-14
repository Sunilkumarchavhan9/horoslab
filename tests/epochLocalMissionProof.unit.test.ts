import { describe, expect, it } from "vitest";
import { runEpochLocalMissionProof } from "../lib/epoch/localMissionProof";

describe("local authenticated mission proof harness", () => {
  it("runs the complete V12 contract chain locally", async () => {
    const proof = await runEpochLocalMissionProof({ workspaceId: "ws-local", institutionId: "inst-local", title: "Local mission", objective: "Verify local execution", acceptanceCriteria: ["Output is accepted"] });
    expect(proof.verification.decision).toBe("PASS");
    expect(proof.policy.decision).toBe("allow");
    expect(proof.events).toHaveLength(4);
    expect(proof.ai.estimatedCostCents).toBe(0);
  });
});
