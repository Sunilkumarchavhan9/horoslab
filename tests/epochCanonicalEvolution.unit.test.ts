import { describe, expect, it } from "vitest";
import { buildAgentPolicyRevision, buildModelRevision, buildSkillRevision, buildWorldModel } from "../lib/epoch/canonical";

const base = { workspaceId: "ws-1", missionId: "mission-1", correlationId: "corr-1", traceId: "trace-1", now: new Date("2026-08-17T00:00:00.000Z") };

describe("Epoch canonical evolution", () => {
  it("creates lineage-bearing revision contracts", async () => {
    const model = await buildModelRevision({ ...base, modelProfileId: "model-1", revision: "r1", artifactDigest: "sha256:abc", lifecycle: "candidate" });
    const skill = await buildSkillRevision({ ...base, skillId: "skill-1", version: "1.0.0", lifecycle: "candidate" });
    const policy = await buildAgentPolicyRevision({ ...base, agentId: "agent-1", version: "1.0.0", lifecycle: "candidate" });
    expect(model.lineage).toContain("model-1"); expect(skill.lineage).toContain("skill-1"); expect(policy.lineage).toContain("agent-1");
  });
  it("represents a versioned physical-world model", async () => {
    const world = await buildWorldModel({ ...base, environmentId: "env-1", version: "v1", entityIds: ["entity-1"], observationIds: ["observation-1"], dynamics: { temperature: "bounded" }, lifecycle: "candidate" });
    expect(world.lifecycle).toBe("candidate"); expect(world.lineage).toContain("observation-1");
  });
});
