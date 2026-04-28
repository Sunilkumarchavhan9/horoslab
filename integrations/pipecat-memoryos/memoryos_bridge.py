from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

import httpx
from dotenv import load_dotenv


class MemoryOSBridgeError(RuntimeError):
    """Raised when the MemoryOS API returns an error response."""


@dataclass(frozen=True)
class BridgeConfig:
    base_url: str
    api_token: str
    workspace: str
    project: str
    source: str = "pipecat"

    @staticmethod
    def from_env() -> "BridgeConfig":
        load_dotenv()

        base_url = os.getenv("MEMORYOS_BASE_URL", "http://localhost:3001").strip()
        api_token = os.getenv("MEMORYOS_API_TOKEN", "").strip()
        workspace = os.getenv("MEMORYOS_WORKSPACE", "memoryosTM").strip()
        project = os.getenv("MEMORYOS_PROJECT", "voice-continuity-demo").strip()
        source = os.getenv("MEMORYOS_SOURCE", "pipecat").strip() or "pipecat"

        if not api_token:
            raise MemoryOSBridgeError(
                "MEMORYOS_API_TOKEN is missing. Set it in .env or environment variables."
            )

        return BridgeConfig(
            base_url=base_url.rstrip("/"),
            api_token=api_token,
            workspace=workspace,
            project=project,
            source=source,
        )


class MemoryOSBridge:
    """Async HTTP bridge from Pipecat transcript events to MemoryOS voice endpoints."""

    def __init__(self, config: BridgeConfig, *, timeout_seconds: float = 15.0):
        self.config = config
        self.timeout = httpx.Timeout(timeout_seconds)

    def _url(self, path: str) -> str:
        if not path.startswith("/"):
            path = f"/{path}"
        return f"{self.config.base_url}{path}"

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.config.api_token}",
            "Content-Type": "application/json",
        }

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json_body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(
                method=method,
                url=self._url(path),
                headers=self._headers,
                json=json_body,
            )

        try:
            payload = response.json()
        except json.JSONDecodeError:
            payload = {"error": response.text}

        if response.status_code >= 400:
            error_message = "MemoryOS request failed"
            if isinstance(payload, dict):
                if isinstance(payload.get("error"), str):
                    error_message = payload["error"]
                elif isinstance(payload.get("message"), str):
                    error_message = payload["message"]

            raise MemoryOSBridgeError(
                f"{error_message} (status={response.status_code}, path={path})"
            )

        if not isinstance(payload, dict):
            raise MemoryOSBridgeError(
                f"Unexpected response payload for {path}: {type(payload).__name__}"
            )

        return payload

    async def start_voice_session(
        self,
        *,
        session_id: str,
        thread_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "sessionId": session_id,
            "source": self.config.source,
            "workspace": self.config.workspace,
            "project": self.config.project,
        }
        if thread_id:
            body["threadId"] = thread_id
        if metadata:
            body["metadata"] = metadata

        return await self._request(
            "POST",
            "/api/memory/voice/sessions/start",
            json_body=body,
        )

    async def ingest_chunk(
        self,
        *,
        session_id: str,
        chunk_text: str,
        chunk_index: int,
        speaker: str = "user",
        sentiment: str = "neutral",
        tags: list[str] | None = None,
        thread_id: str | None = None,
    ) -> dict[str, Any]:
        safe_speaker = speaker if speaker in {"user", "assistant", "system"} else "user"
        safe_sentiment = (
            sentiment
            if sentiment in {"positive", "neutral", "negative"}
            else "neutral"
        )

        body: dict[str, Any] = {
            "sessionId": session_id,
            "chunk": chunk_text,
            "chunkIndex": chunk_index,
            "speaker": safe_speaker,
            "sentiment": safe_sentiment,
            "tags": tags or [],
            "workspace": self.config.workspace,
            "project": self.config.project,
        }
        if thread_id:
            body["threadId"] = thread_id

        return await self._request(
            "POST",
            "/api/memory/voice/chunk",
            json_body=body,
        )

    async def end_voice_session(
        self,
        *,
        session_id: str,
        final_summary: str | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {"sessionId": session_id}
        if final_summary:
            body["finalSummary"] = final_summary

        return await self._request(
            "POST",
            "/api/memory/voice/sessions/end",
            json_body=body,
        )

    async def get_voice_session(self, *, session_id: str) -> dict[str, Any]:
        return await self._request(
            "GET",
            f"/api/memory/voice/sessions/{session_id}",
        )

    async def list_memories(self, *, limit: int = 20) -> dict[str, Any]:
        bounded_limit = max(1, min(200, limit))
        return await self._request(
            "GET",
            f"/api/memory/list?limit={bounded_limit}",
        )

    async def insights(self) -> dict[str, Any]:
        return await self._request("GET", "/api/memory/insights")
