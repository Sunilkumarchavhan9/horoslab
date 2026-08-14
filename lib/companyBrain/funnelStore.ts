import {
  companyBrainPlatformOrgId,
  resolveRequestOrgId,
} from "../auth/orgScope";
import { MEMORY_CONTRACT_CATEGORIES } from "../memory/types";
import { prisma } from "../storage/prismaClient";

/** Structured memories required before auto-completing sync_github (not raw connector rows). */
export const FUNNEL_SYNC_MIN_CONTRACT_MEMORIES = 1;
/** Distinct contract categories required to prove taxonomy value. */
export const FUNNEL_SYNC_MIN_DISTINCT_CATEGORIES = 1;

export type CompanyBrainFunnelProgress = {
  userId: string;
  connectGithub: boolean;
  syncGithub: boolean;
  briefLoaded: boolean;
  labOpened: boolean;
  proposalCreated: boolean;
  proposalApproved: boolean;
  executed: boolean;
  resumed: boolean;
  lastProject: string | null;
  dismissed: boolean;
  /** Cumulative contract-category counts across connector syncs for this org scope. */
  contractCountsByCategory: Record<string, number>;
  lastSyncSource: string | null;
  lastSyncAt: string | null;
  updatedAt: string;
};

export type CompanyBrainContinuityLoopProgress = {
  briefGenerated: boolean;
  labOpened: boolean;
  proposalCreated: boolean;
  approved: boolean;
  executed: boolean;
  resumed: boolean;
  lastProject: string | null;
};

export type CompanyBrainFunnelIngestionSummary = {
  contractCountsByCategory: Record<string, number>;
  lastSyncSource: string | null;
  lastSyncAt: string | null;
  totalContractMemories: number;
  distinctCategories: number;
  thresholds: {
    minContractMemories: number;
    minDistinctCategories: number;
  };
  syncGithubThresholdMet: boolean;
};

export type CompanyBrainFunnelApiPayload = {
  progress: CompanyBrainFunnelProgress;
  ingestion: CompanyBrainFunnelIngestionSummary;
  steps: {
    connectGithub: boolean;
    syncGithub: boolean;
    briefLoaded: boolean;
    labOpened: boolean;
  };
  continuityLoop: CompanyBrainContinuityLoopProgress;
};

const VALID_CONTRACT_CATEGORIES = new Set<string>(MEMORY_CONTRACT_CATEGORIES);

function nowIso(): string {
  return new Date().toISOString();
}

export function sanitizeContractCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
    (counts, [key, count]) => {
      if (!VALID_CONTRACT_CATEGORIES.has(key)) return counts;
      if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) return counts;
      counts[key] = Math.floor(count);
      return counts;
    },
    {},
  );
}

export function mergeContractCountDeltas(
  existing: Record<string, number>,
  delta: Record<string, number>,
): Record<string, number> {
  const merged = { ...sanitizeContractCounts(existing) };
  for (const [key, count] of Object.entries(sanitizeContractCounts(delta))) {
    merged[key] = (merged[key] ?? 0) + count;
  }
  return merged;
}

export function summarizeFunnelIngestion(
  progress: Pick<CompanyBrainFunnelProgress, "contractCountsByCategory">,
): Pick<
  CompanyBrainFunnelIngestionSummary,
  "totalContractMemories" | "distinctCategories"
> {
  const counts = sanitizeContractCounts(progress.contractCountsByCategory);
  const entries = Object.values(counts);
  return {
    totalContractMemories: entries.reduce((sum, value) => sum + value, 0),
    distinctCategories: entries.filter((value) => value > 0).length,
  };
}

export function meetsSyncGithubThreshold(
  progress: Pick<CompanyBrainFunnelProgress, "contractCountsByCategory">,
): boolean {
  const { totalContractMemories, distinctCategories } = summarizeFunnelIngestion(progress);
  return (
    totalContractMemories >= FUNNEL_SYNC_MIN_CONTRACT_MEMORIES &&
    distinctCategories >= FUNNEL_SYNC_MIN_DISTINCT_CATEGORIES
  );
}

export function buildContinuityLoopProgress(
  progress: CompanyBrainFunnelProgress,
): CompanyBrainContinuityLoopProgress {
  return {
    briefGenerated: progress.briefLoaded,
    labOpened: progress.labOpened,
    proposalCreated: progress.proposalCreated,
    approved: progress.proposalApproved,
    executed: progress.executed,
    resumed: progress.resumed,
    lastProject: progress.lastProject,
  };
}

export function buildCompanyBrainFunnelApiPayload(
  progress: CompanyBrainFunnelProgress,
): CompanyBrainFunnelApiPayload {
  const counts = sanitizeContractCounts(progress.contractCountsByCategory);
  const normalized: CompanyBrainFunnelProgress = {
    ...progress,
    contractCountsByCategory: counts,
  };
  const summary = summarizeFunnelIngestion(normalized);
  return {
    progress: normalized,
    ingestion: {
      contractCountsByCategory: counts,
      lastSyncSource: progress.lastSyncSource,
      lastSyncAt: progress.lastSyncAt,
      ...summary,
      thresholds: {
        minContractMemories: FUNNEL_SYNC_MIN_CONTRACT_MEMORIES,
        minDistinctCategories: FUNNEL_SYNC_MIN_DISTINCT_CATEGORIES,
      },
      syncGithubThresholdMet: meetsSyncGithubThreshold(normalized),
    },
    steps: {
      connectGithub: normalized.connectGithub,
      syncGithub: normalized.syncGithub,
      briefLoaded: normalized.briefLoaded,
      labOpened: normalized.labOpened,
    },
    continuityLoop: buildContinuityLoopProgress(normalized),
  };
}

export function defaultCompanyBrainFunnelProgress(userId: string): CompanyBrainFunnelProgress {
  return {
    userId,
    connectGithub: false,
    syncGithub: false,
    briefLoaded: false,
    labOpened: false,
    proposalCreated: false,
    proposalApproved: false,
    executed: false,
    resumed: false,
    lastProject: null,
    dismissed: false,
    contractCountsByCategory: {},
    lastSyncSource: null,
    lastSyncAt: null,
    updatedAt: nowIso(),
  };
}

export type ContinuityFunnelStepPatch =
  | "briefGenerated"
  | "labOpened"
  | "proposalCreated"
  | "approved"
  | "executed"
  | "resumed";

export async function patchContinuityFunnelStep(
  userId: string,
  step: ContinuityFunnelStepPatch,
  options?: { orgId?: string; lastProject?: string },
): Promise<CompanyBrainFunnelProgress> {
  const patch: Partial<Omit<CompanyBrainFunnelProgress, "userId" | "updatedAt">> = {};
  if (step === "briefGenerated") patch.briefLoaded = true;
  if (step === "labOpened") patch.labOpened = true;
  if (step === "proposalCreated") patch.proposalCreated = true;
  if (step === "approved") patch.proposalApproved = true;
  if (step === "executed") patch.executed = true;
  if (step === "resumed") patch.resumed = true;
  if (typeof options?.lastProject === "string" && options.lastProject.trim()) {
    patch.lastProject = options.lastProject.trim();
  }
  return patchCompanyBrainFunnelProgress(userId, patch, options?.orgId);
}

function parseProgress(dataJson: string, userId: string): CompanyBrainFunnelProgress | null {
  try {
    const parsed = JSON.parse(dataJson) as Partial<CompanyBrainFunnelProgress>;
    if (!parsed || typeof parsed !== "object") return null;
    const base = defaultCompanyBrainFunnelProgress(userId);
    return normalizeProgress({ ...base, ...parsed }, userId);
  } catch {
    return null;
  }
}

function normalizeProgress(
  raw: Partial<CompanyBrainFunnelProgress> | undefined,
  userId: string,
): CompanyBrainFunnelProgress {
  if (!raw || typeof raw !== "object") {
    return defaultCompanyBrainFunnelProgress(userId);
  }
  return {
    userId,
    connectGithub: Boolean(raw.connectGithub),
    syncGithub: Boolean(raw.syncGithub),
    briefLoaded: Boolean(raw.briefLoaded),
    labOpened: Boolean(raw.labOpened),
    proposalCreated: Boolean(raw.proposalCreated),
    proposalApproved: Boolean(raw.proposalApproved),
    executed: Boolean(raw.executed),
    resumed: Boolean(raw.resumed),
    lastProject:
      typeof raw.lastProject === "string" && raw.lastProject.length > 0 ? raw.lastProject : null,
    dismissed: Boolean(raw.dismissed),
    contractCountsByCategory: sanitizeContractCounts(raw.contractCountsByCategory),
    lastSyncSource:
      typeof raw.lastSyncSource === "string" && raw.lastSyncSource.length > 0
        ? raw.lastSyncSource
        : null,
    lastSyncAt:
      typeof raw.lastSyncAt === "string" && raw.lastSyncAt.length > 0 ? raw.lastSyncAt : null,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso(),
  };
}

async function readProgressFromPostgres(
  userId: string,
  scopedOrgId: string,
): Promise<CompanyBrainFunnelProgress | null> {
  const row = await prisma.companyBrainFunnel.findUnique({
    where: { userId_orgId: { userId, orgId: scopedOrgId } },
    select: { dataJson: true },
  });
  if (!row) return null;
  return parseProgress(row.dataJson, userId);
}

async function writeProgressToPostgres(
  userId: string,
  scopedOrgId: string,
  progress: CompanyBrainFunnelProgress,
): Promise<void> {
  await prisma.companyBrainFunnel.upsert({
    where: { userId_orgId: { userId, orgId: scopedOrgId } },
    create: {
      userId,
      orgId: scopedOrgId,
      updatedAt: progress.updatedAt,
      dataJson: JSON.stringify(progress),
    },
    update: {
      updatedAt: progress.updatedAt,
      dataJson: JSON.stringify(progress),
    },
  });
}

export async function getCompanyBrainFunnelProgress(
  userId: string,
  orgId?: string,
): Promise<CompanyBrainFunnelProgress> {
  const scopedOrg = resolveRequestOrgId(orgId);
  const scopedOrgId = companyBrainPlatformOrgId(scopedOrg);

  const row = await readProgressFromPostgres(userId, scopedOrgId);
  return row ?? defaultCompanyBrainFunnelProgress(userId);
}

function sanitizeFunnelPatch(
  current: CompanyBrainFunnelProgress,
  patch: Partial<Omit<CompanyBrainFunnelProgress, "userId" | "updatedAt">>,
): Partial<Omit<CompanyBrainFunnelProgress, "userId" | "updatedAt">> {
  const next: Partial<Omit<CompanyBrainFunnelProgress, "userId" | "updatedAt">> = { ...patch };

  if (next.contractCountsByCategory !== undefined) {
    next.contractCountsByCategory = sanitizeContractCounts(next.contractCountsByCategory);
  }

  if (next.syncGithub === true) {
    const preview: CompanyBrainFunnelProgress = {
      ...current,
      ...next,
      userId: current.userId,
      updatedAt: current.updatedAt,
      contractCountsByCategory: mergeContractCountDeltas(
        current.contractCountsByCategory,
        next.contractCountsByCategory ?? {},
      ),
    };
    if (!meetsSyncGithubThreshold(preview)) {
      delete next.syncGithub;
    }
  }

  return next;
}

export async function patchCompanyBrainFunnelProgress(
  userId: string,
  patch: Partial<Omit<CompanyBrainFunnelProgress, "userId" | "updatedAt">>,
  orgId?: string,
): Promise<CompanyBrainFunnelProgress> {
  const scopedOrg = resolveRequestOrgId(orgId);
  const scopedOrgId = companyBrainPlatformOrgId(scopedOrg);

  const current = await getCompanyBrainFunnelProgress(userId, scopedOrg);
  const sanitized = sanitizeFunnelPatch(current, patch);
  const next: CompanyBrainFunnelProgress = normalizeProgress(
    {
      ...current,
      ...sanitized,
      userId,
      updatedAt: nowIso(),
    },
    userId,
  );

  await writeProgressToPostgres(userId, scopedOrgId, next);
  return next;
}

export async function recordConnectorIngestionToFunnel(
  userId: string,
  input: {
    source: string;
    contractCountsDelta: Record<string, number>;
    orgId?: string;
  },
): Promise<CompanyBrainFunnelProgress> {
  const current = await getCompanyBrainFunnelProgress(userId, input.orgId);
  const mergedCounts = mergeContractCountDeltas(
    current.contractCountsByCategory,
    input.contractCountsDelta,
  );
  const at = nowIso();
  const stepPatch: Partial<Omit<CompanyBrainFunnelProgress, "userId" | "updatedAt">> = {
    contractCountsByCategory: mergedCounts,
    lastSyncSource: input.source,
    lastSyncAt: at,
  };

  if (input.source === "github") {
    stepPatch.connectGithub = true;
  }

  const preview = normalizeProgress({ ...current, ...stepPatch }, userId);
  if (meetsSyncGithubThreshold(preview)) {
    stepPatch.syncGithub = true;
  }

  return patchCompanyBrainFunnelProgress(userId, stepPatch, input.orgId);
}

export function getCompanyBrainFunnelStoreBackend(): "postgres" {
  return "postgres";
}
