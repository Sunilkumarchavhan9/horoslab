import { connectorUserFilter, resolveRequestOrgId } from "../auth/orgScope";
import { projectIdFromRepo, projectMatchesMemory } from "../continuity/projectScope";
import { listMemories } from "../memory/listMemory";
import { planResume } from "../memory/resumePlanner";
import { buildConnectorFreshness } from "./connectorFreshness";
import { listGitHubReposForUser } from "./githubExecution";
import { prisma } from "../storage/prismaClient";

export type RepoIndexStatusValue = "indexed" | "generating" | "not_indexed";

export type RepoIndexStatusEntry = {
  projectId: string;
  fullName: string;
  status: RepoIndexStatusValue;
  indexed: boolean;
  generating: boolean;
  goal: string | null;
  confidence: number | null;
  updatedAt: string | null;
  syncStartedAt: string | null;
};

function getConnectorConfig(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function isGitHubSyncInProgress(userId: string, orgId?: string): Promise<{
  inProgress: boolean;
  syncStartedAt: string | null;
}> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const connector = await prisma.connector.findFirst({
    where: {
      ...connectorUserFilter({ userId, orgId: scopedOrgId }),
      type: "github",
    },
  });
  if (!connector) {
    return { inProgress: false, syncStartedAt: null };
  }
  const config = getConnectorConfig(connector.configJson);
  const syncStartedAt =
    typeof config.syncStartedAt === "string" && config.syncStartedAt.length > 0
      ? config.syncStartedAt
      : null;
  const freshness = buildConnectorFreshness({
    type: "github",
    status: connector.status,
    lastSyncAt:
      typeof connector.lastSyncAt === "string" && connector.lastSyncAt.length > 0
        ? connector.lastSyncAt
        : null,
    recordCount:
      typeof connector.recordCount === "number" && Number.isFinite(connector.recordCount)
        ? connector.recordCount
        : 0,
    lastFailureReason:
      typeof config.lastFailureReason === "string" ? config.lastFailureReason : null,
    lastFailureAt: typeof config.lastFailureAt === "string" ? config.lastFailureAt : null,
  });
  return {
    inProgress: freshness.syncInProgress,
    syncStartedAt,
  };
}

async function hasIndexedMemories(userId: string, orgId: string | undefined, projectId: string): Promise<boolean> {
  const listed = await listMemories({ userId, orgId, limit: 150 });
  return listed.memories.some(
    (memory) =>
      projectMatchesMemory(projectId, memory) &&
      (Boolean(memory.contractCategory) || memory.type === "project"),
  );
}

export async function getRepoIndexStatusEntry(
  userId: string,
  fullName: string,
  orgId?: string,
  syncState?: { inProgress: boolean; syncStartedAt: string | null },
): Promise<RepoIndexStatusEntry> {
  const projectId = projectIdFromRepo(fullName);
  const sync = syncState ?? (await isGitHubSyncInProgress(userId, orgId));

  const [resume, hasMemories] = await Promise.all([
    planResume({
      userId,
      orgId,
      project: projectId,
      question: "Wiki index status",
    }),
    hasIndexedMemories(userId, orgId, projectId),
  ]);

  const indexed = Boolean(
    hasMemories ||
      resume.brief.currentGoal?.trim() ||
      resume.brief.resumeConfidence.score > 0,
  );

  let status: RepoIndexStatusValue = "not_indexed";
  if (indexed) {
    status = "indexed";
  } else if (sync.inProgress) {
    status = "generating";
  }

  return {
    projectId,
    fullName,
    status,
    indexed,
    generating: status === "generating" || (sync.inProgress && !indexed),
    goal: resume.brief.currentGoal?.trim() || null,
    confidence:
      typeof resume.brief.resumeConfidence.score === "number"
        ? resume.brief.resumeConfidence.score / 100
        : null,
    updatedAt: sync.syncStartedAt ?? null,
    syncStartedAt: sync.syncStartedAt,
  };
}

export async function listRepoIndexStatuses(
  userId: string,
  orgId?: string,
  repoFullNames?: string[],
): Promise<RepoIndexStatusEntry[]> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  const syncState = await isGitHubSyncInProgress(userId, scopedOrgId);

  let repos = repoFullNames?.filter((name) => name.includes("/")) ?? [];
  if (repos.length === 0) {
    try {
      const listed = await listGitHubReposForUser(userId, 60, scopedOrgId);
      repos = listed.map((repo) => repo.fullName);
    } catch {
      repos = [];
    }
  }

  const entries = await Promise.all(
    repos.map((fullName) => getRepoIndexStatusEntry(userId, fullName, scopedOrgId, syncState)),
  );
  return entries.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function summarizeIndexedRepos(
  userId: string,
  orgId?: string,
): Promise<{ total: number; indexed: number; generating: number; repos: RepoIndexStatusEntry[] }> {
  const repos = await listRepoIndexStatuses(userId, orgId);
  return {
    total: repos.length,
    indexed: repos.filter((repo) => repo.status === "indexed").length,
    generating: repos.filter((repo) => repo.status === "generating").length,
    repos: repos.filter((repo) => repo.status === "indexed"),
  };
}
