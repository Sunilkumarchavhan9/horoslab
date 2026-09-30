export type DhyraTMShellRuntimeState = "working" | "waiting" | "missing";

export type DhyraTMShellSyncEntry = {
  id: string;
  at: string;
  title: string;
  detail: string | null;
  output: string | null;
  kind: "command" | "runtime" | "prompt" | "session";
  state: DhyraTMShellRuntimeState;
  hookEventName: string;
  toolName: string | null;
};

export type DhyraTMShellSyncSnapshot = {
  installed: boolean;
  state: DhyraTMShellRuntimeState;
  summary: string | null;
  lastUpdatedAt: string | null;
  logPath: string | null;
  entries: DhyraTMShellSyncEntry[];
};
