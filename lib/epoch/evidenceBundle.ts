import { createHash } from "node:crypto";
import { verifyEvidenceIntegrity } from "./evidenceIntegrity";

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
}

export function buildEpochEvidenceBundle(input: {
  mission: { id: string; title: string; objective: string; state: string };
  evidence: Array<{ id: string; kind: string; url?: string | null; filePath?: string | null; contentType?: string | null; summary: string; payload: unknown; proof: unknown; createdAt: Date | string }>;
  verification?: unknown;
}): { version: "epoch.evidence-bundle.v1"; mission: typeof input.mission; evidence: unknown[]; verification: unknown; bundleHash: string } {
  const evidence = input.evidence.map((item) => ({
    id: item.id,
    kind: item.kind,
    url: item.url ?? null,
    filePath: item.filePath ?? null,
    contentType: item.contentType ?? null,
    summary: item.summary,
    payload: item.payload ?? {},
    proof: item.proof ?? {},
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    integrity: verifyEvidenceIntegrity(item),
  }));
  const content = { version: "epoch.evidence-bundle.v1" as const, mission: input.mission, evidence, verification: input.verification ?? null };
  const bundleHash = createHash("sha256").update(stable(content), "utf8").digest("hex");
  return { ...content, bundleHash };
}
