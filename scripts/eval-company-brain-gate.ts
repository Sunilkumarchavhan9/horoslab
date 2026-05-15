import "dotenv/config";
import { runEvalHarness } from "../lib/companyBrain/platform";

function parseThreshold(): number {
  const raw = process.env.COMPANY_BRAIN_EVAL_MIN_SCORE;
  if (!raw) return 90;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 90;
  return Math.max(0, Math.min(100, value));
}

async function main(): Promise<void> {
  const userId = process.env.COMPANY_BRAIN_EVAL_USER_ID || "company_brain_gate_user";
  const threshold = parseThreshold();
  const evalResult = runEvalHarness(userId);
  const total = evalResult.checks.length;
  const score = total === 0 ? 0 : (evalResult.passed / total) * 100;
  const failedChecks = evalResult.checks.filter((check) => !check.passed);

  console.log(`[CompanyBrain Gate] user=${userId} score=${score.toFixed(2)} threshold=${threshold}`);
  for (const check of evalResult.checks) {
    console.log(`- ${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
  }

  if (score < threshold || failedChecks.length > 0) {
    console.error("[CompanyBrain Gate] FAILED");
    process.exit(1);
  }

  console.log("[CompanyBrain Gate] PASSED");
}

void main();
