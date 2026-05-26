# MemoryOS IDE (desktop)

Downloadable **MemoryOS IDE** is a Tauri shell around the same Continuity Lab workbench used in the browser. Company Brain stays on **MemoryOS Cloud APIs** — the desktop app does not embed memory logic locally.

## Architecture

```text
memoryos-ide/          ← Tauri (Rust): local folder, read/write files
memoryos-frontend/     ← Same React UI: Agent Window + Editor + Review
server/                ← Memory API, connectors, agents
```

## Quick start

1. Start backend + frontend:

```bash
cd memoryos-frontend
npm run dev:all
```

2. Install and run the IDE:

```bash
cd memoryos-ide
npm install
npm run dev
```

3. In the IDE window: **Open folder** → edit files → **Save to disk** in Review. Agent column loads **Project plan** from `/api/memory/resume/brief`.

## Environment

| Variable | Purpose |
|----------|---------|
| `MEMORYOS_WEB_URL` | Override dev URL (default `http://localhost:3000`) |

## Roadmap

- Integrated terminal, git UI, LSP
- Optional offline brief cache
- Installer signing + auto-update
