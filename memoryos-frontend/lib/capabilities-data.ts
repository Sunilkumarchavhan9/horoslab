import {
  QwenLogo,
  DeepSeekLogo,
  GLMLogo,
  NvidiaLogo,
  OneXLogo,
  TeslaLogo,
  MetaLogo,
  MistralLogo,
  PhysicalIntelligenceLogo,
  GoogleLogo,
  HuggingFaceLogo,
  OrnithLogo,
  HorosLogo
} from "@/components/horos/primitives/brand-icons";

export const CAPABILITIES = [
  {
    id: "horos-argvis",
    name: "Argvis",
    developer: "Horos",
    providerSlug: "horos-ai",
    icon: HorosLogo,
    tags: ["First-Party Lab", "Physical Reality · Spatial Vision · Sensor Telemetry"],
    metrics: {
      input: "$0.10",
      cached: "Free",
      output: "$0.40",
      cacheHit: "99.4%",
      speed: "310.0",
      timeToFirst: "45",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input Free per 1M at 99.4% hit rate",
    description: "Horos Argvis is a first-party physical foundation model engineered by the Horos Frontier AI Lab. It ingests multi-camera video, LiDAR, acoustic telemetry, and robotic proprioception, transforming raw physical world inputs into continuous spatial-temporal tokens.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text, multi-camera feeds, spatial telemetry, depth, audio",
      availability: "Frontier Lab Release",
      dataRetention: "Zero data training. Private VPC and dedicated cluster isolation.",
      contextWindow: "1,048,576 tokens",
      maxRequestSize: "32 MB per request",
      maxGeneratedOutput: "65,536 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8 / BF16 Native"
      }
    }
  },
  {
    id: "horos-athcod",
    name: "Athcod",
    developer: "Horos",
    providerSlug: "horos-ai",
    icon: HorosLogo,
    tags: ["First-Party Lab", "Reasoning · Automated Synthesis · Verifiers · AST"],
    metrics: {
      input: "$0.15",
      cached: "Free",
      output: "$0.60",
      cacheHit: "98.7%",
      speed: "245.0",
      timeToFirst: "65",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input Free per 1M at 98.7% hit rate",
    description: "Horos Athcod is an autonomous software engineering and reasoning foundation model trained with test-time compute search and automated verification loops. Reconciles repository dependencies, synthesizes contracts, and verifies correctness.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Source code, AST trees, git diffs, terminal outputs, images",
      availability: "Frontier Lab Release",
      dataRetention: "Zero data training. Codebases remain strictly isolated.",
      contextWindow: "524,288 tokens",
      maxRequestSize: "16 MB per request",
      maxGeneratedOutput: "65,536 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8 Verified"
      }
    }
  },
  {
    id: "horos-hervox",
    name: "Hervox",
    developer: "Horos",
    providerSlug: "horos-ai",
    icon: HorosLogo,
    tags: ["First-Party Lab", "Sub-100ms · Full-Duplex · Expressive TTS · ASR"],
    metrics: {
      input: "$0.08",
      cached: "Free",
      output: "$0.30",
      cacheHit: "99.1%",
      speed: "180.0",
      timeToFirst: "85",
    },
    speedLabel: "audio tok/s, real-time",
    effectiveCost: "Effective input Free per 1M at that hit rate",
    description: "Horos Hervox operates natively on acoustic latents without text tokenization bottlenecks, delivering sub-100ms full-duplex conversational audio, spatial noise separation, and expressive multilingual speech.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Raw PCM audio, FLAC, Opus, wav, text",
      availability: "Active Research Program",
      dataRetention: "Zero data retention or voice cloning without explicit key.",
      contextWindow: "131,072 audio tokens",
      maxRequestSize: "20 MB per request",
      maxGeneratedOutput: "32,768 audio tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported (Sub-100ms WebSocket)",
        precision: "BF16 Latent"
      }
    }
  },
  {
    id: "horos-morsim",
    name: "Morsim",
    developer: "Horos",
    providerSlug: "horos-ai",
    icon: HorosLogo,
    tags: ["First-Party Lab", "Physics-Consistent · Generative Reality · Multi-View"],
    metrics: {
      input: "$0.25",
      cached: "Free",
      output: "$1.00",
      cacheHit: "95.5%",
      speed: "60.0",
      timeToFirst: "120",
    },
    speedLabel: "frames/sec streaming",
    effectiveCost: "Effective input Free per 1M at 95.5% hit rate",
    description: "Horos Morsim simulates photorealistic, multi-view physical environments with strict adherence to real-world physics, lighting, and fluid dynamics for synthetic training and simulation rollouts.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text prompts, camera poses, depth maps, action vectors",
      availability: "Active Research Program",
      dataRetention: "Zero external model training.",
      contextWindow: "262,144 spatial tokens",
      maxRequestSize: "50 MB per request",
      maxGeneratedOutput: "16-camera 4K frames",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported (60 FPS)",
        precision: "FP8 Diffusion"
      }
    }
  },
  {
    id: "horos-chrdyn",
    name: "Chrdyn",
    developer: "Horos",
    providerSlug: "horos-ai",
    icon: HorosLogo,
    tags: ["First-Party Lab", "Causal Forecasting · Predictive Physics · Trajectory"],
    metrics: {
      input: "$0.20",
      cached: "Free",
      output: "$0.80",
      cacheHit: "97.2%",
      speed: "160.0",
      timeToFirst: "50",
    },
    speedLabel: "trajectory steps/s",
    effectiveCost: "Effective input Free per 1M at 97.2% hit rate",
    description: "Horos Chrdyn forecasts future physical states conditioned on autonomous agent actions, enabling counterfactual simulation and safety verification before physical execution.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "State tokens, action sequences, environment telemetry",
      availability: "Evaluation Preview",
      dataRetention: "Zero external model training.",
      contextWindow: "262,144 tokens",
      maxRequestSize: "25 MB per request",
      maxGeneratedOutput: "60-second continuous rollouts",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8 Native"
      }
    }
  },
  {
    id: "ornith-1-5-122b",
    name: "Ornith 1.5 122B",
    developer: "Ornith",
    providerSlug: "ornith-ai",
    icon: OrnithLogo,
    tags: ["Trending", "Agentic · Reasoning · Long Context · Code"],
    metrics: {
      input: "$0.20",
      cached: "$0.05",
      output: "$0.80",
      cacheHit: "94.6%",
      speed: "210.4",
      timeToFirst: "580",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.05 per 1M at that hit rate",
    description: "Ornith 1.5 122B is an advanced agentic intelligence capability delivering superior multi-step reasoning, real-time code synthesis, and autonomous task execution with state-of-the-art context retention.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text, images, and tool responses",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "1,048,576 tokens",
      maxRequestSize: "3.5 MB per request",
      maxGeneratedOutput: "65,536 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8, vendor-native release"
      }
    }
  },
  {
    id: "deepseek-v4-1-flash-1017",
    name: "DeepSeek V4.1 Flash 1017",
    developer: "DeepSeek",
    providerSlug: "deepseek",
    icon: DeepSeekLogo,
    tags: ["Trending", "Ultra-fast · MoE · Coding · Math"],
    metrics: {
      input: "$0.15",
      cached: "$0.01",
      output: "$0.60",
      cacheHit: "29.7%",
      speed: "320.5",
      timeToFirst: "410",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.01 per 1M at that hit rate",
    description: "DeepSeek V4.1 Flash 1017 delivers high-speed multi-head latent reasoning, providing ultra-fast code and math problem solving at fraction-of-cent token economics.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text, code, and structured data",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "128,000 tokens",
      maxRequestSize: "2.5 MB per request",
      maxGeneratedOutput: "16,384 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8, vendor-native release"
      }
    }
  },
  {
    id: "glm-5-3",
    name: "GLM 5.3",
    developer: "Z.ai",
    providerSlug: "zai-org",
    icon: GLMLogo,
    tags: ["Flagship", "Reasoning · High-Precision Tool Calling · Enterprise"],
    metrics: {
      input: "$1.30",
      cached: "$0.13",
      output: "$4.20",
      cacheHit: "28.1%",
      speed: "185.0",
      timeToFirst: "650",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.13 per 1M at that hit rate",
    description: "GLM 5.3 is the flagship reasoning model from Z.ai, featuring deep multimodal comprehension, verifiable step-by-step logic, and complex multi-step tool execution.",
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
    id: "ornith-1-5-35b",
    name: "Ornith 1.5 35B",
    developer: "Ornith",
    providerSlug: "ornith-ai",
    icon: OrnithLogo,
    tags: ["Efficient", "Fast Reasoning · Low Latency · Agentic Workflows"],
    metrics: {
      input: "$0.10",
      cached: "$0.01",
      output: "$0.40",
      cacheHit: "96.8%",
      speed: "290.0",
      timeToFirst: "380",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.01 per 1M at that hit rate",
    description: "Ornith 1.5 35B is an ultra-lean high-throughput model built for real-time autonomous agent pipelines with rapid response times and minimal latency.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text, images, and sensory streams",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "256,000 tokens",
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
    id: "deepseek-v4-1-flash",
    name: "DeepSeek V4.1 Flash",
    developer: "DeepSeek",
    providerSlug: "deepseek",
    icon: DeepSeekLogo,
    tags: ["High Speed", "Fast Coding · Low Cost · MoE Architecture"],
    metrics: {
      input: "$0.14",
      cached: "$0.03",
      output: "$0.58",
      cacheHit: "29.2%",
      speed: "340.0",
      timeToFirst: "390",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.03 per 1M at that hit rate",
    description: "DeepSeek V4.1 Flash provides cost-efficient fast generation for coding and general reasoning tasks across large scale agent workflows.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text and code streams",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "128,000 tokens",
      maxRequestSize: "2.5 MB per request",
      maxGeneratedOutput: "16,384 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8, vendor-native release"
      }
    }
  },
  {
    id: "glm-5-3-flash",
    name: "GLM 5.3 Flash",
    developer: "Z.ai",
    providerSlug: "zai-org",
    icon: GLMLogo,
    tags: ["Trending", "Reasoning · Tool Use · Multimodal · Long Context"],
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
    description: "GLM 5.3 Flash is a reasoning capability available through HOROS. It can be composed with tools, perception, memory, and other capabilities to execute mission workflows. HOROS evaluates its behavior against mission requirements before deployment.",
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
    tags: ["Reasoning · Tool Use · Code"],
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
    description: "Nemotron 3.5 Lightning 30B is a reasoning and code generation capability available through HOROS. It can be composed into missions requiring rapid reasoning and automation. HOROS evaluates the capability against workload requirements before deployment.",
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
    tags: ["Reasoning · Tool Use · Multimodal"],
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
    description: "Qwen3.8 27B is a multimodal reasoning capability available through HOROS. It can be composed into missions requiring vision, language reasoning, and tool use. HOROS evaluates the capability against workload requirements before deployment.",
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
    tags: ["Reasoning · Multimodal · Tool Use"],
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
    description: "DeepSeek-V3 is a reasoning capability available through HOROS. It can be composed into missions requiring language reasoning, multimodal inputs, and tool use. HOROS evaluates the capability against workload requirements before deployment.",
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
    tags: ["Physical Control · Spatial Reasoning · Proprioception"],
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
    description: "Physical Intelligence pi0 is a physical actuation capability available through HOROS. It can be composed into physical edge automation and spatial reasoning missions. HOROS evaluates the capability against workload requirements before deployment.",
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
    tags: ["World Modeling · Simulation · Video Understanding"],
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
    description: "Nvidia Cosmos 1.0 is a simulation and world modeling capability available through HOROS. It can be composed into missions requiring environmental simulation and physical understanding. HOROS evaluates the capability against workload requirements before deployment.",
    specs: {
      apiCompatibility: "Simulation / Environment API",
      anthropicCompatibility: "Not applicable",
      acceptedInput: "Video, Point Cloud, Radar",
      availability: "Preview",
      dataRetention: "Simulation outputs are ephorosl.",
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
    tags: ["Reasoning · Tool Use · Planning"],
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
    description: "Llama 3.1 405B is a reasoning capability available through HOROS. It can be composed into missions requiring language reasoning, tool use, and complex planning. HOROS evaluates the capability against workload requirements before deployment.",
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
    tags: ["Language · Reasoning · Tool Use"],
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
    description: "Mistral Large 2 is a reasoning capability available through HOROS. It can be composed into missions requiring language reasoning and tool use. HOROS evaluates the capability against workload requirements before deployment.",
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
    id: "llama-3-2-90b-vision-instruct",
    name: "Llama 3.2 90B Vision",
    developer: "Meta",
    providerSlug: "meta-llama",
    icon: MetaLogo,
    tags: ["Vision · Perception · Multimodal"],
    metrics: {
      input: "$0.80",
      cached: "$0.08",
      output: "$2.00",
      cacheHit: "94.2%",
      speed: "115",
      timeToFirst: "450",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.12 per 1M at that hit rate",
    description: "Llama 3.2 90B Vision is a multimodal capability available through HOROS. It can be composed into missions requiring advanced vision and perception. HOROS evaluates the capability against workload requirements before deployment.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text, images",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "128,000 tokens",
      maxRequestSize: "10.0 MB per request",
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
    id: "timesfm-1-0-200m",
    name: "TimesFM 1.0",
    developer: "Google",
    providerSlug: "google",
    icon: GoogleLogo,
    tags: ["Temporal Reasoning · Prediction"],
    metrics: {
      input: "$0.01",
      cached: "$0.001",
      output: "$0.05",
      cacheHit: "75.0%",
      speed: "3200",
      timeToFirst: "15",
    },
    speedLabel: "series steps/s",
    effectiveCost: "Effective input $0.008 per 1M at that hit rate",
    description: "TimesFM 1.0 is a time-series foundation model capability available through HOROS. It can be composed into missions requiring temporal reasoning and forecasting. HOROS evaluates the capability against workload requirements before deployment.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Not applicable",
      acceptedInput: "Time-series data, numerical arrays",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "10,000 steps",
      maxRequestSize: "5.0 MB per request",
      maxGeneratedOutput: "1,000 steps",
      capabilities: {
        toolCalling: "Not supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP32"
      }
    }
  },
  {
    id: "qwen2-5-coder-32b",
    name: "Qwen 2.5 Coder 32B",
    developer: "Alibaba Cloud",
    providerSlug: "alibaba",
    icon: QwenLogo,
    tags: ["Code · Verification · Reasoning"],
    metrics: {
      input: "$0.10",
      cached: "$0.01",
      output: "$0.40",
      cacheHit: "98.1%",
      speed: "185",
      timeToFirst: "320",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.012 per 1M at that hit rate",
    description: "Qwen 2.5 Coder 32B is a code generation and reasoning capability available through HOROS. It can be composed into missions requiring programming, verification, and logical deduction. HOROS evaluates the capability against workload requirements before deployment.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text",
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
    id: "c4ai-command-r-plus",
    name: "Command R+",
    developer: "Cohere",
    providerSlug: "cohere",
    icon: HuggingFaceLogo,
    tags: ["Language · Tool Use · Planning"],
    metrics: {
      input: "$3.00",
      cached: "$0.30",
      output: "$15.00",
      cacheHit: "85.2%",
      speed: "45",
      timeToFirst: "800",
    },
    speedLabel: "output tok/s, model only",
    effectiveCost: "Effective input $0.70 per 1M at that hit rate",
    description: "Command R+ is a language and reasoning capability available through HOROS. It can be composed into missions requiring complex tool use and multi-step planning. HOROS evaluates the capability against workload requirements before deployment.",
    specs: {
      apiCompatibility: "Mission-compatible Outcome Intents",
      anthropicCompatibility: "Anthropic-compatible Messages, POST /v1/messages",
      acceptedInput: "Text",
      availability: "Available",
      dataRetention: "Your state and execution memory are never stored or used for external model training.",
      contextWindow: "128,000 tokens",
      maxRequestSize: "2.0 MB per request",
      maxGeneratedOutput: "4,000 tokens",
      capabilities: {
        toolCalling: "Supported",
        jsonMode: "Supported",
        streaming: "Supported",
        precision: "FP8"
      }
    }
  }
];
