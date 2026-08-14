import { describe, expect, it } from "vitest";
import { ImpactService } from "../lib/reality/impacts/ImpactService";
import type { RealityGraphSnapshot } from "../lib/reality/models/RealityTypes";

describe("ImpactService", () => {
  it("assesses impact from a graph snapshot and decision context", () => {
    const service = new ImpactService();
    const graph: RealityGraphSnapshot = {
      nodes: [
        { id: "root", type: "institution", name: "Reality Fabric", state: "healthy", metadata: {}, createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z" },
        { id: "mission", type: "mission", name: "Mission Runtime", state: "healthy", metadata: {}, createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z" },
        { id: "evidence", type: "evidence", name: "Evidence Index", state: "healthy", metadata: {}, createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z" },
      ],
      edges: [
        { id: "e1", from: "root", to: "mission", relationship: "projects", confidence: 0.9, metadata: {}, createdAt: "2026-07-27T00:00:00.000Z" },
        { id: "e2", from: "mission", to: "evidence", relationship: "generates", confidence: 0.9, metadata: {}, createdAt: "2026-07-27T00:00:00.000Z" },
      ],
    };

    const assessment = service.assess(graph, "mission", {
      id: "decision-1",
      subjectId: "mission",
      subjectType: "mission",
      outcome: "approve",
      reason: "Evidence is sufficient.",
      evidenceIds: ["evidence-1"],
      impactIds: ["root"],
      confidence: 0.9,
      createdAt: "2026-07-27T00:00:00.000Z",
      createdBy: "codex",
    });

    expect(assessment).toMatchObject({
      subjectId: "mission",
      subjectType: "mission",
      riskLevel: expect.any(String),
      predictedImpact: expect.stringContaining("Mission Runtime"),
    });
    expect(service.summary().total).toBe(1);
  });
});
