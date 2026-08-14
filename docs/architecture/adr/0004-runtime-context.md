# ADR 0004: RuntimeContext

## Context

Runtime events needed shared execution scope so workflows could be traced by institution, mission, request, and session.

## Decision

Add a strongly typed `RuntimeContext` to every `RuntimeEvent`, with automatic propagation through nested publishes.

## Consequences

- Cross-runtime workflows can be traced consistently.
- Nested publishes inherit execution scope without manual copying.
- Replay and filtering can include contextual dimensions.

## Alternatives Considered

- Carry scope as ad hoc metadata.
- Rely only on correlation IDs.
- Introduce distributed tracing before the kernel contract was frozen.
