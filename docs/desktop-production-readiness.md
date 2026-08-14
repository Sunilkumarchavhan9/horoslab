# Desktop Production Readiness

This checklist is for the Continuity Lab Desktop session tab rollout.

## Runtime provider deployment

- Configure `MEMORYOSTM_DESKTOP_PROVIDER` to `sandbox` or `external`.
- For `external`, set:
  - `MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL`
  - `MEMORYOSTM_DESKTOP_PROVIDER_TOKEN`
- Verify provider health from app side:
  - `GET /api/runtime/desktop/provider-health`

## Live control validation

- Verify start -> status -> stop flow with authenticated runtime APIs.
- Validate reconnect behavior:
  - browser refresh
  - tab background/foreground
  - temporary offline/online transitions
- Confirm operator UX for:
  - starting state
  - live state
  - stale/stream-disconnected state
  - provider error state

## Load validation

Run status polling load test:

```bash
MEMORYOSTM_LOAD_BASE_URL=http://127.0.0.1:3000 \
MEMORYOSTM_LOAD_THREAD_ID=<thread-id> \
MEMORYOSTM_LOAD_AUTH_TOKEN=<bearer-token> \
MEMORYOSTM_LOAD_DURATION_SECONDS=60 \
MEMORYOSTM_LOAD_CONCURRENCY=40 \
node scripts/load/desktop-status-load.mjs
```

Track `p95`, `p99`, and non-2xx error rate.

## Observability + SLO

Desktop SLO metrics now exposed on `/api/metrics`:

- `memoryos_desktop_lifecycle_total`
- `memoryos_desktop_lifecycle_duration_ms`
- `memoryos_desktop_provider_health_checks_total`
- `memoryos_desktop_provider_health_state`

Suggested Prometheus alert rules:

- `ops/alerts/desktop-slo-alerts.prometheus.yml`

Key SLO guardrails:

- Provider health state must remain healthy.
- Lifecycle API error rate should stay under 5% (10m window).
- Desktop status p95 should stay under 1500ms (10m window).

## Test suite expectations

- Contract:
  - runtime desktop lifecycle
  - provider health endpoint
  - internal provider auth routes
  - provider misconfiguration failure path
- E2E:
  - start -> live status -> stop -> idle status

## Failure-mode guardrails

- Provider failures return `502` with `DESKTOP_PROVIDER_UNAVAILABLE`.
- Thread desktop session is persisted to `error` with runtime message for visibility.
- Frontend keeps polling status while session is open and attempts reconnect on:
  - `online`
  - `focus`
  - visible tab transitions
