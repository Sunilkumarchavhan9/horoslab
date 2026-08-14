# Company Brain Completion Backlog (P0 / P1 / P2)

## Objective
Complete MemoryOS Company Brain in a sequenced way:
- P0 = sellable reliability + core wedge completion
- P1 = team expansion + governance maturity
- P2 = full AI Operating System layer

MemoryOS shipping principle:
- Core product ships before service packaging.
- Engineering Continuity Brain is the wedge.
- Every service output must become a reusable product capability.
- Product contract is primary; service work only accelerates adoption.

---

## P0 - Must Ship First (Revenue-Critical)

### P0.1 Canonical memory contract schema (versioned)
- Outcome: one strict contract taxonomy used by all ingestion and continuity flows.
- Deliverables:
  - Define `memoryos.contract.v1` and canonical categories:
    - decision, runbook, incident, preference, policy
    - blocker, bug, architecture_note, previous_attempt, model_tool_update, risky_file, next_action
  - Validate at API boundary and normalize extracted memory into this schema.
  - Preserve contract category in memory metadata for traceability, KPIs, and role-specific UI.
- Primary files:
  - `server/schemas/memory.schema.ts`
  - `lib/memory/extractMemory.ts`
  - `lib/memory/types.ts`
  - `lib/workflows/ingestShared.ts`
  - `server/routes/memory.routes.ts`

### P0.2 Company Brain ingestion wedge
- Outcome: every new team can get value with GitHub/docs first, then expand to team systems.
- Deliverables:
  - GitHub + local docs are the default Engineering Continuity Brain path.
  - Slack, Notion, tickets, and docs all normalize into `memoryos.contract.v1`.
  - Show first sync state: last sync, extracted memories, failures, contract categories.
  - Persist connector-level contract counts so ingestion proves value by category, not only raw records.
  - Expand the connector ladder in priority order instead of adding random integrations:
    - GitHub
    - Slack
    - Jira
    - Linear
    - Cursor / VS Code / Windsurf chat imports
    - docs and local files
    - Sentry
    - CI/CD logs
    - Vercel / cloud logs
    - Zendesk
    - email
    - meetings
- Primary files:
  - `memoryos-frontend/components/mission-control/sections/connectors-section.tsx`
  - `server/routes/connector.routes.ts`
  - `lib/integrations/github.ts`
  - `lib/integrations/localFiles.ts`
  - `lib/integrations/connectorManager.ts`
  - `lib/companyBrain/platform.ts`

### P0.3 Continue Project brief (single output contract)
- Outcome: one-click “Continue Project” output with stable shape.
- Required fields:
  - what_changed_recently
  - current_goal
  - key_decisions
  - open_blockers
  - risky_files  
  - next_best_action
  - must_know_context_for_agent
- Implementation notes:
  - Resume planner owns one canonical brief object.
  - `/resume`, `/resume/brief`, and `/resume/prompt` must reuse the same brief.
  - Brief extraction should prefer `memoryos.contract.v1` categories, then fall back to text signals.
- Primary files:
  - `lib/memory/resumePlanner.ts`
  - `lib/workflows/resumeGraphLangGraph.ts`
  - `server/routes/memory.routes.ts`

### P0.4 IDE prompt generation endpoint (Cursor/Codex/Claude Code)
- Outcome: explicit endpoint and UI action for agent-ready prompt generation.
- Deliverables:
  - New endpoint returning prompt variants:
    - `cursor_prompt`, `codex_prompt`, `claude_code_prompt`
  - Include risky files + hard constraints (“do not edit” guardrails).
- Implementation notes:
  - `/resume/prompt` now returns a MemoryOS Continue Contract with:
    - current goal, recent changes, decisions, blockers, risky files, context, next action
    - hard guardrails for minimal safe edits, no secret/env/generated-file edits, and no invented state
    - required output format for files changed, validation, trace usage, and natural next step
  - Prompt variants include tool-specific execution mode guidance for Cursor, Codex, and Claude Code.
  - Playground trace evidence displays `contractCategory` when the selected memory has a contract type.
- Primary files:
  - `server/routes/memory.routes.ts`
  - `lib/memory/resumePlanner.ts`
  - `memoryos-frontend/components/mission-control/sections/playground-section.tsx`
  - `memoryos-frontend/components/mission-control/sections/run-demo-section.tsx`

### P0.5 Unified trace proof panel
- Outcome: trustable explanation of memory usage for each continuity run.
- Required trace fields:
  - memory used
  - source
  - confidence
  - why selected
  - what changed after action
  - contract category
- Implementation notes:
  - `/resume/prompt` now returns `traceProof` with run type, memory used count, average confidence, contract categories, summary, and what changed after action.
  - Playground renders a Trace Proof panel above raw evidence rows so users see the trust summary first.
  - Evidence rows keep source, confidence, why selected, and contract category when available.
- Primary files:
  - `lib/memory/retrieveRelevantMemory.ts`
  - `server/routes/memory.routes.ts`
  - `memoryos-frontend/components/mission-control/sections/context-inspector-section.tsx`
  - `memoryos-frontend/components/mission-control/sections/flight-recorder-section.tsx`

### P0.6 Production reliability for limits and metering
- Outcome: enforceable quota/rate controls in multi-instance deployments.
- Deliverables:
  - Redis-backed rate limiting enabled in production.
  - Metered endpoint retry safety (no double-burn).
  - Env-tunable rate policies per route group.
- Primary files:
  - `server/middleware/rateLimit.ts`
  - `server/app.ts`
  - `memoryos-frontend/app/api/memory/[...memoryPath]/route.ts`
  - `lib/billing/store.ts`

---

## P1 - Scale Team Adoption (After P0)

### P1.1 Slack + Notion quality pass
- Outcome: parity with GitHub for continuity-relevant extraction quality.
- Deliverables:
  - Better mapping to canonical contract categories.
  - Improved dedupe and confidence scoring.
- Primary files:
  - `lib/integrations/slack.ts`
  - `lib/integrations/notion.ts`
  - `lib/integrations/connectorManager.ts`

### P1.2 Role-specific views (same graph, different lens)
- Outcome: complete role views for Engineer/CTO/Support without backend forks.
- Deliverables:
  - Engineer: next task, blockers, risky files, prompt action
  - CTO: risk, governance, roadmap drift
  - Support: playbooks, customer memory, incident context
- Primary files:
  - `memoryos-frontend/components/mission-control/sections/overview-section.tsx`
  - `memoryos-frontend/components/mission-control/console-experience.tsx`
  - `memoryos-frontend/components/mission-control/sections/*`

### P1.3 Governance maturity
- Outcome: enterprise-trustable controls without losing product focus.
- Deliverables:
  - Policy templates
  - Approval workflow hardening
  - Audit export consistency
- Primary files:
  - `server/routes/memory.routes.ts`
  - `memoryos-frontend/components/mission-control/sections/governance-section.tsx`

### P1.4 KPI surface (product health + user value)
- Outcome: measurable continuity outcomes visible in product.
- KPIs:
  - resume speed
  - handoff failure rate
  - governance pass rate
  - memory freshness
  - trace coverage
- Primary files:
  - `server/observability/metrics.ts`
  - `memoryos-frontend/components/mission-control/sections/overview-section.tsx`

---

## P2 - Complete Company Brain to AI Operating System

### P2.1 Goal -> Action -> Outcome loop
- Outcome: explicit closed-loop execution state machine.
- Primary files:
  - `lib/companyBrain/platform.ts`
  - `server/routes/companyBrain.routes.ts`

### P2.2 Drift detection (planned vs actual)
- Outcome: detect execution drift and propose corrective steps.
- Primary files:
  - `lib/memory/continuityPlanner.ts`
  - `lib/companyBrain/platform.ts`

### P2.3 Native Product Agents (formalized)
- Outcome: clearly-scoped product workers:
  - Memory Engineer Agent
  - Engineering Continuity Agent
  - AI IDE Context Agent
- Primary files:
  - `lib/memory/extractMemory.ts`
  - `lib/memory/resumePlanner.ts`
  - `lib/memory/MCP/memoryTools.ts`
  - `server/routes/agent.routes.ts`
  - `server/routes/agent-session.routes.ts`

### P2.4 Organization-wide memory graph and retention controls
- Outcome: Company Brain ready for multi-team memory governance at scale.
- Primary files:
  - `lib/companyBrain/platform.ts`
  - `lib/storage/runtimeStoreDb.ts`
  - `prisma/schema.prisma`

---

## Milestone Exit Criteria

### Exit P0
- New user flow: connect GitHub -> continue project -> generate prompt -> inspect trace (all working end-to-end).
- At least 10 design-partner team sessions complete this flow successfully.

### Exit P1
- Slack/Notion quality near GitHub baseline.
- KPI control plane used in weekly product reviews.

### Exit P2
- Company Brain + AI Operating loop operational across multiple roles.
- Clear evidence of reduced context-loss and faster resume/handoff cycles.

---

## Anti-Scope Guardrails
- No one-off custom logic without productization path.
- No enterprise detours before P0 wedge proves repeatable value.
- Keep one canonical onboarding playbook and one continuity contract standard.
- Services are product-first add-ons: Setup Sprint, Scale Pack, Managed MemoryOps.
