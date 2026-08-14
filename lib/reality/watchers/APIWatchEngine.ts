import { randomUUID } from "node:crypto";

export type APIWatchState = "healthy" | "degraded" | "offline" | "monitoring";

export interface APIWatchTarget {
  id: string;
  provider: string;
  state: APIWatchState;
  lastCheckedAt: string | null;
  lastIssueAt: string | null;
  issueCount: number;
  metadata: Record<string, unknown>;
}

export interface APIWatchCheck {
  provider: string;
  state?: APIWatchState;
  metadata?: Record<string, unknown>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneTarget(target: APIWatchTarget): APIWatchTarget {
  return {
    ...target,
    metadata: { ...target.metadata },
  };
}

function seedTarget(provider: string, metadata: Record<string, unknown> = {}): APIWatchTarget {
  return {
    id: `api-watch-${provider.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomUUID().slice(0, 8)}`,
    provider,
    state: "healthy",
    lastCheckedAt: "2026-07-27T00:00:00.000Z",
    lastIssueAt: null,
    issueCount: 0,
    metadata,
  };
}

export class APIWatchEngine {
  private readonly seedTargets: APIWatchTarget[];

  private targets: Map<string, APIWatchTarget>;

  constructor(
    seedTargets: APIWatchTarget[] = [
      seedTarget("stripe", { category: "billing" }),
      seedTarget("github", { category: "source-control" }),
      seedTarget("openai", { category: "ai-platform" }),
      seedTarget("aws", { category: "infrastructure" }),
    ],
  ) {
    this.seedTargets = seedTargets.map(cloneTarget);
    this.targets = new Map(seedTargets.map((target) => [target.id, cloneTarget(target)]));
  }

  reset(): void {
    this.targets = new Map(this.seedTargets.map((target) => [target.id, cloneTarget(target)]));
  }

  list(): APIWatchTarget[] {
    return [...this.targets.values()].map(cloneTarget);
  }

  get(targetId: string): APIWatchTarget | null {
    const target = this.targets.get(targetId);
    return target ? cloneTarget(target) : null;
  }

  watch(provider: string, metadata: Record<string, unknown> = {}): APIWatchTarget {
    const existing = [...this.targets.values()].find((target) => target.provider === provider);
    if (existing) {
      const updated: APIWatchTarget = {
        ...existing,
        state: "monitoring",
        lastCheckedAt: nowIso(),
        metadata: { ...existing.metadata, ...metadata },
      };
      this.targets.set(updated.id, updated);
      return cloneTarget(updated);
    }

    const target: APIWatchTarget = {
      id: `api-watch-${provider.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomUUID().slice(0, 8)}`,
      provider,
      state: "monitoring",
      lastCheckedAt: nowIso(),
      lastIssueAt: null,
      issueCount: 0,
      metadata,
    };
    this.targets.set(target.id, target);
    return cloneTarget(target);
  }

  check(input: APIWatchCheck): APIWatchTarget | null {
    const existing = [...this.targets.values()].find((target) => target.provider === input.provider);
    if (!existing) return null;

    const state = input.state ?? "healthy";
    const updated: APIWatchTarget = {
      ...existing,
      state,
      lastCheckedAt: nowIso(),
      lastIssueAt: state === "healthy" ? existing.lastIssueAt : nowIso(),
      issueCount: state === "healthy" ? existing.issueCount : existing.issueCount + 1,
      metadata: { ...existing.metadata, ...(input.metadata ?? {}) },
    };
    this.targets.set(updated.id, updated);
    return cloneTarget(updated);
  }

  summary(): {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
    monitoring: number;
  } {
    const targets = this.list();
    return {
      total: targets.length,
      healthy: targets.filter((target) => target.state === "healthy").length,
      degraded: targets.filter((target) => target.state === "degraded").length,
      offline: targets.filter((target) => target.state === "offline").length,
      monitoring: targets.filter((target) => target.state === "monitoring").length,
    };
  }
}
