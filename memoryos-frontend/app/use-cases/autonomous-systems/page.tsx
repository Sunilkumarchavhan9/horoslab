"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, TeslaLogo, OneXLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "System",
    runInfra: {
      title: "Unified autonomy workflow",
      desc: "Connect perception, world modeling, prediction, planning, control, and evaluation in one engineering loop."
    },
    closed: {
      title: "Individual model endpoints",
      desc: "Call separate models for vision, prediction, action, and reasoning."
    },
    diy: {
      title: "Custom autonomy stack",
      desc: "Integrate models, controllers, sensor pipelines, simulators, and robotics middleware yourself."
    }
  },
  {
    num: "0 2",
    label: "Models",
    runInfra: {
      title: "Open-weight model engineering",
      desc: "Evaluate, adapt, and optimize world models, vision-language-action models, and physical-dynamics predictors."
    },
    closed: {
      title: "Provider-hosted models",
      desc: "Use available hosted models with limited control over model weights and internal architecture."
    },
    diy: {
      title: "Manual model management",
      desc: "Source checkpoints, manage dependencies, configure training, and maintain model versions independently."
    }
  },
  {
    num: "0 3",
    label: "Context",
    runInfra: {
      title: "Unified environment state",
      desc: "Connect sensor observations, spatial representations, robot state, task constraints, and interaction history."
    },
    closed: {
      title: "Model-specific inputs",
      desc: "Supply supported images, video, text, and structured state through individual model interfaces."
    },
    diy: {
      title: "Custom sensor integration",
      desc: "Build perception adapters, coordinate transforms, state estimators, and context pipelines yourself."
    }
  },
  {
    num: "0 4",
    label: "Planning",
    runInfra: {
      title: "Goal-to-action engineering",
      desc: "Evaluate candidate actions against task objectives, physical constraints, predicted outcomes, and operating limits."
    },
    closed: {
      title: "Model-generated actions",
      desc: "Request plans or action proposals within the model's supported capabilities."
    },
    diy: {
      title: "Custom planning algorithms",
      desc: "Implement planners, trajectory search, control policies, and action-selection logic independently."
    }
  },
  {
    num: "0 5",
    label: "Simulation",
    runInfra: {
      title: "Simulation-to-reality evaluation",
      desc: "Run controlled physical scenarios, compare predicted and actual outcomes, and test transfer to unfamiliar conditions."
    },
    closed: {
      title: "External simulation integrations",
      desc: "Send model inputs to separate simulators and process their outputs."
    },
    diy: {
      title: "Custom simulation pipelines",
      desc: "Orchestrate environments, physics engines, scenario generation, trajectory collection, and evaluation jobs yourself."
    }
  },
  {
    num: "0 6",
    label: "Optimization",
    runInfra: {
      title: "Model-to-hardware optimization",
      desc: "Compare quantization, inference kernels, memory movement, batching, runtimes, and hardware configurations against workload targets."
    },
    closed: {
      title: "Provider parameter tuning",
      desc: "Adjust exposed inference settings and available deployment options."
    },
    diy: {
      title: "Independent optimization loops",
      desc: "Build profiling, benchmarking, compiler tuning, deployment configuration, and performance tracking from scratch."
    }
  },
  {
    num: "0 7",
    label: "Verification",
    runInfra: {
      title: "Physical-behavior verification",
      desc: "Test prediction error, action validity, task success, robustness, safety constraints, and generalization on held-out scenarios."
    },
    closed: {
      title: "Model-level evaluations",
      desc: "Use supported model benchmarks and external validation tools."
    },
    diy: {
      title: "Custom test infrastructure",
      desc: "Develop test scenarios, acceptance criteria, regression suites, and physical-system validation independently."
    }
  },
  {
    num: "0 8",
    label: "Experience",
    runInfra: {
      title: "End-to-end observability",
      desc: "Track model versions, sensor inputs, predicted outcomes, actions, failures, recovery, latency, and measured task results."
    },
    closed: {
      title: "Fragmented model observability",
      desc: "Monitor individual endpoint responses and provider-level performance metrics."
    },
    diy: {
      title: "Custom experiment infrastructure",
      desc: "Build telemetry pipelines, experiment stores, trace collection, and cross-system analysis yourself."
    }
  },
  {
    num: "0 9",
    label: "Teaching",
    runInfra: {
      title: "Continuous model adaptation",
      desc: "Use verified trajectories, demonstrations, and failure cases to guide fine-tuning, adaptation, and subsequent evaluations."
    },
    closed: {
      title: "Provider-limited adaptation",
      desc: "Depend on supported fine-tuning, prompting, and model customization options."
    },
    diy: {
      title: "Manual training pipelines",
      desc: "Assemble datasets, demonstrations, training jobs, checkpoints, and evaluation workflows independently."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    runInfra: {
      title: "Controlled autonomous execution",
      desc: "Define action limits, deployment policies, hardware access, approval gates, rollback procedures, and human intervention boundaries."
    },
    closed: {
      title: "Provider access controls",
      desc: "Combine available API permissions and deployment controls with your own execution safeguards."
    },
    diy: {
      title: "Custom control infrastructure",
      desc: "Implement permissions, safety interlocks, operational budgets, approvals, audit logs, and deployment policies yourself."
    }
  }
];

const VERIFY_CODE = `# Verifiable Autonomy Agent with Physics Proof
import torch
from horos_autonomy import (
    AutonomyAgent,
    PhysicsVerifier,
    KinematicGraph,
)

# Initialize world model with physics verifier
agent = AutonomyAgent.load("nvidia/Cosmos-1.0")
verifier = PhysicsVerifier(policy="zero-collision")

def audit_trajectory(trajectory: dict, domain: str):
    """Audit dynamics and compute physics proofs."""

    # Parse sensor telemetry into AST graph
    graph = KinematicGraph.parse(trajectory)

    # Run compliance audit against safety bounds
    audit = agent.analyze_compliance(graph, domain)

    # Generate physics proof for waypoints
    proof = verifier.generate_proof(audit.waypoints)

    if proof.is_valid:
        return {
            "status": audit.status,
            "risks": audit.risks,
            "proof_hash": proof.hash,
            "collision_rate": 0.0
        }

    return None`;

const AUDIT_CODE = `#!/usr/bin/env bash
# Autonomous systems simulation runner
set -euo pipefail
 
CONFIG="./configs/autonomy_v1.yaml"
SIM_ENV="genesis-physics-v2"

# Execute closed-loop world model prediction
horos-autonomy run \\
  --config $CONFIG \\
  --sim-env $SIM_ENV \\
  --control-frequency 120Hz \\
  --physics-verification strict \\
  --output-dir ./eval_telemetry/ \\
  --export-runtime ./runtime_binary/`;

const PIPELINE_CODE = `{
  "name": "autonomous-systems-pipeline",
  "world_model": "nvidia/Cosmos-1.0",
  "sensors": ["camera_4k", "lidar", "imu"],
  "control_frequency": "120Hz",
  "physics_verification": true,
  "collision_threshold": 0.0,
  "evaluations": [
    "sim2real_transfer",
    "kinematic_constraints",
    "prediction_drift"
  ]
}`;

const README_CODE = `# Autonomous Systems Runtime

Production stack for physical world models,
sim-to-real verification, and real-time control.

## Overview
- **Model**: \`nvidia/Cosmos-1.0\` (dynamics)
- **Engine**: Genesis-Sim & Isaac Sim
- **Safety**: Zero-collision kinematic bounds
- **Hardware**: NVIDIA H100 / Jetson AGX Orin

## Quick Start
\`\`\`bash
pip install -r requirements.txt
./run_autonomy_loop.sh --config pipeline.json
python eval.py --scenario urban_navigation
\`\`\`

## Architecture
- \`verify_autonomy.py\`: Trajectory constraints.
- \`eval.py\`: Sim-to-real validation.
- \`pipeline.json\`: Sensor topology.`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.1-devel-ubuntu22.04 AS base
 
RUN apt-get update && apt-get install -y \\
    python3.11 python3-pip libgl1-mesa-glx
 
WORKDIR /autonomy
COPY requirements.txt .
RUN pip install -r requirements.txt
 
COPY runtime/ /autonomy/runtime/
COPY verify_autonomy.py eval.py \\
     run_autonomy_loop.sh pipeline.json \\
     README.md .
 
EXPOSE 8080
ENTRYPOINT ["/autonomy/run_autonomy_loop.sh"]`;

const COMPOSE_CODE = `version: '3.8'
services:
  autonomy-runtime:
    build: .
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - CONTROL_FREQ=120Hz
    ports:
      - "8080:8080"
    volumes:
      - ./eval_telemetry:/autonomy/eval_telemetry`;

const REQUIREMENTS_CODE = `torch>=2.4.0
torchaudio
torchvision
numpy>=1.26.0
genesis-sim>=0.2.1
horos-autonomy>=1.4.0
pydantic>=2.7.0
pyyaml`;

const EVAL_CODE = `# Evaluation harness: sim-to-real transfer
from horos_eval import (
    SimToRealHarness,
    KinematicSafetyGate,
)

def evaluate_autonomy(sim_data: list, telemetry: dict):
    """Verify prediction and sim-to-real transfer."""
    harness = SimToRealHarness()
    gate = KinematicSafetyGate(policy="zero-collision")

    # Benchmark against unfamiliar conditions
    passed = gate.verify(telemetry["trajectory"])
    metrics = harness.benchmark(sim_data, telemetry)

    return {
        "sim_to_real_score": metrics.fidelity,
        "max_kinematic_error": metrics.error,
        "safety_passed": passed
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

    if (content.trim().startsWith("//") || (content.trim().startsWith("#") && lang !== "markdown")) {
      lineContent = <span className="text-[#666] italic">{content}</span>;
    } else if (lang === "markdown") {
      if (content.trim().startsWith("#")) {
        lineContent = <span className="text-[#75bf00] font-bold">{content}</span>;
      } else if (content.trim().startsWith("```")) {
        lineContent = <span className="text-[#a855f7]">{content}</span>;
      } else if (content.includes("`")) {
        const parts = content.split(/(`[^`]+`)/);
        lineContent = parts.map((p, pi) => p.startsWith("`") ? <span key={pi} className="text-[#93c5fd] font-mono">{p}</span> : p);
      } else {
        lineContent = content;
      }
    } else if (lang === "python") {
      const parts = content.split(/(\bimport\b|\bfrom\b|\bdef\b|\breturn\b|\bif\b|\bNone\b|"[^"]*"|'[^']*'|"""[\s\S]*?""")/);
      lineContent = parts.map((part, pi) => {
        if (["import", "from", "def", "return", "if", "None"].includes(part)) {
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
      const parts = line.split(/("[^"]*"\s*:|"[^"]*"|\b\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b)/);
      lineContent = parts.map((part, pi) => {
        if (part.endsWith(":")) {
          return <span key={pi} className="text-[#93c5fd]">{part}</span>;
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={pi} className="text-[#75bf00]">{part}</span>;
        }
        if (["true", "false"].includes(part) || /^\d/.test(part)) {
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
        className={`min-h-[20px] leading-[20px] flex items-center transition-colors rounded-sm px-1 ${isCurrentActiveLine && !isComplete ? "bg-[#75bf00]/10" : ""
          }`}
      >
        {isCurrentActiveLine && !isComplete ? (
          <span className="w-[3px] h-[14px] bg-[#75bf00] animate-pulse inline-block mr-2 rounded-full shrink-0 align-middle" />
        ) : (
          <span className="w-[3px] h-[14px] bg-transparent inline-block mr-2 shrink-0" />
        )}

        <span className="flex-1 whitespace-pre">{lineContent}</span>

        {isCurrentActiveLine && !isComplete && (
          <span className="inline-block w-[6px] h-[14px] bg-[#75bf00] animate-pulse ml-1 align-middle shrink-0" />
        )}
        {i === totalLines - 1 && isComplete && (
          <span className="inline-block w-[7px] h-[14px] bg-[#75bf00] animate-pulse ml-1 align-middle shrink-0" />
        )}
      </div>
    );
  });
}

const DEFAULT_MODELS = [
  { id: "nvidia/Cosmos-1.0-WorldModel", name: "Cosmos-1.0 WorldModel", author: "NVIDIA", description: "Frontier spatial-temporal world foundation model for physical dynamics prediction.", role: "World Model" },
  { id: "openvla/openvla-7b", name: "OpenVLA 7B", author: "OpenVLA", description: "Open-weight vision-language-action model for robotic manipulation and control.", role: "VLA Policy" },
  { id: "physical-intelligence/pi0-base", name: "Pi0 Base", author: "Physical Intelligence", description: "Generalist robot foundation model with high-frequency tactile and visual policy control.", role: "Physical AI" },
  { id: "microsoft/MagenticBrain-15B", name: "MagenticBrain 15B", author: "Microsoft", description: "Multi-agent autonomous systems reasoning and physical world planning model.", role: "Autonomy Planner" },
  { id: "nousresearch/Hermes-4-14B", name: "Hermes 4 14B", author: "Nous Research", description: "Advanced reasoning and tool-use model adapted for robotic decision execution.", role: "Decision Engine" },
  { id: "browseruse/bu-30b-a3b", name: "BU-30B-A3B", author: "Browser Use", description: "Compact decision agent optimized for structured environments and sequential action selection.", role: "Action Policy" },
  { id: "qwen/Qwen3-Coder-Next", name: "Qwen3 Coder Next", author: "Qwen", description: "High-capacity code and kinematics generation model for motion planning algorithms.", role: "Kinematic Code" },
  { id: "mistralai/Devstral-Small-2", name: "Devstral Small 24B", author: "Mistral", description: "Fast, low-latency reasoning engine optimized for edge-device autonomy runtimes.", role: "Edge Runtime" },
  { id: "xlang/OpenCUA-7B", name: "OpenCUA 7B", author: "xLang AI", description: "Compact cross-modal policy model for real-time sensor-action loop execution.", role: "Control Loop" }
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

  if (a.includes('openai') || m.includes('gpt')) return <OpenAILogo size={20} />;
  if (a.includes('nvidia') || m.includes('nemo')) return <NvidiaLogo size={20} />;
  if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('google') || m.includes('palmyra')) return <GoogleLogo size={20} />;
  if (a.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('anthropic') || m.includes('claude')) return <AnthropicLogo size={20} />;
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
    question: "How do Autonomous Systems world models handle sim-to-real transfer?",
    answer: "Horos pairs physical-dynamics neural simulators with uncertainty-aware trajectory estimators, measuring prediction drift and kinematic constraint violations before hardware deployment.",
  },
  {
    question: "Can I evaluate and deploy custom open-weight VLA and robotics models?",
    answer: "Yes. Native support for Cosmos, OpenVLA, Pi0, and custom physical-dynamics checkpoints allows rapid benchmarking against real-world telemetry.",
  },
  {
    question: "Can I export optimized runtimes to run directly on edge robotics hardware?",
    answer: "Yes! All fine-tuned models, quantization kernels, and closed-loop control pipelines can be compiled into containerized runtimes and deployed directly to edge computing units.",
  }
];

export default function AutonomousSystemsPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("verify_autonomy.py" as any);
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "verify_autonomy.py": VERIFY_CODE,
    "eval.py": EVAL_CODE,
    "run_autonomy_loop.sh": AUDIT_CODE,
    "pipeline.json": PIPELINE_CODE,
    "README.md": README_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE
  };

  const AGENT_MSG_1 = "On it. I'll parse trajectory #8042, check kinematic dependencies against ISO 26262 and dynamic collision limits, and compute sim-to-real proofs.";

  const [typedMsg1, setTypedMsg1] = useState("");
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
    const fullCode = FILE_CODE_MAP[activeFile] || VERIFY_CODE;

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
        timer = setTimeout(() => setVisibleStep(2), 500);
      }
    } else if (visibleStep >= 2 && visibleStep <= 4) {
      timer = setTimeout(() => setVisibleStep(prev => prev + 1), 600);
    }

    return () => clearTimeout(timer);
  }, [visibleStep, typedMsg1, isAutoPlay]);

  const replayAnimation = () => {
    setIsAutoPlay(true);
    setTypedMsg1("");
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

            let tag = "Legal Model";
            let description = m.downloads ? `${dl} - Verifiable legal target` : "Verifiable legal target";
            
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
        
        {/* SVG Filter for recoloring the legal bird image to brand green colors */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="brand-duotone-legal-bird">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0 0 0 1 0"
            />
            <feComponentTransfer colorInterpolationFilters="sRGB">
              <feFuncR type="table" tableValues="0.886 0.458 0.08235" />
              <feFuncG type="table" tableValues="0.937 0.749 0.08235" />
              <feFuncB type="table" tableValues="0.757 0.000 0.08235" />
            </feComponentTransfer>
          </filter>
        </svg>

        {/* Background Image */}
        <div className="absolute top-0 inset-x-0 z-0 overflow-hidden pointer-events-none flex justify-center opacity-75">
          <div className="relative w-[950px] h-[580px] mt-2">
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-transparent to-[#151515] z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#151515] via-transparent 40% to-[#151515] z-10" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#151515] via-[#151515]/90 to-transparent z-10" />
            <img 
              src="/images/legal-bird.png"
              alt="Verifiable & Legal Agents Background"
              className="w-full h-full object-contain object-center"
              style={{ 
                maskImage: 'radial-gradient(ellipse 65% 55% at 50% 40%, black 30%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 40%, black 30%, transparent 95%)',
                filter: 'url(#brand-duotone-legal-bird)'
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
                    Intelligence for<br />
                    Autonomous Systems
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Build and optimize models that perceive their environment, predict what happens next, and make decisions in dynamic real-world conditions.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Engineer system <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Read stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Perception"
                    label2="Prediction"
                    label3="Decisions"
                    label4="Control"
                    label5="Sensor Fusion"
                    label6="Planning"
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
              <div className="text-center mb-8 md:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-3">
                  What you actually own
                </h2>
                <p className="text-[#C8C7BA] text-[14.5px] sm:text-[15.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                  The world models, physical-dynamics evaluations, and optimized inference runtimes behind systems that must understand and act in the physical world.
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
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 1</div>
                    <h3 className="text-lg sm:text-xl md:text-[22px] font-medium text-[#F0EFE2] leading-snug">The world models.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed font-sans">
                      Train and adapt models that learn how objects move, interact, and respond to actions. Measure whether physical understanding transfers to unfamiliar environments not just familiar visual patterns.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 2</div>
                    <h3 className="text-lg sm:text-xl md:text-[22px] font-medium text-[#F0EFE2] leading-snug">The evaluation harness.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed font-sans">
                      Evaluate models across simulation and real-world workloads. Measure prediction accuracy, task success, robustness to unfamiliar conditions, and sim-to-real transfer before deployment.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 3</div>
                    <h3 className="text-lg sm:text-xl md:text-[22px] font-medium text-[#F0EFE2] leading-snug">The optimized runtime.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed font-sans">
                      Optimize inference across target hardware. Tune quantization, kernels, memory movement, batching, and serving configurations to meet latency, throughput, and cost targets from cloud infrastructure to edge devices.
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
        <div className="w-full relative z-10 mt-20 mb-24">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="flex flex-col items-center mb-8 md:mb-10 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">
              Three ways to engineer autonomous systems
            </h2>
            <p className="text-[#C8C7BA] text-[14px] sm:text-[15px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
              Build physical-world intelligence, validate its behavior in unfamiliar environments, and optimize its execution for real-world hardware.
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
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Unified autonomy engineering.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={16} className="text-[#C8C7BA] shrink-0" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Individual model endpoints</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Fragmented, provider-hosted.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={16} className="text-[#C8C7BA] shrink-0" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Custom autonomy stack</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">DIY infrastructure, high maintenance.</p>
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
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-12 md:pt-16 mb-12 md:mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-3">
                  Code you own. <span className="text-[#75bf00]">Deploy anywhere.</span>
                </h2>
                <p className="text-[#C8C7BA] text-[14.5px] sm:text-[15.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                  The full recipe ships with you. World models, simulation harnesses, planning and control pipelines, and optimized runtimes. Run it anywhere.
                </p>
              </div>
            </div>
            <div />
          </div>

          <SectionDivider position="top" className="absolute top-0 left-0 right-0 z-20" />

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">
            <div className="w-full relative mx-auto max-w-[1240px] px-2 sm:px-4" style={{ aspectRatio: '1351 / 892' }}>

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
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-4 sm:p-5 flex flex-col justify-between overflow-hidden pointer-events-auto">
                  <div className="flex flex-col gap-5 overflow-y-auto chat-scroll pr-1 pb-3">
                    <div className="bg-[#1a1a1a] border border-[#252525] p-3.5 sm:p-4 rounded-[4px]">
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] font-sans leading-[24px]">
                        Audit closed-loop trajectory #8042 for collision & dynamic stability. Hybrid spatial-temporal parser with{" "}
                        <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#F0EFE2] font-mono text-[11.5px] align-baseline whitespace-nowrap">
                          <NvidiaLogo size={12} /> Cosmos-1.0
                        </span>{" "}
                        plus physics engine verifier,{" "}
                        <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#F0EFE2] font-mono text-[11.5px] align-baseline whitespace-nowrap">
                          <HuggingFaceLogo size={12} /> Genesis-Sim
                        </span>{" "}
                        grounded with 4D sensor rollouts. Compute sim-to-real transfer on{" "}
                        <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#75bf00] font-mono text-[11.5px] align-baseline whitespace-nowrap">
                          <NvidiaLogo size={12} /> 8x H100 GPU
                        </span>.
                      </p>
                    </div>

                    {/* Step 1 */}
                    <div className={`flex gap-3 mt-1 transition-all duration-500 transform ${visibleStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                      <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0 mt-0.5">
                        {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length ? (
                          <Loader2 size={13} className="text-[#75bf00] animate-spin" />
                        ) : (
                          <Sparkles size={13} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9.5px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                        <p className="text-[#C8C7BA] text-[12.5px] sm:text-[13px] leading-relaxed">
                          {typedMsg1}
                          {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length && (
                            <span className="inline-block w-1.5 h-3.5 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Logs list */}
                    <div className="flex flex-col gap-3 mt-1">
                      <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0 mt-0.5">
                          {visibleStep === 2 ? (
                            <Loader2 size={13} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-medium">Ingesting sensor AST & kinematic scene graph</span>
                            <span className="text-[#C8C7BA] text-[11px]">0.9s</span>
                          </div>
                          <span className="text-[#666] text-[11px] sm:text-[11.5px]">Parsed 148 spatial-temporal nodes & lidar sweeps <span className="text-[#C8C7BA]">[Cosmos-1.0]</span></span>
                        </div>
                      </div>

                      <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0 mt-0.5">
                          {visibleStep === 3 ? (
                            <Loader2 size={13} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-medium">Checking dynamic constraint precision</span>
                            <span className="text-[#C8C7BA] text-[11px]">2.1s</span>
                          </div>
                          <span className="text-[#75bf00] text-[11px] sm:text-[11.5px]">100% physical bounds match against ISO 26262 & Kinematics [8x NVIDIA H100 GPU]</span>
                        </div>
                      </div>

                      <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0 mt-0.5">
                          {visibleStep === 4 ? (
                            <Loader2 size={13} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-medium">Computing counterfactual trajectory rollouts</span>
                            <span className="text-[#C8C7BA] text-[11px]">4.5s</span>
                          </div>
                          <span className="text-[#666] text-[11px] sm:text-[11.5px]">Generated 500 physics rollouts #0x8f2a99c1d0 [Genesis Physics Engine | CUDA 12.4]</span>
                        </div>
                      </div>

                      <div className={`flex items-start gap-2.5 transition-all duration-500 transform ${visibleStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0 mt-0.5">
                          {visibleStep === 5 ? (
                            <Loader2 size={13} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-medium">Flagging trajectory clearance risk anomaly</span>
                            <span className="text-[#C8C7BA] text-[11px]">9.8s</span>
                          </div>
                          <span className="text-[#666] text-[11px] sm:text-[11.5px]">Lateral acceleration boundary exceeded at waypoint 14.2 (99.7% confidence)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prompt input bar */}
                  <div className="mt-1 shrink-0 mb-1">
                    <div className="bg-[#151515] border border-[#252525] rounded-[4px] p-2 flex flex-col gap-1.5">
                      <input
                        type="text"
                        placeholder="Teach the agent to audit against specific kinematic constraints..."
                        className="bg-transparent text-[#F0EFE2] text-[12.5px] border-none outline-none w-full px-1.5 py-1.5 placeholder:text-[#555]"
                        readOnly
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="flex gap-1.5">
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@Capabilities</span>
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@Kinematics</span>
                        </div>
                        <button className="w-5 h-5 bg-[#75bf00] hover:bg-[#85cf00] transition-colors flex items-center justify-center text-black font-bold rounded-sm">
                          <ArrowUp size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files Content */}
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-4 sm:p-5 flex flex-col items-start gap-3.5 overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                  <div className="flex justify-between items-center border-b border-[#252525] pb-2.5 mb-1 w-full">
                    <span className="text-[9.5px] font-bold tracking-widest text-[#C8C7BA] uppercase">AUTONOMY ENGINES</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">3</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[12px] font-mono w-full">
                    <div className="flex items-center gap-2 px-2 py-1 text-[#555]">
                      kinematic_ast.py
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 text-[#555]">
                      physics_prover.py
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 text-[#555]">
                      trajectory_auditor.py
                    </div>

                    <div className="mt-1.5 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[#aaa] font-semibold text-[11.5px]">
                        <ChevronDown size={13} className="text-[#777]" /> autonomy-agent-factory/
                      </div>
                      <div className="pl-3.5 flex flex-col gap-1 border-l border-[#252525] ml-3 mt-0.5">
                        <button
                          onClick={() => selectFileManually("verify_autonomy.py")}
                          className={`flex items-center gap-2 px-2 py-1 transition-colors w-full text-left rounded-[4px] ${activeFile === "verify_autonomy.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          verify_autonomy.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("eval.py")}
                          className={`flex items-center gap-2 px-2 py-1 transition-colors w-full text-left rounded-[4px] ${activeFile === "eval.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          eval.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("run_autonomy_loop.sh")}
                          className={`flex items-center gap-2 px-2 py-1 transition-colors w-full text-left rounded-[4px] ${activeFile === "run_autonomy_loop.sh" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_autonomy_loop.sh
                        </button>
                        <button 
                          onClick={() => selectFileManually("pipeline.json")}
                          className={`flex items-center gap-2 px-2 py-1 transition-colors w-full text-left rounded-[4px] ${activeFile === "pipeline.json" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          pipeline.json
                        </button>
                        <button 
                          onClick={() => selectFileManually("README.md")}
                          className={`flex items-center gap-2 px-2 py-1 transition-colors w-full text-left rounded-[4px] ${activeFile === "README.md" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          README.md
                        </button>
                        <button 
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-2 px-2 py-1 transition-colors w-full text-left rounded-[4px] ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          Dockerfile
                        </button>
                        <button 
                          onClick={() => selectFileManually("docker-compose.yml")}
                          className={`flex items-center gap-2 px-2 py-1 transition-colors w-full text-left rounded-[4px] ${activeFile === "docker-compose.yml" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          docker-compose.yml
                        </button>
                        <button 
                          onClick={() => selectFileManually("requirements.txt")}
                          className={`flex items-center gap-2 px-2 py-1 transition-colors w-full text-left rounded-[4px] ${activeFile === "requirements.txt" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          requirements.txt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-4 sm:p-5 md:p-6 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                  <div className="flex border-b border-[#252525] mb-4 pb-2 pt-0.5 gap-1.5 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                    <button
                      onClick={() => selectFileManually("verify_autonomy.py")}
                      className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "verify_autonomy.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      verify_autonomy.py
                    </button>
                    <button
                      onClick={() => selectFileManually("eval.py")}
                      className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "eval.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      eval.py
                    </button>
                    <button
                      onClick={() => selectFileManually("run_autonomy_loop.sh")}
                      className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "run_autonomy_loop.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      run_autonomy_loop.sh
                    </button>
                    <button
                      onClick={() => selectFileManually("pipeline.json")}
                      className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      pipeline.json
                    </button>
                    <button
                      onClick={() => selectFileManually("README.md")}
                      className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "README.md" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      README.md
                    </button>
                  </div>

                  <div className="flex font-mono text-[11.5px] sm:text-[12px] leading-[20px] overflow-x-auto select-text thin-hover-scrollbar">
                    <div className="text-[#444] text-right pr-3 border-r border-[#252525] select-none flex flex-col min-w-[28px] text-[11px]">
                      {Array.from({ length: typedCodeText.split('\n').length }).map((_, i) => (
                        <div key={i} className="min-h-[20px] leading-[20px]">{i + 1}</div>
                      ))}
                    </div>

                    <div className="pl-3.5 flex-1 text-[#C8C7BA] leading-[20px]">
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
                                  : "text",
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
                      <Cloud size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Physical World Graph</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Spatial-temporal 4D scene graphs cross-referencing sensor observations, kinematics, and dynamic scene limits.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The World Model Weights</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Self-host open-weights world models (Cosmos-1.0, OpenVLA, Pi0) in your own cloud or on edge compute. Full data sovereignty.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-8 py-16 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Sim-to-Real Harness</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Generate physics-consistency proofs and counterfactual simulations guaranteeing zero dynamic collision violations.
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
                  Any world model or physical-dynamics predictor works
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                  Use any open-weights foundation model as your perception and world engine, and optimize any compact control policy. The models below are just a starting view.
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
                    placeholder="Search any world model or robotics policy on Hugging Face"
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
                  Every stage of the autonomy pipeline, retuned per model and operational domain.
                </p>

                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Row 1 */}
                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Spatial-Temporal Scene Indexing</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Tune 4D scene graphs for instant spatial retrieval, coordinate transformations, and obstacle representations.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Physical-Dynamics Proofs</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Generate verifiable kinematic proofs for every trajectory waypoint to guarantee boundary-safe navigation.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Counterfactual Risk Analysis</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Simulate unobserved scenarios and test collision boundaries, rollover limits, and emergency braking margins.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Sim-to-Real Verification</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Built-in verification harness measuring prediction drift and kinematic transfer between neural physics and real hardware.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Zero-Collision Policy Runtime</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Quantize world model weights (FP8/INT8) and compile TensorRT kernels for 120Hz deterministic real-time control.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Workflow size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Continuous Telemetry Adaptation</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Fine-tune Cosmos and VLA models on your proprietary vehicle telemetry, sensor logs, and operational edge cases.
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
                  Edit the model, sensor configuration, or operational constraints inline. Send to retune the autonomy stack in the dashboard.
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
                Deploy your first verifiable<br className="hidden md:block" />
                world model, <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">measured</span> before you<br className="hidden md:block" />
                ship
              </h2>

              <p className="text-[#a0a0a0] text-[18px] md:text-[20px] font-sans mb-12">
                Describe the environment or robotic task. Horos builds, simulates, and optimizes the autonomous systems stack.
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

