import { createHash } from "crypto";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { mapSlackToMemoryTexts } from "./slackMemoryMapper";

export interface SlackSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
}

export type SlackSyncDiagnostics = {
  channelsListed: number;
  channelsSynced: number;
  messagesSeen: number;
  messagesSkipped: number;
  historyErrors: string[];
};

export type SlackMemorySourceDetails = {
  sourceRef: string;
  traceProof: {
    sourceType: "slack";
    sourceRef: string;
    evidence: string[];
    confidence: number;
    capturedAt: string;
  };
  developerSignals: {
    projectArea: string[];
  };
};

type SlackConversation = {
  id?: string;
  name?: string;
  is_member?: boolean;
};

type SlackMessage = {
  ts?: string;
  text?: string;
  user?: string;
  subtype?: string;
  bot_id?: string;
  thread_ts?: string;
};

const SLACK_CHANNEL_PAGE_LIMIT = Math.max(1, Math.min(200, Number(process.env.SLACK_SYNC_CHANNEL_PAGE_LIMIT ?? 20)));
const SLACK_CHANNEL_SYNC_MAX = Math.max(1, Number(process.env.SLACK_SYNC_CHANNEL_MAX ?? 8));
const SLACK_MESSAGE_PAGE_LIMIT = Math.max(1, Math.min(100, Number(process.env.SLACK_SYNC_MESSAGE_PAGE_LIMIT ?? 40)));
const SLACK_REQUEST_TIMEOUT_MS = Math.max(3_000, Number(process.env.SLACK_REQUEST_TIMEOUT_MS ?? 12_000));

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

function slackMessageDedupeKey(channelId: string, ts: string): string {
  return `slack:message:${channelId}:${ts}`;
}

function stableSlackMemoryId(sourceRef: string, content: string): string {
  const digest = createHash("sha256").update(`${sourceRef}\n${content}`).digest("hex").slice(0, 24);
  return `slack_mem_${digest}`;
}

export function buildSlackMemorySourceDetails(input: {
  channelId: string;
  channelName?: string;
  messageTs: string;
  text: string;
  capturedAt?: string;
}): SlackMemorySourceDetails {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const channelLabel = input.channelName?.trim() || input.channelId;
  const sourceRef = `slack://${input.channelId}/${input.messageTs}`;
  return {
    sourceRef,
    traceProof: {
      sourceType: "slack",
      sourceRef,
      evidence: [
        `Slack #${channelLabel} message ${input.messageTs}`,
        input.text.slice(0, 240),
      ],
      confidence: 0.88,
      capturedAt,
    },
    developerSignals: {
      projectArea: [`slack:${channelLabel}`],
    },
  };
}

function slackTsToIso(ts: string): string | undefined {
  const seconds = Number.parseFloat(ts);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return new Date(seconds * 1000).toISOString();
}

function slackTsToMs(ts: string): number {
  const seconds = Number.parseFloat(ts);
  return Number.isFinite(seconds) ? Math.floor(seconds * 1000) : 0;
}

export function formatSlackApiError(method: string, error?: string, statusText?: string): string {
  const code = error?.trim() || statusText?.trim() || "unknown_error";
  const hints: Record<string, string> = {
    missing_scope: "Reconnect Slack and grant channels:history, groups:history, channels:read, and groups:read.",
    not_in_channel: "Invite the Slack app to the channel or use a workspace where the bot is a member.",
    token_revoked: "Slack token was revoked. Disconnect and reconnect the Slack connector.",
    invalid_auth: "Slack authentication failed. Disconnect and reconnect the Slack connector.",
    account_inactive: "Slack workspace token is inactive. Reconnect the Slack connector.",
    ratelimited: "Slack rate limit hit. Retry sync in a few minutes.",
    channel_not_found: "Channel no longer exists or is inaccessible with the current token.",
  };
  const hint = hints[code];
  return hint ? `Slack ${method} failed (${code}): ${hint}` : `Slack ${method} failed (${code})`;
}

async function slackApiFetch(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SLACK_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function slackApiJson<T>(
  method: string,
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await slackApiFetch(url, accessToken, init);
  const data = (await response.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
  if (!response.ok || data.ok === false) {
    throw new Error(formatSlackApiError(method, data.error, response.statusText));
  }
  return data;
}

function shouldSkipMessage(msg: SlackMessage): boolean {
  if (msg.subtype && msg.subtype !== "thread_broadcast") return true;
  if (msg.bot_id) return true;
  const text = typeof msg.text === "string" ? msg.text.trim() : "";
  if (!text) return true;
  return false;
}

export const SlackClient = {
  async sync(options: SlackSyncOptions) {
    const recent = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const contractCounts: Record<string, number> = {};
    let extractedCount = 0;
    let newestTsMs = options.since ? new Date(options.since).getTime() : 0;
    let lastMessageTs: string | undefined;

    const diagnostics: SlackSyncDiagnostics = {
      channelsListed: 0,
      channelsSynced: 0,
      messagesSeen: 0,
      messagesSkipped: 0,
      historyErrors: [],
    };

    const listUrl = new URL("https://slack.com/api/conversations.list");
    listUrl.searchParams.set("limit", String(SLACK_CHANNEL_PAGE_LIMIT));
    listUrl.searchParams.set("types", "public_channel,private_channel");
    listUrl.searchParams.set("exclude_archived", "true");

    const convData = await slackApiJson<{
      channels?: SlackConversation[];
      response_metadata?: { next_cursor?: string };
    }>("conversations.list", listUrl.toString(), options.accessToken);

    const cursor = convData.response_metadata?.next_cursor || undefined;
    const listedChannels = (convData.channels ?? []).filter((channel) => channel.id);
    const channels = listedChannels.filter((channel) => channel.is_member !== false);
    diagnostics.channelsListed = listedChannels.length;

    if (channels.length === 0) {
      throw new Error(
        "Slack sync found no joined channels. Invite the Slack app to at least one channel or verify channels:read/groups:read scope.",
      );
    }

    const sinceMs = options.since ? new Date(options.since).getTime() : 0;
    for (const channel of channels.slice(0, SLACK_CHANNEL_SYNC_MAX)) {
      if (!channel.id) continue;
      const historyUrl = new URL("https://slack.com/api/conversations.history");
      historyUrl.searchParams.set("channel", channel.id);
      historyUrl.searchParams.set("limit", String(SLACK_MESSAGE_PAGE_LIMIT));

      let histData: { messages?: SlackMessage[] };
      try {
        histData = await slackApiJson<{ messages?: SlackMessage[] }>(
          "conversations.history",
          historyUrl.toString(),
          options.accessToken,
        );
        diagnostics.channelsSynced += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "conversations.history failed";
        diagnostics.historyErrors.push(`${channel.name ?? channel.id}: ${message}`);
        continue;
      }

      for (const msg of histData.messages ?? []) {
        diagnostics.messagesSeen += 1;
        if (shouldSkipMessage(msg)) {
          diagnostics.messagesSkipped += 1;
          continue;
        }

        const ts = typeof msg.ts === "string" ? msg.ts : "";
        const text = typeof msg.text === "string" ? msg.text.trim() : "";
        if (!ts || !text) {
          diagnostics.messagesSkipped += 1;
          continue;
        }

        const msgMs = slackTsToMs(ts);
        const olderThanCheckpoint = sinceMs > 0 && msgMs > 0 && msgMs <= sinceMs;
        if (msgMs > newestTsMs) newestTsMs = msgMs;

        const key = slackMessageDedupeKey(channel.id, ts);
        const knownMessage = recent.has(key);

        const sourceDetails = buildSlackMemorySourceDetails({
          channelId: channel.id,
          channelName: channel.name,
          messageTs: ts,
          text,
        });
        const mappedTexts = mapSlackToMemoryTexts({
          channelId: channel.id,
          channelName: channel.name,
          messageTs: ts,
          threadTs: typeof msg.thread_ts === "string" ? msg.thread_ts : undefined,
          userId: typeof msg.user === "string" ? msg.user : undefined,
          text,
        });

        const now = new Date().toISOString();
        for (const mappedText of mappedTexts) {
          const candidates = extractMemory({
            userId: options.userId,
            message: mappedText,
          });
          for (const candidate of candidates) {
            const sourceRef =
              candidate.sourceRef ?? buildPhase2SourceRef(candidate.contractCategory, key) ?? sourceDetails.sourceRef;
            await upsertRecentMemory({
              ...candidate,
              id: stableSlackMemoryId(sourceRef, candidate.content),
              source: "chat",
              status: "active",
              createdAt: now,
              updatedAt: now,
              importanceScore: 0.78,
              confidence: 0.86,
              evidenceCount: sourceDetails.traceProof.evidence.length,
              developerSignals: candidate.developerSignals,
              traceProof: {
                ...sourceDetails.traceProof,
                sourceRef,
              },
              sourceRef,
            });
            extractedCount += 1;
            incrementContractCount(contractCounts, candidate.contractCategory);
          }
        }

        if (!knownMessage && !olderThanCheckpoint) {
          dedupeKeys.push(key);
        }
        lastMessageTs = ts;
      }
    }

    if (diagnostics.channelsSynced === 0) {
      const detail = diagnostics.historyErrors.slice(0, 3).join(" | ");
      throw new Error(
        detail
          ? `Slack sync could not read message history for any channel. ${detail}`
          : "Slack sync could not read message history for any channel.",
      );
    }

    const checkpoint =
      newestTsMs > 0
        ? new Date(newestTsMs).toISOString()
        : slackTsToIso(lastMessageTs ?? "") ?? new Date().toISOString();

    return {
      success: true,
      extractedCount,
      sourceItemCount: diagnostics.messagesSeen,
      dedupeKeys,
      cursor,
      lastMessageTs,
      checkpoint,
      contractCounts,
      diagnostics,
    };
  },

  async getAccessToken(code: string): Promise<string> {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Slack OAuth env missing (SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, NEXT_PUBLIC_CONNECTOR_CALLBACK_URL).");
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
      throw new Error(formatSlackApiError("oauth.v2.access", data.error, response.statusText));
    }
    return data.access_token;
  },

  async verifyAccessToken(accessToken: string): Promise<void> {
    await slackApiJson("auth.test", "https://slack.com/api/auth.test", accessToken);
  },

  async postChannelMessage(options: {
    accessToken: string;
    channel: string;
    text: string;
    threadTs?: string;
  }): Promise<{ channel: string; ts?: string }> {
    const channel = options.channel.trim();
    const text = options.text.trim();
    if (!channel) throw new Error("Slack channel is required.");
    if (!text) throw new Error("Slack message text is required.");

    const payload = await slackApiJson<{ channel?: string; ts?: string }>(
      "chat.postMessage",
      "https://slack.com/api/chat.postMessage",
      options.accessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          text,
          ...(options.threadTs?.trim() ? { thread_ts: options.threadTs.trim() } : {}),
        }),
      },
    );
    return { channel: payload.channel ?? channel, ts: payload.ts };
  },

  getAuthorizeUrl(state: string): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !redirectUri) {
      throw new Error("Slack OAuth env missing (SLACK_CLIENT_ID, NEXT_PUBLIC_CONNECTOR_CALLBACK_URL).");
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
