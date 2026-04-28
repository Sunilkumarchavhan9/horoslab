# Week-2 5-Minute SDK Integration

Goal: onboard a design partner live in one short session and prove MemoryOS continuity on real data.

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
