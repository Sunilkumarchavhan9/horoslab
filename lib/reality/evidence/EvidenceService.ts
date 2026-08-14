import { randomUUID } from "node:crypto";
import type { RealityEvidence } from "../models/RealityTypes";
import type { EvidenceRepository } from "../repositories/EvidenceRepository";
import { createMemoryEvidenceRepository } from "../repositories/memory/InMemoryEvidenceRepository";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeConfidence(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0.8;
  return Math.min(1, Math.max(0, value));
}

function cloneEvidence(evidence: RealityEvidence): RealityEvidence {
  return {
    ...evidence,
    metadata: { ...evidence.metadata },
  };
}

export class EvidenceService {
  constructor(private readonly repository: EvidenceRepository = createMemoryEvidenceRepository()) {}

  reset(): void {
    this.repository.reset();
  }

  record(input: {
    nodeId: string;
    title: string;
    summary: string;
    sourceConnector: string;
    sourceId: string;
    author: string;
    workspace: string;
    confidence?: number;
    sourceUrl?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }): RealityEvidence {
    const evidence: RealityEvidence = {
      id: `evidence-${randomUUID()}`,
      nodeId: input.nodeId,
      title: input.title,
      summary: input.summary,
      sourceConnector: input.sourceConnector,
      sourceId: input.sourceId,
      timestamp: input.timestamp ?? nowIso(),
      author: input.author,
      workspace: input.workspace,
      confidence: normalizeConfidence(input.confidence),
      ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
      metadata: input.metadata ?? {},
    };
    return this.repository.save(evidence);
  }

  get(evidenceId: string): RealityEvidence | null {
    const evidence = this.repository.getById(evidenceId);
    return evidence ? cloneEvidence(evidence) : null;
  }

  list(): RealityEvidence[] {
    return this.repository.list().map(cloneEvidence);
  }

  search(query: string): RealityEvidence[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return this.list();
    return this.list().filter((evidence) => {
      const corpus = [
        evidence.id,
        evidence.nodeId,
        evidence.title,
        evidence.summary,
        evidence.sourceConnector,
        evidence.sourceId,
        evidence.author,
        evidence.workspace,
        evidence.sourceUrl ?? "",
        JSON.stringify(evidence.metadata),
      ]
        .join(" ")
        .toLowerCase();
      return corpus.includes(normalized);
    });
  }
}
