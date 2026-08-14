import type { EpochHuggingFaceModelFormat, EpochHuggingFaceTaskFamily } from "./huggingFace";
import type { EpochModelIntelligenceProfile } from "./modelIntelligence";

export type EpochRuntimeName = "Ollama" | "Transformers" | "vLLM" | "SGLang" | "TensorRT-LLM" | "NVIDIA NIM" | "ONNX Runtime" | "Diffusers" | "llama.cpp";
export type EpochCompatibilityStatus = "UNKNOWN" | "PREDICTED_COMPATIBLE" | "PREDICTED_INCOMPATIBLE" | "VERIFIED_COMPATIBLE" | "VERIFIED_INCOMPATIBLE" | "UNSUPPORTED" | "BLOCKED" | "FAILED";

export type EpochRuntimeProfile = {
  name: EpochRuntimeName;
  version: string;
  installationState: "available" | "configured" | "unavailable" | "unknown";
  supportedTasks: EpochHuggingFaceTaskFamily[];
  supportedFormats: EpochHuggingFaceModelFormat[];
  supportedArchitectures: string[];
  supportedProviders: string[];
  supportedHardware: string[];
  supportedPrecisions: string[];
  supportsBatching: boolean;
  supportsStreaming: boolean;
  supportsLora: boolean;
  multiGpu: boolean;
};

export type EpochHardwareProfile = {
  id: string;
  name: string;
  gpuName?: string | null;
  vramGb?: number | null;
  gpuCount?: number | null;
  driverVersion?: string | null;
  cudaVersion?: string | null;
  rocmVersion?: string | null;
  os?: string | null;
  available?: boolean;
  executionProviders?: string[];
  precisions?: string[];
};

export type EpochRuntimeCompatibility = {
  status: EpochCompatibilityStatus;
  score: number | null;
  reasons: string[];
  failedChecks: string[];
  unknownChecks: string[];
  evidence: Array<{ type: "declaration" | "probe" | "experiment"; reference: string; state: "PREDICTED" | "OBSERVED" | "VERIFIED" }>;
  confidence: number;
  recommendedNextAction: string;
};

export type EpochObservedRuntimeProbe = {
  target: string;
  reachable: boolean;
  status: number | null;
  models: string[];
  evidenceSha256: string;
  checkedAt: string;
  error?: string;
};

const allTextTasks: EpochHuggingFaceTaskFamily[] = ["text-generation", "embedding", "reranking", "classification", "translation", "summarization", "question-answering", "multimodal", "vision"];
const allFormats: EpochHuggingFaceModelFormat[] = ["safetensors", "pytorch", "gguf", "onnx", "diffusers", "lora", "adapter"];

export const epochRuntimeRegistry: readonly EpochRuntimeProfile[] = Object.freeze([
  { name: "Ollama", version: "unknown", installationState: "unknown", supportedTasks: ["text-generation", "embedding", "multimodal"], supportedFormats: ["gguf"], supportedArchitectures: [], supportedProviders: ["CPU", "CUDA", "Vulkan"], supportedHardware: ["CPU", "NVIDIA", "AMD"], supportedPrecisions: ["fp16", "q4", "q5", "q8"], supportsBatching: false, supportsStreaming: true, supportsLora: false, multiGpu: false },
  { name: "Transformers", version: "unknown", installationState: "unknown", supportedTasks: allTextTasks, supportedFormats: ["safetensors", "pytorch", "lora", "adapter"], supportedArchitectures: [], supportedProviders: ["CPU", "CUDA", "ROCm"], supportedHardware: ["CPU", "NVIDIA", "AMD"], supportedPrecisions: ["fp16", "bf16", "fp32", "int8", "int4"], supportsBatching: true, supportsStreaming: true, supportsLora: true, multiGpu: true },
  { name: "vLLM", version: "unknown", installationState: "unknown", supportedTasks: ["text-generation", "embedding", "reranking", "vision", "multimodal"], supportedFormats: ["safetensors", "pytorch", "lora", "adapter"], supportedArchitectures: [], supportedProviders: ["CUDA"], supportedHardware: ["NVIDIA"], supportedPrecisions: ["fp16", "bf16", "fp8", "int8", "int4"], supportsBatching: true, supportsStreaming: true, supportsLora: true, multiGpu: true },
  { name: "SGLang", version: "unknown", installationState: "unknown", supportedTasks: ["text-generation", "embedding", "vision", "multimodal"], supportedFormats: ["safetensors", "pytorch", "lora", "adapter"], supportedArchitectures: [], supportedProviders: ["CUDA"], supportedHardware: ["NVIDIA"], supportedPrecisions: ["fp16", "bf16", "fp8", "int8", "int4"], supportsBatching: true, supportsStreaming: true, supportsLora: true, multiGpu: true },
  { name: "TensorRT-LLM", version: "unknown", installationState: "unknown", supportedTasks: ["text-generation", "vision", "multimodal"], supportedFormats: ["safetensors", "pytorch"], supportedArchitectures: [], supportedProviders: ["TensorRT", "CUDA"], supportedHardware: ["NVIDIA"], supportedPrecisions: ["fp16", "bf16", "fp8", "int8"], supportsBatching: true, supportsStreaming: true, supportsLora: false, multiGpu: true },
  { name: "NVIDIA NIM", version: "unknown", installationState: "unknown", supportedTasks: ["text-generation", "embedding", "reranking", "vision", "multimodal"], supportedFormats: ["safetensors", "pytorch"], supportedArchitectures: [], supportedProviders: ["CUDA", "TensorRT"], supportedHardware: ["NVIDIA"], supportedPrecisions: ["fp16", "bf16", "fp8", "int8"], supportsBatching: true, supportsStreaming: true, supportsLora: false, multiGpu: true },
  { name: "ONNX Runtime", version: "unknown", installationState: "unknown", supportedTasks: ["embedding", "reranking", "classification", "translation", "summarization", "question-answering", "vision", "speech", "audio", "tabular"], supportedFormats: ["onnx"], supportedArchitectures: [], supportedProviders: ["CPU", "CUDA", "TensorRT", "ROCm"], supportedHardware: ["CPU", "NVIDIA", "AMD"], supportedPrecisions: ["fp32", "fp16", "int8"], supportsBatching: true, supportsStreaming: false, supportsLora: false, multiGpu: false },
  { name: "Diffusers", version: "unknown", installationState: "unknown", supportedTasks: ["image-generation", "video", "vision", "multimodal"], supportedFormats: ["diffusers", "safetensors", "pytorch"], supportedArchitectures: [], supportedProviders: ["CPU", "CUDA"], supportedHardware: ["CPU", "NVIDIA"], supportedPrecisions: ["fp16", "bf16", "fp32"], supportsBatching: true, supportsStreaming: false, supportsLora: true, multiGpu: false },
  { name: "llama.cpp", version: "unknown", installationState: "unknown", supportedTasks: ["text-generation", "embedding", "multimodal"], supportedFormats: ["gguf"], supportedArchitectures: [], supportedProviders: ["CPU", "CUDA", "Vulkan"], supportedHardware: ["CPU", "NVIDIA", "AMD"], supportedPrecisions: ["q4", "q5", "q8", "fp16"], supportsBatching: true, supportsStreaming: true, supportsLora: true, multiGpu: true },
]);

function normalize(value: unknown) { return typeof value === "string" ? value.trim().toLowerCase() : ""; }
function runtimeByName(name: string) { return epochRuntimeRegistry.find((runtime) => runtime.name.toLowerCase() === name.trim().toLowerCase()); }
function includesIgnoreCase(values: string[], value: string) { return values.some((item) => normalize(item) === normalize(value)); }
function semver(value: string) { const match = value.match(/^(\d+)\.(\d+)(?:\.(\d+))?/); return match ? [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)] : null; }

export function registerEpochRuntime(input: EpochRuntimeProfile): EpochRuntimeProfile {
  if (!input.name || !input.version.trim()) throw new Error("EPOCH_RUNTIME_VERSION_REQUIRED");
  if (!input.supportedTasks.length || !input.supportedFormats.length) throw new Error("EPOCH_RUNTIME_CAPABILITIES_REQUIRED");
  return { ...input, version: input.version.trim() };
}

export function resolveEpochRuntime(input: { name: string; version?: string; installed?: boolean; registry?: readonly EpochRuntimeProfile[] }): EpochRuntimeProfile | null {
  const base = (input.registry ?? epochRuntimeRegistry).find((runtime) => runtime.name.toLowerCase() === input.name.trim().toLowerCase());
  if (!base) return null;
  return { ...base, version: input.version?.trim() || base.version, installationState: input.installed === true ? "available" : base.installationState };
}

export function evaluateEpochRuntimeCompatibility(input: {
  profile: Pick<EpochModelIntelligenceProfile, "taskFamily" | "architecture" | "artifacts" | "governance">;
  runtime: EpochRuntimeProfile;
  hardware: EpochHardwareProfile;
  executionProvider?: string;
  precision?: string;
  policy?: { allowGovernanceBlocked?: boolean; allowedRuntimes?: string[] };
  verified?: { status: "VERIFIED_COMPATIBLE" | "VERIFIED_INCOMPATIBLE" | "FAILED"; reference: string };
}): EpochRuntimeCompatibility {
  const reasons: string[] = [];
  const failedChecks: string[] = [];
  const unknownChecks: string[] = [];
  const evidence: EpochRuntimeCompatibility["evidence"] = [];
  const task = input.profile.taskFamily.value;
  const formats = [...new Set(input.profile.artifacts.map((artifact) => artifact.format.value))];
  const architecture = input.profile.architecture.value;
  if (input.profile.governance.value.status === "BLOCKED" && input.policy?.allowGovernanceBlocked !== true) return { status: "BLOCKED", score: 0, reasons: input.profile.governance.value.reasons, failedChecks: ["governance"], unknownChecks: [], evidence: [], confidence: 1, recommendedNextAction: "obtain explicit governance approval or choose an eligible model" };
  if (input.policy?.allowedRuntimes?.length && !includesIgnoreCase(input.policy.allowedRuntimes, input.runtime.name)) return { status: "BLOCKED", score: 0, reasons: ["runtime_not_allowed_by_policy"], failedChecks: ["policy"], unknownChecks: [], evidence: [], confidence: 1, recommendedNextAction: "select a runtime allowed by policy" };
  if (task === "unknown") unknownChecks.push("task_family");
  else if (!input.runtime.supportedTasks.includes(task)) { failedChecks.push("task"); reasons.push(`runtime ${input.runtime.name} does not declare support for task ${task}`); }
  for (const format of formats) if (format === "unknown") unknownChecks.push("artifact_format"); else if (!input.runtime.supportedFormats.includes(format)) { failedChecks.push(`format:${format}`); reasons.push(`runtime ${input.runtime.name} does not declare support for ${format}`); }
  if (architecture.length && input.runtime.supportedArchitectures.length && !architecture.some((value) => input.runtime.supportedArchitectures.some((supported) => normalize(value).includes(normalize(supported))))) { failedChecks.push("architecture"); reasons.push("model architecture is not declared by the runtime"); }
  if (input.runtime.installationState === "unavailable") { failedChecks.push("installation"); reasons.push("runtime is unavailable in this environment"); }
  if (input.runtime.installationState === "unknown") unknownChecks.push("runtime_installation");
  const provider = input.executionProvider?.trim();
  if (provider && !includesIgnoreCase(input.runtime.supportedProviders, provider)) { failedChecks.push("execution_provider"); reasons.push(`execution provider ${provider} is not supported by ${input.runtime.name}`); }
  else if (!provider) unknownChecks.push("execution_provider");
  if (input.hardware.available === false) { failedChecks.push("hardware_availability"); reasons.push("hardware is unavailable"); }
  if (!input.hardware.gpuName && input.runtime.supportedHardware.some((value) => value !== "CPU")) unknownChecks.push("gpu");
  else if (input.hardware.gpuName && !input.runtime.supportedHardware.some((value) => value === "CPU" || normalize(input.hardware.gpuName).includes(normalize(value)))) { failedChecks.push("hardware_family"); reasons.push(`hardware ${input.hardware.gpuName} is not declared for ${input.runtime.name}`); }
  if (input.precision && !includesIgnoreCase(input.runtime.supportedPrecisions, input.precision)) { failedChecks.push("precision"); reasons.push(`precision ${input.precision} is not declared by ${input.runtime.name}`); }
  else if (!input.precision) unknownChecks.push("precision");
  if (input.runtime.version === "unknown") unknownChecks.push("runtime_version");
  else if (!semver(input.runtime.version)) unknownChecks.push("runtime_version_format");
  if (input.profile.governance.state === "DECLARED") evidence.push({ type: "declaration", reference: "model-governance", state: "PREDICTED" });
  if (input.verified) return { status: input.verified.status, score: input.verified.status === "VERIFIED_COMPATIBLE" ? 1 : 0, reasons, failedChecks, unknownChecks, evidence: [...evidence, { type: "probe", reference: input.verified.reference, state: input.verified.status === "FAILED" ? "OBSERVED" : "VERIFIED" }], confidence: 1, recommendedNextAction: input.verified.status === "VERIFIED_COMPATIBLE" ? "proceed to benchmark" : "inspect failed runtime probe" };
  if (failedChecks.length) return { status: "PREDICTED_INCOMPATIBLE", score: 0, reasons, failedChecks, unknownChecks, evidence, confidence: 0.92, recommendedNextAction: "choose another runtime/provider/hardware combination" };
  if (unknownChecks.length) return { status: "UNKNOWN", score: null, reasons: ["compatibility cannot be proven until unknown checks are resolved"], failedChecks, unknownChecks, evidence, confidence: 0, recommendedNextAction: "run the cheapest bounded runtime and hardware compatibility probe" };
  return { status: "PREDICTED_COMPATIBLE", score: 0.8, reasons: ["declared task, artifact, runtime, provider, and hardware constraints fit"], failedChecks, unknownChecks, evidence, confidence: 0.8, recommendedNextAction: "run a sandbox smoke test before treating this as verified" };
}

export function applyEpochRuntimeProbeToCompatibility(input: {
  compatibility: EpochRuntimeCompatibility;
  probe: EpochObservedRuntimeProbe;
  requestedModel?: string;
}): EpochRuntimeCompatibility {
  const evidence = [...input.compatibility.evidence, { type: "probe" as const, reference: `runtime-probe:${input.probe.evidenceSha256}`, state: "OBSERVED" as const }];
  if (!input.probe.reachable || input.probe.status === null || input.probe.status < 200 || input.probe.status >= 400) {
    return { ...input.compatibility, status: "FAILED", score: 0, reasons: [...input.compatibility.reasons, input.probe.error ?? `runtime probe returned HTTP ${input.probe.status ?? "unknown"}`], failedChecks: [...input.compatibility.failedChecks, "runtime_probe"], evidence, confidence: 1, recommendedNextAction: "repair the runtime endpoint and run the probe again" };
  }
  const requested = input.requestedModel?.trim();
  if (requested && input.probe.models.length > 0 && !input.probe.models.includes(requested)) {
    return { ...input.compatibility, status: "VERIFIED_INCOMPATIBLE", score: 0, reasons: [...input.compatibility.reasons, `runtime probe did not advertise model ${requested}`], failedChecks: [...input.compatibility.failedChecks, "model_advertised_by_runtime"], unknownChecks: input.compatibility.unknownChecks.filter((check) => check !== "runtime_installation"), evidence: [...evidence, { type: "probe", reference: `model-list:${input.probe.evidenceSha256}`, state: "VERIFIED" }], confidence: 1, recommendedNextAction: "select a model advertised by the runtime or load the requested model" };
  }
  if (input.compatibility.status === "PREDICTED_INCOMPATIBLE" || input.compatibility.status === "BLOCKED" || input.compatibility.status === "UNSUPPORTED") return { ...input.compatibility, evidence, recommendedNextAction: "resolve the failed policy or capability checks before execution" };
  return { ...input.compatibility, status: "VERIFIED_COMPATIBLE", score: 1, reasons: [...input.compatibility.reasons, "runtime health probe succeeded", ...(requested ? [`runtime advertised model ${requested}`] : [])], unknownChecks: input.compatibility.unknownChecks.filter((check) => !["runtime_installation", "runtime_version"].includes(check)), evidence: [...evidence, { type: "probe", reference: `runtime-health:${input.probe.evidenceSha256}`, state: "VERIFIED" }], confidence: 1, recommendedNextAction: "compile the execution plan and run the bounded workload" };
}
