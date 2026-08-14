# @epochtm/v12-mcp

Official MCP stdio server for governed Epoch V12 runtime operations.

This package lets an MCP-compatible host inspect missions and workers, create missions, and retrieve deterministic evidence bundles through the Epoch API.

## Install

```bash
npm install -g @epochtm/v12-mcp
pnpm add -g @epochtm/v12-mcp
bun add -g @epochtm/v12-mcp
```

## Configure

Set the runtime URL and a workspace-scoped API key in the MCP process environment:

```bash
EPOCH_V12_API_URL=http://localhost:3011
EPOCH_V12_API_KEY=your-workspace-scoped-key
```

The server communicates over JSON-RPC on stdin/stdout. Logs must be kept off stdout because stdout is the MCP protocol channel.

## MCP host configuration

Example configuration:

```json
{
  "mcpServers": {
    "epoch-v12": {
      "command": "epoch-v12-mcp",
      "env": {
        "EPOCH_V12_API_URL": "http://localhost:3011",
        "EPOCH_V12_API_KEY": "${EPOCH_V12_API_KEY}"
      }
    }
  }
}
```

## Tools

- `epoch_v12.list_missions`: list missions visible in a workspace.
- `epoch_v12.create_mission`: create a governed mission with objective, plan, and acceptance criteria.
- `epoch_v12.list_workers`: list workers visible in a workspace.
- `epoch_v12.get_evidence_bundle`: retrieve the deterministic evidence bundle for a mission.
- `epoch_v12.enqueue_mission`: enqueue a mission for governed worker execution.
- `epoch_v12.record_evidence`: record worker evidence for a mission.
- `epoch_v12.verify_mission`: run deterministic verification with evidence and approval inputs.

Every tool requires a `workspaceId`. Mission creation also requires `institutionId`, `title`, and `objective`.

## Security

Use a workspace-scoped API key and grant only the operations required by the MCP host. The server does not bypass Epoch authorization, workspace isolation, mission state transitions, evidence verification, or worker fencing.

## Scope

This server exposes only the new V12 namespace. It does not import or expose the legacy MCP package, onboarding, GitHub setup, dashboard, Account, or Organization UI flows.

## Development

```bash
npm run build
node dist/stdio.js
```
