// Dhyra Reality Intelligence Runtime - Intent Compiler & Multi-Reality Intent System
// Canonical implementation based on DHYRA_FINAL_SOFTWARE_CLOUD_SIMULATION_EDGE_AUTOMATION_DATACENTER_BUILD_PLAN.md

export type DhyraIntent =
  | "OPTIMIZE"
  | "COMPARE"
  | "DIAGNOSE"
  | "DISCOVER"
  | "TEACH"
  | "PREDICT"
  | "EVALUATE"
  | "EXPERIMENT"
  | "SIMULATE"
  | "DEPLOY"
  | "MONITOR"
  | "PLAN";

export type RealityDomain =
  | "ai"
  | "software"
  | "agent"
  | "data_center"
  | "physical"
  | "robotics"
  | "science"
  | "simulation";

export type ExecutionDomain = "software" | "cloud" | "data_center" | "physical" | "simulation";

export type EntityReferenceType =
  | "model"
  | "runtime"
  | "serving"
  | "hardware"
  | "cluster"
  | "service"
  | "agent"
  | "environment"
  | "machine"
  | "robot"
  | "sensor"
  | "camera"
  | "dataset"
  | "telemetry"
  | "workload"
  | "world_model"
  | "experiment";

export interface EntityReference {
  id: string;
  label: string;
  type: EntityReferenceType;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface CompiledOutcomeContract {
  objective: string;
  intent: DhyraIntent;
  domain: RealityDomain;
  executionDomain: ExecutionDomain;
  targetMetric?: string;
  targetDeltaPct?: number;
  predictionTarget?: string;
  learningTarget?: string;
  hardConstraints: string[];
  softObjectives: string[];
  prohibitedTradeoffs: string[];
  observationWindow: string;
  verificationMethod: string;
}

export interface CompiledMissionIntent {
  id: string;
  rawInput: string;
  intent: DhyraIntent;
  domain: RealityDomain;
  executionDomain: ExecutionDomain;
  actionButtonLabel: string;
  outcomeContract: CompiledOutcomeContract;
  resolvedEntities: EntityReference[];
  unknowns: string[];
  hypotheses: string[];
  candidateSystems: Array<{
    name: string;
    runtime?: string;
    hardware?: string;
    description: string;
  }>;
  discoveryRequirements: string[];
  verificationVerdictRule: string;
  timestamp: string;
}

export interface ComposerSuggestion {
  id: string;
  text: string;
  fullPrompt: string;
  action: string;
  intent: DhyraIntent;
  domain: RealityDomain;
  executionDomain: ExecutionDomain;
  modelBadge?: { iconType: string; text: string };
  secondaryModelBadge?: { iconType: string; text: string };
  secondaryText?: string;
  engineBadge?: { text: string };
  hardwareBadge?: { text: string };
  rest: string;
  entities: EntityReference[];
  capabilityRequirements?: string[];
}

// ---------------------------------------------------------------------------
// KNOWN MULTI-REALITY ENTITY DICTIONARY
// ---------------------------------------------------------------------------

export const MULTI_REALITY_ENTITIES: Record<string, EntityReference> = {
  // AI Models
  "@Qwen/Qwen3-32B": { id: "qwen-3-32b", label: "Qwen3-32B", type: "model", provider: "Qwen" },
  "@Qwen3-32B": { id: "qwen-3-32b", label: "Qwen3-32B", type: "model", provider: "Qwen" },
  "@Qwen/Qwen2.5-7B": { id: "qwen-2.5-7b", label: "Qwen 2.5 7B", type: "model", provider: "Qwen" },
  "@Llama-3.1-8B": { id: "llama-3.1-8b", label: "Llama 3.1 8B", type: "model", provider: "Meta" },
  "@Llama-3.1-70B": { id: "llama-3.1-70b", label: "Llama 3.1 70B", type: "model", provider: "Meta" },
  "@Llama-3.2-3B": { id: "llama-3.2-3b", label: "Llama 3.2 3B", type: "model", provider: "Meta" },
  "@BGE-M3": { id: "bge-m3", label: "BGE-M3", type: "model", provider: "BAAI" },
  "@Whisper-Large-V3": { id: "whisper-large-v3", label: "Whisper Large V3", type: "model", provider: "OpenAI" },
  "@FLUX.1-Schnell": { id: "flux-1-schnell", label: "FLUX.1 Schnell", type: "model", provider: "Black Forest Labs" },
  "@DeepSeek-R1": { id: "deepseek-r1", label: "DeepSeek R1", type: "model", provider: "DeepSeek" },
  "@Mistral-7B": { id: "mistral-7b", label: "Mistral 7B", type: "model", provider: "Mistral" },
  "@Qwen2.5-VL": { id: "qwen-2.5-vl", label: "Qwen 2.5-VL", type: "model", provider: "Qwen" },
  "@Cosmos-Predict": { id: "cosmos-predict", label: "Cosmos Predict", type: "model", provider: "NVIDIA" },
  "@RoboCat-V2": { id: "robocat-v2", label: "RoboCat V2", type: "model", provider: "Google" },
  "@Cosmos-World-Model": { id: "cosmos-world-model", label: "Cosmos World Model", type: "model", provider: "NVIDIA" },
  "@model": { id: "generic-model", label: "Target Model", type: "model" },

  // Runtimes & Serving Systems
  "@vLLM": { id: "vllm", label: "vLLM", type: "runtime" },
  "@SGLang": { id: "sglang", label: "SGLang", type: "runtime" },
  "@TensorRT-LLM": { id: "tensorrt-llm", label: "TensorRT-LLM", type: "runtime" },
  "@Dynamo": { id: "nvidia-dynamo", label: "NVIDIA Dynamo", type: "serving" },
  "@TEI": { id: "tei", label: "TEI", type: "runtime" },
  "@Diffusers": { id: "diffusers", label: "Diffusers", type: "runtime" },
  "@vLLM-Omni": { id: "vllm-omni", label: "vLLM-Omni", type: "runtime" },

  // Compute & Hardware
  "@H100": { id: "h100", label: "H100 80GB", type: "hardware" },
  "@H200": { id: "h200", label: "H200 141GB", type: "hardware" },
  "@B200": { id: "b200", label: "B200 192GB", type: "hardware" },
  "@L40S": { id: "l40s", label: "L40S 48GB", type: "hardware" },
  "@T4": { id: "t4", label: "T4 16GB", type: "hardware" },
  "@gpu-07": { id: "gpu-07", label: "GPU #07", type: "hardware" },

  // Data Centers & Clusters
  "@cluster-prod": { id: "cluster-prod", label: "Production Cluster", type: "cluster" },
  "@rack-07": { id: "rack-07", label: "Datacenter Rack 07", type: "cluster" },
  "@datacenter-01": { id: "datacenter-01", label: "Datacenter US-East", type: "cluster" },
  "@kubernetes": { id: "k8s", label: "Kubernetes", type: "cluster" },

  // Software Services
  "@checkout-service": { id: "svc-checkout", label: "checkout-service", type: "service" },
  "@api-gateway": { id: "svc-gateway", label: "api-gateway", type: "service" },
  "@database": { id: "svc-db", label: "primary-database", type: "service" },
  "@payment-service": { id: "svc-payment", label: "payment-service", type: "service" },

  // Agents & Workflows
  "@agent-01": { id: "agent-01", label: "Dhyra Agent 01", type: "agent" },
  "@deployment-mission": { id: "mission-deploy", label: "Deployment Workflow", type: "workload" },
  "@incident-response": { id: "incident-resp", label: "Incident Response", type: "workload" },

  // Physical Environments & Robotics
  "@factory-01": { id: "env-factory-01", label: "Factory Line 01", type: "environment" },
  "@warehouse-01": { id: "env-warehouse-01", label: "Warehouse 01", type: "environment" },
  "@machine-07": { id: "machine-07", label: "Industrial Machine 07", type: "machine" },
  "@robot-07": { id: "robot-07", label: "Robotic Manipulator 07", type: "robot" },
  "@conveyor-01": { id: "conveyor-01", label: "Conveyor Belt 01", type: "machine" },
  "@arm-joint-3": { id: "arm-joint-3", label: "Arm Joint 3", type: "robot" },
  "@object-12": { id: "object-12", label: "Physical Object 12", type: "machine" },

  // Signals, Telemetry & Sensors
  "@video-data": { id: "stream-video", label: "Video Stream", type: "camera" },
  "@sensor-data": { id: "stream-sensors", label: "Multi-Sensor Telemetry", type: "sensor" },
  "@camera-data": { id: "stream-camera", label: "High-Speed Camera", type: "camera" },
  "@force-data": { id: "stream-force", label: "Force/Torque Sensor", type: "sensor" },
  "@telemetry": { id: "telemetry-otel", label: "OpenTelemetry Signals", type: "telemetry" },
  "@production-workload": { id: "workload-prod", label: "Live Production Traffic", type: "workload" },
  "@temperature-data": { id: "sensor-temp", label: "Thermal Sensors", type: "sensor" },
  "@pressure-data": { id: "sensor-press", label: "Pressure Sensors", type: "sensor" },
  "@machine-speed": { id: "sensor-speed", label: "Motor Tachometer", type: "sensor" },
  "@failure-events": { id: "events-failure", label: "Historical Fault Log", type: "telemetry" },

  // World Models & Experiments
  "@world-model-01": { id: "wm-01", label: "Factory World Model", type: "world_model" },
  "@experiment-17": { id: "exp-17", label: "Isolation Experiment 17", type: "experiment" },
};

// ---------------------------------------------------------------------------
// CANONICAL MULTI-DOMAIN SUGGESTIONS SHOWCASE
// (Rendered in natural language with rich company & hardware badges)
// ---------------------------------------------------------------------------

export const MULTI_DOMAIN_SUGGESTIONS: ComposerSuggestion[] = [
  {
    id: "sug-1",
    action: "Optimize",
    text: "Optimize @Qwen/Qwen3-32B on @vLLM for lower cost while preserving quality and P99 latency",
    fullPrompt: "Optimize @Qwen/Qwen3-32B on @vLLM for lower cost while preserving quality and P99 latency",
    intent: "OPTIMIZE",
    domain: "ai",
    executionDomain: "cloud",
    modelBadge: { iconType: "qwen", text: "Qwen3-32B" },
    engineBadge: { text: "vLLM" },
    rest: "for lower cost while preserving quality and P99 latency",
    entities: [
      MULTI_REALITY_ENTITIES["@Qwen/Qwen3-32B"],
      MULTI_REALITY_ENTITIES["@vLLM"],
    ],
  },
  {
    id: "sug-2",
    action: "Compare",
    text: "Compare @vLLM vs @SGLang vs @TensorRT-LLM for @Qwen/Qwen3-32B on @H100",
    fullPrompt: "Compare @Qwen/Qwen3-32B against @Llama-3.1-70B on @Dynamo+TRT on @H100 for cost and throughput under batch load",
    intent: "COMPARE",
    domain: "ai",
    executionDomain: "data_center",
    modelBadge: { iconType: "qwen", text: "Qwen3-32B" },
    secondaryModelBadge: { iconType: "meta", text: "Llama 3.1 70B" },
    secondaryText: "against",
    engineBadge: { text: "Dynamo + TRT" },
    rest: "on @H100 for cost and throughput under batch load",
    entities: [
      MULTI_REALITY_ENTITIES["@Qwen/Qwen3-32B"],
      MULTI_REALITY_ENTITIES["@Llama-3.1-70B"],
      MULTI_REALITY_ENTITIES["@H100"],
    ],
  },
  {
    id: "sug-3",
    action: "Diagnose",
    text: "Find why @checkout-service P99 increased after the latest deployment",
    fullPrompt: "Find why @checkout-service P99 increased after the latest deployment",
    intent: "DIAGNOSE",
    domain: "software",
    executionDomain: "software",
    modelBadge: { iconType: "hf", text: "checkout-service" },
    engineBadge: { text: "OpenTelemetry" },
    rest: "under heavy concurrency with bottleneck trace inspection",
    entities: [
      MULTI_REALITY_ENTITIES["@checkout-service"],
      MULTI_REALITY_ENTITIES["@telemetry"],
    ],
  },
  {
    id: "sug-4",
    action: "Predict",
    text: "Predict GPU failures in @cluster-prod from telemetry and thermal history",
    fullPrompt: "Predict GPU failures in @cluster-prod from telemetry and thermal history",
    intent: "PREDICT",
    domain: "data_center",
    executionDomain: "data_center",
    modelBadge: { iconType: "nvidia", text: "cluster-prod" },
    hardwareBadge: { text: "8x H100" },
    engineBadge: { text: "Telemetry" },
    rest: "from thermal history, power draw, and ECC telemetry",
    entities: [
      MULTI_REALITY_ENTITIES["@cluster-prod"],
      MULTI_REALITY_ENTITIES["@telemetry"],
    ],
  },
  {
    id: "sug-5",
    action: "Teach",
    text: "Teach @Qwen2.5-VL to understand @factory-01 from @video-data and @sensor-data, then predict what happens after an action",
    fullPrompt: "Teach @Qwen/Qwen2.5-VL to understand @factory-01 from @video-data and @sensor-data, then predict what happens after an action",
    intent: "TEACH",
    domain: "physical",
    executionDomain: "physical",
    modelBadge: { iconType: "qwen", text: "Qwen 2.5-VL" },
    secondaryModelBadge: { iconType: "hf", text: "factory-01" },
    secondaryText: "to understand",
    rest: "from @video-data and @sensor-data, then predict next state",
    entities: [
      MULTI_REALITY_ENTITIES["@Qwen2.5-VL"],
      MULTI_REALITY_ENTITIES["@factory-01"],
      MULTI_REALITY_ENTITIES["@video-data"],
      MULTI_REALITY_ENTITIES["@sensor-data"],
    ],
  },
  {
    id: "sug-6",
    action: "Discover",
    text: "Learn normal behavior of @machine-07 from @camera-data and @sensor-data, then detect abnormal states",
    fullPrompt: "Learn normal behavior of @machine-07 using @Cosmos-Predict from @camera-data and @sensor-data, then detect abnormal states",
    intent: "DISCOVER",
    domain: "physical",
    executionDomain: "physical",
    modelBadge: { iconType: "nvidia", text: "Cosmos-Predict" },
    secondaryModelBadge: { iconType: "hf", text: "machine-07" },
    secondaryText: "observing",
    rest: "from multi-modal telemetry and detect anomalies with uncertainty bounds",
    entities: [
      MULTI_REALITY_ENTITIES["@Cosmos-Predict"],
      MULTI_REALITY_ENTITIES["@machine-07"],
      MULTI_REALITY_ENTITIES["@camera-data"],
      MULTI_REALITY_ENTITIES["@sensor-data"],
    ],
  },
  {
    id: "sug-7",
    action: "Predict",
    text: "Teach @robot-07 to predict the consequence of an action using @camera-data and @force-data",
    fullPrompt: "Teach @robot-07 with @RoboCat-V2 to predict the consequence of an action using @camera-data and @force-data",
    intent: "TEACH",
    domain: "robotics",
    executionDomain: "physical",
    modelBadge: { iconType: "google", text: "RoboCat-V2" },
    secondaryModelBadge: { iconType: "hf", text: "robot-07" },
    secondaryText: "for",
    rest: "using @camera-data and @force-data before executing actuation",
    entities: [
      MULTI_REALITY_ENTITIES["@RoboCat-V2"],
      MULTI_REALITY_ENTITIES["@robot-07"],
      MULTI_REALITY_ENTITIES["@camera-data"],
      MULTI_REALITY_ENTITIES["@force-data"],
    ],
  },
  {
    id: "sug-8",
    action: "Simulate",
    text: "Build a world model of @warehouse-01 from historical observations and simulate candidate routing policies",
    fullPrompt: "Build a world model of @warehouse-01 using @Cosmos-World-Model from historical observations and simulate candidate routing policies",
    intent: "SIMULATE",
    domain: "simulation",
    executionDomain: "simulation",
    modelBadge: { iconType: "nvidia", text: "Cosmos-World-Model" },
    secondaryModelBadge: { iconType: "hf", text: "warehouse-01" },
    secondaryText: "for",
    rest: "from historical observations and simulate candidate routing policies",
    entities: [
      MULTI_REALITY_ENTITIES["@Cosmos-World-Model"],
      MULTI_REALITY_ENTITIES["@warehouse-01"],
    ],
  },
  {
    id: "sug-9",
    action: "Experiment",
    text: "Find an experiment that distinguishes whether @gpu-07 or @network-02 is causing the latency increase in @cluster-prod",
    fullPrompt: "Find an experiment that distinguishes whether @gpu-07 or @network-02 is causing the latency increase in @cluster-prod",
    intent: "EXPERIMENT",
    domain: "science",
    executionDomain: "data_center",
    modelBadge: { iconType: "nvidia", text: "gpu-07 (H100)" },
    secondaryModelBadge: { iconType: "hf", text: "network-02" },
    secondaryText: "vs",
    rest: "to isolate PCIe bottleneck vs network packet jitter with statistical proof",
    entities: [
      MULTI_REALITY_ENTITIES["@gpu-07"],
      MULTI_REALITY_ENTITIES["@cluster-prod"],
    ],
  },
  {
    id: "sug-10",
    action: "Evaluate",
    text: "Teach @agent-01 to complete @deployment-mission and verify every change before claiming success",
    fullPrompt: "Teach @agent-01 powered by @DeepSeek-R1 to complete @deployment-mission and verify every change before claiming success",
    intent: "TEACH",
    domain: "agent",
    executionDomain: "software",
    modelBadge: { iconType: "deepseek", text: "DeepSeek-R1" },
    secondaryModelBadge: { iconType: "hf", text: "agent-01" },
    secondaryText: "powering",
    engineBadge: { text: "Kubernetes" },
    rest: "to complete @deployment-mission and verify evidence before continuing",
    entities: [
      MULTI_REALITY_ENTITIES["@DeepSeek-R1"],
      MULTI_REALITY_ENTITIES["@agent-01"],
      MULTI_REALITY_ENTITIES["@kubernetes"],
    ],
  },
  {
    id: "sug-11",
    action: "Optimize",
    text: "Optimize @BGE-M3 on @TEI for embedding throughput while preserving retrieval quality",
    fullPrompt: "Optimize @BGE-M3 on @TEI for embedding throughput while preserving retrieval quality",
    intent: "OPTIMIZE",
    domain: "ai",
    executionDomain: "cloud",
    modelBadge: { iconType: "baai", text: "BGE-M3" },
    engineBadge: { text: "TEI" },
    rest: "with /v1/embeddings batching and recall evaluation",
    entities: [
      MULTI_REALITY_ENTITIES["@BGE-M3"],
      MULTI_REALITY_ENTITIES["@TEI"],
    ],
  },
  {
    id: "sug-12",
    action: "Optimize",
    text: "Optimize @Whisper-Large-V3 against @Llama-3.2-3B on @vLLM-Omni for RTF and streaming latency",
    fullPrompt: "Optimize @Whisper-Large-V3 against @Llama-3.2-3B on @vLLM-Omni for RTF and streaming latency",
    intent: "OPTIMIZE",
    domain: "ai",
    executionDomain: "cloud",
    modelBadge: { iconType: "openai", text: "Whisper Large V3" },
    secondaryModelBadge: { iconType: "meta", text: "Llama 3.2 3B" },
    secondaryText: "+",
    engineBadge: { text: "vLLM-Omni" },
    rest: "for RTF and audio streaming latency",
    entities: [
      MULTI_REALITY_ENTITIES["@Whisper-Large-V3"],
      MULTI_REALITY_ENTITIES["@Llama-3.2-3B"],
      MULTI_REALITY_ENTITIES["@vLLM-Omni"],
    ],
  },
  {
    id: "sug-13",
    action: "Simulate",
    text: "Simulate @factory-01 using @Cosmos-World-Model on @B200 to predict collision states",
    fullPrompt: "Simulate @factory-01 using @Cosmos-World-Model on @B200 to predict collision states",
    intent: "SIMULATE",
    domain: "simulation",
    executionDomain: "simulation",
    modelBadge: { iconType: "nvidia", text: "Cosmos-World-Model" },
    engineBadge: { text: "Genesis" },
    hardwareBadge: { text: "8x B200" },
    rest: "to predict collision states and temporal dynamics",
    entities: [
      MULTI_REALITY_ENTITIES["@factory-01"],
      MULTI_REALITY_ENTITIES["@Cosmos-World-Model"],
      MULTI_REALITY_ENTITIES["@B200"],
    ],
  },
];

// ---------------------------------------------------------------------------
// INTENT COMPILER ENGINE
// (Converts free-form input + tokens into typed Mission & Contract)
// ---------------------------------------------------------------------------

export function compileIntent(
  rawPrompt: string,
  userMetadata?: Record<string, unknown>
): CompiledMissionIntent {
  const text = rawPrompt.trim();
  const lower = text.toLowerCase();

  // 1. Detect Intent Family
  let intent: DhyraIntent = "OPTIMIZE";
  if (lower.startsWith("teach") || lower.includes("teach ") || lower.includes("learn ")) {
    intent = "TEACH";
  } else if (lower.startsWith("compare") || lower.includes(" vs ") || lower.includes(" against ") || lower.includes("compare ")) {
    intent = "COMPARE";
  } else if (lower.startsWith("find why") || lower.includes("why ") || lower.includes("cause") || lower.includes("diagnose") || lower.includes("bottleneck")) {
    intent = "DIAGNOSE";
  } else if (lower.startsWith("predict") || lower.includes("predict ") || lower.includes("forecast") || lower.includes("will happen")) {
    intent = "PREDICT";
  } else if (lower.startsWith("discover") || lower.includes("discover ")) {
    intent = "DISCOVER";
  } else if (lower.startsWith("simulate") || lower.includes("simulate ") || lower.includes("simulation") || lower.includes("world model")) {
    intent = "SIMULATE";
  } else if (lower.startsWith("experiment") || lower.includes("experiment ") || lower.includes("hypothesis") || lower.includes("distinguish")) {
    intent = "EXPERIMENT";
  } else if (lower.startsWith("evaluate") || lower.includes("evaluate ") || lower.includes("benchmark")) {
    intent = "EVALUATE";
  } else if (lower.startsWith("deploy") || lower.includes("deploy ")) {
    intent = "DEPLOY";
  } else if (lower.startsWith("monitor") || lower.includes("monitor ")) {
    intent = "MONITOR";
  } else if (lower.startsWith("plan") || lower.includes("plan ")) {
    intent = "PLAN";
  }

  // 2. Detect Reality Domain & Execution Domain
  let domain: RealityDomain = "ai";
  let executionDomain: ExecutionDomain = "cloud";

  if (lower.includes("factory") || lower.includes("machine") || lower.includes("conveyor") || lower.includes("sensor-data") || lower.includes("video-data") || lower.includes("arm-joint")) {
    domain = "physical";
    executionDomain = "physical";
  } else if (lower.includes("robot") || lower.includes("actuat") || lower.includes("force-data") || lower.includes("camera-data")) {
    domain = "robotics";
    executionDomain = "physical";
  } else if (lower.includes("cluster") || lower.includes("rack-") || lower.includes("datacenter") || lower.includes("power consumption") || lower.includes("thermal")) {
    domain = "data_center";
    executionDomain = "data_center";
  } else if (lower.includes("agent") || lower.includes("policy") || lower.includes("tool call")) {
    domain = "agent";
    executionDomain = "software";
  } else if (lower.includes("service") || lower.includes("checkout") || lower.includes("api-gateway") || lower.includes("database") || lower.includes("payment")) {
    domain = "software";
    executionDomain = "software";
  } else if (lower.includes("simulation") || lower.includes("world-model") || lower.includes("simulated")) {
    domain = "simulation";
    executionDomain = "simulation";
  } else if (lower.includes("hypothesis") || lower.includes("experiment") || lower.includes("isolate")) {
    domain = "science";
    executionDomain = "data_center";
  }

  // 3. Resolve Inline @ Entities
  const resolvedEntities: EntityReference[] = [];
  const mentionMatches = text.match(/@[a-zA-Z0-9_./-]+/g) || [];
  mentionMatches.forEach((tag) => {
    if (MULTI_REALITY_ENTITIES[tag]) {
      resolvedEntities.push(MULTI_REALITY_ENTITIES[tag]);
    } else {
      const clean = tag.replace("@", "");
      resolvedEntities.push({
        id: clean.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        label: clean,
        type: clean.includes("service") ? "service" : clean.includes("data") ? "dataset" : clean.includes("model") ? "model" : "cluster",
      });
    }
  });

  // 4. Synthesize Unknowns & Hypotheses based on Intent and Domain
  const unknowns: string[] = [];
  const hypotheses: string[] = [];
  const candidateSystems: Array<{ name: string; runtime?: string; hardware?: string; description: string }> = [];
  const discoveryRequirements: string[] = [];

  if (domain === "physical" || domain === "robotics") {
    unknowns.push("action_space_schema", "sensor_calibration_offsets", "state_transition_distribution", "evaluation_ground_truth");
    hypotheses.push("H1: state transition is Markovian over t=100ms horizon", "H2: abnormal machine vibration precedes thermal rise by 12s");
    discoveryRequirements.push("Camera frame rate & timestamps", "Sensor telemetry schema", "Actuator bounds");
  } else if (domain === "data_center") {
    unknowns.push("per_rack_cooling_headroom", "telemetry_sampling_jitter", "ecc_soft_fault_rate");
    hypotheses.push("H1: thermal throttling triggered by localized airflow obstruction", "H2: power supply phase imbalance during peak burst");
    discoveryRequirements.push("OpenTelemetry power metrics", "GPU thermal sensors", "Network switch telemetry");
  } else if (domain === "software") {
    unknowns.push("upstream_dependency_latency", "database_connection_pool_saturation", "gc_pause_frequency");
    hypotheses.push("H1: database lock contention under concurrency > 500", "H2: JSON serialization bottleneck in API gateway");
    discoveryRequirements.push("Distributed trace waterfall", "Database slow query log", "Container CPU throttling");
  } else if (domain === "agent") {
    unknowns.push("tool_calling_error_rate", "planning_drift_under_state_change", "unverified_action_count");
    hypotheses.push("H1: agent policy lacks explicit postcondition verification", "H2: ambiguous tool schema leads to wrong selection");
    discoveryRequirements.push("Agent action history trace", "Environment feedback logs", "Policy checkpoint");
  } else {
    // AI Inference
    unknowns.push("production_workload_token_distribution", "kv_cache_fragmentation_baseline", "quality_tolerance_budget");
    hypotheses.push("H1: FP8 quantization saves 40% cost within 0.2% quality loss", "H2: SGLang prefix caching improves throughput 1.8x on shared prompts");
    candidateSystems.push(
      { name: "Candidate A: vLLM + H100 (FP8)", runtime: "vLLM", hardware: "H100", description: "Lowest latency with dynamic batching" },
      { name: "Candidate B: SGLang + H100", runtime: "SGLang", hardware: "H100", description: "High prefix cache hit rate" },
      { name: "Candidate C: Dynamo + TRT-LLM", runtime: "TensorRT-LLM", hardware: "H100", description: "Maximum throughput disaggregated serving" }
    );
    discoveryRequirements.push("Target model revision & tokenizer", "Production RPS & token distribution", "Host GPU topology");
  }

  // 5. Build Objective & Outcome Contract
  const contract: CompiledOutcomeContract = {
    objective: text,
    intent,
    domain,
    executionDomain,
    targetMetric: domain === "ai" ? "inference_cost" : domain === "data_center" ? "power_efficiency" : domain === "software" ? "p99_latency" : "prediction_accuracy",
    targetDeltaPct: lower.includes("40%") ? -40 : lower.includes("2x") ? 200 : undefined,
    predictionTarget: domain === "physical" || domain === "robotics" ? "next_state" : undefined,
    learningTarget: intent === "TEACH" ? "world_dynamics" : undefined,
    hardConstraints: ["No unauthorized quality/safety degradation", "Strict verification before state mutation", "Zero unobserved rollouts"],
    softObjectives: ["Minimize latency", "Maximize resource efficiency", "Preserve high statistical confidence"],
    prohibitedTradeoffs: ["Unverified assertions", "Silent policy override", "Stale execution state"],
    observationWindow: "72 hours",
    verificationMethod: domain === "ai" ? "independent cost + telemetry verifier" : domain === "physical" ? "sensor feedback vs predicted state" : "OTel trace validator",
  };

  const actionLabels: Record<DhyraIntent, string> = {
    OPTIMIZE: "Optimize",
    COMPARE: "Compare",
    DIAGNOSE: "Diagnose",
    DISCOVER: "Discover",
    TEACH: "Teach",
    PREDICT: "Predict",
    EVALUATE: "Evaluate",
    EXPERIMENT: "Experiment",
    SIMULATE: "Simulate",
    DEPLOY: "Deploy",
    MONITOR: "Monitor",
    PLAN: "Plan",
  };

  return {
    id: `mission-${Date.now()}`,
    rawInput: text,
    intent,
    domain,
    executionDomain,
    actionButtonLabel: actionLabels[intent] || "Execute",
    outcomeContract: contract,
    resolvedEntities,
    unknowns,
    hypotheses,
    candidateSystems,
    discoveryRequirements,
    verificationVerdictRule: "Independent multi-point measurement verification required",
    timestamp: new Date().toISOString(),
  };
}


