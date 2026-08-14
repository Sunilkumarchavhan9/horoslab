import { describe, expect, it } from "vitest";
import {
  buildMissionLoopMetadata,
  canPerformPrivilegedAction,
  deterministicAssurance,
  isExecutionTimedOut,
  readyMissionSteps,
  recordMissionCheckpoint,
  requestMissionCancellation,
} from "../lib/epoch/missionLoop";

describe("Phase B mission loop", () => {
  it("completes 25 seeded missions without corrupting step dependencies", () => {
    for (let index = 0; index < 25; index += 1) {
      let loop = buildMissionLoopMetadata({ objective: `Seeded mission ${index}`, plan: ["plan", "execute", "verify"] });
      for (const step of loop.steps) {
        expect(readyMissionSteps(loop).map((item) => item.id)).toContain(step.id);
        loop = recordMissionCheckpoint(loop, { stepId: step.id, status: "completed", attempt: 1, evidenceIds: [`evidence-${index}-${step.id}`] });
      }
      expect(loop.checkpoints.filter((checkpoint) => checkpoint.status === "completed")).toHaveLength(3);
      expect(readyMissionSteps(loop)).toHaveLength(0);
      expect(deterministicAssurance({ evidenceCount: 3, acceptancePassed: true, humanApproval: "approved", confidence: 100 })).toBe("PASS");
    }
  });

  it("resumes from a durable checkpoint after restart", () => {
    const beforeRestart = recordMissionCheckpoint(
      buildMissionLoopMetadata({ objective: "restart-safe", plan: ["plan", "execute", "verify"] }),
      { stepId: "step_1", status: "completed", attempt: 1, evidenceIds: ["evidence-1"] },
    );
    const afterRestart = JSON.parse(JSON.stringify(beforeRestart));
    expect(readyMissionSteps(afterRestart).map((step: { id: string }) => step.id)).toEqual(["step_2"]);
  });

  it("cancellation blocks privileged actions and timeout is deterministic", () => {
    const cancelled = requestMissionCancellation(buildMissionLoopMetadata({ objective: "cancel-safe" }), "user requested");
    expect(canPerformPrivilegedAction(cancelled)).toBe(false);
    expect(isExecutionTimedOut("2026-01-01T00:00:00.000Z", 1000, new Date("2026-01-01T00:00:02.000Z"))).toBe(true);
    expect(deterministicAssurance({ evidenceCount: 1, acceptancePassed: true, humanApproval: "review", confidence: 100 })).toBe("UNKNOWN");
  });
});
