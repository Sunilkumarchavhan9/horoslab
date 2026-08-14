"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import LeftNav from "./LeftNav";
import CenterWorkspace from "./CenterWorkspace";
import RightRail from "./RightRail";
import {
  getOrCreateMemoryToken,
  writeMemoryTokenToStorage,
} from "../../lib/memoryToken";

export type CenterTab = "chat" | "worklog" | "changes" | "pr";
export type SessionState =
  "idle" | "planning" | "executing" | "repairing" | "success";
export type StepStatus = "pending" | "running" | "done" | "failed";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt?: string;
}

export interface WorklogStep {
  id: string;
  title: string;
  phase: "plan" | "execute" | "verify" | "replan";
  status: StepStatus;
  detail: string;
}

export interface FileChange {
  path: string;
  summary: string;
  additions: number;
  deletions: number;
}

export interface ShellEvent {
  id: string;
  command: string;
  output: string;
  status: "ok" | "error";
}

export interface AgentStatus {
  role: "Manager" | "Coder" | "Reviewer" | "Verifier";
  state: "idle" | "running" | "blocked";
}

type DesktopSessionPayload = {
  id: string;
  goal: string;
  state: SessionState;
  worklog: WorklogStep[];
  shellEvents: ShellEvent[];
  changes: FileChange[];
  messages: ChatMessage[];
  agents: AgentStatus[];
};

type DesktopEvent =
  | { kind: "ready"; sessionId: string }
  | { kind: "snapshot"; session: DesktopSessionPayload }
  | { kind: "chat"; sessionId: string; message: ChatMessage }
  | { kind: "error"; sessionId: string; message: string }
  | { kind: "ping"; ts: string };

const API_BASE_DEFAULT =
  process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() || "";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m0",
    role: "assistant",
    text: "Configure API base + token, then click Start Run to execute a real backend desktop session.",
  },
];

function parseApiPayload<T>(input: unknown): T | null {
  if (!input || typeof input !== "object") return null;
  const typed = input as { data?: T };
  return typed.data ?? null;
}

export interface MythicShellProps {
  children?: React.ReactNode;
}

export default function MythicShell({ children }: MythicShellProps) {
  const [goal, setGoal] = useState(
    "Build Devin-style desktop shell and validate it",
  );
  const [centerTab, setCenterTab] = useState<CenterTab>("worklog");
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [worklog, setWorklog] = useState<WorklogStep[]>([]);
  const [shellEvents, setShellEvents] = useState<ShellEvent[]>([]);
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [apiBase, setApiBase] = useState(API_BASE_DEFAULT);
  const [apiToken, setApiToken] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const streamAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const token = await getOrCreateMemoryToken();
      if (cancelled || !token) {
        return;
      }
      setApiToken((current) => current || token);
      setConnectionStatus(
        `Token loaded automatically · ${API_BASE_DEFAULT ? "direct backend" : "same-origin proxy"}`,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const applySnapshot = useCallback((session: DesktopSessionPayload) => {
    setSessionState(session.state);
    setWorklog(session.worklog ?? []);
    setShellEvents(session.shellEvents ?? []);
    setChanges(session.changes ?? []);
    setMessages(session.messages ?? []);
    if (session.state === "success") {
      setCenterTab("pr");
    }
  }, []);

  const openSessionStream = useCallback(
    async (targetSessionId: string, tokenOverride?: string) => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      const controller = new AbortController();
      streamAbortRef.current = controller;

      const headers: Record<string, string> = {};
      const activeToken = tokenOverride?.trim() || apiToken.trim();
      if (activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
      }

      const response = await fetch(
        `${apiBase.replace(/\/$/, "")}/api/agent/desktop/sessions/${encodeURIComponent(targetSessionId)}/events`,
        {
          method: "GET",
          headers,
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Stream failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Stream body is unavailable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const result = await reader.read();
        if (result.done) break;

        buffer += decoder.decode(result.value, { stream: true });
        let boundary = buffer.indexOf("\n\n");

        while (boundary >= 0) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const dataLines = frame
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim());

          if (dataLines.length > 0) {
            try {
              const payload = JSON.parse(dataLines.join("\n")) as DesktopEvent;
              if (payload.kind === "ready") {
                setConnectionStatus(`Streaming ${payload.sessionId}`);
              }
              if (payload.kind === "snapshot") {
                applySnapshot(payload.session);
              }
              if (payload.kind === "chat") {
                setMessages((prev) => {
                  const exists = prev.some(
                    (entry) => entry.id === payload.message.id,
                  );
                  if (exists) return prev;
                  return [...prev, payload.message];
                });
              }
              if (payload.kind === "error") {
                setConnectionStatus(`Runtime error: ${payload.message}`);
              }
            } catch {
              // Ignore malformed stream frames.
            }
          }

          boundary = buffer.indexOf("\n\n");
        }
      }
    },
    [apiBase, apiToken, applySnapshot],
  );

  const runGoal = useCallback(async () => {
    setCenterTab("worklog");
    setConnectionStatus("Starting session...");

    try {
      const ensuredToken = apiToken || (await getOrCreateMemoryToken()) || "";
      if (ensuredToken && !apiToken) {
        setApiToken(ensuredToken);
        writeMemoryTokenToStorage(ensuredToken);
      }

      const headers = {
        "Content-Type": "application/json",
        ...(ensuredToken ? { Authorization: `Bearer ${ensuredToken}` } : {}),
      };

      const response = await fetch(
        `${apiBase.replace(/\/$/, "")}/api/agent/desktop/sessions`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ goal }),
        },
      );

      if (!response.ok) {
        throw new Error(`Start failed (${response.status})`);
      }

      const body = (await response.json()) as unknown;
      const payload = parseApiPayload<{ session?: DesktopSessionPayload }>(
        body,
      );
      const session = payload?.session;
      if (!session) {
        throw new Error("Missing session payload");
      }

      setSessionId(session.id);
      applySnapshot(session);
      setConnectionStatus(
        `Session ${session.id} started · ${apiBase ? "direct backend" : "same-origin proxy"}`,
      );
      void openSessionStream(session.id, ensuredToken).catch((error) => {
        setConnectionStatus(
          `Stream disconnected: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      });
    } catch (error) {
      setConnectionStatus(
        `Start failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `m${prev.length + 1}`,
          role: "assistant",
          text: "Could not start backend run. Confirm API base and Bearer token.",
        },
      ]);
    }
  }, [apiBase, apiToken, applySnapshot, goal, openSessionStream]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: "user",
          text,
        },
      ]);

      if (!sessionId) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m${prev.length + 1}`,
            role: "assistant",
            text: "Start a run first so chat can attach to an active desktop session.",
          },
        ]);
        return;
      }

      try {
        const ensuredToken = apiToken || (await getOrCreateMemoryToken()) || "";
        if (ensuredToken && !apiToken) {
          setApiToken(ensuredToken);
          writeMemoryTokenToStorage(ensuredToken);
        }

        const headers = {
          "Content-Type": "application/json",
          ...(ensuredToken ? { Authorization: `Bearer ${ensuredToken}` } : {}),
        };

        const response = await fetch(
          `${apiBase.replace(/\/$/, "")}/api/agent/desktop/sessions/${encodeURIComponent(sessionId)}/chat`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ message: text }),
          },
        );

        if (!response.ok) {
          throw new Error(`Chat failed (${response.status})`);
        }

        const body = (await response.json()) as unknown;
        const payload = parseApiPayload<{ session?: DesktopSessionPayload }>(
          body,
        );
        if (payload?.session) {
          applySnapshot(payload.session);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m${prev.length + 1}`,
            role: "assistant",
            text: `Chat failed: ${error instanceof Error ? error.message : "unknown error"}`,
          },
        ]);
      }
    },
    [apiBase, apiToken, applySnapshot, sessionId],
  );

  const agents = useMemo<AgentStatus[]>(() => {
    if (sessionState === "idle") {
      return [
        { role: "Manager", state: "idle" },
        { role: "Coder", state: "idle" },
        { role: "Reviewer", state: "idle" },
        { role: "Verifier", state: "idle" },
      ];
    }
    if (sessionState === "repairing") {
      return [
        { role: "Manager", state: "running" },
        { role: "Coder", state: "running" },
        { role: "Reviewer", state: "blocked" },
        { role: "Verifier", state: "blocked" },
      ];
    }
    if (sessionState === "success") {
      return [
        { role: "Manager", state: "idle" },
        { role: "Coder", state: "idle" },
        { role: "Reviewer", state: "idle" },
        { role: "Verifier", state: "idle" },
      ];
    }
    return [
      { role: "Manager", state: "running" },
      { role: "Coder", state: "running" },
      { role: "Reviewer", state: "running" },
      { role: "Verifier", state: "running" },
    ];
  }, [sessionState]);
  const hasPrArtifact = sessionState === "success" && changes.length > 0;

  return (
    <div className="flex h-screen w-full flex-col bg-[#08080a] text-white">
      <div className="flex h-11 items-center justify-between border-b border-white/10 bg-[#0b0b0d]/95 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="inline-flex size-7 items-center justify-center rounded-md border border-white/10 bg-white/4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85">
            M
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white/90">
              MemoryOS Operator Workspace
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-white/40">
                Devin-style session control plane
              </p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  hasPrArtifact
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-white/4 text-white/60"
                }`}
              >
                {hasPrArtifact ? "PR #1 ready" : "PR pending"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-white/65">
            {shellEvents.length} shell events
          </span>
          <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-white/65">
            {changes.length} file changes
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-semibold ${
              hasPrArtifact
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                : sessionState === "repairing"
                  ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
                  : "border-white/10 bg-white/4 text-white/65"
            }`}
          >
            {hasPrArtifact ? "PR ready" : "PR pending"}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[17.5rem_minmax(0,1fr)_21.5rem]">
        <LeftNav
          goal={goal}
          onGoalChange={setGoal}
          onRun={runGoal}
          sessionState={sessionState}
          messages={messages}
          onSendMessage={(message) => {
            void sendMessage(message);
          }}
          apiBase={apiBase}
          onApiBaseChange={setApiBase}
          apiToken={apiToken}
          onApiTokenChange={setApiToken}
          connectionStatus={connectionStatus}
        />

        <CenterWorkspace
          activeTab={centerTab}
          onSelectTab={setCenterTab}
          worklog={worklog}
          changes={changes}
          sessionState={sessionState}
        >
          {children}
        </CenterWorkspace>

        <RightRail
          sessionState={sessionState}
          shellEvents={shellEvents}
          agents={agents}
        />
      </div>
    </div>
  );
}
