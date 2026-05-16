# MemoryOS Emergency Secrets Runbook

## Owner Contacts
- Primary owner:
- Secondary operator:
- Escalation backup:

## Systems
- DigitalOcean app:
- Cloudflare zone:
- Polar account:
- Sentry org/project:
- Datadog org/services:
- Domain registrar:

## Break-Glass Procedure
1. Confirm incident scope (which key/token leaked).
2. Revoke compromised token in provider immediately.
3. Generate replacement token/secret.
4. Save new value in 1Password first.
5. Sync new value to Doppler target config.
6. Redeploy affected services.
7. Verify:
   - health endpoints
   - login/auth flow
   - billing flow
   - connector OAuth flow
   - Sentry + Datadog ingestion
8. Revoke old token and capture evidence.
9. Add incident summary and timeline below.

## Incident Timeline
- Date/time (UTC):
- Trigger:
- Systems impacted:
- Resolution complete:
- Follow-up actions:
