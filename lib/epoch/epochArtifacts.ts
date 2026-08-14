import { randomUUID } from "crypto";
import { saveOperationalArtifact, type OperationalArtifactRecord } from "../operational/artifactStore";
import { prisma } from "../storage/prismaClient";

export type EpochArtifactKind =
  | "evidence"
  | "document"
  | "screenshot"
  | "export"
  | "certificate"
  | "audit_trail";

export type EpochArtifactData = {
  workspaceId: string;
  institutionId?: string;
  missionId?: string;
  category: EpochArtifactKind;
  mimeType?: string;
  url?: string;
  filePath?: string;
  summary?: string;
  expiresAt?: string;
  payload?: Record<string, unknown>;
  proof?: Record<string, unknown>;
};

export function isEpochArtifactExpired(data: EpochArtifactData, now = new Date()): boolean {
  return Boolean(data.expiresAt && now.getTime() >= new Date(data.expiresAt).getTime());
}

export type EpochArtifactRecord = OperationalArtifactRecord<EpochArtifactData>;

function scopeFor(workspaceId: string): string {
  return `epoch:${workspaceId}`;
}

export async function saveEpochArtifact(input: {
  workspaceId: string;
  institutionId?: string;
  missionId?: string;
  category: EpochArtifactKind;
  name: string;
  mimeType?: string;
  url?: string;
  filePath?: string;
  summary?: string;
  expiresAt?: string;
  payload?: Record<string, unknown>;
  proof?: Record<string, unknown>;
}): Promise<EpochArtifactRecord> {
  return saveOperationalArtifact({
    kind: "epoch_artifact",
    scope: scopeFor(input.workspaceId),
    name: input.name,
    id: `epoch_artifact_${randomUUID().slice(0, 12)}`,
    data: {
      workspaceId: input.workspaceId,
      institutionId: input.institutionId,
      missionId: input.missionId,
      category: input.category,
      mimeType: input.mimeType,
      url: input.url,
      filePath: input.filePath,
      summary: input.summary,
      expiresAt: input.expiresAt,
      payload: input.payload ?? {},
      proof: input.proof ?? {},
    },
  }) as Promise<EpochArtifactRecord>;
}

export async function listEpochArtifacts(input: {
  workspaceId: string;
  institutionId?: string;
  missionId?: string;
  category?: EpochArtifactKind;
}): Promise<EpochArtifactRecord[]> {
  const rows = await prisma.operationalArtifact.findMany({
    where: {
      kind: "epoch_artifact",
      scope: scopeFor(input.workspaceId),
      ...(input.missionId ? { name: { startsWith: `mission:${input.missionId}:` } } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows
    .map((row) => {
      try {
        const data = JSON.parse(row.dataJson) as EpochArtifactData;
        return {
        id: row.id,
        kind: row.kind,
        scope: row.scope,
        name: row.name,
          status: isEpochArtifactExpired(data) ? "expired" : row.status,
          data,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        } satisfies EpochArtifactRecord;
      } catch {
        return null;
      }
    })
    .filter((artifact): artifact is EpochArtifactRecord => Boolean(artifact))
    .filter((artifact) => {
      if (input.institutionId && artifact.data.institutionId !== input.institutionId) return false;
      if (input.missionId && artifact.data.missionId !== input.missionId) return false;
      if (input.category && artifact.data.category !== input.category) return false;
      return true;
    });
}

export async function getEpochArtifactById(input: {
  workspaceId: string;
  artifactId: string;
}): Promise<EpochArtifactRecord | null> {
  const row = await prisma.operationalArtifact.findFirst({
    where: {
      id: input.artifactId,
      kind: "epoch_artifact",
      scope: scopeFor(input.workspaceId),
    },
  });
  if (!row) return null;
  try {
    const data = JSON.parse(row.dataJson) as EpochArtifactData;
    if (isEpochArtifactExpired(data)) return null;
    return {
      id: row.id,
      kind: row.kind,
      scope: row.scope,
      name: row.name,
      status: row.status,
      data,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    return null;
  }
}
