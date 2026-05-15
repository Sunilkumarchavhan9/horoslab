import "dotenv/config";
import { runEvalHarness } from "../lib/companyBrain/platform";
import { existsSync, readFileSync } from "fs";
import path from "path";

function parseThreshold(): number {
  const raw = process.env.COMPANY_BRAIN_EVAL_MIN_SCORE;
  if (!raw) return 90;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 90;
  return Math.max(0, Math.min(100, value));
}

function parseScenarioThreshold(): number {
  const raw = process.env.COMPANY_BRAIN_SCENARIO_MIN_PASS_RATE;
  if (!raw) return 100;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 100;
  return Math.max(0, Math.min(100, value));
}

function isStrictMode(): boolean {
  return process.env.COMPANY_BRAIN_GATE_STRICT === "true";
}

type Scenario = {
  id: string;
  name: string;
  requiredChecks: string[];
};

function loadScenarios(): Scenario[] {
  const filePath = process.env.COMPANY_BRAIN_SCENARIO_FILE_PATH
    ? path.resolve(process.cwd(), process.env.COMPANY_BRAIN_SCENARIO_FILE_PATH)
    : path.resolve(process.cwd(), "data/eval/company-brain-scenarios.json");
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as { scenarios?: Scenario[] } | Scenario[];
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.scenarios)) return parsed.scenarios;
  return [];
}

async function main(): Promise<void> {
  const userId = process.env.COMPANY_BRAIN_EVAL_USER_ID || "company_brain_gate_user";
  const strictMode = isStrictMode();
  const threshold = process.env.COMPANY_BRAIN_EVAL_MIN_SCORE
    ? parseThreshold()
    : strictMode ? 90 : 0;
  const scenarioThreshold = process.env.COMPANY_BRAIN_SCENARIO_MIN_PASS_RATE
    ? parseScenarioThreshold()
    : strictMode ? 100 : 0;
  const evalResult = runEvalHarness(userId);
  const total = evalResult.checks.length;
  const score = total === 0 ? 0 : (evalResult.passed / total) * 100;
  const failedChecks = evalResult.checks.filter((check) => !check.passed);
  const checksMap = new Map(evalResult.checks.map((check) => [check.name, check.passed]));

  const scenarios = loadScenarios();
  const scenarioResults = scenarios.map((scenario) => {
    const missing = scenario.requiredChecks.filter((name) => !checksMap.has(name));
    const failed = scenario.requiredChecks.filter((name) => checksMap.get(name) === false);
    const passed = missing.length === 0 && failed.length === 0;
    return { scenario, passed, missing, failed };
  });
  const scenarioPassedCount = scenarioResults.filter((item) => item.passed).length;
  const scenarioPassRate = scenarioResults.length === 0 ? 0 : (scenarioPassedCount / scenarioResults.length) * 100;

  console.log(
    `[CompanyBrain Gate] user=${userId} strict=${strictMode} score=${score.toFixed(2)} threshold=${threshold} scenarioPassRate=${scenarioPassRate.toFixed(2)} scenarioThreshold=${scenarioThreshold}`,
  );
  for (const check of evalResult.checks) {
    console.log(`- ${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
  }
  for (const item of scenarioResults) {
    console.log(
      `- ${item.passed ? "PASS" : "FAIL"} scenario:${item.scenario.id} (${item.scenario.name}) required=[${item.scenario.requiredChecks.join(",")}]`
      + `${item.failed.length ? ` failed=[${item.failed.join(",")}]` : ""}`
      + `${item.missing.length ? ` missing=[${item.missing.join(",")}]` : ""}`,
    );
  }

  const scoreFailed = score < threshold;
  const checkFailed = failedChecks.length > 0;
  const scenarioFailed = scenarioResults.length > 0 && scenarioPassRate < scenarioThreshold;
  const strictScenarioMissing = strictMode && scenarios.length === 0;

  if (strictMode && (scoreFailed || checkFailed || scenarioFailed || strictScenarioMissing)) {
    console.error("[CompanyBrain Gate] FAILED (strict mode)");
    if (strictScenarioMissing) {
      console.error("[CompanyBrain Gate] strict mode requires scenario dataset file");
    }
    process.exit(1);
  }

  if (!strictMode && (scoreFailed || scenarioFailed)) {
    console.error("[CompanyBrain Gate] FAILED");
    process.exit(1);
  }

  console.log("[CompanyBrain Gate] PASSED");
}

void main();
