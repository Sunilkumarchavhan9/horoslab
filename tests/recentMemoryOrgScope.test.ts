import { describe, expect, it } from "vitest";
import {
  recentMemoryStoreKey,
  recentMemoryUserFilter,
  continuityUserFilter,
} from "../lib/auth/orgScope";

describe("recent memory org scope helpers", () => {
  it("uses legacy file bucket key when org is absent", () => {
    expect(recentMemoryStoreKey("user_a")).toBe("user_a");
    expect(recentMemoryStoreKey("user_a", "")).toBe("user_a");
  });

  it("uses org-scoped file bucket key when org is present", () => {
    expect(recentMemoryStoreKey("user_a", "org_xyz")).toBe("user_a::org_xyz");
  });

  it("matches continuity filter rules for list/get", () => {
    const scope = { userId: "user_a", orgId: "org_xyz" };
    expect(recentMemoryUserFilter(scope)).toEqual(continuityUserFilter(scope));
    expect(recentMemoryUserFilter({ userId: "user_a" })).toEqual({ userId: "user_a" });
  });
});
