import { createHash } from "node:crypto";

export const EPOCH_EVIDENCE_HASH_ALGORITHM = "sha256" as const;
export const EPOCH_EVIDENCE_CANONICAL_VERSION = "epoch.evidence.canonical.v1" as const;

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

export function canonicalEvidencePayload(input: {
  kind: string;
  url?: string | null;
  filePath?: string | null;
  contentType?: string | null;
  summary?: string | null;
  payload?: unknown;
}): string {
  return canonicalize({
    kind: input.kind,
    url: input.url ?? null,
    filePath: input.filePath ?? null,
    contentType: input.contentType ?? null,
    summary: input.summary ?? "",
    payload: input.payload ?? {},
  });
}

export function hashEvidencePayload(input: Parameters<typeof canonicalEvidencePayload>[0]): string {
  return createHash(EPOCH_EVIDENCE_HASH_ALGORITHM).update(canonicalEvidencePayload(input), "utf8").digest("hex");
}

export function buildEvidenceIntegrityProof(input: Parameters<typeof canonicalEvidencePayload>[0], proof?: Record<string, unknown>) {
  return {
    ...(proof ?? {}),
    hashAlgorithm: EPOCH_EVIDENCE_HASH_ALGORITHM,
    canonicalVersion: EPOCH_EVIDENCE_CANONICAL_VERSION,
    contentHash: hashEvidencePayload(input),
  };
}

export function verifyEvidenceIntegrity(input: Parameters<typeof canonicalEvidencePayload>[0] & { proof?: unknown }): {
  valid: boolean;
  legacy: boolean;
  expectedHash: string;
  actualHash: string | null;
} {
  const expectedHash = hashEvidencePayload(input);
  const proof = input.proof && typeof input.proof === "object" ? input.proof as Record<string, unknown> : {};
  const actualHash = typeof proof.contentHash === "string" ? proof.contentHash : null;
  return {
    valid: actualHash === null || actualHash === expectedHash,
    legacy: actualHash === null,
    expectedHash,
    actualHash,
  };
}
