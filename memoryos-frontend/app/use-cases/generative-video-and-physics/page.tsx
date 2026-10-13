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
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, TeslaLogo, OneXLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch, Camera, Eye, Radio, Scan } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "Launch",
    runInfra: { title: "Synthesize 4D world models", desc: "Ingest massive raw video datasets and physically render 4D world models from diverse camera modalities." },
    closed: { title: "Single-prompt video generation", desc: "Generate short, single-prompt clips without temporal consistency or underlying physical dynamics." },
    diy: { title: "Build custom render clusters", desc: "Spend months configuring fragile Unreal/Blender rendering farms and custom physics plugins." }
  },
  {
    num: "0 2",
    label: "Verification",
    runInfra: { title: "Verified physical consistency", desc: "Every physical trajectory and object permanence is mathematically verified against known physics priors." },
    closed: { title: "Hallucinated physical depth", desc: "High risk of phantom objects, hallucinated physics, and impossible trajectories in generated outputs." },
    diy: { title: "Manual frame-by-frame review", desc: "Teams must manually audit thousands of hours of rendered video to identify physics violations." }
  },
  {
    num: "0 3",
    label: "Multi-Modal Audit",
    runInfra: { title: "Multi-modal synthetic data", desc: "Synthesize rich training telemetry including depth maps, optical flow, and temporal object permanence." },
    closed: { title: "RGB-only outputs", desc: "Basic visual summaries that lack spatial depth, occlusion logic, and temporal telemetry." },
    diy: { title: "Ad-hoc rendering scripts", desc: "Fragile scripts unable to consistently extract aligned multi-modal telemetry across distributed rendering nodes." }
  },
  {
    num: "0 4",
    label: "Model Control",
    runInfra: { title: "Fine-tuned generative world models", desc: "Deploy domain-adapted Open Sora, Meta MovieGen, and Cosmos-1 models optimized for realistic physics." },
    closed: { title: "Locked to cloud API defaults", desc: "Generic models lacking fine-tuning for your specific spatial physics requirements or camera angles." },
    diy: { title: "Prompt-only tuning", desc: "Inability to adapt underlying model weights for fast, high-resolution edge video generation." }
  },
  {
    num: "0 5",
    label: "Operations",
    runInfra: { title: "Autonomous synthetic pipelines", desc: "Automate video generation, physics validation, and spatial telemetry extraction for model training." },
    closed: { title: "High human operator toil", desc: "Data teams spend hours manually parsing generated videos to filter out physically impossible clips." },
    diy: { title: "High operational overhead", desc: "Your team owns driver compatibility, render queue scaling, and maintaining the physics engine configurations." }
  },
  {
    num: "0 6",
    label: "Security",
    runInfra: { title: "Private synthetic datasets", desc: "Zero data leakage with air-gapped local cluster execution for secure proprietary video synthesis." },
    closed: { title: "Cloud API IP risks", desc: "Sensitive training data and prompts uploaded continuously to third-party public cloud APIs." },
    diy: { title: "Self-managed farm security", desc: "Your team owns storage encryption, render node isolation, and compliance for the physics cluster." }
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

RUN apt-get update && apt-get install -y python3.11 ros-humble-ros-base ffmpeg libopenal-dev

WORKDIR /physical
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY agent/ /physical/agent/
COPY README.md run_physical_decoding.py run_sensor_ingestion.sh decoding_pipeline.json .

EXPOSE 8080 8554
ENTRYPOINT ["/physical/run_sensor_ingestion.sh"]`;

const DOCKER_COMPOSE_CODE = `version: "3.8"

services:
  physical-decoder:
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
      - SENSOR_SYNC_POLICY=strict-observation-matching
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
  { id: "openai/sora-1-worldmodel", name: "Sora WorldModel", author: "OpenAI", description: "Frontier generative video model for hyper-realistic physics and temporal consistency.", role: "World Model" },
  { id: "runwayml/Gen-3-Alpha", name: "Gen-3 Alpha", author: "Runway", description: "High-fidelity video generation model compiled for rapid multi-modal physics simulation.", role: "Physics Engine" },
  { id: "kuaishou/Kling-Video-1.5", name: "Kling Video", author: "Kuaishou", description: "Advanced spatial reasoning engine for complex physical object permanence.", role: "Spatial Reasoning" },
  { id: "meta/MovieGen-World", name: "MovieGen World", author: "Meta", description: "Joint-embedding architecture for self-supervised physical world rendering.", role: "Generative Predictive" },
  { id: "google/Lumiere-Video", name: "Lumiere Video", author: "Google", description: "Space-time U-Net agent fine-tuned on multi-modal physical video streams.", role: "Video Agent" },
  { id: "lumaai/Dream-Machine", name: "Dream Machine", author: "Luma AI", description: "Spatial rendering & temporal physics decoder for autonomous video synthesis.", role: "Video Rendering" },
  { id: "mistralai/Pixtral-12B-Physical", name: "Pixtral Physical MoE", author: "Mistral", description: "High-throughput multimodal vision-spatial model for real-time video generation audits.", role: "Multimodal MoE" },
  { id: "qwen/Qwen2.5-VL-72B-Video", name: "Qwen2.5 VL Video", author: "Qwen", description: "Frontier vision-language model fine-tuned on video world dynamics and synthesis.", role: "Vision-Action LLM" },
  { id: "microsoft/Phi-3.5-Vision-Spatial", name: "Phi-3.5 Vision Spatial", author: "Microsoft", description: "Compact video physics solver and low-power edge TPU trajectory verifier.", role: "Edge Performer" }
];

const getLogo = (author: string, modelName: string = "") => {
  if (!author && !modelName) return <HuggingFaceLogo size={20} />;
  const a = (author || "").toLowerCase();
  const m = (modelName || "").toLowerCase();

  if (a.includes('openai') || m.includes('gpt')) return <OpenAILogo size={20} />;
  if (a.includes('nvidia') || m.includes('cosmos') || m.includes('nemo')) return <NvidiaLogo size={20} />;
  if (a.includes('tesla') || m.includes('fsd')) return <TeslaLogo size={20} />;
  if (a.includes('1x') || a.includes('onex') || m.includes('humanoid')) return <OneXLogo size={20} />;
  if (a.includes('meta') || m.includes('v-jepa')) return <MetaLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('google') || m.includes('rt-2')) return <GoogleLogo size={20} />;
  if (a.includes('mistral') || m.includes('pixtral')) return <MistralLogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
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
    question: "How does Horos synthesize the physical world to train models?",
    answer: "Horos ingests massive datasets of generated video from engines like OpenAI Sora, extracting continuous prediction mechanics, depth maps, and object permanence to create unified 4D spatial training data.",
  },
  {
    question: "Can the generative physics engine run on local edge clusters?",
    answer: "Yes. All video generation models, spatial telemetry extraction, and verifiers compile directly into TensorRT-LLM binaries for fast, private deployment on local NVIDIA GPU clusters.",
  },
  {
    question: "How does it ensure physical accuracy in generated video?",
    answer: "The Physics Validation Engine continuously computes prediction error against known physical priors, generating zero-hallucination spatial proofs to filter out physically impossible generated trajectories.",
  }
];

export default function GenerativeVideoAndPhysicsPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("run_physical_decoding.py" as any);
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "README.md": README_CODE,
    "sensor_ast.py": SENSOR_AST_CODE,
    "spatial_verifier.py": SPATIAL_VERIFIER_CODE,
    "sensor_auditor.py": SENSOR_AUDITOR_CODE,
    "run_physical_decoding.py": RUN_SIMULATION_CODE,
    "eval_perception.py": EVAL_PHYSICS_CODE,
    "run_sensor_ingestion.sh": RUN_DFT_AUDIT_CODE,
    "decoding_pipeline.json": SIMULATION_PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE
  };

  const AGENT_MSG_1 = "On it. Initializing generative video synthesis pipeline. Running OpenAI Sora WorldModel & Runway Gen-3 over TensorRT-LLM H100 cluster for batch spatial training data generation.";
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
                    Generative Video<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      & Physics
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Synthesize the physical world to train AI models. Construct generative video and physics pipelines to train next-generation spatial models.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Deploy video physics agent <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Read the architecture <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Video Generation"
                    label2="Physics Engines"
                    label3="Spatial Synthesis"
                    label4="Model Training"
                  />
                </div>
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full relative z-10 mt-16">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4">Own your generative video & physics stack</h2>
                <p className="text-[#C8C7BA] text-[20px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  The video synthesis pipelines, the generative physics engines, the robust spatial training data verifiers. Complete sovereignty over generative world models.
                </p>
              </div>
            </div>
            <div />
          </div>

          <div className="w-full relative z-10">
            
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />

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
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 1</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The physical<br/>perception models.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the physical world models (NVIDIA Cosmos-1, Meta V-JEPA), 3D spatial occupancy grids, and VLA agents. Zero vendor lock-in on your perception AI.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 2</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The spatial<br/>verifiers.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the prediction-vs-observation measurement engines, spatial trajectory verifiers, and telemetry logs. Zero spatial hallucination guaranteed.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 3</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The edge<br/>containers.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the compiled TensorRT binaries and Docker/ROS2 containers. Deploy on NVIDIA Jetson Orin, Jetson Thor, or edge gateways seamlessly.
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
        <div className="w-full relative z-10 mt-32 mb-32">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="flex flex-col items-center mb-16 px-4">
            <h2 className="text-[40px] md:text-[56px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
              Three ways to decode physical reality
            </h2>
            <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed text-center max-w-2xl">
              Workflow comparison for physical intelligence agents across Horos, closed visual LLM APIs, and DIY C++ ROS2 scripts.
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
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Verified sensor telemetry & 0 spatial drift.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed LLM APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Opaque text/vision APIs without spatial proofs.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">DIY C++ ROS2</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Brittle ROS2 wrappers & manual stream parsing.</p>
                  </div>
                </div>

                <div className="border-l border-r border-b border-dashed border-[#333]">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <div key={idx} className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200">
                      <div className="flex items-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] min-h-[72px]">
                        <div className="flex items-center gap-3">
                          <span className="text-[#75bf00] font-mono text-[12px] font-bold">{row.num}</span>
                          <span className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2]">{row.label}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#75bf00] mb-1 leading-snug">{row.runInfra.title}</h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed">{row.runInfra.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <h4 className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2] mb-2">{row.closed.title}</h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed">{row.closed.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <h4 className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2] mb-2">{row.diy.title}</h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed">{row.diy.desc}</p>
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
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-16 mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-5xl lg:text-[52px] font-medium tracking-tight mb-6">
                  Physical agents you own. <span className="text-[#75bf00]">Decode reality anywhere.</span>
                </h2>
                <p className="text-[#999999] text-[18px] max-w-2xl mx-auto leading-relaxed">
                  The full recipe ships with you. TensorRT CUDA engines, 4D spatial AST graphs, Cosmos-1 models, and ROS2 edge controllers. Run it on any physical node.
                </p>
              </div>
            </div>
            <div />
          </div>

          <SectionDivider position="top" className="absolute top-0 left-0 right-0 z-20" />

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">
            <div className="w-full relative mx-auto max-w-[1351px]" style={{ aspectRatio: '1351 / 892' }}>

              {/* Panes Backgrounds */}
              <div className="absolute inset-0 grid" style={{
                gridTemplateColumns: '41fr 443fr 226fr 602fr 39fr',
                gridTemplateRows: '53.5fr 785fr 53.5fr'
              }}>
                <div className="col-start-2 col-end-5 row-start-1 row-end-2 bg-[#151515]" />
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 bg-[#151515]" />
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 bg-[#151515]" />
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 bg-[#151515]" />
              </div>

              <SkeletonGrid className="absolute inset-0 w-full h-full z-10" />

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
                  <div className="flex items-center gap-2 mt-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={replayAnimation} title="Replay Animation">
                    <span className="w-2 h-2 rounded-full bg-[#75bf00] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#75bf00] tracking-widest uppercase">Live</span>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-6 flex flex-col justify-between overflow-hidden pointer-events-auto">
                  <div className="flex flex-col gap-6 overflow-y-auto chat-scroll pr-2 pb-4">
                    <div className="bg-[#1a1a1a] border border-[#252525] p-5 rounded-[4px]">
                      <p className="text-[#C8C7BA] text-[15px] font-sans leading-[28px]">
                        Generate physically grounded synthetic video datasets in batch. Generative physics pipeline with{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#F0EFE2] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <OpenAILogo size={13} /> OpenAI Sora
                        </span>{" "}
                        world model plus{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#F0EFE2] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <HuggingFaceLogo size={13} /> Runway Gen-3
                        </span>{" "}
                        physics verification on{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#75bf00] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <NvidiaLogo size={13} /> H100 TensorRT Cluster
                        </span>.
                      </p>
                    </div>

                    {/* Step 1 */}
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

                    {/* Logs list */}
                    <div className="flex flex-col gap-4 mt-2">
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Batch generating 4D video datasets</span>
                            <span className="text-[#C8C7BA] text-[12px]">0.4s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Generated 1,000x 60fps video clips with varied physics permutations [OpenAI Sora WorldModel]</span>
                        </div>
                      </div>

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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Validating physical object permanence</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.2s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">100% coherence maintained across temporal frames [NVIDIA H100 Cluster]</span>
                        </div>
                      </div>

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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Computing zero-hallucination physics proof</span>
                            <span className="text-[#C8C7BA] text-[12px]">2.8s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Generated physics validity hash #0x4e9b77a2f1 [Runway Gen-3 | TensorRT-LLM]</span>
                        </div>
                      </div>

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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Flagging depth-map distortion anomaly</span>
                            <span className="text-[#C8C7BA] text-[12px]">4.1s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Detected 0.05% occlusion violation in frame 42 (automatically rejected from dataset)</span>
                        </div>
                      </div>

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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Packaging synthetic multi-modal training data</span>
                            <span className="text-[#C8C7BA] text-[12px]">6.5s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">Synthesis verified. Ready for spatial model training [Model: Sora & Gen-3]</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 7 */}
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

                  {/* Prompt input bar */}
                  <div className="mt-2 shrink-0 mb-2">
                    <div className="bg-[#151515] border border-[#252525] rounded-[4px] p-2 flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Teach the agent to decode multi-camera sensor streams against spatial verifiers..."
                        className="bg-transparent text-[#F0EFE2] text-[13px] border-none outline-none w-full px-2 py-2"
                        readOnly
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="flex gap-1.5">
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@Capabilities</span>
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@SensorStreams</span>
                        </div>
                        <button className="w-6 h-6 bg-[#75bf00] hover:bg-[#85cf00] transition-colors flex items-center justify-center text-black font-bold rounded-sm">
                          <ArrowUp size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files Content */}
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-6 flex flex-col items-start gap-4 overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                  <div className="flex justify-between items-center border-b border-[#252525] pb-3 mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase">PHYSICAL SOLVERS</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">11</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-[13px] font-mono">
                    <button
                      onClick={() => selectFileManually("README.md")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "README.md" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#aaa] hover:text-[#C8C7BA]"}`}
                    >
                      README.md
                    </button>
                    <button
                      onClick={() => selectFileManually("sensor_ast.py")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "sensor_ast.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      sensor_ast.py
                    </button>
                    <button
                      onClick={() => selectFileManually("spatial_verifier.py")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "spatial_verifier.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      spatial_verifier.py
                    </button>
                    <button
                      onClick={() => selectFileManually("sensor_auditor.py")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "sensor_auditor.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      sensor_auditor.py
                    </button>

                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[#aaa] font-semibold">
                        <ChevronDown size={14} className="text-[#777]" /> physical-agent-factory/
                      </div>
                      <div className="pl-4 flex flex-col gap-1.5 border-l border-[#252525] ml-3.5 mt-1">
                        <button
                          onClick={() => selectFileManually("run_physical_decoding.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "run_physical_decoding.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_physical_decoding.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("eval_perception.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "eval_perception.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          eval_perception.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("run_sensor_ingestion.sh")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "run_sensor_ingestion.sh" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_sensor_ingestion.sh
                        </button>
                        <button 
                          onClick={() => selectFileManually("decoding_pipeline.json")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "decoding_pipeline.json" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          decoding_pipeline.json
                        </button>
                        <button 
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          Dockerfile
                        </button>
                        <button
                          onClick={() => selectFileManually("docker-compose.yml")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "docker-compose.yml" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          docker-compose.yml
                        </button>
                        <button
                          onClick={() => selectFileManually("requirements.txt")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "requirements.txt" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          requirements.txt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                  <div className="flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                    {["README.md", "run_physical_decoding.py", "eval_perception.py", "run_sensor_ingestion.sh", "decoding_pipeline.json", "sensor_ast.py", "spatial_verifier.py", "sensor_auditor.py", "Dockerfile", "docker-compose.yml", "requirements.txt"].map(fileName => (
                      <button
                        key={fileName}
                        onClick={() => selectFileManually(fileName)}
                        className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === fileName ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                      >
                        {fileName}
                      </button>
                    ))}
                  </div>

                  <div className="flex font-mono text-[13px] leading-relaxed overflow-x-auto select-text thin-hover-scrollbar">
                    <div className="text-[#444] text-right pr-5 border-r border-[#252525] select-none flex flex-col min-w-[32px]">
                      {Array.from({ length: typedCodeText.split('\n').length }).map((_, i) => (
                        <div key={i} className="min-h-[22px] leading-[22px]">{i + 1}</div>
                      ))}
                    </div>

                    <div className="pl-5 flex-1 text-[#C8C7BA] leading-[22px]">
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

          {/* Features Grid Row */}
          <div className="w-full relative z-10">
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              

              <div className="min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Camera size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Sensor Stream Ingestion</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Multi-camera RTSP, LiDAR point clouds, thermal sensor arrays, and IMU telemetry feeds cross-referenced in real-time 4D spatial graphs.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Radio size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Cosmos-1 & World Weights</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Self-host physical world models (NVIDIA Cosmos-1, Meta V-JEPA) in your edge cloud. Complete IP privacy and local weight ownership.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-8 py-16 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The ROS2 Edge Automation</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Generate zero-drift spatial telemetry proofs and ROS2 robotics actuation commands guaranteeing verified physical operation.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-24 pb-16">
            <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="flex flex-col items-center">
                <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] xl:text-[52px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-2xl mx-auto leading-tight">
                  Any physical world or spatial perception model works
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                  Use any open-weights physical world model as your perception engine, and fine-tune any compact edge target model. The examples below are just a starting view.
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
                    placeholder="Search any physical AI, spatial perception, or world model on Hugging Face"
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
                            <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>
                              {model.name}
                            </h3>
                            <span className="text-[#C8C7BA] text-[14px] line-clamp-1">
                              {model.author}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                            <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0"></span>
                            <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">
                              {model.role || model.tag}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="w-full h-px border-t border-dashed border-[#333]" />
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Tuning Section */}
          <div className="w-full relative z-10 mt-20">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0">
                <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] xl:text-[52px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-2xl mx-auto leading-tight">
                  What Horos tunes
                </h2>
                <p className="text-[#A0A098] text-[15px] sm:text-[16px] font-sans leading-relaxed text-center max-w-lg mx-auto mb-12">
                  Every stage of the physical perception pipeline, retuned per model and edge sensor workflow.
                </p>

                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Row 1 */}
                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">4D Voxel AST Indexing</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Tune 3D spatial occupancy grids and temporal sensor trees for instant alignment of multi-camera and LiDAR streams.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Spatial Telemetry Proofs</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Generate verifiable observation matching proofs for every physical trajectory to guarantee zero spatial drift.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Sensor Stream Fusion</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Profile multi-sensor alignment rules to highlight frame drops, lens distortion, and thermal/optical skew.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Prediction vs. Observation</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Built-in measurement engine continuously comparing physical world model predictions against ground-truth sensor telemetry.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Zero-Spatial-Hallucination Audit</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Quantize vision-action weights (FP8/INT8) and compile low-latency TensorRT binaries for Jetson edge nodes.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Workflow size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Physical Fine-Tuning</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Fine-tune NVIDIA Cosmos-1 and Meta V-JEPA on your facility's proprietary camera feeds, spatial maps, and robotics logs.
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
                  {FAQ_DATA[activeFaq].question}
                </h3>
                <p className="text-[#C8C7BA] text-[16px] leading-relaxed max-w-3xl">
                  {FAQ_DATA[activeFaq].answer}
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

