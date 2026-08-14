/**
 * Release trust gates: benchmark gate + company-brain gate (sequential).
 * Usage: npm run trust:gate -- --profile=dev|preview|prod
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { saveOperationalArtifact } from "../lib/operational/artifactStore";

type GateProfile = "dev" | "preview" | "prod";

type GateStepResult = {
  name: string;
  passed: boolean;
  exitCode: number;
};

const argvProfile = process.argv.find((arg) => arg.startsWith("--profile="));
const argvProfileValue = argvProfile?.split("=")[1]?.toLowerCase();
const profileRaw = (
  argvProfileValue ??
  process.env.TRUST_GATE_PROFILE ??
  "dev"
).toLowerCase();
const profile: GateProfile =
  profileRaw === "dev" || profileRaw === "preview" || profileRaw === "prod"
    ? profileRaw
    : "dev";

function resolveTsxBin(): string {
  const name = process.platform === "win32" ? "tsx.cmd" : "tsx";
  return path.join(process.cwd(), "node_modules", ".bin", name);
}

function runGateScript(
  scriptRel: string,
  args: string[],
  env: NodeJS.ProcessEnv = {},
): GateStepResult {
  const tsx = resolveTsxBin();
  if (!existsSync(tsx)) {
    console.error(`[trust:gate] tsx not found at ${tsx}. Run npm install first.`);
    return { name: scriptRel, passed: false, exitCode: 127 };
  }
  const scriptPath = path.join(process.cwd(), scriptRel);
  const result = spawnSync(tsx, [scriptPath, ...args], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "inherit",
    // Required on Windows for node_modules/.bin/*.cmd shims.
    shell: process.platform === "win32",
  });
  const exitCode = result.status ?? 1;
  return {
    name: path.basename(scriptRel, ".ts"),
    passed: exitCode === 0,
    exitCode,
  };
}

function companyBrainGateEnv(): NodeJS.ProcessEnv {
  if (profile === "prod") {
    return {
      COMPANY_BRAIN_GATE_STRICT: "true",
      COMPANY_BRAIN_GATE_BOOTSTRAP_BASELINE: "true",
      COMPANY_BRAIN_EVAL_MIN_SCORE: process.env.COMPANY_BRAIN_EVAL_MIN_SCORE ?? "90",
      COMPANY_BRAIN_SCENARIO_MIN_PASS_RATE:
        process.env.COMPANY_BRAIN_SCENARIO_MIN_PASS_RATE ?? "100",
    };
  }
  return {};
}

async function writeReport(steps: GateStepResult[]): Promise<boolean> {
  const passed = steps.every((step) => step.passed);
  try {
    const data = {
      at: new Date().toISOString(),
      profile,
      passed,
      gates: Object.fromEntries(
        steps.map((step) => [
          step.name,
          { passed: step.passed, exitCode: step.exitCode },
        ]),
      ),
    };
    await saveOperationalArtifact({
      kind: "trust_gate",
      name: "trust-gate-latest",
      status: passed ? "pass" : "fail",
      data,
    });
    console.log("[trust:gate] artifact=trust_gate/trust-gate-latest");
  } catch (error) {
    console.warn(
      `[trust:gate] unable to save report artifact: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return passed;
}

function printSummary(steps: GateStepResult[], overallPassed: boolean): void {
  console.log("");
  console.log("═".repeat(60));
  console.log(`  MemoryOS trust:gate  profile=${profile}`);
  console.log("═".repeat(60));
  for (const step of steps) {
    const icon = step.passed ? "PASS" : "FAIL";
    console.log(`  ${icon.padEnd(5)} ${step.name} (exit ${step.exitCode})`);
  }
  console.log("─".repeat(60));
  console.log(
    overallPassed
      ? "  OVERALL: PASS — safe to promote this profile"
      : "  OVERALL: FAIL — fix failing gates before release",
  );
  console.log("═".repeat(60));
  console.log("");
  console.log("Gates checked:");
  console.log("  • benchmark-gate — pass rate, contradiction miss rate, missing-steps A/B");
  console.log("  • company-brain-gate — eval harness checks + scenario pass rate");
  console.log("");
}

async function main(): Promise<void> {
  console.log(`[trust:gate] Starting release trust gates (profile=${profile})…`);
  console.log("");

  const steps: GateStepResult[] = [];

  console.log("[trust:gate] (1/2) benchmark gate…");
  steps.push(
    runGateScript("scripts/benchmark-gate.ts", [`--profile=${profile}`]),
  );

  console.log("");
  console.log("[trust:gate] (2/2) company-brain gate…");
  steps.push(
    runGateScript("scripts/eval-company-brain-gate.ts", [], companyBrainGateEnv()),
  );

  const overallPassed = await writeReport(steps);
  printSummary(steps, overallPassed);

  if (!overallPassed) {
    process.exit(1);
  }

  console.log("[trust:gate] All gates passed.");
}

void main();
