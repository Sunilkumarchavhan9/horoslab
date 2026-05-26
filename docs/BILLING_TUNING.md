# Billing tuning guide

How MemoryOS charges workspaces and where to change limits, metering, checkout, and console surfaces.

## Plan quotas (monthly caps)

**File:** `shared/planCatalog.ts`

Each plan defines:

- `tokenLimit` — billed tokens per 30-day usage period
- `searchLimit` — billed search-query units per period
- `seatLimit` — team members
- `connectorSyncRecordLimit` — connector sync rows per period
- `priceMonthly` / checkout copy for the console

Enforcement lives in `lib/billing/store.ts` (`tryConsumeUsage`, `getBillingStateForUser`). Over-limit API calls return **402** with `UPGRADE_REQUIRED`.

## Per-endpoint metering

**File:** `lib/billing/metering.ts`

- `OPERATION_METERING` — search units and token weight per API family
- `resolveUsageCost(operation, text)` — applies `BILLING_CHARS_PER_TOKEN` (default 4) for ingest text
- `listMeteringOperations()` — introspection helper

**Wired in:** `server/routes/memory.routes.ts` via `applyMeteredOperation()`.

| Operation | Typical route | Search cost | Token weight |
|-----------|---------------|-------------|--------------|
| `process_ingest` | `POST /process`, governance approve ingest | 0 | 1× text |
| `voice_ingest` | `POST /voice/chunk` | 0 | 1× text |
| `retrieve` | `POST /retrieve` | 1 | 0.25× question |
| `retrieve_explain` | `GET /retrieve/explain` | 1 | 0.25× question |
| `retrieve_debug` | `POST /retrieve/debug` | 2 | 0.25× question |
| `retrieve_why_not` | `POST /retrieve/why-not` | 1 | 0.25× question |
| `continue` | `POST /continue` | 1 | 0.25× question |
| `handoff` | `POST /handoff` | 2 | 0.5× question |
| `resume` | `POST /resume` | 1 | 0.25× question |
| `resume_brief` | `POST /resume/brief` | 1 | 0.25× question |
| `resume_prompt` | `POST /resume/prompt` | 2 | 0.5× question |

Tune weights in `OPERATION_METERING` only — routes should not hardcode costs.

## Polar checkout and webhooks

**Checkout env (per plan):**

- `CHECKOUT_URL_PRO` / `CHECKOUT_URL_SCALE` / `CHECKOUT_URL_ENTERPRISE`
- or `POLAR_CHECKOUT_URL_*` aliases
- `CHECKOUT_PROVIDER=polar` (optional)

`POST /api/memory/billing/checkout` appends `metadata[userId]` and `metadata[plan]` to the checkout URL so Polar webhooks can map payments to a workspace.

**Webhook:** `POST /webhooks/polar` in `server/routes/billing.routes.ts`

- Requires `POLAR_WEBHOOK_SECRET` and valid `x-polar-signature`
- Resolves `userId` from `metadata.userId` or existing `customer_id` mapping
- Plan from `metadata.plan`, payload plan fields, or product name slug (`pro`, `scale`, `enterprise`)
- Subscription cancel → plan **Free**
- Invoice events append to billing history

Configure the Polar endpoint to send subscription, checkout, and invoice events.

## API keys and usage attribution

- Keys bill the **workspace user** (`userId` on the key record), not a separate meter
- `lastUsedAt` updates on each successful `verifyApiKeyToken`
- `requests24h` counts in-memory request log entries tagged with `apiKeyId` (last 24h, memory API paths only)
- List/create responses expose `prefix`, `expiresAt`, `requests24h` for the console (`GET/POST /api/memory/api-keys`)

## Console surfaces

| Section | Data source |
|---------|-------------|
| Billing | `GET /api/memory/billing` — usage, seats, connector sync, invoices, events |
| API Keys | `GET /api/memory/api-keys` — live `requests24h`, `lastUsedAt` |
| Team / Settings / Integrations | `currentPlan` from console hub + plan hints |

Frontend plan copy: `memoryos-frontend/lib/plan-catalog.ts` (keep in sync with `shared/planCatalog.ts`).

## Operator API

**`GET /api/memory/billing/metering`** (auth required)

Returns `getMeteringCatalog()` — per-operation search cost, token weight, routes, and illustrative 1k-char token charge. The Billing console **Usage** tab renders this table.

## Quick validation

```bash
cd memoryos-frontend && npx tsc --noEmit
```

After changing metering, exercise retrieve + handoff in the playground and confirm Billing usage counters move.
