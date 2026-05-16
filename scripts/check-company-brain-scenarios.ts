import { existsSync, readFileSync } from "fs";
import path from "path";

type Scenario = {
  id: string;
  name: string;
  requiredChecks: string[];
};

const REQUIRED_SCENARIO_IDS = [
  "incident-response",
  "refund-decision",
  "pricing-exception",
  "oncall-handoff",
] as const;

const REQUIRED_CHECKS = [
  "source_coverage",
  "graph_materialized",
  "skills_compiled",
  "approval_pipeline",
  "business_source_connectors",
  "action_runner_execution",
  "reliability_dead_letter",
  "scheduler_health",
] as const;

function fail(msg: string): never {
  console.error(`[CompanyBrain Scenario Gate] ${msg}`);
  process.exit(1);
}

function main(): void {
  const filePath = process.env.COMPANY_BRAIN_SCENARIO_FILE_PATH
    ? path.resolve(process.cwd(), process.env.COMPANY_BRAIN_SCENARIO_FILE_PATH)
    : path.resolve(process.cwd(), "data/eval/company-brain-scenarios.json");

  if (!existsSync(filePath)) fail(`scenario file not found: ${filePath}`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`invalid JSON in scenario file: ${error instanceof Error ? error.message : String(error)}`);
  }

  const scenarios = Array.isArray(parsed)
    ? parsed as Scenario[]
    : (parsed as { scenarios?: Scenario[] })?.scenarios;

  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    fail("scenario file must contain a non-empty scenarios array");
  }

  const byId = new Map<string, Scenario>();
  for (const scenario of scenarios) {
    if (!scenario || typeof scenario !== "object") fail("scenario entries must be objects");
    if (!scenario.id || typeof scenario.id !== "string") fail("scenario id is required");
    if (!scenario.name || typeof scenario.name !== "string") fail(`scenario ${scenario.id}: name is required`);
    if (!Array.isArray(scenario.requiredChecks) || scenario.requiredChecks.length === 0) {
      fail(`scenario ${scenario.id}: requiredChecks must be a non-empty array`);
    }
    if (byId.has(scenario.id)) fail(`duplicate scenario id: ${scenario.id}`);
    byId.set(scenario.id, scenario);
  }

  for (const id of REQUIRED_SCENARIO_IDS) {
    if (!byId.has(id)) fail(`missing required scenario id: ${id}`);
  }

  for (const [id, scenario] of byId.entries()) {
    for (const check of scenario.requiredChecks) {
      if (!REQUIRED_CHECKS.includes(check as (typeof REQUIRED_CHECKS)[number])) {
        fail(`scenario ${id}: unknown required check "${check}"`);
      }
    }
  }

  const checksCovered = new Set<string>();
  for (const scenario of byId.values()) {
    for (const check of scenario.requiredChecks) checksCovered.add(check);
  }
  for (const required of REQUIRED_CHECKS) {
    if (!checksCovered.has(required)) fail(`required check not covered by any scenario: ${required}`);
  }

  console.log(
    `[CompanyBrain Scenario Gate] PASSED scenarios=${scenarios.length} requiredScenarioIds=${REQUIRED_SCENARIO_IDS.length} coveredChecks=${checksCovered.size}`,
  );
}

main();

