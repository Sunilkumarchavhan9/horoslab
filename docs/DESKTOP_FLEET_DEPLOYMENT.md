# MemoryOSTM Desktop Fleet Deployment (WebRTC/VNC Grade)

This repo now supports a capacity-aware desktop provider bridge for real desktop sessions.

## What is implemented in app/service code

- Fleet-aware provider mode (`MEMORYOSTM_DESKTOP_BRIDGE_MODE=fleet`)
- OS-aware node scheduling (`ubuntu` / `windows`)
- Capacity limits with overload protection (`503` when saturated)
- Lease lifecycle (start, keepalive via input, expiry to `stale`)
- Stream metadata (`mode`, latency, fps, resolution)
- Token-enforced gateway authorization for VNC/WebRTC edge services
- Optional input forwarding from the app service to the desktop gateway
- Optional screenshot proof capture from the live desktop gateway
- Provider health endpoint with per-node capacity telemetry

## Required environment for runtime API

Set the app to use external provider bridge:

```env
MEMORYOSTM_DESKTOP_PROVIDER=external
MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL=http://localhost:3011/internal/desktop-provider
MEMORYOSTM_DESKTOP_PROVIDER_TOKEN=change-me
```

## Required environment for desktop bridge

```env
MEMORYOSTM_DESKTOP_BRIDGE_MODE=fleet
MEMORYOSTM_DESKTOP_PROVIDER_TOKEN=change-me
MEMORYOSTM_DESKTOP_FLEET_JSON=[...]
```

`MEMORYOSTM_DESKTOP_FLEET_JSON` example node:

```json
{
  "id": "ubuntu-vnc-a",
  "label": "Ubuntu VNC A",
  "osTypes": ["ubuntu"],
  "capacity": 30,
  "transportMode": "vnc",
  "previewUrlTemplate": "https://desktop-gateway.example/preview/{sessionId}?token={token}",
  "controlUrlTemplate": "https://desktop-gateway.example/control/{sessionId}?token={token}",
  "inputUrlTemplate": "https://desktop-gateway.example/sessions/{sessionId}/input",
  "screenshotUrlTemplate": "https://desktop-gateway.example/sessions/{sessionId}/screenshot.png?token={token}",
  "healthUrl": "https://desktop-gateway.example/health"
}
```

Template tokens: `{threadId}`, `{osType}`, `{sessionId}`, `{token}`, `{nodeId}`.

For Windows, register separate Windows-capable nodes:

```json
{
  "id": "windows-vnc-a",
  "label": "Windows VNC A",
  "osTypes": ["windows"],
  "capacity": 10,
  "transportMode": "vnc",
  "previewUrlTemplate": "https://windows-gateway.example/desktop/{sessionId}?token={token}",
  "controlUrlTemplate": "https://windows-gateway.example/desktop/{sessionId}?token={token}",
  "inputUrlTemplate": "https://windows-gateway.example/sessions/{sessionId}/input",
  "screenshotUrlTemplate": "https://windows-gateway.example/sessions/{sessionId}/screenshot.png?token={token}"
}
```

## Gateway authorization contract

The real VNC/WebRTC gateway should verify every stream/control request before proxying it to a desktop node:

```http
GET /internal/desktop-provider/desktop/gateway/authorize?sessionId={sessionId}&token={token}
```

or:

```http
GET /internal/desktop-provider/desktop/gateway/authorize
Authorization: Bearer {token}
X-MemoryOSTM-Desktop-Session: {sessionId}
```

Responses:

- `204`: session is live and token is valid
- `401`: missing, invalid, or expired token
- `410`: session is no longer live

For nginx-style gateways, wire this endpoint through `auth_request` before serving noVNC, WebRTC signaling, or control channels.

## Input forwarding contract

When `inputUrlTemplate` is present, app-level mouse/keyboard/text events are forwarded to the gateway:

```json
{
  "sessionId": "fleet-ubuntu-vnc-a-task-123",
  "threadId": "task-123",
  "osType": "ubuntu",
  "event": { "type": "key", "key": "Enter", "action": "press" },
  "at": "2026-06-15T00:00:00.000Z"
}
```

The gateway should enforce the `Authorization: Bearer {token}` header, translate events into VNC/RDP/WebRTC input, and return `2xx` only after accepting the event.

## Screenshot proof contract

When `screenshotUrlTemplate` is present, MemoryOSTM exposes proof capture through:

```http
POST /api/runtime/threads/{threadId}/desktop/screenshot
```

The runtime calls the desktop provider, receives a token-scoped `imageUrl`, and creates a `preview` artifact tagged `desktop`, `screenshot`, and `visual-proof`. Sandbox mode intentionally returns `captured: false` so fake screenshots are never saved as verification evidence.

The gateway endpoint behind `screenshotUrlTemplate` should:

- verify the same session token used for stream/control
- capture the current visible desktop frame
- return or serve an image URL scoped to the session token
- expire screenshot URLs with the session lease

## Quick local stack

Use:

- [`infra/desktop-fleet/docker-compose.yml`](/c:/projects/MemoryOS/infra/desktop-fleet/docker-compose.yml)

This starts:

- MemoryOSTM backend with fleet bridge enabled
- Ubuntu desktop container (`linuxserver/webtop`) as a VNC-style desktop target
- Ubuntu desktop adapter sidecar that exposes the MemoryOSTM desktop target contract for stream proxying, input forwarding, and screenshots

## MemoryOSTM desktop gateway

The backend now also exposes a gateway surface:

- `GET /desktop-gateway/health`
- `GET /desktop-gateway/sessions/{sessionId}/authorize?token={token}`
- `GET /desktop-gateway/sessions/{sessionId}/view?target={targetId}&token={token}`
- `POST /desktop-gateway/sessions/{sessionId}/input?target={targetId}`
- `GET /desktop-gateway/sessions/{sessionId}/screenshot?target={targetId}&token={token}`
- `ANY /desktop-gateway/sessions/{sessionId}/proxy/{path}?target={targetId}&token={token}`
- `WS /ws/desktop-gateway/sessions/{sessionId}?target={targetId}&token={token}`

Configure gateway targets with:

```env
MEMORYOSTM_DESKTOP_GATEWAY_TARGETS_JSON=[
  {
    "id": "ubuntu-vnc-a",
    "label": "Ubuntu VNC A",
    "osTypes": ["ubuntu"],
    "httpBaseUrl": "http://ubuntu-desktop-adapter:3090",
    "inputUrlTemplate": "http://ubuntu-desktop-adapter:3090/input/{sessionId}",
    "screenshotUrlTemplate": "http://ubuntu-desktop-adapter:3090/sessions/{sessionId}/screenshot.png",
    "wsUrlTemplate": "ws://ubuntu-desktop-a:3000/websockify?token={sessionId}"
  },
  {
    "id": "windows-vnc-a",
    "label": "Windows VNC A",
    "osTypes": ["windows"],
    "httpBaseUrl": "https://windows-gateway.example",
    "inputUrlTemplate": "https://windows-gateway.example/sessions/{sessionId}/input",
    "screenshotUrlTemplate": "https://windows-gateway.example/sessions/{sessionId}/screenshot.png",
    "wsUrlTemplate": "wss://windows-gateway.example/sessions/{sessionId}/ws"
  }
]
```

The gateway validates every request against the provider bridge authorization endpoint before proxying traffic to a desktop target. This is the production boundary that keeps stream/control URLs session-scoped instead of public.

Screenshot capture is also proxied through the same gateway boundary. The target must return an `image/*` response, and the gateway marks it `Cache-Control: no-store` so visual proof is not accidentally cached in shared infrastructure.

When the runtime creates a screenshot artifact, it attempts to persist the image bytes instead of only saving an expiring URL. Configure trusted screenshot origins with:

```env
MEMORYOSTM_DESKTOP_SCREENSHOT_FETCH_ALLOWED_ORIGINS=https://desktop-gateway.example,http://localhost:3011
MEMORYOSTM_DESKTOP_SCREENSHOT_MAX_BYTES=2097152
```

If the screenshot URL is not allowlisted, is too large, or does not return an image response, MemoryOSTM falls back to saving the token-scoped link and marks the artifact as `linked-proof`.

For noVNC/webtop-style frontends, the gateway rewrites proxied HTML/CSS/JS so absolute asset paths stay inside the authenticated proxy:

- `/app.js` becomes `/desktop-gateway/sessions/{sessionId}/proxy/app.js?...`
- `url('/wallpaper.png')` becomes a gateway proxy URL
- upstream noVNC `token=` values become `upstream_token=` at the browser boundary, then convert back to `token=` when the gateway calls the desktop target

This prevents blank iframes caused by noVNC assets escaping to the MemoryOSTM app root.

## Local Ubuntu render path

The local Ubuntu path uses a real webtop desktop plus a small MemoryOSTM adapter:

- `ubuntu-desktop-a`: real Ubuntu/XFCE webtop on port `6080`
- `ubuntu-desktop-adapter`: target contract wrapper on port `6090`
- MemoryOSTM desktop gateway/provider on port `3011`

The adapter keeps the app contract clean:

- `GET /health`
- `POST /input/{sessionId}`
- `GET /sessions/{sessionId}/screenshot.png`
- `ANY /*` proxied to the real webtop view

The adapter validates bearer tokens against the provider gateway authorization endpoint before accepting input or screenshot capture.

1. Start the Ubuntu desktop target and adapter:

```powershell
$env:MEMORYOSTM_DESKTOP_PROVIDER_TOKEN="dev-desktop-token"
docker compose -f infra/desktop-fleet/docker-compose.yml up -d ubuntu-desktop-a ubuntu-desktop-adapter
```

By default, the adapter validates local desktop tokens against the host gateway at:

```text
http://host.docker.internal:3011/internal/desktop-provider/desktop/gateway/authorize
```

If you run the provider inside compose instead, set `MEMORYOSTM_DESKTOP_ADAPTER_AUTHORIZE_URL` to the provider service URL before starting the adapter.

2. Start the MemoryOSTM gateway/provider from the repo:

```powershell
powershell -ExecutionPolicy Bypass -File infra/desktop-fleet/start-local-gateway.ps1
```

If an older local backend is already listening on `3011`, restart the desktop gateway cleanly:

```powershell
powershell -ExecutionPolicy Bypass -File infra/desktop-fleet/start-local-gateway.ps1 -RestartExisting
```

This writes `.memoryostm/desktop-gateway-local.ps1` and starts the backend on `http://localhost:3011` with:

- `MEMORYOSTM_DESKTOP_BRIDGE_MODE=fleet`
- `ubuntu-vnc-a` proxied through the adapter at `http://localhost:6090`
- `windows-rdp-a` reserved for a real Windows gateway URL

This local path avoids a fresh `npm ci` inside the provider container on Windows while still using the same provider/gateway APIs as production.

3. Validate gateway health:

```powershell
Invoke-RestMethod http://localhost:3011/desktop-gateway/health
```

Expected: `ok: true` with at least `ubuntu-vnc-a` in `targets`.

4. Point the app runtime to the provider:

```env
MEMORYOSTM_DESKTOP_PROVIDER=external
MEMORYOSTM_DESKTOP_PROVIDER_BASE_URL=http://localhost:3011/internal/desktop-provider
MEMORYOSTM_DESKTOP_PROVIDER_TOKEN=dev-desktop-token
```

5. Wake an Ubuntu Desktop tab from Continuity Lab.

Expected URL shape:

```text
http://localhost:3011/desktop-gateway/sessions/{sessionId}/view?target=ubuntu-vnc-a&token={token}
```

The iframe should load the Ubuntu webtop through `/desktop-gateway`, not directly from `:6080`.

For direct API validation:

```powershell
$body = @{ threadId = "local-desktop-test"; osType = "ubuntu" } | ConvertTo-Json
Invoke-RestMethod `
  -Uri http://localhost:3011/internal/desktop-provider/desktop/sessions/start `
  -Method Post `
  -Headers @{ Authorization = "Bearer dev-desktop-token"; "Content-Type" = "application/json" } `
  -Body $body
```

Open the returned `controlUrl` to verify the live desktop stream.

6. Run the end-to-end Ubuntu smoke gate:

```powershell
npm run desktop:smoke:ubuntu
```

The smoke gate checks:

- desktop gateway health
- provider fleet health
- live Ubuntu session allocation
- token-scoped gateway authorization
- input forwarding
- screenshot capture with real PNG bytes
- clean session stop

If the screenshot step returns HTML, an auth page, or a blank gateway error instead of a PNG, the script fails immediately.

## Production checklist (infra-level)

- Terminate TLS at edge for preview/control stream URLs
- Isolate tenant/session network boundaries
- Enforce per-tenant/session auth on desktop gateway
- Add HPA/autoscaling for desktop nodes by in-use/capacity and latency
- Add SLO alerts:
  - session start p95
  - stream reconnect success
  - control latency p95
  - fleet saturation ratio
- Run soak test (8h+) and chaos test (node restarts, packet loss)
