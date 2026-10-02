# @epochtm/v12-sdk

Official TypeScript Worker SDK for Epoch V12.

Use this package when a software worker, AI-agent worker, or human-review worker needs to connect to Epoch, report health, receive governed work, and complete jobs safely.

## Install

```bash
npm install @epochtm/v12-sdk
pnpm add @epochtm/v12-sdk
bun add @epochtm/v12-sdk
```

## Configure

The worker needs a V12 runtime URL, a workspace-scoped API key, and a registered worker ID.

```ts
import { EpochV12Worker } from "@epochtm/v12-sdk";

const worker = new EpochV12Worker({
  baseUrl: process.env.EPOCH_V12_API_URL ?? "http://localhost:3011",
  apiKey: process.env.EPOCH_V12_API_KEY!,
  workspaceId: process.env.EPOCH_V12_WORKSPACE_ID!,
  workerId: process.env.EPOCH_V12_WORKER_ID!,
});
```

## Register and poll

```ts
await worker.register({
  kind: "software",
  name: "Deploy Verifier",
  protocolVersion: "epoch.worker.v1",
  capabilities: ["deployment", "verification"],
  projectScope: { projectId: "project-id" },
  maxConcurrency: 1,
});

await worker.heartbeat("online");

const lease = await worker.lease(1, 30_000);
for (const job of lease.jobs) {
  const fencingToken = lease.fencingTokens[job.id];

  await worker.recordEvidence(String(job.missionId), [{
    kind: "worker_output",
    summary: "Worker completed the assigned operation",
    payload: { status: "passed" },
  }]);
  await worker.complete(job.id, fencingToken);
}
```

Use `worker.fail(job.id, error)` when execution fails. Use `worker.verify(missionId, { humanApproval: "approved" })` after evidence is durable and the mission is ready for verification.

## Worker lifecycle

Supported worker kinds are `software`, `ai_agent`, and `human`.

Supported statuses are `online`, `draining`, `offline`, `blocked`, and `retired`.

Workers should send heartbeats regularly. A worker must not complete a job without the fencing token from its current lease. Completion is idempotent for the same valid lease and rejected for stale fencing tokens.

## Security

- Use a workspace-scoped API key with the minimum required permissions.
- Keep API keys in a secret manager or process environment.
- Do not ship worker credentials to browser applications.
- Treat leased job payloads and evidence as untrusted input.
- Report worker failure instead of acknowledging work that did not complete.

## Scope

This is the new V12 Worker Protocol client. It does not wrap the legacy SDK or include onboarding, GitHub setup, dashboard, Account, or Organization UI flows.

## Development

```bash
npm run build
```
