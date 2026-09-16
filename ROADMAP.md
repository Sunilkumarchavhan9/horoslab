# Epoch V12 Execution Roadmap

This is the live execution tracker for the canonical product and engineering blueprint:
[`docs/EPOCH_RUNTIME_FOR_AUTONOMOUS_WORKERS_MASTER_PLAN_V12.md`](docs/EPOCH_RUNTIME_FOR_AUTONOMOUS_WORKERS_MASTER_PLAN_V12.md).

## V12 Goal

Build Epoch as the runtime for autonomous workers. A customer gives Epoch a mission; Epoch selects governed workers, executes the work, recovers from failure, verifies the result, preserves evidence, and writes approved learning back for future missions.

The primary product object is **Mission**. The primary operating surface is **Mission Control**. The backend is the source of truth for mission state, worker health, policy decisions, evidence, verification, and audit history.

```text
Mission -> governed worker -> execution -> evidence -> verification -> learning
```

## Non-Negotiable Rules

- Backend first. Do not start new frontend work until the corresponding backend contract and tests pass.
- Preserve the existing landing page, Account Home, Account, and Organization pages.
- Do not create a second mission or evidence store.
- Do not claim a worker, integration, verification, or recovery capability without backend proof.
- Every privileged action requires a policy decision and audit record.
- Every terminal mission requires PASS, FAIL, or explicit UNKNOWN evidence.
- Use the existing Express, Prisma, PostgreSQL, Redis, and modular-monolith architecture until measured scale requires change.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Phase A: V12 contracts | In progress / OpenAPI slice complete | Contracts, adapters, fixtures, state-machine tests, ADR, module boundaries, generated OpenAPI routes, and compatibility tests exist; full legacy-record fixture and CI proof remain. |
| Phase B: Mission loop | In progress / reliability proof complete | Mission CRUD, queue, execution, evidence, verification, memory, lifecycle tests, and the executable 25-mission restart/cancellation proof exist; durable database restart and three-user acceptance proof remain. |
| Phase C: Worker Runtime | In progress / adapters and evaluations present | Worker registration, capabilities, scope, heartbeat, drain/retire state, liveness, durable worker tables, leases, fencing, capacity, SDK lifecycle, four worker adapters, and durable evaluation history are present; end-to-end adapter execution and evaluation aggregation proof remains. |
| Phase D: Recovery and policy | In progress / core governance slice present | Typed recovery taxonomy, bounded retry decisions, worker-loss handling, budget/deadline enforcement, rollback/compensation planning, human escalation persistence, and privileged tool policy evaluation are present; full execution-side-effect rollback and operator workflow proof remain. |
| Phase E: Verification and evidence hardening | In progress / storage and settlement slice present | Evidence integrity, expiry, signed access, independent verification, assurance reports, deterministic bundles, canonical object-storage boundary, settlement persistence, and approved learning handoff are present; delayed verification and external object-store adapters remain. |
| Phase F-L | Phases F-J foundations present; later phases pending | AI model catalog, capability routing, token-cost evidence, provider circuit breaking, framework-neutral agent adapters, versioned checkpoints, mission-scoped handoffs, edge enrollment, signed telemetry, offline replay, signed updates, enterprise RBAC/scope checks, retention/legal-hold logic, audit export shaping, budget governance, key descriptors, residency checks, and signed backup manifests are present. Provider transports, production key management/DR operations, copilots, and marketplace remain. The isolated V12 API, Worker SDK, MCP, and CLI foundation is built for Phase I. |
| Frontend | Frozen during backend build | Do not modify the landing, Mission Control UI, Account, or Organization surfaces during backend execution. |

## Backend Build Order

### Phase A: Contract Convergence

Goal: one canonical V12 vocabulary and migration path without breaking useful existing records.

Build and prove:

- Mission, Worker, Assignment, Execution, Evidence, Verification, PolicyDecision, and RuntimeEvent v1 schemas;
- adapters from existing Epoch and MemoryOS records;
- route compatibility and deprecation map;
- correlation IDs across mission, execution, worker, evidence, and trace;
- explicit repository module boundaries;
- software, AI-agent, and simulated-edge fixtures;
- generated contract output in CI.

Gate: state transitions are protected, legacy records remain readable, no second store exists, and contract tests pass.

### Phase B: Mission Loop v1

Goal: a mission reliably travels from creation to verified completion.

Build and prove:

- mission CRUD with versioned objectives and acceptance criteria;
- dependency-aware plans and deterministic scheduling;
- execution attempts, logs, cancellation, timeout, and checkpoints;
- evidence for tool calls, outputs, files, metrics, and tests;
- deterministic verification, human approval, and PASS/FAIL/UNKNOWN;
- memory preflight and outcome save;
- durable timeline reconstruction.

Gate: 25 seeded missions complete without corruption, restart and cancellation are safe, terminal missions have evidence and verification, and three internal users complete the flow without database intervention.

### Phase C: Worker Runtime v1

Goal: workers become first-class, observable, leasable runtime entities.

Build next:

- protocol negotiation and Worker SDK;
- capability and project-policy matching in scheduling;
- heartbeat truth, stale-worker detection, drain, and retire;
- leases, fencing tokens, capacity, concurrency, and duplicate-completion protection;
- worker logs and evaluation history;
- software, AI-agent, and human-reviewer adapters.

Gate: stale workers lose leases safely, duplicate completion cannot duplicate side effects, assignments respect capability and policy scope, and the SDK example runs locally.

### Phase D: Recovery and Policy v1

Goal: recover predictably while enforcing governance and cost limits.

Build:

- typed retryability and error taxonomy;
- retry and attempt budgets;
- checkpoint resume and alternative-worker fallback;
- rollback/compensation contract;
- human escalation queue;
- assignment and tool-call policy enforcement;
- mission budget and deadline enforcement;
- recovery timeline and operator actions.

Gate: worker loss, provider failure, denied tool call, and budget exhaustion are all tested with durable evidence and audit history.

### Phase E: Verification and Evidence Hardening

Goal: make verified results the product moat.

Build:

- declarative verification contracts and independent verifier assignments;
- evidence hashing, retention, object-storage interface, and signed access;
- model/prompt provenance and human review;
- evidence coverage, assurance report, and downloadable bundle;
- delayed verification, settlement, and learning handoff.

Gate: tampering, expiry, replay, independent verification, uncertainty, and unresolved risk are tested.

### Phase F: AI Runtime

Goal: provider-neutral governed model workers.

Build order: OpenAI adapter, private/local adapter, then additional providers only when customer demand justifies them. Add model catalog, policy routing, cost/token evidence, rate-limit handling, circuit breakers, prompt versions, structured output validation, and redaction.

### Phase G: Agent Runtime

Goal: framework-independent custom and framework-based agents.

Build order: custom Worker SDK, OpenAI Agents adapter, LangGraph adapter, then other frameworks only with validated demand. All tool calls, sessions, checkpoints, handoffs, and parent/child activity remain governed by Mission contracts.

### Phase H: Edge Runtime Pilot

Goal: prove the Worker Protocol over unreliable networks.

Pilot: Linux worker plus one Jetson/Raspberry Pi simulation or adapter. Add enrollment, certificates, telemetry, offline queues, sandboxing, signed updates, rollback, bandwidth-aware evidence, and CI simulation.

### Phase I: Developer Platform v1

Goal: external developers integrate without internal repository knowledge.

Build stable REST/WebSocket contracts, generated TypeScript SDK, Worker SDK, MCP tools, CLI, signed webhooks, local emulator, quickstarts, API reference, and plugin manifests.

Current implementation:

- `packages/epoch-v12-api`: new V12 HTTP client for missions, workers, verification, and evidence bundles;
- `packages/epoch-v12-sdk`: new Worker SDK for registration, heartbeat, fenced leases, and completion;
- `packages/epoch-v12-mcp`: new MCP stdio server exposing only the V12 namespace;
- `packages/epoch-v12-cli`: new CLI for V12 mission and worker operations;
- `packages/epoch-v12-emulator`: local Worker Protocol lease/completion emulator;
- `lib/epoch/webhooksV12.ts`: signed, replay-bounded V12 webhook envelopes;
- `npm run epoch:v12:platform:build` compiles all three packages;
- legacy `packages/epoch-api`, `packages/epoch-sdk`, and `packages/epoch-mcp` are not imported by these packages.

### Phase J: Enterprise Readiness

Goal: operate safely across serious organizations and regulated boundaries.

Build granular RBAC, service identities, tenant/project isolation, immutable audit export, retention/legal hold, private deployment, key hierarchy, residency options, backup/restore, disaster recovery, metering, and budget governance.

### Phase K-L: Deferred Expansion

Copilots and marketplace capabilities come only after the core runtime is trustworthy. They cannot silently approve, execute privileged actions, mutate policy, or bypass the Worker Protocol.

## Definition Of Backend Done

Before frontend expansion begins, the backend must demonstrate:

1. A new organization can create a project and mission with acceptance criteria.
2. A worker can register through the Worker SDK and report heartbeat truth.
3. The scheduler assigns only within capability, project, policy, capacity, and budget scope.
4. A mission survives one restart or worker-loss failure without duplicate privileged side effects.
5. Evidence, policy decisions, audit events, and correlation IDs reconstruct the run.
6. Independent verification returns PASS, FAIL, or UNKNOWN with an assurance explanation.
7. An approved outcome is saved to memory for a future mission.
8. Contract, tenant-isolation, state-machine, idempotency, lease/fencing, recovery, evidence-integrity, migration, and TypeScript tests pass.

## Immediate Next Slice

Complete the remaining Phase C worker-runtime proof:

- connect worker leases to queue assignment;
- enforce capability and project scope before leasing;
- enforce `maxConcurrency` atomically;
- reject stale or retired worker completion using fencing tokens;
- make acknowledgement idempotent;
- record worker assignment and completion events;
- add concurrency, stale-worker, and duplicate-completion tests.

The lease/fencing slice is implemented and tested. Next backend-only work is the remaining Phase C adapter/evaluation history gate, followed by Phase D rollback/compensation/escalation and Phase E object-storage/settlement work. Frontend remains frozen.
