import { describe, expect, it } from "vitest";
import {
  assertFreshState,
  assertIndependentVerification,
  assertTeachingEligible,
  assertTenantScope,
  EPOCH_CANONICAL_CONTRACT_VERSION,
  MissionSchema,
  ObservationSchema,
  StateSnapshotSchema,
  VerificationSchema,
  WorldExperienceSchema,
} from "../lib/epoch/canonical";

const now = "2026-08-17T00:00:00.000Z";
const metadata = {
  contractVersion: EPOCH_CANONICAL_CONTRACT_VERSION,
  id: "id-1",
  workspaceId: "workspace-1",
  createdAt: now,
  updatedAt: now,
  correlation: { correlationId: "correlation-1", traceId: "trace-1" },
};

describe("Epoch canonical Day-1 contracts", () => {
  it("covers the permanent mission object and its tenant scope", () => {
    const mission = MissionSchema.parse({
      ...metadata,
      title: "Optimize inference",
      objective: "Reduce inference cost by 40%",
      state: "draft",
      intentId: "intent-1",
      outcomeContractId: "outcome-1",
      authorityPolicyId: "policy-1",
    });

    expect(mission.state).toBe("draft");
    expect(() => assertTenantScope(mission, "other-workspace")).toThrow("CROSS_TENANT_ACCESS_BLOCKED");
    expect(() => assertTenantScope(mission, "workspace-1")).not.toThrow();
  });

  it("rejects observations without mission or experiment lineage", () => {
    expect(() => ObservationSchema.parse({
      ...metadata,
      environmentId: "environment-1",
      kind: "latency",
      value: { p99: 210 },
      observedAt: now,
      provenance: { classification: "MEASURED", confidence: 1, derivation: [] },
    })).toThrow();
  });

  it("blocks stale state before consequential action", () => {
    expect(() => assertFreshState(StateSnapshotSchema.parse({
      ...metadata,
      environmentId: "environment-1",
      version: 2,
      observedAt: now,
      facts: [],
      freshness: "stale",
      integritySha256: "a".repeat(64),
    }))).toThrow("STALE_CONSEQUENTIAL_STATE");
  });

  it("requires independent verification and approved teaching eligibility", () => {
    const verification = VerificationSchema.parse({
      ...metadata,
      missionId: "mission-1",
      evidenceIds: ["evidence-1"],
      verifierId: "verifier-1",
      method: "independent telemetry comparison",
      observationWindow: { start: now, end: "2026-08-18T00:00:00.000Z" },
      verdict: "VERIFIED",
      findings: [],
      independent: true,
    });
    expect(() => assertIndependentVerification(verification)).not.toThrow();

    const experience = {
      teachingEligibility: "eligible" as const,
      privacy: "approved" as const,
      license: "approved" as const,
      safety: "approved" as const,
    };
    expect(() => assertTeachingEligible(experience)).not.toThrow();
    expect(() => assertTeachingEligible({ ...experience, privacy: "restricted" })).toThrow("TEACHING_ELIGIBILITY_REQUIRED");
  });

  it("keeps physical-world teaching in the same permanent contract family", () => {
    const experience = WorldExperienceSchema.parse({
      ...metadata,
      missionId: "mission-1",
      environmentId: "factory-1",
      initialStateId: "state-1",
      observationIds: ["camera-observation-1", "sensor-observation-1"],
      unknownIds: [],
      evidenceIds: ["evidence-1"],
      verificationId: "verification-1",
      lessonIds: ["lesson-1"],
      provenance: [{ classification: "VERIFIED", confidence: 1, derivation: [] }],
      privacy: "approved",
      license: "approved",
      safety: "approved",
      teachingEligibility: "eligible",
      lineage: ["mission-1", "verification-1"],
    });
    expect(experience.environmentId).toBe("factory-1");
  });

  it("treats environments and teaching records as canonical entities", async () => {
    const { EnvironmentSchema, TeachingRecordSchema } = await import("../lib/epoch/canonical");
    expect(EnvironmentSchema.parse({ ...metadata, name: "factory", kind: "physical", configuration: {}, topology: {}, status: "discovered", provenance: { classification: "OBSERVED", confidence: 1 }, freshness: "fresh" }).kind).toBe("physical");
    expect(TeachingRecordSchema.parse({ ...metadata, experienceId: "experience-1", target: "world_model", status: "candidate", sourceVerificationId: "verification-1", lineage: ["experience-1"] }).status).toBe("candidate");
  });
});
