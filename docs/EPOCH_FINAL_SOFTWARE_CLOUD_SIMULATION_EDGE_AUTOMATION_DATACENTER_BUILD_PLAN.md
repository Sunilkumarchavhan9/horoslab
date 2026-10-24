HOROS — MASTER ARCHITECTURE DIAGRAM + FULL PRODUCT BUILD PLAN
Version: Final consolidated architecture and execution plan
Date: 23 October 2026
Authority: This package preserves the existing Horos architecture as the base source, adds the first-party model-family program as an additive layer, and reconciles the product build plan with the five-model priority decision.
Frontend rule: the existing frontend is already built and must be preserved; implementation connects it to the real platform instead of replacing it.
Scope rule: complete permanent product architecture + all 15 use cases + all model-family domains. The first five Horos-owned model programs are prioritized, but no product domain is removed.
Consolidated decision
Horos is one complete intelligence-engineering and Reality Intelligence product. The existing architecture is not renamed, reordered, shortened or replaced. The Horos-owned model program is additive: it runs through the same Capability Fabric, Frontier Research Fabric, Data Engine, Ground Truth Factory, Training/Post-Training, Model Registry, Profiler, Evaluation/Verification, System Search, Deployment, Observation, Evidence and Evolution systems already defined in the architecture.

The five prioritized Horos model programs are Reality Decoder, Code Intelligence, Voice Intelligence (ASR/TTS), Visual Generation, and World Dynamics Model. They are developed alongside the platform using domain data, existing baselines, adaptation/fine-tuning, continued training, distillation or specialized training when measured evidence supports it. Large-scale from-scratch pretraining is not a prerequisite. Existing hosted/open-weight/customer models remain available through the same provider-agnostic interfaces.

The master document has two parts: (I) the original full architecture and additive model-family architecture; (II) the reconciled full product build plan, including the existing frontend constraint, all 15 use cases, technical choices, dependencies, contracts, stages, workstreams and acceptance gates.
PART I — FULL ARCHITECTURE SOURCE (PRESERVED)
HOROS — FRONTIER AI REALITY INTELLIGENT INFRASTRUCTURE
Permanent Product + Architecture + Engineering Build Plan
Status: Foundational architecture / full-system build plan
Document role: Engineering source of truth
Architecture policy: Permanent architecture from Day 1. No throwaway domain model. No architectural rewrite after the first release.
Implementation policy: Build in dependency order, but every major future domain receives a stable interface, identity, versioning, lineage, security boundary, event model, and test contract from the first implementation.
Primary product: Horos — a Frontier Intelligence Engineering System for continuously engineering, verifying, deploying, and improving intelligent systems from evidence.
0. The Product in One Sentence
   Horos continuously engineers a better intelligence system by searching across models, data, context, runtime, compute, workload, and environment against real-world objectives, then measuring, verifying, deploying, observing, and learning from the result.
Horos is not a generic agent platform.

Horos is not only a model registry.

Horos is not only an inference platform.

Horos is not only an evaluation platform.

Horos is not only a robotics platform.

Those are capabilities inside one larger system.

The central product is the intelligence engineering loop.

MISSION
  ↓
REALITY
  ↓
UNKNOWN / KNOWLEDGE GAP
  ↓
CAPABILITY DISCOVERY
  ↓
SYSTEM COMPOSITION
  ↓
CANDIDATE SYSTEM
  ↓
PREDICT
  ↓
EXPERIMENT
  ↓
MEASURE
  ↓
VERIFY
  ↓
DECIDE
  ↓
DEPLOY
  ↓
OBSERVE REALITY
  ↓
EVIDENCE
  ↓
EXPERIENCE
  ↓
FAILURE / LESSON
  ↓
TEACH
  ↓
NEW INTELLIGENCE
  ↓
NEXT SYSTEM
  └────────────────────────────→
1. Product Boundary
   1.1 What Horos owns
   Horos owns the intelligence-engineering primitives and their relationships:
Missions

Reality

Context

Capabilities

Models

Model versions

Data

Data versions

Training

Post-training

Evaluation

Verification

Experiments

Optimization

Runtime

Compute

Deployments

Observations

Evidence

Experience

Lessons

Teaching

System versions

Policies

Authority

Provenance

Lineage

Outcomes

1.2 What Horos abstracts
External substrates remain replaceable:

Cloud providers

GPU providers

Kubernetes

Bare metal

Object storage

Databases

Networks

Edge devices

Robots

Simulators

Model repositories

Inference runtimes

Hardware accelerators

Horos must be able to replace a substrate without changing its core domain model.

1.3 What Horos does not promise
Horos does not guarantee that a model is intelligent merely because it is large.

Horos does not treat simulation as reality.

Horos does not treat an evaluation score as proof.

Horos does not grant authority merely because a capability exists.

Horos does not silently mutate customer state.

Horos does not overwrite historical versions.
2. First Customer and First Workload
   The long-term platform is broad. The first commercial workflow must be narrow enough to become excellent.
2.1 Primary customer
Initial customer profile:

AI/ML engineering teams

Research engineering teams

Inference/platform teams

Robotics / physical-AI teams once the physical adapter exists

Teams running open-weight or customer-owned models

2.2 Initial problem
Current intelligence engineering is fragmented across:

model repository
+
datasets
+
training code
+
evaluation scripts
+
benchmark spreadsheets
+
serving runtime
+
GPU infrastructure
+
deployment system
+
production telemetry
+
manual experimentation
The result is weak reproducibility, slow iteration, unclear causality, and expensive engineering cycles.

Horos turns this into a versioned, evidence-backed optimization loop.

2.3 First canonical workload
The canonical first workload is:

Given a model, workload, quality target, and cost/latency constraints, find and verify a better intelligence system configuration.

Example:

Goal:
Maintain task quality ≥ baseline

Constraints:
- latency budget
- GPU budget
- memory budget
- risk policy
Search:
- model variant
- quantization
- runtime
- batching
- routing
- context strategy
- hardware placement
Output:
Verified system version
- measured impact
- evidence
- deployment package
- explanation of why it changed
  This creates a commercially legible entry point while retaining the permanent architecture needed for broader intelligence engineering.
3. Full-System Construction Rule
   Horos is built as the complete permanent product described by the architecture diagram. There is no reduced product architecture, no disposable MVP architecture, and no intentional omission of a permanent subsystem because it belongs to a later commercial release.
The rule is:

FULL DOMAIN MODEL
- FULL CONTRACT MODEL
- FULL VERSIONING MODEL
- FULL LINEAGE MODEL
- FULL EVENT MODEL
- FULL SECURITY MODEL
- FULL OBSERVABILITY MODEL
- FULL DEPLOYMENT MODEL
- FULL EVOLUTION MODEL
  All architecture domains are therefore part of the implementation target from the beginning.
Dependency determines construction order. Dependency does not determine product scope.

A domain may depend on another domain, but it remains a first-class Horos domain with its own identity, schemas, APIs, events, workers, storage, security boundaries, observability, tests, and failure semantics.

Horos must never create a temporary internal abstraction with the expectation that the real abstraction will be introduced later.

3.1 Implementation invariants
Every permanent domain receives:

domain model

immutable identity

lifecycle state machine

versioning strategy

lineage strategy

persistence contract

API contract

event contract

command contract

worker contract where asynchronous work exists

artifact contract where binary/materialized data exists

authorization policy

audit events

telemetry

tracing

metrics

failure semantics

retry semantics

idempotency semantics

test contract

migration strategy

import/export semantics where applicable

3.2 Complete-product rule
The following are not optional expansion domains. They are part of the permanent product:

Reality
World Intelligence
Context Intelligence
Unknown Engine
Knowledge Gap Engine
Active Reality Learning
Capability Fabric
Model Registry
Universal Model IR
Compiler
Kernel Engine
Model Capability Profiler
Research Fabric
Intelligence Development
Data Engine
Active Data Engine
Ground Truth Factory
Post-Training Engine
Distillation
Evaluation Fabric
Verification Fabric
Evaluation Integrity
System Search
Workload Intelligence
Inference Optimization
Adaptive Reasoning
Compute Intelligence
Model Economics
Counterfactual Engine
Causal Experiment Engine
Synthetic Reality / World Lab
RL Environment Factory
Synthetic Data
SIM2REAL Gap Engine
Decision Engine
Governance / Authority
Execution Boundary
Deployment Runtime
Physical Execution Fabric
Managed Inference
Model API
Observation Fabric
Evidence Fabric
Replay / Lineage
Claim Engine
Verification Engine
Consequence Engine
Mission Result
Experience Engine
Failure Mining
Lesson Engine
Teaching Fabric
Intelligence Evolution
Customer Control Plane
Connectors
Usage / Metering
Billing / Pricing
Export / Import
Security / Isolation
Operations / Observability
Autonomous Research
3.3 Construction topology
The implementation follows the dependency graph of the system rather than a calendar:

Identity + tenancy
        ↓
Versioning + artifacts + lineage
        ↓
Mission + outcome contracts + authority
        ↓
Reality + context + capability discovery
        ↓
Model/data/runtime/workload representations
        ↓
Composition + prediction + experiment
        ↓
Evaluation + verification + decision
        ↓
Deployment + execution + observation
        ↓
Evidence + consequence + experience
        ↓
Failure mining + lessons + teaching
        ↓
Evolution + research + system search
        ↓
World intelligence + simulation + physical execution
        ↺ complete learning loop
This is a dependency topology, not a release roadmap.

3.4 No domain is a placeholder
Every architecture block has a real implementation target. Adapters may abstract external substrates, but the Horos-side capability must be concrete.

For example:

Model Registry is a real registry, not a TODO wrapper around Hugging Face.

Universal Model IR is a real normalized representation, not generic JSON.

Evaluation is a real execution system with stored results and provenance.

Verification is a real evidence-backed claim system.

Reality is a real state model with freshness and uncertainty.

Experience is a real versioned record that can affect later systems.

Physical Execution is a real contract boundary even when the first connected device is limited.
4. Core Product Objects
   The canonical objects are:
Organization
Project
User
API Key
Mission
Objective
Constraint
Outcome Contract
Reality Snapshot
World State
Entity
Capability
Capability Version
Model
Model Version
Dataset
Dataset Version
Training Run
Post-training Run
Evaluator
Evaluation Run
Verifier
Verification Run
Runtime
Runtime Version
Compute Resource
Workload
Workload Replay
System Candidate
System Version
Optimization Run
Experiment
Experiment Run
Deployment
Deployment Version
Observation
Measurement
Evidence Artifact
Claim
Verification Result
Consequence
Mission Result
Experience Record
Failure
Lesson
Teaching Run
Policy
Authority
Credential Reference
Export Package
Usage Record
Invoice
Every object that can affect a reproducible result is immutable-by-version.
5. Identity Rules
   5.1 Names are not identity
   Human-readable names are labels.
Identity comes from immutable fingerprints and parent lineage.

Examples:

model_id
model_version_id
dataset_version_id
runtime_version_id
system_version_id
experiment_id
deployment_id
evidence_id
5.2 Version rule
Never overwrite a meaningful version.

Wrong:

model.production_config = new_config
Correct:

ModelVersion v17
    ↓
new SystemCandidate
    ↓
SystemVersion v18
5.3 Content-addressed artifacts
Large immutable artifacts should use:

sha256 digest
+
object storage key
+
size
+
media type
+
created timestamp
+
source provenance
6. Truth and Evidence Hierarchy
Horos must never collapse different evidence levels into one generic status.

UNOBSERVED
   ↓
HYPOTHESIZED
   ↓
PREDICTED
   ↓
SIMULATED
   ↓
OBSERVED
   ↓
MEASURED
   ↓
REPRODUCED
   ↓
VERIFIED
   ↓
CUSTOMER-VERIFIED
Each claim must declare:

claim_id
claim_type
statement
evidence_refs[]
status
confidence
source
created_at
valid_from
valid_until
verification_method
Rules:

A prediction is not an observation.

A simulation is not physical proof.

A benchmark result is not automatically a production result.

A production result is not automatically causal attribution.

A metric without provenance is not a verified claim.
7. Uncertainty Model
   Uncertainty is a first-class field across the entire system.
Every prediction/capability/evaluation/decision can carry:

confidence
uncertainty_type
uncertainty_value
evidence_strength
freshness
sample_size
measurement_error
source_count
Reality state additionally includes:

observed_at
ingested_at
valid_from
valid_until
freshness
source
Decision inputs become:

OBJECTIVE
+
CONSTRAINTS
+
CURRENT REALITY
+
AVAILABLE CAPABILITIES
+
EVIDENCE
+
UNCERTAINTY
+
AUTHORITY
8. Optimization Objective Model
Every optimization must have an explicit objective.

OptimizationObjective
├── primary_objective
├── secondary_objectives[]
├── hard_constraints[]
├── soft_constraints[]
├── budget
├── risk_tolerance
├── allowed_regressions[]
├── required_capabilities[]
├── forbidden_changes[]
└── success_thresholds[]
Typical objectives:

maximize quality
minimize cost
minimize latency
maximize throughput
minimize energy
maximize reliability
minimize risk
maximize mission success
A multi-objective run can produce:

Pareto frontier
Horos does not silently choose a point on the frontier. The mission contract or policy determines the acceptable tradeoff.
9. System Candidate Lifecycle
   DESCRIBED
   ↓
   COMPOSED
   ↓
   PREDICTED
   ↓
   EVALUATED
   ↓
   EXPERIMENTAL
   ↓
   VERIFIED
   ↓
   APPROVED
   ↓
   SHADOW
   ↓
   CANARY
   ↓
   PRODUCTION
   ↓
   OBSERVED
   ↓
   IMPROVEMENT CANDIDATE
   Failure states:
REJECTED
ROLLED_BACK
BLOCKED
EXPIRED
INVALIDATED
10. Mission Lifecycle
DRAFT
 ↓
NORMALIZED
 ↓
UNDERSTANDING
 ↓
DISCOVERING
 ↓
COMPOSING
 ↓
EVALUATING
 ↓
EXPERIMENTING
 ↓
AWAITING_AUTHORITY
 ↓
READY
 ↓
EXECUTING
 ↓
OBSERVING
 ↓
VERIFYING
 ↓
COMPLETED
Exceptional states:

FAILED
ROLLED_BACK
PAUSED
CANCELLED
A mission cannot directly mutate customer systems.

It must pass:

authority
→ policy
→ resource check
→ state recheck
→ execution
→ observation
→ verification
11. Intelligence Graph
The Intelligence Graph is Horos's persistent connective tissue.

It does not require a dedicated graph database.

Relational storage is sufficient initially if every relationship is explicit.

Minimum relationship questions:

What produced this?

Which version was used?

Which data was involved?

Which runtime was used?

Which compute was used?

Which workload was used?

What evidence supports the result?

What changed afterward?

Which system version learned from the experience?
Core edges:

Mission ──targets──> Objective
Mission ──uses──> RealitySnapshot
Mission ──requires──> Capability
Mission ──produces──> MissionResult

ModelVersion ──derived_from──> ModelVersion
ModelVersion ──trained_on──> DatasetVersion
ModelVersion ──evaluated_by──> Evaluation
SystemVersion ──contains──> ModelVersion
SystemVersion ──uses──> RuntimeVersion
SystemVersion ──uses──> ComputeProfile
SystemVersion ──optimized_for──> Workload

Experiment ──tests──> Hypothesis
Experiment ──changes──> SystemCandidate
Experiment ──produces──> Evidence
Evidence ──supports──> Claim
Claim ──verified_by──> VerificationResult

Deployment ──deploys──> SystemVersion
Deployment ──produces──> Observation
Observation ──produces──> Experience
Experience ──produces──> Lesson
Lesson ──teaches──> TeachingRun
TeachingRun ──produces──> ModelVersion
12. Recommended Repository Architecture
The system should be a modular monolith + isolated workers, not dozens of microservices on Day 1.

Permanent boundaries matter more than physical deployment boundaries.

horos/
├── apps/
│   ├── console/                  # Next.js control plane
│   ├── api/                     # TypeScript API
│   └── docs/                    # product + developer docs
│
├── packages/
│   ├── domain/                  # domain objects + invariants
│   ├── contracts/               # API/event schemas
│   ├── auth/                   # authn/authz interfaces
│   ├── graph/                  # lineage + relationship services
│   ├── missions/
│   ├── reality/
│   ├── capabilities/
│   ├── models/
│   ├── datasets/
│   ├── evaluations/
│   ├── verification/
│   ├── optimization/
│   ├── experiments/
│   ├── runtime/
│   ├── compute/
│   ├── deployments/
│   ├── observations/
│   ├── evidence/
│   ├── experience/
│   ├── teaching/
│   ├── governance/
│   ├── billing/
│   └── telemetry/
│
├── workers/
│   ├── evaluator/
│   ├── benchmark/
│   ├── optimizer/
│   ├── inference/
│   ├── artifact/
│   ├── deployment/
│   └── observation/
│
├── python/
│   ├── evaluation/
│   ├── profiling/
│   ├── optimization/
│   ├── experiments/
│   ├── training/
│   └── physical/
│
├── infra/
│   ├── local/
│   ├── docker/
│   ├── production/
│   ├── migrations/
│   └── policies/
│
├── sdk/
│   └── typescript/
│
├── examples/
│   ├── canonical-mission/
│   ├── open-weight-model/
│   └── workload-replay/
│
├── tests/
│   ├── unit/
│   ├── contract/
│   ├── integration/
│   ├── e2e/
│   ├── reproducibility/
│   ├── security/
│   └── chaos/
│
└── docs/
    ├── architecture/
    ├── domain/
    ├── api/
    ├── operations/
    └── research/
13. Technology Strategy
13.1 Control plane
Use:

TypeScript
Next.js
React
Responsibilities:

authentication

organizations

projects

missions

graphs

runs

dashboards

approvals

configuration

billing

audit trail

13.2 Backend
Use TypeScript for:

API

orchestration

domain services

state machines

authorization

event publishing

persistence

integrations

Use Python for compute-heavy:

evaluation

profiling

optimization

training

simulation

data processing

model experimentation

13.3 Database
Primary source of truth:

PostgreSQL
Use relational tables for durable domain state.

Use JSONB selectively for extensible payloads.

Use object storage for:

model artifacts

datasets

evaluation outputs

logs

evidence bundles

experiment artifacts

exported system packages

13.4 Queue / jobs
Start with a durable database-backed job abstraction.

The contract must support:

queued
running
succeeded
failed
cancelled
retrying
dead_letter
A higher-throughput queue can later be inserted without changing the domain contracts.

13.5 Cache
Use a cache only for derived/reconstructable state:

session
hot graph reads
benchmark summaries
capability lookup
runtime discovery
Never make cache the source of truth.
14. Database Domains
    Create separate schemas/modules logically even if they share one PostgreSQL instance.
identity
organizations
projects
missions
reality
capabilities
models
datasets
training
evaluations
verification
optimization
experiments
runtime
compute
deployments
observations
evidence
experience
teaching
governance
billing
audit
15. Core Relational Schema
organizations
id
name
slug
status
created_at
updated_at
projects
id
organization_id
name
slug
description
default_policy_id
created_at
updated_at
missions
id
project_id
version
requester_id
intent
outcome_contract
constraints
authority
risk_policy
budget
required_capabilities
reality_snapshot_id
status
created_at
updated_at
models
id
project_id nullable
name
source_type
source_uri
created_at
model_versions
id
model_id
parent_version_id nullable
source_revision
artifact_digest
architecture
configuration
tokenizer
dependencies
license
provenance
security_status
created_at
datasets
id
project_id nullable
name
source
created_at
dataset_versions
id
dataset_id
parent_version_id nullable
artifact_digest
schema
provenance
transformations
quality_summary
created_at
system_versions
id
project_id
parent_system_version_id nullable
model_version_id
runtime_version_id
compute_profile_id
context_strategy
workload_profile_id
system_manifest
status
created_at
evaluations
id
system_version_id
evaluator_id
dataset_version_id
protocol
metrics
result_artifact_id
status
created_at
experiments
id
project_id
mission_id
hypothesis
baseline_system_version_id
objective
variables
controls
budget
risk
expected_information_gain
status
deployments
id
system_version_id
environment
target
deployment_manifest
status
created_at
observations
id
deployment_id
observation_type
source
observed_at
ingested_at
payload
confidence
evidence
id
source_type
source_ref
artifact_digest
timestamp
environment
version_refs
provenance
evidence_level
claims
id
statement
claim_type
status
confidence
evidence_refs
created_at
valid_from
valid_until
verification_results
id
claim_id
verifier_id
protocol
result
failure_reason
evidence_refs
created_at
experience_records
id
mission_id
system_version_id
reality_snapshot_id
action
observation
consequence
outcome
evidence_refs
created_at
lessons
id
experience_id
lesson_type
pattern
cause
tradeoff
preventive_action
generalization
created_at
16. Contract-First Design
Every major module must expose a stable contract.

Example:

interface EvaluationService {
  createEvaluation(input: CreateEvaluationInput): Promise<Evaluation>;
  runEvaluation(id: EvaluationId): Promise<RunRef>;
  getEvaluation(id: EvaluationId): Promise<Evaluation>;
}
The physical implementation may change.

The contract should not.

Use versioned contracts:

evaluation.v1
evaluation.v2
Never make breaking changes silently.
17. Event Architecture
    Every consequential state transition emits an event.
Examples:

mission.created
mission.normalized
mission.ready
mission.execution_started
mission.completed
mission.failed

model.ingested
model.validated
model.version_created

dataset.version_created

evaluation.created
evaluation.started
evaluation.completed

experiment.created
experiment.started
experiment.completed

deployment.created
deployment.shadow_started
deployment.canary_started
deployment.promoted
deployment.rolled_back

observation.created

evidence.created
claim.created
claim.verified
claim.invalidated

experience.created
lesson.created
teaching.completed

system.version_created
system.version_promoted
Event envelope:

{
  "event_id": "evt_...",
  "event_type": "experiment.completed",
  "event_version": 1,
  "organization_id": "org_...",
  "project_id": "prj_...",
  "entity_type": "experiment",
  "entity_id": "exp_...",
  "causation_id": "cmd_...",
  "correlation_id": "mission_...",
  "occurred_at": "...",
  "actor": "...",
  "payload": {}
}
18. Idempotency
Every state-changing API must accept an idempotency key.

POST /missions
Idempotency-Key: ...
Workers must also be idempotent.

Use:

operation key
+
entity version
+
transaction
so retries do not create duplicate deployments, evaluations, charges, or experiments.
19. Reality Fabric
    Reality Fabric stores the current and historical representation of the environment.
It supports:

digital entities
physical entities
systems
workloads
devices
deployments
telemetry
relationships
state
Every observation should be tied to a time and source.

Reality snapshots are immutable:

RealitySnapshot v1
RealitySnapshot v2
RealitySnapshot v3
A mission references a snapshot.
20. Context Intelligence
    Context is an engineering variable.
It includes:

retrieval
memory
history
task context
tool context
compressed context
selected context
long context
adaptive context
A context strategy must be versioned because context changes can alter model behavior.
21. Unknown Engine
    Unknown Engine records:
missing information
stale information
uncertain state
unresolved contradictions
unmeasured variables
Example:

unknown:
  type: workload_distribution

impact:
  high

reason:
  production traffic not yet observed

needed_evidence:
  10k representative requests
22. Knowledge Gap Engine
For each mission:

WHAT DO WE KNOW?
WHAT DON'T WE KNOW?
WHAT MATTERS?
WHAT EVIDENCE WOULD REDUCE UNCERTAINTY?
Then produce:

KnowledgeAcquisitionPlan
with:

evidence_target
method
cost
risk
expected_information_gain
deadline
This becomes the bridge between reality and experimentation.
23. Capability Fabric
    Capability records describe what Horos can use.
Categories:

MODEL
DATA
TOOL
SKILL
SIMULATOR
VERIFIER
ENVIRONMENT
HARDWARE
RUNTIME
Capability record:

capability_id
version
input_modalities
output_modalities
operations
latency_profile
resource_profile
dependencies
location
license
provenance
security_posture
composability
evidence
confidence
Capability is never permission.

Permission is separately modeled.
24. Model Registry
    Sources:
Hugging Face
Customer model artifacts
Private registries
Local registries
Ingestion pipeline:

SOURCE
 ↓
DISCOVER
 ↓
DOWNLOAD / IMPORT
 ↓
HASH
 ↓
VALIDATE
 ↓
LICENSE CHECK
 ↓
DEPENDENCY CHECK
 ↓
SERIALIZATION CHECK
 ↓
RUNTIME COMPATIBILITY
 ↓
HARDWARE COMPATIBILITY
 ↓
NORMALIZE
 ↓
MODEL VERSION
 ↓
CAPABILITY PROFILE
No model becomes production-eligible until integrity and policy checks pass.
25. Universal Model IR
    The IR is the stable internal representation between external model formats and optimization/runtime layers.
The IR should represent:

graph
operators
shapes
dtypes
weights
attention
memory
constants
control flow where supported
metadata
execution constraints
The IR is versioned.

ModelIR v1
ModelIR v2
26. Compiler + Kernel Architecture
Pipeline:

MODEL
 ↓
NORMALIZATION
 ↓
UNIVERSAL MODEL IR
 ↓
COMPUTATION GRAPH
 ↓
GRAPH OPTIMIZER
 ↓
OPERATOR OPTIMIZER
 ↓
MEMORY OPTIMIZER
 ↓
MODEL COMPILER
 ↓
KERNEL GENERATION
 ↓
KERNEL SEARCH / AUTOTUNE
 ↓
COMPILE
 ↓
BENCHMARK
 ↓
VERIFIED KERNEL SET
Kernel artifacts must carry:

source
compiler version
target hardware
flags
dependencies
benchmark result
correctness result
artifact digest
27. Model Capability Profiler
Profiler produces:

quality
latency
throughput
memory
energy
context behavior
tool use
modalities
reasoning behavior
failure modes
It must support:

static metadata
empirical benchmark
workload-specific benchmark
28. Evaluation Fabric
Evaluation layers:

CAPABILITY
BEHAVIOR
SYSTEM
Capability examples:

reasoning
coding
vision
multimodal
domain
physical
specialized
Behavior examples:

trajectory
tool use
long horizon
safety
robustness
recovery
adversarial
System examples:

quality
latency
cost
throughput
reliability
energy
mission success
Every evaluation stores:

protocol
baseline
candidate
dataset
workload
metrics
environment
software versions
hardware
random seeds
artifacts
29. Verification Fabric
Evaluation asks:

How did the system behave under this protocol?

Verification asks:

Is the claimed result actually supported by the available evidence?

Verification types:

task verification
trajectory verification
domain verification
safety verification
formal verification
output verification
independent validation
30. Evaluation Integrity
Detect:

benchmark contamination
data leakage
benchmark overfitting
evaluator drift
evaluator bias
reward hacking
gaming
selection bias
Critical results should support independent validation.
31. System Search
    The search space includes:
MODEL
DATA
CONTEXT
RUNTIME
KERNEL
HARDWARE
WORKLOAD
ENVIRONMENT
Pipeline:

SEARCH SPACE
 ↓
CANDIDATE
 ↓
PREDICT
 ↓
EXPERIMENT
 ↓
MEASURE
 ↓
VERIFY
 ↓
KEEP / DISCARD
The search engine must maintain an experiment ledger.
32. Workload Intelligence
    A workload is more than request text.
Store:

input distribution
output distribution
task type
tool trajectory
context length
concurrency
batching
burstiness
traffic distribution
GPU utilization
memory usage
failures
network usage
resource usage
Production replay must be anonymized and policy-controlled where required.
33. Counterfactual Engine
    The system should model:
If we change the model, what happens?
If we change the dataset, what happens?
If we change the runtime, what happens?
If we change hardware, what happens?
If we change traffic shape, what happens?
If the environment changes, what happens?
It can return:

predicted outcome
confidence
assumptions
evidence
unknowns
Counterfactual output is a prediction, not proof.
34. Causal Experiment Engine
    Every consequential experiment should specify:
hypothesis
baseline
independent variables
control variables
candidate changes
workload
budget
risk
expected information gain
Execution environments:

simulation
sandbox
replay
shadow
canary
production
physical experiment
Output:

BEFORE
CHANGE
AFTER
WHY IT CHANGED
Causal claims require evidence appropriate to the claim.
35. Synthetic Reality / World Lab
    Synthetic environments support:
scenarios
world states
conditions
futures
trajectories
rare events
failures
adversarial conditions
Synthetic outcomes remain synthetic until real-world evidence validates the relevant claim.
36. SIM2REAL Gap Engine
    Pipeline:
SIMULATION RESULT
 ↓
REAL RESULT
 ↓
DIFFERENCE
 ↓
UNKNOWN REAL-WORLD FACTOR
 ↓
NEW SCENARIO / DATA
 ↓
NEW TRAINING
 ↓
REAL-WORLD TEST
 ↓
VERIFICATION
 ↓
WORLD KNOWLEDGE
37. Deployment Architecture
Targets:

cloud
Kubernetes
bare metal
dedicated GPU
serverless GPU
edge
device
physical system
Deployment manifest:

system version
model version
runtime version
hardware profile
resource limits
secrets refs
network policy
scaling policy
health checks
rollback version
observability config
Deployment stages:

BUILD
 ↓
VALIDATE
 ↓
SHADOW
 ↓
CANARY
 ↓
PROMOTE
 ↓
OBSERVE
 ↓
ROLLBACK if needed
38. Physical Execution Fabric
Future physical execution supports:

Sensors:
- camera
- LiDAR
- IMU
- audio
- thermal
- telemetry
Actuators:
- motion
- manipulation
- control
- force
- physical actions
Devices:
- robots
- machines
- vehicles
- industrial systems
  Before physical execution:
policy check
+
authority check
+
device capability check
+
state recheck
+
precondition check
+
resource limit
+
safety boundary
After execution:

observation
+
consequence
+
verification
+
experience
Emergency stop and containment paths must bypass normal optimization logic.
39. Managed Inference
    Horos Model API exposes a verified system rather than forcing customers to manage every infrastructure detail.
Request path:

REQUEST
 ↓
AUTH
 ↓
RATE / POLICY CHECK
 ↓
SYSTEM VERSION RESOLUTION
 ↓
WORKLOAD CLASSIFICATION
 ↓
ROUTING
 ↓
INFERENCE
 ↓
METERING
 ↓
OBSERVATION
 ↓
EVIDENCE
 ↓
EXPERIENCE
Supported billing concepts:

per token
per request
per task
per compute usage
Customer pricing should not be confused with internal optimization economics.
40. Observation Fabric
    Pipeline:
SIGNAL
 ↓
NORMALIZE
 ↓
OBSERVATION
 ↓
MEASUREMENT
 ↓
EVIDENCE
Sources:

model
system
reality
Measurements:

quality
latency
throughput
utilization
memory
network
cost
energy
physical state
environment
consequence
41. Evidence Fabric
Every evidence artifact contains:

source
timestamp
execution
environment
version
model
data
result
digest
provenance
Evidence is immutable.

Evidence can be referenced by multiple claims.

Evidence must survive the lifecycle of the system version that generated it.
42. Consequence Engine
    For any important action:
BEFORE
 ↓
ACTION
 ↓
AFTER
The consequence engine records:

state delta
observed outcome
expected outcome
unexpected effect
risk
evidence
causal context
This is crucial for reality-aware engineering.
43. Mission Result
    The mission should always resolve into a structured result.
MissionResult
├── mission_id
├── objective
├── status
├── what_changed
├── selected_system_version
├── evidence[]
├── claims[]
├── verification[]
├── outcome_metrics
├── cost
├── risk
├── uncertainty
├── failures[]
├── lessons[]
└── what_next
The customer should not receive only logs.

They receive:

what changed, why, what the evidence proves, what it does not prove, and what Horos recommends doing next.
44. Experience Engine
    Experience is the bridge from operation to learning.
An experience contains:

mission
reality
model
data
runtime
experiment
decision
action
observation
evidence
consequence
result
Then:

FAILURE MINING
 ↓
LESSON ENGINE
 ↓
TEACHING FABRIC
 ↓
NEW INTELLIGENCE
45. Failure Mining
Mine:

failures
regressions
drift
anomalies
rare events
edge cases
Root cause should be separated from symptom.

Example:

symptom:
latency regression

candidate causes:
- longer context
- different batching
- kernel fallback
- GPU placement
- cache miss
  The result becomes a structured lesson, not a text note.
46. Lesson Engine
    Lesson types:
causal lesson
tradeoff
success pattern
failure pattern
preventive action
correction
generalization
new test
Lessons must reference the evidence that produced them.
47. Teaching Fabric
    Teaching targets:
MODEL
RUNTIME
SYSTEM
Model teaching:

fine-tune
LoRA
RL
distillation
adaptation
retraining
reward
world model
Runtime teaching:

routing
serving
inference
strategy
verification
context
caching
System teaching:

configuration
deployment
compute
placement
hardware
data path
environment
The learning target is not always the model.

That is a core Horos principle.
48. Intelligence Evolution
    Canonical lifecycle:
NEW INTELLIGENCE
 ↓
EVALUATE
 ↓
SHADOW
 ↓
BENCHMARK
 ↓
CANARY
 ↓
PROMOTE
 ↓
PRODUCTION INTELLIGENCE
 ↓
OBSERVE
 ↓
LEARN
 ↓
TEACH
 ↓
NEW INTELLIGENCE
The system continuously searches for:

better behavior
better world understanding
better reality model
better knowledge
less uncertainty
49. Governance / Authority
Separate:

capability
permission
authority
approval
credential
Policy dimensions:

budget
region
license
hardware
provider
data access
autonomy
safety
Decision:

ALLOW
DENY
REQUIRES_APPROVAL
State must be rechecked immediately before consequential execution.

If current reality differs materially from the plan:

REDISCOVER
REPLAN
REAUTHORIZE
50. Execution Boundary
For every state-changing action:

MISSION AUTHORITY
 ↓
POLICY CHECK
 ↓
CAPABILITY CHECK
 ↓
CREDENTIAL CHECK
 ↓
RESOURCE CHECK
 ↓
STATE RECHECK
 ↓
PRECONDITION CHECK
 ↓
EXECUTE
 ↓
OBSERVE
 ↓
POSTCONDITION CHECK
 ↓
VERIFY
 ↓
RECORD CONSEQUENCE
51. Security Model
Identity
organization
project
user
service account
API key
worker identity
device identity
Isolation
All durable data must be tenant scoped.

Every query path must carry:

organization_id
project_id where applicable
Secrets
Secrets are references, not raw values in the domain graph.

Use:

secret_ref
provider
version
scope
rotation metadata
Workers resolve secrets only when authorized.

Audit
Log:

who
what
when
which version
which policy
which credential
which resource
what changed
result
52. Billing and Metering
Meter usage independently from pricing.

Usage events:

inference_request
input_tokens
output_tokens
compute_seconds
gpu_seconds
storage_bytes
egress_bytes
experiment_runs
training_compute
evaluation_compute
Pricing layer translates usage into customer billing.

Never mutate raw usage when pricing changes.
53. Control Plane
    The web console should organize around missions, not infrastructure.
Top-level navigation:

Overview
Missions
Systems
Models
Data
Experiments
Evaluations
Deployments
Reality
Evidence
Experience
Research
Compute
Policies
Usage
Settings
A user should be able to move:

Mission → Candidate → Experiment → Evidence → Deployment → Experience
without leaving the system.
54. Mission UI
    Mission page:
Mission header
Objective
Constraints
Reality snapshot
Current system
Candidate systems
Experiments
Evidence
Verification
Deployment
Outcome
What changed
What next
The UI should show uncertainty explicitly.

Example:

Verified:
latency improved 27%

Supported:
same evaluation quality under benchmark X

Not established:
same behavior under unseen production distribution
55. System Page
Show:

System identity
Parent version
Model
Data
Context
Runtime
Compute
Workload
Metrics
Evidence
Deployments
Failures
Lessons
Derived versions
This becomes the main “intelligence object” view.
56. Experiment Page
    Show:
Hypothesis
Expected information gain
Baseline
Variables
Controls
Candidate
Environment
Budget
Risk
Progress
Results
Causal attribution
Evidence
Decision
57. Evidence Page
Evidence view:

Claim
Evidence level
Source
Timestamp
Artifacts
Environment
Versions
Reproduction instructions
Verifier
Verification result
58. Observability
Metrics:

API
request_count
error_rate
p50
p95
p99
throughput
Workers
queue_depth
job_duration
retry_count
failure_rate
Models
quality
latency
tokens
memory
throughput
Systems
mission_success
cost
energy
regressions
drift
Evidence
verification_rate
invalid_claim_rate
missing_provenance_rate
59. Logging
Structured logs only.

Required fields:

timestamp
level
service
organization_id
project_id
mission_id
run_id
correlation_id
trace_id
entity_type
entity_id
event_type
message
error_code
Do not log:

raw secrets
credentials
sensitive customer payloads
unencrypted tokens
60. Tracing
Every mission gets a correlation chain:

mission
 → planner
 → capability lookup
 → experiment
 → worker
 → evaluator
 → deployment
 → observation
 → verification
A single trace should make it possible to understand why the final system version exists.
61. Reproducibility
    Every run must capture:
code version
container digest
config
model version
dataset version
runtime version
hardware
driver
seed
environment variables except secrets
command
inputs
outputs
artifacts
timestamp
A reproducible run should be reconstructable from the manifest.
62. Experiment Manifest
    Example:
experiment_id: exp_001

objective:
  maximize:
    - quality
  minimize:
    - latency
    - cost

baseline:
  system_version: sys_017

candidates:
- model_version: mdl_021
  quantization: int8
  runtime: runtime_004
- model_version: mdl_021
  quantization: int4
  runtime: runtime_005
workload:
  profile: production_replay_003

constraints:
  max_p95_latency_ms: 250
  max_cost_per_task_usd: 0.01
  min_quality: 0.92

environment:
  hardware: H100
  runtime_image: sha256:...

verification:
  required: true
63. Canonical End-to-End Mission
This is the first mission that must work completely.

Input
"Reduce inference cost while keeping task quality above baseline."
Step 1 — Normalize
Produce:

objective
constraints
budget
risk
success criteria
authority
Step 2 — Snapshot reality
Capture:

model
workload
runtime
hardware
traffic
baseline metrics
Step 3 — Discover capabilities
Find:

candidate runtimes
quantization methods
model variants
routing strategies
hardware alternatives
Step 4 — Build candidates
Compose:

model
+
context
+
runtime
+
compute
+
workload
Step 5 — Predict
Estimate:

quality
latency
cost
risk
Step 6 — Experiment
Run controlled tests.

Step 7 — Evaluate
Compare baseline vs candidates.

Step 8 — Verify
Produce evidence-backed claims.

Step 9 — Decide
Select an approved candidate.

Step 10 — Deploy
Shadow → canary → production.

Step 11 — Observe
Capture real workload behavior.

Step 12 — Record experience
Store outcome and consequence.

Step 13 — Extract lesson
Identify:

what worked
what failed
why
Step 14 — Feed the system
Use the lesson in the next optimization run.

This is Horos's first permanent product loop.
64. Complete Full-System Implementation Specification
    This section is the build specification for the complete Horos product represented by the architecture diagram. Every domain below is part of the permanent product surface.
For each domain the implementation must include:

DOMAIN
  ↓
ENTITY MODEL
  ↓
STATE MACHINE
  ↓
COMMANDS
  ↓
QUERIES
  ↓
EVENTS
  ↓
WORKERS
  ↓
PERSISTENCE
  ↓
ARTIFACTS
  ↓
SECURITY
  ↓
OBSERVABILITY
  ↓
TESTS
  ↓
FAILURE / RECOVERY
  ↓
LINEAGE
64.1 Global foundation
Implement the platform substrate used by every other domain:

Repository
Package boundaries
Type system
Schema validation
Database
Migration engine
Object storage
Artifact addressing
Event bus
Job runtime
Scheduler
Cache
Secrets references
Authentication
Authorization
Tenant isolation
Audit
Logging
Tracing
Metrics
Feature/config registry
API gateway
SDK generation
CLI
Administrative control plane
Required foundation contracts
EntityIdentity
EntityVersion
ArtifactRef
LineageRef
Principal
Authority
Policy
ResourceScope
Command
Query
Event
Job
Execution
EvidenceRef
TraceContext
IdempotencyKey
Foundation invariants
Every entity is tenant-scoped where applicable.

Every mutating command is idempotent.

Every command produces auditable history.

Every event has schema version and producer version.

Every artifact can be addressed deterministically.

Every external connector is an adapter.

Every asynchronous job has a durable execution record.

Every execution can be correlated through trace IDs.

64.2 Customer Control Plane
Implement the customer-facing control plane for:

Organizations
Projects
Members
Roles
Service identities
Missions
Connectors
Policies
Budgets
Approvals
Credentials references
Environments
Deployments
Experiments
Systems
Usage
Billing
Evidence
Organization model
Store:

organization_id
name
slug
status
plan
security_profile
created_at
updated_at
Project model
Projects are the primary isolation and configuration boundary inside an organization.

Store:

project_id
organization_id
name
slug
default_region
default_policy_set
artifact_namespace
created_at
updated_at
Customer APIs
Implement:

POST   /v1/organizations
GET    /v1/organizations/{id}
POST   /v1/projects
GET    /v1/projects/{id}
POST   /v1/projects/{id}/members
POST   /v1/projects/{id}/connectors
POST   /v1/projects/{id}/policies
GET    /v1/projects/{id}/usage
GET    /v1/projects/{id}/billing
Customer events
organization.created
project.created
member.granted
connector.created
policy.created
budget.updated
approval.requested
approval.granted
approval.denied
64.3 Mission Runtime
Mission Runtime is the central coordinator of Horos.

Implement:

Input Normalization
Intent Engine
Outcome Intelligence
Outcome Contract
Objective resolution
Constraint resolution
Authority resolution
Budget resolution
Risk resolution
Capability requirements
Reality snapshot acquisition
Execution orchestration
Checkpointing
Pause/resume
Cancellation
Rollback
Mission Result
Mission lifecycle
DRAFT
NORMALIZED
UNDERSTANDING
DISCOVERING
COMPOSING
EVALUATING
EXPERIMENTING
AWAITING_AUTHORITY
READY
EXECUTING
OBSERVING
VERIFYING
COMPLETED
FAILED
ROLLED_BACK
PAUSED
CANCELLED
Mission commands
CreateMission
NormalizeMission
SnapshotReality
DiscoverCapabilities
ComposeCandidate
EvaluateCandidate
StartExperiment
VerifyResult
RequestApproval
ExecuteMission
PauseMission
ResumeMission
CancelMission
RollbackMission
CompleteMission
Mission state requirements
Every mission stores:

mission_id
mission_version
organization_id
project_id
requester
intent
outcome_contract
objective
constraints
authority
risk_policy
budget
required_capabilities
reality_snapshot_id
candidate_system_ids
experiment_ids
deployment_ids
result_id
lineage
status
created_at
updated_at
64.4 Outcome Intelligence
Implement a structured transformation from user intent to measurable outcomes.

Intent
  ↓
Outcome interpretation
  ↓
Objective
  ↓
Constraints
  ↓
Success criteria
  ↓
Evidence requirements
  ↓
Outcome Contract
The Outcome Contract must explicitly define:

objective functions
hard constraints
soft constraints
acceptable regressions
risk limits
budget limits
latency targets
quality targets
verification requirements
required evidence
64.5 Reality Fabric
Reality Fabric is the authoritative representation of the environment in which a system operates.

Implement:

RealitySnapshot
WorldState
SystemState
ModelState
RuntimeState
DeploymentState
WorkloadState
Environment
TelemetryState
CustomerDataState
SensorState
PhysicalState
DigitalEntity
PhysicalEntity
Relationship
Event
Transition
Condition
Reality snapshot
A snapshot must contain:

snapshot_id
captured_at
valid_from
valid_until
source set
state digest
entity references
freshness
confidence
unknown references
lineage
Freshness model
Every observation must track:

observed_at
ingested_at
valid_from
valid_until
freshness_seconds
confidence
source
Reality operations
capture snapshot
refresh state
merge observation
invalidate stale state
resolve conflict
reconcile state
compare snapshots
materialize temporal state
64.6 Context Intelligence
Implement task-specific context construction.

Components:

Retrieval
Memory
Selection
Compression
History
Task Context
Tool Context
Long Context
Context Adaptation
Context Provenance
Each context build must record:

source set
selection policy
ranking
compression policy
ordering
budget
result digest
context version
64.7 World Intelligence
Implement structured world representation.

Domains:

Spatial
Temporal
Objects
Scenes
Geometry
Dynamics
Prediction
Causality
Uncertainty
Future States
World-state records need:

entity
position
orientation
velocity
acceleration
relations
state variables
conditions
temporal validity
uncertainty
source evidence
World Intelligence must distinguish observed, inferred, predicted, simulated, and verified state.

64.8 Unknown Engine
Implement the explicit representation of missing, stale, uncertain, or unresolved information.

Unknown records:

unknown_id
subject
property
missing_type
severity
impact
source_state
last_known_value
freshness
confidence
resolution_status
required_evidence
Unknown types:

MISSING
STALE
CONFLICTING
UNCERTAIN
UNOBSERVED
UNRESOLVED
64.9 Knowledge Gap Engine
Implement:

What is known?
What is unknown?
What matters?
What blocks the objective?
What evidence would reduce uncertainty?
What acquisition action is cheapest / safest / most informative?
Knowledge Gap records connect:

unknown
objective
hypothesis
required evidence
candidate experiment
expected information gain
cost
risk
priority
64.10 Active Reality Learning
Implement the loop:

Observe
  ↓
Acquire
  ↓
Experiment
  ↓
Ground Truth
  ↓
Reality Knowledge
Observation sources:

APIs
Databases
Telemetry
Sensors
Devices
Customer data
Trajectories
Environment measurements
Execution outcomes
Ground truth forms:

Real outcome
Verified label
Physical fact
64.11 Hypothesis Engine
Implement competing explanations rather than a single narrative.

Each hypothesis contains:

hypothesis_id
claim
prior
supporting_evidence
contradicting_evidence
predictions
assumptions
status
confidence
lineage
Statuses:

PROPOSED
TESTABLE
SUPPORTED
WEAKENED
REFUTED
SUPERSEDED
64.12 Prediction Engine
Implement prediction records with uncertainty.

Inputs:

world state
historical observations
model state
environment
workload
hypothesis
Outputs:

predicted state
probability/confidence
intervals where available
assumptions
provenance
expiry
64.13 Capability Fabric
Capability Fabric is the complete inventory and composition system for everything an intelligence system can use.

Capability classes:

Model
Dataset
Tool
Skill
API
Code runtime
Adapter
Simulator
Verifier
Environment
Compute resource
Hardware
Every capability includes:

capability_id
version
inputs
outputs
modalities
operations
latency profile
resource profile
dependencies
location
license
provenance
security posture
composability
evidence
Capability discovery
Implement search and graph traversal over capabilities.

Compatibility engine
Check:

input/output type compatibility
modality compatibility
resource compatibility
runtime compatibility
license compatibility
security compatibility
latency compatibility
hardware compatibility
environment compatibility
Capability gap engine
Output:

weakness
root cause
priority
candidate remedy
required evidence
64.14 Improvement Plan Engine
Translate capability gaps into concrete interventions across:

Data
Model
Post-training
Context
Runtime
Compute
Hardware
Environment
Evaluation
Verification
Each improvement plan contains:

target capability
gap
proposed changes
expected impact
target evidence
estimated cost
risk
dependencies
64.15 System Composer
The composer constructs candidate systems from:

MODEL
+
DATA
+
CONTEXT
+
TOOLS
+
RUNTIME
+
COMPUTE
+
ENVIRONMENT
Every candidate stores:

candidate_id
component versions
composition graph
assumptions
dependencies
risks
predicted metrics
evidence requirements
objective alignment
64.16 Open-Weight Model Ecosystem
Implement sources:

Hugging Face
Customer model artifacts
Local registry
All sources enter through adapters.

The internal model representation must not depend on upstream repository formats.

64.17 Model Registry
Implement:

Model
ModelVersion
Artifact
ArtifactDigest
Architecture
Configuration
Tokenizer
License
Dependency
Provenance
SecurityStatus
CapabilityProfile
Immutable model identity
Identity derives from:

source revision
+
artifact digest
+
resolved dependency graph
Model security checks
artifact integrity
source provenance
license constraints
dependency integrity
serialization safety
runtime compatibility
hardware compatibility
capability claims
observed behavior
64.18 Universal Model IR
Universal Model IR is the normalized computational representation between model ingestion and hardware/runtime execution.

Represent:

graph
operators
tensors
shapes
dtypes
layout
memory constraints
control flow
attention patterns
state
metadata
capability annotations
Required operations:

parse
normalize
validate
lower
optimize
serialize
diff
inspect
64.19 Model Compiler
Compiler pipeline:

Model artifact
  ↓
Normalization
  ↓
Universal Model IR
  ↓
Computation Graph
  ↓
Graph Optimization
  ↓
Operator Optimization
  ↓
Memory Optimization
  ↓
Lowering
  ↓
Kernel selection/generation
  ↓
Runtime package
  ↓
Benchmark
  ↓
Verified artifact
64.20 Kernel Engine
Implement:

operator graph
kernel generation
kernel search
autotune
compile
benchmark
verification
kernel registry
Kernel evidence must include:

operator signature
input shapes
dtypes
hardware
compiler version
flags
benchmark workload
latency
throughput
memory
correctness result
64.21 Model Capability Profiler
Profile models across:

reasoning
coding
vision
multimodal
domain tasks
physical tasks
tool use
long-context behavior
resource requirements
latency
memory
throughput
uncertainty
failure modes
Produce versioned empirical capability evidence.

64.22 Frontier Research Fabric
Implement research domains:

Model Research
Data Research
Training Research
Post-training Research
Evaluation Research
Inference Research
Test-time Research
Compute Research
World Research
Each research object must include:

research proposal
question
hypothesis
literature/research evidence
implementation branch
baseline
experiment configuration
results
statistical comparison
artifact lineage
research conclusion
published research knowledge
64.23 Autonomous Research
Autonomous research executes:

HYPOTHESIS
→ IMPLEMENTATION
→ EXPERIMENT
→ ANALYSIS
→ RESULT
→ RESEARCH KNOWLEDGE
Autonomous research must remain bounded by:

authorized repositories
compute budget
execution budget
network policy
credential scope
resource policy
approval policy
safety policy
64.24 Intelligence Development
Implement the complete development stack:

Data Discovery
Data Curation
Filtering
Deduplication
Quality
Failure Mining
Mixture Construction
Curriculum
Synthetic Data
Pretraining
Continued Training
Distributed Training
Fine-tuning
Adapters
Domain Adaptation
Task Adaptation
Multimodal Adaptation
Contextual Adaptation
Skill Adaptation
64.25 Active Data Engine
Data selection must be driven by:

capability gaps
failure data
coverage gaps
rare states
long-tail behavior
regressions
sample importance
data valuation
mixture optimization
Outputs:

training examples
evaluation examples
failure sets
coverage sets
new scenarios
64.26 Ground Truth Factory
Sources:

Human Feedback
Customer Outcomes
Verifiers
Weak Supervision
Synthetic Labels
Failure Labels
Ground truth must track:

source
labeling method
confidence
review state
version
provenance
64.27 Post-Training Engine
Implement extensible operators:

SFT
LoRA
QLoRA
DPO
GRPO
RFT
Preference Optimization
Reward Modeling
Verifier Training
Skill Learning
Self-improvement
Every training run records:

base model
teacher model if applicable
dataset versions
sampling strategy
hyperparameters
compute
runtime
seed
checkpoints
metrics
result artifacts
lineage
64.28 Distillation
Track:

teacher
student
distillation objective
dataset
sampling strategy
loss configuration
runtime
result
capability delta
64.29 Evaluation Fabric
Separate:

Capability Evaluation
Behavior Evaluation
System Evaluation
Capability domains:

reasoning
coding
vision
multimodal
domain
physical
specialized
Behavior domains:

trajectory
tool use
long horizon
safety
robustness
recovery
adversarial behavior
System domains:

quality
latency
cost
throughput
reliability
energy
mission success
Every evaluation is versioned and reproducible.

64.30 Evaluator Fabric
Implement:

Judges
Critics
Graders
Reward models
Classifiers
Human evaluation
Domain evaluators
Evaluator versions are immutable and lineage-linked.

64.31 Verifier Fabric
Verifier classes:

Task Verifier
Trajectory Verifier
Domain Verifier
Safety Verifier
Formal Verifier
Output Verifier
A verifier returns a structured verification result with:

claim_id
verifier_id
criteria
inputs
evidence
result
confidence
reason
64.32 Evaluation Integrity
Implement:

contamination detection
data leakage detection
benchmark overfitting detection
gaming detection
holdouts
hidden tests
judge drift detection
bias analysis
reward-hack detection
independent validation
64.33 System Search
System Search explores the full configuration space:

Model
Data
Context
Runtime
Kernel
Hardware
Workload
Pipeline:

Search Space
→ Candidate
→ Predict
→ Experiment
→ Measure
→ Verify
→ Keep / Discard
64.34 Workload Intelligence + Replay
Capture workload shape:

input length
output length
task type
tool trajectory
concurrency
batching
burstiness
request distribution
memory
GPU utilization
failures
resource usage
Implement deterministic production replay where customer policy permits it.

64.35 Multi-Objective Optimization
Objectives:

quality
latency
cost
throughput
reliability
safety
energy
mission success
Support:

hard constraints
soft constraints
Pareto frontier
mission-specific utility
acceptable regression thresholds
64.36 Model / Runtime / Hardware Co-Design
Optimize jointly:

MODEL
RUNTIME
HARDWARE
Model dimensions:

architecture
dimensions
precision
sparsity
attention
memory
Runtime dimensions:

kernels
compiler
scheduler
serving
execution graph
routing
batching
caching
Hardware dimensions:

GPU
CPU
TPU
ASIC
NPU
memory
interconnect
bandwidth
power
thermal
64.37 Inference Optimizer
Implement:

dynamic batching
scheduling
autoscaling
disaggregation
GPU pooling
task routing
difficulty estimation
specialist routing
mixture routing
KV cache
prefix cache
memory placement
64.38 Adaptive Reasoning Engine
Implement compute adaptation:

EASY
→ low compute

MEDIUM
→ moderate compute

HARD
→ search/reasoning

VERY HARD
→ stronger model / more compute

VERIFY / ROUTE
The decision function must account for:

quality
compute
cost
latency
verification confidence
64.39 Compute Intelligence
Compute selection considers:

capacity
availability
utilization
memory
bandwidth
power
thermal
price
failure
recovery
Placement considers:

GPU locality
memory locality
bandwidth
power
thermal
price
failure domain
recovery domain
Topology considers:

network
interconnect
parallelism
64.40 Model Economics
Track:

training token cost
compute cost
data cost
lifecycle cost
inference input token cost
inference output token cost
task cost
request cost
GPU cost
energy cost
successful-task cost
Economics are evidence-backed measurements, not static pricing assumptions.

64.41 Counterfactual Engine
Evaluate hypothetical changes across:

model
architecture
quantization
model size
routing
data
sampling
training
dataset
kernel
scheduling
serving
compiler
hardware
workload
traffic
context
environment
Every counterfactual must distinguish:

predicted
historical
observed
simulated
unknown
64.42 Causal Experiment Engine
Every causal experiment contains:

hypothesis
baseline
variables
controls
candidate interventions
workload
budget
risk
expected gain
Execution modes:

simulation
sandbox
real test
shadow
canary
production
Result model:

before
change
after
causal attribution
quality delta
latency delta
cost delta
reason
64.43 Synthetic Reality / World Lab
Implement generation of:

world states
environments
workloads
conditions
future trajectories
possible outcomes
edge cases
rare failures
adversarial scenarios
The lab must attach scenario provenance and clearly mark simulation evidence.

64.44 RL Environment Factory
Implement:

task generation
environment generation
state space
scenario generation
failure injection
goals
rewards
curriculum
rollouts
actions
outcomes
verification
64.45 Synthetic Data
Generate:

text
image
video
3D
sensor
trajectory
action
Every synthetic artifact tracks:

generator
seed
source configuration
model version
scenario version
post-processing
verification status
64.46 SIM2REAL Gap Engine
Pipeline:

SIMULATION RESULT
→ REAL RESULT
→ DIFFERENCE
→ UNKNOWN REAL-WORLD FACTOR
→ NEW SCENARIO / DATA
→ NEW TRAINING
→ REAL-WORLD TRANSFER
→ VERIFICATION
→ WORLD KNOWLEDGE
Track gap dimensions:

perception
dynamics
time delay
sensor noise
actuation
geometry
environmental variation
failure behavior
64.47 Decision Engine
Decision combines:

objective value
quality
cost
latency
risk
uncertainty
authority
budget
policy
Outputs:

ALLOW
DENY
REQUIRES_APPROVAL
Or for system choice:

SELECT_CANDIDATE
REJECT_CANDIDATE
REQUEST_MORE_EVIDENCE
64.48 Governance / Authority
Policies cover:

budget
region
license
hardware
provider
scope
autonomy
approval
safety
credentials
device access
API access
Capabilities are never permissions.

Permissions are explicit.

64.49 Execution Boundary
Every consequential execution must follow:

Discover capability
→ resolve authority
→ resolve credential
→ validate preconditions
→ recheck state
→ execute
→ capture output
→ verify postconditions
→ capture consequence
→ emit evidence
64.50 Deployment Runtime
Targets:

cloud
Kubernetes
bare metal
serverless GPU
dedicated GPU
edge/device
Deployment states:

PLANNED
VALIDATING
SHADOW
CANARY
ACTIVE
DRAINING
ROLLED_BACK
FAILED
Deployment manifests must specify:

system version
runtime version
model versions
artifact refs
hardware requirements
environment variables by secret reference
network policy
resource limits
health checks
rollback target
64.51 Physical Execution Fabric
Implement adapters for:

Camera
LiDAR
IMU
Audio
Thermal
Telemetry
Motion
Manipulation
Control
Force
Robots
Machines
Vehicles
Industrial systems
The execution contract must remain substrate-neutral.

64.52 Hardware-in-the-Loop
Implement:

device registration
hardware capability description
firmware/version tracking
sensor ingestion
actuator commands
safety limits
clock synchronization
experiment execution
measurement capture
64.53 Managed Inference
Managed inference combines:

model
workload
constraints
runtime
hardware
Output:

optimized inference system
verified performance envelope
production API configuration
64.54 Horos Model API
The model API exposes:

inference
streaming
batch inference
usage metering
observability
model version selection
system version selection
policy enforcement
The API must record:

request ID
system version
model version
workload signature
runtime version
hardware
latency
usage
cost
result metadata
observation references
64.55 Observation Fabric
Pipeline:

Signal
→ Normalize
→ Observation
→ Measurement
Observation classes:

Model Observation
System Observation
Reality Observation
Model observations
outputs
quality
uncertainty
reasoning behavior
tool use
failures
drift
System observations
latency
throughput
utilization
memory
GPU/CPU
network
cost
Reality observations
sensors
environment
physical state
video
telemetry
workload
consequences
64.56 Evidence Fabric
Every evidence record contains:

evidence_id
source
timestamp
artifact
execution
observation
experiment
deployment
environment
version
model
data
result
provenance
integrity digest
64.57 Replay / Lineage
Replay must reconstruct:

what ran
where it ran
which versions ran
which inputs were used
what state was observed
what policy was active
what result occurred
what evidence was produced
Lineage graph must answer:

What produced this?
Which data produced this?
Which system version used it?
What changed afterwards?
Which later system learned from it?
64.58 Claim Engine
Claims are explicit statements made by the system.

A claim contains:

claim_id
statement
subject
predicate
object
evidence refs
support criteria
status
confidence
created_by
version
64.59 Verification Engine
Verification establishes whether a claim is supported by defined evidence criteria.

Result states:

UNVERIFIED
SUPPORTED
VERIFIED
REJECTED
EXPIRED
SUPERSEDED
64.60 Consequence Engine
Measure:

BEFORE
→ ACTION
→ AFTER
Consequences include:

quality
latency
cost
state changes
physical consequences
safety consequences
mission outcome
64.61 Mission Result
Mission Result must answer:

WHAT CHANGED?
WHAT PROOF EXISTS?
WHAT DID NOT CHANGE?
WHAT FAILED?
WHAT REMAINS UNKNOWN?
WHAT SHOULD HAPPEN NEXT?
It must reference all relevant:

candidate versions
evaluations
experiments
deployments
observations
evidence
verification results
consequences
64.62 Experience Engine
Experience records connect:

Mission
Reality
Model
Training
Runtime
Experiment
Decision
Action
Observation
Evidence
Verification
Result
The experience record is immutable and append-only.

64.63 Failure Mining
Mine:

failures
drift
regressions
anomalies
rare events
edge cases
root causes
Failure records link to:

system version
workload
reality state
evidence
consequence
lesson
64.64 Lesson Engine
Generate:

causal lessons
trade-offs
reusable patterns
preventive controls
corrections
new tests
Lessons must identify their supporting evidence and generalization boundary.

64.65 Teaching Fabric
Teaching targets:

Model Teaching
Runtime Teaching
System Teaching
Model teaching:

fine-tune
LoRA
RL
distillation
adaptation
retraining
reward
world-model learning
Runtime teaching:

routing
serving
inference strategy
verifier strategy
context strategy
tool policy
caching
System teaching:

configuration
deployment
compute
placement
hardware
data path
environment
64.66 Intelligence Evolution
Evolution loop:

New Model / Version
→ Evaluate
→ Shadow
→ Benchmark
→ Canary
→ Promote
→ Production Intelligence
→ Better Behavior
→ Better World Understanding
→ Better Reality Model
→ Next Mission
Evolution must preserve complete version lineage and rollbackability.

64.67 Usage / Metering
Meter every billable or capacity-relevant operation:

inference
compute
storage
training
experiments
evaluations
simulation
physical execution
connector operations
Meters must reference:

organization
project
mission
execution
system version
resource
quantity
unit
price source
timestamp
64.68 Billing / Pricing
Pricing engine consumes immutable usage events.

Separate:

raw usage
normalized usage
price rules
invoice lines
credits
adjustments
invoice state
Never derive billing from mutable dashboard counters.

64.69 Connectors
Connector types:

GitHub
APIs
cloud providers
databases
sensors
devices
environments
model registries
object stores
telemetry systems
Every connector needs:

adapter
credential reference
capability declaration
permissions
health state
sync state
rate limits
retry strategy
audit trail
64.70 Export / Import
The Horos System Package must contain:

system definition
model references/data artifacts as permitted
runtime configuration
evaluation definitions
verifier definitions
policies
deployment manifests
provenance
lineage
proof/evidence references
Import must preserve identity/lineage semantics and detect conflicts.

64.71 Customer Isolation
Isolation boundaries:

organization
project
artifact namespace
data access
model access
experiment access
runtime access
connector access
credentials
billing
logs
telemetry
Cross-tenant access must be impossible by default.

64.72 Security Model
Implement:

authentication
authorization
role-based access
resource-scoped permissions
service identities
secret references
credential rotation
audit
artifact integrity
dependency verification
network policy
sandboxing
execution limits
64.73 Reproducibility System
Every execution must capture:

code revision
configuration
model versions
dataset versions
runtime versions
hardware
environment
random seeds
dependencies
commands
outputs
logs
metrics
artifacts
A reproducibility bundle must be reconstructable from stored references.

64.74 Experiment Manifest
Canonical manifest fields:

experiment_id
hypothesis
objective
controls
candidate_system
model_versions
dataset_versions
workload
reality_snapshot
runtime
compute
hardware
environment
seed
budget
risk policy
success criteria
verification criteria
artifact outputs
64.75 Research Knowledge Store
Research knowledge includes:

question
hypothesis
method
experiment
analysis
result
limitations
confidence
evidence
reusable implication
Research knowledge must be queryable by future system composition.

64.76 Operational Observability
API observability:

request rate
latency
errors
saturation
policy failures
auth failures
Worker observability:

queue depth
job duration
retry count
failure class
resource usage
Model observability:

quality
latency
cost
uncertainty
drift
failure rate
System observability:

deployment health
runtime health
GPU/CPU
memory
network
availability
Evidence observability:

missing evidence
stale evidence
verification failure
lineage breaks
64.77 Logging
Logs must be:

structured
versioned
tenant-aware
trace-correlated
privacy-aware
redaction-aware
Never log secrets or uncontrolled customer payloads.

64.78 Tracing
Trace context follows:

API request
→ mission
→ job
→ worker
→ runtime execution
→ model invocation
→ experiment
→ observation
→ verification
Distributed spans must reference durable execution IDs.

64.79 Testing System
Testing layers:

unit
contract
integration
reproducibility
end-to-end
security
chaos
hardware-in-the-loop
simulation-vs-real validation
Every permanent domain must have tests for:

normal path
invalid input
invalid state transition
concurrency
retry
idempotency
partial failure
authorization
lineage
versioning
rollback
65. Complete Domain-by-Domain Dependency Contract
The domains below are all permanent. Dependencies indicate what information or capability must be available before a specific operation can execute; they do not indicate product scope.

65.1 Identity foundation
Provides:

organization
project
principal
service identity
role
permission
resource scope
Consumed by every customer-scoped domain.

65.2 Artifact foundation
Provides:

content-addressed storage
artifact metadata
integrity digests
artifact lifecycle
retention
immutability
Consumed by models, datasets, evaluations, experiments, evidence, exports, deployments, and research.

65.3 Version foundation
Provides:

immutable version IDs
parent lineage
diff metadata
version graph
promotion state
rollback reference
Consumed by every mutable conceptual object.

65.4 Event foundation
Provides:

durable event schema
producer identity
schema version
causation ID
correlation ID
aggregate ID
ordering metadata
Consumed by control plane, billing, experience, observability, and asynchronous orchestration.

65.5 Job foundation
Provides:

job lifecycle
queueing
retry
heartbeat
lease
cancellation
execution metadata
result artifact references
Consumed by training, evaluation, experiment, simulation, compilation, deployment, replay, and research.
66. Canonical Full-Product Execution Graph
    The complete product execution path is:
CUSTOMER / SYSTEM EVENT
        ↓
CUSTOMER CONTROL PLANE
        ↓
MISSION RUNTIME
        ↓
INPUT NORMALIZATION
        ↓
INTENT ENGINE
        ↓
OUTCOME INTELLIGENCE
        ↓
OUTCOME CONTRACT
        ↓
REALITY FABRIC
        ↓
CONTEXT INTELLIGENCE
        ↓
WORLD INTELLIGENCE
        ↓
UNKNOWN ENGINE
        ↓
KNOWLEDGE GAP ENGINE
        ↓
ACTIVE REALITY LEARNING
        ↓
REALITY KNOWLEDGE
        ↓
CAPABILITY INTELLIGENCE
        ↓
CAPABILITY FABRIC
        ↓
CAPABILITY DISCOVERY
        ↓
COMPATIBILITY ENGINE
        ↓
CAPABILITY GAP ENGINE
        ↓
IMPROVEMENT PLAN
        ↓
SYSTEM COMPOSER
        ↓
CANDIDATE SYSTEM
        ↓
MODEL REGISTRY
        ↓
MODEL NORMALIZATION
        ↓
UNIVERSAL MODEL IR
        ↓
MODEL / RUNTIME / HARDWARE OPTIMIZATION
        ↓
MODEL CAPABILITY PROFILING
        ↓
FRONTIER RESEARCH / INTELLIGENCE DEVELOPMENT
        ↓
DATA ENGINE
        ↓
ACTIVE DATA ENGINE
        ↓
GROUND TRUTH FACTORY
        ↓
POST-TRAINING
        ↓
DISTILLATION
        ↓
MODEL VERSION
        ↓
EVALUATION FABRIC
        ↓
VERIFIER FABRIC
        ↓
EVALUATION INTEGRITY
        ↓
SYSTEM SEARCH
        ↓
WORKLOAD REPLAY
        ↓
COUNTERFACTUAL ANALYSIS
        ↓
CAUSAL EXPERIMENT
        ↓
SYNTHETIC REALITY / WORLD LAB
        ↓
RL ENVIRONMENT
        ↓
SIM2REAL
        ↓
DECISION ENGINE
        ↓
GOVERNANCE / AUTHORITY
        ↓
EXECUTION BOUNDARY
        ↓
DEPLOYMENT RUNTIME
        ↓
MANAGED INFERENCE
        ↓
HOROS MODEL API
        ↓
DIGITAL / EDGE / PHYSICAL EXECUTION
        ↓
OBSERVATION FABRIC
        ↓
MEASUREMENT
        ↓
EVIDENCE FABRIC
        ↓
REPLAY / LINEAGE
        ↓
CLAIM ENGINE
        ↓
VERIFICATION ENGINE
        ↓
CONSEQUENCE ENGINE
        ↓
MISSION RESULT
        ↓
EXPERIENCE ENGINE
        ↓
FAILURE MINING
        ↓
LESSON ENGINE
        ↓
TEACHING FABRIC
        ↓
INTELLIGENCE EVOLUTION
        ↓
NEXT MISSION
Every major architecture arrow must have a corresponding software contract.
67. Domain Contract Matrix
    For every domain, maintain these artifacts in the repository:
/domain/<domain>/model
/domain/<domain>/commands
/domain/<domain>/queries
/domain/<domain>/events
/domain/<domain>/policies
/domain/<domain>/services
/domain/<domain>/workers
/domain/<domain>/repositories
/domain/<domain>/adapters
/domain/<domain>/schemas
/domain/<domain>/tests
/domain/<domain>/docs
Each domain document must define:

purpose
inputs
outputs
state
invariants
authority requirements
failure semantics
retry semantics
lineage requirements
observability
security boundary
68. Required State Machines
Implement explicit state machines rather than free-form status strings for:

Mission
Experiment
Evaluation Run
Training Run
Research Run
Deployment
Execution
Observation ingest
Verification
Claim
System Version promotion
Model Version promotion
Artifact import
Connector sync
Billing invoice
Export Package
Import Package
State transitions must be:

validated
atomic
idempotent
audited
version-aware
policy-aware
69. Required Cross-Cutting Invariants
These invariants apply to the entire system.

Identity
No name can substitute for identity.

Immutability
Historical versions are never overwritten.

Evidence
A claim cannot become VERIFIED without qualifying evidence.

Reality
Consequential actions must recheck current state.

Authority
Capability discovery never grants permission.

Simulation
Simulation output is marked simulated until independently verified.

Lineage
Derived artifacts preserve parent lineage.

Reproducibility
Important executions can be reconstructed.

Isolation
Cross-tenant access is denied by default.

Rollback
Production-changing operations have recovery semantics.

Cost
Resource use is metered from immutable execution events.

Uncertainty
Predictions and inferred state retain uncertainty and provenance.
70. Repository Organization for the Full Product
    Use a monorepo with permanent domain boundaries and specialized workers.
/apps
  /control-plane
  /gateway
  /model-api
  /admin

/packages
  /domain-core
  /identity
  /missions
  /outcomes
  /reality
  /context
  /world
  /unknowns
  /knowledge-gaps
  /capabilities
  /models
  /model-ir
  /compiler
  /kernels
  /profiling
  /research
  /data
  /training
  /post-training
  /evaluation
  /verification
  /optimization
  /workloads
  /experiments
  /simulation
  /sim2real
  /decision
  /governance
  /execution
  /deployment
  /physical
  /inference
  /observation
  /evidence
  /claims
  /experience
  /lessons
  /teaching
  /evolution
  /billing
  /connectors
  /security
  /artifacts
  /lineage
  /events
  /telemetry
  /sdk

/workers
  /mission-worker
  /ingestion-worker
  /model-worker
  /compile-worker
  /kernel-worker
  /training-worker
  /evaluation-worker
  /verification-worker
  /experiment-worker
  /search-worker
  /simulation-worker
  /deployment-worker
  /observation-worker
  /experience-worker
  /teaching-worker
  /research-worker
  /billing-worker

/infra
  /database
  /queues
  /storage
  /observability
  /deployment
  /security

/schemas
  /api
  /events
  /artifacts
  /experiments
  /telemetry

/tests
  /contract
  /integration
  /e2e
  /reproducibility
  /security
  /chaos
  /hil
No domain package may silently reach into another domain's persistence implementation.
71. API Surface for the Complete Product
    The public API should be organized around permanent domains.
/v1/organizations
/v1/projects
/v1/missions
/v1/outcomes
/v1/reality
/v1/world
/v1/context
/v1/unknowns
/v1/knowledge-gaps
/v1/capabilities
/v1/models
/v1/model-versions
/v1/datasets
/v1/training-runs
/v1/post-training-runs
/v1/evaluations
/v1/verifiers
/v1/experiments
/v1/search
/v1/workloads
/v1/replays
/v1/counterfactuals
/v1/deployments
/v1/executions
/v1/physical
/v1/inference
/v1/observations
/v1/evidence
/v1/claims
/v1/verification
/v1/consequences
/v1/experience
/v1/lessons
/v1/teaching
/v1/evolution
/v1/research
/v1/connectors
/v1/policies
/v1/usage
/v1/billing
/v1/packages
API rules:

explicit versioning
cursor pagination
idempotency keys
structured errors
resource version headers
optimistic concurrency
async operation resources
webhooks/events where appropriate
72. Event Taxonomy
Events must exist for all meaningful state changes.

Examples:

mission.created
mission.normalized
mission.reality_snapshotted
mission.capabilities_discovered
mission.candidate_created
mission.experiment_started
mission.experiment_completed
mission.verified
mission.deployed
mission.observed
mission.completed

model.registered
model.version_created
model.profiled
model.promoted

artifact.imported
artifact.verified
artifact.invalidated

training.started
training.completed
post_training.completed

evaluation.started
evaluation.completed
verification.completed

search.started
search.candidate_generated
search.candidate_verified
search.frontier_updated

experiment.started
experiment.completed

simulation.started
simulation.completed
sim2real.updated

deployment.created
deployment.shadowed
deployment.canaried
deployment.promoted
deployment.rolled_back

observation.received
measurement.created
evidence.created
claim.created
claim.verified
consequence.recorded

experience.created
failure.detected
lesson.created
teaching.started
teaching.completed

evolution.candidate_created
evolution.promoted

usage.recorded
invoice.created
credit.applied
73. Durable Artifact Strategy
Artifacts include:

model weights
checkpoints
datasets
benchmark sets
evaluation outputs
experiment logs
compiled runtimes
kernel binaries
simulation scenes
trajectories
sensor data
videos
telemetry
reports
evidence bundles
system packages
research artifacts
Every artifact requires:

content digest
media type
size
location
created by
created at
retention class
security classification
lineage
74. Complete Security Boundary
Security is applied at:

API
Domain command
Repository
Artifact
Connector
Worker
Runtime
Device
Export
Import
Billing
Telemetry
High-risk operations require:

explicit authority
fresh policy evaluation
fresh state check
preconditions
resource limits
postcondition verification
complete audit
75. Complete Failure Model
Every asynchronous and consequential subsystem must handle:

validation failure
authorization failure
stale state
resource exhaustion
timeout
network failure
provider failure
artifact corruption
schema incompatibility
partial execution
concurrent modification
hardware failure
sensor failure
model failure
verifier failure
observability failure
Failure handling must specify:

retryable?
retry budget
backoff
safe checkpoint
compensation action
rollback action
operator intervention
final error state
76. Full Rollback Model
Rollback targets include:

model version
system version
runtime version
configuration
deployment
policy
connector configuration
teaching result
Rollback must itself produce:

audit event
new system version or deployment version
reason
initiator
result
evidence
77. Full Data Governance
Implement:

classification
retention
deletion policies
customer ownership
artifact ownership
lineage
consent/authorization markers
redaction
export rules
cross-environment transfer rules
Training and experience data must preserve provenance and customer-isolation rules.
78. Full Build Acceptance Standard
    The full product is considered architecturally implemented only when every architecture domain has:
79. concrete domain model
80. durable storage
81. API or internal contract
82. event model
83. worker/execution path where needed
84. lineage
85. authorization
86. audit
87. observability
88. failure/recovery semantics
89. tests
90. documentation
    The product-level acceptance criterion is not the completion of a specific feature. It is the ability of the full Horos system to execute and close the complete intelligence loop.
91. Full-System Completion Criterion
    The definitive product loop is:
MISSION
↓
REALITY
↓
UNKNOWN
↓
KNOWLEDGE GAP
↓
KNOWLEDGE ACQUISITION
↓
GROUND TRUTH
↓
REALITY KNOWLEDGE
↓
CAPABILITY DISCOVERY
↓
CAPABILITY GAP
↓
IMPROVEMENT PLAN
↓
SYSTEM COMPOSITION
↓
MODEL / DATA / CONTEXT / TOOL / RUNTIME / COMPUTE / ENVIRONMENT
↓
PREDICTION
↓
SYSTEM SEARCH
↓
COUNTERFACTUALS
↓
CAUSAL EXPERIMENTS
↓
SIMULATION / SANDBOX / REAL TEST
↓
EVALUATION
↓
VERIFICATION
↓
DECISION
↓
AUTHORITY
↓
DEPLOYMENT
↓
MANAGED INFERENCE / EDGE / PHYSICAL EXECUTION
↓
OBSERVATION
↓
MEASUREMENT
↓
EVIDENCE
↓
CLAIM
↓
VERIFICATION
↓
CONSEQUENCE
↓
MISSION RESULT
↓
EXPERIENCE
↓
FAILURE MINING
↓
LESSON
↓
TEACHING
↓
NEW INTELLIGENCE
↓
EVOLUTION
↓
NEXT MISSION
If any link is missing, Horos is not the complete system described by the architecture.
80. Autonomous Research
    Autonomous research loop:
HYPOTHESIS
 ↓
IMPLEMENTATION
 ↓
EXPERIMENT
 ↓
ANALYSIS
 ↓
RESULT
 ↓
RESEARCH KNOWLEDGE
 ↓
FUTURE SYSTEM
Autonomous research must never receive unrestricted production authority.

Every run is bounded by:

compute budget
data access
tool access
network policy
filesystem policy
deployment policy
approval policy
81. Compute Intelligence
Compute intelligence chooses:

hardware
location
placement
topology
runtime
parallelism
resource limits
Inputs:

capacity
availability
utilization
memory
bandwidth
power
thermal
price
failure risk
recovery
Output:

ComputeProfile
A compute profile becomes part of a reproducible system version.
82. Runtime Intelligence
    Runtime decisions include:
batching
scheduling
routing
caching
memory placement
model loading
specialist selection
adaptive compute
The runtime becomes a versioned capability.
83. Pricing Model
    Customer-facing pricing should be based on measurable usage.
Possible units:

request
token
task
compute second
GPU second
managed system
Internally maintain:

actual provider cost
actual compute
actual energy
actual storage
actual network
The optimizer can use internal unit economics to search for lower customer cost.
84. Export Package
    Every verified system can become a portable package.
Package contains:

system version
model references / authorized artifacts
runtime config
evaluation definitions
verifier definitions
policies
deployment manifests
provenance
lineage
evidence
hardware profile
dependency lock
Targets:

cloud
on-prem
air-gapped
edge
customer infrastructure
85. Customer Experience
The first experience should be:

Connect model
     ↓
Connect workload
     ↓
Define objective
     ↓
Run baseline
     ↓
Let Horos search
     ↓
Review candidates
     ↓
Verify
     ↓
Deploy
     ↓
Observe
     ↓
Continue optimizing
The customer should not need to understand Horos's entire architecture.

Complexity stays inside the system.
86. API Surface
    Core APIs:
POST   /v1/organizations
POST   /v1/projects

POST   /v1/missions
GET    /v1/missions/:id
POST   /v1/missions/:id/pause
POST   /v1/missions/:id/resume
POST   /v1/missions/:id/cancel

POST   /v1/models
POST   /v1/models/:id/versions
GET    /v1/models/:id/versions

POST   /v1/workloads
POST   /v1/workloads/:id/replays

POST   /v1/evaluations
POST   /v1/evaluations/:id/run

POST   /v1/experiments
POST   /v1/experiments/:id/run

GET    /v1/evidence/:id
POST   /v1/claims
POST   /v1/claims/:id/verify

POST   /v1/system-candidates
POST   /v1/system-versions

POST   /v1/deployments
POST   /v1/deployments/:id/promote
POST   /v1/deployments/:id/rollback

GET    /v1/observations
GET    /v1/experience
GET    /v1/lessons

POST   /v1/model-api/:system_version_id/infer
87. SDK
TypeScript SDK should wrap:

missions
models
datasets
experiments
evaluations
deployments
evidence
observations
model API
The SDK must be generated from versioned API contracts where possible.
88. Testing Strategy
    Unit
    Test:
state transitions
validation
optimization rules
policy checks
lineage rules
version immutability
Contract
Test:

API schema
event schema
worker inputs/outputs
adapter interfaces
Integration
Test:

DB
object store
queue
workers
model registry
deployment adapter
Reproducibility
Run same manifest twice and compare expected deterministic outputs.

End-to-end
Test the full canonical mission.

Security
Test:

tenant isolation
permission escalation
credential leakage
unsafe execution
idempotency
audit integrity
Chaos
Later test:

worker crash
queue duplication
deployment failure
network failure
GPU unavailable
stale state
partial result
89. Definition of Done for Any New Capability
A new capability is not finished when the code runs.

It requires:

domain object
identity
versioning
schema
API/contract
authorization
events
persistence
artifact handling if needed
audit
observability
tests
reproducibility
documentation
lineage
failure handling
rollback/recovery strategy
For consequential capabilities also require:

policy
authority
state recheck
evidence
verification
90. Engineering Rules
Never put all business logic into an agent.

Never use unversioned artifacts.

Never overwrite historical system state.

Never treat capability as permission.

Never treat simulation as proof.

Never deploy without rollback.

Never execute against stale reality.

Never make hidden state-changing mutations.

Never allow undocumented side effects.

Never couple the core domain to one provider.

Never allow cache to become the source of truth.

Never let a model name substitute for immutable identity.

Never make a metric without provenance.

Never add a new optimization dimension without measurement.

Never create a research result without reproducibility metadata.

Never let autonomous research inherit production privileges.

Never store secrets inside artifacts or logs.

Never remove lineage during export.

Never change an experiment after it starts; create a new version.

Prefer boring infrastructure when the domain abstraction is the differentiator.
91. Anti-Patterns to Avoid
    Giant agent service
    Bad:
"one agent decides everything"
Good:

mission coordinator
+
typed domain services
+
bounded workers
+
policy engine
Microservices too early
Bad:

30 independent deployables before the core loop exists
Good:

modular monolith
+
stable module boundaries
+
workers where compute isolation is needed
Generic JSON everywhere
Bad:

metadata JSON blob
Good:

typed domain model
+
controlled extension fields
Benchmark dashboard without lineage
Bad:

accuracy: 94.2
Good:

94.2
+
model version
+
data version
+
protocol
+
runtime
+
hardware
+
evidence
92. CI/CD
Pull request checks:

lint
typecheck
unit tests
contract tests
migration validation
security checks
build
Main branch:

integration tests
container build
artifact signing
staging deployment
smoke tests
Production:

approval
migration safety check
deployment
health check
canary
promotion
rollback guard
93. Migration Rules
Database changes:

expand
migrate
backfill
validate
contract
Never perform destructive changes without compatibility planning.

Domain history must remain queryable.
94. Environment Layout
    local
    dev
    staging
    production
    customer-isolated
    Production configuration should use secret references.
Artifacts must be environment tagged.
95. Local Development
    A developer should be able to run:
PostgreSQL
Object storage
Queue
API
Console
Worker
Python evaluation service
with one command.

Example:

make dev
Then:

make migrate
make seed
make test
make e2e
96. Seed Environment
Provide one deterministic seed:

demo organization
demo project
demo model
demo workload
demo baseline
demo experiment
demo evidence
demo verified system
demo deployment
demo observation
demo lesson
A fresh clone must be able to reproduce the demo.
97. Developer Workflow
    Every engineer starts with:
read docs/architecture
read domain contract
read module README
run local stack
run seed
run tests
Each PR must identify:

domain impact
schema impact
event impact
security impact
reproducibility impact
observability impact
98. Research Workflow
Every research proposal:

research_id
hypothesis
prior evidence
baseline
implementation
experiment
analysis
result
limitations
artifact
reproducibility manifest
Research result states:

PROPOSED
RUNNING
COMPLETED
REPRODUCED
VALIDATED
INVALIDATED
99. Decision Engine
Decision function:

OBJECTIVE
+
EVIDENCE
+
UNCERTAINTY
+
CONSTRAINTS
+
RISK
+
AUTHORITY
Potential outputs:

SELECT
REJECT
REQUEST_MORE_EVIDENCE
REQUEST_APPROVAL
RUN_ANOTHER_EXPERIMENT
ROLLBACK
The system should be able to say:

“We do not have enough evidence to choose.”

That is a valid intelligence outcome.
100. Information-Gain-Driven Experiment Selection
     For each possible next experiment:
expected_information_gain
expected_cost
expected_duration
expected_risk
expected_decision_impact
Choose the next experiment based on mission policy.

This turns experimentation from:

run random benchmarks
into:

choose the experiment that most reduces uncertainty about the mission
101. Reality Freshness
Any state used for consequential action must have:

freshness threshold
Example:

GPU availability snapshot:
valid for 30 seconds

device state:
valid for 100 ms

model artifact metadata:
valid until version changes
Before execution:

current reality
vs
planned reality
If materially different:

REPLAN
102. Failure Handling
Every module must define:

retryable
non-retryable
partial
unknown
compensatable
rollback
Mission failures should retain:

last known state
evidence
error
cause
actions already taken
103. Rollback
A rollback is a first-class version transition.

Production v19
     ↓
rollback
     ↓
Production v17
Do not mutate v19 into v17.

Record:

rollback reason
trigger
policy
operator
evidence
recovery result
104. Data Governance
Data contracts must define:

owner
source
license
classification
retention
region
purpose
allowed transformations
allowed training uses
allowed export
Customer data must remain inside the configured ownership/isolation boundary.
105. Connector Architecture
     Every connector implements:
discover
authenticate
pull
push where authorized
validate
normalize
observe
disconnect
Connector examples:

GitHub
HTTP API
database
cloud
device
sensor
model registry
object store
Connectors are adapters, not core domain objects.
106. Export / Import
     System package format:
manifest.json
system/
model/
runtime/
deployment/
evaluation/
verification/
provenance/
lineage/
evidence/
policies/
Package contains digests for everything it references.

Import verifies digests before registration.
107. Customer Isolation
     Use:
organization_id
project_id
resource scopes
row-level authorization
artifact prefixes
No shared cache key may omit tenant scope.

No worker may process an artifact without verifying ownership.
108. Commercial Core
     The first customer value loop should be measurable with:
baseline cost
optimized cost
baseline quality
optimized quality
baseline latency
optimized latency
engineering time saved
verified improvement
The product should show the delta, not merely the activity.
109. North Star Metrics
     Product
     missions completed
     verified system improvements
     time-to-verified-improvement
     Intelligence
     quality improvement
     cost reduction
     latency reduction
     reliability improvement
     uncertainty reduction
     System
     reproducibility rate
     rollback rate
     verification success rate
     experiment throughput
     Business
     active engineering teams
     systems managed
     compute under management
     customer usage
     retention
110. What Success Looks Like
     A customer connects a model and workload.
Horos learns the current system.

The customer defines:

quality target
latency target
cost target
risk limits
Horos searches the system space.

Horos runs controlled experiments.

Horos produces:

Candidate A
Candidate B
Candidate C
with:

predicted effect
measured effect
evidence
uncertainty
The customer approves.

Horos deploys.

Horos observes.

Horos learns.

Then Horos proposes the next improvement.

The product becomes more valuable as it accumulates:

workload knowledge
failure knowledge
system knowledge
environment knowledge
optimization knowledge
111. Long-Term Product Direction
The architecture evolves from:

INTELLIGENCE ENGINEERING
toward:

REALITY-AWARE INTELLIGENCE ENGINEERING
and eventually:

REALITY INTELLIGENCE INFRASTRUCTURE
The progression is:

MODEL
 ↓
SYSTEM
 ↓
DEPLOYED INTELLIGENCE
 ↓
OBSERVED INTELLIGENCE
 ↓
EXPERIENCED INTELLIGENCE
 ↓
TEACHING
 ↓
BETTER INTELLIGENCE
 ↓
REALITY MODEL
 ↓
PHYSICAL EXECUTION
The end state is not “a better model hosting service.”

The end state is:

A runtime in which intelligence can be built, tested, deployed, observed, verified, and continuously improved through interaction with reality.
112. Full System Loop
     MISSION
      ↓
     REALITY
      ↓
     UNKNOWN / GAP
      ↓
     KNOWLEDGE ACQUISITION
      ↓
     CAPABILITY
      ↓
     MODELS
      ↓
     DATA / TRAINING
      ↓
     MODEL COMPILER
      ↓
     SYSTEM SEARCH
      ↓
     OPTIMIZATION
      ↓
     EXPERIMENT
      ↓
     VERIFICATION
      ↓
     DECISION
      ↓
     DEPLOYMENT
      ↓
     DIGITAL / REAL / PHYSICAL WORLD
      ↓
     OBSERVATION
      ↓
     EVIDENCE
      ↓
     CONSEQUENCE
      ↓
     EXPERIENCE
      ↓
     GROUND TRUTH
      ↓
     LESSON
      ↓
     TEACHING
      ↓
     NEW INTELLIGENCE
      ↓
     BETTER REALITY MODEL
      ↓
     EVOLVE
      └────────────────────────────→ NEXT MISSION
113. End-to-End Construction Order Without Product Reduction
     This is the dependency order used by engineers when implementing the full product. It does not divide the product into MVPs, weeks, months, or release phases.
The complete product scope remains the entire architecture.

FOUNDATION
├── tenancy
├── identity
├── authorization
├── artifacts
├── versioning
├── lineage
├── events
├── jobs
├── database
├── object storage
├── observability
└── audit

↓

CONTROL + MISSION
├── organization
├── project
├── missions
├── objective
├── constraints
├── authority
├── budgets
├── outcome contracts
├── mission lifecycle
└── mission result

↓

REALITY + KNOWLEDGE
├── reality fabric
├── snapshots
├── freshness
├── world intelligence
├── context intelligence
├── unknown engine
├── knowledge gap engine
├── hypothesis engine
├── prediction engine
├── active reality learning
└── ground truth

↓

CAPABILITIES + INTELLIGENCE
├── capability fabric
├── discovery
├── compatibility
├── capability gaps
├── improvement plans
├── system composer
├── model registry
├── datasets
├── tools
├── skills
└── environments

↓

MODEL ENGINEERING
├── model normalization
├── universal model IR
├── computation graph
├── graph optimization
├── operator optimization
├── memory optimization
├── compiler
├── kernel generation
├── kernel search
├── autotune
├── capability profiler
└── model version graph

↓

INTELLIGENCE DEVELOPMENT + RESEARCH
├── frontier research
├── model research
├── data research
├── training research
├── post-training research
├── evaluation research
├── inference research
├── test-time research
├── compute research
├── world research
├── data engine
├── active data engine
├── ground truth factory
├── training
├── SFT / LoRA / QLoRA
├── DPO / GRPO / RFT / RL
├── reward models
├── verifier training
├── skill learning
├── distillation
└── autonomous research

↓

EVALUATION + VERIFICATION
├── capability evaluation
├── behavior evaluation
├── system evaluation
├── evaluator fabric
├── verifier fabric
├── evaluator generation
├── contamination detection
├── leakage detection
├── evaluator bias
├── reward-hack detection
└── independent validation

↓

SYSTEM SEARCH + EXPERIMENTATION
├── search space
├── candidate generation
├── prediction
├── workload intelligence
├── replay
├── multi-objective optimization
├── Pareto frontier
├── model/runtime/hardware co-design
├── inference optimization
├── adaptive reasoning
├── compute intelligence
├── model economics
├── counterfactuals
├── causal experiments
├── synthetic reality
├── RL environments
├── synthetic data
└── sim2real

↓

DECISION + EXECUTION
├── decision engine
├── governance
├── authority
├── execution boundary
├── state recheck
├── preconditions
├── postconditions
├── deployment runtime
├── managed inference
├── model API
├── cloud
├── Kubernetes
├── bare metal
├── serverless GPU
├── dedicated GPU
├── edge
└── physical systems

↓

REALITY INTERACTION
├── sensors
├── actuators
├── devices
├── hardware-in-the-loop
├── physical experiments
├── real-world action
├── digital world
├── model behavior
└── physical world

↓

OBSERVATION + PROOF
├── observation fabric
├── measurement
├── model observations
├── system observations
├── reality observations
├── evidence
├── replay
├── lineage
├── claim engine
├── verification engine
└── consequence engine

↓

EXPERIENCE + EVOLUTION
├── mission result
├── experience engine
├── failure mining
├── regressions
├── edge cases
├── lesson engine
├── teaching fabric
├── model teaching
├── runtime teaching
├── system teaching
├── intelligence evolution
├── shadow
├── benchmark
├── canary
├── promotion
└── next mission
Every arrow in this construction order corresponds to an explicit software contract.
114. Full-System Verification Checklist
     Architecture
     [ ] Every diagram block exists as a named domain.
     [ ] Every domain has stable identity.
     [ ] Every domain has version semantics.
     [ ] Every derived object preserves lineage.
     [ ] No domain depends directly on another domain's persistence internals.
     [ ] Every external substrate is adapterized.
     Mission
     [ ] Intent becomes an outcome contract.
     [ ] Objectives are explicit.
     [ ] Constraints are explicit.
     [ ] Authority is explicit.
     [ ] Budgets are explicit.
     [ ] Reality is snapshotted.
     [ ] Mission transitions are state-machine controlled.
     Reality
     [ ] Reality has current and historical state.
     [ ] Freshness is stored.
     [ ] Uncertainty is stored.
     [ ] Unknowns are explicit.
     [ ] Knowledge gaps are explicit.
     [ ] Ground truth is provenance-linked.
     [ ] Simulation and real evidence are distinct.
     Intelligence
     [ ] Models are immutable versions.
     [ ] Datasets are immutable versions.
     [ ] Model/data/runtime relationships are explicit.
     [ ] Capability discovery is structured.
     [ ] Capability gaps can produce improvement plans.
     [ ] System composition is reproducible.
     Research
     [ ] Research proposals are versioned.
     [ ] Hypotheses are structured.
     [ ] Research implementations are traceable.
     [ ] Experiments are reproducible.
     [ ] Results become research knowledge.
     [ ] Autonomous research is bounded by policy.
     Optimization
     [ ] Workloads are represented.
     [ ] Production replay exists where authorized.
     [ ] Search spaces are explicit.
     [ ] Candidates are immutable.
     [ ] Predictions carry uncertainty.
     [ ] Experiments are evidence-producing operations.
     [ ] Multi-objective selection supports constraints and Pareto analysis.
     [ ] Model/runtime/hardware co-design is represented.
     Evaluation and verification
     [ ] Evaluators are versioned.
     [ ] Verifiers are versioned.
     [ ] Evaluation and verification remain distinct.
     [ ] Evaluation integrity is measured.
     [ ] Claims reference evidence.
     [ ] Verification produces structured results.
     Execution
     [ ] Capability does not imply authority.
     [ ] Authority is evaluated before consequential execution.
     [ ] Current state is rechecked.
     [ ] Preconditions are enforced.
     [ ] Postconditions are checked.
     [ ] Execution is auditable.
     [ ] Rollback exists.
     Physical intelligence
     [ ] Sensors are modeled as capabilities.
     [ ] Actuators are modeled as capabilities.
     [ ] Device state is versioned.
     [ ] Hardware-in-the-loop runs are reproducible.
     [ ] Physical experiments create evidence.
     [ ] Physical consequences become experience.
     Learning loop
     [ ] Observation becomes evidence.
     [ ] Evidence supports claims.
     [ ] Claims become mission results.
     [ ] Mission results become experience.
     [ ] Experience produces failures/lessons.
     [ ] Lessons can create teaching artifacts.
     [ ] Teaching produces new versions.
     [ ] New versions are evaluated and promoted through controlled evolution.
     Commercial / operational
     [ ] Usage is event-backed.
     [ ] Billing is derived from immutable usage records.
     [ ] Customer isolation is enforced.
     [ ] Export/import preserves provenance.
     [ ] APIs are versioned.
     [ ] SDKs are generated from contracts.
     [ ] Observability is present across all workers and runtimes.
115. Final Engineering Rule
     Build Horos as the full permanent system represented by the architecture diagram. Do not reduce the domain architecture to reach a first release. Use dependency order only to determine what must be constructed before something else can execute. Every permanent domain, contract, lineage relationship, evidence path, execution boundary, optimization path, reality interaction, teaching path, and evolution path remains part of the product from the beginning.
The engineering objective is not to produce a small version of Horos.

The engineering objective is to produce the complete Horos system.

APPENDIX A — CURRENT HOROS ARCHITECTURE SOURCE
The following architecture is retained from the current design source and is part of the permanent reference model.
      HOROS   frontier ai research reality Infrastructure

    BUILD → ADAPT → EVALUATE → OPTIMIZE → EXPERIMENT
         → DECIDE → DEPLOY → OBSERVE → VERIFY
              → LEARN → TEACH → EVOLVE
                              │
                              ▼

                ┌──────────────────────────────┐
                │      HOROS INTELLIGENCE      │
                │             GRAPH            │
                └──────────────────────────────┘
                              │
      ┌───────────────────────┼────────────────────────┐
      │                       │                        │
      ▼                       ▼                        ▼
  REALITY                 INTELLIGENCE              HISTORY
      │                       │                        │
      ├── World State         ├── Models              ├── Experience
      ├── Physical State      ├── Data                ├── Lessons
      ├── Environment         ├── Context             ├── Outcomes
      ├── Sensors             ├── Capabilities        ├── Evidence
      ├── Workloads           ├── Training            ├── Evaluations
      ├── Telemetry           ├── Systems             ├── Experiments
      └── Reality Knowledge   └── Runtime             └── Lineage

      ┌─────────────────────────────────────────────────────────┐
      │ REALITY / WORLD / KNOWLEDGE / MODEL / SYSTEM GRAPH     │
      │                                                         │
      │ REALITY                                                 │
      │ WORLD STATE                                             │
      │ REALITY KNOWLEDGE                                       │
      │ KNOWLEDGE GAPS                                          │
      │ MODELS                                                  │
      │ MODEL VERSIONS                                          │
      │ DATA / DATA VERSIONS                                    │
      │ CONTEXT                                                 │
      │ CAPABILITIES                                            │
      │ TRAINING                                                │
      │ EVALUATIONS                                             │
      │ EXPERIMENTS                                             │
      │ RUNTIME                                                 │
      │ COMPUTE                                                 │
      │ DEPLOYMENTS                                             │
      │ OBSERVATIONS                                            │
      │ EVIDENCE                                                │
      │ EXPERIENCE                                              │
      │ LESSONS                                                 │
      │ POLICIES                                                │
      │ SYSTEM VERSIONS                                         │
      │ LINEAGE / PROVENANCE                                    │
      │ OUTCOMES                                                │
      │ USAGE / BILLING / PRICING                               │
      └─────────────────────────────────────────────────────────┘
                              │
                              ▼


                    CUSTOMER CONTROL PLANE
                              │
            ┌─────────────────┼──────────────────┐
            ▼                 ▼                  ▼
         MISSIONS        CONNECTORS           POLICIES
            │                 │                  │
     create / monitor    GitHub / APIs      authority
     pause / resume      cloud              budgets
     checkpoints         databases          approvals
     goals               sensors             scope
                         devices             autonomy
                         environments        safety
                              │                  │
                              └────────┬─────────┘
                                       │
                                       ├── usage / metering
                                       ├── billing / credits
                                       └── plans / pricing
                                       │
                                       ▼


                       MISSION RUNTIME
                              │
                              ▼
                 HUMAN / SYSTEM / API / EVENT
                              │
                              ▼
                   INPUT NORMALIZATION
                              │
                              ▼
                       INTENT ENGINE
                              │
                              ▼
                   OUTCOME INTELLIGENCE
                              │
                              ▼
                      OUTCOME CONTRACT
                              │
               ┌──────────────┼───────────────┐
               ▼              ▼               ▼
            OBJECTIVE     CONSTRAINTS      AUTHORITY
               │              │               │
               ▼              ▼               ▼
              RISK          BUDGET      SUCCESS CRITERIA
                              │
                              ▼


                   REALITY INTELLIGENCE
                              │
    ┌─────────────────────────┼──────────────────────────┐
    ▼                         ▼                          ▼
  REALITY FABRIC          CONTEXT INTELLIGENCE        WORLD INTELLIGENCE
        │                         │                          │
        │                         ├── Retrieval              ├── Spatial
        │                         ├── Memory                 ├── Temporal
        │                         ├── Selection              ├── Objects
        │                         ├── Compression            ├── Scenes
        │                         ├── History                ├── Geometry
        │                         ├── Task Context           ├── Dynamics
        │                         ├── Tool Context           ├── Prediction
        │                         ├── Long Context           ├── Causality
        │                         └── Adaptation             ├── Uncertainty
        │                                                    └── Future States
        │
        ├── System State
        ├── Workload
        ├── Model State
        ├── Runtime State
        ├── Deployment State
        ├── Environment
        ├── Telemetry
        ├── Customer Data
        ├── Sensors
        └── Physical State
                                  │
                                  ▼
                       UNKNOWN ENGINE
                              │
                     missing information
                     uncertainty
                     unresolved state
                              │
                              ▼


                   KNOWLEDGE GAP ENGINE
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
         WHAT IS KNOWN   WHAT IS UNKNOWN   WHAT MATTERS
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                 KNOWLEDGE ACQUISITION PLAN
                              │
                              ▼


                ACTIVE REALITY LEARNING
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   OBSERVE                ACQUIRE                  EXPERIMENT
      │                       │                        │
  sensors                 telemetry                scenarios
  devices                 physical data            interventions
  APIs                    environment              measurements
  customer data           trajectories             actions
      │                       │                        │
      └───────────────────────┼────────────────────────┘
                              ▼
                      GROUND TRUTH
                              │
          ┌───────────────────┼────────────────────┐
          ▼                   ▼                    ▼
      REAL OUTCOME       VERIFIED LABEL       PHYSICAL FACT
          │                   │                    │
          └───────────────────┼────────────────────┘
                              ▼
                     REALITY KNOWLEDGE
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
    ENTITIES                STATE                  RELATIONS
    DYNAMICS             CONDITIONS               CAUSES
    EVENTS               TRANSITIONS             UNCERTAINTY
    FAILURES             CONSEQUENCES             FUTURES
                              │
                              ▼
                     TEACHING / DATA LOOP
                              │
                              └──────────────► MODELS


                   HYPOTHESIS ENGINE
                              │
                explanations / hypotheses
                              │
                              ▼
                   PREDICTION ENGINE
                              │
            future states / outcomes / uncertainty
                              │
                              ▼


                   CAPABILITY INTELLIGENCE
                              │
                              ▼
                      CAPABILITY FABRIC
                              │
   ┌──────────────────────────┼──────────────────────────┐
   ▼                          ▼                          ▼
 MODELS                      DATA                  TOOLS / SKILLS
   │                          │                          │
   ├── LLM                    ├── Datasets               ├── APIs
   ├── VLM                    ├── Training Data          ├── Code
   ├── Vision                 ├── Evaluation Data        ├── Tools
   ├── Audio                  ├── Preference Data        ├── Skills
   ├── Video                  ├── Synthetic Data         ├── Adapters
   ├── Multimodal             ├── Failure Data            ├── Simulators
   ├── World Models           ├── Experience Data         ├── Verifiers
   ├── Specialists            ├── Physical Data           └── Environments
   ├── Embeddings             ├── Sensor Data
   ├── Rerankers              └── Customer Data
   └── Adapters
                              │
                              ▼


                   CAPABILITY DISCOVERY
                              │
                              ▼
                   COMPATIBILITY ENGINE
                              │
                              ▼
                   CAPABILITY GAP ENGINE
                              │
               ┌──────────────┼────────────────┐
               ▼              ▼                ▼
            WEAKNESS       ROOT CAUSE       PRIORITY
               │              │                │
               └──────────────┼────────────────┘
                              ▼
                   IMPROVEMENT PLAN
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
     DATA                  MODEL                 POST-TRAINING
      │                       │                        │
      ├── missing data        ├── architecture         ├── SFT
      ├── failure data        ├── representation       ├── DPO
      ├── coverage            ├── precision             ├── GRPO
      ├── hard examples       ├── adaptation            ├── RFT
      └── domain gaps         └── specialization       └── RL
                              │
                              ▼


                      SYSTEM COMPOSER
                              │
   MODEL + DATA + CONTEXT + TOOLS + RUNTIME + COMPUTE
                       + ENVIRONMENT
                              │
                              ▼
                       CANDIDATE SYSTEM
                              │
           assumptions / dependencies / risks
                predicted metrics / evidence needs
                              │
                              ▼


               OPEN-WEIGHT MODEL ECOSYSTEM
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
      HUGGING FACE      CUSTOMER MODELS    LOCAL REGISTRY
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼


                       MODEL REGISTRY
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
              MODEL ID     REVISION      ARTIFACT
                 │            │            │
                 ├── Weights
                 ├── Architecture
                 ├── Configuration
                 ├── Tokenizer
                 ├── License
                 ├── Dependencies
                 ├── Artifact Digest
                 └── Provenance
                              │
                              ▼


                  MODEL SECURITY / TRUST
                              │
             provenance / dependencies / license
                       artifact integrity
                              │
                              ▼


                   MODEL NORMALIZATION
                              │
                              ▼
                  UNIVERSAL MODEL IR
                              │
                              ▼
                   COMPUTATION GRAPH
                              │
            ┌─────────────────┼──────────────────┐
            ▼                 ▼                  ▼
      GRAPH OPTIMIZER   OPERATOR OPTIMIZER   MEMORY OPTIMIZER
            │                 │                  │
            └─────────────────┼──────────────────┘
                              ▼
                     MODEL COMPILER
                              │
                              ▼
                     KERNEL GENERATION
                              │
                              ▼
                   KERNEL SEARCH / AUTOTUNE
                              │
                              ▼
                   COMPILE / BENCHMARK
                              │
                              ▼
                   VERIFIED KERNEL SET
                              │
                              ▼


                   MODEL CAPABILITY PROFILER
                              │
                              ▼
                     MODEL VERSION GRAPH
                              │
                              ▼


                   FRONTIER RESEARCH FABRIC
                              │
 ┌────────────────────────────┼────────────────────────────┐
 ▼                            ▼                            ▼
MODEL RESEARCH              DATA RESEARCH                TRAINING RESEARCH
     │                            │                            │
     ├── Architecture             ├── Mixtures                ├── Recipes
     ├── Algorithms               ├── Curation                ├── Efficiency
     ├── Representations          ├── Curriculum              ├── Distributed
     ├── Context                  ├── Synthetic Data          ├── Checkpointing
     ├── Multimodal               ├── Failure Mining          ├── Fault Recovery
     ├── Compression              ├── Data Generation         └── Scaling
     └── New Architectures        └── Quality

POST-TRAINING RESEARCH      EVALUATION RESEARCH         INFERENCE RESEARCH
     │                            │                            │
     ├── SFT                      ├── New Evaluations          ├── Routing
     ├── DPO                      ├── Verifier Research        ├── Batching
     ├── GRPO                     ├── Blind Spots              ├── Caching
     ├── RL                       ├── Adversarial Tests        ├── Kernels
     ├── RFT                      ├── Long Horizon             ├── Compilation
     ├── Reward Models            └── Evaluation Science       └── Runtime
     ├── Skills
     └── Self-improvement

TEST-TIME RESEARCH         COMPUTE RESEARCH              WORLD RESEARCH
     │                            │                            │
     ├── Reasoning                ├── Hardware Selection       ├── Spatial
     ├── Search                   ├── Placement                ├── Temporal
     ├── Trajectories             ├── Topology                 ├── Dynamics
     ├── Adaptive Compute         ├── Utilization              ├── Prediction
     ├── Test-time Learning       ├── Power                    ├── Simulation
     └── Verifier Routing         └── Economics                └── Physical AI
                                  │
                                  ▼
                     AUTONOMOUS RESEARCH
                              │
                   HYPOTHESIS → IMPLEMENTATION
                              │
                           EXPERIMENT
                              │
                            ANALYSIS
                              │
                            RESULT
                              │
                              ▼


                     RESEARCH KNOWLEDGE
                              │
                              └──────────────► FUTURE SYSTEMS


                   INTELLIGENCE DEVELOPMENT
                              │
      ┌───────────────────────┼─────────────────────────┐
      ▼                       ▼                         ▼
  DATA ENGINE            MODEL BUILD                ADAPTATION
      │                       │                         │
      ├── Discovery            ├── Pretraining           ├── Domain
      ├── Curation             ├── Continued Training    ├── Task
      ├── Filtering            ├── Distributed Training  ├── Multimodal
      ├── Dedup                ├── Fine-tuning            ├── Contextual
      ├── Quality              ├── Adapters               └── Skill
      ├── Failure Mining       └── Training
      ├── Mixture
      ├── Curriculum
      └── Synthetic
                              │
                              ▼


                    ACTIVE DATA ENGINE
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   CAPABILITY GAP          FAILURE MINING            COVERAGE GAP
          │                       │                        │
          ├── Sample importance   ├── Hard examples        ├── Rare states
          ├── Data valuation      ├── Edge cases            ├── Missing domains
          ├── Gap sampling        ├── Regressions           ├── Missing conditions
          ├── Coverage search     └── Failure-driven        └── Long-tail data
          └── Mixture search          sampling
                                  │
                                  ▼
                   GROUND TRUTH FACTORY
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
  HUMAN FEEDBACK         CUSTOMER OUTCOME         VERIFIERS
      │                       │                        │
      ├── Labels              ├── Success              ├── Formal
      ├── Preferences         ├── Failure              ├── Rules
      └── Review              └── Outcome              └── Tests
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   WEAK SUPERVISION      SYNTHETIC LABELS         FAILURE LABELS
                              │
                              ▼
                       TRAINING SIGNAL
                              │
                              ▼


                     POST-TRAINING ENGINE
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
     SFT                 PREFERENCE / RL          SKILL LEARNING
      │                       │                        │
      ├── SFT                 ├── DPO                  ├── Tools
      ├── LoRA                ├── GRPO                 ├── Code
      ├── QLoRA               ├── RFT                  ├── Workflows
      └── Adaptation          ├── Reward Models         └── Actions
                              ├── Verifier Training
                              └── Self-improvement
                              │
                              ▼


                        DISTILLATION
                              │
                              ▼
                       MODEL VARIANTS
                              │
                              ▼
                        MODEL VERSION
                              │
                              ▼


                   EVALUATION + VERIFICATION
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    CAPABILITY              BEHAVIOR             SYSTEM
    EVALUATION             EVALUATION          EVALUATION
          │                   │                   │
          ├── Reasoning        ├── Trajectory      ├── Quality
          ├── Coding           ├── Tool Use        ├── Latency
          ├── Vision           ├── Long Horizon    ├── Cost
          ├── Multimodal       ├── Safety          ├── Throughput
          ├── Domain           ├── Robustness      ├── Reliability
          ├── Physical         ├── Recovery        ├── Energy
          └── Specialized      └── Adversarial     └── Mission Success
                              │
                              ▼


                     EVALUATOR FABRIC
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
              JUDGES        CRITICS       GRADERS
                │             │             │
                ├── Reward Models
                ├── Classifiers
                ├── Human Evaluation
                └── Domain Evaluation
                              │
                              ▼


                       VERIFIER FABRIC
                              │
                ┌─────────────┼──────────────┐
                ▼             ▼              ▼
              TASK        TRAJECTORY        DOMAIN
                │             │              │
                ├── Safety
                ├── Formal Verification
                └── Output Verification
                              │
                              ▼


                    EVALUATOR GENERATION
                              │
                 BLIND SPOT → TEST → VERIFIER
                              │
                              ▼


                    EVALUATION INTEGRITY
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   CONTAMINATION             DATA LEAKAGE            EVALUATOR BIAS
   DETECTION                 DETECTION                DETECTION
          │                       │                        │
          ├── Benchmark           ├── Holdouts             ├── Judge drift
          ├── Overfitting        ├── Hidden tests          └── Bias analysis
          └── Gaming             └── Independent checks
                                  │
                                  ▼
                    REWARD-HACK / GAMING DETECTION
                                  │
                                  ▼
                     INDEPENDENT VALIDATION
                    SYSTEM OPTIMIZATION
                              │
                              ▼
                      SYSTEM SEARCH
                              │
   ┌──────────────────────────┼─────────────────────────────┐
   ▼                          ▼                             ▼
 MODEL                       DATA                         CONTEXT
   │                          │                             │
   ├── Architecture           ├── Dataset                  ├── Retrieval
   ├── Precision              ├── Sampling                 ├── Memory
   ├── Quantization           ├── Mixture                  ├── Compression
   ├── Pruning                ├── Curriculum               ├── Selection
   ├── Distillation           ├── Coverage                 ├── History
   └── Revision               └── Quality                  └── Adaptation
                              │
                              ▼
                           RUNTIME
                              │
                              ▼
                           KERNEL
                              │
                              ▼
                          HARDWARE
                              │
                              ▼
                          WORKLOAD
                              │
                              ▼


                WORKLOAD INTELLIGENCE + REPLAY
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   REQUESTS               TRAFFIC                   RUNTIME
   TRACES                 SHAPE                     BEHAVIOR
      │                       │                        │
      ├── Input length        ├── Concurrency          ├── Memory
      ├── Output length       ├── Batching             ├── GPU use
      ├── Task type           ├── Burstiness           ├── Failures
      ├── Tool trajectory     └── Distribution         └── Resource usage
      │
      └── Production Replay
                              │
                              ▼


                     UNIFIED SYSTEM SEARCH
                              │
                        SEARCH SPACE
                              │
                              ▼
                          CANDIDATE
                              │
                              ▼
                          PREDICT
                              │
                              ▼
                         EXPERIMENT
                              │
                              ▼
                          MEASURE
                              │
                              ▼
                          VERIFY
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
                   KEEP             DISCARD
                     │
                     ▼


                   MULTI-OBJECTIVE SEARCH
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
    QUALITY                LATENCY                  COST
       │                      │                      │
       ├── Throughput         ├── TTFT               ├── Token Cost
       ├── Reliability        ├── Inter-token        ├── Request Cost
       ├── Safety             ├── Throughput         ├── GPU Cost
       └── Success            └── Tail Latency       └── Energy
                              │
                              ▼
                       PARETO FRONTIER
                              │
                              ▼
                    MISSION-SPECIFIC CHOICE


                   MODEL / RUNTIME / HARDWARE
                          CO-DESIGN
                              │
          ┌───────────────────┼──────────────────┐
          ▼                   ▼                  ▼
        MODEL               RUNTIME           HARDWARE
          │                   │                  │
          ├── Architecture    ├── Kernels       ├── GPU
          ├── Dimensions      ├── Compiler      ├── CPU
          ├── Precision       ├── Scheduler     ├── TPU
          ├── Sparsity        ├── Serving       ├── ASIC
          ├── Attention       ├── Execution     ├── NPU
          └── Memory          │   Graph         ├── Memory
                              ├── Routing       ├── Interconnect
                              ├── Batching      ├── Bandwidth
                              └── Caching       ├── Power
                                                └── Thermal


                        INFERENCE OPTIMIZER
                              │
      ┌───────────────────────┼─────────────────────────┐
      ▼                       ▼                         ▼
    SERVING                ROUTING                   CACHING
      │                       │                         │
      ├── Dynamic             ├── Task routing          ├── KV Cache
      │   batching             ├── Difficulty            ├── Prefix Cache
      ├── Scheduling           │   estimation             └── Memory placement
      ├── Autoscaling          ├── Specialist routing
      ├── Disaggregation      └── Mixture intelligence
      └── GPU pooling
                              │
                              ▼


                    ADAPTIVE REASONING ENGINE
                              │
             ┌────────────────┼─────────────────┐
             ▼                ▼                 ▼
           EASY            MEDIUM              HARD
             │                │                 │
         low compute     moderate compute   search / reasoning
                                                │
                                                ▼
                                           VERY HARD
                                                │
                                  stronger model / more compute
                                                │
                                                ▼
                                       VERIFY / ROUTE
                              │
                              ▼
                 QUALITY × COMPUTE × COST × LATENCY


                        KERNEL ENGINE
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
         OPERATOR GRAPH   KERNEL GENERATION   KERNEL SEARCH
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                     COMPILE / BENCHMARK
                              │
                              ▼
                     VERIFIED KERNEL SET


                   COMPUTE INTELLIGENCE
                              │
           ┌──────────────────┼───────────────────┐
           ▼                  ▼                   ▼
       SELECTION           PLACEMENT            TOPOLOGY
           │                  │                   │
           ├── Capacity       ├── GPU locality    ├── Network
           ├── Availability   ├── Memory          ├── Interconnect
           ├── Utilization    ├── Bandwidth       └── Parallelism
           ├── Memory         ├── Power
           ├── Bandwidth      ├── Thermal
           ├── Power          ├── Price
           ├── Thermal        ├── Failure
           ├── Price          └── Recovery
           ├── Failure
           └── Recovery


                     MODEL ECONOMICS
                              │
      ┌───────────────────────┼──────────────────────┐
      ▼                       ▼                      ▼
 TRAINING COST          INFERENCE COST             ENERGY
      │                       │                      │
      ├── Token Cost           ├── Input Token       ├── Tokens / Watt
      ├── Compute Cost         ├── Output Token      ├── Power
      ├── Data Cost            ├── Task Cost         └── Thermal
      └── Lifecycle            ├── Request Cost
                               ├── GPU Cost
                               └── Successful Task Cost


                   COUNTERFACTUAL ENGINE
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   MODEL CHANGE           DATA CHANGE             RUNTIME CHANGE
      │                       │                        │
      ├── Architecture        ├── Sampling             ├── Kernel
      ├── Quantization        ├── Mixture              ├── Scheduling
      ├── Model size          ├── Training             ├── Serving
      └── Routing             └── Dataset              └── Compiler
                              │
         ┌────────────────────┼─────────────────────┐
         ▼                    ▼                     ▼
      HARDWARE             WORKLOAD             ENVIRONMENT
         │                    │                     │
         ├── GPU              ├── Traffic           ├── Physical
         ├── CPU              ├── Concurrency       ├── Temperature
         ├── NPU              ├── Context           ├── Geometry
         └── Edge             └── Tool use          └── Dynamics
                              │
                              ▼
                      PREDICTED OUTCOME
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
      OBSERVED             HISTORICAL          SIMULATED
         │
         ├── Predicted
         └── Unknown


                     CAUSAL EXPERIMENT ENGINE
                              │
                              ▼
                        HYPOTHESIS
                              │
                              ▼
                         BASELINE
                              │
                              ▼
                         VARIABLES
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
            CONTROLS      CANDIDATES       WORKLOAD
               │              │              │
               ├── Budget      ├── Model      ├── Replay
               ├── Risk        ├── Data       ├── Production
               └── Gain       ├── Runtime    └── Environment
                              │
                              ▼
                        EXPERIMENT
                              │
                       ┌──────┼───────┐
                       ▼      ▼       ▼
                  SIMULATION SANDBOX REAL TEST
                       │      │       │
                       │      │       ├── Shadow
                       │      │       ├── Canary
                       │      │       └── Production
                       │      │
                       │      ├── Isolation
                       │      ├── Limits
                       │      ├── Credentials
                       │      ├── Timeout
                       │      └── Filesystem / Network
                       │
                       ├── Capacity
                       ├── Traffic
                       ├── Scaling
                       ├── Placement
                       ├── Failures
                       └── Dynamics
                              │
                              ▼
                     EXPERIMENT RESULT
                              │
                              ▼
                     CAUSAL ATTRIBUTION
                              │
                 BEFORE → CHANGE → AFTER
                              │
                              ▼
                           RESULT
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   QUALITY                 LATENCY                   COST
      │                       │                        │
      └───────────────────────┼────────────────────────┘
                              ▼
                        WHY IT CHANGED


                SYNTHETIC REALITY / WORLD LAB
                              │
    ┌─────────────────────────┼──────────────────────────┐
    ▼                         ▼                          ▼
SCENARIOS                   FUTURES                    EDGE CASES
    │                         │                          │
    ├── World States          ├── Trajectories           ├── Failures
    ├── Environments          ├── Possible Outcomes      ├── Rare Events
    ├── Workloads             └── Future Observations    └── Adversarial
    └── Conditions
                              │
                              ▼


                   RL ENVIRONMENT FACTORY
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   TASKS                 ENVIRONMENTS              TRAJECTORIES
      │                       │                        │
      ├── Task Generation     ├── Scenario Gen         ├── Rollouts
      ├── Curriculum          ├── State Space          ├── Actions
      ├── Reward              ├── Failure Injection    ├── Rewards
      ├── Goals               └── Verification         └── Outcomes
      └── Evaluation
                              │
                              ▼


                       SYNTHETIC DATA
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
        TEXT                IMAGE                VIDEO
         │
         ├── 3D
         ├── Sensor
         ├── Trajectory
         └── Action
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
       TRAINING           EVALUATION          SIMULATION
                              │
                              ▼


                     SIM2REAL GAP ENGINE
                              │
                      SIMULATION RESULT
                              │
                              ▼
                        REAL RESULT
                              │
                              ▼
                        DIFFERENCE
                              │
                              ▼
                  UNKNOWN REAL-WORLD FACTOR
                              │
                              ▼
                   NEW SCENARIO / DATA
                              │
                              ▼
                     NEW TRAINING
                              │
                              ▼
                   REAL-WORLD TRANSFER
                              │
                              ▼
                        VERIFICATION
                              │
                              └──────────────► WORLD KNOWLEDGE


                     DECISION ENGINE
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   QUALITY                  COST                    LATENCY
      │                       │                        │
      ├── Throughput         ├── Token Cost           ├── TTFT
      ├── Reliability        ├── Task Cost            ├── ITL
      ├── Safety             ├── GPU Cost             └── Tail
      ├── Mission Success    └── Energy
      └── Risk
                              │
                              ▼


                   GOVERNANCE / AUTHORITY
                              │
      ┌───────────────────────┼─────────────────────────┐
      ▼                       ▼                         ▼
    POLICY              PERMISSIONS               CREDENTIALS
      │                       │                         │
      ├── Budget              ├── Scope                 ├── Secret refs
      ├── Region              ├── Autonomy              ├── Device access
      ├── License             ├── Approval              └── API access
      ├── Hardware            └── Safety
      └── Provider
                              │
                              ▼
                ALLOW / DENY / REQUIRES APPROVAL
                              │
                              ▼
                     AUTOMATION DECISION
                              │
                              ▼
                        STATE RECHECK
                              │
                CURRENT REALITY != PLAN
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
                  CHANGED            STABLE
                     │                 │
                     ▼                 │
              REDISCOVER / REPLAN     │
                     │                 │
                     └────────┬────────┘
                              ▼


                   DEPLOYMENT RUNTIME
                              │
      ┌───────────────────────┼──────────────────────────┐
      ▼                       ▼                          ▼
    CLOUD                KUBERNETES                 BARE METAL
      │                       │                          │
      └───────────────────────┼──────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
    SERVERLESS GPU       DEDICATED GPU        EDGE / DEVICE
         │                    │                    │
         ├── Scale-to-zero    ├── Serving          ├── Local runtime
         ├── Warm pools       ├── GPU allocation    ├── Device serving
         ├── Autoscaling      ├── Batching          └── Local inference
         ├── Dynamic batch    └── Cost scheduling
         ├── GPU pooling
         └── Model loading
                              │
         ┌────────────────────┼──────────────────────┐
         ▼                    ▼                      ▼
    GPU SERVING             EDGE              PHYSICAL SYSTEMS
         │                    │                      │
      model API            device                 robots
      endpoint             vehicle                machines
      service              sensor                 industrial
                                                    devices
                                                    vehicles
                              │
                              ▼


                  PHYSICAL EXECUTION FABRIC
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
   SENSORS                ACTUATORS                 DEVICES
      │                       │                        │
      ├── Camera              ├── Motion              ├── Robots
      ├── LiDAR               ├── Manipulation        ├── Machines
      ├── IMU                 ├── Control              ├── Vehicles
      ├── Audio               ├── Force                └── Industrial
      ├── Thermal             └── Physical Actions        Systems
      └── Telemetry
                              │
                              ▼
                    HARDWARE-IN-THE-LOOP
                              │
                              ▼
                   PHYSICAL EXPERIMENTS
                              │
                              ▼
                     REAL-WORLD ACTION
                              │
                              ▼
                      PHYSICAL CONSEQUENCE


                       DEPLOYED SYSTEM
                              │
                              ▼


                     MANAGED INFERENCE
                              │
        MODEL + WORKLOAD + CONSTRAINTS
                              │
                              ▼
                 AUTO-OPTIMIZED SYSTEM
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
           MODEL           RUNTIME           HARDWARE
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                VERIFIED PRODUCTION API
                              │
                              ▼


                       HOROS MODEL API
                              │
          ┌───────────────────┼──────────────────┐
          ▼                   ▼                  ▼
      INFERENCE            USAGE            OBSERVATION
       TRAFFIC             METERING               │
          │                   │                   ▼
          │                   ▼                EVIDENCE
          │                BILLING                │
          │                   │                   ▼
          │             PAY-PER-TOKEN       EXPERIENCE
          │              PAY-PER-USAGE           │
          │                                       │
          └───────────────────────────────────────┘


                           REALITY
                              │
          ┌───────────────────┼────────────────────┐
          ▼                   ▼                    ▼
     DIGITAL WORLD       MODEL BEHAVIOR        PHYSICAL WORLD
          │                   │                    │
          ├── Software         ├── Predictions      ├── Camera
          ├── APIs             ├── Generations      ├── Video
          ├── Databases        ├── Reasoning        ├── LiDAR
          ├── Services         ├── Actions          ├── IMU
          ├── Workloads        ├── Tool Use         ├── Audio
          └── Applications     ├── Uncertainty      ├── Force/Torque
                               └── Failures         └── Telemetry
                              │
                              ▼


                     OBSERVATION FABRIC
                              │
                      SIGNAL → NORMALIZE
                              │
                         OBSERVATION
                              │
                              ▼


                          MEASUREMENT
                              │
         ┌────────────────────┼─────────────────────┐
         ▼                    ▼                     ▼
   MODEL OBSERVATION    SYSTEM OBSERVATION    REALITY OBSERVATION
         │                    │                     │
         ├── Outputs          ├── Latency           ├── Sensors
         ├── Quality          ├── Throughput        ├── Environment
         ├── Uncertainty      ├── Utilization       ├── Physical State
         ├── Reasoning        ├── Memory             ├── Video
         ├── Tool Use         ├── GPU / CPU          ├── Telemetry
         ├── Failures         ├── Network            ├── Workload
         └── Drift            └── Cost               └── Consequences
                              │
                              ▼


                          EVIDENCE
                              │
         ┌────────────────────┼──────────────────────┐
         ▼                    ▼                      ▼
       SOURCE              TIMESTAMP              ARTIFACT
         │                    │                      │
         ├── Digest            ├── Execution          ├── Version
         ├── Experiment       ├── Observation        ├── Model
         ├── Deployment       └── Provenance         ├── Data
         └── Environment                             └── Result
                              │
                              ▼


                     REPLAY / LINEAGE
                              │
                              ▼
                        CLAIM ENGINE
                              │
                              ▼
                   VERIFICATION ENGINE
                              │
         ┌────────────────────┼───────────────────┐
         ▼                    ▼                   ▼
      QUALITY            PERFORMANCE            SAFETY
         │                    │                   │
         ├── Reliability      ├── Latency         ├── Policy
         └── Mission Result  └── Cost             └── Constraints
                              │
                              ▼


                    CONSEQUENCE ENGINE
                              │
                 BEFORE → ACTION → AFTER
                              │
                              ▼
                           RESULT
                              │
                              ▼


                      MISSION RESULT
                              │
         ┌────────────────────┼───────────────────┐
         ▼                    ▼                   ▼
    WHAT CHANGED             PROOF              WHAT NEXT
                              │
                              ▼


                 VERIFIED SYSTEM VERSION
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
      DEPLOY                 EXPORT               CLONE
         │                    │                    │
         │                    ▼                    ▼
         │             SYSTEM PACKAGE        NEW EXPERIMENT
         │                                           │
         │                                           ▼
         │                                     RESEARCH BRANCH
         │
         ▼


                     HOROS SYSTEM PACKAGE
                              │
          ┌───────────────────┼────────────────────┐
          ▼                   ▼                    ▼
        MODEL              RUNTIME              DEPLOYMENT
          │                   │                    │
          ├── Weights         ├── Configuration    ├── Manifests
          ├── Adapters        ├── Serving Strategy ├── Dependencies
          ├── Tokenizer       ├── Inference Config └── Hardware Profile
          └── Version         ├── Context Strategy
                              └── Runtime Strategy
                              │
                              ▼


                     EVALUATION / PROOF
                              │
                              ▼
                     PROVENANCE / LINEAGE
                              │
                              ▼


                   CUSTOMER ENVIRONMENT
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
       CLOUD                ON-PREM             AIR-GAPPED
                                                  / EDGE
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼


                   CUSTOMER DEPLOYMENT
                              │
                              ▼
                           REALITY
                              │
                              ▼
                        OBSERVATION
                              │
                              ▼
                        VERIFICATION
                              │
                              ▼
                         EXPERIENCE


                     EXPERIENCE INTELLIGENCE
                              │
                              ▼
                   MODEL EXPERIENCE RECORD
                              │
        ┌─────────────────────┼──────────────────────┐
        ▼                     ▼                      ▼
     MISSION                REALITY                  MODEL
        │                     │                      │
        ├── Data              ├── State              ├── Version
        ├── Training          ├── Environment        ├── Behavior
        ├── Runtime           ├── Action              ├── Failure
        ├── Experiment        ├── Consequence         └── Capability
        ├── Decision          └── Outcome
        ├── Action
        ├── Observation
        ├── Evidence
        ├── Verification
        └── Result
                              │
                              ▼


                     EXPERIENCE ENGINE
                              │
                              ▼


                       FAILURE MINING
                              │
            ┌─────────────────┼────────────────┐
            ▼                 ▼                ▼
         FAILURES         REGRESSIONS       EDGE CASES
            │                 │                │
            ├── Drift          └── Anomalies   └── Rare events
            └── Root cause
                              │
                              ▼


                        LESSON ENGINE
                              │
            ┌─────────────────┼────────────────┐
            ▼                 ▼                ▼
         PATTERN           SUCCESS           FAILURE
            │                 │                │
            ├── Causal Lesson ├── Reusable     ├── Preventive
            ├── Trade-off     │   pattern      ├── Correction
            └── Generalize    └── Best path    └── New test
                              │
                              ▼


                       TEACHING FABRIC
                              │
    ┌─────────────────────────┼────────────────────────┐
    ▼                         ▼                        ▼
   MODEL TEACHING           RUNTIME TEACHING          SYSTEM TEACHING
        │                         │                        │
        ├── Fine-tune             ├── Routing              ├── Configuration
        ├── LoRA                  ├── Serving              ├── Deployment
        ├── RL                    ├── Inference            ├── Compute
        ├── Distill               ├── Strategy             ├── Placement
        ├── Adapt                 ├── Verifier             ├── Hardware
        ├── Retrain               ├── Context              ├── Data Path
        ├── Reward                ├── Tool Policy           └── Environment
        └── World Model           └── Caching
                                  │
                                  ▼
                   INTELLIGENCE EVOLUTION
                              │
                              ▼
                     NEW MODEL / VERSION
                              │
                       research / training
                         / adaptation
                              │
                              ▼
                          EVALUATE
                              │
                              ▼
                           SHADOW
                              │
                    real / replayed workload
                              │
                              ▼
                          BENCHMARK
                              │
                              ▼
                           CANARY
                              │
                              ▼
                          PROMOTE
                              │
                              ▼
                 PRODUCTION INTELLIGENCE
                              │
                              ▼
                     BETTER BEHAVIOR
                              │
                              ▼
                 BETTER WORLD UNDERSTANDING
                              │
                              ▼
                    BETTER REALITY MODEL
                              │
                 ┌────────────┴─────────────┐
                 ▼                          ▼
           BETTER KNOWLEDGE             LESS UNCERTAINTY
                 │                          │
                 └────────────┬─────────────┘
                              ▼
                     NEXT MISSION


                 ╔══════════════════════════╗
                 ║   CORE HOROS PRINCIPLE   ║
                 ╚══════════════════════════╝

      FIND WHAT LIMITS INTELLIGENCE
                     ↓
             IDENTIFY THE GAP
                     ↓
              UNDERSTAND WHY
                     ↓
            DETERMINE WHAT CAN CHANGE
                     ↓
             SEARCH THE SYSTEM
                     ↓
               BUILD CANDIDATES
                     ↓
              PREDICT OUTCOMES
                     ↓
              RUN EXPERIMENTS
                     ↓
                VERIFY RESULTS
                     ↓
               DEPLOY SAFELY
                     ↓
             OBSERVE REALITY
                     ↓
            ACQUIRE MISSING DATA
                     ↓
              CREATE GROUND TRUTH
                     ↓
             UPDATE WORLD KNOWLEDGE
                     ↓
               TEACH INTELLIGENCE
                     ↓
              IMPROVE THE SYSTEM
                     ↓
               UNDERSTAND REALITY
                     ↓
                   EVOLVE
                     │
                     └──────────────────► NEXT MISSION


          ╔══════════════════════════════════════╗
          ║          REALITY LEARNING LOOP       ║
          ╚══════════════════════════════════════╝

                   REAL WORLD
                       ↓
                    OBSERVE
                       ↓
                WHAT DO WE KNOW?
                       ↓
                WHAT DON'T WE KNOW?
                       ↓
                 KNOWLEDGE GAP
                       ↓
            WHAT EVIDENCE IS NEEDED?
                       ↓
         ACTIVE DATA / REAL EXPERIMENT
                       ↓
                 GROUND TRUTH
                       ↓
                VERIFY THE FACT
                       ↓
              REALITY KNOWLEDGE
                       ↓
                TEACH THE MODEL
                       ↓
             BETTER WORLD MODEL
                       ↓
          BETTER PREDICTION / ACTION
                       ↓
                   REAL WORLD
                       ↓
                    OBSERVE
                       │
                       └──────────────────►


          ╔══════════════════════════════════════╗
          ║      FULL SYSTEM INTELLIGENCE LOOP   ║
          ╚══════════════════════════════════════╝

  MISSION
    ↓
  REALITY
    ↓
   UNKNOWN / GAP
        ↓
 KNOWLEDGE ACQUISITION
        ↓
    CAPABILITY
        ↓
     MODELS
        ↓
   DATA / TRAINING
        ↓
   MODEL COMPILER
        ↓
   SYSTEM SEARCH
        ↓
   OPTIMIZATION
        ↓
   EXPERIMENT
        ↓
   VERIFICATION
        ↓
    DECISION
        ↓
   DEPLOYMENT
        ↓
 REAL / DIGITAL / PHYSICAL WORLD
        ↓
   OBSERVATION
        ↓
     EVIDENCE
        ↓
    CONSEQUENCE
        ↓
    EXPERIENCE
        ↓
    GROUND TRUTH
        ↓
      LESSON
        ↓
     TEACHING
        ↓
 NEW INTELLIGENCE
        ↓
 BETTER REALITY MODEL
        ↓
      EVOLVE
        │
        └──────────────────────────────────────►
                        NEXT MISSION

APPENDIX B — CHANGELOG FROM PRIOR ARCHITECTURE
Key structural improvements made in this version
Preserved the complete Horos architecture as the permanent product scope.

Removed MVP, day-by-day, week-by-week, and month-by-month product reduction plans.

Reframed implementation as dependency-driven construction of the full system.

Added complete customer control-plane implementation.

Added complete Mission Runtime and Outcome Contract implementation.

Added Reality Fabric, Context Intelligence, World Intelligence, Unknowns, Knowledge Gaps, Hypotheses, and Predictions as first-class domains.

Added complete Capability Fabric and Improvement Plan model.

Added full model registry, Universal Model IR, compiler, kernel, and profiling architecture.

Added full research and intelligence-development surfaces.

Added complete evaluation, verification, and evaluation-integrity architecture.

Added full system search, workload replay, optimization, co-design, economics, and counterfactuals.

Added complete causal experimentation, synthetic reality, RL environments, synthetic data, and SIM2REAL.

Added full decision, governance, execution-boundary, deployment, managed-inference, and physical execution architecture.

Added complete observation, evidence, replay, claim, verification, consequence, and mission-result paths.

Added complete experience, failure mining, lesson, teaching, and intelligence-evolution surfaces.

Added billing, metering, connectors, export/import, customer isolation, and operational controls.

Added full-domain contract, state-machine, failure, rollback, and verification standards.

Retained the original architecture source as the permanent reference appendix.

APPENDIX C — FIRST DAY COMMANDMENT
When a new engineer opens the repository, the intended mental model should be:

Horos is not building another model API.

Horos is building the infrastructure through which
intelligent systems can be engineered against reality.

Every model is a version.
Every experiment is reproducible.
Every claim has evidence.
Every deployment is observable.
Every action has authority.
Every outcome becomes experience.
Every experience can improve the next system.
That is the permanent architecture.

APPENDIX D — HOROS FIRST-PARTY MODEL FAMILIES (ADDITIVE EXTENSION; EXISTING ARCHITECTURE PRESERVED)

D.1 Architecture preservation rule

This appendix extends the current Horos architecture. It does not replace, rename, delete, reorder, or weaken any existing domain or flow in Appendix A. The current Intelligence Graph, Mission Runtime, Reality Fabric, Capability Fabric, Model Registry, Universal Model IR, Compiler, Kernel Engine, Frontier Research Fabric, Intelligence Development, Evaluation, Verification, System Search, Deployment, Observation, Evidence, Experience, Teaching, and Evolution paths remain intact.

The new addition is a first-party Horos Model Program connected to the existing Capability Fabric, Frontier Research Fabric, Data Engine, Ground Truth Factory, Training / Post-Training, Model Registry, Model Capability Profiler, Evaluation / Verification, Managed Inference, Horos Model API, and Intelligence Evolution. It is a new domain within the existing system—not a separate platform and not a replacement for third-party model support.

D.2 Integrated top-level architecture view
                               HOROS
            FRONTIER AI + REALITY INTELLIGENCE INFRASTRUCTURE
  EXISTING CUSTOMER / MISSION / REALITY / CAPABILITY ARCHITECTURE (UNCHANGED)

  CUSTOMER / SYSTEM EVENT
          │
          ▼
  CUSTOMER CONTROL PLANE → MISSION RUNTIME → OUTCOME CONTRACT
          │                                      │
          ▼                                      ▼
  REALITY FABRIC → CONTEXT INTELLIGENCE → WORLD INTELLIGENCE
          │                                      │
          ▼                                      ▼
  UNKNOWN ENGINE → KNOWLEDGE GAP ENGINE → ACTIVE REALITY LEARNING
          │                                      │
          └──────────────► REALITY KNOWLEDGE ◄────┘
                                  │
                                  ▼
                        CAPABILITY INTELLIGENCE
                                  │
                                  ▼
                           CAPABILITY FABRIC
                                  │
              ┌───────────────────┼─────────────────────┐
              │                   │                     │
              ▼                   ▼                     ▼
        EXTERNAL /          HOROS FIRST-PARTY      TOOLS / DATA /
        CUSTOMER MODELS     MODEL PROGRAM          SKILLS / SIMULATORS
              │                   │                     │
              │                   ▼                     │
              │          HOROS MODEL FAMILY GRAPH       │
              │                   │                     │
              │      ┌────────────┼────────────┐        │
              │      │            │            │        │
              │      ▼            ▼            ▼        │
              │   REALITY      DIGITAL       GENERATIVE  │
              │   / WORLD      INTELLIGENCE  MEDIA       │
              │   DECODING     MODELS        MODELS      │
              │      │            │            │        │
              │      └────────────┼────────────┘        │
              │                   ▼                     │
              │        DATA + MODEL DEVELOPMENT          │
              │                   │                     │
              │     discover → curate → train/adapt     │
              │      → post-train → distill → version   │
              │                   │                     │
              └───────────────────┼─────────────────────┘
                                  ▼
                         SHARED MODEL REGISTRY
                                  │
                         MODEL CAPABILITY PROFILER
                                  │
                    UNIVERSAL MODEL IR / COMPILER /
                       KERNELS / RUNTIME OPTIMIZATION
                                  │
                                  ▼
                   EVALUATION → VERIFICATION → INTEGRITY
                                  │
                                  ▼
                     SYSTEM SEARCH → EXPERIMENTS
                                  │
                                  ▼
                       DECISION / GOVERNANCE
                                  │
                                  ▼
                 DEPLOYMENT / MANAGED INFERENCE / MODEL API
                                  │
                 ┌────────────────┼─────────────────────┐
                 ▼                ▼                     ▼
          DIGITAL SOFTWARE     VOICE / MEDIA       EDGE / PHYSICAL
          + CLOUD WORKLOADS    APPLICATIONS        SYSTEMS / ROBOTS
                 └────────────────┼─────────────────────┘
                                  ▼
                  OBSERVATION → EVIDENCE → VERIFICATION
                                  │
                                  ▼
                 EXPERIENCE → FAILURE / LESSON MINING
                                  │
                                  ▼
                TEACHING → MODEL / RUNTIME / SYSTEM CHANGE
                                  │
                                  ▼
                       INTELLIGENCE EVOLUTION
                                  │
                                  └──────► NEXT MISSION

  Important: the new model family graph is a branch inside the current capability,
  research, training, registry and evaluation flow. It does not bypass shared
  contracts, model registry, safety, evaluation, deployment, evidence or lineage.

D.3 HOROS Model Family Graph

HOROS FIRST-PARTY MODEL PROGRAM
│
├── A. REALITY DECODING / WORLD INTELLIGENCE
│   ├── Reality Decoder
│   │   ├── image / video / multi-camera understanding
│   │   ├── object, scene, entity and relationship extraction
│   │   ├── spatial state, geometry, depth and motion cues
│   │   ├── sensor fusion: camera, video, depth, IMU, LiDAR and telemetry
│   │   ├── state estimation with source, timestamp and uncertainty
│   │   └── structured world-state output for the Reality Fabric
│   ├── World Dynamics Model
│   │   ├── temporal state and change representation
│   │   ├── object interaction and physical dynamics
│   │   ├── action-conditioned next-state prediction
│   │   ├── trajectory / event / future-state prediction
│   │   ├── counterfactual outcomes and uncertainty estimates
│   │   └── model-to-simulation and simulation-to-real comparisons
│   └── World Representation Models
│       ├── spatial and temporal embeddings
│       ├── scene / object / motion representations
│       └── persistent entity and state correspondence
│
├── B. PHYSICAL AI / EMBODIED INTELLIGENCE
│   ├── Physical Perception Models
│   ├── Action / Trajectory Proposal Models
│   ├── Embodied Policy Models
│   ├── Manipulation / Navigation / Control Specialists
│   ├── Robot- and device-conditioned adapters
│   └── Hardware-in-the-loop and sim2real evaluation
│
├── C. VISION / VIDEO INTELLIGENCE
│   ├── image understanding and classification
│   ├── detection, segmentation and tracking
│   ├── OCR / document and visual structure understanding
│   ├── video understanding and temporal event recognition
│   ├── motion and action recognition
│   └── vision-language / visual grounding specialists
│
├── D. LANGUAGE / REASONING / PLANNING
│   ├── language and instruction models
│   ├── reasoning and structured problem-solving models
│   ├── planning / tool-use / workflow models
│   ├── long-context and context-adaptation variants
│   ├── domain-specialized language adapters
│   └── verifier-aware and budget-aware reasoning variants
│
├── E. SOFTWARE / CODE INTELLIGENCE
│   ├── code completion and generation
│   ├── repository-level understanding and retrieval
│   ├── debugging, test generation and failure localization
│   ├── patch generation and code transformation
│   ├── tool-using engineering agents
│   └── test / compiler / sandbox verified code workflows
│
├── F. AUDIO / SPEECH / VOICE
│   ├── Automatic Speech Recognition (speech-to-text / ASR)
│   ├── speech and environmental-audio understanding
│   ├── speaker / turn / diarization and acoustic-event specialists
│   ├── Text-to-Speech (TTS / voice generation)
│   ├── streaming speech-to-speech / voice conversation
│   ├── voice activity detection and speech enhancement
│   └── multilingual, low-latency and domain-adapted variants
│
├── G. IMAGE / VIDEO GENERATION
│   ├── text-to-image generation
│   ├── image editing / instruction-based transformation
│   ├── image-to-image and reference-conditioned generation
│   ├── text-to-video / image-to-video generation
│   └── controlled scene / asset generation for synthetic environments
│
├── H. MULTIMODAL INTELLIGENCE
│   ├── text + image
│   ├── text + audio / speech
│   ├── text + video
│   ├── image + video + temporal context
│   ├── language + physical sensors
│   └── cross-modal grounding and shared representations
│
├── I. SCIENCE / ENGINEERING / RESEARCH
│   ├── scientific reasoning and literature synthesis
│   ├── mathematics / symbolic and numerical task specialists
│   ├── engineering analysis and optimization assistants
│   ├── simulation-aware scientific specialists
│   └── evidence-linked research and hypothesis workflows
│
└── J. SHARED REPRESENTATION / SPECIALIST MODELS
    ├── embeddings
    ├── rerankers
    ├── classifiers and extractors
    ├── reward / preference models
    ├── evaluators / critics / verifiers
    ├── speech, vision, code and world-model adapters
    └── distilled low-latency / edge variants

These are model-family workstreams, not a requirement that one giant model perform
all tasks. Each family can contain multiple sizes, modalities, specializations,
adapters and deployment variants. Shared Horos infrastructure manages their
identity, lineage, evaluation, optimization, deployment and evolution.

D.4 Canonical first-party model lifecycle

REALITY / CUSTOMER WORKLOAD / USE-CASE NEED
                    │
                    ▼
          CAPABILITY OR KNOWLEDGE GAP
                    │
                    ▼
        MODEL FAMILY + MODEL REQUIREMENT
                    │
                    ▼
    DATA ACQUISITION / LICENSE / PROVENANCE CHECK
                    │
                    ▼
        DATASET + DATASET VERSION + QUALITY
                    │
                    ▼
        HYPOTHESIS / RESEARCH SPECIFICATION
                    │
                    ▼
  BASELINE SELECTION (external/open-weight/customer model)
                    │
                    ▼
   HOROS ADAPTATION / FINE-TUNING / POST-TRAINING
                    │
                    ├── where justified: distillation / specialist training
                    └── where justified: native architecture / pretraining
                    │
                    ▼
        IMMUTABLE HOROS MODEL VERSION
                    │
                    ▼
  CAPABILITY PROFILE + COST / LATENCY / MEMORY PROFILE
                    │
                    ▼
        CAPABILITY + BEHAVIOR + SYSTEM EVALUATION
                    │
                    ▼
           VERIFICATION + INDEPENDENT CHECKS
                    │
                    ▼
      SYSTEM SEARCH / RUNTIME / HARDWARE CO-DESIGN
                    │
                    ▼
    SHADOW → CANARY → APPROVED DEPLOYMENT → PRODUCTION
                    │
                    ▼
       OBSERVATION / EVIDENCE / CUSTOMER OUTCOMES
                    │
                    ▼
        FAILURE MINING / LESSON / TEACHING SIGNAL
                    │
                    └──────────► NEXT MODEL VERSION

Ownership and provenance labels must be explicit:
- EXTERNAL: model is provided by an external publisher or customer.
- HOROS_ADAPTED: Horos created an adapter or fine-tuned derivative from a base model.
- HOROS_SPECIALIST: Horos trained a domain-specific model from prepared data or a base.
- HOROS_NATIVE: Horos owns the training recipe and model weights for a model trained
  from a Horos-defined initialization/architecture or a documented native lineage.
  These labels are not interchangeable. Every version retains upstream parent refs,
  license, dataset lineage, training recipe, software/container digest, evaluation
  results and artifact digest. The registry must never mislabel an adapted model as
  trained from scratch.
D.5 Shared interfaces required for every model family

Every family plugs into existing Horos domains and implements the following contract:

HorosModelFamily
├── family_id
├── family_name
├── domain
├── supported_use_cases[]
├── input_modalities[]
├── output_modalities[]
├── task_capabilities[]
├── model_versions[]
├── dataset_version_refs[]
├── training_recipe_refs[]
├── evaluation_suite_refs[]
├── verifier_refs[]
├── supported_runtimes[]
├── supported_hardware_profiles[]
├── latency / throughput / memory / cost profile
├── license and provenance
├── ownership_class
├── safety and permission requirements
├── deployment targets
├── evidence / uncertainty profile
└── lineage and parent-version refs

Every model version additionally records immutable model artifact digest, parent
model version, configuration, weights, tokenizer or processor, input/output schema,
training/adaptation run, dataset versions, recipe, code/container digest, hardware,
random seeds where applicable, evaluation protocols, test results and promotion state.

Standard model operations should be explicit and capability-checked, for example:
- generate_text
- generate_code
- embed_text / embed_image / embed_audio
- transcribe_audio
- synthesize_speech
- understand_image / understand_video
- generate_image / generate_video
- estimate_world_state
- predict_future_state
- predict_trajectory
- propose_action
- score_or_verify_output
  Not every model implements every operation. Capability discovery must reject
  unsupported input/output combinations before execution.
D.6 Required architecture attachment points (all additive)
1. Capability Fabric: register the Horos Model Family Graph alongside external,
   customer and open-weight models. A model family is a capability provider, not a
   permission grant.
2. Model Registry: store every external baseline and every Horos-produced version
   with ownership class, source lineage, licensing, artifacts, processor/tokenizer,
   runtime compatibility and security state.
3. Frontier Research Fabric: add parallel workstreams for Reality Decoding,
   Physical AI, Code, Speech/Audio, Image/Video Generation, Multimodal, Language/
   Reasoning, Science/Engineering, and shared representation/specialist models.
4. Data Engine / Active Data Engine: maintain family-specific datasets, quality,
   domain coverage, long-tail failures, synthetic samples and data valuation.
5. Ground Truth Factory: collect verified labels, transcripts, alignments, temporal
   annotations, spatial state, trajectories, code tests, evaluator judgments and
   real task outcomes according to the family’s evidence requirements.
6. Training / Post-Training / Distillation: support repeatable family-specific
   adaptation, fine-tuning, preference/RL methods where appropriate, distillation,
   checkpoints and rollback-safe versions.
7. Model Capability Profiler: measure task quality, robustness, uncertainty,
   latency, throughput, memory, cost, energy and hardware/runtime compatibility.
8. Evaluation / Verification: have separate protocol suites for each family and
   cross-family end-to-end tests. A model is not production-ready merely because
   it generated a plausible output or passed one public benchmark.
9. Model IR / Compiler / Kernel Engine: optimize only where the selected model
   architecture and runtime support it; preserve numerical/correctness checks and
   fallback paths. Unsupported models still remain usable via compatible runtimes.
10. System Search / Inference Optimization: compare model, context, runtime, kernel,
    hardware and workload as a combined system rather than ranking models only by
    a single benchmark score.
11. Managed Inference / Horos Model API: expose family and model versions through
    stable APIs with streaming/batch support where applicable, metering, policy,
    routing, observation, evidence and version pinning.
12. Physical Execution Fabric: action-producing model output is a proposal, not
    authority. Device actuation requires a separate policy/authority check, safety
    limits, current-state recheck, validated preconditions, postcondition checks,
    emergency-stop path and evidence capture.
13. Experience / Lesson / Teaching / Evolution: feed failures and real outcomes back
    into model-family datasets, verifiers, runtime policy or future training runs.
D.7 Mapping the 15 Horos use cases to the model-family graph

USE CASE                       PRIMARY HOROS MODEL FAMILIES
Voice AI                       ASR, speech/audio understanding, TTS, streaming voice
Language Models                Language/instruction models, language specialists
Code Intelligence              Code models, repository retrieval, coding/tool agents
Research AI                    Reasoning/language, code, retrieval, scientific specialists
Vision AI                      Vision, video, visual grounding, world representation
Multimodal AI                  Multimodal, language, vision, audio/video specialists
Reasoning AI                   Reasoning/planning, verifiers, adaptive compute variants
World Models                   Reality Decoder, World Dynamics, world representations
Engineering Intelligence       Code, reasoning, scientific/engineering specialists
Autonomous Agents              Language/reasoning, tool-use, planning, task specialists
Autonomous Systems             Reality Decoder, World Dynamics, action/policy specialists
Scientific AI                  Scientific/engineering, language/reasoning, data specialists
Physical AI                    Reality Decoder, world models, embodied/action models
Synthetic Reality              Image/video generation, world models, simulators
Robotics                       Vision/perception, world models, action/policy specialists

The mappings are capability compositions, not a one-use-case-to-one-model restriction.
Use cases can invoke multiple families through the System Composer and capability
routing, and the family graph can evolve without changing the existing product model.

D.8 Definition of “decode the physical world” for Horos

For Horos, physical-world decoding is a system capability with separate measurable
stages rather than an unsupported claim that a single model “understands reality”:

OBSERVATIONS (video / images / sensors / telemetry / task context)
          ↓
PERCEPTION (entities / scenes / geometry / events / motion cues)
          ↓
STATE ESTIMATION (entities + relations + spatial/temporal state + freshness)
          ↓
WORLD MODEL (state transitions / interactions / dynamics / latent state)
          ↓
PREDICTION (future states / trajectories / events / confidence / unknowns)
          ↓
ACTION PROPOSAL (candidate actions / expected outcomes / constraints)
          ↓
SIMULATION / SANDBOX / HARDWARE-IN-THE-LOOP
          ↓
REAL-WORLD VERIFICATION (only when the environment and authority permit)
          ↓
WORLD KNOWLEDGE + EXPERIENCE + NEW TRAINING/EVALUATION DATA

Each stage stores evidence, timestamps, model/dataset versions, uncertainty, and
whether the result is observed, predicted, simulated, measured or verified. The
model's output alone never authorizes physical action. A learned world model should
be evaluated on temporal prediction, state tracking, intervention response,
uncertainty calibration, out-of-distribution cases, long-horizon degradation and
simulation-to-real transfer—not just image-caption quality.

D.9 Model family release gates

A model version may be promoted only when its declared task contracts pass:
- functional input/output and modality contract tests;
- license, provenance, data governance and security checks;
- dataset split integrity and leakage/contamination checks;
- domain-specific quality and robustness thresholds;
- uncertainty and failure-mode reporting appropriate to the task;
- baseline comparisons under pinned evaluation protocols;
- resource, latency, throughput and cost budgets for target workloads;
- compatibility tests for approved runtime/hardware targets;
- safety and human-approval requirements for action-producing systems;
- reproducible training/evaluation manifests and immutable artifact digests;
- shadow/canary/rollback path for deployments where applicable.
These gates extend the existing Evaluation Fabric, Verification Fabric, Governance,
Deployment Runtime and Evidence Fabric; they do not create a separate model release
system.

D.10 Final integration rule

The existing architecture is preserved exactly as the primary architecture source.
Horos-owned models are added as a first-party model program running through the same
Capability Fabric, data/training/research, registry, profiling, compiler/runtime,
evaluation, verification, deployment, model API, observation, evidence and evolution
systems that already exist in Horos.

Horos can use external models and Horos-owned models together. The System Composer
chooses by task capability, evidence, policy, hardware, quality, cost, latency and
uncertainty. Over time, first-party Horos families can replace specific external
baselines when measured results justify the change—without changing the architecture.
PART II — FULL PRODUCT BUILD PLAN (RECONCILED WITH FIRST-PARTY MODELS)
HOROS — Full Architecture Technical Build Plan
Version: 1.2 — Full product + first-party model program
Date: 23 October 2026
Scope: Complete Horos product, existing frontend, all 15 use cases, and five prioritized Horos first-party model families
Planning principle: Preserve every subsystem and existing frontend. Sequence implementation by dependencies and acceptance gates; do not delete product domains to make the first release smaller.
Decision summary — complete Horos product + first five owned model programs
- Keep the existing frontend. Audit it and connect it to the real API/domain state; do not rebuild the UI.
- Preserve the entire existing architecture and all 15 use cases; sequence implementation by dependency, never by deleting domains.
- Build external-model support and Horos-owned models together. The shared platform must support external, open-weight, customer-owned and Horos-owned models through the same Model Registry and Capability Fabric.
- First five Horos model programs: 1) Reality Decoder (flagship), 2) Code Intelligence, 3) Voice Intelligence (ASR + TTS), 4) Visual Generation (text-to-image / editing, then video), 5) World Dynamics Model (action-conditioned future-state prediction).
- Use existing model baselines as experimental starting points while creating Horos-owned domain datasets, task/evaluation suites, trained/adapted versions and artifact lineage. Do not assume giant pretraining from scratch is the first step.
- No model output is evidence by itself. Predictions, simulation results, measurements and verified real-world outcomes retain distinct evidence levels.
Integrated product/model flow
EXISTING HOROS FRONTEND (preserve)
              │
              ▼
API + CONTROL PLANE + MISSION RUNTIME
              │
              ├── All 15 Use-Case Systems
              ├── Existing / Open / Customer Models
              └── Horos First-Party Model Programs
                    ├── Reality Decoder
                    ├── Code Intelligence
                    ├── Voice Intelligence (ASR + TTS)
                    ├── Visual Generation
                    └── World Dynamics Model
              │
              ▼
SHARED DATA / TRAINING / REGISTRY / EVALUATION
              │
              ▼
OPTIMIZE → EXPERIMENT → VERIFY → DEPLOY
              │
              ▼
OBSERVE → EVIDENCE → EXPERIENCE → LESSON
              │
              ▼
TEACH → NEW CANDIDATE → EVALUATE → CONTROLLED EVOLUTION
1. What Horos is being built to become
Horos is a complete intelligence-engineering product and infrastructure platform for building, adapting, evaluating, optimizing, experimenting on, deploying, observing, verifying, teaching, and evolving intelligence across digital and physical environments. Its scope includes the complete existing architecture, the existing frontend, all 15 customer-facing use cases, and a first-party Horos model program.

Current strategic priority: build the complete Horos product and develop Horos-owned model families in parallel. The shared platform remains model-agnostic: it must integrate hosted model APIs, open-weight models, customer models, and Horos-owned versions through the same versioned contracts. The first-party program is a real product/research workstream connected to the existing Capability Fabric, Frontier Research Fabric, Data Engine, Ground Truth Factory, Training/Post-Training, Model Registry, Profiler, Evaluation/Verification, System Search, Deployment, Observation, Evidence, and Evolution systems.

Horos will begin with strong existing baselines, then create differentiated Horos model versions through domain-specific data, adaptation, fine-tuning, continued training, distillation, and specialist-model development where evidence justifies each method. Large-scale pretraining of a general-purpose model from scratch is not a prerequisite for building or delivering the product. That is not a deferral of first-party models: the first five Horos model programs are explicitly in scope and begin as a parallel workstream. The closed loop remains the differentiator: real outcomes and observed reality improve the data, models, runtime, system configuration, experiments, and deployable intelligence.
Current execution decision — full product + five first-party model programs
Build the entire Horos platform and all 15 use cases while starting these five prioritized model families: (1) Horos Reality Decoder, (2) Horos Code Intelligence, (3) Horos Voice Intelligence (ASR + TTS), (4) Horos Visual Generation (text-to-image and image editing, then video), and (5) Horos World Dynamics Model. Integrate hosted/open-weight/customer baselines immediately; do not wait for a Horos model checkpoint to exist before implementing shared platform workflows. In parallel, create Horos-owned datasets, training/adaptation recipes, checkpoints, evaluation protocols, release gates, and model lineage for the five families. The rest of the model-family graph remains permanently in scope and is served through the same shared infrastructure. This is dependency-aware sequencing, not architecture reduction.
Product lifecycle
BUILD → ADAPT → EVALUATE → OPTIMIZE → EXPERIMENT
     → DECIDE → DEPLOY → OBSERVE → VERIFY
     → LEARN → TEACH → EVOLVE → NEXT MISSION
Architecture principles
- Full target architecture; staged implementation. Every domain in the source diagram remains in the product plan. Phases determine dependency order, not whether a capability matters.
- Full product + first-party models; model-agnostic architecture. Preserve shared interfaces for external and Horos-owned models. Begin the first five Horos model programs in parallel using existing baselines, Horos-owned domain data, adaptation/training, and rigorous evaluations; do not make large-scale from-scratch pretraining a prerequisite for platform delivery.
- Evidence before claims. A system should not be labelled faster, safer, more reliable, or more capable without versioned evaluations and evidence.
- Immutable versions and lineage. Model, dataset, experiment, system, deployment, evidence, and mission-result versions must be traceable.
- Shared contracts, distinct execution planes. Control-plane APIs, long-running mission workflows, GPU training jobs, and inference serving have different failure and scaling characteristics.
- Compose before reinventing. Integrate proven model frameworks, serving engines, workflow systems, and telemetry systems first. Build Horos-specific intelligence, research, evidence, optimization, and eventually compiler capabilities on top of stable interfaces.
- Closed loop, not unsafe self-modification. The platform may recommend or prepare a model/runtime/system change automatically. Promotion to production is gated by policies, evidence, and the required approval level.
- Physical actions require hard controls. A model output alone must never authorize a robot, vehicle, actuator, or industrial action. Authority, state freshness, preconditions, limits, operator policies, and emergency stop must be checked independently.
Existing frontend constraint — preserve and integrate
Horos already has a built frontend. Do not regenerate, replace, redesign from scratch, or scaffold over it as part of this plan. Treat the current frontend as an existing product surface and map its current pages, routes, components, forms, dashboards, and 15 use-case pages to the APIs and runtime contracts below.

Required frontend integration sequence:
1. Audit the existing repository and identify the current route/component structure, current data sources, mock data, unfinished actions, auth assumptions, and design-system constraints.
2. Create a page-to-contract map: each existing page/action → API endpoint → domain command/query → persistence/event → worker (if long-running) → returned state/evidence.
3. Add API integration, loading/error/empty states, event streaming/polling, optimistic updates only where safe, and permission-denied states without altering established UI unless necessary.
4. Replace mock data one workflow at a time and verify existing layout and interactions through end-to-end tests.
5. Keep the current visual design and route structure. Any necessary UI changes should be additive and tied to a backend contract or user workflow.
The target repo path apps/console/ refers to the existing frontend location after repository audit; it is not permission to overwrite it with a new app.
2. Target architecture at a glance
┌─────────────────────────────────────────────────────────────────────────┐
│                           HOROS CUSTOMER SURFACE                         │
│ Web Console · SDKs · CLI · REST APIs · Connectors · Model API             │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                           CUSTOMER CONTROL PLANE                          │
│ Organizations/Projects · Missions · Intent/Outcome Contracts              │
│ Policies/Authority · Approvals · Usage/Metering · Billing/Plans           │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                    MISSION & DURABLE WORKFLOW RUNTIME                     │
│ Normalize → Plan → Check authority → Execute → Re-check state             │
│ Pause/Resume · Checkpoints · Budget/Risk · Retries · Human approvals       │
└─────────────┬───────────────────┬────────────────────┬───────────────────┘
              │                   │                    │
              ▼                   ▼                    ▼
┌──────────────────────┐ ┌─────────────────────┐ ┌────────────────────────┐
│ REALITY & KNOWLEDGE  │ │ CAPABILITY & MODEL  │ │ EXPERIMENT & SYSTEM    │
│ FABRIC               │ │ FABRIC              │ │ OPTIMIZATION           │
│ Context/Memory       │ │ Model/Data Registry │ │ Workload Replay        │
│ World State          │ │ Research/Training   │ │ Search/Counterfactual   │
│ Unknown/Gap Engine   │ │ Adaptation/Teaching │ │ Causal Experiments      │
│ Acquisition/Ground   │ │ Model Version Graph │ │ Compute/Economics       │
│ Truth                │ │                     │ │ Compiler/Kernel path    │
└──────────┬───────────┘ └──────────┬──────────┘ └────────────┬───────────┘
           └────────────────────────┼────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  EVALUATION, VERIFICATION & GOVERNANCE                   │
│ Capability/Behavior/System evaluations · Verifier fabric · Integrity       │
│ Provenance · License/security checks · Policy gates · Decision engine      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT & EXECUTION                            │
│ Managed inference · GPU serving · Cloud/on-prem/air-gapped/edge            │
│ Physical execution fabric · Shadow/canary/promotion · System packages      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      OBSERVATION, EVIDENCE & HISTORY                      │
│ Observation fabric · Measurements · Evidence · Claims · Mission results   │
│ Lineage/replay · Experience records · Failure mining · Lessons             │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    └────────── feedback to reality, data,
                                               models, runtime and research
Three graph views
The Horos Intelligence Graph should expose three coordinated views, backed by shared IDs and provenance:
- Reality: world state, physical state, environment, sensors, workloads, telemetry, reality knowledge.
- Intelligence: models, model versions, data/data versions, context, capabilities, training, evaluations, experiments, runtime, compute, deployments.
- History: observations, evidence, outcomes, experience, lessons, policies, system versions, lineage/provenance, usage and economics.
Do not treat this graph as an isolated visualization feature. It is a domain model and query surface for tracking how reality, knowledge, capabilities, experiments, systems, and outcomes relate.
3. Technology choices
These are recommended defaults, not permanent vendor lock-in. Keep interfaces stable so individual implementations can be replaced without changing the product's domain model.
Area	Recommended foundation	Why / boundary
Web console	Next.js App Router, React, TypeScript, Tailwind, component library	Mission creation, system explorer, experiment analysis, model/data registry, deployment and billing UI.
Public SDKs and CLI	TypeScript SDK first; Python SDK for research/data workflows; CLI	Match the control plane and research users. Generate API types from contracts instead of maintaining divergent copies.
Control-plane API	TypeScript with a structured server framework (e.g. NestJS or Fastify)	Organizations, projects, missions, policy CRUD, catalogues, usage, public APIs and product workflows. Use one framework consistently.
ML/research services	Python, PyTorch, Hugging Face Transformers, Accelerate; Ray Train when distributed scheduling is needed	Product capabilities for evaluation, data processing, domain-specific data pipelines, adaptation/training and world-model experiments. Build Horos-owned model families using external baselines and measurable domain gaps; scale training only when justified.
Durable mission workflows	Temporal	Long-running missions need durable timers, retries, checkpoints, pause/resume, approvals and recovery across process restarts. Keep individual model/training work as jobs invoked by workflows.
Data pipelines	Dagster or an equivalent asset-oriented orchestrator	Dataset discovery, ingestion, quality, deduplication, versioned transforms, synthetic-data pipelines and training/evaluation set lineage. Do not use it as a second mission runtime.
Primary transactional store	PostgreSQL	Tenancy, mission state, policy, registries, version metadata, usage, contracts, audit metadata, graph nodes/edges to begin with. Use migrations and explicit tenant isolation.
Object/artifact storage	S3-compatible object storage	Weights, checkpoints, datasets, media, traces, experiment bundles, system packages and evidence attachments. Store immutable objects by digest/version.
Analytical dataset format	Parquet on object storage; add a table format when data scale/concurrency requires it	Large training/evaluation/sensor datasets are not ordinary transactional rows. Keep metadata and actual blobs separate.
Cache/ephemeral coordination	Redis only where needed	Rate limits, short-lived caches, ephemeral coordination. Do not make it the source of truth for mission or policy state.
Event transport	Start with PostgreSQL outbox + a modest queue; add NATS or Kafka when throughput/replay requirements justify it	Domain events should be durable and versioned. Avoid adding a broker for every internal function before traffic supports it.
Experiment tracking	MLflow or equivalent	Parameters, metrics, artifacts, model versions, evaluation runs and lineage. Horos adds the cross-domain mission/evidence graph around it.
Training	PyTorch + Transformers; PEFT/TRL for relevant adaptation and post-training; Ray Train or native distributed training for scale	Supports Horos-owned model variants, customer/product training workflows, SFT/adapters, continued training, distillation and post-training. Begin with baseline models and domain-focused gains; large-scale from-scratch pretraining is not a gating dependency.
Inference	vLLM for supported LLM workloads; separate adapters for other modality/model servers; NVIDIA Triton where its backend/model and deployment profile fits	Use existing engines for baseline serving. Horos's inference optimizer routes and compares them rather than embedding every backend in one process.
Kubernetes model operations	Kubernetes; KServe where it reduces operational work for model deployments	Standardize workloads, quotas, GPU scheduling and deployment lifecycle. Do not require every developer to run a cluster locally.
Optimization/compiler	Initially PyTorch compile paths, ONNX Runtime and hardware-specific backends where supported; build a Horos IR/compiler boundary behind adapters	The architecture includes Model IR, graph/operator/memory optimizers, kernel search and verified kernel sets. Start by measuring existing paths; develop custom compiler/kernel features from proven bottlenecks.
Telemetry	OpenTelemetry for traces/metrics/log correlation; Prometheus-compatible metrics and a log/trace backend	Correlate mission IDs, model versions, workload traces, deployment versions, experiment IDs and cost.
Identity/security	OIDC/OAuth-compatible auth, role/attribute-based authorization, short-lived service identity, managed secrets	Authorization must be checked at mission start and again before consequential actions. Avoid long-lived credentials in workflow payloads or logs.
Testing	Unit + contract tests, integration tests, property tests for policy/state transitions, load tests, ML evaluation suites, deployment/rollback drills	The platform's claims need independent verification, especially model changes, cost reductions, safety and real-world outcomes.


Important distinctions
- Temporal handles mission durability; Dagster handles data assets. They should trigger and observe each other through explicit IDs, not compete to own the same workflow.
- MLflow records experiments; Horos connects experiments to missions, systems, deployments, reality observations, claims, and lessons. Do not recreate a mature tracking UI before Horos's unique graph and evidence links work.
- vLLM/Triton are execution engines, not Horos's optimizer. Horos selects configurations, replays representative workloads, measures outcomes, verifies evidence, and promotes chosen system versions.
- PostgreSQL can implement the first graph projection. Define graph interfaces and node/edge contracts now. Introduce a dedicated graph engine only if measured traversal patterns or scale justify it.
- Do not build a custom universal model compiler at the start. Define the IR and compiler contracts early, and then implement compiler passes and kernels one measured bottleneck at a time.
Official starting references: Temporal, Ray Train, vLLM serving, MLflow, OpenTelemetry, NVIDIA Triton.
4. Deployment topology and runtime boundaries
Keep the logical architecture fully modular from the first commit, while allowing the initial control-plane modules to run in one deployable service. Separate workloads when their resource profiles, security boundaries, or release cadence require it.
Execution planes
1. Control plane: authenticated APIs and the web app; manages missions, policies, catalogs, versions, usage and status.
2. Workflow plane: durable mission runtime; schedules actions, waits for external events, applies checkpoints, requests approvals and records transitions.
3. Research/compute plane: disposable CPU/GPU jobs for data processing, training, evaluation, simulation, optimization, compilation and kernel benchmarking.
4. Inference plane: long-running model servers and routing layer; isolated from research job failures and trained to handle latency, concurrency, quotas and traffic spikes.
5. Reality/edge plane: connectors, sensor/device gateways, simulator adapters and edge runtime; buffers events safely during disconnection and enforces device-side limits.
6. Evidence/analytics plane: event ingestion, trace processing, artifact metadata, lineage and analytical queries; supports replay and audit without blocking request serving.
Logical deployment view
Browser / SDK / CLI
       │
API Gateway / Auth / Rate Limits
       │
Control Plane API ───── PostgreSQL ───── Transactional Outbox
       │                                       │
Mission Service ───── Temporal               Event Bus / Consumers
       │                                       │
       ├── Data / Research orchestrator        ├── Graph projections
       ├── Training jobs                       ├── Usage and billing
       ├── Evaluation jobs                     ├── Experience and lessons
       ├── System-search jobs                  └── Observability pipeline
       ├── Simulation / reality connectors
       └── Deployment controller ─── Inference gateway ─── Model servers
                          │                                  │
                     Kubernetes / GPU / Edge                API users
Why not one service for everything?
A GPU training process, a customer-facing API, and a durable mission have very different resource and failure behavior. The architecture should preserve the full module boundaries, but deploy them according to workload characteristics. Start with a modular control-plane backend plus separate workers and model-serving processes; extract separately scalable services when their interfaces and operational needs are clear. This is a deployment choice, not a reduction in scope.
5. Core domain model and shared contracts
Implement these schemas before building many feature-specific endpoints. Nearly every subsystem in the diagram depends on these objects.
Required entities
Entity	Purpose	Must capture
Organization / Project	Tenant and workspace boundary	IDs, members, roles, limits, plan, region, policy defaults.
Mission	User- or system-requested objective	Input, normalized intent, owner, status, checkpoints, timestamps, budget, risk, approvals, execution references.
OutcomeContract	What success means	Objective, constraints, allowed scope, authority, measurable success criteria, failure conditions, evaluation plan and budget.
RealitySnapshot	The state used for planning/decision	Source, time, environment, relevant system/model/deployment state, sensor or telemetry references, freshness and confidence.
KnowledgeGap	Explicit unknown or uncertainty	Question, importance, affected outcome, evidence required, acquisition plan, status and resolution reference.
Capability	A usable model/data/tool/skill/environment/verifier	Interface, input/output schema, modalities, versions, constraints, capabilities, compatibility and provenance.
Model / ModelVersion	Model identity and immutable version	Architecture, weights, tokenizer, config, license, dependencies, artifact digests, training lineage, capability profile and security status.
Dataset / DatasetVersion	Reproducible training/evaluation data	Source, split, schema, filters, dedup report, label policy, licenses, lineage, checksums and access policy.
CandidateSystem / SystemVersion	A composed model + data + context + tools + runtime + compute + environment	Component version IDs, assumptions, predicted metrics, constraints, evidence needs and artifact manifest.
Experiment	A controlled comparison or research question	Hypothesis, baseline, variables, controls, workload/environment, budget, random seeds, metrics, outputs, causal analysis and decision.
EvaluationRun / VerificationClaim	A measurable statement and the evidence supporting it	Dataset/evaluator version, conditions, metrics, result, claim scope, uncertainty, verifier identity and evidence IDs.
Deployment	An installed system version	Environment, target, rollout status, configuration, policy, model/runtime/hardware, health and rollback target.
Observation / Measurement	A normalized signal from reality, model or system	Source, observation time, collection time, subject, schema, value, units, uncertainty and correlation IDs.
EvidenceBundle	Traceable proof bundle	Source, artifact digests, experiment, execution, observation, model/data/system/deployment versions, signatures where appropriate.
MissionResult	The outcome and its explanation	Requested objective, actual outcome, what changed, evidence, constraints, residual uncertainty, cost and next action.
ExperienceRecord	Captures what happened across mission/reality/model	Mission, state, action, consequence, outcome, versions, observed behavior, failures and verification.
Lesson	Generalized, testable learning	Pattern, causal hypothesis, confidence, applicable context, trade-off, preventive rule or new evaluation.
PolicyDecision	Explainable authorization result	Subject, requested action, resource, scope, applicable policy versions, state snapshot, decision, rationale, expiry and approver.
UsageRecord	Source of truth for metering	Tenant, request/mission, model/system version, token/compute/time metrics, price rule version, idempotency key and billing status.


Universal metadata required on versioned artifacts
At minimum: id, tenant_id where applicable, schema_version, created_at, created_by, version, content_digest, source, provenance, status, and references to parent artifacts. Use immutable version rows and mutable aliases such as latest, production, or candidate only as pointers. Never overwrite the only record of a model or dataset version.
Event envelope
Use one standard envelope for cross-module events:
{
  "event_id": "evt_...",
  "event_type": "mission.observation.recorded",
  "schema_version": 1,
  "occurred_at": "2026-10-22T00:00:00Z",
  "tenant_id": "org_...",
  "mission_id": "mis_...",
  "correlation_id": "cor_...",
  "causation_id": "evt_...",
  "producer": "observation-service",
  "subject": { "type": "deployment", "id": "dep_...", "version": "17" },
  "payload": {},
  "provenance": { "source": "...", "digest": "sha256:..." }
}
The example is a template; implement real schemas with validation and compatibility tests. Do not rely on free-form payloads for important state transitions.
State machine requirements
Use explicit state machines for Mission, Experiment, ModelVersion, SystemVersion and Deployment. For example:
Mission: CREATED → NORMALIZED → AUTHORIZED → PLANNED → RUNNING
       → AWAITING_APPROVAL / PAUSED / FAILED / COMPLETED / CANCELLED

SystemVersion: DRAFT → BUILT → EVALUATED → VERIFIED → SHADOW
             → CANARY → PROMOTED → DEPRECATED / ROLLED_BACK

Experiment: PROPOSED → APPROVED → RUNNING → ANALYZED
           → VERIFIED → ACCEPTED / REJECTED / INCONCLUSIVE
State changes must be guarded by server-side transition rules, idempotency, an audit record, and policy checks. A client must not be able to promote a model by directly setting a status field.
6. Service/module boundaries
These are domain modules first. Some may run inside one backend initially; research jobs, inference servers, workflow execution, and device services should have independent processes.
A. Customer control plane
Modules: organizations/projects, connectors, missions, policies, approvals, usage/metering, billing/credits, plans/pricing.

Responsibilities: identity and tenant isolation; mission CRUD and status; connector installation and credential references; budgets/scope/autonomy policies; approval queues; quotas and metering; plans/pricing; audit logs.

Interfaces: public REST API, SDK, CLI, webhook/event callbacks. All requests carry tenant context and correlation IDs. Secrets are resolved just-in-time by a credential broker and are never copied into prompts, workflow payloads, logs, or data artifacts.
B. Mission runtime and outcome intelligence
Modules: input normalization, intent engine, outcome contract, plan builder, mission scheduler, checkpoint manager, authority check, state recheck and result composer.

Responsibilities: turn a user/system/API/event input into a typed mission, define measurable success, plan candidate work, check authority/budget/risk, orchestrate actions, checkpoint state, detect reality drift and replan when reality no longer matches the plan.

Important: keep language-model planning separate from deterministic controls. A model can propose a plan; the policy engine decides whether the action is allowed.
C. Reality intelligence
Modules: Reality Fabric, Context Intelligence, World Intelligence, Unknown Engine, Knowledge Gap Engine, Knowledge Acquisition Plan, Active Reality Learning, Ground Truth, Reality Knowledge, Hypothesis Engine, Prediction Engine.

Responsibilities: normalize digital, customer, telemetry, sensor, environment and physical inputs; manage context and memory; represent spatial/temporal/object/dynamic state; record unknowns and uncertainty; prioritize what information matters; design acquisition or experiment plans; store verified facts and conditions; attach source and confidence to every statement.

Initial storage approach: versioned reality snapshots, observations, graph nodes/edges and knowledge records in PostgreSQL; blobs and large sensor/media artifacts in object storage; analytical feature tables in Parquet. Keep a graph-store interface so a dedicated graph database can be added later without redefining domain concepts.
D. Capability fabric and system composer
Modules: Capability Intelligence, capability registry, compatibility engine, Capability Gap Engine, Improvement Plan, System Composer.

Responsibilities: enumerate available model/data/tool/skill/simulator/verifier capabilities; define input/output contracts and modality support; match a request to compatible components; identify weaknesses and root causes; create candidate improvements; compose model + data + context + tools + runtime + compute + environment into a versioned CandidateSystem.

Output: a candidate manifest with component revisions, licenses, resource needs, assumptions, risks, predicted metrics, constraints, and evidence needed before deployment.
E. Model and artifact fabric
Modules: open-weight connector, customer-model import, local registry, model security/trust, model normalization, universal model IR interface, computation graph, model capability profiler, model version graph.

Responsibilities: import artifacts safely; validate licenses/dependencies/digests; normalize metadata; keep tokenizer/config/code references consistent; run model probes; report architecture, modalities, context constraints, hardware compatibility and known failures; preserve full lineage from source to derived model versions.

Security rule: never execute imported model code in a privileged control-plane process. Ingestion, conversion and model inspection happen in isolated workers with resource, network, filesystem and timeout limits.
F. Frontier research and intelligence development
Modules: Frontier Research Fabric, autonomous research loop, Data Engine, Model Build, Adaptation, Active Data Engine, Ground Truth Factory, Post-Training Engine, distillation and Model Variants.

Research categories retained: model, data, training, post-training, evaluation, inference, test-time, compute and world research.

Responsibilities: research hypothesis and experiment records; reproducible model evaluation and adaptation jobs; data discovery/curation/filtering/dedup/mixture/curriculum; customer-configured training and post-training workflows; fine-tuning/adapters; supported SFT/preference optimization/RL/RFT methods; reward/verifier training; skill learning; distillation; checkpoint and failure recovery; dataset/model lineage. Build stable interfaces for Horos first-party model work and external/customer training workflows. Start with the five priority families; neither large-scale pretraining nor one model family completing is a dependency for the shared platform to progress.

Model integration plan: start with hosted model APIs, open-weight models, and customer-supplied models. Implement provider-neutral adapters, capability profiles, license/provenance checks, version pinning, model routing, evaluations and measured cost/latency. The product's Model Registry can represent external, customer-trained, adapted, distilled, composed, and future Horos-owned model versions without changing the surrounding architecture. Do not claim a model is Horos-owned or newly pretrained unless it actually is.
G. Evaluation, evaluator/verifier and integrity fabric
Modules: capability evaluation, behavior evaluation, system evaluation, evaluator fabric, verifier fabric, evaluator generation, evaluation integrity, reward-hack/gaming detection, independent validation.

Responsibilities: evaluate reasoning/coding/vision/multimodal/domain/physical capabilities; tool-use, trajectories, long-horizon behavior, safety, robustness, recovery and adversarial behavior; quality, latency, cost, throughput, reliability, energy and mission success. Version evaluators and datasets. Use hidden holdouts, leakage checks, contamination checks, independent tests and human/domain review where necessary.

Result: an evaluation result is a versioned artifact tied to the exact model, data, system configuration, environment, workload, evaluator, and code revision.
H. Optimization and compute intelligence
Modules: system search, workload intelligence/replay, multi-objective/Pareto search, model-runtime-hardware co-design, inference optimizer, adaptive reasoning, Kernel Engine, Compute Intelligence, Model Economics, Counterfactual Engine, Causal Experiment Engine.

Responsibilities: collect representative workload traces; replay on candidate systems; sweep model/runtime/kernel/hardware parameters; estimate performance and uncertainty; track quality × compute × cost × latency; identify Pareto-optimal configurations; test counterfactuals; run controlled experiments; attribute changes to variables; select mission-specific candidates.

Engineering sequence: implement workload capture and repeatable benchmarking before large-scale automated search. Search must have a budget, a bounded parameter space, a baseline, fixed evaluation workloads, and a stop condition. Preserve failed/discarded results so the system can learn from them.
I. Deployment and managed inference
Modules: deployment runtime, serving controller, model router, GPU/edge execution, managed inference, Horos Model API, usage/billing, system packages, export/clone and rollback.

Responsibilities: launch compatible servers, dynamically batch where supported, autoscale, schedule, route by task/difficulty/policy, account for KV/prefix cache, apply quotas, measure real cost, support shadow/canary/promotion/rollback, package model/runtime/context/deployment configurations, deploy to cloud/on-prem/air-gapped/edge targets where validated.

Deployment boundary: the deployment controller creates a versioned release request; policy and verification decide whether it can advance. The serving data plane does not directly change its own production model without control-plane approval.
J. Observation, evidence, mission results and experience
Modules: Observation Fabric, normalization, measurement, Evidence, Replay/Lineage, Claim Engine, Verification Engine, Consequence Engine, Mission Result, Experience Intelligence, Failure Mining, Lesson Engine.

Responsibilities: correlate actual model output and uncertainty; system latency/throughput/resource/cost; reality and sensor/environment state; source and timestamp; artifact digests; execution/deployment/model/data versions; claims and independent verification; before/action/after consequences; human-readable mission results; failure, regression, drift, anomaly, rare-event and root-cause analysis.

Core requirement: a MissionResult must link to the OutcomeContract and show what changed, whether success criteria were met, the evidence used, cost, residual uncertainty, failures, and what should happen next.
K. Teaching and evolution
Modules: Teaching Fabric for model/runtime/system teaching, Intelligence Evolution, evaluate → shadow → benchmark → canary → promote.

Responsibilities: turn verified lessons into candidate updates to models (fine-tune, adapter, RL, distill, retrain, reward/world model), runtime (routing, serving, verifier, context, tool policy, caching) or the system (configuration, deployment, compute, placement, hardware, data path, environment). Run regression evaluation and compare against a stable baseline before promotion.

Safety rule: learning does not automatically mean production promotion. Every candidate is versioned, evaluated, policy-checked, and deployable back to a known-good version.
L. Synthetic reality and physical execution
Modules: Synthetic Reality/World Lab, RL Environment Factory, Synthetic Data, Sim2Real Gap Engine, sensor/actuator/device connectors, Hardware-in-the-Loop, Physical Experiments.

Responsibilities: scenario and future generation; rare/adversarial edge cases; task/curriculum/reward/environment creation; simulated rollouts and trajectories; synthetic text/image/video/3D/sensor/action data; compare simulated and real outcomes; create missing real-world conditions as new scenarios/data; verify transfer.

Physical guardrail: support read-only observation and simulation before live actuation. Any live action needs device-side constraints, authority approval, state freshness, explicit action limits, safe-stop behavior and a tested recovery path.
7. End-to-end execution flow
Every user-visible mission should use the same typed lifecycle. This ensures the major modules are genuinely integrated rather than merely present in the repository.
1. INPUT
   Human / API / system event / sensor event
       ↓
2. NORMALIZE & DEFINE SUCCESS
   Intent → OutcomeContract → objective / constraints / authority / risk / budget
       ↓
3. SNAPSHOT REALITY
   Relevant context, workload, model/runtime/deployment/environment state
       ↓
4. IDENTIFY UNKNOWNS
   Known vs unknown vs important → KnowledgeGap → evidence/acquisition plan
       ↓
5. DISCOVER CAPABILITIES
   Model + data + context + tools + runtime + compute + environment
       ↓
6. COMPOSE CANDIDATE SYSTEM
   Versioned manifest + assumptions + predicted metrics + evidence plan
       ↓
7. RUN WORK
   Data/training/adaptation, benchmark, simulation, replay or task execution
       ↓
8. EVALUATE & VERIFY
   Capability + behavior + system quality; policy, security, integrity gates
       ↓
9. DECIDE
   Compare success, risk, cost, latency, reliability, uncertainty and budget
       ↓
10. DEPLOY OR REPORT
    Shadow/canary/promotion, or reject/hold/replan with reason
       ↓
11. OBSERVE REALITY
    Normalize measurements, outputs, sensor data, costs, failures and effects
       ↓
12. PRODUCE EVIDENCE & RESULT
    Claims → verification → consequence → MissionResult + lineage
       ↓
13. LEARN & TEACH
    Experience → failure mining → lesson → candidate model/runtime/system change
       ↓
14. EVOLVE SAFELY
    Regression suite → shadow → benchmark → canary → promote → next mission
Required behavior when reality changes
Before a consequential action, re-check the state snapshot and authority. If reality no longer matches plan assumptions, stop the current action, refresh the snapshot, recompute affected constraints, and either replan or request human approval. Do not let a stale plan continue merely because its workflow is already running.
8. Repository and code organization
Use a monorepo initially so shared contracts, generated SDKs, UI and APIs evolve together. Keep Python/GPU dependencies isolated from the Node/TypeScript toolchain. Split into separate repositories only when access control, release cadence, or build scale genuinely requires it.
horos/
├── apps/
│   ├── console/                 # Next.js customer/research console
│   ├── control-api/              # TypeScript public and internal control APIs
│   ├── mission-worker/           # Temporal workflow definitions/workers
│   ├── inference-gateway/        # Routing, quotas, API normalization
│   └── cli/                      # horos CLI
├── services/
│   ├── identity-policy/          # tenant context, policy, approvals, audit
│   ├── mission-domain/            # intent, outcome contract, mission state
│   ├── registry/                 # models, datasets, capabilities, system versions
│   ├── graph-projection/         # reality/intelligence/history nodes and edges
│   ├── observations-evidence/    # events, measurements, evidence, claims
│   ├── usage-billing/             # metering, price rules, credits, invoices
│   ├── connector-gateway/         # APIs, GitHub, cloud, DBs, sensors/devices
│   └── deployment-controller/    # deploy, shadow/canary/promote/rollback
├── ml/
│   ├── data-engine/               # discovery, curation, quality, dedup, mixtures
│   ├── research/                  # model/data/training/inference/world research
│   ├── training/                  # pretrain, continued train, fine-tune, adapters
│   ├── post-training/             # SFT, preferences, RL/RFT, rewards, skills
│   ├── evaluation/                # benchmarks, evaluators, verifiers, integrity
│   ├── optimization/              # search, replay, cost/latency/quality optimizer
│   ├── compiler/                  # IR adapters, graph passes, kernel experiments
│   ├── world-models/              # spatial/temporal/dynamics/prediction
│   ├── simulation/                # synthetic reality, RL environments, sim2real
│   └── serving-adapters/           # vLLM/Triton/other runtime integrations
├── packages/
│   ├── contracts/                 # event/API/domain schemas and validation
│   ├── sdk-typescript/            # generated and hand-authored TS SDK
│   ├── sdk-python/                # Python SDK
│   ├── auth-client/               # identity, tenant and policy client
│   ├── observability/             # trace/metric/log conventions
│   └── test-fixtures/             # canonical fixtures, fake models/data
├── infra/
│   ├── dev/                       # compose/devcontainer/local services
│   ├── containers/                # controlled CPU/GPU worker images
│   ├── kubernetes/                # environments, deployment manifests
│   ├── terraform/                 # cloud/network/storage/compute resources
│   ├── policies/                  # policy-as-code, release gates
│   └── dashboards/                # platform and model-operation dashboards
├── schemas/
│   ├── api/                       # OpenAPI schemas
│   ├── events/                    # versioned event contracts
│   ├── model-manifests/            # model/system package manifests
│   └── datasets/                  # dataset schemas and label specs
├── tests/
│   ├── contract/
│   ├── integration/
│   ├── security/
│   ├── performance/
│   ├── evaluation-regressions/
│   └── end-to-end/
├── docs/
│   ├── architecture/              # architecture decision records
│   ├── contracts/
│   ├── runbooks/
│   └── research-protocols/
├── pyproject.toml
├── package.json
└── README.md
Code-boundary rules
- contracts is the source of truth for IDs, event schemas, API schemas, statuses and typed manifests.
- UI code must not bypass API policy checks or directly mutate authoritative state.
- Workflow definitions orchestrate; they do not contain GPU training loops or large artifacts.
- Training jobs receive immutable input references and return immutable output references plus metrics and logs.
- Serving processes do not own registry truth or billing truth; they emit metering and observation events.
- Every worker reports health, job ID, trace/correlation ID, input artifact digests, output artifact digests and a terminal status.
- Heavy media, model weights, checkpoints and datasets are never stored as large PostgreSQL blobs. Store them in object storage and reference them by digest and URI.
9. API surface to establish early
Names can evolve, but resource boundaries should remain coherent. Prefer REST + OpenAPI for control-plane objects and streaming/event interfaces where required.
POST   /v1/missions
GET    /v1/missions/{mission_id}
POST   /v1/missions/{mission_id}:pause
POST   /v1/missions/{mission_id}:resume
POST   /v1/missions/{mission_id}:cancel
GET    /v1/missions/{mission_id}/timeline
GET    /v1/missions/{mission_id}/result

POST   /v1/outcome-contracts
GET    /v1/policies
POST   /v1/policy-decisions:check
POST   /v1/approvals/{approval_id}:approve
POST   /v1/approvals/{approval_id}:deny

GET    /v1/capabilities
POST   /v1/models/import
GET    /v1/models/{model_id}/versions
POST   /v1/datasets
GET    /v1/datasets/{dataset_id}/versions
POST   /v1/systems:compose
GET    /v1/systems/{system_id}/versions

POST   /v1/experiments
POST   /v1/experiments/{experiment_id}:run
GET    /v1/experiments/{experiment_id}/results
POST   /v1/evaluations
GET    /v1/evaluations/{evaluation_id}
POST   /v1/deployments
POST   /v1/deployments/{deployment_id}:shadow
POST   /v1/deployments/{deployment_id}:canary
POST   /v1/deployments/{deployment_id}:promote
POST   /v1/deployments/{deployment_id}:rollback

POST   /v1/observations
GET    /v1/evidence/{evidence_id}
GET    /v1/lineage/{artifact_type}/{artifact_id}
GET    /v1/usage
GET    /v1/billing/usage
Model inference APIs should use a stable Horos API contract and normalize backend-specific details. Keep backend adapters so a serving engine can change without forcing customer SDKs to change. Every external request should support authorization, tenant quotas, request/mission correlation, idempotency where relevant, model/system version reporting, usage metering and error classification.
10. Full build sequence — dependencies, not cuts
All architecture domains remain in the plan. The sequence below makes the full system buildable, testable, and operable. Workstreams can overlap once their shared contracts exist.
Stage 0 — Architecture contracts and engineering foundation
Build: repository skeleton; ADRs; tenant/identity model; common ID conventions; API/event schema system; migrations; artifact manifest; status/state machines; environment config; secret handling; CI; test harness; telemetry convention; error taxonomy.

Must define: Mission, OutcomeContract, ModelVersion, DatasetVersion, CandidateSystem/SystemVersion, Experiment, EvaluationRun, Deployment, Observation, EvidenceBundle, MissionResult and ExperienceRecord schemas.

Exit gate: a test creates each core entity, validates its schema, versions it, records lineage, and emits a contract-tested event. CI rejects incompatible event/schema changes without a migration strategy.
Stage 1 — Working control plane and durable mission runtime
Build: tenant/project isolation; login/roles; mission create/list/detail; intent normalization; OutcomeContract creation; budgets and policies; durable workflow; pause/resume/cancel/checkpoint; approval queue; audit timeline; minimal connector framework; state re-check and replan transitions.

Parallel platform work: base console navigation, CLI skeleton, SDK generation, API auth/rate limits, worker health and local environment.

Exit gate: a mission survives API process restart and worker failure, resumes from a durable checkpoint, checks policy before action, requires an approval when configured, and produces a deterministic timeline and terminal reason.
Stage 2 — Intelligence Graph, Reality Fabric and context
Build: versioned observations and reality snapshots; normalized telemetry ingestion; entities/relations; graph views (Reality, Intelligence, History); context retrieval/memory/selection/compression; Unknown Engine; Knowledge Gap Engine; acquisition plans; prediction/hypothesis record types; source/confidence/freshness semantics.

Exit gate: a mission can record what was known at planning time, identify a missing fact, create an acquisition request, ingest new evidence, update its reality snapshot, and show the provenance chain in the graph UI.
Stage 3 — Capability Fabric, registries and safe artifact ingestion
Build: capability registry and discovery; model/dataset/tool/environment/verifier metadata; open-weight and customer-model import; content digesting; license/dependency records; model sandbox; model capability profiling; system composer; compatibility engine; candidate-system manifests; model/system version graphs.

Exit gate: a user imports a supported model and dataset, sees provenance and security status, composes a CandidateSystem with pinned versions, and can reproduce the exact manifest later.
Stage 4 — Shared model platform + first-party model-family foundation
Build: model/provider adapters; reproducible Python job runner; Data Engine; dataset versioning; filtering/dedup/quality/mixture/curriculum; ground-truth schema; training configuration/versioning; checkpoint/artifact handling; evaluation dataset registry; evaluation and adaptation workers; supported post-training methods; research notebook/job links. Include pretraining/continued-training workflow contracts as supported platform interfaces, but do not schedule new Horos-owned foundation-model training as critical path.

Build: provider-agnostic model adapters; immutable Model/ModelVersion registry; capability metadata; license/provenance/security checks; baseline model benchmark harness; model-family graph; family-specific datasets and evaluation sets; reproducible training/adaptation job contracts; checkpoints and artifact lineage. Start the five first-party workstreams: Reality Decoder, Code Intelligence, Voice Intelligence (ASR/TTS), Visual Generation, and World Dynamics Model. For each, choose the best legally usable baseline only after testing task fit, license, hardware requirements, quality, latency and cost; establish a Horos dataset/evaluation protocol; produce a first Horos-controlled adapted or trained version; and record where it improves and fails. Platform model integrations and Horos-owned model development proceed in parallel.

Exit gate: external and Horos-owned models can both be registered, version-pinned, evaluated, compared, adapted/trained where appropriate, and traced through the same artifacts and lineage. Each priority family has an ownerable specification, benchmark suite, data plan, experiment records, and a measurable first candidate; no candidate is labelled production-ready without its domain release gate.
Stage 5 — Evaluation, verifier fabric and integrity
Build: capability/behavior/system evaluators; evaluator and verifier version registry; baseline suites; quality/latency/cost/reliability/energy metrics; safety and constraint checks; holdouts/hidden tests; leakage/contamination checks; evaluator bias and gaming tests; independent validation; result comparison UI.

Exit gate: no model/system version can be labelled VERIFIED without the required tests and evidence. A deliberately regressed model is blocked from promotion, and the failed evaluation identifies the exact version, workload, evaluator and metric.
Stage 6 — Workload intelligence, system search and causal experiments
Build: workload trace capture and privacy filters; anonymized replay fixtures; model/runtime/hardware benchmark harness; configurable sweeps; Pareto frontier; compute availability/placement telemetry; cost economics; counterfactual records; experiment isolation; controls; experiment budget/stop conditions; baseline vs candidate comparisons; causal attribution reports.

Exit gate: given a fixed workload and candidate configuration, Horos can run a repeatable baseline and candidate experiment, compare quality/latency/cost, preserve failed candidates, explain the decision, and recommend a result without silently promoting it.
Stage 7 — Managed inference, deployment and usage economics
Build: Horos Model API; gateway and routing; supported serving adapters; quotas and rate limits; streaming; batch/async inference; model loading; dynamic batching/caching where supported; autoscaling integration; compute-aware placement; usage and cost metering; billing rules; deployment controller; shadow/canary/promote/rollback; system package manifest; cloud and on-prem deployment path.

Exit gate: a customer can deploy a verified SystemVersion, call it through a stable Horos endpoint, see versioned request metering and latency/cost metrics, run shadow/canary traffic, promote only with policy approval, and roll back to a verified prior version.
Stage 8 — Evidence, verification, lineage and mission results
Build: Observation Fabric for model/system/reality signals; measurement normalization; evidence bundles; lineage traversal; claim engine; Verification Engine; consequence capture; MissionResult builder; exportable System Package; provenance manifest; customer environment handoff.

Exit gate: every completed mission produces a result tied to its OutcomeContract, actual system/model/data versions, observations, costs, verification claims and evidence artifacts. A reviewer can replay or audit the decision without relying on undocumented context.
Stage 9 — Experience, failure mining, lessons and safe evolution
Build: ExperienceRecord; root-cause and regression workflows; drift/anomaly/rare-event capture; Lesson Engine; model/runtime/system teaching proposals; candidate creation from lessons; regression suites; shadow → benchmark → canary → promotion; rollback and change history.

Exit gate: a production or replay failure can become a versioned lesson and a candidate fix; the fix is tested against the relevant regression suite, and promotion is rejected if the gain is unsupported or unacceptable regressions appear.
Stage 10 — Synthetic Reality, RL environments and Sim2Real
Build: scenario definitions; synthetic-world state schemas; trajectory/action/reward schemas; synthetic data pipeline for text/image/video/3D/sensor/action; environment adapters; failure injection; RL environment factory; simulation result records; real-result comparisons; Sim2Real gap engine; new-scenario acquisition loop.

Exit gate: a simulation scenario and its output are reproducible; the platform stores real-world comparison evidence, quantifies a sim-to-real gap, creates a new scenario/data-acquisition target, and verifies whether a candidate improves transfer.
Stage 11 — Physical Execution Fabric and hardware-in-the-loop
Build: sensor/telemetry connectors; device identity; edge connector/runtime; sensor timestamps and synchronization; actuator command contracts; device-side policy guard; operator approval; action limits; stale-state checks; emergency stop and safe-stop path; simulation-to-hardware workflow; hardware-in-the-loop records and consequence verification.

Exit gate: read-only telemetry, replay and simulation work reliably first. A live-action test can proceed only in an explicitly configured controlled environment with tested device-side limits, approval, current state, emergency stop, independent observation, and recovery/rollback protocol.
Stage 12 — Model IR, compiler passes, kernel search and hardware co-design
Build: Universal Model IR interface; model normalization adapters; computation graph capture; graph/operator/memory optimization interfaces; backend adapters; kernel generation/search harness; correctness comparison; compile/benchmark records; verified kernel set; precision/quantization experiments; model-runtime-hardware co-design and compute topology evidence.

Implementation rule: build custom passes and kernels from profiling evidence in high-impact hot paths. Compare against existing runtime/compiler baselines and preserve correctness tests. The architecture includes compiler and kernel engineering as a permanent capability, but no claim of a universal compiler should be made until coverage and correctness are proven.

Exit gate: each custom pass/kernel has supported-op coverage, hardware/runtime constraints, numerical correctness thresholds, reproducible benchmarks, fallback behavior, regression tests and a measurable win on named workloads.
Stage 13 — Advanced autonomous research and multi-objective evolution
Build: hypothesis suggestion and prioritization; search-space generation; active experiment selection; candidate ranking under cost/risk; evaluator generation from known blind spots; adaptive reasoning/test-time compute; automated research reports; multi-objective portfolio selection; research knowledge connected to future system proposals.

Exit gate: autonomy is bounded by approved search spaces, compute/time budgets, access permissions, reproducibility requirements, and independent evaluation. Each proposed change has a rationale and evidence; high-impact changes remain approval-gated.
11. Parallel workstreams
Run parallel work only after the shared contracts and environment are stable. Each workstream contributes to the full architecture, not a separate disconnected product.
Workstream	Owns	Depends on	Demonstrable output
A. Platform and developer experience	Console, API, SDK/CLI, auth, tenant, projects, mission views	Stage 0 schemas and identity decisions	Users can create and monitor typed missions through API and UI.
B. Durable mission and governance	Temporal workflows, policies, approvals, budgets, re-check/replan	Mission/OutcomeContract, policy and event contracts	Mission survives failures and blocks unauthorized actions.
C. Reality, graph and context	Observations, graph projection, retrieval/memory, knowledge gaps	Event, provenance and entity contracts	Mission can show its state snapshot, unknowns and supporting evidence.
D. Model, data, and research platform	External/provider adapters, first-party model-family registry, datasets, evaluation, adaptation/training jobs, Research AI workflows	Artifact registry, experiment tracking, compute/job API	External and Horos-owned versions share the same versioning/evaluation/deployment contracts; five priority families have reproducible data/evaluation/training workstreams.
E. Evaluation and systems optimization	Benchmarks, verifier fabric, replay, search, economics	Versioned models/data/systems, workload capture	Candidate system decisions grounded in repeated measurements.
F. Inference and deployment	Model API, routing, serving adapters, release controller, metering	Model/system manifests, policy gates, telemetry	Verified deployments with cost/latency measurements and rollback.
G. Evidence, experience and evolution	Evidence bundles, mission results, failures, lessons, teaching	Observation IDs, artifacts, deployments, verified claims	Production/replay outcomes create testable improvement proposals.
H. World/physical intelligence	World models, synthetic environments, sensors, sim2real, safe actuation	Reality schemas, permissions, event/time standards	Repeatable simulation and controlled physical experiments.
I. Compiler/compute efficiency	IR, runtime adapters, kernels, hardware profiles	Model registry, benchmark harness, workloads	Correctness-tested optimization with measured workload gains.
J. Security, reliability and platform quality	Threat models, isolation, tenancy, SRE, release safety, audit	All shared interfaces	Security and reliability gates applied across every workstream.


Cross-workstream integration rule
Every feature should produce one end-to-end user-visible flow and tests against real interface contracts. Avoid creating ten modules that each have a README but no shared mission, artifact, version, event or evidence IDs connecting them.
12. Acceptance gates and definition of done
A module is not done merely because its API exists. Each module must meet the relevant gates below.
Functional
- Typed input/output schema and versioning.
- Explicit state transitions and error behavior.
- Tenant/permission checks on read and write paths.
- Idempotency for retryable commands and event consumers.
- Provenance and parent-version references for created artifacts.
- UI/CLI/API visibility as appropriate.
Reliability
- Timeouts, retry limits and cancellation behavior.
- Durable checkpoints for long-running workflows.
- Backpressure and resource quotas for expensive jobs.
- Recovery and rollback procedure documented and tested.
- Dead-letter or quarantine strategy for invalid events/artifacts.
AI/research reproducibility
- Code revision, package/environment version, config and seeds recorded where applicable.
- Training/evaluation data versions and digests recorded.
- Baseline comparison and confidence/uncertainty shown.
- Evaluator version and limitations documented.
- Failed or inconclusive runs preserved as history.
Security and governance
- Least-privilege service accounts and just-in-time credential access.
- Imported model code and data transforms isolated.
- No secrets in logs, prompts, events, notebooks or evidence bundles.
- Explicit policies for network/filesystem/device access, budget and region.
- Approval and audit record for high-risk changes and physical actions.
- Dependency/license and artifact integrity checks before use/deployment.
Performance and cost
- Representative workloads, traffic shapes and batch behavior tested.
- Latency and throughput percentiles measured, not just averages.
- Cost is attributable to tenant/mission/model/system version.
- GPU/CPU/memory/network/storage utilization recorded where relevant.
- No optimization claimed without a repeatable baseline and measured result.
Release safety
- Candidate model/system version passes required evaluation suite.
- Shadow results compared to baseline.
- Canary progression requires explicit thresholds and approval policy.
- Automatic rollback triggers defined for regression, error rate, latency, safety or policy breaches.
- Known-good version remains deployable.
13. Observability, lineage and operational requirements
Correlation IDs
Every request and every downstream job should propagate, at minimum: tenant_id, project_id, mission_id (when relevant), experiment_id (when relevant), model_version_id, system_version_id, deployment_id, trace_id, and correlation_id. Use the same identifiers in API responses, workflow logs, GPU job metadata, serving traces, evidence bundles and usage records.
Golden signals
- Control plane: API latency/errors, mission create/start/completion rates, approval wait time, workflow retries and backlog.
- Training/research: queue time, startup time, GPU utilization, samples/tokens per second, checkpoint duration, failure/restart count, artifact write/read performance and cost per run.
- Inference: TTFT, inter-token latency, p50/p95/p99 latency, throughput, queue depth, batch size, cache hit rates, GPU memory/utilization, error rate, cost per token/request/successful task.
- Reality/edge: event lag, sensor clock drift, dropped samples, stale-state blocks, device health, intervention rate and safe-stop events.
- Evidence/evolution: unlinked observations, missing lineage, verification failure rate, regressions detected, rollback frequency and time from observed failure to verified fix.
Auditability standard
A user should be able to ask: “What did Horos know when it made this decision? Which policy allowed it? Which model, data and runtime versions were involved? What changed in reality? What evidence supports the result? What did it cost? What did Horos learn?” The system should answer by traversing recorded contracts, versions, events and evidence—not by reconstructing the story from logs manually.
14. Security, privacy and physical-safety baseline
Security is shared infrastructure, not a final phase.
- Tenant isolation at API, database, object store, vector/search layer, workers, logs and exports.
- Separate customer content from platform control metadata; support deletion/retention policy by data class.
- Per-connector grants and scopes; credentials referenced by ID and resolved at execution time.
- Sandboxed model import, dataset transforms, tool execution, code execution and experiments.
- Signed or digest-verified artifact manifests; dependency/license checks; trust status recorded with model versions.
- Network egress policies, filesystem restrictions, CPU/memory/GPU/time limits and job termination for untrusted tasks.
- Explicit approval for actions that can modify customer systems, incur material compute expense, expose sensitive data or influence physical devices.
- Safety checks immediately before action, not only during plan creation.
- For physical systems, independent hardware/software safety layer, state freshness, bounded setpoints, device-side emergency stop, operator override and post-action observation.
- No model-generated text should be treated as a policy decision, safety certificate or verified fact without an independent rule, tool, measurement, verifier or authorized human review.
15. Horos model strategy: shared model platform + five prioritized first-party families
Horos must support third-party hosted models, open-weight models, customer-owned models, and Horos-owned models through the same versioned Capability Fabric and Model Registry. The platform remains provider-agnostic, but first-party model development is explicitly in scope and begins in parallel with platform implementation.
15.1 First five Horos model programs
The order below prioritizes a differentiated Reality Intelligence thesis while maintaining early, testable product capabilities. This is a research and engineering priority order, not a claim that each model will outperform available baselines from its first version.
1. Horos Reality Decoder — flagship, Priority 1. Images/video (later synchronized sensors) → structured world state. Tasks: object/entity/scene understanding, tracking, interactions, motion/event recognition, spatial and temporal relations, state changes, source/time/freshness metadata, calibrated uncertainty, and explicit unknowns. Connect outputs to Reality Fabric and Knowledge Gap Engine. Evaluate tracking, event recognition, temporal consistency, spatial accuracy where measurable, robustness, uncertainty calibration, out-of-distribution failures, latency and cost.
2. Horos Code Intelligence — Priority 2. Repository/context + engineering task → candidate patch, explanation and tests. Tasks: repository understanding, debugging, failure localization, code generation/editing, test generation, tool-use workflows, and verified patch production. Evaluate on isolated reproducible repositories using tests/build outcomes, regression rate, patch correctness, security-sensitive task checks, cost and latency. A plausible patch is not considered correct until relevant checks pass.
3. Horos Voice Intelligence — Priority 3. Build separate but connected model tracks: Horos ASR (speech-to-text), audio/speech understanding, and Horos TTS (text-to-speech); then support low-latency streaming and speech-to-speech composition. Evaluate word/character error rate, language/accent and noise robustness, speaker/turn performance where supported, intelligibility/naturalness, streaming latency, memory and cost. Voice permissions, consent and retention remain policy-controlled.
4. Horos Visual Generation — Priority 4. Text-to-image and image editing first; reference-conditioned generation and video/image-to-video after a stable evaluation/runtime path. Horos-specific differentiation should include control, reference consistency, useful asset/scene generation, prompt adherence, reproducibility and synthetic-data utility—not only aesthetic scores. Evaluate visual quality, prompt adherence, edit fidelity, temporal/identity/structure consistency where applicable, safety, latency, and cost.
5. Horos World Dynamics Model — Priority 5, connected to Reality Decoder. Current world state + temporal context + action/condition → possible future states and trajectories with uncertainty. Learn transitions, object interactions, dynamics, event probabilities and action-conditioned outcomes. Evaluate next-state/trajectory error, temporal consistency, intervention response, calibration, long-horizon degradation, rare scenarios and sim-to-real transfer. A rendered plausible future is not physical proof.
15.2 Permanent model-family graph
These five programs are the initial priority set, not the complete model scope. The permanent family graph also includes:
- Physical AI / embodied perception, action proposals, trajectory/policy specialists, navigation, manipulation and device-conditioned variants.
- Vision and video intelligence, detection, segmentation, tracking, OCR/document understanding, action/event recognition and visual grounding.
- Language, instruction following, reasoning, planning, tool use, long-context and domain-specialized variants.
- Multimodal grounding across text, image, video, audio, and available physical sensors.
- Scientific and engineering reasoning, retrieval/re-ranking and evidence-linked research specialists.
- Shared embeddings, rerankers, classifiers, extractors, reward models, evaluator/verifier models, adapters, and distilled low-latency/edge variants.
The 15 use cases remain permanent: Voice AI; Language Models; Code Intelligence; Research AI; Vision AI; Multimodal AI; Reasoning AI; World Models; Engineering Intelligence; Autonomous Agents; Autonomous Systems; Scientific AI; Physical AI; Synthetic Reality; and Robotics. Use cases compose multiple model families through System Composer and capability routing; they are not forced into a one-model-per-use-case design.
15.3 How to create Horos-owned model versions
For each family:
1. Define a model charter: target tasks, users/workloads, input/output schema, constraints, known out-of-scope tasks, success thresholds and risks.
2. Survey candidates and choose a baseline based on measurements, legal/license review, available compute, runtime compatibility, and task relevance—not fame or a single leaderboard.
3. Build the domain data plan: source licensing and consent, schema, collection/curation, deduplication, quality checks, coverage, long-tail/rare states, train/validation/test isolation, and data cards.
4. Create a domain-specific evaluation suite before training so the baseline and future Horos versions can be compared fairly.
5. Run the least expensive credible intervention first: better context/routing/tooling, task-specific data, adapters or fine-tuning, then continued training/distillation or specialist architecture work when experiments support it.
6. Store every run with code/container/config versions, seeds, input dataset/model digests, hyperparameters, compute, checkpoints, metrics, artifacts, failure analysis and lineage.
7. Promote only after independent evaluation, license/security checks, robustness and uncertainty gates, runtime/target hardware checks, and cost/latency gates pass.
8. Deploy through shadow/canary/rollback controls; observe real outcomes; turn errors into reviewed data and new tests before any teaching/training change.
Horos ownership is represented truthfully in metadata: external model; customer model; Horos adapter/fine-tune; Horos continued-trained model; Horos-distilled model; or Horos-pretrained model. Do not imply all versions were pretrained from scratch.
15.4 Shared architecture attachment points
All Horos-owned models use these existing components; no separate model platform is created:

Capability Fabric → Frontier Research Fabric → Data Engine / Active Data Engine → Ground Truth Factory → Training / Post-Training / Distillation → Model Registry / Model Version Graph → Capability Profiler → Evaluation / Verification / Integrity → System Search / Runtime / Compute → Managed Inference / Deployment → Observation / Evidence → Experience / Lesson / Teaching / Evolution.

Physical-world and action-producing models additionally connect to Reality Fabric, World Intelligence, Synthetic Reality/World Lab, RL Environment Factory, SIM2REAL Gap Engine, Governance/Authority, Execution Boundary, Physical Execution Fabric, hardware-in-the-loop, device-side safety limits and emergency-stop systems. A model output never grants permission or authority to act.
15.5 External-model and first-party-model selection rules
- Integrate hosted, open-weight and customer models immediately through stable adapters; no platform workflow should wait for a Horos checkpoint.
- Build Horos-owned datasets and model versions in parallel for the first five families.
- Choose the next training method based on measured gaps and expected value. Training from scratch is an option, not the default assumption or a prerequisite.
- Benchmark full system compositions—model + data + context + tools + runtime + hardware + workload + environment—not just model quality.
- Keep evaluation protocol, dataset, system, model, runtime, compute and deployment versions pinned and traceable.
- Never promote a model based on marketing claims or a single public benchmark. Keep failed models and their evidence in lineage; do not overwrite them.
- Distinguish observed, predicted, simulated, measured, reproduced, verified and customer-verified results.
16. Infrastructure environments and cost controls
Environments
- Local development: lightweight services and fixtures; mock/stub GPU and external connectors as needed. Full GPU jobs are submitted to an explicit dev compute target rather than silently consuming the developer machine.
- Continuous integration: schema/contract tests, static checks, unit/integration tests, security scanning, small deterministic ML tests and mocked workflow recovery tests.
- Shared research: isolated CPU/GPU workers, controlled datasets, shared artifact store and experiment tracking.
- Staging: production-like identity, policies, model serving, telemetry and deployment flow using synthetic or approved test data.
- Production: separate customer and research quotas, isolated secrets, controlled network access, robust backups, durable event processing, SLOs and disaster recovery procedures.
Cost guardrails
- Require explicit compute budgets for training, search, simulations and autonomous research.
- Tag GPU jobs and artifacts with tenant/project/experiment/model version and estimated cost.
- Enforce maximum wall-clock time, retries, GPU count, data egress and storage retention.
- Distinguish idle warm-pool cost from active request cost.
- Set stop conditions on low-value hyperparameter/benchmark searches.
- Preserve a queue and scheduling interface so cloud GPUs, dedicated GPUs, local machines and edge devices can be added without coupling research logic to one provider.
- Keep independent budgets for customer inference, internal research and safety-critical experiments.
17. Key architecture decisions to document as ADRs
Write and review these before implementation hardens around accidental choices.
1. ADR-001: Monorepo boundaries and shared contracts. Shared versioned schemas; Python ML and TypeScript control plane separated by package/toolchain boundaries.
2. ADR-002: Workflow ownership. Temporal owns mission durability; data orchestrator owns data asset pipelines; ML framework owns inner training loop.
3. ADR-003: Source of truth and event delivery. PostgreSQL transactional state + outbox; event delivery is at-least-once with idempotent consumers; no assumption of exactly-once side effects.
4. ADR-004: Artifact and lineage model. Object store for blobs; content digests; immutable versions; registry metadata in PostgreSQL.
5. ADR-005: Graph model. Typed node/edge schema, temporal facts, evidence links and tenant access; PostgreSQL projection initially behind a graph-query interface.
6. ADR-006: Model API compatibility. Stable Horos request/response schema with adapters for backend servers and modalities.
7. ADR-007: Policy decision model. Explicit principal/action/resource/context, versioned rules, explainable decision, state freshness and re-check timing.
8. ADR-008: Evaluation contracts. Metrics, evaluator versions, confidence, holdout governance and the exact conditions required for VERIFIED/PROMOTED.
9. ADR-009: Deployment release states. Immutable SystemVersion, rollout states, policy-driven promotion, rollback target and automated rollback thresholds.
10. ADR-010: Research reproducibility. Experiment inputs, code/environment digest, data versions, seeds, configs, checkpoints and results.
11. ADR-011: Inference/compute isolation. Resource pools, quotas, priority, autoscaling and hard isolation between customer inference and internal training.
12. ADR-012: Physical action safety boundary. Device-side limits, stale-state protection, approval semantics, safe stop, independent observation and recovery requirements.
13. ADR-013: Compiler extensibility. IR and backend interfaces; correctness suites; benchmark-based promotion of passes/kernels.
14. ADR-014: Data privacy and retention. Data classes, tenant ownership, redaction, deletion, retention, audit and export behavior.
18. What to avoid
These practices would undermine the full architecture even if many components were implemented.
- Do not build a “demo MVP” and silently abandon reality intelligence, evidence/lineage, system optimization, model research or evolution. The full target remains the design baseline.
- Do not build all advanced services as independent microservices before shared entities, contracts and workflows are stable.
- Do not make the mission runner responsible for running GPU training inside the workflow process.
- Do not use a single unversioned “model” or “dataset” table that gets overwritten on each run.
- Do not treat logs as the only evidence record.
- Do not automatically promote a candidate because an LLM says it is better or a single benchmark improved.
- Do not start with a home-grown compiler that tries to support every model and accelerator. Define the boundary, profile, integrate mature backends, and build custom passes where measurable wins exist.
- Do not mix production inference quota/capacity with open-ended autonomous research jobs.
- Do not let physical actuator commands bypass state rechecks, permissions, device-side constraints or emergency stop.
- Do not create a graph, vector database, event broker, lakehouse, scheduler and orchestration engine merely because each is fashionable. Introduce each when a measured access pattern or operating requirement calls for it.
- Do not claim a model is “frontier” solely because Horos owns its name. State whether the model is pretrained, continued-pretrained, fine-tuned, distilled or composed, and show capability evidence.
19. First integrated milestone
The first major milestone is not a reduced product. It is the first complete vertical slice of the permanent Horos architecture, which proves that all domain boundaries connect correctly before every advanced path reaches full scale.

A user submits a Mission with an OutcomeContract. Horos captures a RealitySnapshot, records an explicit KnowledgeGap, selects or imports a versioned model and dataset, composes a CandidateSystem, runs an experiment and baseline evaluation, verifies results, deploys the approved SystemVersion in a controlled environment, observes requests and costs, creates an EvidenceBundle and MissionResult, then turns a failure or observed gap into a Lesson and a testable next experiment. Use an existing hosted/open-weight/customer model for the first platform vertical slice, while a parallel model workstream creates and evaluates the first Horos Reality Decoder candidate. The platform must preserve identical lineage and verification contracts for every external and Horos-owned model.
Mission
  → RealitySnapshot + KnowledgeGap
  → Versioned Model + Dataset + CandidateSystem
  → Experiment + Evaluation + Verification
  → Policy Decision + Controlled Deployment
  → Observation + Cost + EvidenceBundle
  → MissionResult + ExperienceRecord
  → Lesson + New Candidate + Regression Evaluation
Once this end-to-end path is reliable, each of the permanent research, physical, compiler, optimization and scale-out tracks can deepen independently while remaining connected to the same mission, graph, artifact, event, and evidence contracts.
20. Final execution recommendation
Build Horos as one coherent, versioned system with several specialized execution planes, not as a pile of disconnected tools and not as a single process that tries to do everything.

The best starting sequence is:
1. Freeze the shared domain contracts and state machines.
2. Build the durable mission/control/policy foundation and graph-backed provenance.
3. Build model/data/capability registries and the reproducible research-job pathway.
4. Integrate and evaluate external models across all use cases, and in parallel establish the five Horos-owned model-family workstreams using domain data, adaptation/training, distillation and explicit evaluation gates. Do not make large-scale from-scratch pretraining a blocking dependency.
5. Add evaluation and verifier gates before optimization and deployment promotion.
6. Add workload replay, system search, managed inference, metering, deployment and evidence.
7. Close the loop through observations, experience, lessons, teaching and controlled evolution.
8. Extend into synthetic reality, physical execution, compiler/kernel research and autonomous research using the same contracts and safety gates.
This order is deliberately dependency-aware but does not remove a single major domain from the target architecture. The existing frontend is preserved. External-model integration and the five first-party model tracks progress in parallel once shared contracts are available; neither a single model family nor large-scale from-scratch pretraining blocks the rest of Horos.
HOROS — Use-Case Architecture Addendum
Purpose
This addendum incorporates the 15 use cases in the Horos product navigation into the full Horos architecture. These are the product's customer-facing application families. They are not 15 separate platforms and they do not replace the shared research, model, data, evaluation, optimization, deployment, Reality Intelligence, evidence, and evolution infrastructure.

The permanent product scope includes all 15:
1. Voice AI — Speech recognition, perception, and generation.
2. Language Models — Instruction following, dialogue, and tool use.
3. Code Intelligence — Code generation, debugging, and verification.
4. Research AI — Research, experiments, and model development.
5. Vision AI — Visual understanding, objects, and motion.
6. Multimodal AI — Reason across text, images, audio, and video.
7. Reasoning AI — Solve difficult problems with measurable correctness.
8. World Models — Predict physical dynamics and future states.
9. Engineering Intelligence — Solve complex engineering and optimization problems.
10. Autonomous Agents — Agents that plan, use tools, execute tasks, and adapt from feedback.
11. Autonomous Systems — Systems that perceive, decide, and act.
12. Scientific AI — Scientific modeling, simulation, and discovery.
13. Physical AI — Learn and predict how the physical world behaves.
14. Synthetic Reality — Generate environments for training and evaluation.
15. Robotics — Deploy and evaluate intelligence on robots.
1. Product structure: shared platform + use-case systems
HOROS
├── SHARED INTELLIGENCE INFRASTRUCTURE
│   ├── Customer Control Plane + Mission Runtime
│   ├── Horos Intelligence Graph + Reality Fabric
│   ├── Context, memory, retrieval, and world knowledge
│   ├── Capability Fabric + System Composer
│   ├── Model / dataset / adapter / tool registries
│   ├── Frontier Research + data / training / post-training
│   ├── Evaluation + verifier + integrity fabric
│   ├── Workload replay + system search + causal experiments
│   ├── Runtime / serving / compiler / kernel / compute optimization
│   ├── Deployment + governance + usage economics
│   ├── Observation + evidence + lineage + mission results
│   ├── Experience + failure mining + lessons + teaching
│   └── Synthetic Reality + sim-to-real + physical execution
│
└── USE-CASE SYSTEMS (customer-facing configurations and workflows)
    ├── Voice AI
    ├── Language Models
    ├── Code Intelligence
    ├── Research AI
    ├── Vision AI
    ├── Multimodal AI
    ├── Reasoning AI
    ├── World Models
    ├── Engineering Intelligence
    ├── Autonomous Agents
    ├── Autonomous Systems
    ├── Scientific AI
    ├── Physical AI
    ├── Synthetic Reality
    └── Robotics
A use case composes existing Horos primitives and adds domain-specific schemas, candidate model families, tools/connectors, datasets, evaluation suites, execution policies, runtime targets, and evidence requirements. Reusable services stay shared; use-case-specific behavior belongs in versioned definitions, plugins, adapters, and workflow packages.
2. The shared use-case contract
Every use case must be represented by a versioned UseCaseDefinition, not implemented as a one-off product path.
apiVersion: horos.ai/v1
kind: UseCaseDefinition
metadata:
  slug: code-intelligence
  name: Code Intelligence
  version: 1.0.0
  status: planned
spec:
  mission_types: []
  input_schema_ref: "schemas/code-intelligence/input/v1"
  output_schema_ref: "schemas/code-intelligence/output/v1"
  supported_modalities: [text, code]
  capability_requirements: []
  model_families: []
  context_profile_ref: "context/code/v1"
  tool_profile_ref: "tools/code/v1"
  data_profile_ref: "data/code/v1"
  evaluation_suite_ref: "eval/code/v1"
  verifier_profile_ref: "verifiers/code/v1"
  runtime_profile_ref: "runtime/code/v1"
  policy_profile_ref: "policies/code/v1"
  evidence_profile_ref: "evidence/default/v1"
  optimization_objectives:
    - task_success
    - latency
    - cost_per_success
  deployment_targets: [managed_api, customer_cloud, on_prem]
The example illustrates the contract shape; exact fields and schema references must be validated as implementation begins. The contract should support:
- Identity and versioning of the use case and its configuration.
- Mission types, input/output schemas, supported modalities, and task constraints.
- Capability requirements and allowed model/provider candidates.
- Context, memory, retrieval, tools, connectors, and environment profiles.
- Data and training profiles, including licensing and provenance constraints.
- Evaluation suites, verifier sets, pass thresholds, and holdout policy.
- Optimization objectives and constraints, such as quality, cost, latency, reliability, energy, safety, and mission success.
- Runtime and deployment targets, including cloud, on-premises, air-gapped, edge, and physical systems where applicable.
- Authority, safety limits, approvals, credentials references, audit requirements, and evidence requirements.
- Release state, supported versions, rollout policy, and rollback conditions.
A mission resolves a use-case definition into a concrete, immutable outcome contract and candidate system. The resolved config and all relevant revisions must be recorded with the mission, experiment, deployment, and result.
3. Mapping the 15 use cases to Horos subsystems
3.1 Voice AI
User promise: Speech recognition, perception, and generation.

Use-case-specific capabilities
- Streaming audio input, speech activity detection, transcription, audio understanding, speech generation, turn management, interruption/barge-in, and conversation state.
- Support direct audio models and modular ASR / language-model / TTS pipelines. The system composer decides which architecture fits the workload and constraints.
- Audio connectors, voice profiles, session state, latency budgets, and privacy/retention controls.
Shared Horos infrastructure: Model Registry, Capability Fabric, Context Intelligence, Mission Runtime, Inference Optimizer, Workload Replay, Evaluation + Verification, Observation Fabric, Evidence, Billing.

Required evaluation: Word/character error rates where applicable, semantic accuracy, speech quality, end-to-end and per-stage latency, interruption handling, noisy-environment robustness, tool/task completion, reliability, and cost per successful session.

Evidence: Audio/model version references, timestamps, derived transcripts where permitted, tool calls, evaluation outcomes, latency traces, user/session outcome, policy decisions, and provenance. Raw audio retention must be policy-controlled.
3.2 Language Models
User promise: Instruction following, dialogue, and tool use.

Use-case-specific capabilities
- A model selection and adaptation path for instruction-tuned language models, conversational behavior, structured output, function/tool calling, long-context tasks, and domain specialization.
- Prompt/context strategy comparison and support for fine-tuning, adapters, preference optimization, and distillation when justified by measured gaps.
Shared Horos infrastructure: Open-Weight Model Ecosystem, Model Registry, Data Engine, Post-Training Engine, Context Intelligence, Model Capability Profiler, Model Economics, Eval/Verifier Fabric, Managed Inference.

Required evaluation: Task correctness, instruction adherence, structured-output validity, tool-call correctness, context retention, robustness, safety, calibration where applicable, latency, throughput, and cost per successful task.

Evidence: Exact model and tokenizer revisions, adapter/dataset lineage, inference configuration, evaluation suite version, request/workload class, verifier output, and system package digest.
3.3 Code Intelligence
User promise: Code generation, debugging, and verification.

Use-case-specific capabilities
- Repository indexing and context selection; code search and reranking; code generation, explanation, debugging, patching, refactoring, test generation, and issue-to-change workflows.
- Sandboxed execution with explicit filesystem/network/credential boundaries; test and static-analysis integrations; repository-aware mission state.
Shared Horos infrastructure: Language Models, Context Intelligence, tool/skill registry, mission checkpoints, sandboxed experiment execution, evaluator/verifier fabric, workload replay, runtime optimization, evidence and lineage.

Required evaluation: Unit/integration test pass rate, issue resolution rate, patch correctness, regression rate, static-analysis findings, security checks, repository-level task success, tool-call validity, execution safety, latency, and cost per accepted change.

Evidence: Repository revision, diff digest, build/test logs, sandbox policy, dependency snapshot, tool actions, verification results, and approval record. Production writes or merges require explicit authority.
3.4 Research AI
User promise: Research, experiments, and model development.

Use-case-specific capabilities
- Search and retrieval over approved sources; source-aware synthesis; hypothesis tracking; literature and paper analysis; experiment planning; reproducible execution; comparison of results; research artifact generation.
- A research workspace that links hypotheses, datasets, code revisions, configurations, runs, metrics, artifacts, failures, and conclusions.
Shared Horos infrastructure: Frontier Research Fabric, Research Knowledge, Data/Model registries, Causal Experiment Engine, Workload Replay, Evaluation Integrity, Mission Runtime, Evidence/Lineage.

Required evaluation: Citation/source support, factual consistency with source material, reproducibility, correctness of calculations and experiment configurations, completeness against research goals, baseline comparison, contamination/leakage checks, and human/domain review where needed.

Evidence: Source references, retrieval snapshot, hypothesis, code/config/dataset digests, environment, seed where relevant, run logs, result artifacts, analysis version, and reviewer/verifier outcomes.
3.5 Vision AI
User promise: Visual understanding, objects, and motion.

Use-case-specific capabilities
- Image/video ingestion, classification, detection, segmentation, OCR/document understanding, pose/keypoint processing, object tracking, scene understanding, and motion features where supported.
- Dataset annotation and quality flows, image/video preprocessing, camera metadata, and confidence/uncertainty outputs.
Shared Horos infrastructure: Multimodal model adapters, Data Engine, Reality Fabric, Ground Truth Factory, World Intelligence, model evaluation, inference optimization, evidence/lineage.

Required evaluation: Task-specific accuracy; precision/recall or mAP for detection; IoU for segmentation; OCR measures; tracking/pose metrics; calibration and uncertainty; robustness across lighting, camera, viewpoint, domain shift, and occlusion; throughput and latency.

Evidence: Input asset reference/digest, annotation and dataset version, model/config version, scene/device metadata where permitted, inference outputs, verifier results, and evaluation lineage.
3.6 Multimodal AI
User promise: Reason across text, images, audio, and video.

Use-case-specific capabilities
- A consistent task surface for multiple modalities, timestamps and alignment, cross-modal retrieval, grounded question answering, video/audio understanding, and composition with tools.
- Support unified multimodal models and routed systems made from specialized models; select based on task-level evaluation rather than assuming a single architecture is always best.
Shared Horos infrastructure: Capability Fabric, Context Intelligence, Model Registry, modality adapters, Reality Fabric, Model/Runtime/Hardware co-design, evaluation and evidence pipelines.

Required evaluation: Modality-specific quality, cross-modal grounding, temporal alignment, unsupported-claim rate, task completion, missing-modality robustness, long-video/audio performance, latency and cost by input mix.

Evidence: Modality and segment references, timestamps, preprocessing/config versions, model route, retrieved context, outputs, confidence/unknowns, and evaluation traces.
3.7 Reasoning AI
User promise: Solve difficult problems with measurable correctness.

Use-case-specific capabilities
- Task decomposition, search/planning, tool-assisted solving, adaptive test-time compute, candidate generation, independent verification, and escalation to stronger or specialized models when required.
- Treat correctness and verifiability as primary output properties; do not treat fluent explanation alone as proof of correctness.
Shared Horos infrastructure: Adaptive Reasoning Engine, capability profiler, system search, tool/skill registry, verifier fabric, evaluation integrity, workload-aware routing, Model Economics.

Required evaluation: Correct answer or task outcome, verifier agreement, robustness, calibration/abstention where appropriate, performance under difficulty bands, repeatability, latency, compute consumed, and cost per correct result.

Evidence: Task specification, candidate/model routes, tool calls, verifier results, final outcome, compute budget, and evaluation version. Store only reasoning traces necessary and permitted for debugging/audit.
3.8 World Models
User promise: Predict physical dynamics and future states.

Use-case-specific capabilities
- State representation, object/scene dynamics, temporal prediction, action-conditioned forecasting where applicable, uncertainty estimates, trajectory prediction, and scenario rollouts.
- Maintain a distinction between observed state, inferred state, prediction, and verified ground truth in the data model.
Shared Horos infrastructure: Reality Fabric, World Intelligence, Reality Knowledge, Active Reality Learning, Ground Truth Factory, Synthetic Reality, RL Environment Factory, Sim2Real Gap Engine.

Required evaluation: State/trajectory prediction error, temporal consistency, uncertainty calibration, performance on held-out conditions, rare-event coverage, physical plausibility, horizon-dependent degradation, and real-vs-sim transfer.

Evidence: Sensor/environment snapshot, coordinate frame and units, observation timestamp, world/model versions, prediction horizon, uncertainty, observed follow-up, and measured prediction error.
3.9 Engineering Intelligence
User promise: Solve complex engineering and optimization problems.

Use-case-specific capabilities
- Constraint-aware design and analysis, engineering workflow agents, optimization/search, simulation orchestration, sensitivity analysis, trade-off exploration, and human review of high-impact recommendations.
- Integrations may include customer CAD/CAE, numerical solvers, design systems, test systems, and domain-specific engineering tools; adapters must be explicit and versioned.
Shared Horos infrastructure: Reasoning AI, Research AI, System Composer, Causal Experiment Engine, synthetic scenarios, capability gap analysis, evidence and approval workflows.

Required evaluation: Constraint satisfaction, solver-validated result quality, numerical stability, reproducibility, robustness to boundary conditions, sensitivity correctness, resource use, and domain-expert review for consequential changes.

Evidence: Input design/configuration, solver/version, boundary conditions, candidate parameters, constraints, results, comparison baseline, approvals, and provenance.
3.10 Autonomous Agents
User promise: Agents that plan, use tools, execute tasks, and adapt from feedback.

Use-case-specific capabilities
- Durable task planning and state, tool discovery, typed tool contracts, checkpoints, retries, recovery, memory, delegation/orchestration, and outcome-oriented workflows.
- Explicit controls over autonomy, authority, budgets, approvals, credential scope, timeouts, and allowed side effects.
Shared Horos infrastructure: Customer Control Plane, Mission Runtime, Outcome Contract, Context Intelligence, Capability Fabric, Governance/Authority, sandboxed execution, Evaluation/Verification, Observation/Evidence/Experience.

Required evaluation: Mission success, trajectory quality, correct tool selection/calls, recovery rate, side-effect correctness, policy violations, human escalation rate, latency, reliability, and cost per completed mission.

Evidence: Plan/state transitions, tool invocations and outputs, permission decisions, checkpoint/retry history, final outcome, and changed system state. Secrets must never be written into general-purpose logs.
3.11 Autonomous Systems
User promise: Systems that perceive, decide, and act.

Use-case-specific capabilities
- Closed-loop perception-to-decision-to-action workflows across software services, devices, industrial systems, and other managed environments.
- State estimation, constraints, action policy, runtime monitoring, fallback behavior, manual takeover, and safe stop/recovery controls.
Shared Horos infrastructure: Mission Runtime, Reality Fabric, World Intelligence, Governance/Authority, Decision Engine, Deployment Runtime, Observation Fabric, Causal Experiments, Evidence/Experience.

Required evaluation: Mission completion, state-estimation quality, control/decision latency, constraint compliance, reliability, recovery from changing conditions, uncertainty handling, resource efficiency, and safety-envelope violations.

Evidence: State before/after, observation sequence, proposed and executed action, policy authorization, runtime telemetry, consequence measurement, and operator intervention. High-impact actions require explicit policies and stop mechanisms.
3.12 Scientific AI
User promise: Scientific modeling, simulation, and discovery.

Use-case-specific capabilities
- Scientific literature and data workflows, computational experiment design, surrogate/modeling workflows, simulation integration, statistical analysis, discovery support, and reproducible notebooks or jobs.
- Domain-specific model adapters and verifiers for the fields actually supported; the system must not claim validated coverage for a scientific domain until it has suitable references, tests, and expert review.
Shared Horos infrastructure: Research AI, Data Engine, Scientific/World model candidates, Causal Experiment Engine, Synthetic Reality, evaluation integrity, provenance, evidence and lineage.

Required evaluation: Comparison with trusted baselines, uncertainty and calibration, numerical correctness, reproducibility, held-out performance, statistical validity, data leakage checks, and domain-specific validation.

Evidence: Dataset and source lineage, code/environment/config versions, random seeds where relevant, measurements, uncertainty, baseline comparisons, run artifacts, and domain review.
3.13 Physical AI
User promise: Learn and predict how the physical world behaves.

Use-case-specific capabilities
- Sensor-grounded perception and state estimation, temporal/spatial reasoning, prediction, action-conditioned modeling when applicable, and adaptation from real-world outcomes.
- Explicit alignment between simulated data, sensor measurements, state/action representation, units, coordinate frames, and physical ground truth.
Shared Horos infrastructure: Reality Fabric, World Intelligence, Active Reality Learning, Ground Truth Factory, World Models, Synthetic Reality, Sim2Real Gap Engine, Hardware-in-the-Loop, Physical Execution Fabric.

Required evaluation: Prediction and state-estimation accuracy, uncertainty, temporal behavior, robustness across environments, sim-to-real gap, action-conditioned outcome quality, task success, edge latency, and defined safety metrics.

Evidence: Sensor calibration and timestamps, hardware/software versions, environment conditions, physical state, model predictions, actions, measured consequences, emergency/override events, and verification result.
3.14 Synthetic Reality
User promise: Generate environments for training and evaluation.

Use-case-specific capabilities
- Configurable scenarios, world states, trajectories, environments, rare/edge cases, failures, interventions, synthetic sensor streams, annotations/labels, and future-state rollouts.
- Separate scenario generation from scenario acceptance: generated data must pass quality, diversity, plausibility, and leakage checks before it is trusted for training or evaluation.
Shared Horos infrastructure: Synthetic Reality / World Lab, RL Environment Factory, Synthetic Data, Ground Truth Factory, Data Engine, Evaluation Integrity, World Models, Sim2Real Gap Engine.

Required evaluation: Scenario coverage and diversity, realism/plausibility, label consistency, controllability, reproducibility, distribution shift, rare-event usefulness, contamination risk, and transfer to held-out simulations or real environments.

Evidence: Generator/model version, scenario specification, random seed, parameters, labels, acceptance checks, known limitations, and links to downstream dataset/evaluation use.
3.15 Robotics
User promise: Deploy and evaluate intelligence on robots.

Use-case-specific capabilities
- Robot/device connectors; camera, depth/LiDAR, IMU, force/torque and telemetry ingestion; mapping/localization/perception; planning/manipulation/navigation policy adapters; hardware-in-the-loop evaluation; and deployment lifecycle management.
- Support simulation, replay, shadow evaluation, constrained laboratory trials, supervised deployment, and controlled rollout. Device capabilities and safety requirements are robot-specific and must be explicitly declared.
Shared Horos infrastructure: Physical Execution Fabric, Deployment Runtime, World Models, Physical AI, Synthetic Reality, Sim2Real Gap Engine, Governance/Authority, Observation, Evidence, Verification, Experience and Evolution.

Required evaluation: Task success, perception/localization quality, trajectory quality, collision and constraint metrics, repeatability, recovery, sim-to-real performance, control latency, hardware reliability, and safety events.

Evidence: Robot model/firmware, sensor calibration, map/environment version, action/trajectory, control bounds, operator approvals, telemetry, task result, fault/stop events, and verified release package.
4. Cross-use-case capability matrix
Legend: Core means mandatory shared dependency; Domain means the use case adds specific components or data; Conditional means activated for relevant workloads.
Shared Horos subsystem	Voice	Language	Code	Research	Vision	Multimodal	Reasoning	World models	Engineering	Agents	Autonomous systems	Scientific	Physical AI	Synthetic reality	Robotics
Mission + outcome contract	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core
Model / capability registry	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core
Data, training, post-training	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain
Context, retrieval, memory	Core	Core	Core	Core	Conditional	Core	Core	Conditional	Core	Core	Core	Core	Conditional	Conditional	Conditional
Tools, skills, connectors	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Domain	Core	Core	Domain	Domain	Domain	Core
Evaluator / verifier fabric	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core
Workload replay + optimization	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core
Evidence / provenance / lineage	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core	Core
Reality Fabric + sensor grounding	Conditional	Conditional	Conditional	Conditional	Domain	Domain	Conditional	Core	Domain	Conditional	Core	Domain	Core	Core	Core
Synthetic environments / data	Conditional	Conditional	Conditional	Conditional	Domain	Domain	Conditional	Domain	Domain	Domain	Domain	Domain	Core	Core	Core
Hardware-in-the-loop / physical execution	—	—	—	Conditional	Conditional	Conditional	—	Domain	Conditional	Conditional	Domain	Conditional	Domain	Domain	Core


The matrix is a planning artifact rather than a claim that every capability is already implemented. It should become machine-readable metadata in the use-case registry once the contracts stabilize.
5. Model families and capability routing
Horos should route on task-level capabilities and constraints, not use-case label alone. A Voice AI request could choose a direct audio model or an ASR → language model → TTS composition. A Code Intelligence mission may combine a code model, repository retrieval, tools, sandbox execution, and deterministic test verifiers. A Robotics mission may combine perception, world/state estimation, planning, a constrained controller, and hardware-specific safety checks.

The Capability Fabric must record for each candidate:
- Input/output modalities and schema compatibility.
- Task and domain capabilities backed by evaluation results.
- Context length, tool capabilities, and supported execution modes.
- License, provenance, dependencies, security review, artifact digest, and revision.
- Supported hardware/runtime profiles, quantization/precision variants, memory needs, and measured performance.
- Applicable evaluation suite versions, quality/cost/latency measurements, uncertainty limits, and known failure modes.
- Policy compatibility, data constraints, deployment targets, and rollback support.
Model IDs and provider icons shown in the website must come from the actual model/capability registry. A displayed provider/model mark is a compatibility indicator only when a tested integration and evaluation record exist; do not imply that a model is supported merely because its logo is shown.
6. Shared use-case execution path
USER / API / SDK
      │
      ▼
USE-CASE REGISTRY ───► resolve versioned UseCaseDefinition
      │
      ▼
MISSION RUNTIME ─────► normalize request + establish Outcome Contract
      │
      ▼
GOVERNANCE / AUTHORITY ───► allow / deny / require approval
      │
      ▼
REALITY + CONTEXT + CAPABILITY DISCOVERY
      │
      ▼
SYSTEM COMPOSER ─────► model(s) + data + context + tools + runtime + compute
      │
      ▼
EVALUATE / PREDICT / EXPERIMENT ───► select candidate under constraints
      │
      ▼
DEPLOY / EXECUTE ─────► cloud, customer environment, edge, or physical system
      │
      ▼
OBSERVE ───► MEASURE ───► EVIDENCE ───► VERIFY ───► MISSION RESULT
      │                                                  │
      └──► EXPERIENCE ───► FAILURE MINING ───► LESSON ──┘
                                                       │
                                                       ▼
                                         TEACH / OPTIMIZE / EVOLVE
                                                       │
                                                       ▼
                                           new version + regression tests
                                           
The execution path is shared. What changes by use case is the typed input/output contract, component composition, tools/connectors, applicable evaluations, policy profile, runtime target, and evidence profile.
7. Suggested service/API additions
Keep the API surface small and resource-oriented. Exact route naming is subject to the API review.
- GET /v1/use-cases — enumerate registered use cases and their release states.
- GET /v1/use-cases/{slug} — read a versioned use-case definition and its supported capabilities.
- POST /v1/missions — create a mission with a use_case reference and version-pinned outcome contract.
- GET /v1/missions/{mission_id} — read current state and result summary.
- POST /v1/missions/{mission_id}/pause and /resume — durable mission controls subject to authority.
- GET /v1/missions/{mission_id}/events — ordered, correlated state and progress events.
- GET /v1/missions/{mission_id}/evidence — provenance-aware evidence index with access control.
- GET /v1/use-cases/{slug}/evaluations — list validated evaluation suites and compatible candidate versions.
- POST /v1/experiments — create a typed experiment linked to a baseline, candidate, workload and safety policy.
- POST /v1/deployments — deploy a verified system package to an authorized target.
Use-case APIs should reuse the common mission and artifact contracts. Avoid creating 15 divergent APIs that duplicate identity, mission state, authorization, metering, evidence, and lineage.
8. Product navigation and release-state model
The website's 15-item grid is a navigation layer over the registry. Each use-case landing page should be backed by actual product metadata:
- Name and customer-facing promise.
- Representative workloads and input/output types.
- Capability components and supported modality combinations.
- Compatible model/system candidates and their evidence-backed evaluation status.
- Tools, connectors, datasets, runtime targets, and policy requirements.
- Quality/latency/cost trade-offs relevant to the workload.
- Example mission, result artifact, proof/evidence view, and system package/export behavior.
Use a clear release status such as research, experimental, preview, or generally available. These are product states, not architecture cuts: the architecture and registries can include all 15 from the start, while claims of availability depend on passing the relevant acceptance gates.
9. Use-case acceptance gate
A use case is integrated into Horos only when all applicable criteria pass:
1. A versioned UseCaseDefinition exists and passes schema validation.
2. A user can start a mission and inspect status, checkpoints, and outcome contract.
3. Inputs, outputs, errors, and side effects are typed and validated.
4. Candidate models/tools/runtime combinations are selected from compatible, provenance-tracked capabilities.
5. Policies, authority, budget, approvals, and credentials are checked before privileged execution.
6. At least one relevant evaluation suite and independent verifiers are versioned, runnable, and tied to acceptance thresholds.
7. A baseline, candidate, workload, and result are reproducible to the degree required by the domain.
8. Observations are correlated to the mission and normalized into measurements.
9. Evidence contains source, timestamp, artifact/version digests, environment, execution, and provenance references.
10. A mission result reports what changed, what was verified, known uncertainty/limitations, and what can happen next.
11. Failure cases, regressions, and policy denials are tested; unsafe automatic retries or unbounded escalation are prevented.
12. Release, rollout, rollback, metering, and operational dashboards are defined for the use case.
13. Relevant privacy, data retention, licensing, security, domain review, and physical-safety controls are documented and tested.
14. Feedback and outcomes can enter the Experience / Lesson / Teaching loop without bypassing dataset curation, evaluation integrity, or release approval.
Physical AI, Autonomous Systems, and Robotics require additional hardware-in-the-loop validation, constrained action envelopes, operator override, emergency stop, and explicit authorization. A model output alone is never sufficient authority to execute a consequential physical action.
10. Implementation policy: no product-scope reduction
All 15 use cases and the complete platform remain in the target architecture. Build strategy should be parallel capability development with dependency-aware integration:
- Establish registry/schema/mission/evidence contracts so all 15 use cases can be declared from the beginning.
- Develop shared platform components once and expose stable contracts for every use-case team.
- Build reusable reference compositions to validate the cross-platform path, then extend each family with its domain-specific models, tools, datasets, verifiers, and runtime profiles.
- Run model integration, Research AI workflows, data/evaluation, serving/optimization, and reality/physical capabilities as connected workstreams; share artifacts and measurements through registries and lineage. Do not make large-scale from-scratch pretraining a prerequisite for product delivery; the five prioritized first-party model workstreams still begin in parallel and use the same shared contracts.
- Do not mark a use case production-ready until its acceptance gate is satisfied. Keep the use case in the registry with its correct status rather than removing it from the product plan.
- Any learning loop that changes models, policies, runtime, or physical behavior must create a versioned candidate, pass the relevant evaluations, and use controlled rollout and rollback.
The goal is one complete Horos platform capable of composing, evaluating, optimizing, deploying, verifying, and improving intelligence across all 15 application families. It supports the full research and first-party model-development program while remaining capable of delivering platform value through external models. Horos-owned models and external baselines share the same registry, evaluations, routing, deployment, evidence and evolution contracts.