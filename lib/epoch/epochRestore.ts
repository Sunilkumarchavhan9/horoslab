import { prisma } from "../storage/prismaClient";
import { getOperationalArtifact, getOperationalArtifactById } from "../operational/artifactStore";
import { getEpochArtifactById } from "./epochArtifacts";
import { createEpochInstitution, createEpochMission, createEpochTemplate, updateEpochInstitution, updateEpochMission, upsertEpochIntegration, type CreateEpochMissionInput } from "./epochStore";
import type { EpochMissionControlSnapshot } from "./epochMissionControl";
import { archiveEpochInstitution } from "./epochStore";

type RestoreSummary = {
  templates: number;
  institutions: number;
  missions: number;
  evidence: number;
  verifications: number;
  certificates: number;
  memories: number;
  integrations: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toJsonValue<T = unknown>(value: T): any {
  return JSON.parse(JSON.stringify(value ?? null));
}

function snapshotFromArtifactData(value: unknown): EpochMissionControlSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const directSnapshot = record.snapshot;
  if (directSnapshot && typeof directSnapshot === "object" && !Array.isArray(directSnapshot)) {
    return directSnapshot as EpochMissionControlSnapshot;
  }
  const payload = record.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const nested = (payload as Record<string, unknown>).snapshot;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as EpochMissionControlSnapshot;
    }
  }
  return null;
}

export async function restoreEpochMissionControlSnapshot(input: {
  workspaceId: string;
  userId: string;
  orgId?: string;
  snapshot?: EpochMissionControlSnapshot;
  artifactName?: string;
  artifactId?: string;
}): Promise<{ snapshot: EpochMissionControlSnapshot; restored: RestoreSummary } | null> {
  let artifact = input.artifactId
    ? await getEpochArtifactById({
        workspaceId: input.workspaceId,
        artifactId: input.artifactId,
      })
    : input.artifactName
      ? await getOperationalArtifact<EpochMissionControlSnapshot>({
          kind: "epoch_artifact",
          scope: `epoch:${input.workspaceId}`,
          name: input.artifactName,
        })
      : null;
  if (!artifact && input.artifactId) {
    const candidate = await getOperationalArtifactById<EpochMissionControlSnapshot>(input.artifactId, "epoch_artifact");
    const sourceWorkspaceId = asRecord(candidate?.data).workspaceId;
    const sourceWorkspace = typeof sourceWorkspaceId === "string"
      ? await prisma.workspace.findFirst({ where: { id: sourceWorkspaceId, userId: input.userId }, select: { id: true } })
      : null;
    if (sourceWorkspace) artifact = candidate as typeof artifact;
  }
  const snapshot = input.snapshot ?? snapshotFromArtifactData(artifact?.data) ?? null;
  if (!snapshot) return null;

  const restored: RestoreSummary = {
    templates: 0,
    institutions: 0,
    missions: 0,
    evidence: 0,
    verifications: 0,
    certificates: 0,
    memories: 0,
    integrations: 0,
  };

  const templateMap = new Map<string, string>();
  for (const template of snapshot.recent.templates ?? []) {
    const existing = await prisma.epochInstitutionTemplate.findFirst({
      where: {
        workspaceId: input.workspaceId,
        name: template.name,
        version: template.version,
      },
    });
    if (existing) {
      templateMap.set(template.id, existing.id);
      continue;
    }
    const created = await createEpochTemplate({
      workspaceId: input.workspaceId,
      userId: input.userId,
      orgId: input.orgId,
      name: template.name,
      category: template.category,
      description: template.description,
      version: template.version,
      definition: asRecord(template.definition),
      proof: { ...asRecord(template.proof), restoredFrom: template.id },
    });
    templateMap.set(template.id, created.id);
    restored.templates += 1;
  }

  const institutionMap = new Map<string, string>();
  for (const institution of snapshot.recent.institutions ?? []) {
    const existing = await prisma.epochInstitution.findFirst({
      where: {
        workspaceId: input.workspaceId,
        name: institution.name,
        version: institution.version,
      },
    });
    if (existing) {
      institutionMap.set(institution.id, existing.id);
      continue;
    }

    const created = await createEpochInstitution({
      workspaceId: input.workspaceId,
      userId: input.userId,
      orgId: input.orgId,
      name: institution.name,
      category: institution.category,
      version: institution.version,
      summary: institution.summary,
      templateId: institution.templateId ? templateMap.get(institution.templateId) ?? institution.templateId : undefined,
      metadata: asRecord(institution.metadata),
      proof: { ...asRecord(institution.proof), restoredFrom: institution.id },
    });
    institutionMap.set(institution.id, created.id);
    restored.institutions += 1;

    await prisma.epochInstitution.update({
      where: { id: created.id },
      data: {
        status: institution.status ?? "active",
        currentState: institution.currentState ?? "draft",
        ...(institution.archivedAt ? { archivedAt: new Date(institution.archivedAt) } : {}),
      },
    });
    if (institution.status === "archived") {
      await archiveEpochInstitution(input.workspaceId, created.id);
    }
  }

  const missionMap = new Map<string, string>();
  for (const mission of snapshot.recent.missions ?? []) {
    const targetInstitutionId = institutionMap.get(mission.institutionId) ?? mission.institutionId;
    const existing = await prisma.epochMission.findFirst({
      where: {
        workspaceId: input.workspaceId,
        institutionId: targetInstitutionId,
        title: mission.title,
        objective: mission.objective,
      },
    });
    if (existing) {
      missionMap.set(mission.id, existing.id);
      continue;
    }

    const authority = asArray<Record<string, unknown>>(mission.authorityPolicies)[0] ?? null;
    const created = await createEpochMission({
      workspaceId: input.workspaceId,
      institutionId: targetInstitutionId,
      userId: input.userId,
      orgId: input.orgId,
      title: mission.title,
      objective: mission.objective,
      budgetCents: mission.budgetCents ?? 0,
      plan: asArray<string>(mission.plan),
      authority: authority
        ? {
            name: typeof authority.name === "string" ? authority.name : "Restored Mission Authority Policy",
            canExecute: Boolean(authority.canExecute),
            needsApproval: Boolean(authority.needsApproval),
            blocked: Boolean(authority.blocked),
            permissions: asArray<string>(authority.permissions),
            budgets: asRecord(authority.budgets),
            approvals: asArray<string>(authority.approvals),
            checks: asArray<string>(authority.checks),
            proof: asRecord(authority.proof),
          }
        : undefined,
      proof: { ...asRecord(mission.proof), restoredFrom: mission.id },
    } satisfies CreateEpochMissionInput);
    missionMap.set(mission.id, created.id);
    restored.missions += 1;

    await updateEpochMission(input.workspaceId, created.id, {
      state: mission.state as any,
      currentStep: mission.currentStep ?? undefined,
      plan: toJsonValue(asArray<string>(mission.plan)),
      result: toJsonValue(asRecord(mission.result)),
      timeline: toJsonValue(asArray<Record<string, unknown>>(mission.timeline)),
      proof: { ...asRecord(mission.proof), restoredFrom: mission.id },
      startedAt: mission.startedAt ? new Date(mission.startedAt) : null,
      completedAt: mission.completedAt ? new Date(mission.completedAt) : null,
      budgetCents: mission.budgetCents ?? 0,
      allowRestore: true,
    });
  }

  for (const mission of snapshot.recent.missions ?? []) {
    const missionId = missionMap.get(mission.id);
    if (!missionId) continue;

    const oldEvidence = asArray<any>(mission.evidence);
    const evidenceMap = new Map<string, string>();
    for (const item of oldEvidence) {
      const existing = await prisma.epochEvidence.findFirst({
        where: {
          workspaceId: input.workspaceId,
          missionId,
          kind: item.kind,
          summary: item.summary ?? "",
        },
      });
      if (existing) {
        evidenceMap.set(item.id, existing.id);
        continue;
      }
      const created = await prisma.epochEvidence.create({
        data: {
          workspaceId: input.workspaceId,
          missionId,
          executionRunId: undefined,
          userId: input.userId,
          kind: item.kind,
          url: item.url ?? null,
          filePath: item.filePath ?? null,
          contentType: item.contentType ?? null,
          summary: item.summary ?? "",
          payload: toJsonValue(asRecord(item.payload)),
          proof: toJsonValue({ ...asRecord(item.proof), restoredFrom: item.id }),
        } as any,
      });
      evidenceMap.set(item.id, created.id);
      restored.evidence += 1;
    }

    const verification = mission.verificationRun ?? null;
    let restoredVerification = await prisma.epochVerificationRun.findFirst({
      where: { workspaceId: input.workspaceId, missionId },
    });
    if (verification) {
      if (!restoredVerification) {
        restoredVerification = await prisma.epochVerificationRun.create({
        data: {
          workspaceId: input.workspaceId,
          missionId,
          executionRunId: undefined,
          userId: input.userId,
          orgId: input.orgId,
          status: verification.status,
          checklist: toJsonValue(verification.checklist ?? []),
          evidenceIds: toJsonValue(asArray<string>(verification.evidenceIds).map((id) => evidenceMap.get(id) ?? id)),
          evidenceValidation: toJsonValue(asRecord(verification.evidenceValidation)),
          policyValidation: toJsonValue(asRecord(verification.policyValidation)),
          confidence: verification.confidence ?? 0,
          finalDecision: verification.finalDecision ?? "REVIEW",
          output: toJsonValue(asRecord(verification.output)),
          proof: toJsonValue({ ...asRecord(verification.proof), restoredFrom: verification.id }),
        },
      });
        restored.verifications += 1;
      }
    }

    const certificate = mission.certificate ?? null;
    let restoredCertificate = await prisma.epochCertificate.findFirst({
      where: { workspaceId: input.workspaceId, missionId },
    });
    if (certificate && !restoredCertificate && restoredVerification) {
      restoredCertificate = await prisma.epochCertificate.create({
        data: {
          workspaceId: input.workspaceId,
          missionId,
          verificationRunId: restoredVerification.id,
          userId: input.userId,
          orgId: input.orgId,
          status: certificate.status,
          summary: certificate.summary,
          evidenceSummary: toJsonValue(asRecord(certificate.evidenceSummary)),
          approvals: toJsonValue(asArray<string>(certificate.approvals)),
          auditTrail: toJsonValue(asArray<Record<string, unknown>>(certificate.auditTrail)),
          proof: toJsonValue({ ...asRecord(certificate.proof), restoredFrom: certificate.id }),
          issuedAt: certificate.issuedAt ? new Date(certificate.issuedAt) : new Date(),
        },
      });
      restored.certificates += 1;
    }

    const memory = mission.memoryRecord ?? null;
    if (memory) {
      const existingMemory = await prisma.epochMemoryRecord.findFirst({
        where: { workspaceId: input.workspaceId, missionId },
      });
      if (!existingMemory) {
        await prisma.epochMemoryRecord.create({
          data: {
            workspaceId: input.workspaceId,
            institutionId: mission.institutionId,
            missionId,
            certificateId: restoredCertificate?.id ?? null,
            userId: input.userId,
            orgId: input.orgId,
            history: toJsonValue(asArray<Record<string, unknown>>(memory.history)),
            lessons: toJsonValue(asArray<string>(memory.lessons)),
            mistakes: toJsonValue(asArray<string>(memory.mistakes)),
            suggestedImprovements: toJsonValue(asArray<string>(memory.suggestedImprovements)),
            proof: toJsonValue({ ...asRecord(memory.proof), restoredFrom: memory.id }),
          },
        });
        restored.memories += 1;
      }
    }
  }

  for (const integration of snapshot.recent.integrations ?? []) {
    const existing = await prisma.epochIntegrationConnection.findFirst({
      where: {
        workspaceId: input.workspaceId,
        name: integration.name,
        provider: integration.provider,
      },
    });
    if (existing) continue;
    await upsertEpochIntegration({
      workspaceId: input.workspaceId,
      institutionId: integration.institutionId ? institutionMap.get(integration.institutionId) ?? undefined : undefined,
      userId: input.userId,
      orgId: input.orgId,
      name: integration.name,
      provider: integration.provider,
      status: integration.status,
      config: asRecord(integration.config),
      proof: { ...asRecord(integration.proof), restoredFrom: integration.id },
    });
    restored.integrations += 1;
  }

  return { snapshot, restored };
}
