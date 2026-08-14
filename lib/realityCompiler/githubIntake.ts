import { createHmac, timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";
import type { CompilationDecision, IntentContract, ChangeIR, PredictedEffect } from "./contracts";
import type { ChangedFile } from "./analyzer";
import { compileChange } from "./analyzer";
import { decideCompilation } from "./verificationPlanner";

export const SUPPORTED_PULL_REQUEST_ACTIONS = new Set([
  "opened",
  "synchronize",
  "reopened",
  "ready_for_review",
]);

export type GitHubPullRequestPayload = {
  action?: string;
  repository?: { full_name?: string; html_url?: string };
  pull_request?: {
    number?: number;
    title?: string;
    html_url?: string;
    draft?: boolean;
    base?: { sha?: string };
    head?: { sha?: string };
  };
};

export type CompilationRecord = {
  id: string;
  eventId: string;
  repository: string;
  pullRequest: number;
  title: string;
  url?: string;
  baseSha: string;
  headSha: string;
  action: string;
  intent: IntentContract;
  changeIR: ChangeIR;
  predictedEffects: PredictedEffect[];
  decision: CompilationDecision;
  createdAt: string;
};

export interface CompilationStore {
  findByEventId(eventId: string): Promise<CompilationRecord | undefined>;
  findBySource(repository: string, pullRequest: number, headSha: string): Promise<CompilationRecord | undefined>;
  create(record: CompilationRecord): Promise<CompilationRecord>;
  list(): Promise<CompilationRecord[]>;
}

export class InMemoryCompilationStore implements CompilationStore {
  private readonly records = new Map<string, CompilationRecord>();

  async findByEventId(eventId: string): Promise<CompilationRecord | undefined> {
    return this.records.get(`event:${eventId}`);
  }

  async findBySource(repository: string, pullRequest: number, headSha: string): Promise<CompilationRecord | undefined> {
    return this.records.get(`source:${repository}:${pullRequest}:${headSha}`);
  }

  async create(record: CompilationRecord): Promise<CompilationRecord> {
    this.records.set(`event:${record.eventId}`, record);
    this.records.set(`source:${record.repository}:${record.pullRequest}:${record.headSha}`, record);
    return record;
  }

  async list(): Promise<CompilationRecord[]> {
    return Array.from(new Map(Array.from(this.records.values()).map((record) => [record.id, record])).values());
  }
}

export function verifyGitHubSignature(payload: Buffer | string, signature: string | undefined, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function parseGitHubPayload(body: Buffer | string | GitHubPullRequestPayload): GitHubPullRequestPayload {
  if (typeof body === "object" && !Buffer.isBuffer(body)) return body;
  const value = JSON.parse(Buffer.isBuffer(body) ? body.toString("utf8") : body) as unknown;
  if (!value || typeof value !== "object") throw new Error("GitHub webhook body must be an object");
  return value as GitHubPullRequestPayload;
}

export async function compileGitHubPullRequest(input: {
  eventId: string;
  action: string;
  payload: GitHubPullRequestPayload;
  files: ChangedFile[];
  store: CompilationStore;
}): Promise<{ record: CompilationRecord; duplicate: boolean }> {
  const existingEvent = await input.store.findByEventId(input.eventId);
  if (existingEvent) return { record: existingEvent, duplicate: true };
  const repository = input.payload.repository?.full_name;
  const pullRequest = input.payload.pull_request;
  const number = pullRequest?.number;
  const baseSha = pullRequest?.base?.sha;
  const headSha = pullRequest?.head?.sha;
  if (!repository || !number || !baseSha || !headSha) throw new Error("GitHub pull request payload is missing repository or SHA metadata");
  const existingSource = await input.store.findBySource(repository, number, headSha);
  if (existingSource) return { record: existingSource, duplicate: true };
  const compiled = compileChange(input.files);
  const plannedDecision = decideCompilation(compiled.changeIR, compiled.predictedEffects);
  const decision = input.files.length > 0
    ? plannedDecision
    : {
        ...plannedDecision,
        decision: "CONDITIONAL" as const,
        reasons: ["Pull request file diff has not been fetched; verification is incomplete."],
        verificationPlan: {
          ...plannedDecision.verificationPlan,
          unknowns: ["Pull request file diff is unavailable at intake time."],
        },
      };
  const record: CompilationRecord = {
    id: randomUUID(),
    eventId: input.eventId,
    repository,
    pullRequest: number,
    title: pullRequest.title ?? `Pull request #${number}`,
    url: pullRequest.html_url,
    baseSha,
    headSha,
    action: input.action,
    intent: compiled.intent,
    changeIR: compiled.changeIR,
    predictedEffects: compiled.predictedEffects,
    decision,
    createdAt: new Date().toISOString(),
  };
  return { record: await input.store.create(record), duplicate: false };
}
