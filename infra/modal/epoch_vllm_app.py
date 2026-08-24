"""Epoch's optional Modal GPU runtime.

Deploy with: modal deploy infra/modal/epoch_vllm_app.py
The deployed URL is an OpenAI-compatible vLLM endpoint.
"""

import os
import subprocess

import modal


APP_NAME = os.getenv("EPOCH_MODAL_APP_NAME", "epoch-vllm")
# H3 is MiniMax's image/text-to-video model. Use the smaller official text
# checkpoint for this OpenAI-compatible chat/reasoning runtime.
MODEL_ID = os.getenv("EPOCH_MODAL_MODEL", "MiniMaxAI/SynLogic-7B")
GPU = os.getenv("EPOCH_MODAL_GPU", "L4")
VLLM_VERSION = os.getenv("EPOCH_MODAL_VLLM_VERSION", "0.12.0")
VLLM_PORT = 8000
MAX_INPUTS = int(os.getenv("EPOCH_MODAL_MAX_INPUTS", "16"))

app = modal.App(APP_NAME)

vllm_image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        f"vllm=={VLLM_VERSION}",
        extra_index_url="https://download.pytorch.org/whl/cu128",
        extra_options="--index-strategy unsafe-best-match",
    )
)
hf_cache = modal.Volume.from_name("epoch-hf-cache", create_if_missing=True)


@app.function(
    image=vllm_image,
    gpu=GPU,
    volumes={"/root/.cache/huggingface": hf_cache},
    scaledown_window=15 * 60,
    timeout=30 * 60,
)
@modal.concurrent(max_inputs=MAX_INPUTS)
@modal.web_server(port=VLLM_PORT, startup_timeout=30 * 60)
def serve():
    subprocess.Popen([
        "vllm", "serve", MODEL_ID,
        "--host", "0.0.0.0", "--port", str(VLLM_PORT),
        "--served-model-name", MODEL_ID,
    ])
