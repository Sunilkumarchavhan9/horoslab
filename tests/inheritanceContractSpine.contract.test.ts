import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma", "schema.prisma"), "utf8");
const store = readFileSync(join(root, "lib", "masterplan", "productLoopStore.ts"), "utf8");
const routes = readFileSync(join(root, "server", "routes", "masterplan.routes.ts"), "utf8");
const migration = readFileSync(
  join(root, "prisma", "migrations", "20260708065000_add_inheritance_contract_spine", "migration.sql"),
  "utf8",
);

describe("Inheritance Contract product spine", () => {
  it("models the canonical contract and links it to delivery, run, proof, and replay records", () => {
    expect(schema).toContain("model InheritanceContract");
    expect(schema).toMatch(/task\s+String/);
    expect(schema).toMatch(/memory\s+Json/);
    expect(schema).toMatch(/rules\s+Json/);
    expect(schema).toMatch(/risks\s+Json/);
    expect(schema).toMatch(/requiredTests\s+Json/);
    expect(schema).toMatch(/approvedSkills\s+Json/);
    expect(schema).toMatch(/blockedActions\s+Json/);
    expect(schema).toMatch(/outcomeSchema\s+Json/);
    expect(schema).toMatch(/contractId\s+String\?\s+@map\("contract_id"\)/);
    expect(schema).toContain("inheritanceContract     InheritanceContract?");
    expect(schema).toContain("evaluationRuns  EvaluationRun[]");
  });

  it("creates and propagates the contract through MemoryIgnition, packages, runs, and black-box proof", () => {
    expect(store).toContain("createInheritanceContract");
    expect(store).toContain("buildContractDataFromPayload");
    expect(store).toContain("contract_id: contract.id");
    expect(store).toContain("MemoryIgnition -> InheritanceContract -> InheritancePackage");
    expect(store).toContain("MemoryIgnition -> InheritanceContract -> InheritancePackage -> Delivery -> AgentRun -> Outcome");
    expect(store).toContain("ensurePackageContract");
    expect(store).toContain("createDirectRunContract");
    expect(store).toContain("contractId: contract.id");
    expect(store).toContain("if (!contractId) throw new Error(\"inheritance_contract_required\")");
  });

  it("enforces outcome-required completion and evaluates the first-launch proof metric", () => {
    expect(store).toContain("No AgentRun is complete until outcome is captured.");
    expect(store).toContain("throw new Error(\"outcome_required\")");
    expect(routes).toContain("if (error.message === \"outcome_required\") return 409");
    expect(routes).toContain("if (error.message === \"inheritance_contract_required\") return 409");
    expect(store).toContain("primaryMetric: \"Mistake Repeat Rate\"");
    expect(store).toContain("mistakeRepeated: false");
  });

  it("ships a guarded migration for existing Postgres databases", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"inheritance_contracts\"");
    expect(migration).toContain("ALTER TABLE \"inheritance_packages\" ADD COLUMN IF NOT EXISTS \"contract_id\"");
    expect(migration).toContain("ALTER TABLE \"agent_runs\" ADD COLUMN IF NOT EXISTS \"contract_id\"");
    expect(migration).toContain("ALTER TABLE \"agent_black_box_records\" ADD COLUMN IF NOT EXISTS \"contract_id\"");
    expect(migration).toContain("ALTER TABLE \"evaluation_runs\" ADD COLUMN IF NOT EXISTS \"contract_id\"");
  });
});
