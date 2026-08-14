import { describe, expect, it } from "vitest";
import { assertIndependentVerifier } from "../lib/epoch/verifierAssignments";

describe("Epoch independent verifier assignments", () => {
  it("rejects the execution worker as verifier", () => {
    expect(() => assertIndependentVerifier({ verifierId: "worker-1", executionWorkerId: "worker-1" })).toThrow("epoch_verifier_must_be_independent");
  });

  it("allows a distinct verifier identity", () => {
    expect(() => assertIndependentVerifier({ verifierId: "worker-2", executionWorkerId: "worker-1" })).not.toThrow();
  });
});
