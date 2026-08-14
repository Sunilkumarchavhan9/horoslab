# Epoch Final Plan Repository Map

This map is the implementation boundary for `EPOCH_FINAL_SOFTWARE_CLOUD_SIMULATION_EDGE_AUTOMATION_BUILD_PLAN.md`.
It records where the final plan already exists and where the next build starts. Existing V12 stores and routes remain authoritative.

## Existing authoritative backbone

| Plan capability | Existing implementation | Decision |
| --- | --- | --- |
| Workspace and institution control plane | `prisma/schema.prisma` (`Workspace`, `EpochInstitution*`), `lib/epoch/epochStore.ts`, `server/routes/epoch.routes.ts` | Reuse and extend; do not add a second organization store. |
| Missions and execution | `EpochMission`, `EpochExecutionRun`, `lib/epoch/epochMissionControl.ts`, `lib/epoch/epochQueue.ts`, `server/routes/epoch.routes.ts` | Reuse the V12 mission state machine and queue. |
| Workers and Worker Protocol | `EpochWorker`, `EpochWorkerLease`, `lib/epoch/epochWorker.ts`, `packages/epoch-v12-sdk`, `packages/epoch-v12-mcp`, `packages/epoch-v12-cli` | Reuse the V12 worker lease and completion contract. |
| Policies and approvals | `EpochAuthorityPolicy`, approval routes in `server/routes/epoch.routes.ts`, `lib/epoch/authorityService.ts` | Reuse policy decisions as the action gate. |
| Evidence and verification | `EpochEvidence`, `EpochVerificationRun`, `EpochCertificate`, `lib/epoch/evidence*`, `lib/epoch/verification*` | Reuse durable evidence and verification; no parallel evidence store. |
| Recovery and settlement | `EpochRecoveryEscalation`, `EpochSettlement`, `lib/epoch/recovery*`, `lib/epoch/settlement*` | Reuse existing recovery, settlement, and learning handoff. |
| Production intelligence | `EpochProductionInteraction`, `EpochFailure*`, `EpochRootCauseRecord`, `EpochRegression*`, `EpochReplay*`, `EpochFixProposal`, `lib/epoch/productionIntelligence.ts` | Reuse existing production learning loop. |
| Integrations and access | `EpochIntegrationConnection`, connector routes, `server/routes/epoch-runtime.routes.ts`, SDK/MCP/CLI packages | Reuse scoped connector and runtime-access paths. |
| AI execution runtime | `lib/epoch/aiExecutionRuntime.ts`, `lib/epoch/aiOrchestrator.ts`, `server/routes/epoch-ai-execution.routes.ts` | Reuse provider-neutral routing and health paths. |
| Edge and simulation foundations | `lib/epoch/edgeRuntime.ts`, `packages/epoch-v12-emulator`, related contract tests | Extend the existing edge/emulator boundary rather than creating a new runtime. |

## Phase 0 now frozen

The final plan requires versioned contracts before new persistence and APIs. The V13 contract layer is in:

- `lib/epoch/v13/contracts.ts`
- `lib/epoch/v13/index.ts`
- `tests/epochV13Contracts.unit.test.ts`

It defines versioned schemas for Unknown, DiscoveryProgram, WorldState, Hypothesis, CapabilityGap, Experiment, Observation, Action, Outcome, Experience, Automation, WorkerProtocol, Policy, and RuntimeEvent. Every contract carries workspace scope, timestamps, correlation/trace identity, and policy linkage where actions are involved.

## Build order after Phase 0

1. **Phase 1: Control plane convergence**
   Map the plan vocabulary onto existing workspace/institution/project/environment/connection records. Add only missing adapters and routes; preserve the existing `/api/epoch/workspaces/:workspaceId/...` compatibility surface.
2. **Phase 2: Software environment**
   Promote the existing GitHub, HTTP, database, Docker/Kubernetes, logs, metrics, traces, and CI/CD capabilities into one governed software World State adapter.
3. **Phase 3: Cloud environment**
   Add cloud discovery and policy-gated compute/container/database/queue/deployment observations and actions through the same gateway.
4. **Phase 4: Mission Runtime convergence**
   Connect planner, scheduler, Worker Protocol, execution, recovery, policy, evidence, verification, and automation to the frozen contracts.
5. **Simulation, Edge, Intelligence, Platform**
   Extend the emulator, edge worker, discovery/experiment/experience loop, and API/SDK/MCP/CLI surfaces only after the shared runtime path is contract-backed.

## Non-negotiable execution path

`request/event -> trigger -> context -> plan -> policy decision -> action gateway -> execution -> evidence -> verification -> outcome -> experience`

No new feature may bypass tenant scope, policy evaluation, evidence capture, verification, audit correlation, or existing V12 compatibility routes.
