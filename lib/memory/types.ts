
export const MEMORY_TYPES = [
    "profile",
    "preference",
    "learning",
    "project",
    "episodic",
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export const MEMORY_STATUS = ["active", "archived", "merged"] as const;
export type MemoryStatus = (typeof MEMORY_STATUS)[number];

export const MEMORY_SOURCE = ["chat", "system", "import"] as const;
export type MemorySource = (typeof MEMORY_SOURCE)[number];

export type IsoDateString = string;

export interface DeveloperSignals {
  stack?: string[];
  framework?: string[];
  bugType?: string[];
  goal?: string[];
  projectArea?: string[];
}

export interface Memory {
    id: string;
    userId: string;
    type: MemoryType;
    content: string;
    summary: string;
    importanceScore: number;
    confidence: number;
    source: MemorySource;
    status: MemoryStatus;
    createdAt: IsoDateString;
    updatedAt: IsoDateString;
    evidenceCount: number;
    developerSignals?: DeveloperSignals;

}


export interface MemoryCandidate {
  userId: string;
  type: MemoryType;
  content: string;
  summary: string;
  source: MemorySource;
  threadId?: string;
  developerSignals?: DeveloperSignals;
}


export const TIMELINE_EVENT_TYPES = [
  "memory_created",
  "memory_updated",
  "memory_merged",
  "memory_archived",
  "memory_evolved",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export interface TimelineEvent {
  id: string;
  userId: string;
  memoryId: string;
  eventType: TimelineEventType;
  reason: string;
  timestamp: IsoDateString;
  metadata?: Record<string, string | number | boolean>;
}


export interface RevisionChange {
  field: keyof Pick<
    Memory,
    "content" | "summary" | "importanceScore" | "confidence" | "status" | "evidenceCount"
  >;
  oldValue: string | number;
  newValue: string | number;
}


export interface RevisionEvent {
    id: string;
    userId: string;
    memoryId: string;
    version: number;
    changedAt: IsoDateString;
    changedBy: "system" | "user";
    reason: string;
    changes: RevisionChange[];
}
