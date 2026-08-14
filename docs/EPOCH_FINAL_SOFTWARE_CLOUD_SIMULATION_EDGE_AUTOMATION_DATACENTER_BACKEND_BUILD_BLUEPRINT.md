EPOCH_BACKEND_BUILD_PLAN.md


EPOCH — BEAST BACKEND BUILD PLAN
Product: Epoch
Document: Backend Architecture + Implementation Plan
Status: Build-ready architecture
Goal: Build the complete backend foundation for Epoch as one coherent Mission Runtime — not a collection of disconnected MVP services.

0. WHAT THIS DOCUMENT IS
This document translates the Epoch product architecture into a backend that can actually be built.

The backend must support the complete loop:

CUSTOMER INTENT
      ↓
DISCOVERY
      ↓
WORLD STATE
      ↓
UNKNOWN + HYPOTHESES
      ↓
CAPABILITY GAP
      ↓
CAPABILITY FABRIC
      ↓
CANDIDATE GENERATION
      ↓
SIMULATION / SANDBOX / BENCHMARK
      ↓
QUALITY + COST + PERFORMANCE
      ↓
DECISION
      ↓
POLICY + AUTHORITY
      ↓
MISSION PLAN
      ↓
WORKERS
      ↓
EXECUTION
      ↓
OBSERVATION
      ↓
EVIDENCE
      ↓
VERIFICATION
      ↓
CUSTOMER OUTCOME
      ↓
FAILURE / UNCERTAINTY → DISCOVERY AGAIN
The existing product plan explicitly defines Epoch as a verified outcome runtime and makes Mission the durable unit connecting outcome, world state, hypotheses, capabilities, experiments, execution, evidence and verification.

This backend plan implements that architecture.

1. BACKEND NORTH STAR
The backend should answer five questions at every moment:

What is Epoch trying to achieve?

What does Epoch currently believe about the environment?

What did Epoch try and why?

What actually happened?

What evidence proves the result?

The backend is therefore not simply:

REST API + PostgreSQL
It is:

                  EPOCH BACKEND
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   CONTROL PLANE   INTELLIGENCE   EXECUTION PLANE
        │              │              │
        ↓              ↓              ↓
   API / Auth      Discovery      Scheduler
   Missions        World Model    Workers
   Projects        Hypotheses     Sandbox
   Policies        Capabilities   Cloud
   Approvals       Candidates     Data Center
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                EVIDENCE PLANE
                       ↓
            Observation / Evidence
                       ↓
                 Verification
                       ↓
                  Outcome
2. IMPORTANT ARCHITECTURE DECISION
Do NOT start with 30 microservices.
Build a modular monolith control plane + durable job/workflow runtime + worker system.

That gives:

fast development

strong module boundaries

one database

one transaction boundary for core state

easy local development

clear future extraction points

The logical architecture can become distributed later without forcing distributed-system complexity on day one.

Recommended:

                    API
                     │
                     ↓
             EPOCH APPLICATION
                     │
       ┌─────────────┼─────────────┐
       │             │             │
   Discovery      Mission       Evidence
       │             │             │
   Capability     Policy       Verification
       │             │             │
   Experiment     Decision     Knowledge
       │             │             │
       └─────────────┼─────────────┘
                     ↓
             Workflow / Queue
                     ↓
                  Workers
                     ↓
        Software / Cloud / DC / AI
3. RECOMMENDED BACKEND STACK
Primary application language
TypeScript

Use it for:

API

domain logic

mission runtime

policy

worker SDK

integrations

event contracts

CLI

SDK

Reason: Epoch has a large contract-heavy system. TypeScript gives strong shared types between API, runtime, workers and integrations.

Database
PostgreSQL

Use PostgreSQL for:

organizations

users

projects

missions

outcomes

constraints

world-state metadata

hypotheses

capabilities

candidates

experiments

executions

policies

approvals

observations

evidence metadata

verification

audit

events

knowledge metadata

Do NOT put huge logs/model artifacts directly into PostgreSQL.

Object storage
Use S3-compatible object storage for:

benchmark logs

model metadata snapshots

evaluation datasets

experiment artifacts

deployment manifests

trace exports

screenshots

reports

evidence blobs

Use a storage abstraction so DigitalOcean Spaces, S3, MinIO or another provider can be swapped.

Durable workflows
Use a durable workflow engine such as Temporal for long-running missions and recovery.

Temporal is specifically designed for execution that can resume after crashes, network failures and infrastructure outages.

Epoch missions are naturally durable workflows:

Mission
  ↓
Discover
  ↓
Experiment
  ↓
Wait
  ↓
Approve
  ↓
Execute
  ↓
Observe for 24h
  ↓
Verify
Do not implement this as one giant HTTP request.

Queue / short jobs
Use Redis only where it is actually useful:

ephemeral coordination

rate limiting

caching

short-lived queues

locks where appropriate

Do not use Redis as the source of truth for missions.

Telemetry
Use OpenTelemetry for:

traces

metrics

logs

OpenTelemetry is vendor-neutral and supports traces, metrics and logs.

Epoch should convert telemetry into its own:

Telemetry
   ↓
Observation
   ↓
Measurement
   ↓
Evidence
   ↓
Verification
Raw telemetry is not automatically proof.

Containers
Docker for:

workers

sandboxes

benchmark environments

runtime adapters

local development

Kubernetes
Use Kubernetes as an execution substrate when multi-node scheduling is required.

Epoch should consume Kubernetes primitives instead of rebuilding a competing scheduler.

4. REPOSITORY STRUCTURE
Recommended monorepo:

epoch/
│
├── apps/
│   ├── api/
│   ├── worker/
│   ├── scheduler/
│   ├── realtime/
│   └── cli/
│
├── packages/
│   ├── contracts/
│   ├── config/
│   ├── database/
│   ├── auth/
│   ├── policy/
│   ├── identity/
│   ├── events/
│   ├── observability/
│   ├── storage/
│   ├── worker-sdk/
│   ├── evaluation-sdk/
│   ├── verification/
│   └── shared/
│
├── modules/
│   ├── organizations/
│   ├── projects/
│   ├── missions/
│   ├── outcomes/
│   ├── world-state/
│   ├── unknowns/
│   ├── hypotheses/
│   ├── capabilities/
│   ├── models/
│   ├── huggingface/
│   ├── runtimes/
│   ├── hardware/
│   ├── pipelines/
│   ├── candidates/
│   ├── simulations/
│   ├── sandboxes/
│   ├── benchmarks/
│   ├── evaluations/
│   ├── decisions/
│   ├── policies/
│   ├── authority/
│   ├── executions/
│   ├── observations/
│   ├── evidence/
│   ├── verification/
│   ├── knowledge/
│   ├── automation/
│   ├── recovery/
│   └── audit/
│
├── workers/
│   ├── model-source/
│   ├── model-runtime/
│   ├── simulation/
│   ├── sandbox/
│   ├── benchmark/
│   ├── software/
│   ├── cloud/
│   ├── datacenter/
│   ├── observation/
│   └── verification/
│
├── integrations/
│   ├── huggingface/
│   ├── github/
│   ├── kubernetes/
│   ├── docker/
│   ├── opentel/
│   ├── cloud/
│   └── datacenter/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   ├── state-machine/
│   ├── security/
│   ├── failure/
│   ├── replay/
│   └── e2e/
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DOMAIN_MODEL.md
    ├── WORKER_PROTOCOL.md
    ├── POLICY_MODEL.md
    ├── EVIDENCE_MODEL.md
    ├── VERIFICATION_MODEL.md
    └── API_CONTRACT.md
5. THE BACKEND PLANES
Epoch backend should have six conceptual planes.

Plane 1 — Identity
Responsible for:

organizations

users

projects

service identities

worker identities

credentials

permissions

Plane 2 — Intelligence
Responsible for:

world state

unknowns

discovery

hypotheses

capability graph

candidate generation

experiment design

decision intelligence

Plane 3 — Mission
Responsible for:

mission lifecycle

mission plans

steps

dependencies

scheduling

checkpoints

recovery

Plane 4 — Execution
Responsible for:

workers

leases

actions

sandbox

cloud

software

data center

deployment

Plane 5 — Trust
Responsible for:

observations

evidence

claims

verification

audit

provenance

Plane 6 — Experience / Learning
Responsible for:

historical experiments

knowledge

memory

reusable discoveries

production intelligence

learned candidate priors

Cross-cutting:

Security
Policy
Events
Observability
Budget
Storage
Idempotency
Versioning
6. CORE DOMAIN MODEL
These are the most important backend objects.

Organization
User
Project

Mission
OutcomeTarget
Constraint
Baseline

WorldState
WorldStateVersion
WorldFact

Unknown
DiscoveryProgram
Discovery
Hypothesis

Capability
CapabilityVersion
CapabilityRelation

ModelIdentity
ModelProfile
RuntimeIdentity
HardwareProfile

Pipeline
PipelineNode
PipelineEdge

Candidate
CompatibilityResult

Experiment
SimulationRun
SandboxRun
BenchmarkRun
EvaluationRun

Decision
DecisionFactor

Policy
AuthorityGrant
Approval

MissionPlan
MissionStep
Worker
WorkerLease

Execution
ExecutionAttempt
Checkpoint
Recovery

Observation
Measurement

Evidence
Claim
Verification

Artifact

Knowledge
Experience

Event
AuditRecord
7. ORGANIZATION + MULTI-TENANCY
Every customer must be isolated.

Hierarchy:

Organization
   ↓
Project
   ↓
Mission
Every important record should carry:

organization_id
Usually also:

project_id
mission_id
Never trust a client-supplied organization ID alone.

Resolve organization context from authenticated identity and server-side authorization.

Required rules
tenant isolation

project isolation

resource authorization

encrypted credentials

audit logging

scoped worker access

Test tenant isolation aggressively.

8. MISSION DOMAIN
Mission is the master object.

Mission
├── id
├── organizationId
├── projectId
├── title
├── intent
├── outcomeTargetId
├── baselineId
├── worldStateVersionId
├── status
├── priority
├── budget
├── riskLevel
├── autonomyLevel
├── createdAt
├── updatedAt
└── version
Mission states:

CREATED
DISCOVERING
UNDERSTANDING
HYPOTHESIZING
SEARCHING
EXPERIMENTING
MEASURING
RANKING
AWAITING_AUTHORITY
EXECUTING
OBSERVING
VERIFYING
SUCCEEDED
FAILED
UNCERTAIN
ROLLED_BACK
CANCELLED
Never allow random state mutation.

Use a state-machine transition function.

9. MISSION STATE MACHINE
Example:

CREATED
  ↓
DISCOVERING
  ↓
UNDERSTANDING
  ↓
HYPOTHESIZING
  ↓
SEARCHING
  ↓
EXPERIMENTING
  ↓
MEASURING
  ↓
RANKING
  ↓
AWAITING_AUTHORITY
  ↓
EXECUTING
  ↓
OBSERVING
  ↓
VERIFYING
  ↓
SUCCEEDED
Failure:

VERIFYING
   ↓
FAILED
   ↓
REDISCOVERY
   ↓
DISCOVERING
Uncertainty:

VERIFYING
   ↓
UNCERTAIN
   ↓
MISSING EVIDENCE
   ↓
DISCOVERY
Every transition creates an event.

10. OUTCOME COMPILER
Customers speak natural language.

Backend must turn that into machine-evaluable logic.

Input:

Make inference 30% cheaper without losing more than 3% quality.
Output:

{
  "objective": "reduce_inference_cost",
  "baseline": {
    "cost": 100000,
    "unit": "usd_per_month"
  },
  "targets": [
    {
      "metric": "cost",
      "operator": "<=",
      "value": 70000
    },
    {
      "metric": "quality",
      "operator": ">=",
      "relativeTo": "baseline",
      "value": 0.97
    }
  ],
  "verificationWindow": "30d"
}
The LLM may propose this structure.

A deterministic validator must validate it.

11. BASELINE DOMAIN
No improvement without a baseline.

Baseline contains:

model
runtime
hardware
workload
configuration
quality
latency
throughput
cost
availability
observation window
source
Baseline must be immutable after acceptance.

If it changes:

new baseline version
Never silently overwrite historical baseline data.

12. WORLD MODEL
World Model represents what Epoch currently believes.

WorldState
├── version
├── collectedAt
├── software
├── models
├── runtimes
├── hardware
├── cloud
├── dataCenter
├── workloads
├── capacity
├── cost
├── policies
└── observations
Each fact:

WorldFact
├── subject
├── property
├── value
├── source
├── observedAt
├── collectedAt
├── confidence
├── provenance
├── classification
└── expiresAt
Classifications:

OBSERVED
INFERRED
SIMULATED
USER_ASSERTED
EXTERNAL
UNKNOWN
13. WORLD-STATE VERSIONING
Never use "current database rows" as the only historical truth.

Create immutable snapshots:

world_state@1
world_state@2
world_state@3
A Mission references the version used for its decision.

Before execution:

PLANNED WORLD STATE
        vs
CURRENT WORLD STATE
If critical drift exists:

ABORT
 ↓
DISCOVER AGAIN
 ↓
REPLAN
This prevents executing an old plan against new infrastructure.

14. UNKNOWN DOMAIN
Unknowns are first-class.

Unknown
├── id
├── missionId
├── question
├── importance
├── uncertainty
├── impact
├── costToResolve
├── risk
├── status
└── resolution
Resolution options:

IGNORE
ESTIMATE
OBSERVE
BENCHMARK
EXPERIMENT
ASK_USER
Epoch should prioritize unknowns by expected value.

15. DISCOVERY ENGINE
Discovery converts:

OUTCOME
+
UNKNOWN
+
CONSTRAINTS
into:

WORLD STATE
+
HYPOTHESES
+
CAPABILITY GAP
+
DISCOVERY ACTIONS
Backend flow:

DiscoveryProgram
      ↓
WorldStateCollector
      ↓
UnknownResolver
      ↓
HypothesisEngine
      ↓
CapabilityGapAnalyzer
      ↓
ExperimentPlanner
16. HYPOTHESIS ENGINE
Represent competing explanations.

Hypothesis
├── id
├── missionId
├── claim
├── priorConfidence
├── supportingEvidence[]
├── contradictingEvidence[]
├── missingEvidence[]
├── experiments[]
├── posteriorConfidence
├── status
└── validityConditions
Statuses:

UNTESTED
SUPPORTED
REJECTED
UNCERTAIN
CONFIRMED
SUPERSEDED
Never let an LLM simply return:

"The problem is probably X."

It must produce a hypothesis object that can be tested.

17. CAPABILITY FABRIC
Capability is one of Epoch's most important domains.

Capability
├── id
├── type
├── name
├── provider
├── version
├── inputContract
├── outputContract
├── requirements
├── permissions
├── costModel
├── reliability
├── health
├── workerBinding
└── provenance
Capability types:

MODEL
MODEL_ARTIFACT
MODEL_VARIANT
LLM
VLM
EMBEDDING
RERANKER
STT
TTS
IMAGE
VIDEO
OCR
AUDIO
CODE

RUNTIME
INFERENCE_ENGINE

GPU
CPU
MEMORY
STORAGE
NETWORK

CLOUD_RESOURCE
DATA_CENTER_RESOURCE
DEPLOYMENT_TARGET

SIMULATOR
SANDBOX
BENCHMARKER
EVALUATOR
VERIFIER
OBSERVABILITY_SOURCE
18. CAPABILITY GRAPH
Capabilities need relationships.

STT
 ↓
TEXT
 ↓
EMBEDDING
 ↓
RETRIEVER
 ↓
RERANKER
 ↓
LLM
 ↓
TTS
Relations:

REQUIRES
PRODUCES
CONSUMES
COMPATIBLE_WITH
DEPENDS_ON
ALTERNATIVE_TO
DEPLOYED_ON
EVALUATED_BY
VERIFIED_BY
OPTIMIZED_BY
Store graph relationships in PostgreSQL first.

Do not introduce a graph database until actual query patterns prove PostgreSQL insufficient.

19. HUGGING FACE BACKEND
Hugging Face is the first model source.

Current Hugging Face APIs support model discovery, provider filtering, provider mappings and provider-level information. The API can expose provider status, context length, pricing, tool/structured-output support and performance signals where available.

Backend connector:

HuggingFaceConnector
├── searchModels()
├── getModel()
├── getModelRevision()
├── getFiles()
├── getProviderMappings()
├── getInferenceStatus()
├── getModelMetadata()
└── syncModel()
Do not make Hugging Face the database.

Epoch stores a normalized snapshot.

20. MODEL IDENTITY
Never benchmark a moving branch.

ModelIdentity
├── source = huggingface
├── repositoryId
├── revision
├── commitSha
├── artifactDigest
├── retrievedAt
└── metadataVersion
Every benchmark and execution references an exact ModelIdentity.

21. MODEL PROFILE
ModelProfile
├── identity
├── task
├── architecture
├── parameterEstimate
├── precision
├── tokenizer
├── context
├── modalities
├── inputSchema
├── outputSchema
├── hardwareRequirements
├── runtimeCompatibility
├── providerAvailability
├── license
└── governance
Each property should support:

KNOWN
UNKNOWN
INFERRED
UNSUPPORTED
BLOCKED
No silent hallucinated metadata.

22. MULTIMODAL MODEL CAPABILITIES
Backend should be modality-neutral from the beginning.

Support capability families:

TEXT
├── LLM
├── EMBEDDING
└── RERANKER

AUDIO
├── STT
├── TTS
└── AUDIO_CLASSIFICATION

IMAGE
├── VLM
├── GENERATION
├── OCR
├── DETECTION
└── SEGMENTATION

VIDEO
├── GENERATION
├── UNDERSTANDING
└── ANALYSIS
The same candidate/evaluation machinery should work across them.

23. RUNTIME DOMAIN
Runtime identity:

RuntimeIdentity
├── name
├── version
├── imageDigest
├── supportedModels
├── supportedArchitectures
├── supportedModalities
├── supportedPrecisions
├── hardwareCompatibility
├── configurationSchema
└── provenance
Initial adapters:

vLLM
SGLang
TensorRT-LLM
NVIDIA NIM
generic container runtime
Epoch orchestrates them.

Epoch does not rebuild them.

24. HARDWARE DOMAIN
HardwareProfile
├── id
├── vendor
├── architecture
├── model
├── vram
├── memoryBandwidth
├── computeCapability
├── supportedPrecisions
├── power
├── availability
├── location
├── cost
└── source
Compatibility:

MODEL
×
RUNTIME
×
PRECISION
×
GPU
×
WORKLOAD
×
TARGET
25. CLOUD DOMAIN
Normalize cloud resources.

CloudResource
├── provider
├── region
├── instanceType
├── cpu
├── gpu
├── memory
├── storage
├── network
├── capacity
├── pricing
├── availability
└── deploymentCapabilities
Provider adapter:

CloudWorker
├── discover()
├── inventory()
├── estimateCost()
├── validate()
├── prepare()
├── deploy()
├── scale()
├── observe()
└── rollback()
Keep provider-specific code behind adapters.

26. DATA CENTER DOMAIN
Data Center resources:

DataCenterResource
├── site
├── rack
├── node
├── GPU
├── CPU
├── memory
├── storage
├── network
├── capacity
├── utilization
├── power
├── thermalState
└── health
Initial backend capabilities:

discover
observe
benchmark
recommend
place
optimizeUtilization
Do not initially give Epoch autonomous authority over:

power switching
cooling controls
physical hardware mutation
27. PIPELINE DOMAIN
Epoch must eventually optimize complete systems.

Pipeline
├── id
├── inputContract
├── outputContract
├── nodes[]
├── edges[]
├── qualityRequirements
├── latencyBudget
├── costBudget
└── failureStrategy
Node:

PipelineNode
├── capabilityId
├── inputContract
├── outputContract
├── latencyBudget
├── qualityRequirement
├── resourceRequirement
├── retryPolicy
└── failureBehavior
28. CANDIDATE ENGINE
A Candidate is a complete configuration.

Candidate
├── model
├── modelVariant
├── runtime
├── runtimeVersion
├── precision
├── hardware
├── gpuCount
├── batching
├── concurrency
├── pipeline
├── target
└── configuration
Candidate lifecycle:

GENERATED
 ↓
GOVERNANCE_CHECK
 ↓
COMPATIBILITY_CHECK
 ↓
ANALYTICAL_FILTER
 ↓
SIMULATION
 ↓
SMOKE_TEST
 ↓
QUALITY_TEST
 ↓
FULL_BENCHMARK
 ↓
ELIGIBLE / REJECTED
29. COMPATIBILITY ENGINE
Result:

COMPATIBLE
INCOMPATIBLE
UNKNOWN
BLOCKED
Checks:

architecture
precision
VRAM
runtime support
hardware support
artifact availability
workload
network
permissions
policy
Unknown is not compatible.

Unknown requires controlled testing.

30. EXPERIMENT DOMAIN
Experiment
├── id
├── missionId
├── type
├── candidateId
├── hypothesisId
├── environment
├── workload
├── evaluationSet
├── budget
├── risk
├── expectedInformationGain
├── status
├── startedAt
└── completedAt
Experiment types:

BASELINE
COMPATIBILITY
PERFORMANCE
QUALITY
COST
STRESS
SCALING
FAILURE
PLACEMENT
CANARY
VERIFICATION
31. EXPERIMENT SELECTION
Do not benchmark everything.

For each experiment calculate:

informationGain
cost
duration
risk
uncertaintyReduction
candidateImportance
reversibility
evidenceQuality
Select high-value experiments first.

Conceptually:

VALUE OF INFORMATION
---------------------
COST + RISK + TIME
The exact algorithm can evolve.

32. SIMULATION ENGINE
Simulation predicts.

It does not prove.

Types:

CAPACITY
COST
TRAFFIC
QUEUEING
SCALING
PLACEMENT
FAILURE
RESOURCE_UTILIZATION
Every result must say:

PREDICTED
NOT OBSERVED
NOT VERIFIED
33. SANDBOX ENGINE
Sandbox runs untrusted or experimental workloads safely.

Required controls:

CPU limit
memory limit
GPU limit
storage limit
network policy
credential policy
process isolation
filesystem isolation
timeout
spend limit
cleanup
artifact capture
Flow:

Candidate
 ↓
Sandbox
 ↓
Load Model
 ↓
Start Runtime
 ↓
Run Workload
 ↓
Capture Metrics
 ↓
Capture Logs
 ↓
Capture Artifacts
 ↓
Destroy Environment
34. BENCHMARK ENGINE
Benchmark identity:

modelIdentity
runtimeIdentity
hardware
configuration
workload
dataset
softwareEnvironment
timestamp
Metrics:

TTFT
P50
P95
P99
endToEndLatency

requestsPerSecond
tokensPerSecond
itemsPerSecond

gpuUtilization
vram
cpu
ram
network
storage
power

costPerHour
costPerRequest
costPerToken
costPerMinute
costPerImage
costPerVideo
monthlyProjection
35. QUALITY ENGINE
Performance alone cannot select winners.

Quality must be independently evaluated.

LLM:

accuracy
instructionFollowing
groundedness
structuredOutput
taskSuccess
Embedding:

Recall@K
MRR
NDCG
STT:

WER
CER
TTS:

intelligibility
voiceConsistency
humanEvaluation
Image:

promptAdherence
semanticSimilarity
humanEvaluation
Video:

promptAdherence
temporalConsistency
visualQuality
36. EVALUATION SET
EvaluationSet
├── id
├── version
├── task
├── examples
├── source
├── license
├── checksum
└── evaluator
Evaluation sets must be versioned.

Candidates must be compared under equivalent conditions.

37. ECONOMIC ENGINE
Normalize economics.

compute
gpu
storage
network
provider
idleCapacity
experiment
operations
Output:

cost/hour
cost/request
cost/token
cost/minute
cost/image
cost/video
cost/month
A cheaper GPU is not automatically a cheaper system.

38. DECISION ENGINE
Decision dimensions:

quality
latency
throughput
cost
reliability
risk
governance
availability
Hard constraints:

MUST PASS
Soft objectives:

OPTIMIZE
Example:

HARD:
quality >= 97%
p99 <= 300ms
budget <= X

SOFT:
minimize cost
maximize throughput
maximize reliability
39. DECISION EXPLANATION
Every decision must produce:

winner
whyWinner
losers
whyLost
constraints
observedEvidence
simulatedEvidence
inferredEvidence
unknowns
confidence
Example:

Candidate B won.

Quality:
98.7% >= 97%

P99:
271ms <= 300ms

Cost:
$61k <= $70k

Policy:
PASS

Reliability:
PASS
40. POLICY ENGINE
Policy is deterministic.

Examples:

MAX_SPEND
ALLOWED_LICENSES
ALLOWED_REGIONS
ALLOWED_HARDWARE
ALLOWED_PROVIDERS
DATA_RESIDENCY
MAX_DOWNTIME
REQUIRED_APPROVAL
MAX_EXPERIMENT_COST
Results:

ALLOW
DENY
REQUIRES_APPROVAL
The LLM must never override policy.

41. AUTHORITY ENGINE
AI proposes.

Authority decides whether execution is allowed.

PROPOSAL
 ↓
VALIDATION
 ↓
POLICY
 ↓
AUTHORITY
 ↓
APPROVAL
 ↓
STATE RECHECK
 ↓
EXECUTION
Authority scope:

organization
project
mission
action
target
scope
timeWindow
planVersion
spendLimit
42. MISSION PLAN
Mission Plan is immutable after activation.

MissionPlan
├── id
├── missionId
├── version
├── steps[]
├── dependencies
├── policySnapshot
├── authoritySnapshot
├── worldStateVersion
└── status
Changing the plan creates:

plan@2
not a mutation of:

plan@1
43. MISSION STEP
MissionStep
├── id
├── planId
├── sequence
├── action
├── capability
├── worker
├── input
├── expectedOutput
├── dependencies
├── timeout
├── retryPolicy
├── compensation
├── verificationContract
└── status
Steps can form a DAG:

A ──→ C
│
└──→ B ──→ D
Independent steps can run concurrently.

44. WORKER PROTOCOL
Every worker implements the same conceptual contract:

register()
heartbeat()
discover()
validate()
simulate()
benchmark()
prepare()
execute()
observe()
collectEvidence()
compensate()
health()
Worker registration:

Worker
├── id
├── type
├── version
├── capabilities
├── environment
├── identity
├── health
├── metadata
└── policyScope
45. WORKER LEASE
Workers should not receive unlimited permanent authority.

Use leases.

WorkerLease
├── workerId
├── missionId
├── stepId
├── leaseId
├── issuedAt
├── expiresAt
├── fencingToken
├── scope
└── status
Expired worker:

NO EXECUTION
Fencing prevents stale workers from performing old actions.

46. EXECUTION ENGINE
Execution is a controlled state transition.

PLAN
 ↓
VALIDATE
 ↓
POLICY
 ↓
AUTHORITY
 ↓
STATE RECHECK
 ↓
PREPARE
 ↓
EXECUTE
 ↓
OBSERVE
 ↓
VERIFY
Execution object:

Execution
├── id
├── missionId
├── stepId
├── workerId
├── planVersion
├── action
├── target
├── idempotencyKey
├── timeout
├── retryPolicy
├── compensation
├── status
└── evidence
47. IDEMPOTENCY
Every privileged external action gets an idempotency key.

Example:

mission:123
step:deploy
plan:4
action:apply
If the same command arrives twice:

same idempotency key
→ return existing execution
Never duplicate a deployment because an HTTP response was lost.

48. CHECKPOINTING
Long missions need checkpoints.

Checkpoint
├── id
├── missionId
├── planVersion
├── stepId
├── stateSnapshot
├── completedSteps
├── pendingSteps
├── evidenceRefs
├── createdAt
└── checksum
If a worker crashes:

checkpoint
 ↓
reassign
 ↓
resume
Do not restart the entire mission unnecessarily.

49. RECOVERY ENGINE
Failure should be a state.

Handle:

worker crash
network timeout
provider outage
database restart
duplicate event
delayed event
stale lease
corrupt artifact
invalid credential
policy denial
verification failure
partial execution
telemetry loss
quality regression
latency regression
cost regression
Recovery strategies:

RETRY
RESUME
REASSIGN
ROLLBACK
COMPENSATE
ESCALATE
REDISCOVER
50. CANARY ENGINE
Production changes:

SHADOW
 ↓
1%
 ↓
5%
 ↓
20%
 ↓
50%
 ↓
100%
At every stage evaluate:

quality
latency
cost
errorRate
availability
Failure:

STOP
 ↓
ROLLBACK
 ↓
EVIDENCE
 ↓
REDISCOVERY
51. OBSERVATION ENGINE
Telemetry sources:

application metrics
runtime metrics
GPU metrics
cloud metrics
data-center metrics
cost
quality evaluations
logs
traces
Observation object:

Observation
├── id
├── source
├── sourceType
├── timestamp
├── window
├── metric
├── value
├── unit
├── method
├── rawReference
├── trustLevel
└── provenance
52. OPEN TELEMETRY PIPELINE
Use:

Application / Runtime / Infrastructure
                ↓
        OpenTelemetry
                ↓
             Collector
                ↓
        Epoch Observation
                ↓
           Measurement
                ↓
            Evidence
                ↓
          Verification
Epoch owns the semantic layer above telemetry.

53. EVIDENCE ENGINE
Evidence is a core moat.

Evidence types:

LOG
METRIC
TRACE
TOOL_CALL
TOOL_RESULT
FILE
SCREENSHOT
TEST
MODEL_OUTPUT
AGENT_OUTPUT
HUMAN_ATTESTATION
SENSOR_READING
DATABASE_OBSERVATION
POLICY_DECISION
RECOVERY_RECORD
Evidence:

Evidence
├── immutableId
├── contentHash
├── missionId
├── stepId
├── executionId
├── workerId
├── source
├── timestamp
├── storageRef
├── schemaVersion
├── provenance
├── retention
└── classification
Evidence must be tamper-evident.

54. ARTIFACT STORE
Large data goes to object storage.

Artifact:

Artifact
├── id
├── contentType
├── storageProvider
├── storageKey
├── checksum
├── size
├── producer
├── missionId
├── createdAt
└── retention
Examples:

benchmark.json
benchmark.log
model-profile.json
evaluation-results.json
trace.json
deployment.yaml
quality-report.json
55. CLAIM SYSTEM
Epoch should explicitly represent claims.

Claim
├── id
├── statement
├── missionId
├── evidenceRefs
├── verificationRef
├── status
└── confidence
Statuses:

VERIFIED
PARTIALLY_VERIFIED
NOT_PROVEN
CONTRADICTED
UNCERTAIN
Example:

Claim:
"New configuration reduced cost by 32%."

Evidence:
baseline billing
benchmark
production observation
quality evaluation

Verification:
VERIFIED
56. VERIFICATION ENGINE
Verification must be separate from execution.

Execution
 ↓
Observation
 ↓
Measurement
 ↓
Evidence
 ↓
Verifier
 ↓
Verdict
Verdicts:

VERIFIED_SUCCESS
PARTIAL_SUCCESS
FAILED
NOT_PROVEN
UNCERTAIN
BLOCKED
ROLLED_BACK
Verifier types:

DETERMINISTIC_ASSERTION
TEST
POLICY_CHECK
INDEPENDENT_AI_EVALUATOR
HUMAN_REVIEW
SYSTEM_CHECK
When independence is required, the executor must not self-certify.

57. VERIFICATION WINDOW
Some outcomes need time.

Examples:

monthly cost
availability
quality drift
reliability
Therefore:

EXECUTE
 ↓
OBSERVATION WINDOW
 ↓
MEASURE
 ↓
VERIFY
Mission can remain:

VERIFYING
for the required window.

58. FAILURE / UNCERTAINTY LOOP
Failure:

FAILURE
 ↓
NEW OBSERVATION
 ↓
NEW WORLD STATE
 ↓
UPDATE HYPOTHESES
 ↓
NEW CAPABILITY GAP
 ↓
NEW CANDIDATES
 ↓
NEW EXPERIMENT
Uncertainty:

UNCERTAIN
 ↓
IDENTIFY MISSING EVIDENCE
 ↓
DISCOVERY
 ↓
OBSERVE / EXPERIMENT
Epoch must never turn uncertainty into success.

59. DRIFT ENGINE
After successful deployment monitor:

QUALITY_DRIFT
LATENCY_DRIFT
COST_DRIFT
TRAFFIC_DRIFT
CAPACITY_DRIFT
MODEL_DRIFT
RUNTIME_DRIFT
HARDWARE_DRIFT
PROVIDER_DRIFT
If threshold crossed:

REDISCOVERY_REQUEST
This turns Epoch into a continuous runtime.

60. KNOWLEDGE / EXPERIENCE
Every mission produces reusable experience.

Experience
├── problem
├── environment
├── hypotheses
├── capabilities
├── experiments
├── result
├── evidence
├── verification
├── conditions
├── cost
├── risk
└── validity
Historical result:

Qwen
+
SGLang
+
H100
+
FP8
+
Workload X
→
Excellent latency
→
Poor cost
Future missions can reuse this information.

61. MEMORY
Memory is a subsystem, not the product thesis.

Before mission:

retrieve
 ↓
score relevance
 ↓
verify scope
 ↓
context pack
After mission:

mission
 ↓
outcome
 ↓
lesson
 ↓
verification
 ↓
approved memory
Memory must never silently override current evidence.

62. KNOWLEDGE VERSIONING
knowledge@1
knowledge@2
knowledge@3
Each knowledge version references:

evidence
discovery
environment
verification
validity conditions
Contradiction:

CONFLICT
 ↓
REOPEN
 ↓
INVESTIGATE
 ↓
EXPERIMENT
 ↓
VERIFY
 ↓
NEW KNOWLEDGE
63. AUTOMATION ENGINE
Automation should coordinate routine work.

Trigger
 ↓
Context Builder
 ↓
Policy
 ↓
Plan
 ↓
Execute
 ↓
Verify
 ↓
Continue / Escalate
 ↓
Record Experience
Automation rule:

type AutomationRule = {
  id: string
  trigger: Trigger
  conditions: Condition[]
  actions: AutomationAction[]
  policy: PolicyReference
  verification: VerificationContract
  approval?: ApprovalRequirement
  budget?: Budget
  retryPolicy: RetryPolicy
  enabled: boolean
}
Automation levels:

AUTO
AUTO + VERIFY
AUTO + APPROVAL
HUMAN REQUIRED
64. AI MODEL USAGE IN BACKEND
Use LLMs for:

intent parsing
hypothesis generation
unknown decomposition
candidate explanation
experiment proposal
failure analysis
discovery reasoning
decision explanation
Do NOT use LLMs as the final authority for:

policy
permissions
spend limits
identity
state transitions
cryptographic integrity
verification rules
tenant isolation
Architecture:

LLM PROPOSAL
     ↓
STRUCTURED OUTPUT
     ↓
SCHEMA VALIDATION
     ↓
DETERMINISTIC VALIDATION
     ↓
POLICY
     ↓
EXECUTION
65. LLM GATEWAY
Create one internal gateway.

LLMGateway
├── generate()
├── structuredGenerate()
├── stream()
├── embed()
├── evaluate()
└── health()
The gateway records:

provider
model
request
response metadata
latency
tokens
cost
traceId
missionId
This allows model/provider changes without rewriting the whole backend.

66. MODEL PROVIDER ABSTRACTION
ModelProvider
├── discover()
├── inspect()
├── invoke()
├── estimateCost()
├── health()
└── capabilities()
Initial:

HuggingFace
Later:

private models
other registries
enterprise providers
internal models
67. API ARCHITECTURE
Use REST for the primary product API.

Optional internal gRPC can be introduced for high-throughput worker communication.

External API:

/api/v1
Core routes:

POST   /organizations
GET    /organizations/:id

POST   /projects
GET    /projects/:id

POST   /missions
GET    /missions/:id
POST   /missions/:id/cancel
POST   /missions/:id/replan

GET    /missions/:id/timeline
GET    /missions/:id/world-state
GET    /missions/:id/hypotheses
GET    /missions/:id/capabilities
GET    /missions/:id/candidates
GET    /missions/:id/experiments
GET    /missions/:id/decision
GET    /missions/:id/evidence
GET    /missions/:id/verification

POST   /missions/:id/discover
POST   /missions/:id/plan
POST   /missions/:id/authorize
POST   /missions/:id/execute
POST   /missions/:id/verify

POST   /models/import
POST   /model-sources/huggingface/inspect
GET    /models/:id

POST   /experiments
GET    /experiments/:id

POST   /workers/register
POST   /workers/:id/heartbeat

GET    /capabilities
GET    /capabilities/:id

GET    /policies
POST   /policies

GET    /approvals
POST   /approvals/:id/approve
POST   /approvals/:id/reject
68. API RULE
API handlers should be thin.

Bad:

HTTP controller
 → 500 lines of mission logic
Good:

Controller
 ↓
Application Service
 ↓
Domain Service
 ↓
Repository / Worker / Workflow
69. APPLICATION SERVICE EXAMPLE
CreateMission
   ↓
Validate request
   ↓
Resolve organization
   ↓
Create mission
   ↓
Create outcome
   ↓
Create constraints
   ↓
Capture initial event
   ↓
Start discovery workflow
The controller only orchestrates the request boundary.

70. DATABASE DESIGN PRINCIPLES
Use PostgreSQL with migrations.

Rules:

UUID/ULID identifiers

foreign keys

unique constraints

indexes

optimistic versioning

created_at / updated_at

soft deletion only where useful

immutable historical records

explicit status fields

JSONB for extensible provider metadata

relational columns for heavily queried fields

Do not put the whole domain object into one JSONB blob.

71. CORE TABLE GROUPS
Identity
organizations
users
memberships
projects
service_identities
credentials
Mission
missions
mission_versions
outcome_targets
constraints
baselines
mission_plans
mission_steps
Discovery
world_states
world_facts
unknowns
discovery_programs
discoveries
hypotheses
hypothesis_evidence
Capability
capabilities
capability_versions
capability_relations
model_identities
model_profiles
runtime_identities
hardware_profiles
pipelines
pipeline_nodes
pipeline_edges
Experiment
candidates
compatibility_results
experiments
simulation_runs
sandbox_runs
benchmark_runs
evaluation_runs
Execution
workers
worker_capabilities
worker_leases
executions
execution_attempts
checkpoints
recoveries
Trust
observations
measurements
evidence
claims
verifications
artifacts
Governance
policies
policy_versions
authority_grants
approvals
audit_records
Learning
experiences
knowledge
knowledge_versions
Events
events
outbox_events
72. EVENT MODEL
Epoch should be event-driven internally.

Events:

mission.created
mission.updated

world_state.captured
world_fact.updated

unknown.created
unknown.resolved

discovery.started
discovery.completed

hypothesis.created
hypothesis.supported
hypothesis.rejected

capability.discovered
capability.versioned

model.imported
model.inspected
model.governance_checked

candidate.generated
candidate.rejected
candidate.eligible

simulation.started
simulation.completed

sandbox.started
sandbox.completed

benchmark.started
benchmark.completed

evaluation.started
evaluation.completed

decision.created

approval.requested
approval.granted
approval.rejected

plan.created
plan.activated

worker.registered
worker.heartbeat
worker.lease_created

execution.prepared
execution.started
execution.completed
execution.failed

checkpoint.created
recovery.started
recovery.completed

observation.recorded
evidence.created

claim.created
verification.started
verification.completed

mission.succeeded
mission.failed
mission.uncertain
mission.rediscovery_requested
73. OUTBOX PATTERN
When changing database state and publishing an event:

BEGIN TRANSACTION

update mission

insert event into outbox

COMMIT
Then:

Outbox Publisher
 ↓
Event Bus / Workflow
This prevents:

database updated
but event lost
74. EVENT IDEMPOTENCY
Every event should have:

eventId
eventType
aggregateId
aggregateVersion
occurredAt
producer
correlationId
causationId
payload
schemaVersion
Consumers must be idempotent.

Store processed event IDs where needed.

75. CORRELATION
Every request should propagate:

requestId
traceId
missionId
executionId
stepId
workerId
Example:

HTTP request
 ↓
mission
 ↓
workflow
 ↓
step
 ↓
worker
 ↓
execution
 ↓
observation
 ↓
evidence
You should be able to trace the entire chain.

76. SECURITY ARCHITECTURE
Never give the AI a universal credential.

Use:

identity
 ↓
capability
 ↓
policy
 ↓
authority
 ↓
scoped credential
 ↓
worker
Credential scope:

who
what
where
when
how much
Secrets should be stored in a secret manager, not normal database columns or source code.

77. CREDENTIAL BROKER
For privileged workers:

Mission
 ↓
Authorized Action
 ↓
Credential Request
 ↓
Policy
 ↓
Scoped Credential
 ↓
Worker
Credential should be:

short-lived
scoped
audited
revocable
78. SANDBOX SECURITY
Never run arbitrary model/code execution directly inside the API process.

Use separate workers and isolated execution environments.

API
 ↓
Sandbox Job
 ↓
isolated container/runtime
 ↓
resource limits
 ↓
network policy
 ↓
artifact capture
 ↓
destroy
For higher-risk workloads, use stronger isolation technology.

79. MODEL SECURITY
Treat model artifacts as untrusted.

Before execution:

source
 ↓
revision
 ↓
checksum
 ↓
file inspection
 ↓
license
 ↓
runtime compatibility
 ↓
sandbox
 ↓
resource limits
 ↓
network restrictions
Popularity is not a security guarantee.

80. AUTHORIZATION CHECK
Every privileged action should pass:

identity check
 ↓
tenant check
 ↓
capability check
 ↓
policy check
 ↓
authority check
 ↓
budget check
 ↓
world-state check
 ↓
approval if required
 ↓
execute
81. BUDGET ENGINE
Every mission can have:

maxTotalSpend
maxExperimentSpend
maxExecutionSpend
maxRuntime
maxParallelExperiments
maxRetries
Track:

estimatedCost
reservedCost
actualCost
remainingBudget
Do not allow race conditions to overspend.

Use atomic budget reservation.

82. APPROVAL ENGINE
Approval object:

Approval
├── id
├── missionId
├── planVersion
├── requestedBy
├── requestedAt
├── scope
├── risk
├── spend
├── expiresAt
├── decision
├── decidedBy
└── evidence
Approval must bind to a specific plan version.

If plan changes:

old approval invalid
83. WORKER SCHEDULER
Scheduler chooses workers using:

capability
policy
health
cost
latency
trust
availability
location
capacity
Example:

Candidate requires:
H100
vLLM
Linux
GPU memory >= 80GB

Scheduler:
Worker A → compatible
Worker B → incompatible
Worker C → compatible but unhealthy
Worker D → compatible + healthy

Select D
84. WORKER HEARTBEAT
Worker sends:

workerId
timestamp
health
capacity
runningJobs
capabilities
version
resourceUsage
If heartbeat expires:

worker unhealthy
 ↓
lease expires
 ↓
recovery
85. CLOUD WORKER
Cloud worker should expose normalized operations:

discover
inventory
estimateCost
validate
prepare
deploy
scale
observe
rollback
Provider-specific adapters:

AWSAdapter
GCPAdapter
AzureAdapter
DigitalOceanAdapter
Start with only the providers actually required by the environment, but keep the interface provider-neutral.

86. DATA CENTER WORKER
discover
inventory
benchmark
place
observe
collectEvidence
health
It should integrate with existing telemetry and orchestration systems.

Do not create a replacement Kubernetes scheduler.

87. SOFTWARE WORKER
Software actions:

repository inspection
test execution
configuration changes
deployment
service restart
routing change
database migration
High-risk flow:

PROPOSE
 ↓
VALIDATE
 ↓
SANDBOX
 ↓
TEST
 ↓
POLICY
 ↓
APPROVAL
 ↓
CANARY
 ↓
EXECUTE
 ↓
OBSERVE
 ↓
VERIFY
88. GITHUB / SOFTWARE INTEGRATION
For software missions:

GitHub
 ↓
Repository Discovery
 ↓
Code State
 ↓
Tests
 ↓
Hypotheses
 ↓
Sandbox
 ↓
Patch
 ↓
Tests
 ↓
Evidence
 ↓
Verification
Never give an agent unrestricted repository credentials.

Use scoped access.

89. MCP
MCP can be an integration surface for capabilities.

But MCP must not bypass Epoch policy.

Correct:

Agent
 ↓
MCP
 ↓
Epoch Capability
 ↓
Policy
 ↓
Authority
 ↓
Worker
Wrong:

Agent
 ↓
MCP
 ↓
production
90. SDK
Provide SDKs around the same contracts.

@epoch/sdk
@epoch/worker-sdk
@epoch/evaluation-sdk
Core:

createMission()
getMission()
watchMission()
cancelMission()
approveMission()
getEvidence()
getVerification()
registerWorker()
reportObservation()
91. REALTIME API
Frontend needs live mission updates.

Use:

WebSocket
or:

Server-Sent Events
Stream events:

mission state
step state
worker state
benchmark progress
execution progress
evidence created
verification state
Do not make realtime the source of truth.

PostgreSQL/event state remains authoritative.

92. API ERROR MODEL
Every API error should be structured.

{
  "error": {
    "code": "MISSION_STATE_CONFLICT",
    "message": "Mission cannot execute from VERIFYING state.",
    "requestId": "req_...",
    "retryable": false
  }
}
Codes should be stable.

93. RETRY MODEL
Retry only safe operations automatically.

Classify:

SAFE_RETRY
CONDITIONAL_RETRY
NO_RETRY
Examples:

GET metadata → SAFE_RETRY
benchmark job → CONDITIONAL
database migration → NO_RETRY without compensation
payment-like external action → idempotent retry only
deployment → idempotency required
94. DATABASE TRANSACTIONS
Transactions should protect state invariants.

Example:

approve plan
+
create approval event
+
activate plan
must happen atomically where required.

Do not hold database transactions open while calling external cloud APIs.

Use:

DB transaction
 ↓
durable state
 ↓
external action
 ↓
observation
 ↓
state update
95. SAGA / COMPENSATION
Distributed actions cannot be rolled back magically.

Use compensation.

Example:

Deploy new runtime
 ↓
Canary
 ↓
Failure
 ↓
Deploy previous runtime
 ↓
Verify rollback
Execution stores:

compensationAction
rollbackTarget
rollbackVersion
96. REPLAY
Every mission should be replayable as a logical history.

Replay should reconstruct:

world state
hypotheses
candidate generation
experiments
decisions
execution
evidence
verification
Replay must not execute external actions.

Use:

REPLAY MODE
that only reconstructs state.

97. AUDIT
Audit every privileged event.

AuditRecord
├── actor
├── organization
├── action
├── target
├── policyDecision
├── authority
├── timestamp
├── requestId
├── traceId
└── result
Audit records should be append-only.

98. OBSERVABILITY
Instrument every backend module.

Metrics:

mission_created_total
mission_duration
mission_success_rate
mission_failure_rate

workflow_latency
worker_job_latency

benchmark_duration
benchmark_cost

verification_duration

api_latency
api_error_rate

queue_depth
worker_capacity

evidence_ingestion_rate
Traces:

HTTP
 → application service
 → workflow
 → worker
 → external provider
99. BACKEND SLO TARGETS
Initial targets:

API availability: 99.9%

Mission command acknowledgement:
p95 < 500ms excluding execution

Realtime event visibility:
p95 < 2 seconds

Lost accepted mission transitions:
0

Duplicate privileged action for same idempotency key:
0

Terminal mission without verification:
0

Privileged tool call without policy decision:
0

Evidence integrity failures:
0
These are targets, not claims.

100. TESTING STRATEGY
Every module:

unit tests
contract tests
integration tests
state-machine tests
tenant-isolation tests
idempotency tests
concurrency tests
policy tests
failure injection
recovery tests
evidence integrity tests
verification tests
migration tests
replay tests
observability tests
Automation additionally:

duplicate trigger tests
race tests
permission boundary tests
budget tests
loop detection
escalation tests
101. FAILURE INJECTION
Regularly simulate:

worker crash
provider outage
network loss
database restart
duplicate event
delayed event
stale lease
corrupt artifact
invalid credential
policy denial
verification failure
partial execution
telemetry loss
quality regression
latency regression
cost regression
Failure becomes a tested state.

102. END-TO-END TEST
The most important test:

CREATE CUSTOMER
 ↓
CREATE PROJECT
 ↓
IMPORT HUGGING FACE MODEL
 ↓
CREATE OUTCOME
 ↓
CREATE CONSTRAINTS
 ↓
CAPTURE BASELINE
 ↓
DISCOVERY
 ↓
WORLD STATE
 ↓
HYPOTHESES
 ↓
CAPABILITY GAP
 ↓
CANDIDATES
 ↓
COMPATIBILITY
 ↓
SIMULATION
 ↓
SANDBOX
 ↓
BENCHMARK
 ↓
QUALITY
 ↓
COST
 ↓
DECISION
 ↓
POLICY
 ↓
AUTHORITY
 ↓
EXECUTION
 ↓
OBSERVATION
 ↓
EVIDENCE
 ↓
VERIFICATION
 ↓
SUCCESS
This is the backend acceptance test.

103. FIRST REAL DEMO BACKEND
Example:

Model:
Qwen/Qwen3-8B

Goal:
Reduce inference cost 30%

Constraints:
quality >= 97%
p99 <= 300ms
no downtime
budget <= X
Backend should produce:

Candidate A
Qwen + vLLM + H100 + Cloud

Candidate B
Qwen + SGLang + H100 + Data Center

Candidate C
smaller compatible model + runtime + Cloud
Then:

candidate rejection reasons
benchmark evidence
quality evidence
cost evidence
decision
approval
execution
production observation
verification
Final:

VERIFIED_SUCCESS
or:

NOT_PROVEN
Never fake success.

104. FIRST BACKEND BUILD ORDER
Build in dependency order, while keeping all modules in the same product.

Gate A — Foundation
Build:

monorepo
TypeScript
PostgreSQL
migrations
config
logging
OpenTelemetry
auth
organizations
projects
events
Gate B — Mission Core
Build:

Mission
OutcomeTarget
Constraint
Baseline
MissionStateMachine
MissionPlan
MissionStep
Gate C — World Intelligence
Build:

WorldState
WorldFact
Unknown
DiscoveryProgram
Hypothesis
CapabilityGap
Gate D — Hugging Face
Build:

HuggingFaceConnector
ModelIdentity
ModelProfile
ModelInspector
Governance
ProviderMapping
Gate E — Capability Fabric
Build:

Capability
CapabilityVersion
CapabilityGraph
RuntimeProfile
HardwareProfile
CompatibilityEngine
Gate F — Candidate + Experiment
Build:

Pipeline
Candidate
CandidateGenerator
Simulation
Sandbox
Benchmark
Evaluation
EconomicEngine
Gate G — Decision
Build:

CandidateFilter
Ranker
Decision
DecisionExplanation
Confidence
Gate H — Runtime
Build:

Workflow
Scheduler
WorkerProtocol
WorkerLease
Execution
Checkpoint
Recovery
Gate I — Governance
Build:

Policy
Authority
Approval
Budget
CredentialBroker
Gate J — Execution Domains
Build:

SoftwareWorker
CloudWorker
DataCenterWorker
ModelRuntimeWorker
BenchmarkWorker
Gate K — Proof
Build:

Observation
Measurement
Evidence
Claim
Verification
Artifact
Audit
Gate L — Continuous Intelligence
Build:

Drift
Rediscovery
Experience
Knowledge
Memory
ProductionIntelligence
ExperimentSelection
105. LOCAL DEVELOPMENT ENVIRONMENT
Start with:

Docker Compose
Services:

postgres
redis
temporal
minio
otel-collector
epoch-api
epoch-worker
epoch-scheduler
Optional:

prometheus
grafana
jaeger
Local architecture:

                    API
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
      PostgreSQL            Temporal
          │                     │
          ↓                     ↓
       MinIO                 Workers
                                │
                ┌───────────────┼───────────────┐
                ↓               ↓               ↓
             Sandbox        Benchmark        Integrations
106. ENVIRONMENT VARIABLES
Example:

DATABASE_URL=
REDIS_URL=

TEMPORAL_ADDRESS=
TEMPORAL_NAMESPACE=

OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=

HF_TOKEN=

OTEL_EXPORTER_OTLP_ENDPOINT=

JWT_SECRET=

ENCRYPTION_KEY=

MAX_MISSION_SPEND=
MAX_EXPERIMENT_SPEND=
Never commit real secrets.

107. CONFIGURATION LAYERS
Separate:

application config
environment config
organization policy
mission policy
worker policy
Precedence should be explicit.

Never allow environment variables to silently override customer policy.

108. MIGRATIONS
Use versioned migrations.

Rules:

migration 001
migration 002
migration 003
...
Every migration must be:

repeatable in CI
tested
backward-aware
reviewed
For dangerous migrations:

expand
migrate
contract
109. DATA RETENTION
Different data has different retention.

Mission state:
long-term

Evidence:
policy-defined

Raw telemetry:
shorter

Benchmark artifacts:
long-term for reproducibility

Audit:
long-term

Temporary sandbox:
delete after capture
Never delete evidence required by an active verification.

110. COST CONTROL
Backend itself must be cost-aware.

Track:

LLM tokens
LLM cost
benchmark GPU hours
sandbox cost
storage
network
provider charges
worker runtime
Every mission gets:

estimatedCost
actualCost
Epoch should know how much it spent to produce an outcome.

111. INTERNAL COST MODEL
MissionCost
├── modelInference
├── embeddings
├── evaluations
├── benchmark
├── sandbox
├── storage
├── network
├── worker
└── externalServices
Output:

costToInvestigate
costToExperiment
costToExecute
costToVerify
costPerVerifiedOutcome
112. CUSTOMER VALUE METRIC
Track:

manualWorkAvoided
Concept:

estimatedManualEffort
-
actualHumanEffort
=
automationValue
Also:

costPerVerifiedOutcome
missionCompletionRate
timeToVerifiedOutcome
humanAttentionRequired
These become important product metrics.

113. API VERSIONING
Start:

/v1
Never break contracts casually.

For major changes:

/v2
Internal domain contracts should also have schema versions.

114. CONTRACT VERSIONING
Every durable object/event that can outlive a deployment should have:

schemaVersion
Especially:

events
evidence
artifacts
mission plans
worker contracts
verification results
115. WORKER SDK
The worker SDK should make worker development easy.

registerWorker()
heartbeat()
advertiseCapabilities()

onDiscover()
onValidate()
onBenchmark()
onPrepare()
onExecute()
onObserve()
onEvidence()
onCompensate()
The SDK handles:

authentication
heartbeat
leases
fencing
tracing
event publishing
evidence upload
retries
shutdown
Workers implement domain logic.

116. WORKER REGISTRATION
Worker sends:

{
  "type": "benchmark",
  "version": "1.0.0",
  "capabilities": [
    "gpu:nvidia:h100",
    "runtime:vllm"
  ],
  "environment": "datacenter-a"
}
Backend validates identity and policy before accepting capabilities.

117. WORKER TRUST
Not every worker should be trusted equally.

Worker trust metadata:

identity
attestation
version
health
history
environment
policyScope
failureRate
verificationHistory
Scheduler can prefer high-trust workers for important missions.

118. VERIFIER TRUST
Verifiers should also have trust metadata.

Example:

deterministic test
→ HIGH

production metric
→ HIGH

independent evaluator
→ HIGH

simulation
→ PREDICTIVE

LLM-only judgment
→ lower trust unless independently validated
Trust never replaces evidence.

119. DISCOVERY GRAPH
Build relationships:

Unknown
 ↓
Question
 ↓
Hypothesis
 ↓
Experiment
 ↓
Observation
 ↓
Evidence
 ↓
Discovery
 ↓
Capability
 ↓
Decision
This allows Epoch to answer:

Why does Epoch believe this?

by traversing provenance.

120. EVIDENCE GRAPH
Claim
 ↓
Evidence
 ↓
Observation
 ↓
Execution
 ↓
Mission Step
 ↓
Candidate
 ↓
Experiment
 ↓
Model / Runtime / Hardware
Every important result should be explainable through this graph.

121. PROVENANCE
Every important object should know:

createdBy
source
parent
version
timestamp
producer
For AI-generated content:

model
provider
prompt/template version
input reference
output reference
Do not store secrets inside prompts or evidence accidentally.

122. EVENT-SOURCED VS NORMAL DATABASE
Do not make the entire backend event-sourced.

Use:

PostgreSQL current state
+
append-only events
+
immutable evidence
This is simpler and gives most of the benefits.

Use events for:

timeline
audit
workflow triggers
replay
analytics
123. ANALYTICS
Backend should emit product events:

mission_started
mission_completed
mission_failed
verification_passed
verification_failed
experiment_run
candidate_selected
human_approval_requested
human_approval_granted
human_approval_rejected
Business analytics:

time_to_outcome
cost_per_outcome
automation_rate
human_intervention_rate
verification_rate
recovery_rate
124. RATE LIMITING
Per:

organization
user
API key
worker
provider
mission
Protect:

model APIs
benchmark APIs
cloud APIs
Hugging Face
LLM gateway
125. PROVIDER FAILURE
If Hugging Face or another provider is unavailable:

detect
 ↓
record observation
 ↓
mark provider unhealthy
 ↓
use cached metadata if valid
 ↓
avoid stale decisions
 ↓
retry / alternate provider
Never silently pretend provider data is current.

126. CACHE STRATEGY
Cache:

Hugging Face metadata
provider mappings
hardware catalog
cloud pricing
runtime compatibility
Every cache item needs:

retrievedAt
expiresAt
source
version
A stale cache must be labelled stale.

127. HUGGING FACE SYNC STRATEGY
Do not continuously download everything.

Use:

on-demand model inspection
+
targeted sync
+
webhook/event refresh where appropriate
+
TTL cache
When a customer gives:

Qwen/Qwen3-8B
Epoch fetches the exact relevant metadata.

128. MODEL IMPORT FLOW
POST /models/import
        ↓
validate repository ID
        ↓
HuggingFaceConnector
        ↓
fetch metadata
        ↓
resolve revision
        ↓
inspect files/config
        ↓
build ModelProfile
        ↓
governance
        ↓
store identity
        ↓
Capability Fabric
129. MODEL GOVERNANCE
Before expensive experiments:

access
 ↓
license
 ↓
gated status
 ↓
revision
 ↓
artifact
 ↓
policy
 ↓
eligible / blocked
Unknown license:

BLOCKED
until policy allows approval.

130. BENCHMARK JOB FLOW
Candidate
 ↓
Create BenchmarkRun
 ↓
Reserve budget
 ↓
Schedule worker
 ↓
Acquire lease
 ↓
Prepare environment
 ↓
Load model
 ↓
Start runtime
 ↓
Warmup
 ↓
Run workload
 ↓
Collect metrics
 ↓
Run quality evaluation
 ↓
Upload artifacts
 ↓
Release resources
 ↓
Create evidence
 ↓
Complete BenchmarkRun
131. BENCHMARK FAIRNESS
Candidates must use comparable:

workload
dataset
traffic
warmup
measurement window
hardware measurement
input distribution
output distribution
The backend should store the benchmark protocol so fairness can be audited.

132. QUALITY EVALUATION FLOW
Candidate
 ↓
EvaluationSet
 ↓
Evaluator
 ↓
Measurements
 ↓
Evidence
 ↓
QualityResult
Quality results should reference:

evaluationSetVersion
evaluatorVersion
candidateVersion
133. CANDIDATE FILTER FLOW
ALL CANDIDATES
 ↓
GOVERNANCE
 ↓
COMPATIBILITY
 ↓
BUDGET
 ↓
QUALITY
 ↓
LATENCY
 ↓
RELIABILITY
 ↓
POLICY
 ↓
ELIGIBLE
Every rejected candidate gets a structured reason.

134. DECISION RECORD
Decision
├── id
├── missionId
├── selectedCandidateId
├── candidateScores
├── hardConstraintResults
├── softObjectiveResults
├── explanation
├── evidenceRefs
├── confidence
└── createdAt
Decision must be immutable.

New decision = new version.

135. PLAN ACTIVATION
Before activation:

candidate exists
candidate eligible
policy passes
authority valid
budget available
world state current
required evidence exists
Then:

activate plan
136. COMMIT-TIME RECHECK
Immediately before execution:

planned state
vs
current state
Check:

GPU availability
cloud price
worker health
model revision
policy
budget
deployment state
If critical drift:

NO EXECUTION
137. EXECUTION OBSERVATION
Do not trust worker-reported success alone.

Example:

Worker says:

deployment successful
Epoch must still observe:

service healthy
traffic flowing
latency acceptable
quality acceptable
cost acceptable
Then verify.

138. VERIFICATION EXAMPLE
Target:

cost <= $70k/month
quality >= 97%
p99 <= 300ms
downtime = 0
Observed:

cost = $68k
quality = 98.2%
p99 = 267ms
downtime = 0
Verifier:

VERIFIED_SUCCESS
Evidence attached to every assertion.

139. REDISCOVERY ENGINE
Trigger rediscovery when:

verification failed
verification uncertain
world drift
quality drift
cost drift
latency drift
provider outage
capacity change
model change
runtime change
new capability discovered
Rediscovery creates a new cycle.

It does not destroy the previous mission history.

140. MISSION HISTORY
Keep:

Mission
 ├── cycle 1
 ├── cycle 2
 ├── cycle 3
 └── cycle 4
Each cycle:

world state
hypotheses
candidates
experiments
decision
execution
evidence
verification
This is critical for learning.

141. BACKEND API SECURITY
Use:

JWT/session
API keys
service identities
worker certificates where appropriate
RBAC
resource-level authorization
Roles:

OWNER
ADMIN
ENGINEER
OPERATOR
VIEWER
APPROVER
WORKER
SERVICE
Permissions should be action-oriented:

mission:read
mission:create
mission:execute
mission:approve
evidence:read
worker:register
policy:manage
142. AUTHORIZATION MODEL
RBAC is not enough for privileged actions.

Use:

RBAC
+
resource scope
+
policy
+
authority
Example:

Engineer
may read mission.

Engineer
may propose execution.

Engineer
may not execute production change
unless authority permits it.
143. DATA CLASSIFICATION
Evidence and artifacts should have:

PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
Policy controls which workers and users may access them.

144. CUSTOMER DATA PROTECTION
Never send customer-sensitive data to an external model unless policy explicitly permits it.

Before LLM calls:

classify data
 ↓
redact / tokenize if required
 ↓
policy
 ↓
provider
Record provider/model metadata without exposing secrets.

145. BACKEND PERFORMANCE PRINCIPLES
Keep API operations fast.

Long work:

discover
benchmark
sandbox
deployment
verification
must become asynchronous jobs/workflows.

API:

POST mission
→ 202 Accepted
→ mission ID
Then:

GET mission
SSE/WebSocket events
146. DATABASE INDEXING
Index:

organization_id
project_id
mission_id
status
created_at
updated_at
worker_id
execution_id
candidate_id
experiment_id
event_type
aggregate_id
Composite indexes based on actual query patterns.

Do not blindly index every column.

147. DATABASE CONSISTENCY
Strong consistency for:

mission state
authority
policy
budget
execution state
verification state
Eventually consistent is acceptable for:

catalog metadata
telemetry
analytics
search indexes
148. SEARCH
Initially use PostgreSQL search for:

models
capabilities
experiences
missions
evidence metadata
Only introduce Elasticsearch/OpenSearch when actual search scale requires it.

149. SCHEDULING
Mission scheduler needs:

priority
dependencies
worker capacity
budget
policy
deadlines
risk
resource requirements
A mission step should become runnable only when:

dependencies complete
policy valid
budget available
worker available
world state acceptable
150. DAG EXECUTION
Example:

Inspect Model
     │
     ├──→ Check Runtime
     │
     └──→ Check Hardware
              │
              ↓
          Compatibility
              ↓
          Benchmark
Scheduler computes runnable nodes.

151. CONCURRENCY CONTROL
Use:

optimistic locking
leases
idempotency keys
fencing tokens
database constraints
Avoid global locks.

152. RATE OF AUTONOMY
Backend should support:

L0 Observe
L1 Recommend
L2 Automatically Experiment
L3 Sandbox Execution
L4 Bounded Production
L5 High Autonomy Within Authority
Mission declares autonomy level.

Policy can reduce it.

Never increase autonomy automatically.

153. ESCALATION
Escalate when:

uncertainty high
evidence conflicts
risk exceeds policy
budget exceeded
irreversible action
physical action
no safe recovery
verification UNKNOWN
Escalation must contain:

what happened
what Epoch tried
evidence
unknowns
decision required
recommended next action
154. NO-DRAMA FAILURE MODEL
Bad:

Execution failed.
Good:

Worker A failed during step 4.
Epoch restored checkpoint 3 and reassigned step 4 to Worker B.
Step 4 completed.
Verification is still pending.
Backend should store enough structured state to generate this explanation.

155. API REQUEST LIFECYCLE
Request
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
Application Service
 ↓
Domain Logic
 ↓
Transaction
 ↓
Event
 ↓
Workflow
 ↓
Worker
156. BACKEND MODULE RULE
Every module should have:

domain
application
infrastructure
API
tests
Example:

modules/missions/
├── domain/
├── application/
├── infrastructure/
├── api/
└── tests/
This prevents business logic from leaking everywhere.

157. DOMAIN SERVICE EXAMPLES
MissionStateMachine
OutcomeCompiler
BaselineService
WorldStateService
HypothesisService
CapabilityCompatibilityService
CandidateGenerationService
ExperimentSelectionService
DecisionService
PolicyEvaluator
AuthorityService
ExecutionService
RecoveryService
EvidenceService
VerificationService
RediscoveryService
158. REPOSITORY INTERFACES
Example:

interface MissionRepository {
  create(input: CreateMission): Promise<Mission>
  get(id: MissionId): Promise<Mission | null>
  updateVersioned(...): Promise<Mission>
}
Domain services should not depend directly on SQL.

159. EXTERNAL ADAPTER INTERFACES
Example:

interface ModelSource {
  inspectModel(input: InspectModelInput): Promise<ModelSourceResult>
}

interface CloudProvider {
  discoverResources(): Promise<Resource[]>
  estimateCost(input: CostRequest): Promise<CostEstimate>
  deploy(input: DeployRequest): Promise<DeploymentResult>
}
Adapters implement these interfaces.

160. DATABASE TRANSACTION BOUNDARIES
Transaction should include:

state mutation
+
event/outbox insertion
External calls happen outside.

Pattern:

transaction
 ↓
persist intent
 ↓
commit
 ↓
workflow
 ↓
external action
 ↓
observation
 ↓
persist result
161. MISSION WORKFLOW
Conceptually:

MissionWorkflow
{
  discover()
  establishBaseline()
  resolveUnknowns()
  generateHypotheses()
  identifyGap()
  discoverCapabilities()
  generateCandidates()
  testCandidates()
  selectDecision()
  requestAuthority()
  executePlan()
  observe()
  verify()
  continueOrFinish()
}
Every step must be durable.

162. WORKFLOW VS AGENT
Do not make the entire Mission a free-form agent loop.

Use:

Durable workflow
+
bounded AI reasoning activities
+
deterministic state machine
+
policy
+
workers
The AI reasons inside bounded steps.

The runtime controls the mission.

This is much safer and more reproducible.

163. AGENT ROLE
Agents can perform:

discovery reasoning
hypothesis generation
experiment design
failure analysis
code analysis
candidate explanation
Agent outputs become proposals.

They are not direct authority.

164. EXPERIMENT AGENT
An experiment agent can propose:

{
  "hypothesis": "runtime batching is inefficient",
  "experiment": {
    "batchSizes": [8,16,32],
    "workload": "production_replay",
    "metrics": ["p99", "tokens_per_second", "cost"]
  }
}
Backend validates:

schema
budget
policy
worker compatibility
Then executes.

165. DECISION AGENT
Agent can explain:

Candidate B is preferred because...
But actual eligibility comes from deterministic rules.

LLM explanation
+
deterministic decision
not:

LLM decides everything
166. VERIFICATION AGENT
AI evaluators can help with:

semantic quality
image quality
video quality
agent behavior
groundedness
But deterministic metrics should remain primary whenever possible.

167. MODEL ROUTING
Eventually support:

LOWEST_COST
LOWEST_LATENCY
HIGHEST_QUALITY
HIGHEST_RELIABILITY
BALANCED
POLICY_OPTIMAL
Routing should use measured data.

168. MODEL FALLBACK
PRIMARY
 ↓
failure
 ↓
FALLBACK
 ↓
quality verification
Fallback selection:

compatibility
quality
latency
cost
availability
policy
169. CAPACITY PLANNING
Future backend should predict:

GPU demand
CPU demand
memory
storage
network
traffic
Then recommend:

BUY
RENT
MOVE
SCALE
OPTIMIZE
REUSE
170. CLOUD VS DATA CENTER
This should become a major decision capability.

SAME WORKLOAD
      ↓
┌───────────────┬───────────────┬───────────────┐
│ CLOUD         │ DATA CENTER   │ HYBRID        │
└───────────────┴───────────────┴───────────────┘
      ↓
SAME EVALUATION
      ↓
COST + QUALITY + LATENCY + RELIABILITY + RISK
      ↓
BEST ELIGIBLE SYSTEM
171. HYBRID EXECUTION
Example:

normal traffic → data center
peak traffic → cloud
sensitive data → data center
overflow → cloud
Epoch can eventually optimize this routing policy.

172. PRODUCTION INTELLIGENCE
Production signals:

failure
latency
quality
cost
capacity
Loop:

PRODUCTION
 ↓
FAILURE SIGNAL
 ↓
CLUSTER
 ↓
HYPOTHESIS
 ↓
EVALUATION
 ↓
REPLAY
 ↓
FIX
 ↓
VERIFICATION
 ↓
MEMORY
Never silently modify production.

173. REPLAY SYSTEM
Store enough information to reproduce:

request
model identity
runtime
configuration
environment
tools
observations
Replay modes:

ANALYSIS_ONLY
SANDBOX
CONTROLLED_REEXECUTION
Default:

ANALYSIS_ONLY
174. DATA CENTER FUTURE
Long-term:

GPU utilization
fragmentation
idle capacity
memory fragmentation
network bottlenecks
thermal constraints
placement
But physical controls remain separate authority domains.

175. EDGE FUTURE
Keep worker protocol extensible.

Future:

EdgeWorker
But the current product core can remain:

Software
Cloud
Data Center
Sandbox
Simulation
The backend protocol should not need redesign when Edge arrives.

176. PHYSICAL FUTURE
Same primitives:

Environment
Worker
Capability
Mission
Experiment
Observation
Evidence
Verification
Outcome
But stronger safety:

simulation
 ↓
sandbox
 ↓
restricted physical test
 ↓
measurement
 ↓
verification
 ↓
expanded operation
No automatic authority escalation.

177. BACKEND MONOREPO COMMANDS
Suggested:

pnpm install

pnpm dev

pnpm db:migrate
pnpm db:seed

pnpm test
pnpm test:integration
pnpm test:e2e

pnpm lint
pnpm typecheck

pnpm worker:dev
pnpm scheduler:dev
178. LOCAL FIRST COMPLETE FLOW
After infrastructure is running:

pnpm db:migrate
pnpm db:seed
pnpm dev
Then:

Create organization
 ↓
Create project
 ↓
Import Hugging Face model
 ↓
Create mission
 ↓
Set outcome
 ↓
Set constraints
 ↓
Run discovery
 ↓
Generate candidates
 ↓
Run benchmark
 ↓
Create decision
 ↓
Approve
 ↓
Execute sandbox
 ↓
Collect evidence
 ↓
Verify
179. BACKEND BUILD CHECKLIST
Foundation
monorepo

TypeScript

PostgreSQL

migrations

config

authentication

authorization

OpenTelemetry

object storage

durable workflow runtime

Mission
mission

outcome

constraints

baseline

state machine

mission plan

steps

dependencies

Discovery
world state

facts

unknowns

hypotheses

capability gap

discovery program

Models
Hugging Face connector

model identity

model profile

revision pinning

governance

provider mappings

Capability
capability registry

capability graph

runtime profiles

hardware profiles

compatibility

Experiments
candidate engine

simulation

sandbox

benchmark

quality

economics

Decision
filter

rank

explanation

confidence

evidence references

Runtime
workflow

scheduler

worker protocol

leases

execution

checkpoint

recovery

Governance
policy

authority

approvals

budget

credential broker

Execution
software worker

cloud worker

data-center worker

runtime worker

benchmark worker

Proof
observations

measurements

evidence

claims

verification

audit

provenance

Intelligence
experience

knowledge

memory

drift

rediscovery

production intelligence

experiment selection

180. THE FIRST BACKEND VERTICAL SLICE
Do NOT stop after building CRUD.

The first backend milestone should run:

POST /missions
       ↓
Outcome Compiler
       ↓
World State
       ↓
Unknowns
       ↓
Hypotheses
       ↓
Hugging Face Model Inspection
       ↓
Capability Fabric
       ↓
Candidate Generation
       ↓
Compatibility
       ↓
Simulation
       ↓
Sandbox
       ↓
Benchmark
       ↓
Quality
       ↓
Cost
       ↓
Decision
       ↓
Policy
       ↓
Authority
       ↓
Worker
       ↓
Execution
       ↓
Observation
       ↓
Evidence
       ↓
Verification
       ↓
Mission Outcome
If this works end-to-end, Epoch has a real backend.

181. WHAT THE BACKEND MUST NEVER BECOME
Do not let Epoch become:

generic CRUD backend
or:

agent wrapper
or:

cloud dashboard
or:

model marketplace
or:

benchmark dashboard
or:

LLM API wrapper
The backend must remain:

Mission Runtime + Discovery + Execution + Evidence + Verification
182. THE CORE BACKEND LOOP
UNKNOWN
   ↓
DISCOVERY
   ↓
WORLD STATE
   ↓
HYPOTHESES
   ↓
CAPABILITY GAP
   ↓
CAPABILITY SEARCH
   ↓
CANDIDATES
   ↓
EXPERIMENTS
   ↓
MEASUREMENTS
   ↓
DECISION
   ↓
POLICY
   ↓
AUTHORITY
   ↓
MISSION PLAN
   ↓
WORKER
   ↓
EXECUTION
   ↓
OBSERVATION
   ↓
EVIDENCE
   ↓
VERIFICATION
   ↓
OUTCOME
   ↓
EXPERIENCE
   ↓
NEXT MISSION
183. BACKEND DEFINITION OF DONE
Epoch backend is meaningfully complete when a real customer can:

create a mission

describe an outcome

define constraints

establish a baseline

import a Hugging Face model

inspect its exact identity

discover the relevant environment

represent unknowns

generate hypotheses

identify capability gaps

discover capabilities

generate complete candidates

validate compatibility

simulate candidates

sandbox candidates

benchmark candidates

evaluate quality

calculate economics

filter invalid candidates

select a winner

understand the decision

request authority

approve within policy

execute through a worker

observe the real environment

collect immutable evidence

verify the requested outcome

detect failure or uncertainty

recover when possible

trigger rediscovery when required

retain the resulting experience

184. THE FINAL BACKEND ARCHITECTURE
                              EPOCH API
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ↓                 ↓                 ↓
            IDENTITY          MISSION           DISCOVERY
                │                 │                 │
                │                 ↓                 ↓
                │             WORKFLOW          WORLD MODEL
                │                 │                 │
                │                 ↓                 ↓
                │             SCHEDULER         HYPOTHESES
                │                 │                 │
                │                 ↓                 ↓
                │             WORKERS          CAPABILITIES
                │                 │                 │
                └────────────┬────┴───────┬─────────┘
                             ↓            ↓
                         EXPERIMENT    DECISION
                             │            │
                             ↓            ↓
                         SANDBOX      POLICY
                             │            │
                         BENCHMARK     AUTHORITY
                             │            │
                             └─────┬──────┘
                                   ↓
                               EXECUTION
                                   ↓
                         SOFTWARE / CLOUD /
                           DATA CENTER
                                   ↓
                              OBSERVATION
                                   ↓
                              MEASUREMENT
                                   ↓
                               EVIDENCE
                                   ↓
                                CLAIMS
                                   ↓
                              VERIFICATION
                                   ↓
                                OUTCOME
                                   ↓
                               KNOWLEDGE
                                   ↓
                              REDISCOVERY
185. FINAL ENGINEERING PRINCIPLE
Do not build:

backend first
frontend later
AI later
workers later
verification later
Build the backend as one connected system from day one.

But implement it in dependency order.

The product is always:

MISSION
The intelligence is:

DISCOVERY
The execution is:

WORKERS
The trust layer is:

EVIDENCE + VERIFICATION
The compounding layer is:

EXPERIENCE + KNOWLEDGE
The safety layer is:

POLICY + AUTHORITY
The infrastructure layer is:

SOFTWARE + CLOUD + DATA CENTER
The first AI ecosystem is:

HUGGING FACE
The orchestration layer is:

DURABLE WORKFLOWS
The observation layer is:

OPENTELEMETRY
The persistent state is:

POSTGRESQL
The artifact layer is:

OBJECT STORAGE
186. FINAL BUILD RULE
One product. One Mission Runtime. One backend architecture.

Do not create:

Epoch Model Optimizer
Epoch Cloud Manager
Epoch Data Center Manager
Epoch Benchmark Product
Epoch Agent Product
Epoch Evidence Product
Instead:

                         EPOCH
                           │
                    MISSION RUNTIME
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
     DISCOVER           DECIDE             EXECUTE
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ↓
                      VERIFY OUTCOME
                           ↓
                      LEARN / REDISCOVER
Every backend module exists because it advances that loop.

That is the architecture to build.