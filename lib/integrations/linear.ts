import { randomUUID } from "crypto";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import {
  linearSourceRef,
  mapLinearToMemoryTexts,
  type LinearMemoryMapInput,
} from "./linearMemoryMapper";

export type LinearAuthMode = "oauth" | "api_key";

export interface LinearSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
  config?: {
    authMode?: LinearAuthMode;
    teamKeys?: string[];
  };
}

export type LinearSyncDiagnostics = {
  issuesListed: number;
  issuesSynced: number;
  commentsSeen: number;
  commentsSkipped: number;
};

type LinearIssue = {
  id: string;
  identifier?: string;
  title?: string;
  description?: string | null;
  priorityLabel?: string | null;
  url?: string | null;
  createdAt?: string;
  updatedAt?: string;
  state?: { name?: string | null; type?: string | null } | null;
  team?: { name?: string | null; key?: string | null } | null;
  assignee?: { name?: string | null; email?: string | null } | null;
  labels?: { nodes?: Array<{ name?: string | null }> };
  comments?: {
    nodes?: Array<{
      id?: string;
      body?: string | null;
      createdAt?: string;
      updatedAt?: string;
      user?: { name?: string | null; email?: string | null } | null;
    }>;
  };
};

type LinearIssueComment = NonNullable<NonNullable<LinearIssue["comments"]>["nodes"]>[number];

type LinearGraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";
const LINEAR_ISSUE_LIMIT = Math.max(1, Math.min(100, Number(process.env.LINEAR_SYNC_ISSUE_LIMIT ?? 50)));
const LINEAR_COMMENT_LIMIT = Math.max(0, Math.min(50, Number(process.env.LINEAR_SYNC_COMMENT_LIMIT ?? 10)));
const LINEAR_REQUEST_TIMEOUT_MS = Math.max(3_000, Number(process.env.LINEAR_REQUEST_TIMEOUT_MS ?? 15_000));

const LINEAR_ISSUES_QUERY = `
  query MemoryOSLinearIssues($first: Int!, $commentsFirst: Int!) {
    issues(first: $first) {
      nodes {
        id
        identifier
        title
        description
        priorityLabel
        url
        createdAt
        updatedAt
        state { name type }
        team { name key }
        assignee { name email }
        labels { nodes { name } }
        comments(first: $commentsFirst) {
          nodes {
            id
            body
            createdAt
            updatedAt
            user { name email }
          }
        }
      }
    }
  }
`;

function incrementContractCount(counts: Record<string, number>, category?: string): void {
  if (!category) return;
  counts[category] = (counts[category] ?? 0) + 1;
}

function authHeader(accessToken: string, authMode: LinearAuthMode | undefined): string {
  return authMode === "oauth" ? `Bearer ${accessToken}` : accessToken;
}

function parseTeamKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
    .filter((item) => item.length > 0);
}

function formatLinearApiError(context: string, status: number, errors?: Array<{ message?: string }>): string {
  const detail = errors?.map((error) => error.message).filter(Boolean).join("; ");
  if (status === 401 || status === 403) {
    return `Linear ${context} failed (${status}): token cannot read issues. Reconnect Linear or verify API key scopes.`;
  }
  return detail ? `Linear ${context} failed (${status}): ${detail}` : `Linear ${context} failed (${status})`;
}

async function linearGraphQl<T>(
  accessToken: string,
  authMode: LinearAuthMode | undefined,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINEAR_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(LINEAR_GRAPHQL_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: authHeader(accessToken, authMode),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
    const payload = (await response.json().catch(() => ({}))) as LinearGraphQlResponse<T>;
    if (!response.ok || payload.errors?.length) {
      throw new Error(formatLinearApiError("issue query", response.status, payload.errors));
    }
    if (!payload.data) {
      throw new Error("Linear issue query returned no data.");
    }
    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}

function toMapInput(issue: LinearIssue, comment?: LinearIssueComment): LinearMemoryMapInput {
  return {
    issueId: issue.id,
    identifier: issue.identifier || issue.id,
    title: issue.title || issue.identifier || issue.id,
    description: issue.description ?? undefined,
    state: issue.state?.name ?? undefined,
    stateType: issue.state?.type ?? undefined,
    priorityLabel: issue.priorityLabel ?? undefined,
    assignee: issue.assignee?.name ?? undefined,
    team: issue.team?.key || issue.team?.name || undefined,
    labels: issue.labels?.nodes?.map((label) => label.name ?? "").filter(Boolean) ?? [],
    updatedAt: issue.updatedAt,
    url: issue.url ?? undefined,
    commentBody: comment?.body ?? undefined,
    commentAuthor: comment?.user?.name ?? undefined,
  };
}

async function commitMappedTexts(
  userId: string,
  input: LinearMemoryMapInput,
  mappedTexts: string[],
  contractCounts: Record<string, number>,
): Promise<number> {
  let extractedCount = 0;
  const now = new Date().toISOString();
  const sourceRef = linearSourceRef(input);
  const traceProof = {
    sourceType: "linear",
    sourceRef,
    evidence: [
      input.identifier,
      input.title,
      ...(input.url ? [input.url] : []),
    ],
    confidence: 0.86,
    capturedAt: now,
  };

  for (const text of mappedTexts) {
    const candidates = extractMemory({ userId, message: text });
    for (const candidate of candidates) {
      await upsertRecentMemory({
        ...candidate,
        id: randomUUID(),
        source: "chat",
        status: "active",
        createdAt: now,
        updatedAt: now,
        importanceScore: 0.8,
        confidence: 0.88,
        evidenceCount: 1,
        developerSignals: candidate.developerSignals,
        sourceRef,
        traceProof,
      });
      extractedCount += 1;
      incrementContractCount(contractCounts, candidate.contractCategory);
    }
  }

  return extractedCount;
}

export const LinearClient = {
  async sync(options: LinearSyncOptions) {
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const contractCounts: Record<string, number> = {};
    const diagnostics: LinearSyncDiagnostics = {
      issuesListed: 0,
      issuesSynced: 0,
      commentsSeen: 0,
      commentsSkipped: 0,
    };
    let extractedCount = 0;
    let newestCheckpointMs = options.since ? new Date(options.since).getTime() : 0;
    const sinceMs = options.since ? new Date(options.since).getTime() : 0;
    const teamKeys = parseTeamKeys(options.config?.teamKeys);

    const data = await linearGraphQl<{ issues?: { nodes?: LinearIssue[] } }>(
      options.accessToken,
      options.config?.authMode,
      LINEAR_ISSUES_QUERY,
      { first: LINEAR_ISSUE_LIMIT, commentsFirst: LINEAR_COMMENT_LIMIT },
    );

    const issues = (data.issues?.nodes ?? [])
      .filter((issue) => !teamKeys.length || teamKeys.includes((issue.team?.key ?? "").toUpperCase()))
      .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());

    diagnostics.issuesListed = issues.length;
    if (issues.length === 0) {
      // OAuth can be valid for an empty workspace (or a team with no issues).
      // Keep the connector healthy and let the next sync import future issues.
      return {
        success: true,
        extractedCount: 0,
        sourceItemCount: 0,
        dedupeKeys,
        contractCounts,
        diagnostics,
        checkpoint: new Date().toISOString(),
      };
    }

    for (const issue of issues) {
      const issueUpdatedMs = issue.updatedAt ? new Date(issue.updatedAt).getTime() : 0;
      if (issueUpdatedMs > newestCheckpointMs) newestCheckpointMs = issueUpdatedMs;
      if (sinceMs > 0 && issueUpdatedMs > 0 && issueUpdatedMs <= sinceMs) {
        continue;
      }

      const issueDedupeKey = `linear:issue:${issue.id}`;
      if (!seen.has(issueDedupeKey)) {
        const input = toMapInput(issue);
        const mappedTexts = mapLinearToMemoryTexts(input);
        extractedCount += await commitMappedTexts(options.userId, input, mappedTexts, contractCounts);
        dedupeKeys.push(issueDedupeKey);
        diagnostics.issuesSynced += 1;
      }

      for (const comment of issue.comments?.nodes ?? []) {
        diagnostics.commentsSeen += 1;
        const commentId = comment.id ?? "";
        const body = comment.body ?? "";
        if (!commentId || !body.trim()) {
          diagnostics.commentsSkipped += 1;
          continue;
        }
        const commentDedupeKey = `linear:comment:${issue.id}:${commentId}`;
        if (seen.has(commentDedupeKey)) {
          diagnostics.commentsSkipped += 1;
          continue;
        }
        const commentUpdatedMs = comment.updatedAt
          ? new Date(comment.updatedAt).getTime()
          : comment.createdAt
            ? new Date(comment.createdAt).getTime()
            : 0;
        if (sinceMs > 0 && commentUpdatedMs > 0 && commentUpdatedMs <= sinceMs) {
          diagnostics.commentsSkipped += 1;
          continue;
        }
        if (commentUpdatedMs > newestCheckpointMs) newestCheckpointMs = commentUpdatedMs;

        const input = toMapInput(issue, comment);
        const mappedTexts = mapLinearToMemoryTexts(input);
        extractedCount += await commitMappedTexts(options.userId, input, mappedTexts, contractCounts);
        dedupeKeys.push(commentDedupeKey);
      }
    }

    if (diagnostics.issuesSynced === 0 && dedupeKeys.length === 0) {
      throw new Error(
        "Linear sync found no new issues or comments since the last checkpoint. Run sync after Linear activity or clear recent keys.",
      );
    }

    return {
      success: true,
      extractedCount,
      sourceItemCount: diagnostics.issuesListed + diagnostics.commentsSeen,
      dedupeKeys,
      contractCounts,
      diagnostics,
      checkpoint:
        newestCheckpointMs > 0
          ? new Date(newestCheckpointMs).toISOString()
          : new Date().toISOString(),
    };
  },

  getAuthorizeUrl(state: string): string {
    const clientId = process.env.LINEAR_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !redirectUri) {
      throw new Error("Linear OAuth env missing (LINEAR_CLIENT_ID, NEXT_PUBLIC_CONNECTOR_CALLBACK_URL).");
    }
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: process.env.LINEAR_OAUTH_SCOPES || "read",
      state,
    });
    // Mission Control needs the installing user's workspace visibility. An
    // app-actor token can complete OAuth but return no user-readable issues.
    const actor = (process.env.LINEAR_OAUTH_ACTOR || "user").trim();
    if (actor) params.set("actor", actor);
    return `https://linear.app/oauth/authorize?${params.toString()}`;
  },

  async getAccessToken(code: string): Promise<string> {
    const clientId = process.env.LINEAR_CLIENT_ID;
    const clientSecret = process.env.LINEAR_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Linear OAuth env missing (LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET, NEXT_PUBLIC_CONNECTOR_CALLBACK_URL).");
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });
    const response = await fetch("https://api.linear.app/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || `Linear OAuth failed (${response.status})`);
    }
    return payload.access_token;
  },
};
