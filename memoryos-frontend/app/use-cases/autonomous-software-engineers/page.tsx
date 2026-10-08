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
    label: "Launch",
    runInfra: { title: "Deploy autonomous SWE agents", desc: "Launch repo-wide coding agents that parse issues and write code." },
    closed: { title: "Basic code completion", desc: "Line-by-line copilot suggestions without repo-level context." },
    diy: { title: "Build prompt chains", desc: "Spend months stitching OpenAI API prompts and git webhooks." }
  },
  {
    num: "0 2",
    label: "Codebase Context",
    runInfra: { title: "Repo-wide AST & graph indexing", desc: "Parse tree-sitter symbols, imports, and cross-module calls." },
    closed: { title: "Truncated file buffer", desc: "Limited context window missing related dependencies." },
    diy: { title: "Manual prompt concatenation", desc: "High token consumption with missing function definitions." }
  },
  {
    num: "0 3",
    label: "Verification",
    runInfra: { title: "Automated test & lint execution", desc: "Executes unit tests in isolated sandboxes before committing." },
    closed: { title: "No execution capabilities", desc: "Generates hallucinated code that breaks on compilation." },
    diy: { title: "Unchecked script execution", desc: "Risk of broken builds and unhandled test regressions." }
  },
  {
    num: "0 4",
    label: "Model Control",
    runInfra: { title: "Fine-tuned code LLMs", desc: "Deploy domain-adapted DeepSeek-Coder, Qwen-Coder, and Llama." },
    closed: { title: "Locked to vendor API defaults", desc: "Rigid closed models with no custom codebase fine-tuning." },
    diy: { title: "Prompt-only tuning", desc: "Inability to tune model weights for internal SDKs and conventions." }
  },
  {
    num: "0 5",
    label: "Operations",
    runInfra: { title: "Autonomous PR & issue loops", desc: "Automate bug triage, patch generation, and pull request creation." },
    closed: { title: "High developer toil", desc: "Engineers spend hours manually reviewing and fixing suggestions." },
    diy: { title: "High operational overhead", desc: "Your team owns agent maintenance, prompt drift, and updates." }
  },
  {
    num: "0 6",
    label: "Security",
    runInfra: { title: "SOC 2 Type II & On-Prem", desc: "Zero code retention with air-gapped VPC execution options." },
    closed: { title: "Varies by vendor", desc: "Proprietary code telemetry uploaded to third-party cloud." },
    diy: { title: "Self-managed security", desc: "Your team owns access controls, secrets scanning, and audits." }
  }
];

const AGENT_CODE = `# Autonomous Software Engineer Agent for Repository Issue Resolution
import os
from dhyra_swe import AutonomousSWEAgent, CodebaseGraph

# Initialize coding agent with tree-sitter codebase indexing
agent = AutonomousSWEAgent.from_pretrained("Qwen/Qwen2.5-Coder-32B-Instruct")
graph = CodebaseGraph.index_repository(path="./core-platform", language="python")

def resolve_github_issue(issue_description: str) -> dict:
    """Parse issue thread, locate bug in AST graph, and generate verified PR."""
    
    # Locate relevant symbols and call graphs
    relevant_files = graph.search_symbols(issue_description)
    
    # Generate bug fix candidate with test suite
    patch = agent.generate_patch(
        issue=issue_description, 
        context=relevant_files
    )
    
    # Run test suite inside isolated Docker sandbox
    test_results = agent.run_sandbox_tests(patch, command="pytest tests/")
    
    if test_results.passed:
        return agent.create_pull_request(patch, title=f"Fix: {issue_description[:40]}")
    else:
        # Self-correct code based on test output
        refined_patch = agent.self_correct(patch, test_results.error_log)
        return agent.create_pull_request(refined_patch)
        
    return None`;

const RUN_SWE_CODE = `#!/usr/bin/env bash
# Autonomous SWE Agent execution pipeline
set -euo pipefail
 
REPO_NAME="org/core-platform"
ISSUE_ID="142"

# Execute autonomous bug resolution in isolated container
dhyra-swe-agent resolve \\
  --repo $REPO_NAME \\
  --issue $ISSUE_ID \\
  --model Qwen/Qwen2.5-Coder-32B-Instruct \\
  --sandbox docker \\
  --run-tests enabled \\
  --output-pr ./pr_summary.json`;

const PIPELINE_CODE = `{
  "name": "autonomous-software-engineers",
  "agent": "swe-agent-v3",
  "model": "Qwen2.5-Coder-32B-Instruct",
  "codebase": {
    "ast_parser": "tree-sitter",
    "indexing": "vector-graph",
    "languages": ["python", "typescript", "go"]
  },
  "sandbox": "docker-isolated",
  "swe_bench_eval": true,
  "auto_create_pr": true
}`;

const DOCKERFILE_CODE = `FROM ubuntu:22.04 AS base
 
RUN apt-get update && apt-get install -y python3.11 python3-pip git nodejs golang
 
WORKDIR /workspace
COPY requirements.txt .
RUN pip install -r requirements.txt
 
COPY agent/ /workspace/agent/
COPY agent.py run_swe.sh pipeline.json .
 
EXPOSE 8080
ENTRYPOINT ["/workspace/run_swe.sh"]`;

const EVAL_CODE = `# Evaluation harness: measuring SWE-bench resolution rate and test pass rate
from dhyra_eval import SWEBenchEvaluator, CodeQualityGate

def evaluate_patch_quality(original_repo: str, patch_diff: str) -> dict:
    """Verify coding agent accuracy against SWE-bench criteria."""
    
    evaluator = SWEBenchEvaluator()
    quality = CodeQualityGate(strict_linter=True)
    
    # Run AST linting and static analysis
    lint_passed = quality.verify_ast(patch_diff)
    
    # Run SWE-bench test resolution evaluation
    swe_score = evaluator.score_resolution(original_repo, patch_diff)
    
    return {
        "ast_lint_passed": lint_passed,
        "swe_bench_resolved": swe_score.passed,
        "regression_risk": swe_score.regression_delta
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
  { id: "Qwen/Qwen2.5-Coder-32B-Instruct", name: "Qwen2.5 Coder 32B", author: "Qwen", description: "State-of-the-art open coding LLM with repository-level code reasoning.", role: "Code LLM" },
  { id: "deepseek-ai/DeepSeek-Coder-V2-Instruct", name: "DeepSeek Coder V2", author: "DeepSeek", description: "Deep reasoning engine tailored for complex multi-file bug fixes and refactoring.", role: "SWE Agent" },
  { id: "meta-llama/Llama-3.2-11B-Vision-Instruct", name: "Llama 3.2 Multimodal SWE", author: "Meta", description: "Multimodal software engineering agent capable of parsing UI mockups and code.", role: "Multimodal SWE" },
  { id: "bigcode/starcoder2-15b", name: "StarCoder2 15B", author: "BigCode", description: "Open-weights code generator trained across 80+ programming languages.", role: "Code Generator" },
  { id: "mistralai/Codestral-22B-v0.1", name: "Codestral 22B", author: "Mistral", description: "Ultra-fast code completion and middle-out fill model for large codebases.", role: "Code LLM" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet (SWE)", author: "Anthropic", description: "Frontier autonomous coding model leading SWE-bench resolution benchmarks.", role: "SWE Agent" },
  { id: "microsoft/phi-3-mini-4k-instruct", name: "Phi-3 Mini Coder", author: "Microsoft", description: "Compact low-latency coding model for fast local syntax checking and generation.", role: "Fast Coder" },
  { id: "google/codegemma-7b-it", name: "CodeGemma 7B", author: "Google", description: "Lightweight code model optimized for intelligent completion and unit test creation.", role: "Code Model" },
  { id: "huggingface/swe-agent-7b", name: "SWE Agent 7B", author: "HuggingFace", description: "Autonomous GitHub issue solver fine-tuned on SWE-bench trajectories.", role: "SWE Agent" }
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

  if (a.includes('github') || m.includes('copilot') || m.includes('swe')) return <GithubLogo size={20} />;
  if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('nvidia') || m.includes('nvfp4')) return <NvidiaLogo size={20} />;
  if (a.includes('google') || m.includes('gemini') || m.includes('gemma')) return <GoogleLogo size={20} />;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('mistral') || m.includes('codestral')) return <MistralLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
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
    question: "How do Autonomous Software Engineers safely test and verify code?",
    answer: "Dhyra executes all agent-generated patches in isolated Docker sandboxes using your existing test suites (pytest, go test, npm test) and AST linters before creating pull requests.",
  },
  {
    question: "Can the agent index large enterprise monorepos and custom SDKs?",
    answer: "Yes. Native support for tree-sitter AST parsing and vector graph indexing enables instant code search and cross-module dependency understanding across millions of lines of code.",
  },
  {
    question: "Can I export fine-tuned coding models to run in my private cloud or on-premise?",
    answer: "Yes! All fine-tuned code LLM weights and runtime containers can be exported as GGUF or TensorRT binaries and deployed completely inside your private VPC.",
  }
];

export default function AutonomousSoftwareEngineersPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("agent.py" as any);
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "agent.py": AGENT_CODE,
    "eval.py": EVAL_CODE,
    "run_swe.sh": RUN_SWE_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE
  };

  const AGENT_MSG_1 = "On it. I'll clone org/core-platform, search tree-sitter AST index for memory leak sources, write a reproduction unit test, and generate the code patch.";
  const AGENT_MSG_2 = "Issue resolved. Fixed unclosed socket connection in pool_manager.go. All 142 unit tests passed. PR #892 opened with verified benchmark score.";

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

            let tag = "Code Model";
            let description = m.downloads ? `${dl} - Code generation target` : "Code generation target";
            
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
                <div className="flex flex-col gap-6 max-w-lg">
                  <h1 className="text-5xl lg:text-[64px] font-medium tracking-tight leading-[1.1] mt-[-1rem]">
                    Autonomous &<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      Software Engineers
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[17px] tracking-wide max-w-md mt-2">
                    Agents that autonomously write and test code.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Deploy this agent <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Read the stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Pull Requests"
                    label2="Code Audits"
                    label3="CI/CD Builds"
                    label4="Bug Fixes"
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
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4">Own your autonomous coding pipeline</h2>
                <p className="text-[#C8C7BA] text-[20px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  The SWE-bench harness, the code reasoning models, the automated PR playbooks. Complete sovereignty over software generation.
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
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The coding<br/>agents.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the autonomous SWE models, AST parsers, and prompt architectures. No vendor lock-in on your software generation.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 2</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The test<br/>validators.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the execution sandboxes, unit test rubrics, and AST linters. Instant code verification when patches are generated.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 3</div>
                    <h3 className="text-4xl font-medium text-[#F0EFE2] leading-tight">The fine-tuned<br/>weights.</h3>
                    <p className="text-[#C8C7BA] text-[20px] leading-relaxed">
                      You own the fine-tuned code LLM weights (Qwen-Coder, DeepSeek-Coder) and compiled containers. Export and run anywhere securely.
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
              Three ways to build autonomous coding agents
            </h2>
            <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed text-center max-w-2xl">
              Workflow comparison for AI software engineers across Dhyra, closed copilot APIs, and DIY scripts.
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
                  <div className="hidden md:flex items-center px-8 py-6 border-b md:border-r border-dashed border-[#333]">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8C7BA] uppercase">What Matters</span>
                  </div>
                  <div className="flex flex-col justify-center px-8 py-6 border-b md:border-r border-dashed border-[#333] relative">
                    <div className="absolute top-4 right-4 flex items-center">
                      <span className="text-[9px] font-bold tracking-[0.2em] text-[#75bf00] uppercase">Recommended</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm">
                        <HorosLogo size={28} />
                      </div>
                      <span className="text-[28px] font-medium text-[#F0EFE2]">Dhyra</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[20px]">Autonomous SWE & sandbox verification.</p>
                  </div>
                  <div className="flex flex-col justify-center px-8 py-6 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={28} className="text-[#C8C7BA]" />
                      <span className="text-[28px] font-medium text-[#F0EFE2]">Closed Copilot APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[20px]">Inline code autocomplete.</p>
                  </div>
                  <div className="flex flex-col justify-center px-8 py-6 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={28} className="text-[#C8C7BA]" />
                      <span className="text-[28px] font-medium text-[#F0EFE2]">DIY Prompt Scripts</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[20px]">Brittle, manual prompt chaining.</p>
                  </div>
                </div>

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
          {/* Top Divider for Sandbox Section */}
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-16 mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-5xl lg:text-[52px] font-medium tracking-tight mb-6">
                  SWE agents you own. <span className="text-[#75bf00]">Autonomously code anywhere.</span>
                </h2>
                <p className="text-[#999999] text-[18px] max-w-2xl mx-auto leading-relaxed">
                  The full recipe ships with you. AST parsers, code models, sandbox harnesses, and model weights. Run it anywhere.
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
                      <p className="text-[#C8C7BA] text-[13px] font-medium mb-1 leading-[28px]">
                        Resolve GitHub issue #142 in{" "}
                        <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-2 py-0.5 rounded text-[#C8C7BA] align-middle font-mono text-[12px]">
                          <GithubLogo size={11} /> org/core-platform
                        </span>{" "}
                        run unit test suite with{" "}
                        <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-2 py-0.5 rounded text-[#C8C7BA] align-middle font-mono text-[12px]">
                          <QwenLogo size={11} /> Qwen2.5-Coder-32B (4x A100 GPU)
                        </span>{" "}
                        and open verified PR on{" "}
                        <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-2 py-0.5 rounded text-[#75bf00] align-middle font-mono text-[12px]">
                          <MetaLogo size={11} /> SWE Sandbox
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Indexing codebase AST & symbols</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.2s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Parsed 1,420 files with tree-sitter symbol graph</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Locating memory leak root cause</span>
                            <span className="text-[#C8C7BA] text-[12px]">3.5s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">Isolated unclosed socket in pool_manager.go:L142</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Generating unit test reproduce case</span>
                            <span className="text-[#C8C7BA] text-[12px]">7.1s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">TestPoolMemoryLeak failed as expected</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Applying code patch & compiling AST</span>
                            <span className="text-[#C8C7BA] text-[12px]">14.2s</span>
                          </div>
                          <span className="text-[#666] text-[12px]">Zero syntax or compilation errors</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Running test suite in sandbox</span>
                            <span className="text-[#C8C7BA] text-[12px]">22.8s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px]">142/142 unit tests passed. PR #892 ready</span>
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
                        placeholder="Teach the agent to follow your team's code review guidelines..."
                        className="bg-transparent text-[#F0EFE2] text-[13px] border-none outline-none w-full px-2 py-2"
                        readOnly
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="flex gap-1.5">
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@Capabilities</span>
                          <span className="bg-[#222] border border-[#333] text-[9px] text-[#C8C7BA] font-bold px-2 py-0.5 rounded-sm">@CodeStyle</span>
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
                    <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase">SWE ENGINES</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">3</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-[13px] font-mono">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                      ast_indexer.py
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                      code_solver.py
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                      pr_generator.py
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[#aaa] font-semibold">
                        <ChevronDown size={14} className="text-[#777]" /> swe-agent-factory/
                      </div>
                      <div className="pl-4 flex flex-col gap-1.5 border-l border-[#252525] ml-3.5 mt-1">
                        <button
                          onClick={() => selectFileManually("agent.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "agent.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          agent.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("eval.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "eval.py" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          eval.py
                        </button>
                        <button 
                          onClick={() => selectFileManually("run_swe.sh")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "run_swe.sh" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                        >
                          run_swe.sh
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar">
                  <div className="flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                    <button
                      onClick={() => selectFileManually("agent.py")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "agent.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      agent.py
                    </button>
                    <button
                      onClick={() => selectFileManually("eval.py")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "eval.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      eval.py
                    </button>
                    <button
                      onClick={() => selectFileManually("run_swe.sh")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "run_swe.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      run_swe.sh
                    </button>
                    <button
                      onClick={() => selectFileManually("pipeline.json")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      pipeline.json
                    </button>
                    <button
                      onClick={() => selectFileManually("Dockerfile")}
                      className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors shrink-0 ${activeFile === "Dockerfile" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                    >
                      Dockerfile
                    </button>
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
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Codebase Index</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Tree-sitter AST symbol graphs operating directly across millions of lines of code.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Reasoning Weights</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Self-host the fine-tuned coding models (Qwen-Coder, DeepSeek-Coder) in your own cloud. Full IP privacy.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-8 py-16 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-medium text-[#F0EFE2]">The Test Sandboxes</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Execute automated pytest and AST linter suites inside sandboxed Docker containers before opening PRs.
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
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#F0EFE2] mb-4 text-center">
                  Any code generator or SWE model works
                </h2>
                <p className="text-[#C8C7BA] text-[15px] font-mono leading-relaxed text-center max-w-2xl mb-12">
                  Use any open-weights coding model as your SWE engine, and fine-tune any specialized target model. The examples below are just a starting view.
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
                    placeholder="Search any coding or SWE model on Hugging Face"
                    className="w-full bg-[#1a1a1a] border border-dashed border-[#333] text-[#C8C7BA] text-[15px] pl-11 pr-14 py-3.5 rounded-[4px] outline-none focus:border-[#555] transition-colors font-sans placeholder:text-[#666]"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-[10px] font-bold text-[#C8C7BA] border border-dashed border-[#333] px-1.5 py-0.5 rounded-sm">HF</span>
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
                          
                          <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center mb-8">
                            {getLogo(model.author, model.name)}
                          </div>
                          
                          <div className="flex flex-col gap-1.5 mb-8">
                            <h3 className="text-[22px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>
                              {model.name}
                            </h3>
                            <span className="text-[#C8C7BA] text-[15px] font-medium tracking-wide">
                              {model.author}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-auto pt-2">
                            <span className="text-[#F0EFE2] text-[16px] font-medium"></span>
                            <span className="text-[#75bf00] text-[12px] font-medium border border-[#2a381a] bg-[#1a2310] px-2.5 py-1 rounded-sm tracking-wide">
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
          <div className="w-full relative z-10 mt-32">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0">
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4 text-center">
                  What Dhyra tunes
                </h2>
                <p className="text-[#C8C7BA] text-[20px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  Every stage of the pipeline, retuned per model and repository.
                </p>

                <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                  <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                    
                    {/* Row 1 */}
                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <ScanSearch size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Repo AST Indexing</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Tune tree-sitter symbol graphs for instant retrieval of relevant function definitions and interfaces.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Zap size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Multi-File Reasoning</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Correlate cross-module calls and type signatures to generate multi-file PR diffs without breaking changes.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Sliders size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Sandboxed Test Execution</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Profile isolated Docker test harnesses to execute pytest/go test suites and verify patch stability.
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Layers size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">SWE-Bench Optimization</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Built-in issue resolution harness benchmarked on real GitHub repositories and complex bug reports.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Database size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Automated PR Generation</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Quantize coding LLM weights (FP8/INT8) and compile for rapid execution. Generates clean git commits in seconds.
                      </p>
                    </div>

                    <div className="px-12 py-20 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                      <div className="text-[#75bf00]">
                        <Workflow size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-3xl font-medium text-[#F0EFE2]">Codebase Fine-Tuning</h3>
                      <p className="text-[#C8C7BA] text-[18px] leading-relaxed">
                        Fine-tune Qwen-Coder and DeepSeek-Coder on your proprietary codebases and internal engineering conventions.
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
                  Edit the model, repository, or agent inline. Send to retune the stack in the dashboard.
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
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="hidden md:block absolute left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
              <div className="hidden md:block absolute left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
               
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 z-0 bg-[position:14%_top]" />

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] absolute inset-0 pointer-events-none z-0">
              <div />
              <div className="relative">
                <div className="hidden md:flex absolute top-[48px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><DeepSeekLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[96px] left-[0px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MetaLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[96px] left-[144px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><NvidiaLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[144px] left-[48px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><GoogleLogo size={20} /></div>
                <div className="hidden md:flex absolute top-[192px] left-[96px] w-[48px] h-[48px] bg-[#1a1a1a] border border-[#333] items-center justify-center z-10"><MistralLogo size={20} /></div>

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
                <HorosLogo size={40} />
              </div>

              <h2 className="text-[48px] md:text-[64px] leading-[1.1] font-medium tracking-tight text-[#F0EFE2] mb-8">
                Deploy your first coding<br className="hidden md:block" />
                agent, <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">measured</span> before you<br className="hidden md:block" />
                ship
              </h2>

              <p className="text-[#a0a0a0] text-[18px] md:text-[20px] font-sans mb-12">
                Describe the task or issue. Dhyra builds and optimizes the SWE stack.
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

