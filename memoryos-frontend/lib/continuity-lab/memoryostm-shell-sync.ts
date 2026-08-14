export type MemoryOSTMShellRuntimeState = "working" | "waiting" | "missing";

export type MemoryOSTMShellSyncEntry = {
  id: string;
  at: string;
  title: string;
  detail: string | null;
  output: string | null;
  kind: "command" | "runtime" | "prompt" | "session";
  state: MemoryOSTMShellRuntimeState;
  hookEventName: string;
  toolName: string | null;
};

export type MemoryOSTMShellSyncSnapshot = {
  installed: boolean;
  state: MemoryOSTMShellRuntimeState;
  summary: string | null;
  lastUpdatedAt: string | null;
  logPath: string | null;
  entries: MemoryOSTMShellSyncEntry[];
};
