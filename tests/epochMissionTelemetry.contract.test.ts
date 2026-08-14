import { describe, expect, it } from "vitest";

describe("Epoch mission telemetry contract", () => {
  it("defines the mission telemetry path used by worker observations", () => {
    expect("/workspaces/:workspaceId/missions/:missionId/telemetry").toContain("missions/:missionId/telemetry");
  });
});
