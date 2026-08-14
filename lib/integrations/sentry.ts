import { randomUUID } from "crypto";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";

export interface SentrySyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
  config?: {
    orgSlug?: string;
    projectSlugs?: string[];
    baseUrl?: string;
  };
}

type SentryIssue = {
  id: string;
  shortId?: string;
  title?: string;
  culprit?: string;
  permalink?: string;
  level?: string;
  status?: string;
  count?: string | number;
  userCount?: number;
  firstSeen?: string;
  lastSeen?: string;
  project?: {
    id?: string;
    slug?: string;
    name?: string;
  };
  metadata?: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
};

export type SentrySyncDiagnostics = {
  issuesSeen: number;
  issuesSynced: number;
  projectsFiltered: number;
};

const SENTRY_API_BASE_URL = "https://sentry.io/api/0";
const SENTRY_ISSUE_LIMIT = Math.max(1, Math.min(100, Number(process.env.SENTRY_SYNC_ISSUE_LIMIT ?? 25)));
const SENTRY_REQUEST_TIMEOUT_MS = Math.max(3_000, Number(process.env.SENTRY_REQUEST_TIMEOUT_MS ?? 15_000));

function normalizeApiBaseUrl(baseUrl: string | undefined): string {
  const raw = (baseUrl || process.env.SENTRY_API_BASE_URL || SENTRY_API_BASE_URL).replace(/\/$/, "");
  return raw.endsWith("/api/0") ? raw : `${raw}/api/0`;
}

function parseProjectSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean);
}

function incrementContractCount(counts: Record<string, number>, category?: string): void {
  if (!category) return;
  counts[category] = (counts[category] ?? 0) + 1;
}

export function buildSentryIssueSourceRef(input: { issueId: string; shortId?: string }): string {
  return `sentry://issue/${encodeURIComponent(input.shortId || input.issueId)}`;
}

function buildIssueContent(issue: SentryIssue): string {
  const project = issue.project?.slug || issue.project?.name || "unknown project";
  const count = typeof issue.count === "number" ? issue.count : Number(issue.count ?? 0);
  return [
    `Sentry deployment/runtime error in ${project}: ${issue.title || issue.shortId || issue.id}.`,
    issue.culprit ? `Culprit: ${issue.culprit}.` : "",
    issue.level ? `Level: ${issue.level}.` : "",
    issue.status ? `Status: ${issue.status}.` : "",
    Number.isFinite(count) && count > 0 ? `Occurrences: ${count}.` : "",
    typeof issue.userCount === "number" ? `Users affected: ${issue.userCount}.` : "",
    issue.metadata?.type || issue.metadata?.value
      ? `Error detail: ${[issue.metadata.type, issue.metadata.value].filter(Boolean).join(" ")}.`
      : "",
    issue.metadata?.filename ? `File: ${issue.metadata.filename}.` : "",
    issue.metadata?.function ? `Function: ${issue.metadata.function}.` : "",
    issue.lastSeen ? `Last seen: ${issue.lastSeen}.` : "",
    "Future agents should inspect deployment errors before changing nearby files, run regression tests, and preserve trace proof.",
  ].filter(Boolean).join(" ");
}

async function sentryGet<T>(input: {
  accessToken: string;
  baseUrl: string;
  path: string;
  params?: Record<string, string>;
}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SENTRY_REQUEST_TIMEOUT_MS);
  try {
    const url = new URL(`${input.baseUrl}${input.path}`);
    for (const [key, value] of Object.entries(input.params ?? {})) {
      if (value) url.searchParams.set(key, value);
    }
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const payload = (await response.json().catch(() => ({}))) as T & {
      detail?: string;
    };
    if (!response.ok) {
      const detail =
        typeof (payload as { detail?: unknown }).detail === "string"
          ? (payload as { detail: string }).detail
          : `HTTP ${response.status}`;
      throw new Error(`Sentry issue query failed: ${detail}`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export const SentryClient = {
  async sync(options: SentrySyncOptions) {
    const orgSlug = options.config?.orgSlug || process.env.SENTRY_ORG_SLUG;
    if (!orgSlug) {
      throw new Error("Sentry org slug missing. Set SENTRY_ORG_SLUG or reconnect Deployment errors with orgSlug.");
    }
    const baseUrl = normalizeApiBaseUrl(options.config?.baseUrl);
    const projectSlugs = parseProjectSlugs(
      options.config?.projectSlugs?.length
        ? options.config.projectSlugs
        : (process.env.SENTRY_PROJECT_SLUGS || "").split(","),
    );
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const contractCounts: Record<string, number> = {};
    const diagnostics: SentrySyncDiagnostics = {
      issuesSeen: 0,
      issuesSynced: 0,
      projectsFiltered: projectSlugs.length,
    };
    const sinceMs = options.since ? new Date(options.since).getTime() : 0;
    let newestCheckpointMs = sinceMs;
    let extractedCount = 0;

    const issues = await sentryGet<SentryIssue[]>({
      accessToken: options.accessToken,
      baseUrl,
      path: `/organizations/${encodeURIComponent(orgSlug)}/issues/`,
      params: {
        query: "is:unresolved",
        limit: String(SENTRY_ISSUE_LIMIT),
        sort: "date",
      },
    });

    for (const issue of issues) {
      diagnostics.issuesSeen += 1;
      const projectSlug = (issue.project?.slug || "").toLowerCase();
      if (projectSlugs.length > 0 && !projectSlugs.includes(projectSlug)) continue;
      const lastSeenMs = issue.lastSeen ? new Date(issue.lastSeen).getTime() : 0;
      if (lastSeenMs > newestCheckpointMs) newestCheckpointMs = lastSeenMs;
      if (sinceMs > 0 && lastSeenMs > 0 && lastSeenMs <= sinceMs) continue;
      const dedupeKey = `sentry:issue:${issue.id}:${issue.lastSeen || issue.count || "unknown"}`;
      if (seen.has(dedupeKey)) continue;

      const now = new Date().toISOString();
      const sourceRef = buildSentryIssueSourceRef({ issueId: issue.id, shortId: issue.shortId });
      const traceProof = {
        sourceType: "sentry",
        sourceRef,
        evidence: [
          issue.shortId || issue.id,
          issue.title || "Sentry issue",
          ...(issue.permalink ? [issue.permalink] : []),
        ],
        confidence: 0.9,
        capturedAt: now,
      };
      const candidates = extractMemory({
        userId: options.userId,
        message: buildIssueContent(issue),
      });
      for (const candidate of candidates) {
        await upsertRecentMemory({
          ...candidate,
          id: randomUUID(),
          source: "import",
          status: "active",
          createdAt: now,
          updatedAt: now,
          importanceScore: 0.84,
          confidence: 0.9,
          evidenceCount: traceProof.evidence.length,
          developerSignals: {
            ...candidate.developerSignals,
            projectArea: Array.from(new Set([
              ...(candidate.developerSignals?.projectArea ?? []),
              issue.project?.slug || issue.project?.name || "sentry",
              ...(issue.metadata?.filename ? [issue.metadata.filename] : []),
            ].filter(Boolean))),
            bugType: Array.from(new Set([
              ...(candidate.developerSignals?.bugType ?? []),
              "runtime error",
              "deployment regression",
              ...(issue.level ? [issue.level] : []),
            ])),
          },
          sourceRef,
          traceProof,
        });
        extractedCount += 1;
        incrementContractCount(contractCounts, candidate.contractCategory);
      }
      dedupeKeys.push(dedupeKey);
      diagnostics.issuesSynced += 1;
    }

    if (diagnostics.issuesSeen === 0) {
      throw new Error("Sentry sync found no unresolved issues. Verify token permissions, org slug, and project access.");
    }

    return {
      success: true,
      extractedCount,
      dedupeKeys,
      contractCounts,
      diagnostics,
      checkpoint: newestCheckpointMs > 0 ? new Date(newestCheckpointMs).toISOString() : new Date().toISOString(),
    };
  },
};
