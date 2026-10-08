export type HorosTMShellRuntimeState = "working" | "waiting" | "missing";

export type HorosTMShellSyncEntry = {
  id: string;
  at: string;
  title: string;
  detail: string | null;
  output: string | null;
  kind: "command" | "runtime" | "prompt" | "session";
  state: HorosTMShellRuntimeState;
  hookEventName: string;
  toolName: string | null;
};

export type HorosTMShellSyncSnapshot = {
  installed: boolean;
  state: HorosTMShellRuntimeState;
  summary: string | null;
  lastUpdatedAt: string | null;
  logPath: string | null;
  entries: HorosTMShellSyncEntry[];
};
