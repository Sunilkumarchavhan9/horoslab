# MemoryOS MCP API

MemoryOS exposes MCP in two ways:

- `@memoryostm/mcp` on npm for any MCP-compatible agent runtime
- HTTP endpoints under `/api/mcp/*` for hosted platforms and custom bridges

## Published MCP package

Install or run the stdio MCP server with:

```bash
npx -y @memoryostm/mcp
```

Package page:

```text
https://www.npmjs.com/package/@memoryostm/mcp
```

The stdio server waits silently for an MCP client. No terminal output is normal when it starts successfully.

Example agent config:

```json
{
  "mcpServers": {
    "memoryos": {
      "command": "npx",
      "args": ["-y", "@memoryostm/mcp"],
      "env": {
        "MEMORYOS_API_KEY": "YOUR_MEMORYOS_TOKEN",
        "MEMORYOS_BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

For local development inside this repo, run:

```bash
npm run mcp:stdio
```

See `packages/mcp-server/README.md` for configuration.

## HTTP MCP API

Base URL:

```text
http://localhost:3001
```

Versioned base:

```text
http://localhost:3001/api/v1/mcp
```

Auth:
- All `/api/mcp/*` endpoints require:
  - `Authorization: Bearer <JWT_TOKEN>`

## List tools

### `GET /api/mcp/tools`

Response `200`:

```json
{
  "ok": true,
  "data": {
    "tools": [
      {
        "name": "memory.before_model",
        "description": "Retrieve continuity context before a model call."
      },
      {
        "name": "memory.after_model",
        "description": "Persist memory context after a model or user turn."
      },
      {
        "name": "memory.handoff",
        "description": "Generate a handoff package for another human or agent."
      }
    ]
  },
  "meta": {
    "requestId": "req_123",
    "latencyMs": 3
  }
}
```

## Invoke a tool

### `POST /api/mcp/invoke`

Body:

```json
{
  "name": "memory.before_model",
  "input": {
    "question": "what should I build next?",
    "project": "MemoryOS"
  }
}
```

The API injects `userId` from the bearer token. Clients do not need to send it.

`memory.after_model` accepts either:
- `message` (optionally with `modelResponse`)
- or a structured `contract` payload (optionally with `enforceContract`)

Contract-only example:

```json
{
  "name": "memory.after_model",
  "input": {
    "threadId": "thread-contract-1",
    "enforceContract": true,
    "contract": {
      "goal": "Ship MCP contract support",
      "decisions": ["Use memory.after_model as the MCP ingest contract path"],
      "next_actions": ["Add contract-only MCP tests"]
    }
  }
}
```

Response `200`:

```json
{
  "ok": true,
  "data": {
    "name": "memory.before_model",
    "result": {
      "contextText": "1. [project] User is building MemoryOS",
      "memories": [],
      "source": "retrieve"
    }
  },
  "meta": {
    "requestId": "req_456",
    "latencyMs": 5
  }
}
```

Unknown tool `404`:

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Unknown memory tool: memory.unknown"
  },
  "meta": {
    "requestId": "req_789",
    "latencyMs": 2
  }
}
```

Invalid payload `400`:

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid memory tool input",
    "details": {}
  },
  "meta": {
    "requestId": "req_999",
    "latencyMs": 1
  }
}
```

## Example flow

1. Call `GET /api/mcp/tools`
2. Pick `memory.before_model` before an agent/model turn
3. Call `memory.after_model` after the turn completes
4. Call `memory.handoff` when another human or agent is taking over
