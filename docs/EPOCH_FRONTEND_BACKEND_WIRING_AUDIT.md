# Epoch Frontend → Backend Wiring Audit

## Scope

This audit records the existing frontend surface before backend completion. The
existing UI is preserved; this document identifies the backend contract each
surface needs.

## Entry routes

| Route | Role | Current state |
| --- | --- | --- |
| `/inference` | Compact Epoch inference control plane shown in the supplied screenshot | Uses the Epoch adapter and live API polling; owns the home, programs, models, runs, deployments, registry, evidence, and settings views. |
| `/mission-control` | Full operational console | Resolves an authenticated workspace, then renders the Epoch control plane and its mission/operator surfaces. |
| `/agent-sessions/[id]` | Agent session inspection | Needs session, event, tool-call, checkpoint, and verification APIs. |
| Auth and policy pages | Identity and account entry | Kept outside the Epoch runtime build except for workspace/org resolution. |

## Existing Epoch console navigation

The compact console currently exposes:

- Home / intent launcher and recent sessions
- Programs / optimization programs and pipeline workspace
- Models / catalog and model detail
- Runs / simulation, benchmark, and execution run detail
- Deployments / deployment state and rollback
- Registry / artifacts and model/runtime records
- Evidence / claims, measurements, and proof references
- Settings / keys, layout, and runtime preferences

The supplied visual direction is retained: compact navigation, command-first
home, model/runtime/target selectors, dense operational data, and a single
pipeline workspace.

## Full runtime workspaces

The repository also contains reusable workspaces for:

- Missions: overview, planner, active execution, queue, automation, timeline,
  history, and templates.
- Discovery and reality: sources, world/reality graph, entities, impact,
  decisions, query, stream, and API watcher.
- AI execution: providers, models, workers, routing, GPU, costs, failovers,
  provider health, and capability matrix.
- Execution: planner, workers, validation, approvals, runtime, timeline, and
  evidence.
- Observation: runtime, timeline, analytics, and performance.
- Evidence: artifacts, claims, decisions, and logs.
- Verification: runs, outcomes, assurance, certificates, challenges, and graph.
- Governance: policies, authority, roles, budgets, approvals, recovery, and
  audit ledger.
- Settlement: outcomes, certificates, memory preflight, learning handoff,
  audit, and settlement results.
- Agents, institutions, onboarding, developer tooling, and integrations.

## Backend contract order

Backend implementation follows the product dependency chain:

`workspace/org → mission/outcome → world state → unknowns/hypotheses →
capabilities/models/runtimes/hardware → candidates → simulations/sandbox/
benchmarks → decision → policy/authority → workers/execution → observations/
evidence → verification/certificate → settlement/experience/rediscovery`.

Each layer must have persistent state, scoped authorization, events, idempotent
mutations, and contract tests before the next layer is wired to UI.

## Current wiring risks

1. The compact console uses an adapter that normalizes several backend response
   shapes into legacy `Program`, `Run`, `Model`, and `Deployment` UI types.
2. The full runtime contains mock/demo data in a limited number of governance,
   recovery, and developer views. These must be replaced only after their live
   endpoints are proven; the visual layout does not need to change.
3. Realtime events exist in the backend surface, but the frontend still relies
   heavily on polling. Realtime invalidation is a later wiring step after the
   backend event contract is stable.
4. Workspace organization scope must be present for production acceptance and
   cross-tenant isolation.

## Wiring rule

Do not rewrite the frontend. Add typed API/query adapters, replace mock data at
the data boundary, preserve the existing components, and change visual layout
only where a live backend state cannot be represented honestly.
