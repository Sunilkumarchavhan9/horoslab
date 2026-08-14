# Epoch Master Plan v10

## Core Thesis

Epoch is Institutional Intelligence Infrastructure.

It does not merely help companies use AI. It helps companies become autonomous institutions.

The missing primitive in enterprise software is the institution itself. Companies already have data, software, employees, workflows, and AI. They do not have a programmable, versioned, verifiable runtime for mission, authority, budget, policy, verification, memory, learning, and termination.

Epoch defines that primitive.

The complete system loop is:

```text
Institution
-> Execution
-> Outcome
-> Fitness
-> Mutation
-> Simulation
-> Selection
-> Next Generation Institution
```

The first commercial product remains narrow:

> Epoch Verified Agent Execution: bring one consequential AI or infrastructure change, leave with proof.

The long-term company is larger:

> A platform for designing, operating, verifying, and evolving autonomous institutions.

---

# Part 1 - Product Positioning

## Public Category

Institutional intelligence infrastructure.

## Public One-Liner

Epoch turns business processes into governed, verifiable, self-improving institutions.

## Investor One-Liner

Epoch is the institution and evolution runtime for autonomous enterprises.

## Technical One-Liner

Epoch compiles missions into versioned institutional genomes that execute, prove, settle, and evolve.

## What Epoch Is Not

- not just memory;
- not just a vector database;
- not just an eval platform;
- not just observability;
- not just agent orchestration;
- not just GPU optimization;
- not a generic company brain;
- not an enterprise operating system;
- not an ontology platform.

## What Epoch Is

Epoch is the programmable institution layer between intelligence and consequential reality.

It owns the full chain:

```text
Mission
-> Authority
-> Institution
-> Execution
-> Evidence
-> Verification
-> Settlement
-> Evolution
```

---

# Part 2 - Platform Architecture

## New Core Architecture

```text
Reality Graph
-> Institution Runtime
-> Evolution Runtime
-> Institution Compiler
-> Execution Runtime
-> Proof Runtime
-> Settlement Runtime
-> Genome Runtime
-> Civilization Runtime
```

## The Institution Primitive

An institution is not an agent, workflow, pipeline, or dashboard.

An institution is a versioned operating unit with:

- mission;
- authority;
- roles;
- budget;
- capabilities;
- constraints;
- policies;
- evidence duties;
- tests;
- verification contracts;
- memory;
- fitness metrics;
- inheritance;
- termination.

Every consequential business process should become an institution.

## Reality Fabric

The old "Company Reality Graph" becomes the larger Reality Fabric.

Reality Fabric is:

```text
Reality Graph
+ Decision Graph
+ Institution Graph
= Reality Fabric
```

## Reality Graph

Stores what exists and what is happening.

Examples:

- services;
- repos;
- incidents;
- deployments;
- alerts;
- customers;
- infrastructure;
- telemetry;
- business entities;
- workflows;
- policies.

## Decision Graph

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

## Institution Graph

Stores who or what is allowed to act.

```text
Institution
-> Role
-> Agent
-> Human
-> Permission
-> Capability Lease
-> Budget
-> Evidence Duty
-> Termination Rule
```

---

# Part 3 - Institution Runtime

## Purpose

The Institution Runtime is the heart of the company.

It sits between the Reality Fabric, the Evolution Runtime, and the Institution Compiler.

Its job is to continuously create, operate, verify, terminate, and evolve institutions.

Decision intelligence remains inside this runtime, but decisions are not the final primitive. Decisions become inputs to institutions.

## Responsibilities

- detect important situations;
- explain why something happened;
- generate hypotheses;
- rank possible causes;
- generate decision options;
- compare alternatives;
- estimate risk, cost, and impact;
- create mission candidates;
- create institution candidates;
- create authority chains;
- create constitutional rules;
- create capability leases;
- create verification contracts;
- create learning contracts;
- define evidence requirements;
- hand approved missions to the Institution Compiler.

## Output

The runtime should produce:

- root-cause analysis;
- decision recommendations;
- mission candidates;
- institution candidates;
- institution genomes;
- authority chains;
- verification contracts;
- learning contracts;
- expected outcome;
- risk boundary;
- evidence requirement;
- settlement criteria.

---

# Part 4 - Module 1: Automated Root Cause Intelligence

## Goal

Do not merely collect logs.

Continuously explain why something happened.

## Input Sources

- Kubernetes;
- AWS;
- GitHub;
- CI/CD;
- Prometheus;
- OpenTelemetry;
- Sentry;
- Datadog;
- CloudWatch;
- internal pipelines;
- telemetry.

## Pipeline

```text
Telemetry
-> Normalize
-> Dependency Graph
-> Incident Timeline
-> Hypothesis Generator
-> Evidence Search
-> Root Cause Ranking
-> Verified Cause
-> Mission
```

## Engineering Ownership

`services/root-cause/`

Packages:

- `graph-builder/`
- `dependency-resolver/`
- `incident-timeline/`
- `causal-engine/`
- `hypothesis-engine/`
- `verification-engine/`
- `ranking-engine/`

## Output

Not an alert.

A mission:

> "This is the likely root cause, here is the evidence, here are alternatives, here is confidence, and here is the mission to fix or verify it."

---

# Part 5 - Module 2: Enterprise Reasoning Infrastructure

## Goal

Continuously build an enterprise ontology that explains how the company works.

## Input Systems

- ERP;
- CRM;
- Slack;
- Jira;
- GitHub;
- AWS;
- SAP;
- Snowflake;
- support tools;
- internal databases;
- documents;
- workflows.

## Pipeline

```text
Enterprise Sources
-> Entity Resolution
-> Relationship Discovery
-> Workflow Discovery
-> Policy Discovery
-> Knowledge Fusion
-> Reasoning Engine
-> Decision Graph
```

## Engineering Ownership

`services/ontology/`

Packages:

- `entity-resolution/`
- `relationship-engine/`
- `workflow-miner/`
- `policy-miner/`
- `knowledge-fusion/`
- `reasoning-engine/`

## Strategic Difference

Competitors may stop at ontology and reasoning.

Epoch continues into:

```text
Decision
-> Institution
-> Execution
-> Proof
-> Settlement
-> Learning
```

That is the moat.

---

# Part 6 - Module 3: Decision Graph

## Goal

Make every important business and engineering decision queryable.

## Stores

- decision;
- reason;
- evidence;
- alternatives;
- approval;
- execution;
- outcome;
- ROI;
- learning.

## Example Questions

- Why did we make this change?
- Who approved it?
- What evidence supported it?
- What alternatives were rejected?
- Did the outcome match the claim?
- What did we learn?
- Should future missions inherit this?

## Engineering Ownership

`services/decision-graph/`

Packages:

- `decision-store/`
- `alternative-store/`
- `approval-store/`
- `outcome-linker/`
- `roi-engine/`
- `decision-query/`

---

# Part 7 - Module 4: Pay-for-Correctness Engine

## Goal

Move software delivery from "tests passed" to "correctness was proven within a declared boundary."

## Old Pipeline

```text
PR
-> Tests
-> Deploy
```

## New Pipeline

```text
Spec
-> Implementation
-> Verification
-> Evidence
-> Correctness Score
-> Approval
-> Deploy
-> Certificate
```

## Engineering Ownership

`services/correctness/`

Packages:

- `spec-parser/`
- `property-checker/`
- `test-generator/`
- `formal-checker/`
- `evidence-engine/`
- `certificate-engine/`

## Output

Every meaningful deployment receives a certificate:

> "This artifact satisfies these properties, under these tests and evidence, with these unresolved risks."

---

# Part 8 - Module 5: Autonomous Engineering Runtime

## Goal

Turn autonomous engineering into a governed institution, not a single agent writing code.

## Old Model

```text
Agent
-> Code
```

## New Model

```text
Goal
-> Planner
-> Architect
-> Implementer
-> Tester
-> Verifier
-> Security Reviewer
-> Performance Reviewer
-> Merge Decision
```

## Roles

- Mission Governor;
- Planner;
- Architect;
- Implementer;
- Test Engineer;
- Independent Verifier;
- Security Reviewer;
- Performance Reviewer;
- Release Approver.

## Output

A verified engineering mission with traceable authority, evidence, tests, reviews, and outcome.

---

# Part 9 - Module 6: Evolution Runtime

## Goal

Move from organizational learning to institutional evolution.

## Old Model

```text
Failure
-> Patch
```

## New Model

```text
Institution
-> Execution
-> Outcome
-> Fitness
-> Mutation
-> Simulation
-> Selection
-> Next Generation Institution
```

## Responsibilities

- compare institution versions;
- discover better policies;
- discover better authority chains;
- discover better role structures;
- discover better verification contracts;
- automatically propose institutional upgrades;
- test upgrades in simulation;
- roll forward when evidence supports the upgrade;
- roll back when reality contradicts the upgrade.

## Engineering Ownership

`services/evolution/`

Packages:

- `pattern-detector/`
- `counterfactual-lab/`
- `simulation-engine/`
- `fitness-engine/`
- `mutation-engine/`
- `selection-engine/`
- `policy-update-engine/`
- `institution-update-engine/`
- `genome-versioner/`

## Output

Future institutions inherit:

- prior failure;
- root cause;
- required test;
- new policy;
- added verifier;
- forbidden action;
- improved institution design;
- measured fitness;
- version lineage.

---

# Part 10 - Module 7: Institutional Physics and Fitness Engine

## Goal

Measure institutional fitness, not merely revenue or technical metrics.

## Conserved Resources

Every institution spends and transforms scarce organizational resources:

- trust;
- authority;
- time;
- money;
- attention;
- compute;
- human effort;
- risk.

Every decision changes those quantities. Epoch should predict the change before execution, measure the actual change after settlement, and feed the result into the Evolution Runtime.

## Fitness Measures

- survival;
- resilience;
- adaptation speed;
- decision quality;
- verification quality;
- authority efficiency;
- risk reduction;
- institutional fitness;
- organizational intelligence.

## New Outcome Chain

```text
Institution
-> Decision
-> Execution
-> Resource Delta
-> Outcome
-> Fitness Score
-> Evolution Recommendation
```

## Engineering Ownership

`services/institutional-physics/`

Packages:

- `resource-model/`
- `fitness-model/`
- `metric-mapper/`
- `impact-engine/`
- `roi-engine/`
- `risk-engine/`
- `confidence-engine/`
- `fitness-certificate-engine/`

## Output

A Fitness Certificate:

> "This institution version improved or harmed fitness across these resources, with this evidence, confidence boundary, and recommended mutation."

---

# Part 11 - Core Runtime Stack

## Runtime Modules

```text
Platform
|
|-- Reality Graph
|-- Decision Graph
|-- Institution Graph
|-- Ontology Runtime
|-- Institution Runtime
|-- Evolution Runtime
|-- Genome Runtime
|-- Root Cause Intelligence
|-- Institution Compiler
|-- Execution Runtime
|-- Proof Runtime
|-- Correctness Engine
|-- Settlement Runtime
|-- Simulation Runtime
|-- Institutional Physics
|-- Civilization Runtime
`-- SDKs
```

## Each Team Owns

- APIs;
- schemas;
- migrations;
- tests;
- service contracts;
- fixtures;
- observability;
- security boundaries;
- documentation.

---

# Part 12 - Institutional Genome

## Goal

Make every institution a versioned artifact, like code in Git.

## Definition

An Institutional Genome is the complete specification of how an institution behaves, what it is allowed to do, how it proves success, and how it evolves.

## Genome Fields

```text
InstitutionalGenome
|
|-- mission
|-- authority
|-- roles
|-- budget
|-- capabilities
|-- constraints
|-- policies
|-- evidence
|-- tests
|-- metrics
|-- fitness
|-- inheritance
|-- termination
```

## Engineering Ownership

`services/genome/`

Packages:

- `genome-schema/`
- `genome-store/`
- `genome-diff/`
- `genome-versioning/`
- `genome-migration/`
- `genome-lineage/`
- `genome-policy-bindings/`

## Product Value

Institutions can now be:

- created;
- versioned;
- cloned;
- compared;
- mutated;
- simulated;
- selected;
- rolled back;
- inherited.

This is the basis for institutional evolution.

---

# Part 13 - Company DNA

## Goal

Replace "company memory" as the highest-level idea with Company DNA.

Memory stores what happened. DNA defines what the company becomes.

## Company DNA Chain

```text
Principles
-> Policies
-> Institutions
-> Behaviors
-> Evidence
-> Evolution History
```

## Core Objects

```text
CompanyPrinciple
PolicyGene
InstitutionTemplate
BehaviorPattern
EvidenceLineage
EvolutionHistory
```

## Product Value

Company DNA lets Epoch answer:

- What principles does this company preserve?
- Which policies express those principles?
- Which institutions enforce those policies?
- Which behaviors appeared in reality?
- Which outcomes proved or contradicted the behavior?
- How has the company evolved over time?

---

# Part 14 - Evolution Lab

## Goal

Let companies evolve institutions before production.

## Pipeline

```text
Current Company
-> Clone
-> Mutate Institution
-> Run Simulation
-> Measure KPI
-> Select Best Version
-> Controlled Rollout
-> Settlement
```

## Engineering Ownership

`services/evolution-lab/`

Packages:

- `company-cloner/`
- `institution-mutator/`
- `scenario-runner/`
- `simulation-metrics/`
- `fitness-comparator/`
- `rollout-planner/`
- `rollback-planner/`

## Product Surfaces

- Institution version timeline;
- mutation proposal view;
- simulation comparison;
- fitness scorecard;
- rollout recommendation;
- rollback trigger.

## Product Value

The customer can test:

- a new incident institution;
- a new release institution;
- a new approval policy;
- a new verifier;
- a new budget model;
- a new escalation rule;
- a new customer-support institution.

The company improves before real customers or production systems are exposed.

---

# Part 15 - Institution Marketplace

## Goal

Create the future marketplace for installable institutions.

Today companies install software. In the future, they will install institutions.

## Marketplace Examples

- Hiring Institution;
- Incident Institution;
- Compliance Institution;
- Release Institution;
- Customer Support Institution;
- Finance Institution;
- Security Review Institution;
- Vendor Risk Institution;
- Data Governance Institution;
- AI Deployment Institution.

## Installable Package

```text
InstitutionPackage
|
|-- genome
|-- mission template
|-- role template
|-- policy template
|-- evidence contract
|-- verifier contract
|-- simulation scenarios
|-- fitness metrics
|-- integration requirements
|-- rollback rules
```

## Marketplace Boundary

Do not build the public marketplace early.

First, build private institution templates from real customer missions. The marketplace becomes credible only after repeated proof that institutions can be installed, adapted, verified, and improved.

---

# Part 16 - Civilization Runtime

## Goal

Extend institutional intelligence beyond one company only after single-company institutions are proven.

## Expansion Chain

```text
Company
-> Institution
-> Industry
-> Supply Chain
-> Economy
```

## Cross-Company Proof Network

Current:

```text
Company
-> Proof
```

Future:

```text
Company A
-> Institution
-> Proof
-> Federated Verification
-> Company B
-> Company C
-> Auditor
-> Insurer
-> Regulator
```

## Responsibilities

- cross-company proof exchange;
- verifier federation;
- privacy-preserving outcome credentials;
- institution reputation;
- institutional compatibility;
- accepted proof formats for auditors, insurers, and regulators.

## Boundary

This is a north-star layer. It should not delay the first product, the first paid mission, or the first repeatable deployment.

---

# Part 17 - Product Evolution

## Phase 1 - Beachhead

### Inference Change Assurance

Goal:

Prove one AI-infrastructure change without hidden regression.

Build:

- mission contract;
- controlled execution;
- action gateway;
- PASS / FAIL / UNKNOWN;
- independent verification;
- assurance case;
- basic settlement plan.

## Phase 2 - AI Infrastructure Assurance

Goal:

Move from one inference change to broader AI infrastructure reliability.

Build:

- root-cause intelligence;
- incident-to-mission flow;
- deployment evidence;
- correctness certificates;
- infrastructure assurance cases.

## Phase 3 - Institutional Intelligence

Goal:

Turn enterprise reality into programmable institutions.

Build:

- enterprise ontology;
- entity resolution;
- relationship discovery;
- workflow discovery;
- policy discovery;
- decision graph;
- institution graph;
- institutional genome;
- company DNA.

## Phase 4 - Autonomous Engineering Platform

Goal:

Make engineering work institution-based.

Build:

- planner role;
- architect role;
- implementer role;
- tester role;
- verifier role;
- security role;
- performance role;
- merge decision certificate.

## Phase 5 - Institutional Evolution

Goal:

Continuously improve institutions before and after production.

Build:

- Evolution Runtime;
- Evolution Lab;
- institution mutation;
- simulation and counterfactual testing;
- fitness certificates;
- controlled rollout and rollback.

## Phase 6 - Institution Marketplace

Goal:

Let companies install, adapt, verify, and evolve reusable institutions.

Build:

- private institution templates;
- institution package format;
- release, incident, compliance, support, finance, and hiring institutions;
- installation simulation;
- package fitness history;
- governance for third-party institution packages.

## Phase 7 - Civilization Runtime and Proof Network

Goal:

Enable trusted institutions across companies, industries, supply chains, auditors, insurers, and regulators.

Build:

- cross-company proof exchange;
- federated verification;
- privacy-preserving credentials;
- institution reputation;
- accepted proof formats;
- verifier reputation;
- Reality Exchange network.

---

# Part 18 - First Product: Verified Agent Execution

## What Customers Buy First

A founder-assisted sprint.

Offer:

> Bring one consequential change. Epoch governs the execution, independently verifies the outcome, and gives you PASS, FAIL, or UNKNOWN with proof.

## First Use Cases

- inference change assurance;
- infrastructure regression investigation;
- deployment correctness;
- root cause verification;
- agent-generated PR verification;
- incident fix verification.

## Buyer

- CTO;
- Head of AI Infrastructure;
- Head of Platform;
- VP Engineering;
- SRE lead;
- Security lead;
- FinOps lead.

## Deliverables

- mission contract;
- baseline report;
- candidate comparison;
- evidence graph;
- verifier findings;
- assurance case;
- decision result;
- settlement plan;
- learning proposal.

---

# Part 19 - Data Model Backbone

## Primary Objects

```text
RealityEntity
RealityEvent
Decision
DecisionAlternative
DecisionEvidence
Institution
InstitutionalGenome
CompanyDNA
Role
AgentIdentity
CapabilityLease
Mission
Action
ExecutionRecord
EvidenceRecord
ProofResult
SettlementResult
LearningArtifact
EvolutionProposal
MutationRecord
SimulationResult
FitnessCertificate
CorrectnessCertificate
```

## Core States

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
CONFIRMED
CONTRADICTED
INCONCLUSIVE
EXPIRED
```

---

# Part 20 - Engineering Build Order

## Build Now

- Mission Contract;
- Agent Registry;
- Capability Lease;
- Action Gateway;
- Evidence Store;
- Assurance Case; 
- Independent Verifier;
- PASS / FAIL / UNKNOWN decision engine;
- basic Decision Graph;
- basic Root Cause timeline;
- basic Correctness Certificate.

## Build Next

- full Institution Runtime;
- Evolution Runtime;
- Institutional Genome;
- Company DNA;
- Root Cause Intelligence engine;
- Enterprise Ontology;
- Workflow Discovery;
- Policy Discovery;
- Institutional Physics and Fitness Engine;
- Evolution Lab.

## Build Later

- federated verification;
- cross-company proof;
- outcome credentials;
- institution marketplace;
- Civilization Runtime;
- Reality Exchange;
- physical AI assurance;
- space and remote autonomy assurance.

---

# Part 21 - Founder Operating Rule

Do not build the whole platform before selling.

Sell one proof.

Build the primitive underneath.

Then expand.

The first commercial wedge is still narrow:

> Verified Agent Execution for one consequential infrastructure or engineering change.

But every feature must become part of the larger runtime:

```text
Institution
-> Execution
-> Outcome
-> Fitness
-> Mutation
-> Simulation
-> Selection
-> Settlement
-> Next Generation Institution
```

---

# Final Doctrine

MemoryOS / Epoch should not be a memory product.

It should not be a dashboard.

It should not be another agent framework.

It should not be merely an enterprise operating system.

It should become the system that answers:

- What is true?
- What happened?
- Why did it happen?
- What institution should exist?
- What mission should it serve?
- Who is allowed to act?
- Which authority chain applies?
- What proof is required?
- Did the action work?
- What did reality confirm?
- How fit was this institution?
- What mutation should be tested next?
- What should the company inherit?

The company becomes valuable because it owns the primitive enterprise AI is missing:

The institution.

Data without institution is passive.

Agents without institution are unsafe.

Execution without verification is dangerous.

Verification without settlement is incomplete.

Settlement without evolution is wasted.

Epoch closes the institutional evolution loop.
