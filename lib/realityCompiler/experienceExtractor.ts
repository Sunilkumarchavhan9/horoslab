import { prisma } from "../storage/prismaClient";
import type { GitHubPullRequestDetail } from "../integrations/githubRepoBrowser";
import type { VerificationRecord } from "./verificationService";
import { verificationScopeKey } from "./experienceScope";

type ExperienceProof = {
  version: "verification_experience.v1";
  verificationId: string;
  repository: string;
  pullRequestNumber: number;
  verdict: VerificationRecord["verdict"];
  confidence: number;
  mission: {
    owner: string;
    repo: string;
    title: string;
    url: string | null;
    headSha: string | null;
    baseRef: string | null;
    headRef: string | null;
  };
  problem: string;
  rootCause: string;
  wrongAttempts: string[];
  correctSolution: string;
  evidence: VerificationRecord["evidenceReport"];
  tests: string[];
  lesson: string;
  bestPractice: string;
  antiPattern: string;
  files: string[];
  language: string;
  framework: string;
};

function inferLanguage(detail: GitHubPullRequestDetail): string {
  const extensions = new Map<string, number>();
  for (const file of detail.files) {
    const lower = file.filename.toLowerCase();
    const extension =
      lower.endsWith(".tsx") ? "tsx" :
      lower.endsWith(".ts") ? "ts" :
      lower.endsWith(".jsx") ? "jsx" :
      lower.endsWith(".js") ? "js" :
      lower.endsWith(".py") ? "py" :
      lower.endsWith(".go") ? "go" :
      lower.endsWith(".rs") ? "rs" :
      lower.endsWith(".java") ? "java" :
      lower.endsWith(".sql") ? "sql" :
      lower.endsWith(".prisma") ? "prisma" :
      lower.endsWith(".md") ? "md" :
      "other";
    extensions.set(extension, (extensions.get(extension) ?? 0) + 1);
  }

  const primary = [...extensions.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
  switch (primary) {
    case "tsx":
    case "ts":
      return "TypeScript";
    case "jsx":
    case "js":
      return "JavaScript";
    case "py":
      return "Python";
    case "go":
      return "Go";
    case "rs":
      return "Rust";
    case "java":
      return "Java";
    case "sql":
      return "SQL";
    case "prisma":
      return "Prisma";
    default:
      return "Unknown";
  }
}

function inferFramework(detail: GitHubPullRequestDetail, language: string): string {
  const files = detail.files.map((file) => file.filename.toLowerCase());
  if (
    files.some((file) => file.includes("next.config")) ||
    files.some((file) => file.startsWith("app/")) ||
    files.some((file) => file.startsWith("pages/")) ||
    files.some((file) => file.includes("/page.")) ||
    files.some((file) => file.includes("/layout."))
  ) {
    return "Next.js";
  }
  if (files.some((file) => file.includes("express")) || files.some((file) => file.includes("server/"))) {
    return "Node.js";
  }
  if (language === "Python") return "Python";
  if (language === "SQL" || language === "Prisma") return "Database";
  if (language === "Go") return "Go";
  if (language === "Java") return "Java";
  return "Unknown";
}

function buildWrongAttempts(verification: VerificationRecord): string[] {
  const attempts = new Set<string>();
  for (const reason of verification.compilerDecision.reasons) {
    attempts.add(reason);
  }
  for (const invariant of verification.compilerDecision.invariantResults) {
    if (invariant.status === "fail" || invariant.status === "unknown") {
      attempts.add(
        `${invariant.id}: ${invariant.evidence.length > 0 ? invariant.evidence.join(", ") : "no evidence"}${invariant.repair ? ` | repair: ${invariant.repair}` : ""}`,
      );
    }
  }
  return [...attempts];
}

function buildRootCause(verification: VerificationRecord, wrongAttempts: string[]): string {
  const failingInvariant = verification.compilerDecision.invariantResults.find(
    (item) => item.status === "fail" || item.status === "unknown",
  );
  if (failingInvariant) {
    const evidence = failingInvariant.evidence.length > 0 ? failingInvariant.evidence.join(", ") : "insufficient evidence";
    return `${failingInvariant.id} is ${failingInvariant.status} because ${evidence}.`;
  }
  if (wrongAttempts[0]) {
    return wrongAttempts[0];
  }
  return `No blocking root cause was identified for ${verification.repository}#${verification.pullRequestNumber}.`;
}

function buildBestPractice(verification: VerificationRecord): string {
  if (verification.verdict === "PASS") {
    return "Keep the current controls in place and rerun verification on the next change.";
  }
  return verification.recommendedAction;
}

function buildAntiPattern(verification: VerificationRecord): string {
  const destructiveChange = verification.compilerDecision.invariantResults.find(
    (item) => item.id.toLowerCase().includes("schema") || item.id.toLowerCase().includes("migration"),
  );
  if (destructiveChange) {
    return `Ignoring ${destructiveChange.id} and merging without the required safeguards.`;
  }
  if (verification.verdict === "FAIL") {
    return "Merging without satisfying the blocking verification checks.";
  }
  if (verification.verdict === "UNKNOWN") {
    return "Shipping before collecting enough evidence to make the decision trustworthy.";
  }
  return "N/A";
}

function buildLesson(verification: VerificationRecord, rootCause: string): string {
  if (verification.verdict === "PASS") {
    return "Preserve the evidence trail so future changes can reuse the same verification pattern.";
  }
  return `${rootCause} Follow: ${verification.recommendedAction}`;
}

function buildTests(verification: VerificationRecord): string[] {
  return [
    `status:${verification.evidenceReport.reviewSignals.statusState ?? "unknown"}`,
    `reviews:${verification.evidenceReport.reviewSignals.reviews}`,
    `review-comments:${verification.evidenceReport.reviewSignals.reviewComments}`,
    `comments:${verification.evidenceReport.reviewSignals.comments}`,
    ...verification.compilerDecision.invariantResults.map((item) => `${item.id}:${item.status}`),
  ];
}

export async function createVerificationExperience(input: {
  verification: VerificationRecord;
  detail: GitHubPullRequestDetail;
}): Promise<{ id: string } | null> {
  const verification = input.verification;
  const proofFields: ExperienceProof = {
    version: "verification_experience.v1",
    verificationId: verification.id,
    repository: verification.repository,
    pullRequestNumber: verification.pullRequestNumber,
    verdict: verification.verdict,
    confidence: verification.confidence,
    mission: {
      owner: verification.repository.split("/")[0] ?? "",
      repo: verification.repository.split("/")[1] ?? "",
      title: verification.pullRequestTitle,
      url: verification.pullRequestHtmlUrl,
      headSha: verification.headSha,
      baseRef: verification.baseRef,
      headRef: verification.headRef,
    },
    problem: `${verification.repository} #${verification.pullRequestNumber}: ${verification.pullRequestTitle}`,
    rootCause: "",
    wrongAttempts: [],
    correctSolution: verification.recommendedAction,
    evidence: verification.evidenceReport,
    tests: [],
    lesson: "",
    bestPractice: "",
    antiPattern: "",
    files: verification.evidenceReport.files.map((file) => file.path),
    language: inferLanguage(input.detail),
    framework: inferFramework(input.detail, inferLanguage(input.detail)),
  };

  const wrongAttempts = buildWrongAttempts(verification);
  const rootCause = buildRootCause(verification, wrongAttempts);

  proofFields.rootCause = rootCause;
  proofFields.wrongAttempts = wrongAttempts;
  proofFields.tests = buildTests(verification);
  proofFields.lesson = buildLesson(verification, rootCause);
  proofFields.bestPractice = buildBestPractice(verification);
  proofFields.antiPattern = buildAntiPattern(verification);

  const confidence = Math.max(0, Math.min(100, Math.round(verification.confidence * 100)));
  await prisma.experienceRecord.upsert({
    where: { id: verification.id },
    create: {
      id: verification.id,
      workspaceId: verificationScopeKey(verification.userId, verification.orgId),
      outcomeId: verification.id,
      title: `${verification.verdict} ${verification.repository}#${verification.pullRequestNumber}`,
      summary: verification.evidenceReport.summary,
      lesson: proofFields.lesson,
      proof: proofFields,
      confidence,
      status: "captured",
    },
    update: {
      workspaceId: verificationScopeKey(verification.userId, verification.orgId),
      title: `${verification.verdict} ${verification.repository}#${verification.pullRequestNumber}`,
      summary: verification.evidenceReport.summary,
      lesson: proofFields.lesson,
      proof: proofFields,
      confidence,
      status: "captured",
    },
  });

  return { id: verification.id };
}
