# Week-2 5-Minute SDK Integration

Goal: onboard a design partner live in one short session and prove MemoryOS continuity on real data.

## 0) Pre-Week-2 Product Readiness Gate

Before moving into Week-2 partner onboarding, MemoryOS must feel polished on live data.

Required proof:

- Developer console loads real memories, insights, timeline, requests, and benchmark data.
- Playground runs `process -> retrieve -> resume -> handoff` against the live backend.
- API key create/revoke works for a signed-in developer.
- SDK quickstart runs without type or lint errors.
- `npm run test`, `npm run lint`, and frontend `npm run build` pass.
- `npm run eval:benchmark` produces `data/eval/benchmark-report.json`.
- `/api/memory/requests` shows real rows from the latest demo flow.
- `/api/memory/benchmark/report` returns the latest benchmark JSON.
- Docker demos seed `best-config.json`, `baseline-report.json`, `benchmark-cases.json`, and `benchmark-report.json` into the mounted `/app/data/eval` volume.

Do not expand Week-2/Week-3 feature scope until this gate is green.

## 1) Install SDK in a fresh project

```bash
npm install @memoryostm/sdk
```

## 2) Set environment variables

```bash
export MEMORYOS_BASE_URL=http://localhost:3001
export MEMORYOS_API_KEY=<your_memoryos_bearer_token>
```

## 3) Run the quickstart

Use `packages/sdk/examples/node-quickstart.ts` as the minimal baseline.

## 4) LangGraph-oriented example

Use:

`packages/sdk/examples/langgraph-continuity.ts`

For an agent handoff example, use:

`packages/sdk/examples/agent-handoff.ts`

This wires MemoryOS directly into graph nodes:
- `loadContinuity` via `beforeModel(...)`
- `persistTurn` via `afterModel(...)`

## 5) One-command partner demo

From `memoryos-backend`:

```bash
./scripts/design-partner-5min.sh <token>
```

What it executes:
1. `GET /api/health`
2. `POST /api/memory/process`
3. `POST /api/memory/retrieve`
4. `POST /api/memory/resume`
5. `POST /api/memory/handoff`

Success signal for Week-2:
- partner sees non-empty retrieve/resume/handoff responses
- partner confirms continuity quality and missing fields

## Week-2 Focus

Use live partner sessions to validate whether MemoryOS actually helps people resume work.

Track:

- resume success rate
- top-3 retrieval precision
- wrong merge rate
- p95 retrieve latency
- successful SDK setup count

Every bad retrieval, wrong merge, missing context, or confusing onboarding step should become either a benchmark case, test, or console polish fix.

## Week-3 Focus

Use Week-2 failures to build the trust layer:

- entity-aware merge/evolve for repo, framework, project, feature, and bug class
- contradiction lifecycle: `active`, `stale`, `contradicted`, `archived`
- better `why retrieved` and `why not retrieved` diagnostics
- score contribution breakdown and evidence lineage
- benchmark regression gate in CI
