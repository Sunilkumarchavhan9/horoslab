import type { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";
import { approveEpochCopilotDraft, createEpochCopilotDraft, type EpochCopilotDraft } from "./copilotRuntime";
import { validateEpochMarketplaceManifest, verifyEpochMarketplaceManifest, type EpochMarketplaceManifest } from "./marketplaceRuntime";
import { captureEpochProductionInteraction, clusterEpochProductionFailures, createEpochRegressionDraft, type EpochProductionInteraction } from "./productionIntelligence";
import { persistEpochFailureSignals, persistEpochRegressionEvaluation, persistEpochRootCause } from "./productionIntelligenceStore";

function asJson(value: unknown): Prisma.InputJsonValue { return value as Prisma.InputJsonValue; }

export async function persistEpochCopilotDraft(input: Parameters<typeof createEpochCopilotDraft>[0]): Promise<EpochCopilotDraft> {
  const draft = createEpochCopilotDraft(input);
  await prisma.epochCopilotDraft.create({ data: { id: draft.id, workspaceId: draft.workspaceId, missionId: draft.missionId, kind: draft.kind, authorId: draft.authorId, content: asJson(draft.content), risk: draft.risk, status: draft.status, createdAt: new Date(draft.createdAt) } });
  return draft;
}

export async function approvePersistedEpochCopilotDraft(input: { workspaceId: string; id: string; approverId: string; now?: Date }): Promise<EpochCopilotDraft | null> {
  const stored = await prisma.epochCopilotDraft.findFirst({ where: { id: input.id, workspaceId: input.workspaceId, status: "draft" } });
  if (!stored) return null;
  const approved = approveEpochCopilotDraft({ draft: { id: stored.id, workspaceId: stored.workspaceId, missionId: stored.missionId ?? undefined, kind: stored.kind as EpochCopilotDraft["kind"], authorId: stored.authorId, content: stored.content as Record<string, unknown>, risk: stored.risk as EpochCopilotDraft["risk"], status: "draft", createdAt: stored.createdAt.toISOString() }, approverId: input.approverId, workspaceId: input.workspaceId, now: input.now });
  await prisma.epochCopilotDraft.update({ where: { id: stored.id }, data: { status: approved.status, approvedBy: approved.approvedBy, approvedAt: approved.approvedAt ? new Date(approved.approvedAt) : null } });
  return approved;
}

export async function persistEpochMarketplaceManifest(input: { workspaceId: string; manifest: EpochMarketplaceManifest; secret: string }): Promise<EpochMarketplaceManifest> {
  validateEpochMarketplaceManifest(input.manifest);
  if (!verifyEpochMarketplaceManifest(input.manifest, input.secret)) throw new Error("epoch_marketplace_signature_invalid");
  await prisma.epochMarketplaceManifest.create({ data: { id: input.manifest.id, workspaceId: input.workspaceId, version: input.manifest.version, kind: input.manifest.kind, publisherId: input.manifest.publisherId, compatibleApi: input.manifest.compatibleApi, permissions: asJson(input.manifest.permissions), contentHash: input.manifest.contentHash, signature: input.manifest.signature, status: input.manifest.status } });
  return input.manifest;
}

export async function persistEpochProductionInteraction(input: Parameters<typeof captureEpochProductionInteraction>[0]): Promise<EpochProductionInteraction> {
  const interaction = captureEpochProductionInteraction(input);
  await prisma.epochProductionInteraction.create({ data: { id: interaction.id, workspaceId: interaction.workspaceId, missionId: interaction.missionId, executionId: interaction.executionId, workerId: interaction.workerId, input: interaction.input, output: interaction.output, latencyMs: interaction.latencyMs, toolFailures: interaction.toolFailures, retries: interaction.retries, userFeedback: interaction.userFeedback, turns: interaction.turns, abandoned: interaction.abandoned, failureScore: interaction.failureScore, signals: asJson(interaction.signals), fingerprint: interaction.fingerprint, capturedAt: new Date(interaction.capturedAt) } });
  const records = await prisma.epochProductionInteraction.findMany({ where: { workspaceId: interaction.workspaceId, fingerprint: interaction.fingerprint }, orderBy: { capturedAt: "asc" } });
  const cluster = clusterEpochProductionFailures(records.map((record) => ({ ...record, executionId: record.executionId ?? undefined, workerId: record.workerId ?? undefined, userFeedback: record.userFeedback as EpochProductionInteraction["userFeedback"], capturedAt: record.capturedAt.toISOString(), signals: record.signals as EpochProductionInteraction["signals"] })), interaction.workspaceId)[0];
  if (cluster) await prisma.epochFailureCluster.upsert({ where: { workspaceId_fingerprint: { workspaceId: cluster.workspaceId, fingerprint: cluster.fingerprint } }, create: { id: cluster.id, workspaceId: cluster.workspaceId, fingerprint: cluster.fingerprint, interactionIds: asJson(cluster.interactionIds), count: cluster.count, averageFailureScore: cluster.averageFailureScore, status: cluster.status }, update: { interactionIds: asJson(cluster.interactionIds), count: cluster.count, averageFailureScore: cluster.averageFailureScore } });
  const signals = await persistEpochFailureSignals(interaction);
  if (cluster && signals.length) {
    await persistEpochRootCause({ id: `${cluster.id}_root_cause`, workspaceId: cluster.workspaceId, cluster, signals });
    await persistEpochRegressionEvaluation({ id: `${cluster.id}_evaluation`, workspaceId: cluster.workspaceId, clusterId: cluster.id, input: interaction.input, expected: "Production outcome satisfies the mission acceptance criteria", verification: "Replay must pass deterministic verification" });
  }
  return interaction;
}

export async function persistEpochRegressionDraft(input: Parameters<typeof createEpochRegressionDraft>[0]) {
  const draft = createEpochRegressionDraft(input);
  await prisma.epochRegressionDraft.create({ data: { id: draft.id, workspaceId: draft.workspaceId, clusterId: draft.clusterId, input: draft.input, expected: draft.expected, verification: draft.verification, status: draft.status, createdAt: new Date(draft.createdAt) } });
  return draft;
}
