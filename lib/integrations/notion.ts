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

    try {
      // 1. Search for pages/databases
      const { results } = await notion.search({
        filter: { property: "object", value: "page" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: 10,
      });

      for (const page of results) {
        if (!("properties" in page)) continue;
        const pageKey = `notion:page:${page.id}`;
        if (seen.has(pageKey)) continue;
        if (options.since && "last_edited_time" in page) {
          const edited = typeof page.last_edited_time === "string" ? page.last_edited_time : "";
          if (edited && new Date(edited).getTime() <= new Date(options.since).getTime()) {
            continue;
          }
        }

        // 2. Fetch page blocks (the actual content)
        const response = await notion.blocks.children.list({
          block_id: page.id,
        });
        const blocks = response.results;

        // 3. Extract text from blocks
        const textContent = blocks
          .map((block: any) => {
            if (block.type === "paragraph") {
              return block.paragraph.rich_text.map((t: any) => t.plain_text).join("");
            }
            if (block.type === "heading_1") {
              return block.heading_1.rich_text.map((t: any) => t.plain_text).join("");
            }
            // Add more block types as needed
            return "";
          })
          .filter(Boolean)
          .join("\n");

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

      return {
        success: true,
        extractedCount: memoriesExtracted.length,
        checkpoint: new Date().toISOString(),
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
