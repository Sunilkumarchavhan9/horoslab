import { describe, expect, it } from "vitest";
import {
  assertMissionTransition,
  canTransitionMission,
  EpochMissionTransitionError,
} from "../lib/epoch/missionStateMachine";

describe("Epoch mission state machine", () => {
  it("allows only forward runtime transitions", () => {
    expect(canTransitionMission("draft", "running")).toBe(true);
    expect(canTransitionMission("running", "waiting_review")).toBe(true);
    expect(canTransitionMission("waiting_review", "completed")).toBe(true);
    expect(canTransitionMission("running", "failed")).toBe(true);
  });

  it("keeps completed missions terminal and allows only governed failed retries", () => {
    expect(canTransitionMission("completed", "running")).toBe(false);
    expect(canTransitionMission("completed", "failed")).toBe(false);
    expect(canTransitionMission("failed", "draft")).toBe(true);
    expect(canTransitionMission("failed", "waiting_review")).toBe(true);
  });

  it("treats cancellation as a terminal outcome for active missions", () => {
    expect(canTransitionMission("running", "cancelled")).toBe(true);
    expect(canTransitionMission("waiting_review", "cancelled")).toBe(true);
    expect(canTransitionMission("cancelled", "running")).toBe(false);
    expect(canTransitionMission("cancelled", "failed")).toBe(false);
  });

  it("reports the invalid transition details", () => {
    expect(() => assertMissionTransition("completed", "running")).toThrow(
      EpochMissionTransitionError,
    );

    try {
      assertMissionTransition("completed", "running");
    } catch (error) {
      expect(error).toMatchObject({ from: "completed", to: "running", code: "INVALID_MISSION_TRANSITION" });
    }
  });
});
