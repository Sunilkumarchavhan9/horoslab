import { randomUUID } from "crypto";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { mapJiraToMemoryTexts, type JiraMemoryMapInput } from "./jiraMemoryMapper";

export type JiraAuthMode = "oauth" | "pat";

export interface JiraSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
  config?: {
    authMode?: JiraAuthMode;
    siteUrl?: string;
    email?: string;
    projectKeys?: string[];
    cloudId?: string;
    browseBaseUrl?: string;
  };
}

export type JiraSyncDiagnostics = {
  issuesListed: number;
  issuesSynced: number;
  commentsSeen: number;
  commentsSkipped: number;
  commentErrors: string[];
};

type JiraIssue = {
  id: string;
  key: string;
  fields?: {
    summary?: string;
    description?: unknown;
    status?: { name?: string };
    priority?: { name?: string };
    assignee?: { displayName?: string };
    labels?: string[];
    resolution?: { name?: string };
    updated?: string;
    comment?: { total?: number };
  };
};

type JiraComment = {
  id?: string;
  body?: unknown;
  author?: { displayName?: string };
  created?: string;
  updated?: string;
};

const JIRA_ISSUE_PAGE_LIMIT = Math.max(1, Math.min(100, Number(process.env.JIRA_SYNC_ISSUE_PAGE_LIMIT ?? 50)));
const JIRA_COMMENT_MAX_PER_ISSUE = Math.max(0, Number(process.env.JIRA_SYNC_COMMENT_MAX_PER_ISSUE ?? 15));
const JIRA_REQUEST_TIMEOUT_MS = Math.max(3_000, Number(process.env.JIRA_REQUEST_TIMEOUT_MS ?? 15_000));

function incrementContractCount(counts: Record<string, number>, category?: string): void {
  if (!category) return;
  counts[category] = (counts[category] ?? 0) + 1;
}

function phase2PillarFromContractCategory(
  category?: string,
): "decision" | "incident" | "architecture" | "process" | null {
  if (!category) return null;
  if (category === "decision") return "decision";
  if (category === "incident" || category === "blocker" || category === "bug") return "incident";
  if (category === "architecture_note") return "architecture";
  if (category === "runbook" || category === "next_action") return "process";
  return null;
}

function buildPhase2SourceRef(category: string | undefined, sourceKey: string): string | undefined {
  const pillar = phase2PillarFromContractCategory(category);
  if (!pillar) return undefined;
  return `phase2:${pillar}:${sourceKey}`;
}

function stringifyJiraDescription(input: unknown): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (typeof input !== "object") return "";
  try {
    return JSON.stringify(input);
  } catch {
    return "";
  }
}

function stringifyJiraBody(input: unknown): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (typeof input === "object" && input !== null) {
    const doc = input as { content?: unknown[] };
    if (Array.isArray(doc.content)) {
      const parts: string[] = [];
      for (const node of doc.content) {
        if (node && typeof node === "object") {
          const text = (node as { text?: string }).text;
          if (typeof text === "string" && text.trim()) parts.push(text.trim());
        }
      }
      if (parts.length > 0) return parts.join(" ");
    }
  }
  return stringifyJiraDescription(input);
}

function normalizeSiteUrl(siteUrl: string): string {
  const trimmed = siteUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function parseProjectKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
    .filter((item) => item.length > 0);
}

function buildJql(projectKeys: string[], since?: string): string {
  const clauses: string[] = [];
  if (projectKeys.length > 0) {
    const quoted = projectKeys.map((key) => `"${key.replace(/"/g, "")}"`).join(", ");
    clauses.push(`project in (${quoted})`);
  }
  if (since?.trim()) {
    const sinceMs = Date.parse(since);
    if (Number.isFinite(sinceMs)) {
      const jiraDate = new Date(sinceMs).toISOString().slice(0, 16).replace("T", " ");
      clauses.push(`updated >= "${jiraDate}"`);
    }
  }
  const filter = clauses.length > 0 ? `${clauses.join(" AND ")} ` : "";
  return `${filter}ORDER BY updated DESC`;
}

function formatJiraApiError(context: string, status: number, detail?: string): string {
  const code = detail?.trim() || `http_${status}`;
  const hints: Record<string, string> = {
    unauthorized: "Jira authentication failed. Reconnect OAuth or verify PAT email/token.",
    forbidden: "Jira token lacks read:jira-work or project access. Check scopes and project keys.",
    not_found: "Jira site or issue not found. Verify site URL and project keys.",
  };
  const hint = hints[code.toLowerCase()] ?? hints[code];
  return hint ? `Jira ${context} failed (${code}): ${hint}` : `Jira ${context} failed (${code})`;
}

type JiraApiContext = {
  authMode: JiraAuthMode;
  searchUrl: string;
  commentBaseUrl: string;
  headers: Record<string, string>;
  browseBaseUrl: string;
  cloudId?: string;
};

async function jiraFetch(
  url: string,
  headers: Record<string, string>,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JIRA_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...headers,
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessibleResource(accessToken: string): Promise<{ cloudId: string; browseBaseUrl: string }> {
  const response = await jiraFetch("https://api.atlassian.com/oauth/token/accessible-resources", {
    Authorization: `Bearer ${accessToken}`,
  });
  const payload = (await response.json().catch(() => [])) as Array<{ id?: string; url?: string }>;
  if (!response.ok || payload.length === 0 || !payload[0]?.id) {
    throw new Error(formatJiraApiError("accessible-resources", response.status, "unauthorized"));
  }
  const cloudId = payload[0].id;
  const browseBaseUrl = payload[0].url?.trim()
    ? normalizeSiteUrl(payload[0].url)
    : `https://api.atlassian.com/ex/jira/${cloudId}`;
  return { cloudId, browseBaseUrl };
}

async function resolveJiraApiContext(
  accessToken: string,
  config?: JiraSyncOptions["config"],
): Promise<JiraApiContext> {
  const authMode: JiraAuthMode =
    config?.authMode === "pat" || (config?.siteUrl && config?.email) ? "pat" : "oauth";

  if (authMode === "pat") {
    const siteUrl = config?.siteUrl?.trim();
    const email = config?.email?.trim();
    if (!siteUrl || !email || !accessToken) {
      throw new Error(
        "Jira PAT sync requires siteUrl, email, and apiToken in connector config (or use OAuth).",
      );
    }
    const base = `${normalizeSiteUrl(siteUrl)}/rest/api/3`;
    const encoded = Buffer.from(`${email}:${accessToken}`).toString("base64");
    return {
      authMode: "pat",
      searchUrl: `${base}/search`,
      commentBaseUrl: `${base}/issue`,
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      browseBaseUrl: normalizeSiteUrl(siteUrl),
    };
  }

  const cachedCloudId = config?.cloudId?.trim();
  const cachedBrowse = config?.browseBaseUrl?.trim();
  const resource =
    cachedCloudId && cachedBrowse
      ? { cloudId: cachedCloudId, browseBaseUrl: normalizeSiteUrl(cachedBrowse) }
      : await getAccessibleResource(accessToken);

  const apiBase = `https://api.atlassian.com/ex/jira/${resource.cloudId}/rest/api/3`;
  return {
    authMode: "oauth",
    searchUrl: `${apiBase}/search`,
    commentBaseUrl: `${apiBase}/issue`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    browseBaseUrl: resource.browseBaseUrl,
    cloudId: resource.cloudId,
  };
}

function issueMapInput(
  issue: JiraIssue,
  browseBaseUrl: string,
  commentBody?: string,
  commentAuthor?: string,
): JiraMemoryMapInput {
  return {
    issueId: issue.id,
    issueKey: issue.key,
    summary: issue.fields?.summary || issue.key,
    description: stringifyJiraDescription(issue.fields?.description),
    status: issue.fields?.status?.name,
    priority: issue.fields?.priority?.name,
    assignee: issue.fields?.assignee?.displayName,
    labels: issue.fields?.labels ?? [],
    resolution: issue.fields?.resolution?.name,
    updatedAt: issue.fields?.updated,
    url: `${browseBaseUrl.replace(/\/+$/, "")}/browse/${issue.key}`,
    commentBody,
    commentAuthor,
  };
}

async function searchIssues(
  ctx: JiraApiContext,
  jql: string,
): Promise<JiraIssue[]> {
  const response = await jiraFetch(ctx.searchUrl, ctx.headers, {
    method: "POST",
    body: JSON.stringify({
      jql,
      maxResults: JIRA_ISSUE_PAGE_LIMIT,
      fields: [
        "summary",
        "description",
        "status",
        "priority",
        "assignee",
        "labels",
        "resolution",
        "updated",
        "comment",
      ],
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    issues?: JiraIssue[];
    errorMessages?: string[];
    message?: string;
  };
  if (!response.ok) {
    const detail = payload.errorMessages?.join("; ") || payload.message;
    throw new Error(formatJiraApiError("issue search", response.status, detail));
  }
  return payload.issues ?? [];
}

async function listIssueComments(
  ctx: JiraApiContext,
  issueKey: string,
): Promise<JiraComment[]> {
  const url = `${ctx.commentBaseUrl}/${encodeURIComponent(issueKey)}/comment?maxResults=${JIRA_COMMENT_MAX_PER_ISSUE}&orderBy=-created`;
  const response = await jiraFetch(url, ctx.headers);
  const payload = (await response.json().catch(() => ({}))) as { comments?: JiraComment[]; errorMessages?: string[] };
  if (!response.ok) {
    const detail = payload.errorMessages?.join("; ");
    throw new Error(formatJiraApiError(`comments for ${issueKey}`, response.status, detail));
  }
  return payload.comments ?? [];
}

async function commitMappedTexts(
  userId: string,
  mappedTexts: string[],
  contractCounts: Record<string, number>,
  sourceKey: string,
): Promise<number> {
  let extractedCount = 0;
  const now = new Date().toISOString();
  for (const text of mappedTexts) {
    const candidates = extractMemory({ userId, message: text });
    for (const candidate of candidates) {
      const sourceRef =
        candidate.sourceRef ?? buildPhase2SourceRef(candidate.contractCategory, sourceKey);
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
      });
      extractedCount += 1;
      incrementContractCount(contractCounts, candidate.contractCategory);
    }
  }
  return extractedCount;
}

function jiraPlainTextToAdf(text: string) {
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

export async function verifyJiraConnectorAccess(
  accessToken: string,
  config?: JiraSyncOptions["config"],
): Promise<JiraApiContext> {
  return resolveJiraApiContext(accessToken, config);
}

export async function postJiraIssueComment(
  accessToken: string,
  config: JiraSyncOptions["config"] | undefined,
  issueKey: string,
  bodyText: string,
): Promise<{ commentId?: string; issueUrl: string }> {
  const key = issueKey.trim().toUpperCase();
  const body = bodyText.trim();
  if (!key) throw new Error("Jira issueKey is required.");
  if (!body) throw new Error("Jira comment body is required.");

  const ctx = await resolveJiraApiContext(accessToken, config);
  const url = `${ctx.commentBaseUrl}/${encodeURIComponent(key)}/comment`;
  const response = await jiraFetch(url, ctx.headers, {
    method: "POST",
    body: JSON.stringify({ body: jiraPlainTextToAdf(body) }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    errorMessages?: string[];
    message?: string;
  };
  if (!response.ok) {
    const detail = payload.errorMessages?.join("; ") || payload.message;
    throw new Error(formatJiraApiError(`comment on ${key}`, response.status, detail));
  }
  return {
    commentId: payload.id,
    issueUrl: `${ctx.browseBaseUrl.replace(/\/+$/, "")}/browse/${key}`,
  };
}

export async function transitionJiraIssue(
  accessToken: string,
  config: JiraSyncOptions["config"] | undefined,
  issueKey: string,
  transitionId: string,
): Promise<{ issueUrl: string }> {
  const key = issueKey.trim().toUpperCase();
  const transition = transitionId.trim();
  if (!key) throw new Error("Jira issueKey is required.");
  if (!transition) throw new Error("Jira transitionId is required.");

  const ctx = await resolveJiraApiContext(accessToken, config);
  const url = `${ctx.commentBaseUrl}/${encodeURIComponent(key)}/transitions`;
  const response = await jiraFetch(url, ctx.headers, {
    method: "POST",
    body: JSON.stringify({ transition: { id: transition } }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    errorMessages?: string[];
    message?: string;
  };
  if (!response.ok) {
    const detail = payload.errorMessages?.join("; ") || payload.message;
    throw new Error(formatJiraApiError(`transition ${key}`, response.status, detail));
  }
  return {
    issueUrl: `${ctx.browseBaseUrl.replace(/\/+$/, "")}/browse/${key}`,
  };
}

export const JiraClient = {
  async sync(options: JiraSyncOptions) {
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const contractCounts: Record<string, number> = {};
    let extractedCount = 0;
    let newestCheckpointMs = options.since ? new Date(options.since).getTime() : 0;

    const diagnostics: JiraSyncDiagnostics = {
      issuesListed: 0,
      issuesSynced: 0,
      commentsSeen: 0,
      commentsSkipped: 0,
      commentErrors: [],
    };

    const projectKeys = parseProjectKeys(options.config?.projectKeys);
    const ctx = await resolveJiraApiContext(options.accessToken, options.config);
    const jql = buildJql(projectKeys, options.since);
    const issues = await searchIssues(ctx, jql);
    diagnostics.issuesListed = issues.length;

    if (issues.length === 0) {
      const scope =
        projectKeys.length > 0
          ? `No issues found for project(s) ${projectKeys.join(", ")}.`
          : "No issues returned from Jira.";
      throw new Error(
        `${scope} Verify project keys in connector config and token scopes (read:jira-work).`,
      );
    }

    const sinceMs = options.since ? new Date(options.since).getTime() : 0;

    for (const issue of issues) {
      const issueDedupeKey = `jira:issue:${issue.id}`;
      const updatedMs = issue.fields?.updated ? new Date(issue.fields.updated).getTime() : 0;
      if (updatedMs > newestCheckpointMs) newestCheckpointMs = updatedMs;

      if (sinceMs > 0 && updatedMs > 0 && updatedMs <= sinceMs) {
        continue;
      }

      const issueIsNew = !seen.has(issueDedupeKey);
      if (issueIsNew) {
        const mappedTexts = mapJiraToMemoryTexts(issueMapInput(issue, ctx.browseBaseUrl));
        extractedCount += await commitMappedTexts(
          options.userId,
          mappedTexts,
          contractCounts,
          issueDedupeKey,
        );
        dedupeKeys.push(issueDedupeKey);
        diagnostics.issuesSynced += 1;
      }

      if (JIRA_COMMENT_MAX_PER_ISSUE <= 0) continue;

      try {
        const comments = await listIssueComments(ctx, issue.key);
        for (const comment of comments) {
          diagnostics.commentsSeen += 1;
          const commentId = typeof comment.id === "string" ? comment.id : "";
          const body = stringifyJiraBody(comment.body);
          if (!commentId || !body.trim()) {
            diagnostics.commentsSkipped += 1;
            continue;
          }
          const commentDedupeKey = `jira:comment:${issue.id}:${commentId}`;
          if (seen.has(commentDedupeKey)) {
            diagnostics.commentsSkipped += 1;
            continue;
          }
          const commentUpdatedMs = comment.updated
            ? new Date(comment.updated).getTime()
            : comment.created
              ? new Date(comment.created).getTime()
              : 0;
          if (sinceMs > 0 && commentUpdatedMs > 0 && commentUpdatedMs <= sinceMs) {
            diagnostics.commentsSkipped += 1;
            continue;
          }
          if (commentUpdatedMs > newestCheckpointMs) newestCheckpointMs = commentUpdatedMs;

          const mappedTexts = mapJiraToMemoryTexts(
            issueMapInput(
              issue,
              ctx.browseBaseUrl,
              body,
              comment.author?.displayName,
            ),
          );
          extractedCount += await commitMappedTexts(
            options.userId,
            mappedTexts,
            contractCounts,
            commentDedupeKey,
          );
          dedupeKeys.push(commentDedupeKey);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "comment fetch failed";
        diagnostics.commentErrors.push(`${issue.key}: ${message}`);
      }
    }

    if (diagnostics.issuesSynced === 0 && dedupeKeys.length === 0) {
      throw new Error(
        "Jira sync found no new issues or comments since the last checkpoint. Run sync again after Jira activity or clear recent keys.",
      );
    }

    return {
      success: true,
      extractedCount,
      dedupeKeys,
      contractCounts,
      diagnostics,
      cloudId: ctx.cloudId,
      browseBaseUrl: ctx.browseBaseUrl,
      checkpoint:
        newestCheckpointMs > 0
          ? new Date(newestCheckpointMs).toISOString()
          : new Date().toISOString(),
    };
  },

  getAuthorizeUrl(state: string): string {
    const clientId = process.env.JIRA_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !redirectUri) {
      throw new Error("Jira OAuth env missing (JIRA_CLIENT_ID, NEXT_PUBLIC_CONNECTOR_CALLBACK_URL).");
    }
    const params = new URLSearchParams({
      audience: "api.atlassian.com",
      client_id: clientId,
      scope: "offline_access read:jira-work read:jira-user",
      redirect_uri: redirectUri,
      response_type: "code",
      prompt: "consent",
      state,
    });
    return `https://auth.atlassian.com/authorize?${params.toString()}`;
  },

  async getAccessToken(code: string): Promise<string> {
    const clientId = process.env.JIRA_CLIENT_ID;
    const clientSecret = process.env.JIRA_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Jira OAuth env missing (JIRA_CLIENT_ID, JIRA_CLIENT_SECRET, NEXT_PUBLIC_CONNECTOR_CALLBACK_URL).");
    }

    const response = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || `Jira OAuth failed (${response.status})`);
    }
    return payload.access_token;
  },

  async getOAuthTokens(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const clientId = process.env.JIRA_CLIENT_ID;
    const clientSecret = process.env.JIRA_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Jira OAuth env missing.");
    }

    const response = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || `Jira OAuth failed (${response.status})`);
    }
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
    };
  },
};
