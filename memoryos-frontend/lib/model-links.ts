/**
 * Utility to resolve the official Hugging Face model page URL for any model.
 */

const HF_MODEL_OVERRIDE_MAP: Record<string, string> = {
  // NVIDIA Cosmos
  "nvidia/cosmos-1-vision-worldmodel": "https://huggingface.co/nvidia/Cosmos-1.0-Diffusion-7B-Video2World",
  "nvidia/cosmos-1.0-world": "https://huggingface.co/nvidia/Cosmos-1.0-Diffusion-7B-Video2World",
  "nvidia/cosmos-1.0-diffusion-7b-video2world": "https://huggingface.co/nvidia/Cosmos-1.0-Diffusion-7B-Video2World",
  "nvidia/cosmos-1.0-diffusion-7b-text2world": "https://huggingface.co/nvidia/Cosmos-1.0-Diffusion-7B-Text2World",
  "nvidia/cosmos-1.0-autoregressive-4b": "https://huggingface.co/nvidia/Cosmos-1.0-Autoregressive-4B",
  "nvidia/bionemo-openmm-8b": "https://huggingface.co/nvidia",
  "nvidia/nemo-legal-8b": "https://huggingface.co/nvidia",

  // Meta Llama
  "meta-llama/llama-4-maverick": "https://huggingface.co/meta-llama",
  "meta-llama/llama-4-scout": "https://huggingface.co/meta-llama",
  "meta-llama/llama-3.3-70b": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
  "meta-llama/llama-3.1-70b": "https://huggingface.co/meta-llama/Meta-Llama-3.1-70B-Instruct",
  "meta-llama/llama-3.1-8b": "https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct",
  "meta-llama/llama-3.2-3b": "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct",
  "meta-llama/llama-3.2-1b": "https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct",
  "meta-llama/llama-3.2-vision": "https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct",
  "meta-llama/llama-3.2-11b-devops": "https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct",
  "meta-llama/llama-3.2-11b-legal-instruct": "https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct",
  "meta/v-jepa-2-physical-world": "https://huggingface.co/facebook/vjepa-2-huge",
  "meta/esmfold-3-physics-verifier": "https://huggingface.co/facebook/esmfold_v1",
  "meta/moviegen-world": "https://huggingface.co/models?search=moviegen",

  // DeepSeek
  "deepseek-ai/deepseek-r1-spatial-reasoning": "https://huggingface.co/deepseek-ai/DeepSeek-R1",
  "deepseek-ai/deepseek-r1-distill-science": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
  "deepseek-ai/deepseek-r1-distill-legal": "https://huggingface.co/deepseek-ai/DeepSeek-R1",
  "deepseek-ai/deepseek-coder-v2-instruct": "https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Instruct",

  // Qwen
  "qwen/qwen-2.5-72b": "https://huggingface.co/Qwen/Qwen2.5-72B-Instruct",
  "qwen/qwen2.5-vl-72b-physical": "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct",
  "qwen/qwen2.5-vl-72b-video": "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct",
  "qwen/qwen2.5-14b-science": "https://huggingface.co/Qwen/Qwen2.5-14B-Instruct",
  "qwen/qwen2.5-14b-legal": "https://huggingface.co/Qwen/Qwen2.5-14B-Instruct",

  // Mistral
  "mistralai/pixtral-12b-physical": "https://huggingface.co/mistralai/Pixtral-12B-2409",
  "mistralai/mixtral-8x7b-science": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1",
  "mistralai/mixtral-8x7b-legal": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1",

  // Microsoft
  "microsoft/phi-3.5-vision-spatial": "https://huggingface.co/microsoft/Phi-3.5-vision-instruct",
  "microsoft/phi-3.5-science-instruct": "https://huggingface.co/microsoft/Phi-3.5-mini-instruct",

  // Google
  "google/rt-2-vision-language-action": "https://huggingface.co/google",
  "google/alphafold-3-physics-instruct": "https://huggingface.co/models?search=alphafold",
  "google/lumiere-video": "https://huggingface.co/models?search=lumiere",
  "deepmind/robocat-v1": "https://huggingface.co/google",

  // Robotics & Autonomous
  "tesla/fsd-perception-v12": "https://huggingface.co/models?search=autonomous+driving",
  "tesla/optimus-brain-v2": "https://huggingface.co/models?search=humanoid+robotics",
  "tesla/fsd-v12-world": "https://huggingface.co/models?search=autonomous+driving",
  "onex/humanoid-perception-8b": "https://huggingface.co/models?search=humanoid+robotics",
  "1x-tech/neo-brain": "https://huggingface.co/models?search=humanoid+robotics",
  "wayveai/gaia-1": "https://huggingface.co/wayveai",

  // Video & Generative
  "openai/sora-1-worldmodel": "https://huggingface.co/models?search=sora",
  "openai/sora-physics-preview": "https://huggingface.co/models?search=sora",
  "runwayml/gen-3-alpha": "https://huggingface.co/models?search=runwayml",
  "runwayml/gen-3-world": "https://huggingface.co/models?search=runwayml",
  "kuaishou/kling-video-1.5": "https://huggingface.co/models?search=kling",
  "lumaai/dream-machine": "https://huggingface.co/models?search=luma",

  // DevOps / Specialized
  "kubernetes/k8s-sre-agent": "https://huggingface.co/models?search=kubernetes",
  "datadog/auto-diagnostics-7b": "https://huggingface.co/models?search=devops+monitoring",
  "grafana/ebpf-tracer-v1": "https://huggingface.co/models?search=ebpf",
  "aws/cloudwatch-remediator": "https://huggingface.co/models?search=cloudwatch",
  "hashicorp/terraform-healer": "https://huggingface.co/models?search=terraform",
  "prometheus/alert-reasoner": "https://huggingface.co/models?search=prometheus",

  // Legal / Enterprise
  "openai/gpt-4o-legal-verifier": "https://huggingface.co/openai",
  "harvey-ai/harvey-contract-reasoner": "https://huggingface.co/models?search=legal",
  "thomson-reuters/westlaw-reasoner-7b": "https://huggingface.co/models?search=legal",
  "google/legal-palmyra-32b": "https://huggingface.co/models?search=legal",
  "anthropic/claude-3-5-sonnet": "https://huggingface.co/models?search=claude",
  "genesis-embodied/genesis": "https://huggingface.co/models?search=genesis+embodied",
  "materials-project/graphnet-materials-32b": "https://huggingface.co/models?search=materials+project",
  "openfold/openfold-2-cuda": "https://huggingface.co/models?search=openfold",
  // Voice & Audio
  "nvidia/phonellm-alpha-1": "https://huggingface.co/pipecat-ai/phonellm-alpha-1",
  "pipecat/phonellm-alpha-1": "https://huggingface.co/pipecat-ai/phonellm-alpha-1",
  "pipecat-ai/phonellm-alpha-1": "https://huggingface.co/pipecat-ai/phonellm-alpha-1",
  "nvidia/nemotron-3-nano-omni": "https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16",
  "nvidia/nemotronlabs-voicechat": "https://huggingface.co/nvidia/NVIDIA-NemotronLabs-VoiceChat-11B",
  "qwen/qwen3-omni": "https://huggingface.co/Qwen/Qwen3-Omni-30B-A3B-Instruct",
  "mistral/voxtral-realtime": "https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602",
  "mistralai/voxtral-realtime": "https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602",
  "mistralai/voxtral-mini-4b-realtime": "https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602",
  "qwen/qwen3-tts": "https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-Base",
  "mistral/voxtral-tts": "https://huggingface.co/mistralai/Voxtral-4B-TTS-2603",
  "mistralai/voxtral-tts": "https://huggingface.co/mistralai/Voxtral-4B-TTS-2603",
  "mistralai/voxtral-4b-tts": "https://huggingface.co/mistralai/Voxtral-4B-TTS-2603",
  "bosonai/higgs-audio-v3": "https://huggingface.co/bosonai/higgs-tts-3-4b",
  "nvidia/parakeet-tdt-v3": "https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3",
};

export function getModelHfUrl(model: {
  id?: string;
  name?: string;
  author?: string;
  url?: string;
  hfUrl?: string;
  link?: string;
}): string {
  if (model.link) return model.link;
  if (model.hfUrl) return model.hfUrl;
  if (model.url) return model.url;

  const rawId = (model.id || "").trim();
  if (!rawId) {
    if (model.name) {
      return `https://huggingface.co/models?search=${encodeURIComponent(model.name)}`;
    }
    return "https://huggingface.co/models";
  }

  // Already a full URL
  if (rawId.startsWith("http://") || rawId.startsWith("https://")) {
    return rawId;
  }

  const normalized = rawId.toLowerCase();
  if (HF_MODEL_OVERRIDE_MAP[normalized]) {
    return HF_MODEL_OVERRIDE_MAP[normalized];
  }

  // Name or ID contains Cosmos-1
  const nameLower = (model.name || "").toLowerCase();
  if (normalized.includes("cosmos-1") || normalized.includes("cosmos 1") || nameLower.includes("cosmos-1") || nameLower.includes("cosmos 1")) {
    return "https://huggingface.co/nvidia/Cosmos-1.0-Diffusion-7B-Video2World";
  }

  // Name or ID contains Llama-3.2-3B
  if (normalized.includes("llama-3.2-3b") || nameLower.includes("llama-3.2-3b")) {
    return "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct";
  }

  // For models with organization/model format (e.g., meta-llama/Llama-3.2-3B-Instruct)
  if (rawId.includes("/")) {
    return `https://huggingface.co/${rawId}`;
  }

  // Default fallback search
  return `https://huggingface.co/models?search=${encodeURIComponent(rawId)}`;
}
