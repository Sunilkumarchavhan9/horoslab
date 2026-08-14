import type { ResumeConfidenceScore } from "../memory/resumeConfidence";
import type { ActionMemory, ActionMemoryWithLineage } from "../memory/actionMemoryTypes";
import type { MemoryContractCategory } from "../memory/types";
import type { OperationalLoopState } from "../companyBrain/operationalLoopTypes";

export type ContinuityApiMeta = {
  projectId?: string;
  orgId?: string;
  generatedAt: string;
  traceId?: string;
  requestId?: string;
  latencyMs?: number;
};

export type ContinuityApiSuccess<T> = {
  ok: true;
  data: T;
  meta: ContinuityApiMeta;
};

export type ContinuityApiFailure = {
  ok: false;
  error: string;
  code: string;
  meta?: ContinuityApiMeta;
};

export type ContinuityApiResponse<T> = ContinuityApiSuccess<T> | ContinuityApiFailure;

export type ProjectStateSnapshot = {
  projectId: string;
  briefSummary: {
    currentGoal: string;
    whatChangedRecently: string[];
    openBlockers: string[];
    nextBestAction: string;
  };
  activeLoop: {
    loopId: string;
    goal: string;
    state: OperationalLoopState;
    updatedAt: string;
  } | null;
  driftFlag: boolean;
  driftSummary: string | null;
  lastAction: ActionMemory | null;
  resumeConfidenceScore: number;
};

export type RankedNextAction = {
  id: string;
  text: string;
  source: "contract_memory" | "resume_brief";
  contractCategory?: MemoryContractCategory;
  rank: number;
  confidence: number;
  memoryId?: string;
};

export type DecisionHistoryEntry = {
  memoryId: string;
  summary: string;
  content: string;
  contractCategory: MemoryContractCategory;
  updatedAt: string;
  confidence: number;
  sourceRef?: string | null;
  files?: string[];
};

export type ContinuityScorePayload = ResumeConfidenceScore;

export type MemoryWhyPayload = {
  memoryId: string;
  whySelected: string;
  source?: string;
  confidence: number;
  contractCategory?: MemoryContractCategory;
  explanation?: {
    whySaved: string;
    status: string;
    stalenessBucket: string;
  };
};

export type ExecutionHistoryPayload = {
  items: ActionMemoryWithLineage[];
  actions: ActionMemory[];
  count: number;
};
