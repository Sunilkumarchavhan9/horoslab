export interface MemoryOSConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface MemoryContractInput {
  goal?: string;
  constraints?: string[];
  decisions?: string[];
  open_risks?: string[];
  next_actions?: string[];
}

export interface MemoryItem {
  id: string;
  content?: string;
  memory?: string; // Compatibility with backend field name
  memoryType?: string;
  finalScore: number;
  updatedAt?: string;
}

export interface BeforeModelInput {
  userId: string;
  question: string;
  workspace?: string;
  project?: string;
  threadId?: string;
  mode?: "retrieve" | "resume";
  topK?: number;
  includeArchived?: boolean;
}

export interface BeforeModelResult {
  contextText: string;
  memories: MemoryItem[];
  source: "retrieve" | "resume";
  traceId?: string;
}

export interface AfterModelInput {
  userId: string;
  message?: string;
  threadId?: string;
  modelResponse?: string;
  contract?: MemoryContractInput;
  enforceContract?: boolean;
}

export interface AfterModelResult {
  acceptedCount: number;
  rejectedCount: number;
  contractFieldCount?: number;
  traceId?: string;
  governanceApplied?: GovernancePolicyApplied;
}

export interface RetrieveResult {
  memories: MemoryItem[];
}

export interface ProcessMemoryResult {
  traceId?: string;
  acceptedMemories: MemoryItem[];
  rejectedMemories: MemoryItem[];
  contract?: MemoryContractInput | null;
  contractFieldCount?: number;
  governance?: GovernancePolicyApplied;
}

export interface GovernancePolicyApplied {
  ttlHours: number;
  pinCriticalDecisions: boolean;
  redactSecrets: boolean;
  mode: "balanced" | "strict" | "enterprise";
}

export interface ResumeInput {
  userId: string;
  project: string;
  question: string;
  workspace?: string;
  threadId?: string;
  topK?: number;
  includeArchived?: boolean;
}

export interface ResumeResult {
  summary: string;
  lastKnownState: string;
  openLoops: string[];
  recommendedNextStep: string;
  usedMemories: MemoryItem[];
}

export interface HandoffInput {
  userId: string;
  project: string;
  question: string;
  workspace?: string;
  threadId?: string;
  topK?: number;
  includeArchived?: boolean;
}

export interface HandoffResult {
  handoffTitle: string;
  summary: string;
  lastKnownState: string;
  nextRecommendedAction: string;
  openLoops: string[];
  keyDecisions: string[];
  risks: string[];
  usedMemories: MemoryItem[];
}
