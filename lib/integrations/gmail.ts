import { google } from "googleapis";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { randomUUID } from "crypto";

export interface GmailSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
}

type GmailMessage = {
  id?: string | null;
  threadId?: string | null;
};

export const GmailClient = {
  async sync(options: GmailSyncOptions) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: options.accessToken });
    const gmail = google.gmail({ version: "v1", auth });

    const recent = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    let extractedCount = 0;
    let lastMessageId: string | undefined;
    let newestEpochMs = 0;

    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 25,
      q: options.since ? `after:${Math.floor(new Date(options.since).getTime() / 1000)}` : undefined,
    });

    const messages = (list.data.messages ?? []) as GmailMessage[];
    for (const msg of messages) {
      const id = typeof msg.id === "string" ? msg.id : "";
      if (!id || recent.has(id)) continue;
      const full = await gmail.users.messages.get({ userId: "me", id, format: "full" });
      const payload = full.data.payload;
      const headers = payload?.headers ?? [];
      const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
      const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
      const snippet = full.data.snippet ?? "";
      const internalDate = Number(full.data.internalDate ?? 0);
      if (internalDate > newestEpochMs) newestEpochMs = internalDate;
      if (!lastMessageId) lastMessageId = id;

      const text = `Gmail: ${subject}\nFrom: ${from}\n${snippet}`;
      const candidates = extractMemory({ userId: options.userId, message: text });
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
          confidence: 0.85,
          evidenceCount: 1,
          developerSignals: candidate.developerSignals,
        });
        extractedCount += 1;
      }
      dedupeKeys.push(id);
    }

    return {
      success: true,
      extractedCount,
      dedupeKeys,
      lastMessageId,
      lastCheckpointEpochMs: newestEpochMs || Date.now(),
      checkpoint: new Date().toISOString(),
    };
  },

  async getAccessToken(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL,
    );
    const { tokens } = await oauth2Client.getToken(code);
    return {
      accessToken: tokens.access_token as string,
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL,
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const refreshed = await oauth2Client.refreshAccessToken();
    const token = refreshed.credentials.access_token;
    if (!token) throw new Error("Failed to refresh Gmail access token");
    return {
      accessToken: token,
      ...(refreshed.credentials.refresh_token ? { refreshToken: refreshed.credentials.refresh_token } : {}),
    };
  },

  getAuthorizeUrl(state: string): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL,
    );
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/gmail.readonly"],
      state,
    });
  },
};

