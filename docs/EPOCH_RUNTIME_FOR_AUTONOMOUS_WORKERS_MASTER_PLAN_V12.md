# Epoch execution for Autonomous Workers — Master Build Plan V12

**Status:** Canonical product and engineering blueprint  
**Date:** 2026-07-29  
**Supersedes for active execution:** broad build sequencing in V10/V11  
**Preserves:** useful MemoryOS continuity, memory, governance, proof, settlement, and learning capabilities already implemented  
**Primary product object:** Mission  
**Primary operating surface:** Mission Control

---

## 1. Executive decision

Epoch is the runtime for autonomous workers.

It lets organizations build, deploy, operate, recover, verify, and continuously improve work performed by:

- AI models;
- AI agents;
- edge workers and devices;
- human reviewers.

The product sits between an application or operator intent and the workers that act:

```text
Application / Operator
        ↓
      Mission
        ↓
   Epoch Runtime
        ↓
AI Models · AI Agents · Edge Workers · Human Reviewers
        ↓
 Cloud · Private Cloud · Edge
        ↓
 Verified Result + Evidence + Learning
```

Epoch is not a collection of AI dashboards. It is the control plane and execution runtime that owns the mission lifecycle from intent to verified outcome.

### Public one-liner

> Epoch is the runtime for autonomous workers. It allows organizations to deploy, operate, recover, verify, and continuously improve AI agents, edge workers, and human reviewers through one mission-centric runtime.

### Product promise

> Give Epoch a mission. Epoch selects governed workers, executes the work, recovers from failure, verifies the result, preserves the evidence, and teaches the next mission.

### First commercial wedge

Do not sell the entire long-term platform first. Sell one reliable mission loop:

> Run one consequential AI or engineering task through governed execution and receive a verified result with complete evidence.

Initial buyers:

- CTO and VP Engineering;
- Head of AI or Agent Platform;
- Platform and SRE teams;
- robotics and edge-AI teams after the software-worker loop is reliable.

---

## 2. V12 product principles

1. **Mission first.** Infrastructure, models, agents, devices, policies, and evidence exist to complete missions.
2. **Runtime before marketplace.** A reliable execution loop is more valuable than a large catalog of incomplete integrations.
3. **Proof is part of execution.** A completed task without verification and evidence is not a completed Epoch mission.
4. **Recovery is a first-class state.** Retry, resume, fallback, rollback, and human escalation are modeled explicitly.
5. **Memory closes the loop.** Every mission can inherit relevant prior outcomes and write back lessons.
6. **API first.** Mission Control, SDKs, CLI, MCP, and plugins use the same versioned platform contracts.
7. **Live-data only.** The UI must never imply a worker is connected, healthy, syncing, or executing when backend state does not prove it.
8. **Governed autonomy.** Identity, capabilities, budgets, approvals, policy decisions, and audit trails are part of the runtime.
9. **One modular product, not eleven disconnected products.** New capabilities extend the same mission graph and event model.
10. **Earn infrastructure complexity.** Introduce new distributed systems only after measured load or reliability needs justify them.

---

## 3. What V12 keeps from the existing product

V12 is an evolution of the current repository, not a greenfield rewrite.

### Keep and promote to core Epoch primitives

| Existing capability | V12 role | Action |
|---|---|---|
| Memory contracts, retrieval, resume, and handoff | Mission context and continuity | Keep; attach retrieval trace to mission and execution records |
| MemoryIgnition before/after runtime hooks | Worker preflight and outcome learning | Keep; generalize as runtime hooks for all worker types |
| Company Brain structured memory | Mission knowledge plane | Keep; expose decisions, incidents, runbooks, risks, and next actions to planning |
| Agent sessions and lineage | AI agent worker foundation | Keep; unify under Worker, WorkerSession, and WorkerLease contracts |
| Execution proposals and approvals | Policy and human-review foundation | Keep; make every privileged action pass through the action gateway |
| Operational loops and drift detection | Mission monitoring and continuous improvement | Keep; calculate planned-versus-actual at mission and step level |
| Runtime routes and schemas | Runtime API foundation | Keep; normalize naming and version contracts incrementally |
| Epoch mission, institution, evidence, proof, settlement, and memory records | Core domain backbone | Keep; migrate rather than duplicate |
| Verification and settlement workspaces | Verification Center and mission result views | Keep; consolidate around the mission detail page |
| MCP server and developer routes | Developer platform | Keep; publish mission and worker tools through the canonical API |
| Webhooks and realtime events | External automation and live Mission Control | Keep; standardize event envelopes and replay behavior |
| GitHub, Slack, Jira, Notion, Microsoft, and local-source work | Integration foundation | Keep supported paths; label partial connectors honestly |
| Sentry, Prometheus, tracing, request IDs, and audit middleware | Observability foundation | Keep; add mission_id, execution_id, and worker_id correlation |
| Desktop gateway and Linux worker experiments | Edge-worker precursor | Keep isolated; harden only after Worker Runtime v1 |
| Existing console visual system | Mission Control design system | Keep black, dense, operational UI primitives; remove duplicate card patterns |

### Adapt instead of carrying forward unchanged

| Existing concept | V12 adaptation |
|---|---|
| Institution as the primary public object | Keep as an advanced reusable governance/template layer; Mission becomes the primary product object |
| Company Brain as the whole product | Keep as the knowledge and memory subsystem inside Epoch |
| Continuity Lab as a separate destination | Reuse its runtime/session capabilities inside mission creation, execution, and debugging flows |
| Product agents | Register them as typed workers with capabilities, leases, health, cost, and evaluation history |
| PASS / FAIL / UNKNOWN proof | Preserve and extend with verifier identity, evidence coverage, confidence, and policy version |
| Organizational learning | Implement as mission outcome → memory → approved improvement, not as an unbounded autonomous claim |
| Autonomous institution and civilization narratives | Retain as long-term research; remove from near-term build dependencies and customer promises |

### Do not rebuild now

- Do not replace Express with NestJS only for architectural fashion.
- Do not replace Prisma with Drizzle while current models and migrations are active.
- Do not replace working WebSocket/event mechanisms with NATS before scale requires it.
- Do not add BullMQ if the existing Redis-backed queue can satisfy the first mission loop; define the queue interface first.
- Do not introduce Kubernetes, Helm, and Terraform as product prerequisites for the first design partners.
- Do not create separate databases or microservices for each runtime module during product discovery.
- Do not build the marketplace, broad edge fleet, or eleven copilots before the core mission SLOs pass.

---

## 4. Architecture strategy

### 4.1 Adopt a modular monolith first

The current TypeScript application remains the deployable unit for V12 Phase A–C. Runtime modules communicate through explicit interfaces and durable events so they can be extracted later without rewriting product contracts.

```text
Epoch API
├── Identity and Workspace
├── Mission Runtime
├── Worker Runtime
├── Scheduler
├── Execution Engine
├── Recovery Engine
├── Verification Engine
├── Evidence Engine
├── Policy Engine
├── Memory and Learning
├── Production Intelligence Engine
├── Integration Gateway
└── Realtime Event Gateway
```

Extraction triggers must be evidence based:

- queue wait or throughput violates the published SLO;
- a module needs independent scaling or isolation;
- a failure domain threatens mission reliability;
- a regulated deployment requires separation;
- a team has clear ownership and an enforceable service contract.

### 4.2 V12 stack decision

| Layer | V12 now | Later trigger |
|---|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind, existing console primitives | Add TanStack Query/Zustand selectively when server-state or local-state complexity proves the need |
| Runtime API | Existing Express TypeScript server | Consider Fastify/Nest only with measured performance or team-scale justification |
| Validation | Zod contracts | Generate OpenAPI and SDK types from canonical schemas |
| Database | PostgreSQL + Prisma | Partition/archive high-volume events; evaluate specialized stores only with evidence |
| Queue | Queue abstraction over current Redis capability | BullMQ when durable jobs, retries, scheduling, and operational tooling require it |
| Eventing | Durable database event log + WebSocket delivery | NATS when multi-service fan-out and throughput justify it |
| Object storage | Pluggable evidence storage interface | S3/R2 providers after artifact upload and retention contracts are stable |
| Observability | OpenTelemetry-compatible tracing, Prometheus, Sentry, structured logs | Grafana/Loki production stack when operational volume requires it |
| Deployment | Docker and current CI/CD | Kubernetes/Helm/Terraform for enterprise or fleet scale, not local MVP |

### 4.3 Control plane and data plane

**Control plane** owns organizations, projects, missions, workers, policies, scheduling, approvals, metadata, and state transitions.

**Execution data plane** runs assigned work, streams logs, uploads evidence, emits heartbeats, and reports results. Initially it may run in-process or through trusted gateways. Later it can span cloud, private cloud, and edge.

The boundary is the Worker Protocol. Mission logic must not depend on a specific model SDK, agent framework, or device type.

---

## 5. Canonical domain model

### 5.1 Tenant and identity

- `Organization`
- `User`
- `Team`
- `Project`
- `Membership`
- `Role`
- `Permission`
- `ApiKey`
- `ServiceIdentity`

Every mutable record carries `organizationId`, actor identity, timestamps, and an audit reference. Project isolation is explicit. Cross-tenant retrieval is forbidden.

### 5.2 Mission

A mission is a versioned declaration of intended outcome and the runtime record that produces it.

Required fields:

- identity: id, organization, project, creator;
- intent: title, objective, acceptance criteria;
- plan: steps, dependencies, priorities, parallelism;
- constraints: deadline, budget, allowed capabilities, risk tier;
- verification contract: required checks, evidence, approvers;
- runtime state and state version;
- assigned workers and leases;
- cost and resource usage;
- trace, evidence, recovery, and outcome references;
- inherited memory and lessons written back.

Canonical lifecycle:

```text
DRAFT
  → QUEUED
  → PLANNING
  → READY
  → RUNNING
  → RECOVERING ─────┐
  → VERIFYING       │
  → COMPLETED       │
  → ARCHIVED        │
                    │
RUNNING ←───────────┘
```

Terminal exceptional states:

- `CANCELLED` — intentionally stopped;
- `FAILED` — execution ended and recovery policy was exhausted;
- `UNKNOWN` — verification could not establish correctness.

All transitions require optimistic concurrency, actor/reason metadata, an emitted event, and an audit record. Clients cannot set arbitrary states.

### 5.3 Mission plan and execution

- `MissionPlan`
- `MissionStep`
- `StepDependency`
- `ExecutionAttempt`
- `ExecutionCheckpoint`
- `WorkerAssignment`
- `WorkerLease`
- `ToolInvocation`
- `RecoveryAttempt`
- `HumanReview`

An execution attempt is immutable after completion. Retry creates a new attempt linked to the prior attempt. Resume starts from a declared checkpoint. Cancellation is cooperative first and forceful only through an authorized provider adapter.

### 5.4 Worker

Worker types:

- `AI_MODEL`
- `AI_AGENT`
- `EDGE_WORKER`
- `HUMAN_REVIEWER`
- `SERVICE`

Worker lifecycle:

```text
REGISTERING → AVAILABLE → ASSIGNED → EXECUTING → AVAILABLE
                   ↓           ↓
                DEGRADED    UNREACHABLE
                   ↓           ↓
                OFFLINE ← DRAINING → RETIRED
```

Worker record:

- identity and owner;
- type, provider, runtime version;
- declared capabilities and constraints;
- allowed projects and data boundaries;
- health, heartbeat, last-seen, and availability;
- concurrency and resource capacity;
- pricing/cost metadata;
- trust and evaluation metrics;
- current leases;
- credential reference, never raw secret material;
- deployment target and software bill of materials when applicable.

### 5.5 Evidence and verification

Evidence types:

- log stream;
- tool call and result;
- file or artifact;
- screenshot;
- structured metric;
- test result;
- model or agent output;
- human attestation;
- sensor reading;
- trace span;
- policy decision;
- recovery record.

Each evidence item carries:

- content hash and immutable ID;
- mission, step, execution, and worker linkage;
- source and capture time;
- storage URI or inline-safe payload;
- media type and schema version;
- chain-of-custody metadata;
- access classification and retention policy;
- redaction state;
- verifier usage references.

Verification result:

```text
PASS | FAIL | UNKNOWN
```

A result also includes checks performed, evidence coverage, verifier identity, policy version, confidence, unresolved risks, and human approvals.

### 5.6 Policy and governance

Policy scopes:

- organization;
- project;
- mission;
- worker type or worker identity;
- tool and integration;
- data classification;
- deployment environment.

Policy can constrain:

- allowed models, agents, tools, and destinations;
- budget, token, compute, and time limits;
- required approvals;
- evidence duties;
- retry and fallback behavior;
- secret and data access;
- geographic or deployment boundaries;
- compliance and retention rules.

Every privileged action produces `ALLOW`, `DENY`, or `REQUIRE_APPROVAL` with policy version, matched rule, actor, inputs digest, and reason.

---

## 6. Runtime modules and contracts

### 6.1 Mission Runtime

Responsibilities:

- create and version missions;
- translate natural-language intent into a reviewable plan;
- validate acceptance criteria and constraints;
- enforce lifecycle transitions;
- coordinate scheduler, execution, recovery, verification, and learning;
- expose a complete mission snapshot and event timeline.

Phase-one rule: planning may be manual or AI-assisted, but execution cannot start until the plan and verification contract are valid.

### 6.2 Worker Runtime

Responsibilities:

- registration and credential binding;
- capability discovery;
- heartbeat and health calculation;
- leases and concurrency;
- worker session continuity;
- execution commands and result reporting;
- worker evaluation and retirement.

Canonical Worker Protocol:

```ts
interface EpochWorker {
  register(input: WorkerRegistration): Promise<WorkerIdentity>;
  heartbeat(input: WorkerHeartbeat): Promise<HeartbeatAck>;
  execute(input: Assignment): AsyncIterable<WorkerEvent>;
  cancel(input: CancelRequest): Promise<CancelResult>;
  checkpoint(input: CheckpointRequest): Promise<Checkpoint>;
  report(input: WorkerReport): Promise<void>;
  complete(input: CompletionReport): Promise<void>;
}
```

Protocol versions are negotiated. Unsupported workers fail registration rather than silently degrading.

### 6.3 Scheduler

Scheduling inputs:

- mission and step priority;
- dependency readiness;
- worker capability match;
- health and availability;
- policy and data locality;
- budget and expected cost;
- deadline;
- trust/evaluation score;
- fairness and organization quotas.

Scheduler v1 uses deterministic scoring with recorded reasons. AI suggestions may propose assignments but cannot bypass hard constraints.

### 6.4 Execution Engine

Responsibilities:

- issue leased assignments;
- stream status, logs, tool calls, and metrics;
- maintain checkpoints;
- enforce timeout and budget;
- handle cancel and resume;
- ensure commands are idempotent;
- correlate every action to mission, step, attempt, and worker.

No worker receives unrestricted infrastructure credentials. Workers receive scoped, expiring capabilities through the action gateway.

### 6.5 Recovery Engine

Recovery policy order:

1. retry current worker for retryable errors;
2. resume from last valid checkpoint;
3. use an alternative model or provider;
4. assign an alternative worker;
5. execute a declared rollback or compensation;
6. require human review;
7. fail safely with preserved evidence.

Every recovery attempt records trigger, strategy, policy, before/after state, cost, result, and evidence. Recovery loops have hard attempt, time, and budget limits.

### 6.6 Verification Engine

Verifier types:

- deterministic rule or schema;
- unit, integration, or end-to-end test;
- policy check;
- independent AI evaluator;
- human reviewer;
- domain-specific sensor or system check.

The mission verification contract declares which verifiers are required, independence rules, minimum evidence, and whether human approval is mandatory. The executor cannot self-certify when independent verification is required.

### 6.7 Evidence Engine

Responsibilities:

- accept streaming and final evidence;
- calculate hashes and deduplicate safely;
- store metadata in PostgreSQL and large artifacts through a storage provider;
- apply retention, access, and redaction policy;
- provide time-limited artifact access;
- assemble mission evidence bundles and assurance reports.

### 6.8 Policy Engine

Policy evaluation occurs at:

- mission creation;
- plan approval;
- worker assignment;
- capability grant;
- each privileged tool call;
- artifact access;
- recovery selection;
- final verification and archive.

### 6.9 Memory and Continuous Improvement

Before execution:

- retrieve relevant decisions, incidents, runbooks, prior attempts, risky files, policies, and approved skills;
- attach trace proof showing why each memory was selected;
- produce a mission context pack.

After execution:

- store outcome, failures, recovery, verification, cost, and operator feedback;
- propose a reusable lesson, policy adjustment, runbook update, or worker evaluation change;
- require approval for changes that affect future execution policy;
- track whether the improvement helps later missions.

---

## 7. API, SDK, MCP, CLI, and events

### 7.1 REST API v1

Initial resource surface:

```text
POST   /v1/missions
GET    /v1/missions
GET    /v1/missions/:missionId
POST   /v1/missions/:missionId/plan
POST   /v1/missions/:missionId/queue
POST   /v1/missions/:missionId/cancel
POST   /v1/missions/:missionId/resume
GET    /v1/missions/:missionId/events
GET    /v1/missions/:missionId/evidence
GET    /v1/missions/:missionId/verification

POST   /v1/workers/register
POST   /v1/workers/:workerId/heartbeat
GET    /v1/workers
GET    /v1/workers/:workerId
POST   /v1/workers/:workerId/drain
POST   /v1/workers/:workerId/retire

GET    /v1/assignments/next
POST   /v1/assignments/:assignmentId/accept
POST   /v1/assignments/:assignmentId/events
POST   /v1/assignments/:assignmentId/checkpoints
POST   /v1/assignments/:assignmentId/complete
POST   /v1/assignments/:assignmentId/fail

GET    /v1/evidence/:evidenceId
POST   /v1/verifications
POST   /v1/approvals/:approvalId/decide
GET    /v1/policies/evaluate
```

Existing Epoch routes remain supported during migration through adapters and deprecation headers. Do not create duplicate data stores.

The stable compatibility contract is exposed at `GET /api/v1/epoch/version` and on every Epoch response through `X-Epoch-API-Version: v1` and `X-Epoch-Contract-Version: epoch.v12`. SDK, MCP, and CLI clients must use `/api/v1/epoch` and treat these values as the compatibility boundary. The existing `/api/epoch` mount remains available as a deprecated migration surface and uses the same stores and policy gates.

### 7.2 Event envelope

```json
{
  "id": "evt_...",
  "type": "mission.step.started",
  "version": 1,
  "occurredAt": "2026-07-29T00:00:00.000Z",
  "organizationId": "org_...",
  "projectId": "prj_...",
  "missionId": "mis_...",
  "stepId": "step_...",
  "executionId": "exe_...",
  "workerId": "wrk_...",
  "actor": { "type": "service", "id": "scheduler" },
  "correlationId": "cor_...",
  "causationId": "evt_...",
  "data": {}
}
```

Events are append-only, schema-versioned, replayable, ordered per mission, and delivered at least once. Consumers must be idempotent.

Core event families:

- `mission.*`
- `plan.*`
- `worker.*`
- `assignment.*`
- `execution.*`
- `recovery.*`
- `verification.*`
- `evidence.*`
- `policy.*`
- `approval.*`
- `memory.*`

### 7.3 TypeScript SDK

The first SDK wraps the canonical API:

```ts
const mission = await epoch.missions.create({ objective, acceptanceCriteria });
await epoch.missions.queue(mission.id);

const worker = await epoch.workers.register({ type, capabilities });
await worker.heartbeat();
await worker.run(async (assignment, reporter) => {
  await reporter.log("starting");
  return { output, evidence };
});
```

SDK requirements:

- typed inputs and outputs generated from schemas;
- idempotency keys for mutations;
- retries only for safe operations;
- pagination, timeout, and abort support;
- trace and request IDs exposed;
- browser and server packages separated where security requires it.

### 7.4 MCP server

MCP tools must call the same mission API and policy engine. Initial tools:

- `epoch_create_mission`
- `epoch_get_mission`
- `epoch_list_missions`
- `epoch_queue_mission`
- `epoch_cancel_mission`
- `epoch_get_mission_events`
- `epoch_get_evidence`
- `epoch_request_approval`
- `epoch_get_worker_status`

MCP never becomes a bypass around RBAC, project boundaries, approval rules, or audit logging.

### 7.5 CLI

```text
epoch init
epoch login
epoch projects list
epoch missions create
epoch missions list
epoch missions watch <id>
epoch missions cancel <id>
epoch workers register
epoch workers list
epoch workers logs <id>
epoch evidence download <mission-id>
epoch deploy worker
```

CLI v1 prioritizes local development and worker registration. Deployment automation comes after a stable worker package contract.

---

## 8. Mission Control product specification

Mission Control must feel like an operations center, not a generic admin dashboard.

### 8.1 Navigation

Ship navigation progressively:

**Runtime v1**

- Overview
- Mission Control
- Missions
- Workers
- Verification
- Evidence
- Policies
- Integrations
- Developer
- Settings

**Add after real capability exists**

- AI Models
- AI Agents
- Edge Fleet
- Recovery Center
- Analytics
- Marketplace

Do not expose empty categories as if they are products.

### 8.2 Overview

Show live operational truth:

- running, queued, recovering, and verifying missions;
- worker availability and degraded/offline counts;
- approval queue;
- mission success and unknown-verification rate;
- recent failures and recoveries;
- budget and cost alerts;
- event-stream health.

### 8.3 Mission list

Filters:

- state;
- project;
- owner;
- risk;
- worker type;
- verification result;
- time range.

Columns:

- mission and objective;
- state and current step;
- assigned workers;
- elapsed time;
- cost;
- evidence coverage;
- verification;
- updated time.

### 8.4 Mission detail

Every mission page contains:

1. objective, acceptance criteria, constraints, risk, and policy state;
2. live execution graph;
3. ordered timeline;
4. assigned workers and leases;
5. streaming logs and tool calls;
6. checkpoints, retries, fallbacks, and recovery events;
7. evidence explorer;
8. verification checks and approvals;
9. cost, token, compute, and performance metrics;
10. final result and unresolved risks;
11. memory used and why;
12. lessons proposed for future missions.

### 8.5 Worker detail

Show identity, capabilities, health, heartbeats, current assignments, recent missions, reliability, cost, policy scope, runtime version, and logs. Edge workers additionally show connectivity, offline queue, software version, update status, and device telemetry.

### 8.6 Recovery Center

Only ship after recovery APIs are real. It shows missions currently recovering, failed strategy history, remaining policy budget, available alternatives, rollback state, and human escalation actions.

### 8.7 One-product surface layout

Epoch is one product with clear surfaces, not a collection of disconnected dashboards.

```text
Public product story
  /                         Landing page
        |
        v
Authenticated Epoch product
  /mission-control          Mission Control runtime
    Mission Home            create, queue, and observe missions
    Missions                mission list and mission detail
    Execution               attempts, logs, checkpoints, and controls
    Workers                 worker directory, health, capabilities, leases
    Evidence                collected proof and evidence coverage
    Verification            human review and PASS / FAIL / UNKNOWN
    Recovery                retries, fallback, escalation, and audit
        |
        +-- Account Home     preserved account landing surface
        +-- Account          identity and personal settings
        +-- Organization     membership, policy, and organization controls
```

Surface ownership rules:

- The landing page remains the public product and positioning surface. It is not replaced by Mission Control and must not be used as an authenticated runtime shell.
- Mission Control is the single authenticated operating surface for missions and workers. Its navigation is generated from backend-supported runtime capabilities.
- Mission Control may link to Account Home, Account, and Organization, but it does not absorb or redesign those surfaces.
- Mission Control does not contain a separate onboarding product, duplicate authentication flow, fake dashboard, unsupported provider directory, or setup wizard that is not required by a live mission contract.
- GitHub, connectors, SDK, MCP, CLI, and other developer setup flows are platform capabilities. They are not additional Mission Control home sections unless a live backend contract requires them for the current mission.
- Account and Organization controls are never removed as part of Mission Control cleanup.
- Every visible runtime page must map to a backend route, state, event stream, or durable record. Empty states must say that data is unavailable; they must not invent health, activity, or mission counts.

Canonical product flow:

1. A user learns about Epoch on the landing page.
2. The user enters the authenticated Epoch product at Mission Control.
3. The user creates or selects a mission, observes execution, reviews evidence, and approves or rejects verification.
4. The runtime records policy decisions, worker activity, evidence, recovery, and learning through the backend.
5. The user manages identity and organization governance through the preserved Account and Organization surfaces.

Frontend implementation is downstream of this contract. Backend routes, state transitions, worker health, evidence, and verification are authoritative; frontend pages must not create parallel runtime state.

---

## 9. Security, reliability, and enterprise boundary

### 9.1 Security baseline

- organization and project isolation on every query;
- short-lived scoped worker credentials;
- secrets stored by reference through an approved secret manager;
- encryption in transit and at rest;
- audit records for authentication, policy, approval, tool, artifact, and administrative actions;
- signed webhooks with replay protection;
- artifact malware/content checks where applicable;
- outbound network allowlists for sensitive workers;
- redaction before logs or evidence leave a trusted boundary;
- no API keys, tokens, or raw secrets in mission prompts, evidence, logs, or memory.

### 9.2 Reliability semantics

- idempotency keys on all command endpoints;
- optimistic concurrency for mission state;
- leased assignments with fencing tokens;
- at-least-once event delivery and idempotent consumers;
- heartbeat expiry and worker reaping;
- bounded retry with jitter;
- explicit dead-letter visibility;
- durable checkpoints;
- evidence upload resume;
- database backup and tested restore;
- graceful shutdown and assignment draining.

### 9.3 Initial SLOs

Before public beta:

- API availability: 99.9% monthly target;
- mission command acknowledgement: p95 under 500 ms, excluding execution;
- realtime event visibility: p95 under 2 seconds;
- no lost accepted mission state transitions;
- no duplicate privileged action for a single idempotency key;
- worker offline detection within configured heartbeat window plus grace;
- 100% terminal missions include a verification result or explicit `UNKNOWN` reason;
- 100% privileged tool calls include a policy decision and audit record.

---

## 10. Detailed build program

The phase numbers below are execution gates, not calendar promises. A later phase cannot hide a broken core loop.

### Phase A — V12 contract and product convergence

**Goal:** establish one canonical vocabulary, state machine, and migration path without breaking existing users.

Build:

- freeze Mission, Worker, Assignment, Execution, Evidence, Verification, PolicyDecision, and RuntimeEvent v1 schemas;
- map existing Epoch/MemoryOS records to those contracts;
- publish route compatibility and deprecation map;
- add correlation IDs across mission, execution, worker, evidence, and trace;
- define repository module boundaries and ownership;
- inventory UI routes and remove fake/duplicate runtime surfaces from active navigation;
- create fixtures for one software mission, one AI-agent mission, and one simulated edge mission.

Exit criteria:

- state transitions are tested and cannot be mutated directly;
- existing useful records are readable through V12 adapters;
- one architecture decision record documents the no-rewrite strategy;
- OpenAPI or equivalent contract output is generated in CI;
- no second mission/evidence store is introduced.

### Phase B — Mission loop v1

**Goal:** a mission travels reliably from creation to verified completion.

Build:

- mission CRUD and versioned objective/acceptance criteria;
- manual plan and step dependencies;
- queue and deterministic scheduler;
- one trusted software/agent worker adapter;
- execution attempts, streaming logs, cancellation, timeout, and checkpoint;
- evidence capture for logs, tool calls, outputs, files, metrics, and tests;
- deterministic verification and human approval;
- PASS / FAIL / UNKNOWN assurance result;
- Mission Control list and detail using live API data;
- memory preflight and outcome save.

Exit criteria:

- 25 consecutive seeded missions complete without state corruption;
- restart during execution resumes or fails safely with evidence;
- cancel prevents further privileged actions;
- every terminal mission has evidence and verification;
- mission timeline can reconstruct the run from durable events;
- three internal users complete the flow without database intervention.

### Phase C — Worker Runtime v1

**Goal:** make workers first-class, observable, leasable runtime entities.

Build:

- worker registration and protocol negotiation;
- capability declaration and project scope;
- heartbeat, availability, drain, and retire;
- leases, fencing tokens, capacity, and concurrency;
- worker logs and evaluation history;
- TypeScript Worker SDK;
- model worker, custom agent worker, and human reviewer worker adapters;
- worker directory and detail views.

Exit criteria:

- stale workers lose leases safely;
- duplicate completion cannot duplicate side effects;
- scheduler never assigns outside capability or policy scope;
- SDK example worker runs locally in under ten minutes;
- worker health in UI matches backend heartbeat truth.

### Phase D — Recovery and policy v1

**Goal:** recover predictably while enforcing governance and cost boundaries.

Build:

- typed retryability and error taxonomy;
- recovery policy and attempt budget;
- checkpoint resume;
- alternative worker and model fallback;
- rollback/compensation contract;
- human escalation queue;
- policy evaluation at assignment and tool-call boundaries;
- mission budget and time limits;
- recovery timeline and operator controls.

Exit criteria:

- forced worker loss demonstrates checkpoint recovery;
- forced provider failure demonstrates allowed fallback;
- denied tool call produces no external side effect;
- recovery cannot exceed attempts, time, or budget;
- every strategy and approval is visible in evidence and audit.

### Phase E — Verification and evidence hardening

**Goal:** make verified results the product moat.

Build:

- declarative verification contracts;
- independent verifier assignments;
- evidence hashing, object storage, retention, and signed access;
- AI evaluation with model/prompt version provenance;
- human review workspace;
- evidence coverage calculation;
- assurance report and downloadable evidence bundle;
- post-deployment or delayed verification hooks;
- settlement and learning handoff.

Exit criteria:

- tampered evidence is detected;
- independent verification rules are enforced;
- expired artifact access is rejected;
- assurance report identifies checks, evidence, uncertainty, and unresolved risk;
- verification replay yields the same deterministic results.

### Phase F — AI Runtime

**Goal:** operate AI models as governed workers behind one provider-neutral contract.

Build:

- OpenAI adapter first, then Anthropic/Gemini based on customer demand;
- Ollama/local adapter for private execution;
- model catalog and capability metadata;
- routing by policy, quality, latency, cost, and availability;
- retries, fallback, rate-limit handling, and circuit breakers;
- prompt template versioning;
- token, latency, and cost evidence;
- structured-output validation and redaction.

Exit criteria:

- provider outage falls back only when policy permits;
- cost and token usage reconcile per mission;
- prompts and responses respect retention policy;
- provider-specific errors normalize into runtime error types.

#### AI Execution Runtime extension

Epoch exposes this layer as the **AI Execution Runtime**. It is not a model server or a replacement for cloud infrastructure. It is the provider-neutral execution layer between Mission Runtime and every AI execution environment. Every environment remains an Epoch Worker.

Build:

- AI worker registry for OpenRouter, OpenAI, Anthropic, Gemini, DeepSeek, Ollama, vLLM, LM Studio, NVIDIA NIM, private inference servers, local GPUs, edge workers, and human review;
- model discovery and capability metadata for context length, vision, reasoning, tools, structured output, embeddings, OCR, audio, and long-context support;
- policy-aware routing by capability, privacy, region, cost, latency, queue depth, availability, reliability, and verification history;
- one provider adapter contract so Mission Runtime never calls a provider directly;
- local GPU registration and telemetry for utilization, VRAM, temperature, throughput, queue depth, and loaded models;
- provider and endpoint health monitoring with circuit breakers and explicit failover plans;
- hybrid scheduling across cloud, private, local GPU, edge, and human workers;
- token, GPU-hour, provider, and mission cost accounting;
- execution cache with privacy, retention, invalidation, and provenance rules;
- execution monitoring that records provider, model, worker, latency, tokens, cost, retries, errors, evidence, and verification links;
- automatic failover only when the mission policy permits it;
- worker lifecycle: register, discover, health check, execute, return evidence, verify, evaluate, monitor, and retire.

Canonical APIs:

- `GET /api/epoch/ai-execution/catalog`;
- `GET /api/epoch/workspaces/:workspaceId/ai-execution/workers`;
- `POST /api/epoch/workspaces/:workspaceId/ai-execution/workers`;
- `POST /api/epoch/workspaces/:workspaceId/ai-execution/workers/:workerId/telemetry`;
- `GET /api/epoch/workspaces/:workspaceId/ai-execution/workers/:workerId/telemetry`;
- `GET /api/epoch/workspaces/:workspaceId/ai-execution/health`;
- `POST /api/epoch/workspaces/:workspaceId/ai-execution/health/probe`;
- `GET /api/epoch/workspaces/:workspaceId/ai-execution/health/history`;
- `POST /api/epoch/workspaces/:workspaceId/ai-execution/route`;
- `POST /api/epoch/workspaces/:workspaceId/ai-execution/discover`;
- `POST /api/epoch/workspaces/:workspaceId/ai-execution/execute`;
- `POST /api/epoch/workspaces/:workspaceId/ai-execution/stream` (SSE with cancellation);
- `GET /api/epoch/workspaces/:workspaceId/ai-execution/history`;
- `GET /api/epoch/workspaces/:workspaceId/ai-execution/costs`;
- `POST /api/epoch/workspaces/:workspaceId/ai-execution/rebalance`;
- `DELETE /api/epoch/workspaces/:workspaceId/ai-execution/cache`.

AI Execution Runtime exit criteria:

- one mission routes deterministically between cloud, private, local GPU, and human endpoints;
- policy prevents disallowed providers, privacy regions, capabilities, costs, and latencies;
- provider outage fails over only when explicitly allowed and preserves the original evidence;
- model and endpoint discovery produces versioned capability metadata;
- GPU and provider health are visible through worker heartbeats and execution events;
- token, latency, GPU, provider, and mission costs reconcile with execution evidence;
- cache hits never cross workspace or retention boundaries;
- every route and failover decision is auditable and correlated to the mission;
- a new endpoint can register through the Worker Protocol without changing Mission Runtime contracts.

### Phase G — Agent Runtime

**Goal:** run framework-based and custom agents without coupling Epoch to one framework.

Build order:

1. custom Worker SDK ;
2. OpenAI Agents SDK adapter;
3. LangGraph adapter;
4. CrewAI only with validated demand.

Capabilities:

- agent identity and version;
- session lifecycle and memory hooks;
- tool-call gateway;
- checkpoints and handoffs;
- sub-agent relationship events;
- evaluation and trust history;
- multi-agent plans expressed as mission steps and dependencies.

Backend session APIs:

- `GET /api/epoch/workspaces/:workspaceId/agents/sessions`;
- `GET /api/epoch/workspaces/:workspaceId/agents/sessions/:sessionId`;
- `POST /api/epoch/workspaces/:workspaceId/agents/sessions`;
- `POST /api/epoch/workspaces/:workspaceId/agents/sessions/:sessionId/complete`;
- `POST /api/epoch/workspaces/:workspaceId/agents/sessions/:sessionId/handoff`;
- `POST /api/epoch/workspaces/:workspaceId/agents/sessions/:sessionId/checkpoint`;
- `POST /api/epoch/workspaces/:workspaceId/agents/sessions/:sessionId/resume`;
- `POST /api/epoch/workspaces/:workspaceId/agents/sessions/:sessionId/tool-calls/authorize`.
- `POST /api/epoch/workspaces/:workspaceId/agents/sessions/:sessionId/tool-calls/:callId/complete`.

Exit criteria:

- agent framework can be replaced without changing mission contracts;
- every tool call is governed and traceable;
- session resume preserves declared state;
- parent/child activity remains visible in one mission timeline.

### Phase H — Edge Runtime pilot

**Goal:** prove the Worker Protocol across unreliable networks before building a broad fleet product.

Pilot targets:

- Linux x86 worker;
- one NVIDIA Jetson or Raspberry Pi simulation/adapter;
- non-destructive inspection or telemetry mission.

Build:

- device enrollment and signed certificate identity (`EPOCH_EDGE_ENROLLMENT_SECRET`);
- `POST /api/epoch/workspaces/:workspaceId/edge/telemetry` with signed sequence validation;
- `POST /api/epoch/workspaces/:workspaceId/edge/updates/verify` with staged-only signature validation;
- heartbeat, health, telemetry, and remote logs;
- offline assignment/result queue;
- safe local execution sandbox;
- signed worker package and staged update;
- rollback and recovery mode;
- bandwidth-aware evidence upload;
- simulated edge worker in CI.

Exit criteria:

- 30-minute disconnection preserves ordered mission events;
- duplicate offline reports are idempotent;
- invalid or unsigned update is rejected;
- failed update rolls back;
- lost device credentials can be revoked.

### Phase I — Developer platform v1

**Goal:** let external developers integrate without internal repository knowledge.

Build:

- stable REST and WebSocket APIs;
- generated TypeScript SDK;
- Worker SDK;
- MCP server;
- CLI;
- webhooks with delivery history and retry;
- local development emulator;
- quickstarts and API reference;
- plugin manifest and signed package format.

Exit criteria:

- a new developer registers a worker and completes a mission in under 30 minutes;
- examples pass in CI;
- breaking-change policy and API versioning are published;
- webhook replay and signature verification are tested.

### Phase J — Enterprise readiness

**Goal:** safely operate across serious organizations and regulated boundaries.

Build:

- granular RBAC and service accounts;
- SSO/SAML and SCIM when demanded;
- immutable audit export;
- project/environment isolation;
- customer-managed keys or key hierarchy;
- private-cloud deployment profile;
- retention and legal-hold controls;
- regional/data-residency options;
- security review, threat model, backup/restore, and disaster recovery;
- usage metering and budget governance.

Exit criteria:

- tenant isolation suite passes;
- restore drill meets recovery objectives;
- access revocation propagates within target time;
- audit export reconstructs privileged mission actions;
- private deployment follows the same mission contracts.

### Phase K — Copilots

Copilots enhance the runtime; they are not the runtime.

Build only after core data is trustworthy:

- Mission Copilot: drafts objective, acceptance criteria, plan, and verifier contract;
- Operations Copilot: explains failure and proposes recovery;
- Policy Copilot: drafts policy changes for human approval;
- Analytics Copilot: explains reliability, cost, and performance trends.

Copilots cannot silently approve, execute privileged actions, or change policy.

### Phase L — Marketplace

Marketplace follows a stable plugin and worker contract.

Start with a private organization catalog for:

- workers;
- integrations;
- mission templates;
- verifier packs;
- policies;
- provider adapters.

Public publishing requires signing, malware scanning, permissions disclosure, version compatibility, provenance, review, revocation, and billing rules.

### Phase M — Production Intelligence

**Goal:** continuously improve autonomous workers from real production usage, not only offline evaluations.

Production Intelligence is the learning and reliability loop after Memory. It converts real user outcomes into explainable failures, regression evaluations, approved fixes, and measurable improvement for future missions.

The canonical loop is:

```text
Mission
  ↓
Execution and production usage
  ↓
Failure signals
  ↓
Failure clustering
  ↓
Root-cause analysis
  ↓
Auto-generated evaluation
  ↓
Regression suite
  ↓
Approved fix
  ↓
Replay and verification
  ↓
Memory and better next mission
```

#### M.1 Production interaction capture

Capture production conversations and worker interactions as governed, tenant-scoped records:

- mission and execution correlation IDs;
- conversation, message, and turn boundaries;
- tool calls, inputs, outputs, permissions, and results;
- model, worker, agent, prompt, policy, and memory versions;
- latency, retries, timeouts, token usage, cost, and provider errors;
- user feedback, correction, abandonment, escalation, and outcome;
- retention class, redaction status, consent basis, and provenance.

Raw customer content must not be copied into cross-tenant learning. Sensitive content is redacted or summarized according to retention and privacy policy before aggregation.

#### M.2 Failure signal detection

Detect explicit and behavioral production failure signals, including:

- repeated user questions or correction loops;
- user dissatisfaction or explicit rejection;
- human edits to worker output;
- conversation abandonment or excessive turns;
- support tickets and escalation events;
- tool failures, permission denials, latency breaches, and retries;
- verification failures, regressions, and UNKNOWN results;
- conversion or task-completion drop-off where the product provides the signal.

Each signal records its source, confidence, evidence references, and whether it is an observed failure, a suspected failure, or an unresolved anomaly.

#### M.3 Failure score and reliability model

Compute a versioned failure score from 0–100 and expose the components rather than only one opaque number:

- accuracy and acceptance outcome;
- latency and timeout rate;
- retry and recovery rate;
- tool and provider failure rate;
- user frustration and correction signals;
- abandonment and escalation;
- human intervention;
- verification confidence and uncertainty;
- cost or resource anomalies.

Worker reliability must include confidence intervals, sample size, evaluation window, and regression trend. The scheduler may use reliability only when the policy permits it and the score has sufficient evidence.

#### M.4 Failure clustering and root cause

Group related failures by mission objective, worker, tool, provider, policy, prompt, memory retrieval, error type, and evidence pattern. Each cluster includes:

- cluster identity and version;
- representative mission replays;
- affected workers, providers, and missions;
- frequency, trend, severity, and estimated impact;
- likely root cause hypotheses;
- confidence and supporting evidence;
- unresolved alternatives and human review status.

Root-cause analysis may use AI, but its output is a hypothesis until evidence and human review establish an approved cause.

#### M.5 Automatic evaluation and regression generation

Convert reviewed production failures into evaluation cases:

- sanitized input and context;
- expected behavior and acceptance criteria;
- required tools and permissions;
- verification procedure and evidence requirements;
- model, prompt, memory, policy, and worker provenance;
- privacy and retention classification.

Every generated evaluation starts as a draft. It cannot enter a release gate, change a worker score, or block production without review and approval. Duplicate evaluations are clustered and deduplicated before entering the regression suite.

#### M.6 Mission replay and controlled comparison

Provide one-click replay of a failed or degraded mission using an immutable input snapshot and an explicitly selected change set:

- model or provider;
- prompt or agent version;
- memory retrieval configuration;
- tool permissions or adapter version;
- policy or recovery strategy;
- verifier contract.

Replay must run in an isolated environment, preserve the original evidence, and produce an old-versus-new comparison for outcome, evidence coverage, cost, latency, policy decisions, and unresolved risk. Replay cannot auto-deploy or silently mutate production configuration.

#### M.7 Approved fix proposals

Production Intelligence may propose:

- prompt or model changes;
- tool adapter or permission changes;
- memory retrieval improvements;
- policy or recovery changes;
- verification and evidence improvements;
- worker routing changes.

Each proposal requires affected clusters, expected benefit, risk, rollback plan, regression results, and an explicit human approval before application. Auto-deployment is out of scope for Phase M.

#### M.8 Production Intelligence surfaces

Expose live, evidence-backed views for:

- top production failure clusters;
- failure score and reliability trend by worker;
- recovery rate and human intervention;
- root-cause hypotheses and confidence;
- regression evaluations generated from production;
- replay comparisons;
- approved fix proposals and rollback status;
- measurable improvement from one mission version to the next.

These are operational views, not decorative analytics. Empty or unavailable data must be shown honestly.

#### Phase M exit criteria

- production interactions are captured with tenant isolation, correlation IDs, provenance, redaction, and retention enforcement;
- failure signals are detected from explicit feedback and at least three behavioral/runtime signals;
- related failures cluster deterministically and expose evidence-backed impact;
- root-cause output is labeled as hypothesis until reviewed;
- a reviewed production failure creates a draft evaluation and regression case without manual database work;
- replay compares two mission configurations without mutating the original run;
- no proposed fix changes production without recorded approval and rollback metadata;
- worker reliability scores show sample size, confidence, trend, and provenance;
- one design-partner workflow demonstrates measurable improvement across two mission versions;
- cross-tenant learning from raw customer content is prevented by automated tests and policy gates.

---


> A design partner can run a consequential mission and receive a credible PASS, FAIL, or UNKNOWN result with proof.

---

## 12. Product and engineering metrics

### North-star metric

**Verified successful missions per active organization per week.**

### Activation

- time to create first project;
- time to register first worker;
- time to first verified mission;
- percentage completing the quickstart without support.

### Runtime reliability

- mission completion rate;
- verification PASS / FAIL / UNKNOWN distribution;
- recovery success rate;
- mean time to recover;
- state-transition and duplicate-side-effect incidents;
- worker availability and lease-expiry incidents;
- event delivery delay.

### Trust and governance

- evidence coverage;
- privileged actions with policy trace;
- approval response time;
- missions with unresolved risk;
- memory retrieval trace coverage;
- audit completeness.

### Economics

- cost per verified mission;
- model/provider cost by mission class;
- infrastructure cost per active worker;
- operator minutes per mission;
- gross margin by deployment model.

### Learning

- outcome save rate;
- approved reusable lessons;
- future missions that use an approved lesson;
- repeat-failure reduction;
- measured improvement after policy or worker changes.

---

## 13. Testing and release gates

Every runtime slice requires:

- schema and API contract tests;
- tenant isolation tests;
- state-machine transition tests;
- idempotency and concurrency tests;
- event replay tests;
- worker lease/fencing tests;
- policy denial tests;
- evidence integrity tests;
- failure-injection and recovery tests;
- migration and rollback test;
- TypeScript validation and production build;
- observability assertions for IDs, logs, metrics, and traces.

Release environments:

1. local deterministic fixtures;
2. CI with simulated workers and failures;
3. internal staging with real provider sandbox;
4. design-partner preview;
5. production with gradual rollout and rollback trigger.

No phase is complete only because its UI exists.

---

## 14. Landing page plan

The marketing site can describe the long-term vision while clearly identifying available capabilities.

Nine sections:

1. **Hero:** “The Runtime for Autonomous Workers” with a live mission animation.
2. **Problem:** fragmented models, agents, edge systems, governance, and evidence.
3. **How Epoch Works:** Mission → Runtime → Workers → Verified Result.
4. **Capabilities:** execution, recovery, verification, evidence, policy, and learning.
5. **Mission Control:** real screenshots or recordings from live product data.
6. **Developer Platform:** APIs, SDK, MCP, CLI, and worker protocol.
7. **Enterprise:** security, governance, private deployment, and auditability.
8. **Use Cases:** AI engineering first; edge AI and industrial automation marked pilot/future until proven.
9. **Call to Action:** “Run your first verified mission.”

Do not market unsupported providers, devices, compliance certifications, or autonomous recovery as shipped.

---

## 15. Scope guardrails

Until Phase B–E exit criteria pass:

- no public marketplace;
- no broad device fleet;
- no multi-cloud abstraction project;
- no separate copilot product;
- no framework adapter collection beyond one real customer need;
- no navigation section without backend truth;
- no microservice decomposition;
- no rewrite of the existing database/runtime stack;
- no claim that an AI evaluator alone proves correctness;
- no unbounded autonomous policy mutation;
- no cross-tenant learning from raw customer data.

The deciding question for every proposed feature is:

> Does this make a real mission easier to execute, recover, verify, or improve?

If the answer is no, it is not part of the current build.

---

## 16. Definition of V12 beta

V12 beta is ready when a new organization can:

1. create an organization and project;
2. create or approve a mission with acceptance criteria;
3. register a worker through the SDK;
4. queue and observe the mission in realtime;
5. enforce a tool and budget policy;
6. survive one recoverable failure;
7. collect complete evidence;
8. obtain PASS, FAIL, or UNKNOWN from an independent verification path;
9. download an assurance report;
10. save an outcome lesson for future missions;
11. complete the flow without internal database or engineering intervention.

The beta is not defined by the number of dashboard pages, providers, frameworks, or integrations.

---

## 17. Recommended first implementation slice

Build one vertical slice before expanding the platform:

> **Verified software-change mission** — an AI agent receives a bounded repository task, uses scoped tools, streams actions and evidence, survives one injected failure, runs deterministic tests, receives independent verification, and returns PASS, FAIL, or UNKNOWN with an assurance report and saved lesson.

This slice exercises the reusable core:

- Mission Runtime;
- AI Agent Worker;
- scheduling and leases;
- execution and tool gateway;
- recovery;
- evidence;
- verification;
- policy and approval;
- memory before and after execution;
- Mission Control;
- SDK and MCP.

Once this loop is reliable and useful to design partners, extend the same contracts to AI model workers, human review, and one simulated edge worker.

---

## 18. Canonical plan hierarchy

Use documents as follows:

- **This V12 plan:** canonical product direction, architecture, phases, and gates.
- `docs/EPOCH_BETA_V2_BACKLOG.md`: deferred worker/edge experiments that must obey V12 gates.
- `docs/PRODUCT_PHASES_VISION_AND_BUILT.md`: historical MemoryOS capability evidence, not current sequencing.
- `docs/EPOCH_MEMORYOS_MASTER_PLAN_V10.md`: strategic history and advanced institution research.
- `docs/EPOCH_AUTONOMOUS_ORGANIZATION_INFRASTRUCTURE_PLAN_V11.md`: strategic history and longer-horizon autonomous organization concepts.
- sprint documents: implementation tickets for the current V12 phase only.

When documents conflict on active build order, V12 wins. Existing implemented capabilities are preserved unless a migration record explicitly replaces them.
