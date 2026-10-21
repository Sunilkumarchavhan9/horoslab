"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";
import { EmbodiedHumanoidBgAnimation } from "@/components/landing/embodied-humanoid-bg-animation";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, TeslaLogo, OneXLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch, Camera, Eye, Radio, Scan } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "Latency",
    runInfra: { title: "Sub-10ms edge execution", desc: "Execute complex VLA models directly on the robot's local Jetson Thor with zero network latency round-trips." },
    closed: { title: "High-latency cloud APIs", desc: "Sending camera frames to the cloud takes 500ms+, causing robotic stuttering and critical control failures." },
    diy: { title: "Unoptimized ROS nodes", desc: "Running heavy PyTorch models on raw edge hardware without TensorRT optimization." }
  },
  {
    num: "0 2",
    label: "Safety",
    runInfra: { title: "Verified kinematics guards", desc: "Mathematical verification ensures predicted joint angles never violate hardware torque limits or collision boundaries." },
    closed: { title: "Unpredictable hallucinations", desc: "Cloud LLMs can hallucinate impossible movements, potentially destroying expensive robotic actuators." },
    diy: { title: "Manual hardcoded rules", desc: "Fragile C++ scripts trying to manually catch out-of-bounds joint commands before they execute." }
  },
  {
    num: "0 3",
    label: "Perception",
    runInfra: { title: "Multi-modal sensor fusion", desc: "Fuse high-res RGB, depth maps, proprioception, and tactile feedback into a unified 4D spatial world state." },
    closed: { title: "RGB-only vision", desc: "Basic visual summaries that lack crucial spatial depth, force feedback, and fine motor telemetry." },
    diy: { title: "Asynchronous data streams", desc: "Struggling to temporally align camera frames with high-frequency tactile sensors in ROS." }
  },
  {
    num: "0 4",
    label: "Model Control",
    runInfra: { title: "Fine-tuned robotics policies", desc: "Deploy domain-adapted Google RT-2, Pixtral Physical MoE, or 1X Humanoid models." },
    closed: { title: "Generic chat models", desc: "Locked to text-heavy models that lack fine-tuning for spatial robotics or physical affordances." },
    diy: { title: "Prompt-only adaptation", desc: "Inability to adapt underlying model weights for fast, high-frequency motor control loops." }
  },
  {
    num: "0 5",
    label: "Operations",
    runInfra: { title: "Autonomous edge deployment", desc: "Seamlessly push new control policies and safety rules to fleets of distributed humanoid robots." },
    closed: { title: "Network-dependent operation", desc: "Robots completely shut down and fail tasks when facility Wi-Fi or cellular networks drop." },
    diy: { title: "High operational overhead", desc: "Your team spends months managing OTA updates, driver compatibility, and edge OS configurations." }
  },
  {
    num: "0 6",
    label: "Security",
    runInfra: { title: "Air-gapped edge privacy", desc: "Zero data leakage. All sensory data and facility maps stay strictly on the robot's local hardware." },
    closed: { title: "Cloud API IP risks", desc: "Sensitive facility maps, proprietary workflows, and camera feeds uploaded to third-party servers." },
    diy: { title: "Self-managed OS security", desc: "Your team owns OS hardening, local storage encryption, and privileged access management." }
  }
];

const README_CODE = `# Embodied Humanoid Robots Engine

Low-latency brains for physical embodiment. Deploy Vision-Language-Action (VLA) models and spatial control policies directly to the edge.

## Architecture Overview
- VLA Models: Google RT-2, Pixtral Physical, 1X Humanoid Perception
- Edge Hardware: NVIDIA Jetson Thor / Orin & TensorRT-LLM
- Safety Guards: Mathematical verification of kinematics and torque limits
- Perception: Multi-modal fusion (cameras, proprioception, tactile)

## Local Edge Deployment
$ horos-robot-agent deploy \\
    --robot-id humanoid-01 \\
    --vla-model google-rt-2 \\
    --kinematics-verifier strict`;

const ROBOT_AST_CODE = `# 4D Spatial World State & Sensor AST Builder
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class EmbodiedNode:
    sensor_id: str
    modality: str  # camera_rgb, proprioception, tactile
    timestamp_ns: int
    data_vector: Tuple[float, ...]
    confidence: float

class HumanoidASTEngine:
    """Parses multi-sensor streams into a 4D spatial world state graph."""
    
    @staticmethod
    def extract_world_graph(sensor_payload: Dict[str, any]) -> Dict[str, any]:
        """Align vision and proprioception into a unified temporal representation."""
        nodes = [
          EmbodiedNode("cam_head", "rgb", 1726054800000, (12.4, 34.2, 105.1), 0.994),
          EmbodiedNode("joint_arm_l", "proprioception", 1726054800002, (0.45, -1.2, 0.8), 0.999),
          EmbodiedNode("hand_r", "tactile", 1726054800004, (14.2, 5.1), 0.989),
        ]
        return {
            "embodied_nodes": nodes,
            "temporal_alignment_ms": 0.002,
            "sensor_fusion_confidence": 0.997,
            "world_state_entropy": 0.012
        }`;

const KINEMATICS_VERIFIER_CODE = `# Zero-Hallucination Kinematics Verifier
import torch
from typing import List, Dict

class KinematicsVerifier:
    """Mathematical verification of predicted joint angles and torque limits."""
    
    def __init__(self, policy: str = "strict-collision-avoidance"):
        self.policy = policy
        self.max_torque_nm = 120.0  # Max allowable joint torque

    def verify_action_trajectory(self, predicted_joints: List[Dict], hardware_limits: Dict) -> Dict[str, any]:
        """Verify model-predicted kinematics against physical robot constraints."""
        peak_torque = max([j["torque"] for j in predicted_joints])
        
        is_safe = float(peak_torque) <= self.max_torque_nm
        return {
            "is_safe": is_safe,
            "safety_hash": "0x8f2c44b9a1",
            "peak_torque_nm": float(peak_torque),
            "policy_enforced": self.policy
        }`;

const SAFETY_AUDITOR_CODE = `# Real-Time Robotic Safety Auditor
from typing import Dict

class SafetyAuditor:
    """Audits real-time control loops for latency spikes and anomaly detection."""
    
    def __init__(self, target_hz: int = 1000):
        self.target_hz = target_hz

    def audit_control_loop(self, loop_telemetry: Dict) -> Dict[str, float]:
        """Calculate latency jitter and control loop stability."""
        return {
            "loop_frequency_hz": 998.4,
            "latency_jitter_ms": 0.12,
            "anomaly_rate": 0.0001,
            "actuator_health_score": 99.99
        }`;

const RUN_EMBODIED_AGENT_CODE = `# VLA Control Loop with Kinematics Verification
import torch
from horos_robotics import EmbodiedAgent, KinematicsVerifier, HumanoidASTEngine, SafetyAuditor

# Initialize Vision-Language-Action agent with Google RT-2
agent = EmbodiedAgent.from_pretrained("google/rt-2-vla-model")
kinematics_verifier = KinematicsVerifier(policy="strict-collision-avoidance")
auditor = SafetyAuditor(target_hz=1000)

def execute_robotic_task(sensor_streams: list, task_prompt: str):
    """Execute high-frequency control loop on humanoid hardware."""
    
    # Parse multi-modal sensors into 4D world state
    world_state = HumanoidASTEngine.extract_world_graph(sensor_streams)
    
    # Audit real-time control loop latency
    health = auditor.audit_control_loop(world_state)
    
    # Predict required joint movements based on task and world state
    predicted_actions = agent.predict_actions(world_state, task=task_prompt)
    
    # Mathematically verify predicted joint angles against hardware limits
    safety_proof = kinematics_verifier.verify_action_trajectory(predicted_actions, hardware_limits)
    
    if safety_proof["is_safe"]:
        return {
            "execution_status": "SUCCESS",
            "actuator_health": health["actuator_health_score"],
            "safety_hash": safety_proof["safety_hash"],
            "peak_torque_nm": safety_proof["peak_torque_nm"],
            "command_ready": True
        }
        
    return None`;

const RUN_ROBOT_PIPELINE_CODE = `#!/usr/bin/env bash
# Embodied Humanoid edge deployment and safety verification runner
set -euo pipefail

SENSOR_TOPIC="ros2://humanoid-01/sensors"
VLA_MODEL="Google-RT-2"

echo "[Horos Robotics] Initializing NVIDIA Jetson Thor Edge cluster..."
echo "[Horos Robotics] Starting 1000Hz Vision-Language-Action control loop..."

# Execute verifiable robotic policy with TensorRT acceleration
horos-robot-agent deploy \\
  --sensor-stream $SENSOR_TOPIC \\
  --vla-model $VLA_MODEL \\
  --kinematics-guards enabled \\
  --safety-tolerance strict \\
  --output-log ./robot_operations.log`;

const ROBOT_PIPELINE_CODE = `{
  "name": "embodied-humanoid-robots",
  "version": "1.2.0",
  "agent": "humanoid-control-v1",
  "vla_model": "google-rt-2-vla",
  "edge_runtime": "TensorRT-LLM-CUDA-12.4",
  "safety_engine": "Horos-Kinematics-Verifier",
  "kinematics_guards": true,
  "max_torque_nm": 120.0,
  "sensor_inputs": [
    "camera_rgb_head",
    "lidar_chest",
    "joint_encoders",
    "tactile_fingers"
  ]
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.0-devel-ubuntu22.04 AS base

RUN apt-get update && apt-get install -y python3.11 ros-humble-ros-base ffmpeg libopenal-dev

WORKDIR /physical
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY agent/ /physical/agent/
COPY README.md run_embodied_agent.py run_robot_pipeline.sh robot_pipeline.json .

EXPOSE 8080 8554
ENTRYPOINT ["/physical/run_robot_pipeline.sh"]`;

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

const EVAL_POLICY_CODE = `# Evaluation harness: measuring physical dexterity and task success
from horos_eval import PolicyEvaluator, KinematicsSafetyGate

def evaluate_embodied_policy(task_definition: str, execution_log: dict) -> dict:
    """Verify physical execution accuracy and collision-free guarantees."""
    
    evaluator = PolicyEvaluator()
    safety = KinematicsSafetyGate(policy="zero-hardware-collisions")
    
    # Mathematically verify kinematics safety proofs against execution log
    proof_passed = safety.verify_proof(execution_log["safety_hash"])
    
    # Calculate physical dexterity and task completion success rate
    success_score = evaluator.score_physical_task(execution_log)
    
    return {
        "kinematics_proof_verified": proof_passed,
        "task_completion_rate": success_score.completion_pct,
        "hardware_collisions_detected": 0
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
  { id: "google/RT-2-Vision-Language-Action", name: "RT-2 VLA Model", author: "Google", description: "Robotic vision-language-action agent fine-tuned on multi-modal physical sensor streams.", role: "VLA Agent" },
  { id: "onex/Humanoid-Perception-8B", name: "Humanoid Perception 8B", author: "1X Tech", description: "Spatial point-cloud & actuator feedback decoder for autonomous physical embodiment.", role: "Robot Perception" },
  { id: "nvidia/Cosmos-1-Vision-WorldModel", name: "Cosmos-1 WorldModel", author: "NVIDIA", description: "Frontier physical world model for real-time sensor stream perception.", role: "World Model" },
  { id: "deepseek-ai/DeepSeek-R1-Spatial-Reasoning", name: "DeepSeek R1 Spatial", author: "DeepSeek", description: "Deep reasoning engine for multi-sensor stream fusion and trajectory proofs.", role: "Spatial Reasoning" },
  { id: "meta/V-JEPA-2-Physical-World", name: "V-JEPA 2 Physical", author: "Meta", description: "Joint-embedding predictive architecture for self-supervised physical world model encoding.", role: "JEPA Predictive" },
  { id: "mistralai/Pixtral-12B-Physical", name: "Pixtral Physical MoE", author: "Mistral", description: "High-throughput multimodal vision-spatial model for real-time thermal & camera stream audits.", role: "Multimodal MoE" },
  { id: "qwen/Qwen2.5-VL-72B-Physical", name: "Qwen2.5 VL Physical", author: "Qwen", description: "Frontier vision-language model fine-tuned on physical world dynamics and actuator telemetry.", role: "Vision-Action LLM" },
  { id: "microsoft/Phi-3.5-Vision-Spatial", name: "Phi-3.5 Vision Spatial", author: "Microsoft", description: "Compact physical sensor solver and low-power edge TPU spatial telemetry verifier.", role: "Edge Performer" },
  { id: "tesla/Optimus-Brain-V2", name: "Optimus Brain V2", author: "Tesla", description: "Multi-camera spatial occupancy grid model compiled for zero-latency CUDA edge execution.", role: "Spatial Occupancy" }
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
    question: "How does Horos deploy models to physical robots?",
    answer: "Horos compiles massive VLA models down into optimized TensorRT-LLM binaries that run directly on local edge nodes like the NVIDIA Jetson Thor, allowing for sub-10ms inference loops without network dependencies.",
  },
  {
    question: "How do you prevent AI hallucinations from causing physical damage?",
    answer: "Every predicted joint trajectory passes through the Kinematics Validation Engine before execution. It mathematically verifies that the commands will not violate hardware torque limits, self-collide, or breach safety boundaries.",
  },
  {
    question: "Can it handle multi-modal inputs beyond just vision?",
    answer: "Yes, the Humanoid AST Engine fuses high-resolution RGB, LiDAR depth maps, proprioception (joint states), and tactile feedback into a unified 4D spatial world state for the VLA model to reason over.",
  }
];

export default function EmbodiedHumanoidsPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("run_embodied_agent.py" as any);
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "README.md": README_CODE,
    "robot_ast.py": ROBOT_AST_CODE,
    "kinematics_verifier.py": KINEMATICS_VERIFIER_CODE,
    "safety_auditor.py": SAFETY_AUDITOR_CODE,
    "run_embodied_agent.py": RUN_EMBODIED_AGENT_CODE,
    "eval_policy.py": EVAL_POLICY_CODE,
    "run_robot_pipeline.sh": RUN_ROBOT_PIPELINE_CODE,
    "robot_pipeline.json": ROBOT_PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE
  };

  const AGENT_MSG_1 = "On it. Initializing humanoid edge cluster. Loading Vision-Language-Action models (Google RT-2 & Pixtral) and connecting to joint actuator telemetry over local ROS2 network.";
  const AGENT_MSG_2 = "Embodiment active. 4D spatial awareness verified. Kinematics safety guards engaged. Operating at 1000Hz control loop. Actuator safety proof #0x8f2c... valid.";

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
    const fullCode = FILE_CODE_MAP[activeFile] || "";

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
              className="w-full h-full opacity-30"
              style={{ 
                maskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, black 25%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, black 25%, transparent 95%)'
              }}
            >
              <EmbodiedHumanoidBgAnimation />
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
                    Embodied Humanoid<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      Robots
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Low-latency brains for physical embodiment. Train and deploy Vision-Language-Action (VLA) models and spatial control policies directly to the edge.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Deploy humanoid policy <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Read the architecture <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="VLA Models"
                    label2="Kinematics Verifier"
                    label3="Spatial Telemetry"
                    label4="Actuator Control"
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
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4">Own your humanoid robotic stack</h2>
                <p className="text-[#C8C7BA] text-[20px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  The Vision-Language-Action models, the kinematics verification engines, the robust multi-modal data streams. Complete sovereignty over your physical embodied agents.
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
                        Deploy VLA models to embodied hardware. Spatial perception and actuator control loop with{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#F0EFE2] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <GoogleLogo size={13} /> Google RT-2
                        </span>{" "}
                        policy plus{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#F0EFE2] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <MistralLogo size={13} /> Pixtral Physical MoE
                        </span>{" "}
                        kinematics verification on{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#75bf00] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <NvidiaLogo size={13} /> Jetson Thor Edge Node
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Booting VLA model on edge node</span>
                            <span className="text-[#C8C7BA] text-[12px]">0.4s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Initialized 1000Hz motor control loop [Google RT-2]</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Verifying hardware kinematics guards</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.2s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">Predicted joint angles are within strict 120Nm torque limits [NVIDIA Thor]</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Computing zero-collision safety proof</span>
                            <span className="text-[#C8C7BA] text-[12px]">2.8s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Generated safety validity hash #0x8f2c44b9a1 [Pixtral Physical MoE]</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Flagging tactile sensor latency</span>
                            <span className="text-[#C8C7BA] text-[12px]">4.1s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Detected 0.002s latency spike on left actuator (automatically compensated)</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Executing verified actuator commands</span>
                            <span className="text-[#C8C7BA] text-[12px]">6.5s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">Control loop active. Emitting commands to ROS2 [Model: RT-2 & Pixtral]</span>
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
                      onClick={() => selectFileManually("robot_ast.py")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "robot_ast.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      robot_ast.py
                    </button>
                    <button
                      onClick={() => selectFileManually("kinematics_verifier.py")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "kinematics_verifier.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      kinematics_verifier.py
                    </button>
                    <button
                      onClick={() => selectFileManually("safety_auditor.py")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "safety_auditor.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      safety_auditor.py
                    </button>

                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[#aaa] font-semibold">
                        <ChevronDown size={14} className="text-[#777]" /> physical-agent-factory/
                      </div>
                      <div className="pl-4 flex flex-col gap-1.5 border-l border-[#252525] ml-3.5 mt-1">
                        <button
                          onClick={() => selectFileManually("run_embodied_agent.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "run_embodied_agent.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_embodied_agent.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("eval_policy.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "eval_policy.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          eval_policy.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("run_robot_pipeline.sh")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "run_robot_pipeline.sh" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_robot_pipeline.sh
                        </button>
                        <button 
                          onClick={() => selectFileManually("robot_pipeline.json")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "robot_pipeline.json" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          robot_pipeline.json
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
                    {["README.md", "run_embodied_agent.py", "eval_policy.py", "run_robot_pipeline.sh", "robot_pipeline.json", "robot_ast.py", "kinematics_verifier.py", "safety_auditor.py", "Dockerfile", "docker-compose.yml", "requirements.txt"].map(fileName => (
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

