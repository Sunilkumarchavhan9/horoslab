"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo, TeslaLogo, OneXLogo, NousResearchLogo, BrowserUseLogo, XLangLogo, MeituanLogo, SWEBenchLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "System",
    horos: {
      title: "Complete agent lifecycle",
      desc: "Engineer reasoning models, tools, sandbox execution, and verifiers as one unified system."
    },
    closed: {
      title: "Black-box hosted APIs",
      desc: "Consume individual model or agent APIs with fixed reasoning depth and provider-controlled tool calling."
    },
    diy: {
      title: "Fragile glue-code scripts",
      desc: "Stitch together separate prompt templates, Python scripts, vector stores, and fragile API wrappers yourself."
    }
  },
  {
    num: "0 2",
    label: "Models",
    horos: {
      title: "Open-weight reasoning models",
      desc: "Evaluate open-weight models, adapt tool-calling checkpoints, and develop task-specific intelligence."
    },
    closed: {
      title: "Proprietary black-box models",
      desc: "Depend on proprietary models with silent prompt drift and no control over underlying weights."
    },
    diy: {
      title: "Manual model hosting",
      desc: "Select, quantize, and host reasoning models manually across heterogeneous GPU clusters."
    }
  },
  {
    num: "0 3",
    label: "Memory & State",
    horos: {
      title: "Hierarchical episodic memory",
      desc: "Maintain hierarchical context, episodic memory, execution history, and state across long-horizon tasks."
    },
    closed: {
      title: "Stateless context windows",
      desc: "Rely on basic context windows or stateless API calls requiring manual re-injection of session state."
    },
    diy: {
      title: "Custom vector & DB logic",
      desc: "Implement custom database schemas, vector embedding retrieval, and state pruning logic."
    }
  },
  {
    num: "0 4",
    label: "Planning",
    horos: {
      title: "Tree-of-thought exploration",
      desc: "Decompose complex objectives into structured sub-goals with tree-of-thought exploration and backtracking."
    },
    closed: {
      title: "Linear step completions",
      desc: "Generate linear step-by-step completions with limited capacity to explore alternative solutions."
    },
    diy: {
      title: "Heuristic state machines",
      desc: "Handcraft heuristic state machines, graph orchestrators, and prompt chains."
    }
  },
  {
    num: "0 5",
    label: "Tool Execution",
    horos: {
      title: "Sandboxed tool validation",
      desc: "Execute sandboxed tool calls with strict Pydantic schemas, parameter validation, and rate-limit handling."
    },
    closed: {
      title: "Unsandboxed API passthroughs",
      desc: "Pass tool outputs back and forth through external HTTP endpoints without sandbox isolation."
    },
    diy: {
      title: "Custom execution runtimes",
      desc: "Build custom tool execution runtimes, input sanitization, and security sandboxes from scratch."
    }
  },
  {
    num: "0 6",
    label: "Failure Recovery",
    horos: {
      title: "Autonomous self-reflection",
      desc: "Autonomously reflect on tool errors, retry with exponential backoff, adjust arguments, or route to fallbacks."
    },
    closed: {
      title: "Unhandled runtime halts",
      desc: "Halt task execution on tool errors or return unhandled 500 exceptions to the end user."
    },
    diy: {
      title: "Manual try/except heuristics",
      desc: "Write extensive try/except handlers and recovery heuristics for every possible API failure."
    }
  },
  {
    num: "0 7",
    label: "Optimization",
    horos: {
      title: "Full-stack runtime tuning",
      desc: "Tune tool schemas, KV prompt caching, speculative decoding, and routing against speed, cost, and accuracy targets."
    },
    closed: {
      title: "Coarse provider parameters",
      desc: "Tune supported provider parameters like temperature with no control over KV cache or runtime batching."
    },
    diy: {
      title: "Manual latency profiling",
      desc: "Profile inference latencies, token consumption, and system bottlenecks manually."
    }
  },
  {
    num: "0 8",
    label: "Verification",
    horos: {
      title: "Deterministic policy gates",
      desc: "Evaluate actions against deterministic safety policies, financial invariants, loop detectors, and human gates."
    },
    closed: {
      title: "Generic moderation filters",
      desc: "Rely on generic content moderation filters without domain-specific business invariant checks."
    },
    diy: {
      title: "Custom assertion suites",
      desc: "Maintain custom assertion libraries, unit tests, and validation scripts."
    }
  },
  {
    num: "0 9",
    label: "Experience",
    horos: {
      title: "Execution trajectory traces",
      desc: "Preserve execution trajectories, tool call traces, error recovery logs, and measured outcomes for telemetry."
    },
    closed: {
      title: "Fragmented vendor logs",
      desc: "Inspect fragmented request logs in vendor dashboards with limited export and analysis capabilities."
    },
    diy: {
      title: "Custom telemetry pipelines",
      desc: "Build your own trajectory storage, OpenTelemetry pipelines, and debugging visualizers."
    }
  },
  {
    num: "1 0",
    label: "Authority",
    horos: {
      title: "Zero-egress private VPC",
      desc: "Deploy completely on-premise or in private VPCs with strict token budgets, tool whitelists, and zero data egress."
    },
    closed: {
      title: "Third-party cloud exposure",
      desc: "Send sensitive internal workflows and proprietary customer data to third-party cloud infrastructure."
    },
    diy: {
      title: "Manual security controls",
      desc: "Implement access controls, secrets management, budget limits, and audit trails independently."
    }
  }
];

const AGENT_CODE = `# Autonomous Agent Core: Multi-step reasoning, tool execution, and error recovery
import os
from horos_agents import AutonomousAgent, ToolRegistry, MemoryStore, PolicyGate

# Initialize agent reasoning backbone and episodic memory
agent = AutonomousAgent.from_pretrained("Qwen/Qwen2.5-72B-Instruct")
memory = MemoryStore.connect(session_id="recon-session-9042", persist=True)
tools = ToolRegistry.load(config="./tools.json")

def execute_autonomous_task(task_objective: str) -> dict:
    """Decompose objective, execute sandboxed tools, and recover from failures."""
    
    # Generate structured execution plan with fallback strategies
    plan = agent.decompose_plan(
        objective=task_objective,
        available_tools=tools.get_schemas(),
        max_subgoals=5
    )
    
    trajectory = []
    for step in plan.steps:
        # Evaluate safety invariants before calling external tools
        PolicyGate.verify_action(step.action, context=memory.get_context())
        
        # Execute tool with automatic retry and autonomous error recovery
        result = tools.call_with_recovery(
            name=step.action.tool_name,
            arguments=step.action.arguments,
            retry_policy="exponential_backoff_jitter",
            max_retries=3
        )
        
        # Reflect on observation and update hierarchical memory state
        observation = agent.reflect_and_update(step, result, memory)
        trajectory.append({"step": step.id, "status": result.status, "output": observation})
        
        if result.requires_early_termination:
            break
            
    # Verify task completion against ground truth criteria
    return agent.synthesize_final_report(trajectory)`;

const TOOLS_CODE = `# Declarative Tool Schemas and Sandboxed Execution Bounds
from pydantic import BaseModel, Field
from horos_agents import tool, SandboxEnvironment

class PostgresLedgerArgs(BaseModel):
    query: str = Field(..., description="Read-only SQL query for customer ledger reconciliation")
    limit: int = Field(default=1000, le=5000, description="Maximum record limit")

@tool(name="postgres_ledger_query", schema=PostgresLedgerArgs, timeout_sec=15)
def query_ledger(args: PostgresLedgerArgs) -> dict:
    """Execute audited read query against PostgreSQL customer ledger."""
    with SandboxEnvironment.acquire(scope="read_only_db") as sandbox:
        return sandbox.execute_sql(args.query, limit=args.limit)

class StripeChargeArgs(BaseModel):
    charge_id: str = Field(..., description="Stripe charge identifier")
    verify_receipt: bool = Field(default=True)

@tool(name="stripe_charge_verify", schema=StripeChargeArgs, timeout_sec=10)
def verify_stripe_charge(args: StripeChargeArgs) -> dict:
    """Verify charge settlement and receipt traces via Stripe API."""
    with SandboxEnvironment.acquire(scope="billing_api") as sandbox:
        return sandbox.get_charge_event(args.charge_id)`;

const PIPELINE_CODE = `{
  "name": "autonomous-agents-runtime",
  "version": "2.4.0",
  "model": {
    "backbone": "Qwen/Qwen2.5-72B-Instruct",
    "runtime": "vllm-engine",
    "precision": "fp8",
    "max_context_tokens": 32768
  },
  "agent": {
    "planning": "tree_of_thought_with_reflection",
    "max_iterations": 12,
    "loop_prevention": true,
    "memory": {
      "type": "hierarchical_episodic",
      "vector_store": "pgvector_local"
    }
  },
  "guardrails": {
    "require_human_approval_for_write": false,
    "max_cost_per_task_usd": 0.25,
    "disallowed_tools": ["shell_exec_raw", "db_drop_table"]
  }
}`;

const DOCKERFILE_CODE = `FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base

RUN apt-get update && apt-get install -y --no-install-recommends \\
    python3.11 python3-pip curl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py tools.py eval.py pipeline.json .

ENV HOROS_RUNTIME_MODE=production \\
    HOROS_LOG_LEVEL=info

EXPOSE 8080
ENTRYPOINT ["python3", "-m", "horos_agents.serve", "--config", "./pipeline.json"]`;

const EVAL_CODE = `# Agent Benchmark Harness: Measuring tool accuracy, plan depth, and error recovery
from horos_eval import AgentEvaluator, BenchmarkSuite

def evaluate_agent_reliability(agent_checkpoint: str) -> dict:
    """Benchmark autonomous agent across multi-step failure injection scenarios."""
    evaluator = AgentEvaluator(checkpoint=agent_checkpoint)
    suite = BenchmarkSuite.load("agent-bench-v2-finance-ops")
    
    # Measure success rate under simulated API 429s, schema drift, and timeouts
    metrics = evaluator.run_evaluation(
        suite=suite,
        num_trials=250,
        inject_faults=["rate_limit_429", "partial_json_output", "db_timeout"]
    )
    
    return {
        "task_completion_rate": metrics.success_rate,
        "tool_calling_fidelity": metrics.tool_schema_accuracy,
        "autonomous_recovery_rate": metrics.recovery_rate,
        "avg_tokens_per_task": metrics.mean_token_cost
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
  {
    id: "microsoft/MagenticBrain",
    name: "MagenticBrain",
    author: "Microsoft",
    size: "15B",
    downloads: "15B",
    role: "Agent Orchestration",
    tag: "Agent Orchestration",
    hfUrl: "https://huggingface.co/microsoft/MagenticBrain"
  },
  {
    id: "NousResearch/Hermes-4-14B",
    name: "Hermes-4-14B",
    author: "Nous Research",
    size: "14B",
    downloads: "14B",
    role: "Tool Calling",
    tag: "Tool Calling",
    hfUrl: "https://huggingface.co/NousResearch/Hermes-4-14B"
  },
  {
    id: "browser-use/bu-30b-a3b-preview",
    name: "BU-30B-A3B-Preview",
    author: "Browser Use",
    size: "30B · 3B active",
    downloads: "30B · 3B active",
    role: "Browser Automation",
    tag: "Browser Automation",
    hfUrl: "https://huggingface.co/browser-use/bu-30b-a3b-preview"
  },
  {
    id: "microsoft/Fara1.5-27B",
    name: "Fara1.5-27B",
    author: "Microsoft",
    size: "27B",
    downloads: "27B",
    role: "Computer Use",
    tag: "Computer Use",
    hfUrl: "https://huggingface.co/microsoft/Fara1.5-27B"
  },
  {
    id: "meituan/EvoCUA-32B-20260105",
    name: "EvoCUA-32B",
    author: "Meituan",
    size: "32B class",
    downloads: "32B class",
    role: "Desktop Task Execution",
    tag: "Desktop Task Execution",
    hfUrl: "https://huggingface.co/meituan/EvoCUA-32B-20260105"
  },
  {
    id: "xlangai/OpenCUA-7B",
    name: "OpenCUA-7B",
    author: "xLang AI",
    size: "7B class",
    downloads: "7B class",
    role: "Lightweight Computer Use",
    tag: "Lightweight Computer Use",
    hfUrl: "https://huggingface.co/xlangai/OpenCUA-7B"
  },
  {
    id: "Qwen/Qwen3-Coder-Next",
    name: "Qwen3-Coder-Next",
    author: "Qwen",
    size: "80B · 3B active",
    downloads: "80B · 3B active",
    role: "Long-Horizon Coding",
    tag: "Long-Horizon Coding",
    hfUrl: "https://huggingface.co/Qwen/Qwen3-Coder-Next"
  },
  {
    id: "mistralai/Devstral-Small-2-24B-Instruct-2512",
    name: "Devstral Small 2",
    author: "Mistral AI",
    size: "24B",
    downloads: "24B",
    role: "Software Engineering",
    tag: "Software Engineering",
    hfUrl: "https://huggingface.co/mistralai/Devstral-Small-2-24B-Instruct-2512"
  },
  {
    id: "SWE-bench/SWE-agent-LM-32B",
    name: "SWE-agent-LM-32B",
    author: "SWE-bench",
    size: "32B class",
    downloads: "32B class",
    role: "Repository Repair",
    tag: "Repository Repair",
    hfUrl: "https://huggingface.co/SWE-bench/SWE-agent-LM-32B"
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

  if (a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;
  if (a.includes('mistral') || m.includes('mistral') || m.includes('devstral')) return <MistralLogo size={20} />;
  if (a.includes('microsoft') || m.includes('phi') || m.includes('magentic') || m.includes('fara')) return <MicrosoftLogo size={20} />;
  if (a.includes('google') || m.includes('gemma')) return <GoogleLogo size={20} />;
  if (a.includes('nvidia') || m.includes('nemotron')) return <NvidiaLogo size={20} />;
  if (a.includes('thudm') || m.includes('glm')) return <BAAILogo size={20} />;
  if (a.includes('01-ai') || m.includes('yi')) return <KimiLogo size={20} />;
  
  // Real brand logos
  if (a.includes('nous') || m.includes('hermes')) {
    return <NousResearchLogo size={20} />;
  }
  if (a.includes('browser-use') || m.includes('browser') || m.includes('bu-')) {
    return <BrowserUseLogo size={20} />;
  }
  if (a.includes('meituan') || m.includes('evocua')) {
    return <MeituanLogo size={20} />;
  }
  if (a.includes('xlang') || m.includes('opencua')) {
    return <XLangLogo size={20} />;
  }
  if (a.includes('swe-bench') || m.includes('swe-agent') || m.includes('swe')) {
    return <SWEBenchLogo size={20} />;
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

const FAQ_DATA = [
  {
    question: "What are Autonomous Agents and how do they differ from chatbots?",
    answer: "Unlike simple chatbots that merely answer questions in text, Autonomous Agents proactively plan, call external tools (APIs, databases, software), observe results, and iterate until a multi-step objective is accomplished. They can query ledgers, generate patches, update CRM records, and autonomously resolve exceptions without requiring continuous human hand-holding."
  },
  {
    question: "How does Horos prevent agents from getting stuck in infinite loops?",
    answer: "Horos enforces deterministic runtime guardrails, including cycle detection, maximum step limits, and trajectory reflection. If an agent repeats an identical failing action twice, Horos intercepts the loop, injects an alternative strategy prompt, or routes the task to a human-in-the-loop checkpoint."
  },
  {
    question: "Can agents connect to our proprietary internal APIs and databases safely?",
    answer: "Yes. All tool calls execute within isolated, ephemeral sandboxes with strict Pydantic schema validation. You define exact permissions, read-only constraints, rate limits, and authentication tokens. Sensitive credentials never leak into model weights or context logs."
  },
  {
    question: "How does autonomous error recovery and self-healing work in production?",
    answer: "When a tool fails—such as an API returning a 429 rate limit, 500 error, or malformed JSON—the agent doesn't crash. Horos automatically parses the error trace, applies exponential backoff, adjusts the query arguments, or tries an alternative tool path based on learned recovery policies."
  },
  {
    question: "Can I deploy autonomous agents completely on-premise or in an air-gapped VPC?",
    answer: "Yes, 100%. Horos is built for total data sovereignty. You can host open-weight agent models (Qwen, Llama, DeepSeek, Mistral) and the sandboxed execution engine inside your own AWS, Azure, or GCP private VPC—or on bare-metal air-gapped GPU servers—with zero external data egress."
  },
  {
    question: "How do I evaluate and benchmark agent reliability before shipping?",
    answer: "Horos provides automated evaluation suites that test agents against multi-step failure injection scenarios (simulated network lag, schema drift, invalid parameters). You get concrete metrics on task completion rate, tool schema fidelity, recovery efficiency, and cost per task before promoting to production."
  }
];

export default function AutonomousAgentsPage() {
  const [activeFile, setActiveFile] = useState<DataFactoryFile>("agent.py" as any);
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "agent.py": AGENT_CODE,
    "tools.py": TOOLS_CODE,
    "eval.py": EVAL_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE
  };

  const AGENT_MSG_1 = "On it. I'll plan the reconciliation steps, query PostgreSQL transaction records, call the Stripe billing API, handle rate limits, and post an audited ledger adjustment.";
  const AGENT_MSG_2 = "Task complete. Reconciled $2,180 discrepancy, recovered autonomously from Stripe 429 rate limit, and committed verified ledger adjustment #ADJ-4819 with full audit lineage.";

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

            let tag = "Agent Model";
            let description = m.downloads ? `${dl} - Autonomous agent model` : "Autonomous agent model";
            
            let author = m.author || m.id.split('/')[0];
            let name = m.id.split('/').pop();

            return {
              id: m.id,
              name: name,
              author: author,
              downloads: dl,
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
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="w-full h-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
          <div className="relative border-r border-dashed border-[#333]">
            <div className="absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333]" />
          </div>
          <div />
          <div className="relative border-l border-dashed border-[#333]">
            <div className="absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333]" />
          </div>
        </div>
      </div>

      <div className="relative z-[100]">
        <LandingNavbar />
      </div>

      <main className="flex-1 flex flex-col relative z-10">
        
        {/* SVG Filter for recoloring the hero background to brand green colors */}
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

        {/* Background Image centered in Hero Section */}
        <div className="absolute top-0 inset-x-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center opacity-75">
          <div className="relative w-[900px] h-[600px] mt-4">
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-transparent to-[#151515] z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-[#151515] z-10" />
            <img 
              src="/images/butterfly.png"
              alt="Hero Background"
              className="w-full h-full object-contain object-center"
              style={{ 
                maskImage: 'radial-gradient(ellipse at center, black 75%, transparent 100%)',
                filter: 'url(#brand-duotone-butterfly)'
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
                    Agents that<br />
                    <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">
                      actually get things done.
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    Build, adapt, and optimize autonomous agents that reason, use tools, recover from failures, and execute real-world workloads.
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 rounded-sm hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px]">
                      Engineer agent <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px]">
                      Explore stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <RagSearchGrid 
                    label1="Reasoning"
                    label2="Tool Calling"
                    label3="Error Recovery"
                    label4="Workload Execution"
                    label5="Planning"
                    label6="Feedback Loops"
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
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What you actually own</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  The agent reasoning models, sandboxed tool harnesses, and execution policies. Complete sovereignty over how autonomous systems plan, act, and resolve tasks.
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
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">The agent models.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      You own the model checkpoints, reasoning fine-tunes, and system prompts. Compare planning fidelity, tool selection accuracy, and token efficiency across multi-step agent workloads.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 2</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">The tools and sandbox environments.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      You define API schemas, sandbox execution boundaries, persistent memory stores, and safety gates. Test how agents recover from tool failures, schema mismatches, and unexpected outputs.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3">
                    <div className="text-[#75bf00] font-mono text-[13px] sm:text-[14px] font-semibold tracking-wider">0 3</div>
                    <h3 className="text-[17px] sm:text-[18px] md:text-[19px] font-medium text-[#F0EFE2] leading-snug">The verified autonomous policies.</h3>
                    <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] leading-relaxed">
                      You control the production policy versions, runtime configurations, and deployment artifacts. Compare task completion rates, loop prevention, latency, and compute cost before promoting.
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
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#f2efe8] mb-2.5 text-center mt-6 md:mt-8">Three ways to build autonomous-agents
            </h2>
            <p className="text-[#C8C7BA] text-[13.5px] sm:text-[14.5px] font-sans leading-relaxed text-center max-w-2xl mx-auto">
              Compare Horos with closed agent APIs and custom DIY frameworks across planning, tool calling, failure recovery, memory, verification, and data sovereignty.
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
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Full sovereign agent engineering loop.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Key size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">Closed Agent APIs</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Stateless black-box completions.</p>
                  </div>
                  <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                    <div className="flex items-center gap-3 mb-2">
                      <Cpu size={16} className="text-[#C8C7BA]" />
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">DIY Agent Frameworks</span>
                    </div>
                    <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug">Fragile prompt scripts and glue code.</p>
                  </div>
                </div>

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
                        <h4 className="text-[12.5px] sm:text-[13px] font-medium text-[#75bf00] mb-1 leading-tight">{row.horos.title}</h4>
                        <p className="text-[#A0A098] text-[11.5px] sm:text-[12px] leading-relaxed font-sans">{row.horos.desc}</p>
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
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-12 md:pt-16 mb-12 md:mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl md:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-3">
                  Code you own. <span className="text-[#75bf00]">Deploy anywhere.</span>
                </h2>
                <p className="text-[#A0A098] text-[13.5px] sm:text-[14.5px] md:text-[15px] max-w-2xl mx-auto leading-relaxed text-center">
                  The full recipe ships with you. Autonomous agent models, tool-calling harnesses, sandbox environments, and execution runtimes. Run it anywhere.
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
                          <p className="text-[#C8C7BA] text-[12px] sm:text-[12.5px] font-sans leading-[21px] sm:leading-[22px]">
                            Reconcile customer refund discrepancies across{" "}
                            <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] align-middle font-mono text-[10.5px]">
                              <Database size={10} /> postgres/ledger
                            </span>{" "}
                            and Stripe API with{" "}
                            <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] align-middle font-mono text-[10.5px]">
                              <QwenLogo size={10} /> Qwen2.5-72B
                            </span>{" "}
                            and recover from API errors on{" "}
                            <span className="inline-flex items-center gap-1 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#75bf00] align-middle font-mono text-[10.5px]">
                              <Cpu size={10} /> Agent Sandbox
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Decomposing task & planning sub-goals</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">0.4s</span>
                              </div>
                              <span className="text-[#666] text-[10px] sm:text-[10.5px] truncate">Initialized tree-of-thought with 4 fallback paths</span>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Calling postgres_ledger_query tool</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">0.8s</span>
                              </div>
                              <span className="text-[#75bf00] text-[10px] sm:text-[10.5px] truncate">Retrieved 1,240 ledger rows; isolated $2,180 variance</span>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Calling stripe_charge_verify endpoint</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">1.3s</span>
                              </div>
                              <span className="text-[#666] text-[10px] sm:text-[10.5px] truncate">Matched charge #ch_9021 with missing tax credit</span>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Intercepted 429 Rate Limit; Autonomous Recovery</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">0.5s</span>
                              </div>
                              <span className="text-[#75bf00] text-[10px] sm:text-[10.5px] truncate">Applied exponential backoff jitter; retried with success</span>
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
                                <span className="text-[#C8C7BA] text-[11px] sm:text-[11.5px] font-medium truncate">Validating financial invariants & compliance</span>
                                <span className="text-[#C8C7BA] text-[10px] sm:text-[10.5px] shrink-0">0.6s</span>
                              </div>
                              <span className="text-[#75bf00] text-[10px] sm:text-[10.5px] truncate">PolicyGate passed; ledger adjustment #ADJ-4819 signed</span>
                            </div>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className={`flex gap-2.5 mt-2 transition-all duration-500 transform ${visibleStep >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
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

                      <div className="mt-2 pt-2 border-t border-[#252525]">
                        <div className="flex items-center justify-between text-[11px] text-[#666]">
                          <span>Status: <span className="text-[#75bf00] font-medium">Task Settled</span></span>
                          <span className="font-mono">Success Rate: 99.2%</span>
                        </div>
                      </div>
                    </div>

                    {/* File Explorer */}
                    <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-3 sm:p-4 flex flex-col border-l border-r border-[#222] overflow-hidden pointer-events-auto">
                      <div className="text-[10px] font-bold tracking-widest text-[#555] uppercase mb-3">Workspace Files</div>
                      <div className="flex flex-col gap-1 text-[11px] sm:text-[11.5px] font-mono">
                        {Object.keys(FILE_CODE_MAP).map((file) => (
                          <button
                            key={file}
                            onClick={() => selectFileManually(file)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-left ${activeFile === file ? "bg-[#252525] text-[#75bf00]" : "text-[#888] hover:text-[#C8C7BA] hover:bg-[#1a1a1a]"}`}
                          >
                            <span className="text-[#555]">&gt;</span>
                            <span className="truncate">{file}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Code Viewer */}
                    <div className="col-start-4 col-end-5 row-start-2 row-end-3 p-4 sm:p-5 flex flex-col overflow-hidden pointer-events-auto bg-[#131313]">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222]">
                        <span className="text-[11px] font-mono text-[#75bf00]">{activeFile}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#555]">Read-only sandbox</span>
                      </div>
                      <div className="font-mono text-[11px] sm:text-[11.5px] leading-relaxed overflow-y-auto chat-scroll flex-1 pr-2">
                        {highlightCode(typedCodeText, activeFile.endsWith(".py") ? "python" : activeFile.endsWith(".json") ? "json" : "bash", !isTypingCode)}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Features / Deployment Grid Row */}
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
                    Serverless agent inference, speculative decoding, and low-latency tool-calling execution running on our dedicated B200 clusters.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="px-6 py-8 sm:px-8 sm:py-9 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333] items-start">
                  <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Server size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-[#F0EFE2] leading-snug">Your infrastructure</h3>
                  <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed">
                    Deploy agent reasoning models, tool-execution sandboxes, and vector memory on AWS, GCP, RunPod, or on-prem. Your tools, your hardware.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="px-6 py-8 sm:px-8 sm:py-9 flex flex-col gap-3 items-start">
                  <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Network size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-[#F0EFE2] leading-snug">Zero lock-in</h3>
                  <p className="text-[#C8C7BA] text-[13px] sm:text-[13.5px] leading-relaxed">
                    Export the full recipe: agent prompts, tool schemas, policy guardrails, model weights, and container harnesses. Run it anywhere.
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

        {/* Hugging Face Models Catalog Section */}
        <div className="w-full relative z-10 pt-24 pb-16">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-5xl mx-auto leading-tight sm:whitespace-nowrap hyphens-none">
                Any HF autonomous-agent models work
              </h2>
              <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                Use any open-weights autonomous agent model as your reasoning engine, or fine-tune specialized tool-calling & computer-use models. The examples below are just a starting view.
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
                  placeholder="Search any HF autonomous-agent model on Hugging Face"
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
                <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-medium tracking-tight text-[#F0EFE2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto leading-tight">What Horos tunes</h2>
                <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-xl mx-auto mb-8 sm:mb-10">
                  Every stage of autonomous agents, optimized per model, tool schema, failure pattern, and compute configuration.
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
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-r border-dashed border-[#333]">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 1</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Agent model adaptation</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Compare technical reasoning and code models. Tune system prompts, domain context, and fine-tuning checkpoints against complex multi-step tasks.
                  </p>
                </div>

                {/* Stage 2 */}
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-r border-dashed border-[#333]">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 2</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Tool schema fidelity</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Tune JSON schema enforcement, tool argument validation, and parameter extraction against ambiguous or noisy real-world inputs.
                  </p>
                </div>

                {/* Stage 3 */}
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b border-dashed border-[#333]">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 3</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Multi-step planning</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Search subgoal decomposition depths, tree-of-thought exploration, and reflection checkpoints to maximize task completion while reducing tokens.
                  </p>
                </div>

                {/* Stage 4 */}
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 4</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Failure recovery & reflection</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Evaluate learned self-correction policies when APIs return rate-limits (429), partial payloads, timeouts, or unexpected server exceptions.
                  </p>
                </div>

                {/* Stage 5 */}
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 5</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Compute and execution</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Tune prompt prefix caching, speculative decoding, parallel tool invocation, and CPU/GPU memory placement for fast, cost-effective agent loops.
                  </p>
                </div>

                {/* Stage 6 */}
                <div className="p-6 sm:p-7 md:p-8 flex flex-col gap-3">
                  <div className="text-[#75bf00] font-mono text-[13px] font-semibold tracking-wider">0 6</div>
                  <h3 className="text-lg font-medium text-[#F0EFE2]">Verification and guardrails</h3>
                  <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                    Validate agent actions against deterministic policy gates, financial invariants, infinite-loop detectors, and human approval checkpoints.
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

        {/* Try This Pipeline Section */}
        <div className="w-full relative z-10 py-24">
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div className="border-r border-dashed border-[#333]" />
            <div className="flex flex-col items-center">
              <h2 className="text-[56px] md:text-[64px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">Try this pipeline</h2>
              <p className="text-[#c7c3b7] text-[22px] font-sans leading-relaxed text-center max-w-2xl mb-16 mx-auto">
                Edit the agent model, tools, or policy gates inline. Send to retune the agent stack in the dashboard.
              </p>

              <div className="w-[822px] max-w-full relative z-10">
                <TokenPromptInput fixedPromptIndex={1} hideHeader={true} showSuggestions={false} cardClassName="!bg-[#202020]" />
              </div>
            </div>
            <div className="border-l border-dashed border-[#333]" />
          </div>
          {/* Bottom Horizontal Border with Brand Logo & Crosshairs */}
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
              <p className="text-[#C8C7BA] text-[16px] leading-relaxed max-w-3xl whitespace-pre-line">
                {FAQ_DATA[activeFaq].answer}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="w-full relative z-10 py-32 flex flex-col items-center justify-center">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="border-r border-dashed border-[#333] relative">
              <div className="hidden md:block absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333]" />
            </div>

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

            <div className="border-l border-dashed border-[#333] relative">
              <div className="hidden md:block absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333]" />
            </div>
          </div>

          <div className="relative z-20 flex flex-col items-center text-center max-w-4xl px-4 mt-8 pointer-events-auto">
            <div className="mb-12">
              <HorosLogo size={40} />
            </div>

            <h2 className="text-[48px] md:text-[64px] leading-[1.1] font-medium tracking-tight text-[#F0EFE2] mb-8">
              Deploy your first autonomous<br className="hidden md:block" />
              agent, <span className="relative z-10 bg-[#75bf00] text-black px-3 py-1">measured</span> before you<br className="hidden md:block" />
              ship
            </h2>

            <p className="text-[#C8C7BA] text-[16px] md:text-[18px] max-w-2xl mb-12 font-sans leading-relaxed">
              Join engineering teams using Horos to build, evaluate, and operate production-grade autonomous agents with guaranteed reliability.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button className="bg-[#75bf00] text-black font-semibold px-6 py-3 rounded-sm hover:bg-[#85cf00] transition-colors flex items-center gap-2 text-[15px]">
                Start with an agent <ChevronRight size={18} />
              </button>
              <button className="bg-[#222] text-[#F0EFE2] font-semibold px-6 py-3 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 text-[15px]">
                Explore the stack <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

      </main>

      <GlobalFooter />
    </div>
  );
}
