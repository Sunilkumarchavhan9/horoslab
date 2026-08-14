import { describe, expect, it } from "vitest";
import { compileChange } from "../lib/realityCompiler/analyzer";
import { decideCompilation } from "../lib/realityCompiler/verificationPlanner";

describe("reality compiler verification planner", () => {
  it("blocks destructive migrations", () => {
    const compiled = compileChange([{ path: "prisma/migrations/001_drop.sql", patch: "ALTER TABLE users DROP COLUMN legacy_id;" }]);
    const decision = decideCompilation(compiled.changeIR, compiled.predictedEffects);
    expect(decision.decision).toBe("BLOCK");
    expect(decision.invariantResults[0]).toMatchObject({ id: "migration.no-data-loss", status: "fail" });
  });

  it("returns conditional when a risky domain lacks proof", () => {
    const compiled = compileChange([{ path: "src/auth/session-middleware.ts", patch: "export function middleware() {}" }]);
    const decision = decideCompilation(compiled.changeIR, compiled.predictedEffects);
    expect(decision.decision).toBe("CONDITIONAL");
    expect(decision.verificationPlan.unknowns).toHaveLength(1);
  });

  it("passes an auth change with an explicit test mutation", () => {
    const compiled = compileChange([
      { path: "src/auth/session-middleware.ts", patch: "export function middleware() {}" },
      { path: "tests/auth/session.test.ts", patch: "it('rejects anonymous access', () => {})" },
    ]);
    const decision = decideCompilation(compiled.changeIR, compiled.predictedEffects);
    expect(decision.decision).toBe("PASS");
    expect(decision.invariantResults[0]).toMatchObject({ status: "pass" });
  });

  it("passes ordinary changes without fabricating a risk", () => {
    const compiled = compileChange([{ path: "src/profile/service.ts", patch: "export const profile = true;" }]);
    const decision = decideCompilation(compiled.changeIR, compiled.predictedEffects);
    expect(decision).toMatchObject({ decision: "PASS", riskLevel: "low" });
  });
});
