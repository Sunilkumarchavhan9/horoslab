import { createHash } from "node:crypto";
import { EpochRuntimeAdapterError } from "./runtimeAdapters";

export type EpochDeploymentTarget = "kubernetes" | "cloud" | "data_center";

function endpoint(envVar: string) {
  if (!/^EPOCH_DEPLOYMENT_[A-Z0-9_]+_ENDPOINT$/.test(envVar)) throw new EpochRuntimeAdapterError("Deployment endpoint must use an EPOCH_DEPLOYMENT_*_ENDPOINT environment variable", "INVALID_ENDPOINT_VARIABLE");
  const raw = process.env[envVar]?.trim();
  if (!raw) throw new EpochRuntimeAdapterError("Deployment endpoint is not configured", "DEPLOYMENT_NOT_CONFIGURED");
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new EpochRuntimeAdapterError("Deployment endpoint must be HTTP(S) without credentials", "INVALID_ENDPOINT");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new EpochRuntimeAdapterError("Remote deployment endpoints must use HTTPS", "INSECURE_ENDPOINT");
  return url;
}

function token(envVar?: string): Record<string, string> {
  if (!envVar) return {};
  if (!/^EPOCH_DEPLOYMENT_[A-Z0-9_]+_TOKEN$/.test(envVar)) throw new EpochRuntimeAdapterError("Deployment token must use an EPOCH_DEPLOYMENT_*_TOKEN environment variable", "INVALID_TOKEN_VARIABLE");
  const value = process.env[envVar]?.trim();
  if (!value) throw new EpochRuntimeAdapterError("Deployment token is not configured", "DEPLOYMENT_NOT_CONFIGURED");
  return { authorization: `Bearer ${value}` };
}

export async function deployEpochRuntimeTarget(input: { target: EpochDeploymentTarget; endpointEnvVar: string; tokenEnvVar?: string; name: string; model: string; version: string; manifest: Record<string, unknown>; fetchImpl?: typeof fetch }) {
  const base = endpoint(input.endpointEnvVar);
  const response = await (input.fetchImpl ?? fetch)(new URL("deployments", `${base.origin}${base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`}`), { method: "POST", headers: { "content-type": "application/json", accept: "application/json", ...token(input.tokenEnvVar) }, body: JSON.stringify({ target: input.target, name: input.name, model: input.model, version: input.version, manifest: input.manifest }), signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new EpochRuntimeAdapterError(`Deployment adapter returned HTTP ${response.status}`, "DEPLOYMENT_FAILED");
  return { target: input.target, status: response.status, response: JSON.parse(bytes.toString("utf8") || "{}"), responseSha256: createHash("sha256").update(bytes).digest("hex"), deployedAt: new Date().toISOString() };
}

export async function rollbackEpochRuntimeTarget(input: { target: EpochDeploymentTarget; endpointEnvVar: string; tokenEnvVar?: string; deploymentId: string; version?: string; reason: string; fetchImpl?: typeof fetch }) {
  const base = endpoint(input.endpointEnvVar);
  const url = new URL(`deployments/${encodeURIComponent(input.deploymentId)}/rollback`, `${base.origin}${base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`}`);
  const response = await (input.fetchImpl ?? fetch)(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json", ...token(input.tokenEnvVar) }, body: JSON.stringify({ target: input.target, version: input.version, reason: input.reason }), signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new EpochRuntimeAdapterError(`Rollback adapter returned HTTP ${response.status}`, "ROLLBACK_FAILED");
  return { target: input.target, deploymentId: input.deploymentId, status: response.status, response: JSON.parse(bytes.toString("utf8") || "{}"), responseSha256: createHash("sha256").update(bytes).digest("hex"), rolledBackAt: new Date().toISOString() };
}
