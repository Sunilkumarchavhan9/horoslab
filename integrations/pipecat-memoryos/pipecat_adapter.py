from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field

from memoryos_bridge import BridgeConfig, MemoryOSBridge


@dataclass
class MemoryOSPipecatAdapter:
    """Attach this adapter to your transcript callback path in Pipecat.

    Expected lifecycle:
    1) await on_call_started()
    2) await on_transcript_text(...) for each transcript chunk/window
    3) await on_call_ended(...)
    """

    bridge: MemoryOSBridge
    chunk_interval_seconds: int = 30
    session_id: str = field(default_factory=lambda: f"pc-{uuid.uuid4().hex[:10]}")
    thread_id: str = field(init=False)
    _chunk_index: int = 0
    _last_flush_at: float = field(default_factory=time.time)

    def __post_init__(self) -> None:
        self.thread_id = f"voice:{self.session_id}"

    async def on_call_started(self) -> dict:
        return await self.bridge.start_voice_session(
            session_id=self.session_id,
            thread_id=self.thread_id,
            metadata={"integration": "pipecat", "mode": "streaming"},
        )

    async def on_transcript_text(
        self,
        text: str,
        *,
        speaker: str = "user",
        sentiment: str = "neutral",
        tags: list[str] | None = None,
        force_flush: bool = False,
    ) -> dict | None:
        cleaned = text.strip()
        if not cleaned:
            return None

        now = time.time()
        due = (now - self._last_flush_at) >= self.chunk_interval_seconds
        if not (force_flush or due):
            return None

        response = await self.bridge.ingest_chunk(
            session_id=self.session_id,
            chunk_text=cleaned,
            chunk_index=self._chunk_index,
            speaker=speaker,
            sentiment=sentiment,
            tags=tags,
            thread_id=self.thread_id,
        )

        self._chunk_index += 1
        self._last_flush_at = now
        return response

    async def on_call_ended(self, final_summary: str | None = None) -> dict:
        return await self.bridge.end_voice_session(
            session_id=self.session_id,
            final_summary=final_summary,
        )


async def quick_smoke_test() -> None:
    config = BridgeConfig.from_env()
    adapter = MemoryOSPipecatAdapter(
        bridge=MemoryOSBridge(config),
        chunk_interval_seconds=1,
    )

    started = await adapter.on_call_started()
    print("session started:", started.get("session", {}).get("sessionId"))

    await adapter.on_transcript_text(
        "User is testing memoryosTM Pipecat streaming integration.",
        speaker="user",
        tags=["smoke-test", "pipecat"],
        force_flush=True,
    )

    await adapter.on_transcript_text(
        "They need reliable memory continuity during voice calls.",
        speaker="user",
        tags=["continuity", "voice"],
        force_flush=True,
    )

    ended = await adapter.on_call_ended(
        final_summary="Smoke test complete with two streamed chunks."
    )
    print("session ended:", ended.get("session", {}).get("status"))


if __name__ == "__main__":
    asyncio.run(quick_smoke_test())
