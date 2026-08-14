import { describe, expect, it } from "vitest";
import { DecisionService } from "../lib/reality/decisions/DecisionService";

describe("DecisionService", () => {
  it("seeds decisions and supports record/evaluate flows", () => {
    const service = new DecisionService();

    const initial = service.list();
    expect(initial.length).toBeGreaterThan(0);
    expect(initial[0]?.subjectId).toBe("reality-fabric");

    const evaluated = service.evaluate({
      subjectId: "mission-runtime",
      subjectType: "mission",
      evidenceIds: ["evidence-1"],
      impactIds: ["impact-1"],
      reason: "The runtime needs a decision layer.",
      confidence: 0.88,
      createdBy: "codex",
    });
    expect(evaluated.outcome).toBe("approve");

    const recorded = service.record({
      subjectId: "api-watch",
      subjectType: "watcher",
      outcome: "review",
      reason: "Needs more evidence before auto-approval.",
      evidenceIds: ["evidence-2"],
      confidence: 0.66,
    });
    expect(recorded.outcome).toBe("review");
    expect(service.summary().total).toBeGreaterThanOrEqual(3);
    expect(service.get(recorded.id)?.reason).toContain("Needs more evidence");
  });
});
