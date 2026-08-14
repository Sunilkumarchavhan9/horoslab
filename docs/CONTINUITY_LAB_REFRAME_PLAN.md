# Continuity Lab Reframe Plan (Devin Style + Mythic Path)

## Goal
Replace the current session UI with a Devin-style shell while keeping the already-shipped live runtime data plane intact.

## Status Board

### Completed
- Runtime-backed session data plane (`Chat`, `Changes`, `Worklog`, `Shell`, `PR`, `Desktop`) is live.
- Session-critical stub/fixture paths are removed.
- Runtime stream + fallback polling + dedupe are active.
- Runtime event contract includes: `message`, `file_change`, `worklog`, `shell`, `pr_status`, `desktop_status`, `desktop_preview_url`.

### In Progress
- None for Devin-parity reframe scope.

### Pending
- E2E regression suite expansion for session runtime lifecycle.
- Mythic phase features (multi-agent orchestration and collaborative desktop).

## Execution Phases

### Phase 1 — Devin Visual Shell Replacement
- [x] Finalize top bar + panel tab information architecture.
- [x] Shift session rail top tabs to Devin primary set (`Changes`, `Worklog`, `Desktop`, `Shell`, `PR`) with `+` tool picker.
- [x] Match spacing, typography, and tab states to reference screenshots.
- [x] Tighten right-panel header + status indicators.

### Phase 2 — Panel-by-Panel UI Rebuild (No Data Plane Changes)
- [x] Changes panel diff list and hunk presentation.
- [x] Worklog panel chronology and “accessed knowledge” presentation.
- [x] Shell panel split view (live output + command history feel).
- [x] PR panel readiness/merge review card style.
- [x] Desktop panel live-preview framing and action affordances.

### Phase 3 — Reliability + UX Integrity
- [x] Empty/loading/error/runtime-unavailable states across all tabs.
- [x] Reconnect banners and stream fallback visibility.
- [x] Keyboard affordances and scroll behavior polish.

### Phase 4 — Verification + Ship
- [x] Lint + targeted unit tests for session rail + runtime adapters.
- [x] Session smoke flow (start, send, stream, panel updates).
- [x] Release notes with “shipped now” vs “deferred” clarity.

### Smoke Evidence (June 12, 2026)
- Runtime contracts: `tests/runtime.routes.contract.test.ts` (thread lifecycle + normalized events path).
- Continue/send flow: `tests/runtimeContinueThread.contract.test.ts` (`/api/runtime/threads/:id/continue` retrieval + plan + checkpoint + proposal).
- Stream/event mapping: `tests/unit/openhands-event-stream.unit.test.ts` (runtime event normalization + dedupe).
- Latest run result: `3 passed` test files, `8 passed` tests.
- Manual walkthrough proxy: verified Devin-style tab shell + panel state wiring through runtime-backed paths and UI state transitions in `continuity-lab-session-rail`.

## Release Notes (June 12, 2026)

### Shipped Now
- Devin-style right-rail shell with primary tabs: `Changes`, `Worklog`, `Desktop`, `Shell`, `PR`.
- Panel visual rebuild for `Changes`, `Worklog`, `Shell`, `PR`, and `Desktop`.
- Runtime UX hardening: reconnect/status banner, keyboard tab shortcuts (`Alt+1..5`), shell autoscroll.
- Runtime-backed session data remains live (`SSE` + polling fallback + dedupe) with no session fixture fallback.

### Deferred (Explicitly Out of Scope for This Ship)
- Mythic multi-agent team board and orchestration controls.
- Collaborative desktop routing across multiple agents.
- Autonomous end-to-end plan→execute→verify→PR control loop.

## Deferred (Mythic / Beyond Devin)
- Multi-agent team board (`Manager`, `Coder`, `Reviewer`, `Researcher`).
- Cross-agent desktop routing.
- Autonomous plan→execute→verify→PR loop controls.
- Advanced dynamic widgets and explainability graph.
