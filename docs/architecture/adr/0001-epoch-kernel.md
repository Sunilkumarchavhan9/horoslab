# ADR 0001: Epoch Kernel

## Context

Reality had outgrown a single runtime implementation and needed a stable shared foundation for future runtimes.

## Decision

Establish an Epoch Kernel that owns the runtime event model, `RuntimeBus`, `RuntimeContext`, repository contracts, middleware, replay, and metrics.

## Consequences

- Shared infrastructure becomes explicit and reviewable.
- Runtime-specific logic stays out of the kernel.
- Future runtimes can reuse the same event and repository contracts.

## Alternatives Considered

- Keep adding kernel features directly into `RealityRuntime`.
- Introduce multiple runtime-specific buses.
- Defer kernel boundaries until Mission exists.
