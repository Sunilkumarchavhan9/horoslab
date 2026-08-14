import { describe, expect, it } from "vitest";
import {
  connectorStorageId,
  connectorUserFilter,
  continuityUserFilter,
  recentMemoryUserFilter,
} from "../lib/auth/orgScope";

describe("connector org scope helpers", () => {
  it("uses legacy storage id when org is absent", () => {
    expect(connectorStorageId("user_a", "github")).toBe("user_a_github");
    expect(connectorStorageId("user_a", "github", "")).toBe("user_a_github");
  });

  it("uses org-scoped storage id when org is present", () => {
    expect(connectorStorageId("user_a", "github", "org_xyz")).toBe(
      "user_a::org_xyz::github",
    );
  });

  it("matches continuity filter rules for list/get", () => {
    const scope = { userId: "user_a", orgId: "org_xyz" };
    expect(connectorUserFilter(scope)).toEqual(continuityUserFilter(scope));
    expect(connectorUserFilter({ userId: "user_a" })).toEqual({ userId: "user_a" });
    expect(recentMemoryUserFilter(scope)).toEqual(continuityUserFilter(scope));
  });
});
