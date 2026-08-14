import type {
  EpochHuggingFaceInspection,
  EpochHuggingFaceModelFormat,
  EpochHuggingFaceModality,
  EpochHuggingFaceTaskFamily,
} from "./huggingFace";

export type EpochTruthState =
  | "DECLARED"
  | "INFERRED"
  | "PREDICTED"
  | "OBSERVED"
  | "SIMULATED"
  | "VERIFIED"
  | "CONTRADICTED"
  | "UNKNOWN";

export type EpochProvenance<T> = {
  value: T;
  state: EpochTruthState;
  confidence: number;
  sources: Array<{
    kind: "huggingface_api" | "model_card" | "artifact_manifest" | "runtime_probe" | "hardware_probe" | "experiment";
    reference: string;
    retrievedAt: string;
  }>;
  rationale?: string;
};

export type EpochArtifactProfile = {
  path: EpochProvenance<string>;
  format: EpochProvenance<EpochHuggingFaceModelFormat>;
  sizeBytes: EpochProvenance<number | null>;
  sha256: EpochProvenance<string | null>;
  materialization: "metadata" | "manifest" | "smoke-test" | "full";
  security: EpochProvenance<"not-scanned" | "safe" | "requires-review" | "blocked">;
};

export type EpochModelIntelligenceProfile = {
  profileVersion: "1";
  identity: {
    source: EpochProvenance<"huggingface">;
    repositoryId: EpochProvenance<string>;
    revision: EpochProvenance<string>;
    commitSha: EpochProvenance<string | null>;
    manifestDigest: EpochProvenance<string | null>;
  };
  task: EpochProvenance<string | null>;
  taskFamily: EpochProvenance<EpochHuggingFaceTaskFamily>;
  modalities: EpochProvenance<EpochHuggingFaceModality[]>;
  architecture: EpochProvenance<string[]>;
  parameters: EpochProvenance<{ count: number | null; precision: string | null; quantization: string | null }>;
  context: EpochProvenance<{ maxTokens: number | null }>;
  artifacts: EpochArtifactProfile[];
  dependencies: EpochProvenance<string[]>;
  inputSchema: EpochProvenance<Record<string, unknown> | null>;
  outputSchema: EpochProvenance<Record<string, unknown> | null>;
  runtimes: EpochProvenance<string[]>;
  hardware: EpochProvenance<string[]>;
  executionProviders: EpochProvenance<string[]>;
  governance: EpochProvenance<EpochHuggingFaceInspection["governance"]>;
  license: EpochProvenance<string | null>;
  gating: EpochProvenance<boolean | null>;
  security: EpochProvenance<{ unsafeFiles: string[]; status: "not-scanned" | "requires-review" | "blocked" }>;
  compatibility: EpochProvenance<{ status: "UNKNOWN" | "PREDICTED_COMPATIBLE" | "PREDICTED_INCOMPATIBLE" | "UNSUPPORTED" | "BLOCKED"; reasons: string[] }>;
  evidence: Array<EpochProvenance<unknown>>;
  unknowns: string[];
  recommendedExperiments: string[];
};

export type EpochFormatAdapter = {
  format: EpochHuggingFaceModelFormat;
  detect: (paths: string[]) => boolean;
  inspect: (paths: string[]) => { requirements: string[]; warnings: string[] };
  validate: (paths: string[]) => { valid: boolean; reasons: string[] };
  manifest: (paths: string[]) => string[];
  dependencies: string[];
  loaderCandidates: string[];
  runtimeCandidates: string[];
  hardwareCandidates: string[];
  materializationStrategy: "metadata-first" | "manifest-first" | "full-weights";
  smokeTest: (paths: string[]) => { status: "NOT_RUN"; command: string; input: Record<string, unknown> };
  securityChecks: string[];
};

const source = (reference: string, retrievedAt: string, kind: EpochProvenance<unknown>["sources"][number]["kind"] = "huggingface_api") => ({ kind, reference, retrievedAt });
const declared = <T>(value: T, reference: string, retrievedAt: string, confidence = 1): EpochProvenance<T> => ({ value, state: "DECLARED", confidence, sources: [source(reference, retrievedAt)] });
const inferred = <T>(value: T, reference: string, retrievedAt: string, rationale: string, confidence = 0.75): EpochProvenance<T> => ({ value, state: "INFERRED", confidence, sources: [source(reference, retrievedAt)], rationale });

const basenameMatch = (pattern: RegExp) => (paths: string[]) => paths.some((path) => pattern.test(path.toLowerCase()));

const adapters: EpochFormatAdapter[] = [
  {
    format: "safetensors", detect: basenameMatch(/\.safetensors$/),
    inspect: () => ({ requirements: ["safetensors loader"], warnings: [] }),
    validate: (paths) => ({ valid: paths.some((path) => /\.safetensors$/i.test(path)), reasons: paths.some((path) => /\.safetensors$/i.test(path)) ? [] : ["missing_safetensors_file"] }),
    manifest: (paths) => paths.filter((path) => /\.safetensors$/i.test(path)), dependencies: ["safetensors"], loaderCandidates: ["transformers"], runtimeCandidates: ["transformers", "vLLM", "SGLang"], hardwareCandidates: ["CPU", "CUDA", "ROCm"], materializationStrategy: "manifest-first",
    smokeTest: () => ({ status: "NOT_RUN", command: "load config and one tensor shard without executing model code", input: {} }), securityChecks: ["reject pickle sidecars", "verify SHA-256", "sandbox loader"],
  },
  {
    format: "gguf", detect: basenameMatch(/\.gguf$/),
    inspect: () => ({ requirements: ["GGUF-compatible loader"], warnings: ["quantization metadata must be read from the GGUF header"] }),
    validate: (paths) => ({ valid: paths.some((path) => /\.gguf$/i.test(path)), reasons: paths.some((path) => /\.gguf$/i.test(path)) ? [] : ["missing_gguf_file"] }),
    manifest: (paths) => paths.filter((path) => /\.gguf$/i.test(path)), dependencies: ["GGUF parser"], loaderCandidates: ["llama.cpp"], runtimeCandidates: ["llama.cpp", "Ollama"], hardwareCandidates: ["CPU", "CUDA", "Vulkan"], materializationStrategy: "full-weights",
    smokeTest: () => ({ status: "NOT_RUN", command: "read GGUF header and run a bounded prompt", input: { maxTokens: 8 } }), securityChecks: ["verify GGUF header", "verify SHA-256", "sandbox runtime"],
  },
  {
    format: "onnx", detect: basenameMatch(/\.onnx$/),
    inspect: () => ({ requirements: ["ONNX graph inspection"], warnings: ["execution provider must be selected"] }),
    validate: (paths) => ({ valid: paths.some((path) => /\.onnx$/i.test(path)), reasons: paths.some((path) => /\.onnx$/i.test(path)) ? [] : ["missing_onnx_file"] }),
    manifest: (paths) => paths.filter((path) => /\.onnx$/i.test(path)), dependencies: ["onnxruntime"], loaderCandidates: ["ONNX Runtime"], runtimeCandidates: ["ONNX Runtime"], hardwareCandidates: ["CPU", "CUDA", "TensorRT"], materializationStrategy: "manifest-first",
    smokeTest: () => ({ status: "NOT_RUN", command: "load ONNX graph and validate input/output schemas", input: {} }), securityChecks: ["reject external data path traversal", "verify SHA-256", "disable network operators"],
  },
  {
    format: "pytorch", detect: basenameMatch(/\.(bin|pt|pth|ckpt)$/),
    inspect: () => ({ requirements: ["PyTorch loader"], warnings: ["pickle-based weights require explicit trusted-code approval"] }),
    validate: (paths) => ({ valid: paths.some((path) => /\.(bin|pt|pth|ckpt)$/i.test(path)), reasons: ["pickle_or_executable_code_requires_review"] }),
    manifest: (paths) => paths.filter((path) => /\.(bin|pt|pth|ckpt)$/i.test(path)), dependencies: ["torch"], loaderCandidates: ["transformers", "torch"], runtimeCandidates: ["transformers", "vLLM"], hardwareCandidates: ["CPU", "CUDA", "ROCm"], materializationStrategy: "manifest-first",
    smokeTest: () => ({ status: "NOT_RUN", command: "inspect state-dict in an isolated process", input: {} }), securityChecks: ["block arbitrary pickle execution by default", "verify SHA-256", "sandbox loader"],
  },
  {
    format: "diffusers", detect: basenameMatch(/(^|\/)model_index\.json$/),
    inspect: () => ({ requirements: ["Diffusers pipeline inspection"], warnings: ["pipeline components may contain multiple model families"] }),
    validate: (paths) => ({ valid: paths.some((path) => /(^|\/)model_index\.json$/i.test(path)), reasons: paths.some((path) => /(^|\/)model_index\.json$/i.test(path)) ? [] : ["missing_model_index"] }),
    manifest: (paths) => paths.filter((path) => /(^|\/)model_index\.json$/i.test(path) || /(^|\/)(unet|vae|text_encoder)/i.test(path)), dependencies: ["diffusers"], loaderCandidates: ["Diffusers"], runtimeCandidates: ["Diffusers"], hardwareCandidates: ["CUDA", "CPU"], materializationStrategy: "manifest-first",
    smokeTest: () => ({ status: "NOT_RUN", command: "load pipeline config without generating media", input: {} }), securityChecks: ["validate component paths", "verify SHA-256", "sandbox pipeline"],
  },
  {
    format: "adapter", detect: basenameMatch(/(^|\/)(adapter|adapter_model)/),
    inspect: () => ({ requirements: ["base model identity", "adapter configuration"], warnings: ["adapter cannot execute without a compatible base model"] }),
    validate: () => ({ valid: true, reasons: ["base_model_compatibility_required"] }),
    manifest: (paths) => paths.filter((path) => /(^|\/)(adapter|adapter_model)/i.test(path)), dependencies: ["base model", "peft"], loaderCandidates: ["PEFT"], runtimeCandidates: ["transformers", "vLLM"], hardwareCandidates: ["CPU", "CUDA", "ROCm"], materializationStrategy: "manifest-first",
    smokeTest: () => ({ status: "NOT_RUN", command: "apply adapter to pinned base model in sandbox", input: {} }), securityChecks: ["verify base-model relationship", "verify SHA-256", "sandbox loader"],
  },
  {
    format: "lora", detect: basenameMatch(/lora/),
    inspect: () => ({ requirements: ["base model identity", "LoRA loader"], warnings: ["LoRA is not a standalone executable model"] }),
    validate: () => ({ valid: true, reasons: ["base_model_compatibility_required"] }),
    manifest: (paths) => paths.filter((path) => /lora/i.test(path)), dependencies: ["base model", "peft"], loaderCandidates: ["PEFT"], runtimeCandidates: ["transformers", "vLLM"], hardwareCandidates: ["CPU", "CUDA", "ROCm"], materializationStrategy: "manifest-first",
    smokeTest: () => ({ status: "NOT_RUN", command: "apply LoRA to pinned base model in sandbox", input: {} }), securityChecks: ["verify base-model relationship", "verify SHA-256", "sandbox loader"],
  },
];

export const epochModelFormatAdapters = Object.freeze(adapters);

export function getEpochFormatAdapters(paths: string[]): EpochFormatAdapter[] {
  return epochModelFormatAdapters.filter((adapter) => adapter.detect(paths));
}

export function buildEpochModelIntelligenceProfile(inspection: EpochHuggingFaceInspection, options: { retrievedAt?: string; sourceReference?: string } = {}): EpochModelIntelligenceProfile {
  const retrievedAt = options.retrievedAt ?? inspection.retrievedAt;
  const reference = options.sourceReference ?? `hf://${inspection.repositoryId}@${inspection.revision}`;
  const paths = inspection.files.map((file) => file.path);
  const selectedAdapters = getEpochFormatAdapters(paths);
  const formatFor = (path: string): EpochHuggingFaceModelFormat => selectedAdapters.find((adapter) => adapter.detect([path]))?.format ?? "unknown";
  const unsafeFiles = inspection.governance.unsafeFiles ?? [];
  const securityStatus = inspection.governance.status === "BLOCKED" ? "blocked" : unsafeFiles.length ? "requires-review" : "not-scanned";
  const unknowns = [
    ...(!inspection.commitSha ? ["commit_sha"] : []),
    ...(!inspection.files.length ? ["artifact_manifest"] : []),
    ...(inspection.taskFamily === "unknown" ? ["task_family"] : []),
    ...(selectedAdapters.length === 0 ? ["format_adapter"] : []),
    ...(!inspection.architecture.length ? ["architecture"] : []),
    "runtime_version_probe",
    "hardware_execution_probe",
    "task_quality_evaluation",
  ];
  const runtimeCandidates = [...new Set(selectedAdapters.flatMap((adapter) => adapter.runtimeCandidates))];
  const hardwareCandidates = [...new Set(selectedAdapters.flatMap((adapter) => adapter.hardwareCandidates))];
  const executionProviders = [...new Set(selectedAdapters.flatMap((adapter) => adapter.hardwareCandidates.filter((value) => ["CUDA", "ROCm", "TensorRT", "CPU", "Vulkan"].includes(value))))];
  return {
    profileVersion: "1",
    identity: {
      source: declared("huggingface", reference, retrievedAt),
      repositoryId: declared(inspection.repositoryId, reference, retrievedAt),
      revision: declared(inspection.revision, reference, retrievedAt),
      commitSha: inspection.commitSha ? declared(inspection.commitSha, reference, retrievedAt) : { value: null, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
      manifestDigest: inspection.artifactDigest ? declared(inspection.artifactDigest, reference, retrievedAt) : { value: null, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
    },
    task: inspection.task ? declared(inspection.task, reference, retrievedAt) : { value: null, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
    taskFamily: inspection.taskFamily ? inferred(inspection.taskFamily, reference, retrievedAt, "normalized from task, tags, and library metadata") : { value: "unknown", state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
    modalities: inspection.modalities ? inferred(inspection.modalities, reference, retrievedAt, "derived from normalized task family") : { value: [], state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
    architecture: inspection.architecture.length ? declared(inspection.architecture, reference, retrievedAt) : { value: [], state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
    parameters: inferred({ count: null, precision: null, quantization: null }, reference, retrievedAt, "parameter and precision inspection has not run", 0),
    context: inferred({ maxTokens: null }, reference, retrievedAt, "context length inspection has not run", 0),
    artifacts: inspection.files.map((file) => ({ path: declared(file.path, reference, retrievedAt), format: inferred(formatFor(file.path), reference, retrievedAt, "derived from artifact filename and adapter detection"), sizeBytes: declared(file.size, reference, retrievedAt), sha256: file.sha256 ? declared(file.sha256, reference, retrievedAt) : { value: null, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] }, materialization: "manifest", security: { value: securityStatus === "blocked" ? "blocked" : "not-scanned", state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] } })),
    dependencies: inferred([...new Set(selectedAdapters.flatMap((adapter) => adapter.dependencies))], reference, retrievedAt, "derived from selected format adapters"),
    inputSchema: { value: null, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
    outputSchema: { value: null, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
    runtimes: inferred(runtimeCandidates, reference, retrievedAt, "candidate runtimes derived from artifact formats"),
    hardware: inferred(hardwareCandidates, reference, retrievedAt, "candidate hardware derived from artifact formats"),
    executionProviders: inferred(executionProviders, reference, retrievedAt, "candidate execution providers derived from hardware adapters"),
    governance: declared(inspection.governance, reference, retrievedAt), license: inspection.license ? declared(inspection.license, reference, retrievedAt) : { value: null, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] }, gating: inspection.gated === null ? { value: null, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] } : declared(inspection.gated, reference, retrievedAt),
    security: { value: { unsafeFiles, status: securityStatus }, state: unsafeFiles.length || securityStatus === "blocked" ? "DECLARED" : "UNKNOWN", confidence: unsafeFiles.length || securityStatus === "blocked" ? 1 : 0, sources: [source(reference, retrievedAt)] },
    compatibility: inspection.governance.status === "BLOCKED" ? declared({ status: "BLOCKED", reasons: inspection.governance.reasons }, reference, retrievedAt) : { value: { status: "UNKNOWN", reasons: unknowns }, state: "UNKNOWN", confidence: 0, sources: [source(reference, retrievedAt)] },
    evidence: [], unknowns, recommendedExperiments: ["run runtime-version compatibility probe", "run bounded sandbox smoke test", "measure task-specific quality and latency"],
  };
}
