import { getEpochCertificate, issueEpochCertificate } from "../epochStore";
import { prisma } from "../../storage/prismaClient";

export async function summarizeCertificateService(workspaceId: string) {
  const certificates = await prisma.epochCertificate.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return {
    workspaceId,
    counts: {
      certificates: certificates.length,
    },
    recent: certificates.slice(0, 10),
  };
}

export async function getCertificate(workspaceId: string, certificateId: string) {
  return getEpochCertificate(workspaceId, certificateId);
}

export async function issueCertificate(input: Parameters<typeof issueEpochCertificate>[0]) {
  return issueEpochCertificate(input);
}
