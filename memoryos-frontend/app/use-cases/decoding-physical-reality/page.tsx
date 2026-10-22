"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, TeslaLogo, OneXLogo, PhysicalIntelligenceLogo, OpenVLALogo } from "@/components/horos/primitives/brand-icons";
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
      title: "Unified physical AI loop",
      desc: "Connect sensor streams, world model prediction, action policies, and edge control in one verifiable loop."
    },
    closed: {
      title: "Individual model APIs",
      desc: "Call separate black-box APIs for vision, prediction, and action with no unified physical state."
    },
    diy: {
      title: "Fragmented custom pipelines",
      desc: "Handcrafted ROS/Zenoh glue scripts bridging separate vision, prediction, and planning libraries."
    }
  },
  {
    num: "0 2",
    label: "Models",
    horos: {
      title: "Open weight physical models & policies",
      desc: "Train, fine-tune, and deploy Cosmos Predict 2.5, V-JEPA 2, GR00T N1.5, and π0.5 on your target hardware."
    },
    closed: {
      title: "Vendor-hosted models",
      desc: "Use closed proprietary endpoints with zero weight access, high cloud latency, and no edge runtime."
    },
    diy: {
      title: "Manual model management",
      desc: "Assemble checkpoints, bespoke PyTorch scripts, and incompatible dependencies independently."
    }
  },
  {
    num: "0 3",
    label: "Context",
    horos: {
      title: "4D spatial & sensor state",
      desc: "Unified 4D voxel occupancy grids, camera feeds, LiDAR point clouds, IMU telemetry, and joint state history."
    },
    closed: {
      title: "Stateless prompt payloads",
      desc: "Submit individual image frames or text prompts with no persistent physical spatial memory."
    },
    diy: {
      title: "Custom sensor integration",
      desc: "Maintain custom drivers, coordinate transforms, and uncalibrated sensor buffer queues yourself."
    }
  },
  {
    num: "0 4",
    label: "Capabilities",
    horos: {
      title: "Perception-to-action reasoning",
      desc: "End-to-end multi-modal spatial reasoning, future-state rollout prediction, and closed-loop robot control."
    },
    closed: {
      title: "Disconnected inference",
      desc: "Independent prompt responses with no coordinate grounding or physical action synthesis."
    },
    diy: {
      title: "Heuristic motion scripts",
      desc: "Stitch together separate perception detectors, trajectory planners, and PID controllers."
    }
  },
  {
    num: "0 5",
    label: "Workload",
    horos: {
      title: "Continuous real-time streaming",
      desc: "Sub-10ms real-time sensor ingestion, dynamic prediction evaluation, and deterministic action dispatch."
    },
    closed: {
      title: "High-latency cloud requests",
      desc: "Variable cloud round-trip latency (200ms–2s) that violates real-time physical control deadlines."
    },
    diy: {
      title: "Unoptimized CPU/GPU pipeline",
      desc: "Frequent bottlenecking from host-to-device memory copies, thread contention, and frame drops."
    }
  },
  {
    num: "0 6",
    label: "Optimization",
    horos: {
      title: "Full physical stack tuning",
      desc: "Joint optimization of sensor frame rates, precision (FP8/INT8), TensorRT compilation, and control latency."
    },
    closed: {
      title: "Opaque parameter dials",
      desc: "Restricted to vendor temperature and top-p settings with no edge compilation or sensor tuning."
    },
    diy: {
      title: "Manual profiling loops",
      desc: "Time-consuming manual CUDA kernel profiling, custom quantization, and fragmented runtimes."
    }
  },
  {
    num: "0 7",
    label: "Verification",
    horos: {
      title: "Zero-drift mathematical proofs",
      desc: "Real-time observation verifier comparing sensor telemetry against model predictions to eliminate spatial drift."
    },
    closed: {
      title: "Qualitative visual output",
      desc: "No deterministic spatial verification or ground-truth telemetry comparison."
    },
    diy: {
      title: "Ad-hoc trial and error",
      desc: "Manual inspection of camera recordings and post-hoc error calculations with no mathematical proofs."
    }
  },
  {
    num: "0 8",
    label: "Experience",
    horos: {
      title: "Physical lineage & telemetry logging",
      desc: "Cryptographic sensor-to-action audit trails, replayable failure cases, and real-world rollout telemetry."
    },
    closed: {
      title: "Vendor request logs",
      desc: "Episodic API logs with no physical telemetry, trajectory data, or unified sensor state."
    },
    diy: {
      title: "Scattered rosbags & flat files",
      desc: "Unindexed bag files, fragmented disk logs, and disconnected experiment notes."
    }
  },
  {
    num: "0 9",
    label: "Teaching",
    horos: {
      title: "Trajectory-guided adaptation",
      desc: "Continuous model adaptation using real-world demonstration traces, hard physical edge cases, and simulation rollouts."
    },
    closed: {
      title: "Provider-limited options",
      desc: "Limited to basic cloud fine-tuning with no access to low-level weights or edge deployment."
    },
    diy: {
      title: "Manual dataset assembly",
      desc: "Hand-labeling failure frames and running custom training scripts without systematic regression benchmarks."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    horos: {
      title: "Safety gates & hardware interlocks",
      desc: "Enforce robot operational envelopes, emergency stops, safety constraints, and automated hardware approvals."
    },
    closed: {
      title: "Vendor access controls",
      desc: "Generic token-based access with no robot safety envelopes, interlocks, or real-time guardrails."
    },
    diy: {
      title: "Brittle software assertions",
      desc: "Ad-hoc software assertions and manual supervisor intervention without hardware-enforced guarantees."
    }
  }
];

const README_CODE = `# Physical Reality Decoding Engine

Autonomous sensor-stream ingestion and physical AI world model runtime powered by Horos.

## Architecture Overview
- Perception Engines: NVIDIA Cosmos Predict 2.5 & Meta V-JEPA 2
- Robotics Policies: NVIDIA GR00T N1.5 & π0.5
- Perception Stack: Qwen3-VL, 4D Voxel Occupancy Grid & Sensor Stream Graph
- Verification: Zero-drift spatial prediction vs. observation verifier
- Edge Compute: NVIDIA Jetson Thor / Orin & TensorRT CUDA 12.4 acceleration

## Batch Execution
$ horos-physical-agent decode \\
    --input-streams rtsp://camera-cluster-01/feed \\
    --world-model NVIDIA-Cosmos-Predict-2.5 \\
    --spatial-proofs enabled`;

const SENSOR_AST_CODE = `# 4D Spatial Voxel Occupancy & Sensor AST Builder
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class SpatialNode:
    sensor_id: str
    modality: str  # camera_rgb, lidar_pointcloud, thermal, imu
    timestamp_ns: int
    bounding_box_3d: Tuple[float, float, float, float, float, float]
    confidence: float

class SpatialASTEngine:
    """Parses multi-sensor streams into a 4D spatial-temporal world graph."""
    
    @staticmethod
    def build_world_graph(sensor_payload: Dict[str, any]) -> Dict[str, any]:
        """Generate 3D spatial occupancy grid and sensor alignment vectors."""
        nodes = [
          SpatialNode("cam_front_left", "camera_rgb", 1726054800000, (-1.2, 3.4, 0.5, 0.8, 1.8, 1.2), 0.994),
          SpatialNode("lidar_top", "lidar_pointcloud", 1726054800005, (-1.19, 3.41, 0.51, 0.81, 1.79, 1.21), 0.998),
          SpatialNode("thermal_array_01", "thermal", 1726054800010, (-1.2, 3.4, 0.5, 0.8, 1.8, 1.2), 0.989),
        ]
        return {
            "spatial_nodes": nodes,
            "voxel_grid_resolution_m": 0.05,
            "temporal_alignment_delta_ms": 0.002,
            "world_state_entropy": 0.014
        }`;

const SPATIAL_VERIFIER_CODE = `# Zero-Drift Spatial & Physical Trajectory Verifier
import torch
from typing import List, Dict

class SpatialVerifier:
    """Mathematical prediction vs observation verifier for physical reality."""
    
    def __init__(self, policy: str = "strict-observation-matching"):
        self.policy = policy
        self.max_spatial_drift_m = 0.005  # 5mm tolerance

    def verify_telemetry(self, predicted_state: Dict, sensor_observation: Dict) -> Dict[str, any]:
        """Verify predicted spatial trajectory against ground-truth sensor telemetry."""
        drift_distance = np.linalg.norm(
            np.array(predicted_state["position"]) - np.array(sensor_observation["position"])
        )
        
        is_valid = float(drift_distance) <= self.max_spatial_drift_m
        return {
            "is_valid": is_valid,
            "proof_hash": "0x4e9b77a2f1c890e4",
            "spatial_drift_meters": float(drift_distance),
            "policy_enforced": self.policy
        }`;

const SENSOR_AUDITOR_CODE = `# Multi-Sensor Fusion & Latency Compliance Auditor
from typing import Dict

class SensorFusionAuditor:
    """Audits sensor frame drops, timestamp skew, and thermal/spatial anomalies."""
    
    def __init__(self, target_fps: int = 60):
        self.target_fps = target_fps

    def audit_stream_health(self, stream_telemetry: Dict) -> Dict[str, float]:
        """Calculate sensor fusion synchronization and spatial perception confidence."""
        return {
            "stream_synchronization_pct": 99.98,
            "jitter_ms": 0.14,
            "frame_drop_rate": 0.0001,
            "spatial_fidelity_score": 99.94
        }`;

const RUN_SIMULATION_CODE = `# Physical Reality Decoding Engine with Spatial Telemetry Verification
import torch
from horos_physical import PhysicalDecoderAgent, SpatialVerifier, SpatialASTEngine, SensorFusionAuditor

# Initialize physical perception agent with NVIDIA Cosmos Predict 2.5 & V-JEPA 2
agent = PhysicalDecoderAgent.from_pretrained("nvidia/cosmos-predict-2.5")
spatial_verifier = SpatialVerifier(policy="strict-observation-matching")
auditor = SensorFusionAuditor(target_fps=60)

def decode_physical_reality(sensor_streams: list, target_resolution_m: float = 0.05):
    """Ingest real-time camera/LiDAR streams and compute verified 4D world state."""
    
    # Construct 4D spatial voxel AST graph from live sensor feeds
    world_graph = SpatialASTEngine.build_world_graph(sensor_streams)
    
    # Audit stream sync and latency telemetry
    health = auditor.audit_stream_health(world_graph)
    
    # Decode physical world state on 8x NVIDIA Jetson Thor edge node
    predicted_world = agent.predict_world_state(world_graph, resolution=target_resolution_m)
    
    # Mathematically verify prediction against live camera observations
    spatial_proof = spatial_verifier.verify_telemetry(predicted_world, sensor_streams[0])
    
    if spatial_proof["is_valid"]:
        return {
            "decoding_status": "SUCCESS",
            "spatial_fidelity": health["spatial_fidelity_score"],
            "proof_hash": spatial_proof["proof_hash"],
            "spatial_drift_m": 0.0,
            "edge_actuation_trigger": "ros2_robotics_controller.py"
        }
        
    return None`;

const RUN_DFT_AUDIT_CODE = `#!/usr/bin/env bash
# Physical reality decoding batch stream verification runner
set -euo pipefail

STREAMS_DIR="rtsp://edge-gateway-cluster/sensors"
WORLD_MODEL="NVIDIA-Cosmos-Predict-2.5"

echo "[Horos Physical] Initializing NVIDIA Jetson Thor Edge CUDA 12.4 pipeline..."
echo "[Horos Physical] Processing 60fps multi-camera & LiDAR streams..."

# Execute zero-drift physical reality decoding with TensorRT acceleration
horos-physical-agent decode \\
  --input-streams $STREAMS_DIR \\
  --world-model $WORLD_MODEL \\
  --spatial-proofs enabled \\
  --drift-tolerance strict \\
  --output-json ./physical_world_audit.json`;

const SIMULATION_PIPELINE_CODE = `{
  "name": "decoding-physical-reality",
  "version": "2.4.0",
  "agent": "physical-decoder-v1",
  "world_model": "nvidia-cosmos-predict-2.5",
  "edge_runtime": "TensorRT-CUDA-12.4",
  "perception_engine": "Meta-V-JEPA-2",
  "action_policy": "NVIDIA-GR00T-N1.5",
  "spatial_proofs": true,
  "spatial_drift_threshold_m": 0.005,
  "sensor_audits": [
    "camera_rgb_4k",
    "lidar_pointcloud_3d",
    "thermal_array",
    "imu_telemetry"
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

const EVAL_PHYSICS_CODE = `# Evaluation harness: measuring spatial perception and sensor decoding accuracy
from horos_eval import PerceptionEvaluator, SpatialSafetyGate

def evaluate_decoder_accuracy(sensor_feed: str, decoding_report: dict) -> dict:
    """Verify physical reality decoding accuracy and spatial zero-drift guarantee."""
    
    evaluator = PerceptionEvaluator()
    safety = SpatialSafetyGate(policy="zero-spatial-drift")
    
    # Mathematically verify spatial prediction proofs against sensor telemetry
    proof_passed = safety.verify_proof(decoding_report["proof_hash"])
    
    # Calculate 3D bounding box IOU precision and spatial tracking accuracy
    accuracy_score = evaluator.score_world_state(decoding_report)
    
    return {
        "spatial_proof_verified": proof_passed,
        "iou_precision_score": accuracy_score.iou_3d,
        "phantom_objects_detected": 0
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
    id: "nvidia/GR00T-N1.7-3B",
    name: "Isaac GR00T N1.7",
    author: "NVIDIA",
    url: "https://huggingface.co/nvidia/GR00T-N1.7-3B",
    params: "3B",
    role: "Humanoid Robotics",
    description: "Humanoid robotics foundation policy for multi-modal sensor perception and whole-body motor control."
  },
  {
    id: "nvidia/Cosmos3-Super",
    name: "Cosmos3-Super",
    author: "NVIDIA",
    url: "https://huggingface.co/nvidia/Cosmos3-Super",
    params: "65B",
    role: "World Model",
    description: "Frontier physical world model for photorealistic dynamics simulation and continuous state prediction."
  },
  {
    id: "nvidia/Cosmos3-Nano",
    name: "Cosmos3-Nano",
    author: "NVIDIA",
    url: "https://huggingface.co/nvidia/Cosmos3-Nano",
    params: "16B",
    role: "Physical AI",
    description: "High-throughput physical AI engine optimized for real-time edge execution and spatial scene reasoning."
  },
  {
    id: "nvidia/Cosmos-Predict2.5-14B",
    name: "Cosmos Predict 2.5",
    author: "NVIDIA",
    url: "https://huggingface.co/nvidia/Cosmos-Predict2.5-14B",
    params: "14B",
    role: "Future Prediction",
    description: "Autoregressive 4D future-state prediction model conditioned on real-time multi-camera sensor history."
  },
  {
    id: "nvidia/Cosmos-Transfer2.5-2B",
    name: "Cosmos Transfer 2.5",
    author: "NVIDIA",
    url: "https://huggingface.co/nvidia/Cosmos-Transfer2.5-2B",
    params: "2B",
    role: "World Generation",
    description: "World generation and spatial domain transfer engine for sim-to-real sensor stream synthesis."
  },
  {
    id: "nvidia/Cosmos-Policy-LIBERO-Predict2-2B",
    name: "Cosmos Policy",
    author: "NVIDIA",
    url: "https://huggingface.co/nvidia/Cosmos-Policy-LIBERO-Predict2-2B",
    params: "2B",
    role: "Robot Manipulation",
    description: "Spatial policy model for precision robotic arm manipulation and zero-drift trajectory execution."
  },
  {
    id: "facebook/vjepa2-vitg-fpc64-256",
    name: "V-JEPA 2",
    author: "META",
    url: "https://huggingface.co/facebook/vjepa2-vitg-fpc64-256",
    params: "1B",
    role: "Physical Prediction",
    description: "Self-supervised Joint-Embedding Predictive Architecture for feature-space physical world dynamics."
  },
  {
    id: "lerobot/pi05_base",
    name: "π0.5",
    author: "PHYSICAL INTELLIGENCE",
    url: "https://huggingface.co/lerobot/pi05_base",
    params: "4B",
    role: "Robot Foundation Model",
    description: "General-purpose physical robot foundation model for dexterity, manipulation, and real-world task autonomy."
  },
  {
    id: "openvla/openvla-7b",
    name: "OpenVLA",
    author: "OPENVLA COLLABORATION",
    url: "https://huggingface.co/openvla/openvla-7b",
    params: "7B-class",
    role: "Vision-Language-Action",
    description: "Open-source vision-language-action model trained on real robot manipulation datasets and camera feeds."
  }
];

const getLogo = (author: string, modelName: string = "") => {
  if (!author && !modelName) return <HuggingFaceLogo size={20} />;
  const a = (author || "").toLowerCase();
  const m = (modelName || "").toLowerCase();

  if (a.includes('openai') || m.includes('gpt')) return <OpenAILogo size={20} />;
  if (a.includes('nvidia') || m.includes('cosmos') || m.includes('nemo') || m.includes('gr00t')) return <NvidiaLogo size={20} />;
  if (a.includes('tesla') || m.includes('fsd')) return <TeslaLogo size={20} />;
  if (a.includes('1x') || a.includes('onex') || m.includes('humanoid')) return <OneXLogo size={20} />;
  if (a.includes('meta') || a.includes('facebook') || m.includes('v-jepa')) return <MetaLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('google') || m.includes('rt-2')) return <GoogleLogo size={20} />;
  if (a.includes('mistral') || m.includes('pixtral')) return <MistralLogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('physical intelligence') || m.includes('π0') || a.includes('lerobot')) return <PhysicalIntelligenceLogo size={20} />;
  if (a.includes('openvla') || m.includes('openvla')) return <OpenVLALogo size={20} />;

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
    question: "How does Horos decode physical reality from heterogeneous sensor streams?",
    answer: "Horos ingests real-time RTSP video, LiDAR point clouds, IMU telemetry, and thermal arrays into a unified 4D spatial representation, continuous prediction engine, and ground-truth observation verifier. By synchronizing multi-rate sensor frames with sub-millisecond hardware timestamp alignment, Horos constructs dense 3D voxel occupancy grids and continuous spatial state vectors that feed neural world models and robot action policies with zero coordinate drift.",
  },
  {
    question: "Can the physical reality engine run on edge hardware like NVIDIA Jetson Orin or Thor?",
    answer: "Yes. All perception models, 3D spatial occupancy grids, and observation verifiers compile directly into TensorRT binaries for low-latency edge deployment (sub-10ms) on Jetson nodes, robotic controllers, or local edge gateways. The runtime eliminates network round-trip delays, running deterministic perception-to-action control loops completely on-device.",
  },
  {
    question: "How does it eliminate spatial hallucinations and unverified physical claims?",
    answer: "The Measurement Engine continuously computes prediction error between real-time sensor observations and physical model predictions, generating zero-drift mathematical spatial proofs before taking authorized action. Candidate joint trajectories and manipulation paths are checked against kinematic boundary envelopes, torque limits, and collision meshes in real time.",
  },
  {
    question: "Which frontier physical AI, world models, and robotics policies are supported?",
    answer: "Horos natively supports top open-weight physical models from Hugging Face—including NVIDIA Cosmos (Cosmos3-Super 65B, Cosmos Predict 2.5 14B, Cosmos Transfer 2.5 2B, Cosmos Policy 2B), Meta V-JEPA 2 (1B), Physical Intelligence π₀ and π0-FAST (3.1B), NVIDIA Isaac GR00T N1.7 (3B), OpenVLA (7B), SmolVLA, UniAD, and Depth Anything V2. Custom models can be loaded via Hugging Face model IDs or local checkpoint directories.",
  },
  {
    question: "How does Horos close the sim-to-real gap for physical robotics?",
    answer: "Horos links neural world predictors with high-fidelity physics simulators (MuJoCo, NVIDIA Isaac Gym, Genesis) and recorded robot telemetry. By applying automated domain randomization, camera noise modeling, latency jitter simulation, and counterfactual trajectory rollouts, Horos benchmarks policy robustness and measures out-of-distribution drift before physical hardware deployment.",
  },
  {
    question: "Can I deploy fully air-gapped runtimes with native ROS2 and Zenoh integration?",
    answer: "Yes. Horos exports standalone, containerized deployment packages equipped with zero-copy shared memory IPC, ROS2 Humble/Iron nodes, and Zenoh middleware bridges. Runtimes operate completely offline with zero telemetry or cloud phone-home requirements, end-to-end encryption, and full SOC 2 Type II compliance.",
  }
];

export default function DecodingPhysicalRealityPage() {
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

  const AGENT_MSG_1 = "On it. Initializing real-time sensor stream ingestion across 16x 4K cameras & LiDAR. Running NVIDIA Cosmos Predict 2.5 & V-JEPA 2 over Jetson Thor cluster.";
  const AGENT_MSG_2 = "Decoding complete. Trajectory verified with zero drift against robot telemetry. GR00T action policy promoted.";

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

            let tag = "Physical AI Target";
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

            <img
              src="/images/physical-jet-engine.png"
              alt="Decoding Physical Reality Jet Engine Background"
              className="w-full h-full object-contain object-center"
              style={{
                maskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, black 25%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, black 25%, transparent 95%)',
                filter: 'url(#brand-duotone-physical-bg)'
              }}
            />
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
                    Decoding Physical<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      Reality
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Turn camera, LiDAR, IMU, and robot telemetry into models that understand physical states, predict motion, and learn from real-world outcomes.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Deploy Physical AI <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Explore the stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid
                    label1="Sensor Streams"
                    label2="3D Scene Understanding"
                    label3="State Estimation"
                    label4="Robot Telemetry"
                    label5="Motion & Dynamics"
                    label6="Action Outcomes"
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
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What you actually own
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Your sensor data, physical-world models, and evaluation results. Horos helps you turn real-world observations into models that predict motion, understand changing states, and improve from measured outcomes.
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
                      Your physical data
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Bring camera feeds, LiDAR scans, IMU readings, and robot telemetry. Keep sensor timestamps, calibration, and recorded trajectories linked to each experiment.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">02</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Your world models
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Evaluate models such as{" "}
                      <a
                        href="https://huggingface.co/nvidia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#75bf00] hover:underline underline-offset-2"
                      >
                        NVIDIA Cosmos
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://huggingface.co/facebook/vjepa2-vitg-fpc64-256"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#75bf00] hover:underline underline-offset-2"
                      >
                        V-JEPA 2
                      </a>{" "}
                      on scene changes, motion prediction, and physical-state understanding.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-3">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">03</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Your real-world results
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Compare predicted motion and states against robot logs or simulator ground truth. Track failures across scenarios and use verified examples to evaluate improved model versions.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="w-full relative z-10 mt-28 md:mt-32 mb-32">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="flex flex-col items-center mb-8 md:mb-10 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">Three ways to build Physical AI
            </h2>
            <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
              Engineer intelligence that reads physical observations, predicts what happens next, and learns to control real systems. Horos connects model development to experiments, measured outcomes, and verified deployment.
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
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed Engineering AI APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Individual hosted model APIs.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={16} className="text-[#C8C7BA] shrink-0" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">DIY Engineering Pipelines</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Fragmented models, solvers & scripts.</p>
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
                          <span className="text-[13px] sm:text-[13.5px] font-medium text-[#F0EFE2]">
                            {row.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                        <span className="md:hidden text-[10px] font-mono font-bold text-[#75bf00] uppercase mb-1">
                          Horos
                        </span>
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#75bf00] mb-1 leading-tight">
                          {row.horos.title}
                        </h4>
                        <p className="text-[#E6E5D8] text-[12px] sm:text-[12.5px] leading-snug leading-relaxed">
                          {row.horos.desc}
                        </p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <span className="md:hidden text-[10px] font-mono font-bold text-[#C8C7BA] uppercase mb-1">
                          Closed Engineering AI APIs
                        </span>
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#F0EFE2] mb-1 leading-tight">
                          {row.closed.title}
                        </h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] leading-snug leading-relaxed">
                          {row.closed.desc}
                        </p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <span className="md:hidden text-[10px] font-mono font-bold text-[#C8C7BA] uppercase mb-1">
                          DIY Engineering Pipelines
                        </span>
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#F0EFE2] mb-1 leading-tight">
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
        <div className="w-full relative z-10 mt-32">
          {/* Top Divider for Sandbox Section */}
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-16 mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight mb-2.5 sm:mb-3 text-center">
                  Physical agents you own.{" "}
                  <span className="text-[#75bf00]">Decode reality anywhere.</span>
                </h2>
                <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] md:text-[15px] max-w-2xl mx-auto leading-relaxed text-center">
                  The complete physical AI stack ships with you. Real-time sensor stream ingestion, world models (NVIDIA Cosmos Predict 2.5, Meta V-JEPA 2), robotics action policies (GR00T N1.5, π0.5), and ROS2 edge deployment.
                </p>
              </div>
            </div>
            <div />
          </div>

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
                            Decode multi-camera RTSP & LiDAR sensor streams in real time. Physical world model with{" "}
                            <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#F0EFE2] font-mono text-[8.5px] sm:text-[9.5px] align-middle whitespace-nowrap">
                              <NvidiaLogo size={10} /> NVIDIA Cosmos Predict 2.5
                            </span>{" "}
                            &{" "}
                            <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#F0EFE2] font-mono text-[8.5px] sm:text-[9.5px] align-middle whitespace-nowrap">
                              <MetaLogo size={10} /> Meta V-JEPA 2
                            </span>{" "}
                            telemetry verification on{" "}
                            <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#75bf00] font-mono text-[8.5px] sm:text-[9.5px] align-middle whitespace-nowrap">
                              <NvidiaLogo size={10} /> Jetson Thor
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
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Ingesting multi-camera RTSP & LiDAR streams</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">0.4s</span>
                              </div>
                              <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">Parsed 16x 60fps sensor feeds into 4D spatial voxel graph [Cosmos Predict 2.5]</span>
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
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Checking spatial prediction error bounds</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">1.2s</span>
                              </div>
                              <span className="text-[#75bf00] text-[9.5px] sm:text-[10px] truncate">100% telemetry match against sensor ground-truth [NVIDIA Jetson Thor]</span>
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
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Computing zero-drift spatial telemetry proof</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">2.8s</span>
                              </div>
                              <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">Generated proof hash #0x4e9b77a2f1 [Meta V-JEPA 2 | TensorRT 10]</span>
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
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Flagging thermal & sensor skew anomaly</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">4.1s</span>
                              </div>
                              <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">Detected 0.002s timestamp delta on Camera 04 (resynchronized)</span>
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
                                <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">Generating verified physical world state update</span>
                                <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">6.5s</span>
                              </div>
                              <span className="text-[#75bf00] text-[9.5px] sm:text-[10px] truncate">Decoding verified. Ready for ROS2 edge actuation [Cosmos Predict 2.5 & GR00T N1.5]</span>
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
                      <div className="mt-1.5 shrink-0 mb-1 min-w-0">
                        <div className="bg-[#151515] border border-[#252525] rounded-[4px] p-1.5 sm:p-2 flex flex-col gap-1.5 min-w-0">
                          <input
                            type="text"
                            placeholder="Teach the agent to decode multi-camera sensor streams..."
                            className="bg-transparent text-[#F0EFE2] text-[10px] sm:text-[11px] border-none outline-none w-full px-1 py-0.5 placeholder:text-[#555]"
                            readOnly
                          />
                          <div className="flex items-center justify-between px-1 gap-1 min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                                @Perception
                              </span>
                              <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                                @WorldModels
                              </span>
                              <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                                @ActionPolicies
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
                    <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-2.5 sm:p-3 md:p-3.5 flex flex-col items-start gap-2 overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar min-w-0">
                      <div className="flex justify-between items-center border-b border-[#252525] pb-2 mb-1 w-full shrink-0">
                        <span className="text-[9px] sm:text-[9.5px] font-bold tracking-widest text-[#C8C7BA] uppercase truncate">
                          PHYSICAL STACK
                        </span>
                        <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0">
                          11
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] font-mono w-full min-w-0">
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
                            physical-stack/
                          </div>
                          <div className="pl-2.5 flex flex-col gap-0.5 sm:gap-1 border-l border-[#252525] ml-2 mt-0.5 w-full min-w-0">
                            <button
                              onClick={() => selectFileManually("run_physical_decoding.py")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "run_physical_decoding.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">run_physical_decoding.py</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("eval_perception.py")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "eval_perception.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">eval_perception.py</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("run_sensor_ingestion.sh")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "run_sensor_ingestion.sh" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">run_sensor_ingestion.sh</span>
                            </button>
                            <button
                              onClick={() => selectFileManually("decoding_pipeline.json")}
                              className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "decoding_pipeline.json" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <span className="truncate min-w-0 flex-1">decoding_pipeline.json</span>
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
                          "run_physical_decoding.py",
                          "eval_perception.py",
                          "sensor_ast.py",
                          "README.md",
                          ...(activeFile && ![
                            "run_physical_decoding.py",
                            "eval_perception.py",
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

                      <div className="flex font-mono text-[9.5px] sm:text-[11px] leading-[17px] sm:leading-[19px] overflow-x-auto select-text thin-hover-scrollbar min-w-0 flex-1">
                        <div className="text-[#444] text-right pr-2 sm:pr-2.5 border-r border-[#252525] select-none flex flex-col min-w-[20px] sm:min-w-[24px] text-[9px] sm:text-[10px]">
                          {Array.from({
                            length: typedCodeText.split("\n").length,
                          }).map((_, i) => (
                            <div key={i} className="min-h-[17px] sm:min-h-[19px] leading-[17px] sm:leading-[19px]">
                              {i + 1}
                            </div>
                          ))}
                        </div>

                        <div className="pl-2 sm:pl-2.5 flex-1 text-[#C8C7BA] leading-[17px] sm:leading-[19px] whitespace-pre min-w-0">
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
                                      : activeFile.endsWith(".yml") ||
                                        activeFile.endsWith(".yaml")
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

              {/* Added top horizontal line per user request */}
              <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Camera size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Sensor Stream Ingestion
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Ingest camera feeds, LiDAR point clouds, IMU telemetry, and robot state in real time. Maintain precise sensor timestamps, multi-camera calibration, and recorded trajectories.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Radio size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      World Models & Dynamics
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Evaluate frontier physical models including NVIDIA Cosmos Predict 2.5 and Meta V-JEPA 2. Predict scene changes, spatial dynamics, and physical states with full weight ownership.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Robotics Actions & Verification
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Deploy action policies with NVIDIA GR00T N1.5 and π0.5 into ROS2 edge controllers. Compare predicted motion against real-world robot telemetry and eliminate drift.
                    </p>
                  </div>
                </div>
              </div>

              <div />
            </div>
          </div>

          {/* Section End Divider with Brand Logo */}
          <div className="w-full relative z-20 my-16 md:my-24">
            <SectionDivider position="top" className="w-full" />
          </div>

          {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-10 md:pt-14 pb-16">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">
                  Supported HF chat models work
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-8 sm:mb-10">
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
                        <a
                          key={model.id}
                          href={model.url || model.link || `https://huggingface.co/${model.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={getBorderClasses(index, models.length) + " block no-underline"}
                        >
                          <ArrowUpRight size={20} className="text-[#75bf00] absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center">
                            {getLogo(model.author, model.name)}
                          </div>

                          <div className="flex flex-col gap-1 min-w-0">
                            <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>
                              {model.name}
                            </h3>
                            <span className="text-[#C8C7BA] text-[14px] line-clamp-1" title={model.author}>
                              {model.author}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                            <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0 font-mono">
                              {model.params || model.downloads || ""}
                            </span>
                            <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">
                              {model.role || model.tag}
                            </span>
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                  <div className="w-full h-px border-t border-dashed border-[#333]" />
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Section End Divider with Brand Logo */}
          <div className="w-full relative z-20 my-16 md:my-20">
            <SectionDivider position="top" className="w-full" />
          </div>

          {/* Tuning Section */}
          <div className="w-full relative z-10">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What Horos tunes</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Every stage of physical intelligence, optimized per model, sensor stack, robot platform, and edge hardware.
                </p>

                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">

                    {/* Card 1 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Radio size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Sensor-to-state processing</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Tune camera resolution, LiDAR sampling, IMU rates, and timestamp alignment. Measure how sensor quality and synchronization affect state estimation.
                      </p>
                    </div>

                    {/* Card 2 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Eye size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Physical-world representations</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Evaluate V-JEPA 2 and NVIDIA Cosmos on scene changes, motion, and future-state prediction. Compare temporal context and input sampling against prediction error.
                      </p>
                    </div>

                    {/* Card 3 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Cpu size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Robot policy inference</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Benchmark GR00T, π0, and OpenVLA on supported robot tasks. Tune action chunking, observation history, and inference frequency against task success and control latency.
                      </p>
                    </div>

                    {/* Card 4 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Edge inference optimization</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Compare supported precision modes, quantization, inference kernels, and memory allocation on target hardware. Measure latency, throughput, and power consumption.
                      </p>
                    </div>

                    {/* Card 5 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Activity size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Closed-loop control</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Measure perception-to-action latency, missed control deadlines, action consistency, and recovery after unexpected observations. Test under realistic robot workloads.
                      </p>
                    </div>

                    {/* Card 6 */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <ShieldCheck size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Physical-world verification</h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-relaxed">
                        Replay sensor recordings and evaluate in simulation before robot trials. Compare predicted states, task completion, constraint violations, and failure rates across model versions.
                      </p>
                    </div>

                  </div>
                  <div className="w-full h-px border-t border-dashed border-[#333]" />
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Section Divider between What Horos tunes and Try this pipeline */}
          <div className="w-full relative z-20 my-16 md:my-20">
            <SectionDivider position="top" className="w-full" />
          </div>

          {/* Try this pipeline Section */}
          <div className="w-full relative z-10 pt-4 md:pt-8 pb-24">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div className="border-r border-dashed border-[#333]" />
              <div className="flex flex-col items-center">
                <h2 className="text-[56px] md:text-[64px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">Try this physical pipeline</h2>
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
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />
          </div>

          {/* FAQ Section */}
          <div className="w-full relative z-10">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              {/* Left Column Margin with Inner and Outer dashed lines */}
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
                      className={`px-6 py-2.5 text-[14px] sm:text-[15px] transition-colors text-center ${activeFaq === idx
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

