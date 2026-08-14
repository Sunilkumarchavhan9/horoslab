import { appendEpochEvidence } from "../epochStore";
import { prisma } from "../../storage/prismaClient";

export async function summarizeEvidenceService(workspaceId: string) {
  const evidenceCount = await prisma.epochEvidence.count({ where: { workspaceId } });
  const recent = await prisma.epochEvidence.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return {
    workspaceId,
    counts: {
      evidence: evidenceCount,
    },
    recent,
  };
}

export async function recordEvidence(input: Parameters<typeof appendEpochEvidence>[0]) {
  return appendEpochEvidence(input);
}
