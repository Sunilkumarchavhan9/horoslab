# Pipecat x MemoryOS Integration Guide

This guide shows how to stream live transcript chunks from Pipecat into MemoryOS so memories form during the call, not after.

## Why This Integration Matters

- Voice sessions produce richer context than typed chat.
- Streaming ingest reduces memory lag during active calls.
- Live graph updates create a strong demo moment for design partners.
- Pipecat unlocks Daily/LiveKit/Twilio builder workflows.

## Current Ingestion Path

Before this integration, MemoryOS only had generic ingest (`POST /api/memory/process`) and no first-class voice session model.

Now we add:

- `POST /api/memory/voice/sessions/start`
- `POST /api/memory/voice/chunk`
- `GET /api/memory/voice/sessions/:sessionId`
- `POST /api/memory/voice/sessions/end`

## Recommended Runtime Pattern

1. Start a MemoryOS voice session when Pipecat call starts.
2. Send transcript chunks every ~30 seconds (or every N utterances).
3. End the session when call ends; optionally send a final summary.
4. Query timeline/retrieve/resume to power live context + graph UI.

## Ready-to-Run Integration Package

Production baseline files are available at:

`integrations/pipecat-memoryos/`

Run locally:

```bash
cd integrations/pipecat-memoryos
cp .env.example .env
# paste MEMORYOS_API_TOKEN in .env
uv sync
uv run python pipecat_adapter.py
```

## Quick API Flow

### 1) Start Session

```bash
curl -X POST "http://localhost:3001/api/memory/voice/sessions/start" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "pc-session-001",
    "source": "pipecat",
    "workspace": "support-team",
    "project": "voice-assistant"
  }'
```

### 2) Stream Chunks

```bash
curl -X POST "http://localhost:3001/api/memory/voice/chunk" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "pc-session-001",
    "chunkIndex": 1,
    "speaker": "user",
    "chunk": "I am debugging audio latency in our support bot.",
    "tags": ["latency", "support"],
    "sentiment": "neutral"
  }'
```

### 3) End Session

```bash
curl -X POST "http://localhost:3001/api/memory/voice/sessions/end" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "pc-session-001",
    "finalSummary": "We identified packet jitter and agreed to add monitoring."
  }'
```

## Pipecat Adapter Pseudocode

```python
class MemoryProcessor:
    def __init__(self, memoryos_client, session_id):
        self.client = memoryos_client
        self.session_id = session_id

    async def on_transcript_chunk(self, text, idx):
        await self.client.voice_chunk(
            sessionId=self.session_id,
            chunk=text,
            chunkIndex=idx,
            speaker="user",
        )
```

## Product Improvements You Get

- Better memory recall from conversational detail.
- Higher handoff quality after calls.
- Live context panel updates while a call is active.
- Cleaner continuity across repeated support/sales sessions via session IDs.

## Week-2 KPI Suggestions

- Voice session ingest success rate (`>= 99%`).
- Median chunk-to-memory latency (`< 2s`).
- Memories created per 10-minute call.
- Resume quality improvement for voice-heavy users.
