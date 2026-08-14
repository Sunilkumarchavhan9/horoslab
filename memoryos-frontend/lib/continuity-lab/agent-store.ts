import { create } from "zustand";
import type {
  FileChangeEntry,
  WorklogEntry,
  ShellLineEntry,
  ChatBubble,
  PrReadyArtifact,
} from "@/lib/continuity-lab/chat-events";

export type PRStatus = {
  number?: number;
  status?: "pending" | "passed" | "failed" | "merged";
  url?: string | null;
};

export type AgentInfo = {
  id: string;
  name: string;
  role?: string;
  status?: "idle" | "running" | "error";
};

export type DesktopState = {
  status: "idle" | "starting" | "live" | "error";
  osType?: "ubuntu" | "windows" | null;
  previewUrl?: string | null;
  controlUrl?: string | null;
  provider?: "preview" | "browser" | "vscode" | "playwright" | "custom";
  runtimeMessage?: string | null;
  lastFrameAt?: string | null;
};

export type AgentState = {
  messages: ChatBubble[];
  files: Record<string, string>;
  fileChanges: FileChangeEntry[];
  worklog: WorklogEntry[];
  shellLines: ShellLineEntry[];
  prStatus?: PRStatus | null;
  prReady?: PrReadyArtifact | null;
  desktop: DesktopState;
  agents: AgentInfo[];
  runtimeConnected: boolean;

  // actions
  appendMessage: (m: ChatBubble) => void;
  setMessages: (messages: ChatBubble[]) => void;
  setFiles: (files: Record<string, string>) => void;
  applyFileChange: (change: FileChangeEntry) => void;
  setFileChanges: (changes: FileChangeEntry[]) => void;
  addWorklog: (entry: WorklogEntry) => void;
  setWorklog: (entries: WorklogEntry[]) => void;
  addShellLine: (line: ShellLineEntry) => void;
  setShellLines: (lines: ShellLineEntry[]) => void;
  setPrStatus: (pr: PRStatus | null) => void;
  setPrReady: (artifact: PrReadyArtifact | null) => void;
  setDesktopState: (desktop: Partial<DesktopState>) => void;
  setAgents: (agents: AgentInfo[]) => void;
  upsertAgent: (agent: AgentInfo) => void;
  setRuntimeConnected: (connected: boolean) => void;
};

export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  files: {},
  fileChanges: [],
  worklog: [],
  shellLines: [],
  prStatus: null,
  prReady: null,
  desktop: {
    status: "idle",
    osType: null,
    previewUrl: null,
    controlUrl: null,
    runtimeMessage: null,
    lastFrameAt: null,
  },
  agents: [],
  runtimeConnected: false,

  appendMessage: (m: ChatBubble) =>
    set((s: AgentState) => ({ messages: [...s.messages, m] })),
  setMessages: (messages: ChatBubble[]) => set(() => ({ messages })),
  setFiles: (files: Record<string, string>) => set(() => ({ files })),
  applyFileChange: (change: FileChangeEntry) =>
    set((s: AgentState) => {
      const byId = new Map(
        s.fileChanges.map((c: FileChangeEntry) => [c.id, c]),
      );
      byId.set(change.id, change);
      return { fileChanges: [...byId.values()] };
    }),
  setFileChanges: (changes: FileChangeEntry[]) =>
    set(() => ({ fileChanges: changes })),
  addWorklog: (entry: WorklogEntry) =>
    set((s: AgentState) => ({ worklog: [...s.worklog, entry] })),
  setWorklog: (entries: WorklogEntry[]) => set(() => ({ worklog: entries })),
  addShellLine: (line: ShellLineEntry) =>
    set((s: AgentState) => ({ shellLines: [...s.shellLines, line] })),
  setShellLines: (lines: ShellLineEntry[]) =>
    set(() => ({ shellLines: lines })),
  setPrStatus: (pr: PRStatus | null) => set(() => ({ prStatus: pr })),
  setPrReady: (artifact: PrReadyArtifact | null) =>
    set(() => ({ prReady: artifact })),
  setDesktopState: (desktop: Partial<DesktopState>) =>
    set((s: AgentState) => ({ desktop: { ...s.desktop, ...desktop } })),
  setAgents: (agents: AgentInfo[]) => set(() => ({ agents })),
  upsertAgent: (agent: AgentInfo) =>
    set((s: AgentState) => {
      const byId = new Map(s.agents.map((a: AgentInfo) => [a.id, a]));
      byId.set(agent.id, { ...(byId.get(agent.id) ?? {}), ...agent });
      return { agents: [...byId.values()] };
    }),
  setRuntimeConnected: (connected: boolean) =>
    set(() => ({ runtimeConnected: connected })),
}));
