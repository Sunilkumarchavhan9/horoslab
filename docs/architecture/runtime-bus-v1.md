# RuntimeBus v1

## Design Goals

- Provide a stable in-process kernel interface for Epoch runtimes.
- Preserve causal ordering, correlation, and execution context across nested publishes.
- Keep the API small enough to remain frozen as the platform grows.
- Allow new runtime capabilities to attach through subscribers and middleware instead of direct service coupling.
- Keep the contract internal, deterministic, and testable.

## Event Lifecycle

1. A caller publishes an event draft.
2. The bus normalizes the event into a `RuntimeEvent`.
3. The bus resolves `correlationId`, `causationId`, and `context`.
4. The event is stored in the internal history buffer.
5. Middleware executes in registration order.
6. Subscribers execute asynchronously after middleware completes.
7. Failures are isolated so one subscriber cannot block others.
8. The event remains available for deterministic replay.

## RuntimeEvent Schema

Every event has:

- `id`
- `type`
- `runtime`
- `timestamp`
- `correlationId`
- `causationId?`
- `version: 1`
- `context`
- `payload`
- `metadata?`

### Notes

- `correlationId` groups related events into a single workflow.
- `causationId` points to the immediate parent event when the event is published from inside a subscriber or middleware chain.
- `version` is fixed at `1` for RuntimeBus v1.

## RuntimeContext Schema

`RuntimeContext` is the execution scope carried by every event.

```ts
interface RuntimeContext {
  institutionId: string;
  workspaceId?: string;
  missionId?: string;
  actorId?: string;
  requestId?: string;
  sessionId?: string;
  traceId?: string;
}
```

### Propagation Rules

- Top-level publishes use the bus default context when no explicit context is provided.
- Nested publishes inherit the active event context automatically.
- Explicit context values never need to be copied by callers during causal event chains.

## Middleware Pipeline

Middleware is registered with `use()`.

Execution order:

```ts
publish()
  -> middleware[0]
  -> middleware[1]
  -> ...
  -> subscribers
```

Guarantees:

- Middleware executes in registration order.
- Middleware can await `next()`.
- Middleware does not bypass event history.

## Subscriber Guarantees

- Subscribers execute asynchronously.
- Subscriber failures are isolated.
- One failing subscriber does not prevent later subscribers from running.
- `once()` subscriptions are removed after their first delivery.

## Replay Semantics

`replay()` returns stored events in deterministic insertion order.

Supported filters:

- `type`
- `runtime`
- `correlationId`
- `causationId`
- `context`

Replay is a read-only view of stored history. It does not mutate delivery state.

## Metrics

`metrics()` exposes internal operational counters:

- `publishedEvents`
- `deliveredEvents`
- `subscriberCount`
- `middlewareCount`
- `failedSubscribers`
- `averageDispatchTimeMs`

These metrics are internal only and are not exposed over HTTP.

## Versioning Policy

- `RuntimeBus v1` is the stable kernel contract.
- New runtime capabilities should be added without changing the existing method signatures.
- Any breaking change to `RuntimeEvent`, `RuntimeContext`, `publish()`, `subscribe()`, `once()`, `use()`, `metrics()`, or `replay()` requires a new major bus version.

## Compatibility Guarantees

- No route, response, or HTTP contract depends on the bus implementation details.
- Existing runtime services should continue to function as long as the v1 interface remains stable.
- The bus can change internal storage or dispatch mechanics without changing the public kernel API.
