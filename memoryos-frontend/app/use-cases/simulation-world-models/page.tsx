"use client";

import { GlobalFooter } from "@/components/landing/global-footer";
import { SectionDivider } from "@/components/landing/section-divider";
import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, TeslaLogo, OneXLogo, TencentLogo, OverworldLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "System",
    runInfra: {
      title: "World model prediction",
      desc: "World model for future-state prediction."
    },
    closed: {
      title: "Simulator integration",
      desc: "Model integrated with a simulator and scenario runner."
    },
    diy: {
      title: "Training & eval pipeline",
      desc: "Adapted model with training and evaluation pipeline."
    }
  },
  {
    num: "0 2",
    label: "Models",
    runInfra: {
      title: "Open video & world models",
      desc: "Open video and world models."
    },
    closed: {
      title: "Simulator-compatible models",
      desc: "World models compatible with the target simulator."
    },
    diy: {
      title: "Checkpoints & variants",
      desc: "Base checkpoints and adapted variants."
    }
  },
  {
    num: "0 3",
    label: "Context",
    runInfra: {
      title: "Frames & observations",
      desc: "Historical frames, observations, environment state."
    },
    closed: {
      title: "Initial state & actions",
      desc: "Initial state, actions, scenario parameters."
    },
    diy: {
      title: "Trajectories & corrections",
      desc: "Recorded trajectories, corrections, failure cases."
    }
  },
  {
    num: "0 4",
    label: "Capabilities",
    runInfra: {
      title: "Motion & forecasting",
      desc: "Motion prediction, state forecasting."
    },
    closed: {
      title: "Rollouts & counterfactuals",
      desc: "Rollouts, counterfactuals, action-conditioned prediction."
    },
    diy: {
      title: "Dynamics adaptation",
      desc: "Domain-specific dynamics adaptation."
    }
  },
  {
    num: "0 5",
    label: "Workload",
    runInfra: {
      title: "Sequences & trajectories",
      desc: "Video sequences and observed trajectories."
    },
    closed: {
      title: "Scenario rollouts",
      desc: "Large scenario sets and simulated rollouts."
    },
    diy: {
      title: "Target environment tasks",
      desc: "Repeated tasks in a target environment."
    }
  },
  {
    num: "0 6",
    label: "Optimization",
    runInfra: {
      title: "Sampling & horizon",
      desc: "Frame sampling, prediction horizon, precision."
    },
    closed: {
      title: "Budgets & parallelism",
      desc: "Rollout budgets, parallelism, inference throughput."
    },
    diy: {
      title: "Distillation & selection",
      desc: "Fine-tuning, distillation, training-data selection."
    }
  },
  {
    num: "0 7",
    label: "Verification",
    runInfra: {
      title: "Error & consistency",
      desc: "Prediction error and temporal consistency."
    },
    closed: {
      title: "Simulated outcomes",
      desc: "Predicted versus simulated outcomes."
    },
    diy: {
      title: "Held-out regressions",
      desc: "Held-out scenarios and regression tests."
    }
  },
  {
    num: "0 8",
    label: "Experience",
    runInfra: {
      title: "Observations & errors",
      desc: "Record observations, predictions, and errors."
    },
    closed: {
      title: "Rollouts & outcomes",
      desc: "Preserve scenarios, actions, rollouts, and outcomes."
    },
    diy: {
      title: "Datasets & lineage",
      desc: "Track datasets, experiments, and checkpoint lineage."
    }
  },
  {
    num: "0 9",
    label: "Teaching",
    runInfra: {
      title: "Data gap identification",
      desc: "Use prediction errors to identify data gaps."
    },
    closed: {
      title: "Failed scenario synthesis",
      desc: "Turn failed scenarios into new training examples."
    },
    diy: {
      title: "Verified trajectory tuning",
      desc: "Adapt models using verified trajectories and outcomes."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    runInfra: {
      title: "Access & compute governance",
      desc: "Govern data access, compute, and deployment."
    },
    closed: {
      title: "Budget & action control",
      desc: "Control simulation budgets, action permissions, and approvals."
    },
    diy: {
      title: "Promotion & rollout gates",
      desc: "Govern training data, model promotion, and rollout permissions."
    }
  }
];


const RETRIEVE_CODE = `# Rollout counterfactual futures using an Autoregressive World Model
import torch
from world_model import CosmosSimulator

# Initialize world model on multiple GPUs
simulator = CosmosSimulator.from_pretrained("nvidia/Cosmos-1.0-World")
simulator.eval().cuda()

def rollout_counterfactuals(video_stream: torch.Tensor, actions: torch.Tensor) -> torch.Tensor:
    """Predict physical dynamics for a given sequence of driving actions."""
    
    # Encode past video context into latent state
    state = simulator.encode_context(video_stream)
    
    predicted_futures = []
    # Autoregressively predict 10 seconds into the future (300 frames)
    for t in range(300):
        next_state, next_frame = simulator.step(state, action=actions[:, t])
        predicted_futures.append(next_frame)
        state = next_state
        
    return torch.stack(predicted_futures, dim=1)`;

const SERVE_CODE = `#!/usr/bin/env bash
# Distributed physics simulation and rendering pipeline using Genesis
set -euo pipefail
 
WORLD_ENGINE="genesis-embodied/Genesis"
SCENE_CONFIG="./environments/urban_driving.json"
 
# Launch physics engine across 8 GPUs for data generation
mpirun -np 8 genesis-sim run \\
  --engine $WORLD_ENGINE \\
  --scene $SCENE_CONFIG \\
  --resolution 1920x1080 \\
  --fps 30 \\
  --duration_sec 3600 \\
  --physics_backend mujoco \\
  --output_dir ./simulated_trajectories`;

const PIPELINE_CODE = `{
  "name": "world-model-pipeline",
  "engine": "cosmos-1.0",
  "resolution": [1920, 1080],
  "fps": 30,
  "action_space": "continuous",
  "prediction_horizon_steps": 300,
  "physics_backend": "mujoco",
  "gpu": "nvidia-b200"
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.1-devel-ubuntu22.04 AS base
 
RUN apt-get update && apt-get install -y python3.11 python3-pip libgl1-mesa-glx
 
WORKDIR /sim
COPY requirements.txt .
RUN pip install -r requirements.txt
 
COPY models/ /sim/models/
COPY environments/ /sim/environments/
COPY rollout.py render.sh pipeline.json .
 
EXPOSE 8080
ENTRYPOINT ["/sim/render.sh"]`;

const EVAL_CODE = `# Eval harness: measuring physical consistency of world models
import torch
from physics_eval import CollisionDetector, KinematicsValidator

def evaluate_physical_consistency(predicted_video: torch.Tensor, actions: torch.Tensor) -> dict:
    """Score the physical accuracy of the generated future states."""
    
    # Check if the predicted motion obeys rigid body kinematics
    kinematics = KinematicsValidator()
    kinematic_score = kinematics.verify(predicted_video, actions)
    
    # Ensure objects don't pass through each other (hallucinated physics)
    collisions = CollisionDetector()
    collision_rate = collisions.detect_intersections(predicted_video)
    
    return {
        "kinematic_accuracy": kinematic_score,
        "hallucinated_collisions": collision_rate,
        "physical_coherence_score": kinematic_score * (1.0 - collision_rate)
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
    id: "nvidia/Cosmos-Predict2.5-14B",
    name: "Cosmos-Predict2.5-14B",
    author: "NVIDIA",
    downloads: "14.4B",
    tag: "Future Prediction",
    role: "Future Prediction",
    description: "State-of-the-art autoregressive world model for high-resolution future prediction.",
    link: "https://huggingface.co/nvidia/Cosmos-Predict2.5-14B"
  },
  {
    id: "nvidia/Cosmos-Predict2.5-2B",
    name: "Cosmos-Predict2.5-2B",
    author: "NVIDIA",
    downloads: "2.1B",
    tag: "World Generation",
    role: "World Generation",
    description: "Compact physical world generation model optimized for real-time simulation.",
    link: "https://huggingface.co/nvidia/Cosmos-Predict2.5-2B"
  },
  {
    id: "nvidia/Cosmos-Transfer2.5-2B",
    name: "Cosmos-Transfer2.5-2B",
    author: "NVIDIA",
    downloads: "2.4B",
    tag: "Scene Transformation",
    role: "Scene Transformation",
    description: "Spatiotemporal transfer model for domain adaptation and scene transformation.",
    link: "https://huggingface.co/nvidia/Cosmos-Transfer2.5-2B"
  },
  {
    id: "nvidia/Cosmos-H-Dreams",
    name: "Cosmos-H-Dreams",
    author: "NVIDIA",
    downloads: "2B backbone",
    tag: "Action-Conditioned",
    role: "Action-Conditioned",
    description: "Action-conditioned physical dreaming model for counterfactual rollouts.",
    link: "https://huggingface.co/nvidia/Cosmos-H-Dreams"
  },
  {
    id: "nvidia/Cosmos-H-Surgical-Simulator",
    name: "Cosmos-H-Surgical-Simulator",
    author: "NVIDIA",
    downloads: "Cosmos 2B base",
    tag: "Robot Simulation",
    role: "Robot Simulation",
    description: "High-precision physical dynamics simulator for medical and robotic manipulation.",
    link: "https://huggingface.co/nvidia/Cosmos-H-Surgical-Simulator"
  },
  {
    id: "facebook/vjepa2-vitg-fpc64-256",
    name: "V-JEPA 2",
    author: "Meta",
    downloads: "1B-class",
    tag: "Physical Prediction",
    role: "Physical Prediction",
    description: "Video Joint Embedding Predictive Architecture for self-supervised physical prediction.",
    link: "https://huggingface.co/facebook/vjepa2-vitg-fpc64-256"
  },
  {
    id: "tencent/HunyuanWorld-1",
    name: "HunyuanWorld-1",
    author: "Tencent",
    downloads: "1B-class",
    tag: "3D World Generation",
    role: "3D World Generation",
    description: "Generative world model for 3D physical environment synthesis.",
    link: "https://huggingface.co/tencent/HunyuanWorld-1"
  },
  {
    id: "tencent/HY-WorldPlay",
    name: "HY-WorldPlay",
    author: "Tencent",
    downloads: "Check model card",
    tag: "Interactive Worlds",
    role: "Interactive Worlds",
    description: "Actionable interactive world simulation framework with real-time response.",
    link: "https://huggingface.co/tencent/HY-WorldPlay"
  },
  {
    id: "Overworld/Waypoint-1.5-1B",
    name: "Waypoint-1.5-1B",
    author: "Overworld",
    downloads: "1B-class",
    tag: "Interactive World Model",
    role: "Interactive World Model",
    description: "Real-time action-conditioned interactive world model for simulation environments.",
    link: "https://huggingface.co/Overworld/Waypoint-1.5-1B"
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

  if (a.includes('nvidia') || m.includes('nvfp4') || m.includes('cosmos')) return <NvidiaLogo size={22} />;
  if (a.includes('meta') || a.includes('facebook') || m.includes('llama') || m.includes('vjepa') || m.includes('v-jepa')) return <MetaLogo size={22} />;
  if (a.includes('tencent') || m.includes('hunyuan')) return <TencentLogo size={26} />;
  if (a.includes('overworld') || m.includes('waypoint')) return <OverworldLogo size={22} />;
  if (a.includes('openai') || m.includes('whisper') || m.includes('gpt') || m.includes('sora')) return <OpenAILogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('google') || m.includes('robocat') || m.includes('gemini')) return <GoogleLogo size={20} />;
  if (a.includes('tesla') || m.includes('fsd')) return <TeslaLogo size={20} />;
  if (a.includes('1x') || m.includes('neo')) return <OneXLogo size={20} />;
  if (a.includes('wayve')) return <HuggingFaceLogo size={20} />;
  if (a.includes('genesis')) return <HuggingFaceLogo size={20} />;
  if (a.includes('runway')) return <HuggingFaceLogo size={20} />;
  if (a.includes('moonshot') || m.includes('kimi')) return <KimiLogo size={20} />;
  if (a.includes('coqui') || a.includes('canopy')) return <span className="text-[18px]">🤗</span>;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('mistral') || m.includes('intfloat') || m.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('baai')) return <BAAILogo size={20} />;
  if (a.includes('jina')) return <JinaLogo size={20} />;
  if (a.includes('mixedbread')) return <MixedbreadLogo size={20} />;
  if (a.includes('snowflake')) return <SnowflakeLogo size={20} />;
  if (a.includes('nomic')) return <NomicLogo size={20} />;

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
    question: "What is a world model, and how does it differ from a physics simulator?",
    answer: "Traditional simulators (like Isaac Gym or MuJoCo) require explicit 3D CAD assets and hand-crafted rigid-body rules. World models (such as NVIDIA Cosmos, Meta V-JEPA, and Waypoint) learn real-world physics directly from video, sensor streams, and action data. They predict future visual frames and physical states, allowing you to simulate complex real-world dynamics, unmodeled environments, and edge cases without building manual 3D assets.",
  },
  {
    question: "How does Horos connect physics engines with neural world models?",
    answer: "Horos bridges both worlds into a unified pipeline. It orchestrates physics engines like Genesis, MuJoCo, and Isaac Gym to generate synthetic trajectory data and ground-truth physics baselines, then uses that data to train, fine-tune, and align neural world models across your GPU cluster—handling synchronization, camera viewpoints, and action conditioning automatically.",
  },
  {
    question: "How do you detect and eliminate hallucinated or unrealistic physics?",
    answer: "Every generated trajectory passes through automated kinematics and physics validators. Horos checks predicted future rollouts for rigid-body collisions, gravity and momentum violations, surface friction consistency, and temporal drift against ground-truth benchmarks. Any rollout that violates physical laws is flagged or pruned before training your edge policies.",
  },
  {
    question: "Which simulation and world models are supported out of the box?",
    answer: "Horos supports any open-weight model from Hugging Face or private repositories, including the NVIDIA Cosmos family (Predict, Transfer, Dreams), Meta V-JEPA 2, Tencent HunyuanWorld, and Overworld Waypoint-1.5. You can benchmark different model checkpoints, tune frame sampling and attention kernels, and swap architectures with zero vendor lock-in.",
  },
  {
    question: "Can I deploy the fine-tuned world model to private clouds or edge devices?",
    answer: "Yes. You own the full recipe—including environment logic, physics kernels, engine configs, and model weights. Horos compiles the optimized pipeline into self-contained Docker/OCI containers and Kubernetes manifests. With FP8 quantization and TensorRT compilation, models run at >2000 FPS for live edge inference on NVIDIA Jetson, robot controllers, or inside your own air-gapped VPC.",
  }
];



export default function SimulationWorldModelsPage() {
  const [activeTab, setActiveTab] = useState("Horos");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("rollout.py" as any);
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "rollout.py": RETRIEVE_CODE,
    "eval.py": EVAL_CODE,
    "render.sh": SERVE_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE
  };

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "On it. Setting up Genesis simulation environments to generate physical trajectories, fine-tuning Cosmos-1.0 to decode dynamics, and serving with vLLM on 8x B200s with kinematic validation.";
  const AGENT_MSG_2 = "World model training and serving pipeline live. Cosmos-1.0 is decoding physical dynamics at 4500 FPS via vLLM on 8x B200s with zero collision drift. Full recipe and weights ready to deploy.";

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

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || RETRIEVE_CODE;

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
            let description = m.downloads ? `${dl} - Potential distillation target` : "Potential distillation target";
            
            if (m.pipeline_tag) {
              if (m.pipeline_tag.includes("text-generation") || m.pipeline_tag.includes("text2text-generation")) {
                tag = "Generator / Target";
                description = `${dl} - Synthetic data generator or fine-tuning target`;
              }
              else if (m.pipeline_tag.includes("automatic-speech-recognition") || m.pipeline_tag.includes("text-to-speech") || m.pipeline_tag.includes("audio-classification")) {
                tag = "Audio Adapter";
                description = `${dl} - Synthesize or transcribe audio datasets`;
              }
            }

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
        
        {/* SVG Filter for recoloring the butterfly image to brand green colors */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="brand-duotone-butterfly">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0 0 0 1 0"
            />
            <feComponentTransfer colorInterpolationFilters="sRGB">
              <feFuncR type="table" tableValues="0.886 0.458 0.082" />
              <feFuncG type="table" tableValues="0.937 0.749 0.082" />
              <feFuncB type="table" tableValues="0.757 0.000 0.082" />
            </feComponentTransfer>
          </filter>
        </svg>

        {/* Background Image touching nav bottom dashed line */}
        <div className="absolute top-0 inset-x-0 z-0 overflow-hidden pointer-events-none flex justify-center opacity-75">
          <div className="relative w-[900px] h-[550px] mt-2">
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-transparent to-[#151515] z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-[#151515] z-10" />
            <img 
              src="/images/butterfly.png"
              alt="Hero Butterfly Background"
              className="w-full h-full object-contain object-center"
              style={{ 
                maskImage: 'radial-gradient(ellipse at center, black 70%, transparent 100%)',
                filter: 'url(#brand-duotone-butterfly)'
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
                    Simulation &<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      World Models
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    World models that predict what happens next. Learn physical dynamics, simulate futures, and optimize predictions for your workload.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-4 sm:px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[13px] sm:text-[14px] whitespace-nowrap">
                      Optimize world model <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-4 sm:px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[13px] sm:text-[14px] whitespace-nowrap">
                      Explore stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Environment State"
                    label2="Physical Dynamics"
                    label3="Future Prediction"
                    label4="Action Simulation"
                    label5="Policy Evaluation"
                  />
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
              <div className="text-center mb-10 md:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What you actually own</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  The environments, trajectories, and physics parameters used to train and evaluate world models.
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
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 1</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Simulation environments.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Version scene geometry, object properties, initial conditions, forces, and simulator settings. Reproduce scenarios across controlled physical conditions.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 2</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Physics validation.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Compare predicted trajectories with simulator outcomes. Measure position and velocity error, collision accuracy, and prediction drift across longer horizons.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 3</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">World-model training.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Build datasets from simulated trajectories, train on difficult scenarios, and compare checkpoints against held-out environments before deployment.
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
            <div className="flex flex-col items-center mb-10 md:mb-12 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">Three ways to deploy Simulation & World Models
              </h2>
              <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                Deploy world models as standalone predictors, integrated simulator runners, or adapted training pipelines.
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
                        <Key size={16} className="text-[#C8C7BA] shrink-0" />
                        <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed world model APIs</span>
                      </div>
                      <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Per-call, hosted.</p>
                    </div>
                    <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                      <div className="flex items-center gap-3 mb-2">
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
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-12 md:pt-16 mb-12 md:mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-3">
                  World models you own. <span className="text-[#75bf00]">Simulate anywhere.</span>
                </h2>
                <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] md:text-[15px] max-w-2xl mx-auto leading-relaxed text-center">
                  The full recipe ships with you. Environment logic, physics kernels, engine configs, and model weights. Run it anywhere.
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
                gridTemplateColumns: 'minmax(0, 41fr) minmax(0, 443fr) minmax(0, 226fr) minmax(0, 602fr) minmax(0, 39fr)',
                gridTemplateRows: 'minmax(0, 53.5fr) minmax(0, 785fr) minmax(0, 53.5fr)'
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
                gridTemplateColumns: 'minmax(0, 41fr) minmax(0, 443fr) minmax(0, 226fr) minmax(0, 602fr) minmax(0, 39fr)',
                gridTemplateRows: 'minmax(0, 53.5fr) minmax(0, 785fr) minmax(0, 53.5fr)'
              }}>

                {/* Tabs */}
                <div className="col-start-2 col-end-5 row-start-1 row-end-2 flex items-center justify-between px-4 sm:px-5 pointer-events-auto">
                  <div className="flex gap-4 sm:gap-6 h-full items-end pb-2">
                    <button
                      onClick={() => setActiveMainTab("pipeline")}
                      className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "pipeline" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      <span className="text-[#75bf00]">&gt;_</span> PIPELINE
                    </button>
                    <button
                      onClick={() => setActiveMainTab("code")}
                      className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "code" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      <Code2 size={12} /> CODE
                    </button>
                    <button
                      onClick={() => setActiveMainTab("optimization")}
                      className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "optimization" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      <Sliders size={12} /> OPTIMIZATION
                    </button>
                    <button
                      onClick={() => setActiveMainTab("deploy")}
                      className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "deploy" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
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
                  <div className="flex flex-col gap-3 sm:gap-3.5 overflow-y-auto chat-scroll pr-1.5 pb-2 sm:pb-3">
                    <div className="bg-[#1a1a1a] border border-[#252525] p-3 sm:p-3.5 rounded-[4px]">
                      <p className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-sans leading-[21px] sm:leading-[22px]">
                        Teach a world model to understand and decode the physical world. Fine-tune{" "}
                        <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono text-[#D4D3C9] align-middle mx-0.5">
                          <NvidiaLogo size={10} /> Cosmos 1.0
                        </span>{" "}
                        on driving trajectories, simulate counterfactual actions with{" "}
                        <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono text-[#D4D3C9] align-middle mx-0.5">
                          <HuggingFaceLogo size={10} /> Genesis Sim
                        </span>{" "}
                        physics engine, and serve via{" "}
                        <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono text-[#D4D3C9] align-middle mx-0.5">
                          <VLLMLogo size={10} /> vLLM
                        </span>{" "}
                        on{" "}
                        <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono text-[#75bf00] align-middle mx-0.5">
                          <NvidiaLogo size={10} /> 8x B200
                        </span>.
                      </p>
                    </div>

                    {/* Step 1: Agent Initial Ack */}
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
                          {visibleStep > 1 ? AGENT_MSG_1 : typedMsg1}
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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Bootstrapping Genesis physics environment</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">2.1s</span>
                          </div>
                          <span className="text-[#666] text-[10px] sm:text-[10.5px] truncate">Loaded urban driving scenes, rigid-body meshes, and collision geometry</span>
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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Deploying Cosmos-1.0 serving with vLLM</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">4.5s</span>
                          </div>
                          <span className="text-[#75bf00] text-[10px] sm:text-[10.5px] truncate">Initialized continuous batching and FP8 KV cache on 8x B200</span>
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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Teaching physical dynamics & counterfactual rollouts</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">45.2s</span>
                          </div>
                          <span className="text-[#666] text-[10px] sm:text-[10.5px] truncate">Generated 100k physical trajectories to decode real-world kinematics</span>
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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Kinematic validation & collision verification</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">8.4s</span>
                          </div>
                          <span className="text-[#666] text-[10px] sm:text-[10.5px] truncate">Verified rigid-body constraints and eliminated spatial prediction drift</span>
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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Exporting containerized inference recipe</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">12.8s</span>
                          </div>
                          <span className="text-[#75bf00] text-[10px] sm:text-[10.5px] truncate">Containerized vLLM serving runtime, physics kernels, and model weights</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 7 (LAST STEP): Agent Final Summary */}
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
                          {visibleStep === 7 && typedMsg2.length < AGENT_MSG_2.length ? typedMsg2 : AGENT_MSG_2}
                          {visibleStep === 7 && typedMsg2.length < AGENT_MSG_2.length && (
                            <span className="inline-block w-1.5 h-3 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt input bar */}
                  <div className="mt-2 shrink-0 mb-1">
                    <div className="bg-[#151515] border border-[#252525] rounded-[4px] p-2 flex flex-col gap-1.5">
                      <input
                        type="text"
                        placeholder="Teach the agent to optimize for specific reward criteria..."
                        className="bg-transparent text-[#F0EFE2] text-[11px] sm:text-[11.5px] border-none outline-none w-full px-1.5 py-1"
                        readOnly
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="flex gap-1">
                          <span className="bg-[#222] border border-[#333] text-[9px] sm:text-[9.5px] text-[#C8C7BA] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                            <VLLMLogo size={9} /> @vLLM
                          </span>
                          <span className="bg-[#222] border border-[#333] text-[9px] sm:text-[9.5px] text-[#C8C7BA] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                            <NvidiaLogo size={9} /> @Cosmos-1.0
                          </span>
                          <span className="bg-[#222] border border-[#333] text-[9px] sm:text-[9.5px] text-[#C8C7BA] font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                            <HuggingFaceLogo size={9} /> @Genesis
                          </span>
                        </div>
                        <button className="w-5 h-5 bg-[#75bf00] hover:bg-[#85cf00] transition-colors flex items-center justify-center text-black font-bold rounded-sm">
                          <ArrowUp size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files Content */}
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-4 sm:p-5 flex flex-col items-start gap-2.5 sm:gap-3 overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                  <div className="flex justify-between items-center border-b border-[#252525] pb-2 mb-1 w-full">
                    <span className="text-[9.5px] sm:text-[10px] font-bold tracking-wider text-[#C8C7BA] uppercase">PHYSICS ENGINES</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] sm:text-[9.5px] font-bold px-1.5 py-0.2 rounded-sm">3</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] sm:text-[11.5px] font-mono w-full">
                    <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                      mujoco_env.py
                    </div>
                    <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                      isaac_gym.py
                    </div>
                    <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                      genesis_sim.py
                    </div>

                    {/* Project Tree Folder */}
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 px-1.5 py-1 text-[#aaa] font-semibold truncate">
                        <ChevronDown size={13} className="text-[#777] shrink-0" /> world-model-factory/
                      </div>
                      <div className="pl-3 flex flex-col gap-1 border-l border-[#252525] ml-2.5 mt-0.5">
                        <button
                          onClick={() => selectFileManually("rollout.py")}
                          className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "rollout.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          rollout.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("eval.py")}
                          className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "eval.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          eval.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("render.sh")}
                          className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "render.sh" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          render.sh
                        </button>
                        <button 
                          onClick={() => selectFileManually("pipeline.json")}
                          className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "pipeline.json" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          pipeline.json
                        </button>
                        <button 
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          Dockerfile
                        </button>
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                          docker-compose.yml
                        </div>
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                          requirements.txt
                        </div>
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                          <ChevronRight size={13} className="text-[#333] shrink-0" /> corpus/
                        </div>
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                          <ChevronRight size={13} className="text-[#333] shrink-0" /> evals/
                        </div>
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                          README.md
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-5 sm:p-6 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                  {/* Editor top tabs */}
                  <div className="flex border-b border-[#252525] mb-4 pb-2 pt-1 gap-2 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                    <button
                      onClick={() => selectFileManually("rollout.py")}
                      className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "rollout.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      rollout.py
                    </button>
                    <button
                      onClick={() => selectFileManually("eval.py")}
                      className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "eval.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      eval.py
                    </button>
                    <button
                      onClick={() => selectFileManually("render.sh")}
                      className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "render.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      render.sh
                    </button>
                    <button
                      onClick={() => selectFileManually("pipeline.json")}
                      className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      pipeline.json
                    </button>
                    <button
                      onClick={() => selectFileManually("Dockerfile")}
                      className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "Dockerfile" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      Dockerfile
                    </button>
                  </div>

                  {/* Code Area with Line Numbers */}
                  <div className="flex font-mono text-[12px] sm:text-[12.5px] leading-relaxed overflow-x-auto select-text thin-hover-scrollbar">
                    {/* Line numbers column */}
                    <div className="text-[#444] text-right pr-3.5 border-r border-[#252525] select-none flex flex-col min-w-[28px]">
                      {Array.from({ length: typedCodeText.split('\n').length }).map((_, i) => (
                        <div key={i} className="min-h-[22px] leading-[22px]">{i + 1}</div>
                      ))}
                    </div>

                    {/* Highlighted code column */}
                    <div className="pl-4 flex-1 text-[#C8C7BA] leading-[22px]">
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
          <div />
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
                  <div className="px-6 py-10 sm:px-8 sm:py-12 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cloud size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2]">Managed Horos</h3>
                    <p className="text-[#C8C7BA] text-[14.5px] leading-relaxed">
                      Distributed physics simulation and autoregressive world model rollouts running at 4500 FPS on our B200 clusters.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-10 sm:px-8 sm:py-12 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2]">Your infrastructure</h3>
                    <p className="text-[#C8C7BA] text-[14.5px] leading-relaxed">
                      Deploy environment logic, physics kernels, and world models on AWS, GCP, RunPod, or on-prem. Your simulators, your hardware.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-10 sm:px-8 sm:py-12 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2]">Zero lock-in</h3>
                    <p className="text-[#C8C7BA] text-[14.5px] leading-relaxed">
                      Export the full recipe: environment logic, physics kernels, engine configs, model weights, and container harnesses. Run it anywhere.
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
                <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] xl:text-[52px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-2xl mx-auto leading-tight">Any HF simulation & world model works</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                  Deploy open-weight simulation and world models for physical dynamics, trajectory generation, and robot rollouts. The examples below are just a starting view.
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
                    placeholder="Search any simulation & world model on Hugging Face"
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
                          className={getBorderClasses(index, models.length) + " block no-underline"}
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
                            <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>
                              {model.name}
                            </h3>
                            <span className="text-[#C8C7BA] text-[14px] line-clamp-1">
                              {model.author}
                            </span>
                          </div>
                          
                          <div className="relative z-10 flex justify-between items-center mt-auto pt-4 gap-2">
                            <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0">
                              {model.downloads}
                            </span>
                            <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">
                              {model.role || model.tag}
                            </span>
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
        <div className="w-full relative z-10 mt-20 pb-24 md:pb-32">
          {/* Heading */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What Horos tunes</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Every stage of world-model prediction, optimized per model, environment, and GPU.
                </p>

                {/* Tunes Grid */}
                <div className="flex flex-col w-full border-t border-b border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Row 1 */}
                    <div className="px-8 py-8 md:py-9 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Temporal context and frame sampling</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Tune input frame rate, sequence length, and temporal windows for Cosmos-Predict and V-JEPA 2 workloads. Measure how sampling changes motion prediction and future-state accuracy.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Scene conditioning</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Tune supported image, video, depth, segmentation, and spatial controls. Compare scene variations while preserving the geometry and conditions required by each task.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Action-conditioned prediction</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Evaluate models that accept actions or control inputs. Compare predicted future states across action sequences, initial conditions, and environment changes.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Cpu size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Inference kernels and precision</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Benchmark supported BF16, FP8, attention kernels, and hardware-specific execution paths. Measure throughput, memory consumption, and prediction quality per GPU.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Gauge size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Rollout throughput and memory</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Tune batch size, concurrent sequences, temporal context, and memory allocation to increase simulation throughput without exceeding GPU capacity.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <CheckCircle2 size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Future-state evaluation</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Compare predicted frames, trajectories, and state transitions against held-out video or simulator ground truth. Track temporal drift, position error, and failure cases across prediction horizons.
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#f2efe8] mb-3 text-center">Common <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">questions</span></h2>
            <p className="text-[#C8C7BA] text-sm sm:text-base font-sans text-center mb-10">
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

            {/* Bottom Horizontal Border with Brand Logo & Crosses */}
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />
          </div>

          {/* Bottom CTA Section */}
          <div className="w-full relative z-10 py-32 flex flex-col items-center justify-center overflow-hidden">
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


