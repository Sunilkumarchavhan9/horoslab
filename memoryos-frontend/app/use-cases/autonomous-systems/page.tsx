"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, QwenLogo, BAAILogo, KimiLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUpRight, Search, Brain, Activity, Layers, Database, ShieldCheck, Monitor, Zap, Loader2 } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "System",
    horos: {
      title: "End-to-end autonomous loop",
      desc: "Unified perception, world modeling, trajectory planning, and actuator control."
    },
    closed: {
      title: "Fragmented black-box APIs",
      desc: "High-latency cloud APIs incapable of real-time 50Hz closed-loop control."
    },
    diy: {
      title: "Manual ROS2 glue code",
      desc: "Stitch brittle sensor drivers, manual point-cloud filters, and ROS scripts."
    }
  },
  {
    num: "0 2",
    label: "Models",
    horos: {
      title: "Open-weight VLA & world models",
      desc: "Cosmos, OpenVLA, Octo, and RT-2 checkpoints adapted for your hardware."
    },
    closed: {
      title: "Proprietary cloud vision APIs",
      desc: "Generalist vision models without spatial reasoning or actuator trajectory output."
    },
    diy: {
      title: "Custom model training",
      desc: "Train perception and policy models from scratch on multi-node GPU clusters."
    }
  },
  {
    num: "0 3",
    label: "Environment",
    horos: {
      title: "Spatial state & 3D memory",
      desc: "Maintain multi-modal voxel grids, point-cloud history, and semantic maps."
    },
    closed: {
      title: "Stateless frame analysis",
      desc: "Process independent 2D frames without temporal persistence or spatial depth."
    },
    diy: {
      title: "Custom SLAM pipelines",
      desc: "Maintain hand-tuned LiDAR odometry, ICP registration, and loop closure."
    }
  },
  {
    num: "0 4",
    label: "Prediction",
    horos: {
      title: "Autoregressive world rollouts",
      desc: "Simulate future environmental states and multi-agent interaction trajectories."
    },
    closed: {
      title: "Single-step completions",
      desc: "Predict immediate labels with no forward-simulation of actor dynamics."
    },
    diy: {
      title: "Heuristic physics engines",
      desc: "Write deterministic kinematics equations and manual collision bounding boxes."
    }
  },
  {
    num: "0 5",
    label: "Decision Making",
    horos: {
      title: "Constraint-aware MPC planning",
      desc: "Optimize control trajectories against dynamic obstacle envelopes and kinematic limits."
    },
    closed: {
      title: "Unconstrained text advice",
      desc: "Generate natural language actions requiring external translation to motor commands."
    },
    diy: {
      title: "Handcrafted state machines",
      desc: "Maintain thousands of edge-case if/else rules for every operational domain."
    }
  },
  {
    num: "0 6",
    label: "Real-time Latency",
    horos: {
      title: "Sub-20ms edge execution",
      desc: "Hardware-accelerated INT4/FP8 inference kernels running on robot compute nodes."
    },
    closed: {
      title: "300ms+ cloud roundtrips",
      desc: "Variable internet latency causing dangerous control lag in dynamic settings."
    },
    diy: {
      title: "Manual CUDA optimization",
      desc: "Profile GPU kernels, memory bandwidth, and thread concurrency independently."
    }
  },
  {
    num: "0 7",
    label: "Optimization",
    horos: {
      title: "Full system search",
      desc: "Co-optimize sensor fusion, model quantization, rollout horizons, and compute budgets."
    },
    closed: {
      title: "Coarse hyperparameter sliders",
      desc: "Adjust temperature or top-p without control over inference execution graphs."
    },
    diy: {
      title: "Fragmented benchmarking",
      desc: "Profile inference latencies, sensor ingestion jitter, and system bottlenecks."
    }
  },
  {
    num: "0 8",
    label: "Verification",
    horos: {
      title: "Deterministic safety envelopes",
      desc: "Formally verify control outputs against collision margins and deceleration bounds."
    },
    closed: {
      title: "Generic content filters",
      desc: "Safety guards limited to text moderation without spatial or physical constraints."
    },
    diy: {
      title: "Custom assertion suites",
      desc: "Maintain unit tests, mock telemetry logs, and simulation test harnesses."
    }
  },
  {
    num: "0 9",
    label: "Experience",
    horos: {
      title: "Full mission telemetry & lineage",
      desc: "Log continuous sensor observations, predicted rollouts, actuator commands, and interventions."
    },
    closed: {
      title: "Opaque vendor request logs",
      desc: "View summary request counts with no ability to replay full mission episodes."
    },
    diy: {
      title: "Custom MCAP/ROSbag storage",
      desc: "Build telemetry streaming, MCAP indexing, and flight data recorders from scratch."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    horos: {
      title: "100% on-device air-gapped autonomy",
      desc: "Run completely offline with zero telemetry egress, zero latency jitter, and full IP sovereignty."
    },
    closed: {
      title: "Cloud vendor dependence",
      desc: "Autonomous vehicles and robots stop functioning whenever internet connection drops."
    },
    diy: {
      title: "Manual security & safety audits",
      desc: "Implement air-gap isolation, cryptographic signing, and failsafes from scratch."
    }
  }
];

const SYSTEM_CODE = `# Autonomous System Core: Perception, Trajectory Prediction, and Closed-Loop Control
import torch
from horos_autonomous import SpatialPerception, WorldModelRollout, MPCTrajectoryPlanner, SafetyGate

# Initialize multimodal perception backbone and predictive world model
perception = SpatialPerception.from_pretrained("NVIDIA/Cosmos-1.0-Autoregressive-7B")
world_model = WorldModelRollout.connect(horizon_seconds=4.0, frequency_hz=50)
planner = MPCTrajectoryPlanner.load(kinematics="./vehicle_dynamics.json")

def execute_autonomous_step(sensor_frame: dict) -> dict:
    """Perceive environment, predict future rollouts, and execute verified actuation."""
    
    # 1. Multi-camera & LiDAR 3D occupancy fusion
    spatial_voxel = perception.fuse(
        rgb_cameras=sensor_frame["cameras"],
        lidar_pointcloud=sensor_frame["lidar"],
        imu_state=sensor_frame["odometry"]
    )
    
    # 2. Autoregressive world model prediction of dynamic actors
    predicted_rollout = world_model.predict_future(
        current_state=spatial_voxel,
        horizon_steps=32,
        num_scenarios=16
    )
    
    # 3. Model predictive path planning with collision avoidance
    trajectory = planner.solve_trajectory(
        goal_target=sensor_frame["mission_goal"],
        occupancy_grid=spatial_voxel,
        actor_rollouts=predicted_rollout
    )
    
    # 4. Formally verify kinematics bounds and safety envelope
    SafetyGate.assert_invariants(trajectory, max_decel=4.5, min_clearance_m=1.2)
    
    return trajectory.dispatch_actuators()`;

const SENSORS_CODE = `# Real-Time Sensor Fusion & 3D Voxel Ingestion Pipeline
import numpy as np
from horos_autonomous.sensors import CameraArray, LiDARStream, IMUSynchronizer

# Synchronize 8x HDR cameras and 128-beam LiDAR with nanosecond PTP timestamps
sync = IMUSynchronizer(ptp_domain=0, max_drift_ms=0.5)
cameras = CameraArray.configure(resolution=(1920, 1080), fps=60)
lidar = LiDARStream.connect(port=2368, channels=128)

def ingest_sensor_stream():
    """Ingest hardware sensor stream with zero-copy shared memory."""
    frame_packet = sync.capture(cameras, lidar)
    voxel_grid = frame_packet.generate_occupancy(voxel_res=0.05)
    return voxel_grid`;

const PLANNER_CODE = `# Model Predictive Path Planning & Invariant Safety Gate
from horos_autonomous.control import TrajectoryOptimizer, KinematicEnvelope

envelope = KinematicEnvelope(max_steer_angle_rad=0.6, max_lat_accel=3.2)
optimizer = TrajectoryOptimizer(cost_weights={"progress": 1.0, "comfort": 0.4, "safety": 2.5})

def solve_trajectory(goal, obstacles):
    """Solve optimal spline trajectory with 20ms hard deadline."""
    path = optimizer.compute_optimal_spline(goal, obstacles, envelope=envelope)
    return path`;

const PIPELINE_CODE = `{
  "system": "autonomous-systems-v2",
  "perception_backbone": "Cosmos-1.0-7B",
  "world_model": "AutoregressiveRollout-32step",
  "frequency_hz": 50,
  "hard_deadline_ms": 20,
  "safety_envelope": {
    "min_distance_m": 1.2,
    "max_decel_ms2": 4.5,
    "failsafe_mode": "graceful_stop"
  }
}`;

const DOCKERFILE_CODE = `FROM nvcr.io/nvidia/tensorrt:24.12-py3

RUN apt-get update && apt-get install -y libcan-dev libboost-all-dev ros-humble-ros-base
WORKDIR /opt/autonomous
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python3", "-u", "system.py"]`;

type DataFactoryFile = "system.py" | "sensors.py" | "planner.py" | "pipeline.json" | "Dockerfile";

const BrandImage = ({ src, alt }: { src: string; alt: string }) => {
  const [error, setError] = useState(false);
  if (error) return <HuggingFaceLogo size={20} />;
  return (
    <img
      src={src}
      alt={alt}
      className="w-5 h-5 rounded-[3px] object-cover"
      onError={() => setError(true)}
    />
  );
};

const getLogo = (author: string, modelName: string = "") => {
  if (!author && !modelName) return <HuggingFaceLogo size={20} />;
  const a = (author || "").toLowerCase();
  const m = (modelName || "").toLowerCase();

  if (a.includes('nvidia') || m.includes('cosmos')) return <NvidiaLogo size={20} />;
  if (a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('meta') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('microsoft') || m.includes('florence')) return <MicrosoftLogo size={20} />;
  if (a.includes('google') || m.includes('gemma') || m.includes('paligemma')) return <GoogleLogo size={20} />;
  if (a.includes('mistral') || m.includes('pixtral')) return <MistralLogo size={20} />;
  
  if (a.includes('openvla') || m.includes('openvla')) {
    return <BrandImage src="https://cdn-avatars.huggingface.co/v1/production/uploads/6317aade83d8d2fd903192d9/tPLjYEeP6q1w0j_G2TJG_.png" alt="OpenVLA" />;
  }
  if (a.includes('physical-intelligence') || m.includes('pi0')) {
    return <BrandImage src="https://cdn-avatars.huggingface.co/v1/production/uploads/6846f77025b1107aa791f771/cDBZBLJL8l-huATZV1xB1.png" alt="Physical Intelligence" />;
  }

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

const DEFAULT_MODELS = [
  {
    id: "nvidia/Cosmos-1.0-Autoregressive-7B",
    name: "Cosmos-1.0-7B",
    author: "NVIDIA",
    size: "7B",
    role: "World Modeling",
    tag: "World Modeling",
    hfUrl: "https://huggingface.co/nvidia/Cosmos-1.0-Autoregressive-7B"
  },
  {
    id: "openvla/openvla-7b",
    name: "OpenVLA-7B",
    author: "OpenVLA",
    size: "7B",
    role: "Vision-Language-Action",
    tag: "Vision-Language-Action",
    hfUrl: "https://huggingface.co/openvla/openvla-7b"
  },
  {
    id: "physical-intelligence/pi0",
    name: "Pi0-Robotics",
    author: "Physical Intelligence",
    size: "3B",
    role: "Robotics Control",
    tag: "Robotics Control",
    hfUrl: "https://huggingface.co/physical-intelligence"
  },
  {
    id: "Qwen/Qwen2.5-VL-72B-Instruct",
    name: "Qwen2.5-VL-72B",
    author: "Qwen",
    size: "72B",
    role: "Spatial Vision",
    tag: "Spatial Vision",
    hfUrl: "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct"
  },
  {
    id: "deepseek-ai/DeepSeek-V3",
    name: "DeepSeek-V3",
    author: "DeepSeek",
    size: "671B MoE",
    role: "High-Speed Planning",
    tag: "High-Speed Planning",
    hfUrl: "https://huggingface.co/deepseek-ai/DeepSeek-V3"
  },
  {
    id: "meta-llama/Llama-3.2-11B-Vision-Instruct",
    name: "Llama-3.2-11B-Vision",
    author: "Meta",
    size: "11B",
    role: "Multimodal Perception",
    tag: "Multimodal Perception",
    hfUrl: "https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct"
  },
  {
    id: "microsoft/Florence-2-large",
    name: "Florence-2-Large",
    author: "Microsoft",
    size: "0.77B",
    role: "Edge Perception",
    tag: "Edge Perception",
    hfUrl: "https://huggingface.co/microsoft/Florence-2-large"
  },
  {
    id: "google/paligemma-3b-pt-448",
    name: "PaliGemma-3B",
    author: "Google",
    size: "3B",
    role: "Spatial Grounding",
    tag: "Spatial Grounding",
    hfUrl: "https://huggingface.co/google/paligemma-3b-pt-448"
  },
  {
    id: "mistralai/Pixtral-12B-2409",
    name: "Pixtral-12B",
    author: "Mistral AI",
    size: "12B",
    role: "Visual Reasoning",
    tag: "Visual Reasoning",
    hfUrl: "https://huggingface.co/mistralai/Pixtral-12B-2409"
  }
];

const FAQ_DATA = [
  {
    question: "What are Autonomous Systems and how does Horos optimize them?",
    answer: "Autonomous systems are physical and digital machines—such as autonomous vehicles, mobile robotics, drones, and automated warehouses—that must perceive physical reality, predict dynamic obstacles, and make sub-20ms control decisions. Horos co-optimizes the entire stack from vision-language-action foundation models to TensorRT edge execution and closed-loop safety invariants."
  },
  {
    question: "How do you guarantee sub-20ms control latency for real-time actuation?",
    answer: "Horos compiles model execution graphs into fused CUDA and TensorRT kernels with FP8/INT4 quantization. High-frequency MPC path planners execute asynchronously on dedicated cores while world model rollouts run concurrently with speculative decoding, guaranteeing deterministic 50Hz control cycles without jitter."
  },
  {
    question: "Can autonomous systems operate 100% offline in air-gapped environments?",
    answer: "Yes, completely. Horos compiles all perception weights, predictive world models, and safety gates into self-contained container harnesses that run natively on onboard vehicle or robot compute (such as NVIDIA Drive Orin, Jetson Thor, or industrial x86/ARM nodes) with zero internet dependency."
  },
  {
    question: "How does the SafetyGate enforce physical safety invariants?",
    answer: "Before any trajectory is dispatched to the CAN bus or motor controllers, the deterministic SafetyGate formally evaluates kinematic limits (maximum deceleration, lateral G-force, steering rate) and collision envelopes against the fused 3D voxel grid. If an invariant is violated, a hard real-time failsafe stops the vehicle safely."
  },
  {
    question: "Can we fine-tune world models on our proprietary telemetry logs?",
    answer: "Yes. Horos provides automated data ingestion pipelines for ROS2, MCAP, and camera/LiDAR sensor streams. You can continuously fine-tune autoregressive world models on edge-case interventions, adverse weather episodes, and near-miss logs to progressively expand your operational design domain (ODD)."
  }
];

export default function AutonomousSystemsPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("system.py");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [models, setModels] = useState<any[]>(DEFAULT_MODELS);
  const [isLoading, setIsLoading] = useState(false);

  const FILE_CODE_MAP: Record<string, string> = {
    "system.py": SYSTEM_CODE,
    "sensors.py": SENSORS_CODE,
    "planner.py": PLANNER_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE
  };

  const [typedCodeText, setTypedCodeText] = useState("");

  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || SYSTEM_CODE;
    setTypedCodeText("");
    let charIdx = 0;
    const interval = setInterval(() => {
      if (charIdx < fullCode.length) {
        charIdx += 6;
        setTypedCodeText(fullCode.slice(0, charIdx));
      } else {
        setTypedCodeText(fullCode);
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [activeFile]);

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
            let author = m.author || m.id.split('/')[0];
            let name = m.id.split('/').pop();
            return {
              id: m.id,
              name: name,
              author: author,
              size: dl,
              downloads: dl,
              role: "Autonomous Model",
              tag: "Autonomous Model",
              hfUrl: `https://huggingface.co/${m.id}`
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
      <LandingNavbar />

      <main className="flex-1 w-full flex flex-col items-center z-10">
        
        {/* Hero Section */}
        <div className="w-full relative border-b border-dashed border-[#333]">
          
          {/* Subtle crosshairs */}
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
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      Autonomous Systems
                    </span>
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
                  <RagSearchGrid label1="Perceive" label2="Predict" label3="Decide" label4="Actuate" />
                </div>
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* Features 3-Card Section */}
        <div className="w-full relative z-10 mt-16">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4">Own your autonomous systems</h2>
                <p className="text-[#C8C7BA] text-[20px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  The perception backbones, predictive world models, and real-time control runtimes. Complete sovereignty over physical intelligence.
                </p>
              </div>
            </div>
            <div />
          </div>

          <div className="w-full relative z-10">
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0 mx-[10px] border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  
                  {/* Card 1 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 1</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The perception &<br/>world models.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      Deploy multi-camera vision-language-action (VLA) backbones, LiDAR fusion networks, and spatial world models. You own the architecture.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 2</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The planning &<br/>policy solvers.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      Trajectory prediction, tree-search pathfinders, and real-time MPC solvers optimized for dynamic safety constraints.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 3</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The real-time<br/>edge runtimes.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      Compiled TensorRT and CUDA kernels tailored for low-latency robotics platforms, autonomous vehicles, and drone hardware.
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
          
          <div className="pt-12 md:pt-16">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] mb-12">
              <div />
              <div className="min-w-0">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-3">
                    Compare deployment options
                  </h2>
                  <p className="text-[#C8C7BA] text-[14.5px] sm:text-[15.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                    Evaluate end-to-end autonomous loops against high-latency closed APIs and fragmented DIY stacks.
                  </p>
                </div>
              </div>
              <div />
            </div>

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
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Full closed-loop autonomous stack.</p>
                  </div>

                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed Cloud APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Stateless cloud vision completions.</p>
                  </div>

                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">DIY ROS2 Frameworks</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Manual sensor nodes and glue code.</p>
                  </div>
                </div>

                {/* Table Rows */}
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
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#75bf00] mb-1 leading-snug">{row.horos.title}</h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed">{row.horos.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#F0EFE2] mb-1 leading-snug">{row.closed.title}</h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed">{row.closed.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#F0EFE2] mb-1 leading-snug">{row.diy.title}</h4>
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
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-12 md:pt-16 mb-12 md:mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-3">
                  Code you own. <span className="text-[#75bf00]">Deploy to any edge.</span>
                </h2>
                <p className="text-[#C8C7BA] text-[14.5px] sm:text-[15.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                  The complete recipe ships with you. Spatial perception, world model rollouts, MPC trajectory planning, and hardware safety envelopes. Run it anywhere.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Interactive Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              <div className="w-full relative min-w-0">
                <div className="w-full border border-dashed border-[#333] bg-[#111] rounded-sm overflow-hidden flex flex-col">
                  
                  {/* Top Bar */}
                  <div className="h-10 border-b border-dashed border-[#333] px-4 flex items-center justify-between bg-[#161616]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                      <span className="ml-3 font-mono text-[12px] text-[#888]">autonomous_control_loop</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#75bf00] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00] animate-pulse" />
                      50Hz CLOSED-LOOP ACTIVE
                    </div>
                  </div>

                  {/* Main Panes */}
                  <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
                    
                    {/* Left: Step Execution Trace */}
                    <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-dashed border-[#333] p-6 flex flex-col gap-4 bg-[#141414]">
                      <div className="text-[12px] font-mono text-[#888] uppercase tracking-wider">Mission State</div>
                      <div className="bg-[#1a1a1a] p-3 rounded border border-[#2a2a2a] flex flex-col gap-1 text-[13px]">
                        <span className="text-[#888]">Objective:</span>
                        <span className="text-[#F0EFE2] font-mono">Navigate dynamic corridor to waypoint #WP-812</span>
                      </div>

                      <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-start gap-2.5 text-[12.5px]">
                          <CheckCircle2 size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#F0EFE2]">Ingesting 8x cameras & 128-beam LiDAR</span>
                            <span className="text-[#666] ml-2 font-mono">0.2s</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-[12.5px]">
                          <CheckCircle2 size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#F0EFE2]">Predicting 4.0s future-state world rollouts</span>
                            <span className="text-[#666] ml-2 font-mono">0.4s</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-[12.5px]">
                          <CheckCircle2 size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#F0EFE2]">Evaluating dynamic collision envelope</span>
                            <span className="text-[#666] ml-2 font-mono">0.1s</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-[12.5px]">
                          <CheckCircle2 size={16} className="text-[#75bf00] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#F0EFE2]">Dispatching MPC trajectory to CAN bus</span>
                            <span className="text-[#666] ml-2 font-mono">0.2s</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-[#222] flex justify-between text-[11.5px] font-mono text-[#888]">
                        <span>Latency: <strong className="text-[#75bf00]">18.4ms</strong></span>
                        <span>Safety Margin: <strong className="text-[#75bf00]">1.42m</strong></span>
                      </div>
                    </div>

                    {/* Middle: File Explorer */}
                    <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-dashed border-[#333] p-4 flex flex-col gap-1 bg-[#121212]">
                      <div className="text-[11px] font-mono text-[#666] uppercase tracking-wider mb-2">Files</div>
                      {(["system.py", "sensors.py", "planner.py", "pipeline.json", "Dockerfile"] as DataFactoryFile[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setActiveFile(f)}
                          className={`text-left px-2.5 py-1.5 rounded text-[12px] font-mono transition-colors ${
                            activeFile === f ? "bg-[#75bf00]/10 text-[#75bf00] font-semibold" : "text-[#888] hover:text-[#ccc]"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    {/* Right: Code Viewer */}
                    <div className="md:col-span-5 p-6 bg-[#0e0e0e] flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-mono text-[#888]">{activeFile}</span>
                        <span className="text-[10px] font-mono bg-[#1a1a1a] text-[#75bf00] px-2 py-0.5 rounded">PYTHON 3.11</span>
                      </div>
                      <pre className="font-mono text-[12px] text-[#C8C7BA] leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">
                        {typedCodeText}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* 3-Card Deployment Grid Row */}
          <div className="w-full relative z-10 mb-16 md:mb-20">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              <div className="min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-3 border-t border-b border-l border-r border-dashed border-[#333]">
                  
                  {/* Card 1 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-9 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cloud size={20} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-[#F0EFE2] leading-snug">Managed Horos</h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed">
                      Distributed physics simulation and autoregressive world model rollouts running at 4500 FPS on our B200 clusters.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-9 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={20} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-[#F0EFE2] leading-snug">Your infrastructure</h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed">
                      Deploy perception backbones, planning engines, and simulator harnesses on AWS, GCP, RunPod, or on-prem. Your simulators, your hardware.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-9 flex flex-col gap-3 items-start">
                    <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={20} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-[#F0EFE2] leading-snug">Zero lock-in</h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed">
                      Export the full recipe: environment logic, physics kernels, engine configs, model weights, and container harnesses. Run it anywhere.
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
        </div>

        {/* Hugging Face Catalog Section */}
        <div className="w-full relative z-10 pt-24 pb-16">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl md:text-[38px] lg:text-[42px] xl:text-[45px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-5xl mx-auto leading-tight sm:whitespace-nowrap hyphens-none">
                Any HF autonomous-systems models work
              </h2>
              <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-10">
                Connect any open-weights perception, world model, or vision-language-action checkpoint from Hugging Face. The examples below are just a starting view.
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
                  placeholder="Search any HF autonomous-systems model on Hugging Face"
                  className="w-full bg-[#1a1a1a] border border-dashed border-[#333] text-[#C8C7BA] text-[13.5px] sm:text-[14px] pl-10 pr-12 py-3 rounded-[4px] outline-none focus:border-[#555] transition-colors font-sans placeholder:text-[#666]"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  {isLoading ? (
                    <Loader2 size={16} className="text-[#75bf00] animate-spin" />
                  ) : (
                    <span className="text-[9.5px] font-bold text-[#C8C7BA] border border-dashed border-[#333] px-1.5 py-0.5 rounded-sm">HF</span>
                  )}
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
                        key={model.id || index}
                        href={model.hfUrl || `https://huggingface.co/${model.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={getBorderClasses(index, models.length)}
                      >
                        <ArrowUpRight size={18} className="text-[#75bf00] absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center bg-[#111]">
                          {getLogo(model.author, model.name)}
                        </div>
                        
                        <div className="flex flex-col gap-1 min-w-0">
                          <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>
                            {model.name}
                          </h3>
                          <span className="text-[#C8C7BA] text-[13px] sm:text-[14px] line-clamp-1">
                            {model.author}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                          <span className="text-[#F0EFE2] font-mono font-medium text-[13px] sm:text-[14px] shrink-0">
                            {model.size || model.downloads || ""}
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

        {/* Section Divider with brand logo */}
        <div className="w-full relative z-20 my-16">
          <SectionDivider position="top" className="w-full" />
        </div>

        {/* What Horos Tunes Section */}
        <div className="w-full relative z-10 mb-32">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] mb-12">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-3">
                  What Horos tunes
                </h2>
                <p className="text-[#C8C7BA] text-[14.5px] sm:text-[15.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                  Every stage of autonomous systems, optimized per model, sensor suite, latency constraint, and compute hardware.
                </p>
              </div>
            </div>
            <div />
          </div>

          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333]">
              <div className="grid grid-cols-1 md:grid-cols-3">
                
                {/* Stage 1 */}
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 1</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Perception & world modeling</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Compare spatial vision and autoregressive world models. Tune resolution, temporal context, and feature tokenization against physical simulation accuracy.
                  </p>
                </div>

                {/* Stage 2 */}
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 2</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Trajectory & path optimization</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Optimize model predictive path search, obstacle collision margins, and cost-to-go heuristics against real-time 50Hz execution deadlines.
                  </p>
                </div>

                {/* Stage 3 */}
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 3</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Real-time edge control</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Tune FP8/INT4 quantization, TensorRT execution graphs, and zero-copy shared memory pipelines for sub-20ms control cycles on edge hardware.
                  </p>
                </div>
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full relative z-10 py-16 mb-24 border-t border-dashed border-[#333]">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0 max-w-3xl mx-auto w-full">
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#F0EFE2] mb-8 text-center">
                Frequently asked questions
              </h2>

              <div className="flex flex-col border border-dashed border-[#333] divide-y divide-dashed divide-[#333]">
                {FAQ_DATA.map((faq, idx) => (
                  <div key={idx} className="flex flex-col">
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="flex items-center justify-between p-6 text-left hover:bg-[#1a1a1a] transition-colors"
                    >
                      <span className="text-[15px] sm:text-[16px] font-medium text-[#F0EFE2] pr-4">{faq.question}</span>
                      <ChevronDown
                        size={18}
                        className={`text-[#75bf00] transition-transform duration-200 shrink-0 ${
                          activeFaq === idx ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {activeFaq === idx && (
                      <div className="px-6 pb-6 pt-1 text-[#C8C7BA] text-[13.5px] sm:text-[14px] leading-relaxed bg-[#111]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* Section End Divider with Brand Logo and Crosshairs */}
        <div className="w-full relative z-20 my-16 md:my-24">
          <SectionDivider position="top" className="w-full" />
        </div>

        {/* Bottom Call to Action Section */}
        <div className="w-full relative z-10 pt-12 pb-24">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0 flex flex-col items-center text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#F0EFE2] mb-4">
                Engineer autonomous systems on Horos.
              </h2>
              <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] max-w-xl mb-8 leading-relaxed">
                Connect your perception backbones, fine-tune predictive world models, and deploy verified control runtimes to any edge.
              </p>
              <div className="flex items-center gap-4">
                <button className="group bg-[#75bf00] text-black font-semibold px-6 py-3 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                  Talk to founders <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button className="bg-[#222] text-[#F0EFE2] font-semibold px-6 py-3 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                  Explore models <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div />
          </div>
        </div>

      </main>

      <GlobalFooter />
    </div>
  );
}
