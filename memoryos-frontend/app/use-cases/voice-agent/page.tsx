"use client";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { AIAssistantGrid } from "@/components/landing/ai-assistant-grid";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";
import { EcosystemGrid } from "@/components/landing/ecosystem-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { VoiceOrb } from "@/components/ui/voice-orb";
import { TokenPromptInput } from "@/components/dhyra/primitives/token-prompt-input";
import { DhyraLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, AuthorMonogram, KimiLogo, DhyraWordmarkLogo, AnthropicLogo, GithubLogo } from "@/components/dhyra/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2 } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "Latency",
    runInfra: { title: "Sub-600ms guaranteed", desc: "Fused STT->LLM->TTS on a single GPU node. Lowest possible pipeline latency." },
    closed: { title: "API-dependent", desc: "Network hops between VAD, transcription, and TTS endpoints add 1000ms+ delay." },
    diy: { title: "Hard to optimize", desc: "Stringing together separate Docker containers results in huge I/O bottlenecks." }
  },
  {
    num: "0 2",
    label: "Model control",
    runInfra: { title: "Bring any weights", desc: "Swap Whisper for Deepgram, Llama for Qwen, or XTTS for Cartesia. Full visibility." },
    closed: { title: "Locked ecosystem", desc: "You use whatever speech and text models the provider forces you into." },
    diy: { title: "Your models", desc: "Full control, but you have to build the WebRTC routing and queues yourself." }
  },
  {
    num: "0 3",
    label: "Tuning",
    runInfra: { title: "GPU-level optimization", desc: "Tune KV cache, chunk sizes, and batching to squeeze every millisecond." },
    closed: { title: "Opaque", desc: "No access to lower-level inference optimization. Latency is out of your hands." },
    diy: { title: "Manual profiling", desc: "Your team spends months profiling audio buffers and CUDA kernels." }
  },
  {
    num: "0 4",
    label: "Export",
    runInfra: { title: "Managed now, export when needed", desc: "Start with our managed endpoints, then take the entire WebRTC infra stack in-house." },
    closed: { title: "Locked endpoint", desc: "You keep calling the provider. No export exists." },
    diy: { title: "Already owned", desc: "You built the entire pipeline, so you own the mess." }
  },
  {
    num: "0 5",
    label: "Operations",
    runInfra: { title: "Low until you choose to own it", desc: "Operate managed, then export with the same measured plan." },
    closed: { title: "Low, with lock-in", desc: "Less infra work, less production control." },
    diy: { title: "High", desc: "You own the WebRTC servers, GPU failures, scaling, and upgrades." }
  }
];


const OUTCOME_CODE = `import { IntentEngine, OutcomeContract } from "@dhyra/runtime"

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
# serve.sh - High-Performance Dhyra Voice Agent Runner
# Environment variables for sub-600ms duplex latency
export CUDA_VISIBLE_DEVICES=0
export VLLM_ATTENTION_BACKEND=FLASH_ATTN
export WEBRTC_AUDIO_CODEC=OPUS_48KHZ
export VAD_SILENCE_THRESHOLD_MS=250

# Launch unified multi-modal serving stack
exec python3 -m dhyra.voice_agent.serve \\
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
    container_name: dhyra-voice-agent
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

const REQUIREMENTS_CODE = `# Production requirements for Dhyra Voice Agent Runtime
torch==2.4.0+cu124
vllm==0.6.2
faster-whisper==1.0.3
TTS==0.22.0
aiortc==1.9.0
silero-vad==5.1
numpy==1.26.4
pydantic==2.9.2`;

const README_CODE = `# Dhyra Voice Agent Runtime

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
  { id: "meta-llama/Llama-4-Maverick", name: "Llama 4 Maverick", author: "Meta", downloads: "400B MoE", tag: "MoE" },
  { id: "meta-llama/Llama-4-Scout", name: "Llama 4 Scout", author: "Meta", downloads: "109B MoE", tag: "MoE" },
  { id: "meta-llama/Llama-3.3-70B", name: "Llama 3.3 70B", author: "Meta", downloads: "70B", tag: "LLM" },
  { id: "meta-llama/Llama-3.1-70B", name: "Llama 3.1 70B", author: "Meta", downloads: "70B", tag: "LLM" },
  { id: "meta-llama/Llama-3.1-8B", name: "Llama 3.1 8B", author: "Meta", downloads: "8B", tag: "LLM" },
  { id: "meta-llama/Llama-3.2-3B", name: "Llama 3.2 3B", author: "Meta", downloads: "3B", tag: "Edge LLM" },
  { id: "meta-llama/Llama-3.2-1B", name: "Llama 3.2 1B", author: "Meta", downloads: "1B", tag: "Edge LLM" },
  { id: "NousResearch/Hermes-3-Llama-3.1-8B", name: "Hermes 3 (Llama 3.1 8B)", author: "Nous Research", downloads: "8B", tag: "LLM" },
  { id: "Qwen/Qwen-2.5-72B", name: "Qwen 2.5 72B", author: "Alibaba", downloads: "72B", tag: "LLM" }
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
  if (a.includes('nvidia') || m.includes('nvfp4')) return <NvidiaLogo size={20} />;
  if (a.includes('moonshot') || m.includes('kimi')) return <KimiLogo size={20} />;
  if (a.includes('coqui') || a.includes('canopy')) return <span className="text-[18px]">🤗</span>;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('mistral') || m.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;

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
  const [activeTab, setActiveTab] = useState("RunInfra");
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
        <div className="w-full h-full grid grid-cols-[14%_72%_14%]">
          {/* Left margin (14%) with 7% line bisecting it */}
          <div className="relative border-r border-dashed border-[#333]">
            <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#333]" />
          </div>
          {/* Center content (72%) */}
          <div />
          {/* Right margin (14%) with 93% line bisecting it */}
          <div className="relative border-l border-dashed border-[#333]">
            <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#333]" />
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
        <div className="w-full relative mt-20 mb-20 overflow-hidden">
          {/* Infinite Horizontal Lines bounding the hero section */}
          <div className="absolute bottom-0 left-0 w-full h-px border-t border-dashed border-[#333] z-0" />

          {/* Crosshairs at exact intersections with the global vertical lines */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="w-full h-full grid grid-cols-[14%_72%_14%]">
              <div className="relative">
                {/* 7% crosshair */}
                <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                {/* 14% crosshair */}
                <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] translate-y-[1px]" />
              </div>
              <div />
              <div className="relative">
                {/* 86% crosshair (left edge of right margin) */}
                <div className="absolute bottom-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                {/* 93% crosshair */}
                <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="w-full grid grid-cols-[14%_72%_14%] py-24 md:py-32 relative z-10">
            <div />
            <div className="min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-4">
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
                    Voice agents at sub-<span className="bg-[#75bf00] text-black px-2.5 py-0.5 inline-block font-bold rounded-[2px]">600ms</span><br />
                    on a single GPU.
                  </h1>
                  <p className="text-[#C8C7BA] text-[16px] tracking-wide max-w-lg mt-2 leading-relaxed font-sans">
                    Streaming STT, LLM, and TTS on one open stack.
                  </p>
                  <div className="flex items-center gap-4 mt-6">
                    <button className="group bg-[#75bf00] text-black px-5 py-2.5 text-[14px] font-normal hover:bg-[#85cf00] transition-colors rounded-none flex items-center gap-1.5">
                      Deploy this pipeline <ChevronRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="group bg-transparent text-[#94a3b8] border border-[#333] px-5 py-2.5 text-[14px] font-normal hover:bg-[#1a1a1a] transition-colors rounded-none flex items-center gap-1.5">
                      Read the stack <ChevronRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
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
          <div className="w-full grid grid-cols-[14%_72%_14%]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-16 px-4">
                <h2 className="text-[40px] md:text-[56px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4">
                  What you actually own
                </h2>
                <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed max-w-2xl mx-auto">
                  The optimization knobs, the codebase, the model choice. None of it locked away.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Grid with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10">
            {/* Borders */}
            <div className="absolute top-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />
            <div className="absolute bottom-0 left-0 w-full h-px border-t border-dashed border-[#333] z-20" />

            {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-full grid grid-cols-[14%_72%_14%] relative">
                {/* Left Margin relative wrapper */}
                <div className="relative h-full">
                  {/* Masking strip to hide single global background line under the border */}
                  <div className="absolute top-[10px] bottom-[10px] right-[-1px] w-[2px] bg-[#151515] z-10" />
                  {/* Double Vertical Border Left (outer line on 14% borderline, inner line pushed inside 10px) */}
                  <div className="absolute top-[10px] bottom-[10px] right-[-10px] w-[10px] border-l border-r border-dashed border-[#333] z-20" />

                  {/* Top Crosshairs */}
                  <div className="absolute top-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute top-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
                  {/* Bottom Crosshairs */}
                  <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                  <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] translate-y-[1px]" />
                </div>

                <div />

                {/* Right Margin relative wrapper */}
                <div className="relative h-full">
                  {/* Masking strip to hide single global background line under the border */}
                  <div className="absolute top-[10px] bottom-[10px] left-[-1px] w-[2px] bg-[#151515] z-10" />
                  {/* Double Vertical Border Right (outer line on 86% borderline, inner line pushed inside 10px) */}
                  <div className="absolute top-[10px] bottom-[10px] left-[-10px] w-[10px] border-l border-r border-dashed border-[#333] z-20" />

                  {/* Top Crosshairs */}
                  <div className="absolute top-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute top-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                  {/* Bottom Crosshairs */}
                  <div className="absolute bottom-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                  <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-[14%_72%_14%]">
              <div />
              <div className="min-w-0 mx-[10px] border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Card 1 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">0 1</div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2] leading-tight">Tune every knob.</h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      Kernels, quantization, KV cache, speculation, serving config. The agent sweeps every stage and surfaces the trade-offs.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-16 min-h-[300px] bg-[#151515] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">0 2</div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2] leading-tight">Own the codebase.</h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      Dockerfile, serve script, weights, and config. Yours the day you sign up. Run managed or on your own GPUs.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">0 3</div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2] leading-tight">Bring supported<br />models.</h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      Paste a Hugging Face model ID. The agent checks modality and backend support, then applies the compatible tuning path for that model.
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
          <div className="flex flex-col items-center mb-16 px-4">
            <h2 className="text-[40px] md:text-[56px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
              Three ways to ship voice agents
            </h2>
            <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed text-center max-w-2xl">
              Most teams pick between speed and control. Dhyra keeps both in one workflow.
            </p>
          </div>
          <div className="w-full relative z-10">
            {/* Top Border */}
            <div className="absolute top-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />
            <div className="absolute bottom-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />

            {/* Inner Vertical Lines matching the 14% columns */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="hidden md:block absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
              <div className="hidden md:block absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
            </div>

            <div className="w-full grid grid-cols-[14%_72%_14%]">
              <div />
              <div className="min-w-0 border-l border-r border-dashed border-[#333] flex flex-col">

                {/* Header Row */}
                <div className="flex flex-col md:flex-row items-stretch border-b border-dashed border-[#333]">
                  {/* Col 1: Label */}
                  <div className="w-full md:w-1/4 p-6 flex items-end border-r-0 md:border-r border-dashed border-[#333]">
                    <span className="text-[#C8C7BA] font-bold text-[10px] tracking-[0.15em] uppercase">What Matters</span>
                  </div>

                  {/* Col 2: RunInfra (Recommended) */}
                  <div className="w-full md:w-1/4 p-6 border-r-0 md:border-r border-dashed border-[#333] flex flex-col gap-2 relative bg-[#75bf00]/[0.02]">
                    <span className="absolute top-4 right-4 text-[#75bf00] font-bold text-[8px] tracking-[0.2em] uppercase">Recommended</span>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-[#1a1a1a] p-1 border border-[#333] rounded">
                        <DhyraLogo size={14} />
                      </div>
                      <span className="text-[#F0EFE2] text-[19px] font-medium tracking-tight">Dhyra</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[13px] leading-relaxed">WebRTC edge streaming with bare-metal model control.</p>
                  </div>

                  {/* Col 3: Closed API */}
                  <div className="w-full md:w-1/4 p-6 border-r-0 md:border-r border-dashed border-[#333] flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Key size={16} className="text-[#C8C7BA]" />
                      <span className="text-[#F0EFE2] text-[18px] font-medium tracking-tight">Closed voice APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[13px] leading-relaxed">Per-call, hosted.</p>
                  </div>

                  {/* Col 4: DIY */}
                  <div className="w-full md:w-1/4 p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu size={16} className="text-[#C8C7BA]" />
                      <span className="text-[#F0EFE2] text-[18px] font-medium tracking-tight">DIY self-hosting</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[13px] leading-relaxed">Full control, heavy operations.</p>
                  </div>
                </div>

                {/* Data Rows */}
                {COMPARISON_ROWS.map((row, idx) => (
                  <div
                    key={idx}
                    className="group flex flex-col md:flex-row items-stretch border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors cursor-default"
                  >
                    {/* Col 1: Label */}
                    <div className="w-full md:w-1/4 p-6 flex items-start justify-between border-r-0 md:border-r border-dashed border-[#333] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-[#75bf00] font-mono text-[11px] font-bold tracking-widest">{row.num}</span>
                        <span className="text-[#F0EFE2] text-[17px] font-medium group-hover:text-[#75bf00] transition-colors">{row.label}</span>
                      </div>
                      <ChevronRight size={16} className="text-[#75bf00] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300 mt-0.5" />
                    </div>

                    {/* Col 2: RunInfra */}
                    <div className="w-full md:w-1/4 p-6 border-r-0 md:border-r border-dashed border-[#333] flex flex-col gap-2">
                      <span className="text-[#75bf00] text-[17px] font-medium transition-colors">{row.runInfra.title}</span>
                      <p className="text-[#C8C7BA] text-[15px] leading-relaxed group-hover:text-[#F0EFE2] transition-colors">{row.runInfra.desc}</p>
                    </div>

                    {/* Col 3: Closed API */}
                    <div className="w-full md:w-1/4 p-6 border-r-0 md:border-r border-dashed border-[#333] flex flex-col gap-2">
                      <span className="text-[#F0EFE2] text-[17px] font-medium group-hover:text-[#75bf00] transition-colors">{row.closed.title}</span>
                      <p className="text-[#C8C7BA] text-[15px] leading-relaxed group-hover:text-[#F0EFE2] transition-colors">{row.closed.desc}</p>
                    </div>

                    {/* Col 4: DIY */}
                    <div className="w-full md:w-1/4 p-6 flex flex-col gap-2">
                      <span className="text-[#F0EFE2] text-[17px] font-medium group-hover:text-[#75bf00] transition-colors">{row.diy.title}</span>
                      <p className="text-[#C8C7BA] text-[15px] leading-relaxed group-hover:text-[#F0EFE2] transition-colors">{row.diy.desc}</p>
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

          {/* Heading for Sandbox */}
          <div className="w-full grid grid-cols-[14%_72%_14%] pt-16 mb-16">
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
          <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-[#333] z-20" />

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">



            {/* Sandbox Content Container (SVG Skeleton Architecture) */}
            <div className="w-full relative mx-auto max-w-[1351px]" style={{ aspectRatio: '1351 / 892' }}>

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
                    <div className={`bg-[#1a1a1a] border border-[#252525] p-5 rounded-[4px] transition-all duration-500 transform ${visibleStep >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                      <p className="text-[#C8C7BA] text-[13px] leading-relaxed flex flex-wrap items-center gap-1.5">
                        Optimize
                        <span className="flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA]"><OpenAILogo size={11} /> Whisper Large V3</span>
                        +
                        <span className="flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA]"><MetaLogo size={11} /> Llama 3.2 3B</span>
                        on
                        <span className="flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA]"><VLLMLogo size={11} /> vLLM-Omni</span>
                        for RTF and streaming latency
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
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-6 flex flex-col gap-4 overflow-y-auto pointer-events-auto">
                  <div className="flex justify-between items-center border-b border-[#252525] pb-3 mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase">GENERATED KERNELS</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">3</span>
                  </div>

                  <div className="flex flex-col gap-1 text-[13px] font-mono">
                    {/* Generated Kernels */}
                    <button
                      onClick={() => selectFileManually("flash_attention.cu")}
                      className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "flash_attention.cu"
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
                      className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "mel_fusion.cu"
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
                      className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "streaming_decode.cu"
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
                        <ChevronDown size={14} className="text-[#777]" /> dhyra-voice-agent/
                      </div>
                      <div className="pl-3 flex flex-col gap-1 border-l border-[#252525] ml-3 mt-0.5">
                        <button
                          onClick={() => selectFileManually("serve.sh")}
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "serve.sh"
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
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "pipeline.json"
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
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "outcome.ts"
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
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "Dockerfile"
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
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "docker-compose.yml"
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
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "requirements.txt"
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
                          className={`flex items-center gap-2 px-3 py-1.5 transition-all w-full text-left rounded-[4px] relative ${activeFile === "README.md"
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
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-y-auto pointer-events-auto">
                  {/* Editor top tabs */}
                  <div className="flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto">
                    <button
                      onClick={() => selectFileManually("outcome.ts")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "outcome.ts" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      outcome.ts
                    </button>
                    <button
                      onClick={() => selectFileManually("flash_attention.cu")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "flash_attention.cu" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      flash_attention.cu
                    </button>
                    <button
                      onClick={() => selectFileManually("mel_fusion.cu")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "mel_fusion.cu" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      mel_fusion.cu
                    </button>
                    <button
                      onClick={() => selectFileManually("streaming_decode.cu")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "streaming_decode.cu" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      streaming_decode.cu
                    </button>
                    <button
                      onClick={() => selectFileManually("serve.sh")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "serve.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      serve.sh
                    </button>
                    <button
                      onClick={() => selectFileManually("pipeline.json")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
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
          <div className="absolute bottom-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />



          {/* Feature Cards aligned with vertical grid lines */}
          <div className="w-full grid grid-cols-[14%_72%_14%] relative z-10">
            <div />
            {/* Added top horizontal line per user request */}
            <div className="absolute top-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />

            <div className="min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                {/* Card 1 */}
                <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                  <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Cloud size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-medium text-[#F0EFE2]">Managed RunInfra</h3>
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

        {/* Hugging Face Catalog Section */}
        <div className="w-full relative z-10 pt-24 pb-16">
          <div className="absolute top-0 left-0 w-full h-px border-t border-dashed border-[#333]" />
          <div className="w-full grid grid-cols-[14%_72%_14%]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#F0EFE2] mb-4 text-center">
                Supported HF chat models work
              </h2>
              <p className="text-[#C8C7BA] text-[15px] font-mono leading-relaxed text-center max-w-2xl mb-12">
                Supported chat-capable models on Hugging Face run through the compatible recipe. Search the live catalog above. The examples below are just a starting view.
              </p>

              {/* Search Bar */}
              <div className="w-full max-w-2xl mb-16 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#C8C7BA]">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any voice-compatible model on Hugging Face"
                  className="w-full bg-[#1a1a1a] border border-dashed border-[#333] text-[#C8C7BA] text-[15px] pl-11 pr-14 py-3.5 rounded-[4px] outline-none focus:border-[#555] transition-colors font-sans placeholder:text-[#666]"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-[10px] font-bold text-[#C8C7BA] border border-dashed border-[#333] px-1.5 py-0.5 rounded-sm">HF</span>
                </div>
              </div>

              {/* Models Grid */}
              <div className="w-full border-t border-dashed border-[#333]">
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
                        <div className="flex flex-col gap-1">
                          <h3 className="text-[20px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>{model.name}</h3>
                          <span className="text-[#C8C7BA] text-[15px] line-clamp-1" title={model.author}>{model.author}</span>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4">
                          <span className="text-[#F0EFE2] font-medium">{model.downloads}</span>
                          <span className="text-[#75bf00] text-[12px] font-medium border border-[#2a381a] px-2 py-1 rounded-sm tracking-wide">{model.tag}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Bottom Horizontal Border */}
                <div className="w-full h-px border-t border-dashed border-[#333]" />
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* What RunInfra tunes Section */}
        <div className="w-full relative z-10 pt-24 pb-16">
          <div className="absolute top-0 left-0 w-full h-px border-t border-dashed border-[#333]" />
          <div className="w-full grid grid-cols-[14%_72%_14%]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#F0EFE2] mb-4 text-center">
                What RunInfra tunes
              </h2>
              <p className="text-[#C8C7BA] text-[15px] font-sans leading-relaxed text-center max-w-2xl mb-16">
                Every stage of the pipeline, retuned per model and GPU.
              </p>

              {/* Tunes Grid */}
              <div className="w-full border-t border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">

                  {/* Row 1 */}
                  <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Cpu size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Kernel sweep</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      FlashAttention, FlashInfer, Marlin, custom fusion. Correctness + speedup gates on every rewrite.
                    </p>
                  </div>

                  <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Layers size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Quantization</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      FP8, AWQ, GPTQ, HQQ, INT8 SmoothQuant, NVFP4. Quality scored against your accuracy floor.
                    </p>
                  </div>

                  <div className="px-12 py-20 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Database size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">KV cache</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      FP8, INT4, and TurboQuant 3-4 bit KV compression. 60 to 75% VRAM savings.
                    </p>
                  </div>

                  {/* Row 2 */}
                  <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Zap size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Speculative decoding</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      EAGLE3, MTP, n-gram lookup, draft model. 1.3 to 2x decode speedup, weights untouched.
                    </p>
                  </div>

                  <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Sliders size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Serving config</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      Continuous batching, chunked prefill, PagedAttention, prefix cache. Tuned across vLLM, SGLang, TensorRT-LLM.
                    </p>
                  </div>

                  <div className="px-12 py-20 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Cloud size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Multi-cloud capacity</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      Pareto GPU selection across L4 to B200. Managed or exportable.
                    </p>
                  </div>

                </div>
                {/* Bottom Horizontal Border */}
                <div className="w-full h-px border-t border-dashed border-[#333]" />
              </div>
            </div>
            <div />
          </div>
          {/* Full-width Bottom Border with Light Beam */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] overflow-hidden">
            <div className="absolute inset-0 border-t border-dashed border-[#333]" />
            <div className="absolute top-0 left-0 w-[40%] h-[1px] bg-gradient-to-r from-transparent via-[#558607] to-transparent animate-data-beam" />
          </div>
        </div>

        {/* Try this pipeline Section */}
        <div className="w-full relative z-10 py-24">
          <div className="absolute top-0 left-0 w-full h-px border-t border-dashed border-[#333]" />
          <div className="w-full grid grid-cols-[14%_72%_14%]">
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
          <div className="absolute bottom-0 left-0 w-full h-px border-t border-dashed border-[#333]" />
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

        {/* --- DIVIDER --- */}
        <div className="w-full relative flex items-center justify-center my-8 z-10 overflow-hidden" style={{ height: "38px" }}>
          {/* Custom SVG 5-Line Divider from User */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="paint0_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#75BF00" />
                <stop offset="0.480769" stopColor="#333333" />
              </linearGradient>
              <linearGradient id="paint1_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0.110577" stopColor="#333333" />
                <stop offset="0.586538" stopColor="#75BF00" />
                <stop offset="1" stopColor="#333333" />
              </linearGradient>
              <linearGradient id="paint2_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0.423077" stopColor="#333333" />
                <stop offset="0.942308" stopColor="#75BF00" />
                <stop offset="1" stopColor="#333333" />
              </linearGradient>
              <linearGradient id="paint3_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#75BF00" />
                <stop offset="1" stopColor="#333333" />
              </linearGradient>
            </defs>
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="url(#paint0_linear_55_3)" strokeDasharray="3 3" />
            <line x1="0" y1="8.5" x2="100%" y2="8.5" stroke="url(#paint1_linear_55_3)" strokeDasharray="3 3" />
            <line x1="0" y1="16.5" x2="100%" y2="16.5" stroke="#333333" strokeDasharray="3 3" />
            <line x1="0" y1="24.5" x2="100%" y2="24.5" stroke="url(#paint2_linear_55_3)" strokeDasharray="3 3" />
            <line x1="0" y1="32.5" x2="100%" y2="32.5" stroke="url(#paint3_linear_55_3)" strokeDasharray="3 3" />
          </svg>
          {/* Center Logo Cutout */}
          <div className="bg-[#151515] px-4 py-2 text-[#F0EFE2] relative z-20 flex items-center justify-center">
            <DhyraLogo size={25} />
          </div>
        </div>

        {/* --- FOOTER CONTENT --- */}
        <div className="w-[88%] md:w-[72%] mx-auto py-16 flex flex-col relative z-10">
          {/* Top Footer Row */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0 pb-16 px-8 lg:px-12">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="mb-2 text-[#F0EFE2]">
                <DhyraWordmarkLogo className="h-[24px] w-auto" />
              </div>
              <p className="text-[#63625C] text-[15px] mb-6 font-medium">© 2026 dhyraInfra. All rights reserved.</p>

              {/* Social Icons */}
              <div className="flex items-center gap-4 mb-8 text-[#C8C7BA]">
                <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="GitHub">
                  <GithubLogo size={18} />
                </a>
                <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="X (Twitter)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                </a>
                <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 bg-[#222] hover:bg-[#2a2a2a] text-[#C8C7BA] px-3.5 py-2 rounded-[6px] transition-colors border border-[#333]">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                  <span className="text-[12px] font-medium tracking-tight">Join the community</span>
                </button>
                <button className="flex items-center gap-2 bg-[#222] hover:bg-[#2a2a2a] text-[#C8C7BA] px-3.5 py-2 rounded-[6px] transition-colors border border-[#333]">
                  <div className="w-1.5 h-1.5 bg-[#75bf00] rounded-full" />
                  <span className="text-[12px] font-medium tracking-tight">System status</span>
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col items-end">
              {/* Nav Links */}
              <div className="flex flex-col items-end gap-3 mb-10 w-full">
                <div className="flex items-center gap-x-6">
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Intelligence Agent</a>
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Capability Fabric</a>
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Pricing</a>
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Enterprise</a>
                </div>
                <div className="flex items-center gap-x-6">
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Benchmarks</a>
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Docs</a>
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Research</a>
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">News</a>
                  <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Contact</a>
                </div>
              </div>

              {/* Ask AI about Dhyra */}
              <div className="flex flex-col items-end">
                <span className="text-[#F0EFE2] font-bold text-[11px] mb-3">Ask AI about Dhyra</span>
                <div className="flex items-center gap-4 text-[#C8C7BA]">
                  <OpenAILogo size={18} className="text-[#00a67e] hover:brightness-125 transition-all cursor-pointer" />
                  <AnthropicLogo size={18} className="text-[#d97757] hover:brightness-125 transition-all cursor-pointer" />
                  <GoogleLogo size={18} className="text-[#4285f4] hover:brightness-125 transition-all cursor-pointer" />
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors cursor-pointer">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                  <div className="w-[18px] h-[18px] border-[1.5px] border-current rounded-full flex items-center justify-center text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors cursor-pointer">
                    <div className="w-1.5 h-1.5 bg-current rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal / Theme Row */}
        <div className="w-full border-t border-dashed border-[#333] relative">
          {/* Tiny DHYRA text aligned to the left of the 14% grid line */}
          <div className="absolute top-1/2 -translate-y-1/2 right-[86%] mr-6 text-[#555] text-[9px] font-bold tracking-[0.2em] z-10 hidden md:block">DHYRA</div>

          <div className="w-[88%] md:w-[72%] mx-auto py-4 px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center relative z-10">
            <div className="flex flex-wrap items-center gap-5 text-[11px] font-medium text-[#777] mb-4 md:mb-0">
              <span className="flex items-center gap-1.5 text-[#F0EFE2] font-bold mr-12"><DhyraLogo className="h-[40px] w-auto" /></span>
              <a href="#" className="hover:text-[#F0EFE2] transition-colors">Security</a>
              <a href="#" className="hover:text-[#F0EFE2] transition-colors">DPA</a>
              <a href="#" className="hover:text-[#F0EFE2] transition-colors">AUP</a>
              <a href="#" className="hover:text-[#F0EFE2] transition-colors">Cookies</a>
              <a href="#" className="hover:text-[#F0EFE2] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#F0EFE2] transition-colors">Privacy</a>
            </div>

            <div className="flex items-center gap-2 text-[#666]">
              <button className="p-1.5 rounded-[6px] hover:text-[#F0EFE2] hover:bg-[#222] transition-colors">
                <Sun size={15} />
              </button>
              <button className="p-1.5 rounded-[6px] bg-[#1a1a1a] text-[#F0EFE2] border border-[#333] transition-colors">
                <Monitor size={15} />
              </button>
              <button className="p-1.5 rounded-[6px] hover:text-[#F0EFE2] hover:bg-[#222] transition-colors">
                <Moon size={15} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


