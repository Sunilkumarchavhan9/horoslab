"use client";

import { GlobalFooter } from "@/components/landing/global-footer";
import { SectionDivider } from "@/components/landing/section-divider";
import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { VisionAIGrid } from "@/components/landing/vision-ai-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, GLMLogo, OpenGVLabLogo, Ai2Logo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch, ImageIcon, FileText, Boxes } from "lucide-react";

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
        title: "One vision system.",
        desc: "Connect models, visual data, runtime, compute, and evaluation."
      },
      closed: {
        title: "Hosted vision endpoint.",
        desc: "Integrate the API into your application."
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
            <a
              href="https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[#75bf00] transition-colors"
            >
              Qwen3-VL-8B
            </a>{" "}
            for visual and video understanding;{" "}
            <a
              href="https://huggingface.co/nvidia/Cosmos3-Nano"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[#75bf00] transition-colors"
            >
              Cosmos3-Nano
            </a>{" "}
            for physical-world understanding and prediction.
          </>
        )
      },
      closed: {
        title: "Provider catalog.",
        desc: "Use available proprietary vision models."
      },
      diy: {
        title: "Own model serving.",
        desc: "Manage weights, versions, and compatibility."
      }
    },
    {
      num: "0 3",
      label: "Context",
      runInfra: {
        title: "Understand changing scenes.",
        desc: "Track objects, spatial relationships, motion, and events across frames."
      },
      closed: {
        title: "Provide visual inputs.",
        desc: "Context depends on supported API capabilities."
      },
      diy: {
        title: "Build temporal context.",
        desc: "Manage frame selection, tracking, and state yourself."
      }
    },
    {
      num: "0 4",
      label: "Capabilities",
      runInfra: {
        title: "Compose vision capabilities.",
        desc: "Combine detection, segmentation, tracking, scene understanding, and prediction."
      },
      closed: {
        title: "Use exposed vision features.",
        desc: "Capabilities vary by provider."
      },
      diy: {
        title: "Integrate separate models.",
        desc: "Manage perception and tracking components."
      }
    },
    {
      num: "0 5",
      label: "Workload",
      runInfra: {
        title: "Profile real inputs.",
        desc: "Measure image resolution, frame rate, clip length, and concurrency."
      },
      closed: {
        title: "Measure API usage.",
        desc: "Track requests, latency, and provider costs."
      },
      diy: {
        title: "Instrument the pipeline.",
        desc: "Measure preprocessing, inference, and GPU use."
      }
    },
    {
      num: "0 6",
      label: "Optimization",
      runInfra: {
        title: "Tune the full pipeline.",
        desc: "Compare model variants, resolution, frame sampling, precision, and batching."
      },
      closed: {
        title: "Tune exposed settings.",
        desc: "Internal serving controls remain provider-dependent."
      },
      diy: {
        title: "Profile every layer.",
        desc: "Optimize model execution and GPU utilization."
      }
    },
    {
      num: "0 7",
      label: "Verification",
      runInfra: {
        title: "Test against reality.",
        desc: "Compare detections, tracking, and predictions against labeled data and observed outcomes."
      },
      closed: {
        title: "Evaluate independently.",
        desc: "Test outputs against your own visual benchmarks."
      },
      diy: {
        title: "Build your benchmarks.",
        desc: "Maintain datasets, metrics, and regression tests."
      }
    },
    {
      num: "0 8",
      label: "Experience",
      runInfra: {
        title: "Preserve visual evidence.",
        desc: "Link observations, model versions, predictions, failures, and outcomes."
      },
      closed: {
        title: "Connect API logs.",
        desc: "Maintain application-level history yourself."
      },
      diy: {
        title: "Build experiment lineage.",
        desc: "Track outputs and deployment versions."
      }
    },
    {
      num: "0 9",
      label: "Teaching",
      runInfra: {
        title: "Improve from new evidence.",
        desc: "Use labels, corrections, rare events, and prediction errors to improve models and world understanding."
      },
      closed: {
        title: "Use available customization.",
        desc: "Training options depend on the provider."
      },
      diy: {
        title: "Build the learning pipeline.",
        desc: "Manage data, adaptation, training, and evaluation."
      }
    },
    {
      num: "1 0",
      label: "Authority",
      runInfra: {
        title: "Control access and actions.",
        desc: "Govern camera data, credentials, execution permissions, and approvals."
      },
      closed: {
        title: "Apply provider and app controls.",
        desc: "Manage access and downstream actions."
      },
      diy: {
        title: "Own security controls.",
        desc: "Implement permissions, auditing, and execution policies."
      }
    }
  ];


const TRACK_CODE = `# Vision AI Engine: Scene Understanding, Spatio-Temporal Tracking & Prediction
import torch
from horos_vision import (
    VisionPipelineAgent,
    SpatialGraphTracker,
    TemporalPredictor,
    SceneUnderstandingVerifier,
    StreamAuditor
)

# Connect open models: Qwen3-VL-8B for visual reasoning + Cosmos3-Nano for prediction
agent = VisionPipelineAgent.from_pretrained(
    vision_model="Qwen/Qwen3-VL-8B-Instruct",
    world_predictor="nvidia/Cosmos3-Nano",
    device="cuda",
    precision="fp16"
)

tracker = SpatialGraphTracker(tracking_policy="spatio-temporal-continuity")
predictor = TemporalPredictor(lookahead_frames=15)
verifier = SceneUnderstandingVerifier(strict_schema=True)
auditor = StreamAuditor(target_fps=30)

def track_and_understand_stream(video_stream_url: str) -> dict:
    """Ingest live camera video: track objects, spatial graphs, and predict events."""
    stream = auditor.ingest_stream(video_stream_url, sampling_rate="30fps")
    
    # Extract 3D spatial scene graph & track object velocities across frames
    scene_graph = tracker.build_scene_graph(stream)
    
    # Predict physical motion & temporal actions with Cosmos3-Nano
    future_events = predictor.predict_next_actions(scene_graph)
    
    # Mathematically verify spatial relationships and object permanence
    spatial_proof = verifier.verify_scene(scene_graph, future_events)
    
    if spatial_proof.is_valid:
        return {
            "status": "TRACKING_ACTIVE",
            "fps": auditor.measured_fps,
            "detected_entities": scene_graph.entities,
            "spatial_relationships": scene_graph.relations,
            "predicted_events": future_events,
            "proof_hash": spatial_proof.hash,
            "tracking_mota": 0.91
        }
    return None`;

const EVAL_CODE = `# Video benchmark harness: measuring understanding against real visual evidence
from horos_eval import VisionEvaluator, SpatialSafetyGate

def evaluate_vision_pipeline(dataset_manifest: str) -> dict:
    """Evaluate detections, spatial tracking, and temporal prediction against ground truth."""
    evaluator = VisionEvaluator(metrics=["mAP_50_95", "MOTA", "spatial_fidelity", "latency_p95"])
    safety_gate = SpatialSafetyGate(strict_object_permanence=True)
    
    # Benchmark open vision pipeline on 500-clip test set
    benchmark_report = evaluator.benchmark(
        dataset_manifest,
        vision_model="Qwen/Qwen3-VL-8B-Instruct",
        prediction_model="nvidia/Cosmos3-Nano"
    )
    
    # Verify spatial permanence proofs
    gate_passed = safety_gate.verify_proofs(benchmark_report["proof_hashes"])
    
    return {
        "mAP_50_95": benchmark_report["mAP"],
        "tracking_mota": benchmark_report["mota"],
        "temporal_consistency": benchmark_report["temporal_score"],
        "p95_latency_ms": benchmark_report["p95_latency_ms"],
        "fps_throughput": benchmark_report["fps"],
        "gate_passed": gate_passed
    };`;

const SERVE_CODE = `#!/usr/bin/env bash
# Deploy Vision AI pipeline: Qwen3-VL-8B & Cosmos3-Nano with vLLM & Horos runtime
set -euo pipefail

VISION_MODEL="Qwen/Qwen3-VL-8B-Instruct"
PREDICTOR_MODEL="nvidia/Cosmos3-Nano"
HOST="\${HOST:-0.0.0.0}"
PORT="\${PORT:-8000}"
TARGET_FPS="\${TARGET_FPS:-30}"

echo "[Horos Vision] Initializing multi-camera video streaming runtime..."
echo "[Horos Vision] Loading Qwen3-VL-8B (FP16 vision encoder + AWQ INT4 LLM head)..."
echo "[Horos Vision] Connecting Cosmos3-Nano temporal prediction head..."

exec python3 -m horos_vision.server \\
  --vision-model "$VISION_MODEL" \\
  --prediction-model "$PREDICTOR_MODEL" \\
  --stream-transport webrtc,rtsp \\
  --target-fps "$TARGET_FPS" \\
  --gpu-memory-utilization 0.85 \\
  --port "$PORT" \\
  --host "$HOST"`;

const PIPELINE_CODE = `{
  "name": "vision-ai-pipeline",
  "version": "2.4.0",
  "vision_system": "one-vision-runtime",
  "models": {
    "visual_understanding": "Qwen/Qwen3-VL-8B-Instruct",
    "world_prediction": "nvidia/Cosmos3-Nano"
  },
  "runtime": {
    "engine": "vllm-vision-tensorrt",
    "gpu": "nvidia-l40s",
    "precision": "fp16-awq4",
    "stream_transport": "webrtc-rtsp",
    "target_fps": 30,
    "max_concurrent_streams": 8
  },
  "tasks": [
    "object_detection_and_segmentation",
    "spatial_relationship_graph",
    "motion_and_velocity_tracking",
    "temporal_future_prediction"
  ],
  "verification": {
    "eval_engine": "horos-eval-v2",
    "target_mAP": 0.84,
    "target_MOTA": 0.91,
    "max_p95_latency_ms": 32.5
  }
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base

RUN apt-get update && apt-get install -y \\
    python3.11 \\
    python3-pip \\
    ffmpeg \\
    libgl1-mesa-glx \\
    libglib2.0-0 \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY schemas/ /app/schemas/
COPY track.py eval.py serve.sh pipeline.json .

EXPOSE 8000 8554
ENTRYPOINT ["/app/serve.sh"]`;

const DOCKER_COMPOSE_CODE = `version: "3.8"

services:
  vision-ai-stream:
    build: .
    ports:
      - "8000:8000"
      - "8554:8554"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - TARGET_FPS=30
      - STREAM_POLICY=zero-copy-cuda
    volumes:
      - ./schemas:/app/schemas
      - huggingface_cache:/root/.cache/huggingface

volumes:
  huggingface_cache:`;

const REQUIREMENTS_CODE = `torch>=2.4.0
vllm>=0.6.2
horos-vision>=2.4.0
horos-eval>=2.4.0
transformers>=4.45.0
opencv-python-headless>=4.10.0
pydantic>=2.9.0
av>=12.3.0`;

const README_CODE = `# Horos Vision AI

Real-time spatio-temporal video understanding and physical prediction pipeline powered by Qwen3-VL-8B and Cosmos3-Nano.

## Capabilities
- Multi-camera RTSP/WebRTC zero-copy stream ingestion
- 3D spatial scene graph extraction & velocity tracking
- Physical temporal prediction & future action forecasting
- Verified against ground-truth benchmarks (mAP: 0.84, MOTA: 0.91)`;

const DETECTION_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DetectionSchema",
  "type": "object",
  "properties": {
    "label": { "type": "string" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "bbox_3d": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 6,
      "maxItems": 6
    },
    "velocity_vector": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 3,
      "maxItems": 3
    }
  },
  "required": ["label", "confidence", "bbox_3d", "velocity_vector"]
}`;

const SPATIAL_GRAPH_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SpatialRelationshipGraph",
  "type": "object",
  "properties": {
    "timestamp_ms": { "type": "integer" },
    "nodes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "source": { "type": "string" },
          "relation": { "type": "string" },
          "target": { "type": "string" },
          "distance_m": { "type": "number" }
        },
        "required": ["source", "relation", "target"]
      }
    }
  },
  "required": ["timestamp_ms", "nodes", "edges"]
}`;

const MOTION_TRACK_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MotionTrackEvent",
  "type": "object",
  "properties": {
    "track_id": { "type": "string" },
    "trajectory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "frame_idx": { "type": "integer" },
          "x": { "type": "number" },
          "y": { "type": "number" },
          "z": { "type": "number" }
        }
      }
    },
    "predicted_next_action": { "type": "string" }
  },
  "required": ["track_id", "trajectory", "predicted_next_action"]
}`;

type VisionAIFile = string;

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
    } else if (lang === "markdown") {
      if (content.trim().startsWith("#")) {
        lineContent = <span className="text-[#75bf00] font-bold">{content}</span>;
      } else if (content.trim().startsWith("-") || content.trim().startsWith("*")) {
        lineContent = <span className="text-[#93c5fd]">{content}</span>;
      } else {
        lineContent = content;
      }
    } else if (lang === "yaml") {
      const colonIdx = content.indexOf(":");
      if (colonIdx !== -1) {
        lineContent = (
          <>
            <span className="text-[#93c5fd] font-medium">{content.slice(0, colonIdx)}</span>
            <span className="text-[#666]">:</span>
            <span className="text-[#75bf00]">{content.slice(colonIdx + 1)}</span>
          </>
        );
      } else {
        lineContent = content;
      }
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
  {
    id: "Qwen/Qwen3-VL-235B-A22B-Instruct",
    name: "Qwen3-VL-235B-A22B-Instruct",
    author: "Alibaba",
    downloads: "235B MoE",
    tag: "Spatial Reasoning",
    link: "https://huggingface.co/Qwen/Qwen3-VL-235B-A22B-Instruct"
  },
  {
    id: "nvidia/Cosmos3-Super",
    name: "Cosmos3-Super",
    author: "NVIDIA",
    downloads: "64B",
    tag: "World Model",
    link: "https://huggingface.co/nvidia/Cosmos3-Super"
  },
  {
    id: "zai-org/GLM-4.5V",
    name: "GLM-4.5V",
    author: "Z.ai",
    downloads: "106B MoE",
    tag: "Visual Reasoning",
    link: "https://huggingface.co/zai-org/GLM-4.5V"
  },
  {
    id: "OpenGVLab/InternVL3_5-241B-A28B-Instruct",
    name: "InternVL3.5-241B-A28B-Instruct",
    author: "OpenGVLab",
    downloads: "241B MoE",
    tag: "High-Resolution Vision",
    link: "https://huggingface.co/OpenGVLab/InternVL3_5-241B-A28B-Instruct"
  },
  {
    id: "Qwen/Qwen3-VL-30B-A3B-Instruct",
    name: "Qwen3-VL-30B-A3B-Instruct",
    author: "Alibaba",
    downloads: "30B MoE",
    tag: "Video Understanding",
    link: "https://huggingface.co/Qwen/Qwen3-VL-30B-A3B-Instruct"
  },
  {
    id: "nvidia/Cosmos3-Nano",
    name: "Cosmos3-Nano",
    author: "NVIDIA",
    downloads: "16B",
    tag: "Physical AI",
    link: "https://huggingface.co/nvidia/Cosmos3-Nano"
  },
  {
    id: "OpenGVLab/InternVL3_5-30B-A3B-Instruct",
    name: "InternVL3.5-30B-A3B-Instruct",
    author: "OpenGVLab",
    downloads: "30B MoE",
    tag: "Visual Understanding",
    link: "https://huggingface.co/OpenGVLab/InternVL3_5-30B-A3B-Instruct"
  },
  {
    id: "allenai/Molmo2-8B",
    name: "Molmo2-8B",
    author: "Allen Institute for AI",
    downloads: "8B",
    tag: "Video Grounding",
    link: "https://huggingface.co/allenai/Molmo2-8B"
  },
  {
    id: "Qwen/Qwen3-VL-8B-Instruct",
    name: "Qwen3-VL-8B-Instruct",
    author: "Alibaba",
    downloads: "8B",
    tag: "3D Grounding",
    link: "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct"
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

  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('nvidia') || m.includes('cosmos') || m.includes('nvfp4')) return <NvidiaLogo size={20} />;
  if (a.includes('z.ai') || a.includes('zhipu') || a.includes('zai') || m.includes('glm')) return <GLMLogo size={20} />;
  if (a.includes('opengvlab') || a.includes('shanghai') || m.includes('internvl')) return <OpenGVLabLogo size={20} />;
  if (a.includes('allen') || a.includes('ai2') || m.includes('molmo')) return <Ai2Logo size={20} />;
  if (a.includes('openai') || m.includes('whisper') || m.includes('gpt')) return <OpenAILogo size={20} />;
  if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('moonshot') || m.includes('kimi')) return <KimiLogo size={20} />;
  if (a.includes('coqui') || a.includes('canopy')) return <span className="text-[18px]">🤗</span>;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('mistral') || a.includes('intfloat') || m.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('baai')) return <BAAILogo size={20} />;
  if (a.includes('jina')) return <JinaLogo size={20} />;
  if (a.includes('mixedbread')) return <MixedbreadLogo size={20} />;
  if (a.includes('snowflake')) return <SnowflakeLogo size={20} />;
  if (a.includes('nomic')) return <NomicLogo size={20} />;

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
    question: "Can I run scene understanding and temporal prediction on the same GPU?",
    answer: "Yes. Our optimized pipeline schedules vision-language models like Qwen3-VL alongside physical world predictors like Cosmos3-Nano on a single L40S or H100 GPU, streaming spatio-temporal embeddings without inter-service latency.",
  },
  {
    question: "How do you handle real-time multi-camera video streaming?",
    answer: "We use zero-copy GPU video decoding (NVDEC) and dynamic frame sampling. High-motion segments are processed at full 30/60fps while static scenes throttle dynamically, keeping GPU memory and bandwidth strictly bounded across concurrent feeds.",
  },
  {
    question: "Do you support structured spatio-temporal JSON output?",
    answer: "Yes. Our pipelines enforce strict JSON schema decoding directly inside the serving engine, providing verified 2D/3D bounding boxes, velocity vectors, and relational scene graphs with sub-millisecond validation.",
  },
  {
    question: "How does Horos handle high-resolution 4K/8K images without downsampling loss?",
    answer: "We utilize dynamic patch tiling and adaptive aspect-ratio preservation optimized for frontier models like InternVL3.5-241B and GLM-4.5V. High-resolution frames are parallelized into vision tokens with fused cross-attention, capturing minute details without VRAM exhaustion.",
  },
  {
    question: "Can I perform 3D spatial grounding and camera coordinate prediction?",
    answer: "Yes. Open models like Qwen3-VL-8B and Qwen3-VL-235B natively output 3D oriented bounding boxes, depth-aware camera coordinate frames, and relational scene graphs. Horos validates geometric outputs directly against camera intrinsics in real time.",
  },
  {
    question: "How does long-form video grounding and temporal event localization work?",
    answer: "Using video grounding models like Molmo2-8B and Qwen3-VL-30B MoE, Horos streams sliding-window keyframe embeddings to pinpoint exact sub-second timestamps, actions, and object trajectories across hours of video footage without recompiling KV caches.",
  }
];



export default function VisionAIPage() {
  const [activeTab, setActiveTab] = useState("Horos");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [activeFile, setActiveFile] = useState<VisionAIFile>("track.py");
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "track.py": TRACK_CODE,
    "eval.py": EVAL_CODE,
    "serve.sh": SERVE_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE,
    "README.md": README_CODE,
    "detection.json": DETECTION_SCHEMA,
    "spatial_graph.json": SPATIAL_GRAPH_SCHEMA,
    "motion_track.json": MOTION_TRACK_SCHEMA
  };

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "Configuring Qwen3-VL-8B & Cosmos3-Nano on L40S with 30fps stream ingestion and a 500-clip tracking benchmark.";
  const AGENT_MSG_2 = "Pipeline ready. Streaming 30fps video at $0.004/min on L40S with 0.91 MOTA tracking, 3D spatial graphs, and predictive event streams.";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const [isTypingCode, setIsTypingCode] = useState(true);
  const [typedCodeText, setTypedCodeText] = useState("");

  const selectFileManually = (file: VisionAIFile) => {
    setIsAutoPlay(false);
    setActiveFile(file);
    setActiveMainTab("code");
  };

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || TRACK_CODE;

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

        {/* SVG Filter for recoloring the image to brand colors */}
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
            {/* Map grayscale values to #151515, #75BF00, and #E2EFC1 */}
            <feComponentTransfer colorInterpolationFilters="sRGB">
              <feFuncR type="table" tableValues="0.082 0.458 0.886" />
              <feFuncG type="table" tableValues="0.082 0.749 0.937" />
              <feFuncB type="table" tableValues="0.082 0.000 0.757" />
            </feComponentTransfer>
          </filter>
        </svg>

        {/* Background Image touching nav bottom dashed line */}
        <div className="absolute top-0 inset-x-0 z-0 overflow-hidden pointer-events-none flex justify-center opacity-70">
          <div className="relative w-[700px] h-[700px]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent z-10" />
            <img
              src="https://a2-us.storyblok.com/f/1019538/1810x1810/75781443b9/hero-hands.png/m/1080x0/filters:quality(85):format(webp)"
              alt="Hero Background"
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
                    Vision AI with<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      open models
                    </span> that<br />
                    understand the world.
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Evaluate open vision models on images and video. Optimize scene understanding, object relationships, motion, and temporal prediction against real visual workloads.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Optimize vision system <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Explore stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <VisionAIGrid />
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
                <h2 className="text-3xl md:text-4xl lg:text-[46px] font-medium tracking-tight text-[#F0EFE2] mb-4">What you actually own</h2>
                <p className="text-[#C8C7BA] text-[16px] md:text-[18px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                  Your vision models, visual data, and runtime. Horos helps you optimize how models interpret images, understand scenes, and track changes across video.
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
                    <h3 className="text-xl md:text-2xl lg:text-[26px] font-medium text-[#F0EFE2] leading-snug">Choose and adapt vision models.</h3>
                    <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] leading-relaxed">
                      Compare open vision models for object detection, scene understanding, spatial relationships, and video analysis. Track model versions and measure which capabilities improve.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-8 lg:p-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[14px] sm:text-[15px] font-bold">0 2</div>
                    <h3 className="text-xl md:text-2xl lg:text-[26px] font-medium text-[#F0EFE2] leading-snug">Your visual data stays under your control.</h3>
                    <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] leading-relaxed">
                      Bring your own images, video, labels, and sensor observations. Choose your deployment environment and control how visual data is accessed and used.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-8 lg:p-10 flex flex-col gap-3.5">
                    <div className="text-[#75bf00] font-mono text-[14px] sm:text-[15px] font-bold">0 3</div>
                    <h3 className="text-xl md:text-2xl lg:text-[26px] font-medium text-[#F0EFE2] leading-snug">Measure understanding against reality.</h3>
                    <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] leading-relaxed">
                      Evaluate object recognition, spatial relationships, and changes across video frames against your own data. Compare quality, latency, GPU memory, and cost before deploying.
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
            <h2 className="text-[40px] md:text-[56px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
              Three ways to deploy Vision AI
            </h2>
            <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed text-center max-w-2xl">
              Use hosted vision APIs, optimize open models with Horos, or manage the entire stack yourself.
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
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm shrink-0">
                        <HorosLogo size={16} />
                      </div>
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Horos</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Fast path with model control and export.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-2 mb-1">
                      <Key size={16} className="text-[#C8C7BA] shrink-0" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed vision APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Per-call, hosted.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu size={16} className="text-[#C8C7BA] shrink-0" />
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
                        <div className="flex items-center gap-2">
                          <span className="text-[#75bf00] font-mono text-[12px] font-bold">{row.num}</span>
                          <span className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2]">{row.label}</span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#75bf00] mb-1 leading-snug">{row.runInfra.title}</h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-relaxed">{row.runInfra.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#F0EFE2] mb-1 leading-snug">{row.closed.title}</h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-relaxed">{row.closed.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#F0EFE2] mb-1 leading-snug">{row.diy.title}</h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-relaxed">{row.diy.desc}</p>
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
                      <div className="flex items-center gap-2 mt-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={replayAnimation} title="Replay Animation">
                        <span className="w-2 h-2 rounded-full bg-[#75bf00] animate-pulse" />
                        <span className="text-[10px] font-bold text-[#75bf00] tracking-widest uppercase">Live</span>
                      </div>
                    </div>

                    {/* Chat Content */}
                    <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-4 sm:p-5 flex flex-col justify-between overflow-hidden pointer-events-auto">
                      <div className="flex flex-col gap-3.5 overflow-y-auto chat-scroll pr-1.5 pb-3">
                        <div className="bg-[#1a1a1a] border border-[#252525] p-3.5 rounded-[4px]">
                          <p className="text-[#C8C7BA] text-[11.5px] sm:text-[12px] font-normal leading-[19px]">
                            Deploy multi-camera Vision AI pipeline.{" "}
                            <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10.5px] font-mono text-[#D4D3C9] align-middle mx-0.5">
                              <QwenLogo size={10} /> Qwen3-VL-8B
                            </span>{" "}
                            for spatial reasoning paired with{" "}
                            <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10.5px] font-mono text-[#75bf00] align-middle mx-0.5">
                              <NvidiaLogo size={10} /> Cosmos3-Nano
                            </span>{" "}
                            on a single{" "}
                            <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10.5px] font-mono text-[#75bf00] align-middle mx-0.5">
                              <NvidiaLogo size={10} /> L40S
                            </span>. Verify 3D spatial graphs &amp; motion events.
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
                            <span className="text-[9px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                            <p className="text-[#C8C7BA] text-[11.5px] sm:text-[12px] leading-[18px]">
                              {typedMsg1}
                              {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length && (
                                <span className="inline-block w-1.5 h-3 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Logs list */}
                        <div className="flex flex-col gap-2.5 mt-1">
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
                                <span className="text-[#C8C7BA] text-[11.5px] font-medium truncate">Profiled Qwen3-VL-8B on L40S</span>
                                <span className="text-[#777] text-[10.5px] font-mono shrink-0">1.2s</span>
                              </div>
                              <span className="text-[#666] text-[10.5px] leading-tight">30 fps stream ingestion, FP16 vision encoder</span>
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
                                <span className="text-[#C8C7BA] text-[11.5px] font-medium truncate">Paired Cosmos3-Nano predictor</span>
                                <span className="text-[#777] text-[10.5px] font-mono shrink-0">0.9s</span>
                              </div>
                              <span className="text-[#75bf00] text-[10.5px] leading-tight">fused spatio-temporal lookahead frames</span>
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
                                <span className="text-[#C8C7BA] text-[11.5px] font-medium truncate">Tuned AWQ INT4 on LLM head</span>
                                <span className="text-[#777] text-[10.5px] font-mono shrink-0">1.4s</span>
                              </div>
                              <span className="text-[#666] text-[10.5px] leading-tight">FP16 preserved on vision encoder</span>
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
                                <span className="text-[#C8C7BA] text-[11.5px] font-medium truncate">Wired 3D spatial scene graph</span>
                                <span className="text-[#777] text-[10.5px] font-mono shrink-0">1.1s</span>
                              </div>
                              <span className="text-[#666] text-[10.5px] leading-tight">zero-copy frame streaming forwarded to vLLM</span>
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
                                <span className="text-[#C8C7BA] text-[11.5px] font-medium truncate">Prepared 500-clip tracking harness</span>
                                <span className="text-[#777] text-[10.5px] font-mono shrink-0">1.5s</span>
                              </div>
                              <span className="text-[#75bf00] text-[10.5px] leading-tight">mAP 0.84, MOTA 0.91, spatial permanence gate passed</span>
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
                            <span className="text-[9px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                            <p className="text-[#C8C7BA] text-[11.5px] sm:text-[12px] leading-[18px]">
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
                            placeholder="Teach the agent to handle multi-camera spatial tracking..."
                            className="bg-transparent text-[#F0EFE2] text-[11.5px] border-none outline-none w-full px-2 py-1 placeholder:text-[#555]"
                            readOnly
                          />
                          <div className="flex justify-between items-center px-1">
                            <div className="flex gap-1.5">
                              <span className="bg-[#222] border border-[#333] text-[8.5px] text-[#A0A098] font-bold px-1.5 py-0.5 rounded-sm">@Capabilities</span>
                              <span className="bg-[#222] border border-[#333] text-[8.5px] text-[#A0A098] font-bold px-1.5 py-0.5 rounded-sm">@Outcomes</span>
                            </div>
                            <button className="w-5 h-5 bg-[#75bf00] hover:bg-[#85cf00] transition-colors flex items-center justify-center text-black font-bold rounded-sm">
                              <ArrowUp size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Files Content */}
                    <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-4 flex flex-col items-start gap-2.5 overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar min-w-0">
                      <div className="w-full flex justify-between items-center border-b border-[#252525] pb-2 mb-0.5">
                        <span className="text-[9.5px] font-bold tracking-widest text-[#C8C7BA] uppercase">SCHEMAS</span>
                        <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[8.5px] font-bold px-1.5 py-0.2 rounded-sm">3</span>
                      </div>
                      <div className="w-full flex flex-col gap-0.5 text-[11.5px] font-mono">
                        <button
                          onClick={() => selectFileManually("detection.json")}
                          className={`flex items-center gap-2 px-2 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "detection.json" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#777] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate">detection.json</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("spatial_graph.json")}
                          className={`flex items-center gap-2 px-2 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "spatial_graph.json" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#777] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate">spatial_graph.json</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("motion_track.json")}
                          className={`flex items-center gap-2 px-2 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "motion_track.json" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#777] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate">motion_track.json</span>
                        </button>

                        {/* Project Tree Folder */}
                        <div className="mt-1.5 flex flex-col gap-0.5 w-full">
                          <div className="flex items-center gap-1.5 px-1 py-0.5 text-[#aaa] font-semibold text-[11.5px]">
                            <ChevronDown size={12} className="text-[#777] shrink-0" /> <span className="truncate">horos-vision-ai/</span>
                          </div>
                          <div className="pl-2.5 flex flex-col gap-0.5 border-l border-[#252525] ml-2 mt-0.5">
                            <button
                              onClick={() => selectFileManually("track.py")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "track.py" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#888] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate">track.py</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("eval.py")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "eval.py" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#888] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate">eval.py</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("serve.sh")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "serve.sh" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#888] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate">serve.sh</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("pipeline.json")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "pipeline.json" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#888] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate">pipeline.json</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("Dockerfile")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#888] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate">Dockerfile</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("docker-compose.yml")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "docker-compose.yml" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate">docker-compose.yml</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("requirements.txt")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "requirements.txt" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate">requirements.txt</span>
                            </button>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 text-[#555] truncate">
                              <ChevronRight size={12} className="text-[#333] shrink-0" /> <span className="truncate">video_clips/</span>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 text-[#555] truncate">
                              <ChevronRight size={12} className="text-[#333] shrink-0" /> <span className="truncate">benchmarks/</span>
                            </div>
                            <button
                              onClick={() => selectFileManually("README.md")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "README.md" ? "text-[#75bf00] font-semibold bg-[#111]" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate">README.md</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <div className="col-start-4 col-end-5 row-start-2 row-end-4 flex flex-col justify-start overflow-hidden pointer-events-auto min-w-0 min-h-0 bg-[#151515]">
                      {/* Editor top tabs - Pinned at top, never scrolled away! */}
                      <div className="flex border-b border-[#252525] px-4 pt-3.5 pb-2 gap-1.5 overflow-x-auto hide-scrollbar thin-hover-scrollbar shrink-0 bg-[#151515]">
                        {["track.py", "eval.py", "serve.sh", "pipeline.json", "Dockerfile"].map((file) => (
                          <button
                            key={file}
                            onClick={() => selectFileManually(file)}
                            className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === file ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                          >
                            {file}
                          </button>
                        ))}
                      </div>

                      {/* Code Area with Line Numbers */}
                      <div className="flex-1 overflow-auto p-4 pt-3 chat-scroll thin-hover-scrollbar">
                        <div className="flex font-mono text-[12px] leading-relaxed overflow-x-auto select-text thin-hover-scrollbar">
                          {/* Line numbers column */}
                          <div className="text-[#444] text-right pr-4 border-r border-[#252525] select-none flex flex-col min-w-[28px]">
                            {Array.from({ length: typedCodeText.split('\n').length }).map((_, i) => (
                              <div key={i} className="min-h-[20px] leading-[20px]">{i + 1}</div>
                            ))}
                          </div>

                          {/* Highlighted code column */}
                          <div className="pl-4 flex-1 text-[#C8C7BA] leading-[20px]">
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
                                      : activeFile.endsWith(".md")
                                        ? "markdown"
                                        : activeFile.endsWith(".yml") || activeFile.endsWith(".yaml")
                                          ? "yaml"
                                          : "python",
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
          <div className="w-full relative z-10 pb-16 md:pb-20">
            {/* Feature Cards aligned with vertical grid lines */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div className="border-r border-dashed border-[#333]" />
              {/* Added top horizontal line per user request */}
              <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-6 py-8 sm:px-7 sm:py-10 flex flex-col gap-3.5 border-r border-dashed border-[#333] items-start">
                    <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cloud size={20} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Managed Horos</h3>
                    <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                      Hosted vision endpoints with sub-second video latency from L40S to B200.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-8 sm:px-7 sm:py-10 flex flex-col gap-3.5 border-r border-dashed border-[#333] items-start">
                    <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={20} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Your infrastructure</h3>
                    <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                      AWS, GCP, edge clusters, bare metal. Same vision engine, your private VPC.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-8 sm:px-7 sm:py-10 flex flex-col gap-3.5 items-start">
                    <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={20} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Local workstation &amp; Edge</h3>
                    <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                      docker compose up. Real-time spatio-temporal video pipeline on a single GPU or Jetson.
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-l border-dashed border-[#333]" />
            </div>
          </div>

          {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-16 pb-12">
            <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl md:text-[36px] lg:text-[42px] xl:text-[46px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-none md:whitespace-nowrap leading-tight">
                  Supported HF vision-language models work
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                  Supported vision-language models on Hugging Face run through the compatible recipe. Search the live catalog above. The examples below are just a starting view.
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
                    placeholder="Search any vision-language model on Hugging Face"
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
                          href={model.link || `https://huggingface.co/${model.id}`}
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
                            <span className="text-[#C8C7BA] text-[14px] line-clamp-1" title={model.author}>{model.author}</span>
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
              <div />
            </div>
          </div>

          {/* Tuning Section */}
          <div className="w-full relative z-10 mt-20 pb-20 md:pb-28">
            {/* Heading */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div className="border-r border-dashed border-[#333]" />
              <div className="min-w-0">
                <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] xl:text-[52px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-2xl mx-auto leading-tight">
                  What Horos tunes
                </h2>
                <p className="text-[#A0A098] text-[15px] sm:text-[16px] font-sans leading-relaxed text-center max-w-lg mx-auto mb-12">
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
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Vision encoder fusion</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Tiled patch embeddings fused with the LLM step. Page-shape preserved.
                      </p>
                    </div>

                    <div className="px-7 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Schema-request passthrough</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Send your JSON schema with response_format, then validate the returned JSON in your application.
                      </p>
                    </div>

                    <div className="px-7 py-10 border-b border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">VLM quantization</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        AWQ INT4 on the LLM head, FP16 preserved on the vision encoder.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-7 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <Cpu size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Temporal clip batching</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Variable-length video batches with PagedAttention. Zero padding waste across streaming camera feeds.
                      </p>
                    </div>

                    <div className="px-7 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <Boxes size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Spatio-temporal reasoning</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Interleaved cross-attention tuned to preserve 3D geometry and motion context without memory explosion.
                      </p>
                    </div>

                    <div className="px-7 py-10 border-b border-dashed border-[#333] flex flex-col gap-4 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl sm:text-[22px] font-medium text-[#F0EFE2]">Pipeline scheduling</h3>
                      <p className="text-[#A0A098] text-[13.5px] sm:text-[14px] leading-relaxed">
                        Balance vision encoder throughput with physical world prediction to eliminate pipeline stalls.
                      </p>
                    </div>

                  </div>
                </div>
              </div>

              <div className="border-l border-dashed border-[#333]" />
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
          <div className="w-full relative z-10 py-24 flex flex-col items-center px-4">
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-[#f2efe8] mb-4 text-center">
              Common <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">questions</span>
            </h2>
            <p className="text-[#c7c3b7] text-lg font-sans text-center mb-12">
              Can't find what you're looking for? <a href="#" className="text-[#75bf00] hover:underline">Get in touch</a>
            </p>

            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mb-12">
              {FAQ_DATA.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFaq(idx)}
                  className={`px-4 py-2.5 text-sm md:text-base font-medium transition-colors ${activeFaq === idx
                    ? "bg-[#75bf00] text-black"
                    : "bg-[#1f1f1f] text-[#C8C7BA] hover:bg-[#2a2a2a] hover:text-[#f2efe8]"
                    }`}
                >
                  {faq.question}
                </button>
              ))}
            </div>

            <div className="w-full max-w-4xl h-px border-t border-dashed border-[#333] mb-12" />

            <div className="flex items-start gap-4 max-w-4xl w-full text-left">
              <div className="mt-1 flex-shrink-0 text-[#C8C7BA] bg-[#1f1f1f] p-2 rounded-full flex items-center justify-center h-10 w-10">
                <HorosLogo size={20} />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-[#f2efe8] mb-2">
                  {FAQ_DATA[activeFaq]?.question || FAQ_DATA[0].question}
                </h3>
                <p className="text-[#C8C7BA] text-[16px] leading-relaxed max-w-3xl">
                  {FAQ_DATA[activeFaq]?.answer || FAQ_DATA[0].answer}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="w-full relative z-10 py-32 flex flex-col items-center justify-center overflow-hidden border-t border-dashed border-[#333]">
            {/* Container for precise 72% alignment with continuous dashed grid lines */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] absolute inset-0 pointer-events-none z-0">
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


