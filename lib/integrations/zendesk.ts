import { randomUUID } from "crypto";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { mapTicketToMemoryTexts } from "./ticketMemoryMapper";

export interface ZendeskSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
}

type ZendeskTicket = {
  id: number;
  subject?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: number | null;
  tags?: string[];
  updated_at?: string;
  url?: string;
};

function zendeskBaseUrl(): string {
  const explicit = process.env.ZENDESK_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const subdomain = process.env.ZENDESK_SUBDOMAIN?.trim();
  if (!subdomain) throw new Error("ZENDESK_BASE_URL or ZENDESK_SUBDOMAIN must be set");
  return `https://${subdomain}.zendesk.com`;
}

export const ZendeskClient = {
  async sync(options: ZendeskSyncOptions) {
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    let extractedCount = 0;
    let newestCheckpointMs = options.since ? new Date(options.since).getTime() : 0;

    const baseUrl = zendeskBaseUrl();
    const response = await fetch(`${baseUrl}/api/v2/tickets.json?page[size]=50&sort_by=updated_at&sort_order=desc`, {
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const payload = (await response.json().catch(() => ({}))) as { tickets?: ZendeskTicket[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || `Zendesk sync failed (${response.status})`);
    }

    for (const ticket of payload.tickets ?? []) {
      const dedupeKey = `zendesk:ticket:${ticket.id}`;
      if (seen.has(dedupeKey)) continue;
      const updatedMs = ticket.updated_at ? new Date(ticket.updated_at).getTime() : 0;
      if (updatedMs > newestCheckpointMs) newestCheckpointMs = updatedMs;

      const mappedTexts = mapTicketToMemoryTexts({
        source: "zendesk",
        id: String(ticket.id),
        title: ticket.subject || `Zendesk ticket ${ticket.id}`,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee_id ? String(ticket.assignee_id) : undefined,
        labels: ticket.tags ?? [],
        updatedAt: ticket.updated_at,
        url: ticket.url,
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
    const baseUrl = zendeskBaseUrl();
    const clientId = process.env.ZENDESK_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !redirectUri) throw new Error("Zendesk OAuth env missing");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read",
      state,
    });
    return `${baseUrl}/oauth/authorizations/new?${params.toString()}`;
  },

  async getAccessToken(code: string): Promise<string> {
    const baseUrl = zendeskBaseUrl();
    const clientId = process.env.ZENDESK_CLIENT_ID;
    const clientSecret = process.env.ZENDESK_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Zendesk OAuth env missing");
    }

    const response = await fetch(`${baseUrl}/oauth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || `Zendesk OAuth failed (${response.status})`);
    }
    return payload.access_token;
  },
};

