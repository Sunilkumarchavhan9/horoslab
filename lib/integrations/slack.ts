import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { randomUUID } from "crypto";

export interface SlackSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
}

type SlackConversation = {
  id?: string;
  name?: string;
};

type SlackMessage = {
  ts?: string;
  text?: string;
  user?: string;
};

export const SlackClient = {
  async sync(options: SlackSyncOptions) {
    const recent = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    let extractedCount = 0;
    let newestTs = "0";
    let cursor: string | undefined;

    const convRes = await fetch("https://slack.com/api/conversations.list?limit=20&types=public_channel,private_channel", {
      headers: { Authorization: `Bearer ${options.accessToken}` },
    });
    const convData = (await convRes.json()) as {
      ok?: boolean;
      error?: string;
      channels?: SlackConversation[];
      response_metadata?: { next_cursor?: string };
    };
    if (!convRes.ok || !convData.ok) {
      throw new Error(`slack conversations.list failed: ${convData.error ?? convRes.statusText}`);
    }
    cursor = convData.response_metadata?.next_cursor || undefined;

    const channels = convData.channels ?? [];
    for (const channel of channels.slice(0, 8)) {
      if (!channel.id) continue;
      const oldest = options.since ? String(Math.floor(new Date(options.since).getTime() / 1000)) : undefined;
      const historyUrl = new URL("https://slack.com/api/conversations.history");
      historyUrl.searchParams.set("channel", channel.id);
      historyUrl.searchParams.set("limit", "40");
      if (oldest) historyUrl.searchParams.set("oldest", oldest);
      const histRes = await fetch(historyUrl.toString(), {
        headers: { Authorization: `Bearer ${options.accessToken}` },
      });
      const histData = (await histRes.json()) as { ok?: boolean; error?: string; messages?: SlackMessage[] };
      if (!histRes.ok || !histData.ok) continue;

      for (const msg of histData.messages ?? []) {
        const ts = typeof msg.ts === "string" ? msg.ts : "";
        const text = typeof msg.text === "string" ? msg.text : "";
        if (!ts || !text) continue;
        const key = `${channel.id}:${ts}`;
        if (recent.has(key)) continue;
        if (Number(ts) > Number(newestTs)) newestTs = ts;

        const candidates = extractMemory({
          userId: options.userId,
          message: `Slack #${channel.name ?? channel.id} ${msg.user ?? "unknown"}: ${text}`,
        });
        const now = new Date().toISOString();
        for (const candidate of candidates) {
          await upsertRecentMemory({
            ...candidate,
            id: randomUUID(),
            source: "chat",
            status: "active",
            createdAt: now,
            updatedAt: now,
            importanceScore: 0.75,
            confidence: 0.84,
            evidenceCount: 1,
            developerSignals: candidate.developerSignals,
          });
          extractedCount += 1;
        }
        dedupeKeys.push(key);
      }
    }

    return {
      success: true,
      extractedCount,
      dedupeKeys,
      cursor,
      lastMessageTs: newestTs !== "0" ? newestTs : undefined,
      checkpoint: new Date().toISOString(),
    };
  },

  async getAccessToken(code: string): Promise<string> {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Slack OAuth env missing");
    }
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; access_token?: string };
    if (!response.ok || !data.ok || !data.access_token) {
      throw new Error(`Slack OAuth failed: ${data.error ?? response.statusText}`);
    }
    return data.access_token;
  },

  getAuthorizeUrl(state: string): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !redirectUri) {
      throw new Error("Slack OAuth env missing");
    }
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "channels:history,groups:history,channels:read,groups:read",
      redirect_uri: redirectUri,
      state,
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  },
};

