# Epoch complete-backend gap matrix

This matrix compares the detailed Epoch product plan with the repository as it exists now. It is intentionally stricter than the V13 acceptance gate: a passing gate proves the implemented contracts and safety paths, but it does not prove the entire product loop is implemented against real model, runtime, hardware, workload, and production integrations.

## Definition of complete

The backend is complete only when one real mission can run end-to-end:

`model + outcome + constraints -> baseline -> discovery -> unknowns/hypotheses -> capabilities -> candidates -> compatibility -> simulation -> sandbox -> benchmark -> quality/economics -> decision -> authority -> execution -> observation -> evidence -> verification -> settlement -> drift/re-discovery`

Every stage must be persisted, replayable, tenant-scoped, policy-checked, and exposed through the frontend contract.

## Gap matrix

| Plan capability | Current repository evidence | Status | Work required |
|---|---|---:|---|
| Mission, outcome, constraints | Epoch mission services, schemas, state machine, and routes exist | Partial | Make outcome compilation and constraint evaluation executable for real missions |
| Baseline engine | Baseline-related schema fields and evaluation records exist | Partial | Add baseline capture, pinned identity, workload/configuration, observation window, and baseline evidence APIs |
| Versioned world model | Software/cloud/data-center discovery and world-state records exist | Partial | Add one unified versioned fact model with source, confidence, provenance, and planned-vs-current drift comparison |
| Unknown management | `EpochUnknown` schema exists | Partial | Add unknown prioritization, resolution actions, evidence links, and discovery planning |
| Hypothesis engine | `EpochHypothesis` schema exists | Partial | Add hypothesis creation, evidence support/contradiction, experiment links, posterior confidence, and lifecycle routes |
| Hugging Face model source | No complete dedicated Epoch model-inspection pipeline is present | Missing | Add repository/revision/commit ingestion, metadata normalization, artifact identity, provider mappings, and refresh jobs |
| Model inspector/governance | Model-related fields exist in broader runtime data | Missing/partial | Add explicit known/unknown/inferred fields, license/gated checks, policy eligibility, and immutable model identity |
| Runtime fabric | AI execution catalog and provider health exist | Partial | Persist pinned runtime versions/images/configuration and runtime compatibility profiles |
| Hardware/cloud/data-center fabric | World-state discovery exists | Partial | Add normalized GPU/CPU/capacity/pricing/utilization inventory and provider adapters |
| Capability fabric/graph | V13 capability fabric service and routes exist | Partial | Add durable graph relations and queryable compatibility paths across model/runtime/hardware/workload |
| Workload model | No complete durable workload compiler found | Missing | Add workload schemas for request shape, tokens, concurrency, traffic, SLOs, and modality-specific dimensions |
| Pipeline compiler | No complete persisted compiler/node-contract engine found | Missing | Add pipeline nodes, edges, contracts, failure/retry/security behavior, and compiled pipeline versions |
| Candidate generation/search | Candidate fields exist in program contracts | Partial | Add staged candidate generation, governance/compatibility filtering, deduplication, and search history |
| Compatibility engine | Compatibility concepts exist in contracts/services | Partial | Implement deterministic model-runtime-hardware-workload compatibility reports with UNKNOWN/BLOCKED reasons |
| Simulation | V13 simulation service and safety gates exist | Implemented foundation | Connect simulation inputs to candidates/workloads and persist predicted/not-observed/not-verified outputs |
| Sandbox execution | No complete isolated candidate sandbox lifecycle found | Missing | Add resource, credential, network, spend, timeout, cleanup, and artifact-capture enforcement |
| Reproducible benchmark engine | Generic benchmark infrastructure and runtime execution exist | Partial | Bind benchmarks to immutable model/runtime/hardware/workload identities and reproducibility manifests |
| Quality evaluation | Verification/evaluation records exist | Partial | Add modality-aware quality evaluators, datasets, scoring, and independent quality evidence |
| Economic evaluation | Cost fields and production intelligence exist | Partial | Add normalized cost models, pricing snapshots, cost-per-request/token/month projections, and uncertainty |
| Decision/ranking/explanation | Recommendation/assurance structures exist | Partial | Add multi-objective ranking, hard/soft constraint decisions, confidence dimensions, and why-won/why-lost explanations |
| Policy/authority | Authority, policy, approval, audit, and cloud safety paths exist | Implemented foundation | Enforce policy checks consistently before every candidate, sandbox, deployment, and production action |
| Worker execution/rollback | Worker adapters, queue, execution, recovery, and rollback paths exist | Implemented foundation | Connect real worker adapters and make every action idempotent, observable, and compensatable |
| Observation/drift | Production intelligence and telemetry paths exist | Partial | Add quality/latency/cost/traffic/model/runtime/provider drift detectors and materiality thresholds |
| Evidence/provenance | Evidence integrity, claims, certificates, and verification exist | Implemented foundation | Link every claim through observation, execution, plan, candidate, benchmark, and model artifact provenance |
| Verification window/settlement | Assurance, certificate, settlement, and learning handoff exist | Partial | Add real observation windows, success conditions, failure/uncertainty transitions, and verified settlement |
| Failure -> rediscovery loop | Mission lifecycle and recovery exist | Partial | Automatically create a new discovery cycle with retained history and changed-world context |
| Historical learning | Learning handoff and production intelligence exist | Partial | Store reusable experiment results and use them in candidate ranking and experiment selection without bypassing policy |
| Real integrations | Route shapes exist for many integrations | Partial | Connect Hugging Face, cloud, Kubernetes, data-center telemetry, object storage, runtimes, and webhooks with credentials and health checks |
| Production operations | Type/acceptance gates exist | Partial | Add deployment automation, migrations, worker processes, observability, alerting, backup/restore, and release checks |
| Frontend contract wiring | Compact Epoch pages call live APIs; legacy runtime views contain unused mock fallbacks | Partial | Replace remaining active mock boundaries, add end-to-end API contract tests, and expose all completed lifecycle stages |

## Correct build order

1. Outcome compiler, baseline, workload, and constraint evaluator.
2. Unified world facts, unknowns, hypotheses, and discovery planning.
3. Hugging Face model identity/inspector/governance.
4. Runtime, hardware, provider, and compatibility fabric.
5. Pipeline compiler, candidate generation, and staged search.
6. Sandbox, reproducible benchmark, quality, and economic evaluators.
7. Multi-objective decision and explanation.
8. Real worker adapters, deployment, observation, drift, and rollback.
9. Evidence/provenance closure, verification windows, settlement, and rediscovery.
10. Full frontend contract wiring and one real end-to-end acceptance mission.

## Explicitly out of scope from the plan

The plan says not to build foundation-model training, every cloud provider, unrestricted production mutation, autonomous physical power/cooling control, or an edge fleet platform in the first complete system. Those are integrations or later expansion, not blockers for the first complete Epoch outcome loop.
