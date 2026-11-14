"""Teacher Inference Engine for HOROS Model Teaching Infrastructure.

Provides async/batched querying of teacher models, deterministic response caching,
failure recovery, provenance tracking, rate limiting, and adapters for:
- DeterministicMockTeacher
- AdversarialMockTeacher
- ExternalRestApiTeacher (OpenAI, Gemini, Anthropic, and Generic REST APIs with secure env credentials)
"""

from __future__ import annotations

import concurrent.futures
import hashlib
import json
import os
import threading
import time
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import numpy as np

from teaching.registry import TeacherModelDescriptor, TeacherModelRegistry, TeacherProvider


@dataclass
class TeacherQueryPayload:
    """Standardized input contract for teacher model queries."""
    task_id: str
    query_type: str
    current_state: np.ndarray
    observation_history: Optional[np.ndarray] = None
    text_instruction: str = "Perform compliant manipulation towards task goal."
    target_horizon: int = 20
    seed: int = 42
    request_representations: bool = False

    def compute_payload_hash(self) -> str:
        """Computes deterministic SHA-256 hash of payload query contents."""
        hasher = hashlib.sha256()
        hasher.update(self.task_id.encode("utf-8"))
        hasher.update(self.query_type.encode("utf-8"))
        hasher.update(self.current_state.tobytes())
        if self.observation_history is not None:
            hasher.update(self.observation_history.tobytes())
        hasher.update(self.text_instruction.encode("utf-8"))
        hasher.update(str(self.target_horizon).encode("utf-8"))
        hasher.update(str(self.seed).encode("utf-8"))
        hasher.update(str(self.request_representations).encode("utf-8"))
        return hasher.hexdigest()


@dataclass
class TeacherInferenceResult:
    """Standardized output contract returned by teacher models."""
    model_id: str
    candidate_actions: np.ndarray  # Shape: (H, action_dim)
    predicted_states: Optional[np.ndarray] = None  # Shape: (H, state_dim)
    predicted_modes: Optional[np.ndarray] = None  # Shape: (H,)
    predicted_confidence: float = 1.0
    latent_representations: Optional[np.ndarray] = None  # Shape: (H, rep_dim) or (rep_dim,)
    provenance_hash: str = ""
    cached: bool = False
    latency_ms: float = 0.0
    token_usage: Dict[str, int] = field(default_factory=dict)


class BaseTeacherAdapter(ABC):
    """Abstract interface for model execution adapters."""

    def __init__(self, descriptor: TeacherModelDescriptor):
        self.descriptor = descriptor

    @abstractmethod
    def infer(self, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        """Executes inference on the underlying teacher model."""
        pass


class DeterministicMockTeacher(BaseTeacherAdapter):
    """Deterministic mock teacher generating smooth, physically plausible candidate actions."""

    def infer(self, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        start_t = time.perf_counter()
        rng = np.random.RandomState(payload.seed)
        action_dim = 5 if payload.task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift") else 6
        H = payload.target_horizon

        # Generate smooth, bounded velocity actions
        base_t = np.linspace(0, 1, H)
        actions = np.zeros((H, action_dim), dtype=np.float32)

        if payload.task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift"):
            # Compliant Prelift action format: [squeeze_0, squeeze_1, squeeze_2, squeeze_3, arm_dz_mm]
            # Initial engagement steps to reach ~10-12 N clamping force (approx 0.7 mm indentation)
            for t in range(H):
                if t == 0:
                    actions[t, :4] = 0.70  # Rapid initial touch
                    actions[t, 4] = 0.00
                elif t == 1:
                    actions[t, :4] = 0.10  # Fine clamp adjustment
                    actions[t, 4] = 0.00
                else:
                    # Hold clamp (zero additional squeeze) and execute smooth micro-lift
                    actions[t, :4] = 0.00
                    actions[t, 4] = 0.03 + 0.01 * np.sin(np.pi * (t / H))  # 0.03-0.04 mm/step = 3-4 mm/s
        else:
            # Peg in hole: [dx, dy, dz, droll, dpitch, dyaw]
            actions[:, 0] = 0.05 * np.cos(np.pi * base_t)
            actions[:, 1] = 0.05 * np.sin(np.pi * base_t)
            actions[:, 2] = -0.50  # Steady downward insertion increment
            actions[:, 3:] = 0.0

        representations = None
        if payload.request_representations and self.descriptor.has_representations:
            rep_dim = self.descriptor.representation_dim or 128
            representations = rng.normal(0, 1, (H, rep_dim)).astype(np.float32)
            representations /= np.linalg.norm(representations, axis=-1, keepdims=True) + 1e-8

        latency_ms = (time.perf_counter() - start_t) * 1000.0
        prov_hash = hashlib.sha256(
            f"{self.descriptor.model_id}:{payload.compute_payload_hash()}:{actions.tobytes()}".encode("utf-8")
        ).hexdigest()

        return TeacherInferenceResult(
            model_id=self.descriptor.model_id,
            candidate_actions=actions,
            predicted_confidence=0.92,
            latent_representations=representations,
            provenance_hash=prov_hash,
            cached=False,
            latency_ms=latency_ms,
            token_usage={"prompt_tokens": 120, "completion_tokens": 80},
        )


class AdversarialMockTeacher(BaseTeacherAdapter):
    """Adversarial mock teacher intentionally generating stress-test trajectories."""

    def __init__(self, descriptor: TeacherModelDescriptor, fault_mode: str = "kinematic_overflow"):
        super().__init__(descriptor)
        self.fault_mode = fault_mode
        self.call_count = 0

    def infer(self, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        self.call_count += 1
        action_dim = 5 if payload.task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift") else 6
        H = payload.target_horizon
        actions = np.zeros((H, action_dim), dtype=np.float32)

        if self.fault_mode == "kinematic_overflow":
            # Command 2.50 mm/step at dt=0.01s -> 0.25 m/s > 0.10 m/s limit
            actions[:, 4 if action_dim == 5 else 2] = 2.50
        elif self.fault_mode == "friction_cone_violation":
            # Very small squeeze with aggressive lift
            actions[:, :4] = 0.05
            actions[:, 4] = 1.50
        elif self.fault_mode == "timeout_error":
            if self.call_count <= 1:
                raise TimeoutError("Teacher server simulated timeout on attempt 1.")
            actions[:, 0] = 0.01
        elif self.fault_mode == "corrupted_output":
            actions[H // 2, 0] = np.nan
        else:
            actions[:, 0] = 0.01

        prov_hash = hashlib.sha256(f"adv:{payload.compute_payload_hash()}:{self.fault_mode}".encode("utf-8")).hexdigest()
        return TeacherInferenceResult(
            model_id=self.descriptor.model_id,
            candidate_actions=actions,
            predicted_confidence=0.10,
            provenance_hash=prov_hash,
            cached=False,
            latency_ms=5.0,
        )


class ExternalRestApiTeacher(BaseTeacherAdapter):
    """Production provider adapter for external commercial REST API teacher models (OpenAI, Gemini, Anthropic, Generic).

    Key Security & Operational Guarantees:
    - Zero Credential Persistence: API keys are read strictly from environment variables at execution time.
    - Schema Validation: Validates incoming request structure and outgoing trajectory format.
    - Rate Limiting: Enforces requests-per-minute (RPM) ceilings and tracks token consumption.
    - Timeout & Exponential Backoff: Handles HTTP 429 / 5xx transient failures gracefully.
    """

    def __init__(
        self,
        descriptor: TeacherModelDescriptor,
        endpoint_url: str = "https://api.openai.com/v1/chat/completions",
        api_key_env_var: str = "OPENAI_API_KEY",
        provider_format: str = "openai",
        timeout_seconds: float = 30.0,
        rate_limit_rpm: int = 60,
        custom_headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(descriptor)
        self.endpoint_url = endpoint_url
        self.api_key_env_var = api_key_env_var
        self.provider_format = provider_format.lower()
        self.timeout_seconds = timeout_seconds
        self.rate_limit_rpm = rate_limit_rpm
        self.custom_headers = custom_headers or {}

        # Usage & telemetry tracking (thread-safe)
        self.total_requests = 0
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.cumulative_latency_ms = 0.0
        self._last_request_time = 0.0
        self._rate_limit_lock = threading.Lock()
        self._telemetry_lock = threading.Lock()

    def _get_api_key(self) -> str:
        """Securely retrieves API key from environment variable; never logged or saved to disk."""
        key = os.environ.get(self.api_key_env_var, "").strip()
        if not key:
            # If mock endpoint is targeted in tests, allow dummy key
            if self.endpoint_url.startswith(("mock://", "test://", "http://127.0.0.1", "http://localhost")):
                return "mock_test_token"
            raise ValueError(
                f"Missing API credential: Environment variable '{self.api_key_env_var}' is not set. "
                "Set the required environment variable before invoking external teacher models."
            )
        return key

    def get_request_headers(self, api_key: str) -> Dict[str, str]:
        """Builds provider-specific authentication and content headers."""
        headers = {"Content-Type": "application/json"}
        if self.provider_format == "anthropic":
            headers["x-api-key"] = api_key
            headers["anthropic-version"] = "2023-06-01"
        elif self.provider_format == "gemini":
            headers["x-goog-api-key"] = api_key
        else:  # openai, generic
            headers["Authorization"] = f"Bearer {api_key}"
        headers.update(self.custom_headers)
        return headers

    def _enforce_rate_limit(self) -> None:
        """Thread-safely enforces rate limit pacing between consecutive outbound HTTP queries."""
        if self.rate_limit_rpm <= 0:
            return
        min_interval = 60.0 / self.rate_limit_rpm
        with self._rate_limit_lock:
            now = time.time()
            elapsed = now - self._last_request_time
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
            self._last_request_time = time.time()

    def format_request_payload(self, payload: TeacherQueryPayload) -> Dict[str, Any]:
        """Converts standardized TeacherQueryPayload into provider-compliant JSON body."""
        state_summary = [round(float(x), 4) for x in payload.current_state.flatten()[:12]]
        action_dim = 5 if payload.task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift") else 6

        prompt_text = (
            f"You are a robotic physical manipulation teacher for task '{payload.task_id}'.\n"
            f"Current state vector (first 12 dims): {state_summary}\n"
            f"Target horizon: {payload.target_horizon} steps. Action dimension: {action_dim}.\n"
            f"Instruction: {payload.text_instruction}\n"
            f"Respond with a valid JSON array of {payload.target_horizon} action vectors, each of size {action_dim}."
        )

        if self.provider_format in ("openai", "generic"):
            return {
                "model": self.descriptor.model_id,
                "messages": [
                    {"role": "system", "content": "You are a precision robotics world model teacher."},
                    {"role": "user", "content": prompt_text},
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            }
        elif self.provider_format == "gemini":
            return {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
            }
        elif self.provider_format == "anthropic":
            return {
                "model": self.descriptor.model_id,
                "max_tokens": 1024,
                "system": "You are a precision robotics world model teacher.",
                "messages": [{"role": "user", "content": prompt_text}],
            }
        else:
            return {"task": payload.task_id, "prompt": prompt_text, "horizon": payload.target_horizon}

    def validate_and_parse_response(
        self, response_data: Dict[str, Any], payload: TeacherQueryPayload
    ) -> Tuple[np.ndarray, Dict[str, int]]:
        """Strictly validates response JSON schema, ensuring valid shape and bounded numerical actions."""
        action_dim = 5 if payload.task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift") else 6
        H = payload.target_horizon
        usage = {"prompt_tokens": 0, "completion_tokens": 0}

        actions_list = None

        # 1. Anthropic Messages API format: content blocks [{"type": "text", "text": "..."}]
        if "content" in response_data and isinstance(response_data["content"], list):
            text_blocks = []
            for block in response_data["content"]:
                if isinstance(block, dict) and block.get("type") == "text":
                    text_blocks.append(block.get("text", ""))
            combined_text = "\n".join(text_blocks).strip()
            parsed_content = json.loads(combined_text)
            actions_list = parsed_content.get("actions", parsed_content)
            if "usage" in response_data:
                usage["prompt_tokens"] = response_data["usage"].get("input_tokens", 0)
                usage["completion_tokens"] = response_data["usage"].get("output_tokens", 0)

        # 2. OpenAI Chat Completions API format: choices[0].message.content
        elif "choices" in response_data:
            content_str = response_data["choices"][0]["message"]["content"]
            parsed_content = json.loads(content_str)
            actions_list = parsed_content.get("actions", parsed_content)
            if "usage" in response_data:
                usage["prompt_tokens"] = response_data["usage"].get("prompt_tokens", 0)
                usage["completion_tokens"] = response_data["usage"].get("completion_tokens", 0)

        # 3. Gemini API format: candidates[0].content.parts[0].text
        elif "candidates" in response_data:
            part_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
            parsed_content = json.loads(part_text)
            actions_list = parsed_content.get("actions", parsed_content)
            if "usageMetadata" in response_data:
                usage["prompt_tokens"] = response_data["usageMetadata"].get("promptTokenCount", 0)
                usage["completion_tokens"] = response_data["usageMetadata"].get("candidatesTokenCount", 0)

        # 4. Generic dictionary or list payload
        elif "actions" in response_data:
            actions_list = response_data["actions"]
        elif isinstance(response_data, list):
            actions_list = response_data

        if not isinstance(actions_list, (list, np.ndarray)):
            raise ValueError(f"Teacher response does not contain a valid action list: {response_data}")

        actions = np.asarray(actions_list, dtype=np.float32)
        if actions.shape != (H, action_dim):
            raise ValueError(
                f"Teacher returned actions with shape {actions.shape}, but expected ({H}, {action_dim})."
            )

        if np.any(np.isnan(actions)) or np.any(np.isinf(actions)):
            raise ValueError("Teacher returned NaN or Inf values in candidate action trajectory.")

        # Clip excessive numerical outliers to physical actuator bounds
        actions = np.clip(actions, -10.0, 10.0)
        return actions, usage

    def infer(self, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        start_t = time.perf_counter()
        api_key = self._get_api_key()
        self._enforce_rate_limit()

        action_dim = 5 if payload.task_id in ("compliant_prelift", "compliant_lift", "multifinger_lift") else 6
        H = payload.target_horizon

        # Handle mock endpoint execution for tests and offline validation
        if self.endpoint_url.startswith(("mock://", "test://")):
            rng = np.random.RandomState(payload.seed)
            mock_actions = np.zeros((H, action_dim), dtype=np.float32)
            if action_dim == 5:
                mock_actions[:, :4] = 1.0
                mock_actions[:, 4] = 0.05
            else:
                mock_actions[:, 2] = -0.5
            prov_hash = hashlib.sha256(f"external_mock:{payload.compute_payload_hash()}".encode("utf-8")).hexdigest()
            latency = (time.perf_counter() - start_t) * 1000.0
            return TeacherInferenceResult(
                model_id=self.descriptor.model_id,
                candidate_actions=mock_actions,
                predicted_confidence=0.90,
                provenance_hash=prov_hash,
                cached=False,
                latency_ms=latency,
                token_usage={"prompt_tokens": 150, "completion_tokens": 75},
            )

        # Real outbound HTTP query execution
        body = json.dumps(self.format_request_payload(payload)).encode("utf-8")
        headers = self.get_request_headers(api_key)

        req = urllib.request.Request(self.endpoint_url, data=body, headers=headers, method="POST")
        try:
            if "127.0.0.1" in self.endpoint_url or "localhost" in self.endpoint_url:
                opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
                resp_ctx = opener.open(req, timeout=self.timeout_seconds)
            else:
                resp_ctx = urllib.request.urlopen(req, timeout=self.timeout_seconds)
            with resp_ctx as resp:
                resp_bytes = resp.read()
                resp_json = json.loads(resp_bytes.decode("utf-8"))
        except urllib.error.HTTPError as http_err:
            raise RuntimeError(
                f"External teacher HTTP {http_err.code} error: {http_err.reason}"
            ) from http_err
        except urllib.error.URLError as url_err:
            raise RuntimeError(f"External teacher connection failure: {url_err.reason}") from url_err

        actions, usage_dict = self.validate_and_parse_response(resp_json, payload)
        latency = (time.perf_counter() - start_t) * 1000.0

        # Update telemetry thread-safely
        with self._telemetry_lock:
            self.total_requests += 1
            self.total_prompt_tokens += usage_dict["prompt_tokens"]
            self.total_completion_tokens += usage_dict["completion_tokens"]
            self.cumulative_latency_ms += latency

        prov_hash = hashlib.sha256(
            f"{self.descriptor.model_id}:{payload.compute_payload_hash()}:{actions.tobytes()}".encode("utf-8")
        ).hexdigest()

        return TeacherInferenceResult(
            model_id=self.descriptor.model_id,
            candidate_actions=actions,
            predicted_confidence=0.88,
            provenance_hash=prov_hash,
            cached=False,
            latency_ms=latency,
            token_usage=usage_dict,
        )


class TeacherInferenceEngine:
    """Manages teacher adapter registration, deterministic disk caching, retries, and async batched execution."""

    def __init__(
        self,
        registry: TeacherModelRegistry,
        cache_dir: Optional[str] = None,
        max_retries: int = 2,
        backoff_factor: float = 0.10,
        max_concurrency: int = 4,
    ):
        self.registry = registry
        self.cache_dir = Path(cache_dir) if cache_dir else None
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.max_concurrency = max_concurrency
        self._adapters: Dict[str, BaseTeacherAdapter] = {}

        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)

    def register_adapter(self, model_id: str, adapter: BaseTeacherAdapter) -> None:
        """Binds an execution adapter to a registered model ID."""
        if not self.registry.has(model_id):
            raise KeyError(f"Cannot bind adapter: Model '{model_id}' is not in the TeacherModelRegistry.")
        self._adapters[model_id] = adapter

    def query(self, model_id: str, payload: TeacherQueryPayload) -> TeacherInferenceResult:
        """Executes a single query with disk cache check and exponential backoff retry."""
        if model_id not in self._adapters:
            raise KeyError(f"No adapter registered for model '{model_id}'.")

        adapter = self._adapters[model_id]

        # 1. Check disk cache
        cache_path = self._get_cache_path(model_id, payload)
        if cache_path and cache_path.exists():
            cached_res = self._load_cache(cache_path)
            if cached_res is not None:
                return cached_res

        # 2. Execute with retry
        last_exception = None
        for attempt in range(self.max_retries + 1):
            try:
                res = adapter.infer(payload)
                if cache_path:
                    self._save_cache(cache_path, res)
                return res
            except Exception as exc:
                last_exception = exc
                if attempt < self.max_retries:
                    time.sleep(self.backoff_factor * (2 ** attempt))

        raise RuntimeError(
            f"Teacher inference failed for model '{model_id}' after {self.max_retries + 1} attempts: {last_exception}"
        ) from last_exception

    def query_batch(
        self, model_id: str, payloads: List[TeacherQueryPayload], max_workers: Optional[int] = None
    ) -> List[TeacherInferenceResult]:
        """Executes a batch of queries concurrently across worker threads."""
        workers = max_workers or self.max_concurrency
        if len(payloads) <= 1 or workers <= 1:
            return [self.query(model_id, p) for p in payloads]

        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
            future_to_idx = {executor.submit(self.query, model_id, p): i for i, p in enumerate(payloads)}
            results: List[Optional[TeacherInferenceResult]] = [None] * len(payloads)
            for future in concurrent.futures.as_completed(future_to_idx):
                idx = future_to_idx[future]
                results[idx] = future.result()

        return [r for r in results if r is not None]

    def _get_cache_path(self, model_id: str, payload: TeacherQueryPayload) -> Optional[Path]:
        if not self.cache_dir:
            return None
        payload_hash = payload.compute_payload_hash()
        cache_key = hashlib.sha256(f"{model_id}:{payload_hash}".encode("utf-8")).hexdigest()
        return self.cache_dir / f"{cache_key}.npz"

    def _load_cache(self, path: Path) -> Optional[TeacherInferenceResult]:
        try:
            data = np.load(path, allow_pickle=True)
            rep = data["latent_representations"] if "latent_representations" in data.files else None
            if rep is not None and (not hasattr(rep, "shape") or rep.shape == ()):
                rep = None
            usage_dict = json.loads(str(data["token_usage_json"])) if "token_usage_json" in data.files else {}
            return TeacherInferenceResult(
                model_id=str(data["model_id"]),
                candidate_actions=data["candidate_actions"],
                predicted_states=data["predicted_states"] if "predicted_states" in data.files else None,
                predicted_modes=data["predicted_modes"] if "predicted_modes" in data.files else None,
                predicted_confidence=float(data["predicted_confidence"]),
                latent_representations=rep,
                provenance_hash=str(data["provenance_hash"]),
                cached=True,
                latency_ms=0.1,
                token_usage=usage_dict,
            )
        except Exception:
            return None

    def _save_cache(self, path: Path, result: TeacherInferenceResult) -> None:
        try:
            kwargs: Dict[str, Any] = {
                "model_id": result.model_id,
                "candidate_actions": result.candidate_actions,
                "predicted_confidence": result.predicted_confidence,
                "provenance_hash": result.provenance_hash,
                "token_usage_json": json.dumps(result.token_usage),
            }
            if result.predicted_states is not None:
                kwargs["predicted_states"] = result.predicted_states
            if result.predicted_modes is not None:
                kwargs["predicted_modes"] = result.predicted_modes
            if result.latent_representations is not None:
                kwargs["latent_representations"] = result.latent_representations
            np.savez_compressed(path, **kwargs)
        except Exception:
            pass
