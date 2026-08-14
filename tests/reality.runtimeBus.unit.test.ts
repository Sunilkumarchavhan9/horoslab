import { beforeEach, describe, expect, it } from "vitest";
import { RealityRuntime } from "../lib/reality/realityRuntime";

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("RealityRuntime runtime bus", () => {
  beforeEach(() => {
    RealityRuntime.resetForTests();
  });

  it("publishes domain events for graph writes and decision-driven impact calculation", async () => {
    const node = RealityRuntime.createNode({
      type: "service",
      name: "Runtime Bus Probe",
      metadata: { probe: true },
    });

    const decision = RealityRuntime.recordDecision({
      subjectId: "mission-runtime",
      subjectType: "mission",
      outcome: "approve",
      reason: "The runtime bus should drive downstream impact calculation.",
      evidenceIds: ["evidence-1"],
      impactIds: ["impact-1"],
      createdBy: "codex",
    });

    await tick();
    await tick();

    const runtimeEvents = RealityRuntime.listRuntimeEvents(10);
    const eventTypes = runtimeEvents.map((event) => event.type);

    expect(node.name).toBe("Runtime Bus Probe");
    expect(decision.outcome).toBe("approve");
    expect(eventTypes).toContain("RealityNodeCreated");
    expect(eventTypes).toContain("DecisionCreated");
    expect(eventTypes).toContain("ImpactCalculated");
    expect(runtimeEvents.every((event) => event.context.institutionId === "reality-fabric")).toBe(true);
    expect(runtimeEvents.every((event) => event.context.workspaceId === "memoryos-core")).toBe(true);
  });
});
