"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { RagSearchGrid } from "@/components/landing/rag-search-grid";
import { TokenPromptInput } from "@/components/horos/primitives/token-prompt-input";
import { HorosLogo, MetaLogo, DeepSeekLogo, NvidiaLogo, GoogleLogo, MistralLogo, HuggingFaceLogo, SGLangLogo, OpenAILogo, MicrosoftLogo, K8sFaviconLogo, VLLMLogo, QwenLogo, AuthorMonogram, KimiLogo, HorosWordmarkLogo, AnthropicLogo, GithubLogo, HermesLogo } from "@/components/horos/primitives/brand-icons";
import { Key, Cpu, Terminal, Code2, Sliders, Rocket, Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Play, Cloud, Server, Network, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Search, Brain, Infinity, Activity, Layers, Database, Mic, Workflow, Package, Gauge, Lock, EyeOff, ShieldCheck, Sun, Monitor, Moon, Zap, Loader2 } from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: "0 1",
    label: "Launch",
    runInfra: { title: "Pick model, deploy sandbox", desc: "Launch agents quickly and keep the production path open." },
    closed: { title: "Call provider API", desc: "Fast first demo, but the agent runtime stays rented." },
    diy: { title: "Build serving stack", desc: "Infra work comes before the agent learns anything." }
  },
  {
    num: "0 2",
    label: "Model control",
    runInfra: { title: "Bring the agent ID", desc: "Keep model choice and tool-serving decisions visible." },
    closed: { title: "Provider catalog", desc: "You use what the provider exposes." },
    diy: { title: "Your model", desc: "Full control if your team maintains the runtime." }
  },
  {
    num: "0 3",
    label: "Tuning",
    runInfra: { title: "Measured loop latency", desc: "Compare agent reasoning speed before deployment." },
    closed: { title: "Opaque", desc: "Latency and tool parsing stay behind the API." },
    diy: { title: "Manual profiling", desc: "Your team owns tuning and regressions." }
  },
  {
    num: "0 4",
    label: "Export",
    runInfra: { title: "Managed now, export later", desc: "Use the managed sandbox first, take the deploy package later." },
    closed: { title: "Locked endpoint", desc: "You keep calling the provider." },
    diy: { title: "Already owned", desc: "Export exists because you built it yourself." }
  },
  {
    num: "0 5",
    label: "Operations",
    runInfra: { title: "Low until you choose to own it", desc: "Operate managed agents, export with same measured plan." },
    closed: { title: "Low, with lock-in", desc: "Less infra work, less production control." },
    diy: { title: "High", desc: "You own infra, failures, upgrades, and serving." }
  },
  {
    num: "0 6",
    label: "Security",
    runInfra: { title: "SOC 2 Type II", desc: "Audited controls across agent tools, logging, and data." },
    closed: { title: "Varies by vendor", desc: "Compliance depends on the third-party provider." },
    diy: { title: "You build it", desc: "Your team owns the audit trail and access controls." }
  }
];


const OUTCOME_CODE = `import { IntentEngine, OutcomeContract } from "@horos/runtime";

export const AIAgentOutcome = new OutcomeContract({
  name: "RealTimeStreaming",
  intent: IntentEngine.parse("System must stream sub-100ms TTFT via WebRTC"),
  parameters: {
    maxLoopIterations: 10,
    allowedTools: ["search", "execute_code", "read_db"],
    requireHumanInLoop: "on_destructive_action"
  },
  verification: {
    enforceToolSchemas: true,
    blockHallucinatedTools: true,
    timeoutMs: 30000
  },
  onSuccess: (result) => console.log(\`Agent workflow completed: \${result}\`)
});`;

const CAPABILITY_CODE = `import { CapabilityFabric } from "@horos/runtime";

export const AgentToolsAPI = CapabilityFabric.register({
  name: "AgentToolsAPI",
  description: "Provide the agent with safe, sandboxed tools.",
  tools: [
    {
      name: "execute_python",
      action: async ({ code }) => {
        return await executeInSandbox(code);
      }
    },
    {
      name: "query_database",
      action: async ({ sql }) => {
        return await readOnlyQuery(sql);
      }
    }
  ],
  security: {
    sandbox: true,
    networkAccess: "restricted"
  }
});`;

const MISSION_CODE = `{
  "mission": {
    "name": "real-time-streaming",
    "runtime": {
      "mode": "agentic_loop",
      "max_iterations": 15
    },
    "routing": {
      "reasoning_model": "NousResearch/Hermes-3-Llama-3.1-8B",
      "tool_model": "Qwen/Qwen2.5-Coder-32B-Instruct"
    },
    "capabilities": [
      "AgentToolsAPI",
      "MemoryRetrievalAPI"
    ],
    "guardrails": {
      "halt_on_error": true,
      "require_approval": false
    }
  }
}`;

const CUDA_CODE = `// flash_attention.cu
#include <cuda.h>

__global__ void flash_attention_kernel(
    const float* Q, const float* K, const float* V,
    float* O, int N, int d) {
  // Kernel implementation for flash attention
  int tx = threadIdx.x;
  int bx = blockIdx.x;
  // ... (simplified for illustration)
}`;

const SERVE_CODE = `#!/bin/bash
# serve.sh

# Start the Horos serving engine
horos serve \\
  --model Qwen/Qwen2.5-Coder-32B-Instruct \\
  --port 8080 \\
  --tensor-parallel-size 1 \\
  --max-batch-size 32
`;

const PIPELINE_CODE = `{
  "pipeline": {
    "name": "real-time-pipeline",
    "version": "1.0",
    "stages": [
      {
        "id": "intent_parsing",
        "model": "Qwen/Qwen2.5-Coder-32B-Instruct"
      },
      {
        "id": "execution",
        "type": "streaming"
      }
    ]
  }
}`;

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
    } else if (lang === "typescript" || lang === "python") {
      const parts = content.split(/(\bimport\b|\bfrom\b|\bexport\b|\bclass\b|\bdef\b|\bconst\b|\bnew\b|\basync\b|\bawait\b|\breturn\b|"[^"]*")/);
      lineContent = parts.map((part, pi) => {
        if (["import", "from", "export", "class", "def", "const", "new", "async", "await", "return"].includes(part)) {
          return <span key={pi} className="text-[#a855f7] font-medium">{part}</span>;
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={pi} className="text-[#75bf00]">{part}</span>;
        }
        if (["IntentEngine", "OutcomeContract", "CapabilityFabric"].includes(part)) {
          return <span key={pi} className="text-[#3b82f6]">{part}</span>;
        }
        return <span key={pi}>{part}</span>;
      });
    } else if (lang === "json") {
      const parts = content.split(/("[^"]*"\s*:|"[^"]*"|\b\d+\b)/);
      lineContent = parts.map((part, pi) => {
        if (part.endsWith(":")) {
          return <span key={pi} className="text-[#93c5fd]">{part}</span>;
        }
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={pi} className="text-[#75bf00]">{part}</span>;
        }
        return <span key={pi}>{part}</span>;
      });
    } else {
      lineContent = <span>{content}</span>;
    }

    return (
      <div key={i} className="min-h-[22px] flex items-center">
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
  { id: "NousResearch/Hermes-3-Llama-3.1-8B", name: "Hermes 3 (8B)", author: "Nous Research", downloads: "8B", tag: "Agent LLM" },
  { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama 3.3 70B", author: "Meta", downloads: "70B", tag: "Agent LLM" },
  { id: "Qwen/Qwen2.5-Coder-32B-Instruct", name: "Qwen 2.5 Coder", author: "Alibaba", downloads: "32B", tag: "Agent LLM" },
  { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1", author: "DeepSeek", downloads: "671B MoE", tag: "Reasoning" },
  { id: "mistralai/Mistral-Large-Instruct-2407", name: "Mistral Large", author: "Mistral AI", downloads: "123B", tag: "Agent LLM" },
  { id: "meta-llama/Llama-3.1-8B-Instruct", name: "Llama 3.1 8B", author: "Meta", downloads: "8B", tag: "Agent LLM" },
  { id: "Qwen/QwQ-32B-Preview", name: "QwQ 32B", author: "Alibaba", downloads: "32B", tag: "Reasoning" },
  { id: "meta-llama/Llama-3.2-3B-Instruct", name: "Llama 3.2 3B", author: "Meta", downloads: "3B", tag: "Edge Agent" },
  { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen 2.5 72B", author: "Alibaba", downloads: "72B", tag: "Agent LLM" }
];

const AuthorAvatar = ({ author, size = 20 }: { author: string, size?: number }) => {
  const [error, setError] = useState(false);

  if (error || !author) {
    return <HuggingFaceLogo size={size} />;
  }

  const authorToGithubMap: Record<string, string> = {
    "Nous Research": "NousResearch",
    "DeepSeek": "deepseek-ai",
    "Mistral AI": "mistralai"
  };

  const githubOrg = authorToGithubMap[author] || author.replace(/\s+/g, '');

  return (
    <img
      src={`https://github.com/${githubOrg}.png`}
      alt={author}
      style={{ width: size, height: size }}
      className="rounded-sm object-cover bg-white/5"
      onError={() => setError(true)}
    />
  );
};

const getLogo = (author: string, modelName: string = "") => {
  if (!author && !modelName) return <AuthorMonogram label="HF" size={20} />;
  const a = (author || "").toLowerCase();
  const m = (modelName || "").toLowerCase();

  if (a.includes('openai') || m.includes('whisper') || m.includes('gpt')) return <OpenAILogo size={20} />;
  if (a.includes('meta') || a.includes('llama') || m.includes('llama')) return <MetaLogo size={20} />;
  if (a.includes('alibaba') || a.includes('qwen') || m.includes('qwen')) return <QwenLogo size={20} />;
  if (a.includes('nvidia') || m.includes('nvfp4')) return <NvidiaLogo size={20} />;
  if (a.includes('moonshot') || m.includes('kimi')) return <KimiLogo size={20} />;
  if (a.includes('microsoft') || m.includes('phi')) return <MicrosoftLogo size={20} />;
  if (a.includes('mistral') || m.includes('mistral') || m.includes('mixtral')) return <MistralLogo size={20} />;
  if (a.includes('deepseek') || m.includes('deepseek')) return <DeepSeekLogo size={20} />;

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
    question: "Can I bring my own fine-tuned model?",
    answer: "Yes, for supported agent-capable models. Paste the Hugging Face ID; unsupported or untuned shapes show baseline-only or gated status instead of a tuned run.",
  },
  {
    question: "Does this support tool calling?",
    answer: "Yes. Models like Llama 3.1 and Hermes that are trained for tool use are fully supported. Tool definitions are passed dynamically and executed natively.",
  },
  {
    question: "Can I run this on a smaller GPU?",
    answer: "Yes. By applying FP8 or INT4 quantization, you can fit an 8B agent model on a single L4 or RTX 4000 Ada with plenty of room left over for KV cache and context.",
  }
];

export default function RealTimePage() {
  const [activeTab, setActiveTab] = useState("Horos");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");
  type RealTimeFile =
    | "stream.py"
    | "config.yaml"
    | "webrtc.ts"
    | "serve.sh"
    | "pipeline.json"
    | "Dockerfile"
    | "docker-compose.yml"
    | "requirements.txt"
    | "README.md"
    | "outcome.ts"
    | "capability.ts"
    | "mission.json"
    | "flash_attention.cu"
    | "tool_definitions.py"
    | "memory.py"
    | "policies.py";

  const TOOL_DEFINITIONS_CODE = `import json
from typing import Dict, Any, Callable
from pydantic import BaseModel, Field

class WeatherQuery(BaseModel):
    location: str = Field(description="The city and state, e.g. San Francisco, CA")
    unit: str = Field(default="celsius", description="Temperature unit (celsius or fahrenheit)")

def get_current_weather(location: str, unit: str = "celsius") -> str:
    \"\"\"Get the current weather in a given location.\"\"\"
    # Mock realistic weather fetch
    weather_info = {
        "location": location,
        "temperature": "22",
        "unit": unit,
        "forecast": ["sunny", "windy"]
    }
    return json.dumps(weather_info)

# vLLM-compatible tool schema format for OpenAI Chat Completions API
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": WeatherQuery.model_json_schema()
        }
    }
]

TOOL_EXECUTORS: Dict[str, Callable] = {
    "get_current_weather": get_current_weather
}`;

  const MEMORY_CODE = `import redis
import json
from typing import List, Dict
from datetime import datetime, timezone

class SessionMemory:
    def __init__(self, redis_url: str = "redis://localhost:6379/0", ttl_seconds: int = 86400):
        self.client = redis.from_url(redis_url, decode_responses=True)
        self.ttl = ttl_seconds

    def append_message(self, session_id: str, role: str, content: str, tool_calls: List = None, tool_call_id: str = None):
        key = f"chat_session:{session_id}"
        msg = {
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        if tool_calls:
            msg["tool_calls"] = tool_calls
        if tool_call_id:
            msg["tool_call_id"] = tool_call_id
            
        self.client.rpush(key, json.dumps(msg))
        self.client.expire(key, self.ttl)

    def get_context(self, session_id: str, max_tokens: int = 4096) -> List[Dict]:
        key = f"chat_session:{session_id}"
        raw_msgs = self.client.lrange(key, 0, -1)
        return [json.loads(m) for m in raw_msgs]`;

  const POLICIES_CODE = `import re
import logging
from typing import Optional
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

class SecurityPolicies(BaseSettings):
    strict_pii_redaction: bool = True
    allowed_tool_domains: list[str] = ["api.weather.gov", "internal-services.local"]
    max_output_tokens: int = 1024

    def redact_pii(self, text: str) -> str:
        \"\"\"Strip obvious SSNs, Credit Cards, or Phone Numbers before logging or storing.\"\"\"
        if not self.strict_pii_redaction or not text:
            return text
            
        # Example naive redaction for SSN
        ssn_pattern = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
        redacted = ssn_pattern.sub('***-**-****', text)
        
        # Email redaction
        email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        redacted = email_pattern.sub('[EMAIL_REDACTED]', redacted)
        
        return redacted
        
    def validate_tool_execution(self, tool_name: str, args: dict) -> bool:
        \"\"\"Stream output safely through WebRTC audio bridge.\"\"\"
        logger.info(f"Validating execution for {tool_name}")
        # Add rate limiting or ACL checks here
        return True`;

  const SERVE_CODE = `#!/bin/bash
# Launch vLLM on a single NVIDIA L40S 48GB

export CUDA_VISIBLE_DEVICES=0
export VLLM_ATTENTION_BACKEND=FLASH_ATTN

python3 -m vllm.entrypoints.openai.api_server \\
  --model meta-llama/Llama-3.1-8B-Instruct \\
  --dtype bfloat16 \\
  --kv-cache-dtype auto \\
  --enable-chunked-prefill \\
  --max-model-len 8192 \\
  --gpu-memory-utilization 0.90 \\
  --enforce-eager \\
  --enable-prefix-caching \\
  --port 8000`;

  const PIPELINE_CODE = `{
  "pipeline_id": "real-time-streaming-pipeline",
  "deployment": {
    "engine": "vllm",
    "version": "0.6.2",
    "hardware": {
      "accelerator": "nvidia-l40s",
      "count": 1,
      "vram_req_gb": 40
    },
    "autoscaling": {
      "min_replicas": 1,
      "max_replicas": 5,
      "target_queue_length": 10
    }
  },
  "model": {
    "hf_hub_id": "meta-llama/Llama-3.1-8B-Instruct",
    "quantization": null,
    "system_prompt": "You are a low-latency real-time streaming assistant."
  },
  "features": {
    "streaming": true,
    "tool_calling_enabled": false,
    "prefix_caching": true,
    "chunked_prefill": true
  }
}`;

  const DOCKERFILE_CODE = `# Base image optimized for L40S and FlashAttention
FROM vllm/vllm-openai:v0.6.2

# Set working directory
WORKDIR /app

# Install additional Python dependencies for streaming
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy our runtime files
COPY stream.py config.yaml ./
COPY serve.sh ./

# Make launcher executable
RUN chmod +x serve.sh

# Expose the OpenAI compatible server port
EXPOSE 8000

# Start vLLM server
ENTRYPOINT ["./serve.sh"]`;

  const DOCKER_COMPOSE_CODE = `version: '3.8'

services:
  real-time-streaming-runtime:
    build: .
    ports:
      - "8000:8000"
    environment:
      - HUGGING_FACE_HUB_TOKEN=\${HF_TOKEN}
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - huggingface_cache:/root/.cache/huggingface
    shm_size: '8gb'`;

  const REQUIREMENTS_CODE = `vllm==0.6.2
torch==2.4.0
transformers==4.44.2
pydantic==2.9.2
pydantic-settings==2.5.2
redis==5.1.0
flash-attn==2.6.3
aiohttp==3.10.5`;

  const FILE_CODE_MAP: Record<string, string> = {
    "stream.py": "import asyncio\nimport aiohttp\n\nasync def stream_response():\n    async with aiohttp.ClientSession() as session:\n        async with session.post('http://localhost:8000/v1/chat/completions', json={\n            'model': 'meta-llama/Llama-3.1-8B-Instruct',\n            'messages': [{'role': 'user', 'content': 'Hello'}],\n            'stream': True\n        }) as response:\n            async for chunk in response.content.iter_chunked(1024):\n                print(chunk.decode('utf-8'))",
    "config.yaml": "model: meta-llama/Llama-3.1-8B-Instruct\ntensor_parallel_size: 1\ngpu_memory_utilization: 0.9\nmax_model_len: 8192\nkv_cache_dtype: auto",
    "webrtc.ts": "import { WebRTCClient } from '@horos/webrtc';\n\nconst client = new WebRTCClient({\n  url: 'wss://localhost:8080',\n  onTrack: (track) => {\n    console.log('Received audio track:', track);\n  }\n});",
    "serve.sh": SERVE_CODE,
    "pipeline.json": PIPELINE_CODE,
    "Dockerfile": DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE,
    "README.md": "# Real-Time Streaming\\n\\nProduction deployment manifest."
  };

  const [activeFile, setActiveFile] = useState<RealTimeFile>("stream.py");
  const [activeMainTab, setActiveMainTab] = useState<"pipeline" | "code" | "optimization" | "deploy">("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  // Auto-play vs Manual exploration mode
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTypingCode, setIsTypingCode] = useState(true);

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 = "I'll configure Llama 3 8B Instruct with continuous batching and PagedAttention, targeting <50ms TTFT on an L4.";
  const AGENT_MSG_2 = "Real-time stream is live. Chunked decoding enabled. Do you want me to wire this to the WebRTC TTS pipeline?";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

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
    } else if (visibleStep >= 2 && visibleStep <= 5) {
      timer = setTimeout(() => setVisibleStep(prev => prev + 1), 450);
    } else if (visibleStep === 6) {
      if (typedMsg2.length < AGENT_MSG_2.length) {
        timer = setTimeout(() => {
          setTypedMsg2(AGENT_MSG_2.slice(0, typedMsg2.length + 2));
        }, 18);
      }
    }

    return () => clearTimeout(timer);
  }, [visibleStep, typedMsg1, typedMsg2]);

  // Real-time code typing state
  const [typedCodeText, setTypedCodeText] = useState("");

  // Sync activeFile with visibleStep automatically as the chat execution progresses in Auto Mode
  useEffect(() => {
    if (!isAutoPlay) return;

    if (visibleStep === 0 || visibleStep === 1) {
      selectFileManually("stream.py" as any);
    } else if (visibleStep === 2) {
      selectFileManually("config.yaml" as any);
    } else if (visibleStep === 3) {
      setActiveFile("serve.sh");
    } else if (visibleStep === 4) {
      selectFileManually("webrtc.ts" as any);
    } else if (visibleStep === 5) {
      selectFileManually("stream.py" as any);
    } else if (visibleStep === 6) {
      setActiveFile("pipeline.json");
    }
  }, [visibleStep, isAutoPlay]);

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || "";

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

  const selectFileManually = (file: RealTimeFile) => {
    setIsAutoPlay(false);
    setActiveFile(file);
    setActiveMainTab("code");
  };

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
    <div className="min-h-screen bg-[#151515] text-[#C8C7BA] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        body { background-color: #151515 !important; }
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
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               {/* Top Crosshairs */}
               <div className="absolute left-[4%] md:left-[6%] lg:left-[18%] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="absolute right-[4%] md:right-[6%] lg:right-[18%] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute left-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute right-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
            </div>

          {/* Hero Content */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] py-24 md:py-32 relative z-10">
            <div />
            <div className="min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-4 md:px-8 lg:px-12">
                {/* Left: Content */}
                <div className="flex flex-col gap-6 max-w-lg">
                  <div className="flex items-center w-fit border border-dashed border-[#333] p-[3px] gap-[3px] rounded-sm mb-2">
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <MetaLogo size={14} />
                    </div>
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <QwenLogo size={14} />
                    </div>
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <HermesLogo size={14} />
                    </div>
                  </div>
                  <h1 className="text-5xl lg:text-[54px] font-medium tracking-tight leading-[1.15] mt-[-1rem]">
                    Real-time AI<br />
                    streaming that<br />
                    delivers <span className="bg-[#75bf00] text-black px-2 py-0 inline-block">instantly</span>.
                  </h1>
                  <p className="text-[#C8C7BA] text-[13px] md:text-[14px] lg:text-[15px] tracking-wide max-w-md mt-4 leading-relaxed">
                    <span className="inline-flex items-center gap-1.5 text-[#C8C7BA] font-medium whitespace-nowrap align-middle mr-0.5"><MetaLogo size={14} /> Llama</span>,{" "}
                    <span className="inline-flex items-center gap-1.5 text-[#C8C7BA] font-medium whitespace-nowrap align-middle mx-0.5"><QwenLogo size={14} /> Qwen</span>, and{" "}
                    <span className="inline-flex items-center gap-1.5 text-[#C8C7BA] font-medium whitespace-nowrap align-middle mx-0.5"><HermesLogo size={14} /> Hermes</span> models. Native streaming, continuous{" "}
                    <span className="inline-flex items-center gap-1.5 text-[#C8C7BA] font-medium whitespace-nowrap align-middle mx-0.5"><Sparkles size={14} className="text-[#75bf00]" /> batching loops</span>, and strict performance guardrails running securely on your infrastructure.
                  </p>
                  <div className="flex items-center gap-4 mt-6">
                    <button className="group bg-[#75bf00] text-black px-5 py-2.5 text-[12px] md:text-[13px] lg:text-[14px] font-normal hover:bg-[#85cf00] transition-colors rounded-none flex items-center gap-1.5">
                      Deploy this pipeline <ChevronRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button className="group bg-transparent text-[#94a3b8] border border-[#333] px-5 py-2.5 text-[12px] md:text-[13px] lg:text-[14px] font-normal hover:bg-[#1a1a1a] transition-colors rounded-none flex items-center gap-1.5">
                      Read the stack <ChevronRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* Right: Ecosystem Grid Graphic with Contour Background */}
                <div className="flex justify-center relative w-full">
                  <SkeletonGrid />
                </div>
              </div>{/* close 2-col grid */}
            </div>{/* close center col min-w-0 */}
            <div />{/* right empty col */}
          </div>{/* close hero grid */}
        </div>{/* close hero container */}


        {/* Features Section */}
        <div className="w-full relative z-10 mt-16">
          {/* Heading */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-16">
                <h2 className="text-6xl font-medium tracking-tight mb-4">Own your real-time latency.</h2>
                <p className="text-[#999999] text-xl max-w-xl mx-auto">
                  No black box API latency. Sub-100ms TTFT streaming with full access to vLLM optimization knobs, chunked decoding, and kv-cache.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Grid with End-to-End Horizontal Lines */}
          <div className="w-full relative z-10">
            {/* Constrained Horizontal Borders */}
            
            <SectionDivider position="bottom" className="absolute bottom-0 left-0 w-full z-20" />

            {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               {/* Top Crosshairs */}
               <div className="absolute left-[4%] md:left-[6%] lg:left-[18%] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="absolute right-[4%] md:right-[6%] lg:right-[18%] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute left-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute right-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
            </div>

            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
              <div />
              <div className="min-w-0 mx-[10px] border-t border-b border-l border-r border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Card 1 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[14px] md:text-[15px] lg:text-[16px] font-medium">0 1</div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA] leading-tight">Deploy the model your<br />pipeline needs.</h3>
                    <p className="text-[#C8C7BA] text-xl leading-relaxed">
                      Hermes, Llama, Qwen, or your own fine-tune. The streaming pipeline tunes its configuration around your choice.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-16 min-h-[300px] bg-[#151515] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[14px] md:text-[15px] lg:text-[16px] font-medium">0 2</div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA] leading-tight">Streaming and inference<br />on your own<br />stack.</h3>
                    <p className="text-[#C8C7BA] text-xl leading-relaxed">
                      OpenAI-compatible endpoints with native streaming and execution control. Fully optimized for high concurrency.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-16 min-h-[300px] flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[14px] md:text-[15px] lg:text-[16px] font-medium">0 3</div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA] leading-tight">Own the runtime<br />and the data.</h3>
                    <p className="text-[#C8C7BA] text-xl leading-relaxed">
                      Export the Dockerfile and serve script. Run the ecosystem on your own managed infrastructure or private GPUs.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Comparison Heading */}
        <div className="w-full flex flex-col items-center justify-center pt-32 pb-16 px-4 relative z-10">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <h2 className="text-5xl lg:text-[52px] font-medium tracking-tight mb-6 text-center">
            Three ways to ship <span className="text-[#75bf00]">real-time streaming.</span>
          </h2>
          <p className="text-[#C8C7BA] text-base md:text-[17px] lg:text-[18px] font-sans leading-relaxed text-center max-w-2xl">
            Workflow comparison for streaming pipelines across Horos, closed-source APIs, and DIY orchestration.
          </p>
        </div>

        {/* Table with End-to-End Horizontal Lines */}
        <div className="w-full relative z-10 bg-[#151515]/20 pt-[25px] pb-[10px] mb-32">
          {/* Double Horizontal Border Top */}
          
          {/* Double Horizontal Border Bottom */}
          

          {/* Double Vertical Borders & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               {/* Top Crosshairs */}
               <div className="absolute left-[4%] md:left-[6%] lg:left-[18%] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="absolute right-[4%] md:right-[6%] lg:right-[18%] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute left-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] -translate-x-[1px] -translate-y-[1px]" />
               <div className="hidden lg:block absolute right-[calc(18%+120px)] top-0 w-[3px] h-[3px] bg-[#888] translate-x-[1px] -translate-y-[1px]" />
            </div>

          {/* Table Content */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-30">
            <div />
            <div className="min-w-0 bg-[#151515]">
              {/* Table Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 border-t border-l border-r border-dashed border-[#333]">
                <div className="hidden md:flex items-center px-8 py-6 border-b md:border-r border-dashed border-[#333]">
                  <span className="text-[9px] md:text-[10px] font-medium tracking-[0.2em] text-[#C8C7BA] uppercase">What Matters</span>
                </div>
                <div className="flex flex-col justify-center px-8 py-6 border-b md:border-r border-dashed border-[#333] relative bg-[#75bf00]/[0.05]">
                  <div className="absolute top-4 right-4 flex items-center">
                    <span className="text-[9px] font-medium tracking-[0.2em] text-[#75bf00] uppercase">Recommended</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-[#111] border border-[#333] flex items-center justify-center rounded-md">
                      <HorosLogo size={28} />
                    </div>
                    <span className="text-xl md:text-2xl lg:text-[28px] font-medium text-[#75bf00]">Horos</span>
                  </div>
                  <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px]">OpenAI-compatible endpoints with bare-metal model control.</p>
                </div>
                <div className="flex flex-col justify-center px-8 py-6 border-b md:border-r border-dashed border-[#333]">
                  <div className="flex items-center gap-3 mb-2">
                    <Key size={28} className="text-[#C8C7BA]" />
                    <span className="text-xl md:text-2xl lg:text-[28px] font-medium text-[#C8C7BA]">Closed model APIs</span>
                  </div>
                  <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px]">Per-token, hosted.</p>
                </div>
                <div className="flex flex-col justify-center px-8 py-6 border-b border-dashed border-[#333]">
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu size={28} className="text-[#C8C7BA]" />
                    <span className="text-xl md:text-2xl lg:text-[28px] font-medium text-[#C8C7BA]">DIY self-hosting</span>
                  </div>
                  <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px]">Full control, heavy operations.</p>
                </div>
              </div>

              {/* Table Rows */}
              <div className="border-l border-r border-b border-dashed border-[#333]">
                {COMPARISON_ROWS.map((row, idx) => (
                  <div key={idx} className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200">
                    <div className="flex items-center px-8 py-8 md:border-r border-dashed border-[#333] min-h-[140px]">
                      <div className="flex items-center gap-3">
                        <span className="text-[#75bf00] font-mono text-[14px] md:text-[15px] lg:text-[16px] font-medium">{row.num}</span>
                        <h3 className="text-xl md:text-[22px] lg:text-[24px] font-medium text-[#C8C7BA]">{row.label}</h3>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center px-8 py-8 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.05]">
                      <h4 className="text-xl md:text-[22px] lg:text-[24px] font-medium !text-[#75bf00] mb-2">{row.runInfra.title}</h4>
                      <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">{row.runInfra.desc}</p>
                    </div>

                    <div className="flex flex-col justify-center px-8 py-8 md:border-r border-dashed border-[#333]">
                      <h4 className="text-xl md:text-[22px] lg:text-[24px] font-medium text-[#C8C7BA] mb-2">{row.closed.title}</h4>
                      <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">{row.closed.desc}</p>
                    </div>

                    <div className="flex flex-col justify-center px-8 py-8">
                      <h4 className="text-xl md:text-[22px] lg:text-[24px] font-medium text-[#C8C7BA] mb-2">{row.diy.title}</h4>
                      <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">{row.diy.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div />
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
                <h2 className="text-5xl lg:text-[52px] font-medium tracking-tight mb-6 text-[#C8C7BA]">
                  Code you own. <span className="text-[#75bf00]">Deploy anywhere.</span>
                </h2>
                <p className="text-[#999999] text-base md:text-[17px] lg:text-[18px] max-w-2xl mx-auto leading-relaxed">
                  The full recipe ships with you. Codebase, kernels, engine config, weights. Run it anywhere.
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
                    <button onClick={() => setActiveMainTab("pipeline")} className={`flex items-center gap-2 text-[9px] md:text-[10px] lg:text-[11px] font-medium uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "pipeline" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      <span className="text-[#75bf00]">&gt;_</span> PIPELINE
                    </button>
                    <button onClick={() => setActiveMainTab("code")} className={`flex items-center gap-2 text-[9px] md:text-[10px] lg:text-[11px] font-medium uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "code" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      <Code2 size={13} /> CODE
                    </button>
                    <button onClick={() => setActiveMainTab("optimization")} className={`flex items-center gap-2 text-[9px] md:text-[10px] lg:text-[11px] font-medium uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "optimization" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      <Sliders size={13} /> OPTIMIZATION
                    </button>
                    <button onClick={() => setActiveMainTab("deploy")} className={`flex items-center gap-2 text-[9px] md:text-[10px] lg:text-[11px] font-medium uppercase tracking-widest transition-colors pb-1 border-b-2 ${activeMainTab === "deploy" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      <Rocket size={13} /> DEPLOY
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-4">

                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#75bf00] animate-pulse" />
                      <span className="text-[9px] md:text-[10px] font-medium text-[#75bf00] tracking-widest uppercase">Live</span>
                    </div>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-6 flex flex-col justify-between overflow-hidden pointer-events-auto">
                  <div className="flex flex-col gap-6 overflow-y-auto chat-scroll pr-2 pb-4">
                    {/* Step 0 */}
                    <div className={`bg-[#1a1a1a] border border-[#252525] p-5 rounded-[4px] transition-all duration-500 transform ${visibleStep >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                      <p className="text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] font-medium leading-[26px]">
                        Build a real-time streaming pipeline. <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] whitespace-nowrap align-middle mx-0.5 translate-y-[-1px]"><MetaLogo size={13} /> Llama-3</span> for sub-100ms TTFT execution. Serve on a single <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] whitespace-nowrap align-middle mx-0.5 translate-y-[-1px]"><NvidiaLogo size={13} /> L40S</span> with continuous batching.
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
                        <span className="text-[9px] md:text-[10px] font-medium tracking-widest text-[#555] uppercase">System</span>
                        <p className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] leading-relaxed">
                          {typedMsg1}
                          {visibleStep === 1 && typedMsg1.length < AGENT_MSG_1.length && (
                            <span className="inline-block w-1.5 h-3.5 bg-[#75bf00] ml-0.5 animate-pulse align-middle" />
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                      {/* Step 2 */}
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
                            <span className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] font-medium">Profiled continuous batching on L40S</span>
                            <span className="text-[#C8C7BA] text-[10px] md:text-[11px] lg:text-[12px]">1.2s</span>
                          </div>
                          <span className="text-[#666] text-[10px] md:text-[11px] lg:text-[12px]">85ms first-token p50</span>
                        </div>
                      </div>

                      {/* Step 3 */}
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
                            <span className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] font-medium">Selected vLLM with chunked prefill enabled</span>
                            <span className="text-[#C8C7BA] text-[10px] md:text-[11px] lg:text-[12px]">0.9s</span>
                          </div>
                          <span className="text-[#666] text-[10px] md:text-[11px] lg:text-[12px]">Strict JSON schema enforcement for function calling</span>
                        </div>
                      </div>

                      {/* Step 4 */}
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
                            <span className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] font-medium">Tuned AWQ INT4 quantization</span>
                            <span className="text-[#C8C7BA] text-[10px] md:text-[11px] lg:text-[12px]">1.4s</span>
                          </div>
                          <span className="text-[#666] text-[10px] md:text-[11px] lg:text-[12px]">+58% throughput at flat quality</span>
                        </div>
                      </div>

                      {/* Step 5 */}
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
                            <span className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] font-medium">Ran TTFT latency bench harness, 500 requests</span>
                            <span className="text-[#C8C7BA] text-[10px] md:text-[11px] lg:text-[12px]">1.5s</span>
                          </div>
                          <span className="text-[#666] text-[10px] md:text-[11px] lg:text-[12px]">p95 380ms, 12k tok/s steady</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 6 */}
                    <div className={`flex gap-3 mt-2 transition-all duration-500 transform ${visibleStep >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                      <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                        {visibleStep === 6 && typedMsg2.length < AGENT_MSG_2.length ? (
                          <Loader2 size={14} className="text-[#75bf00] animate-spin" />
                        ) : (
                          <Sparkles size={14} className="text-[#75bf00]" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-medium tracking-widest text-[#555] uppercase">System</span>
                        <p className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] leading-relaxed">
                          {typedMsg2}
                          {visibleStep === 6 && typedMsg2.length < AGENT_MSG_2.length && (
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
                        placeholder="Test the low-latency stream..."
                        className="bg-transparent text-[#777] text-[11px] md:text-[12px] lg:text-[13px] border-none outline-none w-full px-2 py-2"
                        readOnly
                      />
                      <div className="flex justify-between items-center px-1">
                        <div className="flex gap-1.5">
                          <span className="bg-[#1a1a1a] border border-[#333] text-[9px] md:text-[10px] lg:text-[11px] text-[#C8C7BA] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1.5">@ Models</span>
                          <span className="bg-[#1a1a1a] border border-[#333] text-[9px] md:text-[10px] lg:text-[11px] text-[#C8C7BA] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1.5"><Server size={12} /> vLLM</span>
                          <span className="bg-[#1a1a1a] border border-[#333] text-[9px] md:text-[10px] lg:text-[11px] text-[#C8C7BA] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1.5">L40S 48GB</span>
                        </div>
                        <button className="w-7 h-7 bg-transparent border border-[#333] hover:bg-[#222] transition-colors flex items-center justify-center text-[#C8C7BA] rounded-sm">
                          <ArrowUp size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files Content */}
                <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-6 flex flex-col items-start gap-4 overflow-auto pointer-events-auto chat-scroll">
                  <div className="flex justify-between items-center border-b border-[#252525] pb-3 mb-2">
                    <span className="text-[9px] md:text-[10px] font-medium tracking-widest text-[#C8C7BA] uppercase">TOOL DEFINITIONS</span>
                    <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-medium px-1.5 py-0.5 rounded-sm">3</span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[11px] md:text-[12px] lg:text-[13px] font-mono">
                    {/* Kernels files */}
                    <button onClick={() => { selectFileManually("tool_definitions.py" as any); }} className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "tool_definitions.py" ? "text-[#75bf00] font-medium" : "text-[#C8C7BA] hover:text-[#C8C7BA]"}`}>
                      <ChevronRight size={14} className={activeFile === "tool_definitions.py" ? "text-[#75bf00]" : "text-[#555]"} /> tool_definitions.py
                    </button>
                    <button onClick={() => { selectFileManually("memory.py" as any); }} className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "memory.py" ? "text-[#75bf00] font-medium" : "text-[#C8C7BA] hover:text-[#C8C7BA]"}`}>
                      <ChevronRight size={14} className={activeFile === "memory.py" ? "text-[#75bf00]" : "text-[#555]"} /> memory.py
                    </button>
                    <button onClick={() => { selectFileManually("policies.py" as any); }} className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "policies.py" ? "text-[#75bf00] font-medium" : "text-[#C8C7BA] hover:text-[#C8C7BA]"}`}>
                      <ChevronRight size={14} className={activeFile === "policies.py" ? "text-[#75bf00]" : "text-[#555]"} /> policies.py
                    </button>

                    {/* Project Tree Folder */}
                    <div className="mt-6 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-[#aaa] font-medium">
                        <ChevronDown size={14} className="text-[#777]" /> real-time-streaming/
                      </div>
                      <div className="pl-4 flex flex-col gap-1.5 border-l border-[#252525] ml-3.5 mt-1">
                        <button onClick={() => { selectFileManually("serve.sh" as any); }} className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "serve.sh" ? "text-[#75bf00] font-medium" : "text-[#666] hover:text-[#C8C7BA]"}`}>
                          <ChevronRight size={14} className={activeFile === "serve.sh" ? "text-[#75bf00]" : "text-[#444]"} /> serve.sh
                        </button>
                        <button onClick={() => { selectFileManually("pipeline.json" as any); }} className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "pipeline.json" ? "text-[#75bf00] font-medium" : "text-[#666] hover:text-[#C8C7BA]"}`}>
                          <ChevronRight size={14} className={activeFile === "pipeline.json" ? "text-[#75bf00]" : "text-[#444]"} /> pipeline.json
                        </button>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          <ChevronRight size={14} className="text-[#333]" /> Dockerfile
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          <ChevronRight size={14} className="text-[#333]" /> docker-compose.yml
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          <ChevronRight size={14} className="text-[#333]" /> requirements.txt
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          <ChevronRight size={14} className="text-[#333]" /> models/
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          <ChevronRight size={14} className="text-[#333]" /> evals/
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                          <ChevronRight size={14} className="text-[#333]" /> README.md
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll">
                  {/* Editor top tabs */}
                  <div className="flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <button onClick={() => selectFileManually("stream.py" as any)} className={`text-[10px] md:text-[11px] lg:text-[12px] font-mono font-medium px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "stream.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      stream.py
                    </button>
                    <button onClick={() => selectFileManually("config.yaml" as any)} className={`text-[10px] md:text-[11px] lg:text-[12px] font-mono font-medium px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "config.yaml" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      config.yaml
                    </button>
                    <button onClick={() => selectFileManually("webrtc.ts" as any)} className={`text-[10px] md:text-[11px] lg:text-[12px] font-mono font-medium px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "webrtc.ts" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      webrtc.ts
                    </button>
                    <button onClick={() => selectFileManually("serve.sh" as any)} className={`text-[10px] md:text-[11px] lg:text-[12px] font-mono font-medium px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "serve.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      serve.sh
                    </button>
                    <button onClick={() => selectFileManually("pipeline.json" as any)} className={`text-[10px] md:text-[11px] lg:text-[12px] font-mono font-medium px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#C8C7BA]"}`}>
                      pipeline.json
                    </button>
                  </div>

                  {/* Code Area with Line Numbers */}
                  <div className="flex font-mono text-[11px] md:text-[12px] lg:text-[13px] leading-relaxed overflow-x-auto select-text">
                    {/* Line numbers column */}
                    <div className="text-[#444] text-right pr-5 border-r border-[#252525] select-none flex flex-col min-w-[32px]">
                      {Array.from({ length: typedCodeText ? typedCodeText.split("\n").length : 1 }).map((_, i) => (
                        <div key={i} className="min-h-[22px] leading-[22px]">{i + 1}</div>
                      ))}
                    </div>

                    {/* Highlighted code column */}
                    <div className="pl-5 flex-1 text-[#C8C7BA] leading-[22px]">
                      {highlightCode(
                        typedCodeText,
                        activeFile.endsWith(".py") ? "python" :
                          activeFile.endsWith(".sh") ? "bash" :
                            activeFile.endsWith(".json") ? "json" :
                              activeFile.endsWith(".yml") ? "yaml" :
                                "text",
                        !isTypingCode
                      )}
                    </div>
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
                  <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Cloud size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl md:text-[22px] lg:text-[24px] font-medium text-[#C8C7BA]">Managed RunInfra</h3>
                  <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                    Our GPUs, per-million-tokens billing from L4 to B200.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="px-8 py-16 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                  <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Server size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl md:text-[22px] lg:text-[24px] font-medium text-[#C8C7BA]">Your infrastructure</h3>
                  <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                    AWS, GCP, RunPod, bare metal. Same verifier/, your cluster.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="px-8 py-16 flex flex-col gap-4 items-start">
                  <div className="w-12 h-12 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                    <Network size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl md:text-[22px] lg:text-[24px] font-medium text-[#C8C7BA]">Local workstation</h3>
                  <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                    docker compose up. Full pipeline on a single GPU.
                  </p>
                </div>
              </div>
            </div>
            <div />
          </div>
        </div>

              </div>
              <div />
            </div>
        {/* Hugging Face Catalog Section */}
          <div className="w-full relative z-10 pt-24 pb-16">
            <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#C8C7BA] mb-4 text-center">
                Supported HF real-time models work
              </h2>
              <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] font-mono leading-relaxed text-center max-w-2xl mb-12">
                Supported low-latency models on Hugging Face run seamlessly through our pipeline. Search the live catalog above. The examples below are just a starting view.
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
                  placeholder="Search any real-time model on Hugging Face"
                  className="w-full bg-[#1a1a1a] border border-dashed border-[#333] text-[#C8C7BA] text-[13px] md:text-[14px] lg:text-[15px] pl-11 pr-14 py-3.5 rounded-[4px] outline-none focus:border-[#555] transition-colors font-sans placeholder:text-[#666]"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-[9px] md:text-[10px] font-medium text-[#C8C7BA] border border-dashed border-[#333] px-1.5 py-0.5 rounded-sm">HF</span>
                </div>
              </div>

              {/* Models Grid */}
              <div className="w-full border-y border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {isLoading ? (
                    <div className="col-span-3 flex justify-center items-center py-24 text-[#C8C7BA] font-mono text-[12px] md:text-[13px] lg:text-[14px]">
                      Loading models from Hugging Face...
                    </div>
                  ) : models.length === 0 ? (
                    <div className="col-span-3 flex justify-center items-center py-24 text-[#C8C7BA] font-mono text-[12px] md:text-[13px] lg:text-[14px]">
                      No models found for "{searchQuery}"
                    </div>
                  ) : (
                    models.map((model, index) => (
                      <a href={`https://huggingface.co/${model.id}`} target="_blank" rel="noopener noreferrer" key={model.id} className={getBorderClasses(index, models.length) + " block"}>
                        <ArrowUpRight size={20} className="text-[#75bf00] absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center">
                          {getLogo(model.author, model.name)}
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA] group-hover:text-[#75bf00] transition-colors line-clamp-1" title={model.name}>{model.name}</h3>
                          <span className="text-[#C8C7BA] text-[13px] md:text-[14px] lg:text-[15px] line-clamp-1" title={model.author}>{model.author}</span>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4">
                          <span className="text-[#C8C7BA] font-medium">{model.downloads}</span>
                          <span className="text-[#75bf00] text-[10px] md:text-[11px] lg:text-[12px] font-medium border border-[#2a381a] px-2 py-1 rounded-sm tracking-wide">{model.tag}</span>
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

        {/* What Horos tunes Section */}
        <div className="w-full relative z-10 pt-24">
          <SectionDivider position="top" className="absolute top-0 left-0 w-full" />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-[#C8C7BA] mb-4 text-center">
                What Horos tunes for Real-Time
              </h2>
              <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] font-sans leading-relaxed text-center max-w-2xl mb-16">
                Every stage of the pipeline, retuned per model and GPU.
              </p>

              {/* Tunes Grid */}
              <div className="flex flex-col w-full border-t border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 w-full">

                  {/* Row 1 */}
                  <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Cpu size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA]">Kernel sweep</h3>
                    <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                      FlashAttention, FlashInfer, Marlin, custom fusion. Correctness + speedup gates on every rewrite.
                    </p>
                  </div>

                  <div className="px-12 py-20 border-b md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Layers size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA]">Quantization</h3>
                    <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                      FP8, AWQ, GPTQ, HQQ, INT8 SmoothQuant, NVFP4. Quality scored against your accuracy floor.
                    </p>
                  </div>

                  <div className="px-12 py-20 border-b border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Database size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA]">KV cache</h3>
                    <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                      FP8, INT4, and TurboQuant 3-4 bit KV compression. 60 to 75% VRAM savings.
                    </p>
                  </div>

                  {/* Row 2 */}
                  <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Zap size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA]">Speculative decoding</h3>
                    <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                      EAGLE3, MTP, n-gram lookup, draft model. 1.3 to 2x decode speedup, weights untouched.
                    </p>
                  </div>

                  <div className="px-12 py-20 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Sliders size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA]">Serving config</h3>
                    <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                      Continuous batching, chunked prefill, PagedAttention, prefix cache. Tuned across vLLM, SGLang, TensorRT-LLM.
                    </p>
                  </div>

                  <div className="px-12 py-20 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-6 items-start">
                    <div className="text-[#75bf00]">
                      <Cloud size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-4xl font-medium text-[#C8C7BA]">Multi-cloud capacity</h3>
                    <p className="text-[#C8C7BA] text-lg md:text-[19px] lg:text-[20px] leading-relaxed">
                      Pareto GPU selection across L4 to B200. Managed or exportable.
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
              <p className="text-[#c7c3b7] text-[18px] md:text-[20px] lg:text-[22px] font-sans leading-relaxed text-center max-w-2xl mb-16 mx-auto">
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
          <p className="text-[#C8C7BA] text-[14px] md:text-[15px] lg:text-[16px] mb-16 text-center max-w-lg">
            Everything you need to know about deploying and operating real-time AI pipelines.
          </p>

          <div className="w-full max-w-3xl flex flex-col">
            {FAQ_DATA.map((faq, idx) => (
              <div key={idx} className="flex flex-col border-b border-dashed border-[#333] py-8">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span className={`text-base md:text-[17px] lg:text-[18px] font-medium transition-colors ${activeFaq === idx ? 'text-[#C8C7BA]' : 'text-[#C8C7BA] group-hover:text-[#C8C7BA]'}`}>
                    {faq.question}
                  </span>
                  <div className={`w-6 h-6 rounded-full border border-[#333] flex items-center justify-center transition-all ${activeFaq === idx ? 'bg-[#75bf00] border-[#75bf00] text-black rotate-180' : 'bg-transparent text-[#C8C7BA] group-hover:border-[#666]'}`}>
                    <ChevronDown size={14} strokeWidth={2} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === idx ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <p className="text-[#C8C7BA] text-[13px] md:text-[14px] lg:text-[15px] leading-relaxed pr-8">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <GlobalFooter />
      </main>
    </div>
  );
}




