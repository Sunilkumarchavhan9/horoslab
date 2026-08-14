import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

type Check = { label: string; path: string; pattern?: RegExp };

const root = process.cwd();

const backendFiles: Check[] = [
  { label: "V13 contracts", path: "lib/epoch/v13/contracts.ts", pattern: /EPOCH_V13_CONTRACT_VERSION/ },
  { label: "control plane", path: "lib/epoch/v13/controlPlaneService.ts", pattern: /buildEpochV13ControlPlane/ },
  { label: "software world state", path: "lib/epoch/v13/softwareWorldStateService.ts", pattern: /discoverEpochSoftwareWorldState/ },
  { label: "cloud world state", path: "lib/epoch/v13/cloudWorldStateService.ts", pattern: /discoverEpochCloudWorldState/ },
  { label: "data-center world state", path: "lib/epoch/v13/dataCenterWorldStateService.ts", pattern: /discoverEpochDataCenterWorldState/ },
  { label: "V13 identifiers", path: "lib/epoch/v13/ids.ts", pattern: /createEpochV13Id/ },
  { label: "outbox and idempotency", path: "lib/epoch/v13/outboxService.ts", pattern: /enqueueEpochOutboxEvent/ },
  { label: "cloud actions", path: "lib/epoch/v13/cloudActionService.ts", pattern: /executeEpochCloudAction/ },
  { label: "simulation core", path: "lib/epoch/v13/simulationService.ts", pattern: /runEpochSimulation/ },
  { label: "edge runtime", path: "lib/epoch/edgeRuntime.ts", pattern: /issueEpochEdgeEnrollment/ },
  { label: "automation runtime", path: "lib/epoch/v13/automationService.ts", pattern: /triggerEpochAutomation/ },
  { label: "capability fabric", path: "lib/epoch/v13/capabilityFabricService.ts", pattern: /discoverEpochCapabilities/ },
  { label: "discovery and experiment runtime", path: "lib/epoch/v13/discoveryService.ts", pattern: /createUnknown[\s\S]*createDiscoveryProgram[\s\S]*createHypothesis[\s\S]*createExperiment[\s\S]*recordObservation/ },
  { label: "architecture orchestrator", path: "lib/epoch/v13/runtimeOrchestrator.ts", pattern: /buildEpochArchitectureRun/ },
  { label: "mission runtime", path: "lib/epoch/missionLoop.ts", pattern: /mission/ },
  { label: "worker adapters", path: "lib/epoch/workerAdapters.ts", pattern: /worker/ },
  { label: "verification", path: "lib/epoch/assuranceReport.ts", pattern: /verification|assurance/i },
  { label: "recovery", path: "lib/epoch/recoveryActions.ts", pattern: /recovery|retry/i },
  { label: "production intelligence", path: "lib/epoch/productionIntelligenceStore.ts", pattern: /production|failure/i },
  { label: "learning handoff", path: "lib/epoch/learningHandoff.ts", pattern: /handoff/i },
];

const routeMarkers: Check[] = [
  { label: "project and world-state routes", path: "server/routes/epoch.routes.ts", pattern: /projects.*world-state/ },
  { label: "data-center and outbox routes", path: "server/routes/epoch.routes.ts", pattern: /data-center-discover[\s\S]*outbox/ },
  { label: "cloud action routes", path: "server/routes/epoch.routes.ts", pattern: /cloud-actions/ },
  { label: "simulation routes", path: "server/routes/epoch.routes.ts", pattern: /simulations|simulation-runs/ },
  { label: "edge routes", path: "server/routes/epoch.routes.ts", pattern: /edge.*enrollment|edge.*telemetry/ },
  { label: "automation routes", path: "server/routes/epoch.routes.ts", pattern: /automations|automationId/ },
  { label: "capability routes", path: "server/routes/epoch.routes.ts", pattern: /capability-gaps|capability-plans/ },
  { label: "AI runtime catalog", path: "server/routes/epoch.routes.ts", pattern: /ai.*catalog/ },
  { label: "architecture run routes", path: "server/routes/epoch-runtime.routes.ts", pattern: /architecture-runs/ },
  { label: "discovery routes", path: "server/routes/epoch-runtime.routes.ts", pattern: /unknowns[\s\S]*discovery-programs[\s\S]*hypotheses[\s\S]*experiments[\s\S]*observations/ },
];

const gates = [
  ["architecture:runtime:gate", "Architecture runtime contract"],
  ["phase-b:mission-reliability", "Phase B mission reliability"],
  ["phase3:cloud-action:gate", "Phase 3 cloud action safety"],
  ["phase3:simulation:gate", "Phase 3 simulation core"],
  ["phase4:edge:gate", "Phase 4 edge runtime"],
  ["phase8:automation:gate", "Phase 8 automation"],
  ["phase9:capability:gate", "Phase 9 capability fabric"],
  ["phase12:production-intelligence:gate", "Phase 12 production intelligence"],
] as const;

function assertSurface(checks: Check[]) {
  for (const check of checks) {
    const absolutePath = resolve(root, check.path);
    if (!existsSync(absolutePath)) throw new Error(`${check.label} is missing: ${check.path}`);
    if (check.pattern && !check.pattern.test(readFileSync(absolutePath, "utf8"))) {
      throw new Error(`${check.label} is missing its required implementation marker: ${check.path}`);
    }
    console.log(`[PASS] ${check.label}: ${check.path}`);
  }
}

function runGate(script: string, label: string) {
  const gateScriptByName: Record<string, string> = {
    "architecture:runtime:gate": "scripts/architecture-runtime-contract-gate.ts",
    "phase-b:mission-reliability": "scripts/phase-b-mission-reliability-gate.ts",
    "phase3:cloud-action:gate": "scripts/phase3-cloud-action-gate.ts",
    "phase3:simulation:gate": "scripts/phase3-simulation-core-gate.ts",
    "phase4:edge:gate": "scripts/phase4-edge-runtime-gate.ts",
    "phase8:automation:gate": "scripts/phase8-automation-gate.ts",
    "phase9:capability:gate": "scripts/phase9-capability-fabric-gate.ts",
    "phase12:production-intelligence:gate": "scripts/phase12-production-intelligence-gate.ts",
  };
  const gatePath = gateScriptByName[script];
  if (!gatePath) throw new Error(`No backend gate mapping exists for ${script}.`);
  const result = spawnSync(process.execPath, [resolve(root, "node_modules/tsx/dist/cli.mjs"), resolve(root, gatePath)], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}.`);
  console.log(`[PASS] ${label}`);
}

function main() {
  console.log("Backend V13 acceptance gate: deployment is intentionally not part of this command.");
  assertSurface(backendFiles);
  assertSurface(routeMarkers);

  const missing = ["EPOCH_V13_GATE_WORKSPACE_ID", "EPOCH_V13_GATE_USER_ID"].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Set ${missing.join(" and ")} before running database-backed backend gates.`);
  }

  for (const [script, label] of gates) runGate(script, label);
  console.log("[PASS] Backend V13 acceptance gate passed. Frontend and deployment were not changed or executed.");
}

main();
