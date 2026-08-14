# ADR 0003: Repository Pattern

## Context

Reality services previously depended on in-memory collections and needed storage to become replaceable without changing behavior above the persistence layer.

## Decision

Introduce repository interfaces for graph, events, connections, sources, and decisions, and keep the services dependent on those abstractions.

## Consequences

- Storage implementations can be swapped later.
- Domain services stay focused on behavior instead of persistence details.
- Reality remains stable while future runtimes inherit the same abstraction.

## Alternatives Considered

- Hard-code storage into each service.
- Move directly to PostgreSQL without interfaces.
- Introduce a dependency injection framework before the abstraction was proven.
