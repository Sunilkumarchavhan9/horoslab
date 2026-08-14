import { createHash } from "crypto";
import { prisma } from "../storage/prismaClient";
import { verificationScopeKey } from "./experienceScope";

type VerificationExperienceProof = {
  repository?: string;
  pullRequestNumber?: number;
  verdict?: "PASS" | "FAIL" | "UNKNOWN" | string;
  confidence?: number;
  mission?: {
    owner?: string;
    repo?: string;
    title?: string;
    url?: string | null;
    headSha?: string | null;
    baseRef?: string | null;
    headRef?: string | null;
  };
  problem?: string;
  rootCause?: string;
  wrongAttempts?: unknown[];
  correctSolution?: string;
  evidence?: {
    summary?: string;
    findings?: string[];
    files?: Array<{
      path?: string;
      status?: string;
      additions?: number;
      deletions?: number;
      changes?: number;
      patchAvailable?: boolean;
    }>;
  };
  tests?: string[];
  lesson?: string;
  bestPractice?: string;
  antiPattern?: string;
  files?: string[];
  language?: string;
  framework?: string;
};

type ExperienceRecordRow = Awaited<ReturnType<typeof prisma.experienceRecord.findMany>>[number];

export type ExperienceSearchItem = {
  id: string;
  title: string;
  summary: string;
  lesson: string;
  rootCause: string;
  bestPractice: string;
  antiPattern: string;
  correctSolution: string;
  repository: string;
  pullRequestNumber: number;
  pullRequestTitle: string;
  verdict: "PASS" | "FAIL" | "UNKNOWN";
  confidence: number;
  language: string;
  framework: string;
  files: string[];
  wrongAttempts: string[];
  tests: string[];
  createdAt: string;
  updatedAt: string;
  score: number;
  matchReasons: string[];
};

export type ExperienceGroupItem = {
  id: string;
  title: string;
  count: number;
  confidence: number;
  repositories: string[];
  verdicts: Array<"PASS" | "FAIL" | "UNKNOWN">;
  rootCause: string;
  lesson: string;
  antiPattern: string;
  language: string;
  framework: string;
  files: string[];
  pullRequestNumbers: number[];
  latestAt: string;
  example: {
    id: string;
    repository: string;
    pullRequestTitle: string;
    pullRequestNumber: number;
  } | null;
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

function parseProof(value: unknown): VerificationExperienceProof {
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
    mission: isRecord(value.mission)
      ? {
          owner: typeof value.mission.owner === "string" ? value.mission.owner : undefined,
          repo: typeof value.mission.repo === "string" ? value.mission.repo : undefined,
          title: typeof value.mission.title === "string" ? value.mission.title : undefined,
          url: typeof value.mission.url === "string" ? value.mission.url : null,
          headSha: typeof value.mission.headSha === "string" ? value.mission.headSha : null,
          baseRef: typeof value.mission.baseRef === "string" ? value.mission.baseRef : null,
          headRef: typeof value.mission.headRef === "string" ? value.mission.headRef : null,
        }
      : undefined,
    problem: typeof value.problem === "string" ? value.problem : undefined,
    rootCause: typeof value.rootCause === "string" ? value.rootCause : undefined,
    wrongAttempts: asStringArray(value.wrongAttempts),
    correctSolution: typeof value.correctSolution === "string" ? value.correctSolution : undefined,
    evidence: isRecord(value.evidence)
      ? {
          summary: typeof value.evidence.summary === "string" ? value.evidence.summary : undefined,
          findings: asStringArray(value.evidence.findings),
          files: Array.isArray(value.evidence.files)
            ? value.evidence.files.filter(isRecord).map((file) => ({
                path: typeof file.path === "string" ? file.path : undefined,
                status: typeof file.status === "string" ? file.status : undefined,
                additions: typeof file.additions === "number" ? file.additions : undefined,
                deletions: typeof file.deletions === "number" ? file.deletions : undefined,
                changes: typeof file.changes === "number" ? file.changes : undefined,
                patchAvailable: typeof file.patchAvailable === "boolean" ? file.patchAvailable : undefined,
              }))
            : undefined,
        }
      : undefined,
    tests: asStringArray(value.tests),
    lesson: typeof value.lesson === "string" ? value.lesson : undefined,
    bestPractice: typeof value.bestPractice === "string" ? value.bestPractice : undefined,
    antiPattern: typeof value.antiPattern === "string" ? value.antiPattern : undefined,
    files: asStringArray(value.files),
    language: typeof value.language === "string" ? value.language : undefined,
    framework: typeof value.framework === "string" ? value.framework : undefined,
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function splitQuery(query?: string): string[] {
  if (!query) return [];
  return normalize(query)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function scoreRecord(record: ExperienceRecordRow, proof: VerificationExperienceProof, queryTokens: string[]): { score: number; matchReasons: string[] } {
  if (queryTokens.length === 0) {
    return { score: 0, matchReasons: [] };
  }

  const fields: Array<{ label: string; value: string; weight: number }> = [
    { label: "title", value: record.title, weight: 4 },
    { label: "lesson", value: record.lesson, weight: 4 },
    { label: "summary", value: record.summary, weight: 2 },
    { label: "rootCause", value: proof.rootCause ?? "", weight: 3 },
    { label: "problem", value: proof.problem ?? "", weight: 3 },
    { label: "correctSolution", value: proof.correctSolution ?? "", weight: 2 },
    { label: "bestPractice", value: proof.bestPractice ?? "", weight: 2 },
    { label: "antiPattern", value: proof.antiPattern ?? "", weight: 2 },
    { label: "repository", value: proof.repository ?? "", weight: 2 },
    { label: "mission", value: proof.mission?.title ?? "", weight: 2 },
    { label: "language", value: proof.language ?? "", weight: 1 },
    { label: "framework", value: proof.framework ?? "", weight: 1 },
    { label: "files", value: (proof.files ?? []).join(" "), weight: 1 },
  ];

  let score = 0;
  const matchReasons = new Set<string>();
  for (const token of queryTokens) {
    for (const field of fields) {
      const haystack = normalize(field.value);
      if (haystack.includes(token)) {
        score += field.weight;
        matchReasons.add(`${field.label}:${token}`);
      }
    }
  }

  return { score, matchReasons: [...matchReasons] };
}

async function listWorkspaceExperiences(userId: string, orgId?: string): Promise<ExperienceRecordRow[]> {
  return prisma.experienceRecord.findMany({
    where: { workspaceId: verificationScopeKey(userId, orgId) },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

function toSearchItem(record: ExperienceRecordRow, proof: VerificationExperienceProof, score = 0, matchReasons: string[] = []): ExperienceSearchItem {
  const repository = proof.repository ?? "unknown/unknown";
  const pullRequestNumber = proof.pullRequestNumber ?? 0;
  const verdict = proof.verdict === "PASS" || proof.verdict === "FAIL" || proof.verdict === "UNKNOWN"
    ? proof.verdict
    : "UNKNOWN";

  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    lesson: proof.lesson ?? record.lesson,
    rootCause: proof.rootCause ?? "",
    bestPractice: proof.bestPractice ?? "",
    antiPattern: proof.antiPattern ?? "",
    correctSolution: proof.correctSolution ?? "",
    repository,
    pullRequestNumber,
    pullRequestTitle: proof.mission?.title ?? record.title,
    verdict,
    confidence: record.confidence,
    language: proof.language ?? "Unknown",
    framework: proof.framework ?? "Unknown",
    files: proof.files ?? [],
    wrongAttempts: asStringArray(proof.wrongAttempts),
    tests: proof.tests ?? [],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    score,
    matchReasons,
  };
}

function aggregateGroups(
  records: ExperienceRecordRow[],
  makeKey: (record: ExperienceRecordRow, proof: VerificationExperienceProof) => string,
  makeTitle: (record: ExperienceRecordRow, proof: VerificationExperienceProof) => string,
  queryTokens: string[],
  filter: (record: ExperienceRecordRow, proof: VerificationExperienceProof) => boolean = () => true,
): ExperienceGroupItem[] {
  const groups = new Map<
    string,
    {
      title: string;
      count: number;
      confidenceTotal: number;
      repositories: Set<string>;
      verdicts: Set<"PASS" | "FAIL" | "UNKNOWN">;
      rootCause: string;
      lesson: string;
      antiPattern: string;
      language: string;
      framework: string;
      files: Set<string>;
      pullRequestNumbers: Set<number>;
      latestAt: string;
      example: ExperienceGroupItem["example"];
    }
  >();

  for (const record of records) {
    const proof = parseProof(record.proof);
    if (!filter(record, proof)) continue;
    const key = makeKey(record, proof);
    const title = makeTitle(record, proof);
    const group = groups.get(key) ?? {
      title,
      count: 0,
      confidenceTotal: 0,
      repositories: new Set<string>(),
      verdicts: new Set<"PASS" | "FAIL" | "UNKNOWN">(),
      rootCause: proof.rootCause ?? "",
      lesson: proof.lesson ?? record.lesson,
      antiPattern: proof.antiPattern ?? "",
      language: proof.language ?? "Unknown",
      framework: proof.framework ?? "Unknown",
      files: new Set<string>(),
      pullRequestNumbers: new Set<number>(),
      latestAt: record.createdAt.toISOString(),
      example: null,
    };

    group.count += 1;
    group.confidenceTotal += record.confidence;
    if (proof.repository) group.repositories.add(proof.repository);
    if (proof.pullRequestNumber && Number.isFinite(proof.pullRequestNumber)) group.pullRequestNumbers.add(proof.pullRequestNumber);
    if (proof.verdict === "PASS" || proof.verdict === "FAIL" || proof.verdict === "UNKNOWN") {
      group.verdicts.add(proof.verdict);
    }
    for (const file of proof.files ?? []) {
      if (file.trim().length > 0) group.files.add(file);
    }
    const currentCreatedAt = record.createdAt.toISOString();
    if (currentCreatedAt > group.latestAt) {
      group.latestAt = currentCreatedAt;
      group.example = {
        id: record.id,
        repository: proof.repository ?? "unknown/unknown",
        pullRequestTitle: proof.mission?.title ?? record.title,
        pullRequestNumber: proof.pullRequestNumber ?? 0,
      };
    } else if (!group.example) {
      group.example = {
        id: record.id,
        repository: proof.repository ?? "unknown/unknown",
        pullRequestTitle: proof.mission?.title ?? record.title,
        pullRequestNumber: proof.pullRequestNumber ?? 0,
      };
    }
    groups.set(key, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => {
      if (queryTokens.length === 0) return true;
      const haystack = normalize([
        group.title,
        group.rootCause,
        group.lesson,
        group.antiPattern,
        group.language,
        group.framework,
        [...group.repositories].join(" "),
      ].join(" "));
      return queryTokens.every((token) => haystack.includes(token));
    })
    .map(([key, group]) => ({
      id: compactId("exp", key),
      title: group.title,
      count: group.count,
      confidence: Math.round(group.confidenceTotal / Math.max(1, group.count)),
      repositories: [...group.repositories],
      verdicts: [...group.verdicts],
      rootCause: group.rootCause,
      lesson: group.lesson,
      antiPattern: group.antiPattern,
      language: group.language,
      framework: group.framework,
      files: [...group.files],
      pullRequestNumbers: [...group.pullRequestNumbers].sort((a, b) => a - b),
      latestAt: group.latestAt,
      example: group.example,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.latestAt.localeCompare(a.latestAt);
    });
}

export async function searchVerificationExperiences(input: {
  userId: string;
  orgId?: string;
  query?: string;
  limit?: number;
  verdict?: string;
}): Promise<{
  query: string;
  total: number;
  results: ExperienceSearchItem[];
}> {
  const query = input.query?.trim() ?? "";
  const limit = Math.max(1, Math.min(50, input.limit ?? 20));
  const queryTokens = splitQuery(query);
  const records = await listWorkspaceExperiences(input.userId, input.orgId);
  const filtered = records
    .map((record) => {
      const proof = parseProof(record.proof);
      if (input.verdict && proof.verdict !== input.verdict) {
        return null;
      }
      const { score, matchReasons } = scoreRecord(record, proof, queryTokens);
      if (queryTokens.length > 0 && score === 0) {
        return null;
      }
      return toSearchItem(record, proof, score, matchReasons);
    })
    .filter((item): item is ExperienceSearchItem => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.createdAt.localeCompare(a.createdAt);
    });

  return {
    query,
    total: filtered.length,
    results: filtered.slice(0, limit),
  };
}

export async function listExperienceLessons(input: {
  userId: string;
  orgId?: string;
  query?: string;
  limit?: number;
}): Promise<{
  query: string;
  total: number;
  lessons: ExperienceGroupItem[];
}> {
  const query = input.query?.trim() ?? "";
  const queryTokens = splitQuery(query);
  const limit = Math.max(1, Math.min(50, input.limit ?? 10));
  const records = await listWorkspaceExperiences(input.userId, input.orgId);
  const groupedLessons = aggregateGroups(
    records,
    (record, proof) => proof.lesson?.trim() || record.lesson.trim() || "Unspecified lesson",
    (record, proof) => proof.lesson?.trim() || record.lesson.trim() || "Unspecified lesson",
    queryTokens,
    (record, proof) => Boolean((proof.lesson ?? record.lesson).trim()),
  );
  return {
    query,
    total: groupedLessons.length,
    lessons: groupedLessons.slice(0, limit),
  };
}

export async function listFailurePatterns(input: {
  userId: string;
  orgId?: string;
  query?: string;
  limit?: number;
}): Promise<{
  query: string;
  total: number;
  patterns: ExperienceGroupItem[];
}> {
  const query = input.query?.trim() ?? "";
  const queryTokens = splitQuery(query);
  const limit = Math.max(1, Math.min(50, input.limit ?? 10));
  const records = await listWorkspaceExperiences(input.userId, input.orgId);
  const groupedPatterns = aggregateGroups(
    records,
    (record, proof) => proof.antiPattern?.trim() || proof.rootCause?.trim() || record.title,
    (record, proof) => proof.antiPattern?.trim() || proof.rootCause?.trim() || record.title,
    queryTokens,
    (record, proof) => (proof.verdict === "FAIL" || proof.verdict === "UNKNOWN") && Boolean(proof.antiPattern || proof.rootCause || record.title),
  );
  return {
    query,
    total: groupedPatterns.length,
    patterns: groupedPatterns.slice(0, limit),
  };
}

export async function listRootCauses(input: {
  userId: string;
  orgId?: string;
  query?: string;
  limit?: number;
}): Promise<{
  query: string;
  total: number;
  rootCauses: ExperienceGroupItem[];
}> {
  const query = input.query?.trim() ?? "";
  const queryTokens = splitQuery(query);
  const limit = Math.max(1, Math.min(50, input.limit ?? 10));
  const records = await listWorkspaceExperiences(input.userId, input.orgId);
  const groupedRootCauses = aggregateGroups(
    records,
    (record, proof) => proof.rootCause?.trim() || record.summary || record.title,
    (record, proof) => proof.rootCause?.trim() || record.summary || record.title,
    queryTokens,
    () => true,
  );
  return {
    query,
    total: groupedRootCauses.length,
    rootCauses: groupedRootCauses.slice(0, limit),
  };
}
