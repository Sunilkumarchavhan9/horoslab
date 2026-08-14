# Phase 1 Execution Board: Engineering Continuity

Date: 2026-06-16  
Owner: Founder + Core Engineering  
Status: Active

## Phase 1 Definition

Goal:
- Never explain your codebase twice.

Customer:
- Startups
- AI-native companies
- Engineering teams

Scope:
- GitHub ingestion
- Slack ingestion
- Jira ingestion
- Memory contracts
- Resume API
- Handoff API
- MCP server
- Continuity Lab (resume work, continue tasks, agent memory, human-agent collaboration)

Guardrail:
- Do not broaden beyond engineering until the loop is repeatable.

Primary metric:
- 10 engineering teams using MemoryOS weekly.

Completion gate:
- `npm run phase1:e2e:gate` must pass with all checks green.
- Gate report artifact: `data/eval/reports/phase1-e2e-gate.json`.
- `npm run phase1:production-readiness:gate` must pass against staging/production before Phase 1 is called production-grade.
- Production readiness report artifact: `data/eval/reports/phase1-production-readiness-gate.json`.

Latest gate result:
- 2026-06-18: `npm run phase1:e2e:gate` passed `12/12` against `http://localhost:3011`.
- Verified: health, process, retrieve, continue, resume, handoff, project state, `memory.before_model`, trace proof, `memory.after_model`, runtime request evidence, and Phase 1 KPI telemetry.
- Report: `data/eval/reports/phase1-e2e-gate.json`.
- Production status: not complete until the production readiness gate passes with real production env, Clerk auth, HTTPS OAuth callbacks, Postgres, protected metrics, live connector health, feedback capture, and org-isolation smoke checks.

## Strict Build/Ship Review

Phase / feature:
- Phase 1: Engineering Continuity MVP

Change scope:
- Company source signal -> structured memory -> resume/handoff/project state -> MemoryIgnition before-model -> trace proof -> MemoryIgnition after-model outcome capture -> Phase 1 KPI telemetry.

Core decision:
- Phase 1 is core. It directly improves future-agent inheritance of knowledge, context, memory, risk signals, handoff state, outcome history, and trace proof.

1. Is this the most significant way to build it?
- Yes, for the first wedge. Engineering continuity is the sharpest proof because AI-native engineering teams already feel the pain of re-explaining context to Codex, Cursor, Claude, Devin, Windsurf, Cline, and internal agents.
- The highest-leverage Phase 1 loop is not more console surface. It is reliable resume/handoff plus MemoryIgnition before/after model capture with trace proof.

2. Is this the most efficient/simple way to build it?
- Mostly yes. The MVP reuses existing memory APIs, MCP invocation, project state, request telemetry, and connector scaffolding.
- Keep Phase 1 narrow: one strong continuity loop before broad connector expansion, advanced skills, or multi-agent runtime features.

3. What should be cut or delayed?
- Delay broad non-engineering personas.
- Delay universal agent/robot/machine inheritance.
- Delay complex skill compilation until Phase 3.
- Delay advanced live supervision until MemoryIgnition basics are repeatedly useful.
- Delay decorative control-surface work that does not improve activation, resume quality, handoff quality, trace proof, or outcome capture.

4. What regressions could it introduce?
- Resume and handoff could retrieve weak or stale memories.
- `memory.before_model` schema changes could break MCP clients.
- `memory.after_model` could record incomplete or misleading outcomes.
- Project-state snapshots could become inconsistent with memory retrieval.
- Control-plane telemetry could look healthy while source ingestion quality is poor.
- Runtime request logging changes could break KPI reporting.

5. What security/safety risks could it introduce?
- Wrong workspace memory leakage.
- Unauthorized token use against continuity endpoints.
- Prompt injection from connected docs, Slack, tickets, CI logs, or IDE chats.
- Sensitive data exposure in resume briefs, handoff packets, trace proof, or logs.
- Untrusted tool output poisoning durable memory.
- Risky files or approval rules omitted from before-model context.
- Outcome capture creating false success records.

6. What exact tests must be written before shipping?
- Unit tests for continuity contract validation and trace proof normalization.
- Integration tests for `/api/memory/process`, `/retrieve`, `/continue`, `/resume`, `/handoff`, `/project-state`.
- MCP contract tests for `memory.before_model` and `memory.after_model`.
- Security tests for workspace isolation, token auth, and permission failures.
- Regression tests for empty/low-confidence resume and handoff states.
- E2E gate: source signal -> memory -> retrieve -> resume -> handoff -> before-model -> after-model -> outcome trace proof.
- Control-plane contract tests for Phase 1 KPI telemetry and request evidence.

7. What API/SDK/MCP compatibility must be protected?
- Keep stable field names for resume, handoff, project state, `memory.before_model`, and `memory.after_model`.
- Preserve arrays even when empty: `relevant_memories`, `executable_skills`, `past_mistakes`, `risky_files`, `trace_proof`.
- Preserve `approval_rules.approval_required` as boolean.
- Preserve after-model outcome fields: `outcome_recorded`, `action_memory_id`, `execution_outcome_id`, `experience_draft`, `trace_proof`.
- Do not remove legacy `/api/memory/*` routes while MCP and frontend clients still depend on them.

8. What data model or migration risks exist?
- Existing memories may lack complete source evidence.
- Legacy JSON or Postgres records may not have trace proof fields.
- Project IDs, workspace IDs, and thread IDs may not be consistently scoped.
- Outcome records and experience drafts can diverge if one write succeeds and the other fails.
- Connector sync logs may not map cleanly to Phase 1 KPI telemetry.

9. What logs/metrics/alerts are needed?
- Logs for memory accepted/rejected, retrieve count, resume generated, handoff generated, before-model generated, after-model captured, and trace proof completeness.
- Metrics for resume success rate, handoff success rate, trace proof coverage, retrieval latency, p95 continuity latency, source sync success rate, activation rate, weekly active teams, and outcome capture rate.
- Alerts for continuity endpoint failure spikes, auth failures, trace proof regressions, source sync failures, and after-model capture failures.

10. What is the rollback plan?
- Keep Phase 1 behind existing API route boundaries and MCP tool names.
- If before/after model behavior regresses, disable MCP invocation paths while preserving core memory APIs.
- If source ingestion produces bad memory, pause connector sync and keep manual memory process/retrieve/resume available.
- If telemetry breaks, fall back to request history while fixing KPI aggregation.
- If generated memories are poisoned, mark affected records stale/rejected and exclude from retrieval.

11. Should this ship now, behind a flag, as MVP only, needs redesign, or not yet?
- Ship MVP only behind operational caution.
- Backend Phase 1 loop passes the local E2E gate, so the core is buildable and usable.
- Do not call Phase 1 fully product-complete until at least one real engineering source onboarding flow repeatedly produces useful briefs with trace proof for design partners.

## Core Loop (must be repeatable)

1. Connect engineering sources
2. Sync structured memory contracts
3. Run resume/handoff in real work
4. Continue execution without re-explaining context

## Weekly KPI Scoreboard

- `weekly_active_teams` (target: 10)
- `activation_rate` (connected source + first continuity run)
- `resume_success_rate`
- `handoff_success_rate`
- `p95_retrieve_latency`
- `time_to_first_value_minutes`

Sprint rule:
- Every sprint must improve at least one KPI and preserve reliability.

## 6-Week Delivery Plan (starts 2026-06-16)

### Week 1: Reliability floor
- Stabilize source sync and runtime request success paths.
- Remove placeholder behavior on core continuity surfaces when live data exists.
- Add alerting for sync failures and continuity endpoint failures.

Definition of done:
- Source sync success rate >= 95% in active workspaces.
- No blocker errors in primary continuity flow for design partners.

### Week 2: Onboarding to first value
- Trim onboarding path to source connect -> first resume.
- Improve first-run copy and guided actions in Mission Control and Continuity Lab.
- Ensure first continuity result appears in under 30 minutes for new partner teams.

Definition of done:
- Median time-to-first-value <= 30 minutes.
- Activation rate trending upward week-over-week.

### Week 3: Resume/Handoff quality
- Improve resume and handoff output quality consistency.
- Enforce memory contract quality gates for low-signal inputs.
- Increase explainability and trace proof quality in continuity outputs.

Definition of done:
- Resume/handoff success rate meets agreed weekly target.
- Fewer partner-reported context misses.

### Week 4: Design partner repeat usage
- Drive weekly usage across the first cohort.
- Run structured partner reviews and collect blocked workflow signals.
- Fix top 3 workflow blockers that reduce repeat usage.

Definition of done:
- At least 5 teams weekly active.
- Repeat usage in multiple sessions per team.

### Week 5: Scale loop to 10 teams
- Expand from early partners to 10 engineering teams.
- Harden operational playbook for support, incident response, and PR review continuity.
- Add founder-facing weekly KPI review ritual.

Definition of done:
- 10 teams weekly active, with continuity loop visible in product telemetry.

### Week 6: Lock and prepare Phase 2 entry criteria
- Validate that loop is repeatable for multiple team profiles.
- Freeze Phase 1 criteria and document what is still weak.
- Decide if Phase 2 can start based on evidence, not roadmap pressure.

Definition of done:
- Phase 1 evidence pack complete and reviewed.
- Explicit go/no-go decision for Phase 2.

## End-to-End Verification

Run locally:

```bash
PHASE1_GATE_BASE_URL=http://localhost:3001 \
PHASE1_GATE_TOKEN=<memory_api_token> \
npm run phase1:e2e:gate
```

What the gate verifies:
- API health is live.
- Core continuity flow succeeds:
  - `process`
  - `retrieve`
  - `continue`
  - `resume`
  - `handoff`
- Runtime request-history evidence exists for those routes.
- Phase 1 KPI telemetry is available from `/api/company-brain/kpis`.

CI workflow:
- `.github/workflows/phase1-gate.yml` (manual dispatch)
- `.github/workflows/quality.yml` and `.github/workflows/release.yml` run the same gate in-pipeline.
- Requires repo secrets:
  - `PHASE1_GATE_BASE_URL`
  - `PHASE1_GATE_TOKEN`

Branch protection automation:

```powershell
$env:GITHUB_TOKEN="<repo_admin_token>"
npm run ops:github:protect-main
```

This enforces `quality` as required status check on `main` via GitHub REST API.

## Immediate Backlog (P0)

- Improve connector sync reliability and observability.
- Improve resume/handoff consistency and latency.
- Improve console clarity for loop status and weekly target progress.
- Run weekly partner success reviews and feed findings into product fixes.

## Real Vision Build Plan: Phase 1

Updated: 2026-06-18

Phase 1 is not a control-surface polish phase. It is the first repeatable MemoryOS loop:

```text
Engineering sources
  -> structured memory
  -> resume / handoff / before-model context
  -> agent acts with inherited context
  -> after-model outcome capture
  -> next session starts smarter
```

### Product promise

Never explain your codebase twice.

An engineer or AI agent should be able to start a task and receive:

- what changed
- why it changed
- what failed before
- which files are risky
- what the previous agent or human already tried
- what decision matters now
- what the next best action is
- trace proof for where that context came from

### Existing assets to keep and harden

- Memory APIs: `/api/memory/process`, `/api/memory/retrieve`, `/api/memory/resume`, `/api/memory/resume/brief`, `/api/memory/resume/prompt`, `/api/memory/handoff`
- MCP tools: `memory.before_model`, `memory.after_model`, `memory.handoff`, `memory.project_state`, `memory.next_actions`, `memory.continuity_score`
- Runtime handoffs and agent sessions under `/api/runtime`
- Connector base for GitHub, Slack, Jira, and sync logs
- Phase 1 gate script: `scripts/phase1-e2e-gate.ts`
- Mission Control product sections for Overview, Company Sources, Company Brain, Experience, Skills & Inheritance, MemoryIgnition, Agent Runtime, Approvals, Organizational Learning, and Memory Graph

### P0 build order

1. Contract freeze
   - Define the canonical Phase 1 continuity contract.
   - Lock request and response shapes for resume, handoff, before-model, after-model, project state, and trace proof.
   - Add contract tests before broad UI wiring.

2. Source trace proof
   - Every accepted memory must carry source identity, source type, source URL or file reference, extracted timestamp, confidence, and lineage.
   - Resume, handoff, and before-model responses must include trace proof instead of opaque context.
   - Empty trace proof is allowed only when no source evidence exists.

3. Project state
   - Make project state a first-class API object.
   - Required fields: current goal, recent changes, open blockers, risky files, active loop, last action, next best action, resume confidence, trace proof.
   - Back it with existing memory, action memory, operational loop, and resume planner data.

4. MemoryIgnition before-model
   - Input: `workspace_id`, `agent_id`, `repo_or_task`, `task_intent`, `available_tools`, `risk_level`.
   - Output: `relevant_memories`, `past_mistakes`, `risky_files`, `approval_rules`, `recommended_first_action`, `trace_proof`.
   - Skills can remain empty in Phase 1, but the field must exist so Phase 3 can attach approved executable skills without a breaking change.

5. MemoryIgnition after-model
   - Capture what the agent did, what changed, files touched, tool calls, outcome, failure/success signal, and follow-up action.
   - Convert the captured result into structured memory and an experience draft.
   - Never silently create fake success. Unknown outcome stays unknown.

6. Resume and handoff hardening
   - Resume must answer: where did we leave off, what changed recently, what is blocked, and what to do first.
   - Handoff must answer: current state, open loops, risks, next actions, and trace proof.
   - Both must expose low-confidence states clearly.

7. MCP and IDE prompt generator
   - MCP should expose the Phase 1 tools with stable schemas.
   - IDE prompt generator should produce agent-ready context for Codex, Cursor, Claude, Windsurf, Devin, Cline, and internal agents.
   - The prompt must include memory, risky files, next action, and trace proof.

8. P0 source ingestion
   - Start with GitHub, local docs, Codex / VS Code / Cursor chat imports, and CI logs.
   - Slack and Sentry follow once the core loop is reliable.
   - Each connector must map raw signals into memory categories instead of dumping raw text.

9. Mission Control wiring
   - Overview shows the whole loop and Phase 1 KPI status.
   - Company Sources shows connector state and sync health.
   - Company Brain shows structured memory and trace coverage.
   - MemoryIgnition shows before-model and after-model runs.
   - Agent Runtime shows active sessions, tool permissions, handoffs, and outcome recording.
   - Empty states stay real. Do not fake product data.

10. Phase 1 gate
    - Extend `npm run phase1:e2e:gate` to verify:
      - process
      - retrieve
      - resume
      - handoff
      - before-model
      - after-model
      - project state
      - trace proof exists when source evidence exists
      - control-plane telemetry endpoint returns Phase 1 KPIs

### This week execution

Day 1:
- Audit current contracts and write missing schema tests.
- Identify exact gaps between `memory.before_model` / `memory.after_model` and the MemoryIgnition runtime contract.

Day 2:
- Implement or harden source trace proof fields across process, retrieve, resume, and handoff.
- Ensure trace proof survives through MCP responses.

Day 3:
- Make project state the canonical pre-agent snapshot.
- Wire risky files, blockers, last action, next action, and confidence.

Day 4:
- Harden before-model and after-model into MemoryIgnition v1.
- Add after-model outcome capture into memory and experience draft storage.

Day 5:
- Wire Mission Control to live Phase 1 telemetry.
- Extend and run the Phase 1 E2E gate.

### Phase 1 completion criteria

Phase 1 is complete only when a real engineering team can:

1. Connect at least one engineering source.
2. Sync structured memory from that source.
3. Start a new agent session without re-explaining the codebase.
4. Receive a useful resume brief or handoff package.
5. See trace proof for the context returned.
6. Capture the agent outcome after work.
7. Improve the next session from that outcome.

No Phase 2 work starts until this loop works repeatedly.

### Production-grade criteria

Phase 1 production-grade is stricter than local proof. It requires:

- Production auth through Clerk. `MEMORYOS_DEV_AUTH_BYPASS` must not be enabled outside local development.
- Production OAuth callback URLs using HTTPS, not localhost.
- GitHub and Slack OAuth configured with production app credentials.
- `MEMORY_STORE_BACKEND=postgres` and `DATABASE_URL` configured.
- `METRICS_TOKEN` protecting metrics endpoints.
- Production CORS origins set with `MEMORYOS_CORS_ORIGINS` or `NEXT_PUBLIC_APP_URL`.
- Backend observability configured for Sentry and Datadog.
- Frontend observability configured for Sentry or Datadog RUM.
- Gate artifacts for GitHub, Slack, docs/local files, engineering signal files, and Phase 1 E2E.
- Live production/staging checks for health, connector diagnostics, continuity feedback capture, and org isolation.

Run the production gate:

```powershell
$env:PHASE1_PRODUCTION_PROFILE = "production"
$env:PHASE1_PROD_BASE_URL = "https://api.memoryostm.live"
$env:PHASE1_GATE_ORG_ID = "org_replace_with_staging_or_prod_org"
$env:PHASE1_GATE_TOKEN = "replace_with_memoryos_jwt_or_api_token"
npm run phase1:production-readiness:gate
```

Run a local smoke gate:

```powershell
$env:PHASE1_PRODUCTION_PROFILE = "dev"
$env:PHASE1_GATE_BASE_URL = "http://localhost:3011"
$env:PHASE1_GATE_ORG_ID = "org_replace_with_local_org"
$env:PHASE1_GATE_TOKEN = "replace_with_local_gate_token"
npm run phase1:production-readiness:gate
```

Local smoke warnings are allowed. Production blockers are not.

### Design-partner feedback gate

Local tests cannot prove resume and handoff quality. Phase 1 production-grade also requires structured feedback from real engineering use:

- Resume, handoff, before-model, and after-model workflows can send continuity feedback through `/api/memory/continuity-feedback`.
- Feedback is org-scoped and must never leak across workspaces.
- Weekly review tracks useful resume rate, useful handoff rate, missing context reports, wrong context reports, and what users say MemoryOS should remember next time.

This feedback loop is core because it improves future-agent inheritance quality.

## P0 Tracked Tickets (live board)

As of 2026-06-16.

- `P0-01` Connector sync reliability hardening
  - Owner: Backend
  - Status: In progress
  - Due: 2026-06-23
  - KPI link: `activation_rate`, `weekly_active_teams`
- `P0-02` Resume/Handoff quality and consistency pass
  - Owner: Memory + Runtime
  - Status: In progress
  - Due: 2026-06-27
  - KPI link: `resume_success_rate`, handoff success proxy
- `P0-03` Mission Control Phase 1 scoreboard wired to backend telemetry
  - Owner: Frontend
  - Status: Done
  - Due: 2026-06-16
  - KPI link: `weekly_active_teams`
- `P0-04` First-value onboarding trim to <30 minutes
  - Owner: Product + Frontend
  - Status: Planned
  - Due: 2026-06-30
  - KPI link: `time_to_first_value_minutes`, `activation_rate`
- `P0-05` 10-team design partner weekly review ritual
  - Owner: Founder
  - Status: Planned
  - Due: 2026-07-01
  - KPI link: `weekly_active_teams`, repeat usage

## Non-Goals During Phase 1

- New non-engineering personas
- Broad feature surface expansion outside continuity loop
- Large visual rewrites that do not improve activation or repeat usage
