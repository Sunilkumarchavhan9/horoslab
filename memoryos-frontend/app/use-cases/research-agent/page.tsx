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
      title: "One connected research lifecycle.",
      desc: "Link hypotheses, models, data, experiments, evaluations, and results."
    },
    closed: {
      title: "Research around an API.",
      desc: "Build orchestration, experiment tracking, and result management in your application."
    },
    diy: {
      title: "Infrastructure you assemble.",
      desc: "Integrate model serving, data, training, and evaluation systems yourself."
    }
  },
  {
    num: "0 2",
    label: "Models",
    runInfra: {
      title: "Compare model versions.",
      desc: "Track architectures, checkpoints, adaptations, and measured capabilities, including physical-world understanding."
    },
    closed: {
      title: "Provider model catalog.",
      desc: "Use available models and supported customization methods."
    },
    diy: {
      title: "Full model ownership.",
      desc: "Manage weights, architectures, training, checkpoints, and serving."
    }
  },
  {
    num: "0 3",
    label: "Context",
    runInfra: {
      title: "Research knowledge with lineage.",
      desc: "Connect prior findings, hypotheses, datasets, and experiment history."
    },
    closed: {
      title: "Application-managed memory.",
      desc: "Build research context and history around provider APIs."
    },
    diy: {
      title: "Your own knowledge layer.",
      desc: "Maintain research records and artifact relationships."
    }
  },
  {
    num: "0 4",
    label: "Capabilities",
    runInfra: {
      title: "One connected research toolkit.",
      desc: "Combine model repositories, datasets, training, evaluation, and compute environments."
    },
    closed: {
      title: "Provider-supported tools.",
      desc: "Integrate available APIs and external research tools."
    },
    diy: {
      title: "Custom research infrastructure.",
      desc: "Build and maintain each integration."
    }
  },
  {
    num: "0 5",
    label: "Workload",
    runInfra: {
      title: "Every experiment accounted for.",
      desc: "Record model configurations, datasets, training runs, compute use, and failures."
    },
    closed: {
      title: "Exposed usage metrics.",
      desc: "Measure what the provider makes available."
    },
    diy: {
      title: "Full-stack instrumentation.",
      desc: "Collect training, evaluation, and infrastructure metrics yourself."
    }
  },
  {
    num: "0 6",
    label: "Optimization",
    runInfra: {
      title: "Search for better intelligence.",
      desc: "Compare architectures, data mixtures, training methods, adaptation, and inference strategies."
    },
    closed: {
      title: "Available configuration tuning.",
      desc: "Optimize the models and settings exposed by the provider."
    },
    diy: {
      title: "Your own optimization pipeline.",
      desc: "Build experiment search, profiling, and compute scheduling."
    }
  },
  {
    num: "0 7",
    label: "Verification",
    runInfra: {
      title: "Evidence-backed improvements.",
      desc: "Compare model versions against baselines and preserve reproducible evaluation results."
    },
    closed: {
      title: "Independent model evaluation.",
      desc: "Test provider models against your own research objectives."
    },
    diy: {
      title: "Custom verification infrastructure.",
      desc: "Maintain benchmarks, evaluators, and reproducibility yourself."
    }
  },
  {
    num: "0 8",
    label: "Experience",
    runInfra: {
      title: "Research that accumulates.",
      desc: "Preserve hypotheses, code, datasets, checkpoints, failures, and experiment outcomes."
    },
    closed: {
      title: "Connected application records.",
      desc: "Link provider results to your research history."
    },
    diy: {
      title: "Self-managed experiment lineage.",
      desc: "Correlate code, training runs, artifacts, and results."
    }
  },
  {
    num: "0 9",
    label: "Teaching",
    runInfra: {
      title: "Findings become new intelligence.",
      desc: "Turn verified results and ground truth into training signals, world-model learning, and improved model versions."
    },
    closed: {
      title: "Provider-dependent adaptation.",
      desc: "Use available fine-tuning and customization capabilities."
    },
    diy: {
      title: "Your own learning pipeline.",
      desc: "Manage data curation, training, distillation, and model promotion."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    runInfra: {
      title: "Controlled research execution.",
      desc: "Govern dataset access, credentials, compute budgets, experiment permissions, and approvals."
    },
    closed: {
      title: "Application-level controls.",
      desc: "Enforce access and execution policies around provider APIs."
    },
    diy: {
      title: "Self-managed governance.",
      desc: "Build permissions, auditing, budgets, and approval workflows."
    }
  }
];


const EXPERIMENT_CODE = `# Autonomous hypothesis testing: literature grounding, PyTorch runs, artifact lineage.
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from horos.research import LiteratureGraph, HypothesisTracker

tracker = HypothesisTracker(experiment_id="exp-reasoning-phys-04")
lit = LiteratureGraph.from_sources(["arxiv", "semantic_scholar", "openalex"])

def run_experiment(hypothesis: str) -> dict:
    """Validate research hypothesis against baseline checkpoints."""
    papers = lit.query(hypothesis, top_k=15, min_citations=20)
    baseline_acc = tracker.load_baseline_metric("arc_challenge_accuracy")
    
    # Formulate test and execute evaluation harness
    model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-32B-Instruct", torch_dtype=torch.bfloat16, device_map="cuda:0")
    results = evaluate_hypothesis(model, hypothesis, papers, eval_set="benchmarks/physical_reasoning.json")
    
    delta = results["accuracy"] - baseline_acc
    tracker.record_run(hypothesis=hypothesis, delta=delta, checkpoint="checkpoints/step-12000.pt", verified=(delta > 0))
    return {"hypothesis_delta": delta, "checkpoint": "step-12000.pt", "evidence": results["citations"]}`;

const LITERATURE_CODE = `# Literature discovery & citation tracing across arXiv, OpenAlex, Semantic Scholar.
import httpx
from horos.lineage import CitationSpanMapper

class LiteratureDiscovery:
    def __init__(self, semantic_api_key: str = None):
        self.arxiv_endpoint = "https://export.arxiv.org/api/query"
        self.openalex_endpoint = "https://api.openalex.org/works"
        self.span_mapper = CitationSpanMapper()

    def discover_and_trace(self, query: str, max_depth: int = 2) -> dict:
        """Trace prior findings, competing claims, and dataset lineage."""
        papers = self.fetch_related_works(query)
        graph = self.build_citation_graph(papers, depth=max_depth)
        claims = self.extract_empirical_findings(graph)
        return {
            "total_papers": len(papers),
            "verified_claims": claims,
            "connected_datasets": graph.datasets,
            "code_repositories": graph.github_repos
        }`;

const EVALUATE_CODE = `# Gold-standard capability verification: baselines vs candidate checkpoint.
import json
from horos.eval import BenchmarkSuite, VerificationHarness

def run_verification(checkpoint_path: str, baseline_id: str) -> dict:
    """Measure real capability changes with repeatable evidence."""
    harness = VerificationHarness(target_device="cuda:0")
    benchmarks = ["physical_world_qa", "gsm8k_cot", "humaneval_plus"]
    
    metrics = {}
    for bench in benchmarks:
        score_new = harness.score_checkpoint(checkpoint_path, bench)
        score_base = harness.score_baseline(baseline_id, bench)
        metrics[bench] = {
            "candidate": score_new,
            "baseline": score_base,
            "gain": score_new - score_base,
            "p_value": harness.significance_test(bench)
        }
    return {"verified": all(m["gain"] >= 0 for m in metrics.values()), "breakdown": metrics}`;

const RESEARCH_JSON_CODE = `{
  "name": "research-agent",
  "task": "hypothesis-testing-and-discovery",
  "base_model": "Qwen/Qwen2.5-32B-Instruct",
  "reasoning_model": "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
  "literature_sources": ["arxiv", "semantic_scholar", "openalex"],
  "dataset_sources": ["huggingface/gsm8k", "internal/physics-eval"],
  "engine": "vllm",
  "gpu": "nvidia-l40s",
  "tracking": {
    "artifact_lineage": true,
    "checkpoints": "s3://horos-research-vault/checkpoints",
    "reproducible_seeds": [42, 1337, 2026]
  }
}`;

const TRAIN_CODE = `# Model adaptation & checkpoint training with lineage and parameter tracking.
import torch
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer

def launch_training(config_path: str = "research.json"):
    """Adapt model based on verified hypothesis ground-truth evidence."""
    lora_config = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"], lora_dropout=0.05)
    model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-32B-Instruct", torch_dtype=torch.bfloat16)
    model = get_peft_model(model, lora_config)
    
    args = TrainingArguments(
        output_dir="checkpoints/research-run",
        per_device_train_batch_size=4,
        gradient_accumulation_steps=8,
        learning_rate=2e-5,
        bf16=True,
        logging_steps=10
    )
    print("Training initiated on NVIDIA L40S. Preserving experiment artifacts...")`;

type ResearchAgentFile = string;

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
  { id: "moonshotai/Kimi-K3", name: "Kimi K3", author: "Moonshot AI", downloads: "2.8T MoE", tag: "Deep Research", link: "https://huggingface.co/moonshotai" },
  { id: "deepseek-ai/DeepSeek-V3.2", name: "DeepSeek-V3.2", author: "DeepSeek", downloads: "685B MoE", tag: "Tool Reasoning", link: "https://huggingface.co/deepseek-ai/DeepSeek-V3" },
  { id: "Qwen/Qwen3.5-397B-A17B", name: "Qwen3.5-397B-A17B", author: "Alibaba", downloads: "397B MoE", tag: "Multimodal Research", link: "https://huggingface.co/Qwen/Qwen2.5-72B-Instruct" },
  { id: "moonshotai/Kimi-K2.5", name: "Kimi K2.5", author: "Moonshot AI", downloads: "1T MoE", tag: "Visual Agent", link: "https://huggingface.co/moonshotai" },
  { id: "deepseek-ai/DeepSeek-R1-0528", name: "DeepSeek-R1-0528", author: "DeepSeek", downloads: "671B", tag: "Deep Reasoning", link: "https://huggingface.co/deepseek-ai/DeepSeek-R1" },
  { id: "Qwen/Qwen3.5-35B-A3B", name: "Qwen3.5-35B-A3B", author: "Alibaba", downloads: "35B MoE", tag: "Efficient Reasoning", link: "https://huggingface.co/Qwen/Qwen2.5-32B-Instruct" },
  { id: "Qwen/Qwen3.5-27B", name: "Qwen3.5-27B", author: "Alibaba", downloads: "27B", tag: "Multimodal Analysis", link: "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct" },
  { id: "Qwen/QwQ-32B", name: "QwQ-32B", author: "Alibaba", downloads: "32B", tag: "Math Reasoning", link: "https://huggingface.co/Qwen/QwQ-32B" },
  { id: "microsoft/Phi-4-reasoning", name: "Phi-4-reasoning", author: "Microsoft", downloads: "14B", tag: "Scientific Reasoning", link: "https://huggingface.co/microsoft/phi-4" }
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
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('coqui') || a.includes('canopy')) return <span className="text-[18px]">🤗</span>;
  if (a.includes('mistral') || a.includes('intfloat') || m.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
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
    question: "How do Research Agents automate literature review and paper discovery?",
    answer: "Horos connects directly with arXiv, PubMed, Semantic Scholar, and OpenAlex APIs. Agents crawl citation graphs, extract mathematical equations and experimental tables, identify consensus and contradictions across hundreds of papers, and synthesize structured literature reviews with verified bibliographic citations."
  },
  {
    question: "Can I compare model experiments and ablation studies against identical baselines?",
    answer: "Yes. Horos automatically tracks dataset splits, hyperparameter seeds, tokenizers, learning rate schedules, and GPU resource usage. Automated ablation suites run experiments under strictly controlled conditions, outputting standardized markdown/LaTeX comparison tables with statistical significance tests."
  },
  {
    question: "How does Horos eliminate mathematical hallucinations in research derivations?",
    answer: "Our research pipeline routes mathematical claims and symbolic equations through computer algebra systems (SymPy, Lean 4, Mathematica, and Wolfram Engine). Derivations are verified step-by-step for formal mathematical consistency before being included in experimental reports."
  },
  {
    question: "Can Horos launch and manage jobs on Slurm, Kubernetes, or cloud compute?",
    answer: "Yes. Horos features automated cluster dispatch. Agents formulate experiment scripts, package dependencies into Docker containers, submit batch jobs to Slurm HPC clusters or Kubernetes GPU nodes, monitor loss curves in real time, and alert on gradient explosions or hardware failures."
  },
  {
    question: "How are experiment artifacts, checkpoints, and model lineage preserved?",
    answer: "Every run creates an immutable cryptographic manifest containing exact Git commit hashes, environment dependencies, dataset checksums, model weights, and tensorboard logs. Experiments can be reproduced bit-for-bit at any time in the future."
  },
  {
    question: "Can research agents assist with manuscript drafting and LaTeX formatting?",
    answer: "Yes. Agents generate publication-ready LaTeX manuscripts, formatted according to specific conference templates (NeurIPS, ICML, CVPR, ICLR, Nature). Figures, vector diagrams, and verified citation keys are compiled and validated automatically with latexmk."
  }
];



export default function EmbeddingsPage() {
  const [activeTab, setActiveTab] = useState("Horos");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [activeFile, setActiveFile] = useState<ResearchAgentFile>("experiment.py");
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "experiment.py": EXPERIMENT_CODE,
    "literature.py": LITERATURE_CODE,
    "evaluate.py": EVALUATE_CODE,
    "research.json": RESEARCH_JSON_CODE,
    "train.py": TRAIN_CODE
  };

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "On it. I'll search arXiv literature, formulate hypothesis tests in PyTorch, run checkpoints on one L40S, and preserve benchmark lineage.";
  const AGENT_MSG_2 = "Research workflow ready. Baseline verified across 1,420 papers, experiments running on L40S ($1.40/hr) with full checkpoint lineage. Want me to launch the suite?";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const [isTypingCode, setIsTypingCode] = useState(true);
  const [typedCodeText, setTypedCodeText] = useState("");

  const selectFileManually = (file: ResearchAgentFile) => {
    setIsAutoPlay(false);
    setActiveFile(file);
    setActiveMainTab("code");
  };

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || EXPERIMENT_CODE;

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
            if (m.pipeline_tag) {
              if (m.pipeline_tag.includes("text-generation")) tag = "LLM";
              else if (m.pipeline_tag.includes("automatic-speech-recognition")) tag = "STT";
              else if (m.pipeline_tag.includes("text-to-speech")) tag = "TTS";
              else if (m.pipeline_tag.includes("audio-classification")) tag = "Audio";
            }

            let author = m.author || m.id.split('/')[0];
            let name = m.id.split('/').pop();

            return {
              id: m.id,
              name: name,
              author: author,
              downloads: dl,
              tag: tag,
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
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%]">
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
              src="https://a2-us.storyblok.com/f/1019538/1236x1236/9561ddb94e/hands.png/m/1080x0/filters:quality(85):format(webp)"
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
            <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%]">
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
          <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] py-24 md:py-32 relative z-10">
            <div />
            <div className="min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-4 md:px-8 lg:px-12">
                {/* Left: Content */}
                <div className="flex flex-col gap-5 max-w-xl">
                  <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-medium tracking-tight leading-[1.12] text-[#F0EFE2] mt-[-1rem]">
                    Research that ends in<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block">
                      evidence
                    </span>
                    , not summaries.
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Connect findings across papers, code, and datasets into testable hypotheses and reproducible experiments.
                  </p>

                  <div className="flex items-center gap-3.5 mt-2">
                    <button className="group whitespace-nowrap bg-[#75bf00] text-black font-semibold px-4.5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Run research mission <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="group whitespace-nowrap bg-[#222] text-[#F0EFE2] font-semibold px-4.5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Explore the stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid
                    label1="Vector Search"
                    label2="Citations"
                    label3="Reranking"
                    label4="Knowledge Base"
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
          <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What you actually own
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Horos helps you explore ways to improve AI models, test what works, and measure the results. Every experiment is recorded so you can understand what changed and why.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Grid with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10">
            {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] relative">
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

            <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%]">
              <div />
              <div className="min-w-0 mx-[10px] border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Card 1 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 1</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Choose what to improve.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Start with an open model and a clear goal. Horos benchmarks baseline reasoning, citation accuracy, and retrieval before testing changes.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 2</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Experiment and compare.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Test different training data, prompts, and context lengths. Horos tracks all modifications, compute resources, and experiment outcomes.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 3</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">Prove the improvement.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      Compare candidate models with the original. Measure whether they perform better, run faster, or cost less before deployment.
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
          <div className="flex flex-col items-center mb-14 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">Three ways to ship research agents
            </h2>
            <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
              Most research agents find papers and summarize findings. Horos connects research hypotheses to model development, experiments, and measured results, helping researchers develop and validate models that better understand physical reality.
            </p>
          </div>

          {/* Table with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10 bg-[#151515]/20 pt-[25px] pb-[10px]">
            {/* Double Horizontal Border Top */}

            {/* Double Horizontal Border Bottom */}


            {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] relative">
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
            <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] relative z-30">
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
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm shrink-0 shrink-0">
                        <HorosLogo size={16} />
                      </div>
                      <span className="text-[18px] md:text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Horos</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">One connected research lifecycle.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Key size={16} className="text-[#C8C7BA] shrink-0" />
                      <span className="text-[18px] md:text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed model APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Research around an API.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Cpu size={16} className="text-[#C8C7BA] shrink-0" />
                      <span className="text-[18px] md:text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">DIY self-hosting</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Infrastructure you assemble.</p>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="border-l border-r border-b border-dashed border-[#333]">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <div key={idx} className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200">
                      <div className="flex items-center px-4 py-4 lg:px-5 md:border-r border-dashed border-[#333]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[#75bf00] font-mono text-[13px] font-bold">{row.num}</span>
                          <span className="text-[16px] md:text-[14px] sm:text-[15px] font-medium text-[#F0EFE2]">{row.label}</span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-4 lg:px-5 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#75bf00] mb-1 leading-tight">{row.runInfra.title}</h4>
                        <p className="text-[#A0A098] text-[11.5px] sm:text-[12px] leading-relaxed font-sans">{row.runInfra.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-4 lg:px-5 md:border-r border-dashed border-[#333]">
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#F0EFE2] mb-1 leading-tight">{row.closed.title}</h4>
                        <p className="text-[#A0A098] text-[11.5px] sm:text-[12px] leading-relaxed font-sans">{row.closed.desc}</p>
                      </div>

                      <div className="flex flex-col justify-center px-4 py-4 lg:px-5">
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
          <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] pt-16 mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-4xl lg:text-[46px] font-medium tracking-tight mb-5">
                  Research code you own. <span className="text-[#75bf00]">Deploy anywhere.</span>
                </h2>
                <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] md:text-[15px] max-w-2xl mx-auto leading-relaxed text-center">
                  The complete research stack ships with you. Literature mining, hypothesis testing, experiment tracking, and model evaluations.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Top Horizontal Border spanning full screen */}

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">
            <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] relative z-10">
              <div />
              <div className="w-full relative min-w-0 px-1 md:px-2">
                {/* Sandbox Content Container (Constrained inside the vertical lines) */}
                <div className="w-full relative mx-auto" style={{ aspectRatio: '1351 / 892' }}>

                  {/* Panes Backgrounds (Z-0) */}
                  <div className="absolute inset-0 grid" style={{
                    gridTemplateColumns: '41fr 443fr 226fr 602fr 39fr',
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
                        <div className="bg-[#1a1a1a] border border-[#252525] p-4 rounded-[4px]">
                          <p className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-sans leading-[21px] sm:leading-[22px]">
                            Build a research agent. Discover papers on arXiv, test hypotheses on{" "}
                            <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] align-middle mx-0.5">
                              <QwenLogo size={11} /> Qwen 2.5
                            </span>
                            , and verify on{" "}
                            <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#75bf00] align-middle mx-0.5">
                              <NvidiaLogo size={11} /> L40S
                            </span>
                            .
                          </p>
                        </div>

                        {/* Step 1: Agent Initial Ack */}
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
                          {/* Log 1 (Step 2) */}
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
                                <span className="text-[#C8C7BA] text-[13px] font-medium">Literature discovery</span>
                                <span className="text-[#C8C7BA] text-[12px]">1.2s</span>
                              </div>
                              <span className="text-[#666] text-[12px]">Indexed 1,420 arXiv papers via OpenAlex</span>
                            </div>
                          </div>

                          {/* Log 2 (Step 3) */}
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
                                <span className="text-[#C8C7BA] text-[13px] font-medium">Hypothesis design</span>
                                <span className="text-[#C8C7BA] text-[12px]">0.8s</span>
                              </div>
                              <span className="text-[#75bf00] text-[12px]">Formulated reasoning baseline vs candidate</span>
                            </div>
                          </div>

                          {/* Log 3 (Step 4) */}
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
                                <span className="text-[#C8C7BA] text-[13px] font-medium">Dataset curation</span>
                                <span className="text-[#C8C7BA] text-[12px]">1.1s</span>
                              </div>
                              <span className="text-[#666] text-[12px]">Extracted 25k verified empirical pairs</span>
                            </div>
                          </div>

                          {/* Log 4 (Step 5) */}
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
                                <span className="text-[#C8C7BA] text-[13px] font-medium">PyTorch execution</span>
                                <span className="text-[#C8C7BA] text-[12px]">1.4s</span>
                              </div>
                              <span className="text-[#666] text-[12px]">Dispatched on L40S; saved 3 checkpoints</span>
                            </div>
                          </div>

                          {/* Log 5 (Step 6) */}
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
                                <span className="text-[#C8C7BA] text-[13px] font-medium">Capability verification</span>
                                <span className="text-[#C8C7BA] text-[12px]">1.3s</span>
                              </div>
                              <span className="text-[#75bf00] text-[12px]">+8.4% reasoning gain, full lineage verified</span>
                            </div>
                          </div>
                        </div>

                        {/* Step 7 (LAST STEP): Agent Final Summary */}
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
                            placeholder="Ask the agent to test a hypothesis or benchmark another checkpoint..."
                            className="bg-transparent text-[#F0EFE2] text-[13px] border-none outline-none w-full px-2 py-2"
                            readOnly
                          />
                          <div className="flex justify-between items-center px-1">
                            <div className="flex gap-1.5">
                              <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@Hypothesis</span>
                              <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@Literature</span>
                              <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@Experiments</span>
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
                        <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase">RESEARCH TOOLS</span>
                        <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] sm:text-[9.5px] font-bold px-1.5 py-0.2 rounded-sm">3</span>
                      </div>
                      <div className="flex flex-col gap-1.5 text-[13px] font-mono">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          arxiv_search.py
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          semantic_scholar.py
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          openalex_graph.py
                        </div>

                        {/* Project Tree Folder */}
                        <div className="mt-2 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 px-2 py-1.5 text-[#aaa] font-semibold">
                            <ChevronDown size={14} className="text-[#777]" /> horos-research-agent/
                          </div>
                          <div className="pl-4 flex flex-col gap-1.5 border-l border-[#252525] ml-3.5 mt-1">
                            <button
                              onClick={() => selectFileManually("experiment.py")}
                              className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "experiment.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              experiment.py
                            </button>
                            <button
                              onClick={() => selectFileManually("literature.py")}
                              className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "literature.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              literature.py
                            </button>
                            <button
                              onClick={() => selectFileManually("evaluate.py")}
                              className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "evaluate.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              evaluate.py
                            </button>
                            <button
                              onClick={() => selectFileManually("research.json")}
                              className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "research.json" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              research.json
                            </button>
                            <button
                              onClick={() => selectFileManually("train.py")}
                              className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "train.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              train.py
                            </button>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              <ChevronRight size={14} className="text-[#333]" /> hypotheses/
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              <ChevronRight size={14} className="text-[#333]" /> checkpoints/
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              requirements.txt
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              README.md
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                      {/* Editor top tabs */}
                      <div className="flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                        <button
                          onClick={() => selectFileManually("experiment.py")}
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "experiment.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          experiment.py
                        </button>
                        <button
                          onClick={() => selectFileManually("literature.py")}
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "literature.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          literature.py
                        </button>
                        <button
                          onClick={() => selectFileManually("evaluate.py")}
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "evaluate.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          evaluate.py
                        </button>
                        <button
                          onClick={() => selectFileManually("research.json")}
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "research.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          research.json
                        </button>
                        <button
                          onClick={() => selectFileManually("train.py")}
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "train.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          train.py
                        </button>
                      </div>

                      {/* Code Area with Line Numbers */}
                      <div className="flex font-mono text-[13px] leading-relaxed overflow-x-auto select-text thin-hover-scrollbar">
                        {/* Line numbers column */}
                        <div className="text-[#444] text-right pr-5 border-r border-[#252525] select-none flex flex-col min-w-[32px]">
                          {Array.from({ length: typedCodeText.split('\n').length }).map((_, i) => (
                            <div key={i} className="min-h-[22px] leading-[22px]">{i + 1}</div>
                          ))}
                        </div>

                        {/* Highlighted code column */}
                        <div className="pl-5 flex-1 text-[#C8C7BA] leading-[22px]">
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
            <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] relative z-10">
              <div />
              {/* Added top horizontal line per user request */}
              <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cloud size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Managed Horos</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Our GPUs, per-million-tokens billing from L4 to B200.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Your infrastructure</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      AWS, GCP, RunPod, bare metal. Same verifier/, your cluster.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-8 py-16 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Local workstation</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      docker compose up. Full pipeline on a single GPU.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Section End Divider with Brand Logo */}
          <div className="w-full relative z-20 my-16 md:my-20">
            <SectionDivider position="top" className="w-full" />
          </div>

          {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-4 sm:pt-6 pb-16">
            <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%]">
              <div />
              <div className="flex flex-col items-center">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">
                  Supported research & reasoning models
                </h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-8 sm:mb-10">
                  Frontier research, reasoning, and multimodal models run directly in Horos workflows. Search the live Hugging Face catalog or explore verified models below.
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
                    placeholder="Search any research or reasoning model on Hugging Face"
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
                          href={model.link || model.url || `https://huggingface.co/${model.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={getBorderClasses(index, models.length) + " block no-underline"}
                        >
                          <ArrowUpRight size={20} className="text-[#75bf00] absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center">
                            {getLogo(model.author, model.name)}
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>{model.name}</h3>
                            <span className="text-[#C8C7BA] text-[14px] line-clamp-1" title={model.author}>{model.author}</span>
                          </div>
                          <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                            <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0">{model.downloads}</span>
                            <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">{model.tag}</span>
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

          {/* Section End Divider with Brand Logo */}
          <div className="w-full relative z-20 my-16 md:my-20">
            <SectionDivider position="top" className="w-full" />
          </div>

          {/* Tuning Section */}
          <div className="w-full relative z-10 pt-4 sm:pt-6 pb-28 md:pb-36">
            {/* Heading */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%]">
              <div />
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What Horos tunes</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Every stage of model research, from architecture and training to inference and physical-world understanding. Every experiment is measured against a baseline.
                </p>

                {/* Tunes Grid */}
                <div className="flex flex-col w-full border-t border-b border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">

                    {/* Row 1 */}
                    <div className="px-8 py-8 md:py-9 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Cpu size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Model architecture</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Attention mechanisms, context, multimodal design, and model representations. Compare architectural changes to discover what improves reasoning, perception, and prediction.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Data and curriculum</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Data mixtures, synthetic examples, and difficult cases from model failures. Find which data improves a capability instead of simply increasing dataset size.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Training and adaptation</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Continued training, LoRA, preference optimization, and distillation. Compare training methods while tracking checkpoints, compute, and capability changes.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <ShieldCheck size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Evaluation and verification</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Test reasoning, coding, tool use, and long-horizon behavior. Compare model versions against baselines and preserve evidence for every claimed improvement.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">Inference and test-time optimization</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Routing, caching, batching, and adaptive reasoning. Measure quality, latency, throughput, and compute cost for each configuration.
                      </p>
                    </div>

                    <div className="px-8 py-8 md:py-9 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-3.5 items-start">
                      <div className="text-[#75bf00]">
                        <Brain size={26} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[19px] md:text-[20px] font-medium text-[#F0EFE2]">World-model learning</h3>
                      <p className="text-[#A0A0A0] text-[14px] leading-relaxed">
                        Video, sensor observations, spatial relationships, and physical dynamics. Test whether models can represent changing states, predict what happens next, and match predictions against observed reality.
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
            <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%]">
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
          <div className="w-full relative z-10 py-24 flex flex-col items-center px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#f2efe8] mb-3 text-center">Common <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">questions</span></h2>
            <p className="text-[#C8C7BA] text-sm sm:text-base font-sans text-center mb-10">
              Questions about researching, evaluating, and improving intelligence with Horos. Can't find what you're looking for?{" "}
              <a href="/contact" className="text-[#75bf00] hover:underline font-medium">Get in touch.</a>
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
            <div className="w-full grid grid-cols-1 lg:grid-cols-[10%_80%_10%] xl:grid-cols-[14%_72%_14%] 2xl:grid-cols-[18%_64%_18%] absolute inset-0 pointer-events-none z-0 overflow-hidden">
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
              <div className="mb-8">
                <HorosLogo size={36} />
              </div>

              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#F0EFE2] mb-6 max-w-3xl leading-tight">
                Deploy your first optimized model,<br className="hidden md:block" />
                <span className="relative z-10 bg-[#75bf00] text-black px-2.5 py-0.5 rounded-sm">measured</span> before you ship
              </h2>

              <p className="text-[#a0a0a0] text-[15px] md:text-[17px] font-sans mb-10 max-w-xl">
                Describe the goal. Horos builds and optimizes the stack.
              </p>

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
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





