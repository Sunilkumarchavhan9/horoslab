import { describe, expect, it } from "vitest";
import { isEpochArtifactExpired } from "../lib/epoch/epochArtifacts";

describe("Epoch artifact retention", () => {
  it("expires access at the retention boundary", () => {
    const expiresAt = "2026-07-30T12:00:00.000Z";
    expect(isEpochArtifactExpired({ category: "evidence", workspaceId: "w", expiresAt }, new Date("2026-07-30T11:59:59.999Z"))).toBe(false);
    expect(isEpochArtifactExpired({ category: "evidence", workspaceId: "w", expiresAt }, new Date(expiresAt))).toBe(true);
  });

  it("keeps artifacts without retention deadlines active", () => {
    expect(isEpochArtifactExpired({ category: "evidence", workspaceId: "w" })).toBe(false);
  });
});
