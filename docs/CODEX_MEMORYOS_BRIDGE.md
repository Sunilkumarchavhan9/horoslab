# Codex + MemoryOS Bridge

MemoryOS connects to Codex through the supported Codex MCP and CLI surfaces.

This bridge does not scrape private Codex chat storage. Codex receives MemoryOS inheritance before acting, and MemoryOS records the outcome after Codex finishes.

If a Codex session does not expose the MCP tools, MemoryOS still provides a direct HTTP fallback through:

- `POST /api/memory/memoryignition/brief`
- `POST /api/memory/memoryignition/outcome`
- `npm run codex:memoryos:save-outcome -- --payload-file <json>`

## What It Enables

```text
MemoryOS Company Brain
  -> MemoryIgnition brief
  -> Codex MCP tools / codex exec wrapper
  -> Codex acts with inherited context
  -> MemoryOS saves outcome learning
```

## Install MCP For This Repo

Set a MemoryOS token in your shell:

```powershell
$env:MEMORYOS_API_TOKEN = "<memoryos bearer token>"
$env:MEMORYOS_BASE_URL = "http://localhost:3011"
```

Write project-scoped Codex MCP config:

```powershell
npm run codex:mcp:install
```

This creates or updates:

```text
.codex/config.toml
.codex/skills/memoryignition/SKILL.md
```

Restart Codex app, Codex IDE extension, or open `/mcp` in Codex CLI to verify the `memoryos` MCP server.

The project-scoped `memoryignition` skill tells Codex to:

1. call `memoryignition_get_brief` before acting
2. respect risky files, approval rules, required tests, approved skills, and trace proof
3. call `memoryignition_search_memory` when more company context is needed
4. call `memoryignition_save_outcome` after work
5. call `memoryignition_create_handoff` when another agent or human should continue

## Codex MCP Tools

```text
memoryignition_get_brief
memoryignition_search_memory
memoryignition_save_outcome
memoryignition_create_handoff
```

Backward-compatible tools remain available:

```text
memory.before_model
memory.after_model
memory.handoff
```

## Run Codex With A MemoryOS Brief

```powershell
npm run codex:memoryos -- --task "Review Phase 1 connectors and fix the smallest issue"
```

The wrapper:

1. calls `memoryignition_get_brief`
2. passes the brief into `codex exec`
3. captures Codex output
4. calls `memoryignition_save_outcome`

If the MCP layer is unavailable, the wrapper falls back to the direct MemoryIgnition API routes above so the outcome still gets recorded.

## Product Boundary

This is the production-safe bridge for Codex:

```text
MCP + Codex skill + CLI wrapper + outcome learning
```

Do not claim MemoryOS can read all Codex chats through OAuth. For full session history, use export upload or the local live watcher until an official Codex session-history API exists.
