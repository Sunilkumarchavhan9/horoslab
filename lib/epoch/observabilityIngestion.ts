import { createHash } from "node:crypto";
import { prisma } from "../storage/prismaClient";

export type EpochMetricSample = { name: string; value: number; labels: Record<string, string>; observedAt: string; source: "prometheus" | "otlp" };
export type EpochObservabilityIngestion = { version: "epoch_observability_ingestion.v1"; status: "OBSERVED" | "INVALID"; source: string; samples: EpochMetricSample[]; reasons: string[]; evidenceSha256: string };
export type EpochPersistedObservability = EpochObservabilityIngestion & { observationId: string };

function labels(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const match = raw.match(/^([^\{]+)(?:\{(.*)\})?$/);
  if (!match?.[2]) return result;
  for (const part of match[2].split(/,(?=[a-zA-Z_][a-zA-Z0-9_]*=)/)) {
    const [key, value] = part.split("=", 2);
    if (key && value) result[key.trim()] = value.trim().replace(/^"|"$/g, "");
  }
  return result;
}

function prometheus(content: string, observedAt: string): EpochMetricSample[] {
  const samples: EpochMetricSample[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(\S+?)(?:\s+)([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*(\d+)?$/);
    if (!match) continue;
    const named = match[1];
    const base = named.split("{", 1)[0];
    const value = Number(match[2]);
    if (Number.isFinite(value)) samples.push({ name: base, value, labels: labels(named), observedAt, source: "prometheus" });
  }
  return samples;
}

function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function otlp(content: unknown, observedAt: string): EpochMetricSample[] {
  const root = content && typeof content === "object" ? content as Record<string, unknown> : {};
  const resourceMetrics = Array.isArray(root.resourceMetrics) ? root.resourceMetrics : [];
  const samples: EpochMetricSample[] = [];
  for (const resource of resourceMetrics) {
    const scopes = resource && typeof resource === "object" && Array.isArray((resource as Record<string, unknown>).scopeMetrics) ? (resource as Record<string, unknown>).scopeMetrics as unknown[] : [];
    for (const scope of scopes) {
      const metrics = scope && typeof scope === "object" && Array.isArray((scope as Record<string, unknown>).metrics) ? (scope as Record<string, unknown>).metrics as unknown[] : [];
      for (const metric of metrics) {
        if (!metric || typeof metric !== "object") continue;
        const item = metric as Record<string, unknown>;
        const name = typeof item.name === "string" ? item.name : null;
        const body = (item.gauge ?? item.sum) as Record<string, unknown> | undefined;
        const points = body && Array.isArray(body.dataPoints) ? body.dataPoints : [];
        if (!name) continue;
        for (const point of points) {
          if (!point || typeof point !== "object") continue;
          const p = point as Record<string, unknown>;
          const value = number(p.asDouble ?? p.asInt);
          if (value === null) continue;
          const attrs: Record<string, string> = {};
          if (Array.isArray(p.attributes)) for (const attr of p.attributes) {
            if (!attr || typeof attr !== "object") continue;
            const a = attr as Record<string, unknown>;
            if (typeof a.key === "string") attrs[a.key] = String((a.value as Record<string, unknown> | undefined)?.stringValue ?? (a.value as Record<string, unknown> | undefined)?.intValue ?? "");
          }
          samples.push({ name, value, labels: attrs, observedAt, source: "otlp" });
        }
      }
    }
  }
  return samples;
}

export function ingestEpochObservability(input: { source: string; content: unknown; contentType?: string; observedAt?: string }): EpochObservabilityIngestion {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const contentType = input.contentType?.toLowerCase() ?? "";
  const samples = contentType.includes("prometheus") || typeof input.content === "string" ? prometheus(String(input.content), observedAt) : otlp(input.content, observedAt);
  const reasons = samples.length ? [] : ["no_valid_metric_samples"];
  const base = { version: "epoch_observability_ingestion.v1" as const, status: samples.length ? "OBSERVED" as const : "INVALID" as const, source: input.source, samples, reasons };
  return { ...base, evidenceSha256: createHash("sha256").update(JSON.stringify(base)).digest("hex") };
}

/**
 * Persist an accepted telemetry batch in the canonical Epoch observation log.
 * Invalid batches are never stored as observations, so downstream reality and
 * drift logic cannot mistake malformed telemetry for measured evidence.
 */
export async function persistEpochObservability(input: {
  workspaceId: string;
  missionId?: string;
  experimentId?: string;
  source: string;
  content: unknown;
  contentType?: string;
  observedAt?: string;
}): Promise<EpochPersistedObservability> {
  const ingestion = ingestEpochObservability(input);
  if (ingestion.status !== "OBSERVED") throw new Error(`epoch_observability_invalid:${ingestion.reasons.join(",")}`);
  const observedAt = input.observedAt ? new Date(input.observedAt) : new Date();
  if (Number.isNaN(observedAt.getTime())) throw new Error("epoch_observability_invalid_observed_at");
  const observation = await prisma.epochObservation.create({
    data: {
      workspaceId: input.workspaceId,
      ...(input.missionId ? { missionId: input.missionId } : {}),
      ...(input.experimentId ? { experimentId: input.experimentId } : {}),
      kind: "observability_metrics",
      value: { source: ingestion.source, samples: ingestion.samples, evidenceSha256: ingestion.evidenceSha256, contentType: input.contentType ?? "" },
      evidenceIds: [ingestion.evidenceSha256],
      observedAt,
    },
    select: { id: true },
  });
  return { ...ingestion, observationId: observation.id };
}
