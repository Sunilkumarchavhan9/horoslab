"use client";
import { SectionDivider } from "@/components/landing/section-divider";
import { GlobalFooter } from "@/components/landing/global-footer";

import React, { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { LiveLatencyPipeline } from "@/components/landing/live-latency-pipeline";
import { AIAssistantGrid } from "@/components/landing/ai-assistant-grid";
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
  AuthorMonogram,
  KimiLogo,
  HorosWordmarkLogo,
  AnthropicLogo,
  GithubLogo,
  HermesLogo,
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
} from "lucide-react";

const COMPARISON_ROWS = [
  {
    num: '0 1',
    label: 'System',
    runInfra: {
      title: 'Version the complete intelligence system',
      desc: 'Model, context, capabilities, runtime, compute, workload, environment, and policies are defined as one reproducible system version with lineage.',
    },
    closed: {
      title: 'Provider-defined system',
      desc: 'The provider determines the model, runtime, serving path, and infrastructure behind the assistant.',
    },
    diy: {
      title: 'Assemble it yourself',
      desc: 'Your team connects the model, application logic, tools, runtime, infrastructure, and deployment stack.',
    },
  },
  {
    num: '0 2',
    label: 'Models',
    runInfra: {
      title: 'Discover and evaluate open models',
      desc: 'Bring models from Hugging Face, customer artifacts, private registries, or local registries. Horos validates the artifact, checks license and dependencies, verifies runtime and hardware compatibility, versions the model, and builds its capability profile.',
    },
    closed: {
      title: 'Provider model catalog',
      desc: 'Choose from the models and versions exposed through the API.',
    },
    diy: {
      title: 'Own the model lifecycle',
      desc: 'Source, validate, serve, evaluate, update, and maintain models yourself.',
    },
  },
  {
    num: '0 3',
    label: 'Context',
    runInfra: {
      title: 'Engineer context as part of intelligence',
      desc: 'Treat retrieval, memory, history, task context, tool context, compressed context, selected context, long context, and adaptive context as versioned system variables.',
    },
    closed: {
      title: 'Provider-managed context',
      desc: 'Context handling, retrieval, caching, and other model-side context behavior remain inside the provider\'s stack.',
    },
    diy: {
      title: 'Build the context system',
      desc: 'Your team owns memory, retrieval, storage, context construction, caching, and context evaluation.',
    },
  },
  {
    num: '0 4',
    label: 'Capabilities',
    runInfra: {
      title: 'Compose capabilities around the model',
      desc: 'Use models, tools, skills, data, runtimes, verifiers, environments, and hardware as explicit capabilities with provenance, resource profiles, security posture, and composability. Capability and permission remain separate.',
    },
    closed: {
      title: 'Provider capabilities',
      desc: 'Use the tools, integrations, and execution features exposed by the provider.',
    },
    diy: {
      title: 'Build every capability',
      desc: 'Implement tools, APIs, execution services, credentials, permissions, isolation, retries, and observability yourself.',
    },
  },
  {
    num: '0 5',
    label: 'Workload',
    runInfra: {
      title: 'Learn the workload behind the assistant',
      desc: 'Capture input and output distributions, task type, tool trajectory, context length, concurrency, batching, burstiness, traffic distribution, GPU utilization, memory, failures, network, and resource usage.',
    },
    closed: {
      title: 'Provider-managed workload',
      desc: 'The provider decides how traffic is routed, batched, scheduled, and executed internally.',
    },
    diy: {
      title: 'Build workload intelligence',
      desc: 'Collect traces, create replay datasets, benchmark production traffic, and maintain the workload model yourself.',
    },
  },
  {
    num: '0 6',
    label: 'Optimization',
    runInfra: {
      title: 'Search the complete intelligence system',
      desc: 'Search across model, data, context, runtime, kernel, hardware, workload, and environment. Predict candidates, run experiments, measure them, verify the result, then keep or discard the change.',
    },
    closed: {
      title: 'Provider optimization',
      desc: 'Runtime, kernels, batching, hardware placement, inference strategy, and lower-level optimization remain outside your control.',
    },
    diy: {
      title: 'Manual system search',
      desc: 'Your engineers design experiments, profile configurations, tune infrastructure, and maintain regressions.',
    },
  },
  {
    num: '0 7',
    label: 'Verification',
    runInfra: {
      title: 'Verify behavior and claims',
      desc: 'Evaluate capability, behavior, and system performance, then verify whether the claimed result is actually supported by evidence. Support task, trajectory, domain, safety, formal, output, and independent verification.',
    },
    closed: {
      title: 'Provider evaluation',
      desc: 'You mainly depend on provider benchmarks, model evaluations, and service guarantees.',
    },
    diy: {
      title: 'Build the verification loop',
      desc: 'Create evaluation protocols, datasets, experiments, evidence, regression tests, and promotion gates yourself.',
    },
  },
  {
    num: '0 8',
    label: 'Experience',
    runInfra: {
      title: 'Record what actually happened',
      desc: 'Store the mission, reality, model, data, runtime, experiment, decision, action, observation, evidence, consequence, and result as a structured experience record. Mine failures, regressions, drift, anomalies, rare events, and edge cases from that experience.',
    },
    closed: {
      title: 'Provider-owned operational history',
      desc: 'Your application receives responses and telemetry, while the provider controls much of the underlying model and runtime history.',
    },
    diy: {
      title: 'Build your own experience layer',
      desc: 'Collect interaction traces, tool trajectories, outcomes, failures, and production evidence yourself.',
    },
  },
  {
    num: '0 9',
    label: 'Teaching',
    runInfra: {
      title: 'Turn lessons into new intelligence',
      desc: 'Use experience and lessons to teach the model, runtime, or system through fine-tuning, LoRA, RL, distillation, adaptation, retraining, reward, world-model training, routing, serving, context, caching, configuration, compute, placement, hardware, data path, or environment changes.',
    },
    closed: {
      title: 'Provider-owned teaching',
      desc: 'The provider controls how the underlying intelligence is trained and improved.',
    },
    diy: {
      title: 'Build the teaching pipeline',
      desc: 'Construct training data, learning signals, adaptations, evaluations, and new versions yourself.',
    },
  },
  {
    num: '1 0',
    label: 'Authority',
    runInfra: {
      title: 'Decide what intelligence is allowed to do',
      desc: 'Separate capability, permission, authority, approval, and credentials. Before consequential execution, check mission authority, policy, capability, credentials, resources, current state, and preconditions. Return ALLOW, DENY, or REQUIRES_APPROVAL and recheck state before execution.',
    },
    closed: {
      title: 'Provider-controlled authority',
      desc: 'Identity, authorization, credentials, execution controls, and infrastructure boundaries are largely defined by the provider.',
    },
    diy: {
      title: 'Own the authority layer',
      desc: 'Your team implements identity, permissions, credentials, approvals, policies, isolation, and execution controls.',
    },
  }
];

const OUTCOME_CODE = `import { IntentEngine, OutcomeContract } from "@horos/runtime";

export const PersonalAssistantOutcome = new OutcomeContract({
  name: "PersonalAssistant",
  intent: IntentEngine.parse("User wants a secure, localized assistant for daily tasks"),
  parameters: {
    contextAccess: "enum: [local_only, secure_cloud]",
    toolUse: "boolean",
    privacyLevel: "strict"
  },
  verification: {
    // Independent Verifier checks PII leaks
    blockPIIExfiltration: true,
    requireAuditTrail: true
  },
  onSuccess: (result) => console.log(\`Task completed securely: \${result}\`)
});`;

const CAPABILITY_CODE = `import { CapabilityFabric } from "@horos/runtime";

export const LocalContextAPI = CapabilityFabric.register({
  name: "LocalContextAPI",
  description: "Read local files and calendar with strict sandboxing.",
  tools: [
    {
      name: "searchLocalFiles",
      action: async ({ query, path }) => {
        // ... API logic
        return await localSearch(query, path);
      }
    }
  ],
  security: {
    auth: "LOCAL_KEY",
    sandbox: true,
    networkAccess: false
  }
});`;

const MISSION_CODE = `{
  "mission": {
    "name": "personal-ai-assistant",
    "runtime": {
      "mode": "autonomous",
      "latency_target_ms": 300
    },
    "routing": {
      "intent_model": "Qwen/Qwen2.5-Coder-32B-Instruct",
      "embedding": "nomic-ai/nomic-embed-text-v1.5"
    },
    "capabilities": [
      "LocalContextAPI",
      "BrowserControlAPI"
    ],
    "learning": {
      "active_rlhf": true,
      "shadow_mode_fallback": true
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
    "name": "ai-assistant-pipeline",
    "version": "1.0",
    "stages": [
      {
        "id": "intent_parsing",
        "model": "Qwen/Qwen2.5-Coder-32B-Instruct"
      },
      {
        "id": "execution",
        "type": "autonomous"
      }
    ]
  }
}`;

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
    } else if (lang === "typescript" || lang === "python") {
      const parts = content.split(
        /(\bimport\b|\bfrom\b|\bexport\b|\bclass\b|\bdef\b|\bconst\b|\bnew\b|\basync\b|\bawait\b|\breturn\b|"[^"]*")/,
      );
      lineContent = parts.map((part, pi) => {
        if (
          [
            "import",
            "from",
            "export",
            "class",
            "def",
            "const",
            "new",
            "async",
            "await",
            "return",
          ].includes(part)
        ) {
          return (
            <span key={pi} className="text-[#a855f7] font-semibold">
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
        if (
          ["IntentEngine", "OutcomeContract", "CapabilityFabric"].includes(part)
        ) {
          return (
            <span key={pi} className="text-[#3b82f6]">
              {part}
            </span>
          );
        }
        return <span key={pi}>{part}</span>;
      });
    } else if (lang === "json") {
      const parts = content.split(/("[^"]*"\s*:|"[^"]*"|\b\d+\b)/);
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
  {
    id: "Qwen/Qwen3.5-122B-A10B",
    name: "Qwen3.5-122B-A10B",
    author: "Alibaba",
    downloads: "122B MoE",
    tag: "Tool Use",
  },
  {
    id: "Qwen/Qwen3.5-35B-A3B",
    name: "Qwen3.5-35B-A3B",
    author: "Alibaba",
    downloads: "35B MoE",
    tag: "Tool Use",
  },
  {
    id: "NousResearch/Hermes-4.3-36B",
    name: "Hermes 4.3 36B",
    author: "Nous Research",
    downloads: "36B",
    tag: "Function Calling",
  },
  {
    id: "Qwen/Qwen3.5-27B",
    name: "Qwen3.5-27B",
    author: "Alibaba",
    downloads: "27B",
    tag: "Vision",
  },
  {
    id: "NousResearch/Hermes-4-14B",
    name: "Hermes 4 14B",
    author: "Nous Research",
    downloads: "14B",
    tag: "JSON Output",
  },
  {
    id: "Qwen/Qwen3.5-9B",
    name: "Qwen3.5-9B",
    author: "Alibaba",
    downloads: "9B",
    tag: "Tool Use",
  },
  {
    id: "mistralai/Ministral-3-8B-Instruct-2512",
    name: "Ministral 3 8B Instruct",
    author: "Mistral AI",
    downloads: "8B",
    tag: "Function Calling",
  },
  {
    id: "Qwen/Qwen3.5-2B",
    name: "Qwen3.5-2B",
    author: "Alibaba",
    downloads: "2B",
    tag: "Vision",
  },
  {
    id: "mistralai/Ministral-3-3B-Instruct-2512",
    name: "Ministral 3 3B Instruct",
    author: "Mistral AI",
    downloads: "3B",
    tag: "Multilingual",
  },
];

const AuthorAvatar = ({
  author,
  size = 20,
}: {
  author: string;
  size?: number;
}) => {
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
  if (!author && !modelName) return <AuthorMonogram label="HF" size={20} />;
  const a = (author || "").toLowerCase();
  const m = (modelName || "").toLowerCase();

  if (a.includes("openai") || m.includes("whisper") || m.includes("gpt"))
    return <OpenAILogo size={20} />;
  if (a.includes("meta") || a.includes("llama") || m.includes("llama"))
    return <MetaLogo size={20} />;
  if (a.includes("alibaba") || a.includes("qwen") || m.includes("qwen"))
    return <QwenLogo size={20} />;
  if (a.includes("nvidia") || m.includes("nvfp4"))
    return <NvidiaLogo size={20} />;
  if (a.includes("mistral") || m.includes("ministral"))
    return <MistralLogo size={20} />;
  if (a.includes("nous") || m.includes("hermes"))
    return <HermesLogo size={26} />;
  if (a.includes("moonshot") || m.includes("kimi"))
    return <KimiLogo size={20} />;
  if (a.includes("coqui") || a.includes("canopy"))
    return <span className="text-[18px]">🤗</span>;
  if (a.includes("microsoft") || m.includes("phi"))
    return <MicrosoftLogo size={20} />;
  if (a.includes("mistral") || m.includes("mistral") || m.includes("mixtral"))
    return <MistralLogo size={20} />;
  if (a.includes("deepseek") || m.includes("deepseek"))
    return <DeepSeekLogo size={20} />;

  return <AuthorAvatar author={author} size={20} />;
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
    question: "Can I bring my own fine-tuned model?",
    answer:
      "Yes, for supported chat-capable models. Paste the Hugging Face ID; unsupported or untuned shapes show baseline-only or gated status instead of a tuned run.",
  },
  {
    question: "Does this support tool calling?",
    answer:
      "Yes. Models like Llama 3.1 and Hermes that are trained for tool use are fully supported. Tool definitions are passed dynamically and executed natively.",
  },
  {
    question: "Can I run this on a smaller GPU?",
    answer:
      "Yes. By applying FP8 or INT4 quantization, you can fit an 8B chat model on a single L4 or RTX 4000 Ada with plenty of room left over for KV cache and context.",
  },
];

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState("RunInfra");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">(
    "sign-in",
  );
  type AIAssistantFile =
    | "tool_definitions.py"
    | "memory.py"
    | "policies.py"
    | "serve.sh"
    | "pipeline.json"
    | "Dockerfile"
    | "docker-compose.yml"
    | "requirements.txt"
    | "README.md"
    | "outcome.ts"
    | "capability.ts"
    | "mission.json"
    | "flash_attention.cu";

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
        \"\"\"Enforce guardrails on autonomous tool calls before execution.\"\"\"
        logger.info(f"Validating execution for {tool_name}")
        # Add rate limiting or ACL checks here
        return True`;

  const SERVE_CODE = `#!/bin/bash
# Launch vLLM on a single NVIDIA L40S 48GB

export CUDA_VISIBLE_DEVICES=0
export VLLM_ATTENTION_BACKEND=FLASH_ATTN

python3 -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Meta-Llama-3.1-8B-Instruct \
  --dtype bfloat16 \
  --kv-cache-dtype auto \
  --enable-chunked-prefill \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.90 \
  --enforce-eager \
  --enable-prefix-caching \
  --port 8000`;

  const PIPELINE_CODE = `{
  "pipeline_id": "llama-3.1-8b-tools",
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
    "hf_hub_id": "meta-llama/Meta-Llama-3.1-8B-Instruct",
    "quantization": null,
    "system_prompt": "You are a helpful assistant with access to tools."
  },
  "features": {
    "streaming": true,
    "tool_calling_enabled": true,
    "prefix_caching": true
  }
}`;

  const DOCKERFILE_CODE = `# Base image optimized for L40S and FlashAttention
FROM vllm/vllm-openai:v0.6.2

# Set working directory
WORKDIR /app

# Install additional Python dependencies for memory and tools
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy our agent runtime files
COPY tool_definitions.py memory.py policies.py ./
COPY serve.sh ./

# Make launcher executable
RUN chmod +x serve.sh

# Expose the OpenAI compatible server port
EXPOSE 8000

# Start vLLM server
ENTRYPOINT ["./serve.sh"]`;

  const DOCKER_COMPOSE_CODE = `version: '3.8'

services:
  llm-agent:
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
    shm_size: '8gb'
    
  redis-memory:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  huggingface_cache:`;

  const REQUIREMENTS_CODE = `vllm==0.6.2
torch==2.4.0
transformers==4.44.2
pydantic==2.9.2
pydantic-settings==2.5.2
redis==5.1.0
flash-attn==2.6.3
outlines==0.0.46`;

  const FILE_CODE_MAP: Record<string, string> = {
    "tool_definitions.py": TOOL_DEFINITIONS_CODE,
    "memory.py": MEMORY_CODE,
    "policies.py": POLICIES_CODE,
    "serve.sh": SERVE_CODE,
    "pipeline.json": PIPELINE_CODE,
    Dockerfile: DOCKERFILE_CODE,
    "docker-compose.yml": DOCKER_COMPOSE_CODE,
    "requirements.txt": REQUIREMENTS_CODE,
    "README.md":
      "# Horos Infra AI Assistant\\n\\nProduction deployment manifest.",
  };

  const [activeFile, setActiveFile] = useState<AIAssistantFile>(
    "tool_definitions.py",
  );
  const [activeMainTab, setActiveMainTab] = useState<
    "pipeline" | "code" | "optimization" | "deploy"
  >("pipeline");
  const [activeFaq, setActiveFaq] = useState(0);

  // Auto-play vs Manual exploration mode
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTypingCode, setIsTypingCode] = useState(true);

  // Sequential Real-Time Character Streaming Animation state for Showcase Chat
  const AGENT_MSG_1 =
    "On it. I'll profile Llama on the L40S, configure vLLM with tool calling and streaming, then benchmark a realistic chat trace.";
  const AGENT_MSG_2 =
    "Recipe is ready. Targeting first token 85ms and throughput 12k tok/s on L40S at $1.40/hr. Run the in-app bench on your traffic to lock the numbers. Want me to deploy?";

  const [typedMsg1, setTypedMsg1] = useState("");
  const [typedMsg2, setTypedMsg2] = useState("");
  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

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
    } else if (visibleStep >= 2 && visibleStep <= 5) {
      // Steps 2-5: Reveal logs sequentially one by one
      timer = setTimeout(() => setVisibleStep((prev) => prev + 1), 450);
    } else if (visibleStep === 6) {
      // Step 6 (LAST): Type out AGENT_MSG_2 real-time character-by-character at the very end
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
      selectFileManually("tool_definitions.py" as any);
    } else if (visibleStep === 2) {
      selectFileManually("policies.py" as any);
    } else if (visibleStep === 3) {
      setActiveFile("serve.sh");
    } else if (visibleStep === 4) {
      selectFileManually("memory.py" as any);
    } else if (visibleStep === 5) {
      selectFileManually("tool_definitions.py" as any);
    } else if (visibleStep === 6) {
      setActiveFile("pipeline.json");
    }
  }, [visibleStep, isAutoPlay]);

  // Code character-by-character real-time streaming typewriter effect when activeFile changes
  useEffect(() => {
    const fullCode = FILE_CODE_MAP[activeFile] || TOOL_DEFINITIONS_CODE;

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

  const selectFileManually = (file: AIAssistantFile) => {
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

            let tag = "Model";
            if (m.pipeline_tag) {
              if (m.pipeline_tag.includes("text-generation")) tag = "LLM";
              else if (m.pipeline_tag.includes("automatic-speech-recognition"))
                tag = "STT";
              else if (m.pipeline_tag.includes("text-to-speech")) tag = "TTS";
              else if (m.pipeline_tag.includes("audio-classification"))
                tag = "Audio";
            }

            let author = m.author || m.id.split("/")[0];
            let name = m.id.split("/").pop();

            return {
              id: m.id,
              name: name,
              author: author,
              downloads: dl,
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
        body { background-color: #151515 !important; }
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
                <div className="flex flex-col gap-5 max-w-xl">
                  <div className="flex items-center w-fit border border-dashed border-[#333] p-[3px] gap-[3px] rounded-sm mb-2">
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <QwenLogo size={14} />
                    </div>
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <MetaLogo size={14} />
                    </div>
                    <div className="flex items-center justify-center border border-dashed border-[#333] bg-[#0a0a0a] p-[5px] rounded-sm">
                      <NvidiaLogo size={14} />
                    </div>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-medium tracking-tight leading-[1.12] text-[#F0EFE2] mt-[-1rem]">
                      Personal AI assistants on the models{" "}
                      <span className="bg-[#75bf00] text-black px-2 py-0 inline-block">
                        you own
                      </span>.
                    </h1>
                  <p className="text-[#C8C7BA] text-[15px] sm:text-[16px] tracking-wide leading-relaxed max-w-lg mt-2 font-sans">
                    <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] text-[13px] whitespace-nowrap align-middle mr-0.5 translate-y-[-1px]">
                      <MetaLogo size={13} /> Llama
                    </span>
                    , Hermes, Qwen, or supported open{" "}
                    <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] text-[13px] whitespace-nowrap align-middle mx-0.5 translate-y-[-1px]">
                      <HuggingFaceLogo size={13} /> Hugging Face
                    </span>{" "}
                    chat models. Tool use,{" "}
                    <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] text-[13px] whitespace-nowrap align-middle mx-0.5 translate-y-[-1px]">
                      <ShieldCheck size={13} className="text-[#C8C7BA]" />{" "}
                      policy
                    </span>
                    , and streaming on a single{" "}
                    <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] text-[13px] whitespace-nowrap align-middle mx-0.5 translate-y-[-1px]">
                      <NvidiaLogo size={13} /> GPU
                    </span>
                    .
                  </p>
                  <div className="flex items-center gap-4 mt-6">
                    <button className="group bg-[#75bf00] text-black px-5 py-2.5 text-[14px] font-normal hover:bg-[#85cf00] transition-colors rounded-none flex items-center gap-1.5">
                      Deploy your assistant{" "}
                      <ChevronRight
                        size={16}
                        strokeWidth={2}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>
                    <button className="group bg-transparent text-[#94a3b8] border border-[#333] px-5 py-2.5 text-[14px] font-normal hover:bg-[#1a1a1a] transition-colors rounded-none flex items-center gap-1.5">
                      Read the stack{" "}
                      <ChevronRight
                        size={16}
                        strokeWidth={2}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>
                  </div>
                </div>

                {/* Right: Ecosystem Grid Graphic with Contour Background */}
                <div className="flex justify-center relative w-full">
                  <AIAssistantGrid />
                </div>
              </div>
              {/* close 2-col grid (L129) */}
            </div>
            {/* close center col min-w-0 (L128) */}
            <div />
            {/* right empty col */}
          </div>
          {/* close hero grid (L126) */}
        </div>
        {/* close hero container (L102) */}

        {/* Features Section */}
        <div className="w-full relative z-10 mt-16">
          {/* Heading */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="min-w-0">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-[44px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4">
                  What you actually own
                </h2>
                <p className="text-[#C8C7BA] text-[16px] font-sans leading-relaxed max-w-2xl mx-auto">
                  The intelligence, its experience, and the system that runs it. Horos keeps the model, context, tools, decisions, evidence, and versions traceable as one evolving assistant.
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
                  <div className="p-8 lg:p-12 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">
                      0 1
                    </div>
                    <h3 className="text-xl font-medium text-[#F0EFE2] leading-tight">
                      Your intelligence version.
                    </h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      The exact model, context strategy, tools, runtime, configuration, and deployment behind the assistant. Every change becomes a version you can evaluate, compare, and promote.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-8 lg:p-12 bg-[#151515] flex flex-col gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">
                      0 2
                    </div>
                    <h3 className="text-xl font-medium text-[#F0EFE2] leading-tight">
                      Your assistant&apos;s experience.
                    </h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      Conversations, tool trajectories, failures, outcomes, observations, and feedback become structured experience instead of disappearing into application logs.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-8 lg:p-12 flex flex-col gap-4">
                    <div className="text-[#75bf00] font-mono text-[11px] font-bold">
                      0 3
                    </div>
                    <h3 className="text-xl font-medium text-[#F0EFE2] leading-tight">
                      Your improvement loop.
                    </h3>
                    <p className="text-[#C8C7BA] text-[15px] leading-relaxed">
                      Evaluate what the assistant actually did, verify the result, and turn proven experience into new evaluation data, teaching signals, policies, or system versions.
                    </p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>
        
        <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] mt-32">
          <div />
          <div className="min-w-0">
            <div className="text-center">
              <h2 className="text-3xl md:text-[44px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4">
                Three ways to ship AI assistants
              </h2>
              <p className="text-[#C8C7BA] text-[16px] font-sans leading-relaxed max-w-2xl mx-auto">
                Most teams either consume a hosted intelligence API or build the assistant stack themselves. Horos lets you compose, optimize, verify, and evolve the intelligence system around the assistant.
              </p>
            </div>
          </div>
          <div />
        </div>
        {/* Table with End-to-End Horizontal Lines */}
        <div className="w-full relative z-10 bg-[#151515]/20 pt-[25px] pb-[10px] mt-32 mb-32">
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
                  <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug mt-1">
                    Engineer, verify, and evolve the assistant system.
                  </p>
                </div>
                <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b md:border-r border-dashed border-[#333]">
                  <div className="flex items-center gap-3 mb-2">
                    <Key size={16} className="text-[#C8C7BA]" />
                    <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">
                        Closed model APIs
                      </span>
                  </div>
                  <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug mt-1">
                    Managed intelligence, limited control.
                  </p>
                </div>
                <div className="flex flex-col justify-center px-4 py-4 lg:px-5 border-b border-dashed border-[#333]">
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu size={16} className="text-[#C8C7BA]" />
                    <span className="text-[15px] sm:text-[16px] font-semibold text-[#F0EFE2]">
                        DIY self-hosting
                      </span>
                  </div>
                  <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-snug mt-1">
                    Full control, full engineering burden.
                  </p>
                </div>
              </div>

              {/* Table Rows */}
              <div className="border-l border-r border-b border-dashed border-[#333]">
                {COMPARISON_ROWS.map((row, idx) => (
                  <div
                    key={idx}
                    className="group grid grid-cols-1 md:grid-cols-4 border-b border-dashed border-[#333] last:border-b-0 hover:bg-[#171915] transition-colors duration-200"
                  >
                    <div className="flex items-center px-4 py-4 lg:px-5 md:border-r border-dashed border-[#333] min-h-[72px]">
                      <div className="flex items-center gap-3">
                        <span className="text-[#75bf00] font-mono text-[12px] font-bold">
                          {row.num}
                        </span>
                        <span className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">
                          {row.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center px-4 py-4 lg:px-5 md:border-r border-dashed border-[#333] bg-[#75bf00]/[0.02]">
                      <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#75bf00] transition-colors mb-1 leading-snug">
                        {row.runInfra.title}
                      </h4>
                      <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-relaxed group-hover:text-[#F0EFE2] transition-colors">
                        {row.runInfra.desc}
                      </p>
                    </div>

                    <div className="flex flex-col justify-center px-4 py-4 lg:px-5 md:border-r border-dashed border-[#333]">
                      <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors mb-1 leading-snug">
                        {row.closed.title}
                      </h4>
                      <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-relaxed group-hover:text-[#F0EFE2] transition-colors">
                        {row.closed.desc}
                      </p>
                    </div>

                    <div className="flex flex-col justify-center px-4 py-4 lg:px-5">
                      <h4 className="text-[13.5px] sm:text-[14px] font-medium text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors mb-1 leading-snug">
                        {row.diy.title}
                      </h4>
                      <p className="text-[#C8C7BA] text-[12px] sm:text-[13px] leading-relaxed group-hover:text-[#F0EFE2] transition-colors">
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

        {/* Sandbox Showcase Section */}
        <div className="w-full relative z-10 mt-32">
          {/* Top Divider for Sandbox Section */}
          <SectionDivider position="top" className="absolute top-0 left-0 w-full z-20" />
          {/* Heading for Sandbox */}
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] pt-16 mb-16">
            <div />
            <div className="min-w-0">
              <div className="text-center">
                <h2 className="text-4xl lg:text-[44px] font-medium tracking-tight mb-6 text-[#F0EFE2]">
                  Code you own.{" "}
                  <span className="text-[#75bf00]">Deploy anywhere.</span>
                </h2>
                <p className="text-[#999999] text-[16px] max-w-2xl mx-auto leading-relaxed">
                  The full recipe ships with you. Codebase, kernels, engine
                  config, weights. Run it anywhere.
                </p>
              </div>
            </div>
            <div />
          </div>

          {/* Top Horizontal Border spanning full screen */}
          <SectionDivider
            position="top"
            className="absolute top-0 left-0 right-0 z-20"
          />

          {/* Sandbox Workspace Row */}
          <div className="w-full relative z-10 bg-[#151515]/20 py-16">
            <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)] relative z-10">
              <div />
              <div className="w-full relative min-w-0">
                {/* Sandbox Content Container (SVG Skeleton Architecture) */}
                <div
                  className="w-full relative mx-auto"
                  style={{ aspectRatio: "1351 / 892" }}
                >
                  {/* Panes Backgrounds (Z-0) */}
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: "41fr 443fr 226fr 602fr 39fr",
                      gridTemplateRows: "53.5fr 785fr 53.5fr",
                    }}
                  >
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
                  <div
                    className="absolute inset-0 grid pointer-events-none z-20"
                    style={{
                      gridTemplateColumns: "41fr 443fr 226fr 602fr 39fr",
                      gridTemplateRows: "53.5fr 785fr 53.5fr",
                    }}
                  >
                    {/* Tabs */}
                    <div className="col-start-2 col-end-5 row-start-1 row-end-2 flex items-center justify-between px-6 pointer-events-auto min-w-0">
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
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#75bf00] animate-pulse" />
                          <span className="text-[10px] font-bold text-[#75bf00] tracking-widest uppercase">
                            Live
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Content */}
                    <div className="col-start-2 col-end-3 row-start-2 row-end-3 p-6 flex flex-col justify-between overflow-hidden pointer-events-auto min-w-0">
                      <div className="w-full min-w-0 flex flex-col gap-6 overflow-y-auto chat-scroll pr-2 pb-4">
                        {/* Step 0 */}
                        <div
                          className={`bg-[#1a1a1a] border border-[#252525] p-5 rounded-[4px] transition-all duration-500 transform ${visibleStep >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                        >
                          <p className="text-[#C8C7BA] text-[14px] font-medium leading-[26px]">
                            Build a personal AI assistant.{" "}
                            <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] text-[13px] whitespace-nowrap align-middle mx-0.5 translate-y-[-1px]">
                              <MetaLogo size={13} /> Llama-3.1-8B
                            </span>{" "}
                            for chat with tool calling. Serve on a single{" "}
                            <span className="inline-flex items-center gap-1.5 bg-[#151515] border border-[#333] px-1.5 py-0.5 rounded text-[#C8C7BA] text-[13px] whitespace-nowrap align-middle mx-0.5 translate-y-[-1px]">
                              <NvidiaLogo size={13} /> L40S
                            </span>{" "}
                            with streaming.
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

                        <div className="flex flex-col gap-4 mt-2">
                          {/* Step 2 */}
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
                                  Profiled Llama-3.1-8B on L40S
                                </span>
                                <span className="text-[#C8C7BA] text-[12px]">
                                  1.2s
                                </span>
                              </div>
                              <span className="text-[#666] text-[12px]">
                                85ms first-token p50
                              </span>
                            </div>
                          </div>

                          {/* Step 3 */}
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
                                  Selected vLLM serving engine
                                </span>
                                <span className="text-[#C8C7BA] text-[12px]">
                                  0.9s
                                </span>
                              </div>
                              <span className="text-[#666] text-[12px]">
                                OpenAI-compatible chat with tool calling
                              </span>
                            </div>
                          </div>

                          {/* Step 4 */}
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
                                  Tuned AWQ INT4 quantization
                                </span>
                                <span className="text-[#C8C7BA] text-[12px]">
                                  1.4s
                                </span>
                              </div>
                              <span className="text-[#666] text-[12px]">
                                +58% throughput at flat quality
                              </span>
                            </div>
                          </div>

                          {/* Step 5 */}
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
                                  Ran chat harness, 500 turns
                                </span>
                                <span className="text-[#C8C7BA] text-[12px]">
                                  1.5s
                                </span>
                              </div>
                              <span className="text-[#666] text-[12px]">
                                p95 380ms, 12k tok/s steady
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Step 6 */}
                        <div
                          className={`flex gap-3 mt-2 transition-all duration-500 transform ${visibleStep >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                        >
                          <div className="w-6 h-6 rounded-[4px] border border-[#252525] flex items-center justify-center shrink-0">
                            {visibleStep === 6 &&
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
                              {visibleStep === 6 &&
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
                            placeholder="Try Mistral 7B and rerun the harness..."
                            className="bg-transparent text-[#777] text-[13px] border-none outline-none w-full px-2 py-2"
                            readOnly
                          />
                          <div className="flex justify-between items-center px-1">
                            <div className="flex gap-1.5">
                              <span className="bg-[#1a1a1a] border border-[#333] text-[11px] text-[#C8C7BA] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1.5">
                                @ Models
                              </span>
                              <span className="bg-[#1a1a1a] border border-[#333] text-[11px] text-[#C8C7BA] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1.5">
                                <Server size={12} /> vLLM
                              </span>
                              <span className="bg-[#1a1a1a] border border-[#333] text-[11px] text-[#C8C7BA] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1.5">
                                L40S 48GB
                              </span>
                            </div>
                            <button className="w-7 h-7 bg-transparent border border-[#333] hover:bg-[#222] transition-colors flex items-center justify-center text-[#C8C7BA] rounded-sm">
                              <ArrowUp size={14} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Files Content */}
                    <div className="col-start-3 col-end-4 row-start-2 row-end-3 p-6 flex flex-col items-start gap-4 overflow-auto pointer-events-auto chat-scroll min-w-0">
                      <div className="w-full min-w-0 flex justify-between items-center border-b border-[#252525] pb-3 mb-2">
                        <span className="text-[10px] font-bold tracking-widest text-[#C8C7BA] uppercase">
                          TOOL DEFINITIONS
                        </span>
                        <span className="bg-[#1a2310] border border-[#2a381a] text-[#75bf00] text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0">
                          3
                        </span>
                      </div>

                      <div className="w-full min-w-0 flex flex-col gap-1.5 text-[13px] font-mono">
                        {/* Kernels files */}
                        <button
                          onClick={() => {
                            selectFileManually("tool_definitions.py" as any);
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "tool_definitions.py" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          <ChevronRight
                            size={14}
                            className={
                              activeFile === "tool_definitions.py"
                                ? "text-[#75bf00]"
                                : "text-[#555]"
                            }
                          />{" "}
                          tool_definitions.py
                        </button>
                        <button
                          onClick={() => {
                            selectFileManually("memory.py" as any);
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "memory.py" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          <ChevronRight
                            size={14}
                            className={
                              activeFile === "memory.py"
                                ? "text-[#75bf00]"
                                : "text-[#555]"
                            }
                          />{" "}
                          memory.py
                        </button>
                        <button
                          onClick={() => {
                            selectFileManually("policies.py" as any);
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "policies.py" ? "text-[#75bf00] font-semibold" : "text-[#C8C7BA] hover:text-[#F0EFE2]"}`}
                        >
                          <ChevronRight
                            size={14}
                            className={
                              activeFile === "policies.py"
                                ? "text-[#75bf00]"
                                : "text-[#555]"
                            }
                          />{" "}
                          policies.py
                        </button>

                        {/* Project Tree Folder */}
                        <div className="mt-6 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 px-2 py-1.5 text-[#aaa] font-semibold">
                            <ChevronDown size={14} className="text-[#777]" />{" "}
                            horos-ai-assistant/
                          </div>
                          <div className="pl-4 flex flex-col gap-1.5 border-l border-[#252525] ml-3.5 mt-1">
                            <button
                              onClick={() => {
                                selectFileManually("serve.sh" as any);
                              }}
                              className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "serve.sh" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <ChevronRight
                                size={14}
                                className={
                                  activeFile === "serve.sh"
                                    ? "text-[#75bf00]"
                                    : "text-[#444]"
                                }
                              />{" "}
                              serve.sh
                            </button>
                            <button
                              onClick={() => {
                                selectFileManually("pipeline.json" as any);
                              }}
                              className={`flex items-center gap-2 px-2 py-1.5 transition-colors w-full text-left rounded-[4px] ${activeFile === "pipeline.json" ? "text-[#75bf00] font-semibold" : "text-[#666] hover:text-[#C8C7BA]"}`}
                            >
                              <ChevronRight
                                size={14}
                                className={
                                  activeFile === "pipeline.json"
                                    ? "text-[#75bf00]"
                                    : "text-[#444]"
                                }
                              />{" "}
                              pipeline.json
                            </button>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              <ChevronRight size={14} className="text-[#333]" />{" "}
                              Dockerfile
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              <ChevronRight size={14} className="text-[#333]" />{" "}
                              docker-compose.yml
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              <ChevronRight size={14} className="text-[#333]" />{" "}
                              requirements.txt
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              <ChevronRight size={14} className="text-[#333]" />{" "}
                              models/
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              <ChevronRight size={14} className="text-[#333]" />{" "}
                              evals/
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-[#555]">
                              <ChevronRight size={14} className="text-[#333]" />{" "}
                              README.md
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Code Content */}
                    <div className="col-start-4 col-end-5 row-start-2 row-end-4 p-8 flex flex-col justify-start overflow-auto pointer-events-auto chat-scroll min-w-0">
                      {/* Editor top tabs */}
                      <div className="w-full min-w-0 flex border-b border-[#252525] mb-6 pb-2 pt-1 gap-2 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <button
                          onClick={() =>
                            selectFileManually("tool_definitions.py" as any)
                          }
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "tool_definitions.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          tool_definitions.py
                        </button>
                        <button
                          onClick={() => selectFileManually("memory.py" as any)}
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "memory.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          memory.py
                        </button>
                        <button
                          onClick={() =>
                            selectFileManually("policies.py" as any)
                          }
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "policies.py" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          policies.py
                        </button>
                        <button
                          onClick={() => selectFileManually("serve.sh" as any)}
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "serve.sh" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          serve.sh
                        </button>
                        <button
                          onClick={() =>
                            selectFileManually("pipeline.json" as any)
                          }
                          className={`shrink-0 whitespace-nowrap text-[12px] font-mono font-bold px-3 py-1.5 border-b-2 transition-colors relative ${activeFile === "pipeline.json" ? "text-[#75bf00] border-[#75bf00]" : "text-[#666] border-transparent hover:text-[#F0EFE2]"}`}
                        >
                          pipeline.json
                        </button>
                      </div>

                      {/* Code Area with Line Numbers */}
                      <div className="w-full min-w-0 flex font-mono text-[13px] leading-relaxed overflow-x-auto select-text">
                        {/* Line numbers column */}
                        <div className="text-[#444] text-right pr-5 border-r border-[#252525] select-none flex flex-col min-w-[32px]">
                          {Array.from({
                            length: typedCodeText
                              ? typedCodeText.split("\n").length
                              : 1,
                          }).map((_, i) => (
                            <div
                              key={i}
                              className="min-h-[22px] leading-[22px]"
                            >
                              {i + 1}
                            </div>
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
                                  : activeFile.endsWith(".yml")
                                    ? "yaml"
                                    : "text",
                            !isTypingCode,
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
                    <div className="px-8 py-8 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                      <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                        <Cloud size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                        Managed RunInfra
                      </h3>
                      <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                        Our GPUs, per-million-tokens billing from L4 to B200.
                      </p>
                    </div>

                    {/* Card 2 */}
                    <div className="px-8 py-8 flex flex-col gap-4 border-r border-dashed border-[#333] items-start">
                      <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                        <Server size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                        Your infrastructure
                      </h3>
                      <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                        AWS, GCP, RunPod, bare metal. Same verifier/, your
                        cluster.
                      </p>
                    </div>

                    {/* Card 3 */}
                    <div className="px-8 py-8 flex flex-col gap-4 items-start">
                      <div className="w-10 h-10 border border-[#333] border-dashed rounded-sm flex items-center justify-center text-[#75bf00]">
                        <Network size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                        Local workstation
                      </h3>
                      <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
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
          <SectionDivider
            position="top"
            className="absolute top-0 left-0 w-full"
          />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-xl mx-auto leading-tight">
                Supported HF chat models work
              </h2>
              <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-center max-w-lg mx-auto mb-10">
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
                  placeholder="Search any voice-compatible model on Hugging Face"
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
                          <span
                            className="text-[#C8C7BA] text-[14px] line-clamp-1"
                            title={model.author}
                          >
                            {model.author}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4 gap-2">
                          <span className="text-[#F0EFE2] font-medium text-[14px] sm:text-[15px] shrink-0">
                            {model.downloads}
                          </span>
                          <span className="text-[#75bf00] text-[11px] sm:text-[12px] font-medium border border-[#2a381a] px-2 py-0.5 rounded-sm tracking-wide shrink-0 line-clamp-1">
                            {model.tag}
                          </span>
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

        {/* What Horos Infra tunes Section */}
        <div className="w-full relative z-10 py-24">
          <SectionDivider
            position="top"
            className="absolute top-0 left-0 w-full"
          />
          <div className="w-full grid grid-cols-[calc(18%+120px)_calc(64%-240px)_calc(18%+120px)]">
            <div />
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-[#F0EFE2] mb-3 text-center max-w-xl mx-auto leading-tight">
                What Horos tunes
              </h2>
              <p className="text-[#A0A098] text-[15px] sm:text-[16px] font-sans leading-relaxed text-center max-w-lg mx-auto mb-12">
                Every layer of your assistant, tuned for its model and workload.
              </p>

              {/* Tunes Grid */}
              <div className="flex flex-col w-full border-t border-b border-dashed border-[#333]">
                <div className="grid grid-cols-1 md:grid-cols-3 w-full">
                  {/* Row 1 */}
                  <div className="px-10 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Cpu size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                      Model selection
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Qwen, Hermes, and Ministral. Compare task quality, tool use, latency, and GPU memory.
                    </p>
                  </div>

                  <div className="px-10 py-10 border-b md:border-r border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Layers size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                      Tool calling
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Function schemas, argument accuracy, parallel calls, and tool execution failures.
                    </p>
                  </div>

                  <div className="px-10 py-10 border-b border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Database size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                      Context handling
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Conversation history, retrieval, memory, and context compression.
                    </p>
                  </div>

                  {/* Row 2 */}
                  <div className="px-10 py-10 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Zap size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                      Structured output
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      JSON schemas, constrained generation, and output validation.
                    </p>
                  </div>

                  <div className="px-10 py-10 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Sliders size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                      Inference runtime
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      vLLM, SGLang, KV cache, batching, and streaming.
                    </p>
                  </div>

                  <div className="px-10 py-10 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-5 items-start">
                    <div className="text-[#75bf00]">
                      <Cloud size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[20px] font-medium text-[#F0EFE2]">
                      Assistant evaluation
                    </h3>
                    <p className="text-[#C8C7BA] text-[16px] leading-relaxed">
                      Task completion, tool-call accuracy, response quality, latency, and token cost.
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
              <h2 className="text-[44px] md:text-[52px] leading-tight font-medium tracking-tight text-[#f2efe8] mb-4 text-center mt-12">
                Try this pipeline
              </h2>
              <p className="text-[#c7c3b7] text-[22px] font-sans leading-relaxed text-center max-w-2xl mb-16 mx-auto">
                Edit the model, engine, or GPU inline. Send to retune the stack
                in the dashboard.
              </p>

              {/* Pipeline Builder Component */}
              <div className="relative z-50 flex justify-center items-center mb-24 w-full h-[261px]">
                {/* Decorative dashed lines SVG */}
                <div className="absolute inset-0 pointer-events-none z-[-1]">
                  <svg
                    width="100%"
                    height="261"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Horizontal lines spanning 100% */}
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

                    {/* Left vertical lines perfectly aligned to an 822px centered element */}
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

                    {/* Right vertical lines perfectly aligned to an 822px centered element */}
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

                {/* Actual Composer inside the dashed boundary */}
                <div className="w-[822px] max-w-full relative z-10">
                  <TokenPromptInput
                    fixedPromptIndex={1}
                    hideHeader={true}
                    showSuggestions={false}
                    cardClassName="!bg-[#202020]"
                  />
                </div>
              </div>
            </div>
            <div className="border-l border-dashed border-[#333]" />
          </div>
          {/* Bottom Horizontal Border */}
          <SectionDivider
            position="bottom"
            className="absolute bottom-0 left-0 w-full"
          />
        </div>

        {/* FAQ Section */}
        <div className="w-full relative z-10 py-24 flex flex-col items-center px-4">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[#f2efe8] mb-4 text-center">
            Common{" "}
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm">
              questions
            </span>
          </h2>
          <p className="text-[#C8C7BA] text-[16px] mb-16 text-center max-w-lg">
            Everything you need to know about deploying and operating personal
            AI assistants.
          </p>

          <div className="w-full max-w-3xl flex flex-col">
            {FAQ_DATA.map((faq, idx) => (
              <div
                key={idx}
                className="flex flex-col border-b border-dashed border-[#333] py-8"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span
                    className={`text-[16px] font-medium transition-colors ${activeFaq === idx ? "text-[#F0EFE2]" : "text-[#C8C7BA] group-hover:text-[#F0EFE2]"}`}
                  >
                    {faq.question}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border border-[#333] flex items-center justify-center transition-all ${activeFaq === idx ? "bg-[#75bf00] border-[#75bf00] text-black rotate-180" : "bg-transparent text-[#C8C7BA] group-hover:border-[#666]"}`}
                  >
                    <ChevronDown size={14} strokeWidth={2} />
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === idx ? "max-h-[200px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}
                >
                  <p className="text-[#C8C7BA] text-[15px] leading-relaxed pr-8">
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
