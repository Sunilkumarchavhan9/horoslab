/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "@notionhq/client";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { randomUUID } from "crypto";
import axios from "axios";

export interface NotionSyncOptions {
  userId: string;
  accessToken: string;
  since?: string;
  recentItemKeys?: string[];
}

const NOTION_SEARCH_PAGE_SIZE = Math.max(1, Math.min(100, Number(process.env.NOTION_SYNC_SEARCH_PAGE_SIZE ?? 25)));
const NOTION_SEARCH_MAX_PAGES = Math.max(1, Number(process.env.NOTION_SYNC_SEARCH_MAX_PAGES ?? 4));
const NOTION_BLOCKS_PAGE_SIZE = Math.max(1, Math.min(100, Number(process.env.NOTION_SYNC_BLOCKS_PAGE_SIZE ?? 50)));
const NOTION_BLOCKS_MAX_PAGES = Math.max(1, Number(process.env.NOTION_SYNC_BLOCKS_MAX_PAGES ?? 5));

function extractBlockText(block: any): string {
  if (!block || typeof block !== "object" || typeof block.type !== "string") return "";
  const type = block.type as string;
  const node = (block as Record<string, any>)[type];
  const richText = Array.isArray(node?.rich_text) ? node.rich_text : [];
  if (richText.length > 0) {
    return richText.map((t: any) => (typeof t?.plain_text === "string" ? t.plain_text : "")).join("").trim();
  }
  if (type === "child_page" && typeof node?.title === "string") return node.title.trim();
  if (type === "code") return (node?.rich_text ?? []).map((t: any) => t?.plain_text ?? "").join("").trim();
  return "";
}

/**
 * Notion integration client for fetching and processing developer signals from pages.
 */
export const NotionClient = {
  /**
   * Searches for accessible pages and extracts memories from their content.
   */
  async sync(options: NotionSyncOptions) {
    const notion = new Client({ auth: options.accessToken });
    const memoriesExtracted = [];
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const sinceMs = options.since ? new Date(options.since).getTime() : 0;
    let newestCheckpointMs = sinceMs;

    try {
      let searchCursor: string | undefined;
      for (let searchPage = 1; searchPage <= NOTION_SEARCH_MAX_PAGES; searchPage += 1) {
        // 1. Search for pages/databases with pagination.
        const searchResponse = await notion.search({
          filter: { property: "object", value: "page" },
          sort: { direction: "descending", timestamp: "last_edited_time" },
          page_size: NOTION_SEARCH_PAGE_SIZE,
          ...(searchCursor ? { start_cursor: searchCursor } : {}),
        });

        for (const page of searchResponse.results) {
          if (!("properties" in page)) continue;
          const pageKey = `notion:page:${page.id}`;
          if (seen.has(pageKey)) continue;

          let editedMs = 0;
          if ("last_edited_time" in page && typeof page.last_edited_time === "string") {
            editedMs = new Date(page.last_edited_time).getTime();
            if (sinceMs > 0 && editedMs > 0 && editedMs <= sinceMs) continue;
            if (editedMs > newestCheckpointMs) newestCheckpointMs = editedMs;
          }

          // 2. Fetch page blocks (actual content) with pagination.
          const textParts: string[] = [];
          let blockCursor: string | undefined;
          for (let blockPage = 1; blockPage <= NOTION_BLOCKS_MAX_PAGES; blockPage += 1) {
            const blockResponse = await notion.blocks.children.list({
              block_id: page.id,
              page_size: NOTION_BLOCKS_PAGE_SIZE,
              ...(blockCursor ? { start_cursor: blockCursor } : {}),
            });

            for (const block of blockResponse.results) {
              const text = extractBlockText(block);
              if (text) textParts.push(text);
            }

            if (!blockResponse.has_more || !blockResponse.next_cursor) break;
            blockCursor = blockResponse.next_cursor;
          }

          const textContent = textParts.join("\n").trim();
          if (!textContent) continue;

          const title = (page as any).properties.title?.title[0]?.plain_text || "Untitled Notion Page";
          const content = `Notion Page "${title}":\n${textContent}`;

          const candidates = extractMemory({
            userId: options.userId,
            message: content,
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
              importanceScore: 0.8,
              confidence: 0.9,
              evidenceCount: 1,
              developerSignals: candidate.developerSignals,
            });
            memoriesExtracted.push(candidate);
          }
          dedupeKeys.push(pageKey);
        }

        if (!searchResponse.has_more || !searchResponse.next_cursor) break;
        searchCursor = searchResponse.next_cursor;
      }

      return {
        success: true,
        extractedCount: memoriesExtracted.length,
        checkpoint: newestCheckpointMs > 0 ? new Date(newestCheckpointMs).toISOString() : new Date().toISOString(),
        dedupeKeys,
      };
    } catch (error) {
      console.error("[NotionClient] Sync failed:", error);
      throw error;
    }
  },

  /**
   * Exchanges an authorization code for an access token.
   * Notion uses a different OAuth style than GitHub.
   */
  async getAccessToken(code: string) {
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;

    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          Authorization: `Basic ${encoded}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.access_token as string;
  },

  /**
   * Generates the Notion OAuth authorization URL.
   */
  getAuthorizeUrl(state: string) {
    const params = new URLSearchParams({
      client_id: process.env.NOTION_CLIENT_ID || "",
      redirect_uri: process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL || "",
      response_type: "code",
      owner: "user",
      state,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  },
};
