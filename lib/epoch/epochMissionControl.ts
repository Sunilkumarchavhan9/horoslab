import { prisma } from "../storage/prismaClient";
import { listEpochArtifacts } from "./epochArtifacts";
import { getEpochQueueStatus, listEpochDeadLetters } from "./epochQueue";
import { getEpochWebhookDeliveryStats } from "./epochWebhooks";
import {
  listEpochInstitutions,
  listEpochIntegrations,
  listEpochMissions,
  listEpochSmokeRuns,
  listEpochTemplates,
} from "./epochStore";

export type EpochMissionControlSnapshot = {
  workspaceId: string;
  generatedAt: string;
  overview: {
    institutions: number;
    templates: number;
    missions: number;
    evidence: number;
    verifications: number;
    certificates: number;
    memories: number;
    integrations: number;
    artifacts: number;
  };
  queue: {
    status: Awaited<ReturnType<typeof getEpochQueueStatus>>;
    deadLetters: {
      count: number;
      latest: Awaited<ReturnType<typeof listEpochDeadLetters>>[number] | null;
    };
  };
  webhooks: {
    stats: Awaited<ReturnType<typeof getEpochWebhookDeliveryStats>>;
  };
  recent: {
    templates: Awaited<ReturnType<typeof listEpochTemplates>>;
    institutions: Awaited<ReturnType<typeof listEpochInstitutions>>;
    missions: Awaited<ReturnType<typeof listEpochMissions>>;
    smokeRuns: Awaited<ReturnType<typeof listEpochSmokeRuns>>["smokeRuns"];
    integrations: Awaited<ReturnType<typeof listEpochIntegrations>>;
    artifacts: Awaited<ReturnType<typeof listEpochArtifacts>>;
  };
};

type MissionControlRange = "30m" | "1h" | "6h" | "12h" | "24h" | "7d" | "30d";

function parseMissionControlRange(range?: string | null): MissionControlRange | null {
  if (!range) return null;
  const normalized = range.trim().toLowerCase();
  const aliases: Record<string, MissionControlRange> = {
    "last 30 minutes": "30m",
    "30m": "30m",
    "last 1 hour": "1h",
    "1h": "1h",
    "last 6 hours": "6h",
    "6h": "6h",
    "last 12 hours": "12h",
    "12h": "12h",
    "last 24 hours": "24h",
    "24h": "24h",
    "last 7 days": "7d",
    "7d": "7d",
    "last 30 days": "30d",
    "30d": "30d",
  };
  return aliases[normalized] ?? null;
}

function missionControlThreshold(range?: string | null): Date | null {
  const parsed = parseMissionControlRange(range);
  if (!parsed) return null;
  const now = Date.now();
  const minutes =
    parsed === "30m" ? 30 :
    parsed === "1h" ? 60 :
    parsed === "6h" ? 6 * 60 :
    parsed === "12h" ? 12 * 60 :
    parsed === "24h" ? 24 * 60 :
    parsed === "7d" ? 7 * 24 * 60 :
    30 * 24 * 60;
  return new Date(now - minutes * 60 * 1000);
}

function parseMissionControlWindowDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isAfterThreshold(value: unknown, threshold: Date | null): boolean {
  if (!threshold) return true;
  if (value instanceof Date) return value.getTime() >= threshold.getTime();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= threshold.getTime();
  }
  return false;
}

function isRecordWithinThreshold(record: { createdAt?: unknown; updatedAt?: unknown }, threshold: Date | null): boolean {
  if (!threshold) return true;
  return isAfterThreshold(record.updatedAt, threshold) || isAfterThreshold(record.createdAt, threshold);
}

function filterRecordsWithinThreshold<T extends { createdAt?: unknown; updatedAt?: unknown }>(
  records: T[],
  threshold: Date | null,
): T[] {
  if (!threshold) return records;
  return records.filter((record) => isRecordWithinThreshold(record, threshold));
}

function isWithinWindow(value: unknown, start: Date | null, end: Date | null): boolean {
  const parsed = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return false;
  if (start && parsed.getTime() < start.getTime()) return false;
  if (end && parsed.getTime() > end.getTime()) return false;
  return true;
}

function isRecordWithinWindow(record: { createdAt?: unknown; updatedAt?: unknown }, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  return isWithinWindow(record.updatedAt, start, end) || isWithinWindow(record.createdAt, start, end);
}

function filterRecordsWithinWindow<T extends { createdAt?: unknown; updatedAt?: unknown }>(
  records: T[],
  start: Date | null,
  end: Date | null,
): T[] {
  if (!start && !end) return records;
  return records.filter((record) => isRecordWithinWindow(record, start, end));
}

function normalizeSearchText(value?: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function recordSearchBlob(record: Record<string, unknown>, keys: string[]): string {
  const parts: string[] = [];
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      parts.push(value);
    }
  }
  return parts.join(" ").toLowerCase();
}

function filterRecentBySearch<T extends Record<string, unknown>>(records: T[], search?: string | null): T[] {
  const normalizedSearch = normalizeSearchText(search);
  if (!normalizedSearch) return records;

  return records.filter((record) => {
    const blob = recordSearchBlob(record, [
      "name",
      "title",
      "summary",
      "status",
      "currentState",
      "category",
      "objective",
      "currentStep",
      "version",
      "contentType",
      "kind",
      "filePath",
    ]);
    return blob.includes(normalizedSearch);
  });
}

export async function buildEpochMissionControlSnapshot(
  workspaceId: string,
  range?: string | null,
  search?: string | null,
  start?: string | null,
  end?: string | null,
): Promise<EpochMissionControlSnapshot> {
  const threshold = missionControlThreshold(range);
  const parsedStartDate = parseMissionControlWindowDate(start) ?? threshold;
  const parsedEndDate = parseMissionControlWindowDate(end);
  const startDate = parsedStartDate && parsedEndDate && parsedStartDate.getTime() > parsedEndDate.getTime()
    ? parsedEndDate
    : parsedStartDate;
  const endDate = parsedStartDate && parsedEndDate && parsedStartDate.getTime() > parsedEndDate.getTime()
    ? parsedStartDate
    : parsedEndDate;
  const windowWhere = startDate || endDate
    ? {
        createdAt: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        },
      }
    : undefined;

  const [
    institutions,
    templates,
    missions,
    evidence,
    verifications,
    certificates,
    memories,
    integrationCount,
    artifacts,
    queueStatus,
    deadLetters,
    webhookStats,
    recentTemplates,
    recentInstitutions,
    recentMissions,
    smokeRunsPage,
    recentIntegrations,
  ] = await Promise.allSettled([
    prisma.epochInstitution.count({
      where: {
        workspaceId,
        ...(windowWhere ? windowWhere : {}),
      },
    }),
    prisma.epochInstitutionTemplate.count({
      where: {
        workspaceId,
        ...(windowWhere ? windowWhere : {}),
      },
    }),
    prisma.epochMission.count({
      where: {
        workspaceId,
        ...(windowWhere ? windowWhere : {}),
      },
    }),
    prisma.epochEvidence.count({
      where: {
        workspaceId,
        ...(windowWhere ? windowWhere : {}),
      },
    }),
    prisma.epochVerificationRun.count({
      where: {
        workspaceId,
        ...(windowWhere ? windowWhere : {}),
      },
    }),
    prisma.epochCertificate.count({
      where: {
        workspaceId,
        ...(windowWhere ? windowWhere : {}),
      },
    }),
    prisma.epochMemoryRecord.count({
      where: {
        workspaceId,
        ...(windowWhere ? windowWhere : {}),
      },
    }),
    prisma.epochIntegrationConnection.count({
      where: {
        workspaceId,
        ...(windowWhere ? windowWhere : {}),
      },
    }),
    listEpochArtifacts({ workspaceId }),
    getEpochQueueStatus(workspaceId),
    listEpochDeadLetters(workspaceId),
    getEpochWebhookDeliveryStats(workspaceId),
    listEpochTemplates({ workspaceId }),
    listEpochInstitutions({ workspaceId }),
    listEpochMissions({ workspaceId }),
    listEpochSmokeRuns({ workspaceId, limit: 10 }),
    listEpochIntegrations({ workspaceId }),
  ]);

  const countOrZero = (result: PromiseSettledResult<number>): number =>
    result.status === "fulfilled" && Number.isFinite(result.value) ? result.value : 0;
  const valueOrDefault = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === "fulfilled" ? result.value : fallback;

  const safeInstitutions = countOrZero(institutions);
  const safeTemplates = countOrZero(templates);
  const safeMissions = countOrZero(missions);
  const safeEvidence = countOrZero(evidence);
  const safeVerifications = countOrZero(verifications);
  const safeCertificates = countOrZero(certificates);
  const safeMemories = countOrZero(memories);
  const safeIntegrationCount = countOrZero(integrationCount);
  const safeArtifacts = valueOrDefault(artifacts, []);
  const safeQueueStatus = valueOrDefault(queueStatus, {
    queued: 0,
    leased: 0,
    done: 0,
    failed: 0,
    deadLettered: 0,
    byType: {
      plan: 0,
      execute: 0,
      review: 0,
      verify: 0,
      certificate: 0,
      memory: 0,
      benchmark: 0,
      quality: 0,
      pipeline: 0,
      model_sync: 0,
      model_benchmark: 0,
      model_quality: 0,
      runtime_benchmark: 0,
      runtime_quality: 0,
    },
    byStatus: {
      queued: 0,
      leased: 0,
      done: 0,
      failed: 0,
      dead_lettered: 0,
    },
    deadLetterReasons: [],
  });
  const safeDeadLetters = valueOrDefault(deadLetters, []);
  const safeWebhookStats = valueOrDefault(webhookStats, {
    pending: 0,
    retrying: 0,
    delivered: 0,
    deadLettered: 0,
    total: 0,
  });
  const safeRecentTemplates = valueOrDefault(recentTemplates, []);
  const safeRecentInstitutions = valueOrDefault(recentInstitutions, []);
  const safeRecentMissions = valueOrDefault(recentMissions, []);
  const safeSmokeRunsPage = valueOrDefault(smokeRunsPage, {
    smokeRuns: [],
    nextCursor: null,
    hasMore: false,
    total: 0,
  });
  const safeRecentIntegrations = valueOrDefault(recentIntegrations, []);

  const filteredInstitutions = filterRecordsWithinWindow(safeRecentInstitutions, startDate, endDate);
  const filteredTemplates = filterRecordsWithinWindow(safeRecentTemplates, startDate, endDate);
  const filteredMissions = filterRecordsWithinWindow(safeRecentMissions, startDate, endDate);
  const filteredIntegrations = filterRecordsWithinWindow(safeRecentIntegrations, startDate, endDate);
  const filteredArtifacts = filterRecordsWithinWindow(safeArtifacts, startDate, endDate);
  const filteredSmokeRuns = filterRecordsWithinWindow(safeSmokeRunsPage.smokeRuns, startDate, endDate);

  const searchedInstitutions = filterRecentBySearch(filteredInstitutions, search);
  const searchedTemplates = filterRecentBySearch(filteredTemplates, search);
  const searchedMissions = filterRecentBySearch(filteredMissions, search);
  const searchedIntegrations = filterRecentBySearch(filteredIntegrations, search);
  const searchedArtifacts = filterRecentBySearch(filteredArtifacts, search);
  const searchedSmokeRuns = filterRecentBySearch(filteredSmokeRuns, search);

  return {
    workspaceId,
    generatedAt: new Date().toISOString(),
    overview: {
      institutions: safeInstitutions,
      templates: safeTemplates,
      missions: safeMissions,
      evidence: safeEvidence,
      verifications: safeVerifications,
      certificates: safeCertificates,
      memories: safeMemories,
      integrations: safeIntegrationCount,
      artifacts: safeArtifacts.length,
    },
    queue: {
      status: safeQueueStatus,
      deadLetters: {
        count: safeDeadLetters.length,
        latest: safeDeadLetters[0] ?? null,
      },
    },
    webhooks: {
      stats: safeWebhookStats,
    },
    recent: {
      templates: searchedTemplates,
      institutions: searchedInstitutions,
      missions: searchedMissions,
      smokeRuns: searchedSmokeRuns,
      integrations: searchedIntegrations,
      artifacts: searchedArtifacts,
    },
  };
}
