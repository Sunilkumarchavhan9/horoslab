import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const required = [
  ["discovery service", "lib/epoch/v13/discoveryService.ts", /createUnknown|createDiscoveryProgram|createHypothesis|createExperiment|recordObservation/],
  ["discovery routes", "server/routes/epoch-runtime.routes.ts", /unknowns|discovery-programs|hypotheses|experiments|observations/],
  ["discovery schema", "prisma/schema.prisma", /model EpochUnknown|model EpochDiscoveryProgram|model EpochHypothesis|model EpochExperiment|model EpochObservation/],
  ["discovery migration", "prisma/migrations/20260809220000_add_epoch_discovery_experiments/migration.sql", /CREATE TABLE "epoch_unknowns"|CREATE TABLE "epoch_experiments"/],
] as const;

for (const [label, relativePath, marker] of required) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) throw new Error(`${label} is missing: ${relativePath}`);
  if (!marker.test(readFileSync(path, "utf8"))) throw new Error(`${label} is missing its implementation marker.`);
  console.log(`[PASS] ${label}`);
}

console.log("[PASS] Discovery and experiment runtime backend gate passed.");
