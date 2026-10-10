"use client";

import { GlobalFooter } from "@/components/landing/global-footer";
import { SectionDivider } from "@/components/landing/section-divider";
import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { EmbeddingsGrid } from "@/components/landing/embeddings-grid";

import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, BAAILogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, JinaLogo, MixedbreadLogo, SnowflakeLogo, NomicLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2, ScanSearch } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "System",
    runInfra: { title: "Version the complete coding system.", desc: "Code model, repository snapshot, context, tools, sandbox, test environment, runtime, and execution policies." },
    closed: { title: "Build around a hosted code model.", desc: "Connect repository access, tools, execution, tests, and orchestration in your application." },
    diy: { title: "Own the entire stack.", desc: "Integrate model serving, repository indexing, tool execution, sandboxing, and test infrastructure." }
  },
  {
    num: "0 2",
    label: "Models",
    runInfra: { title: "Find the right coding model.", desc: "Compare open-weight models and fine-tunes on repository-specific tasks. Track model revisions, chat templates, quantization, and runtime compatibility." },
    closed: { title: "Choose from provider models.", desc: "Access and internal inference controls depend on the provider." },
    diy: { title: "Manage coding models yourself.", desc: "Handle model selection, artifacts, quantization, compatibility, and serving." }
  },
  {
    num: "0 3",
    label: "Context",
    runInfra: { title: "Represent the codebase, not just its files.", desc: "Build context from symbols, imports, call sites, dependencies, issue descriptions, diffs, test results, and repository state." },
    closed: { title: "Supply repository context yourself.", desc: "Implement code search, retrieval, dependency awareness, and context construction around the API." },
    diy: { title: "Build repository intelligence.", desc: "Maintain indexing, code navigation, context selection, and synchronization with changing commits." }
  },
  {
    num: "0 4",
    label: "Capabilities",
    runInfra: { title: "Compose the coding toolchain.", desc: "Connect repository search, file editing, terminal, Git, compilers, test runners, debuggers, and CI as versioned capabilities with explicit permissions." },
    closed: { title: "Integrate exposed tool interfaces.", desc: "Your application coordinates execution, state, and access controls." },
    diy: { title: "Build and maintain tool adapters.", desc: "Own execution, compatibility, isolation, and integration failures." }
  },
  {
    num: "0 5",
    label: "Workload",
    runInfra: { title: "Measure real coding tasks.", desc: "Track languages, repository size, issue type, files changed, tool trajectories, retries, test outcomes, execution time, latency, and cost." },
    closed: { title: "Measure requests and application traces.", desc: "Repository-level outcomes and execution metrics require additional instrumentation." },
    diy: { title: "Build workload replay and tracing.", desc: "Reproduce tasks and correlate model behavior with tools, tests, and infrastructure." }
  },
  {
    num: "0 6",
    label: "Optimization",
    runInfra: { title: "Search the complete coding system.", desc: "Compare models, repository context, retrieval, tool strategy, step budgets, inference settings, runtimes, and hardware against task-success and cost constraints." },
    closed: { title: "Tune exposed model and tool settings.", desc: "Internal serving and hardware optimization remain provider-dependent." },
    diy: { title: "Build the optimization engine.", desc: "Profile, experiment, and tune models, context, tool execution, and serving independently." }
  },
  {
    num: "0 7",
    label: "Verification",
    runInfra: { title: "Prove what the patch passes.", desc: "Run builds, type checks, tests, static analysis, and task-specific acceptance checks. Preserve the patch, test results, environment, and evidence for each system version." },
    closed: { title: "Build end-to-end verification around the API.", desc: "Generated code and model-level scores do not establish patch correctness." },
    diy: { title: "Maintain the verification pipeline.", desc: "Own test datasets, isolated execution, regression checks, and reproducibility." }
  },
  {
    num: "0 8",
    label: "Experience",
    runInfra: { title: "Remember what happened during execution.", desc: "Record the issue, repository commit, system version, tool calls, commands, outputs, patch, failures, test evidence, and final outcome. Mine regressions, repeated repair attempts, and failure causes." },
    closed: { title: "Connect provider traces to repository outcomes.", desc: "Application-level execution history and evidence remain your responsibility." },
    diy: { title: "Build persistent execution history.", desc: "Correlate model versions, tool traces, patches, test runs, and production regressions across your stack." }
  },
  {
    num: "0 9",
    label: "Teaching",
    runInfra: { title: "Teach coding intelligence from verified outcomes.", desc: "Turn test results, compiler failures, review corrections, and accepted patches into training signals, coding skills, improved tool policies, and model or system updates. Teach models how code changes affect software behavior, then evaluate new versions before promotion." },
    closed: { title: "Use available model customization.", desc: "Fine-tuning and access to training mechanisms depend on the provider. Building the verified learning loop requires additional infrastructure." },
    diy: { title: "Build the teaching pipeline.", desc: "Manage training data, fine-tuning, preference signals, evaluations, coding skills, and version promotion yourself." }
  },
  {
    num: "1 0",
    label: "Authority",
    runInfra: { title: "Control what the coding agent can change.", desc: "Enforce repository scope, allowed commands, secret access, network permissions, write access, resource budgets, and approval requirements. Recheck workspace state before consequential changes." },
    closed: { title: "Enforce permissions in your application.", desc: "Tool access and model capabilities do not replace execution authorization." },
    diy: { title: "Build the execution boundary.", desc: "Own command restrictions, credentials, approvals, audit records, rollback, and deployment permissions." }
  }
];


const POOL_CODE = `import { Pool } from 'pg';\n\nexport class DBConnectionPool {\n  private pool: Pool;\n  \n  constructor() {\n    this.pool = new Pool({\n      max: 20,\n      idleTimeoutMillis: 30000,\n    });\n  }\n\n  async executeQuery(query: string, params: any[]) {\n    const client = await this.pool.connect();\n    try {\n      const result = await client.query(query, params);\n      return result.rows;\n    } finally {\n      // Memory leak fixed: ensure connection is always released\n      client.release();\n    }\n  }\n}`; 

const PATCH_CODE = `--- src/db/pool.ts\n+++ src/db/pool.ts\n@@ -12,6 +12,8 @@\n     try {\n       const result = await client.query(query, params);\n       return result.rows;\n+    } finally {\n+      client.release();\n     }\n   }\n }`; 

const TEST_CODE = `import { test, expect } from 'vitest';\nimport { DBConnectionPool } from './pool';\n\ntest('pool releases connection on success', async () => {\n  const pool = new DBConnectionPool();\n  await pool.executeQuery('SELECT 1', []);\n  expect(pool.pool.idleCount).toBe(1);\n});\n\ntest('pool releases connection on error', async () => {\n  const pool = new DBConnectionPool();\n  try {\n    await pool.executeQuery('INVALID SYNTAX', []);\n  } catch (e) {}\n  expect(pool.pool.idleCount).toBe(1);\n});`; 

const DOCKERFILE_CODE = `FROM node:20-alpine AS test-env\n\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci\n\nCOPY . .\n\n# Run test suite and memory profile\nCMD ["npm", "run", "test:memory"]`;

const MEMORY_PY_CODE = `def initialize_memory(agent_id, session_token):
    """
    Sets up the persistent memory context for the agent.
    Connects to the MemoryOS backend to retrieve historical execution paths.
    """
    import requests
    response = requests.get(
        f"http://memoryos-backend.local/api/v1/memory/{agent_id}",
        headers={"Authorization": f"Bearer {session_token}"}
    )
    if response.status_code == 200:
        return response.json().get("context", {})
    raise Exception("Failed to initialize memory")`;

const POLICIES_PY_CODE = `def verify_tool_calling_policy(tool_name, arguments, auth_level):
    """
    Validates if the agent has permissions to execute the given tool.
    Enforces repository-level boundaries.
    """
    RESTRICTED_TOOLS = ["delete_repository", "modify_secrets"]
    
    if tool_name in RESTRICTED_TOOLS and auth_level < 3:
        return False, "Permission denied for restricted tool."
        
    return True, "Policy check passed."`;

const SERVE_SH_CODE = `#!/bin/bash
set -e

echo "Starting Horos AI Assistant..."
echo "Loading Qwen3-Coder model onto L4 GPU..."

# Boot vLLM with Qwen3-Coder
python3 -m vllm.entrypoints.openai.api_server \\
    --model Qwen/Qwen3-Coder-32B-Instruct \\
    --tensor-parallel-size 1 \\
    --gpu-memory-utilization 0.95 \\
    --max-model-len 32768 \\
    --port 8000 &

echo "vLLM engine started. Booting agent API..."
python3 pipeline.py --host 0.0.0.0 --port 8080`;

const PIPELINE_PY_CODE = `from tool_definitions.memory import initialize_memory
from tool_definitions.policies import verify_tool_calling_policy
from vllm import LLM, SamplingParams

class AgentPipeline:
    def __init__(self, agent_id):
        self.agent_id = agent_id
        self.context = initialize_memory(agent_id, "mock_token")
        
    def execute_task(self, prompt, available_tools):
        # Format tool schema for Qwen3-Coder
        system_prompt = "You are a coding agent. Use tools to solve the task."
        
        # Engine mock invocation
        print(f"Executing task: {prompt}")
        return "Completed execution."`;

const DOCKER_COMPOSE_CODE = `version: '3.8'
services:
  agent-api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - VLLM_URL=http://vllm-engine:8000
    depends_on:
      - vllm-engine
      
  vllm-engine:
    image: vllm/vllm-openai:v0.4.0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    command: --model Qwen/Qwen3-Coder-32B-Instruct`;

const REQUIREMENTS_CODE = `vllm==0.4.0
requests==2.31.0
fastapi==0.110.0
uvicorn==0.27.1`;


const PACKAGE_JSON_CODE = `{
  "name": "horos-pool-benchmark",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest run",
    "test:memory": "vitest run --inspect --profile"
  },
  "dependencies": {
    "pg": "^8.11.3"
  }
}`;

const TSCONFIG_CODE = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*", "tests/**/*"]
}`;




const EVAL_RANKING_CODE = `{
  "model": "Qwen3-Coder-32B",
  "pass@1": 94.2,
  "memory_leaks_resolved": 100,
  "latency_percentile_99": "4.2ms",
  "status": "APPROVED"
}`;

const README_CODE = `# DB Connection Pool Optimization
Agent task: Fix connection teardown leak.
Hardware: 1x L4, 24GB VRAM
Status: VERIFIED`;
 

type CodingAgentFile = string;

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
    } else if (lang === "markdown") {
      if (content.startsWith("#")) {
        lineContent = <span className="text-[#a855f7] font-bold">{content}</span>;
      } else {
        lineContent = content;
      }
    } else if (lang === "yaml") {
      const parts = line.split(/(^[\s-]*[\w-]+:|"[^"]*"|'[^']*'|#.*)/);
      lineContent = parts.map((part, pi) => {
        if (part.endsWith(":")) return <span key={pi} className="text-[#93c5fd] font-semibold">{part}</span>;
        if (part.startsWith("#")) return <span key={pi} className="text-[#666] italic">{part}</span>;
        if (part.startsWith('"') || part.startsWith("'")) return <span key={pi} className="text-[#75bf00]">{part}</span>;
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
  { id: "mistralai/Devstral-2-123B-Instruct-2512", name: "Devstral 2 123B", author: "Mistral", downloads: "2.1M", tag: "Code" },
  { id: "mistralai/Devstral-Small-2-24B-Instruct-2512", name: "Devstral Small 24B", author: "Mistral", downloads: "5M", tag: "Code" },
  { id: "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8", name: "Qwen3 Coder 480B", author: "Qwen", downloads: "10M", tag: "Code" },
  { id: "Qwen/Qwen2.5-Coder-32B-Instruct", name: "Qwen2.5 Coder 32B", author: "Qwen", downloads: "4M", tag: "Code" },
  { id: "deepseek-ai/DeepSeek-Coder-V2-Instruct", name: "DeepSeek Coder V2", author: "DeepSeek", downloads: "8M", tag: "Code" },
  { id: "meta-llama/CodeLlama-70b-Instruct-hf", name: "CodeLlama 70B", author: "Meta", downloads: "3M", tag: "Code" },
  { id: "bigcode/starcoder2-15b", name: "StarCoder 2 15B", author: "BigCode", downloads: "2M", tag: "Code" },
  { id: "Phind/Phind-CodeLlama-34B-v2", name: "Phind CodeLlama", author: "Phind", downloads: "1M", tag: "Code" },
  { id: "WizardLM/WizardCoder-Python-34B-V1.0", name: "WizardCoder 34B", author: "WizardLM", downloads: "1.5M", tag: "Code" }
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
  if (a.includes('bigcode') || m.includes('starcoder')) return <img src="https://cdn-avatars.huggingface.co/v1/production/uploads/1659521200179-5e48005437cb5b49818287a5.png" alt="BigCode" style={{ width: 20, height: 20 }} className="rounded-sm object-cover" />;

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
    question: "Do I have to use a specific model?",
    answer: "No. You can use Devstral, Qwen Coder, DeepSeek, or any custom fine-tune. Horos manages the context injection and tool execution regardless of the underlying LLM."
  },
  {
    question: "Can I run the execution environment locally?",
    answer: "Yes. You can use docker-compose to run the complete Horos sandbox and verifier on your local workstation."
  },
  {
    question: "How does it handle tests and builds?",
    answer: "Horos isolates execution. It mounts your codebase into a sandbox, applies the proposed patch, and runs your native test commands (e.g. npm run test). The outputs are fed back into the agent loop."
  },
  {
    question: "Is my code sent to third-party servers?",
    answer: "If you self-host the LLM and the Horos execution engine, your code never leaves your VPC. You have complete data sovereignty."
  }
];



export default function EmbeddingsPage() {
  const [activeTab, setActiveTab] = useState("Horos");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [activeFile, setActiveFile] = useState<CodingAgentFile>("memory.py");
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  const FILE_CODE_MAP: Record<string, string> = {
    "memory.py": MEMORY_PY_CODE,
    "policies.py": POLICIES_PY_CODE,
    "serve.sh": SERVE_SH_CODE,
    "pipeline.py": PIPELINE_PY_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE,
    "patch.diff": PATCH_CODE
  };

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "I'll implement the agent core with tool calling, integrate the vLLM engine, and benchmark it on the SWE-bench dataset.";
  const AGENT_MSG_2 = "Coding agent built and verified. Tool calling achieved 94.2% pass rate on the benchmark.";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  const [isTypingCode, setIsTypingCode] = useState(true);
  const [typedCodeText, setTypedCodeText] = useState("");

  const selectFileManually = (file: CodingAgentFile) => {
    setIsAutoPlay(false);
    setActiveFile(file);
    setActiveMainTab("code");
  };

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || POOL_CODE;

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
    } else if (visibleStep === 8) {
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
        {/* Hero Section Container */}
        <div className="w-full relative mt-20 mb-20">
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
                <div className="flex flex-col gap-6 max-w-xl">
                  <h1 className="text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.1] mt-[-1rem]">
                    Issues in.{" "}
                    <span className="bg-[#75bf00] text-black px-2 py-1 leading-[1.3] box-decoration-clone">
                      Verified patches out.
                    </span>
                  </h1>
                  <p className="text-[#C8C7BA] text-[17px] tracking-wide mt-4">
                    Open-weight coding models, repository context, terminal tools, and test execution engineered as one system. Horos measures patch correctness, traces failures, and uses verified outcomes to improve future coding intelligence.
                  </p>

                  <div className="flex items-center gap-4 mt-6">
                    <button className="group bg-[#75bf00] text-black font-semibold px-5 py-2.5 hover:bg-[#85cf00] transition-all flex items-center gap-2 text-[14px] whitespace-nowrap">
                      Optimize your coding agent <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="bg-[#222] text-[#F0EFE2] font-semibold px-5 py-2.5 hover:bg-[#333] transition-colors flex items-center gap-2 text-[14px] whitespace-nowrap">
                      Explore the stack <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Graphic Grid */}
                <div className="flex justify-center relative w-full pt-10">
                  <EmbeddingsGrid />
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
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4">What you actually own</h2>
                <p className="text-[#C8C7BA] text-[16px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                  Your coding model, repository context, and execution environment. Horos evaluates the complete system against real coding tasks.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Grid with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10 pb-24">
            {/* Constrained Horizontal Borders */}
            
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />

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
                  <div className="p-10 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 1</div>
                    <h3 className="text-3xl md:text-4xl font-medium text-[#F0EFE2] leading-tight">Coding models</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      Devstral 2, Devstral Small 2, and Qwen3-Coder. Compare code changes, tool use, and repository-level task completion.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-10 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 2</div>
                    <h3 className="text-3xl md:text-4xl font-medium text-[#F0EFE2] leading-tight">Repository understanding</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      Repository symbols, imports, call sites, dependencies, commits, and issue context. Give the agent the code and relationships it needs to make changes across files.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-10 flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[16px] font-bold">0 3</div>
                    <h3 className="text-3xl md:text-4xl font-medium text-[#F0EFE2] leading-tight">Patch verification</h3>
                    <p className="text-[#C8C7BA] text-[17px] leading-relaxed">
                      Run builds, type checks, and tests against proposed changes. Record failures, passing checks, regressions, and evidence for each verified system version.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Full-width dashed line separator */}
        {/* Comparison Table Section */}
          <div className="w-full relative z-10 py-24">
            <div className="flex flex-col items-center mb-16 px-4">
              <h2 className="text-[32px] md:text-[44px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
                Three ways to ship coding agents
              </h2>
              <p className="text-[#C8C7BA] text-[18px] font-sans leading-relaxed text-center max-w-2xl">
                Most coding agents generate patches and rely on tests to judge the result. Horos engineers the code model, repository context, tools, runtime, and verification as one system, then uses verified execution outcomes to improve future coding intelligence.
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
                    <div className="hidden md:flex items-center px-6 py-4 border-b md:border-r border-dashed border-[#333]">
                      <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8C7BA] uppercase">What Matters</span>
                    </div>
                    <div className="flex flex-col justify-center px-6 py-4 border-b md:border-r border-dashed border-[#333] relative">
                      <div className="absolute top-4 right-4 flex items-center">
                        <span className="text-[9px] font-bold tracking-[0.2em] text-[#75bf00] uppercase">Recommended</span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#111] border border-[#333] flex items-center justify-center rounded-sm">
                          <HorosLogo size={24} />
                        </div>
                        <span className="text-[20px] font-medium text-[#F0EFE2]">Horos</span>
                      </div>
                      <p className="text-[#C8C7BA] text-[15px]">Fast path with model control and export.</p>
                    </div>
                    <div className="flex flex-col justify-center px-6 py-4 border-b md:border-r border-dashed border-[#333]">
                      <div className="flex items-center gap-3 mb-2">
                        <Key size={24} className="text-[#C8C7BA]" />
                        <span className="text-[20px] font-medium text-[#F0EFE2]">Closed model APIs</span>
                      </div>
                      <p className="text-[#C8C7BA] text-[15px]">Per-call, hosted.</p>
                    </div>
                    <div className="flex flex-col justify-center px-6 py-4 border-b border-dashed border-[#333]">
                      <div className="flex items-center gap-3 mb-2">
                        <Cpu size={24} className="text-[#C8C7BA]" />
                        <span className="text-[20px] font-medium text-[#F0EFE2]">DIY self-hosting</span>
                      </div>
                      <p className="text-[#C8C7BA] text-[15px]">Full control, heavy operations.</p>
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="border-l border-r border-b border-dashed border-[#333]">
                    {COMPARISON_ROWS.map((row, idx) => (
                      <div key={idx} className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200">
                        <div className="flex items-center px-6 py-4 md:border-r border-dashed border-[#333]">
                          <div className="flex items-center gap-3">
                            <span className="text-[#75bf00] font-mono text-[14px] font-bold">{row.num}</span>
                            <span className="text-[18px] font-medium text-[#F0EFE2]">{row.label}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-center px-6 py-4 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                          <h4 className="text-[18px] font-medium text-[#75bf00] mb-2">{row.runInfra.title}</h4>
                          <p className="text-[#C8C7BA] text-[15px] leading-relaxed">{row.runInfra.desc}</p>
                        </div>

                        <div className="flex flex-col justify-center px-6 py-4 md:border-r border-dashed border-[#333]">
                          <h4 className="text-[18px] font-medium text-[#F0EFE2] mb-2">{row.closed.title}</h4>
                          <p className="text-[#C8C7BA] text-[15px] leading-relaxed">{row.closed.desc}</p>
                        </div>

                        <div className="flex flex-col justify-center px-6 py-4">
                          <h4 className="text-[18px] font-medium text-[#F0EFE2] mb-2">{row.diy.title}</h4>
                          <p className="text-[#C8C7BA] text-[15px] leading-relaxed">{row.diy.desc}</p>
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
        <div className="w-full relative z-10 py-24">
          {/* Top Divider for Sandbox Section */}
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          {/* Heading for Sandbox */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-16 mb-16">
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

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">



            {/* Sandbox Content Container (SVG Skeleton Architecture) */}
            <div className="w-full relative mx-auto max-w-[1351px]" style={{ aspectRatio: '1351 / 892' }}>

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
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-6 flex flex-col justify-between overflow-hidden pointer-events-auto min-w-0 min-h-0">
                  <div className="flex flex-col gap-6 overflow-y-auto chat-scroll pr-2 pb-4">
                    <div className="bg-[#1a1a1a] border border-[#252525] p-5 rounded-[4px]">
                      <p className="text-[#C8C7BA] text-[13px] font-medium leading-[26px] mb-1">
                        Build a coding agent. <span className="inline-flex items-center gap-1 bg-[#222] border border-[#333] px-1.5 py-0.5 rounded-[4px] mx-0.5"><QwenLogo size={12} /> Qwen3-Coder</span> for repository-level coding with tool calling. Serve with <span className="inline-flex items-center gap-1 bg-[#222] border border-[#333] px-1.5 py-0.5 rounded-[4px] mx-0.5"><VLLMLogo size={12} /> vLLM</span> on a single <span className="inline-flex items-center gap-1 bg-[#222] border border-[#333] px-1.5 py-0.5 rounded-[4px] mx-0.5"><NvidiaLogo size={12} /> L4</span>.
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Context retrieval</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.2s</span>
                          </div>
                          <span className="text-[#666] text-[12px] font-mono leading-tight mt-1">Indexed 245 files. Extracted AST for src/agent/core.ts</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Tool calling integration</span>
                            <span className="text-[#C8C7BA] text-[12px]">0.9s</span>
                          </div>
                          <span className="text-[#666] text-[12px] font-mono leading-tight mt-1">Registered 12 tools in ToolRegistry. Verifying signatures...</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">vLLM engine setup</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.4s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px] font-mono leading-tight mt-1">Connecting to vLLM on L4 GPU. Loaded Qwen3-Coder.</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">SWE-bench evaluation</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.1s</span>
                          </div>
                          <span className="text-[#666] text-[12px] font-mono leading-tight mt-1">Running 2,294 test cases. Pass@1: 94.2% (verified).</span>
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
                            <span className="text-[#C8C7BA] text-[13px] font-medium">Performance optimization</span>
                            <span className="text-[#C8C7BA] text-[12px]">1.5s</span>
                          </div>
                          <span className="text-[#666] text-[12px] font-mono leading-tight mt-1">Optimized KV cache. Throughput: 1,200 tokens/sec.</span>
                        </div>
                      </div>

                      {/* Log 6 (Step 7) */}
                      <div className={`flex items-start gap-3 transition-all duration-500 transform ${visibleStep >= 8 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                        <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                          {visibleStep === 8 ? (
                            <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} className="text-[#75bf00]" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[#C8C7BA] text-[13px] font-medium">System verification</span>
                            <span className="text-[#C8C7BA] text-[12px]">2.3s</span>
                          </div>
                          <span className="text-[#75bf00] text-[12px] font-mono leading-tight mt-1">Patch generated. 4 files modified. 0 regressions.</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 8 (LAST STEP): Agent Final Summary */}
                    <div className={`flex gap-3 mt-2 transition-all duration-500 transform ${visibleStep >= 8 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                      <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                        {visibleStep === 8 && typedMsg2.length < AGENT_MSG_2.length ? (
                          <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                        ) : (
                          <Sparkles size={14} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">Agent</span>
                        <p className="text-[#C8C7BA] text-[13px] leading-relaxed">
                          {typedMsg2}
                          {visibleStep === 8 && typedMsg2.length < AGENT_MSG_2.length && (
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
                        placeholder="Teach the agent to handle custom error boundaries..."
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
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 py-6 px-4 flex flex-col items-start gap-4 overflow-hidden pointer-events-auto chat-scroll min-w-0 min-h-0">
                  <div className="flex justify-between items-center border-b border-[#252525] pb-3 mb-2 w-full">
                    <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase shrink-0">MISSION ASSETS</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0">3</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-[13px] font-mono w-full">
                    <div className="flex flex-col gap-0.5 w-full">
                      <div className="px-2 py-1.5 text-[#75bf00] font-semibold truncate w-full">
                        tool_definitions/
                      </div>
                      <div className="pl-3 flex flex-col gap-0.5 mt-1 w-full min-w-0">
                        <button
                          onClick={() => selectFileManually("memory.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "memory.py" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          {activeFile === "memory.py" ? <ChevronRight size={14} className="text-[#75bf00] shrink-0" /> : <span className="w-[14px] shrink-0"></span>} 
                          <span className="truncate min-w-0 flex-1">memory.py</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("policies.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "policies.py" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          {activeFile === "policies.py" ? <ChevronRight size={14} className="text-[#75bf00] shrink-0" /> : <span className="w-[14px] shrink-0"></span>}
                          <span className="truncate min-w-0 flex-1">policies.py</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-col gap-0.5 w-full">
                      <div className="px-2 py-1.5 text-[#C8C7BA] font-semibold truncate w-full">
                        horos-ai-assistant/
                      </div>
                      <div className="pl-3 flex flex-col gap-0.5 mt-1 w-full min-w-0">
                        <button
                          onClick={() => selectFileManually("serve.sh")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "serve.sh" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          {activeFile === "serve.sh" ? <ChevronRight size={14} className="text-[#75bf00] shrink-0" /> : <span className="w-[14px] shrink-0"></span>}
                          <span className="truncate min-w-0 flex-1">serve.sh</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("pipeline.py")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "pipeline.py" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          {activeFile === "pipeline.py" ? <ChevronRight size={14} className="text-[#75bf00] shrink-0" /> : <span className="w-[14px] shrink-0"></span>}
                          <span className="truncate min-w-0 flex-1">pipeline.py</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("Dockerfile")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "Dockerfile" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          {activeFile === "Dockerfile" ? <ChevronRight size={14} className="text-[#75bf00] shrink-0" /> : <span className="w-[14px] shrink-0"></span>}
                          <span className="truncate min-w-0 flex-1">Dockerfile</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("docker-compose.yml")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "docker-compose.yml" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          {activeFile === "docker-compose.yml" ? <ChevronRight size={14} className="text-[#75bf00] shrink-0" /> : <span className="w-[14px] shrink-0"></span>}
                          <span className="truncate min-w-0 flex-1">docker-compose.yml</span>
                        </button>
                        <button
                          onClick={() => selectFileManually("requirements.txt")}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] min-w-0 ${activeFile === "requirements.txt" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          {activeFile === "requirements.txt" ? <ChevronRight size={14} className="text-[#75bf00] shrink-0" /> : <span className="w-[14px] shrink-0"></span>}
                          <span className="truncate min-w-0 flex-1">requirements.txt</span>
                        </button>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#777] font-semibold w-full min-w-0">
                          <span className="w-[14px] shrink-0"></span>
                          <span className="truncate min-w-0 flex-1">models/</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#777] font-semibold w-full min-w-0">
                          <span className="w-[14px] shrink-0"></span>
                          <span className="truncate min-w-0 flex-1">evals/</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll thin-hover-scrollbar min-w-0 min-h-0">
                  {/* Editor top tabs */}
                  <div className="flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto hide-scrollbar thin-hover-scrollbar">
                    {Object.keys(FILE_CODE_MAP).map(file => (
                      <button
                        key={file}
                        onClick={() => selectFileManually(file as CodingAgentFile)}
                        className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors ${activeFile === file ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                      >
                        {file}
                      </button>
                    ))}
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
                        activeFile.endsWith(".md") ? "markdown" : activeFile.endsWith(".py") ? "python" : activeFile.endsWith(".sh") ? "bash" : activeFile.endsWith(".json") ? "json" : activeFile.endsWith(".diff") ? "diff" : activeFile === "Dockerfile" ? "dockerfile" : activeFile.endsWith(".yml") ? "yaml" : "typescript",
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



            {/* Feature Cards aligned with vertical grid lines */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              {/* Added top horizontal line per user request */}
              <div className="min-w-0 border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                  {/* Card 1 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Cloud size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Managed Horos</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Our GPUs, per-million-tokens billing from L4 to B200.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Server size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Your infrastructure</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      AWS, GCP, RunPod, bare metal. Same verifier/, your cluster.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="px-8 py-16 flex flex-col gap-4 items-start">
                    <div className="w-14 h-14 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                      <Network size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Local workstation</h3>
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
            <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="flex flex-col items-center">
                <h2 className="text-[32px] md:text-[44px] font-medium tracking-tight text-[#F0EFE2] mb-4 text-center">
                  Supported open coding models
                </h2>
                <p className="text-[#C8C7BA] text-[15px] font-mono leading-relaxed text-center max-w-2xl mb-12">
                  Supported code models on Hugging Face integrate directly with Horos. Use any compatible completion API or self-hosted weight.
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
                    placeholder="Search any compatible coding model on Hugging Face"
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
                          <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center">
                            {getLogo(model.author, model.name)}
                          </div>
                          <div className="flex flex-col gap-1">
                            <h3 className="text-[20px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>{model.name}</h3>
                            <span className="text-[#C8C7BA] text-[15px] line-clamp-1" title={model.author}>{model.author}</span>
                          </div>
                          <div className="flex justify-between items-center mt-auto pt-4">
                            <span className="text-[#F0EFE2] font-medium">{model.downloads}</span>
                            <span className="text-[#75bf00] text-[12px] font-medium border border-[#2a381a] px-2 py-1 rounded-sm tracking-wide">{model.tag}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Tuning Section */}
        <div className="w-full relative z-10 py-24">
          <SectionDivider
            position="top"
            className="absolute top-0 left-0 w-full"
          />
          {/* Heading */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
              <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#F0EFE2] mb-4 text-center">
                What Horos tunes
              </h2>
              <p className="text-[#C8C7BA] text-[16px] font-sans leading-relaxed text-center max-w-2xl mx-auto mb-16">
                Every layer of the coding system, optimized against repository tasks, executable results, and your quality, latency, and cost constraints.
              </p>

              {/* Tunes Grid */}
              <div className="flex flex-col w-full border-t border-b border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                  
                  {/* Row 1 */}
                  <div className="px-10 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <ScanSearch size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Repository context</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Code symbols, imports, call sites, dependencies, issues, and diffs. Tune which information the agent uses for each coding task and repository revision.
                    </p>
                  </div>

                  <div className="px-10 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Zap size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Coding models and tools</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Compare coding models, tool schemas, action budgets, and retry strategies. Measure how each configuration affects code changes and task completion.
                    </p>
                  </div>

                  <div className="px-10 py-10 border-b border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Sliders size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Execution environment</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Control dependencies, compilers, test runners, resource limits, and permissions. Reproduce coding experiments in versioned environments.
                    </p>
                  </div>

                  {/* Row 2 */}
                  <div className="px-10 py-10 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Layers size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Patch verification</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Run builds, type checks, tests, and regression checks. Preserve each patch, execution result, and supporting evidence.
                    </p>
                  </div>

                  <div className="px-10 py-10 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Database size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Workload optimization</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Replay repository tasks and compare task success, tool failures, latency, token cost, GPU memory, and runtime configuration.
                    </p>
                  </div>

                  <div className="px-10 py-10 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Workflow size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">Experience to teaching</h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Turn test failures, accepted patches, review corrections, and regressions into new evaluations, coding skills, and model or system improvements. Evaluate new versions before promotion.
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
                <h2 className="text-[44px] md:text-[52px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
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
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />
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
            {/* Inner Vertical Lines matching the 14% columns */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="hidden md:block absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
              <div className="hidden md:block absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
               
            </div>

            {/* Faint Blueprint Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 z-0 bg-[position:14%_top]" />

            {/* Container for precise 72% alignment */}
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] absolute inset-0 pointer-events-none z-0">
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






