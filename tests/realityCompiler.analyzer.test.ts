import { describe, expect, it } from "vitest";
import { compileChange } from "../lib/realityCompiler/analyzer";

describe("reality compiler analyzer", () => {
  it("detects destructive migration risk", () => {
    const result = compileChange([{ path: "prisma/migrations/001_drop.sql", patch: "ALTER TABLE users DROP COLUMN legacy_id;" }]);
    expect(result.intent.riskDomains).toEqual(["migrations"]);
    expect(result.changeIR.schemaMutations[0]).toMatchObject({ mayLoseData: true, backwardCompatible: false });
    expect(result.predictedEffects[0]).toMatchObject({ id: "migration.data_loss", severity: "critical" });
  });

  it("classifies auth and billing changes without allowing them", () => {
    const result = compileChange([
      { path: "src/auth/session-middleware.ts", patch: "export function middleware() {}" },
      { path: "src/billing/webhook-handler.ts", patch: "export function handleWebhook() {}" },
    ]);
    expect(result.intent.riskDomains).toEqual(["auth", "billing"]);
    expect(result.predictedEffects.map((effect) => effect.id)).toEqual(["auth.regression", "billing.idempotency"]);
    expect(result.predictedEffects.every((effect) => effect.confidence <= 1)).toBe(true);
  });

  it("keeps ordinary code changes in the IR without fabricating risk", () => {
    const result = compileChange([{ path: "src/profile/service.ts", patch: "export const profile = true;" }]);
    expect(result.changeIR.codeMutations).toHaveLength(1);
    expect(result.intent.riskDomains).toEqual([]);
    expect(result.predictedEffects).toEqual([]);
  });
});
