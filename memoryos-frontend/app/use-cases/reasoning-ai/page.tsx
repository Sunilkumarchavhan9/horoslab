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
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "System",
    runInfra: {
      title: "Single reasoning model",
      desc: "Single reasoning model with optimized inference."
    },
    closed: {
      title: "Model with search & verifiers",
      desc: "Model with candidate generation, search, and verifiers."
    },
    diy: {
      title: "Adapted model pipeline",
      desc: "Adapted model with a versioned training and evaluation pipeline."
    }
  },
  {
    num: "0 2",
    label: "Models",
    runInfra: {
      title: "Open reasoning models",
      desc: "DeepSeek-R1, Qwen reasoning models."
    },
    closed: {
      title: "Verifier-paired models",
      desc: "Reasoning models paired with task-specific verifiers."
    },
    diy: {
      title: "Custom checkpoints",
      desc: "Open-weight base models and fine-tuned checkpoints."
    }
  },
  {
    num: "0 3",
    label: "Context",
    runInfra: {
      title: "Task prompt & evidence",
      desc: "Task prompt, instructions, relevant evidence."
    },
    closed: {
      title: "Problem & search state",
      desc: "Problem state, candidate solutions, intermediate results."
    },
    diy: {
      title: "Curated dataset",
      desc: "Curated examples, failure cases, verified solutions."
    }
  },
  {
    num: "0 4",
    label: "Capabilities",
    runInfra: {
      title: "Structured reasoning",
      desc: "Mathematical reasoning, code generation, structured problem-solving."
    },
    closed: {
      title: "Verifier-guided search",
      desc: "Best-of-N selection, verifier-guided search, multi-step problem-solving."
    },
    diy: {
      title: "Domain adaptation",
      desc: "Domain adaptation, distilled reasoning behavior, task-specific improvement."
    }
  },
  {
    num: "0 5",
    label: "Workload",
    runInfra: {
      title: "Single-pass requests",
      desc: "Single-pass requests, latency-sensitive tasks, concurrent inference."
    },
    closed: {
      title: "Compute-intensive tasks",
      desc: "Difficult problems where extra computation can improve success."
    },
    diy: {
      title: "Repeated domain tasks",
      desc: "Repeated domain-specific tasks where adaptation can justify training cost."
    }
  },
  {
    num: "0 6",
    label: "Optimization",
    runInfra: {
      title: "Token budgets & cache",
      desc: "Quantization, batching, KV cache, reasoning-token budgets."
    },
    closed: {
      title: "Search depth & cost",
      desc: "Search depth, candidate count, verifier cost, parallel execution."
    },
    diy: {
      title: "Fine-tuning & LoRA",
      desc: "Fine-tuning, LoRA, distillation, reward-guided training."
    }
  },
  {
    num: "0 7",
    label: "Verification",
    runInfra: {
      title: "Held-out accuracy",
      desc: "Held-out task accuracy, answer correctness, latency and cost."
    },
    closed: {
      title: "Verifier precision & recall",
      desc: "Verifier precision and recall, pass rate, false acceptance, search success."
    },
    diy: {
      title: "Benchmark evaluations",
      desc: "Before-and-after evaluations, regression tests, held-out benchmarks."
    }
  },
  {
    num: "0 8",
    label: "Experience",
    runInfra: {
      title: "Inference telemetry",
      desc: "Record prompts, model versions, outputs, latency, and failures."
    },
    closed: {
      title: "Trace outcomes",
      desc: "Preserve candidates, verifier decisions, search traces, and outcomes."
    },
    diy: {
      title: "Training run lineage",
      desc: "Track datasets, training runs, checkpoints, evaluation results, and regressions."
    }
  },
  {
    num: "0 9",
    label: "Teaching",
    runInfra: {
      title: "Configuration routing",
      desc: "Route difficult cases to better configurations or models."
    },
    closed: {
      title: "Failure pattern synthesis",
      desc: "Convert verified solutions and failure patterns into training examples."
    },
    diy: {
      title: "Curated evidence training",
      desc: "Train and evaluate new checkpoints using curated evidence."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    runInfra: {
      title: "Access & budget gates",
      desc: "Control model access, token budgets, compute spend, and deployment permissions."
    },
    closed: {
      title: "Search & verifier bounds",
      desc: "Govern search budgets, tool execution, verifier permissions, and approval gates."
    },
    diy: {
      title: "Lifecycle governance",
      desc: "Govern dataset access, training budgets, model licenses, promotion, and rollback."
    }
  }
];


const SEARCH_PIPELINE_CODE = `# Verifier-guided test-time search with step-level process reward scoring.
import torch
from vllm import LLM, SamplingParams
from horos.reasoning import VerifierEngine, StepPRMScorer

# Load reasoning model with configured test-time compute budget
model = LLM(
    model="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    tensor_parallel_size=1,
    max_model_len=16384,
    gpu_memory_utilization=0.92,
)

prm_scorer = StepPRMScorer(model="Qwen/Qwen2.5-Math-PRM-7B")
verifier = VerifierEngine(timeout_sec=5.0)

def reason_and_verify(problem: str, n_candidates: int = 8) -> dict:
    """Generate candidate reasoning rollouts, score steps, and verify outcomes."""
    params = SamplingParams(
        n=n_candidates,
        temperature=0.7,
        top_p=0.95,
        max_tokens=4096,
    )
    
    # Generate Best-of-N candidate solution paths
    outputs = model.generate([problem], params)
    candidates = [cand.text for cand in outputs[0].outputs]
    
    scored_candidates = []
    for cand in candidates:
        # Score intermediate reasoning steps with PRM
        step_scores = prm_scorer.score_steps(problem, cand)
        
        # Verify final mathematical or executable code answer
        is_valid, answer = verifier.verify_solution(cand)
        
        confidence = sum(step_scores) / max(len(step_scores), 1)
        scored_candidates.append({
            "solution": cand,
            "answer": answer,
            "valid": is_valid,
            "confidence": confidence,
        })
        
    # Select highest-confidence verified solution
    valid_candidates = [c for c in scored_candidates if c["valid"]]
    return max(valid_candidates or scored_candidates, key=lambda x: x["confidence"])`;

const VERIFIER_CODE = `# Multi-modal correctness checking: formal math proofs & python execution.
import subprocess
from sympy import simplify, parse_expr

class VerifierEngine:
    def __init__(self, timeout_sec: float = 5.0):
        self.timeout = timeout_sec

    def verify_math_expression(self, candidate_expr: str, ground_truth: str) -> bool:
        """Symbolic equivalence check between model proof and expected target."""
        try:
            expr_a = parse_expr(candidate_expr.strip())
            expr_b = parse_expr(ground_truth.strip())
            return bool(simplify(expr_a - expr_b) == 0)
        except Exception:
            return False

    def verify_code_execution(self, code_snippet: str, unit_tests: str) -> bool:
        """Execute generated code in a sandboxed runtime against unit tests."""
        test_harness = f"{code_snippet}\\n\\n{unit_tests}\\n"
        try:
            result = subprocess.run(
                ["python3", "-c", test_harness],
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            return result.returncode == 0
        except subprocess.TimeoutExpired:
            return False`;

const EVAL_BENCH_CODE = `# Benchmark evaluation harness for reasoning models (MATH-500, AIME).
import json
from horos.reasoning import reason_and_verify

def run_reasoning_benchmark(dataset_path: str = "evals/math_500.jsonl") -> dict:
    """Measure Pass@1, tokens-per-solution, and verifier agreement rates."""
    total, solved = 0, 0
    total_reasoning_tokens = 0

    with open(dataset_path) as f:
        benchmarks = [json.loads(line) for line in f]

    for item in benchmarks:
        result = reason_and_verify(item["problem"], n_candidates=8)
        total += 1
        if result["answer"] == item["ground_truth"]:
            solved += 1
        total_reasoning_tokens += len(result["solution"].split())

    pass_rate = (solved / total) * 100
    avg_tokens = total_reasoning_tokens / total

    print(f"MATH-500 Pass@1: {pass_rate:.1f}% | Avg Tokens: {avg_tokens:.0f}")
    return {"accuracy": pass_rate, "avg_reasoning_tokens": avg_tokens}`;

const REASONING_CONFIG_CODE = `{
  "pipeline_name": "horos-reasoning-ai",
  "base_model": "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
  "prm_model": "Qwen/Qwen2.5-Math-PRM-7B",
  "search_strategy": "best_of_n",
  "n_candidates": 8,
  "max_thinking_budget_tokens": 4096,
  "temperature": 0.7,
  "verifier": {
    "engine": "sandbox_python_and_sympy",
    "timeout_sec": 5.0,
    "prune_invalid_branches": true
  },
  "runtime": {
    "engine": "vllm",
    "kv_cache_dtype": "fp8",
    "accelerator": "nvidia-h100"
  }
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base

RUN apt-get update && apt-get install -y python3.11 python3-pip git

WORKDIR /workspace
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install vLLM, sglang, and symbolic math verifiers
RUN pip install --no-cache-dir vllm==0.7.2 sympy pytest

COPY horos/ /workspace/horos/
COPY evals/ /workspace/evals/
COPY search_pipeline.py verifier.py eval_bench.py reasoning_config.json ./

EXPOSE 8000
ENTRYPOINT ["python3", "search_pipeline.py"]`;

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
          <span className="w-[3px] h-[14px] bg-[#75bf00] animate-pulse inline-block mr-2 rounded-full shrink-0 align-middle" />
        ) : (
          <span className="w-[3px] h-[14px] bg-transparent inline-block mr-2 shrink-0" />
        )}

        <span className="flex-1 whitespace-pre">{lineContent}</span>

        {/* Flickering green block cursor at the end position */}
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
  {
    id: "deepseek-ai/DeepSeek-R1-0528",
    name: "DeepSeek-R1-0528",
    author: "DeepSeek",
    downloads: "671B MoE",
    tag: "Frontier",
    role: "Frontier",
    description: "Advanced reasoning",
    link: "https://huggingface.co/deepseek-ai/DeepSeek-R1-0528"
  },
  {
    id: "Qwen/Qwen3-235B-A22B",
    name: "Qwen3-235B-A22B",
    author: "Qwen",
    downloads: "235B MoE",
    tag: "Frontier",
    role: "Frontier",
    description: "Complex reasoning",
    link: "https://huggingface.co/Qwen/Qwen3-235B-A22B"
  },
  {
    id: "Qwen/Qwen3-32B",
    name: "Qwen3-32B",
    author: "Qwen",
    downloads: "32B",
    tag: "Reasoning",
    role: "Reasoning",
    description: "Math and logic",
    link: "https://huggingface.co/Qwen/Qwen3-32B"
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    name: "DeepSeek-R1-Distill-Qwen-32B",
    author: "DeepSeek",
    downloads: "32B",
    tag: "Reasoning",
    role: "Reasoning",
    description: "Distilled reasoning",
    link: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"
  },
  {
    id: "Qwen/QwQ-32B",
    name: "QwQ-32B",
    author: "Qwen",
    downloads: "32B",
    tag: "Reasoning",
    role: "Reasoning",
    description: "Analytical problem-solving",
    link: "https://huggingface.co/Qwen/QwQ-32B"
  },
  {
    id: "Skywork/Skywork-OR1-32B",
    name: "Skywork-OR1-32B",
    author: "Skywork",
    downloads: "32B",
    tag: "Specialist",
    role: "Specialist",
    description: "Reasoning research",
    link: "https://huggingface.co/Skywork/Skywork-OR1-32B"
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
    name: "DeepSeek-R1-Distill-Qwen-14B",
    author: "DeepSeek",
    downloads: "14B",
    tag: "Adaptation",
    role: "Adaptation",
    description: "Reasoning fine-tuning",
    link: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"
  },
  {
    id: "Qwen/Qwen3-8B",
    name: "Qwen3-8B",
    author: "Qwen",
    downloads: "8B",
    tag: "Compact",
    role: "Compact",
    description: "Efficient reasoning",
    link: "https://huggingface.co/Qwen/Qwen3-8B"
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    name: "DeepSeek-R1-Distill-Qwen-7B",
    author: "DeepSeek",
    downloads: "7B",
    tag: "Compact",
    role: "Compact",
    description: "Lightweight adaptation",
    link: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
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

  if (a.includes('openai') || m.includes('whisper') || m.includes('gpt')) return <OpenAILogo size={20} />;
  if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen') || m.includes('qwq')) return <QwenLogo size={20} />;
  if (a.includes('nvidia') || m.includes('nvfp4')) return <NvidiaLogo size={20} />;
  if (a.includes('moonshot') || m.includes('kimi')) return <KimiLogo size={20} />;
  if (a.includes('coqui') || a.includes('canopy')) return <span className="text-[18px]">🤗</span>;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('mistral') || a.includes('intfloat') || m.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('skywork') || m.includes('skywork')) return <AuthorAvatar author="SkyworkAI" size={20} />;
  if (a.includes('baai')) return <BAAILogo size={20} />;
  if (a.includes('jina')) return <JinaLogo size={20} />;
  if (a.includes('mixedbread')) return <MixedbreadLogo size={20} />;
  if (a.includes('snowflake')) return <SnowflakeLogo size={20} />;
  if (a.includes('nomic')) return <NomicLogo size={20} />;

  return <AuthorAvatar author={author} size={20} />;
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
    question: "How does test-time compute differ from standard chain-of-thought prompting?",
    answer: "Standard chain-of-thought prompting simply instructs a model to output linear intermediate steps in a single forward pass. Test-time compute (TTC) actively manages the search trajectory: Horos allocates dynamic reasoning token budgets (from 2,048 to 16,384 tokens), branches multiple solution paths via Best-of-N or beam search, scores intermediate logic steps with Process Reward Models (PRMs), and prunes failing derivation paths before final output selection. You trade inference compute for accuracy without model retraining.",
  },
  {
    question: "How do verifiers guarantee that generated reasoning is accurate rather than hallucinated?",
    answer: "Horos pairs open-weight reasoning models with deterministic execution engines and formal verifiers. For mathematical proofs, candidate expressions are validated against symbolic math engines (SymPy) or ground-truth theorems. For code generation, generated implementations execute in isolated sandboxed microVMs against unit test suites. For structured tasks, strict schema and constraint engines enforce validity. Invalid candidates and false-premise derivations are pruned automatically.",
  },
  {
    question: "What is the latency and cost trade-off when using candidate search in production?",
    answer: "Search scaling exhibits logarithmic returns: adding candidates improves pass rates significantly up to an optimal threshold before plateauing. Horos profiles tasks to establish the compute-accuracy boundary—running lightweight single-pass inference for routine queries and triggering deep parallel Best-of-N rollouts for high-ambiguity prompts. Combined with FP8 KV caches and speculative verifier early-exit, teams routinely achieve 85%+ accuracy while cutting median token expenditure by 40–60%.",
  },
  {
    question: "Can I run compact distilled reasoning models (14B or 32B) on a single GPU instead of a 671B cluster?",
    answer: "Yes. For targeted domains, distilled models such as DeepSeek-R1-Distill-Qwen-32B or QwQ-32B paired with domain verifiers regularly match or exceed frontier 671B models at a fraction of the hardware cost. A 32B model runs comfortably on a single H100 or L40S with FP8 KV caching. Furthermore, verified failure traces from production can be fed back into LoRA adaptation or GRPO distillation pipelines to customize smaller models for your exact schemas.",
  },
  {
    question: "Can we deploy the entire reasoning pipeline and verifiers on our private VPC or on-prem?",
    answer: "Yes, completely self-hosted and air-gapped. Horos compiles the complete reasoning architecture—including open-weight models, vLLM/SGLang serving engines, sandbox verification runtimes, and PRM scoring sidecars—into standard container images (Docker / OCI) and Kubernetes manifests. Everything runs inside your own AWS, GCP, or bare-metal environment with zero external telemetry, zero API egress, and complete data sovereignty.",
  }
];



export default function ReasoningAIPage() {
  const [activeTab, setActiveTab] = useState("Horos");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("search_pipeline.py");
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "search_pipeline.py": SEARCH_PIPELINE_CODE,
    "verifier.py": VERIFIER_CODE,
    "eval_bench.py": EVAL_BENCH_CODE,
    "reasoning_config.json": REASONING_CONFIG_CODE,
    "Dockerfile": DOCKERFILE_CODE
  };

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "On it. I'll configure test-time compute with DeepSeek-R1-32B, set up rule-based execution verifiers with PRM step validation, and run Best-of-8 search against MATH-500.";
  const AGENT_MSG_2 = "Reasoning pipeline verified. Pass@1 improved from 74.2% to 89.6% using Best-of-8 with verifier pruning at 280 tokens/sec on 1x H100 ($3.20/hr). Ready to export or deploy endpoint?";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  const [isTypingCode, setIsTypingCode] = useState(true);
  const [typedCodeText, setTypedCodeText] = useState("");

  const selectFileManually = (file: DataFactoryFile) => {
    setIsAutoPlay(false);
    setActiveFile(file);
    setActiveMainTab("code");
  };

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || SEARCH_PIPELINE_CODE;

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

            let tag = "Reasoning";
            let description = m.downloads ? `${dl} - Open reasoning model` : "Open reasoning model";
            
            if (m.pipeline_tag) {
              if (m.pipeline_tag.includes("text-generation") || m.pipeline_tag.includes("text2text-generation")) {
                tag = "Reasoning";
                description = `${dl} - Chain-of-thought & reasoning target`;
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
        
        {/* SVG Filter for recoloring the image to brand colors */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <filter id="brand-duotone">
            {/* Convert to grayscale using luminance */}
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0 0 0 1 0"
            />
            {/* Map grayscale values to #151515, #75BF00, and #E2EFC1 */}
            <feComponentTransfer colorInterpolationFilters="sRGB">
              <feFuncR type="table" tableValues="0.082 0.458 0.886" />
              <feFuncG type="table" tableValues="0.082 0.749 0.937" />
              <feFuncB type="table" tableValues="0.082 0.000 0.757" />
            </feComponentTransfer>
          </filter>
        </svg>

        {/* Background Image touching nav bottom dashed line */}
        <div className="absolute top-0 inset-x-0 z-0 overflow-hidden pointer-events-none flex justify-center opacity-70">
          <div className="relative w-[700px] h-[700px]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent z-10" />
            <img 
              src="https://a-us.storyblok.com/f/1019538/1624x1624/d56f9a4d50/beetle.png/m/1080x0/filters:quality(85):format(webp)"
              alt="Hero Background"
              className="w-full h-full object-contain object-top mix-blend-screen"
              style={{ 
                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                filter: 'url(#brand-duotone)'
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
                    Reasoning AI, engineered<br />
                    to solve{" "}
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      harder problems
                    </span>.
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Optimize open-weight reasoning models for complex tasks through test-time compute, verifier-guided search, reward-driven optimization, and measured evaluation.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Optimize stack <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Explore stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Synthetics"
                    label2="HF Alignment"
                    label3="Data Curation"
                    label4="Model Weights"
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
                  Your reasoning models, search strategy, verification logic, and inference configuration. Horos helps you engineer the complete reasoning pipeline, from generating candidate solutions to measuring which configurations solve problems best.
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
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Your reasoning system.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Choose and compare open-weight models such as DeepSeek-R1 and Qwen3. Tune reasoning budgets, sampling, candidate generation, and search depth for your target tasks.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 2</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Your verification pipeline.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Define correctness checks for mathematical answers, executable code, and structured outputs. Measure pass rates, verifier accuracy, failure cases, and performance on held-out problems.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 3</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Your optimization results.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Compare accuracy, tokens per solution, latency, GPU memory, and cost. Preserve experiment evidence and use verified failures to guide fine-tuning, distillation, and subsequent model versions.
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
            <div className="flex flex-col items-center mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">Three ways to deploy Reasoning AI
              </h2>
              <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
                Most reasoning platforms expose a model endpoint. Horos engineers the model, reasoning strategy, verification, optimization, and learning loop across all three deployment paths.
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
                        <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed reasoning APIs</span>
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
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-16 mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-4xl lg:text-[48px] font-medium tracking-tight mb-5">
                  Reasoning code you own. <span className="text-[#75bf00]">Deploy anywhere.</span>
                </h2>
                <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] md:text-[15px] max-w-2xl mx-auto leading-relaxed text-center">
                  The complete reasoning recipe ships with you: verifiers, search trees, PRM scoring, inference budgets, and distillation pipelines.
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
                    gridTemplateColumns: 'minmax(0, 41fr) minmax(0, 430fr) minmax(0, 240fr) minmax(0, 601fr) minmax(0, 39fr)',
                    gridTemplateRows: '53.5fr 785fr 53.5fr'
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
                    gridTemplateColumns: 'minmax(0, 41fr) minmax(0, 430fr) minmax(0, 240fr) minmax(0, 601fr) minmax(0, 39fr)',
                    gridTemplateRows: '53.5fr 785fr 53.5fr'
                  }}>

                    {/* Tabs */}
                    <div className="col-start-2 col-end-5 row-start-1 row-end-2 flex items-center justify-between px-5 pointer-events-auto">
                      <div className="flex gap-6 sm:gap-8 h-full items-end pb-2">
                        <button
                          onClick={() => setActiveMainTab("pipeline")}
                          className={`flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeMainTab === "pipeline" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <span className="text-[#75bf00]">&gt;_</span> PIPELINE
                        </button>
                        <button
                          onClick={() => setActiveMainTab("code")}
                          className={`flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeMainTab === "code" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <Code2 size={12} /> CODE
                        </button>
                        <button
                          onClick={() => setActiveMainTab("optimization")}
                          className={`flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeMainTab === "optimization" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          <Sliders size={12} /> OPTIMIZATION
                        </button>
                        <button
                          onClick={() => setActiveMainTab("deploy")}
                          className={`flex items-center gap-2 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${activeMainTab === "deploy" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
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
                      <div className="flex flex-col gap-3.5 overflow-y-auto chat-scroll pr-1.5 pb-3">
                        <div className="bg-[#1a1a1a] border border-[#252525] p-3.5 rounded-[4px]">
                          <p className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-sans leading-[21px] sm:leading-[22px]">
                            Engineer a test-time reasoning pipeline. Deploy{" "}
                            <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10.5px] font-mono text-[#D4D3C9] align-middle mx-0.5">
                              <DeepSeekLogo size={10} /> DeepSeek-R1-32B
                            </span>{" "}
                            with Best-of-8 candidate generation, run python execution verifiers and PRM step scoring, then benchmark on{" "}
                            <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#2e2e2e] px-1.5 py-0.5 rounded text-[10.5px] font-mono text-[#75bf00] align-middle mx-0.5">
                              <NvidiaLogo size={10} /> 1x H100
                            </span>{" "}
                            against MATH-500.
                          </p>
                        </div>

                        {/* Step 1: Agent Initial Ack */}
                        <div className={`flex gap-2.5 mt-1 transition-all duration-500 transform ${visibleStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Loading reasoning model</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">0.8s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">DeepSeek-R1-Distill-Qwen-32B loaded with FP8 KV cache</span>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Sampling candidate rollouts</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">12.4s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">Generating N=8 reasoning paths with 4,096 budget tokens</span>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Process reward model scoring</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">2.1s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">Scored 64 intermediate reasoning steps with step PRM</span>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Executing sandbox verifiers</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">1.3s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">Verified math proofs & code; pruned 3 invalid traces</span>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[12px] font-medium truncate">Benchmark evaluation on MATH-500</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">14.2s</span>
                              </div>
                              <span className="text-[#777] text-[10px] sm:text-[10.5px] leading-tight truncate">Pass@1 accuracy reached 89.6% (+15.4% over baseline)</span>
                            </div>
                          </div>
                        </div>

                        {/* Step 7 (LAST STEP): Agent Final Summary */}
                        <div className={`flex gap-2.5 mt-1 transition-all duration-500 transform ${visibleStep >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
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
                      <div className="mt-2 shrink-0 mb-1">
                        <div className="bg-[#151515] border border-[#252525] rounded-[4px] p-2 flex flex-col gap-1.5">
                          <input
                            type="text"
                            placeholder="Teach the verifier to validate multi-step logic..."
                            className="bg-transparent text-[#F0EFE2] text-[11.5px] sm:text-[12.5px] border-none outline-none w-full px-1.5 py-1"
                            readOnly
                          />
                          <div className="flex justify-between items-center px-1">
                            <div className="flex gap-1">
                              <span className="bg-[#222] border border-[#333] text-[9px] sm:text-[9.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@Verifiers</span>
                              <span className="bg-[#222] border border-[#333] text-[9px] sm:text-[9.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@SearchBudget</span>
                              <span className="bg-[#222] border border-[#333] text-[9px] sm:text-[9.5px] text-[#C8C7BA] font-bold px-1.5 py-0.5 rounded-sm">@PRMScore</span>
                            </div>
                            <button className="w-5 h-5 bg-[#75bf00] hover:bg-[#85cf00] transition-colors flex items-center justify-center text-black font-bold rounded-sm">
                              <ArrowUp size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Files Content */}
                    <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-4 sm:p-5 flex flex-col items-start gap-3 overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                      <div className="flex justify-between items-center border-b border-[#252525] pb-2 mb-1 w-full">
                        <span className="text-[9.5px] sm:text-[10px] font-bold tracking-wider text-[#C8C7BA] uppercase">VERIFIER SUITE</span>
                        <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] sm:text-[9.5px] font-bold px-1.5 py-0.2 rounded-sm">3</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] sm:text-[11.5px] font-mono w-full">
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                          math_verifier.py
                        </div>
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                          code_executor.py
                        </div>
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                          prm_judge.py
                        </div>

                        {/* Project Tree Folder */}
                        <div className="mt-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 px-1.5 py-1 text-[#aaa] font-semibold truncate">
                            <ChevronDown size={13} className="text-[#777] shrink-0" /> horos-reasoning/
                          </div>
                          <div className="pl-3 flex flex-col gap-1 border-l border-[#252525] ml-2.5 mt-0.5">
                            <button
                              onClick={() => selectFileManually("search_pipeline.py")}
                              className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "search_pipeline.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              search_pipeline.py
                            </button>
                            <button 
                              onClick={() => selectFileManually("verifier.py")}
                              className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "verifier.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              verifier.py
                            </button>
                            <button 
                              onClick={() => selectFileManually("eval_bench.py")}
                              className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "eval_bench.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              eval_bench.py
                            </button>
                            <button 
                              onClick={() => selectFileManually("reasoning_config.json")}
                              className={`flex items-center gap-2 px-1.5 py-1 transition-colors w-full text-left rounded-[4px] truncate ${activeFile === "reasoning_config.json" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              reasoning_config.json
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
                              <ChevronRight size={13} className="text-[#333] shrink-0" /> checkpoints/
                            </div>
                            <div className="flex items-center gap-2 px-1.5 py-1 text-[#555] truncate">
                              <ChevronRight size={13} className="text-[#333] shrink-0" /> traces/
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
                          onClick={() => selectFileManually("search_pipeline.py")}
                          className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "search_pipeline.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          search_pipeline.py
                        </button>
                        <button
                          onClick={() => selectFileManually("verifier.py")}
                          className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "verifier.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          verifier.py
                        </button>
                        <button
                          onClick={() => selectFileManually("eval_bench.py")}
                          className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "eval_bench.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          eval_bench.py
                        </button>
                        <button
                          onClick={() => selectFileManually("reasoning_config.json")}
                          className={`shrink-0 whitespace-nowrap text-[10.5px] sm:text-[11.5px] font-mono font-bold px-2.5 sm:px-3 py-1 border-b-2 transition-colors ${activeFile === "reasoning_config.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          reasoning_config.json
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
                        <div className="pl-3.5 flex-1 text-[#C8C7BA] leading-[22px]">
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
                      High-throughput test-time compute with dynamic reasoning token budgets on H100 to B200 clusters.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-6 py-10 sm:px-8 sm:py-12 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2]">Your infrastructure</h3>
                    <p className="text-[#C8C7BA] text-[14.5px] leading-relaxed">
                      Deploy verifiers and search trees on AWS, GCP, RunPod, or bare metal. Same verifiers, your cluster.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-6 py-10 sm:px-8 sm:py-12 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-medium text-[#F0EFE2]">Local workstation</h3>
                    <p className="text-[#C8C7BA] text-[14.5px] leading-relaxed">
                      Single-GPU development with quantized reasoning models, local test harnesses, and step PRM scoring.
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
                <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] xl:text-[52px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-2xl mx-auto leading-tight">Any HF reasoning model works</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
                  Deploy open-weight reasoning models through Horos test-time search, verifier suites, and PRM scoring pipelines. The examples below are just a starting view.
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
                    placeholder="Search any reasoning model on Hugging Face"
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
                          <div className="relative z-10 flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 border border-[#333] border-dashed rounded-sm flex items-center justify-center bg-[#151515]">
                              {getLogo(model.author, model.name)}
                            </div>
                            <span className="text-[#C8C7BA] text-[13.5px] font-medium tracking-wide line-clamp-1">{model.author}</span>
                          </div>
                          <div className="relative z-10 flex flex-col gap-1 min-w-0">
                            <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>{model.name}</h3>
                            <p className="text-[#888] text-[13px] leading-relaxed line-clamp-2" title={model.description}>{model.description}</p>
                          </div>
                          <div className="relative z-10 flex justify-between items-center mt-auto pt-4 gap-2">
                            <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0">{model.downloads}</span>
                            <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">{model.tag || model.role}</span>
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
        <div className="w-full relative z-10 mt-20">
          {/* Heading */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What Horos tunes</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Every stage of reasoning, optimized per model, workload, and GPU.
                </p>

                {/* Tunes Grid */}
                <div className="flex flex-col w-full border-t border-b border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Row 1 */}
                    <div className="px-8 py-8 md:py-9 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Gauge size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Reasoning budget allocation</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Tune maximum reasoning tokens, sampling count, and stopping criteria across DeepSeek-R1 and Qwen3. Measure accuracy gains against tokens per solved problem.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Candidate search and selection</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Compare single-pass generation, best-of-N sampling, majority voting, and verifier-guided selection. Measure when extra candidates improve task success enough to justify their cost.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <ShieldCheck size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Outcome verification</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Evaluate mathematical answers against known solutions, code against test suites, and structured outputs against task-specific constraints. Track false acceptance and rejection rates.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Cpu size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Inference kernels and parallelism</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Benchmark attention kernels, tensor parallelism, memory allocation, and supported serving configurations for each checkpoint and GPU. Find configurations that improve throughput without degrading correctness.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Quantization and KV cache</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Compare supported BF16, FP16, FP8, and weight-quantization paths. Tune KV-cache capacity, batching, and concurrency against memory use, latency, and reasoning quality.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Brain size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Reasoning training experiments</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Test supervised fine-tuning, LoRA, distillation, and GRPO where appropriate. Compare checkpoints on held-out math, code, and domain-specific tasks before promoting a new version.
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
                    <TokenPromptInput fixedPromptIndex={1} hideHeader={true} showSuggestions={false} cardClassName="!bg-[#202020]" />
                  </div>
                </div>

              </div>
              <div className="border-l border-dashed border-[#333]" />
            </div>
            {/* Bottom Horizontal Border */}
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />
          </div>

          {/* FAQ Section */}
          <div className="w-full relative z-10 pt-24 pb-28 md:pb-36 flex flex-col items-center px-4">
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


