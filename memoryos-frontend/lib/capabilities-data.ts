import { 
  QwenLogo, 
  DeepSeekLogo,
  GLMLogo,
  NvidiaLogo, 
  OneXLogo,
  TeslaLogo,
  MetaLogo,
  MistralLogo,
  PhysicalIntelligenceLogo
} from "@/components/dhyra/primitives/brand-icons";

export const CAPABILITIES = [
  {
    id: "glm-5-3-flash",
    name: "GLM 5.3 Flash",
    developer: "Z.ai",
    providerSlug: "zai-org",
    icon: GLMLogo,
    tags: ["Trending", "Tool calling / JSON mode / Streaming / Image input"],
    metrics: {
      input: "$0.10",
      cached: "$0.01",
      output: "$0.40",
      cacheHit: "98.9%",
      speed: "254.1",
      timeToFirst: "703",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.011 per 1M at that hit rate",
    description: "GLM 5.3 Flash is an outcome intelligence runtime listed in the Dhyra Capability Graph. Dhyra serves it as zai-org/GLM-5.3-Flash at $0.10 per 1M sensory context tokens and $0.40 per 1M output action tokens. Its maximum context window is 1,048,576 tokens. The runtime provides Mission API-compatible intents and Anthropic-compatible system messages.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text, images, and sensory streams",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "1,048,576 tokens",
      maxRequestSize: "3.5 MB per request",
      maxGeneratedOutput: "1,048,576 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8, vendor-native release"
      }
    }
  },
  {
    id: "nemotron-3-5-lightning-30b",
    name: "Nemotron 3.5 Lightning 30B",
    developer: "NVIDIA",
    providerSlug: "nvidia-ai",
    icon: NvidiaLogo,
    tags: ["Tool calling / JSON mode / Streaming"],
    metrics: {
      input: "$0.05",
      cached: "$0.01",
      output: "$0.15",
      cacheHit: "87.7%",
      speed: "540.9",
      timeToFirst: "420",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.015 per 1M at that hit rate",
    description: "Nemotron 3.5 Lightning is an outcome intelligence runtime listed in the Dhyra Capability Graph. Dhyra serves it as nvidia-ai/nemotron-3-5-lightning-30b. The runtime provides high-speed execution for complex automation tasks.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text and sensory streams",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "128,000 tokens",
      maxRequestSize: "2.0 MB per request",
      maxGeneratedOutput: "32,768 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8, vendor-native release"
      }
    }
  },
  {
    id: "qwen3-8-27b",
    name: "Qwen3.8 27B",
    developer: "Alibaba Cloud",
    providerSlug: "alibaba",
    icon: QwenLogo,
    tags: ["Tool calling / JSON mode / Streaming / Image input"],
    metrics: {
      input: "$0.10",
      cached: "$0.01",
      output: "$0.40",
      cacheHit: "96.1%",
      speed: "140",
      timeToFirst: "600",
    },
    speedLabel: "output tok/s, end to end",
    effectiveCost: "Effective input $0.014 per 1M at that hit rate",
    description: "Qwen3.8 27B is an outcome intelligence runtime listed in the Dhyra Capability Graph. Dhyra serves it as alibaba/qwen3-8-27b.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text, images, and sensory streams",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "131,072 tokens",
      maxRequestSize: "4.0 MB per request",
      maxGeneratedOutput: "8,192 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "BF16"
      }
    }
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    developer: "DeepSeek",
    providerSlug: "deepseek",
    icon: DeepSeekLogo,
    tags: ["Tool calling / JSON mode / Streaming / Image input"],
    metrics: {
      input: "$0.10",
      cached: "$0.01",
      output: "$0.40",
      cacheHit: "97.6%",
      speed: "216",
      timeToFirst: "480",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.013 per 1M at that hit rate",
    description: "Ornith 1.5 35B is an outcome intelligence runtime listed in the Dhyra Capability Graph.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text, images, and sensory streams",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "200,000 tokens",
      maxRequestSize: "3.5 MB per request",
      maxGeneratedOutput: "32,768 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8"
      }
    }
  },
  {
    id: "pi0-robotics",
    name: "Physical Intelligence pi0",
    developer: "Physical Intelligence",
    providerSlug: "pi-robotics",
    icon: PhysicalIntelligenceLogo,
    tags: ["Physical Actuation / Spatial Reasoning / Proprioception"],
    metrics: {
      input: "$0.15",
      cached: "$0.01",
      output: "$0.50",
      cacheHit: "88.5%",
      speed: "85",
      timeToFirst: "15",
    },
    speedLabel: "hz control loop, edge",
    effectiveCost: "Effective physical execution $0.02 per 1M at that hit rate",
    description: "Physical Intelligence pi0 provides general-purpose physical edge automation and spatial reasoning capabilities. Dhyra integrates this runtime into the physical reality fabric.",
    specs: {
      apiCompatibility: "Physical Action Intent API",
      anthropicCompatibility: "Not applicable (Physical Control)",
      acceptedInput: "Proprioceptive state, Video streams",
      availability: "Available",
      dataRetention: "Your physical state logs remain local to your deployment.",
      contextWindow: "60 seconds rolling history",
      maxRequestSize: "Continuous stream",
      maxGeneratedOutput: "Continuous actuation",
      capabilities: {
        toolCalling: "Physical execution only",
        jsonMode: "Supported for telemetry",
        streaming: "Actuation stream",
        precision: "Edge compute native"
      }
    }
  },
  {
    id: "nvidia-cosmos",
    name: "Nvidia Cosmos 1.0",
    developer: "NVIDIA",
    providerSlug: "nvidia-ai",
    icon: NvidiaLogo,
    tags: ["Video / 3D Simulation / World Model"],
    metrics: {
      input: "$0.25",
      cached: "$0.02",
      output: "$0.80",
      cacheHit: "84.1%",
      speed: "45",
      timeToFirst: "18",
    },
    speedLabel: "fps simulation, remote",
    effectiveCost: "Effective inference $0.04 per 1M at that hit rate",
    description: "Nvidia Cosmos 1.0 provides 3D environmental simulation and trajectory planning for complex physical environments.",
    specs: {
      apiCompatibility: "Simulation / Environment API",
      anthropicCompatibility: "Not applicable",
      acceptedInput: "Video, Point Cloud, Radar",
      availability: "Preview",
      dataRetention: "Simulation outputs are ephemeral.",
      contextWindow: "10 seconds historical state",
      maxRequestSize: "250 MB (PointCloud + Video)",
      maxGeneratedOutput: "Trajectory mapping",
      capabilities: {
        toolCalling: "Supported via simulation plugin",
        jsonMode: "Supported for state extraction",
        streaming: "Video rendering stream",
        precision: "FP16"
      }
    }
  },
  {
    id: "llama-3-1-405b",
    name: "Llama 3.1 405B",
    developer: "Meta",
    providerSlug: "meta",
    icon: MetaLogo,
    tags: ["Tool calling / JSON mode / Streaming"],
    metrics: {
      input: "$0.80",
      cached: "$0.08",
      output: "$2.00",
      cacheHit: "91.2%",
      speed: "120",
      timeToFirst: "350",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.12 per 1M at that hit rate",
    description: "Llama 3.1 405B is an outcome intelligence runtime listed in the Dhyra Capability Graph. Dhyra serves it as meta/llama-3-1-405b.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "128,000 tokens",
      maxRequestSize: "2.0 MB per request",
      maxGeneratedOutput: "8,192 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8"
      }
    }
  },
  {
    id: "mistral-large-2",
    name: "Mistral Large 2",
    developer: "Mistral AI",
    providerSlug: "mistral",
    icon: MistralLogo,
    tags: ["Tool calling / JSON mode / Streaming"],
    metrics: {
      input: "$2.00",
      cached: "$0.20",
      output: "$6.00",
      cacheHit: "82.4%",
      speed: "60",
      timeToFirst: "280",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.53 per 1M at that hit rate",
    description: "Mistral Large 2 is an outcome intelligence runtime listed in the Dhyra Capability Graph. Dhyra serves it as mistral/mistral-large-2.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "128,000 tokens",
      maxRequestSize: "2.0 MB per request",
      maxGeneratedOutput: "8,192 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8"
      }
    }
  }
];
