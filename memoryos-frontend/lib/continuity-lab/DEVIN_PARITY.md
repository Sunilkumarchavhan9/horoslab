# Continuity Lab — Devin UI parity vs MemoryOS

Routes:

| Route | Purpose |
|-------|---------|
| `/continuity-lab` | Sessions home — Devin-style prompt, checklist, MCP banner |
| `/continuity-lab/ask` | Ask — same prompt shell + memory toggles |
| `/continuity-lab/ask/advanced` | Advanced capabilities hub |
| `/continuity-lab/capabilities` | Alias → `/continuity-lab/ask/advanced` |

## Implemented (Devin-style)

- Centered prompt card with Agent dropdown (Agent / Continuity)
- `+` menu (attachments, repos)
- `⋯` menu: MCP connectors, improve prompt (stub), schedule → automations, copy prompt link, inject resume brief, wiki attach
- Footer: repo count, Ubuntu/Windows OS picker (localStorage), Upgrade plan, Advanced capabilities
- Get started checklist — 10 steps, localStorage + connector/funnel signals, progress bar
- Advanced capabilities — left nav (batch, schedules, playbooks, knowledge, analyze, **memory**), prompt cards, MCP/memory banner
- MemoryOS: continuity score on home, inject resume brief, company memory toggle, operational workflows

## Org Continuity Lab settings (`/continuity-lab/settings/continuity-lab`)

Backed by `GET/PATCH /api/memory/lab-continuity-lab-settings` (org-scoped via `x-memoryos-org-id`). Local cache + `memoryos:lab-continuity-lab-settings-changed` event keeps tabs and `ContinuityLabProvider` in sync.

### Review settings (`/continuity-lab/settings/review`)

Backed by `GET/PATCH /api/memory/lab-review-settings` and `GET /api/memory/review/enrolled-repos`. Local cache + `memoryos:lab-review-settings-changed` cross-tab sync; connector SSE refreshes GitHub repo list and `/api/connector/index-status` for enrolled repos. **Live:** settings round-trip, enrollment, comment/CI toggles, rule globs, review session prompts. **Stub:** batch PR review on GitHub webhooks / auto-run on `on_pr_creation` enrollment.

| Field | Settings UI | Runtime consumption |
|-------|-------------|---------------------|
| `secureMode` | Toggle | Injected into new session `system_message_suffix`; `memoryos_org_defaults` on OH settings POST (OH may ignore) |
| `computerUse` | Toggle | Same as `secureMode` |
| `defaultAgent` | Select | Maps to OpenRouter model on session create + OH `agent_settings_diff.llm.model` sync |
| `defaultPlatform` | Ubuntu/Windows | `sandbox-os-defaults` org scope, ask OS picker, session suffix hint; **OH sandbox OS still Linux** |
| `customCommands` + system commands | Commands list | Session chat `/` autocomplete; `/name` expands to command prompt on send |
| `batchLimit` | Number | **Stub** — stored server-side only; no batch runner yet |
| `messageUsageLimitUsd` | Number | **Stub** — stored server-side only; no billing enforcement yet |
| `sharePromptsInPrs` | Toggle | **Stub** — stored; GitHub PR bot not wired |
| `requireMemoryosToRespond` | Toggle | Merged into user `reviewTrigger` preference helper (manual when on); PR bot **stub** |
| `autoAddReviewer` | Toggle | **Stub** |
| `openPrsAs` | Select | Merged with user `openPullRequestsAsDrafts` when `memoryos`; PR creation **stub** |
| `respondingToBots` | Select | **Stub** |

User-level PR drafts / review trigger remain in **Settings → Preferences** (`lab-preferences`); org PR fields override via `mergeLabPreferencesWithOrgPrSettings` when that helper is used by PR flows.

## Coming soon (honest stubs)

- **Record voice prompt** — disabled in `⋯` menu
- **Send to Slack** — disabled until Slack execution adapter is wired from Ask
- **Batch session execution** — cards prefill/start one session; no parallel batch runner
- **Cron schedules** — automations UI only; no hosted cron
- **Playbooks** — templates/automations; no separate playbook engine
- **Windows sandbox** — OS picker is preference only; OpenHands runtime may still use Linux
- **Auto-approve child sessions** — localStorage toggle; runtime approval gate unchanged
- **Improve prompt** — lightweight stub (`improve-prompt.ts`), not an LLM rewrite
- **$10 earned** strikethrough on repo step — cosmetic Devin reference only

## Fast ship release notes (June 12, 2026)

- Session-critical runtime path now uses MemoryOS runtime APIs directly (no OpenHands placeholder adapter in active session flow).
- `/api/runtime/threads/:id/events` is the parity event source for session panels and supports JSON + SSE transport.
- Normalized event kinds: `message`, `file_change`, `worklog`, `shell`, `pr_status`, `desktop_status`, `desktop_preview_url`.
- Live stream resilience: SSE first, polling fallback, reconnect, and dedupe-by-id on frontend.
- Session fixtures/stub fallback are removed from active panels (`Chat`, `Changes`, `Worklog`, `Shell`, `PR`, `Desktop`).
- Non-session “coming soon” areas remain intentionally out of scope for this parity ship.

## MemoryOS-only (not in Devin)

- Resume brief injection and continuity score
- Company memory toggle on session start
- Governance / action memory links in checklist and advanced **Memory** section
- Company Model (OpenRouter) requirement for sessions
