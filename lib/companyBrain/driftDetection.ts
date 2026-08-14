import type { ExecutionProposal } from "./executionTypes";
import type { ExecutionOutcomeRecord } from "../memory/actionMemoryTypes";
import type { OperationalLoop } from "./operationalLoopTypes";
import { listOperationalLoops } from "./operationalLoopStore";
import type { OperationalLoopScope } from "./operationalLoopTypes";

export type DriftSeverity = "low" | "medium" | "high";

export type DriftType =
  | "goal_mismatch"
  | "partial_completion"
  | "failed_execution"
  | "scope_creep"
  | "stale_goal";

export type DriftReport = {
  loopId: string;
  driftType: DriftType;
  severity: DriftSeverity;
  summary: string;
  correctiveSteps: string[];
  detectedAt: string;
};

export type DriftDetectionInput = {
  loop: OperationalLoop;
  proposal: ExecutionProposal;
  executionOutcome?: Pick<
    ExecutionOutcomeRecord,
    "status" | "resultSummary" | "errorMessage" | "externalRef" | "goal" | "planSummary"
  > | null;
  filesChanged?: string[];
  nowMs?: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "for",
  "and",
  "or",
  "in",
  "on",
  "of",
  "with",
  "is",
  "are",
  "be",
  "this",
  "that",
  "from",
  "as",
  "at",
  "by",
  "it",
]);

const STALE_OPEN_LOOP_DAYS = 7;
const GOAL_TOKEN_OVERLAP_THRESHOLD = 0.2;

const DRIFT_PRIORITY: Record<DriftType, number> = {
  failed_execution: 5,
  scope_creep: 4,
  goal_mismatch: 3,
  partial_completion: 2,
  stale_goal: 1,
};

const SEVERITY_RANK: Record<DriftSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function nowIso(): string {
  return new Date().toISOString();
}

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  return new Set(tokens);
}

function tokenOverlapRatio(a: string, b: string): number {
  const left = tokenize(a);
  const right = tokenize(b);
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap / Math.min(left.size, right.size);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").trim().toLowerCase();
}

function extractPlannedFiles(payload: Record<string, unknown>): string[] {
  const files: string[] = [];
  if (typeof payload.filePath === "string" && payload.filePath.trim()) {
    files.push(payload.filePath.trim());
  }
  if (Array.isArray(payload.plannedFiles)) {
    for (const entry of payload.plannedFiles) {
      if (typeof entry === "string" && entry.trim()) files.push(entry.trim());
    }
  }
  if (Array.isArray(payload.filesChanged)) {
    for (const entry of payload.filesChanged) {
      if (typeof entry === "string" && entry.trim()) files.push(entry.trim());
    }
  }
  return [...new Set(files)];
}

function extractActualFiles(
  proposal: ExecutionProposal,
  filesChanged?: string[],
): string[] {
  const files = [...(filesChanged ?? [])];
  const result = proposal.result;
  if (result && typeof result === "object") {
    const data = result as Record<string, unknown>;
    if (typeof data.filePath === "string" && data.filePath.trim()) {
      files.push(data.filePath.trim());
    }
    if (Array.isArray(data.filesChanged)) {
      for (const entry of data.filesChanged) {
        if (typeof entry === "string" && entry.trim()) files.push(entry.trim());
      }
    }
  }
  return [...new Set(files)];
}

function isOpenLoopState(state: OperationalLoop["currentState"]): boolean {
  return (
    state === "goal_set" ||
    state === "plan_proposed" ||
    state === "awaiting_approval" ||
    state === "executing"
  );
}

function buildCandidate(
  loopId: string,
  driftType: DriftType,
  severity: DriftSeverity,
  summary: string,
  correctiveSteps: string[],
): DriftReport {
  return {
    loopId,
    driftType,
    severity,
    summary,
    correctiveSteps,
    detectedAt: nowIso(),
  };
}

function pickPrimaryDrift(candidates: DriftReport[]): DriftReport | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => {
    const severityDelta = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (severityDelta !== 0) return severityDelta;
    return DRIFT_PRIORITY[b.driftType] - DRIFT_PRIORITY[a.driftType];
  })[0];
}

export function detectExecutionDrift(input: DriftDetectionInput): DriftReport | null {
  const { loop, proposal } = input;
  const candidates: DriftReport[] = [];
  const nowMs = input.nowMs ?? Date.now();
  const plannedFiles = extractPlannedFiles(proposal.payload);
  const actualFiles = extractActualFiles(proposal, input.filesChanged);
  const outcomeStatus =
    input.executionOutcome?.status ??
    (proposal.status === "executed" ? "executed" : proposal.status === "failed" ? "failed" : proposal.status);
  const resultSummary =
    input.executionOutcome?.resultSummary ??
    (typeof proposal.result?.detail === "string" ? proposal.result.detail : proposal.error) ??
    "";
  const externalRef =
    input.executionOutcome?.externalRef ??
    (typeof proposal.result?.externalRef === "string" ? proposal.result.externalRef : null);
  const outcomeGoal = input.executionOutcome?.goal ?? `${proposal.adapter} ${proposal.actionType}`;

  if (proposal.status === "failed" || outcomeStatus === "failed") {
    candidates.push(
      buildCandidate(
        loop.id,
        "failed_execution",
        "high",
        `Execution failed for loop goal: ${loop.goal}`,
        [
          "Review the execution error and connector logs before resuming.",
          "Update the operational goal or proposal payload if the plan was wrong.",
          "Re-propose execution only after the root cause is addressed.",
        ],
      ),
    );
  }

  const unplannedFiles = actualFiles.filter((file) => {
    const normalized = normalizePath(file);
    return !plannedFiles.some(
      (planned) =>
        normalizePath(planned) === normalized ||
        normalized.endsWith(`/${normalizePath(planned)}`) ||
        normalizePath(planned).endsWith(`/${normalized}`),
    );
  });
  if (plannedFiles.length > 0 && unplannedFiles.length > 0) {
    candidates.push(
      buildCandidate(
        loop.id,
        "scope_creep",
        unplannedFiles.length >= 2 ? "high" : "medium",
        `Execution touched ${unplannedFiles.length} file(s) outside the proposed plan.`,
        [
          "Confirm whether extra files were intentional; if not, revert unrelated changes.",
          "Split follow-up work into a new governed proposal with an explicit file list.",
          "Record the scope decision in project memory before continuing.",
        ],
      ),
    );
  } else if (plannedFiles.length === 0 && actualFiles.length >= 3) {
    candidates.push(
      buildCandidate(
        loop.id,
        "scope_creep",
        "medium",
        `Execution changed ${actualFiles.length} files without a planned file list.`,
        [
          "Attach explicit planned files to the next execution proposal.",
          "Review diffs for unintended breadth before merging or resuming.",
        ],
      ),
    );
  }

  if (proposal.status === "executed" || outcomeStatus === "executed") {
    const goalOverlap = tokenOverlapRatio(loop.goal, `${outcomeGoal} ${resultSummary}`);
    if (goalOverlap < GOAL_TOKEN_OVERLAP_THRESHOLD) {
      candidates.push(
        buildCandidate(
          loop.id,
          "goal_mismatch",
          "medium",
          "Executed outcome does not align with the operational loop goal.",
          [
            "Reconcile the loop goal with what was actually executed.",
            "Capture a memory update describing the true intent before resuming.",
            "Open a corrective proposal if the wrong action type ran.",
          ],
        ),
      );
    }

    const expectsExternalRef =
      proposal.adapter === "github" &&
      (proposal.actionType === "pull_request" ||
        proposal.actionType === "brief_file_commit" ||
        proposal.actionType === "issue_comment");
    const partialByRef = expectsExternalRef && !externalRef?.trim();
    const partialByText = /\b(partial|incomplete|skipped|not fully)\b/i.test(resultSummary);
    if (partialByRef || partialByText) {
      candidates.push(
        buildCandidate(
          loop.id,
          "partial_completion",
          partialByRef ? "high" : "medium",
          partialByRef
            ? "Execution marked success but no external reference was recorded."
            : "Execution result suggests the plan was only partially completed.",
          [
            "Verify connector output and GitHub/Jira/Slack artifacts manually.",
            "Re-run or extend execution until the acceptance criteria are met.",
            "Update the loop goal if partial delivery is the new intended state.",
          ],
        ),
      );
    }
  }

  const createdMs = Date.parse(loop.createdAt);
  if (Number.isFinite(createdMs) && isOpenLoopState(loop.currentState)) {
    const ageDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24);
    if (ageDays >= STALE_OPEN_LOOP_DAYS) {
      candidates.push(
        buildCandidate(
          loop.id,
          "stale_goal",
          ageDays >= STALE_OPEN_LOOP_DAYS * 2 ? "medium" : "low",
          `Operational loop has been open for ${Math.floor(ageDays)} days.`,
          [
            "Confirm the loop goal is still valid or close the loop.",
            "Refresh the continue-project brief before agents resume work.",
            "Split stale work into a smaller goal with a new loop if needed.",
          ],
        ),
      );
    }
  }

  return pickPrimaryDrift(candidates);
}

export function readDriftReport(loop: OperationalLoop): DriftReport | null {
  const raw = loop.metadata?.driftReport;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const report = raw as Partial<DriftReport>;
  if (
    typeof report.loopId !== "string" ||
    typeof report.driftType !== "string" ||
    typeof report.severity !== "string" ||
    typeof report.summary !== "string" ||
    !Array.isArray(report.correctiveSteps)
  ) {
    return null;
  }
  return {
    loopId: report.loopId,
    driftType: report.driftType as DriftType,
    severity: report.severity as DriftSeverity,
    summary: report.summary,
    correctiveSteps: report.correctiveSteps.filter((step): step is string => typeof step === "string"),
    detectedAt: typeof report.detectedAt === "string" ? report.detectedAt : nowIso(),
  };
}

export function shouldRollBackOnDrift(
  report: DriftReport | null,
  proposal: ExecutionProposal,
): boolean {
  return (
    report?.severity === "high" &&
    report.driftType === "failed_execution" &&
    (proposal.status === "failed" || proposal.status === "rejected")
  );
}

export async function listProjectDriftReports(
  scope: OperationalLoopScope,
  projectId: string,
  limit = 20,
): Promise<DriftReport[]> {
  const loops = await listOperationalLoops(scope.userId, {
    orgId: scope.orgId,
    projectId,
    limit: Math.min(Math.max(limit, 1), 50),
  });
  const reports: DriftReport[] = [];
  for (const loop of loops) {
    const report = readDriftReport(loop);
    if (report) reports.push(report);
  }
  return reports
    .sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt))
    .slice(0, limit);
}

export function formatDriftBriefLines(report: DriftReport): string[] {
  const steps =
    report.correctiveSteps.length > 0
      ? report.correctiveSteps.map((step) => `Corrective: ${step}`)
      : [];
  return [
    `[${report.severity}] ${report.driftType}: ${report.summary}`,
    ...steps,
  ];
}
