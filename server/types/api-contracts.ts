import type { ContinuityPlannerResult } from "../../lib/memory/continuityPlanner";
import type { HandoffPlannerResult } from "../../lib/memory/handoffPlanner";
import type { MemoryToolDescriptor } from "../../lib/memory/MCP";
import type { ResumePlannerResult } from "../../lib/memory/resumePlanner";
import type { RetrieveRelevantMemoryResult } from "../../lib/memory/retrieveRelevantMemory";
import { getRetrievalWeights } from "../../lib/config/retrievalWeights";

export type ApiMeta = {
  requestId: string;
  latencyMs: number;
  intent?: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta: ApiMeta;
};

export type ApiError = {
  ok: false;
  error: ApiErrorBody;
  meta: ApiMeta;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type RetrieveResponseData = RetrieveRelevantMemoryResult;
export type ContinueResponseData = ContinuityPlannerResult;
export type HandoffResponseData = HandoffPlannerResult;
export type ResumeResponseData = ResumePlannerResult;
export type ContinueProjectBriefResponseData = {
  whatChangedRecently: string[];
  currentGoal: string;
  keyDecisions: string[];
  openBlockers: string[];
  riskyFiles: string[];
  nextBestAction: string;
  mustKnowContextForAgent: string[];
};
export type ResumePromptResponseData = {
  target: "cursor" | "codex" | "claude_code";
  brief: ContinueProjectBriefResponseData;
  prompts: {
    cursor: string;
    codex: string;
    claudeCode: string;
  };
  trace: Array<{
    memoryId: string;
    source: string;
    confidence: number;
    whySelected: string;
  }>;
};
export type McpToolsResponseData = {
  tools: MemoryToolDescriptor[];
};
export type McpInvokeResponseData = {
  name: string;
  result: unknown;
};

type RetrievalWeights = ReturnType<typeof getRetrievalWeights>;

export type RetrieveExplainRankedItem = {
  id: string;
  memory?: string;
  memoryType?: string;
  finalScore: number;
  semanticScore: number;
  typeRelevanceScore: number;
  importanceScore: number;
  recencyScore: number;
  continuityBoost: number;
  updatedAt?: string;
  intent?: string;
  weightsUsed?: RetrievalWeights;
  reasonTags: string[];
  contributions: {
    semantic: number;
    typeRelevance: number;
    importance: number;
    recency: number;
    continuity: number;
    total: number;
  };
  lifecycle: {
    latestEventType: string | null;
    latestReason: string | null;
    latestChangedAt: string | null;
  };
};

export type RetrieveExplainResponseData = {
  intent: string;
  weightsUsed: RetrievalWeights;
  ranked: RetrieveExplainRankedItem[];
  whyTop1: string;
};
