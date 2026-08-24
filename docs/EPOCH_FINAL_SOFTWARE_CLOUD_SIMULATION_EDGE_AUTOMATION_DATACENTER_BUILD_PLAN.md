EPOCH — FINAL CANONICAL PRODUCT ARCHITECTURE & BUILD PLAN

Status: Canonical engineering specification
Product: Epoch
North Star: Teach intelligent systems to decode reality through verified interaction with reality.
Primary product abstraction: Reality Intelligence Runtime
Build rule: Build the permanent domain and runtime from Day 1. Expand executable reality continuously. Never rebuild the core because a new reality surface becomes physical.

00. NON-NEGOTIABLE ARCHITECTURE

Epoch is a Reality Intelligence Runtime.

Epoch is not fundamentally a chatbot, model catalog, dashboard, GPU optimizer, Kubernetes replacement, FinOps dashboard, observability product, generic agent framework, coding agent, or workflow automation tool.

Epoch accepts human/system input and machine observations, constructs a versioned representation of reality, identifies uncertainty, discovers capabilities, composes candidate systems, experiments, decides, executes authorized changes, observes consequences, verifies claims, produces a concrete Mission Result, and turns verified experience into better intelligence.

The human owns intent, organizational authority, hard-to-infer goals, risk tolerance, exceptions, irreversible/high-impact decisions, and accountability. Epoch owns discovery, analysis, decomposition, planning, experimentation, implementation, testing, deployment, observation, diagnosis, optimization, evidence collection, verification, rollback, learning, and continuous adaptation when authorized.

The existing plan explicitly establishes this outcome-centered boundary and states that the user should interact primarily with outcome, constraints, authority, and exceptions rather than manually driving every task. fileciteturn94file0L29-L87

01. FINAL CANONICAL PRODUCT DIAGRAM

                                  EPOCH
                    REALITY INTELLIGENCE RUNTIME
                                  │
                                  ▼
                        HUMAN / SYSTEM INPUT
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
                                  ▼
                          MISSION RUNTIME
                                  │
          ┌───────────────────────┼────────────────────────┐
          ▼                       ▼                        ▼
   REALITY FABRIC          CAPABILITY FABRIC        KNOWLEDGE FABRIC
          │                       │                        │
   software/cloud/        models/runtimes/tools       memory/lessons/docs
   physical/system
          └───────────────────────┼────────────────────────┘
                                  │
                                  ▼
                           UNKNOWN ENGINE
                                  │
                                  ▼
                         HYPOTHESIS ENGINE
                                  │
                                  ▼
                       CAPABILITY DISCOVERY
                                  │
                                  ▼
                           SYSTEM COMPOSER
                                  │
                                  ▼
                          CANDIDATE SYSTEMS
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
             SYSTEM A         SYSTEM B         SYSTEM C
                 └────────────────┼────────────────┘
                                  ▼
                          EXPERIMENT ENGINE
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
             SIMULATION         SANDBOX         BENCHMARK
                 └────────────────┼────────────────┘
                                  ▼
                         QUALITY + ECONOMICS
                                  │
                                  ▼
                           DECISION ENGINE
                                  │
                                  ▼
                         POLICY + AUTHORITY
                                  │
                                  ▼
                      AUTONOMOUS POLICY ENGINE
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
             RISK CHECK       COST CHECK       SAFETY CHECK
                 └────────────────┼────────────────┘
                                  │
                                  ▼
                    AUTONOMOUS AUTHORIZATION
                                  │
                                  ▼
                            STATE RECHECK
                                  │
                                  ▼
                         EXECUTION FABRIC
        ┌─────────────────────────┼──────────────────────────┐
        ▼                         ▼                          ▼
    SOFTWARE                   COMPUTE                  PHYSICAL
    code/API                  GPU/CPU/K8s                robot
    service                   cloud/bare metal           machine
    database                  runtime                    vehicle
    deployment                workload                   factory
                                                            sensor
        └─────────────────────────┼──────────────────────────┘
                                  ▼
                               REALITY
                                  │
                                  ▼
                         CONSEQUENCE ENGINE
                                  │
                                  ▼
                       OBSERVATION FABRIC
                                  │
                                  ▼
                          EVIDENCE FABRIC
                                  │
                                  ▼
                       INDEPENDENT VERIFIER
                                  │
                                  ▼
                               VERDICT
                                  │
                                  ▼
                         MISSION RESULT
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
        PRIMARY RESULT        DELIVERABLE             PROOF
             │                    │                    │
             ▼                    ▼                    ▼
     what became true      thing customer uses    evidence /
     or was learned       / deploys / exports     provenance /
                                                   verification
                                  │
                                  ▼
                            NEXT ACTIONS
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
              DEPLOY            APPLY             ACT
                 │                │                │
          software/model      config/policy    physical change
                 └────────────────┼────────────────┘
                                  ▼
                              CONSEQUENCE
                                  │
                                  ▼
                            OBSERVATION
                                  │
                                  ▼
                             VERIFICATION
                                  │
                                  ▼
                         EXPERIENCE ENGINE
                                  │
                                  ▼
                            LESSON ENGINE
                                  │
                                  ▼
                           TEACHING FABRIC
                                  │
                                  ▼
                     INTELLIGENCE EVOLUTION
                                  │
                                  ▼
                         BETTER REALITY MODEL
                                  │
                                  └──────────────► NEXT MISSION

This final loop is aligned with the source plan's central closed loop from intent through reality, uncertainty, experiments, authorized action, observation, evidence, verification, and learning. fileciteturn94file0L89-L195

02. FINAL REALITY-SURFACE ARCHITECTURE

The following is not a product roadmap and must not be interpreted as “build computational first, then rebuild for physical.”

All reality surfaces are part of the Day-1 semantic architecture. What expands is the set of connected adapters, capabilities, execution backends, sensors, models, and environments.

                         PERMANENT EPOCH CORE
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ▼                          ▼                          ▼
 COMPUTATIONAL               OPERATIONAL                   EDGE
       │                          │                          │
 models                     services                    cameras
 inference                  APIs                        sensors
 GPU / CPU                   databases                   gateways
 memory                     networks                    local compute
 K8s                        telemetry                   streams
 cloud
 data center
       └──────────────────────────┼──────────────────────────┘
                                  ▼
                              PHYSICAL
                                  │
                         machines / robots / vehicles
                                  │
                                  ▼
                             INDUSTRIAL
                                  │
                     factories / warehouses / energy
                                  │
                                  ▼
                             SCIENTIFIC
                                  │
                    laboratories / instruments / experiments
                                  │
                                  ▼
                               GENERAL

These surfaces feed the same Reality Fabric. The source plan likewise defines a stable mission runtime while environments expand and states that new environments do not require changing the core runtime. fileciteturn95file7L938-L981

03. PRODUCT THESIS

Canonical statement:

Epoch is the Reality Intelligence Runtime that teaches intelligent systems to decode reality, understand what is true and unknown, optimize and test possible changes, act within authority, verify what actually happened, and learn from every verified interaction.

Short statement:

Teach intelligence to decode reality.

Operational statement:

Epoch turns intent into a measurable, verified, usable Mission Result and compounds that result into better future intelligence.

04. TWO PRIMARY FUNCTIONS: DECODE + OPTIMIZE

Epoch has two inseparable intelligence functions.

Decode reality

Decode asks:

What exists?

What is happening?

What changed?

What relationships exist?

What is unknown?

What is likely to happen?

Which observations support this state?

Optimize reality

Optimize asks:

What should change?

Which system should be used?

Which configuration is better?

Which intervention has the best outcome?

What should be deployed or applied?

What should be tested next?

REALITY
  ↓
DECODE
  ↓
UNDERSTAND
  ↓
UNKNOWN
  ↓
HYPOTHESIS
  ↓
PREDICT / SIMULATE
  ↓
OPTIMIZE
  ↓
DECIDE
  ↓
ACT
  ↓
OBSERVE
  ↓
VERIFY
  ↓
LEARN

05. OUTCOME-CENTERED PRODUCT

The unit of automation is the outcome loop, not the task.

Traditional:

USER → TASK → AUTOMATION → OUTPUT

Agent:

USER → PROMPT → AGENT → OUTPUT

Epoch:

HUMAN
  ↓
INTENT
  ↓
OUTCOME
  ↓
REALITY
  ↓
UNKNOWN
  ↓
HYPOTHESIS
  ↓
CAPABILITY
  ↓
SYSTEM
  ↓
EXPERIMENT
  ↓
DECISION
  ↓
AUTHORITY
  ↓
ACTION
  ↓
OBSERVATION
  ↓
EVIDENCE
  ↓
VERIFICATION
  ↓
LEARNING
  ↓
UPDATED REALITY

The source blueprint makes this exact distinction and explicitly says the task system is an implementation detail while the outcome is the product object. fileciteturn95file7L982-L1048

06. USER INPUT MODEL

Epoch accepts much more than a text box.

Supported input modalities:

TEXT
SPEECH
AUDIO
IMAGE
VIDEO
DOCUMENT
TABULAR
CODE
JSON
API
DATABASE
TELEMETRY
EVENT
SENSOR
MODEL
ARTIFACT
REPOSITORY
CLOUD STATE
KUBERNETES STATE
BILLING
OBSERVABILITY

All inputs enter through a common InputEnvelope. The source plan defines this explicit input envelope and requires original inputs to be preserved while derived interpretations remain separate. fileciteturn95file4L412-L455

07. NATURAL-LANGUAGE COMPOSER

The composer must accept:

clean sentences

incomplete requests

technical shorthand

typos

informal language

mixed model/runtime names

pasted logs

copied deployment information

multimodal context

Example:

use llama 3.1 8b on vllm
need build more optimized capable which detect
the physical object on was driving

Epoch does not require the user to transform this into a formal schema.

Instead:

USER TEXT
   ↓
LIVE PARSER
   ↓
PARTIAL STRUCTURED INTENT
   ↓
INLINE SUGGESTIONS
   ↓
USER CHOOSES / EDITS
   ↓
COMPLETE MISSION

Important rule:

Suggestions are suggestions. User selections are authoritative unless the selection is invalid or prohibited by policy.

08. INLINE COMPOSER MODEL

The composer should support editable tokens/chips such as:

[Model]
[Runtime]
[GPU / Compute]
[Runs on]
[Input]
[Reality]
[Output]
[Mission]
[Goal]
[Constraints]
[Authority]

For example:

Optimize [Qwen3-32B] on [vLLM]
for lower [Cost]
while preserving [Quality] [P99]
on [H100]
in [Kubernetes / cluster-prod]

The user can change any chip.

Epoch should never silently replace a selected choice.

If Epoch recommends a different model:

Selected:
[Llama 3.1 8B]

Epoch suggestion:
[Vision-capable model]

Reason:
Mission requires visual object detection.

[Use suggestion] [Keep selected]

09. CONTEXTUAL SUGGESTION ENGINE

Before typing:

Optimize
Compare
Diagnose
Predict
Teach
Discover
Simulate
Experiment
Evaluate
Decode
Repair
Actuate
Adapt

After typing, suggestions become contextual.

Example:

User:
make this model better at detecting objects while driving

Suggestions:

Teach [model] to detect [objects] from [camera/video]
Optimize [model] for [real-time latency]
Evaluate [model] on [driving dataset]
Compare [candidate models]
Simulate [vehicle environment]

The suggestion engine must use current mission context rather than being a static list.

10. INTENT ENGINE

Pipeline:

INPUT
 ↓
CLASSIFY
 ↓
EXTRACT ENTITIES
 ↓
EXTRACT OBJECTIVE
 ↓
EXTRACT CONSTRAINTS
 ↓
EXTRACT SCOPE
 ↓
EXTRACT TIME
 ↓
EXTRACT REQUESTED ACTION
 ↓
EXTRACT AUTHORITY CONTEXT
 ↓
INTENT

Intent schema:

interface Intent {
  id: string;
  actor: ActorRef;
  objective: string;
  scope: Scope;
  context: Record<string, unknown>;
  constraints: Constraint[];
  requestedAction?: ActionIntent;
  urgency?: string;
  timeWindow?: TimeWindow;
  sourceRefs: SourceRef[];
  confidence: number;
}

11. OUTCOME INTELLIGENCE

Intent is not executable.

Epoch transforms broad intent into measurable outcome conditions where safely inferable.

Example:

"make inference cheaper"

becomes:

objective = reduce inference cost

baseline:
cost = $182K/month
quality = 98.7%
p99 = 214ms

candidate target:
cost reduction >= 30%
quality >= 98.7%
p99 <= 250ms

If the target cannot safely be inferred, represent it as:

UNKNOWN

Then Epoch can:

inspect organizational defaults

inspect previous missions

propose a target

ask the user

block

12. OUTCOME CONTRACT

interface OutcomeContract {
  objective: string;

  baseline?: Baseline;

  targetMetrics: MetricTarget[];
  hardConstraints: Constraint[];
  softObjectives: Objective[];
  prohibitedTradeoffs?: Constraint[];

  observationWindow?: ObservationWindow;

  successCriteria: Condition[];
  failureCriteria: Condition[];

  verificationMethod: VerificationMethod;

  authorityRequirements: AuthorityRequirement[];
  expiry?: string;
}

The contract is the machine-readable definition of success.

13. MISSION RUNTIME

A Mission is the persistent execution context for an outcome.

Responsibilities:

state transitions

dependency resolution

workflow execution

retries

timeouts

compensation

authority checks

state validation

event emission

recovery

verification

monitoring

State machine:

CREATED
 ↓
NORMALIZING
 ↓
UNDERSTANDING
 ↓
DISCOVERING
 ↓
HYPOTHESIZING
 ↓
COMPOSING
 ↓
EXPERIMENTING
 ↓
DECIDING
 ↓
AUTHORIZATION_REQUIRED
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
 ↓
LEARNED

Failure states:

BLOCKED
FAILED
ROLLED_BACK
INCONCLUSIVE
EXPIRED

14. REALITY FABRIC

Reality is temporal and versioned.

Reality includes:

software

repositories

services

APIs

databases

models

runtimes

hardware

cloud resources

Kubernetes resources

users

customers

workloads

pipelines

costs

incidents

policies

experiments

deployments

physical entities

sensor state

machine state

Core properties:

current state
historical state
source provenance
confidence
validity interval
version
integrity

15. WORLD STATE

interface WorldState {
  id: string;
  organizationId: string;
  version: number;

  createdAt: string;
  validFrom: string;
  validUntil?: string;

  sourceSet: SourceRef[];
  factRefs: WorldFactRef[];

  integrityHash: string;
}

Every consequential plan references a WorldState.

Immediately before execution:

PLANNED WORLD STATE
        VS
CURRENT WORLD STATE
        │
   material diff?
     ┌──┴──┐
    NO    YES
     │      │
     ▼      ▼
 EXECUTE  STOP
            ↓
       REDISCOVER
            ↓
         REPLAN

16. REALITY GRAPH

Represent reality as a graph.

Example:

FACILITY
 ├── RACK
 │   ├── SERVER
 │   │   ├── GPU
 │   │   ├── CPU
 │   │   ├── MEMORY
 │   │   └── NIC
 │   ├── POWER
 │   └── COOLING
 ├── NETWORK
 └── WORKLOAD
      ├── MODEL
      ├── RUNTIME
      └── SERVICE

Physical:

FACTORY
 ├── WORKCELL
 │   ├── ROBOT
 │   ├── MACHINE
 │   ├── SENSOR
 │   └── PLC
 ├── ENERGY
 └── SAFETY

Relations include:

owns
contains
depends_on
deployed_on
runs
produces
consumes
located_in
compatible_with
alternative_to
observed_by
measured_by
affected_by
changed_by
verified_by

17. REALITY CONFLICT ENGINE

Reality sources may disagree.

Example:

Cloud API:
GPU available

Kubernetes:
GPU unavailable

Telemetry:
GPU unhealthy

Never silently choose one source.

Create:

RealityConflict

Resolve using:

source priority
freshness
cross-validation
measurement
experiment
human confirmation

18. UNKNOWN ENGINE

Unknown is first-class.

interface Unknown {
  id: string;
  statement: string;
  importance: number;
  impact: number;
  uncertainty: number;
  decisionDependency: string[];
  resolutionCost: number;
  risk: number;
  resolutionStrategy: ResolutionStrategy;
}

Resolution strategies:

OBSERVE
QUERY
ESTIMATE
BENCHMARK
SIMULATE
EXPERIMENT
CROSS_VALIDATE
ASK
BLOCK

Priority:

decision_impact × uncertainty × risk
-------------------------------------
resolution_cost

19. HYPOTHESIS ENGINE

For cost increase, for example:

H1 model changed
H2 runtime changed
H3 workload changed
H4 batching changed
H5 GPU utilization fell
H6 pricing changed
H7 traffic increased
H8 routing changed
H9 placement changed
H10 quality requirement changed

Rank using:

prior
+
evidence
+
decision impact
+
test cost
+
expected information gain

20. CAPABILITY FABRIC

Capabilities are modality/task based.

TEXT
CODE
IMAGE
AUDIO
VIDEO
DOCUMENT
TABULAR
EMBEDDING
STRUCTURED_DATA
SENSOR
TELEMETRY
MULTIMODAL

Capabilities include:

LLM
VLM
STT
TTS
OCR
IMAGE_GENERATION
VIDEO_GENERATION
EMBEDDING
RERANKING
CODE_GENERATION
CODE_REPAIR
RETRIEVAL
SEARCH
SIMULATION
EVALUATION
VERIFICATION
RUNTIME
HARDWARE
CLOUD_RESOURCE
DATA_CENTER_RESOURCE
SOFTWARE_SYSTEM
BUSINESS_SYSTEM
WORLD_MODEL
ROBOT_POLICY
PHYSICAL_PERCEPTION

21. CAPABILITY INPUT/OUTPUT GRAPH

TEXT → TEXT
TEXT → CODE
TEXT → EMBEDDING
TEXT → IMAGE
TEXT → VIDEO
TEXT → AUDIO

AUDIO → TEXT
AUDIO → LABEL

IMAGE → TEXT
IMAGE → LABEL
IMAGE → STRUCTURED_DATA

VIDEO → TEXT
VIDEO → EVENTS
VIDEO → STRUCTURED_DATA
VIDEO → WORLD_STATE

DOCUMENT → TEXT
DOCUMENT → STRUCTURED_DATA

TABULAR → PREDICTION
TABULAR → ANALYSIS

TELEMETRY → OBSERVATION
SENSOR → MEASUREMENT

ANY OBSERVABLE INPUT
        ↓
CAPABILITY GRAPH
        ↓
VALID OUTPUT

22. HUGGING FACE ADAPTER

Hugging Face is a capability/model source, not Epoch's architecture center.

Architecture:

HUGGING FACE
     ↓
HF ADAPTER
     ↓
NORMALIZER
     ↓
MODEL PROFILE
     ↓
CAPABILITY PROFILE
     ↓
CAPABILITY GRAPH
     ↓
SYSTEM COMPOSER

Store:

repository_id
revision
commit_sha
artifact_digest
task
modalities
architecture
parameters
precision
context
license
providers
provider_status
provider_signals
retrieved_at

Model identity must be pinned:

repository
+
revision
+
commit
+
artifact digest

Never benchmark only a mutable model name.

23. MODEL TRUTH LAYER

Separate external model claims from Epoch empirical facts.

MODEL CARD / PROVIDER CLAIM
        ↓
EPOCH CANDIDATE
        ↓
REAL WORKLOAD
        ↓
EXPERIMENT
        ↓
MEASUREMENT
        ↓
VERIFIED EMPIRICAL RECORD

This is critical for trustworthy optimization.

24. SYSTEM COMPOSER

Epoch composes systems, not isolated components.

Example:

VOICE AGENT

STT
 ↓
RETRIEVAL
 ↓
RERANKER
 ↓
LLM
 ↓
TOOLS
 ↓
TTS

Search dimensions:

models
runtimes
hardware
providers
network
storage
configuration
placement
software
data

The user can state:

build a voice agent under $0.02/minute
with <300ms median response latency

and the system composer can discover candidate systems.

25. CANDIDATE SYSTEM

interface CandidateSystem {
  id: string;
  systemDefinition: SystemDefinition;
  worldStateRef: string;
  expectedOutcome: ExpectedOutcome;
  assumptions: Assumption[];
  predictedMetrics: MetricPrediction[];
  risks: Risk[];
  compatibilityResult: CompatibilityResult;
  policyResult: PolicyResult;
  experimentPlan: ExperimentPlan;
}

Candidate search:

DISCOVER
 ↓
GOVERNANCE FILTER
 ↓
COMPATIBILITY FILTER
 ↓
ANALYTICAL FILTER
 ↓
SIMULATION
 ↓
SMOKE TEST
 ↓
QUALITY
 ↓
BENCHMARK
 ↓
LOAD TEST
 ↓
CANARY

26. EXPERIMENT FABRIC

interface Experiment {
  id: string;
  hypothesis: HypothesisRef;
  objective: string;
  candidates: CandidateRef[];

  controls: Control[];
  variables: Variable[];

  workload: WorkloadRef;
  environment: EnvironmentRef;
  budget: Budget;
  risk: RiskAssessment;

  expectedInformationGain: number;

  execution: ExperimentExecution;
  measurements: Measurement[];
  evidence: EvidenceRef[];
}

Experiment value:

expected_information_gain
× decision_impact
× uncertainty_reduction
--------------------------------
cost × risk × duration

Epoch selects experiments that maximize useful information.

27. SIMULATION FABRIC

Simulation can estimate:

capacity

cost

traffic

queueing

scaling

placement

failure

utilization

physical trajectories

world-model futures

Every simulation result is labeled:

SIMULATED

Never silently:

VERIFIED

28. SANDBOX FABRIC

Untrusted artifacts and generated systems enter bounded environments.

Controls:

CPU
GPU
memory
storage
network
credentials
spend
timeout
filesystem
process
artifacts

Flow:

CANDIDATE
 ↓
SANDBOX
 ↓
RUN
 ↓
OBSERVE
 ↓
CAPTURE
 ↓
DESTROY

29. BENCHMARK FABRIC

Every benchmark records:

model
revision
artifact
runtime
runtime version
hardware
configuration
workload
dataset
software environment
timestamp

Metrics may include:

LLM
TTFT
P50
P95
P99
tokens/sec
GPU utilization
VRAM
cost
quality

STT
WER
CER
real-time factor
latency
cost/minute

IMAGE
quality
latency
cost/image
GPU memory

VIDEO
FPS
generation time
quality
temporal consistency
cost/video

CODING
task success
test pass rate
repository success
latency
cost/task

PHYSICAL
state accuracy
trajectory error
collision rate
force/torque safety
energy
time-to-completion

30. QUALITY FABRIC

Quality is separate from infrastructure performance.

interface QualityEvaluator {
  taskSuccess: number;
  accuracy?: number;
  groundedness?: number;
  structuredOutputValidity?: number;
  domainMetrics: Metric[];
  humanEvaluation?: HumanEvaluation;
  modalityMetrics?: Metric[];
}

Evaluator versions must be pinned.

31. ECONOMIC REALITY

Normalize:

$/request
$/token
$/minute
$/image
$/video
$/task
$/successful outcome
$/GPU-hour
$/month
TCO

Do not optimize cheap failure.

Useful metric:

TOTAL COST
-----------------
SUCCESSFUL OUTCOMES

32. COMPANY REALITY GRAPH

Epoch can eventually understand organizational reality, not only infrastructure.

Entities:

Organization
User
Customer
Repository
Service
API
Database
Model
Runtime
Hardware
Node
Cluster
CloudResource
DataCenter
Workload
Pipeline
Deployment
Incident
Experiment
Mission
Policy
Evidence

This enables company-wide missions such as:

ship enterprise SSO

reduce onboarding abandonment

reduce cloud spend

patch security issue

repair failing pipeline

update documentation after architecture change

diagnose customer-support issue

33. SOFTWARE FABRIC

Epoch can automate software engineering:

DISCOVER
 ↓
SPECIFY
 ↓
PLAN
 ↓
IMPLEMENT
 ↓
TEST
 ↓
REVIEW
 ↓
POLICY
 ↓
AUTHORITY
 ↓
DEPLOY
 ↓
OBSERVE
 ↓
VERIFY

Generated code is never trusted merely because an AI produced it.

34. DATA CENTER REALITY

Data centers are a first-class physical computational environment.

Represent:

facility
room
rack
server
GPU
CPU
memory
NIC
PCIe
NVLink
power
cooling
network
workload
Kubernetes
runtime
model
service
telemetry

Important measurements:

power
temperature
PUE
GPU throttling
ECC errors
PCIe contention
NVLink bandwidth
network jitter
capacity
placement

The source plan explicitly calls out liquid-cooling temperatures, megawatt power, PUE, PCIe contention, NVLink bandwidth, ECC error rates, and bare-metal topology as Data Center reality. fileciteturn95file6L906-L915

35. PHYSICAL WORLD DECODING

Epoch must extend intelligence beyond internet text.

Inputs:

camera
video
thermal
force / torque
IMU
LiDAR
audio
pressure
vibration
environmental sensors
PLC
robot telemetry

Pipeline:

SENSOR
 ↓
OBSERVATION
 ↓
STATE ESTIMATION
 ↓
WORLD STATE
 ↓
RELATIONSHIPS
 ↓
DYNAMICS
 ↓
PREDICTION
 ↓
ACTION
 ↓
CONSEQUENCE
 ↓
OBSERVATION

The source plan explicitly defines physical sensory decoding and the goal of adapting world models to physical causality. fileciteturn95file0L38-L48

36. WORLD MODEL

A world model represents more than detected objects.

It should represent:

objects
locations
motion
relationships
machine states
environment state
events
causal hypotheses
predictions
risk
uncertainty

For physical intelligence:

camera + sensors
      ↓
world state
      ↓
what is happening?
      ↓
what is unknown?
      ↓
what will happen next?
      ↓
what action changes it?

37. TEACHING FABRIC

Teaching converts verified experience into learning signals.

WORLD STATE
    ↓
ACTION
    ↓
CONSEQUENCE
    ↓
OBSERVATION
    ↓
VERIFICATION
    ↓
EXPERIENCE
    ↓
LESSON
    ↓
TEACHING SIGNAL
    ↓
MODEL / POLICY / SKILL UPDATE
    ↓
EVALUATION
    ↓
PROMOTION

Teaching may use:

retrieval
prompt adaptation
memory
tool learning
skill learning
fine-tuning
LoRA
distillation
preference data
evaluation data
world-model training
policy learning
routing
system optimization

Epoch is not required to own foundation-model training infrastructure itself. It owns the verified experience loop.

38. ACTION MODEL

A first-class Action is required.

interface Action {
  id: string;
  missionId: string;

  target: EntityRef;
  capability: CapabilityRef;

  requestedChange: ChangeSpec;

  preconditions: Condition[];
  authority: AuthorityRef;

  risk: RiskAssessment;

  expectedConsequences: Prediction[];

  rollbackPlan?: RollbackPlan;

  status: ActionStatus;
}

39. DEPLOY / APPLY / ACT

These are customer-facing verbs over one backend Action primitive.

Deploy

Use for:

model

runtime

software service

container

inference stack

world-model service

production package

Meaning:

Instantiate the verified deliverable on the user-selected, authorized execution target.

Apply

Use for:

configuration

policy

scheduler

infrastructure setting

remediation

Meaning:

Change existing configuration/policy state.

Act / Actuate

Use for:

robot

machine

actuator

physical control

Meaning:

Change physical reality through an authorized action.

40. PHYSICAL-WORLD DEPLOYMENT VS ACTUATION

For:

Build an optimized capability that decodes physical objects while driving.

The pipeline is:

BUILD / TEACH DECODER
        ↓
OPTIMIZE DECODER
        ↓
MODEL + PERCEPTION + RUNTIME + SENSOR INGESTION
        ↓
OPTIMIZED DECODING SYSTEM
        ↓
DEPLOY
        ↓
SELECTED EDGE / VEHICLE / DATA-CENTER TARGET
        ↓
LIVE OBSERVATION
        ↓
DECODE WORLD STATE
        ↓
PREDICT
        ↓
RECOMMEND ACTION
        ↓
ACT / ACTUATE
        ↓
PHYSICAL CONSEQUENCE
        ↓
OBSERVE
        ↓
VERIFY
        ↓
LEARN

Deploy does not mean Act.

Deploy installs the intelligence.

Act uses that intelligence to change reality.

41. EXECUTION FABRIC

General execution pipeline:

PLAN
 ↓
VALIDATE
 ↓
AUTHORIZE
 ↓
PREPARE
 ↓
SHADOW
 ↓
CANARY
 ↓
EXECUTE
 ↓
OBSERVE
 ↓
VERIFY
 ↓
ROLL FORWARD / ROLLBACK

Action must record:

target
parameters
plan_version
idempotency_key
timeout
retry_policy
compensation
authorization
evidence_requirements

42. DEPLOYMENT TARGET FABRIC

Runs on in the composer determines the authorized execution destination.

Targets:

Epoch-managed compute
Cloud provider
Kubernetes
Docker / container host
On-prem
Bare metal
GPU provider
Edge device
Vehicle compute
Robot compute
Factory controller

Deployment flow:

MISSION RESULT
     ↓
DEPLOY
     ↓
RESOLVE TARGET
     ↓
CHECK CREDENTIALS
     ↓
CHECK AUTHORITY
     ↓
CHECK CURRENT STATE
     ↓
GENERATE DEPLOYMENT
     ↓
APPLY
     ↓
HEALTH CHECK
     ↓
TRAFFIC / FUNCTIONAL TEST
     ↓
OBSERVE
     ↓
VERIFY

43. MISSION RESULT

Every mission must finish in a customer-facing Mission Result.

The customer should see:

PRIMARY RESULT
MEASURED CHANGE
PRIMARY DELIVERABLE
PROOF
VERIFICATION
NEXT ACTIONS

The source plan already defines the final user output as outcome, baseline, current reality, unknowns, hypotheses, candidates, experiments, decision, action, observed result, evidence, verification, verdict, learning, and next action. fileciteturn95file9L1456-L1471

44. MISSION RESULT TAXONOMY

OPTIMIZE
→ Optimized production stack
→ benchmark receipt
→ verifier
→ deployment/export kit

COMPARE
→ decision winner
→ comparison package
→ recommendation

DIAGNOSE
→ verified diagnosis
→ remediation package

PREDICT
→ forecast
→ uncertainty
→ intervention package

DISCOVER
→ relationship / insight package

EXPERIMENT
→ experimental conclusion
→ methodology
→ evidence

EVALUATE
→ scorecard
→ evaluation package

TEACH
→ new capability
→ adapted model/skill
→ evaluation

DECODE REALITY
→ verified world-state package

DATA CENTER
→ operational outcome
→ scheduling/power/capacity policy

SIMULATE
→ future scenario
→ predicted consequence

REPAIR
→ patch/fix
→ tests
→ verification

ACTUATE
→ verified physical state change
→ action record

ADAPT
→ updated policy
→ verification

This preserves the source plan's typed outcome system while adding the final customer-facing result contract. The source already lists the 14 outcome types and their concrete forms. fileciteturn95file1L64-L97

45. CUSTOMER RESULT EXAMPLE — OPTIMIZE

VERIFIED OPTIMIZATION

Qwen3-32B · vLLM · H100

P99        184ms → 139ms
Throughput 401 → 518 tok/s
Cost       -31%
Quality    maintained

PRIMARY DELIVERABLE
Optimized production stack

INCLUDED
✓ serving configuration
✓ runtime version
✓ model revision
✓ Docker
✓ Kubernetes
✓ benchmark receipt
✓ verifier
✓ rollback

NEXT ACTIONS
[Deploy]
[Export Stack]
[Download Kit]
[Run Again]

46. CUSTOMER RESULT EXAMPLE — DECODE REALITY

VERIFIED WORLD STATE

VEHICLE-07

Objects
  pedestrian       14.2m
  cyclist          21.1m
  vehicle          31.4m

State
  speed            42 km/h
  road             wet
  visibility       moderate

Predicted next state
  pedestrian likely enters path

Uncertainty
  Camera-02 partially occluded

PRIMARY DELIVERABLE
Versioned World-State Package

NEXT ACTIONS
[Simulate]
[Recommend]
[Act]
[Continue Observation]

47. CUSTOMER RESULT EXAMPLE — TEACH

NEW CAPABILITY

factory.machine_state:v4

State understanding
64% → 88%

Anomaly detection
51% → 79%

PRIMARY DELIVERABLE
Adapted model + capability package

INCLUDED
✓ model revision
✓ dataset version
✓ evaluation
✓ failure cases
✓ deployment package

NEXT ACTIONS
[Evaluate]
[Promote]
[Deploy]
[Export]

48. CUSTOMER RESULT EXAMPLE — DIAGNOSE

VERIFIED DIAGNOSIS

Root cause:
PCIe contention

Evidence:
GPU counters
PCIe telemetry
controlled experiment

PRIMARY DELIVERABLE
Remediation package

NEXT ACTIONS
[Apply Fix]
[Create PR]
[Simulate]
[Monitor]

49. EXPORT STACK

Export is not deployment.

Export produces a reproducible system definition:

epoch-mission/
├── mission.json
├── outcome.json
├── model/
├── runtime/
├── configuration/
├── deployment/
├── policies/
├── safety/
├── benchmark/
├── verification/
├── rollback/
├── provenance/
└── README.md

The exact contents vary by mission.

50. DOWNLOAD KIT

Download Kit is the complete runnable delivery bundle.

For an inference system:

serving configuration
runtime configuration
deployment manifests
benchmark receipt
verifier
rollback
provenance
scripts
README

For physical decoding:

world-state schema
model
sensor adapter config
perception pipeline
evaluation
safety policy
verifier
deployment artifacts

51. RUN AGAIN

Run Again means replay/re-execute the mission.

Two modes:

Exact replay

Same:

model
revision
runtime
workload
dataset
configuration
world snapshot

Controlled rerun

User changes explicit parameters:

GPU
batch size
runtime
model
quantization
constraint

Previous results remain available for comparison.

52. OBSERVATION FABRIC

Normalize:

OpenTelemetry
application metrics
runtime metrics
GPU metrics
Kubernetes events
cloud metrics
billing
logs
traces
quality evaluation
benchmark outputs
deployment state
Git history
CI results
support signals
business analytics
physical sensors
robot telemetry

Pipeline:

SIGNAL
 ↓
NORMALIZATION
 ↓
OBSERVATION
 ↓
MEASUREMENT
 ↓
EVIDENCE

53. EVIDENCE FABRIC

Evidence must answer:

What happened?

Where?

When?

How was it measured?

Which system produced it?

Which execution produced it?

Which experiment produced it?

Can another verifier check it?

interface Evidence {
  id: string;
  type: EvidenceType;
  source: SourceRef;
  producer: ActorRef;
  timestamp: string;

  checksum?: string;

  artifactRef?: ArtifactRef;
  observationRef?: ObservationRef;
  executionRef?: ExecutionRef;
  experimentRef?: ExperimentRef;

  confidence?: number;
  provenance: Provenance;
}

Cryptographic hashes are used for integrity/provenance. They are not the headline product output.

54. CLAIM ENGINE

Example:

CLAIM:
This change reduced inference cost by 34%.

Evidence:

baseline billing
new billing
telemetry
quality evaluation
latency evaluation
availability
deployment record
execution record

Claim states:

VERIFIED
PARTIALLY_VERIFIED
NOT_PROVEN
CONTRADICTED
UNCERTAIN

55. INDEPENDENT VERIFICATION

The executor should not be the sole authority on its own success.

EXECUTOR
   ↓
CLAIM
   ↓
INDEPENDENT VERIFIER
   ↓
VERDICT

Possible verifier sources:

billing
telemetry
quality evaluator
deployment state
database state
external measurement
physical sensor
independent test

56. VERIFICATION WINDOWS

Different outcomes require different observation windows.

latency
→ immediate / short

quality
→ evaluation window

cost
→ billing window

availability
→ long window

reliability
→ long window

drift
→ continuous

A mission can be:

COMPLETED

while verification remains:

PENDING

if the observation window is still open.

57. CONSEQUENCE ENGINE

An Action is not complete when the command returns success.

Record:

BEFORE STATE
     ↓
ACTION
     ↓
AFTER STATE

Then:

CONSEQUENCE
     ↓
OBSERVATION
     ↓
EVIDENCE
     ↓
VERIFICATION

Unexpected consequences become learning signals.

58. EXPERIENCE ENGINE

Experience is not a chat transcript.

A reusable experience is:

context
+
world state
+
unknown
+
hypothesis
+
candidate
+
experiment
+
decision
+
authority
+
action
+
consequence
+
observation
+
evidence
+
verification

59. LESSON ENGINE

Generalize verified experience.

Example:

Experience:
policy v7 improved workload X
under conditions Y.

Lesson:
for workload profile X,
under conditions Y,
prefer policy family V
because measured effect Z.

Lessons carry:

scope
confidence
evidence
applicability
exceptions
expiry/drift conditions

60. TEACHING + INTELLIGENCE EVOLUTION

VERIFIED EXPERIENCE
        ↓
LESSON
        ↓
TEACHING DATA
        ↓
TRAIN / ADAPT / ROUTE / UPDATE
        ↓
NEW INTELLIGENCE VERSION
        ↓
EVALUATE
        ↓
SHADOW
        ↓
CANARY
        ↓
PROMOTE

Do not promote only because an LLM says the new version is better.

61. DRIFT ENGINE

Track:

world drift
model drift
runtime drift
workload drift
quality drift
cost drift
capacity drift
policy drift
provider drift
hardware drift
software drift
business drift

Material drift:

DRIFT
 ↓
REDISCOVERY
 ↓
HYPOTHESIS
 ↓
EXPERIMENT
 ↓
DECISION
 ↓
ACTION
 ↓
VERIFY

62. CONTINUOUS MISSIONS

A mission may remain active:

DISCOVER
 ↓
DESIGN
 ↓
EXECUTE
 ↓
VERIFY
 ↓
MONITOR
 ↓
DRIFT?
 ↓
REDISCOVER
 ↓
...

This turns Epoch into a runtime rather than a one-shot optimizer.

The source plan explicitly calls this continuous-mission behavior. fileciteturn95file9L1326-L1342

63. COUNTERFACTUAL ENGINE

Questions:

What if we use another model?
What if traffic doubles?
What if we halve GPUs?
What if we move provider?
What if we move to the data center?
What if we change runtime?
What if we quantize?
What if we change architecture?
What if pricing changes?

Every result is labeled:

OBSERVED
HISTORICALLY_SUPPORTED
SIMULATED
PREDICTED
UNKNOWN

Never collapse these categories.

64. POLICY FABRIC

Policies include:

maximum_spend
allowed_models
allowed_licenses
allowed_regions
allowed_hardware
allowed_providers
data_residency
maximum_downtime
required_approval
maximum_experiment_cost
network_permissions
credential_permissions
production_scope
autonomy_level

Results:

ALLOW
DENY
REQUIRES_APPROVAL

AI cannot override policy.

65. AUTHORITY FABRIC

Authority asks:

Does this mission/actor have permission to do this now?

Scope by:

organization
mission
action
target
time
spend
environment
world-state version
autonomy level

Capability and authority remain separate.

66. AUTOMATION DECISION

Every consequential proposal becomes:

interface AutomationDecision {
  action: ActionRef;
  requiredAuthority: AuthorityLevel;
  autonomyLevel: AutonomyLevel;
  risk: RiskAssessment;
  reversibility: Reversibility;
  policyResult: PolicyResult;
  confidence: number;
  stateFreshness: StateFreshness;
  budget: Budget;
  evidenceRequirements: EvidenceRequirement[];
  humanRequired: boolean;
}

Possible result:

AUTO_INVESTIGATE
AUTO_EXPERIMENT
AUTO_EXECUTE
REQUIRES_APPROVAL
REQUIRES_CLARIFICATION
BLOCKED

67. AUTONOMY LEVELS

L0 — OBSERVE
L1 — RECOMMEND
L2 — AUTO-EXPERIMENT
L3 — SANDBOX EXECUTION
L4 — BOUNDED PRODUCTION
L5 — ORGANIZATIONAL AUTONOMY

Each action declares required_autonomy_level.

The organization controls enabled levels.

68. AUTONOMOUS SAFETY GATES & POLICY EVALUATION

Evaluate safety rules and policy boundaries autonomously:.

Gate A — ambiguous objective

“make it better”

Gate B — missing critical constraint

data residency unknown

Gate C — high-risk production action

Gate D — spend authority exceeded

Gate E — destructive action

Gate F — contradictory reality

Do not ask when:

policy allows
authority exists
risk is within bounds
budget is within bounds
constraints are known
state is fresh
action is reversible
rollback exists
evidence requirements are known
execution is idempotent

Then:

DISCOVER
→ EXPERIMENT
→ DECIDE
→ EXECUTE
→ VERIFY

automatically.

69. SECURITY ARCHITECTURE

IDENTITY
 ↓
AUTHENTICATION
 ↓
AUTHORIZATION
 ↓
CREDENTIAL SCOPE
 ↓
NETWORK POLICY
 ↓
SANDBOX
 ↓
RESOURCE LIMIT
 ↓
POLICY
 ↓
AUTHORITY
 ↓
STATE RECHECK
 ↓
EXECUTION
 ↓
OBSERVATION
 ↓
VERIFICATION

Credentials are:

mission-scoped
action-scoped
target-scoped
time-scoped
spend-scoped

70. MODEL SECURITY

Before execution:

source verification
revision identity
artifact digest
license
governance
runtime compatibility
sandbox
resource limits
network restrictions

A public model repository is not automatically trusted execution code.

71. FAILURE MODEL

Handle:

GPU failure
runtime crash
network timeout
provider outage
model loading failure
capacity shortage
partial deployment
duplicate execution
stale state
telemetry loss
quality regression
latency regression
cost regression
dependency failure
database failure
CI failure
rollback failure
verification failure

Every failure becomes evidence and may become a learning record.

72. COMPENSATION

Every consequential action defines:

previous_state
rollback_state
compensation_action
verification

Compensation itself is controlled:

PLAN
 ↓
POLICY
 ↓
AUTHORITY
 ↓
EXECUTE
 ↓
VERIFY

73. EVENT MODEL

Core events:

InputReceived
IntentCreated
OutcomeCompiled
WorldStateCreated
WorldFactObserved
UnknownCreated
HypothesisCreated
CapabilityDiscovered
SystemComposed
CandidateGenerated
CandidateRejected
ExperimentCreated
ExperimentStarted
ExperimentCompleted
MeasurementCaptured
EvaluationCompleted
DecisionCreated
PolicyEvaluated
AuthorizationGranted
HumanGateCreated
HumanGateResolved
PlanCreated
ExecutionStarted
ExecutionCompleted
ObservationCaptured
EvidenceCreated
ClaimCreated
VerificationStarted
VerificationCompleted
DriftDetected
RediscoveryTriggered
LearningRecordCreated
DynamicsRecordCreated

Events support:

audit
replay
debugging
provenance
analytics
state reconstruction

74. DATABASE DESIGN

Primary transactional store:

PostgreSQL

Core tables:

organizations
users
input_envelopes
intents
outcome_contracts
missions

entities
relationships
world_states
world_facts
observations
signals

unknowns
hypotheses
capabilities
capability_edges

models
model_revisions
artifacts
runtimes
runtime_versions
hardware

workloads
pipelines
systems
candidate_systems

experiments
experiment_runs
measurements
evaluations
cost_records

decisions
policies
authorizations
automation_decisions
human_gates

plans
actions
executions

evidence
claims
verifications

drift_events
learning_records
dynamics_records
events

75. STORAGE STRATEGY

PostgreSQL
→ authoritative domain state

Object Storage
→ artifacts
→ benchmark outputs
→ logs
→ evidence bundles
→ large documents

Redis
→ cache
→ ephemeral state
→ locks
→ short-lived queues

Telemetry Backend
→ high-volume telemetry

Search Projection
→ investigation/discovery

Graph Projection
→ derived relationships

PostgreSQL remains authoritative.

Derived graphs must be rebuildable.

76. GRAPH STRATEGY

Do not require a graph database as source of truth initially.

Build derived:

Reality Graph
Capability Graph
Dynamics Graph
Evidence Graph

from:

PostgreSQL
+
event history
+
object storage

77. API ARCHITECTURE

Public groups:

/intents
/outcomes
/missions
/inputs
/world
/capabilities
/models
/runtimes
/hardware
/workloads
/systems
/candidates
/experiments
/evaluations
/economics
/decisions
/policies
/authorizations
/automation
/human-gates
/plans
/executions
/observations
/evidence
/claims
/verifications
/drift
/learning

Every write supports:

request_id
idempotency_key
schema_version
actor
organization_id

78. REPOSITORY STRUCTURE

epoch/
├── apps/
│   ├── console/
│   ├── api/
│   └── control-plane/
│
├── packages/
│   ├── domain/
│   ├── input/
│   ├── intent/
│   ├── outcome/
│   ├── mission/
│   ├── reality/
│   ├── world-model/
│   ├── graph/
│   ├── observations/
│   ├── unknowns/
│   ├── hypotheses/
│   ├── capabilities/
│   ├── systems/
│   ├── models/
│   ├── runtimes/
│   ├── hardware/
│   ├── workloads/
│   ├── pipelines/
│   ├── candidates/
│   ├── simulation/
│   ├── sandbox/
│   ├── experiments/
│   ├── benchmarks/
│   ├── evaluations/
│   ├── economics/
│   ├── decisions/
│   ├── policy/
│   ├── authority/
│   ├── automation/
│   ├── human-gates/
│   ├── plans/
│   ├── execution/
│   ├── evidence/
│   ├── claims/
│   ├── verification/
│   ├── drift/
│   ├── learning/
│   ├── dynamics/
│   ├── events/
│   └── workers/
│
├── adapters/
│   ├── huggingface/
│   ├── github/
│   ├── gitlab/
│   ├── kubernetes/
│   ├── opentelemetry/
│   ├── vllm/
│   ├── sglang/
│   ├── tensorrt-llm/
│   ├── nvidia-nim/
│   ├── aws/
│   ├── gcp/
│   ├── azure/
│   ├── digitalocean/
│   ├── cameras/
│   ├── robotics/
│   ├── industrial/
│   └── scientific/
│
├── schemas/
├── migrations/
├── policies/
├── evals/
├── experiments/
├── datasets/
├── docs/
└── scripts/

The source blueprint already contains the corresponding modular packages and adapter structure; this version expands the physical/industrial/scientific adapter surface without changing the core. fileciteturn95file3L281-L381

79. TECHNOLOGY FOUNDATION

Control plane:

TypeScript
Next.js
React
PostgreSQL
Redis
REST
typed contracts

Evaluation/research:

Python where useful

Infrastructure:

Docker
Kubernetes
Terraform / OpenTofu

Observability:

OpenTelemetry

Do not introduce microservices merely because the architecture has boundaries.

Start as a modular control-plane monolith with strict package boundaries.

Split only when:

scale
security
isolation
independent deployment
failure isolation

justify it.

The source plan makes this exact implementation recommendation. fileciteturn95file3L353-L381

80. WORKER CONTRACT

Each execution environment supports:

interface Worker {
  discover(): Promise<Inventory>;
  validate(input: unknown): Promise<ValidationResult>;
  simulate(input: unknown): Promise<SimulationResult>;
  benchmark(input: unknown): Promise<BenchmarkResult>;
  prepare(input: unknown): Promise<PreparedExecution>;
  execute(input: AuthorizedExecution): Promise<ExecutionResult>;
  observe(executionId: string): Promise<Observation[]>;
  collectEvidence(executionId: string): Promise<Evidence[]>;
  compensate(executionId: string): Promise<CompensationResult>;
  health(): Promise<HealthStatus>;
}

Workers include:

ModelSourceWorker
RuntimeWorker
HardwareWorker
SimulationWorker
SandboxWorker
BenchmarkWorker
SoftwareWorker
CloudWorker
DataCenterWorker
KubernetesWorker
DatabaseWorker
SecurityWorker
CIWorker
DeploymentWorker
ObservationWorker
VerificationWorker
RobotWorker
IndustrialWorker
ScientificWorker

81. CONNECTOR CONTRACT

interface RealityConnector {
  discover(): Promise<RealityInventory>;
  describe(entityId: string): Promise<EntityDescription>;
  observe(request: ObservationRequest): Promise<Observation[]>;
  query(request: RealityQuery): Promise<RealityResult>;
  stream(request: StreamRequest): AsyncIterable<Observation>;
  simulate(request: SimulationRequest): Promise<SimulationResult>;
  prepareAction(request: ActionRequest): Promise<PreparedAction>;
  executeAction(request: AuthorizedAction): Promise<ActionResult>;
  verify(request: VerificationRequest): Promise<VerificationResult>;
}

Connector-specific technologies must never become the core ontology.

82. FRONTEND PRODUCT ARCHITECTURE

Primary navigation:

Home
Missions
Reality
Models
Capabilities
Experiments
Evidence
Deployments
Learning
Policies
Approvals

Primary composer:

What should become true?

The composer is the front door, not a generic chat screen.

83. COMPOSER UX FLOW

USER TYPES
     ↓
LIVE UNDERSTANDING
     ↓
ENTITY / MODEL / RUNTIME / REALITY RESOLUTION
     ↓
INLINE SUGGESTIONS
     ↓
USER SELECTS / EDITS
     ↓
OUTCOME CONTRACT PREVIEW
     ↓
MISSION PREVIEW
     ↓
RUN

The user sees enough structure to steer the mission without needing to understand the backend graph.

84. MISSION WORKSPACE

Show:

PURPOSE
OUTCOME
REALITY
KNOWN
UNKNOWN
HYPOTHESES
CAPABILITIES
CANDIDATES
EXPERIMENTS
DECISION
AUTHORITY
ACTION
CONSEQUENCE
OBSERVATION
EVIDENCE
VERIFICATION
RESULT
EXPERIENCE
LESSON
NEXT

85. REALITY EXPLORER

Reality
├── Software
├── Models
├── Compute
├── Cloud
├── Kubernetes
├── Data Center
├── Edge
├── Machines
├── Robots
├── Factories
├── Warehouses
├── Vehicles
├── Energy
├── Laboratories
└── Scientific Systems

Every object should show:

state
history
observations
relationships
capabilities
missions
actions
evidence
verification

86. OUTCOME VIEW

For Optimize:

PRIMARY RESULT
Optimized production stack

MEASURED CHANGE
Before → After

DELIVERABLE
Config / deployment / export

PROOF
Benchmark + telemetry + verifier

NEXT
Deploy / Export / Download / Run Again

For Decode:

PRIMARY RESULT
Verified world state

DELIVERABLE
World-state package

PROOF
Sensor observations + provenance

NEXT
Simulate / Recommend / Act / Observe

87. DEPLOYMENT UI

A deploy flow must show:

WHAT
Verified deliverable

WHERE
Selected execution target

HOW
Runtime / deployment method

WITH WHAT
Compute resources

AUTHORITY
Policy + user authorization

OBSERVATION
Post-deployment verification

Target selector:

Epoch-managed compute
AWS
GCP
Azure
Kubernetes
Docker
On-prem
Bare metal
GPU provider
Edge
Vehicle
Robot
Factory

The exact target availability is determined by connected adapters and authorization.

88. ACTION UI

Mission-specific verbs:

Deploy
Apply
Act
Promote
Recommend
Simulate
Monitor
Rollback
Run Again
Export
Download

The backend still stores these as first-class Action objects.

89. PHYSICAL WORLD PRODUCT LOOP

Example user:

Understand what is happening around this vehicle.

CAMERA
VIDEO
LiDAR
IMU
GPS
VEHICLE TELEMETRY
        ↓
OBSERVATION
        ↓
WORLD STATE
        ↓
OBJECTS + RELATIONSHIPS
        ↓
PREDICTED STATE
        ↓
RECOMMENDATION
        ↓
ACT (if authorized)
        ↓
CONSEQUENCE
        ↓
OBSERVATION
        ↓
VERIFICATION
        ↓
LEARNING

90. DATA CENTER PRODUCT LOOP

Example:

Reduce power consumption without reducing throughput.

GPU
CPU
MEMORY
NVLINK
PCIe
NETWORK
COOLING
POWER
WORKLOADS
SCHEDULER
KUBERNETES
TELEMETRY
        ↓
DECODE CURRENT STATE
        ↓
UNKNOWN
        ↓
HYPOTHESES
        ↓
CANDIDATE POLICIES
        ↓
BENCHMARK / SIMULATE
        ↓
DECISION
        ↓
AUTHORIZE
        ↓
APPLY SCHEDULING POLICY
        ↓
OBSERVE
        ↓
VERIFY
        ↓
LEARN

91. SOFTWARE PRODUCT LOOP

Example:

Ship enterprise SSO.

REQUIREMENT
 ↓
DISCOVER REPOSITORIES
 ↓
DISCOVER ARCHITECTURE
 ↓
DEPENDENCY GRAPH
 ↓
SPECIFICATION
 ↓
PLAN
 ↓
IMPLEMENT
 ↓
TEST
 ↓
SECURITY
 ↓
PERFORMANCE
 ↓
PR
 ↓
REVIEW
 ↓
CI
 ↓
CANARY
 ↓
DEPLOY
 ↓
OBSERVE
 ↓
VERIFY
 ↓
DOCUMENT

The source plan explicitly defines this company-wide execution model. fileciteturn95file5L845-L885

92. FINOPS PRODUCT LOOP

SPEND
 ↓
ATTRIBUTE
 ↓
FIND WASTE
 ↓
HYPOTHESES
 ↓
SIMULATE
 ↓
EXPERIMENT
 ↓
CHANGE
 ↓
MEASURE
 ↓
VERIFY SAVINGS

93. SECURITY PRODUCT LOOP

DISCOVER
 ↓
ASSESS
 ↓
PRIORITIZE
 ↓
PATCH
 ↓
TEST
 ↓
DEPLOY
 ↓
VERIFY

94. CONTINUOUS ORGANIZATIONAL LOOP

The organization can become an automation surface:

SOFTWARE ENGINEERING
PRODUCT DEVELOPMENT
INFRASTRUCTURE
CLOUD
DATA
SECURITY
SRE
QA
DEVOPS
FINOPS
CUSTOMER SUPPORT
OPERATIONS
DOCUMENTATION
PROJECT EXECUTION
COMPLIANCE
ANALYTICS
INTERNAL SYSTEMS

Epoch remains one runtime.

95. 90% AUTOMATION PRINCIPLE

Automate approximately 90% of repeatable, observable, bounded, reversible, policy-permitted operational work.

Automate:

discovery
data collection
state reconstruction
baseline generation
anomaly detection
issue classification
hypothesis generation
investigation
decomposition
candidate generation
experiment design
benchmarking
test execution
code modification
documentation updates
CI/CD remediation
infrastructure planning
safe deployment
canary
scaling
rollback
incident diagnosis
routine remediation
cost optimization
quality evaluation
evidence collection
compliance checks
post-change verification
learning
drift detection
recurring optimization

Human-controlled by default:

ambiguous goals
new authority grants
irreversible destruction
large financial commitments
credential expansion
security exceptions
legal/compliance exceptions
high-risk physical action
out-of-policy actions
contradictory reality

The source plan explicitly defines the same boundary. fileciteturn94file0L196-L294

96. LEARNING FLYWHEEL

MORE MISSIONS
      ↓
MORE EXPERIMENTS
      ↓
MORE MEASUREMENTS
      ↓
MORE VERIFIED OUTCOMES
      ↓
BETTER DYNAMICS
      ↓
BETTER CANDIDATE SEARCH
      ↓
BETTER EXPERIMENT SELECTION
      ↓
BETTER DECISIONS
      ↓
BETTER OUTCOMES
      ↓
MORE MISSIONS

The source blueprint identifies reality history, interventions, experiments, measurements, verified outcomes, and system dynamics as the core moat. fileciteturn95file7L940-L981

97. DEFINITION OF DONE

Epoch is complete when an organization can provide:

intent
+
constraints
+
authority
+
access to reality

and Epoch can autonomously:

understand
 ↓
discover
 ↓
baseline
 ↓
identify unknowns
 ↓
hypothesize
 ↓
discover capabilities
 ↓
compose systems
 ↓
experiment
 ↓
measure
 ↓
evaluate
 ↓
decide
 ↓
check policy
 ↓
check authority
 ↓
execute
 ↓
observe
 ↓
prove
 ↓
learn
 ↓
monitor
 ↓
adapt

with humans only where needed for ambiguity, critical constraints, authority boundaries, high-risk action, policy, irreversibility, or contradictory reality. fileciteturn95file2L136-L200

98. DAY-1 BUILD RULE

Do not ask:

What is the MVP?

Ask:

What is the smallest real implementation of the final autonomous architecture?

The first implementation may use:

1 model
1 runtime
1 GPU
1 cluster
1 provider
1 repository
1 workload

but it must still use the final concepts:

InputEnvelope
Intent
OutcomeContract
WorldState
Capability
System
Experiment
Decision
Policy
Authority
Execution
Evidence
Verification
Learning
AutomationDecision
HumanGate

The capability set may begin small.

The architecture cannot be temporary.

The source blueprint explicitly defines this build rule. fileciteturn95file7L1042-L1078

99. TEST ARCHITECTURE

Every subsystem:

unit
integration
contract
failure
security
property
E2E
evaluation

Critical paths additionally require:

idempotency
replay
stale-state
authorization
rollback
evidence-integrity
verification
human-gate
automation-decision

100. ARCHITECTURE SCENARIO FIXTURES

Create fixtures:

scenario-cost-optimization
scenario-latency-optimization
scenario-model-selection
scenario-cloud-vs-datacenter
scenario-capacity-planning
scenario-quality-regression
scenario-provider-outage
scenario-stale-plan
scenario-rollback
scenario-verification-failure
scenario-conflicting-reality
scenario-code-regression
scenario-production-incident
scenario-security-patch
scenario-product-dropoff
scenario-documentation-drift
scenario-finops-waste
scenario-physical-world-decoding
scenario-robot-actuation
scenario-factory-optimization
scenario-data-center-power

Each fixture contains:

initial reality
intent
outcome contract
available capabilities
unknowns
expected decisions
expected actions
expected evidence
expected verdict

The source plan already defines this scenario-driven architecture approach. fileciteturn95file8L1245-L1275

101. DOMAIN CONTRACTS

Create typed schemas for:

input-envelope
intent
outcome-contract
mission
world-state
world-fact
observation
capability
system
candidate-system
experiment
measurement
evaluation
decision
policy
authorization
automation-decision
human-gate
plan
action
execution
evidence
claim
verification
learning-record
dynamics-record
drift-event
domain-event
mission-result
artifact

The schema layer is the contract between UI, control plane, workers, adapters, events, storage, and verification.

102. CONTROL-PLANE IMPLEMENTATION

Recommended internal boundaries:

input
intent
outcome
mission
reality
world-model
unknown
hypothesis
capability
model
composer
experiment
simulation
decision
policy
authority
automation
execution
observation
evidence
claim
verification
learning
teaching
drift
audit
artifact

Start as one modular control-plane application with strict dependency direction.

103. DEPENDENCY RULE

Packages should depend inward toward domain contracts.

Bad:

domain → Kubernetes SDK
domain → Hugging Face SDK
domain → AWS SDK

Good:

domain
  ↑
adapter interface
  ↑
KubernetesAdapter
HuggingFaceAdapter
AWSAdapter
RobotAdapter

The permanent domain cannot depend on replaceable providers.

104. EVENT-SOURCED PROVENANCE

Every consequential transition emits a DomainEvent.

Events should support:

state reconstruction

audit

replay

debugging

analytics

provenance

learning

Never rely solely on current mutable state to explain why a result occurred.

105. REPLAY

Every important mission must be replayable from:

input
world-state snapshot
model revisions
capabilities
policies
experiment configuration
action records
observations

Replay should preserve the difference between:

historical reality
current reality
replayed simulation

106. PRODUCT OUTPUT CONTRACT

The final customer-facing output is:

MISSION RESULT
│
├── Primary Result
├── Measured Change
├── Current Reality
├── Baseline
├── Unknowns
├── Hypotheses
├── Candidates
├── Experiments
├── Decision
├── Action
├── Consequence
├── Observed Result
├── Primary Deliverable
├── Evidence
├── Verification
├── Verdict
├── Uncertainty
├── Learning
└── Next Action

Evidence is support, not the headline product.

The customer gets something useful:

deployment package
configuration
decision package
diagnosis
forecast
new capability
world-state package
simulation
repair
policy
physical state change

107. DEPLOYMENT RESULT STANDARD

For infrastructure/model missions, the minimum Epoch standard should match the strongest concrete-result behavior expected from an infrastructure optimizer:

verified optimization
+
measured benchmark
+
exact model/runtime/hardware/workload identity
+
reproducible configuration
+
verifier
+
deployment/export path
+
rollback

That makes the result useful rather than merely descriptive.

108. PHYSICAL RESULT STANDARD

For physical missions, output is not forced into deployment.

Possible result:

verified world state
+
predicted state
+
uncertainty
+
recommended action
+
safety status
+
sensor provenance
+
observation plan

If the user chooses an authorized actuation path:

world state
 ↓
recommendation
 ↓
authority
 ↓
actuation
 ↓
consequence
 ↓
verification

109. FINAL ENGINEERING INVARIANTS

Invariant 1 — Outcome over task

The product is the outcome loop.

Invariant 2 — Reality over prediction

Prediction is a hypothesis until reality is observed.

Invariant 3 — Capability over vendor

Hugging Face, vLLM, AWS, Kubernetes, robot vendors, and future providers are implementations/adapters.

Invariant 4 — Evidence supports outcome

Evidence is not the product headline.

Invariant 5 — Verification over confidence

Confidence is not proof.

Invariant 6 — Authority over autonomy

Capability does not imply permission.

Invariant 7 — Experience over memory

Experience captures what worked, when, why, and under what conditions.

Invariant 8 — Reality surfaces are not sequential products

Computational, operational, edge, physical, industrial, scientific, and general reality all belong to the permanent architecture.

Invariant 9 — Deploy and Act are distinct

Deploy installs intelligence.

Act changes reality.

Invariant 10 — No silent mutation

Every consequential action is attributable, authorized, observable, and verifiable.

Invariant 11 — No temporary MVP architecture

The first implementation can be small in capability count but must use the permanent domain.

Invariant 12 — Learning is downstream of verified consequence

Do not teach from unsupported claims.

110. FINAL PRODUCT NORTH STAR

                          PURPOSE
                             │
                             ▼
                          INTENT
                             │
                             ▼
                          OUTCOME
                             │
                             ▼
                           REALITY
                             │
                             ▼
                         UNDERSTAND
                             │
                             ▼
                          UNKNOWN
                             │
                             ▼
                        HYPOTHESIS
                             │
                             ▼
                        CAPABILITY
                             │
                             ▼
                           SYSTEM
                             │
                             ▼
                        EXPERIMENT
                             │
                             ▼
                         DECISION
                             │
                             ▼
                         AUTHORITY
                             │
                             ▼
                          ACTION
                             │
                             ▼
                       CONSEQUENCE
                             │
                             ▼
                        OBSERVATION
                             │
                             ▼
                          EVIDENCE
                             │
                             ▼
                       VERIFICATION
                             │
                             ▼
                        MISSION RESULT
                             │
                             ▼
                         EXPERIENCE
                             │
                             ▼
                           LESSON
                             │
                             ▼
                         TEACHING
                             │
                             ▼
                   INTELLIGENCE EVOLUTION
                             │
                             ▼
                    BETTER REALITY MODEL
                             │
                             └──────────► REALITY

111. FINAL BUILD DIRECTIVE FOR THE CODING MODEL

Build Epoch as one permanent Reality Intelligence Runtime.

Do not build:

GPU optimizer first
→ cloud platform later
→ robotics later
→ physical AI later
→ scientific system later
→ rewrite architecture

Do not build separate products:

Optimizer
Diagnoser
Predictor
Robot tool
Data-center tool
Simulation tool
Model trainer
Coding agent

Build one runtime:

                 EPOCH
                   │
             REALITY FABRIC
                   │
          CAPABILITY FABRIC
                   │
         KNOWLEDGE FABRIC
                   │
            MISSION RUNTIME
                   │
       UNKNOWN → HYPOTHESIS
                   │
             COMPOSE SYSTEM
                   │
               EXPERIMENT
                   │
                DECISION
                   │
           POLICY / AUTHORITY
                   │
                 ACTION
                   │
              CONSEQUENCE
                   │
               OBSERVATION
                   │
                EVIDENCE
                   │
              VERIFICATION
                   │
             MISSION RESULT
                   │
              EXPERIENCE
                   │
                LESSON
                   │
               TEACHING
                   │
         INTELLIGENCE EVOLUTION
                   │
            BETTER REALITY

Build every permanent primitive now.

Connect more reality continuously.

Never replace the core because reality becomes more physical.

The permanent engineering invariant is:

The runtime does not change. The reality it can decode, test, act on, observe, verify, and learn from expands.

The final product invariant is:

Every Epoch mission ends with a concrete, inspectable, measurable, verifiable, usable Mission Result.

The final customer promise is:

Epoch turns purpose into verified reality.

112. CANONICAL SUMMARY

Epoch is infrastructure for operating by outcomes instead of tasks.

The permanent loop is:

INPUT
→ INTENT
→ OUTCOME
→ REALITY
→ UNKNOWN
→ HYPOTHESIS
→ CAPABILITY
→ SYSTEM
→ EXPERIMENT
→ DECISION
→ AUTHORITY
→ ACTION
→ CONSEQUENCE
→ OBSERVATION
→ EVIDENCE
→ VERIFICATION
→ MISSION RESULT
→ EXPERIENCE
→ LESSON
→ TEACHING
→ INTELLIGENCE EVOLUTION
→ BETTER REALITY

And the permanent reality surface is:

COMPUTATIONAL
→ OPERATIONAL
→ EDGE
→ PHYSICAL
→ INDUSTRIAL
→ SCIENTIFIC
→ GENERAL

This is a single architecture, not a sequence of rewrites.