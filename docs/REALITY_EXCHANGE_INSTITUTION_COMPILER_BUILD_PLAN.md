# THE INSTITUTION COMPILER

Status: Active build plan
Primary company: Reality Exchange
Primary product: memoryosTM Institution Compiler
Initial wedge: Verified production-engineering outcomes

## 1. Executive Summary

Reality Exchange is the long-term company.

memoryosTM Institution Compiler is the first product.

Agent Clearinghouse is a later subsystem.

Do not build all three at once.

Build the Institution Compiler first for production engineering.
Use the existing MemoryOS codebase as the memory, evidence, policy, and learning substrate rather than deleting it.

First product promise:

> Give memoryosTM a measurable production mission. It compiles the specialist AI institution required to achieve it, enforces bounded authority and budgets, restructures the institution when evidence changes, and independently verifies the result.

First proof:

> A dynamically compiled institution solves and verifies a production mission that a strong single agent and a static multi-agent workflow cannot reliably complete.

## 2. Company Positioning

- Company: Reality Exchange
- Core product: memoryosTM Institution Compiler
- Initial category: Autonomous Institutional Infrastructure for production engineering
- One-liner: memoryosTM compiles production missions into governed AI engineering institutions and independently verifies the outcome.
- Technical one-liner: A compiler and constitutional runtime for dynamically generated agent institutions with bounded authority, budgets, structural adaptation, evidence, and outcome verification.

Do not lead with:

- multi-agent orchestration
- company memory
- AI workforce OS
- agent marketplace
- capital markets for reality
- operating system for civilization

Those are supporting concepts or long-term implications.

## 3. First Customer

Ideal customer:

- AI-native software company
- 10 to 100 engineers
- Uses Codex, Claude Code, Cursor, Devin, Windsurf, or internal agents
- Runs many agent tasks every week
- Uses GitHub and CI
- Has Sentry, Datadog, OpenTelemetry, or similar telemetry
- Has recurring production incidents, migrations, auth risks, billing risks, or performance regressions
- Wants more agent autonomy but does not trust autonomous production execution

Economic buyer:

- Founder or CTO
- VP Engineering
- Head of Platform
- Head of Developer Productivity
- Head of AI Infrastructure

Daily users:

- SRE
- Platform engineer
- Staff engineer
- Incident commander
- Security engineer
- AI platform engineer

Initial use case:

- Historical production incident replay
- Read-only shadow investigation
- Human-approved preview or canary execution

First supported mission classes:

1. Duplicate financial action
2. Unsafe migration
3. Authorization regression
4. Performance regression

Do not initially support:

- healthcare decisions
- bank transaction execution
- robots
- factories
- public outcome markets
- external capital
- insurance underwriting
- unknown external workers
- fully autonomous production deployment

## 4. Product Lifecycle

Persistent mission
-> Mandate Contract / Mission Constitution
-> World state and baseline established
-> Required capabilities inferred
-> Candidate organizational topologies generated
-> Roles, agents, humans, tools, authority, and budgets allocated
-> Candidate institutions statically validated
-> Competing plans and hypotheses tested
-> Actions executed through governed tool gateways
-> Evidence and dissent recorded
-> Institution reconfigured when evidence changes
-> Intervention tested in sandbox or preview
-> Human-approved bounded canary
-> Outcome independently verified
-> Settlement decision produced
-> Institution persists, adapts, or dissolves
-> Institutional capability learning retained

Every stage must produce a typed, versioned artifact.

No important state transition may exist only inside an LLM conversation.

## 5. MVP Definition

The MVP is a closed Institution Compiler for one software company at a time.

Required MVP capabilities:

1. Create a measurable mandate.
2. Compile the mandate into an Institution IR.
3. Generate at least two different candidate organizational topologies.
4. Assign role-specific context, tools, authority, and budgets.
5. Enforce permissions through a deterministic gateway.
6. Run competing investigations or plans.
7. Capture evidence and contradictory claims.
8. Reject at least one plausible but unsafe intervention.
9. Reconfigure the institution when a capability is missing.
10. Test the final intervention in a controlled environment.
11. Require human approval for high-risk actions.
12. Verify the sustained outcome using a separate verifier.
13. Produce a settlement report.
14. Retain data about which institution design worked.

MVP non-goals:

- real-money escrow
- external insurance
- open bidding
- cross-company reputation
- arbitrary real-world missions
- universal causal inference
- self-modifying production policies
- fully generated unrestricted organization graphs
- large enterprise administration suite
- multi-region infrastructure
- Kubernetes-first deployment
- public agent marketplace

## 6. Signature Demo

Demo mission:

> Eliminate duplicate subscription charges while preserving legitimate payment retries. Do not perform an unapproved database migration. Maximum experiment budget: $100.

Initial institution:

- Mission Governor
- Application Investigator
- Database Investigator
- Retry Worker Investigator
- Adversarial Reviewer
- Limited Executor
- Independent Verifier

Demo sequence:

1. Mandate is compiled.
2. Baseline duplicate-charge scenario is reproduced.
3. Application and database investigators form competing hypotheses.
4. One proposed solution disables retries.
5. Adversarial reviewer rejects it because it violates the mandate.
6. Evidence shows the problem depends on payment-provider retry timing.
7. Runtime detects a missing capability.
8. Institution IR v2 adds a Payment Integrity Specialist.
9. Budget is reallocated from the database investigation.
10. New intervention combines idempotency handling and reconciliation.
11. Constitutional VM blocks a schema migration without approval.
12. Corrected patch runs in a sandbox.
13. Required tests include duplicate webhook delivery, failed payment retry, concurrent retry, existing invoice readability, and migration compatibility.
14. Human approves a 1% canary.
15. Independent verifier checks target and protected metrics.
16. Settlement becomes VERIFIED.
17. Institution dissolves.
18. Capability Graph records that payment-retry incidents require a payment-integrity role and adversarial verification.

Closing demo screen:

- REALITY SETTLED
- Mission: Eliminate duplicate subscription charges
- Target: 0 duplicate charges
- Verification window: 24 hours
- Protected conditions: all passed
- Budget authorized: $100
- Budget consumed: $63
- Unsafe interventions rejected: 2
- Institution versions: 2
- Authority violations: 0
- Settlement: VERIFIED
- Institution: DISSOLVED
- Capability learning: RETAINED

## 7. System Architecture

User / Operator Console
|
API / Control Plane
|
Mandate Compiler
|
World-State Builder
|
Institution Planner
|
Institution IR Store
|
Static Institution Validator
|
Constitutional VM / Policy Gateway
|
Durable Institution Runtime
|
Role Workers and Tool Gateway
|
Sandbox / Preview / CI / Telemetry Integrations
|
Evidence Graph
|
Independent Verifier
|
Settlement Engine
|
Institutional Capability Graph

Recommended first architecture:

- Modular monolith control plane
- Durable workflow runtime
- Separate role worker process
- Separate verifier worker
- PostgreSQL as source of truth
- Object storage for artifacts
- Docker-based disposable execution environments
- OpenTelemetry for traces
- Optional OPA policy service
- No Kafka at first
- No Kubernetes at first unless isolation requirements force it

## 8. Migrating the Existing Codebase

Do not delete the current codebase.

Keep and transform:

- Source Ingestion -> World-State and Evidence Ingestion
- Memory Extraction Engine -> Typed World-State Extraction
- Knowledge Integrity Engine -> Evidence Integrity Engine
- Company Memory Graph -> World-State Graph
- Agent Experience Graph -> Institutional Capability Graph
- MemoryIgnition -> Mission Context Compiler + Role Inheritance Compiler
- Agent Permission Runtime -> Constitutional VM
- Agent Black Box -> Institution Evidence Graph
- Outcome Capture -> Independent Outcome Verification and Settlement
- Mistake Immunity -> Institution Design Learning
- Workflow Blueprints -> Institution Templates

Freeze for later:

- Agent Workforce OS
- Agent Operations Center
- Skill Marketplace
- robot inheritance
- broad browser automation
- large model router
- enterprise deployment variants
- many integrations
- public marketplace
- insurance
- external payments

Recommended repository boundaries:

```text
apps/
  web/
  api/
  role-worker/
  verifier-worker/
  policy-gateway/

packages/
  mandate/
  world-state/
  institution-ir/
  institution-compiler/
  institution-validator/
  constitutional-vm/
  institution-runtime/
  role-inheritance/
  tool-gateway/
  evidence/
  verification/
  settlement/
  capability-graph/
  evaluation/
```

## 9. Mandate Contract

A mandate is the source program of the Institution Compiler.

Required fields:

- Mandate: id, workspace_id, title, natural_language_description, mission_class, status, created_by, created_at
- Baseline: metrics, measurement_source, measurement_window, confidence, known gaps
- Desired outcome: metric, comparator, threshold, sustain_for, deadline
- Invariants: protected metric, acceptable range, severity, evidence source, violation action
- Authority: automatic actions, approval-required actions, forbidden actions, maximum blast radius, expiry
- Budget: total model spend, total tool spend, sandbox duration, maximum experiments, emergency reserve
- Verification: required deterministic tests, baseline comparison, canary rules, observation window, verifier independence, settlement threshold
- Termination: success, deadline exceeded, budget exhausted, invariant violated, manual halt, unverifiable mission

Mandate compile states:

- DRAFT
- NEEDS_CLARIFICATION
- UNMEASURABLE
- UNSAFE
- READY
- ACTIVE
- PAUSED
- VERIFIED
- REJECTED
- INCONCLUSIVE
- DISSOLVED

## 10. Institution Compiler Pipeline

1. Mission parsing
2. Mission classification
3. Consequence and risk analysis
4. Capability inference
5. Candidate topology generation
6. Role synthesis
7. Authority synthesis
8. Budget synthesis
9. Verification topology
10. Candidate scoring
11. Static validation
12. Emit versioned Institution IR

## 11. Institution IR

InstitutionIR:

- id
- version
- mandate_id
- mission_class
- topology_type
- compiler_version
- compiled_at
- status

Roles:

- role_id
- role_type
- objective
- capabilities
- context_policy
- tool_policy
- authority_ref
- budget_ref
- output_schema
- independence_group
- can_delegate
- escalation_policy

Edges:

- from_role
- to_role
- relation
- input_contract
- output_contract
- deadline
- evidence_requirements

AuthorityGraph:

- grant_id
- issuer
- subject
- resource
- actions
- constraints
- parent_grant
- expires_at
- revocation_state

BudgetGraph:

- budget_id
- owner
- allocated
- committed
- spent
- reserve
- currency_or_unit
- parent_budget

Governance:

- decision classes
- approval rules
- veto rules
- human escalation
- constitutional amendment rules
- evidence preservation rules

VerificationPlan:

- baseline source
- required tests
- protected metrics
- canary plan
- sustain period
- verifier roles
- settlement thresholds

ReconfigurationRules:

- trigger
- condition
- allowed structure changes
- disallowed structure changes
- evidence threshold
- required authority

## 12. Evidence and Verification

Evidence graph:

- event
- artifact
- test result
- metric
- approval
- tool receipt
- sandbox output
- verifier decision

Independent verification:

- deterministic tests
- canary comparison
- sustained observation
- protected metric checks
- verifier separation

Settlement states:

- VERIFIED
- PARTIALLY_VERIFIED
- REJECTED
- DIVERGED
- INCONCLUSIVE

## 13. Product UX

The product should feel like commanding an accountable organization, not watching agent chat.

Primary surfaces:

1. Mission Composer
2. Constitution Review
3. Institution Blueprint
4. Mission Control
5. Decision Inbox
6. Counterfactual Lab
7. Reality Settlement
8. Institutional Learning

Avoid:

- raw chain-of-thought displays
- giant chat transcripts
- meaningless confidence percentages
- decorative agent avatars
- topology diagrams without decisions or evidence
- dashboards with no action

Every important card must answer:

- what happened
- why
- authority used
- evidence
- risk
- cost
- next decision

## 14. Build Cut

Build now:

- Mandate Contract
- Institution IR
- two candidate topologies
- AI Agent Registry
- role-specific inheritance
- Tool Gateway
- Constitutional VM
- basic constitutional type checks
- Evidence Graph
- proof-carrying action receipts
- dynamic reconfiguration
- one counterfactual replay mode
- independent verifier
- settlement certificate v0
- benchmark against single and static multi-agent baselines

Build next:

- full Institution Package
- compiler explainability
- Living World Model
- stronger counterfactual lab
- recovery and compensation
- verifier quorum
- Institutional Chaos Lab
- capability passports
- private institution tournament
- formal validation of critical state machines

Build later:

- mission portfolio manager
- external A2A participants
- external verifier network
- cross-company passports
- escrow
- payments
- bonds
- insurance
- institution bidding
- domain packs
- closed Reality Exchange
- open Reality Exchange

## 15. Developer Surface

CLI:

- memoryos mandate create
- memoryos mandate validate
- memoryos compile
- memoryos typecheck
- memoryos explain
- memoryos simulate
- memoryos run
- memoryos inspect
- memoryos approve
- memoryos pause
- memoryos reconfigure
- memoryos verify
- memoryos settle
- memoryos replay
- memoryos chaos
- memoryos package export

SDK primitives:

- compileMandate()
- generateInstitutionCandidates()
- typecheckInstitution()
- bindParticipants()
- issueCapabilityGrant()
- authorizeAction()
- appendEvidence()
- proposeReconfiguration()
- runVerification()
- issueSettlementCertificate()

Developer mode should show:

- mission
- compiled institution
- typed authority
- role runs
- evidence
- reconfiguration
- verification
- settlement

## 16. Product Thesis

memoryosTM compiles measurable missions into temporary accountable institutions.

The compiler does not merely assign tasks to agents.

It creates a portable, type-checked Institution Package that defines:

- purpose
- organization
- participants
- knowledge
- authority
- capital
- governance
- evidence
- recovery
- verification
- settlement
- dissolution

The runtime executes proof-carrying actions against a continuously updated world model.

The institution can compete, disagree, adjudicate, restructure, recover, and stop.

It cannot expand its own authority, weaken protected values, hide contradictory evidence, verify its own success, or survive beyond its constitutional lifetime.

The moat is not the number of agents.

The moat is the accumulated knowledge of:

- which organization
- with which authority
- using which evidence
- under which world state
- can reliably create which verified outcome
- at what cost and risk

Reality Exchange is the eventual market for those outcomes.

Institution Compiler is the machine that makes them executable.

Agent Clearinghouse is the trust and settlement infrastructure that allows institutions and participants to transact across organizations.

The immediate goal remains strict:

> Prove that one dynamically compiled, type-safe, governed institution achieves and independently verifies a production outcome more reliably than a strong single agent and a static agent team.

