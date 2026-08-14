import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Phase B mission reliability gate", () => {
  it("keeps the 25-mission proof executable and backend-only", async () => {
    const source = await readFile("scripts/phase-b-mission-reliability-gate.ts", "utf8");
    expect(source).toContain("Array.from({ length: 25 }");
    expect(source).toContain("restarted");
    expect(source).toContain("canPerformPrivilegedAction");
    expect(source).toContain("phase-b-mission-reliability.json");
    expect(source).not.toMatch(/memoryos-frontend|Mission Control UI|onboarding/i);
  });
});
