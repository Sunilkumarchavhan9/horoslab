export type EpochModelFieldStatus = "KNOWN" | "UNKNOWN" | "INFERRED" | "UNSUPPORTED" | "BLOCKED";

export type EpochModelIdentity = {
  source: string;
  repositoryId: string;
  revision: string;
  commitSha: string | null;
  artifactDigest: string | null;
  retrievedAt: string;
};

export type EpochModelInspection = {
  identity: EpochModelIdentity;
  fields: Record<string, { value: unknown; status: EpochModelFieldStatus }>;
  governance: {
    license: { value: string | null; status: EpochModelFieldStatus };
    gated: { value: boolean | null; status: EpochModelFieldStatus };
    eligible: boolean;
    reasons: string[];
  };
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function inspectEpochModel(input: {
  source?: unknown;
  repositoryId?: unknown;
  revision?: unknown;
  commitSha?: unknown;
  artifactDigest?: unknown;
  metadata?: Record<string, unknown>;
}, now = new Date()): EpochModelInspection {
  const source = text(input.source) ?? "unknown";
  const repositoryId = text(input.repositoryId) ?? "";
  const revision = text(input.revision) ?? "main";
  const commitSha = text(input.commitSha);
  const artifactDigest = text(input.artifactDigest);
  const metadata = input.metadata ?? {};
  const license = text(metadata.license);
  const gated = typeof metadata.gated === "boolean" ? metadata.gated : null;
  const reasons: string[] = [];
  if (!repositoryId) reasons.push("model repository identity is missing");
  if (!commitSha) reasons.push("model revision is not pinned to a commit");
  if (!license) reasons.push("model license is unknown");
  if (gated === true) reasons.push("model access is gated and requires verified authorization");

  return {
    identity: { source, repositoryId, revision, commitSha, artifactDigest, retrievedAt: now.toISOString() },
    fields: {
      repositoryId: { value: repositoryId || null, status: repositoryId ? "KNOWN" : "UNKNOWN" },
      revision: { value: revision, status: commitSha ? "KNOWN" : "INFERRED" },
      commitSha: { value: commitSha, status: commitSha ? "KNOWN" : "UNKNOWN" },
      artifactDigest: { value: artifactDigest, status: artifactDigest ? "KNOWN" : "UNKNOWN" },
      license: { value: license, status: license ? "KNOWN" : "UNKNOWN" },
      gated: { value: gated, status: gated === null ? "UNKNOWN" : "KNOWN" },
    },
    governance: {
      license: { value: license, status: license ? "KNOWN" : "UNKNOWN" },
      gated: { value: gated, status: gated === null ? "UNKNOWN" : "KNOWN" },
      eligible: reasons.length === 0,
      reasons,
    },
  };
}
