# MemoryOS Institution Compiler

## Final Build Plan v4

**Status:** Canonical implementation plan for the next build cycle  
**Date:** 2026-07-14  
**Company:** Reality Exchange  
**Core platform:** memoryosTM Institution Compiler  
**First sellable product:** MemoryOS Agent Change Control  
**First wedge:** governed and independently verified code and configuration changes made by AI agents  
**Existing deployment:** DigitalOcean  
**MVP target:** deployable customer pilot in eight weeks

This document supersedes earlier planning documents for new work. Existing code, connectors, deployments, and customer data are preserved unless a migration is explicitly approved.

## 1. Product Decision

Do not sell the abstraction first. Sell the concrete safety outcome:

> MemoryOS is change control for AI agents. Every material agent action is scoped, policy-checked, executed in an isolated environment, attached to evidence, human-approved when risk demands it, and independently verified. A failure becomes a replayable regression and a reviewed improvement.

The product hierarchy is:

1. **Reality Exchange:** long-term market for independently verified outcomes.
2. **Institution Compiler:** compiles a mission into an accountable temporary organization.
3. **Agent Change Control:** first customer product and integration surface.
4. **Proof-Carrying Action Runtime:** authority, policy, action, evidence, and certificate kernel.
5. **Production Learning Loop:** converts failures and conversion loss into reviewed fixes.

The first product must answer one question:

> What dangerous or ineffective action did MemoryOS find, reproduce, block, or improve that the existing process missed?

## 2. Product Scope

### Customer workflow

```text
Connect company sources
  -> create measurable mission
  -> compile mandate and institution
  -> inspect authority and risk
  -> investigate through governed tools
  -> run candidate change in an isolated sandbox
  -> adversarial review
  -> independent verification
  -> human approval
  -> pull request and certificate
  -> observe production outcome
  -> diagnose failure or conversion loss
  -> replay and counterfactual test
  -> reviewed Eval Case and Mission Patch
  -> verified rollout
```

### First mission class

One GitHub repository and one production-shaped incident, initially focused on billing, authorization, database, retry, or performance changes. The supplied duplicate-charge scenario remains the benchmark because it has clear invariants and measurable failure modes.

### First customer surfaces

1. **Connect:** source, authorization, sync, freshness, and deployment health.
2. **Mission:** target, baseline, protected conditions, budget, risk, evidence, and approval rules.
3. **Institution:** roles, capability grants, context boundaries, budgets, and verifier separation.
4. **Action Review:** proposed change, predicted consequences, policy decision, tests, evidence, rollback, and human decision.
5. **Replay:** baseline versus candidate behavior in an isolated environment.
6. **Certificate:** signed action and verification proof attached to the pull request.
7. **Learning Inbox:** failure clusters, root-cause hypotheses, Eval Cases, Mission Patches, and review state.
8. **Reality Settlement:** verified, rejected, diverged, or inconclusive outcome.

Do not make the customer operate a broad organization graph editor in the MVP. Show the compiled institution as an explainable artifact inside the workflow.

## 3. Architecture Mapped to This Repository

The current repository is a TypeScript/Node backend with a Next.js frontend, Prisma/PostgreSQL paths, MemoryOS memory and continuity systems, GitHub and Slack integrations, company-source work, SDK/MCP surfaces, and existing DigitalOcean deployment assets.

### Preserve and evolve

| Existing capability | v4 role |
|---|---|
| Next.js frontend | Operator console and customer onboarding |
| Existing Node API | Control plane during MVP; add Fastify-compatible module boundaries without a rewrite |
| Prisma/PostgreSQL | Authoritative state, audit records, connector state, mandates, evidence, and evaluations |
| MemoryIgnition | Mission context, role inheritance, approved skills, risk rules, and outcome memory |
| Company Brain/source ingestion | World-state and evidence ingestion |
| GitHub integration | PR intake, checks, governed branch/PR actions, CI events |
| Slack integration | Read-only company context, decisions, incidents, and human review evidence |
| Jira/Linear integrations | Issue, incident, ownership, and work context when already enabled |
| Local files/imports | Controlled source bootstrap and traceable evidence import |
| Risk approvals | Human approval boundary and grant lifecycle |
| Runtime/agent routes | Action Gateway and role-worker entry points |
| Reality Compiler routes | Mandate intake, compilation, verification, and settlement API surface |
| Experience and mistake-immunity systems | Failure learning, Eval Cases, and Mission Patches |
| DigitalOcean deployment | Initial production compute and pilot environment |

### New bounded modules

Add modules behind existing APIs rather than creating a second product runtime:

```text
server/services/mandate/
server/services/institution-ir/
server/services/action-gateway/
server/services/evidence/
server/services/verification/
server/services/settlement/
server/services/failure-intelligence/
server/services/conversion-intelligence/
server/services/company-sources/
```

Recommended future monorepo package boundaries, only after the first vertical slice works:

```text
packages/mandate
packages/institution-ir
packages/constitutional-vm
packages/action-gateway
packages/evidence
packages/verification
packages/evaluation
packages/company-sources
```

Do not migrate to pnpm/Turborepo as a separate project before the existing customer path is stable. Use the current npm/package-lock workflow until the pilot has a measured reason to migrate.

## 4. MVP Deployment: DigitalOcean First

The existing DigitalOcean deployment is the first deployment target. Do not migrate compute to AWS ECS/Fargate or Google Cloud Run during the first pilot merely to match the reference stack.

### Initial production topology

```text
DigitalOcean Next.js web
        |
DigitalOcean Node control plane
        |
Managed PostgreSQL using the current Prisma-compatible datasource
        |
Institution worker + verifier worker + failure-analysis worker
        |
Neon or existing managed PostgreSQL sandbox branch when approved
        |
S3-compatible artifact storage: DigitalOcean Spaces, AWS S3, or Cloudflare R2
        |
E2B sandbox for isolated agent/code execution
        |
GitHub App + GitHub Actions
        |
OpenAI + Anthropic direct adapters
        |
OpenTelemetry + Sentry
```

### Database rule

Use the existing Prisma/PostgreSQL path first. Introduce Neon as the authoritative production database only after a migration rehearsal proves tenant isolation, backup/restore, Prisma compatibility, and rollback. Neon is the preferred managed target, not a reason to break the deployed system.

### DigitalOcean release stages

1. **Observe:** deploy read-only ingestion and dashboards.
2. **Warn:** generate findings and certificates without blocking customer merges.
3. **Approval:** require human approval for selected high-risk actions.
4. **Enforce:** enable deterministic blocking for a defined mission class.

No raw production credential is passed to a model or worker. Use short-lived scoped credentials, secret-manager references, tenant isolation, audit logs, kill switch, and grant revocation.

### Infrastructure as code

Terraform covers the stable infrastructure boundary: DigitalOcean compute/networking, managed database, Spaces or S3/R2, DNS, secrets references, monitoring, and backup policy. Kubernetes is explicitly deferred.

## 5. Exact MVP Stack

| Area | MVP choice | Decision |
|---|---|---|
| Language | TypeScript + Node.js LTS | Keep current codebase language |
| Package management | Existing npm first; pnpm/Turborepo later | Avoid migration churn before pilot |
| Frontend | Next.js, React, Tailwind, existing UI primitives | Reuse current landing and console foundation |
| API | Existing Node API with Fastify-compatible boundaries | Do not rewrite working routes for framework purity |
| Contracts | Zod, JSON Schema, OpenAPI | Mandates, actions, evidence, connectors, certificates |
| Database | Existing Prisma/PostgreSQL; Neon target | One authoritative source of truth |
| Artifacts | DigitalOcean Spaces, S3, or Cloudflare R2 | Traces, patches, logs, replays, certificates |
| Git | GitHub App + GitHub Actions | First customer workflow |
| Sandbox | E2B | Isolated coding-agent execution and differential replay |
| Models | Direct OpenAI and Anthropic adapters | No model-routing proxy in MVP |
| Telemetry | OpenTelemetry | Model, tool, agent, workflow, and production event traces |
| Errors | Sentry | Application errors and trace correlation |
| Evaluations | Promptfoo plus deterministic Vitest fixtures | Replayable Eval Cases |
| Tests | Vitest, Playwright, Testcontainers | Unit, browser, integration, database |
| Security | CodeQL/Semgrep, Trivy, gitleaks | Code, image, and secret scanning |
| Deployment | DigitalOcean first; Terraform | Existing deployment continuity |
| Secrets | Existing approved secret flow, then AWS/GCP Secret Manager + KMS | Never store raw credentials in prompts or plaintext rows |

### Do not add to MVP

Kafka, Kubernetes, Neo4j, a separate vector database, a general multi-agent framework, a model-routing proxy, blockchain, real-money escrow, insurance infrastructure, public agent marketplace, multi-cloud deployment, owned GPUs, Temporal Cloud, OPA/Rego, Redis, LaunchDarkly, WorkOS, and broad autonomous production deployment.

## 6. Mandate, Institution, Action, and Evidence Contracts

### Mandate Contract

```text
mandate_id
tenant_id
mission_class
target_outcome
baseline_metric
measurement_source
measurement_window
protected_conditions[]
authority_policy
budget
approval_policy
required_tests[]
verification_window
rollback_plan
termination_conditions[]
status
version
```

States: `DRAFT`, `NEEDS_CLARIFICATION`, `UNMEASURABLE`, `UNSAFE`, `READY`, `ACTIVE`, `PAUSED`, `VERIFIED`, `REJECTED`, `INCONCLUSIVE`, `DISSOLVED`.

### Institution IR

The compiled artifact contains mission, roles, context policy, tool policy, capability grants, budgets, independence groups, escalation rules, evidence requirements, verification topology, and reconfiguration rules.

MVP fixed roles:

- Mission Governor
- Investigator
- Change Planner
- Adversarial Reviewer
- Limited Executor
- Independent Verifier

Allow one specialist from a small registry: Payment Integrity, Database Safety, Authorization, Performance, or Dependency/Build.

### Deterministic Action Gateway

Every material action is checked for:

- tenant and mission scope;
- role and capability grant;
- resource and environment;
- policy decision;
- budget and blast radius;
- idempotency and expiry;
- approval requirement;
- rollback/recovery readiness;
- evidence attachment;
- audit receipt.

### Evidence Graph and certificate

Evidence nodes include source event, trace, artifact, test result, metric, approval, tool receipt, sandbox result, verifier decision, and production observation. A proof-carrying Action Certificate binds exact source, mandate, policy, evidence, verifier, and expiry. Any relevant diff, policy, evidence, or assumption change invalidates the certificate.

## 7. Company-Source Connector Architecture

Keep all useful company-source connectors, but do not implement each one as a separate product concept. Use one generic connector contract.

### Connector source types

| Source type | Examples | MVP access |
|---|---|---|
| Source code | GitHub, GitLab, Bitbucket | Read plus governed PR/check actions for GitHub |
| Communication | Slack, Microsoft Teams | Read-only evidence and human decisions |
| Customer support | Zendesk, Intercom | Read-only conversation, issue, and outcome events |
| Cloud infrastructure | AWS, GCP, Azure | Read-only metrics, deployments, and configuration evidence |
| Observability | OpenTelemetry, Sentry, Datadog, Grafana | Read-only traces, errors, incidents, and metrics |
| Work management | Linear, Jira | Read issues, incidents, ownership, and status |
| CI/CD | GitHub Actions, Buildkite | Read checks; trigger bounded sandbox tests |
| Business systems | Stripe, Snowflake | Restricted read-only evidence only |
| Conversation intelligence | Agnost, LangSmith, Braintrust, Langfuse | Optional imported evaluation/conversation evidence |
| Product analytics | PostHog, Segment | Optional conversion and completion events |

### Generic Connector model

```text
connector_id
tenant_id
source_type
provider
display_name
auth_mode
scopes
status
last_sync_at
cursor
webhook_state
freshness_sla
redaction_policy
retention_policy
created_by
```

Every adapter must normalize into:

```text
SourceEvent
  source
  external_id
  event_type
  actor
  occurred_at
  payload_ref
  tenant_id
  trace_id?
  mission_id?
  provenance
  sensitivity
```

Connector requirements: OAuth/token safety, least-privilege scopes, webhook signature checks, cursor-based sync, idempotency, freshness, retry/backoff, redaction, tenant isolation, audit trail, and disconnect/revocation.

### Build order

1. GitHub and GitHub Actions.
2. Slack.
3. OpenTelemetry and Sentry.
4. Zendesk or Intercom for one design partner.
5. AWS read-only source for one infrastructure design partner.
6. Jira/Linear and other existing adapters.
7. Agnost, LangSmith, Braintrust, Langfuse, PostHog, and Segment only when a pilot requires their evidence.

A connector is not complete when it authenticates. It is complete when a source event can be traced to a mission, evidence record, finding, replay, or outcome decision.

## 8. Continuous Conversation and Conversion Intelligence

MemoryOS should continuously analyze production conversations and customer journeys to find where users get stuck, frustrated, abandon, or fail to convert, then turn the highest-impact patterns into reviewed fixes for the agent.

This is a product learning loop, not a promise to rebuild every vendor's observability product.

```text
Conversation / product event
  -> normalize and redact
  -> detect stuck, frustration, abandonment, failure, or conversion loss
  -> correlate with trace, model, tool, policy, prompt, version, and source state
  -> generate root-cause hypotheses
  -> replay representative cases
  -> run counterfactual candidate fixes
  -> confirm or reject diagnosis
  -> create Eval Case
  -> create Mission Patch
  -> human review
  -> verified rollout
  -> observe outcome
```

Required customer-defined events: session started, intent, completion, conversion, abandonment, escalation, support resolution, and business outcome. Do not infer revenue or frustration without customer-defined event semantics or explicit source evidence.

## 9. Failure and Root-Cause Intelligence

When an evaluation fails, MemoryOS must record both the observed failure and the likely cause. Correlation creates only a hypothesis; reproduction or counterfactual evidence is required before marking a cause confirmed.

### Failure taxonomy

| Failure class | Example diagnosis |
|---|---|
| Intake/normalization | Missing event, malformed payload, duplicate event, timestamp drift |
| Connector/source | Expired token, missing scope, stale cursor, webhook loss, wrong tenant |
| Context/retrieval | Wrong memory selected, stale knowledge, missing owner, irrelevant incident |
| Model/provider | Model version drift, refusal, hallucination, context overflow, latency |
| Prompt/instruction | Ambiguous mandate, conflicting rule, missing stop condition |
| Role/routing | Wrong specialist, missing capability, poor delegation, weak escalation |
| Tool/action | Unauthorized call, wrong parameters, timeout, partial write, duplicate delivery |
| Policy/authority | Grant too broad, grant expired, missing approval, policy false positive |
| Code/change | Incorrect patch, hidden dependency, migration incompatibility, regression |
| Test/eval | Missing case, weak oracle, flaky fixture, false pass, false block |
| Sandbox/environment | Non-representative data, dependency mismatch, resource limit, network difference |
| Verifier | Same context as executor, incomplete evidence, incorrect threshold, stale certificate |
| Production/reality | Drift, rollout issue, external dependency, metric delay, unobserved side effect |
| Human decision | Approval misunderstanding, override without reason, unclear evidence, delayed review |
| Conversion/conversation | User stuck, frustration, abandonment, intent mismatch, missing handoff |

### Failure record

```text
failure_id
tenant_id
mission_id?
source_event_ids[]
trace_ids[]
eval_case_id?
stage
observed_behavior
expected_behavior
impact
severity
candidate_causes[]
confirmed_cause?
evidence_refs[]
replay_refs[]
counterfactual_refs[]
model_version
tool_versions
prompt_version
policy_version
world_snapshot_version
status
reviewer
```

### Diagnosis states

`OBSERVED`, `CLUSTERED`, `HYPOTHESIS`, `REPLAYED`, `COUNTERFACTUAL_TESTED`, `CONFIRMED`, `REJECTED`, `PATCH_PROPOSED`, `PATCH_APPROVED`, `VERIFIED`.

### Required error checks

Every Eval Case must report:

- which stage failed;
- what the system expected;
- what actually happened;
- whether the failure reproduced;
- which versions were involved;
- which evidence supports the cause;
- whether a proposed fix passes prior regressions;
- whether the fix changes authority, privacy, invariants, or verifier independence;
- whether human review is required;
- whether the failure becomes a Mission Patch.

## 10. Eight-Week Build Sequence

### Weeks 1–2: Connect, contract, and replay

- Inventory current DigitalOcean deployment and rollback path.
- Freeze Mandate v0, SourceEvent, ActionProposal, Evidence, EvalCase, MissionPatch, and Certificate schemas.
- Build GitHub App intake and CI event ingestion.
- Implement generic connector records and sync health.
- Add Slack read-only ingestion using existing connector patterns.
- Normalize OpenTelemetry and Sentry events.
- Build duplicate-charge deterministic fixture and historical incident replay.
- Ship Connect and Mission screens.

**Exit:** a source event and historical incident become a versioned Mandate and deterministic replay.

### Weeks 3–4: Governed actions

- Implement capability grants, policy decisions, action receipts, and deny-by-default gateway.
- Add read, search, branch, edit, test, and pull-request adapters.
- Add E2B sandbox with network, time, CPU, memory, filesystem, and expiry limits.
- Implement fixed roles and role-specific context.
- Add adversarial reviewer and unsafe-plan rejection.

**Exit:** no material agent action bypasses the gateway; at least one plausible unsafe action is blocked.

### Weeks 5–6: Independent verification and failure intelligence

- Run verifier under separate identity, context, workspace, and writable-state boundary.
- Add deterministic tests, protected conditions, evidence coverage, rollback checks, and certificate v0.
- Ingest production traces, conversations, conversion events, and human feedback when connected.
- Cluster failures and conversion loss in PostgreSQL.
- Generate Eval Case v0, replay, counterfactual candidate, and root-cause hypothesis.
- Generate Mission Patch that may alter prompt, tool contract, test, routing, policy, or specialist trigger.
- Require human review before patch merge or rollout.

**Exit:** one hidden failure or conversion loss becomes a replayable, reviewed improvement proposal.

### Weeks 7–8: Pilot hardening

- Add tenant isolation, redaction, audit export, retention policy, kill switch, and grant revocation.
- Add one customer-required source: Zendesk/Intercom or AWS read-only.
- Run fault injection for timeout, partial write, duplicate delivery, stale evidence, provider failure, connector loss, verifier disagreement, and model failure.
- Deploy shadow mode on DigitalOcean.
- Onboard two design partners with one repository each.
- Produce one paid historical replay and evidence-backed report.

**Exit:** a customer can connect sources, replay an incident, receive a proof-carrying pull request, understand a failure cause, and decide on approval-mode continuation.

### Weeks 9–12: Category proof

- Add two candidate institution topologies.
- Add specialist insertion and grant revocation based on evidence.
- Compare strong single agent, static team, and compiled institution at equivalent budget.
- Run at least 30 production-shaped cases across three mission classes.
- Demonstrate one unsafe action rejected or one hidden failure found beyond the strongest baseline.

## 11. Add After the First Pilot

| Tool | Add when |
|---|---|
| Temporal Cloud | Workflows last hours/days or must recover from crashes |
| OPA/Rego | Customers need editable policy-as-code |
| WorkOS | Enterprise SSO, SCIM, or directory sync is required |
| LaunchDarkly/Unleash | Controlled canary rollout is required |
| Datadog/Grafana | Customers require production metrics connectors |
| PostHog | MemoryOS needs owned product analytics |
| Redis | PostgreSQL jobs become a measured bottleneck |
| Kubernetes | Concurrent isolated workloads justify operational complexity |
| pgvector | Failure clustering needs embeddings after deterministic features are insufficient |
| AWS/GCP secrets manager | DigitalOcean pilot secret boundary requires managed external KMS |

## 12. Deferred Agent Clearinghouse

Do not build these for the MVP: WorkOS/Auth0 identity marketplace, SPIFFE/SPIRE workload identity, W3C Verifiable Credentials, A2A Agent Cards, DocuSign contracts, Stripe Connect marketplace payments, insurance, escrow, legal/liability infrastructure, public agent marketplace, or external bidding.

These become valid only after repeated verified missions create demand for external participants, portable certificates, or independent verifiers.

## 13. What MemoryOS Must Own

Never outsource the technical moat:

- Mandate Contract;
- Institution IR and constitutional type system;
- capability grants and deterministic Action Gateway;
- Evidence Graph and proof-carrying Action Certificate;
- independent verifier logic;
- root-cause diagnosis and impact ranking;
- failure clustering and conversion-loss ranking;
- Eval Case generation;
- Mission Patch workflow;
- counterfactual replay;
- capability and verified-outcome graph;
- source-event normalization and provenance;
- certificate revocation and settlement semantics.

Use vendors for commodity storage, model inference, sandboxing, telemetry transport, auth, and deployment. The vendor must never decide whether an action is authorized, proven, settled, or safe for the customer's mission.

## 14. Six Day-One Accounts

1. GitHub
2. OpenAI
3. Anthropic
4. Neon or the existing managed PostgreSQL provider during migration
5. E2B
6. DigitalOcean plus AWS/GCP-compatible artifact/secrets storage as required

Slack, Zendesk, AWS, Sentry, OpenTelemetry, and optional evaluation providers are connected per design-partner need, not required to block the first technical proof.

## 15. Security and Reliability Gates

- No raw production credentials in model context.
- Read-only connector scopes by default.
- GitHub writes only through typed, audited actions.
- No production write access in the MVP.
- Tenant and organization scope on every source, event, mandate, artifact, and trace.
- Redaction and retention before model ingestion.
- Unknown or insufficient evidence is never treated as PASS.
- Correlation is never labelled confirmed cause without replay or counterfactual evidence.
- Certificates expire or revoke when source, policy, evidence, or assumptions change.
- Human approval required for high-risk actions and all pilot canaries.
- Kill switch and grant revocation tested before pilot.
- Backup/restore and DigitalOcean rollback rehearsed.
- Secret, dependency, container, and tenant-isolation tests run in CI.

## 16. Definition of Done

The customer MVP is real when:

1. A design partner installs the GitHub App.
2. Company sources connect through a generic Connector model.
3. One historical incident becomes a versioned Mandate.
4. The baseline failure reproduces.
5. Every material action crosses the deterministic gateway.
6. At least one unsafe action is mechanically blocked.
7. A bounded patch runs in E2B.
8. An independent verifier can reject executor confidence.
9. A pull request receives a verifiable Action Certificate.
10. A production or conversation failure becomes a failure cluster with evidence.
11. The root-cause hypothesis is replayed or counterfactually tested.
12. The confirmed failure becomes a reviewed Eval Case.
13. A Mission Patch passes the new case and prior regressions.
14. No patch weakens authority, protected conditions, privacy, or verifier independence.
15. The customer requests another mission or pays for the next phase.

## 17. Immediate Next Implementation Slice

Build in this order against the current repository:

1. Add v4 contract types and persistence for `Mandate`, `SourceEvent`, `ActionProposal`, `EvidenceRecord`, `EvalCase`, `MissionPatch`, and `ActionCertificate`.
2. Add generic connector metadata and normalize existing GitHub, Slack, Jira/Linear, and local-file sources to `SourceEvent`.
3. Connect GitHub pull-request events to a Mandate and compilation run.
4. Add deterministic action authorization and evidence receipts around the existing runtime routes.
5. Add one E2B or approved isolated replay adapter.
6. Add independent verification and certificate output.
7. Add failure taxonomy, root-cause hypotheses, replay status, and Mission Patch review.
8. Deploy the slice in DigitalOcean shadow mode before enabling any blocking behavior.

This sequence updates the current product without replacing the existing MemoryOS memory, connector, continuity, and operator-console foundations.
