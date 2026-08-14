# Epoch Autonomous Organization Infrastructure Plan V11

Date: 2026-07-21

## Core Thesis

Epoch is Autonomous Organization Infrastructure.

It is not another agent platform, memory layer, workflow builder, observability tool, or enterprise dashboard. Epoch is the runtime that allows many autonomous agents, humans, tools, policies, budgets, and verifiers to become a safe, governed, accountable, and evolving organization.

Epoch governs autonomous organizations composed of humans, AI agents, robots, software systems, and physical infrastructure.

This expands what may participate in an institution without changing the core thesis: Epoch is the Institution Runtime, not an operating system for robots. Robots and machines are future execution actors governed by the same missions, roles, authority, evidence, verification, settlement, memory, and evolution rules as every other worker.

The market is moving through three waves:

```text
Wave 1: Models
Companies built and bought intelligence.

Wave 2: Agents
Companies built and bought autonomous workers.

Wave 3: Institutions
Companies deploy autonomous organizations made of many agents, humans, tools, budgets, permissions, proofs, and policies.
```

The hard problem in Wave 3 is not only intelligence.

It is organization.

When a company deploys 10 agents, the problem is coordination.
When a company deploys 1,000 agents, the problem is authority.
When a company deploys 100,000 agents, the problem is institutional governance.

Epoch defines the missing primitive:

```text
Institution
```

An institution is a versioned operating unit with mission, roles, authority, budgets, policies, capabilities, evidence duties, verifiers, settlement rules, memory, fitness metrics, and evolution rules.

## Category

Recommended public category:

```text
Autonomous Organization Infrastructure
```

Recommended product category:

```text
Institution Runtime
```

Recommended technical primitive:

```text
Institution
```

Recommended long-term positioning:

```text
AWS runs software.
Kubernetes runs containers.
Epoch runs institutions.
```

## One-Liners

Public one-liner:

```text
Epoch turns agents, humans, tools, and policies into governed autonomous organizations.
```

Investor one-liner:

```text
Epoch is the institution runtime for the autonomous enterprise.
```

Technical one-liner:

```text
Epoch compiles missions into versioned institutional genomes that execute, prove, settle, and evolve.
```

Enterprise buyer one-liner:

```text
Epoch lets teams deploy AI workforces with authority, verification, auditability, and continuous improvement.
```

Long-term vision one-liner:

```text
Epoch governs autonomous organizations composed of humans, AI agents, robots, software systems, and physical infrastructure.
```

## Why This Is Bigger Than Agent Infrastructure

Agent infrastructure companies are building services that individual agents need:

- identity;
- email;
- phone;
- wallet;
- browser;
- sandbox compute;
- MCP tools;
- APIs;
- CLIs;
- documentation;
- human marketplaces;
- tool marketplaces;
- authorization;
- observability.

Those are necessary.

They are not sufficient.

Individual agents need services. Autonomous organizations need institutions.

The ecosystem is building the agent-native equivalents of human infrastructure:

```text
Human internet:
identity
email
phone
wallet
browser
software
marketplaces
documentation
payments
support

Agent internet:
agent identity
agent inbox
agent phone
agent wallet
agent browser
MCP/API/CLI
machine-readable docs
agent marketplaces
agent payments
human escalation
```

Epoch sits above that layer.

It does not need to own every primitive below the agent. It needs to own the runtime that coordinates those primitives into safe organizational behavior.

## Strategic Stack

```text
Models
  produce reasoning and generation

Agents
  perform tasks and use tools

Teams
  coordinate multiple agents and humans

Institutions
  govern repeated consequential work

Autonomous Organizations
  coordinate many institutions over time

Companies
  become partially or fully autonomous operating systems

Industries
  exchange proof, reputation, trust, settlement, and institution templates
```

Epoch owns:

```text
Teams
-> Institutions
-> Autonomous Organizations
```

Epoch integrates with:

```text
Models
Agents
Agent identity
Agent communication
Agent wallets
MCP/API tools
Human marketplaces
Enterprise systems
Cloud infrastructure
```

Epoch expands toward:

```text
Company-level proof networks
Institution marketplaces
Verifier federations
Civilization-scale trust infrastructure
```

## Product Doctrine

Epoch should obey these rules:

1. Do not build another agent framework.
2. Do not present memory as the highest-level product.
3. Do not sell a generic enterprise operating system.
4. Do not make dashboards the center of the product.
5. Do not stop at observability.
6. Do not stop at orchestration.
7. Do not stop at verification.
8. Every important action should have authority, evidence, proof, settlement, and learning.
9. Every repeated mission should become an institution.
10. Every institution should become versioned, measurable, and evolvable.
11. New product surfaces must reuse the runtime. Prefer connector, trigger, view, or package over new architecture.
12. Compliance, collaboration, and self-maintenance should be exposed as mission-native workflows, not separate products.

The enduring loop is:

```text
Institution
-> Mission
-> Execution
-> Evidence
-> Verification
-> Settlement
-> Fitness
-> Mutation
-> Simulation
-> Selection
-> Next Institution Version
```

## Product Architecture

The complete Epoch platform has three major planes:

```text
1. Agent Services Plane
2. Institution Runtime Plane
3. Enterprise Reality Plane
```

### 1. Agent Services Plane

This is the layer agents use to exist in the world.

Epoch should integrate with this layer instead of trying to own all of it from day one.

Capabilities:

- agent identity;
- human identity;
- organization identity;
- email;
- phone;
- chat;
- browser;
- MCP tools;
- APIs;
- CLIs;
- sandbox compute;
- wallets;
- payments;
- human marketplaces;
- documentation;
- tool discovery;
- credential exchange.

Epoch relationship:

```text
Agent services give agents hands, eyes, voice, money, and access.
Epoch gives them organization.
```

### 2. Institution Runtime Plane

This is the heart of Epoch.

Capabilities:

- mission runtime;
- authority runtime;
- communication runtime;
- capability runtime;
- execution runtime;
- verification runtime;
- settlement runtime;
- evolution runtime;
- institution marketplace runtime.

Epoch relationship:

```text
The Institution Runtime turns individual agent actions into accountable organizational behavior.
```

### 3. Enterprise Reality Plane

This is how Epoch understands the company and its environment.

Capabilities:

- Company Brain;
- memory contracts;
- Reality Graph;
- Decision Graph;
- Institution Graph;
- Evidence Graph;
- Fitness Graph;
- source ingestion;
- runtime hooks;
- traceability;
- drift detection;
- continuity.

Epoch relationship:

```text
Enterprise Reality tells institutions what exists, what happened, why it happened, what changed, and what should be inherited.
```

## Layered Platform Plan

### Layer 1: Identity Runtime

Goal:

Give every actor and institution a runtime identity.

Objects:

```text
ActorIdentity
ActorType
HumanIdentity
AgentIdentity
TeamIdentity
OrganizationIdentity
InstitutionIdentity
RoleIdentity
ServiceIdentity
VerifierIdentity
```

Actor model:

```text
Actor
|- Human
|- AI Agent
|- Robot             [future]
|- IoT Device        [future]
|- Vehicle           [future]
`- Machine           [future]
```

`Actor` is the extensible execution principal. Organization, institution, team, and role identities remain governance and authority contexts around actors rather than physical worker types. The initial product implements humans, AI agents, services, and verifiers. It reserves the actor taxonomy and capability model for physical workers without building robotics integrations now.

Responsibilities:

- identify who or what is acting;
- bind an agent to a person, team, institution, or company;
- support delegated authority;
- track provenance of every action;
- support external agent identity providers;
- support human escalation identity;
- expose identity to audit, verification, and settlement.

Core questions:

```text
Who is acting?
For whom?
In what role?
Inside which institution?
Under which policy?
With which authority?
With which evidence duty?
```

Build:

- identity registry;
- agent registry;
- human registry;
- organization registry;
- institution registry;
- role binding store;
- external identity provider adapters;
- identity audit log.

### Layer 2: Communication Runtime

Goal:

Let agents, humans, tools, and institutions communicate through governed channels.

Communication is not just transport. It is institutional state.

Objects:

```text
CommunicationChannel
ConversationThread
MessageRecord
NegotiationRecord
EscalationRecord
InstructionRecord
DecisionMessage
EvidenceMessage
```

Channels:

- email;
- Slack;
- Teams;
- SMS;
- phone;
- webhooks;
- MCP;
- internal events;
- agent-to-agent RPC;
- human approval inbox;
- institution inbox.

Responsibilities:

- route messages by institution, mission, role, and policy;
- maintain transcripts as evidence;
- support agent-human negotiation;
- disclose agent identity where required;
- connect communication to decisions and missions;
- escalate to humans when authority is insufficient;
- record what was requested, accepted, denied, or changed.

Build:

- institution inbox;
- mission inbox;
- agent-human escalation queue;
- transcript store;
- message-to-evidence linker;
- negotiation protocol;
- communication policy engine.

### Layer 3: Capability And Authority Runtime

Goal:

Control what agents and institutions are allowed to do.

Objects:

```text
AuthorityChain
CapabilityLease
PolicyRule
BudgetLimit
PermissionGrant
ApprovalRequirement
RevocationRule
RiskBoundary
```

Responsibilities:

- grant scoped, time-bound capability leases;
- bind every tool call to mission authority;
- support parameter-level policy checks;
- enforce least privilege;
- revoke access when missions end;
- escalate actions above authority;
- record every allow, deny, and override decision.

Capability lease fields:

```text
lease_id
institution_id
mission_id
actor_id
role_id
capability
scope
parameters_allowed
parameters_blocked
budget_limit
time_window
risk_level
evidence_required
approver
revocation_rule
```

Build:

- policy engine;
- authorization gateway;
- capability lease service;
- scoped token issuer;
- tool-call guard;
- approval router;
- revocation service;
- audit trail.

### Layer 4: Mission Runtime

Goal:

Turn intent into governed executable work.

Objects:

```text
Mission
MissionContract
MissionPlan
MissionState
MissionRole
MissionBudget
MissionEvidenceDuty
MissionVerifier
MissionSettlementRule
```

Mission lifecycle:

```text
DRAFT
READY
ACTIVE
BLOCKED
PASS
FAIL
UNKNOWN
SETTLED
LEARNED
SUPERSEDED
TERMINATED
```

Mission contract:

```text
mission_id
goal
institution_id
owner
risk_level
success_criteria
allowed_actions
forbidden_actions
required_roles
required_tools
budget
deadline
authority_chain
evidence_duties
verification_contract
settlement_rule
learning_rule
termination_rule
```

Responsibilities:

- create mission candidates from user intent, incidents, alerts, decisions, or schedules;
- classify risk;
- generate execution plans;
- assign roles;
- request authority;
- track mission progress;
- detect drift;
- trigger verification;
- trigger settlement;
- produce learning artifacts.

Build:

- mission contract schema;
- mission state machine;
- mission planner;
- mission trigger registry;
- role assignment engine;
- mission timeline;
- mission activity feed;
- mission drift detector;
- mission API.

Mission triggers:

- user intent;
- incidents;
- alerts;
- schedules;
- source drift;
- dependency changes;
- policy changes;
- failed verifiers;
- API and SDK changes from Reality Fabric sources.

### Layer 5: Execution Runtime

Goal:

Coordinate multi-agent and human work safely.

Execution should not be:

```text
Agent
-> Tool
-> Result
```

Execution should be:

```text
Mission
-> Planner
-> Role Assignment
-> Workers
-> Reviewers
-> Verifier
-> Certificate
-> Settlement
```

Workers are polymorphic execution actors:

```text
Mission
-> Planner
-> Worker
   |- Human Worker
   |- AI Agent
   |- Robot                [future]
   `- Industrial Machine   [future]
-> Reviewer
-> Verifier
-> Certificate
-> Settlement
```

The runtime does not change for physical work. Each worker receives a role, bounded authority, capability lease, budget, evidence duty, telemetry contract, escalation path, and verifier contract. Only worker adapters and domain-specific safety policies change.

Execution roles:

- Mission Governor;
- Planner;
- Architect;
- Implementer;
- Operator;
- Researcher;
- Analyst;
- Test Engineer;
- Independent Verifier;
- Security Reviewer;
- Performance Reviewer;
- Finance Reviewer;
- Human Approver;
- Release Authority.

Objects:

```text
ExecutionPlan
ExecutionStep
ExecutionWorker
ExecutionRecord
ActionRequest
ActionResult
ReviewRecord
BlockerRecord
EscalationRecord
```

Responsibilities:

- schedule agent roles;
- coordinate human approvals;
- route work to tools and services;
- monitor action progress;
- enforce capability leases;
- recover from blocked execution;
- preserve complete traceability;
- produce evidence automatically.

Build:

- execution scheduler;
- worker runtime;
- action gateway;
- tool adapter layer;
- human approval queue;
- execution timeline;
- blocker handling;
- rollback planner.

### Layer 6: Verification Runtime

Goal:

Make consequential work provable.

Every mission should end in one of three states:

```text
PASS
FAIL
UNKNOWN
```

Objects:

```text
EvidenceRecord
EvidenceGraph
ProofContract
Verifier
VerifierRun
ProofResult
AssuranceCase
CorrectnessCertificate
RiskCertificate
```

Proof states:

```text
SUPPORTED
CONTRADICTED
MISSING
INVALID
UNKNOWN
```

Responsibilities:

- collect evidence during execution;
- run independent verification;
- compare claims to evidence;
- identify unresolved risks;
- produce certificates;
- make proof queryable;
- prevent unsupported claims from becoming settled truth.

Verification pipeline:

```text
Claim
-> Evidence Requirement
-> Evidence Collection
-> Independent Verification
-> Contradiction Search
-> Confidence Boundary
-> PASS / FAIL / UNKNOWN
-> Certificate
```

Build:

- evidence store;
- verifier registry;
- proof engine;
- contradiction detector;
- assurance case generator;
- certificate engine;
- proof API.

### Layer 7: Settlement Runtime

Goal:

Close the loop between work, outcome, money, accountability, and learning.

Objects:

```text
SettlementRule
SettlementResult
BudgetLedger
CostRecord
InvoiceRecord
PaymentInstruction
AuditRecord
OutcomeRecord
ROIRecord
```

Responsibilities:

- determine whether work is complete;
- confirm whether success criteria were met;
- attribute costs to missions and institutions;
- support payment and invoice flows;
- create audit records;
- record ROI and business impact;
- identify what should be learned or inherited.

Settlement pipeline:

```text
Mission Result
-> Proof Result
-> Cost Attribution
-> Outcome Confirmation
-> Budget Settlement
-> Audit Record
-> Learning Artifact
```

Build:

- budget ledger;
- mission cost attribution;
- settlement evaluator;
- invoice and payment adapter layer;
- audit exporter;
- ROI engine;
- learning handoff.

### Layer 8: Evolution Runtime

Goal:

Make institutions improve over time.

Old model:

```text
Failure
-> Patch
```

Epoch model:

```text
Institution
-> Execution
-> Outcome
-> Fitness
-> Mutation
-> Simulation
-> Selection
-> Next Institution Version
```

Objects:

```text
InstitutionalGenome
GenomeVersion
MutationProposal
FitnessScore
SimulationScenario
SimulationResult
SelectionDecision
InstitutionLineage
EvolutionRecord
```

Responsibilities:

- compare institution versions;
- detect recurring failures;
- detect high-fitness patterns;
- propose institutional mutations;
- simulate new policies or authority chains;
- compare rollout options;
- roll forward or roll back;
- preserve lineage.

Fitness measures:

- survival;
- reliability;
- resilience;
- adaptation speed;
- decision quality;
- verification quality;
- authority efficiency;
- cost efficiency;
- risk reduction;
- customer impact;
- engineering velocity;
- human attention saved;
- audit readiness.

Build:

- fitness model;
- pattern detector;
- mutation engine;
- simulation engine;
- counterfactual lab;
- selection engine;
- rollout planner;
- lineage tracker.

### Layer 9: Institution Marketplace

Goal:

Let companies install operating units, not plugins.

Marketplace objects:

```text
InstitutionPackage
InstitutionTemplate
GenomeTemplate
RoleTemplate
PolicyTemplate
VerifierTemplate
EvidenceContractTemplate
SimulationScenarioTemplate
FitnessHistory
IntegrationRequirement
RollbackRule
```

Example packages:

- Incident Institution;
- Release Institution;
- Security Review Institution;
- AI Deployment Institution;
- SOC 2 Evidence Institution;
- Support Triage Institution;
- Vendor Risk Institution;
- Finance Approval Institution;
- Hiring Institution;
- Data Governance Institution.

Installation pipeline:

```text
Select Package
-> Inspect Genome
-> Map Company Systems
-> Adapt Policies
-> Simulate
-> Approve
-> Activate
-> Run Missions
-> Measure Fitness
```

Build:

- private institution template registry;
- package manifest format;
- package installer;
- simulation before activation;
- package fitness history;
- package versioning;
- third-party verifier model;
- future public marketplace.

### Layer 10: Civilization Runtime

Goal:

Enable trusted institutions across companies, auditors, insurers, regulators, vendors, and supply chains.

This is north-star infrastructure, not an early dependency.

Objects:

```text
CrossCompanyProof
FederatedVerifier
OutcomeCredential
InstitutionReputation
VerifierReputation
ProofExchange
CompatibilityContract
RealityExchangeRecord
```

Responsibilities:

- exchange proof across companies;
- support privacy-preserving credentials;
- federate verifiers;
- track institution reputation;
- track verifier reputation;
- support auditor and insurer access;
- define proof standards for industries.

Future chain:

```text
Company
-> Institution
-> Proof
-> Federated Verification
-> Auditor
-> Insurer
-> Regulator
-> Industry Trust Network
```

## Core Product Surfaces

Epoch should not feel like a static dashboard.

It should feel like an active operational runtime.

### 1. Institution Console

Purpose:

Show all active institutions in the company.

Views:

- active institutions;
- institution health;
- mission load;
- authority usage;
- budget usage;
- proof status;
- risk status;
- pending approvals;
- recent mutations;
- fitness trend.

Primary actions:

- create institution;
- inspect genome;
- launch mission;
- pause institution;
- revoke capability;
- run simulation;
- approve mutation;
- view proof.

### 2. Mission Control

Purpose:

Track consequential work from intent to settlement.

Views:

- mission timeline;
- assigned roles;
- execution plan;
- current blockers;
- evidence collected;
- proof result;
- budget status;
- human approvals;
- settlement status;
- learning artifacts.

Primary actions:

- approve mission;
- adjust scope;
- grant capability;
- escalate to human;
- request verification;
- settle mission;
- convert mission into institution template.

### 3. Mission Rooms

Purpose:

Expose multiplayer AI work as a live workspace on top of Mission Runtime.

Mission Rooms are not a new backend product. They are a collaboration UI over:

```text
Mission
-> Planner
-> Workers
-> Reviewer
-> Verifier
-> Evidence
-> Certificate
-> Audit
-> Settlement
```

Room participants:

- Engineer;
- Designer;
- PM;
- CEO;
- Coding Agent;
- Security Agent;
- Research Agent;
- QA Agent;
- Reviewer;
- Verifier.

Views:

- live mission timeline;
- human and agent presence;
- active plan;
- assigned roles;
- current worker activity;
- authority requests;
- evidence stream;
- review stream;
- verifier status;
- PASS / FAIL / UNKNOWN result;
- replayable execution trace.

Primary actions:

- join mission;
- watch agents;
- interrupt agent;
- assign human;
- grant capability;
- approve action;
- reject action;
- request review;
- request verification;
- replay mission.

Product name:

```text
Mission Workspace
```

Implementation rule:

```text
Mission Rooms = Mission Runtime + Execution Timeline + Authority Queue + Evidence Graph + Verification Runtime + Presence UI
```

No backend runtime changes are required beyond collaboration events, room presence, and timeline subscriptions.

### 4. Authority Center

Purpose:

Control what agents and institutions can do.

Views:

- active capability leases;
- denied actions;
- pending approval requests;
- high-risk permissions;
- budget limits;
- policy violations;
- role assignments;
- revocation timeline.

Primary actions:

- grant lease;
- deny lease;
- revoke access;
- edit policy;
- approve override;
- inspect audit trail.

### 5. Proof Center

Purpose:

Make evidence, verification, and certificates visible.

Views:

- evidence graph;
- assurance cases;
- verifier runs;
- PASS / FAIL / UNKNOWN results;
- unresolved risks;
- correctness certificates;
- fitness certificates;
- audit exports.

Primary actions:

- run verifier;
- challenge claim;
- attach evidence;
- export certificate;
- compare proof across mission versions.

### 6. Evolution Lab

Purpose:

Test institutional mutations before production.

Views:

- institution genome;
- version history;
- mutation proposals;
- simulation scenarios;
- fitness comparison;
- rollout recommendation;
- rollback trigger.

Primary actions:

- propose mutation;
- simulate mutation;
- compare versions;
- approve rollout;
- rollback institution;
- publish template.

### 7. Institution Marketplace

Purpose:

Install reusable operating units.

Views:

- private templates;
- recommended institutions;
- package manifest;
- integration requirements;
- verifier requirements;
- fitness history;
- simulation preview.

Primary actions:

- install institution;
- adapt package;
- simulate installation;
- activate package;
- publish internal template;
- later publish public package.

### 8. Company Brain And Reality Fabric

Purpose:

Provide the truth substrate for all runtime decisions.

Views:

- memory contracts;
- source ingestion;
- Reality Graph;
- Decision Graph;
- Institution Graph;
- Evidence Graph;
- drift detection;
- continuity timeline.

Primary actions:

- connect source;
- inspect memory;
- approve memory contract;
- link memory to mission;
- trace decision;
- identify missing evidence.

## Reality Fabric

The old Company Brain becomes part of a larger Reality Fabric.

```text
Reality Fabric
= Reality Graph
+ Decision Graph
+ Institution Graph
+ Evidence Graph
+ Fitness Graph
```

### Reality Graph

Stores what exists and what is happening.

Examples:

- services;
- repos;
- deployments;
- alerts;
- incidents;
- customers;
- tickets;
- contracts;
- infrastructure;
- telemetry;
- documents;
- policies;
- workflows;
- vendors;
- teams.

Future physical-world entities:

- buildings;
- warehouses;
- machines;
- robots;
- trucks and other vehicles;
- sensors;
- cameras;
- production lines;
- inventory.

These entities extend the same Reality Graph rather than creating a separate physical-world product. Physical state must enter through typed connectors with provenance, timestamps, confidence, and safety boundaries.

### API Watcher

API Watcher is a Reality Fabric source pattern, not a standalone product.

Goal:

Keep company software aligned with changing external and internal APIs, SDKs, and packages.

Source path:

```text
GitHub
-> SDK changelog
-> OpenAPI
-> NPM package
-> Company Brain
```

Runtime path:

```text
API Change
-> Reality Fabric
-> Impact Analysis
-> Mission Created
-> Authority Check
-> Planner
-> Coding Agent
-> Reviewer
-> Verifier
-> PR
-> Merge
-> Evidence
-> Certificate
-> Audit
-> Settlement
```

Objects reused:

- source connector;
- RealityEntity;
- RealityEvent;
- Decision Graph;
- Evidence Graph;
- MissionContract;
- AuthorityChain;
- CapabilityLease;
- ExecutionPlan;
- VerifierRun;
- Certificate;
- AuditRecord;
- SettlementResult.

Build:

- GitHub source connector for release notes, changelogs, specs, tags, and dependency files;
- OpenAPI diff adapter;
- SDK changelog parser;
- npm package version monitor;
- dependency-to-repo relationship mapper;
- impact analysis view over Reality Graph and Company Brain;
- mission trigger for actionable breaking changes;
- verifier contract for API compatibility;
- PR evidence capture.

Mission trigger rule:

```text
If a watched API, SDK, OpenAPI spec, or npm package changes and impact analysis finds affected code,
create a governed mission instead of sending a passive alert.
```

Non-goal:

```text
Do not build a separate API maintenance product. API Watcher is only a connector plus mission trigger inside Reality Fabric.
```

### Decision Graph

Stores what was decided and why.

```text
Decision
-> Reason
-> Evidence
-> Alternatives
-> Approval
-> Execution
-> Outcome
-> ROI
-> Learning
```

### Institution Graph

Stores who or what is allowed to act.

```text
Institution
-> Mission
-> Role
-> Agent
-> Human
-> Capability Lease
-> Budget
-> Policy
-> Evidence Duty
-> Verifier
-> Termination Rule
```

### Evidence Graph

Stores what proves or contradicts claims.

```text
Claim
-> Evidence Requirement
-> Evidence Record
-> Source
-> Verifier
-> Proof Result
-> Certificate
```

### Fitness Graph

Stores whether institutions are improving.

```text
Institution Version
-> Mission Outcomes
-> Resource Delta
-> Fitness Score
-> Mutation Proposal
-> Simulation Result
-> Selection Decision
```

## Institutional Genome

An Institutional Genome is the versioned specification of how an institution behaves.

```text
InstitutionalGenome
|-- identity
|-- mission
|-- scope
|-- roles
|-- authority
|-- policies
|-- budgets
|-- capabilities
|-- constraints
|-- communication channels
|-- evidence duties
|-- verification contracts
|-- settlement rules
|-- memory bindings
|-- fitness metrics
|-- mutation rules
|-- simulation scenarios
|-- termination rules
|-- inheritance rules
```

Genome operations:

- create;
- clone;
- adapt;
- diff;
- simulate;
- mutate;
- select;
- activate;
- pause;
- roll back;
- terminate;
- publish;
- inherit.

Genome versioning should feel like Git for institutions.

## Company DNA

Company DNA is the durable inheritance layer above memory.

Memory records what happened.

DNA defines what the company preserves, repeats, avoids, and evolves toward.

```text
Principles
-> Policies
-> Institutions
-> Behaviors
-> Evidence
-> Outcomes
-> Evolution History
```

Objects:

```text
CompanyPrinciple
PolicyGene
InstitutionTemplate
BehaviorPattern
EvidenceLineage
EvolutionHistory
FitnessRecord
```

Questions Epoch should answer:

- What principles does this company preserve?
- Which policies express those principles?
- Which institutions enforce those policies?
- Which behaviors appeared in reality?
- Which outcomes proved or contradicted those behaviors?
- Which institution versions should future work inherit?
- Which patterns should be forbidden?
- Which verifiers should be added?

## Packaged Mission Workspaces

Epoch should package existing runtime loops as concrete workspaces without creating separate products.

### AI Compliance Workspace

AI Compliance already exists in the platform primitives:

```text
Evidence Graph
-> Verification Runtime
-> Certificates
-> Audit
-> Settlement
```

Packaging:

```text
Compliance Mission
-> Evidence Duties
-> Independent Verifiers
-> Correctness Certificate
-> Risk Certificate
-> Audit Export
-> Settlement Record
```

Use cases:

- model deployment review;
- security control evidence;
- vendor and API change assurance;
- regulated workflow approval;
- release proof;
- incident remediation proof;
- customer-facing assurance packet.

Product rule:

```text
Do not build an AI compliance product beside Epoch. Package compliance as mission templates, verifier contracts, certificates, and audit exports.
```

### Multiplayer AI Workspace

Multiplayer AI is also an exposure of the Mission Runtime.

Current runtime:

```text
Mission
-> Planner
-> Workers
-> Reviewer
-> Verifier
```

Workspace experience:

```text
Live Mission Room
Engineer
Designer
PM
CEO
-> Coding Agent
-> Security Agent
-> Research Agent
-> QA Agent
-> Mission Runtime
-> Verified Execution
```

Named product surface:

```text
Mission Workspace
```

Feature set:

- Mission Rooms;
- live timeline;
- join mission;
- watch agents;
- interrupt agent;
- assign human;
- approve;
- reject;
- replay mission.

Backend rule:

```text
Nothing changes in the core backend. Add UI, collaboration events, presence, and subscriptions over existing missions.
```

## Full Engineering Build Plan

This is the full platform build plan. It intentionally does not compress into an MVP. The MVP plan should be derived later by selecting the smallest paid wedge that builds the same primitives.

### Phase 1: MemoryOS Foundation

Goal:

Establish the truth and continuity substrate.

Build:

- Company Brain ingestion;
- memory contract engine;
- source connectors;
- GitHub source connector;
- changelog, OpenAPI, and package metadata ingestion;
- runtime hooks;
- before-model context;
- after-model outcome capture;
- trace proof;
- continuity timeline;
- source-to-memory lineage;
- governance pass rate;
- drift detection;
- next-action suggestions.

Primary modules:

```text
lib/memory
server/routes/memory.routes.ts
packages/sdk
packages/mcp-server
memoryos-frontend/components/mission-control
```

Outcome:

```text
Epoch knows what happened, why it matters, what agents used, and what changed.
```

### Phase 2: Mission Runtime

Goal:

Make every consequential action a mission.

Build:

- mission contract schema;
- mission state machine;
- mission planner;
- mission trigger registry;
- source-change mission trigger;
- mission timeline;
- evidence duty schema;
- PASS / FAIL / UNKNOWN decision engine;
- mission API;
- mission console;
- basic settlement state.

Services:

```text
services/mission-runtime
services/evidence
services/proof
```

Outcome:

```text
Intent becomes governed executable work.
```

### Phase 3: Identity And Authority Runtime

Goal:

Make every action attributable, scoped, revocable, and auditable.

Build:

- agent registry;
- human registry;
- institution identity;
- role bindings;
- capability lease schema;
- authority chain schema;
- policy engine;
- scoped token issuer;
- action gateway;
- approval router;
- revocation service;
- authority console.

Services:

```text
services/identity
services/authority
services/capability-lease
services/action-gateway
```

Outcome:

```text
Agents can act only under declared institutional authority.
```

### Phase 4: Verified Execution Runtime

Goal:

Coordinate multiple agents and humans through role-based execution.

Build:

- planner role;
- worker role;
- reviewer role;
- verifier role;
- execution scheduler;
- action request lifecycle;
- tool adapter layer;
- human escalation queue;
- execution timeline;
- live mission room event stream;
- blocker handling;
- rollback plan;
- verified execution report.

Services:

```text
services/execution-runtime
services/tool-adapters
services/human-escalation
```

Outcome:

```text
Autonomous work becomes coordinated, reviewable, and recoverable.
```

### Phase 5: Verification Runtime

Goal:

Make proof a first-class platform primitive.

Build:

- evidence store;
- evidence graph;
- verifier registry;
- verifier run lifecycle;
- proof contracts;
- contradiction search;
- assurance case generator;
- correctness certificate;
- risk certificate;
- audit export.

Services:

```text
services/evidence
services/proof
services/verification
services/certificates
```

Outcome:

```text
Epoch can say what is supported, contradicted, missing, invalid, or unknown.
```

### Phase 6: Institution Runtime

Goal:

Turn repeated missions into versioned institutions.

Build:

- institution schema;
- institutional genome schema;
- institution graph;
- role templates;
- policy templates;
- budget templates;
- evidence contract templates;
- verifier contract templates;
- institution lifecycle;
- institution console;
- genome diff;
- genome versioning;
- institution activation and termination.

Services:

```text
services/institution-runtime
services/genome
services/institution-graph
```

Outcome:

```text
The institution becomes the core product primitive.
```

### Phase 7: Reality Fabric

Goal:

Unify company state, decisions, institutions, evidence, and fitness.

Build:

- Reality Graph;
- Decision Graph;
- Institution Graph;
- Evidence Graph;
- Fitness Graph;
- API Watcher source pattern;
- OpenAPI diff adapter;
- SDK changelog parser;
- npm package version monitor;
- dependency impact analysis;
- entity resolution;
- relationship discovery;
- workflow discovery;
- policy discovery;
- source lineage;
- graph query API.

Services:

```text
services/reality-graph
services/decision-graph
services/institution-graph
services/evidence-graph
services/fitness-graph
services/ontology
```

Outcome:

```text
Epoch understands the company as an operating reality, not a collection of documents.
```

### Phase 8: Settlement Runtime

Goal:

Close missions with cost, value, accountability, and audit.

Build:

- budget ledger;
- cost attribution;
- settlement rules;
- outcome confirmation;
- invoice records;
- payment instruction adapters;
- ROI records;
- audit records;
- settlement console;
- finance and compliance exports.

Services:

```text
services/settlement
services/budget-ledger
services/audit
services/roi
```

Outcome:

```text
Autonomous work becomes economically accountable.
```

### Phase 9: Evolution Runtime

Goal:

Make institutions self-improving.

Build:

- fitness model;
- institutional physics model;
- pattern detector;
- mutation engine;
- simulation engine;
- counterfactual lab;
- selection engine;
- rollout planner;
- rollback planner;
- institution lineage;
- fitness certificate;
- Evolution Lab UI.

Services:

```text
services/evolution
services/institutional-physics
services/simulation
services/evolution-lab
```

Outcome:

```text
Epoch can propose, test, select, and inherit better institutional designs.
```

### Phase 10: Private Institution Marketplace

Goal:

Create installable operating units from proven internal and customer institutions.

Build:

- private template registry;
- InstitutionPackage manifest;
- package installer;
- package simulator;
- package fitness history;
- package versioning;
- internal publishing;
- installation audit;
- package rollback.

Services:

```text
services/institution-marketplace
services/package-registry
services/package-installer
```

Outcome:

```text
Companies can install institutions instead of manually designing every operating unit.
```

### Phase 11: Public Marketplace And Partner Ecosystem

Goal:

Enable trusted third parties to publish institutions, verifiers, and adapters.

Build:

- publisher accounts;
- verifier certification;
- package review;
- package reputation;
- usage reporting;
- revenue share;
- security scanning;
- compatibility checks;
- partner portal.

Outcome:

```text
Epoch becomes the distribution layer for autonomous institutional capability.
```

### Phase 12: Civilization Runtime

Goal:

Enable cross-company proof, institutional reputation, and federated verification.

Build:

- cross-company proof exchange;
- privacy-preserving outcome credentials;
- verifier federation;
- institution reputation;
- verifier reputation;
- auditor access;
- insurer access;
- regulator export;
- industry proof formats.

Services:

```text
services/civilization-runtime
services/proof-exchange
services/federated-verification
services/reputation
services/reality-exchange
```

Outcome:

```text
Trust moves between companies through proof, not screenshots, meetings, or manual audits.
```

## Future Vertical: Physical Operations Runtime

Physical operations are a future vertical built on the Institution Runtime, not a change to Epoch's category or a new core product.

Potential institution packages:

- Warehouse Institution;
- Inspection Institution;
- Maintenance Institution;
- Construction Institution;
- Delivery Institution;
- Manufacturing Institution.

Reference mission:

```text
Inspect Turbine
-> Planner creates a governed inspection plan
-> Robot performs the scan under a bounded capability lease
-> Sensor and camera evidence enter the Reality Graph
-> Human reviews the detected anomaly
-> AI agent produces the inspection report
-> Independent verifier checks safety and compliance evidence
-> Mission settles
-> Institution learns and proposes its next version
```

The reusable platform primitives remain unchanged:

```text
Institution Runtime
+ Mission Runtime
+ Identity And Authority Runtime
+ Execution Runtime
+ Verification Runtime
+ Settlement Runtime
+ Evolution Runtime
+ Reality Fabric
```

Only the following domain edges expand:

- actor and worker types;
- hardware, telemetry, and control connectors;
- physical Reality Graph entities;
- safety, compliance, and human-override policies;
- domain-specific institution packages and verifiers.

Sequencing rule:

```text
Do not build robot, vehicle, industrial-control, or physical-device integrations during the current software and enterprise adoption phases. Preserve extensible schemas now. Enter physical operations only after the software Institution Runtime has strong adoption, repeatable proof, and a design partner with a bounded, safety-reviewable use case.
```

## Product Packaging

Do not lead with the whole platform in sales.

The product architecture can be huge. The packaging should be legible.

Long-term product line:

```text
Epoch Mission Runtime
Epoch Authority Runtime
Epoch Verified Execution
Epoch Institution Runtime
Epoch Evolution Lab
Epoch Institution Marketplace
Epoch Proof Network
```

Enterprise bundle:

```text
Epoch Autonomous Organization Platform
```

Developer bundle:

```text
Epoch Runtime SDK
Epoch MCP Server
Epoch Action Gateway
Epoch Verifier SDK
Epoch Institution Package SDK
```

Services-assisted entry:

```text
Epoch Institution Design Sprint
Epoch Verified Execution Sprint
Epoch AI Workforce Governance Sprint
Epoch Autonomous Engineering Sprint
```

Every service output must become product capability:

```text
customer mission
-> mission template
-> institution template
-> verifier contract
-> package candidate
-> marketplace asset
```

## Integration Strategy

Epoch should integrate with agent-native infrastructure instead of replacing all of it.

### Agent Identity Partners

Use for:

- agent authentication;
- agent passports;
- agent verification;
- external trust assertions.

Epoch adds:

- institutional role binding;
- authority chains;
- capability leases;
- audit lineage.

### Agent Communication Partners

Use for:

- email;
- phone;
- SMS;
- chat;
- agent inboxes.

Epoch adds:

- mission context;
- evidence capture;
- policy enforcement;
- negotiation records;
- escalation rules.

### Agent Cloud Partners

Use for:

- sandbox execution;
- browser VMs;
- MCP hosting;
- serverless agent compute;
- model routing.

Epoch adds:

- mission scheduling;
- institutional authorization;
- proof requirements;
- settlement.

### Enterprise Systems

Integrate with:

- GitHub;
- Slack;
- Jira;
- Linear;
- Notion;
- Google Workspace;
- Microsoft 365;
- AWS;
- Kubernetes;
- Datadog;
- Sentry;
- Prometheus;
- Snowflake;
- Salesforce;
- Zendesk;
- ERP systems.

Epoch adds:

- Reality Fabric;
- Decision Graph;
- Institution Graph;
- verified execution;
- fitness and learning.

## Competitive Positioning

### Versus Agent Frameworks

They help build agents.

Epoch governs organizations of agents.

### Versus Agent Infrastructure

They give agents identity, communication, compute, and tools.

Epoch gives agents institutional authority, coordination, proof, settlement, and evolution.

### Versus Workflow Automation

Workflow tools automate steps.

Epoch creates versioned institutions that decide, execute, prove, settle, and evolve.

### Versus Observability

Observability tells you what happened.

Epoch decides what institution should act, what evidence is required, and whether the action worked.

### Versus Evals

Evals test model behavior.

Epoch verifies organizational outcomes.

### Versus Memory Platforms

Memory platforms remember context.

Epoch turns memory into institutional inheritance.

### Versus Enterprise Operating Systems

Enterprise operating systems organize human workflows.

Epoch runs autonomous institutions made of agents, humans, tools, policies, budgets, and verifiers.

## Moats

### 1. Institutional Genome Data

Epoch learns which institution designs work across real companies.

### 2. Proof And Outcome Graph

Epoch accumulates evidence of what actions actually produced verified results.

### 3. Fitness History

Epoch can compare institution versions by measured operational fitness.

### 4. Verifier Network

Epoch becomes more trusted as more verifiers, certificates, and assurance cases flow through it.

### 5. Marketplace Distribution

Epoch packages proven institutions into installable operating units.

### 6. Switching Cost

Once a company runs missions, authority, proof, settlement, and evolution through Epoch, it becomes the organizational runtime.

### 7. Cross-Company Trust

Long-term proof exchange and institutional reputation create network effects.

## Risks

### Risk 1: Too Abstract

Mitigation:

Always connect the institution primitive to concrete missions, proof, and operational outcomes.

### Risk 2: Looks Like Consulting

Mitigation:

Every customer engagement must produce reusable schemas, templates, verifiers, and packages.

### Risk 3: Competes With Too Many Agent Infra Startups

Mitigation:

Integrate below. Own the institution layer above.

### Risk 4: Verification Is Hard

Mitigation:

Use bounded proof. PASS, FAIL, UNKNOWN is stronger than pretending certainty.

### Risk 5: Marketplace Too Early

Mitigation:

Start with private institution templates. Public marketplace only after repeated proof.

### Risk 6: Enterprise Sales Complexity

Mitigation:

Package as verified execution and AI workforce governance first, while building the deeper runtime underneath.

### Risk 7: UI Becomes Static Dashboard

Mitigation:

Make the console operational: active missions, live execution state, proofs, approvals, leases, timelines, and simulations.

### Risk 8: Physical Runtime Dilutes The Initial Market

Mitigation:

Treat robotics and physical operations as a future vertical. Keep current engineering, product, and GTM milestones focused on software organizations and enterprise systems. Make core schemas actor-extensible, but require explicit roadmap approval and a qualified design partner before adding physical connectors or robot-control features.

## Canonical Objects

```text
RealityEntity
RealityEvent
APIWatcherSource
APIChangeEvent
APISpecDiff
SDKChangelogEntry
PackageVersionChange
ImpactAnalysis
MemoryContract
Decision
DecisionAlternative
DecisionEvidence
ActorIdentity
ActorType
HumanIdentity
AgentIdentity
OrganizationIdentity
InstitutionIdentity
Institution
InstitutionTemplate
InstitutionalGenome
GenomeVersion
CompanyDNA
Role
AuthorityChain
CapabilityLease
Policy
Budget
Mission
MissionContract
MissionTrigger
MissionRoom
MissionRoomEvent
ExecutionPlan
ExecutionRecord
ActionRequest
ActionResult
CommunicationRecord
EvidenceRecord
Verifier
VerifierRun
ProofContract
ProofResult
AssuranceCase
CorrectnessCertificate
RiskCertificate
FitnessCertificate
SettlementRule
SettlementResult
OutcomeRecord
LearningArtifact
MutationProposal
SimulationScenario
SimulationResult
SelectionDecision
InstitutionLineage
InstitutionPackage
CrossCompanyProof
OutcomeCredential
VerifierReputation
InstitutionReputation
```

## Canonical States

Mission:

```text
DRAFT
READY
ACTIVE
BLOCKED
PASS
FAIL
UNKNOWN
SETTLED
LEARNED
SUPERSEDED
TERMINATED
```

Decision:

```text
PROPOSED
RANKED
APPROVED
REJECTED
EXECUTED
SETTLED
SUPERSEDED
```

Proof:

```text
SUPPORTED
CONTRADICTED
MISSING
INVALID
UNKNOWN
```

Settlement:

```text
PENDING
CONFIRMED
CONTRADICTED
INCONCLUSIVE
EXPIRED
```

Institution:

```text
DRAFT
SIMULATING
READY
ACTIVE
PAUSED
DEGRADED
TERMINATING
TERMINATED
SUPERSEDED
```

Genome:

```text
DRAFT
PROPOSED
SIMULATED
APPROVED
ACTIVE
ROLLED_BACK
ARCHIVED
```

## API Surface

Future public API groups:

```text
/api/identity
/api/agents
/api/institutions
/api/genomes
/api/missions
/api/authority
/api/capability-leases
/api/actions
/api/execution
/api/evidence
/api/proof
/api/verifiers
/api/certificates
/api/settlement
/api/fitness
/api/evolution
/api/simulation
/api/packages
/api/marketplace
/api/reality
/api/decisions
/api/memory
/api/api-watcher
/api/mission-rooms
```

SDK surface:

```text
epoch.identity.registerAgent()
epoch.institutions.create()
epoch.genomes.diff()
epoch.missions.create()
epoch.missions.start()
epoch.missions.watchRoom()
epoch.missions.interruptAgent()
epoch.authority.requestLease()
epoch.actions.request()
epoch.evidence.record()
epoch.proof.verify()
epoch.certificates.issue()
epoch.settlement.settle()
epoch.evolution.proposeMutation()
epoch.simulation.run()
epoch.packages.install()
epoch.apiWatcher.watch()
epoch.apiWatcher.analyzeImpact()
```

MCP tools:

```text
epoch_create_mission
epoch_create_mission_from_source_change
epoch_join_mission_room
epoch_interrupt_agent
epoch_request_capability
epoch_record_evidence
epoch_run_verifier
epoch_get_proof
epoch_settle_mission
epoch_create_institution
epoch_diff_genome
epoch_simulate_mutation
epoch_install_institution
```

## Console Navigation

Recommended console groups:

```text
Intelligence
  Company Brain
  Reality Fabric
  Decision Graph
  API Watcher

Runtime
  Missions
  Mission Workspace
  Institutions
  Execution
  Authority
  Proof
  Settlement

Evolution
  Evolution Lab
  Fitness
  Genome Lineage
  Institution Templates

Developer
  SDK
  MCP
  API Keys
  Webhooks
  API Watcher
  Verifiers
  Tool Adapters

Organization
  Agents
  Humans
  Roles
  Policies
  Budgets
  Audit
```

The UI should make live state obvious:

- active missions;
- active leases;
- blocked actions;
- proof status;
- pending approvals;
- verifier runs;
- settlement status;
- mutation proposals;
- fitness changes.

## Operating Model

Epoch itself should operate like the product it sells.

Internal company loop:

```text
Goal
-> Mission
-> Institution
-> Execution
-> Proof
-> Settlement
-> Learning
-> Mutation
```

Every internal product push should produce:

- mission contract;
- authority boundary;
- evidence required;
- verifier result;
- settlement note;
- learning artifact;
- possible institution update.

## GTM Direction

Even though this plan is not the MVP plan, the full platform should be sold through concrete wedges.

Possible wedges:

1. Verified Agent Execution.
2. AI Workforce Governance.
3. Autonomous Engineering Runtime.
4. AI Infrastructure Assurance.
5. Incident Institution.
6. Release Institution.
7. Security Review Institution.
8. Compliance Evidence Institution.

The first paid use case should always create reusable primitives:

```text
paid mission
-> mission contract
-> evidence contract
-> verifier
-> institution template
-> genome
-> package candidate
```

## Final Doctrine

Epoch should answer:

- What is true?
- What happened?
- Why did it happen?
- Who or what is allowed to act?
- Under which institution?
- Under which authority?
- With what budget?
- With what evidence duty?
- Which humans must approve?
- Which verifiers must confirm?
- Did the action work?
- What did reality confirm?
- What did it cost?
- What should be settled?
- What should be learned?
- Which institution version should future work inherit?
- Which mutation should be simulated next?

The final category is not memory.

The final category is not agents.

The final category is not workflow automation.

The final category is:

```text
Autonomous Organization Infrastructure
```

The final product primitive is:

```text
Institution
```

The final company promise is:

```text
Epoch runs the organizations that agents become.
```
