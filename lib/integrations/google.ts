import { google } from "googleapis";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { randomUUID } from "crypto";

export interface GoogleSyncOptions {
  userId: string;
  accessToken: string;
}

export type GoogleOAuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

/**
 * Google Drive integration client for fetching and processing developer signals from documents.
 */
export const GoogleClient = {
  /**
   * Fetches recently modified Google Docs and extracts memories from their text content.
   */
  async sync(options: GoogleSyncOptions) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: options.accessToken });
    
    const drive = google.drive({ version: "v3", auth });
    const docs = google.docs({ version: "v1", auth });
    const memoriesExtracted = [];

    try {
      // 1. List recently modified Google Docs
      const { data } = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.document'",
        orderBy: "modifiedTime desc",
        pageSize: 10,
        fields: "files(id, name, webViewLink)",
      });

      const files = data.files || [];
      for (const file of files) {
        if (!file.id) continue;

        // 2. Get document content
        const { data: doc } = await docs.documents.get({
          documentId: file.id,
        });

        // 3. Extract text from the document structure
        const textContent = doc.body?.content
          ?.map((element) => {
            if (element.paragraph) {
              return element.paragraph.elements
                ?.map((e) => e.textRun?.content)
                .join("");
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");

        if (!textContent) continue;

        const content = `Google Doc "${file.name}":\n${textContent}`;
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
      console.error("[GoogleClient] Sync failed:", error);
      throw error;
    }
  },

  /**
   * Exchanges an authorization code for an access token.
   */
  async getAccessToken(code: string): Promise<GoogleOAuthTokens> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL
    );

    const { tokens } = await oauth2Client.getToken(code);
    return {
      accessToken: tokens.access_token as string,
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL,
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const refreshed = await oauth2Client.refreshAccessToken();
    const token = refreshed.credentials.access_token;
    if (!token) {
      throw new Error("Failed to refresh Google access token");
    }
    return {
      accessToken: token,
      ...(refreshed.credentials.refresh_token ? { refreshToken: refreshed.credentials.refresh_token } : {}),
    };
  },

  /**
   * Generates the Google OAuth authorization URL.
   */
  getAuthorizeUrl(state: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL
    );

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/documents.readonly",
      ],
      state,
    });
  },
};
