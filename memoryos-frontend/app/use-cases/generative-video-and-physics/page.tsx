"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";
import { GenerativeVideoBgAnimation } from "@/components/landing/generative-video-bg-animation";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, TeslaLogo, OneXLogo, FluxLogo, TencentLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch, Camera, Eye, Radio, Scan } from "lucide-react";

interface ComparisonRow {
  num: string;
  label: string;
  horos: { title: string; desc: string };
  closed: { title: string; desc: string };
  diy: { title: string; desc: string };
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    num: "0 1",
    label: "System",
    horos: {
      title: "Unified synthetic reality engine",
      desc: "Connect multi-modal telemetry, 4D environment synthesis, physics proofs, and counterfactual simulation rollouts in one verifiable loop."
    },
    closed: {
      title: "Black-box generative APIs",
      desc: "Call disconnected video generation endpoints with hallucinated physics, zero temporal consistency, and no persistent spatial state."
    },
    diy: {
      title: "Fragmented rendering farms",
      desc: "Handcraft fragile Unreal and Blender render pipelines, glue scripts, and uncalibrated custom physics plugins."
    }
  },
  {
    num: "0 2",
    label: "Models",
    horos: {
      title: "Open-weight generative world models",
      desc: "Train, fine-tune, and deploy Cosmos Predict, Open-Sora, MovieGen, and HunyuanWorld optimized for physical dynamics and camera control."
    },
    closed: {
      title: "Vendor-locked endpoints",
      desc: "Generic hosted models with zero weight access, high per-second API costs, rigid prompt filters, and no local GPU execution."
    },
    diy: {
      title: "Manual model management",
      desc: "Source checkpoints manually, resolve divergent PyTorch/CUDA dependencies, and struggle with custom diffusion architectures."
    }
  },
  {
    num: "0 3",
    label: "Context",
    horos: {
      title: "Multi-modal 4D scene representations",
      desc: "Synthesize aligned RGB video, depth maps, surface normals, optical flow, and 3D voxel occupancy grids with temporal permanence."
    },
    closed: {
      title: "Stateless 2D pixel streams",
      desc: "Flat 2D video outputs lacking underlying 3D spatial depth, camera coordinate frames, and multi-modal ground truth telemetry."
    },
    diy: {
      title: "Ad-hoc sensor extraction scripts",
      desc: "Fragile custom render passes struggling to extract synchronized depth and motion vectors across distributed compute nodes."
    }
  },
  {
    num: "0 4",
    label: "Capabilities",
    horos: {
      title: "Closed-loop physical simulation",
      desc: "Simulate physics-grounded collisions, gravity, fluid dynamics, and counterfactual 'what-if' action trajectories for robot learning."
    },
    closed: {
      title: "Hallucinated physics & visual drift",
      desc: "Phantom object generation, morphing geometry, floating objects, and impossible kinematics that corrupt downstream training data."
    },
    diy: {
      title: "Hand-tuned heuristic physics",
      desc: "Approximate game-engine physics solvers that fail to capture real-world material deformation, friction, and contact dynamics."
    }
  },
  {
    num: "0 5",
    label: "Workload",
    horos: {
      title: "Scalable distributed scenario synthesis",
      desc: "Generate millions of diverse edge-case training scenarios in parallel across multi-GPU clusters with deterministic seeding."
    },
    closed: {
      title: "Cloud rate limits & queuing latency",
      desc: "Severe generation concurrency caps, minutes-long generation queues, and per-second API costs that prohibit large-scale dataset creation."
    },
    diy: {
      title: "Unstable batch rendering queues",
      desc: "Frequent render worker crashes, host-to-device memory exhaustion, and slow serialization bottlenecks."
    }
  },
  {
    num: "0 6",
    label: "Optimization",
    horos: {
      title: "End-to-end GPU & physics acceleration",
      desc: "Joint optimization with TensorRT-LLM, FlashAttention-3, INT8/FP8 quantization, and custom CUDA physics kernels for real-time synthesis."
    },
    closed: {
      title: "Opaque vendor inference dials",
      desc: "Zero access to model compilation, precision switches, or kernel tuning; locked to vendor inference hardware and latency."
    },
    diy: {
      title: "Manual profiling & kernel patching",
      desc: "Endless trial-and-error profiling CUDA memory leaks, writing custom C++ extensions, and optimizing fragmented pipelines."
    }
  },
  {
    num: "0 7",
    label: "Verification",
    horos: {
      title: "Zero-drift mathematical physics proofs",
      desc: "Automated verification engines that mathematically test generated trajectories against conservation of energy, momentum, and collision laws."
    },
    closed: {
      title: "Unverified visual guessing",
      desc: "No mathematical consistency guarantees, impossible object teleportation, and zero formal validation."
    },
    diy: {
      title: "Labor-intensive manual auditing",
      desc: "Data engineers spending hundreds of hours reviewing rendered video clips frame-by-frame to filter impossible physical artifacts."
    }
  },
  {
    num: "0 8",
    label: "Experience",
    horos: {
      title: "Cryptographic scenario lineage & audit",
      desc: "Complete provenance tracking linking every generated video frame to its random seed, physics parameters, prompt, and model weights."
    },
    closed: {
      title: "Transient vendor request histories",
      desc: "Ephemeral cloud API logs without scene graphs, generation seeds, or verifiable dataset reproducibility."
    },
    diy: {
      title: "Scattered local folders & render logs",
      desc: "Disconnected folders of MP4s, unindexed JSON metadata files, and untracked experiment parameter configurations."
    }
  },
  {
    num: "0 9",
    label: "Teaching",
    horos: {
      title: "Active curriculum & edge-case synthesis",
      desc: "Automatically synthesize the exact physical edge cases and hard corner cases where your autonomous policies or vision models fail."
    },
    closed: {
      title: "Prompt-only superficial variations",
      desc: "Re-prompting with natural language with no systematic mechanism to target specific physical failure distributions."
    },
    diy: {
      title: "Manual 3D scene modeling",
      desc: "3D artists manually authoring environments, placing obstacles, and animating scenarios by hand in Blender."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    horos: {
      title: "Automated SIM2REAL gap validation",
      desc: "Measure distribution shift against real-world test logs, enforce physics bounds, and qualify synthetic datasets for real-world deployment."
    },
    closed: {
      title: "Zero physical safety guarantees",
      desc: "Black-box video with no bounds checking, risking catastrophic deployment failures if trained on flawed physics."
    },
    diy: {
      title: "Brittle assertion scripts",
      desc: "Handcrafted heuristic thresholds that fail to detect subtle physics domain shifts between simulation and reality."
    }
  }
];

const README_CODE = `# Generative Video & Physics Engine

Autonomous video synthesis and physical world model generation powered by Horos.

## Architecture Overview
- Generative Engines: OpenAI Sora, Runway Gen-3, Luma Dream Machine
- Physical Validation: Zero-hallucination object permanence & depth verification
- Output Modalities: RGB, Depth Maps, Optical Flow, Surface Normals
- Inference Compute: NVIDIA H100 / A100 Clusters & TensorRT-LLM

## Batch Execution
$ horos-video-agent generate \\
    --prompt-dataset s3://training-prompts/batch-01 \\
    --generative-model OpenAI-Sora \\
    --physics-validation strict`;

const SENSOR_AST_CODE = `# 4D Spatial World AST & Synthetic Telemetry
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class SyntheticNode:
    frame_id: int
    modality: str  # rgb, depth_map, optical_flow, normals
    timestamp_ns: int
    object_boundaries: Tuple[float, float, float, float]
    physical_consistency_score: float

class VideoSynthesisAST:
    """Parses generative video outputs into a 4D spatial training dataset."""
    
    @staticmethod
    def extract_world_graph(video_tensor: Dict[str, any]) -> Dict[str, any]:
        """Extract multi-modal synthetic telemetry for spatial model training."""
        nodes = [
          SyntheticNode(0, "rgb", 1726054800000, (12.4, 34.2, 105.1, 208.5), 0.994),
          SyntheticNode(0, "depth_map", 1726054800005, (12.4, 34.2, 105.1, 208.5), 0.998),
          SyntheticNode(0, "optical_flow", 1726054800010, (12.4, 34.2, 105.1, 208.5), 0.989),
        ]
        return {
            "synthetic_nodes": nodes,
            "temporal_consistency": 0.995,
            "physics_violation_rate": 0.001,
            "dataset_entropy": 0.084
        }`;

const SPATIAL_VERIFIER_CODE = `# Zero-Hallucination Video Physics Verifier
import torch
from typing import List, Dict

class PhysicsVerifier:
    """Mathematical verification of physical object permanence in generated video."""
    
    def __init__(self, policy: str = "strict-temporal-consistency"):
        self.policy = policy
        self.max_physics_violation = 0.005  # 0.5% threshold

    def verify_video_frames(self, generated_frames: List[Dict], physical_priors: Dict) -> Dict[str, any]:
        """Verify generated spatial trajectory against known physics priors."""
        violation_score = np.linalg.norm(
            np.array(generated_frames[-1]["depth_map"]) - np.array(physical_priors["expected_depth"])
        )
        
        is_valid = float(violation_score) <= self.max_physics_violation
        return {
            "is_valid": is_valid,
            "proof_hash": "0x4e9b77a2f1c890e4",
            "physics_violation_score": float(violation_score),
            "policy_enforced": self.policy
        }`;

const SENSOR_AUDITOR_CODE = `# Generative Video Hallucination Auditor
from typing import Dict

class VideoAuditor:
    """Audits generated video for temporal flicker, depth anomalies, and artifacting."""
    
    def __init__(self, target_fps: int = 60):
        self.target_fps = target_fps

    def audit_generation_health(self, video_tensor: Dict) -> Dict[str, float]:
        """Calculate spatial coherence and visual artifact confidence."""
        return {
            "temporal_coherence_pct": 99.98,
            "flicker_score": 0.14,
            "artifact_rate": 0.0001,
            "spatial_fidelity_score": 99.94
        }`;

const RUN_SIMULATION_CODE = `# Generative Video Engine with Physics Verification
import torch
from horos_video import VideoGeneratorAgent, PhysicsVerifier, VideoSynthesisAST, VideoAuditor

# Initialize video generation agent with OpenAI Sora world model
agent = VideoGeneratorAgent.from_pretrained("openai/sora-1-worldmodel")
physics_verifier = PhysicsVerifier(policy="strict-temporal-consistency")
auditor = VideoAuditor(target_fps=60)

def generate_video_physics(prompt_dataset: list, target_resolution: str = "4k"):
    """Generate physically accurate video and extract 4D spatial training data."""
    
    # Synthesize video frames based on prompt dataset
    video_tensor = agent.generate_video(prompt_dataset, resolution=target_resolution)
    
    # Audit temporal flicker and spatial fidelity
    health = auditor.audit_generation_health(video_tensor)
    
    # Extract multi-modal synthetic telemetry (depth, optical flow)
    world_graph = VideoSynthesisAST.extract_world_graph(video_tensor)
    
    # Mathematically verify physics object permanence against priors
    spatial_proof = physics_verifier.verify_video_frames(world_graph["synthetic_nodes"], prompt_dataset[0]["priors"])
    
    if spatial_proof["is_valid"]:
        return {
            "generation_status": "SUCCESS",
            "spatial_fidelity": health["spatial_fidelity_score"],
            "proof_hash": spatial_proof["proof_hash"],
            "physics_violation_score": 0.0,
            "training_dataset_ready": True
        }
        
    return None`;

const RUN_DFT_AUDIT_CODE = `#!/usr/bin/env bash
# Generative video batch synthesis and physical verification runner
set -euo pipefail

PROMPTS_DIR="s3://training-prompts/batch-01"
WORLD_MODEL="OpenAI-Sora"

echo "[Horos Video] Initializing NVIDIA H100 Cluster pipeline..."
echo "[Horos Video] Generating 4K 60fps physically grounded video..."

# Execute zero-hallucination video generation with TensorRT acceleration
horos-video-agent generate \\
  --prompt-dataset $PROMPTS_DIR \\
  --generative-model $WORLD_MODEL \\
  --physics-proofs enabled \\
  --violation-tolerance strict \\
  --output-json ./synthetic_training_dataset.json`;

const SIMULATION_PIPELINE_CODE = `{
  "name": "generative-video-and-physics",
  "version": "3.1.0",
  "agent": "video-physics-generator-v1",
  "generative_model": "openai-sora-worldmodel",
  "edge_runtime": "TensorRT-LLM-CUDA-12.4",
  "validation_engine": "Horos-Physics-Verifier",
  "physics_proofs": true,
  "max_physics_violation_score": 0.005,
  "telemetry_outputs": [
    "video_rgb_4k",
    "depth_maps",
    "optical_flow_vectors",
    "surface_normals"
  ]
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.0-devel-ubuntu22.04 AS base

RUN apt-get update && apt-get install -y python3.11 ffmpeg libopenal-dev

WORKDIR /synthetic
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY engine/ /synthetic/engine/
COPY README.md run_synthetic_world.py run_batch_synthesis.sh synthetic_pipeline.json .

EXPOSE 8080 8554
ENTRYPOINT ["/synthetic/run_batch_synthesis.sh"]`;

const DOCKER_COMPOSE_CODE = `version: "3.8"

services:
  synthetic-reality-engine:
    build: .
    ports:
      - "8080:8080"
      - "8554:8554"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    environment:
      - PHYSICS_PROOF_POLICY=strict-zero-drift
      - CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7`;

const REQUIREMENTS_CODE = `torch>=2.4.0
tensorrt>=10.0.0
numpy>=1.26.0
opencv-python-headless>=4.9.0
horos-physical-agent>=2.4.0
rospy2>=0.5.0
av>=12.0.0`;

const EVAL_PHYSICS_CODE = `# Evaluation harness: measuring video realism and physical accuracy
from horos_eval import VideoEvaluator, PhysicsSafetyGate

def evaluate_video_accuracy(prompt_data: str, generation_report: dict) -> dict:
    """Verify generative video physical accuracy and zero-hallucination guarantee."""
    
    evaluator = VideoEvaluator()
    safety = PhysicsSafetyGate(policy="zero-physics-hallucination")
    
    # Mathematically verify physics prediction proofs against generation priors
    proof_passed = safety.verify_proof(generation_report["proof_hash"])
    
    # Calculate visual realism and temporal tracking accuracy
    accuracy_score = evaluator.score_video_realism(generation_report)
    
    return {
        "physics_proof_verified": proof_passed,
        "fvd_score": accuracy_score.frechet_video_distance,
        "physics_violations_detected": 0
    }`;

type DataFactoryFile = string;

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
    } else if (lang === "markdown") {
      if (content.trim().startsWith("#")) {
        lineContent = <span className="text-[#75bf00] font-bold">{content}</span>;
      } else if (content.trim().startsWith("-") || content.trim().startsWith("*") || content.trim().startsWith("$")) {
        lineContent = <span className="text-[#93c5fd]">{content}</span>;
      } else {
        lineContent = content;
      }
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
        {isCurrentActiveLine && !isComplete ? (
          <span className="w-[3.5px] h-[16px] bg-[#75bf00] animate-pulse inline-block mr-2.5 rounded-full shrink-0 align-middle" />
        ) : (
          <span className="w-[3.5px] h-[16px] bg-transparent inline-block mr-2.5 shrink-0" />
        )}

        <span className="flex-1 whitespace-pre">{lineContent}</span>

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
    id: "nvidia/Cosmos-1.0-Diffusion-7B-Video2World",
    name: "Cosmos 1.0 Diffusion",
    author: "NVIDIA",
    url: "https://huggingface.co/nvidia/Cosmos-1.0-Diffusion-7B-Video2World",
    link: "https://huggingface.co/nvidia/Cosmos-1.0-Diffusion-7B-Video2World",
    downloads: "7B DiT",
    role: "Physical World Model",
    description: "Physical world foundation model for photorealistic dynamics simulation and continuous state prediction."
  },
  {
    id: "facebook/vjepa2-vitg-fpc64-256",
    name: "V-JEPA 2",
    author: "Meta",
    url: "https://huggingface.co/facebook/vjepa2-vitg-fpc64-256",
    link: "https://huggingface.co/facebook/vjepa2-vitg-fpc64-256",
    downloads: "1B-class",
    role: "Joint-Embedding Predictor",
    description: "Self-supervised Joint-Embedding Predictive Architecture for feature-space physical world dynamics."
  },
  {
    id: "tencent/HunyuanVideo",
    name: "HunyuanVideo",
    author: "Tencent",
    url: "https://huggingface.co/tencent/HunyuanVideo",
    link: "https://huggingface.co/tencent/HunyuanVideo",
    downloads: "13B DiT",
    role: "4D Spatio-Temporal",
    description: "Frontier open-weights video generation model with physical spatio-temporal dynamics and kinematic continuity."
  },
  {
    id: "genmo/mochi-1-preview",
    name: "Mochi 1",
    author: "Genmo",
    url: "https://huggingface.co/genmo/mochi-1-preview",
    link: "https://huggingface.co/genmo/mochi-1-preview",
    downloads: "10B params",
    role: "Physics Dynamics DiT",
    description: "Asymmetric diffusion transformer engineered for photorealistic physical motion, fluid dynamics, and rigid bodies."
  },
  {
    id: "Lightricks/LTX-Video",
    name: "LTX-Video",
    author: "Lightricks",
    url: "https://huggingface.co/Lightricks/LTX-Video",
    link: "https://huggingface.co/Lightricks/LTX-Video",
    downloads: "Real-Time",
    role: "Real-Time Simulator",
    description: "Real-time transformer-based video generator capable of 50 FPS physics dynamics on edge & workstation GPUs."
  },
  {
    id: "hpcai-tech/Open-Sora",
    name: "Open-Sora 1.2",
    author: "HPCAITech",
    url: "https://huggingface.co/hpcai-tech/Open-Sora",
    link: "https://huggingface.co/hpcai-tech/Open-Sora",
    downloads: "1.2B ST-DiT",
    role: "Video World Simulator",
    description: "Open-weights diffusion transformer for high-fidelity physical video synthesis and temporal object permanence."
  },
  {
    id: "black-forest-labs/FLUX.1-Depth-dev",
    name: "FLUX.1 Depth",
    author: "Black Forest Labs",
    url: "https://huggingface.co/black-forest-labs/FLUX.1-Depth-dev",
    link: "https://huggingface.co/black-forest-labs/FLUX.1-Depth-dev",
    downloads: "12B flow",
    role: "Spatial Geometry",
    description: "Spatial depth conditioning rectified flow model for metric 3D geometry and physical surface reconstruction."
  },
  {
    id: "Wan-AI/Wan2.1-T2V-14B",
    name: "Wan 2.1 Video",
    author: "Wan-AI",
    url: "https://huggingface.co/Wan-AI/Wan2.1-T2V-14B",
    link: "https://huggingface.co/Wan-AI/Wan2.1-T2V-14B",
    downloads: "14B DiT",
    role: "Visual-Tactile World",
    description: "State-of-the-art open video foundation model with visual-tactile physics simulation and spatio-temporal flow."
  },
  {
    id: "depth-anything/Depth-Anything-V2-Large",
    name: "Depth Anything V2",
    author: "Depth Anything",
    url: "https://huggingface.co/depth-anything/Depth-Anything-V2-Large",
    link: "https://huggingface.co/depth-anything/Depth-Anything-V2-Large",
    downloads: "335M params",
    role: "Dense Geometry",
    description: "Dense monocular depth estimation foundation model for extracting metric 3D point clouds and collision meshes."
  }
];

const getLogo = (author: string, modelName: string = "") => {
  if (!author && !modelName) return <HuggingFaceLogo size={20} />;
  const a = (author || "").toLowerCase();
  const m = (modelName || "").toLowerCase();

  if (a.includes('nvidia') || m.includes('cosmos') || m.includes('nemo')) return <NvidiaLogo size={20} />;
  if (a.includes('meta') || a.includes('facebook') || m.includes('vjepa') || m.includes('v-jepa')) return <MetaLogo size={20} />;
  if (a.includes('tencent') || m.includes('hunyuan')) return <TencentLogo size={24} />;
  if (a.includes('black-forest') || a.includes('flux') || m.includes('flux')) return <FluxLogo size={20} />;
  if (a.includes('openai') || m.includes('gpt') || m.includes('sora')) return <OpenAILogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen') || a.includes('wan')) return <QwenLogo size={20} />;
  if (a.includes('tesla') || m.includes('fsd')) return <TeslaLogo size={20} />;
  if (a.includes('1x') || a.includes('onex') || m.includes('humanoid')) return <OneXLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('google') || m.includes('rt-2') || m.includes('lumiere')) return <GoogleLogo size={20} />;
  if (a.includes('mistral') || m.includes('pixtral')) return <MistralLogo size={20} />;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;

  return <HuggingFaceLogo size={20} />;
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
    question: "How does Horos synthesize physical world environments and sensor streams?",
    answer: "Horos connects generative world models (NVIDIA Cosmos, Meta V-JEPA 2, HunyuanVideo, Mochi 1) with GPU physics solvers (Genesis, MuJoCo, Isaac Gym). It generates synchronized multi-camera video, depth fields, 3D point clouds, and IMU telemetry with deterministic seeds—allowing you to simulate millions of diverse training scenarios without manual 3D asset modeling.",
  },
  {
    question: "How do you detect and eliminate hallucinated or physically impossible video?",
    answer: "Every generated frame and trajectory passes through automated kinematics and physics verifiers. Horos extracts 3D voxel AST graphs, surface normals, and depth trajectories, mathematically checking for rigid-body collision violations, gravity and momentum anomalies, surface friction consistency, and temporal geometry morphing before data touches downstream models.",
  },
  {
    question: "Can generative physics models and world simulators run on local edge clusters?",
    answer: "Yes. All diffusion transformers, world models, and spatial verifiers compile into high-throughput TensorRT and TensorRT-LLM engines with FP8/INT8 quantization. You can self-host the entire simulation and video generation pipeline on local NVIDIA H100/B200 clusters or Jetson Thor edge workstations with zero cloud dependency.",
  },
  {
    question: "Which open-weight generative video and world models are supported out of the box?",
    answer: "Horos natively supports top open-weight models from Hugging Face—including NVIDIA Cosmos 1.0 (Diffusion & Autoregressive), Meta V-JEPA 2, Tencent HunyuanVideo, Genmo Mochi 1, Lightricks LTX-Video, HPCAITech Open-Sora, Black Forest Labs FLUX.1 Depth, Wan 2.1 Video, and Depth Anything V2. Custom diffusion and world model checkpoints can be loaded via Hugging Face IDs or local directories.",
  },
  {
    question: "How does Horos bridge the sim-to-real gap for robotics and autonomous systems?",
    answer: "Horos benchmarks generated video and physics rollouts directly against real-world robot logs and sensor telemetry. By computing distribution shift, optical lens distortion, and contact dynamics drift, Horos surfaces edge-case failure modes and produces verified SIM2REAL transfer evidence for safe physical deployment.",
  },
  {
    question: "Do I own the full simulation recipe, code, and generated datasets?",
    answer: "Yes. You own 100% of the recipe: environment seeds, physics parameters, CUDA kernels, Docker/OCI container harnesses, and generated synthetic datasets. There are no proprietary API fees, usage caps, or third-party telemetry requirements.",
  }
];

export default function GenerativeVideoAndPhysicsPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("run_synthetic_world.py" as any);
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "README.md": README_CODE,
    "sensor_ast.py": SENSOR_AST_CODE,
    "spatial_verifier.py": SPATIAL_VERIFIER_CODE,
    "sensor_auditor.py": SENSOR_AUDITOR_CODE,
    "run_synthetic_world.py": RUN_SIMULATION_CODE,
    "eval_physics.py": EVAL_PHYSICS_CODE,
    "run_batch_synthesis.sh": RUN_DFT_AUDIT_CODE,
    "synthetic_pipeline.json": SIMULATION_PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE
  };

  const AGENT_MSG_1 = "On it. Initializing generative world model pipeline. Running OpenAI Sora & NVIDIA Cosmos Predict over TensorRT H100 cluster for batch synthetic reality synthesis.";
  const AGENT_MSG_2 = "Generation complete. Constructed synthetic 4D spatial dataset with 99.98% physical realism. Object permanence and trajectories mathematically verified against physics priors. Spatial proof #0x4e9b... verified for training ingestion.";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  const [isTypingCode, setIsTypingCode] = useState(true);
  const [typedCodeText, setTypedCodeText] = useState("");

  const selectFileManually = (file: string) => {
    setIsAutoPlay(false);
    setActiveFile(file as any);
    setActiveMainTab("code");
  };

  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || RUN_SIMULATION_CODE;

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
      timer = setTimeout(() => setVisibleStep(1), 400);
    } else if (visibleStep === 1) {
      if (typedMsg1.length < AGENT_MSG_1.length) {
        timer = setTimeout(() => {
          setTypedMsg1(AGENT_MSG_1.slice(0, typedMsg1.length + 2));
        }, 18);
      } else {
        timer = setTimeout(() => setVisibleStep(2), 450);
      }
    } else if (visibleStep >= 2 && visibleStep <= 6) {
      timer = setTimeout(() => setVisibleStep(prev => prev + 1), 450);
    } else if (visibleStep === 7) {
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
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(null);
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

            let tag = "Generative Video AI Target";
            let description = m.downloads ? `${dl} - Verifiable perception target` : "Verifiable perception target";
            
            let author = m.author || m.id.split('/')[0];
            let name = m.id.split('/').pop();

            return {
              id: m.id,
              name: name,
              author: author,
              downloads: dl,
              description: description,
              tag: tag,
              url: `https://huggingface.co/${m.id}`,
              link: `https://huggingface.co/${m.id}`
            };
          });
          setSearchResults(mapped);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  const displayedModels = (debouncedQuery.trim() && searchResults !== null) ? searchResults : DEFAULT_MODELS;

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
        <LandingNavbar />
      </div>

      <main className="flex-1 flex flex-col relative z-10">
        
        {/* SVG Filter for recoloring the background image to brand green colors */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="brand-duotone-physical-bg">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0 0 0 1 0"
            />
            <feComponentTransfer colorInterpolationFilters="sRGB">
              <feFuncR type="table" tableValues="0.08235 0.458 0.886" />
              <feFuncG type="table" tableValues="0.08235 0.749 0.937" />
              <feFuncB type="table" tableValues="0.08235 0.000 0.757" />
            </feComponentTransfer>
          </filter>
        </svg>

        {/* Background Image with Top and Bottom Gray/Black Mist */}
        <div className="absolute top-0 inset-x-0 z-0 overflow-hidden pointer-events-none flex justify-center opacity-85">
          <div className="relative w-[1100px] h-[640px] mt-2">
            {/* Top Gray/Black Mist Overlay */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#151515] via-[#151515]/80 to-transparent z-10" />
            {/* Bottom Gray/Black Mist Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#151515] via-[#151515]/90 to-transparent z-10" />
            {/* Left and Right Side Mist Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-transparent to-[#151515] z-10" />
            
            <div 
              className="absolute inset-0 z-0 opacity-100"
              style={{ 
                maskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, black 25%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, black 25%, transparent 95%)',
                filter: 'url(#brand-duotone-physical-bg)'
              }}
            >
              <GenerativeVideoBgAnimation />
            </div>
          </div>
        </div>

        {/* Hero Section Container */}
        <div className="w-full relative mt-20 mb-20 min-h-[600px] flex items-center">
          <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-0" />

          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="w-full h-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div className="relative">
                <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] translate-y-[1px]" />
              </div>
              <div />
              <div className="relative">
                <div className="absolute bottom-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
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
                    Synthetic<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      Reality
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Generate physics-grounded environments, scenarios, and world states for training and evaluation. Synthesize future trajectories, rare failure modes, and verified SIM2REAL evidence.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-4 py-2 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-1.5 text-[13px] whitespace-nowrap">
                      Deploy Synthetic Reality <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-4 py-2 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-1.5 text-[13px] whitespace-nowrap">
                      Explore the stack <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Environment Factory"
                    label2="World Lab Scenarios"
                    label3="Future Trajectories"
                    label4="Rare Failure Modes"
                    label5="SIM2REAL Gap Engine"
                    label6="Policy Evaluation"
                  />
                </div>
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full relative z-10 mt-12 md:mt-16">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-10 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">
                  What you actually own
                </h2>
                <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                  Your synthetic environments, world states, and simulation evidence. Horos helps you generate scalable training scenarios, synthesize edge-case trajectories, and verify sim-to-real fidelity.
                </p>
              </div>
            </div>
            <div />
          </div>

          <div className="w-full relative z-10">
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative">
                <div className="relative h-full">
                  <div className="absolute top-[10px] bottom-[10px] right-[-1px] w-[2px] bg-[#151515] z-10" />
                  <div className="absolute top-[10px] bottom-[10px] right-[-10px] w-[10px] border-l border-r border-dashed border-[#333] z-20" />
                  <div className="absolute top-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute top-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                  <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] translate-y-[1px]" />
                </div>

                <div />

                <div className="relative h-full">
                  <div className="absolute top-[10px] bottom-[10px] left-[-1px] w-[2px] bg-[#151515] z-10" />
                  <div className="absolute top-[10px] bottom-[10px] left-[-10px] w-[10px] border-l border-r border-dashed border-[#333] z-20" />
                  <div className="absolute top-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute top-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
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
                  <div className="px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">01</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Your synthetic environments
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Generate dynamic 3D world states, multi-camera sensor feeds, and physics-grounded scenarios. Control environment parameters, lighting, surface friction, and weather conditions.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">02</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Your world models & rollouts
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Evaluate models such as{" "}
                      <a
                        href="https://huggingface.co/nvidia/Cosmos-1.0-Diffusion-7B-Video2World"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#75bf00] hover:underline underline-offset-2"
                      >
                        NVIDIA Cosmos
                      </a>{" "}
                      and generative physics architectures across temporal consistency, object permanence, and counterfactual trajectory rollouts.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-3">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">03</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Your verified SIM2REAL results
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Audit prediction errors against real robot logs and reference physics engines. Measure distribution shift, identify rare failure modes, and export verified simulation evidence.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Full-width dashed line separator */}
        <div className="w-full h-px border-t border-dashed border-[#333]" />

        {/* Comparison Table Section */}
        <div className="w-full relative z-10 mt-28 md:mt-32 mb-32">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="flex flex-col items-center mb-8 md:mb-10 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">
              Three ways to build Synthetic Reality
            </h2>
            <p className="text-[#C8C7BA] text-[14px] sm:text-[15px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
              Engineer synthetic environments, counterfactual rollouts, and physics-grounded world states. Horos connects generative video to physics validation, SIM2REAL gap analysis, and verified model deployment.
            </p>
          </div>

          <div className="w-full relative z-10 bg-[#151515]/20 pt-[25px] pb-[10px]">
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative">
                <div className="relative h-full">
                  <div className="absolute top-[10px] bottom-[10px] right-[-1px] w-[2px] bg-[#151515] z-10" />
                  <div className="absolute top-[10px] bottom-[10px] right-[-10px] w-[10px] border-l border-r border-dashed border-[#333] z-20" />
                  <div className="absolute top-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute top-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                  <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] translate-y-[1px]" />
                </div>

                <div />

                <div className="relative h-full">
                  <div className="absolute top-[10px] bottom-[10px] left-[-1px] w-[2px] bg-[#151515] z-10" />
                  <div className="absolute top-[10px] bottom-[10px] left-[-10px] w-[10px] border-l border-r border-dashed border-[#333] z-20" />
                  <div className="absolute top-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute top-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
                  <div className="absolute bottom-0 left-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                  <div className="absolute bottom-0 left-1/2 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] translate-y-[1px]" />
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-30">
              <div />
              <div className="min-w-0 bg-[#151515]">
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
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Full workflow engineering & verification.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={16} className="text-[#C8C7BA] shrink-0" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed World Model APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Individual hosted video & physics APIs.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={16} className="text-[#C8C7BA] shrink-0" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">DIY Rendering Pipelines</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Fragmented models, renderers & scripts.</p>
                  </div>
                </div>

                <div className="border-l border-r border-b border-dashed border-[#333]">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <div
                      key={idx}
                      className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200"
                    >
                      <div className="flex items-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] min-h-[72px]">
                        <div className="flex items-center gap-3">
                          <span className="text-[#75bf00] font-mono text-[12px] font-bold">
                            {row.num}
                          </span>
                          <span className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2]">
                            {row.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                        <span className="md:hidden text-[10px] font-mono font-bold text-[#75bf00] uppercase mb-1">
                          Horos
                        </span>
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#75bf00] mb-1 leading-snug">
                          {row.horos.title}
                        </h4>
                        <p className="text-[#E6E5D8] text-[12px] sm:text-[12.5px] leading-snug leading-relaxed">
                          {row.horos.desc}
                        </p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <span className="md:hidden text-[10px] font-mono font-bold text-[#C8C7BA] uppercase mb-1">
                          Closed World Model APIs
                        </span>
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#F0EFE2] mb-1 leading-snug">
                          {row.closed.title}
                        </h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] leading-snug leading-relaxed">
                          {row.closed.desc}
                        </p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <span className="md:hidden text-[10px] font-mono font-bold text-[#C8C7BA] uppercase mb-1">
                          DIY Rendering Pipelines
                        </span>
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#F0EFE2] mb-1 leading-snug">
                          {row.diy.title}
                        </h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] leading-snug leading-relaxed">
                          {row.diy.desc}
                        </p>
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
        <div className="w-full relative z-10 mt-28 md:mt-32">
          {/* Top Divider for Sandbox Section */}
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-12 md:pt-16 mb-10 md:mb-12">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight mb-2.5 sm:mb-3 text-center">
                  Synthetic reality you own.{" "}
                  <span className="text-[#75bf00]">Simulate reality anywhere.</span>
                </h2>
                <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] md:text-[15px] max-w-2xl mx-auto leading-relaxed text-center">
                  The complete synthetic reality stack ships with you. 4D environment synthesis, generative physics engines (NVIDIA Cosmos, OpenAI Sora), SIM2REAL gap verifiers, and multi-modal telemetry pipelines. Run it on any GPU cluster or edge simulator.
                </p>
              </div>
            </div>
            <div />
          </div>

          <SectionDivider position="top" className="absolute top-0 left-0 right-0 z-20" />

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-12 md:py-16">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              <div className="w-full relative min-w-0 px-1 md:px-2">
                <div
                  className="w-full relative mx-auto"
                  style={{ aspectRatio: "1351 / 892" }}
                >
                  {/* Panes Backgrounds */}
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: "minmax(0, 41fr) minmax(0, 443fr) minmax(0, 226fr) minmax(0, 602fr) minmax(0, 39fr)",
                      gridTemplateRows: "minmax(0, 53.5fr) minmax(0, 785fr) minmax(0, 53.5fr)",
                    }}
                  >
                    <div className="col-start-2 col-end-5 row-start-1 row-end-2 bg-[#151515]" />
                    <div className="col-start-2 col-end-3 row-start-2 row-end-3 bg-[#151515]" />
                    <div className="col-start-3 col-end-4 row-start-2 row-end-3 bg-[#151515]" />
                    <div className="col-start-4 col-end-5 row-start-2 row-end-4 bg-[#151515]" />
                  </div>

                  <SkeletonGrid className="absolute inset-0 w-full h-full z-10" />

                  <div
                    className="absolute inset-0 grid pointer-events-none z-20"
                    style={{
                      gridTemplateColumns: "minmax(0, 41fr) minmax(0, 443fr) minmax(0, 226fr) minmax(0, 602fr) minmax(0, 39fr)",
                      gridTemplateRows: "minmax(0, 53.5fr) minmax(0, 785fr) minmax(0, 53.5fr)",
                    }}
                  >
                    {/* Tabs */}
                    <div className="col-start-2 col-end-5 row-start-1 row-end-2 flex items-center justify-between px-3 sm:px-5 pointer-events-auto">
                      <div className="flex gap-3 sm:gap-6 h-full items-end pb-2">
                        <button
                          onClick={() => setActiveMainTab("pipeline")}
                          className={`flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "pipeline" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <span className="text-[#75bf00]">&gt;_</span> PIPELINE
                        </button>
                        <button
                          onClick={() => setActiveMainTab("code")}
                          className={`flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "code" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <Code2 size={12} /> CODE
                        </button>
                        <button
                          onClick={() => setActiveMainTab("optimization")}
                          className={`flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "optimization" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <Sliders size={12} /> OPTIMIZATION
                        </button>
                        <button
                          onClick={() => setActiveMainTab("deploy")}
                          className={`flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "deploy" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <Rocket size={12} /> DEPLOY
                        </button>
                      </div>
                      <div
                        className="flex items-center gap-2 mt-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={replayAnimation}
                        title="Replay Animation"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#75bf00] animate-pulse" />
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-[#75bf00] tracking-widest uppercase">Live</span>
                      </div>
                    </div>

                    {/* Chat Content */}
                    <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-3 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden min-w-0 pointer-events-auto">
                      <div className="flex flex-col gap-3 sm:gap-3.5 overflow-y-auto chat-scroll pr-1.5 pb-2 min-w-0">
                        <div className="bg-[#181818] border border-[#262626] p-2 sm:p-2.5 rounded-[4px] min-w-0">
                          <p className="text-[#C8C7BA] text-[10px] sm:text-[11px] font-sans leading-[15px] sm:leading-[17px]">
                            Generate physically grounded synthetic video datasets in batch. Generative physics pipeline with{" "}
                            <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#F0EFE2] font-mono text-[8.5px] sm:text-[9.5px] align-middle whitespace-nowrap">
                              <OpenAILogo size={10} /> OpenAI Sora
                            </span>{" "}
                            world model plus{" "}
                            <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#F0EFE2] font-mono text-[8.5px] sm:text-[9.5px] align-middle whitespace-nowrap">
                              <NvidiaLogo size={10} /> Cosmos Predict 2.5
                            </span>{" "}
                            physics verification on{" "}
                            <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#75bf00] font-mono text-[8.5px] sm:text-[9.5px] align-middle whitespace-nowrap">
                              <NvidiaLogo size={10} /> H100 TensorRT Cluster
                            </span>.
                          </p>
                        </div>

                        {/* Step 1 */}
                        <div className={`flex gap-2 sm:gap-2.5 mt-1 transition-all duration-500 transform ${visibleStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                          <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                            {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length ? (
                              <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                            ) : (
                              <Sparkles size={12} className="text-[#75bf00]" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[9px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                            <p className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] leading-[16px] sm:leading-[18px]">
                              {typedMsg1}
                              {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length && (
                                <span className="inline-block w-1.5 h-3 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Logs list */}
                        <div className="flex flex-col gap-2 sm:gap-2.5 mt-1 min-w-0">
                          {/* Step 2 */}
                          <div className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 2 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Batch synthesizing 4D world environments</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">0.4s</span>
                              </div>
                              <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">Generated 1,000x 60fps video clips with varied physics permutations [OpenAI Sora & Cosmos]</span>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 3 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Validating physical object permanence & momentum</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">1.2s</span>
                              </div>
                              <span className="text-[#75bf00] text-[9.5px] sm:text-[10px] truncate">100% coherence maintained across temporal frames [NVIDIA H100 Cluster]</span>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 4 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Computing zero-hallucination physics proof</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">2.8s</span>
                              </div>
                              <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">Generated physics validity hash #0x4e9b77a2f1 [TensorRT-LLM | CUDA 12.4]</span>
                            </div>
                          </div>

                          {/* Step 5 */}
                          <div className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 5 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Flagging depth-map distortion & occlusion anomaly</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">4.1s</span>
                              </div>
                              <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">Detected 0.05% occlusion violation in frame 42 (automatically rejected from dataset)</span>
                            </div>
                          </div>

                          {/* Step 6 */}
                          <div className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                            <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                              {visibleStep === 6 ? (
                                <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} className="text-[#75bf00]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                              <div className="flex justify-between items-center w-full gap-2">
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Packaging synthetic multi-modal training data</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">6.5s</span>
                              </div>
                              <span className="text-[#75bf00] text-[9.5px] sm:text-[10px] truncate">Synthesis verified. Ready for spatial policy & world model training [Sora & Cosmos]</span>
                            </div>
                          </div>
                        </div>

                        {/* Step 7 */}
                        <div className={`flex gap-2 sm:gap-2.5 mt-1 transition-all duration-500 transform ${visibleStep >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                          <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                            {visibleStep === 7 && typedMsg2.length < AGENT_MSG_2.length ? (
                              <Loader2 size={12} className="text-[#75bf00] animate-spin" />
                            ) : (
                              <Sparkles size={12} className="text-[#75bf00]" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[9px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                            <p className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] leading-[16px] sm:leading-[18px]">
                              {typedMsg2}
                              {visibleStep === 7 && typedMsg2.length < AGENT_MSG_2.length && (
                                <span className="inline-block w-1.5 h-3 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Prompt input bar */}
                      <div className="mt-1.5 shrink-0 mb-1 min-w-0">
                        <div className="bg-[#151515] border border-[#252525] rounded-[4px] p-1.5 sm:p-2 flex flex-col gap-1.5 min-w-0">
                          <input
                            type="text"
                            placeholder="Synthesize 4D world models with verifiable physics and multi-modal telemetry..."
                            className="bg-transparent text-[#F0EFE2] text-[10px] sm:text-[11px] border-none outline-none w-full px-1 py-0.5 placeholder:text-[#555]"
                            readOnly
                          />
                          <div className="flex items-center justify-between px-1 gap-1 min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                                @WorldModels
                              </span>
                              <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                                @PhysicsProofs
                              </span>
                              <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                                @SIM2REAL
                              </span>
                            </div>
                            <button className="w-5 h-5 bg-[#75bf00] hover:bg-[#85cf00] transition-colors flex items-center justify-center text-black font-bold rounded-sm shrink-0">
                              <ArrowUp size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Files Content */}
                    <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-3 sm:p-4 flex flex-col items-start gap-2.5 overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar min-w-0">
                      <div className="flex justify-between items-center border-b border-[#252525] pb-2 mb-1 w-full min-w-0">
                        <span className="text-[9.5px] font-bold tracking-widest text-[#C8C7BA] uppercase truncate">
                          SYNTHETIC REALITY STACK
                        </span>
                        <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[8.5px] font-bold px-1 py-0.5 rounded-sm shrink-0">
                          11
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:gap-1 text-[11px] sm:text-[12px] font-mono w-full min-w-0">
                        <button
                          onClick={() => selectFileManually("README.md")}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "README.md" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#aaa] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">README.md</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("sensor_ast.py")}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "sensor_ast.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">sensor_ast.py</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("spatial_verifier.py")}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "spatial_verifier.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">spatial_verifier.py</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("sensor_auditor.py")}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "sensor_auditor.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">sensor_auditor.py</span>
                        </button>

                        <div className="mt-1 flex flex-col gap-0.5 sm:gap-1 w-full min-w-0">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 text-[#aaa] font-semibold text-[10px] sm:text-[11px] truncate min-w-0">
                            <ChevronDown size={12} className="text-[#777] shrink-0" />{" "}
                            synthetic-world-engine/
                          </div>
                          <div className="pl-2.5 flex flex-col gap-0.5 sm:gap-1 border-l border-[#252525] ml-2 mt-0.5 w-full min-w-0">
                            <button
                              onClick={() => selectFileManually("run_synthetic_world.py")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "run_synthetic_world.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">run_synthetic_world.py</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("eval_physics.py")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "eval_physics.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">eval_physics.py</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("run_batch_synthesis.sh")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "run_batch_synthesis.sh" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">run_batch_synthesis.sh</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("synthetic_pipeline.json")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "synthetic_pipeline.json" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">synthetic_pipeline.json</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("Dockerfile")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">Dockerfile</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("docker-compose.yml")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "docker-compose.yml" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">docker-compose.yml</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("requirements.txt")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "requirements.txt" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">requirements.txt</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-3 sm:p-4 md:p-5 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar min-w-0">
                      <div className="flex border-b border-[#252525] mb-3 pb-1.5 pt-0.5 gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                        {[
                          "run_synthetic_world.py",
                          "eval_physics.py",
                          "sensor_ast.py",
                          "README.md",
                          ...(activeFile && ![
                            "run_synthetic_world.py",
                            "eval_physics.py",
                            "sensor_ast.py",
                            "README.md",
                          ].includes(activeFile)
                            ? [activeFile]
                            : []),
                        ].map((fileName) => {
                          const isSelected = activeFile === fileName;
                          return (
                            <button
                              key={fileName}
                              onClick={() => selectFileManually(fileName)}
                              className={`shrink-0 whitespace-nowrap text-[9.5px] sm:text-[11px] font-mono font-bold px-2 sm:px-2.5 py-1 border-b-2 transition-colors ${isSelected ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                            >
                              {fileName}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex font-mono text-[11px] sm:text-[11.5px] leading-relaxed overflow-x-auto select-text thin-hover-scrollbar">
                        <div className="text-[#444] text-right pr-3 sm:pr-4 border-r border-[#252525] select-none flex flex-col min-w-[28px]">
                          {Array.from({ length: typedCodeText.split('\n').length }).map((_, i) => (
                            <div key={i} className="min-h-[20px] leading-[20px]">{i + 1}</div>
                          ))}
                        </div>

                        <div className="pl-3 sm:pl-4 flex-1 text-[#C8C7BA] leading-[20px]">
                          {highlightCode(
                            typedCodeText,
                            activeFile.endsWith(".md")
                              ? "markdown"
                              : activeFile.endsWith(".py")
                                ? "python"
                                : activeFile.endsWith(".sh")
                                  ? "bash"
                                  : activeFile.endsWith(".json")
                                    ? "json"
                                    : activeFile === "Dockerfile"
                                      ? "dockerfile"
                                      : activeFile.endsWith(".yml") || activeFile.endsWith(".yaml")
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
              <div />
            </div>
          </div>

          {/* Features Grid Row */}
          <div className="w-full relative z-10 mb-16 md:mb-20">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />

              <div className="min-w-0 border-t border-b border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Layers size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      4D Scenario & Environment Synthesis
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Synthesize high-fidelity 3D/4D spatial environments with multi-camera perspective, depth maps, surface normals, and temporal object permanence.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Brain size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Generative World Models & Physics
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Self-host frontier generative world models (OpenAI Sora, NVIDIA Cosmos, Runway Gen-3). Validate counterfactual rollouts and continuous physics dynamics with full weight access.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <ShieldCheck size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Zero-Drift SIM2REAL Verification
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Mathematically verify physics consistency against real robot logs. Detect collision anomalies, eliminate visual hallucination, and export verified training datasets.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-10 md:pt-14 pb-16">
            <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">
                  Supported HF world models & physics engines work
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-8 sm:mb-10">
                  Supported world models, video generation engines, and physics simulators on Hugging Face run through the compatible recipe. Search the live catalog above. The examples below are just a starting view.
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
                    placeholder="Search any world model, physics engine, or video generator on Hugging Face"
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
                    ) : displayedModels.length === 0 ? (
                      <div className="col-span-3 flex justify-center items-center py-24 text-[#C8C7BA] font-mono text-[14px]">
                        No models found for "{searchQuery}"
                      </div>
                    ) : (
                      displayedModels.map((model, index) => {
                        const modelUrl = model.url || model.link || (model.id.startsWith("http") ? model.id : `https://huggingface.co/${model.id}`);
                        return (
                          <a
                            key={model.id}
                            href={modelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={getBorderClasses(index, displayedModels.length) + " block no-underline"}
                          >
                          <ArrowUpRight size={20} className="text-[#75bf00] absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                          
                          <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center bg-[#151515]">
                            {getLogo(model.author, model.name)}
                          </div>
                          
                          <div className="flex flex-col gap-1 min-w-0">
                            <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>
                              {model.name}
                            </h3>
                            <span className="text-[#C8C7BA] text-[14px] line-clamp-1">
                              {model.author}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                            <span className="text-[#A0A098] font-mono text-[12px] shrink-0">
                              {model.downloads || model.params || ""}
                            </span>
                            <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">
                              {model.role || model.tag}
                            </span>
                          </div>
                          </a>
                        );
                      })
                    )}
                  </div>
                  <div className="w-full h-px border-t border-dashed border-[#333]" />
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Section End Divider with Brand Logo */}
          <div className="w-full relative z-20 my-14 md:my-16">
            <SectionDivider position="top" className="w-full" />
          </div>

          {/* Tuning Section */}
          <div className="w-full relative z-10">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">
                  What Horos tunes
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Every stage of the physical perception pipeline, retuned per model and edge sensor workflow.
                </p>

                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Card 1 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">4D Voxel AST Indexing</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Tune 3D spatial occupancy grids and temporal sensor trees for instant alignment of multi-camera and LiDAR streams.
                      </p>
                    </div>

                    {/* Card 2 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Spatial Telemetry Proofs</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Generate verifiable observation matching proofs for every physical trajectory to guarantee zero spatial drift.
                      </p>
                    </div>

                    {/* Card 3 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Sensor Stream Fusion</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Profile multi-sensor alignment rules to highlight frame drops, lens distortion, and thermal/optical skew.
                      </p>
                    </div>

                    {/* Card 4 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Prediction vs. Observation</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Built-in measurement engine continuously comparing physical world model predictions against ground-truth sensor telemetry.
                      </p>
                    </div>

                    {/* Card 5 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Zero-Spatial-Hallucination Audit</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Audit physics consistency, detect impossible momentum or collisions, and prune visual hallucinations before policy training.
                      </p>
                    </div>

                    {/* Card 6 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Workflow size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Physical Fine-Tuning</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Fine-tune NVIDIA Cosmos and Meta V-JEPA on your facility's proprietary camera feeds, spatial maps, and robotics logs.
                      </p>
                    </div>

                  </div>
                  <div className="w-full h-px border-t border-dashed border-[#333]" />
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Section Divider between What Horos tunes and Try this physical pipeline */}
          <div className="w-full relative z-20 my-16 md:my-20">
            <SectionDivider position="top" className="w-full" />
          </div>

          {/* Try this pipeline Section */}
          <div className="w-full relative z-10 pt-4 md:pt-8 pb-24">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div className="border-r border-dashed border-[#333]" />
              <div className="flex flex-col items-center">
                <h2 className="text-[56px] md:text-[64px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
                  Try this physical pipeline
                </h2>
                <p className="text-[#c7c3b7] text-[22px] font-sans leading-relaxed text-center max-w-2xl mb-16 mx-auto">
                  Edit the world model, sensor verifier, or physical agent inline. Send to retune the stack in the dashboard.
                </p>

                <div className="relative z-50 flex justify-center items-center mb-24 w-full h-[261px]">
                  <div className="absolute inset-0 pointer-events-none z-[-1]">
                    <svg width="100%" height="261" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="0%" y1="62.5" x2="100%" y2="62.5" stroke="#2D2D2D" strokeDasharray="3 3" />
                      <line x1="0%" y1="16.5" x2="100%" y2="16.5" stroke="#2D2D2D" strokeDasharray="3 3" />
                      <line x1="0%" y1="247.5" x2="100%" y2="247.5" stroke="#2D2D2D" strokeDasharray="3 3" />
                      <line x1="0%" y1="201.5" x2="100%" y2="201.5" stroke="#2D2D2D" strokeDasharray="3 3" />

                      <line x1="0%" y1="253.5" x2="100%" y2="253.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      <line x1="0%" y1="260.5" x2="100%" y2="260.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      <line x1="0%" y1="0.5" x2="100%" y2="0.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      <line x1="0%" y1="7.5" x2="100%" y2="7.5" stroke="#6E6E6E" strokeDasharray="3 3" />

                      <g style={{ transform: "translateX(calc(50% - 411px))" }}>
                        <line x1="0" y1="17.5" x2="0" y2="246.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                        <line x1="-5" y1="15.5" x2="-5" y2="248.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                        <line x1="-11" y1="17.5" x2="-11" y2="246.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      </g>

                      <g style={{ transform: "translateX(calc(50% + 411px))" }}>
                        <line x1="0" y1="16.5" x2="0" y2="245.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                        <line x1="6" y1="14.5" x2="6" y2="247.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                        <line x1="11" y1="16.5" x2="11" y2="245.5" stroke="#6E6E6E" strokeDasharray="3 3" />
                      </g>
                    </svg>
                  </div>

                  <div className="w-[822px] max-w-full relative z-10">
                    <TokenPromptInput fixedPromptIndex={12} hideHeader={true} showSuggestions={false} cardClassName="!bg-[#202020]" />
                  </div>
                </div>

              </div>
              <div className="border-l border-dashed border-[#333]" />
            </div>
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full" />
          </div>

          {/* FAQ Section */}
          <div className="w-full relative z-10 border-t border-dashed border-[#333]">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              {/* Left Column Margin with Inner and Outer dashed lines */}
              <div className="border-r border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333]" />
              </div>

              {/* Center Column: FAQ Content */}
              <div className="py-20 md:py-24 flex flex-col items-center px-4 md:px-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#f2efe8] mb-3 text-center">
                  Common <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">questions</span>
                </h2>
                <p className="text-[#C8C7BA] text-sm sm:text-base font-sans text-center mb-10">
                  Can&apos;t find what you&apos;re looking for? <a href="#" className="text-[#75bf00] hover:underline">Get in touch</a>
                </p>

                {/* Vertical Question Buttons */}
                <div className="flex flex-col items-center gap-2.5 w-full mb-10">
                  {FAQ_DATA.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveFaq(idx)}
                      className={`px-6 py-2.5 text-[14px] sm:text-[15px] transition-colors text-center ${
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
                      {FAQ_DATA[activeFaq]?.question || FAQ_DATA[0].question}
                    </h3>
                    <p className="text-[#C8C7BA] text-[15px] md:text-[16px] leading-relaxed whitespace-pre-line">
                      {FAQ_DATA[activeFaq]?.answer || FAQ_DATA[0].answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column Margin with Inner and Outer dashed lines */}
              <div className="border-l border-dashed border-[#333] relative">
                <div className="hidden md:block absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333]" />
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
                <div className="hidden md:flex absolute top-[96px] left-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><TeslaLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[96px] left-[144px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><NvidiaLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[144px] left-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><OneXLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[192px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MistralLogo size={20} /></div>

                {/* Floating Brand Cubes - Right Cluster (Inside) */}
                <div className="hidden md:flex absolute bottom-[240px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><SGLangLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[192px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><DeepSeekLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[144px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><QwenLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[144px] right-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><TeslaLogo size={20} /></div>
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
                Deploy your first physical<br className="hidden md:block" />
                reality agent, <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">measured</span> before you<br className="hidden md:block" />
                ship
              </h2>

              <p className="text-[#a0a0a0] text-[18px] md:text-[20px] font-sans mb-12">
                Describe the sensor stream ingestion or spatial perception task. Horos builds and optimizes the edge physical stack.
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
                  Isolated edge infrastructure
                </div>
                <div className="flex items-center gap-2.5 text-[#C8C7BA] text-[14px] font-medium border border-[#333] rounded-sm px-5 py-3 bg-[#111]/80 backdrop-blur-md">
                  <EyeOff size={16} className="text-[#75bf00]" />
                  No training on your camera feeds
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

