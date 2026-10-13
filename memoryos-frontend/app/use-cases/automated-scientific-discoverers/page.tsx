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
} from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "Launch",
    runInfra: {
      title: "Deploy automated scientific discoverers",
      desc: "Launch physics-guided scientific discovery agents with GPU trajectory verification and DFT simulation loops.",
    },
    closed: {
      title: "Basic chat completions",
      desc: "Per-call text API responses without physics verification, energy conservation checks, or molecular trajectory bounds.",
    },
    diy: {
      title: "Build prompt chains & Slurm scripts",
      desc: "Spend months configuring brittle Python parsers, manual Slurm submission scripts, and unvalidated webhooks.",
    },
  },
  {
    num: "0 2",
    label: "Verification",
    runInfra: {
      title: "Verifiable physics & trajectory proofs",
      desc: "Every atomic trajectory and crystal lattice is mathematically verified against ground-truth OpenMM and Quantum ESPRESSO solvers.",
    },
    closed: {
      title: "Unverified text output",
      desc: "High risk of hallucinated chemical structures, unstable energy states, and physically impossible atomic geometry.",
    },
    diy: {
      title: "Manual human simulation proofreading",
      desc: "Postdocs and computational chemists must manually double-check every single force field and MD simulation log.",
    },
  },
  {
    num: "0 3",
    label: "Quantum Audit",
    runInfra: {
      title: "Ab-initio DFT & molecular compliance audit",
      desc: "Automated risk and stability analysis for bandgaps, binding affinity, reaction pathways, and energy conservation.",
    },
    closed: {
      title: "Black-box summaries",
      desc: "Opaque molecular summaries that miss subtle thermodynamic instability, structural overlap, and phase boundary edge cases.",
    },
    diy: {
      title: "Ad-hoc regex matching",
      desc: "Fragile custom regex scripts unable to parse complex VASP, LAMMPS, or GROMACS output logs.",
    },
  },
  {
    num: "0 4",
    label: "Model Control",
    runInfra: {
      title: "Fine-tuned scientific reasoning models",
      desc: "Deploy domain-adapted ESMFold-3, AlphaFold-Physics, OpenFold-2, and Materials-Graph-Net models.",
    },
    closed: {
      title: "Locked to vendor API defaults",
      desc: "Standard generalist LLMs without specialized molecular dynamics, quantum mechanics, or crystal graph fine-tuning.",
    },
    diy: {
      title: "Prompt-only tuning",
      desc: "Inability to adapt model weights to your lab's proprietary force fields, material synthesis playbooks, or wet-lab instruments.",
    },
  },
  {
    num: "0 5",
    label: "Operations",
    runInfra: {
      title: "Autonomous research loops",
      desc: "Automate hypothesis generation, multi-GPU physics simulations, property scoring, and Opentrons lab synthesis reporting.",
    },
    closed: {
      title: "High researcher toil",
      desc: "Scientific research teams spend hours manually re-running failed HPC jobs and formatting simulation datasets.",
    },
    diy: {
      title: "High operational overhead",
      desc: "Your team owns Slurm cluster maintenance, CUDA driver compatibility, force field updates, and GPU scaling.",
    },
  },
  {
    num: "0 6",
    label: "Security",
    runInfra: {
      title: "SOC 2 Type II & On-Prem HPC Guards",
      desc: "Zero privilege data retention with air-gapped Slurm cluster and private cloud execution options.",
    },
    closed: {
      title: "Third-party data storage",
      desc: "Proprietary drug target sequences and patented catalyst formulations uploaded to third-party SaaS servers.",
    },
    diy: {
      title: "Self-managed security",
      desc: "Your team owns IP data retention, research data guards, and HPC compute node compliance.",
    },
  },
];

const README_CODE = `# Automated Scientific Discoverers Engine

Autonomous physics-guided scientific discovery pipeline powered by Horos.

## Architecture Overview
- Physics Solvers: OpenMM 8.1 CUDA & Quantum ESPRESSO v7.2 DFT
- Scientific Models: ESMFold-3-Physics, AlphaFold-3, DeepSeek-R1-Science
- AST Topology: Ab-initio 3D crystal lattice & molecular bond graphs
- Verification: Zero-unphysical-drift CUDA trajectory energy conservation proofs
- Wet-Lab Automation: Opentrons OT-3 liquid handling protocol triggers

## Batch Execution
$ horos-science-agent simulate \\
    --input-dir ./candidates/catalysts_2026 \\
    --solver Quantum-ESPRESSO-v7.2 \\
    --physics-proofs enabled`;

const DFT_AST_CODE = `# Ab-initio Density Functional Theory (DFT) Crystal Lattice AST Builder
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class AtomicNode:
    symbol: str
    position: Tuple[float, float, float]
    charge: float
    hybridization: str

class DFTGraphEngine:
    """Parses PDB/CIF structures into 3D crystal lattice AST topology graphs."""
    
    @staticmethod
    def build_lattice(pdb_sequence: str) -> Dict[str, any]:
        """Generate atomic bond vectors and unit cell lattice parameters."""
        nodes = [
            AtomicNode("Fe", (0.0, 0.0, 0.0), 2.0, "d2sp3"),
            AtomicNode("N", (1.2, 0.5, 0.0), -1.0, "sp2"),
            AtomicNode("C", (2.4, 1.1, 0.2), 0.0, "sp2"),
        ]
        return {
            "lattice_vectors": np.eye(3).tolist(),
            "atomic_nodes": nodes,
            "space_group": "P6/mmm",
            "bandgap_estimate_ev": 1.42
        }`;

const PHYSICS_PROVER_CODE = `# Zero-Unphysical-Drift CUDA Trajectory Verifier
import torch
from typing import List, Dict

class PhysicsVerifier:
    """Mathematical force field and energy conservation verifier."""
    
    def __init__(self, policy: str = "strict-energy-conservation"):
        self.policy = policy
        self.max_drift_kcal_mol = 0.001

    def verify_trajectory(self, trajectories: List[Dict]) -> Dict[str, any]:
        """Verify kinetic and potential energy conservation across MD frames."""
        total_drift = sum(frame.get("drift", 0.0) for frame in trajectories)
        
        is_valid = total_drift <= self.max_drift_kcal_mol
        return {
            "is_valid": is_valid,
            "hash": "0x8f2a99c1d0e4f3a7",
            "drift_kcal_mol": total_drift,
            "policy_enforced": self.policy
        }`;

const FORCEFIELD_CODE = `# OpenMM & AMBER Force Field Compliance Auditor
from typing import Dict

class ForceFieldAuditor:
    """Audits steric hindrance, van der Waals overlaps, and electrostatic bounds."""
    
    def __init__(self, forcefield: str = "amber14-all.xml"):
        self.forcefield = forcefield

    def audit_stability(self, structure_data: Dict) -> Dict[str, float]:
        """Calculate thermodynamic stability and binding affinity energy delta."""
        return {
            "binding_energy_kcal_mol": -14.28,
            "steric_clash_score": 0.0,
            "van_der_waals_energy": -42.1,
            "thermodynamic_stability_pct": 99.7
        }`;

const RUN_SIMULATION_CODE = `# Automated Scientific Discoverer with Physics Trajectory Verification
import torch
from horos_science import ScientificDiscovererAgent, PhysicsVerifier, DFTGraphEngine, ForceFieldAuditor

# Initialize scientific reasoning engine with OpenMM physics verifier
agent = ScientificDiscovererAgent.from_pretrained("meta/esmfold-3-physics-verifier")
physics_verifier = PhysicsVerifier(policy="strict-energy-conservation")
auditor = ForceFieldAuditor(forcefield="amber14-all.xml")

def run_molecular_discovery(pdb_sequence: str, target_bandgap_ev: float = 1.4):
    """Run ab-initio DFT simulation and verify energy conservation bounds."""
    
    # Parse protein sequence into 3D crystal lattice AST graph
    crystal_graph = DFTGraphEngine.build_lattice(pdb_sequence)
    
    # Audit thermodynamic force field stability
    stability = auditor.audit_stability(crystal_graph)
    
    # Run molecular dynamics simulation on 8x H100 GPU cluster
    sim_results = agent.simulate_dynamics(crystal_graph, bandgap=target_bandgap_ev)
    
    # Mathematically verify quantum energy state and force vectors
    physics_proof = physics_verifier.verify_trajectory(sim_results.trajectories)
    
    if physics_proof["is_valid"]:
        return {
            "simulation_status": "SUCCESS",
            "binding_energy_kcal": stability["binding_energy_kcal_mol"],
            "trajectory_hash": physics_proof["hash"],
            "unphysical_drift_rate": 0.0,
            "wetlab_trigger": "opentrons_ot3_synthesis.py"
        }
        
    return None`;

const RUN_DFT_AUDIT_CODE = `#!/usr/bin/env bash
# Automated scientific discoverer batch physics simulation runner
set -euo pipefail

DATASET_DIR="./candidates/catalysts_2026"
SOLVER="Quantum-ESPRESSO-v7.2"

echo "[Horos Science] Initializing 8x H100 GPU Cluster CUDA 12.4 solver..."
echo "[Horos Science] Running OpenMM molecular dynamics simulation..."

# Execute zero-unphysical-drift MD simulation with CUDA acceleration
horos-science-agent simulate \\
  --input-dir $DATASET_DIR \\
  --solver $SOLVER \\
  --physics-proofs enabled \\
  --energy-drift strict \\
  --output-json ./simulation_audit_report.json`;

const SIMULATION_PIPELINE_CODE = `{
  "name": "automated-scientific-discoverers",
  "version": "2.4.0",
  "agent": "physics-discoverer-v1",
  "model": "esmfold-3-physics-verifier",
  "solver": "OpenMM-CUDA-8.1",
  "dft_engine": "Quantum-ESPRESSO-v7.2",
  "physics_proofs": true,
  "energy_drift_threshold": 0.0,
  "property_audits": [
    "bandgap",
    "binding_affinity",
    "thermodynamic_stability",
    "opentrons_synthesis"
  ]
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.0-devel-ubuntu22.04 AS base

RUN apt-get update && apt-get install -y python3.11 openmm quantum-espresso

WORKDIR /science
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY agent/ /science/agent/
COPY README.md run_simulation.py run_dft_audit.sh simulation_pipeline.json .

EXPOSE 8080
ENTRYPOINT ["/science/run_dft_audit.sh"]`;

const DOCKER_COMPOSE_CODE = `version: "3.8"

services:
  science-discoverer:
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
      - SOLVER_POLICY=strict-energy-conservation
      - CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7`;

const REQUIREMENTS_CODE = `torch>=2.4.0
openmm>=8.1.1
numpy>=1.26.0
biopython>=1.83
horos-science-agent>=2.4.0
opentrons>=7.0.0
scipy>=1.13.0`;

const EVAL_PHYSICS_CODE = `# Evaluation harness: measuring trajectory precision and physics conservation
from horos_eval import TrajectoryEvaluator, PhysicsSafetyGate

def evaluate_discoverer_accuracy(pdb_structure: str, sim_report: dict) -> dict:
    """Verify scientific discoverer accuracy and energy conservation guarantee."""
    
    evaluator = TrajectoryEvaluator()
    safety = PhysicsSafetyGate(policy="zero-unphysical-drift")
    
    # Mathematically verify CUDA trajectory energy proofs
    proof_passed = safety.verify_proof(sim_report["trajectory_hash"])
    
    # Calculate structural RMSD precision and thermodynamic accuracy
    accuracy_score = evaluator.score_trajectories(sim_report)
    
    return {
        "physics_proof_verified": proof_passed,
        "rmsd_precision_angstrom": accuracy_score.rmsd,
        "unphysical_trajectories": 0
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
        className={`min-h-[22px] leading-[22px] flex items-center transition-colors rounded-sm px-1 ${
          isCurrentActiveLine && !isComplete ? "bg-[#75bf00]/10" : ""
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
    id: "meta/ESMFold-3-Physics-Verifier",
    name: "ESMFold-3 Physics",
    author: "Meta",
    description:
      "Frontier protein structure prediction model with GPU trajectory verification.",
    role: "Physics Agent",
  },
  {
    id: "nvidia/BioNeMo-OpenMM-8B",
    name: "BioNeMo OpenMM 8B",
    author: "NVIDIA",
    description:
      "Accelerated molecular dynamics solver compiled for zero-latency CUDA audits.",
    role: "MD Proofs",
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Science",
    name: "DeepSeek R1 Science",
    author: "DeepSeek",
    description:
      "Deep reasoning engine for complex DFT, catalysis, and reaction dynamics.",
    role: "Science Reasoning",
  },
  {
    id: "google/AlphaFold-3-Physics-Instruct",
    name: "AlphaFold 3 Physics",
    author: "Google",
    description:
      "Biomolecular structure discovery agent fine-tuned on ligand binding & thermodynamics.",
    role: "Biomolecule Agent",
  },
  {
    id: "materials-project/GraphNet-Materials-32B",
    name: "GraphNet Materials 32B",
    author: "Materials Project",
    description:
      "Inorganic crystal structure predictor and quantum mechanical bandgap verifier.",
    role: "Crystal Agent",
  },
  {
    id: "openfold/OpenFold-2-CUDA",
    name: "OpenFold-2 CUDA",
    author: "OpenFold",
    description:
      "Open-weights RNA and protein structural modeling agent with force field safety.",
    role: "Open Structural AI",
  },
  {
    id: "mistralai/Mixtral-8x7B-Science",
    name: "Mixtral Science MoE",
    author: "Mistral",
    description:
      "High-throughput mixture-of-experts model for automated reaction synthesis.",
    role: "Synthesis LLM",
  },
  {
    id: "qwen/Qwen2.5-14B-Science",
    name: "Qwen2.5 Science",
    author: "Qwen",
    description:
      "Multilingual chemical property auditor and zero-drift trajectory verifier.",
    role: "Property Agent",
  },
  {
    id: "microsoft/Phi-3.5-Science-Instruct",
    name: "Phi-3.5 Science",
    author: "Microsoft",
    description:
      "Compact physics solver and ab-initio density functional theory verifier.",
    role: "DFT Solver",
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
  if (a.includes("mistral") || m.includes("mixtral"))
    return <MistralLogo size={20} />;
  if (a.includes("alibaba") || a.includes("qwen") || m.includes("qwen"))
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
      "How do Automated Scientific Discoverers guarantee zero unphysical drift?",
    answer:
      "Horos uses GPU-accelerated OpenMM and Quantum ESPRESSO physics solvers combined with mathematical force field verification to ensure every atomic trajectory and energy state adheres to thermodynamics.",
  },
  {
    question:
      "Can the agent simulate complex protein folding, catalyst design, and crystal lattices?",
    answer:
      "Yes. Native support for PDB files, CIF crystal graphs, DFT bandgap calculations, and Opentrons wet-lab automation protocols allows instant end-to-end scientific discovery.",
  },
  {
    question:
      "Can I export fine-tuned scientific models to run on my HPC cluster or supercomputer?",
    answer:
      "Yes! All fine-tuned scientific model weights and CUDA containers can be exported as TensorRT binaries and deployed on Slurm, Kubernetes, or air-gapped HPC supercomputers.",
  },
];

export default function AutomatedScientificDiscoverersPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>(
    "run_simulation.py" as any,
  );
  const [activeMainTab, setActiveMainTab] = useState<
    "pipeline" | "code" | "optimization" | "deploy"
  >("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "README.md": README_CODE,
    "dft_lattice_ast.py": DFT_AST_CODE,
    "physics_prover.py": PHYSICS_PROVER_CODE,
    "forcefield_auditor.py": FORCEFIELD_CODE,
    "run_simulation.py": RUN_SIMULATION_CODE,
    "eval_physics.py": EVAL_PHYSICS_CODE,
    "run_dft_audit.sh": RUN_DFT_AUDIT_CODE,
    "simulation_pipeline.json": SIMULATION_PIPELINE_CODE,
    Dockerfile: DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE,
  };

  const AGENT_MSG_1 =
    "On it. Running ab-initio DFT simulation over candidate structures. Initializing ESMFold-3-Physics & DeepSeek-R1-Science with OpenMM force field bounds on 8x H100 GPUs.";
  const AGENT_MSG_2 =
    "Simulation complete. Identified high binding energy & thermodynamic stability in Candidate #14. Trajectory proof #0x8f2a... verified against Quantum ESPRESSO solvers. Report ready for wet-lab synthesis.";

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
                    Automated Scientific &<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      Discoverers
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Agents that run massive physics simulations.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Deploy this agent{" "}
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Read the stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid
                    label1="Simulations"
                    label2="Trajectories"
                    label3="Force Fields"
                    label4="Wet-Lab"
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
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4">
                  Own your scientific simulation pipeline
                </h2>
                <p className="text-[#C8C7BA] text-[20px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  The physics engine solvers, the scientific reasoning models,
                  the molecular dynamics playbooks. Complete sovereignty over
                  scientific discovery.
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
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">
                      0 1
                    </div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">
                      The scientific
                      <br />
                      discoverers.
                    </h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the scientific reasoning models (ESMFold-3,
                      AlphaFold-Physics), molecular dynamics solvers, and DFT
                      AST graphs. No vendor lock-in on your research AI.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">
                      0 2
                    </div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">
                      The physics
                      <br />
                      solvers.
                    </h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the GPU CUDA physics verifiers (OpenMM, LAMMPS,
                      Quantum ESPRESSO), trajectory analyzers, and energy logs.
                      Zero unphysical energy drift guaranteed.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">
                      0 3
                    </div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">
                      The fine-tuned
                      <br />
                      weights.
                    </h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the fine-tuned scientific model weights
                      (ESMFold-Physics, Materials-Graph-Net) and compiled
                      Docker/Slurm containers. Export and run anywhere securely.
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
              Three ways to build automated scientific discoverers
            </h2>
            <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed text-center max-w-2xl">
              Workflow comparison for scientific discovery agents across Horos,
              closed LLM APIs, and DIY Slurm scripts.
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
                      What Matters
                    </span>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333] relative">
                    <div className="absolute top-2.5 right-3 flex items-center">
                      <span className="text-[8px] font-bold tracking-[0.15em] text-[#75bf00] uppercase">
                        Recommended
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm shrink-0">
                        <HorosLogo size={16} />
                      </div>
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">
                        Horos
                      </span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">
                      Verified simulation telemetry & 0 unphysical drift.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">
                        Closed LLM APIs
                      </span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">
                      Opaque text generation without physics checks.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">
                        DIY Slurm Scripts
                      </span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">
                      Brittle Slurm scripts & manual DFT runs.
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
                        <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#75bf00] mb-1 leading-snug">
                          {row.runInfra.title}
                        </h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed">
                          {row.runInfra.desc}
                        </p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4 md:border-r border-dashed border-[#333]">
                        <h4 className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2] mb-2">
                          {row.closed.title}
                        </h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed">
                          {row.closed.desc}
                        </p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-3.5 lg:px-5 lg:py-4">
                        <h4 className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2] mb-2">
                          {row.diy.title}
                        </h4>
                        <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug leading-relaxed">
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
                <h2 className="text-5xl lg:text-[52px] font-medium tracking-tight mb-6">
                  Scientific discoverers you own.{" "}
                  <span className="text-[#75bf00]">
                    Simulate physics anywhere.
                  </span>
                </h2>
                <p className="text-[#999999] text-[18px] max-w-2xl mx-auto leading-relaxed">
                  The full recipe ships with you. OpenMM CUDA solvers, DFT AST
                  graphs, ESMFold models, and Opentrons wet-lab protocols. Run
                  it anywhere.
                </p>
              </div>
            </div>
            <div />
          </div>

          <SectionDivider
            position="top"
            className="absolute top-0 left-0 right-0 z-20"
          />

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">
            <div
              className="w-full relative mx-auto max-w-[1351px]"
              style={{ aspectRatio: "1351 / 892" }}
            >
              {/* Panes Backgrounds */}
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: "41fr 443fr 226fr 602fr 39fr",
                  gridTemplateRows: "53.5fr 785fr 53.5fr",
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
                  gridTemplateColumns: "41fr 443fr 226fr 602fr 39fr",
                  gridTemplateRows: "53.5fr 785fr 53.5fr",
                }}
              >
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
                  <div
                    className="flex items-center gap-2 mt-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={replayAnimation}
                    title="Replay Animation"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#75bf00] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#75bf00] tracking-widest uppercase">
                      Live
                    </span>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-6 flex flex-col justify-between overflow-hidden pointer-events-auto">
                  <div className="flex flex-col gap-6 overflow-y-auto chat-scroll pr-2 pb-4">
                    <div className="bg-[#1a1a1a] border border-[#252525] p-5 rounded-[4px]">
                      <p className="text-[#C8C7BA] text-[15px] font-sans leading-[28px]">
                        Run ab-initio DFT simulation over candidate structures.
                        Hybrid physics solver with{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#F0EFE2] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <MetaLogo size={13} /> ESMFold-3-Physics
                        </span>{" "}
                        plus OpenMM force fields,{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#F0EFE2] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <DeepSeekLogo size={13} /> DeepSeek-R1-Science
                        </span>{" "}
                        grounded with force field bounds. Score energy stability
                        on{" "}
                        <span className="inline-flex items-center gap-1.5 border border-[#333] bg-[#202020] px-2 py-0.5 rounded text-[#75bf00] font-mono text-[13px] align-baseline whitespace-nowrap">
                          <NvidiaLogo size={13} /> 8x H100 GPU
                        </span>
                        .
                      </p>
                    </div>

                    {/* Step 1 */}
                    <div
                      className={`flex gap-3 mt-2 transition-all duration-500 transform ${visibleStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                    >
                      <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                        {visibleStep === 1 &&
                        typedMsg1.length < AGENT_MSG_1.length ? (
                          <Loader2
                            size={14}
                            className="text-[#75bf00] animate-spin"
                          />
                        ) : (
                          <Sparkles size={14} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">
                          Agent
                        </span>
                        <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                          {typedMsg1}
                          {visibleStep === 1 &&
                            typedMsg1.length < AGENT_MSG_1.length && (
                              <span className="inline-block w-1.5 h-3.5 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                            )}
                        </p>
                      </div>
                    </div>

                    {/* Logs list */}
                    <div className="flex flex-col gap-4 mt-2">
                      <div
                        className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 2 ? (
                            <Loader2
                              size={14}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={14}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">
                              Ingesting molecular AST & crystal structure tree
                            </span>
                            <span className="text-[#C8C7BA] text-[12px]">
                              0.9s
                            </span>
                          </div>
                          <span className="text-[#666] text-[12px]">
                            Parsed 148 atomic coordinates & bond angles
                            [ESMFold-3-Physics]
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 3 ? (
                            <Loader2
                              size={14}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={14}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">
                              Checking DFT quantum simulation accuracy
                            </span>
                            <span className="text-[#C8C7BA] text-[12px]">
                              2.1s
                            </span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">
                            100% force field match against OpenMM & Quantum
                            ESPRESSO [8x NVIDIA H100 GPU]
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 4 ? (
                            <Loader2
                              size={14}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={14}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">
                              Computing GPU mathematical trajectory proof
                            </span>
                            <span className="text-[#C8C7BA] text-[12px]">
                              4.5s
                            </span>
                          </div>
                          <span className="text-[#666] text-[12px]">
                            Generated physics proof hash #0x8f2a99c1d0
                            [DeepSeek-R1-Science | CUDA 12.4]
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 5 ? (
                            <Loader2
                              size={14}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={14}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">
                              Flagging thermodynamic stability anomaly
                            </span>
                            <span className="text-[#C8C7BA] text-[12px]">
                              9.8s
                            </span>
                          </div>
                          <span className="text-[#666] text-[12px]">
                            High binding affinity candidate detected in
                            Structure 14.2 (99.7% confidence)
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                      >
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 6 ? (
                            <Loader2
                              size={14}
                              className="text-[#75bf00] animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={14}
                              className="text-[#75bf00]"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">
                              Generating zero-unphysical-drift simulation report
                            </span>
                            <span className="text-[#C8C7BA] text-[12px]">
                              14.2s
                            </span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">
                            Simulation verified. Report ready for wet-lab
                            synthesis [Model: ESMFold-3-Physics &
                            DeepSeek-R1-Science]
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 7 */}
                    <div
                      className={`flex gap-3 mt-2 transition-all duration-500 transform ${visibleStep >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                    >
                      <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                        {visibleStep === 7 &&
                        typedMsg2.length < AGENT_MSG_2.length ? (
                          <Loader2
                            size={14}
                            className="text-[#75bf00] animate-spin"
                          />
                        ) : (
                          <Sparkles size={14} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">
                          Agent
                        </span>
                        <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                          {typedMsg2}
                          {visibleStep === 7 &&
                            typedMsg2.length < AGENT_MSG_2.length && (
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
                        placeholder="Teach the agent to run DFT simulations against custom force fields..."
                        className="bg-transparent text-[#F0EFE2] text-[13px] border-none outline-none w-full px-2 py-2"
                        readOnly
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="flex gap-1.5">
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">
                            @Capabilities
                          </span>
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">
                            @ForceField
                          </span>
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
                    <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase">
                      PHYSICS SOLVERS
                    </span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                      11
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-[13px] font-mono">
                    <button
                      onClick={() => selectFileManually("README.md")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "README.md" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#aaa] hover:text-[#C8C7BA]"}`}
                    >
                      README.md
                    </button>
                    <button
                      onClick={() => selectFileManually("dft_lattice_ast.py")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "dft_lattice_ast.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      dft_lattice_ast.py
                    </button>
                    <button
                      onClick={() => selectFileManually("physics_prover.py")}
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "physics_prover.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      physics_prover.py
                    </button>
                    <button
                      onClick={() =>
                        selectFileManually("forcefield_auditor.py")
                      }
                      className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "forcefield_auditor.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                    >
                      forcefield_auditor.py
                    </button>

                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[#aaa] font-semibold">
                        <ChevronDown size={14} className="text-[#777]" />{" "}
                        scientific-agent-factory/
                      </div>
                      <div className="pl-4 flex flex-col gap-1.5 border-l border-[#252525] ml-3.5 mt-1">
                        <button
                          onClick={() =>
                            selectFileManually("run_simulation.py")
                          }
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "run_simulation.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_simulation.py
                        </button>
                        <button
                          onClick={() => selectFileManually("eval_physics.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "eval_physics.py" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          eval_physics.py
                        </button>
                        <button
                          onClick={() => selectFileManually("run_dft_audit.sh")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "run_dft_audit.sh" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_dft_audit.sh
                        </button>
                        <button
                          onClick={() =>
                            selectFileManually("simulation_pipeline.json")
                          }
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "simulation_pipeline.json" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          simulation_pipeline.json
                        </button>
                        <button
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold bg-[#75bf00]/10" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          Dockerfile
                        </button>
                        <button
                          onClick={() =>
                            selectFileManually("docker-compose.yml")
                          }
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
                    {[
                      "README.md",
                      "run_simulation.py",
                      "eval_physics.py",
                      "run_dft_audit.sh",
                      "simulation_pipeline.json",
                      "dft_lattice_ast.py",
                      "physics_prover.py",
                      "forcefield_auditor.py",
                      "Dockerfile",
                      "docker-compose.yml",
                      "requirements.txt",
                    ].map((fileName) => (
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
                      {Array.from({
                        length: typedCodeText.split("\n").length,
                      }).map((_, i) => (
                        <div key={i} className="min-h-[22px] leading-[22px]">
                          {i + 1}
                        </div>
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
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">
                      The OpenMM CUDA Solvers
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      OpenMM CUDA solvers and DFT AST graphs cross-referencing
                      Materials Project, Protein Data Bank (PDB), and PubChem
                      databases.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">
                      The ESMFold & Science Weights
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Self-host ESMFold models and AlphaFold-Physics in your own
                      HPC cloud. Full IP privacy and model weight ownership.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-8 py-16 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">
                      The Opentrons Wet-Lab Protocols
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Generate verifiable CUDA trajectory proofs and Opentrons
                      wet-lab automation protocols guaranteeing zero unphysical
                      drift.
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
            <SectionDivider
              position="top"
              className="absolute top-0 left-0 w-full"
            />
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-xl mx-auto leading-tight">
                  Any scientific reasoning or physics verifier model works
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                  Use any open-weights scientific model as your simulation
                  engine, and fine-tune any compact solver target model. The
                  examples below are just a starting view.
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
                <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-xl mx-auto leading-tight">
                  What Horos tunes
                </h2>
                <p className="text-[#A0A098] text-[15px] sm:text-[16px] font-sans leading-relaxed text-center max-w-lg mx-auto mb-12">
                  Every stage of the pipeline, retuned per model and simulation
                  workflow.
                </p>

                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    {/* Row 1 */}
                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">
                        Crystal Lattice AST Indexing
                      </h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Tune molecular AST graphs for instant retrieval of
                        relevant PDB structures, bond topologies, and precedent
                        experiments.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">
                        Physics Trajectory Proofs
                      </h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Generate verifiable energy conservation proofs for every
                        molecular simulation to guarantee zero unphysical drift.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">
                        Property Risk Analysis
                      </h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Profile stability rules to highlight bandgap anomalies,
                        steric clash, and binding affinity gaps.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">
                        Force Field Verification
                      </h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Built-in verification harness cross-referencing atomic
                        force vectors against authoritative OpenMM & DFT
                        solvers.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">
                        Zero-Unphysical-Drift Audit
                      </h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Quantize scientific LLM weights (FP8/INT8) and apply
                        strict force constraints to eliminate hallucinations.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Workflow size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">
                        Domain Fine-Tuning
                      </h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Fine-tune ESMFold-3 and AlphaFold-Physics on your lab's
                        proprietary molecular data and synthesis playbooks.
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
            <SectionDivider
              position="top"
              className="absolute top-0 left-0 w-full"
            />
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div className="border-r border-dashed border-[#333]" />
              <div className="flex flex-col items-center">
                <h2 className="text-[56px] md:text-[64px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
                  Try this pipeline
                </h2>
                <p className="text-[#c7c3b7] text-[22px] font-sans leading-relaxed text-center max-w-2xl mb-16 mx-auto">
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
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-[#f2efe8] mb-4 text-center">
              Common{" "}
              <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">
                questions
              </span>
            </h2>
            <p className="text-[#c7c3b7] text-lg font-sans text-center mb-12">
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
                  className={`px-4 py-2.5 text-sm md:text-base font-medium transition-colors ${
                    activeFaq === idx
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
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="hidden md:block absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
              <div className="hidden md:block absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
               
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 z-0 bg-[position:14%_top]" />

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] absolute inset-0 pointer-events-none z-0">
              <div />
              <div className="relative">
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
              <div />
            </div>

            <div className="relative z-20 flex flex-col items-center text-center max-w-4xl px-4 mt-8 pointer-events-auto">
              <div className="mb-12">
                <HorosLogo size={40} />
              </div>

              <h2 className="text-[48px] md:text-[64px] leading-[1.1] font-medium tracking-tight text-[#F0EFE2] mb-8">
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

              <p className="text-[#a0a0a0] text-[18px] md:text-[20px] font-sans mb-12">
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
        \n <GlobalFooter />
      </main>
    </div>
  );
}
