import { Client } from "@microsoft/microsoft-graph-client";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { randomUUID } from "crypto";
import axios from "axios";

export interface MicrosoftSyncOptions {
  userId: string;
  accessToken: string;
}

/**
 * OneDrive integration client for fetching and processing developer signals from documents.
 */
export const MicrosoftClient = {
  /**
   * Fetches recently modified files from OneDrive and extracts memories.
   */
  async sync(options: MicrosoftSyncOptions) {
    const client = Client.init({
      authProvider: (done) => done(null, options.accessToken),
    });
    const memoriesExtracted = [];

    try {
      // 1. List recently modified files
      const { value: files } = await client.api("/me/drive/recent").get();

      for (const file of files) {
        // Only process .txt or .md files for now to keep it simple
        if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) continue;

        // 2. Fetch file content
        const contentResponse = await axios.get(file["@microsoft.graph.downloadUrl"]);
        const textContent = contentResponse.data;

        if (!textContent || typeof textContent !== "string") continue;

        const content = `OneDrive File "${file.name}":\n${textContent}`;
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
      }

      return {
        success: true,
        extractedCount: memoriesExtracted.length,
      };
    } catch (error) {
      console.error("[MicrosoftClient] Sync failed:", error);
      throw error;
    }
  },

  /**
   * Exchanges an authorization code for an access token.
   * This uses the standard Microsoft Identity Platform OAuth2 flow.
   */
  async getAccessToken(code: string) {
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || "",
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
      code,
      redirect_uri: process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL || "",
      grant_type: "authorization_code",
    });

    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    return response.data.access_token as string;
  },

  /**
   * Generates the Microsoft OAuth authorization URL.
   */
  getAuthorizeUrl(state: string) {
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || "",
      response_type: "code",
      redirect_uri: process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL || "",
      response_mode: "query",
      scope: "Files.Read.All Files.ReadWrite.All User.Read offline_access",
      state,
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  },
};
