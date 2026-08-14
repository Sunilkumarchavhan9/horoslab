import { randomUUID } from "node:crypto";
import type { CompilationDecision, PredictedEffect } from "./contracts";
import { compileChange, type ChangedFile } from "./analyzer";
import { decideCompilation } from "./verificationPlanner";
import { normalizeOrgId } from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";
import {
  getGitHubPullRequestDetail,
  type GitHubPullRequestDetail,
} from "../integrations/githubRepoBrowser";
import { createVerificationExperience } from "./experienceExtractor";

export type VerificationVerdict = "PASS" | "FAIL" | "UNKNOWN";

export type VerificationTimelineStep = {
  id: string;
  label: string;
  detail: string;
  status: "complete" | "active" | "pending";
};

export type VerificationFileEvidence = {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patchAvailable: boolean;
};

export type VerificationRecord = {
  id: string;
  createdAt: string;
  userId: string;
  orgId?: string;
  repository: string;
  pullRequestNumber: number;
  pullRequestTitle: string;
  pullRequestUrl: string | null;
  pullRequestHtmlUrl: string | null;
  headSha: string | null;
  baseRef: string | null;
  headRef: string | null;
  verdict: VerificationVerdict;
  confidence: number;
  evidenceReport: {
    summary: string;
    files: VerificationFileEvidence[];
    findings: string[];
    reviewSignals: {
      statusState: string | null;
      statusCount: number | null;
      reviews: number;
      reviewComments: number;
      comments: number;
    };
  };
  risks: string[];
  recommendedAction: string;
  predictedEffects: PredictedEffect[];
  compilerDecision: CompilationDecision;
  timeline: VerificationTimelineStep[];
};

export type VerificationStore = {
  create(record: VerificationRecord): Promise<VerificationRecord>;
  findById(id: string): Promise<VerificationRecord | undefined>;
  findBySource(
    repository: string,
    pullRequestNumber: number,
    headSha: string | null,
    orgId?: string,
    userId?: string,
  ): Promise<VerificationRecord | undefined>;
  list(userId: string, orgId?: string): Promise<VerificationRecord[]>;
};

const VERIFICATION_ARTIFACT_KIND = "reality_verification";

function verificationScopeKey(userId: string, orgId?: string): string {
  return `user:${userId}|org:${normalizeOrgId(orgId) ?? "default"}`;
}

function verificationSourceName(
  repository: string,
  pullRequestNumber: number,
  headSha: string | null,
): string {
  return `${repository}:${pullRequestNumber}:${headSha ?? "unknown"}`;
}

function recordToArtifact(record: VerificationRecord) {
  return {
    id: record.id,
    kind: VERIFICATION_ARTIFACT_KIND,
    scope: verificationScopeKey(record.userId, record.orgId),
    name: verificationSourceName(
      record.repository,
      record.pullRequestNumber,
      record.headSha,
    ),
    status: record.verdict,
    dataJson: JSON.stringify(record),
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
  } as const;
}

function parseVerificationRecord(raw: string): VerificationRecord | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Partial<VerificationRecord> & { id?: unknown };
    if (
      typeof record.id !== "string" ||
      typeof record.createdAt !== "string" ||
      typeof record.userId !== "string" ||
      typeof record.repository !== "string" ||
      typeof record.pullRequestNumber !== "number" ||
      typeof record.pullRequestTitle !== "string" ||
      typeof record.verdict !== "string" ||
      typeof record.confidence !== "number" ||
      !record.evidenceReport ||
      !record.risks ||
      !record.recommendedAction ||
      !record.compilerDecision ||
      !record.timeline
    ) {
      return null;
    }
    return record as VerificationRecord;
  } catch {
    return null;
  }
}

class PrismaVerificationStore implements VerificationStore {
  async create(record: VerificationRecord): Promise<VerificationRecord> {
    const artifact = recordToArtifact(record);
    await prisma.operationalArtifact.upsert({
      where: {
        kind_scope_name: {
          kind: artifact.kind,
          scope: artifact.scope,
          name: artifact.name,
        },
      },
      create: artifact,
      update: {
        status: artifact.status,
        dataJson: artifact.dataJson,
        updatedAt: artifact.updatedAt,
      },
    });
    return record;
  }

  async findById(id: string): Promise<VerificationRecord | undefined> {
    const row = await prisma.operationalArtifact.findUnique({
      where: { id },
    });
    if (!row || row.kind !== VERIFICATION_ARTIFACT_KIND) return undefined;
    return parseVerificationRecord(row.dataJson) ?? undefined;
  }

  async findBySource(
    repository: string,
    pullRequestNumber: number,
    headSha: string | null,
    orgId?: string,
    userId?: string,
  ): Promise<VerificationRecord | undefined> {
    if (!userId) return undefined;
    const row = await prisma.operationalArtifact.findFirst({
      where: {
        kind: VERIFICATION_ARTIFACT_KIND,
        scope: verificationScopeKey(userId, orgId),
        name: verificationSourceName(repository, pullRequestNumber, headSha),
      },
      orderBy: { createdAt: "desc" },
    });
    return row ? parseVerificationRecord(row.dataJson) ?? undefined : undefined;
  }

  async list(userId: string, orgId?: string): Promise<VerificationRecord[]> {
    const rows = await prisma.operationalArtifact.findMany({
      where: {
        kind: VERIFICATION_ARTIFACT_KIND,
        scope: verificationScopeKey(userId, orgId),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows
      .map((row) => parseVerificationRecord(row.dataJson))
      .filter((record): record is VerificationRecord => Boolean(record));
  }
}

export const verificationStore = new PrismaVerificationStore();

function clampConfidence(value: number): number {
  const normalized = Number.isFinite(value) ? value : 0.5;
  return Math.max(0.5, Math.min(0.99, Math.round(normalized * 100) / 100));
}

function parseFiles(detail: GitHubPullRequestDetail): ChangedFile[] {
  return detail.files.map((file) => ({
    path: file.filename,
    patch: file.patch ?? undefined,
    operation:
      file.status === "added" ||
      file.status === "modified" ||
      file.status === "removed" ||
      file.status === "renamed"
        ? file.status === "removed"
          ? "delete"
          : file.status === "renamed"
            ? "rename"
            : file.status === "added"
              ? "add"
              : "modify"
        : "modify",
  }));
}

function verdictFromDecision(decision: CompilationDecision["decision"]): VerificationVerdict {
  if (decision === "PASS") return "PASS";
  if (decision === "BLOCK") return "FAIL";
  return "UNKNOWN";
}

function buildConfidence(
  verdict: VerificationVerdict,
  detail: GitHubPullRequestDetail,
  decision: CompilationDecision,
): number {
  let confidence =
    verdict === "PASS"
      ? 0.84
      : verdict === "FAIL"
        ? 0.93
        : 0.68;

  if (detail.statusState === "success") confidence += 0.06;
  if (detail.statusState === "failure") confidence += 0.02;
  if (detail.statusState === "pending") confidence -= 0.03;
  if (detail.reviews.some((review) => review.state === "APPROVED")) {
    confidence += 0.03;
  }
  if (detail.reviewComments > 0) confidence += 0.01;
  if (detail.comments > 0) confidence += 0.01;
  if (detail.changedFiles > 20) confidence -= 0.02;
  if (decision.reasons.some((reason) => /unknown/i.test(reason))) confidence -= 0.02;

  return clampConfidence(confidence);
}

function buildFindings(
  detail: GitHubPullRequestDetail,
  decision: CompilationDecision,
  predictedEffects: PredictedEffect[],
): string[] {
  const findings = new Set<string>();
  findings.add(
    `${detail.changedFiles} changed file${detail.changedFiles === 1 ? "" : "s"} in ${detail.additions} additions and ${detail.deletions} deletions.`,
  );
  if (detail.statusState) {
    findings.add(`Combined status checks are ${detail.statusState}.`);
  }
  if (detail.reviews.length > 0) {
    findings.add(`${detail.reviews.length} review${detail.reviews.length === 1 ? "" : "s"} are attached to the PR.`);
  }
  for (const reason of decision.reasons) {
    findings.add(reason);
  }
  for (const invariant of decision.invariantResults) {
    findings.add(
      `${invariant.id}: ${invariant.status.toUpperCase()}${invariant.evidence.length ? ` (${invariant.evidence.join(", ")})` : ""}.`,
    );
  }
  for (const effect of predictedEffects) {
    findings.add(`${effect.domain.toUpperCase()} risk: ${effect.hypothesis}`);
  }
  return Array.from(findings);
}

function buildRisks(
  verdict: VerificationVerdict,
  decision: CompilationDecision,
  predictedEffects: PredictedEffect[],
): string[] {
  const risks = new Set<string>();
  if (verdict === "FAIL") {
    risks.add("A blocking invariant failed, so merging now may ship a broken change.");
  }
  if (verdict === "UNKNOWN") {
    risks.add("The verifier could not reach a fully trusted conclusion with the current evidence.");
  }
  for (const effect of predictedEffects) {
    risks.add(`${effect.domain}: ${effect.hypothesis}`);
  }
  for (const invariant of decision.invariantResults) {
    if (invariant.status === "unknown" && invariant.repair) {
      risks.add(invariant.repair);
    }
    if (invariant.status === "fail" && invariant.repair) {
      risks.add(invariant.repair);
    }
  }
  if (decision.reasons.length > 0) {
    for (const reason of decision.reasons) {
      risks.add(reason);
    }
  }
  return Array.from(risks);
}

function buildRecommendedAction(
  verdict: VerificationVerdict,
  decision: CompilationDecision,
): string {
  if (verdict === "PASS") {
    return "Safe to merge after final human review.";
  }
  if (verdict === "FAIL") {
    const repair = decision.invariantResults.find((item) => item.status === "fail" && item.repair)?.repair;
    return repair ?? "Fix the blocking issue and rerun verification.";
  }
  const repair = decision.invariantResults.find((item) => item.status !== "pass" && item.repair)?.repair;
  return repair ?? "Add the missing evidence, then rerun verification.";
}

function buildTimeline(verdict: VerificationVerdict): VerificationTimelineStep[] {
  const steps: Array<[string, string]> = [
    ["scan", "Scanning repo and pull request"],
    ["evidence", "Collecting evidence"],
    ["policy", "Checking policy and invariants"],
    ["reason", "Running reasoning"],
    ["report", "Generating report"],
  ];
  return steps.map(([id, label], index) => ({
    id,
    label,
    detail:
      index === steps.length - 1
        ? `Verification completed with ${verdict}.`
        : "Completed in this verification run.",
    status: index === steps.length - 1 ? "active" : "complete",
  }));
}

function summarizeEvidence(
  detail: GitHubPullRequestDetail,
  verdict: VerificationVerdict,
): string {
  const fileCount = detail.files.length;
  const statusText = detail.statusState ? `Status checks: ${detail.statusState}.` : "No combined status checks were reported.";
  return [
    `${detail.title} was analyzed across ${fileCount} file${fileCount === 1 ? "" : "s"}.`,
    `The verifier returned ${verdict}.`,
    statusText,
  ].join(" ");
}

export async function verifyPullRequest(input: {
  userId: string;
  orgId?: string;
  owner: string;
  repo: string;
  pullRequestNumber: number;
  fileLimit?: number;
}): Promise<{ record: VerificationRecord; duplicate: boolean }> {
  const detail = await getGitHubPullRequestDetail({
    userId: input.userId,
    orgId: input.orgId,
    owner: input.owner,
    repo: input.repo,
    number: input.pullRequestNumber,
    fileLimit: input.fileLimit,
  });

  const repository = `${input.owner.trim()}/${input.repo.trim()}`;
  const existing = await verificationStore.findBySource(
    repository,
    detail.number,
    detail.headSha,
    input.orgId,
    input.userId,
  );
  if (existing) {
    return { record: existing, duplicate: true };
  }

  const changedFiles = parseFiles(detail);
  const compiled = compileChange(changedFiles);
  const compilerDecision = decideCompilation(
    compiled.changeIR,
    compiled.predictedEffects,
  );
  const verdict = verdictFromDecision(compilerDecision.decision);
  const confidence = buildConfidence(verdict, detail, compilerDecision);
  const findings = buildFindings(
    detail,
    compilerDecision,
    compiled.predictedEffects,
  );
  const risks = buildRisks(verdict, compilerDecision, compiled.predictedEffects);
  const createdAt = new Date().toISOString();
  const record: VerificationRecord = {
    id: randomUUID(),
    createdAt,
    userId: input.userId,
    orgId: input.orgId,
    repository,
    pullRequestNumber: detail.number,
    pullRequestTitle: detail.title,
    pullRequestUrl: detail.htmlUrl,
    pullRequestHtmlUrl: detail.htmlUrl,
    headSha: detail.headSha,
    baseRef: detail.baseRef,
    headRef: detail.headRef,
    verdict,
    confidence,
    evidenceReport: {
      summary: summarizeEvidence(detail, verdict),
      files: detail.files.map((file) => ({
        path: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patchAvailable: Boolean(file.patch),
      })),
      findings,
      reviewSignals: {
        statusState: detail.statusState,
        statusCount: detail.statusCount,
        reviews: detail.reviews.length,
        reviewComments: detail.reviewComments,
        comments: detail.comments,
      },
    },
    risks,
    recommendedAction: buildRecommendedAction(verdict, compilerDecision),
    predictedEffects: compiled.predictedEffects,
    compilerDecision,
    timeline: buildTimeline(verdict),
  };

  const stored = await verificationStore.create(record);
  await createVerificationExperience({
    verification: stored,
    detail,
  }).catch((error) => {
    console.warn(
      "[RealityCompiler] experience capture failed:",
      error instanceof Error ? error.message : error,
    );
  });

  return { record: stored, duplicate: false };
}
