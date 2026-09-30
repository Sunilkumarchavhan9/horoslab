"use client";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/dhyra/primitives/token-prompt-input";
import { DhyraLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, DhyraWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo } from "@/components/dhyra/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "Launch",
    runInfra: { title: "Pick a generator, start synthesizing", desc: "Start generating data instantly with frontier models." },
    closed: { title: "Call a black-box API", desc: "Fast generation, but you can't distill their weights." },
    diy: { title: "Build scraping & labeling pipelines", desc: "Human annotation comes before product learning." }
  },
  {
    num: "0 2",
    label: "Model control",
    runInfra: { title: "Choose your frontier generator", desc: "Use Llama-3.1-405B or Qwen-72B as your engine." },
    closed: { title: "Locked to vendor's distillation", desc: "You use what the API provider exposes for generation." },
    diy: { title: "Hand-labeling", desc: "Full control if you maintain human annotators." }
  },
  {
    num: "0 3",
    label: "Tuning",
    runInfra: { title: "Iterate on synthesis prompts", desc: "Tune prompts and reward models before fine-tuning." },
    closed: { title: "Opaque data curation", desc: "Data generation and filtering stay behind the API." },
    diy: { title: "Manual review pipelines", desc: "Your team owns annotator feedback and data regressions." }
  },
  {
    num: "0 4",
    label: "Export",
    runInfra: { title: "Export synthetic datasets directly", desc: "Take your generated dataset and weights anytime." },
    closed: { title: "Locked dataset endpoint", desc: "You keep calling the provider for every query." },
    diy: { title: "Already owned", desc: "Export exists because you built the stack yourself." }
  },
  {
    num: "0 5",
    label: "Operations",
    runInfra: { title: "Automated loops", desc: "Operate automated synthesis-to-training pipelines." },
    closed: { title: "Low, with lock-in", desc: "Less infra work, less control over your data factory." },
    diy: { title: "High", desc: "You own data storage, labeling pipelines, and scaling." }
  },
  {
    num: "0 6",
    label: "Security",
    runInfra: { title: "SOC 2 Type II", desc: "Audited controls for access, logging, and storage." },
    closed: { title: "Varies by vendor", desc: "Compliance depends on the third-party API." },
    diy: { title: "You build it", desc: "Your team owns the audit trail and access controls." }
  }
];


const RETRIEVE_CODE = `# Synthesize Q&A datasets using a frontier generator model.
from openai import OpenAI
import json
 
generator = OpenAI(base_url="http://localhost:8000/v1")
 
def synthesize_data(domain_docs: list[str], n_samples: int = 10000) -> list[dict]:
    """Generate instruction-response pairs and filter with reward model."""
    dataset = []
    for doc in domain_docs:
        prompt = f"Given this text, generate 5 challenging Q&A pairs:\\n{doc}"
        res = generator.chat.completions.create(model="llama-3.1-405b", messages=[{"role": "user", "content": prompt}])
        
        # Filter generations using a reward model / LLM-as-a-judge
        for qa in parse_pairs(res.choices[0].message.content):
            score = generator.chat.completions.create(
                model="llama-3.1-405b", 
                messages=[{"role": "user", "content": f"Score this Q&A from 1-10: {qa}"}]
            )
            if int(score.choices[0].message.content) >= 8:
                dataset.append(qa)
                
    return dataset[:n_samples]`;

const SERVE_CODE = `#!/usr/bin/env bash
# LoRA fine-tuning using torchtune on generated dataset
set -euo pipefail
 
TARGET_MODEL="meta-llama/Llama-3.1-8B-Instruct"
DATASET_PATH="./synthetic_dataset.jsonl"
 
# Run parameter-efficient fine-tuning
tune run lora_finetune_single_device \\
  --config llama3_1/8B_lora_single_device \\
  checkpointer.checkpoint_dir=$TARGET_MODEL \\
  dataset.path=$DATASET_PATH \\
  training.dhyras=3 \\
  training.batch_size=8 \\
  optimizer.lr=2e-4
 
# Merge LoRA weights into base model
tune run lora_merge \\
  --config llama3_1/8B_lora_merge_single_device`;

const PIPELINE_CODE = `{
  "name": "teaching-data-factory",
  "target_samples": 10000,
  "generator_model": "meta-llama/Llama-3.1-405B-Instruct",
  "target_model": "meta-llama/Llama-3.1-8B-Instruct",
  "reward_threshold": 8,
  "engine": "vllm",
  "trainer": "torchtune",
  "gpu": "nvidia-h100"
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base
 
RUN apt-get update && apt-get install -y python3.11 python3-pip
 
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
 
COPY adapters/ /app/adapters/
COPY corpus/ /app/corpus/
COPY evals/ /app/evals/
COPY eval.py train.sh pipeline.json .
 
EXPOSE 8000
ENTRYPOINT ["/app/train.sh"]`;

const EVAL_CODE = `# Eval harness: comparing fine-tuned model vs generator.
import json
from openai import OpenAI
 
tuned_model = OpenAI(base_url="http://localhost:8001/v1")
generator = OpenAI(base_url="http://localhost:8000/v1")
 
def run_eval(test_set_path: str) -> dict:
    """Score the fine-tuned model against the generator on holdout set."""
    items = json.load(open(test_set_path))
    win_rate = 0.0
    for item in items:
        # Generate answer from fine-tuned model
        tuned_ans = tuned_model.chat.completions.create(model="tuned-8b", messages=[{"role": "user", "content": item["q"]}])
        
        # Ask generator to judge tuned model vs reference
        judge_prompt = f"Question: {item['q']}\\nModel: {tuned_ans}\\nReference: {item['a']}\\nDoes the model match or beat the reference? (Yes/No)"
        judge_res = generator.chat.completions.create(model="llama-3.1-405b", messages=[{"role": "user", "content": judge_prompt}])
        
        if "yes" in judge_res.choices[0].message.content.lower():
            win_rate += 1.0
            
    return {"win_rate": win_rate / len(items)}`;

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
  { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B", author: "Meta", description: "Frontier model for generating high-quality synthetic datasets.", role: "Generator" },
  { id: "meta-llama/Llama-3.1-8B-Instruct", name: "Llama 3.1 8B", author: "Meta", description: "Compact, fast inference target for domain-specific fine-tuning.", role: "Target" },
  { id: "meta-llama/Llama-3.2-3B-Instruct", name: "Llama 3.2 3B", author: "Meta", description: "Edge-device target perfect for specialized embedded applications.", role: "Target" },
  { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen 2.5 72B", author: "Alibaba", description: "Strong multilingual synthesizer for complex data factories.", role: "Generator" },
  { id: "Qwen/Qwen2.5-32B-Instruct", name: "Qwen 2.5 32B", author: "Alibaba", description: "Balanced distillation target or mid-tier generator.", role: "Hybrid" },
  { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen 2.5 7B", author: "Alibaba", description: "Highly capable base model for efficient LoRA adaptation.", role: "Target" },
  { id: "Qwen/QwQ-32B-Preview", name: "QwQ 32B", author: "Alibaba", description: "Reasoning generator to synthesize step-by-step logic chains.", role: "Generator" },
  { id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", name: "DeepSeek R1 Distill 70B", author: "DeepSeek", description: "Distilled reasoning data generator for complex tasks.", role: "Generator" },
  { id: "deepseek-ai/DeepSeek-R1-Distill-Llama-8B", name: "DeepSeek R1 Distill 8B", author: "DeepSeek", description: "Compact reasoning target for specialized agent deployments.", role: "Target" }
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
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('nvidia') || m.includes('nvfp4')) return <NvidiaLogo size={20} />;
  if (a.includes('moonshot') || m.includes('kimi')) return <KimiLogo size={20} />;
  if (a.includes('coqui') || a.includes('canopy')) return <span className="text-[18px]">🤗</span>;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('mistral') || a.includes('intfloat') || m.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
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
    question: "Can I run an embedder and reranker on the same GPU?",
    answer: "Yes. Our fused memory architecture allows you to run a massive encoder like BGE-M3 alongside a cross-encoder reranker on a single H100 or L40S, eliminating network hops between models.",
  },
  {
    question: "How do you handle massive document ingestion?",
    answer: "We use aggressive sequence packing and continuous batching. Variable length documents are packed natively to avoid zero-padding waste, dramatically increasing throughput.",
  },
  {
    question: "Do you support direct Vector DB connections?",
    answer: "Yes. Our pipelines feature zero-copy network paths that stream embeddings directly into pgvector, Milvus, Qdrant, or Pinecone without hitting intermediary APIs.",
  }
];



export default function EmbeddingsPage() {
  const [activeTab, setActiveTab] = useState("Dhyra");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("synthesize.py");
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "synthesize.py": RETRIEVE_CODE,
    "eval.py": EVAL_CODE,
    "train.sh": SERVE_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE
  };

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "On it. I'll spin up Llama-3.1-405B as a generator to synthesize 10k domain-specific instructions, run a reward model filter, and kick off a LoRA fine-tune on Llama-3.1-8B.";
  const AGENT_MSG_2 = "Recipe is ready. Synthesis and training completed on H100 at $3.20/hr. The fine-tuned 8B model is ready for export or deployment. Want me to deploy the endpoint?";

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
        <div className="w-full h-full grid grid-cols-[14%_72%_14%]">
          {/* Left margin (14%) with 7% line bisecting it */}
          <div className="relative border-r border-dashed border-[#333]">
            <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#333]" />
          </div>
          {/* Center content (72%) */}
          <div />
          {/* Right margin (14%) with 93% line bisecting it */}
          <div className="relative border-l border-dashed border-[#333]">
            <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#333]" />
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
          <div className="absolute bottom-0 left-0 w-full h-px border-t border-dashed border-[#333] z-0" />

          {/* Crosshairs at exact intersections with the global vertical lines */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="w-full h-full grid grid-cols-[14%_72%_14%]">
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
          <div className="w-full grid grid-cols-[14%_72%_14%] py-24 md:py-32 relative z-10">
            <div />
            <div className="min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-4">
                {/* Left: Content */}
                <div className="flex flex-col gap-6 max-w-lg">
                  <h1 className="text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.1] mt-[-1rem]">
                    Synthetic Data<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      Factory
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[17px] tracking-wide max-w-md mt-2">
                    Auto-generate synthetic data and active learning loops to fine-tune bespoke models.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Deploy this pipeline <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Read the stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Synthetics"
                    label2="RLHF Alignment"
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
          <div className="w-full grid grid-cols-[14%_72%_14%]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4">Own your data factory</h2>
                <p className="text-[#C8C7BA] text-[20px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  The generation pipelines, the evaluation criteria, the synthesized datasets. Complete sovereignty over your model's training curriculum.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Grid with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10">
            {/* Constrained Horizontal Borders */}
            <div className="absolute top-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />
            <div className="absolute bottom-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />

            {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-full grid grid-cols-[14%_72%_14%] relative">
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

            <div className="w-full grid grid-cols-[14%_72%_14%]">
              <div />
              <div className="min-w-0 mx-[10px] border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Card 1 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 1</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The synthetic<br/>datasets.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the raw JSONL files, instruction-response pairs, and the exact Llama-3.1-405B generator prompts used to synthesize them. No vendor lock-in on your training curriculum.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 2</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The reward<br/>models.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the LLM-as-a-judge rubrics, filtering logic, and quality scores. When you refine the evaluation criteria, the factory instantly generates better data.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 3</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The fine-tuned<br/>weights.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the final LoRA adapters and the merged Llama-3.1-8B model checkpoints. Export the model binaries and deploy them securely anywhere.
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
            
            <div className="flex flex-col items-center mb-16 px-4">
              <h2 className="text-[40px] md:text-[56px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
                Three ways to build fine-tuning data
              </h2>
              <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed text-center max-w-2xl">
                Workflow comparison for data factories across Dhyra, closed APIs, and DIY hand-labeling.
              </p>
            </div>

            {/* Table with End-to-End Horizontal Lines */}
            <div className="w-full relative z-10 bg-[#151515]/20 pt-[25px] pb-[10px]">
              {/* Double Horizontal Border Top */}
              <div className="absolute top-[-10px] left-[14%] right-[14%] h-[20px] border-t border-b border-dashed border-[#333] pointer-events-none" />
              {/* Double Horizontal Border Bottom */}
              <div className="absolute bottom-[-10px] left-[14%] right-[14%] h-[20px] border-t border-b border-dashed border-[#333] pointer-events-none" />

              {/* Double Vertical Borders & Crosshairs */}
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="w-full h-full grid grid-cols-[14%_72%_14%] relative">
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
              <div className="w-full grid grid-cols-[14%_72%_14%] relative z-30">
                <div />
                <div className="min-w-0 bg-[#151515]">
                  {/* Table Header */}
                  <div className="grid grid-cols-1 md:grid-cols-4 border-t border-l border-r border-dashed border-[#333]">
                    <div className="hidden md:flex items-center px-8 py-6 border-b md:border-r border-dashed border-[#333]">
                      <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8C7BA] uppercase">What Matters</span>
                    </div>
                    <div className="flex flex-col justify-center px-8 py-6 border-b md:border-r border-dashed border-[#333] relative">
                      <div className="absolute top-4 right-4 flex items-center">
                        <span className="text-[9px] font-bold tracking-[0.2em] text-[#75bf00] uppercase">Recommended</span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm">
                          <DhyraLogo size={28} />
                        </div>
                        <span className="text-[28px] font-medium text-[#F0EFE2]">Dhyra</span>
                      </div>
                      <p className="text-[#C8C7BA] text-[20px]">Fast path with model control and export.</p>
                    </div>
                    <div className="flex flex-col justify-center px-8 py-6 border-b md:border-r border-dashed border-[#333]">
                      <div className="flex items-center gap-3 mb-2">
                        <Key size={28} className="text-[#C8C7BA]" />
                        <span className="text-[28px] font-medium text-[#F0EFE2]">Closed LLM APIs</span>
                      </div>
                      <p className="text-[#C8C7BA] text-[20px]">Per-call, hosted.</p>
                    </div>
                    <div className="flex flex-col justify-center px-8 py-6 border-b border-dashed border-[#333]">
                      <div className="flex items-center gap-3 mb-2">
                        <Cpu size={28} className="text-[#C8C7BA]" />
                        <span className="text-[28px] font-medium text-[#F0EFE2]">DIY self-hosting</span>
                      </div>
                      <p className="text-[#C8C7BA] text-[20px]">Full control, heavy operations.</p>
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="border-l border-r border-b border-dashed border-[#333]">
                    {COMPARISON_ROWS.map((row, idx) => (
                      <div key={idx} className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200">
                        <div className="flex items-center px-8 py-8 md:border-r border-dashed border-[#333] min-h-[140px]">
                          <div className="flex items-center gap-3">
                            <span className="text-[#75bf00] font-mono text-[16px] font-bold">{row.num}</span>
                            <span className="text-[24px] font-medium text-[#F0EFE2]">{row.label}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-center px-8 py-8 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                          <h4 className="text-[24px] font-medium text-[#75bf00] mb-2">{row.runInfra.title}</h4>
                          <p className="text-[#C8C7BA] text-[20px] leading-relaxed">{row.runInfra.desc}</p>
                        </div>

                        <div className="flex flex-col justify-center px-8 py-8 md:border-r border-dashed border-[#333]">
                          <h4 className="text-[24px] font-medium text-[#F0EFE2] mb-2">{row.closed.title}</h4>
                          <p className="text-[#C8C7BA] text-[20px] leading-relaxed">{row.closed.desc}</p>
                        </div>

                        <div className="flex flex-col justify-center px-8 py-8">
                          <h4 className="text-[24px] font-medium text-[#F0EFE2] mb-2">{row.diy.title}</h4>
                          <p className="text-[#C8C7BA] text-[20px] leading-relaxed">{row.diy.desc}</p>
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
          {/* Heading for Sandbox */}
          <div className="w-full grid grid-cols-[14%_72%_14%] pt-16 mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-5xl lg:text-[52px] font-medium tracking-tight mb-6">
                  Code you own. <span className="text-[#75bf00]">Deploy anywhere.</span>
                </h2>
                <p className="text-[#999999] text-[18px] max-w-2xl mx-auto leading-relaxed">
                  The full recipe ships with you. Codebase, kernels, engine config, weights. Run it anywhere.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Top Horizontal Border spanning full screen */}
          <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-[#333] z-20" />

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">



            {/* Sandbox Content Container (SVG Skeleton Architecture) */}
            <div className="w-full relative mx-auto max-w-[1351px]" style={{ aspectRatio: '1351 / 892' }}>

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
                    <div className="bg-[#1a1a1a] border border-[#252525] p-5 rounded-[4px]">
                      <p className="text-[#C8C7BA] text-[13px] font-medium mb-1 leading-[26px]">
                        Synthesize a 10k Q&A dataset from our internal docs using
                        <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] align-middle mx-1"><MetaLogo size={11} /> Llama-3.1-405B</span>
                        as a generator. Filter low-quality generations with a reward model, then kick off a LoRA fine-tune on
                        <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] align-middle mx-1"><MetaLogo size={11} /> Llama-3.1-8B</span>
                        using a single
                        <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] align-middle mx-1 text-[#75bf00]"><NvidiaLogo size={11} /> H100</span>.
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Parsed raw domain corpus</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.4s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Cleaned markdown and chunked into context windows</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Synthesizing instruction pairs</span>
                            <span className="text-[#C8C7BA] text-[12px]">18.2s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">405B generator producing diverse edge cases</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Reward model filtering</span>
                            <span className="text-[#C8C7BA] text-[12px]">4.1s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Discarded 12% low-quality samples</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Running LoRA fine-tune</span>
                            <span className="text-[#C8C7BA] text-[12px]">12m 45s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">3 dhyras, lr=2e-4 on 1x H100</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Ran tuned model vs generator eval</span>
                            <span className="text-[#C8C7BA] text-[12px]">12.5s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">Tuned 8B matches Generator 405B 87% of time</span>
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
                        placeholder="Teach the agent to optimize for specific reward criteria..."
                        className="bg-transparent text-[#F0EFE2] text-[13px] border-none outline-none w-full px-2 py-2"
                        readOnly
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="flex gap-1.5">
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@Capabilities</span>
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@Outcomes</span>
                          
                        </div>
                        <button className="w-6 h-6 bg-[#75bf00] hover:bg-[#85cf00] transition-colors flex items-center justify-center text-black font-bold rounded-sm">
                          <ArrowUp size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files Content */}
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-6 flex flex-col gap-4 overflow-y-auto pointer-events-auto thin-hover-scrollbar">
                  <div className="flex justify-between items-center border-b border-[#252525] pb-3 mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase">DATA ADAPTERS</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">3</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-[13px] font-mono">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                      scrape_notion.py
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                      pull_slack.py
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                      github_issues.py
                    </div>

                    {/* Project Tree Folder */}
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[#aaa] font-semibold">
                        <ChevronDown size={14} className="text-[#777]" /> dhyra-data-factory/
                      </div>
                      <div className="pl-4 flex flex-col gap-1.5 border-l border-[#252525] ml-3.5 mt-1">
                        <button
                          onClick={() => selectFileManually("synthesize.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "synthesize.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          synthesize.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("eval.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "eval.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          eval.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("train.sh")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "train.sh" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          train.sh
                        </button>
                        <button 
                          onClick={() => selectFileManually("pipeline.json")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "pipeline.json" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          pipeline.json
                        </button>
                        <button 
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          Dockerfile
                        </button>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          docker-compose.yml
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          requirements.txt
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          <ChevronRight size={14} className="text-[#333]" /> corpus/
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          <ChevronRight size={14} className="text-[#333]" /> evals/
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          README.md
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-y-auto pointer-events-auto thin-hover-scrollbar">
                  {/* Editor top tabs */}
                  <div className="flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                    <button
                      onClick={() => selectFileManually("synthesize.py")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "synthesize.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      synthesize.py
                    </button>
                    <button
                      onClick={() => selectFileManually("eval.py")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "eval.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      eval.py
                    </button>
                    <button
                      onClick={() => selectFileManually("train.sh")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "train.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      train.sh
                    </button>
                    <button
                      onClick={() => selectFileManually("pipeline.json")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      pipeline.json
                    </button>
                    <button
                      onClick={() => selectFileManually("Dockerfile")}
                      className={`text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "Dockerfile" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      Dockerfile
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

          {/* Features Grid Row */}
          <div className="w-full relative z-10">
            {/* Line 3: Infinite Horizontal Border at bottom of Features Grid */}
            <div className="absolute bottom-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />



            {/* Feature Cards aligned with vertical grid lines */}
            <div className="w-full grid grid-cols-[14%_72%_14%] relative z-10">
              <div />
              {/* Added top horizontal line per user request */}
              <div className="absolute top-0 left-[14%] right-[14%] h-px border-t border-dashed border-[#333] z-20" />

              <div className="min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cloud size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">Managed Dhyra</h3>
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

          {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-24 pb-16">
            <div className="absolute top-0 left-0 w-full h-px border-t border-dashed border-[#333]" />
            <div className="w-full grid grid-cols-[14%_72%_14%]">
              <div />
              <div className="flex flex-col items-center">
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#F0EFE2] mb-4 text-center">
                  Any HF generator or target model works
                </h2>
                <p className="text-[#C8C7BA] text-[15px] font-mono leading-relaxed text-center max-w-2xl mb-12">
                  Use any open-weights frontier model as your synthetic data engine, and fine-tune any compact target model. The examples below are just a starting view.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-2xl mb-16 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#C8C7BA]">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any generative model on Hugging Face"
                    className="w-full bg-[#1a1a1a] border border-dashed border-[#333] text-[#C8C7BA] text-[15px] pl-11 pr-14 py-3.5 rounded-[4px] outline-none focus:border-[#555] transition-colors font-sans placeholder:text-[#666]"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-[10px] font-bold text-[#C8C7BA] border border-dashed border-[#333] px-1.5 py-0.5 rounded-sm">HF</span>
                  </div>
                </div>

                {/* Models Grid */}
                <div className="w-full border-t border-dashed border-[#333]">
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
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 border border-[#333] border-dashed rounded-sm flex items-center justify-center">
                              {getLogo(model.author, model.name)}
                            </div>
                            <span className="text-[#C8C7BA] text-[15px] font-medium tracking-wide">{model.author}</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <h3 className="text-[20px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>{model.name}</h3>
                            <p className="text-[#888] text-[14px] leading-relaxed line-clamp-2" title={model.description}>{model.description || model.downloads}</p>
                          </div>
                          <div className="flex justify-start items-center mt-auto pt-6">
                            <span className="text-[#75bf00] text-[12px] font-medium border border-[#2a381a] bg-[#1a2310] px-2.5 py-1 rounded-sm tracking-wide">{model.role || model.tag}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Bottom Horizontal Border */}
                  <div className="w-full h-px border-t border-dashed border-[#333]" />
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Tuning Section */}
        <div className="w-full relative z-10 mt-32">
          {/* Heading */}
          <div className="w-full grid grid-cols-[14%_72%_14%]">
            <div />
            <div className="min-w-0">
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4 text-center">
                  What Dhyra tunes
                </h2>
                <p className="text-[#C8C7BA] text-[20px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  Every stage of the pipeline, retuned per model and GPU.
                </p>

                {/* Tunes Grid */}
                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Row 1 */}
                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Synthesis prompts</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        System prompts for data generation models are auto-tuned to generate maximum diversity and edge cases.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Reward functions</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        LLM-as-a-judge criteria is continually refined to align synthetic data with your exact product needs.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Hyperparameters</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        LoRA rank, alpha, learning rate schedules, and batch sizes are profiled per-model.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Eval harness</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Built-in comparative eval between the base model, the fine-tuned production model, and the frontier data generator.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Model compilation</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Weights are quantized (AWQ/GPTQ) and compiled for TensorRT-LLM or vLLM automatically.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Workflow size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Active learning loops</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Production logs stream back to generate targeted synthetic patches for failing queries.
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
            <div className="absolute top-0 left-0 w-full h-px border-t border-dashed border-[#333]" />
            <div className="w-full grid grid-cols-[14%_72%_14%]">
              <div className="border-r border-dashed border-[#333]" />
              <div className="flex flex-col items-center">
                <h2 className="text-[56px] md:text-[64px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
                  Try this pipeline
                </h2>
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
            <div className="absolute bottom-0 left-0 w-full h-px border-t border-dashed border-[#333]" />
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
                <DhyraLogo size={20} />
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
            {/* Inner Vertical Lines matching the 14% columns */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="hidden md:block absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
              <div className="hidden md:block absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
            </div>

            {/* Faint Blueprint Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 z-0 bg-[position:14%_top]" />

            {/* Container for precise 72% alignment */}
            <div className="w-full grid grid-cols-[14%_72%_14%] absolute inset-0 pointer-events-none z-0">
              <div />
              <div className="relative">

                {/* Floating Brand Cubes - Left Cluster */}
                <div className="hidden md:flex absolute top-[48px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><DeepSeekLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[96px] left-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MetaLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[96px] left-[144px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><NvidiaLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[144px] left-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><GoogleLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[192px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MistralLogo size={20} /></div>

                {/* Floating Brand Cubes - Right Cluster */}
                <div className="hidden md:flex absolute bottom-[240px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><SGLangLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[192px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><DeepSeekLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[144px] right-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><QwenLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[144px] right-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MetaLogo size={20} /></div>
                <div className="hidden md:flex absolute bottom-[96px] right-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MistralLogo size={20} /></div>
              </div>
              <div />
            </div>

            <div className="relative z-20 flex flex-col items-center text-center max-w-4xl px-4 mt-8 pointer-events-auto">
              <div className="mb-12">
                <DhyraLogo size={40} />
              </div>

              <h2 className="text-[48px] md:text-[64px] leading-[1.1] font-medium tracking-tight text-[#F0EFE2] mb-8">
                Deploy your first optimized<br className="hidden md:block" />
                model, <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">measured</span> before you<br className="hidden md:block" />
                ship
              </h2>

              <p className="text-[#a0a0a0] text-[18px] md:text-[20px] font-sans mb-12">
                Describe the goal. Dhyra builds and optimizes the stack.
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
          {/* --- FOOTER SECTION WRAPPER --- */}
          <div className="w-full relative bg-[#151515] z-10 flex flex-col items-center">

            {/* Inner Vertical Lines extending through the footer */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="hidden md:block absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
              <div className="hidden md:block absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
            </div>

            {/* --- DIVIDER --- */}
            <div className="w-full relative flex items-center justify-center my-8 z-10 overflow-hidden" style={{ height: "38px" }}>
              {/* Custom SVG 5-Line Divider from User */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="paint0_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#75BF00" />
                    <stop offset="0.480769" stopColor="#333333" />
                  </linearGradient>
                  <linearGradient id="paint1_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0.110577" stopColor="#333333" />
                    <stop offset="0.586538" stopColor="#75BF00" />
                    <stop offset="1" stopColor="#333333" />
                  </linearGradient>
                  <linearGradient id="paint2_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0.423077" stopColor="#333333" />
                    <stop offset="0.942308" stopColor="#75BF00" />
                    <stop offset="1" stopColor="#333333" />
                  </linearGradient>
                  <linearGradient id="paint3_linear_55_3" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#75BF00" />
                    <stop offset="1" stopColor="#333333" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="url(#paint0_linear_55_3)" strokeDasharray="3 3" />
                <line x1="0" y1="8.5" x2="100%" y2="8.5" stroke="url(#paint1_linear_55_3)" strokeDasharray="3 3" />
                <line x1="0" y1="16.5" x2="100%" y2="16.5" stroke="#333333" strokeDasharray="3 3" />
                <line x1="0" y1="24.5" x2="100%" y2="24.5" stroke="url(#paint2_linear_55_3)" strokeDasharray="3 3" />
                <line x1="0" y1="32.5" x2="100%" y2="32.5" stroke="url(#paint3_linear_55_3)" strokeDasharray="3 3" />
              </svg>
              {/* Center Logo Cutout */}
              <div className="bg-[#151515] px-4 py-2 text-[#F0EFE2] relative z-20 flex items-center justify-center">
                <DhyraLogo size={25} />
              </div>
            </div>

            {/* --- FOOTER CONTENT --- */}
            <div className="w-[88%] md:w-[72%] mx-auto py-16 flex flex-col relative z-10">
              {/* Top Footer Row */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-0 pb-16 px-8 lg:px-12">
                {/* Left Column */}
                <div className="flex flex-col">
                  <div className="mb-2 text-[#F0EFE2]">
                    <DhyraWordmarkLogo className="h-[24px] w-auto" />
                  </div>
                  <p className="text-[#63625C] text-[15px] mb-6 font-medium">© 2026 dhyraInfra. All rights reserved.</p>

                  {/* Social Icons */}
                  <div className="flex items-center gap-4 mb-8 text-[#C8C7BA]">
                    <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="GitHub">
                      <GithubLogo size={18} />
                    </a>
                    <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="X (Twitter)">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                      </svg>
                    </a>
                    <a href="#" className="hover:text-[#F0EFE2] transition-colors" aria-label="LinkedIn">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-[#222] hover:bg-[#2a2a2a] text-[#C8C7BA] px-3.5 py-2 rounded-[6px] transition-colors border border-[#333]">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                      <span className="text-[12px] font-medium tracking-tight">Join the community</span>
                    </button>
                    <button className="flex items-center gap-2 bg-[#222] hover:bg-[#2a2a2a] text-[#C8C7BA] px-3.5 py-2 rounded-[6px] transition-colors border border-[#333]">
                      <div className="w-1.5 h-1.5 bg-[#75bf00] rounded-full" />
                      <span className="text-[12px] font-medium tracking-tight">System status</span>
                    </button>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col items-end">
                  {/* Nav Links */}
                  <div className="flex flex-col items-end gap-3 mb-10 w-full">
                    <div className="flex items-center gap-x-6">
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Intelligence Agent</a>
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Capability Fabric</a>
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Pricing</a>
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Enterprise</a>
                    </div>
                    <div className="flex items-center gap-x-6">
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Benchmarks</a>
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Docs</a>
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Research</a>
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">News</a>
                      <a href="#" className="text-[#C8C7BA] hover:text-[#F0EFE2] text-[13px] font-medium transition-colors">Contact</a>
                    </div>
                  </div>

                  {/* Ask AI about Dhyra */}
                  <div className="flex flex-col items-end">
                    <span className="text-[#F0EFE2] font-bold text-[11px] mb-3">Ask AI about Dhyra</span>
                    <div className="flex items-center gap-4 text-[#C8C7BA]">
                      <OpenAILogo size={18} className="text-[#00a67e] hover:brightness-125 transition-all cursor-pointer" />
                      <AnthropicLogo size={18} className="text-[#d97757] hover:brightness-125 transition-all cursor-pointer" />
                      <GoogleLogo size={18} className="text-[#4285f4] hover:brightness-125 transition-all cursor-pointer" />
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors cursor-pointer">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                      </svg>
                      <div className="w-[18px] h-[18px] border-[1.5px] border-current rounded-full flex items-center justify-center text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors cursor-pointer">
                        <div className="w-1.5 h-1.5 bg-current rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Legal / Theme Row */}
            <div className="w-full border-t border-dashed border-[#333] relative">
              {/* Tiny DHYRA text aligned to the left of the 14% grid line */}
              <div className="absolute top-1/2 -translate-y-1/2 right-[86%] mr-6 text-[#555] text-[9px] font-bold tracking-[0.2em] z-10 hidden md:block">DHYRA</div>

              <div className="w-[88%] md:w-[72%] mx-auto py-4 px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center relative z-10">
                <div className="flex flex-wrap items-center gap-5 text-[11px] font-medium text-[#777] mb-4 md:mb-0">
                  <span className="flex items-center gap-1.5 text-[#F0EFE2] font-bold mr-12"><DhyraLogo size={12} /> Part of  causis</span>
                  <a href="#" className="hover:text-[#F0EFE2] transition-colors">Security</a>
                  <a href="#" className="hover:text-[#F0EFE2] transition-colors">DPA</a>
                  <a href="#" className="hover:text-[#F0EFE2] transition-colors">AUP</a>
                  <a href="#" className="hover:text-[#F0EFE2] transition-colors">Cookies</a>
                  <a href="#" className="hover:text-[#F0EFE2] transition-colors">Terms</a>
                  <a href="#" className="hover:text-[#F0EFE2] transition-colors">Privacy</a>
                </div>

                <div className="flex items-center gap-2 text-[#666]">
                  <button className="p-1.5 rounded-[6px] hover:text-[#F0EFE2] hover:bg-[#222] transition-colors">
                    <Sun size={15} />
                  </button>
                  <button className="p-1.5 rounded-[6px] bg-[#1a1a1a] text-[#F0EFE2] border border-[#333] transition-colors">
                    <Monitor size={15} />
                  </button>
                  <button className="p-1.5 rounded-[6px] hover:text-[#F0EFE2] hover:bg-[#222] transition-colors">
                    <Moon size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


