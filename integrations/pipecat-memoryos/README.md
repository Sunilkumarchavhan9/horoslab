# memoryosTM x Pipecat Integration (Production Baseline)

This package streams live transcript chunks from Pipecat into MemoryOS.

## What You Get

- Voice session lifecycle wiring:
  - `start` -> `POST /api/memory/voice/sessions/start`
  - `chunk` -> `POST /api/memory/voice/chunk`
  - `end` -> `POST /api/memory/voice/sessions/end`
- Reusable Python bridge (`memoryos_bridge.py`)
- Pipecat callback adapter (`pipecat_adapter.py`)
- End-to-end replay test script (`demo_replay.py`)

## 1) Prerequisites

- MemoryOS backend running on `http://localhost:3001`
- A valid JWT token (generated via `npm run token -- canopy_demo_user`)
- Python 3.11+
- `uv` installed

## 2) Setup

```bash
cd /mnt/d/projects/memoryos/memoryos-backend/integrations/pipecat-memoryos
cp .env.example .env
# edit .env and paste MEMORYOS_API_TOKEN
uv sync
```

## 3) Smoke Test (No Pipecat Runtime Needed)

```bash
uv run python pipecat_adapter.py
```

Expected output:
- `session started: ...`
- `session ended: ended`

## 4) Replay Demo Chunks

```bash
uv run python demo_replay.py
```

Expected output:
- chunk ingest counts
- session summary with chunkCount and totalCharacters

## 5) How to Wire Into Pipecat

Inside your transcript callback path:

```python
from memoryos_bridge import BridgeConfig, MemoryOSBridge
from pipecat_adapter import MemoryOSPipecatAdapter

config = BridgeConfig.from_env()
adapter = MemoryOSPipecatAdapter(bridge=MemoryOSBridge(config), chunk_interval_seconds=30)

await adapter.on_call_started()

# each transcript event
await adapter.on_transcript_text(
    text=transcript_text,
    speaker="user",
    sentiment="neutral",
    tags=["voice", "support"],
)

await adapter.on_call_ended(final_summary="Call complete with next steps.")
```

## Notes

- For production transport, prefer WebRTC (LiveKit/Daily) over raw WebSocket.
- Keep `session_id` stable for the call and map it to your app user identity.
- If you need stricter delivery guarantees, add an outbound retry queue around `ingest_chunk`.
