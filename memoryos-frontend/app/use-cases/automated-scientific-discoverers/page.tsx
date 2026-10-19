"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import {
  HorosLogo,
  MetaLogo,
  DeepSeekLogo,
  NvidiaLogo,
  GoogleLogo,
  MistralLogo,
  HuggingFaceLogo,
  SGLangLogo,
  OpenAILogo,
  MicrosoftLogo,
  K8sFaviconLogo,
  VLLMLogo,
  QwenLogo,
  BAAILogo,
  AuthorMonogram,
  KimiLogo,
  HorosWordmarkLogo,
  AnthropicLogo,
  GithubLogo,
  JinaLogo,
  MixedbreadLogo,
  SnowflakeLogo,
  NomicLogo,
  TeslaLogo,
  OneXLogo,
} from "@/components/horos/primitives/brand-icons";
import {
  Key,
  Cpu,
  Terminal,
  Code2,
  Sliders,
  Rocket,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Play,
  Cloud,
  Server,
  Network,
  ArrowUp,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Search,
  Brain,
  Infinity,
  Activity,
  Layers,
  Database,
  Mic,
  Workflow,
  Package,
  Gauge,
  Lock,
  EyeOff,
  ShieldCheck,
  Sun,
  Monitor,
  Moon,
  Zap,
  Loader2,
  ScanSearch,
  FlaskConical,
} from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "System",
    pretrained: "Start with a pretrained scientific model and evaluate its capabilities.",
    simulation: "Generate training examples from computational simulations.",
    experimental: "Adapt a model using measured experimental data and verified results.",
  },
  {
    num: "0 2",
    label: "Models",
    pretrained: "MatterSim, MACE-MP-0, ESM-2",
    simulation: "MatterSim, MACE-MP-0, domain-specific predictors",
    experimental: "ESM-2, BioGPT, or a compatible scientific checkpoint",
  },
  {
    num: "0 3",
    label: "Data",
    pretrained: "Scientific datasets, molecular structures, protein sequences, and domain literature.",
    simulation: "Atomic trajectories, simulated properties, molecular configurations, and solver outputs.",
    experimental: "Laboratory measurements, assay results, material properties, and experimental observations.",
  },
  {
    num: "0 4",
    label: "Capabilities",
    pretrained: "Predict properties, represent scientific structures, and analyze domain-specific inputs.",
    simulation: "Learn patterns from simulated systems and predict outcomes for new configurations.",
    experimental: "Adapt predictions to specific experimental conditions and scientific domains.",
  },
  {
    num: "0 5",
    label: "Workload",
    pretrained: "Molecular property prediction, protein analysis, and materials screening.",
    simulation: "Molecular dynamics, materials simulation, and computational experiments.",
    experimental: "Protein property prediction, experimental outcome prediction, and materials characterization.",
  },
  {
    num: "0 6",
    label: "Training",
    pretrained: "Benchmark pretrained models and select suitable checkpoints.",
    simulation: "Generate synthetic examples, filter them, and fine-tune target models.",
    experimental: "Fine-tune on experimental datasets using suitable training objectives.",
  },
  {
    num: "0 7",
    label: "Verification",
    pretrained: "Compare predictions against established scientific benchmarks.",
    simulation: "Validate against held-out simulations and higher-fidelity calculations.",
    experimental: "Evaluate against held-out experimental measurements and reference results.",
  },
  {
    num: "0 8",
    label: "Experience",
    pretrained: "Record checkpoints, datasets, predictions, and baseline results.",
    simulation: "Track simulation settings, generated data, training runs, and model errors.",
    experimental: "Preserve experimental provenance, dataset versions, predictions, and observed outcomes.",
  },
  {
    num: "0 9",
    label: "Teaching",
    pretrained: "Identify capability gaps and select targeted adaptation experiments.",
    simulation: "Use verified synthetic examples to improve the target model.",
    experimental: "Use experimental errors and new measurements to refine subsequent model versions.",
  },
  {
    num: "1 0",
    label: "Authority",
    pretrained: "Govern model licenses, dataset access, and compute budgets.",
    simulation: "Control simulation budgets, synthetic-data acceptance, and training runs.",
    experimental: "Enforce experimental-data permissions, training approvals, and checkpoint promotion.",
  },
];

const README_CODE = `# Scientific AI Engine
Autonomous intelligence pipeline by Horos.

## Architecture
- Models: MatterSim, MACE-MP-0, ESM-2, BioGPT
- Solvers: OpenMM 8.1 CUDA & Quantum ESPRESSO
- Tasks: Molecular prediction, force audit
- Proofs: Zero-unphysical-drift guarantees

## Batch Run
$ horos-science-ai train-and-eval \\
    --models MatterSim,MACE-MP-0,ESM-2 \\
    --solver OpenMM-CUDA-v8.1 \\
    --benchmarks ./benchmarks/materials_2026`;

const DFT_AST_CODE = `# Ab-initio DFT Crystal Lattice AST Builder
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class AtomicNode:
    symbol: str
    position: Tuple[float, float, float]
    charge: float

class DFTGraphEngine:
    """Parses structures into 3D lattice graphs."""
    
    @staticmethod
    def build_lattice(pdb_seq: str) -> Dict[str, any]:
        """Generate atomic bond vectors."""
        nodes = [
            AtomicNode("Fe", (0.0, 0.0, 0.0), 2.0),
            AtomicNode("N", (1.2, 0.5, 0.0), -1.0),
            AtomicNode("C", (2.4, 1.1, 0.2), 0.0),
        ]
        return {
            "lattice_vectors": np.eye(3).tolist(),
            "atomic_nodes": nodes,
            "space_group": "P6/mmm",
            "bandgap_ev": 1.42
        }`;

const PHYSICS_PROVER_CODE = `# Zero-Drift CUDA Physics Verifier
import torch
from typing import List, Dict

class PhysicsVerifier:
    """Mathematical force field verifier."""
    
    def __init__(self, policy: str = "strict-energy"):
        self.policy = policy
        self.max_drift = 0.001

    def verify_trajectory(self, frames: List[Dict]):
        """Verify kinetic & potential energy."""
        total_drift = sum(f.get("drift", 0.0) for f in frames)
        is_valid = total_drift <= self.max_drift
        return {
            "is_valid": is_valid,
            "hash": "0x8f2a99c1d0e4f3a7",
            "drift_kcal_mol": round(total_drift, 5),
            "policy": self.policy,
            "status": "PASSED"
        }`;

const FORCEFIELD_CODE = `# OpenMM & AMBER Force Field Auditor
from typing import Dict

class ForceFieldAuditor:
    """Audits steric clash & stability."""
    
    def __init__(self, ff: str = "amber14.xml"):
        self.forcefield = ff

    def audit_stability(self, struct: Dict) -> Dict:
        """Calculate stability & binding delta."""
        return {
            "binding": -14.28,
            "steric_clash_score": 0.0,
            "van_der_waals_energy": -42.1,
            "thermodynamic_stability_pct": 99.7
        }`;

const RUN_SIMULATION_CODE = `# Scientific AI Pipeline: Models & Solvers
import torch
from horos_science import (
    ScientificAIEngine,
    PhysicsVerifier,
    ForceFieldAuditor,
)

# Load scientific models with OpenMM solver
engine = ScientificAIEngine.from_pretrained(
    materials="MatterSim",
    forcefield="MACE-MP-0",
    proteins="ESM-2-650M"
)
verifier = PhysicsVerifier(policy="strict-energy")
auditor = ForceFieldAuditor(ff="amber14.xml")

def run_scientific_evaluation(pdb: str, target_ev: float = 1.4):
    """Predict atomic forces and run simulation."""
    
    # Predict atomic forces with MatterSim & MACE
    forces = engine.predict_forces(pdb)
    
    # Audit thermodynamic stability & bounds
    stability = auditor.audit_stability(forces)
    
    # Run molecular dynamics on 8x H100 cluster
    sim = engine.simulate(forces, bandgap=target_ev)
    
    # Verify energy conservation proofs
    proof = verifier.verify_trajectory(sim.frames)
    
    if proof["is_valid"]:
        return {
            "status": "VERIFIED_ACCURATE",
            "binding_energy_kcal": stability["binding"],
            "force_mae_ev": 0.0012,
            "proof_hash": proof["hash"],
            "unphysical_drift": 0.0,
            "checkpoint_ready": True
        }
    return None`;

const RUN_DFT_AUDIT_CODE = `#!/usr/bin/env bash
# Scientific AI batch simulation runner
set -euo pipefail

DATASET_DIR="./candidates/materials_2026"
SOLVER="Quantum-ESPRESSO-v7.2"

echo "[Horos] Initializing 8x H100 GPU Cluster..."
echo "[Horos] Benchmarking MatterSim & MACE-MP-0..."
echo "[Horos] Running OpenMM molecular dynamics..."

# Run zero-unphysical-drift simulation
horos-science-ai train-and-eval \\
  --input-dir $DATASET_DIR \\
  --models MatterSim,MACE-MP-0,ESM-2 \\
  --solver $SOLVER \\
  --drift-policy strict \\
  --output ./evaluation_report.json`;

const SIMULATION_PIPELINE_CODE = `{
  "name": "scientific-ai-pipeline",
  "version": "2.4.0",
  "foundation_models": [
    "MatterSim",
    "MACE-MP-0",
    "ESM-2",
    "BioGPT"
  ],
  "solvers": {
    "molecular_dynamics": "OpenMM-CUDA-8.1",
    "dft_engine": "Quantum-ESPRESSO"
  },
  "training": {
    "synthetic_sim_data": true,
    "experimental_data": true,
    "drift_threshold": 0.001
  },
  "benchmarks": [
    "atomic_forces",
    "stability",
    "binding_affinity"
  ]
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.0-devel-ubuntu22.04 AS base

RUN apt-get update && apt-get install -y \\
    python3.11 openmm quantum-espresso

WORKDIR /science
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . /science/
EXPOSE 8080
ENTRYPOINT ["/science/run_dft_audit.sh"]`;

const DOCKER_COMPOSE_CODE = `version: "3.8"

services:
  scientific-ai:
    build: .
    ports:
      - "8080:8080"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    environment:
      - SOLVER_POLICY=strict-energy
      - CUDA_DEVICES=0,1,2,3,4,5,6,7
      - PRECISION=fp16-cuda12.4`;

const REQUIREMENTS_CODE = `torch>=2.4.0
mattersim>=1.0.0
mace-torch>=0.3.5
fair-esm>=2.0.0
openmm>=8.1.1
horos-scientific-ai>=2.4.0
biopython>=1.83
scipy>=1.13.0`;

const EVAL_PHYSICS_CODE = `# Benchmark predictions against reference data
from horos_eval import (
    BenchmarkEvaluator,
    PhysicsSafetyGate,
)

def evaluate_scientific_accuracy(checkpoint: str, dataset: str):
    """Verify prediction accuracy and energy proofs."""
    evaluator = BenchmarkEvaluator()
    safety = PhysicsSafetyGate(policy="zero-drift")
    
    # Verify CUDA trajectory energy conservation
    proof = safety.verify_proofs(checkpoint)
    
    # Score predictions against reference data
    metrics = evaluator.score_model(checkpoint, dataset)
    
    return {
        "physics_verified": proof,
        "energy_mae_ev": metrics.energy_mae,
        "force_rmse": metrics.force_rmse,
        "unphysical_drift": 0.0,
        "promoted_to_registry": True
    }`;

type DataFactoryFile = string;

function highlightCode(
  code: string,
  lang: string,
  isComplete: boolean = false,
) {
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
        lineContent = (
          <span className="text-[#75bf00] font-bold">{content}</span>
        );
      } else if (
        content.trim().startsWith("-") ||
        content.trim().startsWith("*") ||
        content.trim().startsWith("$")
      ) {
        lineContent = <span className="text-[#93c5fd]">{content}</span>;
      } else {
        lineContent = content;
      }
    } else if (lang === "python") {
      const parts = content.split(
        /(\bimport\b|\bfrom\b|\bdef\b|\breturn\b|"[^"]*"|'[^']*'|"""[\s\S]*?""")/,
      );
      lineContent = parts.map((part, pi) => {
        if (["import", "from", "def", "return"].includes(part)) {
          return (
            <span key={pi} className="text-[#a855f7] font-semibold">
              {part}
            </span>
          );
        }
        if (
          (part.startsWith('"') && part.endsWith('"')) ||
          (part.startsWith("'") && part.endsWith("'")) ||
          part.startsWith('"""')
        ) {
          return (
            <span key={pi} className="text-[#75bf00]">
              {part}
            </span>
          );
        }
        return part;
      });
    } else if (lang === "bash" || lang === "dockerfile") {
      const parts = content.split(
        /(\bFROM\b|\bRUN\b|\bWORKDIR\b|\bCOPY\b|\bEXPOSE\b|\bENTRYPOINT\b|\bset\b|\bpython\b|"[^"]*")/,
      );
      lineContent = parts.map((part, pi) => {
        if (
          [
            "FROM",
            "RUN",
            "WORKDIR",
            "COPY",
            "EXPOSE",
            "ENTRYPOINT",
            "set",
            "python",
          ].includes(part)
        ) {
          return (
            <span key={pi} className="text-[#3b82f6] font-semibold">
              {part}
            </span>
          );
        }
        if (part.startsWith("--") || part.startsWith("-")) {
          return (
            <span key={pi} className="text-[#93c5fd]">
              {part}
            </span>
          );
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return (
            <span key={pi} className="text-[#75bf00]">
              {part}
            </span>
          );
        }
        return part;
      });
    } else if (lang === "json") {
      const parts = line.split(
        /("[^"]*"\s*:|"[^"]*"|\b\d+\b|\btrue\b|\bfalse\b)/,
      );
      lineContent = parts.map((part, pi) => {
        if (part.endsWith(":")) {
          return (
            <span key={pi} className="text-[#93c5fd]">
              {part}
            </span>
          );
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return (
            <span key={pi} className="text-[#75bf00]">
              {part}
            </span>
          );
        }
        if (["true", "false"].includes(part)) {
          return (
            <span key={pi} className="text-[#a855f7]">
              {part}
            </span>
          );
        }
        return part;
      });
    } else {
      lineContent = content;
    }

    return (
      <div
        key={i}
        className={`min-h-[17px] sm:min-h-[19px] leading-[17px] sm:leading-[19px] flex items-center transition-colors rounded-sm px-1 ${
          isCurrentActiveLine && !isComplete ? "bg-[#75bf00]/10" : ""
        }`}
      >
        {isCurrentActiveLine && !isComplete ? (
          <span className="w-[3px] h-[12px] bg-[#75bf00] animate-pulse inline-block mr-1.5 rounded-full shrink-0 align-middle" />
        ) : (
          <span className="w-[3px] h-[12px] bg-transparent inline-block mr-1.5 shrink-0" />
        )}

        <span className="flex-1 whitespace-pre">{lineContent}</span>

        {isCurrentActiveLine && !isComplete && (
          <span className="inline-block w-[5px] h-[12px] bg-[#75bf00] animate-pulse ml-1 align-middle shrink-0" />
        )}
        {i === totalLines - 1 && isComplete && (
          <span className="inline-block w-[5px] h-[12px] bg-[#75bf00] animate-pulse ml-1 align-middle shrink-0" />
        )}
      </div>
    );
  });
}

const DEFAULT_MODELS = [
  {
    id: "tsinghua-sigs-robot-lab/VeriLoop-E2",
    name: "VeriLoop-E2",
    author: "Tsinghua SIGS Robot Lab",
    downloads: "28B",
    params: "28B",
    role: "Math & Physics",
    tag: "Math & Physics",
    url: "https://huggingface.co/tsinghua-sigs-robot-lab/VeriLoop-E2",
    description:
      "Mathematical and physical reasoning verification model with self-improving loops.",
  },
  {
    id: "SciReason/SciReasoner-8B",
    name: "SciReasoner-8B",
    author: "SciReason",
    downloads: "8B",
    params: "8B",
    role: "Scientific Reasoning",
    tag: "Scientific Reasoning",
    url: "https://huggingface.co/SciReason/SciReasoner-8B",
    description:
      "8B scientific reasoning model optimized for scientific problem solving and discovery.",
  },
  {
    id: "MegaScience/Qwen3-8B-MegaScience",
    name: "Qwen3-8B-MegaScience",
    author: "MegaScience",
    downloads: "8B",
    params: "8B",
    role: "Science Q&A",
    tag: "Science Q&A",
    url: "https://huggingface.co/MegaScience/Qwen3-8B-MegaScience",
    description:
      "8B science Q&A and cross-disciplinary scientific discovery model.",
  },
  {
    id: "yasserrmd/SciReason-LFM2-2.6B",
    name: "SciReason-LFM2-2.6B",
    author: "yasserrmd",
    downloads: "2.6B",
    params: "2.6B",
    role: "Compact Reasoning",
    tag: "Compact Reasoning",
    url: "https://huggingface.co/yasserrmd/SciReason-LFM2-2.6B",
    description:
      "Compact 2.6B reasoning model fine-tuned for efficient scientific reasoning.",
  },
  {
    id: "MegaScience/Qwen3-1.7B-MegaScience",
    name: "Qwen3-1.7B-MegaScience",
    author: "MegaScience",
    downloads: "1.7B",
    params: "1.7B",
    role: "Small Science Model",
    tag: "Small Science Model",
    url: "https://huggingface.co/MegaScience/Qwen3-1.7B-MegaScience",
    description:
      "Ultra-compact 1.7B scientific assistant for rapid inference and embedded workloads.",
  },
  {
    id: "deepseek-ai/DeepSeek-R1-0528",
    name: "DeepSeek-R1-0528",
    author: "DeepSeek",
    downloads: "671B MoE",
    params: "671B MoE",
    role: "Frontier Reasoning",
    tag: "Frontier Reasoning",
    url: "https://huggingface.co/deepseek-ai/DeepSeek-R1-0528",
    description:
      "671B MoE frontier reasoning model with deep chain-of-thought verification.",
  },
  {
    id: "Qwen/Qwen3-235B-A22B",
    name: "Qwen3-235B-A22B",
    author: "Qwen",
    downloads: "235B MoE",
    params: "235B MoE",
    role: "Complex Problem Solving",
    tag: "Complex Problem Solving",
    url: "https://huggingface.co/Qwen/Qwen3-235B-A22B",
    description:
      "235B mixture-of-experts model activating 22B parameters for advanced problem solving.",
  },
  {
    id: "Qwen/Qwen3.5-27B",
    name: "Qwen3.5-27B",
    author: "Qwen",
    downloads: "27B",
    params: "27B",
    role: "Multimodal Science",
    tag: "Multimodal Science",
    url: "https://huggingface.co/Qwen/Qwen3.5-27B",
    description:
      "27B dense multimodal scientific reasoning and vision-language comprehension model.",
  },
  {
    id: "BioMistral/BioMistral-7B",
    name: "BioMistral-7B",
    author: "BioMistral",
    downloads: "7B",
    params: "7B",
    role: "Biomedical Research",
    tag: "Biomedical Research",
    url: "https://huggingface.co/BioMistral/BioMistral-7B",
    description:
      "Open-source 7B medical language model adapted for biomedical domains and literature.",
  },
];

const getLogo = (author: string, modelName: string = "") => {
  if (!author && !modelName) return <HuggingFaceLogo size={20} />;
  const a = (author || "").toLowerCase();
  const m = (modelName || "").toLowerCase();

  if (a.includes("openai") || m.includes("gpt"))
    return <OpenAILogo size={20} />;
  if (a.includes("nvidia") || m.includes("nemo"))
    return <NvidiaLogo size={20} />;
  if (
    a.includes("meta") ||
    a.includes("llama") ||
    m.includes("llama") ||
    m.includes("esmfold")
  )
    return <MetaLogo size={20} />;
  if (a.includes("deepseek") || m.includes("deepseek"))
    return <DeepSeekLogo size={20} />;
  if (a.includes("google") || m.includes("alphafold") || m.includes("palmyra"))
    return <GoogleLogo size={20} />;
  if (a.includes("mistral") || m.includes("mixtral") || m.includes("mistral"))
    return <MistralLogo size={20} />;
  if (
    a.includes("alibaba") ||
    a.includes("qwen") ||
    m.includes("qwen") ||
    a.includes("megascience")
  )
    return <QwenLogo size={20} />;
  if (a.includes("anthropic") || m.includes("claude"))
    return <AnthropicLogo size={20} />;
  if (a.includes("microsoft") || m.includes("phi"))
    return <MicrosoftLogo size={20} />;

  return <HuggingFaceLogo size={20} />;
};

const getBorderClasses = (index: number, total: number) => {
  let classes =
    "p-8 border-dashed border-[#333] flex flex-col gap-6 group hover:bg-[#1a1a1a] transition-colors cursor-pointer relative";

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
    question:
      "How does Scientific AI guarantee zero unphysical drift?",
    answer:
      "Horos uses GPU-accelerated OpenMM and Quantum ESPRESSO physics solvers combined with mathematical force field verification to ensure every atomic trajectory and energy state adheres to thermodynamics.",
  },
  {
    question:
      "Can Scientific AI predict material structures, protein sequences, and reaction dynamics?",
    answer:
      "Yes. Native support for MatterSim, MACE-MP-0, and ESM-2 enables high-accuracy atomic force prediction, sequence embeddings, and end-to-end scientific evaluation.",
  },
  {
    question:
      "Can I export fine-tuned scientific checkpoints to run on my HPC cluster or supercomputer?",
    answer:
      "Yes! All adapted checkpoints and CUDA simulation containers can be exported as TensorRT binaries and deployed on Slurm, Kubernetes, or air-gapped HPC supercomputers.",
  },
];

export default function AutomatedScientificDiscoverersPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>(
    "simulate.py" as any,
  );
  const [activeMainTab, setActiveMainTab] = useState<
    "pipeline" | "code" | "optimization" | "deploy"
  >("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "README.md": README_CODE,
    "dft_ast.py": DFT_AST_CODE,
    "dft_lattice.py": DFT_AST_CODE,
    "dft_lattice_ast.py": DFT_AST_CODE,
    "prover.py": PHYSICS_PROVER_CODE,
    "physics_prover.py": PHYSICS_PROVER_CODE,
    "forcefield.py": FORCEFIELD_CODE,
    "forcefield_audit.py": FORCEFIELD_CODE,
    "forcefield_auditor.py": FORCEFIELD_CODE,
    "simulate.py": RUN_SIMULATION_CODE,
    "run_simulation.py": RUN_SIMULATION_CODE,
    "eval.py": EVAL_PHYSICS_CODE,
    "eval_physics.py": EVAL_PHYSICS_CODE,
    "dft_run.sh": RUN_DFT_AUDIT_CODE,
    "run_dft_audit.sh": RUN_DFT_AUDIT_CODE,
    "pipeline.json": SIMULATION_PIPELINE_CODE,
    "simulation_pipeline.json": SIMULATION_PIPELINE_CODE,
    Dockerfile: DOCKERFILE_CODE,
    "compose.yml": DOCKER_COMPOSE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "deps.txt": REQUIREMENTS_CODE,
    "requirements.txt": REQUIREMENTS_CODE,
  };

  const AGENT_MSG_1 =
    "Benchmarking MatterSim & MACE force fields. Running OpenMM dynamics on 8x H100 GPUs.";
  const AGENT_MSG_2 =
    "Simulation complete. Candidate #14 verified with zero drift. Checkpoint promoted.";

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
      timer = setTimeout(() => setVisibleStep((prev) => prev + 1), 450);
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
    fetch(
      `https://huggingface.co/api/models?search=${encodeURIComponent(debouncedQuery)}&limit=9&sort=downloads&direction=-1`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((m: any) => {
            let dl = "0 dl";
            if (m.downloads) {
              if (m.downloads >= 1000000)
                dl =
                  (m.downloads / 1000000).toFixed(1).replace(/\.0$/, "") +
                  "M dl";
              else if (m.downloads >= 1000)
                dl = Math.round(m.downloads / 1000) + "k dl";
              else dl = m.downloads + " dl";
            }

            let tag = "Science Model";
            let description = m.downloads
              ? `${dl} - Verifiable physics target`
              : "Verifiable physics target";

            let author = m.author || m.id.split("/")[0];
            let name = m.id.split("/").pop();

            return {
              id: m.id,
              name: name,
              author: author,
              downloads: dl,
              description: description,
              tag: tag,
            };
          });
          setModels(mapped);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-[#151515] text-[#F0EFE2] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col relative">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .chat-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; transition: scrollbar-color 0.3s; }
        .chat-scroll:hover { scrollbar-color: #666666 transparent; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 4px; }
        .chat-scroll:hover::-webkit-scrollbar-thumb { background-color: #666666; }
      `,
        }}
      />

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
          <filter id="brand-duotone-science-bg">
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
              src="/images/science-bird.png"
              alt="Automated Scientific Discoverers Background"
              className="w-full h-full object-contain object-center"
              style={{
                maskImage:
                  "radial-gradient(ellipse 65% 55% at 50% 40%, black 30%, transparent 95%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 65% 55% at 50% 40%, black 30%, transparent 95%)",
                filter: "url(#brand-duotone-science-bg)",
              }}
            />
          </div>
        </div>
        {/* Hero Section Container */}
        <div className="w-full relative mt-20 mb-20 min-h-[600px] flex items-center">
          <SectionDivider
            position="bottom"
            className="absolute bottom-0 left-0 w-full z-0"
          />

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
                    Scientific Models<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      for Discovery
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Develop models for molecular dynamics, material properties, and complex physical systems. Compare predictions against simulation results and experimental measurements to identify where models work, where they fail, and what to improve next.
                  </p>

                  <div className="flex flex-row items-center gap-3 sm:gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-4 sm:px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[13.5px] sm:text-[14px] whitespace-nowrap shrink-0">
                      <span>Engineer scientific models</span>
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1 shrink-0"
                      />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-4 sm:px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[13.5px] sm:text-[14px] whitespace-nowrap shrink-0">
                      <span>Explore the stack</span>
                      <ChevronRight size={16} className="shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid
                    label1="Molecular Dynamics"
                    label2="Material Properties"
                    label3="Physical Simulations"
                    label4="Experimental Measurements"
                    label5="Prediction Error"
                    label6="Model Adaptation"
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
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3">
                  What you actually own
                </h2>
                <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] md:text-[15px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                  Your scientific models, simulation data, and experimental results. Train and evaluate models such as MatterSim, MACE-MP-0, and ESM-2 against real scientific tasks.
                </p>
              </div>
            </div>
            <div />
          </div>

          <div className="w-full relative z-10">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Card 1 */}
                  <div className="px-6 py-7 sm:px-8 sm:py-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="text-[#75bf00] font-mono text-[13.5px] font-bold tracking-wider">
                      01
                    </div>
                    <h3 className="text-[19px] sm:text-[20px] font-medium text-[#F0EFE2] leading-snug">
                      Materials discovery
                    </h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14px] leading-relaxed font-sans">
                      Use{" "}
                      <a
                        href="https://huggingface.co/OneScience-Group/MatterSim"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#75bf00] underline underline-offset-4 decoration-[#75bf00]/70 hover:decoration-[#8ade00] hover:text-[#8ade00] transition-colors"
                      >
                        MatterSim
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://huggingface.co/mace-foundations/mace-mp-0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#75bf00] underline underline-offset-4 decoration-[#75bf00]/70 hover:decoration-[#8ade00] hover:text-[#8ade00] transition-colors"
                      >
                        MACE-MP-0
                      </a>{" "}
                      to predict atomic energies and forces, and investigate material structures.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-7 sm:px-8 sm:py-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="text-[#75bf00] font-mono text-[13.5px] font-bold tracking-wider">
                      02
                    </div>
                    <h3 className="text-[19px] sm:text-[20px] font-medium text-[#F0EFE2] leading-snug">
                      Protein and biology models
                    </h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14px] leading-relaxed font-sans">
                      Use{" "}
                      <a
                        href="https://huggingface.co/facebook/esm2_t33_650M_UR50D"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#75bf00] underline underline-offset-4 decoration-[#75bf00]/70 hover:decoration-[#8ade00] hover:text-[#8ade00] transition-colors"
                      >
                        ESM-2
                      </a>{" "}
                      to analyze protein sequences and{" "}
                      <a
                        href="https://huggingface.co/microsoft/biogpt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#75bf00] underline underline-offset-4 decoration-[#75bf00]/70 hover:decoration-[#8ade00] hover:text-[#8ade00] transition-colors"
                      >
                        BioGPT
                      </a>{" "}
                      to work with biomedical research text.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-7 sm:px-8 sm:py-8 flex flex-col gap-3 items-start">
                    <div className="text-[#75bf00] font-mono text-[13.5px] font-bold tracking-wider">
                      03
                    </div>
                    <h3 className="text-[19px] sm:text-[20px] font-medium text-[#F0EFE2] leading-snug">
                      Scientific model improvement
                    </h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14px] leading-relaxed font-sans">
                      Fine-tune these models on domain-specific data, compare predictions with reference results, and evaluate improved checkpoints on unseen scientific tasks.
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
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">
              Three ways to build Scientific AI
            </h2>
            <p className="text-[#C8C7BA] text-[14px] sm:text-[15px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
              Build scientific intelligence from pretrained models, simulation-generated data, or real experimental results. Horos lets you adapt models, test predictions, and measure improvements against scientific evidence.
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
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8C7BA] uppercase">
                      Dimension
                    </span>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm shrink-0">
                        <Brain size={16} className="text-[#75bf00]" />
                      </div>
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">
                        Pretrained models
                      </span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">
                      Start with a foundation checkpoint and benchmark capabilities.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm shrink-0">
                        <Cpu size={16} className="text-[#C8C7BA]" />
                      </div>
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">
                        Simulation data
                      </span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">
                      Generate synthetic training examples from physical simulations.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm shrink-0">
                        <FlaskConical size={16} className="text-[#C8C7BA]" />
                      </div>
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">
                        Experimental results
                      </span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">
                      Adapt checkpoints using measured lab and assay data.
                    </p>
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
                          Pretrained models
                        </span>
                        <p className="text-[#F0EFE2] text-[12.5px] sm:text-[13.5px] leading-relaxed font-sans">
                          {row.pretrained}
                        </p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <span className="md:hidden text-[10px] font-mono font-bold text-[#C8C7BA] uppercase mb-1">
                          Simulation data
                        </span>
                        <p className="text-[#C8C7BA] text-[12.5px] sm:text-[13.5px] leading-relaxed font-sans">
                          {row.simulation}
                        </p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <span className="md:hidden text-[10px] font-mono font-bold text-[#C8C7BA] uppercase mb-1">
                          Experimental results
                        </span>
                        <p className="text-[#C8C7BA] text-[12.5px] sm:text-[13.5px] leading-relaxed font-sans">
                          {row.experimental}
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
                  Scientific AI you own.{" "}
                  <span className="text-[#75bf00]">
                    Simulate physics anywhere.
                  </span>
                </h2>
                <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] md:text-[15px] max-w-2xl mx-auto leading-relaxed text-center">
                  The complete scientific AI stack ships with you. Pretrained foundation models (MatterSim, MACE-MP-0, ESM-2), physics simulation solvers, training pipelines, and experimental verifiers.
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
                    <span className="text-[9.5px] sm:text-[10px] font-bold text-[#75bf00] tracking-widest uppercase">
                      Live
                    </span>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-3 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden min-w-0 pointer-events-auto">
                  <div className="flex flex-col gap-3 sm:gap-3.5 overflow-y-auto chat-scroll pr-1.5 pb-2 min-w-0">
                    <div className="bg-[#181818] border border-[#262626] p-2 sm:p-2.5 rounded-[4px] min-w-0">
                      <p className="text-[#C8C7BA] text-[10px] sm:text-[11px] font-sans leading-[15px] sm:leading-[17px]">
                        Predict atomic forces & crystal stability using{" "}
                        <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#F0EFE2] font-mono text-[8.5px] sm:text-[9.5px] align-middle whitespace-nowrap">
                          <MetaLogo size={10} /> MatterSim & MACE
                        </span>{" "}
                        with OpenMM dynamics on{" "}
                        <span className="inline-flex items-center gap-1 border border-[#333] bg-[#202020] px-1.5 py-0.5 rounded text-[#75bf00] font-mono text-[8.5px] sm:text-[9.5px] align-middle whitespace-nowrap">
                          <NvidiaLogo size={10} /> 8x H100 GPU
                        </span>.
                      </p>
                    </div>

                    {/* Step 1 */}
                    <div
                      className={`flex gap-2 sm:gap-2.5 mt-1 transition-all duration-500 transform ${visibleStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                    >
                      <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                        {visibleStep === 1 &&
                          typedMsg1.length < AGENT_MSG_1.length ? (
                          <Loader2
                            size={12}
                            className="text-[#75bf00] animate-spin"
                          />
                        ) : (
                          <Sparkles size={12} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[9px] font-bold tracking-widest text-[#555] uppercase">
                          Agent
                        </span>
                        <p className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] leading-[16px] sm:leading-[18px]">
                          {typedMsg1}
                          {visibleStep === 1 &&
                            typedMsg1.length < AGENT_MSG_1.length && (
                              <span className="inline-block w-1.5 h-3 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                            )}
                        </p>
                      </div>
                    </div>

                    {/* Logs list */}
                    <div className="flex flex-col gap-2 sm:gap-2.5 mt-1 min-w-0">
                      <div
                        className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 2 ? (
                            <Loader2
                              size={12}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={12}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                          <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">
                              Ingesting atomic coordinates & structures
                            </span>
                            <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">
                              0.9s
                            </span>
                          </div>
                          <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">
                            Parsed 148 atomic coordinates [MatterSim & MACE-MP-0]
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 3 ? (
                            <Loader2
                              size={12}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={12}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                          <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">
                              Running computational physics & force solver
                            </span>
                            <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">
                              2.1s
                            </span>
                          </div>
                          <span className="text-[#75bf00] text-[9.5px] sm:text-[10px] truncate">
                            100% force match in OpenMM [8x NVIDIA H100 GPU]
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 4 ? (
                            <Loader2
                              size={12}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={12}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                          <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">
                              Analyzing protein sequences & biomedical literature
                            </span>
                            <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">
                              4.5s
                            </span>
                          </div>
                          <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">
                            Cross-referenced sequence embeddings [ESM-2 / BioGPT]
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 5 ? (
                            <Loader2
                              size={12}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={12}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                          <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">
                              Evaluating predictions against benchmarks
                            </span>
                            <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">
                              9.8s
                            </span>
                          </div>
                          <span className="text-[#666] text-[9.5px] sm:text-[10px] truncate">
                            High binding candidate in Structure 14.2 (99.7%)
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-start gap-2 sm:gap-2.5 transition-all duration-500 transform ${visibleStep >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 6 ? (
                            <Loader2
                              size={12}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={12}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                          <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] font-medium truncate">
                              Generating evaluation report & checkpoint
                            </span>
                            <span className="text-[#C8C7BA] text-[9.5px] sm:text-[10px] shrink-0 font-mono">
                              14.2s
                            </span>
                          </div>
                          <span className="text-[#75bf00] text-[9.5px] sm:text-[10px] truncate">
                            Simulation verified. Checkpoint promoted
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 7 */}
                    <div
                      className={`flex gap-2 sm:gap-2.5 mt-1 transition-all duration-500 transform ${visibleStep >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                    >
                      <div className="w-5 h-5 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                        {visibleStep === 7 &&
                          typedMsg2.length < AGENT_MSG_2.length ? (
                          <Loader2
                            size={12}
                            className="text-[#75bf00] animate-spin"
                          />
                        ) : (
                          <Sparkles size={12} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[9px] font-bold tracking-widest text-[#555] uppercase">
                          Agent
                        </span>
                        <p className="text-[#C8C7BA] text-[10.5px] sm:text-[11.5px] leading-[16px] sm:leading-[18px]">
                          {typedMsg2}
                          {visibleStep === 7 &&
                            typedMsg2.length < AGENT_MSG_2.length && (
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
                        placeholder="Predict atomic forces & stability..."
                        className="bg-transparent text-[#F0EFE2] text-[10px] sm:text-[11px] border-none outline-none w-full px-1 py-0.5 placeholder:text-[#555]"
                        readOnly
                      />
                      <div className="flex items-center justify-between px-1 gap-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                            @Models
                          </span>
                          <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                            @Solvers
                          </span>
                          <span className="bg-[#202020] border border-[#333] text-[8px] sm:text-[8.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                            @Verify
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
                      SCIENTIFIC AI STACK
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
                      onClick={() => selectFileManually("dft_ast.py")}
                      className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "dft_ast.py" || activeFile === "dft_lattice.py" || activeFile === "dft_lattice_ast.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      <span className="truncate min-w-0 flex-1">dft_ast.py</span>
                    </button>
                    <button
                      onClick={() => selectFileManually("prover.py")}
                      className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "prover.py" || activeFile === "physics_prover.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      <span className="truncate min-w-0 flex-1">prover.py</span>
                    </button>
                    <button
                      onClick={() =>
                        selectFileManually("forcefield.py")
                      }
                      className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "forcefield.py" || activeFile === "forcefield_audit.py" || activeFile === "forcefield_auditor.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      <span className="truncate min-w-0 flex-1">forcefield.py</span>
                    </button>

                    <div className="mt-1 flex flex-col gap-0.5 sm:gap-1 w-full min-w-0">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 text-[#aaa] font-semibold text-[10px] sm:text-[11px] truncate min-w-0">
                        <ChevronDown size={12} className="text-[#777] shrink-0" />{" "}
                        science-ai/
                      </div>
                      <div className="pl-2.5 flex flex-col gap-0.5 sm:gap-1 border-l border-[#252525] ml-2 mt-0.5 w-full min-w-0">
                        <button
                          onClick={() =>
                            selectFileManually("simulate.py")
                          }
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "simulate.py" || activeFile === "run_simulation.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">simulate.py</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("eval.py")}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "eval.py" || activeFile === "eval_physics.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">eval.py</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("dft_run.sh")}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "dft_run.sh" || activeFile === "run_dft_audit.sh" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">dft_run.sh</span>
                        </button>
                        <button
                          onClick={() =>
                            selectFileManually("pipeline.json")
                          }
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "pipeline.json" || activeFile === "simulation_pipeline.json" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">pipeline.json</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">Dockerfile</span>
                        </button>
                        <button
                          onClick={() =>
                            selectFileManually("compose.yml")
                          }
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "compose.yml" || activeFile === "docker-compose.yml" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">compose.yml</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("deps.txt")}
                          className={`flex items-center gap-1.5 px-1.5 py-0.5 sm:py-1 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "deps.txt" || activeFile === "requirements.txt" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          <span className="truncate min-w-0 flex-1">deps.txt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-3 sm:p-4 md:p-5 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar min-w-0">
                  <div className="flex border-b border-[#252525] mb-3 pb-1.5 pt-0.5 gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                    {[
                      "simulate.py",
                      "eval.py",
                      "prover.py",
                      "compose.yml",
                      ...(activeFile && ![
                        "simulate.py",
                        "run_simulation.py",
                        "eval.py",
                        "eval_physics.py",
                        "prover.py",
                        "physics_prover.py",
                        "compose.yml",
                        "docker-compose.yml",
                      ].includes(activeFile)
                        ? [activeFile]
                        : []),
                    ].map((fileName) => {
                      const isSelected =
                        activeFile === fileName ||
                        (fileName === "simulate.py" && activeFile === "run_simulation.py") ||
                        (fileName === "eval.py" && activeFile === "eval_physics.py") ||
                        (fileName === "prover.py" && activeFile === "physics_prover.py") ||
                        (fileName === "compose.yml" && activeFile === "docker-compose.yml");

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
                        !isTypingCode,
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

              <div className="min-w-0 border-b border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cloud size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Pretrained Scientific Models
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Deploy and evaluate foundation models including MatterSim, MACE-MP-0, and ESM-2. Predict atomic energies, forces, and protein sequences with full checkpoint ownership.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Simulation & Physics Solvers
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Generate synthetic training data and atomic trajectories from GPU-accelerated OpenMM and Quantum ESPRESSO solvers. Learn physical dynamics from simulations.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col gap-3.5 items-start">
                    <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={24} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                      Experimental Data & Adaptation
                    </h3>
                    <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                      Fine-tune models using laboratory measurements, assay results, and domain literature. Track errors, benchmark checkpoints, and verify improvements on unseen scientific tasks.
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
                  Supported chat-capable models on Hugging Face run through the
                  compatible recipe. Search the live catalog above. The examples
                  below are just a starting view.
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
                    placeholder="Search any scientific, biomolecular, or physics model on Hugging Face"
                    className="w-full bg-[#1a1a1a] border border-dashed border-[#333] text-[#C8C7BA] text-[13.5px] sm:text-[14px] pl-10 pr-12 py-3 rounded-[4px] outline-none focus:border-[#555] transition-colors font-sans placeholder:text-[#666]"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <span className="text-[9.5px] font-bold text-[#C8C7BA] border border-dashed border-[#333] px-1.5 py-0.5 rounded-sm">
                      HF
                    </span>
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
                        <div
                          key={model.id}
                          className={getBorderClasses(index, models.length)}
                          onClick={() => {
                            const url =
                              model.url ||
                              `https://huggingface.co/${model.id}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <ArrowUpRight
                            size={20}
                            className="text-[#75bf00] absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          />

                          <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center">
                            {getLogo(model.author, model.name)}
                          </div>

                          <div className="flex flex-col gap-1 min-w-0">
                            <h3
                              className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1"
                              title={model.name}
                            >
                              {model.name}
                            </h3>
                            <span
                              className="text-[#C8C7BA] text-[14px] line-clamp-1"
                              title={model.author}
                            >
                              {model.author}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                            <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0">
                              {model.downloads || model.params || ""}
                            </span>
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
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">
                  What Horos tunes
                </h2>
                <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] font-sans leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Every stage of scientific model development, optimized per
                  model, dataset, simulation, and compute budget.
                </p>

                <div className="flex flex-col w-full border-y border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    {/* Row 1 */}
                    <div className="px-6 py-8 sm:px-8 sm:py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <FlaskConical size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                        Scientific data preparation
                      </h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                        Prepare molecular structures, protein sequences,
                        equations, and research text for model-specific
                        training. Track dataset versions, units, labels, and data
                        provenance.
                      </p>
                    </div>

                    <div className="px-6 py-8 sm:px-8 sm:py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                        Model adaptation
                      </h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                        Compare SciReasoner, MegaScience, and BioMistral on target
                        tasks. Tune fine-tuning data, LoRA configurations, and
                        training objectives for each scientific domain.
                      </p>
                    </div>

                    <div className="px-6 py-8 sm:px-8 sm:py-10 border-b border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Workflow size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                        Simulation integration
                      </h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                        Connect compatible models to scientific solvers and
                        simulation workflows. Track input parameters, solver
                        settings, outputs, and failed runs for reproducible
                        experiments.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-6 py-8 sm:px-8 sm:py-10 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <ShieldCheck size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                        Scientific verification
                      </h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                        Compare predictions with reference calculations and
                        experimental measurements. Check units, numerical error,
                        physical constraints, and performance on held-out data.
                      </p>
                    </div>

                    <div className="px-6 py-8 sm:px-8 sm:py-10 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Gauge size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                        Training and inference efficiency
                      </h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                        Tune precision, batching, sequence lengths, memory usage,
                        and GPU placement. Measure the trade-offs between
                        scientific accuracy, throughput, and cost.
                      </p>
                    </div>

                    <div className="px-6 py-8 sm:px-8 sm:py-10 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Activity size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">
                        Experiment-driven improvement
                      </h3>
                      <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed font-sans">
                        Track prediction errors across datasets and conditions.
                        Compare model checkpoints, identify weak cases, and use
                        verified examples to guide the next training run.
                      </p>
                    </div>
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

          {/* Try this pipeline Section */}
          <div className="w-full relative z-10 pb-24">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div className="border-r border-dashed border-[#333]" />
              <div className="flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl md:text-[38px] lg:text-[44px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-3 text-center mt-6 md:mt-8">
                  Try this pipeline
                </h2>
                <p className="text-[#C8C7BA] text-[14px] sm:text-[15px] md:text-[16px] font-sans leading-relaxed text-center max-w-2xl mb-10 md:mb-14 mx-auto">
                  Edit the model, solver, or agent inline. Send to retune the
                  stack in the dashboard.
                </p>

                <div className="relative z-50 flex justify-center items-center mb-24 w-full h-[261px]">
                  <div className="absolute inset-0 pointer-events-none z-[-1]">
                    <svg
                      width="100%"
                      height="261"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line
                        x1="0%"
                        y1="62.5"
                        x2="100%"
                        y2="62.5"
                        stroke="#2D2D2D"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="0%"
                        y1="16.5"
                        x2="100%"
                        y2="16.5"
                        stroke="#2D2D2D"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="0%"
                        y1="247.5"
                        x2="100%"
                        y2="247.5"
                        stroke="#2D2D2D"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="0%"
                        y1="201.5"
                        x2="100%"
                        y2="201.5"
                        stroke="#2D2D2D"
                        strokeDasharray="3 3"
                      />

                      <line
                        x1="0%"
                        y1="253.5"
                        x2="100%"
                        y2="253.5"
                        stroke="#6E6E6E"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="0%"
                        y1="260.5"
                        x2="100%"
                        y2="260.5"
                        stroke="#6E6E6E"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="0%"
                        y1="0.5"
                        x2="100%"
                        y2="0.5"
                        stroke="#6E6E6E"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="0%"
                        y1="7.5"
                        x2="100%"
                        y2="7.5"
                        stroke="#6E6E6E"
                        strokeDasharray="3 3"
                      />

                      <g style={{ transform: "translateX(calc(50% - 411px))" }}>
                        <line
                          x1="0"
                          y1="17.5"
                          x2="0"
                          y2="246.5"
                          stroke="#6E6E6E"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1="-5"
                          y1="15.5"
                          x2="-5"
                          y2="248.5"
                          stroke="#6E6E6E"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1="-11"
                          y1="17.5"
                          x2="-11"
                          y2="246.5"
                          stroke="#6E6E6E"
                          strokeDasharray="3 3"
                        />
                      </g>

                      <g style={{ transform: "translateX(calc(50% + 411px))" }}>
                        <line
                          x1="0"
                          y1="16.5"
                          x2="0"
                          y2="245.5"
                          stroke="#6E6E6E"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1="6"
                          y1="14.5"
                          x2="6"
                          y2="247.5"
                          stroke="#6E6E6E"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1="11"
                          y1="16.5"
                          x2="11"
                          y2="245.5"
                          stroke="#6E6E6E"
                          strokeDasharray="3 3"
                        />
                      </g>
                    </svg>
                  </div>

                  <div className="w-[822px] max-w-full relative z-10">
                    <TokenPromptInput
                      fixedPromptIndex={12}
                      hideHeader={true}
                      showSuggestions={false}
                      cardClassName="!bg-[#202020]"
                    />
                  </div>
                </div>
              </div>
              <div className="border-l border-dashed border-[#333]" />
            </div>
            <SectionDivider
              position="bottom"
              className="absolute bottom-0 left-0 w-full"
            />
          </div>

          {/* FAQ Section */}
          <div className="w-full relative z-10 py-24 flex flex-col items-center px-4">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center">
              Common{" "}
              <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">
                questions
              </span>
            </h2>
            <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] md:text-[15px] font-sans text-center mb-8 md:mb-10">
              Can't find what you're looking for?{" "}
              <a href="#" className="text-[#75bf00] hover:underline">
                Get in touch
              </a>
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
                <div className="hidden md:flex absolute top-[48px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <DeepSeekLogo size={20} />
                </div>
                <div className="hidden md:flex absolute top-[96px] left-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <MetaLogo size={20} />
                </div>
                <div className="hidden md:flex absolute top-[96px] left-[144px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <NvidiaLogo size={20} />
                </div>
                <div className="hidden md:flex absolute top-[144px] left-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <GoogleLogo size={20} />
                </div>
                <div className="hidden md:flex absolute top-[192px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <MistralLogo size={20} />
                </div>

                {/* Floating Brand Cubes - Right Cluster (Inside) */}
                <div className="hidden md:flex absolute bottom-[240px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <SGLangLogo size={20} />
                </div>
                <div className="hidden md:flex absolute bottom-[192px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <DeepSeekLogo size={20} />
                </div>
                <div className="hidden md:flex absolute bottom-[144px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <QwenLogo size={20} />
                </div>
                <div className="hidden md:flex absolute bottom-[144px] right-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <MetaLogo size={20} />
                </div>
                <div className="hidden md:flex absolute bottom-[96px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10">
                  <MistralLogo size={20} />
                </div>
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

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[48px] xl:text-[54px] leading-[1.12] font-medium tracking-tight text-[#F0EFE2] mb-4 sm:mb-6">
                Deploy your first automated
                <br className="hidden md:block" />
                scientific discoverer,{" "}
                <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">
                  measured
                </span>{" "}
                before you
                <br className="hidden md:block" />
                ship
              </h2>

              <p className="text-[#a0a0a0] text-[14px] sm:text-[15px] md:text-[16px] font-sans mb-8 sm:mb-10 max-w-2xl mx-auto">
                Describe the physics simulation or molecular discovery task.
                Horos builds and optimizes the GPU science stack.
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
