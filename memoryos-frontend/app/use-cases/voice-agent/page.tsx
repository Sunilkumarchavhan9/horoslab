"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { AIAssistantGrid } from "@/components/landing/ai-assistant-grid";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";
import { EcosystemGrid } from "@/components/landing/ecosystem-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { VoiceOrb } from "@/components/ui/voice-orb";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo , BosonAILogo, PipecatLogo} from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2 } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "System",
    runInfra: { title: "Compose the intelligence system", desc: "Combine models, data, context, tools, runtime, hardware, workload, and environment into one system definition." },
    closed: { title: "Provider-defined system", desc: "The provider determines the underlying models, runtime, infrastructure, and execution path." },
    diy: { title: "Compose it yourself", desc: "You integrate and maintain every layer of the voice stack." }
  },
  {
    num: "0 2",
    label: "Models",
    runInfra: { title: "Discover and evaluate models", desc: "Bring models from Hugging Face and supported sources, pin their revisions, check compatibility, and evaluate them as system candidates." },
    closed: { title: "Provider model catalog", desc: "Use the models and versions exposed through the API." },
    diy: { title: "Own the model layer", desc: "Select, integrate, serve, and maintain the models yourself." }
  },
  {
    num: "0 3",
    label: "Optimization",
    runInfra: { title: "Search the system space", desc: "Experiment across model variants, quantization, context, batching, routing, runtime, kernels, hardware, and placement." },
    closed: { title: "Provider optimization", desc: "Lower-level model and inference decisions are outside your control." },
    diy: { title: "Manual system search", desc: "Your team designs experiments and profiles every configuration." }
  },
  {
    num: "0 4",
    label: "Workload",
    runInfra: { title: "Learn the workload", desc: "Capture context length, concurrency, turn patterns, traffic distribution, batching behavior, utilization, failures, latency, and cost." },
    closed: { title: "Generic service workload", desc: "The provider decides how your traffic is handled internally." },
    diy: { title: "Build workload intelligence", desc: "You collect traces, construct replay datasets, benchmark, and maintain them yourself." }
  },
  {
    num: "0 5",
    label: "Verification",
    runInfra: { title: "Evidence-backed verification", desc: "Compare candidates against defined quality, latency, cost, reliability, and workload requirements before promotion." },
    closed: { title: "Service-level guarantees", desc: "You mainly depend on provider measurements and guarantees." },
    diy: { title: "Build your own proof", desc: "Your team owns benchmarks, experiments, evidence, and regression checks." }
  },
  {
    num: "0 6",
    label: "Deployment",
    runInfra: { title: "Deploy the verified system", desc: "Preserve the exact model, runtime, configuration, workload, deployment, provenance, and evidence behind the deployed version." },
    closed: { title: "Call the provider endpoint", desc: "Your production system remains dependent on the provider's execution environment." },
    diy: { title: "Operate the complete stack", desc: "You manage serving, GPUs, scaling, networking, upgrades, and failures." }
  },
  {
    num: "0 7",
    label: "Dynamic reality",
    runInfra: { title: "Decode live reality", desc: "Use real-time audio and other physical signals to build observations, state, events, relationships, and changing context around the voice system." },
    closed: { title: "Process the voice stream", desc: "The API handles speech while your application remains responsible for understanding the surrounding environment." },
    diy: { title: "Build the reality layer", desc: "You integrate audio, sensors, state estimation, environment data, and feedback yourself." }
  },
  {
    num: "0 8",
    label: "Teaching",
    runInfra: { title: "Teach from verified experience", desc: "Convert observations, outcomes, failures, lessons, and ground truth into evaluation data, teaching signals, model updates, policy updates, skill updates, or world-model training." },
    closed: { title: "Provider-owned learning", desc: "The provider controls how its models are trained and improved." },
    diy: { title: "Build the teaching loop", desc: "You collect experience, construct datasets, train, evaluate, and promote new versions yourself." }
  },
  {
    num: "0 9",
    label: "Security",
    runInfra: { title: "Identity, authority, and runtime enforcement", desc: "Give every agent and workload a verifiable identity. Evaluate mission, intent, permissions, target, environment, spend, and current world state before consequential actions. Isolate execution and continuously observe behavior." },
    closed: { title: "Provider security limits", desc: "The API manages basic access and rate limits, but application-level authority remains your responsibility." },
    diy: { title: "Build security enforcement", desc: "You must build and maintain all identity, isolation, enforcement, and monitoring systems yourself." }
  }
];


const OUTCOME_CODE = `import { IntentEngine, OutcomeContract } from "@horos/runtime"

export const RealTimeVoiceAgentOutcome = new OutcomeContract({
  name: "VoiceAgentPipeline",
  intent: IntentEngine.parse("User wants sub-600ms voice agent with Llama-3"),
  parameters: {
    sttEngine: "Whisper-v3-Turbo",
    
  }
})`;

const FLASH_ATTENTION_CODE = `// flash_attention.cu - High-throughput FP16 FlashAttention for Audio Models
#include <cuda_runtime.h>
#include <cuda_fp16.h>

__global__ void flash_attention_2_kernel(
    const half* __restrict__ Q,
    const half* __restrict__ K,
    const half* __restrict__ V,
    half* __restrict__ O,
    const int batch_size,
    const int num_heads,
    const int seq_len,
    const int head_dim
) {
    // Shared memory allocation for Q, K, V tiles
    extern __shared__ half smem[];
    const int tid = threadIdx.x;
    const int bid = blockIdx.x;
    
    // Compute block attention scores with online softmax scaling
    const float scale = 1.0f / sqrtf((float)head_dim);
    
    // Low-latency fused GEMM + Softmax reduction for 16kHz audio frames
    #pragma unroll
    for (int i = tid; i < head_dim; i += blockDim.x) {
        // Shared memory load & warp-level reduction
    }
}

extern "C" void launch_flash_attention(
    const half* Q, const half* K, const half* V, half* O,
    int b, int h, int s, int d, cudaStream_t stream
) {
    dim3 grid(b * h);
    dim3 block(128);
    size_t smem_bytes = 2 * 128 * d * sizeof(half);
    flash_attention_2_kernel<<<grid, block, smem_bytes, stream>>>(Q, K, V, O, b, h, s, d);
}`;

const MEL_FUSION_CODE = `// mel_fusion.cu - Real-Time Fused Log-Mel Spectrogram Extraction for Whisper STT
#include <cuda_runtime.h>
#include <math.h>

__global__ void fused_mel_spectrogram_kernel(
    const float* __restrict__ pcm_audio,
    float* __restrict__ mel_features,
    const float* __restrict__ dft_real,
    const float* __restrict__ dft_imag,
    const float* __restrict__ mel_filters,
    int n_fft, int hop_length, int num_mels
) {
    int frame_idx = blockIdx.x;
    int mel_bin = threadIdx.x;
    
    // Single-pass FFT windowing, magnitude computation, and Mel filterbank projection
    float real_sum = 0.0f;
    float imag_sum = 0.0f;
    
    // Compute fused log-mel value in sub-millisecond GPU execution time
    float energy = sqrtf(real_sum * real_sum + imag_sum * imag_sum);
    mel_features[frame_idx * num_mels + mel_bin] = log10f(fmaxf(1e-5f, energy));
}`;

const STREAMING_DECODE_CODE = `// streaming_decode.cu - Speculative Token Decoder Kernel for XTTS Audio Synthesis
#include <cuda_runtime.h>
#include <cooperative_groups.h>

__global__ void streaming_audio_decode_kernel(
    const int* __restrict__ token_ids,
    float* __restrict__ pcm_output,
    float* __restrict__ kv_cache,
    int batch_size, int vocab_size
) {
    // Coalesced memory access for real-time 24kHz audio synthesis chunking
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    
    // Fast speculative decoding pass: 15ms target per audio synthesis frame
    if (idx < batch_size * 1024) {
        pcm_output[idx] = tanhf(kv_cache[idx] * 0.95f);
    }
}`;

const SERVE_CODE = `#!/bin/bash
# serve.sh - High-Performance Horos Voice Agent Runner
# Environment variables for sub-600ms duplex latency
export CUDA_VISIBLE_DEVICES=0
export VLLM_ATTENTION_BACKEND=FLASH_ATTN
export WEBRTC_AUDIO_CODEC=OPUS_48KHZ
export VAD_SILENCE_THRESHOLD_MS=250

# Launch unified multi-modal serving stack
exec python3 -m horos.voice_agent.serve \\
  --stt-model "openai/whisper-large-v3-turbo" \\
  --llm-model "meta-llama/Llama-3.3-70B-Instruct-FP8" \\
  --tts-model "coqui/XTTS-v2" \\
  --transport webrtc \\
  --port 8080 \\
  --max-turn-latency-ms 600 \\
  --tensor-parallel-size 1 \\
  --gpu-memory-utilization 0.90 \\
  --enable-prefix-caching
`;

const PIPELINE_CODE = `{
  "voice_agent_pipeline": {
    "name": "webrtc-duplex-voice-v1",
    "latency_target_ms": 600,
    "stt": {
      "engine": "FasterWhisper-v3",
      "model": "openai/whisper-large-v3",
      "chunk_size_ms": 40,
      "vad_engine": "Silero-V4",
      "vad_sensitivity": 0.5
    },
    "llm": {
      "model": "meta-llama/Llama-3.3-70B-Instruct-FP8",
      "temperature": 0.3,
      "max_tokens": 128,
      "prefix_cache": true
    },
    "tts": {
      "engine": "XTTS-v2-Fast",
      "sample_rate": 24000,
      "streaming_chunk_tokens": 8
    },
    "webrtc": {
      "ice_servers": ["stun:stun.l.google.com:19302"],
      "max_bitrate_kbps": 64
    }
  }
}`;

const DOCKERFILE_CODE = `# Multi-stage optimized Dockerfile for Voice Agent Runtime
FROM nvidia/cuda:12.4.1-devel-ubuntu22.04 AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg libopus-dev python3-pip

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .
RUN nvcc -O3 -arch=sm_89 -shared -o build/libkernels.so \\
    flash_attention.cu mel_fusion.cu streaming_decode.cu -lcuda

EXPOSE 8080 50000-50100/udp
ENTRYPOINT ["./serve.sh"]`;

const DOCKER_COMPOSE_CODE = `version: "3.8"

services:
  voice-agent-runtime:
    build: .
    container_name: horos-voice-agent
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    ports:
      - "8080:8080"
      - "50000-50050:50000-50050/udp"
    environment:
      - WEBRTC_PORT=8080
      - LOG_LEVEL=INFO
    restart: always`;

const REQUIREMENTS_CODE = `# Production requirements for Horos Voice Agent Runtime
torch==2.4.0+cu124
vllm==0.6.2
faster-whisper==1.0.3
TTS==0.22.0
aiortc==1.9.0
silero-vad==5.1
numpy==1.26.4
pydantic==2.9.2`;

const README_CODE = `# Horos Voice Agent Runtime

Sub-600ms end-to-end interactive voice agent pipeline optimized for CUDA.

## Architecture
- STT: Faster-Whisper Large v3 (42ms first chunk audio transcription)
- LLM: Meta Llama-3.3-70B FP8 (110ms speculative reasoning turn)
- TTS: Coqui XTTS-v2 Streaming (80ms audio token synthesis)
- Transport: Native WebRTC duplex session with Silero VAD barge-in interruption.`;

function highlightCode(code: string, lang: string, isComplete: boolean = false) {
  if (!code) return null;
  const lines = code.split("\n");
  const totalLines = lines.length;

  return lines.map((line, i) => {
    const isCurrentActiveLine = i === totalLines - 1;
    let content = line;
    let lineContent: React.ReactNode;

    if (content.trim().startsWith("//") || content.trim().startsWith("#")) {
      lineContent = <span className="text-[#666] italic">{content}</span>;
    } else if (lang === "typescript") {
      const parts = content.split(/(\bimport\b|\bfrom\b|\bexport\b|\bconst\b|\bnew\b|\basync\b|\bawait\b|\breturn\b|"[^"]*")/);
      lineContent = parts.map((part, pi) => {
        if (["import", "from", "export", "const", "new", "async", "await", "return"].includes(part)) {
          return <span key={pi} className="text-[#a855f7] font-semibold">{part}</span>;
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={pi} className="text-[#75bf00]">{part}</span>;
        }
        if (["IntentEngine", "OutcomeContract", "CapabilityFabric", "RealTimeVoiceAgentOutcome"].includes(part)) {
          return <span key={pi} className="text-[#3b82f6] font-semibold">{part}</span>;
        }
        return part;
      });
    } else if (lang === "cpp" || lang === "cuda") {
      const parts = content.split(/(\b__global__\b|\bvoid\b|\bconst\b|\bint\b|\bfloat\b|\bhalf\b|\bextern\b|\bfor\b|\bif\b|\binclude\b|<[^>]+>|"[^"]*")/);
      lineContent = parts.map((part, pi) => {
        if (["__global__", "void", "const", "int", "float", "half", "extern", "for", "if"].includes(part)) {
          return <span key={pi} className="text-[#3b82f6] font-semibold">{part}</span>;
        }
        if (part.startsWith("#include") || (part.startsWith("<") && part.endsWith(">"))) {
          return <span key={pi} className="text-[#a855f7]">{part}</span>;
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={pi} className="text-[#75bf00]">{part}</span>;
        }
        return part;
      });
    } else if (lang === "bash") {
      const parts = content.split(/(\bexec\b|\bexport\b|\bset\b|\becho\b|"[^"]*")/);
      lineContent = parts.map((part, pi) => {
        if (["exec", "export", "set", "echo"].includes(part)) {
          return <span key={pi} className="text-[#a855f7] font-semibold">{part}</span>;
        }
        if (part.startsWith("--")) {
          return <span key={pi} className="text-[#93c5fd]">{part}</span>;
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={pi} className="text-[#75bf00]">{part}</span>;
        }
        return part;
      });
    } else if (lang === "json") {
      const parts = line.split(/("[^"]*"\s*:|"[^"]*"|\b\d+\b|\btrue\b|\bfalse\b)/);
      lineContent = parts.map((part, pi) => {
        if (part.endsWith(":")) {
          return <span key={pi} className="text-[#93c5fd]">{part}</span>;
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={pi} className="text-[#75bf00]">{part}</span>;
        }
        if (["true", "false"].includes(part)) {
          return <span key={pi} className="text-[#a855f7]">{part}</span>;
        }
        return part;
      });
    } else {
      lineContent = content;
    }

    return (
      <div
        key={i}
        className={`min-h-[22px] leading-[22px] flex items-center transition-colors rounded-sm px-1 ${isCurrentActiveLine && !isComplete ? "bg-[#75bf00]/10" : ""
          }`}
      >
        {/* Flickering green vertical line indicator at the front of every active line */}
        {isCurrentActiveLine && !isComplete ? (
          <span className="w-[3.5px] h-[16px] bg-[#75bf00] animate-pulse inline-block mr-2.5 rounded-full shrink-0 align-middle" />
        ) : (
          <span className="w-[3.5px] h-[16px] bg-transparent inline-block mr-2.5 shrink-0" />
        )}

        <span className="flex-1 whitespace-pre">{lineContent}</span>

        {/* Flickering green block cursor at the end position */}
        {isCurrentActiveLine && !isComplete && (
          <span className="inline-block w-[7px] h-[16px] bg-[#75bf00] animate-pulse ml-1 align-middle shrink-0" />
        )}
        {i === totalLines - 1 && isComplete && (
          <span className="inline-block w-[8px] h-[16px] bg-[#75bf00] animate-pulse ml-1 align-middle shrink-0" />
        )}
      </div>
    );
  });
}

const DEFAULT_MODELS = [
    { id: "nvidia/PhoneLLM-Alpha-1", name: "PhoneLLM Alpha 1", author: "Pipecat", downloads: "32B", tag: "Voice Agent" },
    { id: "nvidia/Nemotron-3-Nano-Omni", name: "Nemotron 3 Nano Omni", author: "NVIDIA", downloads: "30B", tag: "Omni Agent" },
    { id: "nvidia/NemotronLabs-VoiceChat", name: "NemotronLabs VoiceChat", author: "NVIDIA", downloads: "11B", tag: "Audio-to-Audio" },
    { id: "qwen/Qwen3-Omni", name: "Qwen3-Omni", author: "Alibaba", downloads: "30B-A3B", tag: "Multimodal" },
    { id: "mistral/Voxtral-Realtime", name: "Voxtral Realtime", author: "Mistral", downloads: "Open weights", tag: "Streaming STT" },
    { id: "qwen/Qwen3-TTS", name: "Qwen3-TTS", author: "Alibaba", downloads: "1.7B", tag: "TTS" },
    { id: "mistral/Voxtral-TTS", name: "Voxtral TTS", author: "Mistral", downloads: "4B", tag: "Realtime TTS" },
    { id: "bosonai/Higgs-Audio-V3", name: "Higgs Audio V3", author: "Boson AI", downloads: "4B", tag: "TTS" },
    { id: "nvidia/Parakeet-TDT-v3", name: "Parakeet TDT v3", author: "NVIDIA", downloads: "0.6B", tag: "Streaming STT" }
  ];

const AuthorAvatar = ({ author, size = 20 }: { author: string, size?: number }) => {
  const [error, setError] = useState(false);

  if (error || !author) {
    return <HuggingFaceLogo size={size} />;
  }

  return (
    <img
      src={`https://github.com/${author}.png`}
      alt={author}
      style={{ width: size, height: size }}
      className="rounded-sm object-cover"
      onError={() => setError(true)}
    />
  );
};

const getLogo = (author: string, modelName: string = "") => {
    if (!author && !modelName) return <AuthorMonogram label="HF" size={20} />;
    const a = (author || "").toLowerCase();
    const m = (modelName || "").toLowerCase();
  
    if (a.includes('openai') || m.includes('whisper') || m.includes('gpt')) return <OpenAILogo size={20} />;
    if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
    if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
    if (a.includes('mistral') || m.includes('mistral') || m.includes('voxtral')) return <MistralLogo size={20} />;
    if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
    if (a.includes('nvidia') || m.includes('nemotron')) return <NvidiaLogo size={20} />;
    if (a.includes('pipecat')) return <PipecatLogo size={20} />;
    if (a.includes('boson')) return <BosonAILogo size={20} />;
  
    return <AuthorAvatar author={author} size={20} />;
  };

const getBorderClasses = (index: number, total: number) => {
  let classes = "p-8 border-dashed border-[#333] flex flex-col gap-6 group hover:bg-[#1a1a1a] transition-colors cursor-pointer relative";

  if (index % 3 !== 2) classes += " md:border-r";

  if (Math.floor(index / 3) < Math.ceil(total / 3) - 1) {
      classes += " border-b";
    } else {
      classes += " border-b md:border-b-0";
    }

  return classes;
};

const FAQ_DATA = [
  {
    question: "Can I bring my own fine-tuned model?",
    answer: "Yes, for supported chat-capable models. Paste the Hugging Face ID; unsupported or untuned shapes show baseline-only or gated status instead of a tuned run.",
  },
  {
    question: "Does this support tool calling?",
    answer: "Yes. Models like Llama 3.1 and Hermes that are trained for tool use are fully supported. Tool definitions are passed dynamically and executed natively.",
  },
  {
    question: "Can I run this on a smaller GPU?",
    answer: "Yes. By applying FP8 or INT4 quantization, you can fit an 8B chat model on a single L4 or RTX 4000 Ada with plenty of room left over for KV cache and context.",
  }
];

export default function RagSearchPage() {
  const [activeTab, setActiveTab] = useState("Horos");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  type VoiceAgentFile =
    | "outcome.ts"
    | "flash_attention.cu"
    | "mel_fusion.cu"
    | "streaming_decode.cu"
    | "serve.sh"
    | "pipeline.json"
    | "Dockerfile"
    | "docker-compose.yml"
    | "requirements.txt"
    | "README.md";

  const FILE_CODE_MAP: Record<VoiceAgentFile, string> = {
    "outcome.ts": OUTCOME_CODE,
    "flash_attention.cu": FLASH_ATTENTION_CODE,
    "mel_fusion.cu": MEL_FUSION_CODE,
    "streaming_decode.cu": STREAMING_DECODE_CODE,
    "serve.sh": SERVE_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE,
    "README.md": README_CODE,
  };

  const [activeFile, setActiveFile] = useState<VoiceAgentFile>("outcome.ts");
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  // Auto-play vs Manual exploration mode
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTypingCode, setIsTypingCode] = useState(true);

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "On it. I'll compose the WebRTC audio pipeline, route latency-optimized STT/TTS channels, and verify the RealTimeVoiceAgent Outcome Contract.";
  const AGENT_MSG_2 = "Voice agent recipe is ready. Targeting first chunk 42ms and turn latency 240ms on L40S at $1.40/hr. Run the in-app bench on your traffic to lock the numbers. Want me to deploy?";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (visibleStep === 0) {
      // Step 0: User prompt shown first, start Agent Msg 1 typing after short pause
      timer = setTimeout(() => setVisibleStep(1), 400);
    } else if (visibleStep === 1) {
      // Step 1: Type out AGENT_MSG_1 real-time character-by-character
      if (typedMsg1.length < AGENT_MSG_1.length) {
        timer = setTimeout(() => {
          setTypedMsg1(AGENT_MSG_1.slice(0, typedMsg1.length + 2));
        }, 18);
      } else {
        // AGENT_MSG_1 finished typing -> start revealing logs
        timer = setTimeout(() => setVisibleStep(2), 450);
      }
    } else if (visibleStep >= 2 && visibleStep <= 6) {
      // Steps 2-6: Reveal logs sequentially one by one
      timer = setTimeout(() => setVisibleStep(prev => prev + 1), 450);
    } else if (visibleStep === 7) {
      // Step 7 (LAST): Type out AGENT_MSG_2 real-time character-by-character at the very end
      if (typedMsg2.length < AGENT_MSG_2.length) {
        timer = setTimeout(() => {
          setTypedMsg2(AGENT_MSG_2.slice(0, typedMsg2.length + 2));
        }, 18);
      }
    }

    return () => clearTimeout(timer);
  }, [visibleStep, typedMsg1, typedMsg2]);

  // Real-time code typing state
  const [typedCodeText, setTypedCodeText] = useState("");

  // Sync activeFile with visibleStep automatically as the chat execution progresses in Auto Mode
  useEffect(() => {
    if (!isAutoPlay) return;

    if (visibleStep === 0 || visibleStep === 1) {
      setActiveFile("outcome.ts");
    } else if (visibleStep === 2) {
      setActiveFile("flash_attention.cu");
    } else if (visibleStep === 3) {
      setActiveFile("serve.sh");
    } else if (visibleStep === 4) {
      setActiveFile("mel_fusion.cu");
    } else if (visibleStep === 5) {
      setActiveFile("streaming_decode.cu");
    } else if (visibleStep === 6) {
      setActiveFile("pipeline.json");
    } else if (visibleStep === 7) {
      setActiveFile("outcome.ts");
    }
  }, [visibleStep, isAutoPlay]);

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || OUTCOME_CODE;

    setTypedCodeText("");
    setIsTypingCode(true);
    let charIdx = 0;
    const interval = setInterval(() => {
      if (charIdx < fullCode.length) {
        charIdx += 6;
        setTypedCodeText(fullCode.slice(0, charIdx));
      } else {
        setTypedCodeText(fullCode);
        setIsTypingCode(false);
        clearInterval(interval);
      }
    }, 12);

    return () => clearInterval(interval);
  }, [activeFile]);

  const selectFileManually = (file: VoiceAgentFile) => {
    setIsAutoPlay(false);
    setActiveFile(file);
    setActiveMainTab("code");
  };

  const replayAnimation = () => {
    setIsAutoPlay(true);
    setTypedMsg1("");
    setTypedMsg2("");
    setVisibleStep(0);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [models, setModels] = useState<any[]>(DEFAULT_MODELS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setModels(DEFAULT_MODELS);
      return;
    }

    setIsLoading(true);
    fetch(`https://huggingface.co/api/models?search=${encodeURIComponent(debouncedQuery)}&limit=9&sort=downloads&direction=-1`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((m: any) => {
            let dl = "0 dl";
            if (m.downloads) {
              if (m.downloads >= 1000000) dl = (m.downloads / 1000000).toFixed(1).replace(/\.0$/, '') + "M dl";
              else if (m.downloads >= 1000) dl = Math.round(m.downloads / 1000) + "k dl";
              else dl = m.downloads + " dl";
            }

            let tag = "Model";
            if (m.pipeline_tag) {
              if (m.pipeline_tag.includes("text-generation")) tag = "LLM";
              else if (m.pipeline_tag.includes("automatic-speech-recognition")) tag = "STT";
              else if (m.pipeline_tag.includes("text-to-speech")) tag = "TTS";
              else if (m.pipeline_tag.includes("audio-classification")) tag = "Audio";
            }

            let author = m.author || m.id.split('/')[0];
            let name = m.id.split('/').pop();

            return {
              id: m.id,
              name: name,
              author: author,
              downloads: dl,
              tag: tag
            };
          });
          setModels(mapped);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-[#151515] text-[#F0EFE2] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        body { background-color: #151515 !important; }
        
        /* Ultra-thin dark gray scrollbar appearing ONLY on hover */
        * {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }

        *:hover {
          scrollbar-color: #383838 transparent;
        }

        ::-webkit-scrollbar {
          width: 3px;
          height: 3px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 9999px;
          transition: background-color 0.3s ease;
        }

        *:hover::-webkit-scrollbar-thumb {
          background-color: #383838;
        }

        ::-webkit-scrollbar-thumb:hover {
          background-color: #555555;
        }

        @keyframes data-packet-beam {
          0% { transform: translateX(-100%); }
          60% { transform: translateX(300%); }
          100% { transform: translateX(300%); }
        }
        .animate-data-beam {
          animation: data-packet-beam 12s ease-in-out infinite;
        }
      ` }} />

            {/* GLOBAL VERTICAL DASHED LINES */}
        {/* These run the entire height of the page. The 72% middle column perfectly aligns with the navbar. The 7% columns subdivide the outer margins. */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="w-full h-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            {/* Left margin (14%) with 7% line bisecting it */}
            <div className="relative border-r border-dashed border-[#333]">
                <div className="absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333]" />
              </div>
            {/* Center content (72%) */}
            <div />
            {/* Right margin (14%) with 93% line bisecting it */}
            <div className="relative border-l border-dashed border-[#333]">
                <div className="absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333]" />
              </div>
          </div>
        </div>

        <div className="relative z-[100]">
        <LandingNavbar
          onOpenSignIn={() => {
            setAuthModalMode("sign-in");
            setAuthModalOpen(true);
          }}
          onOpenSignUp={() => {
            setAuthModalMode("sign-up");
            setAuthModalOpen(true);
          }}
        />
      </div>

      <main className="flex-1 flex flex-col relative z-10">
        {/* Hero Section Container */}
          <div className="w-full relative mt-20 mb-20">
          {/* Infinite Horizontal Lines bounding the hero section */}
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />

          {/* Crosshairs at exact intersections with the global vertical lines */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               {/* Top Crosshairs */}
               <div className="absolute left-[4%] md:left-[6%] lg:left-[18%] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="absolute right-[4%] md:right-[6%] lg:right-[18%] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute left-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute right-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
            </div>

          {/* Hero Content */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] py-24 md:py-32 relative z-10">
            <div />
            <div className="min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-4 md:px-8 lg:px-12">
                {/* Left: Content */}
                <div className="flex flex-col gap-6 max-w-lg">
                  <div className="flex items-center w-fit border border-dashed border-[#333] p-[3px] gap-[3px] rounded-sm mb-2">
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <OpenAILogo size={14} />
                    </div>
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <MetaLogo size={14} />
                    </div>
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <NvidiaLogo size={14} />
                    </div>
                  </div>
                  <h1 className="text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.15] mt-[-1rem] text-[#f2efe8]">
                      The stack behind faster voice agents.
                    </h1>
                    <p className="text-[#C8C7BA] text-[16px] tracking-wide max-w-lg mt-2 leading-relaxed font-sans">
                      Llama, Qwen, or supported open models. Tool use, streaming, routing, and runtime optimization on a single GPU.
                    </p>
                  <div className="flex items-center w-max gap-3 mt-6">
                    <button className="group whitespace-nowrap bg-[#75bf00] text-black px-4 py-2 text-[13px] font-medium hover:bg-[#85cf00] transition-colors rounded-none flex items-center justify-center gap-2">
                        Optimize your voice agent <ChevronRight size={20} strokeWidth={2.5} className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
                      </button>
                    <button className="group whitespace-nowrap bg-transparent text-[#94a3b8] border border-[#333] px-4 py-2 text-[13px] font-medium hover:bg-[#1a1a1a] transition-colors rounded-none flex items-center justify-center gap-2">
                        Explore the stack <ChevronRight size={20} strokeWidth={2.5} className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
                      </button>
                  </div>
                </div>

                {/* Right: Ecosystem Grid Graphic */}
                <div className="flex justify-center relative w-full h-full min-h-[500px]">
                  <EcosystemGrid />
                </div>
              </div>{/* close 2-col grid (L129) */}
            </div>{/* close center col min-w-0 (L128) */}
            <div />{/* right empty col */}
          </div>{/* close hero grid (L126) */}
        </div>{/* close hero container (L102) */}


        {/* Features Section */}
        <div className="w-full relative z-10 mt-16">
          {/* Heading */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-16 px-4">
                <h2 className="text-[40px] md:text-[56px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4">
                  What you actually own
                </h2>
                <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed max-w-2xl mx-auto">
                  The model, the runtime, and the workload. Horos gives you the controls to understand and optimize the system behind your voice agent.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Grid with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10">
            {/* Borders */}

            {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               {/* Top Crosshairs */}
               <div className="absolute left-[4%] md:left-[6%] lg:left-[18%] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="absolute right-[4%] md:right-[6%] lg:right-[18%] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute left-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute right-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
            </div>

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0 mx-[10px] border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Card 1 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">0 1</div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2] leading-tight">Tune every knob.</h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      Kernels, quantization, KV cache, context, batching, routing, and runtime. Horos measures what each change does to latency, quality, memory, and cost.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-16 min-h-[300px] bg-[#151515] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">0 2</div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2] leading-tight">Bring your models.</h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      Pick from Hugging Face or supported open-weight models. Horos checks compatibility, profiles the model, and finds the configurations worth testing.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">0 3</div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2] leading-tight">Optimize your workload.</h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      Replay your voice traffic and measure latency, quality, concurrency, memory, and cost. Horos finds the configurations that work for your actual workload.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="w-full relative z-10 mt-32 mb-16">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="flex flex-col items-center mb-16 px-4">
            <h2 className="text-[40px] md:text-[56px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
              Three ways to ship voice agents
            </h2>
            <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed text-center max-w-2xl">
              Most teams either use a managed voice API or build the stack themselves. Horos optimizes the intelligence system, connects it to real-world signals, and turns verified experience into better intelligence.
            </p>
          </div>
          <div className="w-full relative z-10">
            {/* Top Border */}

            {/* Inner Vertical Lines matching the 14% columns */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="hidden md:block absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
              <div className="hidden md:block absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
               
            </div>

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333] flex flex-col">

                {/* Header Row */}
                <div className="flex flex-col md:flex-row items-stretch border-b border-dashed border-[#333]">
                  {/* Col 1: Label */}
                  <div className="w-full md:w-1/4 px-4 py-4 lg:px-5 flex items-end border-r-0 md:border-r border-dashed border-[#333]">
                    <span className="text-[#C8C7BA] font-bold text-[10px] tracking-[0.15em] uppercase">What Matters</span>
                  </div>

                  {/* Col 2: RunInfra (Recommended) */}
                  <div className="w-full md:w-1/4 px-4 py-4 lg:px-5 border-r-0 md:border-r border-dashed border-[#333] flex flex-col gap-2 relative bg-[#75bf00]/[0.02]">
                    <span className="absolute top-2.5 right-3 text-[#75bf00] font-bold text-[8px] tracking-[0.15em] uppercase">Recommended</span>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-[#1a1a1a] p-1 border border-[#333] rounded">
                        <HorosLogo variant="icon" className="w-4 h-4 text-[#75bf00]" />
                      </div>
                      <span className="text-[#F0EFE2] text-[15px] sm:text-[16px] font-semibold tracking-tight">Horos</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[13px] leading-relaxed">Optimize, verify, teach, evolve.</p>
                  </div>

                  {/* Col 3: Closed API */}
                  <div className="w-full md:w-1/4 px-4 py-4 lg:px-5 border-r-0 md:border-r border-dashed border-[#333] flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Key size={16} className="text-[#C8C7BA]" />
                      <span className="text-[#F0EFE2] text-[15px] sm:text-[16px] font-semibold tracking-tight">Closed voice APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[13px] leading-relaxed">Consume the provider's intelligence.</p>
                  </div>

                  {/* Col 4: DIY */}
                  <div className="w-full md:w-1/4 px-4 py-4 lg:px-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu size={16} className="text-[#C8C7BA]" />
                      <span className="text-[#F0EFE2] text-[15px] sm:text-[16px] font-semibold tracking-tight">DIY self-hosting</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[13px] leading-relaxed">Build and operate the intelligence stack.</p>
                  </div>
                </div>

                {/* Data Rows */}
                {COMPARISON_ROWS.map((row, idx) => (
                  <div
                    key={idx}
                    className="group flex flex-col md:flex-row items-stretch border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors cursor-default"
                  >
                    {/* Col 1: Label */}
                    <div className="w-full md:w-1/4 px-4 py-3.5 lg:px-5 lg:py-4 flex items-start justify-between border-r-0 md:border-r border-dashed border-[#333] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-[#75bf00] font-mono text-[12px] font-bold">{row.num}</span>
                        <span className="text-[#F0EFE2] text-[14px] sm:text-[15px] font-medium group-hover:text-[#75bf00] transition-colors">{row.label}</span>
                      </div>
                      <ChevronRight size={16} className="text-[#75bf00] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300 mt-0.5" />
                    </div>

                    {/* Col 2: RunInfra */}
                    <div className="w-full md:w-1/4 px-4 py-4 lg:px-5 border-r-0 md:border-r border-dashed border-[#333] flex flex-col gap-2">
                      <span className="text-[#75bf00] text-[13.5px] sm:text-[14px] font-medium transition-colors mb-1 leading-snug">{row.runInfra.title}</span>
                      <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed group-hover:text-[#F0EFE2] transition-colors">{row.runInfra.desc}</p>
                    </div>

                    {/* Col 3: Closed API */}
                    <div className="w-full md:w-1/4 px-4 py-4 lg:px-5 border-r-0 md:border-r border-dashed border-[#333] flex flex-col gap-2">
                      <span className="text-[#F0EFE2] text-[14px] sm:text-[15px] font-medium group-hover:text-[#75bf00] transition-colors">{row.closed.title}</span>
                      <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed group-hover:text-[#F0EFE2] transition-colors">{row.closed.desc}</p>
                    </div>

                    {/* Col 4: DIY */}
                    <div className="w-full md:w-1/4 px-4 py-4 lg:px-5 flex flex-col gap-2">
                      <span className="text-[#F0EFE2] text-[14px] sm:text-[15px] font-medium group-hover:text-[#75bf00] transition-colors">{row.diy.title}</span>
                      <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed group-hover:text-[#F0EFE2] transition-colors">{row.diy.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Sandbox Showcase Section */}
        <div className="w-full relative z-10 mt-32">
          {/* Top Divider for Sandbox Section */}
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />

          {/* Heading for Sandbox */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-16 mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-5xl lg:text-[52px] font-medium tracking-tight mb-6">
                  Code you own. <span className="text-[#75bf00]">Deploy anywhere.</span>
                </h2>
                <p className="text-[#999999] text-[18px] max-w-2xl mx-auto leading-relaxed">
                  The full recipe ships with you. Codebase, kernels, engine config, weights. Run it anywhere.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Top Horizontal Border spanning full screen */}

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              <div className="w-full relative min-w-0">
                {/* Sandbox Content Container (SVG Skeleton Architecture) */}
                <div className="w-full relative mx-auto" style={{ aspectRatio: '1351 / 892' }}>

              {/* Panes Backgrounds (Z-0) */}
              <div className="absolute inset-0 grid" style={{
                gridTemplateColumns: '41fr 443fr 226fr 602fr 39fr',
                gridTemplateRows: '53.5fr 785fr 53.5fr'
              }}>
                {/* Tabs bg */}
                <div className="col-start-2 col-end-5 row-start-1 row-end-2 bg-[#151515]" />

                {/* Chat bg */}
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 bg-[#151515]" />

                {/* Files bg */}
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 bg-[#151515]" />

                {/* Code bg */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 bg-[#151515]" />
              </div>

              {/* Skeleton Grid Lines (Z-10) */}
              <SkeletonGrid className="absolute inset-0 w-full h-full z-10" />

              {/* Content (Z-20) */}
              <div className="absolute inset-0 grid pointer-events-none z-20" style={{
                gridTemplateColumns: '41fr 443fr 226fr 602fr 39fr',
                gridTemplateRows: '53.5fr 785fr 53.5fr'
              }}>

                {/* Tabs */}
                <div className="col-start-2 col-end-5 row-start-1 row-end-2 flex items-center justify-between px-6 pointer-events-auto">
                  <div className="flex gap-8 h-full items-end pb-2">
                    <button
                      onClick={() => setActiveMainTab("pipeline")}
                      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "pipeline" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      <span className="text-[#75bf00]">&gt;_</span> PIPELINE
                    </button>
                    <button
                      onClick={() => setActiveMainTab("code")}
                      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "code" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      <Code2 size={13} /> CODE
                    </button>
                    <button
                      onClick={() => setActiveMainTab("optimization")}
                      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "optimization" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      <Sliders size={13} /> OPTIMIZATION
                    </button>
                    <button
                      onClick={() => setActiveMainTab("deploy")}
                      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "deploy" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      <Rocket size={13} /> DEPLOY
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={replayAnimation}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-[#C8C7BA] hover:text-[#75bf00] bg-[#1a1a1a] border border-[#252525] hover:border-[#75bf00]/40 px-2 py-1 rounded transition-all cursor-pointer group"
                      title="Replay Execution Sequence"
                    >
                      <Zap size={11} className={visibleStep < 7 ? "animate-spin text-[#75bf00]" : "text-[#75bf00] group-hover:rotate-12 transition-transform"} />
                      <span>{visibleStep < 7 ? `Executing... (${visibleStep}/7)` : "Replay Sequence"}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#75bf00] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#75bf00] tracking-widest uppercase">Live</span>
                    </div>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-6 flex flex-col justify-between overflow-hidden pointer-events-auto">
                  <div className="flex flex-col gap-6 overflow-y-auto chat-scroll pr-2 pb-4">
                    {/* Step 0: User Prompt Card */}
                    <div className={`bg-[#1a1a1a] border border-[#252525] p-4 rounded-[4px] transition-all duration-500 transform ${visibleStep >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <p className="text-[#C8C7BA] text-[12.5px] leading-[1.8]">
                        Optimize{" "}
                        <span className="inline-flex items-center align-middle gap-1 bg-[#151515] border border-[#333] px-1 py-0.5 rounded text-[11px] font-medium text-[#C8C7BA]"><OpenAILogo size={10} /> Whisper Large V3</span>
                        {" "}+{" "}
                        <span className="inline-flex items-center align-middle gap-1 bg-[#151515] border border-[#333] px-1 py-0.5 rounded text-[11px] font-medium text-[#C8C7BA]"><MetaLogo size={10} /> Llama 3.2 3B</span>
                        {" "}on{" "}
                        <span className="inline-flex items-center align-middle gap-1 bg-[#151515] border border-[#333] px-1 py-0.5 rounded text-[11px] font-medium text-[#C8C7BA]"><VLLMLogo size={10} /> vLLM-Omni</span>
                        {" "}for RTF and streaming latency
                      </p>
                      </div>

                    {/* Step 1: Agent Initial Ack */}
                    <div className={`flex gap-3 mt-2 transition-all duration-500 transform ${visibleStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                      <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                        {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length ? (
                          <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                        ) : (
                          <Sparkles size={14} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                        <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                          {typedMsg1}
                          {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length && (
                            <span className="inline-block w-1.5 h-3.5 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Steps 2-6: Sequential Logs List */}
                    <div className="flex flex-col gap-4 mt-2">
                      {/* Log 1 (Step 2): 42ms */}
                      <div className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 2 ? (
                            <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Profiled Faster-Whisper on L40S</span>
                            <span className="text-[#C8C7BA] text-[12px]">42ms</span>
                          </div>
                          <span className="text-[#666] text-[12px]">16kHz audio stream chunk processing</span>
                        </div>
                      </div>

                      {/* Log 2 (Step 3): 0.8s */}
                      <div className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 3 ? (
                            <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Selected WebRTC audio serving engine</span>
                            <span className="text-[#C8C7BA] text-[12px]">0.8s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Full-duplex bidirectional stream with VAD</span>
                        </div>
                      </div>

                      {/* Log 3 (Step 4): 12ms */}
                      <div className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 4 ? (
                            <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Tuned Silero VAD & echo cancellation</span>
                            <span className="text-[#C8C7BA] text-[12px]">12ms</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">+58% throughput, interruptible barge-in</span>
                        </div>
                      </div>

                      {/* Log 4 (Step 5): 1.1s */}
                      <div className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 5 ? (
                            <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Enabled prefix cache for voice prompt...</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.1s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">0.4x KV cost on common audio turns</span>
                        </div>
                      </div>

                      {/* Log 5 (Step 6): 1.4s */}
                      <div className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 6 ? (
                            <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Ran voice harness, 500 call turns...</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.4s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">p95 240ms end-to-end latency steady</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 7 (LAST STEP): Agent Final Summary Response (Standard Layout, Character-by-Character Real-Time Typing) */}
                    <div className={`flex gap-3 mt-2 transition-all duration-500 transform ${visibleStep >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                      <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                        {visibleStep === 7 && typedMsg2.length < AGENT_MSG_2.length ? (
                          <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                        ) : (
                          <Sparkles size={14} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                        <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                          {typedMsg2}
                          {visibleStep === 7 && typedMsg2.length < AGENT_MSG_2.length && (
                            <span className="inline-block w-1.5 h-3.5 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt input bar (Composer) */}
                  <div className="mt-2 shrink-0 mb-2">
                    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-[8px] p-3.5 flex flex-col justify-between gap-3">
                      <p className="text-[#C8C7BA] text-[13px] font-sans">
                        Tune Llama to FP8 and rerun the harness...
                      </p>
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center gap-4 text-[11px] text-[#C8C7BA] font-sans">
                          <span className="flex items-center gap-1 hover:text-[#F0EFE2] transition-colors cursor-pointer">
                            <span className="text-[#C8C7BA] font-bold text-[12px]">@</span> Models
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-[#F0EFE2] transition-colors cursor-pointer">
                            <Server size={13} className="text-[#C8C7BA]" /> vLLM-Omni
                          </span>
                          <span className="text-[#C8C7BA]">L4 24GB</span>
                        </div>
                        <button className="w-7 h-7 rounded-[6px] border border-[#75bf00]/80 bg-[#1e2714] text-[#75bf00] flex items-center justify-center hover:bg-[#75bf00] hover:text-black transition-colors cursor-pointer">
                          <ArrowUp size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files Content */}
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-6 flex flex-col items-start gap-4 overflow-auto pointer-events-auto chat-scroll">
                  <div className="flex justify-between items-center border-b border-[#252525] pb-3 mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase whitespace-nowrap shrink-0 truncate">GENERATED KERNELS</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">3</span>
                  </div>

                  <div className="flex flex-col gap-1 text-[13px] font-mono">
                    {/* Generated Kernels */}
                    <button
                      onClick={() => selectFileManually("flash_attention.cu")}
                      className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "flash_attention.cu"
                        ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                        : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                        }`}
                    >
                      {activeFile === "flash_attention.cu" && (
                        <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                      )}
                      flash_attention.cu
                    </button>

                    <button
                      onClick={() => selectFileManually("mel_fusion.cu")}
                      className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "mel_fusion.cu"
                        ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                        : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                        }`}
                    >
                      {activeFile === "mel_fusion.cu" && (
                        <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                      )}
                      mel_fusion.cu
                    </button>

                    <button
                      onClick={() => selectFileManually("streaming_decode.cu")}
                      className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "streaming_decode.cu"
                        ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                        : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                        }`}
                    >
                      {activeFile === "streaming_decode.cu" && (
                        <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                      )}
                      streaming_decode.cu
                    </button>

                    {/* Project Folder */}
                    <div className="mt-4 flex flex-col gap-1">
                      <div className="flex items-center gap-2 px-2 py-1 text-[#aaa] font-semibold text-[12px]">
                        <ChevronDown size={14} className="text-[#777]" /> horos-voice-agent/
                      </div>
                      <div className="pl-3 flex flex-col gap-1 border-l border-[#252525] ml-3 mt-0.5">
                        <button
                          onClick={() => selectFileManually("serve.sh")}
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "serve.sh"
                            ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                            : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                            }`}
                        >
                          {activeFile === "serve.sh" && (
                            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                          )}
                          serve.sh
                        </button>
                        <button
                          onClick={() => selectFileManually("pipeline.json")}
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "pipeline.json"
                            ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                            : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                            }`}
                        >
                          {activeFile === "pipeline.json" && (
                            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                          )}
                          pipeline.json
                        </button>
                        <button
                          onClick={() => selectFileManually("outcome.ts")}
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "outcome.ts"
                            ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                            : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                            }`}
                        >
                          {activeFile === "outcome.ts" && (
                            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                          )}
                          outcome.ts
                        </button>
                        <button
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "Dockerfile"
                            ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                            : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                            }`}
                        >
                          {activeFile === "Dockerfile" && (
                            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                          )}
                          Dockerfile
                        </button>
                        <button
                          onClick={() => selectFileManually("docker-compose.yml")}
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "docker-compose.yml"
                            ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                            : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                            }`}
                        >
                          {activeFile === "docker-compose.yml" && (
                            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                          )}
                          docker-compose.yml
                        </button>
                        <button
                          onClick={() => selectFileManually("requirements.txt")}
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "requirements.txt"
                            ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                            : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                            }`}
                        >
                          {activeFile === "requirements.txt" && (
                            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                          )}
                          requirements.txt
                        </button>
                        <div className="flex items-center gap-1.5 px-3 py-1 text-[#555]">
                          <ChevronRight size={13} className="text-[#444]" /> models/
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 text-[#555]">
                          <ChevronRight size={13} className="text-[#444]" /> benchmarks/
                        </div>
                        <button
                          onClick={() => selectFileManually("README.md")}
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-max min-w-full text-left rounded-[4px] whitespace-nowrap shrink-0 relative ${activeFile === "README.md"
                            ? "text-[#F0EFE2] font-bold bg-[#1e1e1e]"
                            : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                            }`}
                        >
                          {activeFile === "README.md" && (
                            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#75bf00] rounded-r-sm" />
                          )}
                          README.md
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll">
                  {/* Editor top tabs */}
                  <div className="flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto">
                    <button
                      onClick={() => selectFileManually("outcome.ts")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "outcome.ts" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      outcome.ts
                    </button>
                    <button
                      onClick={() => selectFileManually("flash_attention.cu")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "flash_attention.cu" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      flash_attention.cu
                    </button>
                    <button
                      onClick={() => selectFileManually("mel_fusion.cu")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "mel_fusion.cu" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      mel_fusion.cu
                    </button>
                    <button
                      onClick={() => selectFileManually("streaming_decode.cu")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "streaming_decode.cu" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      streaming_decode.cu
                    </button>
                    <button
                      onClick={() => selectFileManually("serve.sh")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "serve.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      serve.sh
                    </button>
                    <button
                      onClick={() => selectFileManually("pipeline.json")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      pipeline.json
                    </button>
                  </div>

                  {/* Code Area with Line Numbers & Real-Time Code Streaming */}
                  <div className="flex font-mono text-[13px] leading-relaxed overflow-x-auto select-text">
                    {/* Line numbers column */}
                    <div className="text-[#444] text-right pr-5 border-r border-[#252525] select-none flex flex-col min-w-[32px]">
                      {Array.from({ length: Math.max(12, typedCodeText.split('\n').length) }).map((_, i) => (
                        <div key={i} className="min-h-[22px] leading-[22px]">{i + 1}</div>
                      ))}
                    </div>

                    {/* Highlighted code column */}
                    <div className="pl-5 flex-1 text-[#C8C7BA] leading-[22px]">
                      {highlightCode(
                        typedCodeText,
                        activeFile.endsWith(".ts")
                          ? "typescript"
                          : activeFile.endsWith(".json")
                            ? "json"
                            : activeFile.endsWith(".cu")
                              ? "cuda"
                              : activeFile.endsWith(".sh")
                                ? "bash"
                                : activeFile === "Dockerfile"
                                  ? "bash"
                                  : "typescript",
                        !isTypingCode
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid Row */}
        <div className="w-full relative z-10">
          {/* Line 3: Infinite Horizontal Border at bottom of Features Grid */}



          {/* Feature Cards aligned with vertical grid lines */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              {/* Added top horizontal line per user request */}
              <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333]">
              <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                {/* Card 1 */}
                <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                  <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Cloud size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-medium text-[#F0EFE2]">Managed Horos</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Our GPUs, per-million-tokens billing from L4 to B200.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                  <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Server size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-medium text-[#F0EFE2]">Your infrastructure</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    AWS, GCP, RunPod, bare metal. Same verifier/, your cluster.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="px-8 py-16 flex flex-col gap-4 items-start">
                  <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Network size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-medium text-[#F0EFE2]">Local workstation</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    docker compose up. Full pipeline on a single GPU.
                  </p>
                </div>
              </div>
            </div>
            <div />
          </div>
        </div>

              </div>
              <div />
            </div>
        {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-24 pb-16">
            <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-xl mx-auto leading-tight">
                Supported HF chat models work
              </h2>
              <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                Supported chat-capable models on Hugging Face run through the compatible recipe. Search the live catalog above. The examples below are just a starting view.
              </p>

              {/* Search Bar */}
              <div className="w-full max-w-xl mb-12 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C8C7BA]">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any voice-compatible model on Hugging Face"
                  className="w-full bg-[#1a1a1a] border border-dashed border-[#333] text-[#C8C7BA] text-[13.5px] sm:text-[14px] pl-10 pr-12 py-3 rounded-[4px] outline-none focus:border-[#555] transition-colors font-sans placeholder:text-[#666]"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <span className="text-[9.5px] font-bold text-[#C8C7BA] border border-dashed border-[#333] px-1.5 py-0.5 rounded-sm">HF</span>
                </div>
              </div>

              {/* Models Grid */}
              <div className="w-full border-y border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {isLoading ? (
                    <div className="col-span-3 flex justify-center items-center py-24 text-[#C8C7BA] font-mono text-[14px]">
                      Loading models from Hugging Face...
                    </div>
                  ) : models.length === 0 ? (
                    <div className="col-span-3 flex justify-center items-center py-24 text-[#C8C7BA] font-mono text-[14px]">
                      No models found for "{searchQuery}"
                    </div>
                  ) : (
                    models.map((model, index) => (
                      <div key={model.id} className={getBorderClasses(index, models.length)}>
                        <ArrowUpRight size={20} className="text-[#75bf00] absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center">
                          {getLogo(model.author, model.name)}
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>{model.name}</h3>
                          <span className="text-[#C8C7BA] text-[14px] line-clamp-1" title={model.author}>{model.author}</span>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                          <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0">{model.downloads}</span>
                          <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">{model.tag}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* What Horos tunes Section */}
        <div className="w-full relative z-10 pt-24 pb-16">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-xl mx-auto leading-tight">
                What Horos tunes
              </h2>
              <p className="text-[#A0A098] text-[15px] sm:text-[16px] font-sans leading-relaxed text-center max-w-lg mx-auto mb-12">
                Every layer of the voice pipeline, measured against latency, quality, throughput, memory, and cost.
              </p>

              {/* Tunes Grid */}
              <div className="w-full border-y border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">

                  {/* Row 1 */}
                  <div className="px-8 lg:px-12 py-12 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Mic size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Speech pipeline</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      VAD, STT, LLM, TTS, streaming. Tune chunk size and model handoff. Measure end-to-end latency and voice quality in real-time.
                    </p>
                  </div>

                  <div className="px-8 lg:px-12 py-12 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Cpu size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Kernel & runtime</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      FlashAttention, custom kernels, fused operations. Search kernel configurations tailored to your workload. Benchmark throughput beyond default runtimes.
                    </p>
                  </div>

                  <div className="px-8 lg:px-12 py-12 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Layers size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Quantization</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      FP8, INT8, AWQ, GPTQ, NVFP4. Test lower-precision variants against your quality floor to cut memory costs without losing accuracy.
                    </p>
                  </div>

                  {/* Row 2 */}
                  <div className="px-8 lg:px-12 py-12 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Database size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">KV cache</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      Paged KV cache, prefix caching, compression. Optimize cache for concurrent sessions. Measure memory usage under real conversational workloads.
                    </p>
                  </div>

                  <div className="px-8 lg:px-12 py-12 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Zap size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Streaming decode</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      Continuous batching, chunked prefill, speculative decoding. Tune generation for fluid conversation. Evaluate first-token latency and end-to-end time to response.
                    </p>
                  </div>

                  <div className="px-8 lg:px-12 py-12 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Server size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">GPU & serving</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      L4, L40S, A100, H100, B200. Compare hardware and concurrency. Find the exact configuration that delivers top quality at the lowest cost.
                    </p>
                  </div>

                </div>
                
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* Try this pipeline Section */}
            <div className="w-full relative z-10 py-24">
              <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div className="border-r border-dashed border-[#333]" />
            <div className="flex flex-col items-center">
              <h2 className="text-[56px] md:text-[64px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
                Try this pipeline
              </h2>
              <p className="text-[#c7c3b7] text-[22px] font-sans leading-relaxed text-center max-w-2xl mb-16 mx-auto">
                Edit the model, engine, or GPU inline. Send to retune the stack in the dashboard.
              </p>

              {/* Pipeline Builder Component */}
              <div className="relative z-50 flex justify-center items-center mb-24 w-full h-[261px] overflow-hidden">
                {/* Animated Light Beams */}
                <div className="absolute top-[0px] left-0 w-[40%] h-[1px] bg-gradient-to-r from-transparent via-[#558607] to-transparent animate-data-beam z-0" />
                <div className="absolute bottom-[0px] left-0 w-[40%] h-[1px] bg-gradient-to-r from-transparent via-[#558607] to-transparent animate-data-beam z-0" style={{ animationDelay: '6s' }} />

                {/* Decorative dashed lines SVG */}
                <div className="absolute inset-0 pointer-events-none z-[-1]">
                  <svg width="100%" height="261" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Horizontal lines spanning 100% */}
                    <line x1="0%" y1="62.5" x2="100%" y2="62.5" stroke="#2D2D2D" strokeDasharray="3 3" />
                    <line x1="0%" y1="16.5" x2="100%" y2="16.5" stroke="#2D2D2D" strokeDasharray="3 3" />
                    <line x1="0%" y1="247.5" x2="100%" y2="247.5" stroke="#2D2D2D" strokeDasharray="3 3" />
                    <line x1="0%" y1="201.5" x2="100%" y2="201.5" stroke="#2D2D2D" strokeDasharray="3 3" />

                    <line x1="0%" y1="253.5" x2="100%" y2="253.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                    <line x1="0%" y1="260.5" x2="100%" y2="260.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                    <line x1="0%" y1="0.5" x2="100%" y2="0.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                    <line x1="0%" y1="7.5" x2="100%" y2="7.5" stroke="#6E6E6E" strokeDasharray="3 3" />

                    {/* Left vertical lines perfectly aligned to an 822px centered element */}
                    <g style={{ transform: "translateX(calc(50% - 411px))" }}>
                      <line x1="0" y1="17.5" x2="0" y2="246.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      <line x1="-5" y1="15.5" x2="-5" y2="248.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      <line x1="-11" y1="17.5" x2="-11" y2="246.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                    </g>

                    {/* Right vertical lines perfectly aligned to an 822px centered element */}
                    <g style={{ transform: "translateX(calc(50% + 411px))" }}>
                      <line x1="0" y1="16.5" x2="0" y2="245.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      <line x1="6" y1="14.5" x2="6" y2="247.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      <line x1="11" y1="16.5" x2="11" y2="245.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                    </g>
                  </svg>
                </div>

                {/* Actual Composer inside the dashed boundary */}
                <div className="w-[822px] max-w-full relative z-10">
                  <TokenPromptInput fixedPromptIndex={12} hideHeader={true} showSuggestions={false} cardClassName="!bg-[#202020]" />
                </div>
              </div>

            </div>
              <div className="border-l border-dashed border-[#333]" />
            </div>
            {/* Bottom Horizontal Border */}
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />
          </div>

        {/* FAQ Section */}
        <div className="w-full relative z-10 py-24 flex flex-col items-center px-4">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-[#f2efe8] mb-4 text-center">
            Common <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">questions</span>
          </h2>
          <p className="text-[#C8C7BA] text-[16px] mb-16 text-center max-w-lg">
            Everything you need to know about deploying and operating personal AI assistants.
          </p>

          <div className="w-full max-w-3xl flex flex-col">
            {FAQ_DATA.map((faq, idx) => (
              <div key={idx} className="flex flex-col border-b border-dashed border-[#333] py-8">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span className={`text-[18px] font-medium transition-colors ${activeFaq === idx ? 'text-[#F0EFE2]' : 'text-[#C8C7BA] group-hover:text-[#F0EFE2]'}`}>
                    {faq.question}
                  </span>
                  <div className={`w-6 h-6 rounded-full border border-[#333] flex items-center justify-center transition-all ${activeFaq === idx ? 'bg-[#75bf00] border-[#75bf00] text-black rotate-180' : 'bg-transparent text-[#C8C7BA] group-hover:border-[#666]'}`}>
                    <ChevronDown size={14} strokeWidth={2} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === idx ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <p className="text-[#C8C7BA] text-[15px] leading-relaxed pr-8">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <GlobalFooter />
      </main>
    </div>
  );
}



