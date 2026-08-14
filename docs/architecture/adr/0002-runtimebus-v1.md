# ADR 0002: RuntimeBus v1

## Context

Epoch needs a stable in-process kernel contract for runtime events and cross-service coordination.

## Decision

Freeze `RuntimeBus v1` with typed events, correlation and causation propagation, middleware, asynchronous dispatch, replay, and metrics.

## Consequences

- Runtime communication becomes event-driven instead of direct service coupling.
- The bus can grow internally without changing its public contract.
- Any breaking change requires a new major bus version.

## Alternatives Considered

- Use a queue product immediately.
- Keep a synchronous callback chain.
- Expose the bus contract through HTTP.
