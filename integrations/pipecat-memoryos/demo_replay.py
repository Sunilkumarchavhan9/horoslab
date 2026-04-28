from __future__ import annotations

import asyncio
import uuid

from memoryos_bridge import BridgeConfig, MemoryOSBridge, MemoryOSBridgeError

DEMO_CHUNKS = [
    "User is building memoryosTM and wants live voice memory ingestion.",
    "They noticed context resets between calls and want persistent thread continuity.",
    "Next milestone is design-partner trials using Pipecat and MemoryOS APIs.",
]


async def main() -> None:
    config = BridgeConfig.from_env()
    bridge = MemoryOSBridge(config)

    session_id = f"pc-demo-{uuid.uuid4().hex[:8]}"
    thread_id = f"voice:{session_id}"

    print(f"starting session: {session_id}")
    await bridge.start_voice_session(session_id=session_id, thread_id=thread_id)

    for idx, chunk in enumerate(DEMO_CHUNKS):
        payload = await bridge.ingest_chunk(
            session_id=session_id,
            thread_id=thread_id,
            chunk_text=chunk,
            chunk_index=idx,
            speaker="user",
            sentiment="neutral",
            tags=["pipecat", "demo", "voice"],
        )
        accepted = payload.get("acceptedMemories", [])
        timeline = payload.get("timelineEvents", [])
        print(
            f"chunk {idx}: accepted={len(accepted)} timeline_events={len(timeline)}"
        )

    await bridge.end_voice_session(
        session_id=session_id,
        final_summary="Demo replay complete. Voice memory ingestion worked end to end.",
    )

    session = await bridge.get_voice_session(session_id=session_id)
    session_data = session.get("session", {})
    print(
        "session summary:",
        {
            "status": session_data.get("status"),
            "chunkCount": session_data.get("chunkCount"),
            "totalCharacters": session_data.get("totalCharacters"),
        },
    )

    try:
        memories = await bridge.list_memories(limit=5)
        print(f"recent memories fetched: {memories.get('count', 0)}")
    except MemoryOSBridgeError as error:
        print(f"warning: list_memories failed: {error}")


if __name__ == "__main__":
    asyncio.run(main())
