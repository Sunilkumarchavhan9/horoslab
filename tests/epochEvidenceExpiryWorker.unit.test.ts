import { describe, expect, it } from "vitest";
import { isEpochEvidenceExpired } from "../lib/epoch/evidenceExpiryWorker";

describe("Epoch evidence expiry worker", () => {
  it("expires missing, future, and old evidence", () => {
    const now = new Date("2026-01-02T00:00:00.000Z");
    expect(isEpochEvidenceExpired({ now, maxAgeMs: 60_000 })).toBe(true);
    expect(isEpochEvidenceExpired({ now, maxAgeMs: 60_000, verifiedAt: "2025-12-31T00:00:00.000Z" })).toBe(true);
    expect(isEpochEvidenceExpired({ now, maxAgeMs: 60_000, verifiedAt: "2026-01-02T00:00:30.000Z" })).toBe(true);
    expect(isEpochEvidenceExpired({ now, maxAgeMs: 60_000, verifiedAt: "2026-01-01T23:59:30.000Z" })).toBe(false);
  });
});
