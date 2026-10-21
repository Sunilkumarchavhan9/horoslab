"use client";

import { GlobalFooter } from "@/components/landing/global-footer";
import { SectionDivider } from "@/components/landing/section-divider";
import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { DocumentAIGrid } from "@/components/landing/document-ai-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, AnthropicLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, Ai2Logo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Zap, Loader2, ScanSearch, ImageIcon, FileText, Video } from "lucide-react";

const COMPARISON_ROWS: Array<{
  num: string;
  label: string;
  runInfra: { title: string; desc: React.ReactNode };
  closed: { title: string; desc: React.ReactNode };
  diy: { title: string; desc: React.ReactNode };
}> = [
  {
    num: "0 1",
    label: "System",
    runInfra: {
      title: "One multimodal system.",
      desc: "Connect models, inputs, context, runtime, and compute."
    },
    closed: {
      title: "Hosted model endpoint.",
      desc: "Integrate the provider API."
    },
    diy: {
      title: "Build the full stack.",
      desc: "Manage models, serving, and infrastructure."
    }
  },
  {
    num: "0 2",
    label: "Models",
    runInfra: {
      title: "Choose open models.",
      desc: (
        <>
          Compare{" "}
          <a
            href="https://huggingface.co/Qwen"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[#75bf00] transition-colors"
          >
            Qwen3.5
          </a>
          ,{" "}
          <a
            href="https://huggingface.co/Qwen/Qwen3-VL-235B-A22B-Instruct"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[#75bf00] transition-colors"
          >
            Qwen3-VL
          </a>
          , and supported audio-video models against your tasks.
        </>
      )
    },
    closed: {
      title: "Provider model catalog.",
      desc: "Use available multimodal models."
    },
    diy: {
      title: "Manage model weights.",
      desc: "Handle compatibility, versions, and serving."
    }
  },
  {
    num: "0 3",
    label: "Context",
    runInfra: {
      title: "Connect modalities.",
      desc: "Relate text, images, speech, video frames, and timestamps."
    },
    closed: {
      title: "Send supported inputs.",
      desc: "Context handling depends on the API."
    },
    diy: {
      title: "Build cross-modal context.",
      desc: "Manage synchronization and state yourself."
    }
  },
  {
    num: "0 4",
    label: "Capabilities",
    runInfra: {
      title: "Compose multimodal skills.",
      desc: "Combine visual understanding, speech, audio perception, and video analysis."
    },
    closed: {
      title: "Use exposed capabilities.",
      desc: "Features vary by provider."
    },
    diy: {
      title: "Integrate separate models.",
      desc: "Build the orchestration layer."
    }
  },
  {
    num: "0 5",
    label: "Workload",
    runInfra: {
      title: "Profile real inputs.",
      desc: "Measure image resolution, audio duration, video length, and concurrency."
    },
    closed: {
      title: "Track API usage.",
      desc: "Measure requests, latency, and provider costs."
    },
    diy: {
      title: "Instrument every modality.",
      desc: "Track preprocessing, inference, and GPU use."
    }
  },
  {
    num: "0 6",
    label: "Optimization",
    runInfra: {
      title: "Tune the complete pipeline.",
      desc: "Optimize resolution, frame sampling, context length, batching, and quantization."
    },
    closed: {
      title: "Tune exposed settings.",
      desc: "Internal serving controls remain provider-dependent."
    },
    diy: {
      title: "Optimize every layer.",
      desc: "Profile runtimes, memory, and GPU utilization."
    }
  },
  {
    num: "0 7",
    label: "Verification",
    runInfra: {
      title: "Test cross-modal understanding.",
      desc: "Evaluate grounding, temporal consistency, and task accuracy against your data."
    },
    closed: {
      title: "Run independent evaluations.",
      desc: "Test provider outputs against your requirements."
    },
    diy: {
      title: "Build your benchmarks.",
      desc: "Maintain datasets, evaluators, and regression tests."
    }
  },
  {
    num: "0 8",
    label: "Experience",
    runInfra: {
      title: "Preserve multimodal evidence.",
      desc: "Link inputs, model versions, outputs, errors, and observed outcomes."
    },
    closed: {
      title: "Connect API logs.",
      desc: "Maintain application-level records."
    },
    diy: {
      title: "Track experiment lineage.",
      desc: "Correlate model, input, and result versions."
    }
  },
  {
    num: "0 9",
    label: "Teaching",
    runInfra: {
      title: "Improve from observed failures.",
      desc: "Use corrected labels, difficult examples, and verified outcomes to improve future model versions."
    },
    closed: {
      title: "Use supported customization.",
      desc: "Training options depend on the provider."
    },
    diy: {
      title: "Build the learning loop.",
      desc: "Manage data, adaptation, training, and evaluation."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    runInfra: {
      title: "Control data and execution.",
      desc: "Govern access to sensitive media, credentials, budgets, and downstream actions."
    },
    closed: {
      title: "Apply provider and app controls.",
      desc: "Manage data access and tool permissions."
    },
    diy: {
      title: "Own security controls.",
      desc: "Implement access policies, auditing, and approvals."
    }
  }
];


const MULTIMODAL_CODE = `# Multimodal ingestion: image, video, audio, and text reasoning in one pipeline.
from openai import OpenAI
from vision_encoder import process_visual_inputs
from audio_processor import process_audio_waveform
from grounding import localize_spatial_and_temporal
from embed_index import upsert_multimodal_record

client = OpenAI(base_url="http://localhost:8000/v1")

def process_multimodal_request(media_path: str, prompt: str) -> dict:
    """Full multimodal pipeline: Vision encode + Audio align + VLM reason + Grounding."""
    # Preprocess high-res images, video frames, or audio streams
    inputs = process_visual_inputs(media_path)
    audio_data = process_audio_waveform(media_path)
    
    response = client.chat.completions.create(
        model="qwen3-vl-30b-instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": inputs.data_uri}},
                {"type": "audio", "input_audio": {"data": audio_data.base64, "format": "wav"}},
            ]
        }],
        temperature=0.2,
        max_tokens=2048,
    )
    
    # Extract spatial bounding boxes and temporal audio-video timestamps
    grounding = localize_spatial_and_temporal(media_path, response.choices[0].message.content)
    upsert_multimodal_record(media_path, response, grounding)
    return {
        "analysis": response.choices[0].message.content,
        "spatial_boxes": grounding.get("bounding_boxes", []),
        "temporal_segments": grounding.get("temporal_segments", []),
        "latency_ms": response.usage.completion_tokens_time
    }

def stream_multimodal_reasoning(media_stream, prompt):
    """Live cross-modal video stream path, tokens every ~25ms."""
    for chunk in client.chat.completions.create(
        model="qwen3-vl-30b-instruct",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    ):
        yield chunk.choices[0].delta.content`;

const TEMPORAL_ALIGN_CODE = `# Audio-visual temporal alignment: synchronize 30fps frames with 16kHz speech streams.
from typing import List, Dict
import numpy as np

def align_audio_video_timeline(video_frames: List, audio_samples: np.ndarray, fps: float = 30.0) -> Dict:
    """Correlate visual frame sequence with acoustic waveform events."""
    timeline = []
    frame_duration_ms = 1000.0 / fps
    
    for idx, frame in enumerate(video_frames):
        timestamp_start = idx * frame_duration_ms
        timestamp_end = (idx + 1) * frame_duration_ms
        
        # Extract concurrent audio energy and phonetic tokens
        audio_chunk = slice_audio_window(audio_samples, timestamp_start, timestamp_end)
        timeline.append({
            "frame_idx": idx,
            "timestamp_ms": timestamp_start,
            "audio_intensity_db": calculate_rms(audio_chunk),
            "interleaved_token_pos": idx * 64
        })
        
    return {"aligned_timeline": timeline, "total_duration_s": len(video_frames) / fps}

def extract_temporal_event_tags(content: str) -> List[Dict]:
    """Parse <time>HH:MM:SS</time> markers generated by multimodal reasoning."""
    return parse_timestamp_intervals(content)`;

const OCR_PARSER_CODE = `# High-resolution 4K document OCR and structured table parser.
from typing import Dict, List

def parse_document_page(image_path: str, vlm_output: str) -> Dict:
    """Extract Markdown tables, LaTeX equations, and bounding polygon boxes."""
    return {
        "tables": extract_markdown_tables(vlm_output),
        "equations": extract_latex_blocks(vlm_output),
        "reading_order_text": format_linear_text(vlm_output),
        "metadata": {"resolution": "3840x2160", "source": image_path}
    }`;

const SERVE_CODE = `#!/usr/bin/env bash
# High-throughput multimodal serving engine (Vision + Audio + Text)
set -euo pipefail

MODEL="Qwen/Qwen3-VL-30B-A3B-Instruct"
GPU="nvidia-l40s"

python -m vllm.entrypoints.openai.api_server \\
  --model "$MODEL" \\
  --served-model-name "qwen3-vl-30b-instruct" \\
  --limit-mm-per-prompt '{"image": 16, "video": 4, "audio": 2}' \\
  --max-model-len 32768 \\
  --tensor-parallel-size 1 \\
  --gpu-memory-utilization 0.92 \\
  --enable-prefix-caching \\
  --kv-cache-dtype auto`;

const PIPELINE_CODE = `{
  "name": "unified-multimodal-pipeline",
  "model": "qwen3-vl-30b-instruct",
  "modalities": ["image", "video", "audio", "document", "text"],
  "vision_encoder": "fused-vit-4k",
  "audio_encoder": "conformer-whisper-v3",
  "target_ttft_ms": 175,
  "batch_throughput_tok_s": 168,
  "gpu": "nvidia-l40s",
  "engine": "vllm-multimodal",
  "features": [
    "dynamic-visual-token-packing",
    "prefix-caching",
    "spatial-grounding-2d-3d",
    "temporal-audio-video-alignment",
    "dense-4k-doc-ocr"
  ]
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base

RUN apt-get update && apt-get install -y \\
    python3.11 python3-pip ffmpeg libsm6 libxext6 libsndfile1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY multimodal_pipeline.py temporal_align.py grounding.py ocr_parser.py serve.sh pipeline.json .

EXPOSE 8000
ENTRYPOINT ["/app/serve.sh"]`;

const GROUNDING_CODE = `# Spatial and temporal cross-modal grounding sidecar.
from typing import List, Dict

def localize_spatial_and_temporal(media_path: str, reasoning_text: str) -> Dict:
    """Extract bounding boxes and timestamps correlated with model reasoning."""
    boxes = []
    # Parse 2D bounding boxes [ymin, xmin, ymax, xmax] normalized to 1000
    for match in parse_coordinate_tags(reasoning_text):
        boxes.append({
            "label": match.label,
            "bbox": match.coords,
            "confidence": match.score
        })
    # Parse temporal timestamps: <time>00:14.2</time>
    timestamps = parse_temporal_tags(reasoning_text)
    return {"bounding_boxes": boxes, "temporal_segments": timestamps}

def parse_coordinate_tags(text: str) -> list:
    """Extract <ref>...</ref><box>...</box> tokens generated by Qwen3-VL."""
    return extract_vision_grounding(text)`;

const DOCKER_COMPOSE_CODE = `version: "3.8"

services:
  multimodal-engine:
    build: .
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - VLLM_ATTENTION_BACKEND=FLASHINFER
    volumes:
      - ./schemas:/app/schemas
      - huggingface_cache:/root/.cache/huggingface

volumes:
  huggingface_cache:`;

const REQUIREMENTS_CODE = `torch>=2.4.0
vllm>=0.6.3
transformers>=4.46.0
accelerate>=0.34.0
opencv-python-headless>=4.10.0
pillow>=10.4.0
soundfile>=0.12.1
librosa>=0.10.2
pydantic>=2.9.0
flashinfer>=0.1.6`;

const README_CODE = `# Horos Multimodal AI Pipeline

Unified vision-language, audio-speech, and cross-modal reasoning runtime powered by Qwen3-VL-30B and Cosmos3-Nano.

## Capabilities
- High-resolution 4K document understanding & dense OCR parsing
- Interleaved audio-visual temporal alignment & speech chunking
- Spatial 2D/3D object grounding with normalized bounding boxes
- Sub-180ms TTFT running on single NVIDIA L40S GPU`;

const INPUT_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MultimodalInputSchema",
  "type": "object",
  "properties": {
    "media_type": { "type": "string", "enum": ["image", "video", "audio", "document"] },
    "source_url": { "type": "string", "format": "uri" },
    "resolution": { "type": "string" },
    "temporal_duration_s": { "type": "number" },
    "system_prompt": { "type": "string" }
  },
  "required": ["media_type", "source_url"]
}`;

const GROUNDING_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GroundingBoxSchema",
  "type": "object",
  "properties": {
    "label": { "type": "string" },
    "bbox_2d": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 4,
      "maxItems": 4
    },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
  },
  "required": ["label", "bbox_2d", "confidence"]
}`;

const OCR_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DocumentOCRSchema",
  "type": "object",
  "properties": {
    "page_index": { "type": "integer" },
    "tables": { "type": "array" },
    "equations": { "type": "array" },
    "markdown_content": { "type": "string" }
  },
  "required": ["page_index", "markdown_content"]
}`;

const TEMPORAL_ALIGN_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "TemporalAlignmentEvent",
  "type": "object",
  "properties": {
    "start_timestamp_s": { "type": "number" },
    "end_timestamp_s": { "type": "number" },
    "modality": { "type": "string", "enum": ["speech", "audio_cue", "visual_action"] },
    "event_label": { "type": "string" },
    "confidence": { "type": "number" }
  },
  "required": ["start_timestamp_s", "end_timestamp_s", "event_label"]
}`;

type MultimodalAIFile = string;

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
    } else if (lang === "python") {
      const parts = content.split(/(\bimport\b|\bfrom\b|\bdef\b|\breturn\b|"[^"]*"|'[^']*'|"""[\s\S]*?""")/);
      lineContent = parts.map((part, pi) => {
        if (["import", "from", "def", "return"].includes(part)) {
          return <span key={pi} className="text-[#a855f7] font-semibold">{part}</span>;
        }
        if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'")) || part.startsWith('"""')) {
          return <span key={pi} className="text-[#75bf00]">{part}</span>;
        }
        return part;
      });
    } else if (lang === "bash" || lang === "dockerfile") {
      const parts = content.split(/(\bFROM\b|\bRUN\b|\bWORKDIR\b|\bCOPY\b|\bEXPOSE\b|\bENTRYPOINT\b|\bset\b|\bpython\b|"[^"]*")/);
      lineContent = parts.map((part, pi) => {
        if (["FROM", "RUN", "WORKDIR", "COPY", "EXPOSE", "ENTRYPOINT", "set", "python"].includes(part)) {
          return <span key={pi} className="text-[#3b82f6] font-semibold">{part}</span>;
        }
        if (part.startsWith("--") || part.startsWith("-")) {
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
          <span className="w-[3px] h-[14px] bg-[#75bf00] animate-pulse inline-block mr-2 rounded-full shrink-0 align-middle" />
        ) : (
          <span className="w-[3px] h-[14px] bg-transparent inline-block mr-2 shrink-0" />
        )}

        <span className="flex-1 whitespace-pre">{lineContent}</span>

        {/* Flickering green block cursor at the end position */}
        {isCurrentActiveLine && !isComplete && (
          <span className="inline-block w-[6px] h-[14px] bg-[#75bf00] animate-pulse ml-1 align-middle shrink-0" />
        )}
        {i === totalLines - 1 && isComplete && (
          <span className="inline-block w-[6px] h-[14px] bg-[#75bf00] animate-pulse ml-1 align-middle shrink-0" />
        )}
      </div>
    );
  });
}

const DEFAULT_MODELS = [
  {
    id: "Qwen/Qwen3-Omni-30B-A3B-Instruct",
    name: "Qwen3-Omni-30B-A3B-Instruct",
    author: "Qwen",
    downloads: "30B MoE",
    tag: "Omni-modal",
    description: "Text, images, audio and video",
    link: "https://huggingface.co/Qwen/Qwen3-Omni-30B-A3B-Instruct"
  },
  {
    id: "google/gemma-4-12B",
    name: "Gemma 4 12B",
    author: "Google",
    downloads: "12B",
    tag: "Audio + Vision",
    description: "Unified audio and visual understanding",
    link: "https://huggingface.co/google/gemma-4-12B"
  },
  {
    id: "Qwen/Qwen3.5-27B",
    name: "Qwen3.5-27B",
    author: "Qwen",
    downloads: "27B",
    tag: "Reasoning",
    description: "Text, image and video reasoning",
    link: "https://huggingface.co/Qwen/Qwen3.5-27B"
  },
  {
    id: "nvidia/Cosmos3-Super",
    name: "Cosmos3-Super",
    author: "NVIDIA",
    downloads: "64B",
    tag: "World Model",
    description: "Physical-world modeling and prediction",
    link: "https://huggingface.co/nvidia/Cosmos3-Super"
  },
  {
    id: "Qwen/Qwen3-VL-30B-A3B-Instruct",
    name: "Qwen3-VL-30B-A3B-Instruct",
    author: "Qwen",
    downloads: "30B MoE",
    tag: "Video",
    description: "Video, spatial and visual grounding",
    link: "https://huggingface.co/Qwen/Qwen3-VL-30B-A3B-Instruct"
  },
  {
    id: "google/gemma-4-E4B",
    name: "Gemma 4 E4B",
    author: "Google",
    downloads: "4.5B effective",
    tag: "Efficient",
    description: "Efficient audio, image and text workloads",
    link: "https://huggingface.co/google/gemma-4-E4B"
  },
  {
    id: "nvidia/Cosmos3-Nano",
    name: "Cosmos3-Nano",
    author: "NVIDIA",
    downloads: "16B",
    tag: "Physical AI",
    description: "Physical AI and world state prediction",
    link: "https://huggingface.co/nvidia/Cosmos3-Nano"
  },
  {
    id: "OpenGVLab/InternVL3_5-30B-A3B",
    name: "InternVL3.5-30B-A3B",
    author: "OpenGVLab",
    downloads: "30.8B total",
    tag: "Visual Reasoning",
    description: "Multimodal visual reasoning and instruction following",
    link: "https://huggingface.co/OpenGVLab/InternVL3_5-30B-A3B"
  },
  {
    id: "allenai/Molmo2-8B",
    name: "Molmo2-8B",
    author: "AllenAI",
    downloads: "8B",
    tag: "Video Grounding",
    description: "Open state-of-the-art multimodal video grounding",
    link: "https://huggingface.co/allenai/Molmo2-8B"
  }
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
  if (!author && !modelName) return <HuggingFaceLogo size={20} />;
  const a = (author || "").toLowerCase();
  const m = (modelName || "").toLowerCase();

  if (a.includes('google') || m.includes('gemma')) return <GoogleLogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('nvidia') || m.includes('nvfp4') || m.includes('cosmos')) return <NvidiaLogo size={20} />;
  if (a.includes('openai') || m.includes('whisper') || m.includes('gpt')) return <OpenAILogo size={20} />;
  if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('moonshot') || m.includes('kimi')) return <KimiLogo size={20} />;
  if (a.includes('coqui') || a.includes('canopy')) return <span className="text-[18px]">🤗</span>;
  if (a.includes('useful sensors') || a.includes('usefulsensors')) return <img src="https://cdn-avatars.huggingface.co/v1/production/uploads/6509fc8d11afda55cae0b2e7/6tyQ-L7VxHMOSKIOff09A.png" alt="Useful Sensors" className="w-5 h-5 rounded-sm object-cover" />;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('mistral') || a.includes('intfloat') || m.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('baai')) return <BAAILogo size={20} />;
  if (a.includes('jina')) return <JinaLogo size={20} />;
  if (a.includes('mixedbread')) return <MixedbreadLogo size={20} />;
  if (a.includes('snowflake')) return <SnowflakeLogo size={20} />;
  if (a.includes('nomic')) return <NomicLogo size={20} />;
  if (a.includes('opengvlab') || a.includes('shanghai') || m.includes('internvl')) return <img src="https://cdn-avatars.huggingface.co/v1/production/uploads/64006c09330a45b03605bba3/FvdxiTkTqH8rKDOzGZGUE.jpeg" alt="OpenGVLab" className="w-5 h-5 rounded-sm object-cover" />;
  if (a.includes('allen') || a.includes('ai2') || m.includes('molmo')) return <Ai2Logo size={20} />;

  return <HuggingFaceLogo size={20} />;
};

const getBorderClasses = (index: number, total: number) => {
  let classes = "p-8 border-dashed border-[#333] flex flex-col gap-6 group hover:bg-[#1a1a1a]/50 transition-colors cursor-pointer relative overflow-hidden";

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
    question: "Can I run vision, audio, and reasoning models on the same GPU?",
    answer: "Yes. Horos co-locates multimodal vision-language models (such as Qwen 2.5-VL, InternVL 2.5, or Pixtral) alongside audio encoders and OCR parsing kernels on a single NVIDIA L40S or H100 GPU, eliminating inter-node network data serialization and reducing TTFT."
  },
  {
    question: "Which multimodal foundation models are supported out of the box?",
    answer: "Horos natively supports Qwen 2.5-VL (7B, 72B), InternVL 2.5, Mistral Pixtral 12B, Llama 3.2 Vision (11B, 90B), Google PaliGemma 2, DeepSeek-VL2, and Whisper-v3-Turbo for audio. Custom vision-encoder and projection-adapter architectures can be loaded directly from Hugging Face."
  },
  {
    question: "How do you optimize high-resolution 4K images and long video streams?",
    answer: "We use dynamic visual token packing, native 2D RoPE, and adaptive resolution scaling. Images and video frames are sliced into native aspect-ratio tiles without distortion or zero-padding waste, cutting visual token counts by up to 60% and enabling sub-200ms forward-pass latencies."
  },
  {
    question: "Does Horos support 2D/3D spatial grounding and object coordinate prediction?",
    answer: "Yes. Horos models output normalized bounding boxes [ymin, xmin, ymax, xmax], point coordinates, and polygonal segmentation masks. The runtime translates model token coordinates directly into pixel coordinates and spatial vector layers for downstream computer vision pipelines."
  },
  {
    question: "How does multimodal OCR and structured document extraction work?",
    answer: "Horos natively extracts hierarchical tables, dense formulas (LaTeX), and spatial form fields from complex scanned documents, architectural blueprints, and financial reports, returning strictly validated JSON schemas without requiring external OCR engines like Tesseract."
  },
  {
    question: "Can the multimodal pipeline be deployed on private VPCs or edge clusters?",
    answer: "Yes. The entire multimodal stack compiles into self-contained Docker containers and vLLM/TensorRT-LLM runtimes. It can be deployed on private AWS/GCP/Azure VPCs or edge appliances with complete air-gap compliance and zero outbound data transmission."
  }
];



export default function MultimodalAIPage() {
  const [activeTab, setActiveTab] = useState("Horos");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [activeFile, setActiveFile] = useState<MultimodalAIFile>("multimodal_pipeline.py");
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "multimodal_pipeline.py": MULTIMODAL_CODE,
    "temporal_align.py": TEMPORAL_ALIGN_CODE,
    "grounding.py": GROUNDING_CODE,
    "ocr_parser.py": OCR_PARSER_CODE,
    "serve.sh": SERVE_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE,
    "README.md": README_CODE,
    "multimodal_input.json": INPUT_SCHEMA,
    "grounding_box.json": GROUNDING_SCHEMA,
    "document_ocr.json": OCR_SCHEMA,
    "temporal_align.json": TEMPORAL_ALIGN_SCHEMA
  };

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "On it. I'll profile Qwen3-VL-30B on L40S, fuse multi-resolution vision patches and audio spectrogram tokens, wire temporal video-audio alignment and 2D/3D grounding sidecars, then index the multimodal outputs for hybrid retrieval.";
  const AGENT_MSG_2 = "Recipe is ready. Serving Qwen3-VL-30B with sub-180ms time-to-first-token and batch 34 req/s on L40S at $1.20/hr, with video grounding, audio-visual temporal alignment, 4K OCR parsing, and hybrid multimodal search in the same runtime. Ready to deploy?";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  const [isTypingCode, setIsTypingCode] = useState(true);
  const [typedCodeText, setTypedCodeText] = useState("");

  const selectFileManually = (file: MultimodalAIFile) => {
    setIsAutoPlay(false);
    setActiveFile(file);
    if (file === "pipeline.json") {
      setActiveMainTab("pipeline");
    } else if (file === "serve.sh") {
      setActiveMainTab("optimization");
    } else if (file === "Dockerfile") {
      setActiveMainTab("deploy");
    } else {
      setActiveMainTab("code");
    }
  };

  const handleMainTabClick = (tab: "pipeline" | "code" | "optimization" | "deploy") => {
    setActiveMainTab(tab);
    setIsAutoPlay(false);
    if (tab === "pipeline") {
      setActiveFile("pipeline.json");
    } else if (tab === "code") {
      setActiveFile("multimodal_pipeline.py");
    } else if (tab === "optimization") {
      setActiveFile("serve.sh");
    } else if (tab === "deploy") {
      setActiveFile("Dockerfile");
    }
  };

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || MULTIMODAL_CODE;

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

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isAutoPlay) return;

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
  }, [visibleStep, typedMsg1, typedMsg2, isAutoPlay]);

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
              if (m.pipeline_tag.includes("image-text-to-text") || m.pipeline_tag.includes("visual-question-answering")) tag = "Multimodal";
              else if (m.pipeline_tag.includes("document-question-answering")) tag = "Doc VQA";
              else if (m.pipeline_tag.includes("text-generation")) tag = "LLM";
              else if (m.pipeline_tag.includes("automatic-speech-recognition")) tag = "Audio-VL";
              else if (m.pipeline_tag.includes("image-to-text")) tag = "Vision";
              else tag = "Multimodal";
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
        .chat-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; transition: scrollbar-color 0.3s; }
        .chat-scroll:hover { scrollbar-color: #666666 transparent; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 4px; }
        .chat-scroll:hover::-webkit-scrollbar-thumb { background-color: #666666; }
        
        @keyframes noise-shift {
          0%, 100% { background-position: 0 0; }
          10% { background-position: -5% -10%; }
          20% { background-position: -15% 5%; }
          30% { background-position: 7% -25%; }
          40% { background-position: 20% 25%; }
          50% { background-position: -25% 10%; }
          60% { background-position: 15% 5%; }
          70% { background-position: 0% 15%; }
          80% { background-position: 25% 35%; }
          90% { background-position: -10% 10%; }
        }
        .animate-noise-shift {
          animation: noise-shift 0.2s steps(2) infinite;
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
        
        {/* SVG Filter for recoloring the hands to brand colors */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="brand-duotone">
            {/* Convert to grayscale using luminance */}
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0 0 0 1 0"
            />
            {/* Map grayscale values to #000000, #75BF00, and #E2EFC1 */}
            <feComponentTransfer colorInterpolationFilters="sRGB">
              <feFuncR type="table" tableValues="0.000 0.458 0.886" />
              <feFuncG type="table" tableValues="0.000 0.749 0.937" />
              <feFuncB type="table" tableValues="0.000 0.000 0.757" />
            </feComponentTransfer>
          </filter>
        </svg>

        {/* Background Image touching nav bottom dashed line */}
        <div className="absolute top-0 inset-x-0 z-0 overflow-hidden pointer-events-none flex justify-center opacity-70">
          <div className="relative w-[700px] h-[700px]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent z-10" />
            <img 
              src="/images/chameleon.webp"
              alt="Multimodal Intelligence Background"
              className="w-full h-full object-contain object-top mix-blend-screen"
              style={{ 
                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                filter: 'url(#brand-duotone)'
              }}
            />
          </div>
        </div>

        {/* Hero Section Container */}
        <div className="w-full relative mt-20 mb-20 min-h-[600px] flex items-center">
          {/* Infinite Horizontal Lines bounding the hero section */}
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />

          {/* Crosshairs at exact intersections with the global vertical lines */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="w-full h-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
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
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] py-24 md:py-32 relative z-10">
            <div />
            <div className="min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-4 md:px-8 lg:px-12">
                {/* Left: Content */}
                <div className="flex flex-col gap-5 max-w-xl">
                  <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-medium tracking-tight leading-[1.12] text-[#F0EFE2] mt-[-1rem]">
                    Text, vision, audio.<br />
                    One intelligence{" "}
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      system
                    </span>.
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Engineer open multimodal models to understand mixed inputs, connect information across modalities, and interpret video over time. Horos optimizes the complete system against your workload.
                  </p>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px] whitespace-nowrap shrink-0">
                      <span>Optimize multimodal system</span>
                      <ChevronRight size={16} className="transition-transform group-hover:translate-x-1 shrink-0" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px] whitespace-nowrap shrink-0">
                      <span>Explore stack</span>
                      <ChevronRight size={16} className="shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <DocumentAIGrid />
                </div>
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full relative z-10 mt-16">
          {/* Heading */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What you actually own</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Your multimodal models, input pipeline, and inference configuration. Horos helps you optimize how intelligence processes and connects information across modalities.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Grid with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10">
            {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative">
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

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0 mx-[10px] border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Card 1 */}
                  <div className="p-8 lg:p-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[14px] sm:text-[15px] font-bold">0 1</div>
                    <h3 className="text-xl md:text-2xl lg:text-[26px] font-medium text-[#F0EFE2] leading-snug">One model, multiple modalities.</h3>
                    <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] leading-relaxed">
                      Combine text, images, audio, and video with models such as Qwen3.5 and supported multimodal models. Measure which model handles your actual inputs best.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-8 lg:p-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[14px] sm:text-[15px] font-bold">0 2</div>
                    <h3 className="text-xl md:text-2xl lg:text-[26px] font-medium text-[#F0EFE2] leading-snug">Context across modalities.</h3>
                    <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] leading-relaxed">
                      Preserve relationships between speech, video frames, timestamps, and text. Evaluate whether the model connects what was said with what happened.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-8 lg:p-10 flex flex-col gap-3.5">
                    <div className="text-[#75bf00] font-mono text-[14px] sm:text-[15px] font-bold">0 3</div>
                    <h3 className="text-xl md:text-2xl lg:text-[26px] font-medium text-[#F0EFE2] leading-snug">Optimize the complete pipeline.</h3>
                    <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] leading-relaxed">
                      Tune input resolution, audio duration, frame sampling, context length, batching, and quantization. Compare quality, latency, memory, and GPU cost before deployment.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="w-full relative z-10 mt-32 mb-32">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="flex flex-col items-center mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">Three ways to deploy Multimodal AI
            </h2>
            <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
              Hosted APIs give you multimodal intelligence. DIY gives you control over the stack. Horos helps you engineer, optimize, and verify open multimodal models against your real workloads.
            </p>
          </div>

          {/* Table with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10 bg-[#151515]/20 pt-[25px] pb-[10px]">
            {/* Double Horizontal Border Top */}
            
            {/* Double Horizontal Border Bottom */}
            

            {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative">
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

            {/* Table Content */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-30">
              <div />
              <div className="min-w-0 bg-[#151515]">
                {/* Table Header */}
                <div className="grid grid-cols-1 md:grid-cols-4 border-t border-l border-r border-dashed border-[#333]">
                  <div className="hidden md:flex items-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8C7BA] uppercase">What Matters</span>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333] relative">
                    <div className="absolute top-2.5 right-3 flex items-center">
                      <span className="text-[8px] font-bold tracking-[0.15em] text-[#75bf00] uppercase">Recommended</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm shrink-0">
                        <HorosLogo size={16} />
                      </div>
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Horos</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Fast path with model control and export.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed multimodal APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Per-call, hosted.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">DIY self-hosting</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Full control, heavy operations.</p>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="border-l border-r border-b border-dashed border-[#333]">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <div key={idx} className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200">
                      <div className="flex items-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] min-h-[72px]">
                        <div className="flex items-center gap-3">
                          <span className="text-[#75bf00] font-mono text-[12px] font-bold">{row.num}</span>
                          <span className="text-[13px] sm:text-[13.5px] font-medium text-[#F0EFE2]">{row.label}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#75bf00] mb-1 leading-tight">{row.runInfra.title}</h4>
                        <p className="text-[#A0A098] text-[11.5px] sm:text-[12px] leading-relaxed font-sans">{row.runInfra.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#F0EFE2] mb-1 leading-tight">{row.closed.title}</h4>
                        <p className="text-[#A0A098] text-[11.5px] sm:text-[12px] leading-relaxed font-sans">{row.closed.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#F0EFE2] mb-1 leading-tight">{row.diy.title}</h4>
                        <p className="text-[#A0A098] text-[11.5px] sm:text-[12px] leading-relaxed font-sans">{row.diy.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] md:text-[15px] max-w-2xl mx-auto leading-relaxed text-center">
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
                    gridTemplateColumns: 'minmax(0, 41fr) minmax(0, 430fr) minmax(0, 240fr) minmax(0, 601fr) minmax(0, 39fr)',
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
                    gridTemplateColumns: 'minmax(0, 41fr) minmax(0, 430fr) minmax(0, 240fr) minmax(0, 601fr) minmax(0, 39fr)',
                    gridTemplateRows: '53.5fr 785fr 53.5fr'
                  }}>

                    {/* Tabs */}
                    <div className="col-start-2 col-end-5 row-start-1 row-end-2 flex items-center justify-between px-5 pointer-events-auto">
                      <div className="flex gap-6 sm:gap-8 h-full items-end pb-2">
                        <button
                          onClick={() => setActiveMainTab("pipeline")}
                          className={`flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeMainTab === "pipeline" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <span className="text-[#75bf00]">&gt;_</span> PIPELINE
                        </button>
                        <button
                          onClick={() => setActiveMainTab("code")}
                          className={`flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeMainTab === "code" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <Code2 size={12} /> CODE
                        </button>
                        <button
                          onClick={() => setActiveMainTab("optimization")}
                          className={`flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeMainTab === "optimization" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <Sliders size={12} /> OPTIMIZATION
                        </button>
                        <button
                          onClick={() => setActiveMainTab("deploy")}
                          className={`flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeMainTab === "deploy" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <Rocket size={12} /> DEPLOY
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={replayAnimation} title="Replay Animation">
                        <span className="w-2 h-2 rounded-full bg-[#75bf00] animate-pulse" />
                        <span className="text-[10px] font-bold text-[#75bf00] tracking-widest uppercase">Live</span>
                      </div>
                    </div>

                    {/* Chat Content */}
                    <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-4 sm:p-5 flex flex-col justify-between overflow-hidden pointer-events-auto">
                      <div className="flex flex-col gap-3.5 overflow-y-auto chat-scroll pr-1.5 pb-3">
                        <div className="bg-[#1a1a1a] border border-[#252525] p-3.5 rounded-[4px]">
                          <p className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-sans leading-[21px] sm:leading-[22px]">
                            Deploy open multimodal reasoning for video, audio, and documents.{" "}
                            <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10.5px] font-mono text-[#D4D3C9] align-middle mx-0.5">
                              <QwenLogo size={10} /> Qwen3-VL-30B
                            </span>{" "}
                            on{" "}
                            <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10.5px] font-mono text-[#75bf00] align-middle mx-0.5">
                              <NvidiaLogo size={10} /> 1x L40S
                            </span>. Add cross-modal grounding, OCR parsing, and hybrid multimodal search.
                          </p>
                        </div>

                        {/* Step 1: Agent Initial Ack */}
                        <div className={`flex gap-2.5 mt-1 transition-all duration-500 transform ${visibleStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                          <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                            {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length ? (
                              <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                            ) : (
                              <Sparkles size={12} className="text-[#75bf00]" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[9px] sm:text-[9.5px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                            <p className="text-[#C8C7BA] text-[11.5px] sm:text-[12.5px] leading-[19px] sm:leading-[22px]">
                              {typedMsg1}
                              {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length && (
                                <span className="inline-block w-1.5 h-3 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Logs list */}
                        <div className="flex flex-col gap-2 mt-1">
                          {/* Log 1 (Step 2) */}
                          <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 2 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Profiled Qwen3-VL-30B on L40S</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">1.4s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">sub-180ms TTFT, dynamic visual token packing</span>
                            </div>
                          </div>

                          {/* Log 2 (Step 3) */}
                          <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 3 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Fused multi-resolution ViT encoder</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">0.9s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">FlashAttention-3 across visual & text tokens</span>
                            </div>
                          </div>

                          {/* Log 3 (Step 4) */}
                          <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 4 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Wired cross-modal grounding sidecar</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">1.2s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">2D bounding boxes & temporal video segments</span>
                            </div>
                          </div>

                          {/* Log 4 (Step 5) */}
                          <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 5 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Compiled high-res OCR parser</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">0.8s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">markdown tables, LaTeX formulas, 4K docs</span>
                            </div>
                          </div>

                          {/* Log 5 (Step 6) */}
                          <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 6 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Indexed multimodal records for search</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">1.5s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">hybrid full-text + vision embeddings, on your stack</span>
                            </div>
                          </div>
                        </div>

                        {/* Step 7 (LAST STEP): Agent Final Summary */}
                        <div className={`flex gap-2.5 mt-1 transition-all duration-500 transform ${visibleStep >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                          <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                            {visibleStep === 7 && typedMsg2.length < AGENT_MSG_2.length ? (
                              <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                            ) : (
                              <Sparkles size={12} className="text-[#75bf00]" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[9px] sm:text-[9.5px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                            <p className="text-[#C8C7BA] text-[11.5px] sm:text-[12.5px] leading-[19px] sm:leading-[22px]">
                              {typedMsg2}
                              {visibleStep === 7 && typedMsg2.length < AGENT_MSG_2.length && (
                                <span className="inline-block w-1.5 h-3 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Prompt input bar */}
                      <div className="mt-1.5 shrink-0 mb-1">
                        <div className="bg-[#151515] border border-[#252525] rounded-[4px] p-2 flex flex-col gap-1.5">
                          <input
                            type="text"
                            placeholder="Ask the agent to tune visual token packing, frame sampling..."
                            className="bg-transparent text-[#F0EFE2] text-[11.5px] sm:text-[12.5px] border-none outline-none w-full px-1.5 py-1"
                            readOnly
                          />
                          <div className="flex justify-between items-center px-1">
                            <div className="flex gap-1">
                              <span className="bg-[#222] border border-[#333] text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@Capabilities</span>
                              <span className="bg-[#222] border border-[#333] text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@Outcomes</span>
                            </div>
                            <button className="w-5 h-5 bg-[#75bf00] hover:bg-[#85cf00] transition-colors flex items-center justify-center text-black font-bold rounded-sm">
                              <ArrowUp size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Files Content */}
                    <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-4 sm:p-5 flex flex-col items-start gap-3 overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                      <div className="flex justify-between items-center border-b border-[#252525] pb-2 mb-1 w-full">
                        <span className="text-[9.5px] font-bold tracking-widest text-[#C8C7BA] uppercase">PIPELINE MODULES</span>
                        <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm">5</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] sm:text-[11.5px] font-mono w-full">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                          grounding.py
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                          ocr_parser.py
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                          temporal_align.py
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                          multimodal_input.json
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                          grounding_box.json
                        </div>

                        {/* Project Tree Folder */}
                        <div className="mt-1.5 flex flex-col gap-1 w-full">
                          <div className="flex items-center gap-1.5 px-2 py-1 text-[#aaa] font-semibold text-[11.5px] truncate">
                            <ChevronDown size={13} className="text-[#777] shrink-0" /> horos-multimodal/
                          </div>
                          <div className="pl-3 flex flex-col gap-1 border-l border-[#252525] ml-3 mt-0.5">
                            <button
                              onClick={() => selectFileManually("multimodal_pipeline.py")}
                              className={`flex items-center gap-1.5 px-2 py-1 transition-colors w-full text-left rounded-[4px] truncate text-[11.5px] sm:text-[12px] ${activeFile === "multimodal_pipeline.py" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              multimodal_pipeline.py
                            </button>
                            <button 
                              onClick={() => selectFileManually("grounding.py")}
                              className={`flex items-center gap-1.5 px-2 py-1 transition-colors w-full text-left rounded-[4px] truncate text-[11.5px] sm:text-[12px] ${activeFile === "grounding.py" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              grounding.py
                            </button>
                            <button 
                              onClick={() => selectFileManually("serve.sh")}
                              className={`flex items-center gap-1.5 px-2 py-1 transition-colors w-full text-left rounded-[4px] truncate text-[11.5px] sm:text-[12px] ${activeFile === "serve.sh" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              serve.sh
                            </button>
                            <button 
                              onClick={() => selectFileManually("pipeline.json")}
                              className={`flex items-center gap-1.5 px-2 py-1 transition-colors w-full text-left rounded-[4px] truncate text-[11.5px] sm:text-[12px] ${activeFile === "pipeline.json" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              pipeline.json
                            </button>
                            <button 
                              onClick={() => selectFileManually("Dockerfile")}
                              className={`flex items-center gap-1.5 px-2 py-1 transition-colors w-full text-left rounded-[4px] truncate text-[11.5px] sm:text-[12px] ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              Dockerfile
                            </button>
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                              docker-compose.yml
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                              requirements.txt
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                              document_ocr.json
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[#555] truncate">
                              README.md
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-4 sm:p-5 flex flex-col justify-start overflow-hidden pointer-events-auto">
                      {/* Editor top tabs */}
                      <div className="flex border-b border-[#252525] mb-4 pb-1.5 pt-0.5 gap-1.5 overflow-x-auto hide-scrollbar thin-hover-scrollbar shrink-0">
                        <button
                          onClick={() => selectFileManually("multimodal_pipeline.py")}
                          className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "multimodal_pipeline.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          multimodal_pipeline.py
                        </button>
                        <button
                          onClick={() => selectFileManually("grounding.py")}
                          className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "grounding.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          grounding.py
                        </button>
                        <button
                          onClick={() => selectFileManually("serve.sh")}
                          className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "serve.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          serve.sh
                        </button>
                        <button
                          onClick={() => selectFileManually("pipeline.json")}
                          className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          pipeline.json
                        </button>
                        <button
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "Dockerfile" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          Dockerfile
                        </button>
                      </div>

                      {/* Code Area with Line Numbers */}
                      <div className="flex-1 overflow-auto chat-scroll thin-hover-scrollbar">
                        <div className="flex font-mono text-[12px] sm:text-[12.5px] leading-relaxed overflow-x-auto select-text thin-hover-scrollbar">
                          {/* Line numbers column */}
                          <div className="text-[#444] text-right pr-3.5 border-r border-[#252525] select-none flex flex-col min-w-[28px]">
                            {Array.from({ length: typedCodeText.split('\n').length }).map((_, i) => (
                              <div key={i} className="min-h-[22px] leading-[22px]">{i + 1}</div>
                            ))}
                          </div>

                          {/* Highlighted code column */}
                          <div className="pl-3.5 flex-1 text-[#C8C7BA] leading-[22px]">
                            {highlightCode(
                              typedCodeText,
                              activeFile.endsWith(".py")
                                ? "python"
                                : activeFile.endsWith(".sh")
                                  ? "bash"
                                  : activeFile.endsWith(".json")
                                    ? "json"
                                    : activeFile === "Dockerfile"
                                      ? "dockerfile"
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
              <div />
            </div>
          </div>

          {/* Features Grid Row */}
          <div className="w-full relative z-10 pb-20 md:pb-28">
            {/* Feature Cards aligned with vertical grid lines */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div className="border-r border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333]" />
              </div>
              {/* Added top horizontal line per user request */}
              <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cloud size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Managed Horos</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Our GPUs, per-million-tokens billing from L4 to B200.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Your infrastructure</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      AWS, GCP, RunPod, bare metal. Same verifier/, your cluster.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-8 py-16 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Local workstation</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      docker compose up. Full pipeline on a single GPU.
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-l border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333]" />
              </div>
            </div>
          </div>

          {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-24 pb-16">
            <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div className="border-r border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333]" />
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-3xl sm:text-4xl md:text-[40px] lg:text-[46px] xl:text-[50px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-none md:whitespace-nowrap leading-tight">
                  Supported HF speech models work
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                  Supported multimodal and omni-modal models on Hugging Face run through the compatible recipe. Search the live catalog above. The examples below are just a starting view.
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
                    placeholder="Search any multimodal model on Hugging Face"
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
                        <a
                          key={model.id}
                          href={model.link || (model.id.startsWith("http") ? model.id : `https://huggingface.co/${model.id}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={getBorderClasses(index, models.length)}
                        >
                          {/* Hover Noise Overlay */}
                          <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay">
                            <div className="absolute -inset-[100%] opacity-[0.25] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] animate-noise-shift" />
                          </div>

                          <ArrowUpRight size={20} className="text-[#75bf00] absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                          <div className="relative z-10 w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center bg-[#151515]">
                            {getLogo(model.author, model.name)}
                          </div>
                          <div className="relative z-10 flex flex-col gap-1 min-w-0">
                            <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>{model.name}</h3>
                            <span className="text-[#C8C7BA] text-[13.5px] line-clamp-1" title={model.author}>{model.author}</span>
                            {model.description && (
                              <p className="text-[#888] text-[13px] leading-relaxed line-clamp-2 mt-1" title={model.description}>{model.description}</p>
                            )}
                          </div>
                          <div className="relative z-10 flex justify-between items-center mt-auto pt-4 gap-2">
                            <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0">{model.downloads}</span>
                            <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">{model.tag}</span>
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="border-l border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333]" />
              </div>
            </div>
          </div>

          {/* Tuning Section */}
        <div className="w-full relative z-10 mt-20">
          {/* Heading */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What Horos tunes</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Every stage of the pipeline, retuned per model and GPU.
                </p>

                {/* Tunes Grid */}
                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Row 1 */}
                    <div className="px-7 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <ImageIcon size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Vision token reduction</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Tune image resolution, crop count, patch density, and visual token budgets in Qwen3-VL and compatible models. Measure accuracy against prefilling cost and GPU memory.
                      </p>
                    </div>

                    <div className="px-7 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <Video size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Video frame selection</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Sweep frame rates, clip lengths, and sampling strategies. Preserve brief events and motion cues while reducing redundant frames and visual tokens.
                      </p>
                    </div>

                    <div className="px-7 py-10 border-b border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <Mic size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Audio chunking and alignment</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Tune audio chunk duration, streaming windows, and timestamp handling for supported audio-capable models. Measure transcription or perception quality alongside latency.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-7 py-10 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <Cpu size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Encoder and attention kernels</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Profile vision encoders, attention kernels, and tensor layouts. Benchmark supported FlashAttention and fused operations against the model's baseline on each GPU.
                      </p>
                    </div>

                    <div className="px-7 py-10 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Quantization and serving</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Compare supported BF16, FP16, FP8, and weight quantization paths. Tune batching, KV cache, concurrency, and memory allocation against quality, throughput, and cost.
                      </p>
                    </div>

                    <div className="px-7 py-10 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <ShieldCheck size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Cross-modal regression tests</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Replay fixed image, audio, and video workloads after each change. Compare task accuracy, timestamp alignment, missed events, latency, peak memory, and cost before promoting a version.
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
                <h2 className="text-[56px] md:text-[64px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">Try this pipeline</h2>
                <p className="text-[#c7c3b7] text-[22px] font-sans leading-relaxed text-center max-w-2xl mb-16 mx-auto">
                  Edit the model, engine, or GPU inline. Send to retune the stack in the dashboard.
                </p>

                {/* Pipeline Builder Component */}
                <div className="relative z-50 flex justify-center items-center mb-24 w-full h-[261px]">
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
                    <TokenPromptInput fixedPromptIndex={1} hideHeader={true} showSuggestions={false} cardClassName="!bg-[#202020]" />
                  </div>
                </div>

              </div>
              <div className="border-l border-dashed border-[#333]" />
            </div>
            {/* Bottom Horizontal Border */}
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />
          </div>

          {/* FAQ Section */}
          <div className="w-full relative z-10">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              {/* Left Column Margin */}
              <div className="border-r border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333]" />
              </div>

              {/* Center Column: FAQ Content */}
              <div className="py-20 md:py-24 flex flex-col items-center px-4 md:px-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#f2efe8] mb-3 text-center">Common <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">questions</span></h2>
                <p className="text-[#C8C7BA] text-sm sm:text-base font-sans text-center mb-10">
                  Can&apos;t find what you&apos;re looking for? <a href="#" className="text-[#75bf00] hover:underline">Get in touch</a>
                </p>

                {/* Vertical Question Buttons */}
                <div className="flex flex-col items-center gap-2.5 w-full mb-10">
                  {FAQ_DATA.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveFaq(idx)}
                      className={`px-6 py-2.5 text-[15px] md:text-[16px] transition-colors text-center ${
                        activeFaq === idx
                          ? "bg-[#75bf00] text-black font-medium"
                          : "bg-[#1c1c1c] text-[#d4cfbf] hover:bg-[#252525] hover:text-[#f2efe8] font-normal"
                      }`}
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>

                {/* Horizontal Dashed Divider */}
                <div className="w-full max-w-3xl border-t border-dashed border-[#333] mb-10" />

                {/* Active FAQ Item with Icon and Text */}
                <div className="flex items-start gap-4 max-w-3xl w-full text-left">
                  <div className="mt-0.5 flex-shrink-0 text-[#f2efe8] bg-[#1c1c1c] border border-[#2a2a2a] rounded-full flex items-center justify-center h-10 w-10">
                    <HorosLogo size={20} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#f2efe8] mb-2 leading-snug">
                      {FAQ_DATA[activeFaq].question}
                    </h3>
                    <p className="text-[#C8C7BA] text-[15px] md:text-[16px] leading-relaxed">
                      {FAQ_DATA[activeFaq].answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column Margin */}
              <div className="border-l border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333]" />
              </div>
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="w-full relative z-10 py-32 flex flex-col items-center justify-center">
            <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
            {/* Container for precise 72% alignment with continuous dashed grid lines */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] absolute inset-0 pointer-events-none z-0 overflow-hidden">
              {/* Left Column Margin with Inner and Outer dashed lines */}
              <div className="border-r border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333]" />
              </div>

              {/* Center Column: Floating Brand Cubes INSIDE the inner dashed lines */}
              <div className="relative">
                {/* Floating Brand Cubes - Left Cluster (Inside) */}
                <div className="hidden md:flex absolute top-[48px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><DeepSeekLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[96px] left-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MetaLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[96px] left-[144px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><NvidiaLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[144px] left-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><GoogleLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[192px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MistralLogo size={20} /></div>

                {/* Floating Brand Cubes - Right Cluster (Inside) */}
                <div className="hidden md:flex absolute bottom-[240px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><SGLangLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[192px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><DeepSeekLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[144px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><QwenLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[144px] right-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MetaLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[96px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MistralLogo size={20} /></div>
              </div>

              {/* Right Column Margin with Inner and Outer dashed lines */}
              <div className="border-l border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333]" />
              </div>
            </div>

            <div className="relative z-20 flex flex-col items-center text-center max-w-4xl px-4 mt-8 pointer-events-auto">
              <div className="mb-12">
                <HorosLogo size={40} />
              </div>

              <h2 className="text-[48px] md:text-[64px] leading-[1.1] font-medium tracking-tight text-[#F0EFE2] mb-8">
                Deploy your first optimized<br className="hidden md:block" />
                model, <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">measured</span> before you<br className="hidden md:block" />
                ship
              </h2>

              <p className="text-[#a0a0a0] text-[18px] md:text-[20px] font-sans mb-12">
                Describe the goal. Horos builds and optimizes the stack.
              </p>

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
                <button className="h-[52px] px-8 bg-[#75bf00] hover:bg-[#8ade00] text-black font-semibold text-[15px] rounded-none transition-all duration-200 shadow-[0_0_20px_rgba(117,191,0,0.2)] hover:shadow-[0_0_30px_rgba(117,191,0,0.4)] flex items-center justify-center">
                  Start Building
                </button>
                <button className="h-[52px] px-8 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#F0EFE2] font-semibold text-[15px] rounded-none transition-all duration-200 flex items-center justify-center">
                  View Pricing
                </button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-4 w-full">
                <div className="flex items-center gap-2.5 text-[#C8C7BA] text-[14px] font-medium border border-[#333] rounded-sm px-5 py-3 bg-[#111]/80 backdrop-blur-md">
                  <Lock size={16} className="text-[#75bf00]" />
                  End-to-end encryption
                </div>
                <div className="flex items-center gap-2.5 text-[#C8C7BA] text-[14px] font-medium border border-[#333] rounded-sm px-5 py-3 bg-[#111]/80 backdrop-blur-md">
                  <Cpu size={16} className="text-[#75bf00]" />
                  Isolated GPU infrastructure
                </div>
                <div className="flex items-center gap-2.5 text-[#C8C7BA] text-[14px] font-medium border border-[#333] rounded-sm px-5 py-3 bg-[#111]/80 backdrop-blur-md">
                  <EyeOff size={16} className="text-[#75bf00]" />
                  No training on your data
                </div>
                <div className="flex items-center gap-2.5 text-[#C8C7BA] text-[14px] font-medium border border-[#333] rounded-sm px-5 py-3 bg-[#111]/80 backdrop-blur-md">
                  <ShieldCheck size={16} className="text-[#75bf00]" />
                  SOC 2 Type II
                </div>
              </div>
            </div>
          </div>
        </div>
        <GlobalFooter />
      </main>
    </div>
  );
}


