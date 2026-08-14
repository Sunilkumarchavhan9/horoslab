import type { PrReadyArtifact } from "@/lib/continuity-lab/chat-events";
import type { ExecutionLineageItem } from "@/lib/continuity-lab/operational-api";
import type {
  SessionHandoffPacket,
  SessionMemoryExtraction,
  SessionPlaybook,
} from "@/lib/continuity-lab/continuity-memory-api";
import type { OperationalResumeBrief } from "@/lib/continuity-lab/resume-brief";
import type { RuntimeArtifact, RuntimeThread } from "@/lib/continuity-lab/openhands-api";

export type PrReviewSeverity = "low" | "medium" | "high";
export type PrReviewStatusTone = "green" | "amber" | "red" | "blue" | "gray";

export type PrReviewFileEntry = {
  path: string;
  additions?: number;
  deletions?: number;
  kind?: string;
  detail?: string | null;
  content?: string | null;
};

export type PrReviewChangeGroup = {
  id: string;
  index: number;
  title: string;
  detail?: string | null;
  files: PrReviewFileEntry[];
  summary?: string | null;
};

export type PrReviewBug = {
  id: string;
  severity: PrReviewSeverity;
  title: string;
  detail: string;
  filePath?: string | null;
  line?: number | null;
  suggestion?: string | null;
};

export type PrReviewMemory = {
  id: string;
  title: string;
  summary: string;
  source: string;
  usedFor: string;
  confidence: number;
};

export type PrReviewDecision = {
  id: string;
  title: string;
  reason: string;
  risk?: string | null;
  files: string[];
  saved: boolean;
};

export type PrReviewLearning = {
  id: string;
  title: string;
  pattern: string;
  applyTo: string[];
  buttonLabel: string;
};

export type ReviewArtifact = {
  repoFullName: string | null;
  prReady: PrReadyArtifact | null;
  linkedPrUrl: string | null;
  repoPullTitle?: string | null;
  defaultBranch: string | null;
  previewUrl: string | null;
  brief: OperationalResumeBrief | null;
  sessionMemories: SessionMemoryExtraction[];
  handoffPacket: SessionHandoffPacket | null;
  playbook: SessionPlaybook | null;
  runtimeThread: RuntimeThread | null;
  runtimeArtifacts: RuntimeArtifact[];
  executionHistory: ExecutionLineageItem[];
  runtimeHandoffs: Array<{
    id: string;
    source: string;
    target: string;
    timestamp: string;
    metadata: { notes: string };
  }>;
  changeGroups: PrReviewChangeGroup[];
  bugs: PrReviewBug[];
  learnings?: PrReviewLearning[];
  discussion: PrReviewDiscussionItem[];
  latestReviewOutcome: { label: string; detail: string } | null;
};

export type PrReviewDiscussionItem = {
  id: string;
  author: string;
  title: string;
  detail: string;
  timestamp?: string | null;
  tone?: "neutral" | "success" | "warn" | "error" | "info";
};

export type PrReviewOverview = {
  summary: string;
  bullets: string[];
  confidence: number;
  riskLevel: "Low" | "Medium" | "High";
  needsHumanReview: boolean;
};

export type PrReviewHeader = {
  repoFullName: string | null;
  prNumber: number | null;
  title: string;
  branch: string | null;
  baseBranch: string | null;
  filesChanged: number;
  additions: number | null;
  deletions: number | null;
  ciStatus: PrReadyArtifact["ciStatus"] | "unknown";
  statusLabel: string;
  githubUrl: string | null;
  previewUrl: string | null;
};

export type PrReviewActions = {
  canApprove: boolean;
  canRequestChanges: boolean;
  canMerge: boolean;
  canOpenPreview: boolean;
  canOpenGitHub: boolean;
  canSaveLearnings: boolean;
};

export type PrReviewViewModel = {
  header: PrReviewHeader;
  overview: PrReviewOverview;
  changes: PrReviewChangeGroup[];
  bugs: PrReviewBug[];
  memoryUsed: PrReviewMemory[];
  decisions: PrReviewDecision[];
  learnings: PrReviewLearning[];
  discussion: PrReviewDiscussionItem[];
  actions: PrReviewActions;
};

export type PrReviewBuildInput = ReviewArtifact;

function clampConfidence(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ciStatusLabel(status: PrReviewHeader["ciStatus"]): string {
  if (status === "passed") return "Ready to merge";
  if (status === "merged") return "Merged";
  if (status === "failed") return "Checks failing";
  if (status === "pending") return "Checks running";
  return "Open";
}

function mergeUniqueMemoryItems(
  items: Array<
    Partial<PrReviewMemory> & {
      id?: string;
      title?: string;
      summary?: string;
      source?: string;
      usedFor?: string;
      confidence?: number;
    }
  >,
): PrReviewMemory[] {
  const byId = new Map<string, PrReviewMemory>();
  for (const item of items) {
    const id = item.id?.trim();
    const title = item.title?.trim() || "Memory";
    const summary = item.summary?.trim() || title;
    if (!id && !summary) continue;
    const memory: PrReviewMemory = {
      id: id || `${title}-${byId.size}`,
      title,
      summary,
      source: item.source?.trim() || "MemoryOS",
      usedFor: item.usedFor?.trim() || "Review context",
      confidence: clampConfidence(item.confidence),
    };
    byId.set(memory.id, memory);
  }
  return [...byId.values()].slice(0, 8);
}

export function buildPrReviewViewModel(input: PrReviewBuildInput): PrReviewViewModel | null {
  const hasPrSurface = Boolean(input.prReady?.url?.trim() || input.linkedPrUrl?.trim());
  if (!hasPrSurface) return null;

  const headerNumber = input.prReady?.number ?? null;
  const headerTitle =
    input.prReady?.title?.trim() ||
    input.repoPullTitle?.trim() ||
    input.brief?.currentGoal?.trim() ||
    "Pull request review";
  const headerStatus = ciStatusLabel(input.prReady?.ciStatus ?? "unknown");
  const header: PrReviewHeader = {
    repoFullName: input.repoFullName,
    prNumber: headerNumber,
    title: headerTitle,
    branch: input.prReady?.branch ?? null,
    baseBranch: input.prReady?.baseBranch ?? input.defaultBranch,
    filesChanged:
      input.prReady?.filesChanged ??
      input.changeGroups.reduce((total, group) => total + group.files.length, 0),
    additions: input.prReady?.additions ?? null,
    deletions: input.prReady?.deletions ?? null,
    ciStatus: input.prReady?.ciStatus ?? "unknown",
    statusLabel: headerStatus,
    githubUrl: input.linkedPrUrl,
    previewUrl: input.previewUrl,
  };

  const confidence = clampConfidence(input.brief?.resumeConfidence.score);
  const riskLevel: PrReviewOverview["riskLevel"] =
    confidence >= 85 && input.bugs.length === 0
      ? "Low"
      : confidence >= 60 && input.bugs.length <= 1
        ? "Medium"
        : "High";
  const needsHumanReview =
    riskLevel !== "Low" ||
    input.bugs.some((bug) => bug.severity === "high") ||
    input.runtimeThread?.runtimeState === "blocked";

  const summaryParts = [
    input.brief?.currentGoal?.trim(),
    input.brief?.nextBestAction?.trim(),
    input.latestReviewOutcome?.detail?.trim(),
    input.handoffPacket?.summary?.trim(),
  ].filter(Boolean);

  const bullets = [
    ...(input.brief?.keyDecisions ?? []).slice(0, 3),
    ...(input.brief?.openBlockers ?? []).slice(0, 2),
    ...(input.brief?.whatChangedRecently ?? []).slice(0, 3),
  ];

  const memoryUsed = mergeUniqueMemoryItems([
    ...(input.brief?.whyTheseMemoriesWereSelected ?? []).map((memory) => ({
      id: memory.memoryId,
      title: memory.summary,
      summary: memory.summary,
      source: memory.contractCategory ?? "Resume brief",
      usedFor: "Session resume and review context",
      confidence: memory.finalScore * 100,
    })),
    ...(input.sessionMemories ?? []).map((memory, index) => ({
      id: `${memory.memoryType}-${index}`,
      title: memory.title,
      summary: memory.content,
      source: memory.memoryType,
      usedFor: memory.evidence[0] ? `Evidence: ${memory.evidence[0]}` : "Review context",
      confidence: memory.confidence * 100,
    })),
    ...(input.handoffPacket?.injectedContext ?? []).map((memory) => ({
      id: memory.id,
      title: memory.summary,
      summary: memory.content,
      source: memory.type ?? "handoff",
      usedFor: "Handoff packet",
      confidence: (memory.confidence ?? 0.7) * 100,
    })),
    ...(input.playbook
      ? [
          {
            id: `playbook-${input.playbook.title}`,
            title: input.playbook.title,
            summary: input.playbook.whenToUse,
            source: "playbook",
            usedFor: "Reusable procedure",
            confidence: 74,
          },
        ]
      : []),
  ]);

  const decisions: PrReviewDecision[] = [
    ...(input.brief?.keyDecisions ?? []).slice(0, 3).map((decision, index) => ({
      id: `brief-decision-${index}`,
      title: decision,
      reason: "Recovered from operational brief",
      risk: "Capture this in Company Brain",
      files: [],
      saved: false,
    })),
    ...(input.executionHistory ?? [])
      .flatMap((item) => item.approvalTraces)
      .slice(0, 3)
      .map((approval, index) => ({
        id: `approval-${approval.id}-${index}`,
        title: approval.decision === "approved" ? "Approved change" : "Revision requested",
        reason: approval.reason || approval.proposalId || "Approval recorded.",
        risk: approval.riskTier ?? null,
        files: [],
        saved: true,
      })),
  ];

  const learnings = (input.learnings ?? []).slice(0, 6);

  const bugs: PrReviewBug[] = input.bugs.length
    ? input.bugs
    : [
        {
          id: "no-bugs-detected",
          severity: "low",
          title: "No open review bugs detected",
          detail: "MemoryOS did not find a concrete runtime or review issue that needs immediate changes.",
          suggestion: "Keep this PR ready and capture learnings for future runs.",
        },
      ];

  const discussion = [
    ...input.discussion,
    ...(input.runtimeHandoffs ?? []).slice(0, 3).map((handoff) => ({
      id: handoff.id,
      author: `${handoff.source} → ${handoff.target}`,
      title: "Runtime handoff",
      detail: handoff.metadata.notes,
      timestamp: handoff.timestamp,
      tone: "info" as const,
    })),
    ...(input.latestReviewOutcome
      ? [
          {
            id: "latest-review-outcome",
            author: "MemoryOS",
            title: input.latestReviewOutcome.label,
            detail: input.latestReviewOutcome.detail,
            timestamp: null,
            tone: "neutral" as const,
          },
        ]
      : []),
  ].slice(0, 8);

  return {
    header,
    overview: {
      summary:
        summaryParts.join(" · ") ||
        `MemoryOS review for ${headerTitle}.`,
      bullets: bullets.length
        ? bullets
        : [
            "Review the changed files and the execution lineage.",
            "Capture the decisions that should be remembered.",
            "Promote the fix into a reusable agent learning.",
          ],
      confidence,
      riskLevel,
      needsHumanReview,
    },
    changes: input.changeGroups,
    bugs,
    memoryUsed,
    decisions,
    learnings,
    discussion,
    actions: {
      canApprove: header.ciStatus !== "merged",
      canRequestChanges: header.ciStatus !== "merged",
      canMerge: header.ciStatus === "passed",
      canOpenPreview: Boolean(header.previewUrl),
      canOpenGitHub: Boolean(header.githubUrl),
      canSaveLearnings: memoryUsed.length > 0,
    },
  };
}
