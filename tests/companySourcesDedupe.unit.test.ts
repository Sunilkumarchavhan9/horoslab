import { describe, expect, it } from "vitest";
import { dedupeCompanySourcesForDisplay, type CompanySource } from "../memoryos-frontend/lib/company-sources-api";

function makeSource(overrides: Partial<CompanySource>): CompanySource {
  return {
    id: overrides.id ?? "source-1",
    workspaceId: overrides.workspaceId ?? "workspace-1",
    provider: overrides.provider ?? "github",
    providerName: overrides.providerName ?? "GitHub",
    category: overrides.category ?? "Engineering",
    icon: overrides.icon ?? "",
    type: overrides.type ?? "github",
    status: overrides.status ?? "connected",
    permissions: overrides.permissions ?? {},
    lastSyncedAt: overrides.lastSyncedAt ?? null,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    itemCount: overrides.itemCount ?? 0,
    memoryCount: overrides.memoryCount ?? 0,
    health: overrides.health ?? 100,
    firstLaunch: overrides.firstLaunch ?? true,
  };
}

describe("Company sources dedupe", () => {
  it("collapses duplicate source ids into one display row", () => {
    const sources = [
      makeSource({ id: "cms02251t002qv1u4p4lkujgk", status: "connected" }),
      makeSource({ id: "CMS02251T002QV1U4P4LKUJGK", status: "synced", createdAt: "2026-01-02T00:00:00.000Z" }),
      makeSource({ id: "another-source", status: "disconnected" }),
    ];

    const deduped = dedupeCompanySourcesForDisplay(sources);

    expect(deduped).toHaveLength(2);
    expect(deduped.map((source) => source.id.toLowerCase())).toEqual([
      "cms02251t002qv1u4p4lkujgk",
      "another-source",
    ]);
  });

  it("prefers the live source when duplicate records differ in status", () => {
    const sources = [
      makeSource({ id: "cms02251t002qv1u4p4lkujgk", status: "disconnected" }),
      makeSource({ id: "cms02251t002qv1u4p4lkujgk", status: "connected", lastSyncedAt: "2026-01-03T00:00:00.000Z" }),
    ];

    const [source] = dedupeCompanySourcesForDisplay(sources);

    expect(source.status).toBe("connected");
    expect(source.lastSyncedAt).toBe("2026-01-03T00:00:00.000Z");
  });

  it("keeps the newest record when duplicates share the same live status", () => {
    const sources = [
      makeSource({ id: "cms02251t002qv1u4p4lkujgk", status: "connected", lastSyncedAt: "2026-01-01T00:00:00.000Z" }),
      makeSource({ id: "cms02251t002qv1u4p4lkujgk", status: "connected", lastSyncedAt: "2026-01-04T00:00:00.000Z" }),
    ];

    const [source] = dedupeCompanySourcesForDisplay(sources);

    expect(source.lastSyncedAt).toBe("2026-01-04T00:00:00.000Z");
  });
});
