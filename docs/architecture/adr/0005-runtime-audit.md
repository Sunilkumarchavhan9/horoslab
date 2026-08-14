# ADR 0005: Runtime Audit Gate

## Context

`RuntimeBase` is only valuable if it stays thin and truly shared. Premature abstraction would bake Reality-specific behavior into SDK code.

## Decision

Require a runtime audit before `RuntimeBase` changes or new runtime inheritance. The audit checks ownership boundaries, kernel usage, repository abstraction, and runtime health.

## Consequences

- `RuntimeBase` remains a shared SDK instead of a domain bucket.
- Reality can act as the proving ground without constraining future runtimes.
- Shared abstractions only appear when they are genuinely common.

## Alternatives Considered

- Extract `RuntimeBase` immediately.
- Allow runtime-specific code to flow into shared infrastructure.
- Treat SDK changes as implementation details instead of architectural decisions.
