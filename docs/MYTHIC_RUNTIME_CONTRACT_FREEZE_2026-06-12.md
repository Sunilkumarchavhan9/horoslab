# Mythic Runtime Contract Freeze (June 12, 2026)

Owner: Continuity Lab / Mythic migration  
Scope: Freeze event + panel contracts before autonomous/back-end expansion

## Purpose

This lock captures the runtime contracts currently powering the Devin-style Continuity Lab session UI.  
Any future changes must be additive or versioned, not silent breaking edits.

## Source of Truth

- Runtime events endpoint and builder:
  - `server/routes/runtime.routes.ts` (`buildRuntimeEvents`, `GET /api/runtime/threads/:id/events`)
- Runtime request/response schemas:
  - `server/schemas/runtime.schema.ts`
- Frontend runtime type adapters:
  - `memoryos-frontend/lib/continuity-lab/openhands-api.ts`
  - `memoryos-frontend/lib/continuity-lab/chat-events.ts`
  - `memoryos-frontend/lib/continuity-lab/event-adapter.ts`
- Contract coverage:
  - `tests/runtime.routes.contract.test.ts`
  - `tests/runtimeContinueThread.contract.test.ts`
  - `tests/unit/openhands-event-stream.unit.test.ts`

## Frozen Runtime Event Kinds (v1)

`/api/runtime/threads/:id/events` returns an ordered array of events with these `kind` values:

1. `message`
2. `file_change`
3. `worklog`
4. `shell`
5. `pr_status`
6. `desktop_status`
7. `desktop_preview_url`

### Event Payload Schemas (v1)

1. `message`
   - `{ id: string, role: "user" | "agent" | "system", text: string, timestamp: string }`
2. `file_change`
   - `{ id: string, path: string, kind: "edit" | "write", detail?: string, content?: string }`
3. `worklog`
   - `{ id: string, label: string, detail?: string, timestamp: string }`
4. `shell`
   - `{ id: string, command: string, timestamp: string }`
5. `pr_status`
   - `{ status: "pending" | "passed" | "failed" | "merged", number?: number, url?: string | null }`
6. `desktop_status`
   - `{ status: "idle" | "starting" | "live" | "error", runtimeMessage?: string | null }`
7. `desktop_preview_url`
   - `{ previewUrl: string | null }`

## Frozen UI Panel Data Contracts (v1)

1. Chat panel
   - Uses `ChatBubble[]` from `eventsToChatBubbles(...)`
   - Bubble shape: `id`, `role`, `text`, `timestamp`, optional `variant`, `thoughtDurationSec`
2. Changes panel
   - Uses `FileChangeEntry[]` from `eventsToFileChanges(...)`
   - Shape: `id`, `path`, `kind`, optional `detail`, `content`
3. Worklog panel
   - Uses `WorklogEntry[]` from `eventsToWorklog(...)`
   - Shape: `id`, `label`, optional `detail`, `timestamp`
4. Shell panel
   - Uses `ShellLineEntry[]` from `eventsToShellLines(...)`
   - Shape: `id`, `command`, `timestamp`
5. PR panel
   - Uses `pr_status` event projection into `agent-store.prStatus`
6. Desktop panel
   - Uses `desktop_status` + `desktop_preview_url` projection into `agent-store.desktopState`

## Autonomous Stage Contract (Phase 0 extension)

Thread objects now carry explicit autonomous loop stage state:

- `autonomousStage`: `"plan" | "execute" | "verify" | "pr"`
- `autonomousStageStatus`: `"idle" | "running" | "blocked" | "completed"`
- `autonomousStageUpdatedAt`: ISO timestamp

API controls:

1. `PATCH /api/runtime/threads/:id`
   - Accepts optional `autonomousStage`, `autonomousStageStatus`
2. `POST /api/runtime/threads/:id/autonomous-stage`
   - Body: `{ stage, status }`
   - Updates stage and status atomically for orchestration transitions

## Structured Agent Handoff Contract (Phase 0 extension)

Runtime thread now supports persistent, structured handoffs:

- `POST /api/runtime/threads/:id/handoffs`
  - Body:
    - `source`: `"manager" | "coder" | "reviewer" | "verifier"`
    - `target`: `"manager" | "coder" | "reviewer" | "verifier"`
    - `taskId`: string
    - `payload`: `{ codeChanges?: string[], testResults?: string[], artifacts?: string[] }`
    - `metadata`: `{ confidence: number(0..1), completeness: number(0..1), notes: string }`
    - `requirements`: string[]
    - `compressedContext`: string
- `GET /api/runtime/threads/:id/handoffs?limit=20`
  - Returns newest-first handoff entries.

## Artifact Registry Contract (Phase 0 extension)

Thread-scoped artifacts are stored and retrievable through `artifact://` URIs:

- `POST /api/runtime/threads/:id/artifacts`
  - Body:
    - `type`: `"code" | "test" | "preview" | "recording" | "log"`
    - `producer`: `"manager" | "coder" | "reviewer" | "verifier"`
    - `consumers`: role array
    - `title`: string
    - `description`: optional string
    - `content`: optional string
    - `metadata.tags`: string[]
    - `metadata.expiresAt`: optional ISO datetime
    - `sourceHandoffId`: optional string
- `GET /api/runtime/threads/:id/artifacts?limit=20`
- `GET /api/runtime/threads/:id/artifacts/:artifactId`
- Artifact URI format:
  - `artifact://<threadId>/<artifactId>`

## Change Policy

1. Non-breaking additions only in v1:
   - New optional fields are allowed.
   - New event kinds are allowed only if frontend gracefully ignores unknown kinds.
2. Breaking changes require versioning:
   - Introduce `v2` schemas/routes or explicit migration shim.
   - Add/adjust contract tests before merge.
3. Migration branch for this workstream:
   - `feature/mythic-ui-replace`
