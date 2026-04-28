"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import {
  fetchMemoryTokenFromBridge,
  getOrCreateMemoryTokenWithRetry,
  readMemoryTokenFromStorage,
} from "@/lib/memory-token";

type PlaygroundMode = "process" | "retrieve" | "resume" | "handoff";
type CenterTab = "chat" | "code" | "python";

type MemoryRecord = {
  id: string;
  type: string;
  summary: string;
  content: string;
  status: string;
  confidence: number;
  updatedAt: string;
};

type InsightsResponse = {
  totalsByType: Record<string, number>;
  totalsByStatus: Record<string, number>;
  topSkills: string[];
  activeProjects: string[];
  recentMilestones: string[];
};

type TimelineEvent = {
  id: string;
  eventType: string;
  reason?: string;
  timestamp: string;
};

type RequestEvent = {
  id: string;
  method: string;
  path: string;
  routeType: string;
  statusCode: number;
  status: "Success" | "Error";
  durationMs: number;
  createdAt: string;
};

type MemoryListResponse = {
  memories: MemoryRecord[];
  count: number;
};

type TimelineResponse = {
  events: TimelineEvent[];
  count: number;
};

type RequestHistoryResponse = {
  requests: RequestEvent[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
};

type ModeConfig = {
  mode: PlaygroundMode;
  label: string;
  endpoint: string;
  description: string;
};

const MODE_CONFIG: ModeConfig[] = [
  {
    mode: "process",
    label: "Process",
    endpoint: "/api/memory/process",
    description: "Ingest one message into memory extraction.",
  },
  {
    mode: "retrieve",
    label: "Retrieve",
    endpoint: "/api/memory/retrieve",
    description: "Get ranked memories for the active question.",
  },
  {
    mode: "resume",
    label: "Resume",
    endpoint: "/api/memory/resume",
    description: "Build continuation state for current project.",
  },
  {
    mode: "handoff",
    label: "Handoff",
    endpoint: "/api/memory/handoff",
    description: "Generate handoff payload for another agent/human.",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload)) {
    if (typeof payload.error === "string" && payload.error.length > 0) {
      return payload.error;
    }
    if (typeof payload.message === "string" && payload.message.length > 0) {
      return payload.message;
    }
  }
  return fallback;
}

function isUnauthorized(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const text = error.message.toLowerCase();
  return text.includes("unauthorized") || text.includes("status 401");
}

function formatTs(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "--";
  }
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confidenceToPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 1) {
    return Math.max(0, Math.min(100, Math.round(value * 100)));
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function responseSnippet(payload: unknown, mode: PlaygroundMode): string {
  if (!isRecord(payload)) {
    return "Received response payload.";
  }

  if (mode === "process") {
    const accepted = Array.isArray(payload.acceptedMemories) ? payload.acceptedMemories.length : 0;
    const timeline = Array.isArray(payload.timelineEvents) ? payload.timelineEvents.length : 0;
    return `Stored update. Accepted memories: ${accepted}. Timeline events: ${timeline}.`;
  }

  if (mode === "retrieve") {
    const memories = Array.isArray(payload.memories) ? payload.memories.length : 0;
    return `Retrieved ${memories} ranked memories for current question.`;
  }

  if (mode === "resume") {
    if (typeof payload.summary === "string" && payload.summary.trim().length > 0) {
      return payload.summary;
    }
    return "Resume generated for active project.";
  }

  if (mode === "handoff") {
    if (typeof payload.summary === "string" && payload.summary.trim().length > 0) {
      return payload.summary;
    }
    return "Handoff generated for active project.";
  }

  return "Response received.";
}

async function fetchMemoryApi<T>(
  routePath: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const backendOrigin =
    process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() ??
    "http://localhost:3001";
  const normalizedOrigin = backendOrigin.replace(/\/+$/, "");
  const path = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const url = `${normalizedOrigin}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Request failed with status ${response.status}`));
  }

  return payload as T;
}

export function PlaygroundSection() {
  const [mode, setMode] = useState<PlaygroundMode>("process");
  const [tab, setTab] = useState<CenterTab>("chat");
  const [token, setToken] = useState(readMemoryTokenFromStorage() ?? "");
  const [threadId, setThreadId] = useState("playground-thread-1");
  const [project, setProject] = useState("memoryos-playground");
  const [workspace, setWorkspace] = useState("memoryostm");
  const [topK, setTopK] = useState(5);
  const [input, setInput] = useState("I am building MemoryOS and now focusing on Week 2 live traction.");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      text: "MemoryOS Playground live mode. Send a real update to start memory graph evolution.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [rawResponse, setRawResponse] = useState("{\n  \"status\": \"ready\"\n}");
  const [statusLine, setStatusLine] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [requests, setRequests] = useState<RequestEvent[]>([]);
  const [graphScale, setGraphScale] = useState(1);

  const selectedConfig = useMemo(
    () => MODE_CONFIG.find((item) => item.mode === mode) ?? MODE_CONFIG[0],
    [mode],
  );

  const withAuthorizedToken = useCallback(
    async <T,>(work: (effectiveToken: string) => Promise<T>): Promise<T> => {
      const cachedToken = token.trim() || readMemoryTokenFromStorage() || "";
      const initial =
        cachedToken ||
        (await getOrCreateMemoryTokenWithRetry({
          attempts: 3,
          delayMs: 250,
        })) ||
        "";

      if (!initial) {
        throw new Error("Missing API token. Sign in from developer console first.");
      }

      setToken(initial);

      try {
        return await work(initial);
      } catch (error) {
        if (!isUnauthorized(error)) {
          throw error;
        }

        const refreshed = await fetchMemoryTokenFromBridge();
        if (!refreshed) {
          throw error;
        }

        setToken(refreshed);
        return work(refreshed);
      }
    },
    [token],
  );

  const refreshLiveData = useCallback(
    async (effectiveToken: string): Promise<void> => {
      const [memoryPayload, insightPayload, timelinePayload, requestPayload] = await Promise.all([
        fetchMemoryApi<MemoryListResponse>("/api/memory/list?limit=40", effectiveToken),
        fetchMemoryApi<InsightsResponse>("/api/memory/insights", effectiveToken),
        fetchMemoryApi<TimelineResponse>("/api/memory/timeline?limit=40", effectiveToken),
        fetchMemoryApi<RequestHistoryResponse>("/api/memory/requests?limit=30&range=all", effectiveToken),
      ]);

      setMemories(memoryPayload.memories);
      setInsights(insightPayload);
      setTimeline(timelinePayload.events);
      setRequests(requestPayload.requests);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setStatusLine("Syncing live memory data...");
        await withAuthorizedToken(async (effectiveToken) => {
          if (cancelled) return;
          await refreshLiveData(effectiveToken);
        });
        if (!cancelled) {
          setStatusLine("Live data loaded");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load live data");
          setStatusLine("Auth required");
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [refreshLiveData, withAuthorizedToken]);

  const profileCards = useMemo(() => {
    return memories.slice(0, 4).map((memory) => ({
      id: memory.id,
      text: memory.summary || memory.content,
    }));
  }, [memories]);

  const recentSessions = useMemo(() => {
    return requests.slice(0, 4).map((request) => ({
      id: request.id,
      title: `${request.routeType} · ${request.status}`,
      detail: `${request.method} ${request.path} · ${request.durationMs}ms`,
      at: request.createdAt,
    }));
  }, [requests]);

  const graphNodes = useMemo(() => {
    const source = memories.slice(0, 8);
    if (source.length === 0) {
      return [] as Array<{
        id: string;
        x: number;
        y: number;
        label: string;
        type: string;
      }>;
    }

    return source.map((memory, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      return {
        id: memory.id,
        x: 70 + col * 100,
        y: 70 + row * 95,
        label: memory.type,
        type: memory.type,
      };
    });
  }, [memories]);

  const graphEdges = useMemo(() => {
    if (graphNodes.length <= 1) {
      return [] as Array<{ from: string; to: string }>;
    }

    return graphNodes.slice(1).map((node) => ({
      from: graphNodes[0].id,
      to: node.id,
    }));
  }, [graphNodes]);

  async function runModeCall() {
    const text = input.trim();
    if (!text) {
      setErrorMessage("Enter a message or question first.");
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setStatusLine(`Running ${selectedConfig.label}...`);

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage]);

    try {
      const payload = await withAuthorizedToken(async (effectiveToken) => {
        let body: Record<string, unknown>;

        if (mode === "process") {
          body = {
            threadId,
            message: text,
          };
        } else if (mode === "retrieve") {
          body = {
            question: text,
            topK,
            threadId,
            project,
            workspace,
          };
        } else {
          body = {
            question: text,
            project,
            topK,
            threadId,
            workspace,
          };
        }

        const response = await fetchMemoryApi<unknown>(selectedConfig.endpoint, effectiveToken, {
          method: "POST",
          body: JSON.stringify(body),
        });

        await refreshLiveData(effectiveToken);
        return response;
      });

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: responseSnippet(payload, mode),
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, assistantMessage]);
      setRawResponse(JSON.stringify(payload, null, 2));
      setStatusLine(`${selectedConfig.label} completed`);
      setInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      setErrorMessage(message);
      setStatusLine("Request failed");
      setMessages((current) => [
        ...current,
        {
          id: `err-${Date.now()}`,
          role: "system",
          text: `Error: ${message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  function handleNewChat() {
    setMessages([
      {
        id: `system-${Date.now()}`,
        role: "system",
        text: "New chat started. MemoryOS is ready for live continuity requests.",
        createdAt: new Date().toISOString(),
      },
    ]);
    setThreadId(`playground-thread-${Date.now().toString().slice(-6)}`);
    setInput("");
    setRawResponse("{\n  \"status\": \"new chat\"\n}");
    setErrorMessage(null);
    setStatusLine("New chat session created");
  }

  const stats = {
    memories: memories.length,
    documents: timeline.length,
    connections: Math.max(0, graphEdges.length),
  };

  return (
    <main className="min-h-screen bg-[#07090f] text-white">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[320px_1fr_360px]">
        <aside className="border-b border-white/10 bg-[#090c13] xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <span className="inline-flex origin-left scale-[0.84]">
              <MemoryStarLogo tone="white" />
            </span>
            <span className="rounded-[8px] border border-[#2678ff]/40 bg-[#102145] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[#a9c7ff]">
              Live
            </span>
          </div>

          <div className="px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">Profile</p>
            <div className="mt-3 space-y-2.5">
              {profileCards.length > 0 ? (
                profileCards.map((card) => (
                  <div key={card.id} className="rounded-[10px] border border-white/10 bg-[#0f141e] px-3 py-3 text-[14px] text-white/82">
                    {card.text}
                  </div>
                ))
              ) : (
                <div className="rounded-[10px] border border-dashed border-white/15 bg-[#0d111a] px-3 py-3 text-[13px] text-white/55">
                  No profile memories yet. Run a Process call.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">Sessions</p>
            <div className="mt-3 space-y-2.5">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div key={session.id} className="rounded-[10px] border border-white/10 bg-[#0f141e] px-3 py-3">
                    <p className="text-[13px] font-semibold text-white/90">{session.title}</p>
                    <p className="mt-1 text-[12px] text-white/60">{session.detail}</p>
                    <p className="mt-1 text-[11px] text-white/40">{formatTs(session.at)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[10px] border border-dashed border-white/15 bg-[#0d111a] px-3 py-3 text-[13px] text-white/55">
                  No API request sessions yet.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">Get Started</p>
            <div className="mt-3 rounded-[10px] border border-white/10 bg-[#0f141e] p-3">
              <p className="text-[13px] text-white/74">Production-ready memory infrastructure</p>
              <a
                href="/developer-console"
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-[#2678ff] text-[13px] font-semibold text-white transition hover:bg-[#3a87ff]"
              >
                Back to Console
              </a>
            </div>
          </div>
        </aside>

        <section className="border-b border-white/10 xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-5 py-3">
            <div className="flex items-center gap-1 rounded-[10px] border border-white/10 bg-[#0c1018] p-1">
              {[
                { key: "chat", label: "Chat.md" },
                { key: "code", label: "code.ts" },
                { key: "python", label: "main.py" },
              ].map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setTab(entry.key as CenterTab)}
                  className={`rounded-[8px] px-3 py-2 text-[13px] transition ${
                    tab === entry.key
                      ? "bg-[#1a2232] text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              className="rounded-[10px] bg-[#5fa4ff] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#77b2ff]"
            >
              + New Chat
            </button>
          </div>

          <div className="max-h-[calc(100vh-240px)] overflow-y-auto px-5 py-4">
            {tab === "chat" ? (
              <>
                <div className="mb-4 rounded-[12px] border border-white/10 bg-[radial-gradient(100%_130%_at_50%_0%,rgba(79,147,255,0.18),transparent_70%),#0c111b] p-4">
                  <p className="text-[16px] font-semibold tracking-[-0.02em]">MemoryOS Playground</p>
                  <p className="mt-1 text-[14px] text-white/60">
                    Live continuity workspace for process, retrieve, resume, and handoff.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MODE_CONFIG.map((entry) => (
                      <button
                        key={entry.mode}
                        type="button"
                        onClick={() => setMode(entry.mode)}
                        className={`rounded-[8px] border px-2.5 py-1.5 text-[12px] transition ${
                          mode === entry.mode
                            ? "border-[#4f93ff]/50 bg-[#4f93ff]/15 text-[#a9c7ff]"
                            : "border-white/12 bg-black/20 text-white/65 hover:text-white"
                        }`}
                      >
                        {entry.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[12px] text-white/52">{selectedConfig.description}</p>
                </div>

                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-[10px] border px-3.5 py-3 ${
                        message.role === "user"
                          ? "border-[#4f93ff]/35 bg-[#12203a]"
                          : message.role === "assistant"
                            ? "border-[#14c38e]/30 bg-[#0f2220]"
                            : "border-white/15 bg-[#0f141e]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] uppercase tracking-[0.1em] text-white/45">{message.role}</span>
                        <span className="text-[11px] text-white/38">{formatTs(message.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-[14px] leading-7 text-white/88">{message.text}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : tab === "code" ? (
              <pre className="rounded-[12px] border border-white/10 bg-[#0b1018] p-4 text-[13px] leading-6 text-[#b8c6de]">
{`import { beforeModel, afterModel, handoff } from "@memoryostm/sdk";

const state = await beforeModel({
  userId: "u_live_1",
  threadId: "${threadId}",
  project: "${project}",
});

// call your LLM here with injected context

await afterModel({
  userId: "u_live_1",
  threadId: "${threadId}",
  message: "${input || "your latest update"}",
});

const next = await handoff({
  project: "${project}",
  question: "what should I do next?",
});`}
              </pre>
            ) : (
              <pre className="rounded-[12px] border border-white/10 bg-[#0b1018] p-4 text-[13px] leading-6 text-[#b8c6de]">
{`from memoryostm import MemoryOS

client = MemoryOS(api_key="<MEMORYOS_API_KEY>")

client.process(thread_id="${threadId}", message="${input || "your update"}")
resume = client.resume(project="${project}", question="what next?")
handoff = client.handoff(project="${project}", question="handoff to another agent")`}
              </pre>
            )}

            {errorMessage ? (
              <div className="mt-4 rounded-[10px] border border-[#ff6d6d]/40 bg-[#2a1515] px-3.5 py-2.5 text-[13px] text-[#ffb3b3]">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            <div className="mb-2 grid gap-2 md:grid-cols-2">
              <input
                value={project}
                onChange={(event) => setProject(event.target.value)}
                placeholder="project"
                className="h-10 rounded-[8px] border border-white/12 bg-[#0d121c] px-3 text-[13px] text-white outline-none"
              />
              <input
                value={threadId}
                onChange={(event) => setThreadId(event.target.value)}
                placeholder="threadId"
                className="h-10 rounded-[8px] border border-white/12 bg-[#0d121c] px-3 text-[13px] text-white outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === "process" ? "Add a real project update..." : "Ask a continuity question..."}
                className="h-12 flex-1 rounded-[10px] border border-white/12 bg-[#0d121c] px-4 text-[14px] text-white outline-none"
              />
              <button
                type="button"
                onClick={() => void runModeCall()}
                disabled={isRunning}
                className="h-12 rounded-[10px] bg-[#2678ff] px-4 text-[14px] font-semibold text-white transition hover:bg-[#3a87ff] disabled:opacity-60"
              >
                {isRunning ? "Running..." : `Run ${selectedConfig.label}`}
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px] text-white/45">
              <span>Status: {statusLine}</span>
              <span>TopK: </span>
              <input
                type="number"
                value={topK}
                min={1}
                max={20}
                onChange={(event) => setTopK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
                className="h-7 w-16 rounded-[6px] border border-white/12 bg-[#0d121c] px-2 text-[12px] text-white outline-none"
              />
              <span>Workspace: {workspace}</span>
            </div>
          </div>
        </section>

        <aside className="bg-[#0b0f18]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Memory Graph</p>
          </div>

          <div className="px-4 py-4">
            <div className="rounded-[12px] border border-white/10 bg-[linear-gradient(180deg,#0d1523_0%,#0b111c_100%)] p-3">
              <div className="overflow-hidden rounded-[10px] border border-white/8 bg-[#08101b]">
                <svg viewBox="0 0 340 280" className="h-[280px] w-full" role="img" aria-label="memory graph">
                  <defs>
                    <pattern id="grid-playground" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#132338" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect x="0" y="0" width="340" height="280" fill="url(#grid-playground)" />
                  <g transform={`scale(${graphScale})`}>
                    {graphEdges.map((edge) => {
                      const from = graphNodes.find((node) => node.id === edge.from);
                      const to = graphNodes.find((node) => node.id === edge.to);
                      if (!from || !to) return null;
                      return (
                        <line
                          key={`${edge.from}-${edge.to}`}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke="#4f93ff"
                          strokeOpacity="0.45"
                          strokeWidth="1.4"
                        />
                      );
                    })}
                    {graphNodes.map((node, index) => (
                      <g key={node.id}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={index === 0 ? 12 : 9}
                          fill={index === 0 ? "#14c38e" : "#4f93ff"}
                          fillOpacity={index === 0 ? 0.85 : 0.68}
                        />
                        <text x={node.x + 14} y={node.y + 4} fill="#9fc1ff" fontSize="10">
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </g>
                </svg>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGraphScale((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))))}
                  className="h-8 w-8 rounded-[8px] border border-white/12 bg-[#0e1521] text-white/70"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setGraphScale(1)}
                  className="h-8 rounded-[8px] border border-white/12 bg-[#0e1521] px-3 text-[12px] text-white/70"
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => setGraphScale((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
                  className="h-8 w-8 rounded-[8px] border border-white/12 bg-[#0e1521] text-white/70"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-[12px] border border-white/10 bg-[#0d121c] p-3.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/38">Statistics</p>
              <div className="mt-2 space-y-2 text-[14px] text-white/82">
                <div className="flex items-center justify-between"><span>memories</span><span>{stats.memories}</span></div>
                <div className="flex items-center justify-between"><span>documents</span><span>{stats.documents}</span></div>
                <div className="flex items-center justify-between"><span>connections</span><span>{stats.connections}</span></div>
              </div>
            </div>

            <div className="mt-3 rounded-[12px] border border-white/10 bg-[#0d121c] p-3.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/38">Legend</p>
              <div className="mt-2 space-y-2 text-[13px] text-white/72">
                <p>Nodes: Memory (latest), Memory (older), Document</p>
                <p>Status: active, stale, contradicted, merged</p>
                <p>Relations: updates, derives, extends</p>
              </div>
            </div>

            <div className="mt-3 rounded-[12px] border border-white/10 bg-[#0d121c] p-3.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/38">What I found out</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-white/78">
                {(insights?.topSkills?.slice(0, 4) ?? []).map((skill) => (
                  <li key={skill}>• {skill}</li>
                ))}
                {(insights?.activeProjects?.slice(0, 2) ?? []).map((p) => (
                  <li key={p}>• Project: {p}</li>
                ))}
                {insights && insights.topSkills.length === 0 && insights.activeProjects.length === 0 ? (
                  <li>• No insights yet. Run Process to generate signals.</li>
                ) : null}
              </ul>
            </div>

            <details className="mt-3 rounded-[12px] border border-white/10 bg-[#0d121c] p-3.5">
              <summary className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.12em] text-white/38">
                Raw API Response
              </summary>
              <pre className="mt-3 max-h-[220px] overflow-auto rounded-[8px] border border-white/10 bg-[#090d15] p-3 text-[11px] leading-5 text-[#a9bdd9]">
                {rawResponse}
              </pre>
            </details>
          </div>
        </aside>
      </div>
    </main>
  );
}
