import { createHash } from "node:crypto";

export const EPOCH_RUNTIME_TARGETS = ["vllm", "sglang", "nvidia_nim", "modal", "kubernetes", "cloud", "data_center"] as const;
export type EpochRuntimeTarget = (typeof EPOCH_RUNTIME_TARGETS)[number];

export type EpochRuntimeProbe = {
  target: EpochRuntimeTarget;
  endpoint: string;
  reachable: boolean;
  status: number | null;
  latencyMs: number;
  models: string[];
  evidenceSha256: string;
  checkedAt: string;
  error?: string;
};

export type EpochRuntimeExecution = {
  target: EpochRuntimeTarget;
  model: string;
  output: string;
  status: number;
  latencyMs: number;
  responseSha256: string;
  executedAt: string;
};

export class EpochRuntimeAdapterError extends Error {
  constructor(message: string, public readonly code = "RUNTIME_ADAPTER_FAILED") { super(message); this.name = "EpochRuntimeAdapterError"; }
}

function targetEndpoint(target: EpochRuntimeTarget, endpointEnvVar: string) {
  if (!/^EPOCH_RUNTIME_[A-Z0-9_]+_ENDPOINT$/.test(endpointEnvVar)) throw new EpochRuntimeAdapterError("Runtime endpoint must use an EPOCH_RUNTIME_*_ENDPOINT environment variable", "INVALID_ENDPOINT_VARIABLE");
  const raw = process.env[endpointEnvVar]?.trim();
  if (!raw) throw new EpochRuntimeAdapterError(`Runtime endpoint variable ${endpointEnvVar} is not configured`, "RUNTIME_NOT_CONFIGURED");
  let url: URL;
  try { url = new URL(raw); } catch { throw new EpochRuntimeAdapterError("Runtime endpoint URL is invalid", "INVALID_ENDPOINT"); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new EpochRuntimeAdapterError("Runtime endpoint must be HTTP(S) without embedded credentials", "INVALID_ENDPOINT");
  if (target !== "vllm" && target !== "sglang" && target !== "nvidia_nim" && url.protocol !== "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new EpochRuntimeAdapterError("Remote runtime endpoints must use HTTPS", "INSECURE_ENDPOINT");
  return url;
}

function authHeader(tokenEnvVar?: string): Record<string, string> {
  if (!tokenEnvVar) return {};
  if (!/^EPOCH_RUNTIME_[A-Z0-9_]+_TOKEN$/.test(tokenEnvVar)) throw new EpochRuntimeAdapterError("Runtime token must use an EPOCH_RUNTIME_*_TOKEN environment variable", "INVALID_TOKEN_VARIABLE");
  const token = process.env[tokenEnvVar]?.trim();
  if (!token) throw new EpochRuntimeAdapterError(`Runtime token variable ${tokenEnvVar} is not configured`, "RUNTIME_NOT_CONFIGURED");
  return { authorization: `Bearer ${token}` };
}

function endpointForPath(base: URL, path: string) {
  const basePath = base.pathname.replace(/\/+$/, "");
  const requestedPath = path.replace(/^\/+/, "");
  const relativePath = basePath.endsWith("/v1") && requestedPath.startsWith("v1/") ? requestedPath.slice(3) : requestedPath;
  return new URL(`${basePath}/${relativePath}`, base.origin);
}

export async function probeEpochRuntimeAdapter(input: { target: EpochRuntimeTarget; endpointEnvVar: string; tokenEnvVar?: string; fetchImpl?: typeof fetch }): Promise<EpochRuntimeProbe> {
  const base = targetEndpoint(input.target, input.endpointEnvVar);
  const http = input.fetchImpl ?? fetch;
  const headers = { accept: "application/json", ...authHeader(input.tokenEnvVar) };
  const startedAt = Date.now();
  const evidence: unknown[] = [];
  let status: number | null = null;
  try {
    const health = await http(endpointForPath(base, "health"), { headers, signal: AbortSignal.timeout(10_000) });
    status = health.status;
    evidence.push({ path: "health", status: health.status });
    let models: string[] = [];
    if (["vllm", "sglang", "nvidia_nim", "modal"].includes(input.target)) {
      const response = await http(endpointForPath(base, "v1/models"), { headers, signal: AbortSignal.timeout(10_000) });
      const body = await response.json().catch(() => null) as any;
      models = Array.isArray(body?.data) ? body.data.map((item: any) => item?.id).filter((item: unknown): item is string => typeof item === "string") : [];
      evidence.push({ path: "v1/models", status: response.status, models });
      status = response.status;
    }
    return { target: input.target, endpoint: base.origin + base.pathname, reachable: status >= 200 && status < 500, status, latencyMs: Date.now() - startedAt, models, evidenceSha256: createHash("sha256").update(JSON.stringify(evidence)).digest("hex"), checkedAt: new Date().toISOString() };
  } catch (error) {
    return { target: input.target, endpoint: base.origin + base.pathname, reachable: false, status, latencyMs: Date.now() - startedAt, models: [], evidenceSha256: createHash("sha256").update(JSON.stringify(evidence)).digest("hex"), checkedAt: new Date().toISOString(), error: error instanceof Error ? error.name : "runtime_probe_failed" };
  }
}

export async function executeEpochRuntimeAdapter(input: { target: Extract<EpochRuntimeTarget, "vllm" | "sglang" | "nvidia_nim" | "modal">; endpointEnvVar: string; tokenEnvVar?: string; model: string; prompt: string; maxOutputTokens: number; fetchImpl?: typeof fetch }): Promise<EpochRuntimeExecution> {
  const base = targetEndpoint(input.target, input.endpointEnvVar);
  const http = input.fetchImpl ?? fetch;
  const startedAt = Date.now();
  const response = await http(endpointForPath(base, "v1/chat/completions"), { method: "POST", headers: { "content-type": "application/json", ...authHeader(input.tokenEnvVar) }, body: JSON.stringify({ model: input.model, messages: [{ role: "user", content: input.prompt }], max_tokens: input.maxOutputTokens }), signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new EpochRuntimeAdapterError(`Runtime execution returned HTTP ${response.status}`, "RUNTIME_EXECUTION_FAILED");
  let body: any;
  try { body = JSON.parse(bytes.toString("utf8")); } catch { throw new EpochRuntimeAdapterError("Runtime execution returned invalid JSON", "INVALID_RUNTIME_RESPONSE"); }
  const output = body?.choices?.[0]?.message?.content;
  if (typeof output !== "string") throw new EpochRuntimeAdapterError("Runtime execution response did not contain assistant output", "INVALID_RUNTIME_RESPONSE");
  return { target: input.target, model: input.model, output, status: response.status, latencyMs: Date.now() - startedAt, responseSha256: createHash("sha256").update(bytes).digest("hex"), executedAt: new Date().toISOString() };
}
