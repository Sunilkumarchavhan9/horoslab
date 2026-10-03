# `@epochtm/mcp`

Epoch MCP adapter for teams building institutional runtime tools for agents.

Use this package in any MCP-compatible runtime to add continuity infrastructure with structured memory contracts, inspectable context injection, and cross-agent portability.

## Why teams use it

- Continuity before every model run via `memory.before_model`
- Contract-aware ingest after each turn via `memory.after_model`
- Fast handoffs from truth, not chat history, via `memory.handoff`

## Tools

- `memory.before_model`
- `memory.after_model`
- `memory.handoff`

## Install and run

```bash
npx -y @epochtm/mcp
```

## Environment

```bash
EPOCH_API_KEY=<your_epoch_bearer_token>
EPOCH_BASE_URL=http://localhost:3001
```

For production, set `EPOCH_BASE_URL` to your deployed Epoch API URL.

## MCP client config

```json
{
  "mcpServers": {
    "epoch": {
      "command": "npx",
      "args": ["-y", "@epochtm/mcp"],
      "env": {
        "EPOCH_API_KEY": "<your_epoch_bearer_token>",
        "EPOCH_BASE_URL": "https://api.memoryostm.dev"
      }
    }
  }
}
```

## Contract-first `after_model` example

`memory.after_model` accepts either a `message` or a structured `contract`.

```json
{
  "name": "memory.after_model",
  "arguments": {
    "threadId": "thread-42",
    "enforceContract": true,
    "contract": {
      "goal": "Ship continuity benchmark mode",
      "decisions": ["Use A/B flows with memory vs without memory"],
      "next_actions": ["Implement benchmark scoring and trace outputs"]
    }
  }
}
```

## Local development

From the MemoryOS repo root:

```bash
npm run mcp:stdio
npm run mcp:build
npm run mcp:pack
```
