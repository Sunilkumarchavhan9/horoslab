import { getLatestRun } from "../lib/benchmark/benchmarkStore";

type GateProfile = "dev" | "preview" | "prod";

const argvProfile = process.argv.find((arg) => arg.startsWith("--profile="));
const argvProfileValue = argvProfile?.split("=")[1]?.toLowerCase();
const profileRaw = (
  argvProfileValue ??
  process.env.BENCH_GATE_PROFILE ??
  "prod"
).toLowerCase();
const profile: GateProfile =
  profileRaw === "dev" || profileRaw === "preview" || profileRaw === "prod"
    ? profileRaw
    : "prod";

const profileDefaults: Record<
  GateProfile,
  {
    minPassRate: number;
    maxContradictionMissRate: number;
    minMissingStepsImprovement: number;
  }
> = {
  dev: {
    minPassRate: 25,
    maxContradictionMissRate: 100,
    minMissingStepsImprovement: 0,
  },
  preview: {
    minPassRate: 70,
    maxContradictionMissRate: 20,
    minMissingStepsImprovement: 0.5,
  },
  prod: {
    minPassRate: 85,
    maxContradictionMissRate: 5,
    minMissingStepsImprovement: 1,
  },
};

const minPassRate = Number(
  process.env.BENCH_MIN_PASS_RATE ?? profileDefaults[profile].minPassRate,
);
const maxContradictionMissRate = Number(
  process.env.BENCH_MAX_CONTRADICTION_MISS_RATE ??
    profileDefaults[profile].maxContradictionMissRate,
);
const minMissingStepsImprovement = Number(
  process.env.BENCH_MIN_MISSING_STEPS_IMPROVEMENT ??
    profileDefaults[profile].minMissingStepsImprovement,
);

async function main(): Promise<void> {
  const latest = await getLatestRun();
  if (!latest) {
    console.error("[benchmark-gate] No benchmark run found.");
    process.exit(1);
  }

  const passRate = latest.passRate;
  const contradictionMissRate = latest.contradictionMissRate;
  const missingStepsImprovement = latest.abSummary?.missingStepsImprovement ?? 0;

  const checks = [
    {
      key: "passRate",
      value: passRate,
      target: minPassRate,
      pass: passRate >= minPassRate,
    },
    {
      key: "contradictionMissRate",
      value: contradictionMissRate,
      target: maxContradictionMissRate,
      pass: contradictionMissRate <= maxContradictionMissRate,
    },
    {
      key: "missingStepsImprovement",
      value: missingStepsImprovement,
      target: minMissingStepsImprovement,
      pass: missingStepsImprovement >= minMissingStepsImprovement,
    },
  ];

  for (const check of checks) {
    console.log(
      `[benchmark-gate] ${check.key}: value=${check.value} target=${check.target} pass=${check.pass}`,
    );
  }

  console.log(
    `[benchmark-gate] profile=${profile} (env overrides: BENCH_MIN_PASS_RATE, BENCH_MAX_CONTRADICTION_MISS_RATE, BENCH_MIN_MISSING_STEPS_IMPROVEMENT)`,
  );

  if (checks.some((c) => !c.pass)) {
    process.exit(1);
  }

  console.log("[benchmark-gate] PASS");
}

void main();
