# Canopy 48-Hour Proof Pack (MemoryOS)

Deadline target: Saturday 12:00 AM (cohort timezone).

## Goal

Ship one working beta proof (not full SaaS) that shows:
- continuity loop works end-to-end
- quality is measurable
- real users touched the product

## Required Artifacts

1. Live demo video (60-90 sec) — https://www.youtube.com/watch?v=hM9znjbe_DY
2. Benchmark artifact (`data/eval/benchmark-report.json`)
3. Requests proof (real API calls in Requests page)
4. 5 tester feedback notes (+ one-line quotes)
5. GitHub proof (clean commit sequence + repo link)
6. Public live URL proof (backend + console URL)

## Exact Run Sequence

1. Start backend:

```bash
bun install
bun run dev
```

2. Generate token:

```bash
bun run token -- canopy_demo_user
```

3. Seed and run continuity flow:

```bash
curl -X POST "http://localhost:3001/api/memory/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"threadId":"t-canopy-1","message":"I am building MemoryOS and finishing continuity proof for Canopy."}'

curl -X POST "http://localhost:3001/api/memory/retrieve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"question":"what should I ship next?","topK":5}'

curl -X POST "http://localhost:3001/api/memory/resume" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"project":"MemoryOS","question":"where did I leave off?","topK":5}'

curl -X POST "http://localhost:3001/api/memory/handoff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"project":"MemoryOS","question":"create handoff for another developer","topK":5}'
```

4. Run benchmark:

```bash
bun run eval:benchmark
```

5. Load live console:

```js
localStorage.setItem("memoryos.apiToken", "<JWT_TOKEN>");
```

Open developer console and capture:
- Requests page with live rows
- Benchmarks page with latest report values

## 2-Minute Quickstart (copy/paste)

Use this block for design partners:

```bash
# 1) start server
bun install
bun run dev

# 2) create token
bun run token -- partner_demo_user

# 3) set token and run first 4 calls
TOKEN="<JWT_TOKEN>"
BASE="http://localhost:3001"

curl -X POST "$BASE/api/memory/process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"threadId":"partner-1","message":"I am building MemoryOS and validating continuity this week."}'

curl -X POST "$BASE/api/memory/retrieve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question":"what should I work on next?","topK":5}'

curl -X POST "$BASE/api/memory/resume" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"project":"MemoryOS","question":"where did I leave off?","topK":5}'

curl -X POST "$BASE/api/memory/handoff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"project":"MemoryOS","question":"create handoff for next developer","topK":5}'
```

## High-Signal Extras

- Public beta checklist: [docs/canopy-public-beta-checklist.md](./canopy-public-beta-checklist.md)
- Tester notes template: [docs/canopy-tester-notes-template.md](./canopy-tester-notes-template.md)

## Demo Video Script (short)

1. Show one `process` call creating memory.
2. Show `retrieve` returns relevant memories.
3. Show `resume` outputs summary + open loops.
4. Show `handoff` output for next owner/agent.
5. Show Requests page and Benchmarks page with live data.

## Ship-It Message Template

```text
Shipped a live beta of MemoryOS continuity stack: process/retrieve/resume/handoff running end-to-end with real API-backed console pages (Projects, Memories, Handoffs, Requests, Benchmarks). Added request-history and benchmark-report surfaces for evidence. Attached benchmark report + demo + tester feedback.
```
