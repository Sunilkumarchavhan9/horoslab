# Epoch Architecture

This document is the architectural contract for the Epoch backend.

It exists to prevent kernel drift, keep runtime boundaries explicit, and give every future runtime a shared reference before implementation begins.

## Architecture Freeze

`Epoch Kernel v1.0` is the current frozen baseline.

- Kernel changes require an Architecture Decision Record.
- RuntimeBase changes require a passing runtime audit.
- Runtime changes must not modify the kernel.

## The Rule of Three

A capability should generally exist in at least three runtimes before it moves into `RuntimeBase`.

If it is only used by Reality, or by Reality plus one other runtime, keep it in the runtime until a broader pattern emerges.

This rule is a default, not an absolute law. Foundational infrastructure like logging, context, or lifecycle hooks may live in `RuntimeBase` from the start.

## Layer 1 - Epoch Kernel

**Purpose:** Stable infrastructure shared by every runtime.

### Owns

- `RuntimeBus v1`
- `RuntimeContext`
- `RuntimeEvent`
- Repository interfaces
- Middleware pipeline
- Event replay
- Metrics
- Event envelope
- Shared runtime types

### Rules

- No business logic.
- No runtime-specific concepts.
- Changes require architectural review.
- Backward compatibility is expected within a major version.

## Layer 2 - Runtime SDK (`RuntimeBase`)

**Purpose:** Common runtime wiring and lifecycle.

### Owns

- Logger
- Metrics access
- Context access
- Repository registration
- Runtime lifecycle hooks
- Shared utilities
- Bus registration helpers

### Must Not Own

- Graph logic
- Mission planning
- Decisions
- Evidence
- Verification
- Domain models

### Rule

`RuntimeBase` should make runtimes easier to build, not define their behavior.

Before extracting `RuntimeBase`, review [runtime-sdk-principles.md](./docs/architecture/runtime-sdk-principles.md).
For Milestone 3 implementation, use [runtime-sdk-design-review.md](./docs/architecture/runtime-sdk-design-review.md) as the merge gate.

## Layer 3 - Business Runtimes

Each runtime owns exactly one operational domain.

### Reality Runtime

**Question:** What is true?

### Owns

- `GraphEngine`
- `QueryEngine`
- `SourceService`
- `ConnectionService`
- `DecisionService`
- `ImpactService`
- `APIWatchEngine`
- Reality projections

### Must Never Own

- Mission scheduling
- Execution orchestration
- Verification logic

### Mission Runtime

**Question:** What should happen?

### Owns

- Planner
- Queue
- Active missions
- Templates
- Scheduling
- Mission lifecycle

### Rule

Mission consumes Reality through the Kernel.

### Execution Runtime

**Question:** What is executing?

### Owns

- Workers
- Execution state
- Runtime capacity
- Evidence production

### Evidence Runtime

**Question:** What proves this happened?

### Owns

- Artifacts
- Claims
- Logs
- Lineage

### Verification Runtime

**Question:** Can this be trusted?

### Owns

- Verifiers
- Assurance
- Certificates
- Confidence

### Settlement Runtime

**Question:** What changed permanently?

### Owns

- Outcomes
- Learning
- Audit
- Institutional updates

## Runtime Responsibility Matrix

| Capability | Kernel | RuntimeBase | Reality | Mission | Execution | Evidence | Verification | Settlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RuntimeBus` | ✓ | Uses | Uses | Uses | Uses | Uses | Uses | Uses |
| `RuntimeContext` | ✓ | Uses | Uses | Uses | Uses | Uses | Uses | Uses |
| `RuntimeEvent` | ✓ | Uses | Emits | Emits | Emits | Emits | Emits | Emits |
| Middleware | ✓ | Uses | Uses | Uses | Uses | Uses | Uses | Uses |
| Repository interfaces | ✓ | Uses | Implements | Implements | Implements | Implements | Implements | Implements |
| Logger |  | ✓ | Uses | Uses | Uses | Uses | Uses | Uses |
| Metrics | ✓ | Exposes | Records | Records | Records | Records | Records | Records |
| `GraphEngine` |  |  | ✓ |  |  |  |  |  |
| `QueryEngine` |  |  | ✓ |  |  |  |  |  |
| Planner |  |  |  | ✓ |  |  |  |  |
| Worker engine |  |  |  |  | ✓ |  |  |  |
| Artifact store |  |  |  |  |  | ✓ |  |  |
| Verifiers |  |  |  |  |  |  | ✓ |  |
| Outcome engine |  |  |  |  |  |  |  | ✓ |

## Architecture Rules

- The Kernel never depends on runtimes.
- `RuntimeBase` never contains domain logic.
- Business runtimes never depend directly on each other.
- Cross-runtime communication occurs through `RuntimeBus`.
- Persistence is accessed only through repository interfaces.
- New capabilities attach via subscribers, middleware, or runtime wrappers, not by modifying the Kernel.
- Each runtime answers one operational question and owns one bounded context.

## Definition of Done

Before any new runtime is merged:

1. Does it reuse the Kernel without changing it?
2. Does it inherit `RuntimeBase` without expanding it unnecessarily?
3. Does it own a single operational domain?
4. Does it communicate through `RuntimeBus` instead of direct runtime calls?
5. Does it preserve the repository abstraction?

If any answer is no, the architecture should be reviewed before implementation.

## Required Reading

This document must be read before building:

- Mission Runtime
- Execution Runtime
- Evidence Runtime
- Verification Runtime
- Settlement Runtime
- `RuntimeBase` or any SDK expansion

The goal is to keep Epoch coherent as it grows from one runtime into many.

## Runtime Audit Checklist v1

### Runtime Identity

- Does this runtime answer exactly one operational question?
- Is its bounded context clearly defined?
- Does it avoid owning concepts from another runtime?

### Kernel Usage

- Uses `RuntimeBus` without modifying it.
- Uses `RuntimeContext`.
- Emits typed `RuntimeEvents`.
- Uses repository interfaces only.
- Does not depend on kernel internals.

### RuntimeBase Eligibility

Only shared concerns should be inherited.

- Uses logger.
- Uses metrics.
- Uses context.
- Uses lifecycle hooks.
- Uses bus registration helpers.
- Contains no domain logic in shared code.

If any domain-specific behavior appears here, it should stay in the runtime.

### Reality Runtime Audit

#### Graph

- `GraphEngine` owns graph behavior.
- No graph logic exists in `RealityRuntime`.

#### Sources

- `SourceService` owns ingestion.
- `RealityRuntime` only coordinates.

#### Connections

- `ConnectionService` owns connection state.
- `RealityRuntime` only coordinates.

#### Decisions

- `DecisionService` owns decision logic.
- `RealityRuntime` only coordinates.

#### Impact

- `ImpactService` owns impact calculations.

#### Queries

- `QueryEngine` owns querying.

#### Events

- `EventService` owns event behavior.
- `RuntimeBus` coordinates delivery.

### Coordination Rules

- `RealityRuntime` coordinates Reality services only.
- No direct calls to future `MissionRuntime`.
- No direct calls to `VerificationRuntime`.
- No direct calls to `SettlementRuntime`.
- Cross-runtime behavior is event-driven.

### Repository Audit

For every service:

- Depends only on repository interfaces.
- No in-memory collections outside repositories.
- No storage assumptions.
- Storage implementation is replaceable.

### Runtime Health

- HTTP contract unchanged.
- Tests remain green.
- Metrics available.
- Event replay works.
- Middleware still functions.
- Context propagates correctly.

### Definition of Ready for `RuntimeBase`

Reality may inherit `RuntimeBase` only if:

1. All checklist items pass.
2. `RuntimeBase` does not require Reality-specific code.
3. `RuntimeBase` introduces zero behavioral changes.
4. Existing tests pass unchanged.
5. `RuntimeBase` can be reused by a hypothetical `MissionRuntime` without modification.
