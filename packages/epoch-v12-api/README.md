# @epochtm/v12-api

Official TypeScript client for the Epoch V12 mission runtime.

The API client connects applications and operators to the canonical Epoch runtime. It covers mission creation and execution, worker registration and leases, verification, and deterministic evidence bundles.

## Install

```bash
npm install @epochtm/v12-api
pnpm add @epochtm/v12-api
bun add @epochtm/v12-api
```

## Configure

Create an Epoch runtime API key with access to the target workspace. Never expose the key in browser code or commit it to source control.

```ts
import { EpochV12ApiClient } from "@epochtm/v12-api";

const epoch = new EpochV12ApiClient({
  baseUrl: process.env.EPOCH_V12_API_URL ?? "http://localhost:3011",
  apiKey: process.env.EPOCH_V12_API_KEY!,
});
```

## Mission example

```ts
const created = await epoch.createMission("workspace-id", {
  institutionId: "institution-id",
  title: "Verify a deployment",
  objective: "Confirm the deployment is healthy and preserve proof.",
  plan: ["inspect", "test", "verify"],
  acceptanceCriteria: ["health check passes", "evidence is recorded"],
});

await epoch.enqueueMission("workspace-id", created.mission.id, { type: "execute" });
await epoch.recordEvidence("workspace-id", created.mission.id, [{
  kind: "test_result",
  summary: "Deployment health check passed",
  payload: { status: "passed" },
}]);
await epoch.verifyMissionWithEvidence("workspace-id", created.mission.id, {
  humanApproval: "approved",
  confidence: 95,
});

const bundle = await epoch.getEvidenceBundle("workspace-id", created.mission.id);

const assignment = await epoch.createVerifierAssignment("workspace-id", created.mission.id, {
  verifierId: "independent-worker-id",
  verifierKind: "software",
  checklist: ["validate tests", "verify evidence integrity"],
});
await epoch.completeVerifierAssignment("workspace-id", assignment.assignment.id, 95);

await epoch.settleMission("workspace-id", created.mission.id, {
  decision: "PASS",
  evidenceHash: bundle.bundleHash,
  assuranceConfidence: 95,
  humanApproval: "approved",
  unresolvedRisks: [],
  lessons: ["Keep the deterministic verification path."],
});
```

## Worker operations

```ts
const worker = await epoch.registerWorker("workspace-id", {
  kind: "software",
  name: "deploy-verifier",
  capabilities: ["deployment", "verification"],
  projectScope: { projectId: "project-id" },
  maxConcurrency: 1,
});

await epoch.heartbeatWorker("workspace-id", worker.worker.id);
const lease = await epoch.leaseWorkerJobs("workspace-id", worker.worker.id);
```

Workers must complete jobs with the fencing token returned by the lease. This prevents stale workers from completing work after a lease has been replaced.

## Error handling

Failed requests throw `EpochV12ApiError` with the HTTP status and response details.

```ts
import { EpochV12ApiError } from "@epochtm/v12-api";

try {
  await epoch.getMission("workspace-id", "mission-id");
} catch (error) {
  if (error instanceof EpochV12ApiError && error.status === 404) {
    console.error("Mission is not visible in this workspace.");
  }
  throw error;
}
```

## Scope

This package uses only the versioned `/api/epoch` V12 runtime contracts. It does not include the legacy MemoryOS SDK, onboarding, GitHub setup, dashboard, Account, or Organization UI flows.

## Development

```bash
npm run build
```
