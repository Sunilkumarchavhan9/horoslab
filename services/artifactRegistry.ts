export type ArtifactType = 'code' | 'test' | 'preview' | 'recording' | 'log' | string;

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
  };
}

export class ArtifactRegistry {
  private artifacts: Map<string, Artifact> = new Map();

  async register(artifact: Artifact): Promise<void> {
    // Basic validation
    if (!artifact || !artifact.id || !artifact.uri) {
      throw new Error('Invalid artifact');
    }

    this.artifacts.set(artifact.id, artifact);
    // In a production system, add versioning, storage, and notifications here.
  }

  async resolve(uri: string): Promise<Artifact | undefined> {
    // Support artifact://id/... style
    try {
      const id = this.extractId(uri);
      return this.artifacts.get(id);
    } catch (e) {
      return undefined;
    }
  }

  extractId(uri: string): string {
    // artifact://uuid-123/path -> uuid-123
    if (uri.startsWith('artifact://')) {
      const rest = uri.replace('artifact://', '');
      const parts = rest.split('/');
      return parts[0];
    }

    // fallback: treat full uri as id
    return uri;
  }

  async list(): Promise<Artifact[]> {
    return Array.from(this.artifacts.values());
  }

  async remove(id: string): Promise<boolean> {
    return this.artifacts.delete(id);
  }
}

export const artifactRegistry = new ArtifactRegistry();
