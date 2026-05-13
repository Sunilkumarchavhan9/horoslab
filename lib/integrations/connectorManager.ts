/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";
import { GitHubClient } from "./github";
import { NotionClient } from "./notion";
import { GoogleClient } from "./google";
import { MicrosoftClient } from "./microsoft";
import { getMemoryStoreAdapter } from "../adapters/registry";
import { randomUUID } from "crypto";

export type ConnectorType = "github" | "notion" | "google_drive" | "onedrive";

export interface ConnectorPayload {
  userId: string;
  source: ConnectorType;
  externalId: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * The ConnectorManager is the central hub for processing real-time data 
 * from external sources like Notion, GitHub, and Drive.
 */
export const ConnectorManager = {
  /**
   * Processes an incoming real-time signal from a connected source.
   * This handles the extraction of "Developer Memory" from raw content.
   */
  async processSignal(payload: ConnectorPayload) {
    console.log(`[ConnectorManager] Processing signal from ${payload.source}:${payload.externalId}`);

    // 1. Extract Memories using the core memory engine
    const candidates = extractMemory({
      userId: payload.userId,
      message: payload.content
    });

    if (candidates.length === 0) {
      console.log(`[ConnectorManager] No memories extracted from ${payload.source} payload.`);
      return { success: true, extractedCount: 0 };
    }

    // 2. Commit extracted memories to the store
    const now = new Date().toISOString();
    for (const candidate of candidates) {
      await upsertRecentMemory({
        ...candidate,
        id: randomUUID(),
        source: "chat", // Only allowed types: chat, system, import
        status: "active",
        createdAt: now,
        updatedAt: now,
        importanceScore: 0.8,
        confidence: 0.9,
        evidenceCount: 1,
        developerSignals: {
          ...candidate.developerSignals,
          // We can't easily add arbitrary metadata here without updating DeveloperSignals,
          // so we keep the extracted signals.
        }
      });
    }

    console.log(`[ConnectorManager] Successfully committed ${candidates.length} memories from ${payload.source}`);

    return {
      success: true,
      extractedCount: candidates.length
    };
  },

  /**
   * Triggers a real sync for a specific connector.
   */
  async triggerSync(userId: string, type: ConnectorType, accessToken?: string) {
    console.log(`[ConnectorManager] Triggering ${type} sync for user ${userId}`);

    if (!accessToken) {
      throw new Error(`${type} access token is required for sync.`);
    }

    if (type === "github") {
      return GitHubClient.sync({ userId, accessToken });
    }

    if (type === "notion") {
      return NotionClient.sync({ userId, accessToken });
    }

    if (type === "google_drive") {
      return GoogleClient.sync({ userId, accessToken });
    }

    if (type === "onedrive") {
      return MicrosoftClient.sync({ userId, accessToken });
    }

    // Fallback for types not yet fully implemented
    console.warn(`[ConnectorManager] Sync for ${type} is not fully implemented yet.`);

    return { success: true, extractedCount: 0 };
  }
};
