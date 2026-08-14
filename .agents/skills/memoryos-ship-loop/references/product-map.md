# MemoryOS Product Map

Use this reference when deciding what to ship next or when keeping a change aligned with the MemoryOS product thesis.

**Company Brain (canonical):** `docs/COMPANY_BRAIN_CORE_PRODUCT.md` — five pillars (ingest, structure, execute, continue, operate safely) and console section mapping in `memoryos-frontend/lib/company-brain.ts`.

## P0 Core Product

1. Company Brain ingestion
   - GitHub, local files, Slack, tickets, docs, and paid connectors only when enabled.
   - Sync logs must show memory contract counts and actionable failures.
2. Memory contract engine
   - Categories: decision, runbook, incident, preference, policy, blocker, bug, architecture_note, previous_attempt, model_tool_update, risky_file, next_action.
   - Every extracted candidate should keep contract version/category metadata when available.
3. Agent runtime hooks
   - SDK/MCP/API before and after model calls.
   - Runtime should capture used memory, generated action, and outcome.
4. Full traceability
   - Show memory used, why selected, confidence, source, and what changed.

## P0 AI Operating System Layer

1. Goal to action to outcome loop.
2. Drift detection: planned vs actual.
3. Next-action suggestions.
4. KPI surface: resume speed, handoff failures, governance pass rate.

## P1 Dynamic Interfaces

1. CTO view: risk, governance, roadmap, adoption.
2. Engineer view: next task, bug context, risky files, IDE prompt.
3. Support view: customer memory, playbooks, incidents.
4. Same backend graph, role-specific UI.

## Wedge GTM

1. Start with Engineering Continuity Brain.
2. Replace manual handoff and fragmented context tools.
3. Land one team, then expand to support, ops, and compliance.

## Agent Ops Add-On

1. Setup Sprint, 2-6 weeks.
2. Scale Pack.
3. Managed MemoryOps.
4. Every service output must become reusable product capability.

## Guardrails

1. No custom one-off consulting logic without productization.
2. Product contract is primary; service accelerates adoption.
3. Keep one canonical onboarding playbook.

## Mission Control

Sidebar groups: Intelligence, Workspaces (Continuity Lab + Playground open in separate tabs), Developer, Organization.

Legacy labels (Command Center, Memories, Workflow OS, etc.) redirect via aliases — not separate nav items.

Product feel: operational, alive, live-data-only — not generic SaaS cards or fake metrics.
