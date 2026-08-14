# Runtime SDK Design Review

This document governs Milestone 3: `Runtime SDK`.

Its purpose is to keep `RuntimeBase` as the smallest possible shared layer while the frozen Epoch Kernel remains unchanged.

## 1. Objective

Design the smallest possible `RuntimeBase` that removes infrastructure duplication while preserving the frozen Epoch Kernel.

## 2. Scope

### Allowed

- Logger
- Metrics
- Context access
- Lifecycle hooks
- Bus helpers
- Repository registration

### Not Allowed

- `GraphEngine`
- `QueryEngine`
- `DecisionService`
- Mission planner logic
- Evidence logic
- Verification logic
- Business models

## 3. Review Questions

Every proposed SDK member must answer:

1. What duplication does this remove?
2. Is this infrastructure?
3. Could Mission use this unchanged?
4. Could Execution use this unchanged?
5. Does this mention Reality?

If the last answer is yes, it does not belong in `RuntimeBase`.

## 4. Ownership Matrix

| Component | Owner |
| --- | --- |
| `RuntimeBus` | Kernel |
| `RuntimeContext` | Kernel |
| `RuntimeEvent` | Kernel |
| Logger | RuntimeBase |
| Metrics | RuntimeBase |
| Lifecycle | RuntimeBase |
| Repository registration | RuntimeBase |
| `GraphEngine` | Reality |
| `QueryEngine` | Reality |
| `SourceService` | Reality |
| `ConnectionService` | Reality |
| `DecisionService` | Reality |
| `ImpactService` | Reality |
| Planner | Mission |

Ownership must not change during Milestone 3.

## 5. Kernel Integrity Checklist

Before merge:

- `RuntimeBus` unchanged
- `RuntimeContext` unchanged
- `RuntimeEvent` unchanged
- Repository interfaces unchanged
- Middleware unchanged
- Event replay unchanged

## 6. Reality Migration Checklist

- Minimal diff
- No behavior changes
- HTTP API unchanged
- Contract tests unchanged
- Runtime audit still passes

## 7. RuntimeBase Checklist

- Infrastructure only
- No domain logic
- No runtime-specific terminology
- No business models
- Uses only Kernel APIs

## 8. Rule of Three

A capability belongs in `RuntimeBase` only if:

- It solves an existing duplication problem.
- It is genuinely reusable across runtimes.
- It does not introduce coupling.

## 9. Definition of Done

Milestone 3 is complete when:

1. `RuntimeBase` is implemented.
2. Reality Runtime inherits `RuntimeBase`.
3. Kernel remains unchanged.
4. Existing tests pass.
5. `runtime-sdk-v1.md` audit passes.
6. `runtime-sdk-v1.0` tag is created.

After that, stop writing architecture documents and move to implementation validation through code, tests, and audit.
