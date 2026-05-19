import { randomUUID } from "crypto";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { mapTicketToMemoryTexts } from "./ticketMemoryMapper";

export interface JiraSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
}

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
  };
};

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

async function getJiraCloudId(accessToken: string): Promise<string> {
  const response = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json().catch(() => [])) as Array<{ id?: string; scopes?: string[] }>;
  if (!response.ok || payload.length === 0 || !payload[0]?.id) {
    throw new Error("Failed to resolve Jira cloud resource");
  }
  return payload[0].id;
}

export const JiraClient = {
  async sync(options: JiraSyncOptions) {
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    let extractedCount = 0;
    let newestCheckpointMs = options.since ? new Date(options.since).getTime() : 0;
    const cloudId = await getJiraCloudId(options.accessToken);

    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=order%20by%20updated%20desc&maxResults=50&fields=summary,description,status,priority,assignee,labels,resolution,updated`,
      {
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          Accept: "application/json",
        },
      },
    );
    const payload = (await response.json().catch(() => ({}))) as { issues?: JiraIssue[]; errorMessages?: string[] };
    if (!response.ok) {
      throw new Error(payload.errorMessages?.join("; ") || `Jira sync failed (${response.status})`);
    }

    for (const issue of payload.issues ?? []) {
      const dedupeKey = `jira:issue:${issue.id}`;
      if (seen.has(dedupeKey)) continue;
      const updatedMs = issue.fields?.updated ? new Date(issue.fields.updated).getTime() : 0;
      if (updatedMs > newestCheckpointMs) newestCheckpointMs = updatedMs;

      const mappedTexts = mapTicketToMemoryTexts({
        source: "jira",
        id: issue.id,
        key: issue.key,
        title: issue.fields?.summary || issue.key,
        description: stringifyJiraDescription(issue.fields?.description),
        status: issue.fields?.status?.name,
        priority: issue.fields?.priority?.name,
        assignee: issue.fields?.assignee?.displayName,
        labels: issue.fields?.labels ?? [],
        resolution: issue.fields?.resolution?.name,
        updatedAt: issue.fields?.updated,
        url: `https://api.atlassian.com/ex/jira/${cloudId}/browse/${issue.key}`,
      });

      const now = new Date().toISOString();
      for (const text of mappedTexts) {
        const candidates = extractMemory({ userId: options.userId, message: text });
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
          });
          extractedCount += 1;
        }
      }

      dedupeKeys.push(dedupeKey);
    }

    return {
      success: true,
      extractedCount,
      dedupeKeys,
      checkpoint: newestCheckpointMs > 0 ? new Date(newestCheckpointMs).toISOString() : new Date().toISOString(),
    };
  },

  getAuthorizeUrl(state: string): string {
    const clientId = process.env.JIRA_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !redirectUri) throw new Error("Jira OAuth env missing");
    const params = new URLSearchParams({
      audience: "api.atlassian.com",
      client_id: clientId,
      scope: "offline_access read:jira-work",
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
    if (!clientId || !clientSecret || !redirectUri) throw new Error("Jira OAuth env missing");

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
      error?: string;
      error_description?: string;
    };
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || `Jira OAuth failed (${response.status})`);
    }
    return payload.access_token;
  },
};

