# MemoryOS Backend

MemoryOS is a developer memory intelligence layer built on top of Mem0.

This backend focuses on long-term memory behavior for developer workflows:
- extracting memory candidates from user messages
- scoring and filtering useful memories
- merging overlapping memories
- evolving memories when stronger evidence appears
- reranking retrieved memories for relevance
- tracking timeline and revision history

## API Docs

- Full API reference: [docs/memory-api.md](./docs/memory-api.md)
- MCP HTTP reference: [docs/mcp-api.md](./docs/mcp-api.md)
- Design partner onboarding: [docs/design-partner-onboarding.md](./docs/design-partner-onboarding.md)
- Postman collection: [docs/postman/MemoryOS.postman_collection.json](./docs/postman/MemoryOS.postman_collection.json)

## What It Does

The current backend supports:
- `POST /api/memory/process`
- `POST /api/memory/retrieve`
- `POST /api/memory/handoff`
- `POST /api/memory/continue`
- `POST /api/memory/resume`
- `POST /api/memory/retrieve/debug`
- `GET /api/memory/explain`
- `GET /api/memory/list`
- `GET /api/memory/:memoryId`
- `PATCH /api/memory/:memoryId/status`
- `PATCH /api/memory/:memoryId/archive`
- `PATCH /api/memory/:memoryId/unarchive`
- `GET /api/memory/timeline`
- `GET /api/memory/revisions`
- `PATCH /api/memory/config/retrieval-weights`
- `GET /api/memory/system/health`
- `GET /api/memory/mvp/status`
- `GET /api/memory/retrieve/explain`
- `GET /api/memory/requests`
- `GET /api/memory/benchmark/report`
- `GET /api/mcp/tools`
- `POST /api/mcp/invoke`
- `GET /api/metrics`

Versioned compatibility endpoints are also available under:
- `/api/v1/health`
- `/api/v1/memory/*`

Core memory flow:

```text
message -> extract -> score -> merge/evolve -> save -> retrieve -> timeline/revisions
```

## Architecture

The codebase is split into three layers:

- `server/routes`, `server/schemas`
  Express route-first handlers + request validation
- `lib/memory`
  Memory intelligence logic such as extraction, scoring, merge, evolve, ranking, timeline, revisions, and recent memory persistence
- `lib/integrations`
  External service adapter for Mem0
- `lib/workflows`
  End-to-end ingestion orchestration

## Current Features

### Memory Processing
- rule-based developer memory extraction
- memory importance scoring
- merge detection for overlapping memories
- evolve detection for stronger follow-up evidence
- recent-memory persistence for immediate consistency

### Retrieval
- Mem0 search candidate fetch
- local recent-memory fallback
- reranking by:
  - semantic score
  - type relevance
  - importance
  - recency

### Transparency
- timeline events:
  - `memory_created`
  - `memory_merged`
  - `memory_evolved`
- revision history with field-level diffs

## Example

Input messages:

```text
I am learning transformers
I trained a transformer model
```

Behavior:
- first message creates a learning memory
- second message evolves the existing memory
- timeline records `memory_created` and `memory_evolved`
- revisions record the changed fields:
  - `content`
  - `summary`
  - `evidenceCount`

## Project Structure

```text
server/
  app.ts
  index.ts
  routes/
  schemas/

lib/
  integrations/
    mem0.ts
  memory/
    extractMemory.ts
    scoreMemory.ts
    mergeMemory.ts
    evolveMemory.ts
    retrieveRelevantMemory.ts
    timelineMemory.ts
    revisionMemory.ts
    recentMemoryStore.ts
    types.ts
  workflows/
    ingestGraph.ts

tests/
  memorye2e.test.ts
```

## Quickstart (Express + JWT)

1. Install and start:

```bash
bun install
bun run dev
```

2. Generate token:

```bash
bun run token -- u_demo_1
```

3. Seed memory:

```bash
curl -X POST "http://localhost:3001/api/memory/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "threadId": "t1",
    "message": "I am building MemoryOS"
  }'
```

4. Continue planning:

```bash
curl -X POST "http://localhost:3001/api/memory/continue" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "question": "what should I do next on MemoryOS?",
    "mode": "build_next",
    "topK": 5
  }'
```

5. Resume planning:

```bash
curl -X POST "http://localhost:3001/api/memory/resume" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "project": "MemoryOS",
    "question": "where did I leave off?",
    "topK": 5
  }'
```

6. Generate a handoff:

```bash
curl -X POST "http://localhost:3001/api/memory/handoff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "project": "MemoryOS",
    "question": "create a handoff for another developer",
    "topK": 5
  }'
```

7. (Optional) load live data in developer console:

```js
localStorage.setItem("memoryos.apiToken", "<JWT_TOKEN>");
```

Then open `/developer-console`.

## Local Development

Install dependencies:

```bash
bun install
```

Run the development server:

```bash
bun run dev
```

Run lint:

```bash
npm run lint
```

Run tests:

```bash
bun run test
```

## Prisma Setup

Prisma is configured for PostgreSQL.

1. Add `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/memoryos?schema=public"
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Sync schema to DB (safe for local/dev Docker DB):

```bash
npm run prisma:push
```

Optional:

```bash
npm run prisma:studio
```

Prisma schema location: `prisma/schema.prisma` (provider: `postgresql`).

## Docker Setup

Build and run with Docker Compose (Postgres + app):

```bash
docker compose up -d --build
```

Stop:

```bash
docker compose down
```

The compose stack exposes:
- API: `http://localhost:3001`
- Postgres: `localhost:5432`

Volumes:
- `memoryos_data` for app runtime files under `/app/data`
- `postgres_data` for PostgreSQL persistence

## Express API Run and cURL Examples

Start the Express API:

```bash
bun run dev
```

Default base URL:

```bash
http://localhost:3001
```

All memory endpoints require auth header:

```bash
-H "Authorization: Bearer <JWT_TOKEN>"
```

Health check:

```bash
curl -X GET "http://localhost:3001/api/health"
```

Process memory:

```bash
curl -X POST "http://localhost:3001/api/memory/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "threadId": "t1",
    "message": "I am learning transformers"
  }'
```

Retrieve memory:

```bash
curl -X POST "http://localhost:3001/api/memory/retrieve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "question": "what should I build next?"
  }'
```

Get timeline:

```bash
curl -X GET "http://localhost:3001/api/memory/timeline" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Get revisions (all for user):

```bash
curl -X GET "http://localhost:3001/api/memory/revisions" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Get revisions by memory ID:

```bash
curl -X GET "http://localhost:3001/api/memory/revisions?memoryId=<MEMORY_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Explain one memory:

```bash
curl -X GET "http://localhost:3001/api/memory/explain?memoryId=<MEMORY_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Get request history:

```bash
curl -X GET "http://localhost:3001/api/memory/requests?limit=50&range=all" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Get benchmark report:

```bash
curl -X GET "http://localhost:3001/api/memory/benchmark/report" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Environment

Create `.env` with:

```env
MEM0_API_KEY=your_mem0_api_key
JWT_SECRET=your_long_random_secret
JWT_ISSUER=memoryos
JWT_AUDIENCE=memoryos-api
```

## Current Status

Implemented:
- backend memory processing flow
- retrieval flow
- timeline persistence
- revision persistence
- automated end-to-end workflow test

Production hardening included:
- runtime store backend switch (`MEMORY_STORE_BACKEND=json|sqlite`)
- Prisma + PostgreSQL setup for production data layer (`DATABASE_URL`)
- Prometheus metrics endpoint (`/api/metrics`)
- env validation at startup
- release workflow (`.github/workflows/release.yml`)
- perf smoke script (`bun run perf:smoke`)

## Test Coverage

Current automated test verifies:
- memory creation
- memory evolution
- retrieval
- timeline event creation
- revision diff recording

## Canopy 48-Hour Proof Pack

Use this checklist for your Ship-It submission:

1. Live demo (60-90 sec):
   - show `process -> retrieve -> resume -> handoff` in the developer console.
2. Benchmark proof:
   - run `bun run eval:benchmark`
   - attach `data/eval/benchmark-report.json`
3. Requests proof:
   - show `/api/memory/requests` populated in console Requests page.
4. Tester proof:
   - collect 5 notes (what they tried, what worked, what broke) and one-line quote each.
5. GitHub proof:
   - push clean commits + updated docs/README.
6. Public URL proof:
   - include backend + console URL screenshot in Ship-It.

Detailed runbook:
- [docs/canopy-48h-proof-pack.md](./docs/canopy-48h-proof-pack.md)
- [docs/canopy-tester-notes-template.md](./docs/canopy-tester-notes-template.md)
- [docs/canopy-public-beta-checklist.md](./docs/canopy-public-beta-checklist.md)

### 2-Minute Quickstart (Design Partner)

```bash
bun install
bun run dev
bun run token -- partner_demo_user
```

Use the generated token for the first 4 continuity calls:
- `POST /api/memory/process`
- `POST /api/memory/retrieve`
- `POST /api/memory/resume`
- `POST /api/memory/handoff`
