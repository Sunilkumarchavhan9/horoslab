# MemoryOS Ops Runbook: Doppler + 1Password

This runbook standardizes production secret management for MemoryOS.

Scope:
- Backend (`memoryos-backend`)
- Frontend (`memoryos-frontend`)
- DigitalOcean deployments
- Datadog / Sentry / Polar / OAuth credentials

## Goals

1. Stop manual copy/paste env drift.
2. Keep versioned, auditable secret history.
3. Keep team-safe access and emergency recovery path.

## Architecture

- `Doppler` = runtime source of truth for environment values by app + environment.
- `1Password` = human/team vault for master credentials, break-glass docs, and recovery artifacts.
- `DigitalOcean` = receives env values from Doppler sync/export process.

## Part A: Doppler Setup (Production)

### 1) Create Doppler Project/Configs

Create one Doppler project: `memoryos`.

Create configs:
- `dev`
- `staging`
- `prod`

Create two services (logical):
- `backend`
- `frontend`

Recommended naming:
- `memoryos_backend_prod`
- `memoryos_frontend_prod`

### 2) Add secrets to Doppler

Backend (minimum):
- `NODE_ENV=production`
- `JWT_SECRET`
- `MEMORYOS_JWT_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `DATABASE_URL`
- `CHECKOUT_PROVIDER=polar`
- `POLAR_CHECKOUT_URL_PRO`
- `POLAR_CHECKOUT_URL_SCALE`
- `POLAR_CHECKOUT_URL_ENTERPRISE`
- `OPENROUTER_API_KEY`
- `CONNECTOR_OAUTH_STATE_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SLACK_CLIENT_ID`
- `SLACK_CLIENT_SECRET`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT=production`
- `SENTRY_TRACES_SAMPLE_RATE=0.1`
- `DD_API_KEY`
- `DD_SITE=us5.datadoghq.com`
- `DD_SERVICE=memoryos-backend`
- `DD_ENV=production`
- `DD_TRACE_ENABLED=true`
- `DD_TRACE_AGENT_URL`

Frontend (minimum):
- `NODE_ENV=production`
- `NEXT_PUBLIC_MEMORYOS_API_ORIGIN`
- `MEMORYOS_API_ORIGIN`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_FRONTEND_API`
- `NEXT_PUBLIC_POLAR_CHECKOUT_URL_PRO`
- `NEXT_PUBLIC_POLAR_CHECKOUT_URL_SCALE`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1`
- `NEXT_PUBLIC_DD_APPLICATION_ID`
- `NEXT_PUBLIC_DD_CLIENT_TOKEN`
- `NEXT_PUBLIC_DD_SITE=us5.datadoghq.com`
- `NEXT_PUBLIC_DD_SERVICE=memoryos-frontend`
- `NEXT_PUBLIC_DD_ENV=production`

### 3) Access control

Use least privilege:
- Founder/owner: full admin
- Operator: read + rotate
- Engineer: read-only for non-prod, limited prod access

Enable:
- 2FA
- audit logs

### 4) Deploy flow

For every deployment:
1. Update Doppler config (`prod`).
2. Sync values to DigitalOcean app envs.
3. Redeploy services.
4. Verify health + logs + traces.

Rule:
- Never commit real secrets in repo.
- `.env` files remain local only.

## Part B: 1Password Setup (Team Ops)

### 1) Create vaults

- `MemoryOS-Prod-Secrets` (restricted)
- `MemoryOS-Infra-Recovery` (founder + operator)
- `MemoryOS-Integrations` (OAuth app settings, webhook metadata)

### 2) Store these in 1Password

- Root/master recovery docs
- Cloud account recovery contacts
- Datadog org recovery details
- Sentry org ownership + recovery
- Polar ownership + billing admin recovery
- Domain/DNS registrar recovery
- OAuth app console owner accounts
- Emergency rollback instructions

Do not store only in chat history.

### 3) Rotation policy

Rotate every 90 days (or sooner on incident):
- `JWT_SECRET`
- `CONNECTOR_OAUTH_STATE_SECRET`
- API keys (Datadog, OpenRouter)
- OAuth client secrets

Rotation sequence:
1. Generate new secret.
2. Store in 1Password.
3. Update Doppler.
4. Roll deploy.
5. Confirm health.
6. Revoke old credential.

## Part C: Operational Checklists

### Daily

- Check Sentry new issues
- Check Datadog APM errors/p95
- Check connector sync failures

### Weekly

- Export and review Doppler audit log
- Validate backup/recovery docs still current
- Confirm Azure NSG `8126` source is restricted (not `Any`)

### Pre-release

- Confirm all required env present in Doppler `prod`
- Confirm DigitalOcean env matches Doppler
- Confirm Sentry and Datadog ingestion active
- Run `npm run ops:check:observability` before deploy

## Incident Response (Secrets Leak)

1. Revoke exposed key immediately.
2. Rotate key in provider.
3. Update 1Password record.
4. Update Doppler.
5. Redeploy impacted services.
6. Audit logs for abnormal access.
7. Document incident + resolution timeline.

## Definition of Done

This runbook is considered implemented when:
- All production secret values are maintained in Doppler.
- 1Password has complete recovery and ownership records.
- DigitalOcean deploys are updated only from managed secret sources.
- No real secrets are committed to repo.

## Immediate Next Actions (Today)

1. Create Doppler project `memoryos` with configs: `dev`, `staging`, `prod`.
2. Import current DigitalOcean backend/frontend env values into Doppler `prod`.
3. Save recovery ownership docs in 1Password for:
   - DigitalOcean
   - Cloudflare
   - Polar
   - Sentry
   - Datadog
4. Freeze manual ad-hoc env edits in DigitalOcean (except break-glass incident use).
5. Route all secret updates through: Doppler change -> 1Password note -> redeploy.
6. Use managed runs for local/prod-safe testing:
   - `npm run ops:doppler:dev:full`
   - `npm run ops:check:observability`
