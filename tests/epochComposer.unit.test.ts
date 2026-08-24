import { describe, expect, it } from "vitest";
import { compileEpochComposerRequest } from "../lib/epoch/canonical";

describe("Epoch Composer canonical compilation", () => {
  it("compiles a technical optimization request without inventing missing reality", () => {
    const plan = compileEpochComposerRequest({
      workspaceId: "workspace-1",
      actorId: "user-1",
      input: "Compare @vLLM and @SGLang for @Qwen/Qwen3-32B on @H100, reduce inference cost by 40% while keeping P99 below 200ms and quality above 95%.",
      now: new Date("2026-08-17T00:00:00.000Z"),
    });

    expect(plan.intent.status).toBe("compiled");
    expect(plan.references.map((ref) => ref.type)).toEqual(["RUNTIME", "RUNTIME", "MODEL", "HARDWARE"]);
    expect(plan.outcomeContract.targetMetrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: "inference_cost", target: 40, operator: "decrease" }),
      expect.objectContaining({ metric: "p99_latency", target: 200, operator: "lte" }),
      expect.objectContaining({ metric: "quality", target: 95, operator: "gte" }),
    ]));
    expect(plan.discoveryRequirements).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "workload", resolution: "discover" }),
    ]));
    expect(plan.outcomeContract.baseline).toEqual({});
  });

  it("creates discovery requirements instead of fabricating physical-world facts", () => {
    const plan = compileEpochComposerRequest({
      workspaceId: "workspace-1",
      actorId: "user-1",
      input: "Teach @model to understand @factory-01 from @video-data and @sensor-data, then predict what happens after an action.",
    });

    expect(plan.mission.state).toBe("discovering");
    expect(plan.discoveryRequirements).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "model" }),
    ]));
    expect(plan.outcomeContract.baseline).toEqual({});
  });

  it("requires clarification when no measurable target is present", () => {
    const plan = compileEpochComposerRequest({
      workspaceId: "workspace-1",
      actorId: "user-1",
      input: "Make our inference system better.",
    });

    expect(plan.discoveryRequirements).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "success_metrics", resolution: "ask" }),
    ]));
    expect(plan.mission.state).toBe("discovering");
  });
});
