# `@memoryostm/sdk`

MemoryOS TypeScript SDK for continuity infrastructure in agentic products.

Use the SDK to turn model turns into structured memory contracts and inject continuity context before execution.

## Why teams use it

- Build a company brain for agents, not a chat-memory patch
- Persist structured memory contracts after each turn
- Inject context before model runs with inspectable behavior
- Keep continuity portable across SDK, MCP, and HTTP flows

## Install

```bash
npm i @memoryostm/sdk
```

## Quickstart

```ts
import { createMemoryOSClient } from "@memoryostm/sdk";

const memory = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY!,
  baseUrl: "https://api.memoryostm.dev",
});

const pre = await memory.beforeModel({
  userId: "u_123",
  question: "What should I build next?",
  project: "memoryos",
});

await memory.afterModel({
  userId: "u_123",
  threadId: "thread-1",
  contract: {
    goal: "Ship MCP contract support",
    decisions: ["Use contract-only ingest path in afterModel"],
    next_actions: ["Add MCP + SDK contract tests"],
  },
  enforceContract: true,
});
```

## APIs

- `beforeModel(input)` for retrieval/resume context injection
- `afterModel(input)` for message or contract ingest
- `resume(input)` for project continuity summaries
- `handoff(input)` for human/agent handoff packages

## Notes

- `afterModel` requires a non-empty `message` or a `contract`
- `afterModel` returns `contractFieldCount` when contract fields are present
- `afterModel` returns backend `traceId` for per-run tracing
- `afterModel` returns `governanceApplied` with effective mode, TTL, redaction, and pinning
