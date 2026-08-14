import { createHash } from "crypto";
import { prisma } from "../storage/prismaClient";
import { verificationScopeKey } from "./experienceScope";

type ExperienceProof = {
  repository?: string;
  pullRequestNumber?: number;
  verdict?: "PASS" | "FAIL" | "UNKNOWN" | string;
  confidence?: number;
  problem?: string;
  rootCause?: string;
  wrongAttempts?: string[];
  correctSolution?: string;
  lesson?: string;
  bestPractice?: string;
  antiPattern?: string;
  files?: string[];
  language?: string;
  framework?: string;
  mission?: {
    title?: string;
  };
};

type ExperienceRecordRow = Awaited<ReturnType<typeof prisma.experienceRecord.findMany>>[number];

export type ExperienceSimilarityItem = {
  id: string;
  title: string;
  repository: string;
  pullRequestNumber: number;
  pullRequestTitle: string;
  verdict: "PASS" | "FAIL" | "UNKNOWN";
  confidence: number;
  score: number;
  similarity: number;
  reasoning: string[];
  rootCause: string;
  lesson: string;
  bestPractice: string;
  antiPattern: string;
  language: string;
  framework: string;
  files: string[];
  createdAt: string;
};

export type ExperienceRecommendation = {
  id: string;
  type: "lesson" | "failure_pattern" | "root_cause" | "next_action";
  title: string;
  reason: string;
  recommendedAction: string;
  confidence: number;
  count: number;
  repositories: string[];
  verdicts: Array<"PASS" | "FAIL" | "UNKNOWN">;
  exampleExperienceIds: string[];
  latestAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(query?: string): string[] {
  if (!query) return [];
  return normalize(query)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function compactId(prefix: string, value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  if (slug.length > 0) return `${prefix}-${slug}`;
  return `${prefix}-${createHash("sha1").update(value).digest("hex").slice(0, 10)}`;
}

function parseProof(value: unknown): ExperienceProof {
  if (!isRecord(value)) return {};
  return {
    repository: typeof value.repository === "string" ? value.repository : undefined,
    pullRequestNumber: typeof value.pullRequestNumber === "number" ? value.pullRequestNumber : undefined,
    verdict:
      value.verdict === "PASS" || value.verdict === "FAIL" || value.verdict === "UNKNOWN"
        ? value.verdict
        : typeof value.verdict === "string"
          ? value.verdict
          : undefined,
    confidence: typeof value.confidence === "number" ? value.confidence : undefined,
    problem: typeof value.problem === "string" ? value.problem : undefined,
    rootCause: typeof value.rootCause === "string" ? value.rootCause : undefined,
    wrongAttempts: asStringArray(value.wrongAttempts),
    correctSolution: typeof value.correctSolution === "string" ? value.correctSolution : undefined,
    lesson: typeof value.lesson === "string" ? value.lesson : undefined,
    bestPractice: typeof value.bestPractice === "string" ? value.bestPractice : undefined,
    antiPattern: typeof value.antiPattern === "string" ? value.antiPattern : undefined,
    files: asStringArray(value.files),
    language: typeof value.language === "string" ? value.language : undefined,
    framework: typeof value.framework === "string" ? value.framework : undefined,
    mission: isRecord(value.mission) ? { title: typeof value.mission.title === "string" ? value.mission.title : undefined } : undefined,
  };
}

async function listWorkspaceExperiences(userId: string, orgId?: string): Promise<ExperienceRecordRow[]> {
  return prisma.experienceRecord.findMany({
    where: { workspaceId: verificationScopeKey(userId, orgId) },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

function scoreAgainstQuery(record: ExperienceRecordRow, proof: ExperienceProof, queryTokens: string[]): { score: number; reasons: string[] } {
  if (queryTokens.length === 0) {
    return { score: 0, reasons: [] };
  }

  const fields: Array<{ label: string; value: string; weight: number }> = [
    { label: "title", value: record.title, weight: 4 },
    { label: "summary", value: record.summary, weight: 3 },
    { label: "lesson", value: proof.lesson ?? record.lesson, weight: 4 },
    { label: "rootCause", value: proof.rootCause ?? "", weight: 4 },
    { label: "problem", value: proof.problem ?? "", weight: 3 },
    { label: "correctSolution", value: proof.correctSolution ?? "", weight: 3 },
    { label: "bestPractice", value: proof.bestPractice ?? "", weight: 2 },
    { label: "antiPattern", value: proof.antiPattern ?? "", weight: 2 },
    { label: "repository", value: proof.repository ?? "", weight: 2 },
    { label: "language", value: proof.language ?? "", weight: 1 },
    { label: "framework", value: proof.framework ?? "", weight: 1 },
    { label: "files", value: (proof.files ?? []).join(" "), weight: 1 },
  ];

  let score = 0;
  const reasons = new Set<string>();
  for (const token of queryTokens) {
    for (const field of fields) {
      if (normalize(field.value).includes(token)) {
        score += field.weight;
        reasons.add(`${field.label}:${token}`);
      }
    }
  }

  return { score, reasons: [...reasons] };
}

function scoreSimilarity(
  record: ExperienceRecordRow,
  proof: ExperienceProof,
  target: {
    repository?: string;
    verdict?: string;
    language?: string;
    framework?: string;
    rootCause?: string;
    lesson?: string;
    antiPattern?: string;
    files?: string[];
    queryTokens: string[];
  },
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const tokens = target.queryTokens;
  const haystack = normalize([
    record.title,
    record.summary,
    proof.lesson ?? record.lesson,
    proof.rootCause ?? "",
    proof.problem ?? "",
    proof.correctSolution ?? "",
    proof.bestPractice ?? "",
    proof.antiPattern ?? "",
    proof.repository ?? "",
    proof.language ?? "",
    proof.framework ?? "",
    (proof.files ?? []).join(" "),
  ].join(" "));

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 3;
      reasons.push(`query:${token}`);
    }
  }

  if (target.repository && proof.repository === target.repository) {
    score += 15;
    reasons.push("same_repository");
  }
  if (target.language && proof.language === target.language) {
    score += 10;
    reasons.push("same_language");
  }
  if (target.framework && proof.framework === target.framework) {
    score += 8;
    reasons.push("same_framework");
  }
  if (target.verdict && proof.verdict === target.verdict) {
    score += 6;
    reasons.push("same_verdict");
  }

  const recordFiles = new Set((proof.files ?? []).map((file) => file.toLowerCase()));
  const targetFiles = new Set((target.files ?? []).map((file) => file.toLowerCase()));
  const sharedFiles = [...targetFiles].filter((file) => recordFiles.has(file));
  if (sharedFiles.length > 0) {
    score += Math.min(12, sharedFiles.length * 4);
    reasons.push(`shared_files:${sharedFiles.length}`);
  }

  const targetRootCause = normalize(target.rootCause ?? "");
  const targetLesson = normalize(target.lesson ?? "");
  const targetAntiPattern = normalize(target.antiPattern ?? "");
  const fieldMatches = [
    targetRootCause && normalize(proof.rootCause ?? "").includes(targetRootCause) ? "root_cause" : null,
    targetLesson && normalize(proof.lesson ?? record.lesson).includes(targetLesson) ? "lesson" : null,
    targetAntiPattern && normalize(proof.antiPattern ?? "").includes(targetAntiPattern) ? "anti_pattern" : null,
  ].filter((item): item is string => Boolean(item));

  if (fieldMatches.includes("root_cause")) {
    score += 12;
    reasons.push("root_cause_match");
  }
  if (fieldMatches.includes("lesson")) {
    score += 8;
    reasons.push("lesson_match");
  }
  if (fieldMatches.includes("anti_pattern")) {
    score += 8;
    reasons.push("anti_pattern_match");
  }

  const freshnessDays = Math.max(0, Math.floor((Date.now() - record.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  score += Math.max(0, 12 - Math.min(12, freshnessDays / 7));

  return { score, reasons };
}

function toSimilarityItem(
  record: ExperienceRecordRow,
  proof: ExperienceProof,
  score: number,
  reasons: string[],
  similarity: number,
): ExperienceSimilarityItem {
  return {
    id: record.id,
    title: record.title,
    repository: proof.repository ?? "unknown/unknown",
    pullRequestNumber: proof.pullRequestNumber ?? 0,
    pullRequestTitle: proof.mission?.title ?? record.title,
    verdict: proof.verdict === "PASS" || proof.verdict === "FAIL" || proof.verdict === "UNKNOWN" ? proof.verdict : "UNKNOWN",
    confidence: record.confidence,
    score,
    similarity,
    reasoning: reasons,
    rootCause: proof.rootCause ?? "",
    lesson: proof.lesson ?? record.lesson,
    bestPractice: proof.bestPractice ?? "",
    antiPattern: proof.antiPattern ?? "",
    language: proof.language ?? "Unknown",
    framework: proof.framework ?? "Unknown",
    files: proof.files ?? [],
    createdAt: record.createdAt.toISOString(),
  };
}

function aggregateRecommendations(
  records: ExperienceRecordRow[],
  kind: ExperienceRecommendation["type"],
  selectTitle: (proof: ExperienceProof, record: ExperienceRecordRow) => string,
  selectReason: (proof: ExperienceProof, record: ExperienceRecordRow) => string,
  selectAction: (proof: ExperienceProof, record: ExperienceRecordRow) => string,
  filter: (proof: ExperienceProof, record: ExperienceRecordRow) => boolean,
): ExperienceRecommendation[] {
  const groups = new Map<string, {
    title: string;
    reason: string;
    action: string;
    count: number;
    confidenceTotal: number;
    repositories: Set<string>;
    verdicts: Set<"PASS" | "FAIL" | "UNKNOWN">;
    exampleIds: Set<string>;
    latestAt: string;
  }>();

  for (const record of records) {
    const proof = parseProof(record.proof);
    if (!filter(proof, record)) continue;
    const title = selectTitle(proof, record);
    const reason = selectReason(proof, record);
    const action = selectAction(proof, record);
    const key = `${kind}:${normalize(title)}:${normalize(reason)}:${normalize(action)}`;
    const group = groups.get(key) ?? {
      title,
      reason,
      action,
      count: 0,
      confidenceTotal: 0,
      repositories: new Set<string>(),
      verdicts: new Set<"PASS" | "FAIL" | "UNKNOWN">(),
      exampleIds: new Set<string>(),
      latestAt: record.createdAt.toISOString(),
    };

    group.count += 1;
    group.confidenceTotal += record.confidence;
    if (proof.repository) group.repositories.add(proof.repository);
    if (proof.verdict === "PASS" || proof.verdict === "FAIL" || proof.verdict === "UNKNOWN") {
      group.verdicts.add(proof.verdict);
    }
    group.exampleIds.add(record.id);
    if (record.createdAt.toISOString() > group.latestAt) {
      group.latestAt = record.createdAt.toISOString();
    }

    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([key, group]) => ({
      id: compactId("rec", key),
      type: kind,
      title: group.title,
      reason: group.reason,
      recommendedAction: group.action,
      confidence: Math.min(100, Math.round(group.confidenceTotal / Math.max(1, group.count))),
      count: group.count,
      repositories: [...group.repositories],
      verdicts: [...group.verdicts],
      exampleExperienceIds: [...group.exampleIds].slice(0, 5),
      latestAt: group.latestAt,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.latestAt.localeCompare(a.latestAt);
    });
}

export async function findSimilarExperiences(input: {
  userId: string;
  orgId?: string;
  query?: string;
  experienceId?: string;
  repository?: string;
  verdict?: string;
  limit?: number;
}): Promise<{
  query: string;
  experienceId: string | null;
  total: number;
  results: ExperienceSimilarityItem[];
}> {
  const limit = Math.max(1, Math.min(50, input.limit ?? 10));
  const query = input.query?.trim() ?? "";
  const records = await listWorkspaceExperiences(input.userId, input.orgId);
  const queryTokens = tokenize(query);
  let targetRecord: ExperienceRecordRow | null = null;

  if (input.experienceId) {
    targetRecord = records.find((record) => record.id === input.experienceId) ?? null;
  }

  if (targetRecord) {
    const targetProof = parseProof(targetRecord.proof);
    const similar = records
      .filter((record) => record.id !== targetRecord?.id)
      .map((record) => {
        const proof = parseProof(record.proof);
        const { score, reasons } = scoreSimilarity(record, proof, {
          repository: targetProof.repository,
          verdict: targetProof.verdict,
          language: targetProof.language,
          framework: targetProof.framework,
          rootCause: targetProof.rootCause,
          lesson: targetProof.lesson,
          antiPattern: targetProof.antiPattern,
          files: targetProof.files,
          queryTokens: [targetRecord.title, targetRecord.summary, targetProof.lesson ?? "", targetProof.rootCause ?? ""].flatMap((value) => tokenize(value)),
        });
        const similarity = Math.max(0, Math.min(100, Math.round(score)));
        return { record, proof, score, reasons, similarity };
      })
      .sort((a, b) => {
        if (b.similarity !== a.similarity) return b.similarity - a.similarity;
        return b.record.createdAt.getTime() - a.record.createdAt.getTime();
      });

    const filtered = similar.filter((item) => {
      if (input.repository && item.proof.repository !== input.repository) return false;
      if (input.verdict && item.proof.verdict !== input.verdict) return false;
      return true;
    });

    return {
      query: query || targetRecord.title,
      experienceId: targetRecord.id,
      total: filtered.length,
      results: filtered.slice(0, limit).map((item) => toSimilarityItem(item.record, item.proof, item.score, item.reasons, item.similarity)),
    };
  }

  const filtered = records
    .map((record) => {
      const proof = parseProof(record.proof);
      if (input.repository && proof.repository !== input.repository) return null;
      if (input.verdict && proof.verdict !== input.verdict) return null;
      const { score, reasons } = scoreAgainstQuery(record, proof, queryTokens);
      if (queryTokens.length > 0 && score === 0) return null;
      const similarity = Math.max(0, Math.min(100, Math.round(score * 3)));
      return { record, proof, score, reasons, similarity };
    })
    .filter((item): item is { record: ExperienceRecordRow; proof: ExperienceProof; score: number; reasons: string[]; similarity: number } => item !== null)
    .sort((a, b) => {
      if (b.similarity !== a.similarity) return b.similarity - a.similarity;
      return b.record.createdAt.getTime() - a.record.createdAt.getTime();
    });

  return {
    query,
    experienceId: null,
    total: filtered.length,
    results: filtered.slice(0, limit).map((item) => toSimilarityItem(item.record, item.proof, item.score, item.reasons, item.similarity)),
  };
}

export async function buildExperienceRecommendations(input: {
  userId: string;
  orgId?: string;
  query?: string;
  repository?: string;
  verdict?: string;
  limit?: number;
}): Promise<{
  query: string;
  total: number;
  recommendations: ExperienceRecommendation[];
}> {
  const limit = Math.max(1, Math.min(50, input.limit ?? 10));
  const query = input.query?.trim() ?? "";
  const queryTokens = tokenize(query);
  const records = await listWorkspaceExperiences(input.userId, input.orgId);

  const filtered = records.filter((record) => {
    const proof = parseProof(record.proof);
    if (input.repository && proof.repository !== input.repository) return false;
    if (input.verdict && proof.verdict !== input.verdict) return false;
    if (queryTokens.length === 0) return true;
    const { score } = scoreAgainstQuery(record, proof, queryTokens);
    return score > 0;
  });

  const lessons = aggregateRecommendations(
    filtered,
    "lesson",
    (proof, record) => proof.lesson?.trim() || record.lesson.trim() || "Unspecified lesson",
    (proof, record) => proof.rootCause?.trim() || record.summary.trim() || record.title,
    (proof, record) => proof.lesson?.trim() || `Preserve ${proof.repository ?? "this repository"} when the evidence pattern repeats.`,
    () => true,
  );

  const failurePatterns = aggregateRecommendations(
    filtered,
    "failure_pattern",
    (proof, record) => proof.antiPattern?.trim() || proof.rootCause?.trim() || record.title,
    (proof, record) => proof.rootCause?.trim() || record.summary.trim() || record.title,
    (proof, record) => proof.antiPattern?.trim() || `Avoid repeating ${proof.rootCause ?? record.summary}.`,
    (proof, record) => (proof.verdict === "FAIL" || proof.verdict === "UNKNOWN") && Boolean(proof.antiPattern || proof.rootCause || record.title),
  );

  const rootCauses = aggregateRecommendations(
    filtered,
    "root_cause",
    (proof, record) => proof.rootCause?.trim() || record.summary.trim() || record.title,
    (proof, record) => proof.rootCause?.trim() || record.summary.trim() || record.title,
    (proof, record) => proof.correctSolution?.trim() || proof.lesson?.trim() || `Resolve ${proof.rootCause ?? record.summary}.`,
    () => true,
  );

  const nextActions = aggregateRecommendations(
    filtered,
    "next_action",
    (proof, record) => proof.lesson?.trim() || record.title,
    (proof, record) => proof.rootCause?.trim() || record.summary.trim() || record.title,
    (proof, record) => proof.bestPractice?.trim() || proof.correctSolution?.trim() || `Apply the fix pattern from ${proof.repository ?? record.title}.`,
    () => true,
  );

  const merged = [...lessons, ...failurePatterns, ...rootCauses, ...nextActions]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.latestAt.localeCompare(a.latestAt);
    })
    .slice(0, limit);

  return {
    query,
    total: merged.length,
    recommendations: merged,
  };
}
