# MemoryOS Backend

MemoryOS is a developer memory intelligence layer built on top of Mem0.

This backend focuses on long-term memory behavior for developer workflows:
- extracting memory candidates from user messages
- scoring and filtering useful memories
- merging overlapping memories
- evolving memories when stronger evidence appears
- reranking retrieved memories for relevance
- tracking timeline and revision history

## What It Does

The current backend supports:
- `POST /api/memory/process`
- `POST /api/memory/retrieve`
- `GET /api/memory/timeline`
- `GET /api/memory/revisions`

Core memory flow:

```text
message -> extract -> score -> merge/evolve -> save -> retrieve -> timeline/revisions
```

## Architecture

The codebase is split into four layers:

- `app/api`
  HTTP routes for process, retrieve, timeline, and revisions
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
app/
  api/
    memory/
      process/
      retrieve/
      timeline/
      revisions/

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
-H "x-user-id: u_demo_1"
```

Health check:

```bash
curl -X GET "http://localhost:3001/api/health"
```

Process memory:

```bash
curl -X POST "http://localhost:3001/api/memory/process" \
  -H "Content-Type: application/json" \
  -H "x-user-id: u_demo_1" \
  -d '{
    "threadId": "t1",
    "message": "I am learning transformers"
  }'
```

Retrieve memory:

```bash
curl -X POST "http://localhost:3001/api/memory/retrieve" \
  -H "Content-Type: application/json" \
  -H "x-user-id: u_demo_1" \
  -d '{
    "question": "what should I build next?"
  }'
```

Get timeline:

```bash
curl -X GET "http://localhost:3001/api/memory/timeline" \
  -H "x-user-id: u_demo_1"
```

Get revisions (all for user):

```bash
curl -X GET "http://localhost:3001/api/memory/revisions" \
  -H "x-user-id: u_demo_1"
```

Get revisions by memory ID:

```bash
curl -X GET "http://localhost:3001/api/memory/revisions?memoryId=<MEMORY_ID>" \
  -H "x-user-id: u_demo_1"
```

Explain one memory:

```bash
curl -X GET "http://localhost:3001/api/memory/explain?memoryId=<MEMORY_ID>" \
  -H "x-user-id: u_demo_1"
```

## Environment

Create `.env` with:

```env
MEM0_API_KEY=your_mem0_api_key
```

## Current Status

Implemented:
- backend memory processing flow
- retrieval flow
- timeline persistence
- revision persistence
- automated end-to-end workflow test

Not yet implemented:
- LangGraph-based workflow orchestration
- richer developer-specific memory taxonomy
- production-grade persistent database layer

## Test Coverage

Current automated test verifies:
- memory creation
- memory evolution
- retrieval
- timeline event creation
- revision diff recording
