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
    horos: "Engineer the complete workflow from model selection and design exploration to verified results.",
    closed: "Consume individual model APIs for specific engineering tasks.",
    diy: "Connect separate models, solvers, scripts, and services yourself."
  },
  {
    num: "0 2",
    label: "Models",
    horos: "Evaluate open-weight models, adapt checkpoints, and develop task-specific intelligence.",
    closed: "Use provider-supported models with limited control over underlying weights.",
    diy: "Select and manage models, checkpoints, and training infrastructure manually."
  },
  {
    num: "0 3",
    label: "Context",
    horos: "Connect engineering specifications, constraints, system state, design artifacts, and historical results.",
    closed: "Supply context through supported prompts, files, and API integrations.",
    diy: "Build custom parsers, retrieval pipelines, and context management."
  },
  {
    num: "0 4",
    label: "Design exploration",
    horos: "Search candidate designs and configurations against explicit requirements and constraints.",
    closed: "Generate design suggestions within supported model capabilities.",
    diy: "Implement parameter sweeps, search algorithms, and candidate tracking."
  },
  {
    num: "0 5",
    label: "Simulation",
    horos: "Connect compatible simulation workloads to model experiments and recorded outcomes.",
    closed: "Integrate external simulation tools through available interfaces.",
    diy: "Orchestrate simulation runs, input configurations, and output collection yourself."
  },
  {
    num: "0 6",
    label: "Optimization",
    horos: "Compare model, runtime, and workload configurations against quality, latency, compute, and cost targets.",
    closed: "Tune supported API parameters and provider-exposed options.",
    diy: "Build benchmarking, profiling, and optimization loops independently."
  },
  {
    num: "0 7",
    label: "Verification",
    horos: "Evaluate outputs against engineering constraints, numerical tolerances, solver results, and acceptance tests.",
    closed: "Use supported evaluations and external validation tools.",
    diy: "Maintain custom test suites, verification logic, and regression checks."
  },
  {
    num: "0 8",
    label: "Experience",
    horos: "Preserve experiment configurations, model versions, observations, failures, and measured outcomes.",
    closed: "Track results across provider APIs and external observability systems.",
    diy: "Build your own experiment records, lineage, and analysis infrastructure."
  },
  {
    num: "0 9",
    label: "Teaching",
    horos: "Use verified examples and failure cases to drive fine-tuning, adaptation, and subsequent evaluations.",
    closed: "Depend on provider-supported customization and training options.",
    diy: "Assemble datasets, training jobs, checkpoint comparisons, and evaluation pipelines."
  },
  {
    num: "1 0",
    label: "Authority",
    horos: "Govern experiment budgets, data access, deployment permissions, approvals, and model promotion.",
    closed: "Work within provider capabilities and your own integration controls.",
    diy: "Implement access control, budget enforcement, approvals, and deployment policies yourself."
  }
];

const AGENT_CODE = `# Engineering Intelligence Optimization Pipeline for Multiphysics Design Exploration
import numpy as np
from horos_engineering import EngineeringOptimizer, PhysicsSurrogate, ConstraintEvaluator

# Initialize physics-guided optimization model with surrogate weights
optimizer = EngineeringOptimizer.from_pretrained("DeepSeek-R1-Engineering-67B")
surrogate = PhysicsSurrogate.load_mesh(path="./geometry/wing_bracket.step", format="cad")

def optimize_design_space(specifications: dict) -> dict:
    """Explore design space, evaluate aerodynamic & thermal constraints, and verify with FEA."""
    
    # Define design space parameters and boundary conditions
    boundary_conditions = surrogate.extract_boundaries(specifications["boundary_loads"])
    
    # Generate Pareto-optimal candidate geometries under real-world constraints
    candidates = optimizer.explore_candidates(
        objectives=["minimize_stress", "minimize_drag"],
        constraints=specifications["safety_tolerances"],
        surrogate=surrogate
    )
    
    # Run high-fidelity multiphysics simulation on top candidates
    simulation_results = optimizer.run_solver_simulation(candidates[0], solver="OpenFOAM-FEA")
    
    if simulation_results.all_constraints_satisfied:
        return optimizer.export_design_artifact(candidates[0], metrics=simulation_results.metrics)
    else:
        # Refine design parameters using gradient constraint solver
        refined = optimizer.refine_topology(candidates[0], simulation_results.violations)
        return optimizer.export_design_artifact(refined)
        
    return None`;

const RUN_SWE_CODE = `#!/usr/bin/env bash
# Engineering Intelligence multi-objective optimization pipeline
set -euo pipefail
 
GEOMETRY_SPEC="./specs/wing_bracket_v4.json"
SOLVER_CONFIG="openfoam-fea-coupled"

# Run physics-guided design optimization in isolated GPU container
horos-engineering-engine optimize \\
  --spec $GEOMETRY_SPEC \\
  --model DeepSeek-R1-Engineering-67B \\
  --surrogate physics-mesh-surrogate \\
  --solver $SOLVER_CONFIG \\
  --max-iterations 2500 \\
  --target-reduction 0.15 \\
  --output-artifact ./optimized_component.step`;

const PIPELINE_CODE = `{
  "name": "engineering-intelligence-optimization",
  "engine": "multiphysics-optimizer-v4",
  "model": "DeepSeek-R1-Engineering-67B",
  "design_space": {
    "cad_format": "STEP/IGES",
    "mesh_resolution": "adaptive-tetrahedral",
    "boundary_solvers": ["FEA", "CFD", "Thermal"]
  },
  "constraints": {
    "min_safety_factor": 1.5,
    "max_von_mises_mpa": 450.0,
    "thermal_gradient_c": 120.0
  },
  "solver_sandbox": "openfoam-fea-isolated",
  "auto_export_cad": true
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.0-devel-ubuntu22.04 AS base
 
RUN apt-get update && apt-get install -y python3.11 python3-pip git openfoam gmsh
 
WORKDIR /workspace
COPY requirements.txt .
RUN pip install -r requirements.txt
 
COPY engines/ /workspace/engines/
COPY optimize.py run_opt.sh pipeline.json .
 
EXPOSE 8080
ENTRYPOINT ["/workspace/run_opt.sh"]`;

const EVAL_CODE = `# Multiphysics validation harness: verifying structural safety factors and solver convergence
from horos_eval import PhysicsValidator, ConstraintGate

def evaluate_solution_quality(baseline_cad: str, optimized_cad: str) -> dict:
    """Verify engineering design validity against FEA/CFD acceptance criteria."""
    
    validator = PhysicsValidator(solver_backend="multiphysics-gpu")
    quality_gate = ConstraintGate(safety_factor_min=1.5, yield_tolerance_mpa=450.0)
    
    # Run finite-element stress and thermal load simulation
    stress_analysis = validator.run_fea_stress(optimized_cad)
    
    # Check yield tolerance and safety margin criteria
    constraints_met = quality_gate.verify_margins(stress_analysis)
    
    return {
        "safety_margin_verified": constraints_met.passed,
        "max_von_mises_stress": stress_analysis.max_stress_mpa,
        "weight_reduction_pct": stress_analysis.mass_delta_pct,
        "solver_converged": stress_analysis.converged
    };`;

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

function AutodeskLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19L11.5 4H15.5L8 19H4Z" fill="#0696D7" />
      <path d="M12.5 12L16 5H20L13.5 18L10 18L12.5 12Z" fill="#00D2B4" />
      <path d="M13.5 18H20V19H13.5V18Z" fill="#0696D7" />
    </svg>
  );
}

function HexeraLogo({ size = 22 }: { size?: number }) {
  return (
    <img
      src="/brand-logos/hexera.png"
      alt="Hexera"
      width={size}
      height={size}
      className="object-contain rounded-sm"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.src = "https://cdn-avatars.huggingface.co/v1/production/uploads/68aa7ed343f7b4cbd85e1dac/bacFSHrurTWwwY6z-IPA2.png";
      }}
    />
  );
}

function CADReasonerLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7L12 3L20 7L12 11L4 7Z" stroke="#38BDF8" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 7V17L12 21V11" stroke="#38BDF8" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 7V17L12 21" stroke="#0284C7" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 9.5L16 13.5" stroke="#38BDF8" strokeWidth="1.4" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

function FutureCADLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#A855F7" strokeWidth="1.6" />
      <path d="M3 12H21M12 3V21" stroke="#A855F7" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.7" />
      <circle cx="12" cy="12" r="3.5" stroke="#C084FC" strokeWidth="1.6" />
      <path d="M7 7L17 17" stroke="#A855F7" strokeWidth="1.4" />
    </svg>
  );
}

function IndustrialLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4V2M12 22V20M4 12H2M22 12H20M6.34 6.34L4.93 4.93M19.07 19.07L17.66 17.66M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4.5" stroke="#F59E0B" strokeWidth="1.8" />
      <path d="M10 11L11.5 13L14 10" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DEFAULT_MODELS = [
  {
    id: "ADSKAILab/Zero-To-CAD-Qwen3-VL-2B",
    name: "Zero-To-CAD-Qwen3-VL-2B",
    author: "Autodesk AI Lab",
    size: "2B",
    role: "Image-to-CAD",
    description: "Autodesk foundation model converting 2D engineering sketches and drawings directly into 3D CAD models.",
    hfUrl: "https://huggingface.co/ADSKAILab/Zero-To-CAD-Qwen3-VL-2B"
  },
  {
    id: "nvidia/PhysicalAI-Simulation-VoMP-Model",
    name: "PhysicalAI-Simulation-VoMP",
    author: "NVIDIA",
    size: "VoMP 7B",
    role: "Physics Simulation",
    description: "NVIDIA foundation model predicting volumetric mechanical properties and stress tensors directly from 3D geometry.",
    hfUrl: "https://huggingface.co/nvidia/PhysicalAI-Simulation-VoMP-Model"
  },
  {
    id: "deepseek-ai/DeepSeek-R1-0528",
    name: "DeepSeek-R1-0528",
    author: "DeepSeek",
    size: "671B MoE",
    role: "Technical Reasoning",
    description: "Frontier reasoning model with specialized chain-of-thought verification for complex engineering and mathematical proofs.",
    hfUrl: "https://huggingface.co/deepseek-ai/DeepSeek-R1-0528"
  },
  {
    id: "microsoft/CADFusion",
    name: "CADFusion",
    author: "Microsoft",
    size: "8B",
    role: "Text-to-CAD",
    description: "Microsoft Research generative model translating natural language engineering requirements into parametric CAD operations.",
    hfUrl: "https://huggingface.co/microsoft/CADFusion"
  },
  {
    id: "Qwen/Qwen3.5-397B-A17B",
    name: "Qwen3.5-397B-A17B",
    author: "Qwen",
    size: "397B MoE",
    role: "Frontier Reasoning",
    description: "Massive open MoE foundation model with frontier mathematical, physical, and engineering analysis capabilities.",
    hfUrl: "https://huggingface.co/Qwen/Qwen3.5-397B-A17B"
  },
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    name: "Llama-3.3-70B-Instruct",
    author: "Meta",
    size: "70B",
    role: "Multiphysics Modeling",
    description: "Meta open flagship model optimized for complex multiphysics modeling, simulation orchestration, and numerical workflows.",
    hfUrl: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct"
  },
  {
    id: "mistralai/Codestral-22B-v0.1",
    name: "Codestral-22B-v0.1",
    author: "Mistral",
    size: "22B",
    role: "Solver Optimization",
    description: "Mistral AI high-performance model specialized in numerical solver code synthesis, algorithmic tuning, and CUDA kernels.",
    hfUrl: "https://huggingface.co/mistralai/Codestral-22B-v0.1"
  },
  {
    id: "hexera-org/GmshNet-8B-v0.1",
    name: "GmshNet-8B-v0.1",
    author: "Hexera",
    size: "8B",
    role: "CAE Meshing",
    description: "Neural CAE meshing engine for automated 2D/3D finite-element mesh generation and boundary discretization.",
    hfUrl: "https://huggingface.co/hexera-org/GmshNet-8B-v0.1"
  },
  {
    id: "google/gemma-2-27b-it",
    name: "Gemma-2-27B-IT",
    author: "Google",
    size: "27B",
    role: "Scientific Analysis",
    description: "Google DeepMind lightweight open foundation model trained for high-precision scientific analysis and engineering evaluations.",
    hfUrl: "https://huggingface.co/google/gemma-2-27b-it"
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

  if (a.includes('autodesk') || a.includes('adska') || m.includes('zero-to-cad')) return <AutodeskLogo size={20} />;
  if (a.includes('nvidia') || m.includes('vomp') || m.includes('physicalai')) return <NvidiaLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('microsoft') || m.includes('cadfusion') || m.includes('flexcad')) return <MicrosoftLogo size={20} />;
  if (a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('mistral') || m.includes('codestral')) return <MistralLogo size={20} />;
  if (a.includes('hexera') || m.includes('gmsh')) return <HexeraLogo size={20} />;
  if (a.includes('google') || m.includes('gemma')) return <GoogleLogo size={20} />;
  if (a.includes('multilingual') || a.includes('industrial') || m.includes('industrialcoder')) return <IndustrialLogo size={20} />;
  if (a.includes('kulibin') || m.includes('cadreasoner')) return <CADReasonerLogo size={20} />;
  if (a.includes('jhlee') || m.includes('futurecad')) return <FutureCADLogo size={20} />;
  if (a.includes('github') || m.includes('copilot') || m.includes('swe')) return <GithubLogo size={20} />;
  if (a.includes('anthropic') || m.includes('claude')) return <AnthropicLogo size={20} />;

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
    question: "How does Engineering Intelligence simulate and verify complex physical systems?",
    answer: "Horos couples neural physics surrogates with high-fidelity multiphysics solvers (FEA, CFD, OpenFOAM). AI models explore vast design spaces at millisecond speeds, while traditional numerical solvers rigorously verify boundary constraints and safety tolerances.",
  },
  {
    question: "Can I connect my team's proprietary CAD geometries, solvers, and boundary data?",
    answer: "Yes. Native support for standard CAD formats (STEP, IGES, STL), mesh formats (tetrahedral, polyhedral), and solver APIs enables seamless integration with your existing simulation pipelines and internal engineering databases.",
  },
  {
    question: "Can I deploy optimized engineering models on-premise or in air-gapped environments?",
    answer: "Yes! All trained surrogate models, fine-tuned engineering weights, and solver containers can be exported as containerized artifacts (Docker, Singularity, TensorRT) and deployed completely inside your private infrastructure.",
  }
];

export default function AutonomousSoftwareEngineersPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("optimize.py" as any);
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "optimize.py": AGENT_CODE,
    "eval.py": EVAL_CODE,
    "run_opt.sh": RUN_SWE_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE
  };

  const AGENT_MSG_1 = "On it. I'll load the wing bracket geometry, parameterize boundary constraints, evaluate 10,000 design candidates, and run coupled FEA stress simulations.";
  const AGENT_MSG_2 = "Optimization complete. Candidate #418 achieves 18.4% mass reduction while meeting all safety margins. Validated CAD model ready for deployment.";

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
    const fullCode = FILE_CODE_MAP[activeFile] || AGENT_CODE;

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

            let tag = "Engineering Model";
            let description = m.downloads ? `${dl} - Engineering model` : "Engineering model";
            
            let author = m.author || m.id.split('/')[0];
            let name = m.id.split('/').pop();

            return {
              id: m.id,
              name: name,
              author: author,
              downloads: dl,
              size: dl,
              description: description,
              tag: tag,
              role: tag,
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
        
        {/* SVG Filter for recoloring the hummingbird image to brand green colors */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="brand-duotone-hummingbird">
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

        {/* Background Image centered in Hero Section */}
        <div className="absolute top-0 inset-x-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center opacity-75">
          <div className="relative w-[900px] h-[600px] mt-4">
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-transparent to-[#151515] z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-[#151515] z-10" />
            <img 
              src="/images/hummingbird.webp"
              alt="Hero Hummingbird Background"
              className="w-full h-full object-contain object-center"
              style={{ 
                maskImage: 'radial-gradient(ellipse at center, black 75%, transparent 100%)',
                filter: 'url(#brand-duotone-hummingbird)'
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
                    Engineering<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      Intelligence
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Models that solve complex engineering problems, explore design spaces, simulate system behavior, and optimize performance under real-world constraints.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Optimize this workload <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Read the stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Design Search"
                    label2="Simulation"
                    label3="Performance Optimization"
                    label4="Model Weights"
                    label5="System Modeling"
                    label6="Verification"
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
              <div className="text-center mb-10 md:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-3">What you actually own</h2>
                <p className="text-[#C8C7BA] text-[14.5px] sm:text-[15.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                  The engineering models, simulation environments, and constraint evaluators. Full control over how engineering solutions are generated, tested, and optimized.
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
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 1</div>
                    <h3 className="text-lg sm:text-xl md:text-[22px] font-medium text-[#F0EFE2] leading-snug">The engineering models.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      You own the model checkpoints, domain adapters, and configurations used for engineering analysis. Version model changes and compare their performance across design, code, and numerical workloads.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 2</div>
                    <h3 className="text-lg sm:text-xl md:text-[22px] font-medium text-[#F0EFE2] leading-snug">The simulation and validators.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      You define engineering constraints, solver configurations, test scenarios, and acceptance criteria. Compare predicted results against simulation outputs and explicit engineering requirements.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 3</div>
                    <h3 className="text-lg sm:text-xl md:text-[22px] font-medium text-[#F0EFE2] leading-snug">The optimized system versions.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      You control the validated model versions, runtime configurations, and deployment artifacts. Compare solution quality, execution time, compute requirements, and cost before promoting a configuration.
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
            <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#f2efe8] mb-3 text-center mt-8 md:mt-10">
              Three ways to build engineering-intelligence
            </h2>
            <p className="text-[#C8C7BA] text-[14px] sm:text-[15px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
              Compare Horos with closed engineering AI APIs and custom-built pipelines across model development, design exploration, simulation, optimization, and verification.
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
                    <div key={idx} className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200">
                      <div className="flex items-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] min-h-[72px]">
                        <div className="flex items-center gap-3">
                          <span className="text-[#75bf00] font-mono text-[12px] font-bold">{row.num}</span>
                          <span className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2]">{row.label}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                        <p className="text-[#E6E5D8] text-[12.5px] sm:text-[13px] leading-relaxed">{row.horos}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <p className="text-[#C8C7BA] text-[12.5px] sm:text-[13px] leading-relaxed">{row.closed}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <p className="text-[#C8C7BA] text-[12.5px] sm:text-[13px] leading-relaxed">{row.diy}</p>
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
                  The full recipe ships with you. Engineering models, simulation harnesses, constraint evaluators, and model weights. Run it anywhere.
                </p>
              </div>
            </div>
            <div />
          </div>

          <SectionDivider position="top" className="absolute top-0 left-0 right-0 z-20" />

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              <div className="w-full relative min-w-0">
                {/* Sandbox Content Container (SVG Skeleton Architecture) */}
                <div className="w-full relative mx-auto" style={{ aspectRatio: '1351 / 892' }}>

              {/* Panes Backgrounds */}
              <div className="absolute inset-0 grid" style={{
                gridTemplateColumns: 'minmax(0, 41fr) minmax(0, 443fr) minmax(0, 226fr) minmax(0, 602fr) minmax(0, 39fr)',
                gridTemplateRows: 'minmax(0, 53.5fr) minmax(0, 785fr) minmax(0, 53.5fr)'
              }}>
                <div className="col-start-2 col-end-5 row-start-1 row-end-2 bg-[#151515]" />
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 bg-[#151515]" />
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 bg-[#151515]" />
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 bg-[#151515]" />
              </div>

              <SkeletonGrid className="absolute inset-0 w-full h-full z-10" />

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
                      <p className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium mb-1 leading-[18px] sm:leading-[19px]">
                        Optimize structural wing bracket in{" "}
                        <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] align-middle font-mono text-[10.5px]">
                          <Workflow size={10} /> cad/wing-bracket-v4
                        </span>{" "}
                        run coupled FEA & CFD solver with{" "}
                        <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] align-middle font-mono text-[10.5px]">
                          <DeepSeekLogo size={10} /> DeepSeek-R1-67B
                        </span>{" "}
                        and verify constraints on{" "}
                        <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#75bf00] align-middle font-mono text-[10.5px]">
                          <Cpu size={10} /> Multiphysics Sandbox
                        </span>.
                      </p>
                    </div>

                    {/* Step 1 */}
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
                        <p className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] leading-[18px]">
                          {visibleStep > 1 ? AGENT_MSG_1 : typedMsg1}
                          {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length && (
                            <span className="inline-block w-1.5 h-3 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Logs list */}
                    <div className="flex flex-col gap-2 mt-1">
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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Parameterizing design space & boundary loads</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">1.2s</span>
                          </div>
                          <span className="text-[#666] text-[10px] sm:text-[10.5px] truncate">Loaded CAD mesh with 384,000 tetrahedral elements</span>
                        </div>
                      </div>

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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Surrogate model candidate exploration</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">3.5s</span>
                          </div>
                          <span className="text-[#75bf00] text-[10px] sm:text-[10.5px] truncate">Screened 10,000 design candidates via neural surrogate</span>
                        </div>
                      </div>

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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Coupled FEA & multiphysics simulation</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">7.1s</span>
                          </div>
                          <span className="text-[#666] text-[10px] sm:text-[10.5px] truncate">Simulated top 50 candidates in OpenFOAM & FEA solver</span>
                        </div>
                      </div>

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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Constraint verification & safety margin audit</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">14.2s</span>
                          </div>
                          <span className="text-[#666] text-[10px] sm:text-[10.5px] truncate">Verified von Mises stress &lt; 450 MPa, safety factor &gt; 1.65</span>
                        </div>
                      </div>

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
                            <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Synthesizing optimized CAD artifact</span>
                            <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">22.8s</span>
                          </div>
                          <span className="text-[#75bf00] text-[10px] sm:text-[10.5px] truncate">Mass reduced by 18.4%. Exported verified STEP to pipeline</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 7 */}
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
                        <p className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] leading-[18px]">
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
                        placeholder="Define engineering constraints, solver configurations, or design objectives..."
                        className="bg-transparent text-[#F0EFE2] text-[11px] sm:text-[11.5px] border-none outline-none w-full px-1.5 py-1"
                        readOnly
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="flex gap-1">
                          <span className="bg-[#222] border border-[#333] text-[8.5px] sm:text-[9px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@Constraints</span>
                          <span className="bg-[#222] border border-[#333] text-[8.5px] sm:text-[9px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@Solvers</span>
                          <span className="bg-[#222] border border-[#333] text-[8.5px] sm:text-[9px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@Objectives</span>
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
                    <span className="text-[9.5px] sm:text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase">ENGINEERING ENGINES</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">3</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] sm:text-[11.5px] font-mono w-full">
                    <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                      design_search.py
                    </div>
                    <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                      fea_solver.py
                    </div>
                    <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                      constraint_eval.py
                    </div>

                    <div className="mt-1 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 px-1.5 py-1 text-[#aaa] font-semibold">
                        <ChevronDown size={13} className="text-[#777]" /> engineering-factory/
                      </div>
                      <div className="pl-3 flex flex-col gap-1 border-l border-[#252525] ml-2.5 mt-0.5">
                        <button
                          onClick={() => selectFileManually("optimize.py")}
                          className={`flex items-center gap-1.5 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "optimize.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          optimize.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("eval.py")}
                          className={`flex items-center gap-1.5 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "eval.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          eval.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("run_opt.sh")}
                          className={`flex items-center gap-1.5 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "run_opt.sh" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_opt.sh
                        </button>
                        <button 
                          onClick={() => selectFileManually("pipeline.json")}
                          className={`flex items-center gap-1.5 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "pipeline.json" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          pipeline.json
                        </button>
                        <button 
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-1.5 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          Dockerfile
                        </button>
                        <div className="flex items-center gap-1.5 px-1.5 py-1 text-[#555] truncate">
                          boundary_mesh.step
                        </div>
                        <div className="flex items-center gap-1.5 px-1.5 py-1 text-[#555] truncate">
                          tolerances.yaml
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-5 sm:p-6 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                  <div className="flex border-b border-[#252525] mb-4 pb-2 pt-1 gap-1.5 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                    <button
                      onClick={() => selectFileManually("optimize.py")}
                      className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "optimize.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      optimize.py
                    </button>
                    <button
                      onClick={() => selectFileManually("eval.py")}
                      className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "eval.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      eval.py
                    </button>
                    <button
                      onClick={() => selectFileManually("run_opt.sh")}
                      className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold px-2.5 py-1 border-b-2 transition-colors ${activeFile === "run_opt.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      run_opt.sh
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

                  <div className="flex font-mono text-[11.5px] sm:text-[12px] leading-[20px] overflow-x-auto select-text thin-hover-scrollbar">
                    <div className="text-[#444] text-right pr-4 border-r border-[#252525] select-none flex flex-col min-w-[28px]">
                      {Array.from({ length: typedCodeText.split('\n').length }).map((_, i) => (
                        <div key={i} className="min-h-[20px] leading-[20px]">{i + 1}</div>
                      ))}
                    </div>

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
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              

              <div className="min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cpu size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Simulation Solvers</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Coupled FEA, CFD, and multiphysics solvers operating directly on high-resolution CAD geometry and boundary meshes.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Neural Surrogates</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Self-host fast neural physics surrogates and engineering foundation models on private GPUs with complete IP control.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-8 py-16 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <ShieldCheck size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Constraint Validators</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Evaluate safety factors, yield tolerances, and thermal margins inside isolated simulation sandboxes before promotion.
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
                  Any HF engineering-intelligence models work
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                  Use any open-weights engineering intelligence model as your optimization engine, or fine-tune specialized CAD & simulation surrogates. The examples below are just a starting view.
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
                    placeholder="Search any HF engineering-intelligence model on Hugging Face"
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
                              {model.size || ""}
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

          {/* Tuning Section */}
          <div className="w-full relative z-10 mt-20">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0">
                <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] xl:text-[52px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-2xl mx-auto leading-tight">
                  What Horos tunes
                </h2>
                <p className="text-[#A0A098] text-[15px] sm:text-[16px] font-sans leading-relaxed text-center max-w-lg mx-auto mb-12">
                  Every stage of the engineering pipeline, retuned per model, geometry, and solver.
                </p>

                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Row 1 */}
                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">CAD Mesh Parameterization</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Tune mesh discretization and boundary load representations for instant evaluation of complex geometric topologies.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Coupled Multiphysics Reasoning</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Correlate structural, aerodynamic, and thermal physics to generate unified engineering designs without boundary conflicts.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Sandboxed Solver Execution</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Profile isolated containerized solver harnesses (OpenFOAM, FEA, Gmsh) to verify physical stability and convergence.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Pareto-Front Optimization</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Built-in multi-objective exploration harness balancing mass reduction, stiffness, and thermal dissipation under hard constraints.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Automated CAD & STEP Generation</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Quantize neural surrogate weights for rapid inference and synthesize manufacturing-ready STEP/IGES CAD artifacts in seconds.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Workflow size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Surrogate Fine-Tuning</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Fine-tune neural physics models on your proprietary simulation datasets, test benches, and internal engineering standards.
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
                  Edit the model, solver, or constraints inline. Send to retune the stack in the dashboard.
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
                Deploy your first engineering<br className="hidden md:block" />
                model, <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">measured</span> before you<br className="hidden md:block" />
                ship
              </h2>

              <p className="text-[#a0a0a0] text-[18px] md:text-[20px] font-sans mb-12">
                Define the geometry, boundary loads, or constraints. Horos builds and optimizes the engineering stack.
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

