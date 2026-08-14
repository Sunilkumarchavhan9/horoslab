export type ArtifactType =
  | "code"
  | "test"
  | "preview"
  | "recording"
  | "log"
  | "review_note"
  | string;

export interface Artifact {
  id: string;
  type: ArtifactType;
  producer: string; // agent role or user id
  consumers: string[];
  uri: string; // artifact://uuid or external URL
  metadata: {
    createdAt: number;
    expiresAt?: number;
    tags?: string[];
    stage?: string;
    verificationRequired?: boolean;
    sourceChangeId?: string;
  };
}

import { telemetryEvent } from "../src/lib/telemetry";

export class ArtifactRegistry {
  private artifacts: Map<string, Artifact> = new Map();

  async register(artifact: Artifact): Promise<void> {
    // Basic validation
    if (!artifact || !artifact.id || !artifact.uri) {
      throw new Error("Invalid artifact");
    }

    this.artifacts.set(artifact.id, artifact);
    // Emit lightweight telemetry
    try {
      telemetryEvent("artifact.register", {
        id: artifact.id,
        type: artifact.type,
      });
    } catch (e) {
      // noop
    }
    // In a production system, add versioning, storage, and notifications here.
  }

  async resolve(uri: string): Promise<Artifact | undefined> {
    // Support artifact://id/... style
    try {
      const id = this.extractId(uri);
      const found = this.artifacts.get(id);
      if (found) telemetryEvent("artifact.resolve", { id });
      return found;
    } catch (e) {
      return undefined;
    }
  }

  extractId(uri: string): string {
    // artifact://uuid-123/path -> uuid-123
    if (uri.startsWith("artifact://")) {
      const rest = uri.replace("artifact://", "");
      const parts = rest.split("/");
      return parts[0];
    }

    // fallback: treat full uri as id
    return uri;
  }

  resolveThreadScopedUri(uri: string): { threadId: string; artifactId: string } | null {
    if (!uri.startsWith("artifact://")) return null;
    const rest = uri.replace("artifact://", "");
    const parts = rest.split("/");
    if (parts.length < 2) return null;
    return {
      threadId: parts[0] ?? "",
      artifactId: parts[1] ?? "",
    };
  }

  async list(): Promise<Artifact[]> {
    telemetryEvent("artifact.list", { count: this.artifacts.size });
    return Array.from(this.artifacts.values());
  }

  async remove(id: string): Promise<boolean> {
    const removed = this.artifacts.delete(id);
    if (removed) telemetryEvent("artifact.remove", { id });
    return removed;
  }
}

export const artifactRegistry = new ArtifactRegistry();
