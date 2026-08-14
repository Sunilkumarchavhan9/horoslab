import { prisma } from "../storage/prismaClient";

export function isEpochEvidenceExpired(input: { verifiedAt?: string; now?: Date; maxAgeMs?: number }): boolean {
  if (!input.verifiedAt || !Number.isFinite(Date.parse(input.verifiedAt))) return true;
  const maxAgeMs = Math.max(1, input.maxAgeMs ?? 24 * 60 * 60 * 1000);
  const age = (input.now ?? new Date()).getTime() - Date.parse(input.verifiedAt);
  return age < 0 || age > maxAgeMs;
}

export async function runEpochEvidenceExpiryTick(input: { maxAgeMs?: number; limit?: number; now?: Date } = {}): Promise<{ checked: number; expired: number; observations: string[] }> {
  const now = input.now ?? new Date();
  const maxAgeMs = Math.max(1, input.maxAgeMs ?? Number(process.env.EPOCH_MODEL_EVIDENCE_MAX_AGE_MS ?? 24 * 60 * 60 * 1000));
  const rows = await prisma.epochCapabilityRegistry.findMany({ where: { source: "huggingface", status: "active" }, orderBy: { updatedAt: "asc" }, take: Math.min(1000, Math.max(1, input.limit ?? 200)), select: { id: true, workspaceId: true, name: true, status: true, metadata: true } });
  const observations: string[] = [];
  for (const row of rows) {
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {};
    const gate = metadata.verificationGate && typeof metadata.verificationGate === "object" ? metadata.verificationGate as Record<string, unknown> : {};
    const verifiedAt = typeof metadata.verifiedAt === "string" ? metadata.verifiedAt : typeof gate.evaluatedAt === "string" ? gate.evaluatedAt : undefined;
    if (!isEpochEvidenceExpired({ verifiedAt, maxAgeMs, now })) continue;
    const previousAlert = typeof metadata.evidenceExpiryAlertedAt === "string" ? metadata.evidenceExpiryAlertedAt : undefined;
    if (previousAlert && previousAlert === verifiedAt) continue;
    const updated = await prisma.epochCapabilityRegistry.update({ where: { id: row.id }, data: { status: "unknown", metadata: { ...metadata, evidenceExpiryAlertedAt: verifiedAt ?? now.toISOString(), evidenceExpiry: { status: "EXPIRED", expiredAt: now.toISOString(), verifiedAt: verifiedAt ?? null, maxAgeMs } } as any } });
    const observation = await prisma.epochObservation.create({ data: { workspaceId: row.workspaceId, kind: "epoch_model_evidence_expired", value: { repositoryId: row.name, registryId: updated.id, verifiedAt: verifiedAt ?? null, expiredAt: now.toISOString(), maxAgeMs }, evidenceIds: [], observedAt: now } });
    observations.push(observation.id);
  }
  return { checked: rows.length, expired: observations.length, observations };
}
