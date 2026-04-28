"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import {
  fetchMemoryTokenFromBridge,
  getOrCreateMemoryTokenWithRetry,
  readMemoryTokenFromStorage,
} from "@/lib/memory-token";

type VoiceSpeaker = "user" | "assistant" | "system";

type DemoChunk = {
  speaker: VoiceSpeaker;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  tags: string[];
};

type VoiceSession = {
  sessionId: string;
  userId: string;
  source: "pipecat";
  status: "active" | "ended";
  workspace?: string;
  project?: string;
  threadId?: string;
  startedAt: string;
  endedAt?: string;
  chunkCount: number;
  totalCharacters: number;
  lastChunkAt?: string;
};

type MemoryRecord = {
  id: string;
  type: string;
  content: string;
  summary: string;
  confidence: number;
  updatedAt: string;
};

type TimelineEventRecord = {
  id: string;
  eventType: string;
  reason: string;
  timestamp: string;
};

type InsightsResponse = {
  topSkills: string[];
  activeProjects: string[];
  recentMilestones: string[];
  totalsByType: Record<string, number>;
};

type StartSessionResponse = {
  session: VoiceSession;
};

type VoiceChunkResponse = {
  session: VoiceSession;
  timelineEvents: TimelineEventRecord[];
};

type EndSessionResponse = {
  session: VoiceSession;
};

type ListMemoryResponse = {
  memories: MemoryRecord[];
};

const DEMO_CHUNKS: DemoChunk[] = [
  {
    speaker: "user",
    text: "I am building a voice support copilot with memoryosTM and Pipecat.",
    sentiment: "positive",
    tags: ["voice", "copilot", "project"],
  },
  {
    speaker: "user",
    text: "I see latency spikes during handoffs and want smoother continuity.",
    sentiment: "negative",
    tags: ["latency", "handoff", "debug"],
  },
  {
    speaker: "user",
    text: "Please preserve context across calls for the same customer session.",
    sentiment: "neutral",
    tags: ["session", "continuity", "memory"],
  },
  {
    speaker: "user",
    text: "Next step is ingesting transcript chunks every 30 seconds in production.",
    sentiment: "neutral",
    tags: ["next-step", "ingestion", "roadmap"],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "--";
  }
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseJwtUserId(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const decoded = window.atob(payload);
    const parsed: unknown = JSON.parse(decoded);
    if (isRecord(parsed) && typeof parsed.sub === "string" && parsed.sub.trim().length > 0) {
      return parsed.sub.trim();
    }
    return null;
  } catch {
    return null;
  }
}

function isUnauthorizedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("unauthorized") || message.includes("status 401");
}

async function fetchMemoryApi<T>(
  routePath: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const origin = (process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN ?? "http://localhost:3001").replace(/\/+$/, "");
  const path = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const url = `${origin}${path}`;

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
    if (isRecord(payload) && typeof payload.error === "string") {
      throw new Error(payload.error);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  return payload as T;
}

function mergeTimeline(
  current: TimelineEventRecord[],
  incoming: TimelineEventRecord[],
): TimelineEventRecord[] {
  const byId = new Map<string, TimelineEventRecord>();
  for (const item of current) {
    byId.set(item.id, item);
  }
  for (const item of incoming) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function RunDemoSection() {
  const [activeTab, setActiveTab] = useState<"context" | "graph">("context");
  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionIdentity, setSessionIdentity] = useState(() => ({
    sessionId: "session-pending",
    threadId: "voice:pending",
  }));
  const [displayUserId, setDisplayUserId] = useState("user-unknown");
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventRecord[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [conversation, setConversation] = useState<DemoChunk[]>([]);
  const [showPipecatLogo, setShowPipecatLogo] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadToken() {
      const token = await getOrCreateMemoryTokenWithRetry({
        attempts: 3,
        delayMs: 250,
      });
      if (!mounted) {
        return;
      }

      setAuthToken(token);
      const parsedUserId = parseJwtUserId(token);
      if (parsedUserId) {
        setDisplayUserId(parsedUserId);
      }
    }

    void loadToken();

    return () => {
      mounted = false;
    };
  }, []);

  const withAuthorizedToken = useCallback(
    async <T,>(work: (token: string) => Promise<T>): Promise<T> => {
      const cached = authToken ?? readMemoryTokenFromStorage();
      const initialToken =
        cached ??
        (await getOrCreateMemoryTokenWithRetry({
          attempts: 3,
          delayMs: 250,
        }));

      if (!initialToken) {
        throw new Error("Missing API token. Sign in again so MemoryOS can mint one.");
      }

      setAuthToken(initialToken);

      try {
        return await work(initialToken);
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          throw error;
        }

        const refreshedToken = await fetchMemoryTokenFromBridge();
        if (!refreshedToken) {
          throw error;
        }

        setAuthToken(refreshedToken);
        return work(refreshedToken);
      }
    },
    [authToken],
  );

  const refreshLivePanels = useCallback(async (token: string): Promise<void> => {
    const [memoryPayload, insightsPayload] = await Promise.all([
      fetchMemoryApi<ListMemoryResponse>("/api/memory/list?limit=30", token),
      fetchMemoryApi<InsightsResponse>("/api/memory/insights", token),
    ]);

    setMemories(memoryPayload.memories);
    setInsights(insightsPayload);
  }, []);

  async function startConversation(): Promise<void> {
    setErrorMessage(null);
    setIsStarting(true);
    setScriptIndex(0);
    setConversation([]);
    setTimelineEvents([]);
    setMemories([]);
    setInsights(null);

    try {
      const nextSessionId = `session-${crypto.randomUUID().slice(0, 8)}`;
      const nextThreadId = `voice:${crypto.randomUUID().slice(0, 8)}`;
      setSessionIdentity({ sessionId: nextSessionId, threadId: nextThreadId });

      const payload = await withAuthorizedToken((token) =>
        fetchMemoryApi<StartSessionResponse>(
          "/api/memory/voice/sessions/start",
          token,
          {
            method: "POST",
            body: JSON.stringify({
              sessionId: nextSessionId,
              source: "pipecat",
              workspace: "memoryosTM",
              project: "voice-continuity-demo",
              threadId: nextThreadId,
            }),
          },
        ),
      );

      setSession(payload.session);
      setIsRecording(true);
      await withAuthorizedToken((token) => refreshLivePanels(token));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to start session");
    } finally {
      setIsStarting(false);
    }
  }

  const ingestChunk = useCallback(async (chunk: DemoChunk, index: number): Promise<void> => {
    const activeSessionId = session?.sessionId ?? sessionIdentity.sessionId;
    const activeThreadId = session?.threadId ?? sessionIdentity.threadId;
    if (activeSessionId.endsWith("pending") || activeThreadId.endsWith("pending")) {
      return;
    }

    try {
      const payload = await withAuthorizedToken((token) =>
        fetchMemoryApi<VoiceChunkResponse>(
          "/api/memory/voice/chunk",
          token,
          {
            method: "POST",
            body: JSON.stringify({
              sessionId: activeSessionId,
              chunk: chunk.text,
              chunkIndex: index,
              speaker: chunk.speaker,
              sentiment: chunk.sentiment,
              tags: chunk.tags,
              threadId: activeThreadId,
              workspace: "memoryosTM",
              project: "voice-continuity-demo",
            }),
          },
        ),
      );

      setSession(payload.session);
      setTimelineEvents((current) =>
        mergeTimeline(current, payload.timelineEvents ?? []),
      );
      setConversation((current) => [...current, chunk]);
      await withAuthorizedToken((token) => refreshLivePanels(token));
      setScriptIndex((current) => current + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Chunk ingestion failed");
      setIsRecording(false);
    }
  }, [refreshLivePanels, session?.sessionId, session?.threadId, sessionIdentity.sessionId, sessionIdentity.threadId, withAuthorizedToken]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }
    if (!authToken) {
      return;
    }
    if (scriptIndex >= DEMO_CHUNKS.length) {
      return;
    }

    const nextChunk = DEMO_CHUNKS[scriptIndex];
    const timer = window.setTimeout(() => {
      void ingestChunk(nextChunk, scriptIndex);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [authToken, ingestChunk, isRecording, scriptIndex]);

  async function endConversation(): Promise<void> {
    setIsEnding(true);
    setErrorMessage(null);
    try {
      const summary = `Session captured ${conversation.length} transcript chunks for ${displayUserId}.`;
      const activeSessionId = session?.sessionId ?? sessionIdentity.sessionId;
      const payload = await withAuthorizedToken((token) =>
        fetchMemoryApi<EndSessionResponse>(
          "/api/memory/voice/sessions/end",
          token,
          {
            method: "POST",
            body: JSON.stringify({
              sessionId: activeSessionId,
              finalSummary: summary,
            }),
          },
        ),
      );
      setSession(payload.session);
      await withAuthorizedToken((token) => refreshLivePanels(token));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to end session");
    } finally {
      setIsEnding(false);
      setIsRecording(false);
    }
  }

  const filteredMemories = memories.filter((memory) => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return true;
    }
    return (
      memory.summary.toLowerCase().includes(query) ||
      memory.content.toLowerCase().includes(query)
    );
  });

  const profileLines = [
    `User: ${displayUserId}`,
    `Top signal: ${insights?.topSkills[0] ?? "voice continuity"}`,
    `Active project: ${insights?.activeProjects[0] ?? "voice-continuity-demo"}`,
  ];

  if (!isRecording) {
    return (
      <div className="grid min-h-[640px] place-items-center bg-[#ececec] px-6 text-[#222]">
        <div className="w-full max-w-[760px] text-center">
          <div className="flex flex-nowrap items-center justify-center gap-8 leading-none">
            <span className="inline-flex shrink-0 origin-left translate-y-[1px] scale-[1.2]">
              <MemoryStarLogo tone="black"/>
            </span>
            <span className="inline-flex w-[56px] shrink-0 justify-center text-[44px] font-semibold leading-none text-[#9a9a9a]">
              ×
            </span>
            {showPipecatLogo ? (
              <span className="inline-flex h-[74px] w-[260px] shrink-0 items-center justify-start bg-[#ececec]">
                <Image
                  src="/pipecat.png"
                  alt="Pipecat"
                  width={260}
                  height={74}
                  className="h-[74px] w-[260px] object-contain object-left mix-blend-multiply"
                  priority
                  unoptimized
                  onError={() => setShowPipecatLogo(false)}
                />
              </span>
            ) : (
              <span className="shrink-0 text-[62px] font-semibold leading-none tracking-[-0.005em]">
                Pipecat
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void startConversation()}
            disabled={isStarting}
            className="mx-auto mt-16 grid h-28 w-28 place-items-center bg-[#4fd07d] text-[#0f3f22] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ borderRadius: "9999px" }}
            aria-label="start conversation"
          >
            ●
          </button>
          <button
            type="button"
            onClick={() => void startConversation()}
            disabled={isStarting}
            className="mt-8 font-mono text-[25px] tracking-[0.1em] text-[#647383] disabled:opacity-70"
          >
            {isStarting ? "[ starting ]" : "[ start conversation ]"}
          </button>
          <p className="mt-10 text-[20px] text-[#7c7c7c]">User ID: {displayUserId}</p>
          <p className="mt-2 text-[15px] text-[#8a8a8a]">
            Token source: {authToken ? "memoryos.apiToken detected" : "no token found"}
          </p>
          {errorMessage ? (
            <p className="mx-auto mt-4 max-w-[560px] border border-[#e8b7b7] bg-[#fff4f4] px-4 py-2 text-[14px] text-[#9d3f3f]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[640px] border border-[#d7d7d7] bg-[#ececec] text-[#222]">
      <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-[#d4d4d4]">
        <div className="border-r border-[#d4d4d4] px-6 py-5">
          <div className="flex flex-nowrap items-center gap-4 leading-none">
            <span className="inline-flex shrink-0 origin-left translate-y-[1px] scale-[0.86]">
              <MemoryStarLogo tone="black" />
            </span>
            <span className=" inline-flex w-[24px] shrink-0 justify-center text-[22px] font-semibold leading-none text-[#9a9a9a]">
              ×
            </span>
            {showPipecatLogo ? (
              <span className="inline-flex h-[36px] w-[126px] shrink-0 items-center justify-start bg-[#ececec] ">
                <Image
                  src="/pipecat.png"
                  alt="Pipecat"
                  width={126}
                  height={36}
                  className="h-[36px] w-[126px] object-contain object-left mix-blend-multiply"
                  unoptimized
                  onError={() => setShowPipecatLogo(false)}
                />
              </span>
            ) : (
              <span className="shrink-0 text-[29px] font-semibold leading-none tracking-[-0.005em]">
                Pipecat
              </span>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="h-8 w-8 bg-[#42ca73]" style={{ borderRadius: "9999px" }} />
              <span className="font-mono text-[20px] text-[#607080]">
                [ recording conversation ]
              </span>
            </div>
            <button
              type="button"
              onClick={() => void endConversation()}
              disabled={isEnding}
              className="border border-[#ef8f8f] px-3 py-1 text-[14px] tracking-[0.08em] text-[#d95858] disabled:opacity-60"
            >
              {isEnding ? "ENDING" : "END"}
            </button>
          </div>
          <p className="mt-3 text-[14px] text-[#788592]">
            Live chunks processed: {scriptIndex}/{DEMO_CHUNKS.length}
          </p>
        </div>

        <div className="col-span-2 grid grid-cols-[1fr_1fr]">
          <button
            type="button"
            onClick={() => setActiveTab("context")}
            className={`border-r border-[#d4d4d4] py-5 text-[18px] font-medium uppercase tracking-[0.08em] ${
              activeTab === "context"
                ? "border-b-2 border-b-[#222] text-[#222]"
                : "text-[#7b8591]"
            }`}
          >
            Context
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("graph")}
            className={`py-5 text-[18px] font-medium uppercase tracking-[0.08em] ${
              activeTab === "graph"
                ? "border-b-2 border-b-[#222] text-[#222]"
                : "text-[#7b8591]"
            }`}
          >
            Graph
          </button>
        </div>
      </div>

      <div className="grid min-h-[560px] grid-cols-[1fr_1fr_0.85fr]">
        <div className="border-r border-[#d4d4d4] px-6 py-6">
          <div className="w-full max-w-[320px] border border-[#d4d4d4] bg-[#f1f1f1] p-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8f9aa6]">
              Agent stream
            </p>
            {conversation.length === 0 ? (
              <p className="mt-2 text-[24px] text-[#2d3742]">Ready to listen...</p>
            ) : (
              <p className="mt-2 text-[17px] leading-7 text-[#2d3742]">
                {conversation[conversation.length - 1].text}
              </p>
            )}
          </div>
          {errorMessage ? (
            <p className="mt-3 border border-[#e8b7b7] bg-[#fff4f4] px-3 py-2 text-[13px] text-[#9d3f3f]">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="border-r border-[#d4d4d4] px-6 py-6">
          {activeTab === "context" ? (
            <>
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#707d8b]">
                Memories
              </p>
              <div className="mt-4 flex items-center gap-3">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search memories..."
                  className="h-12 w-full border border-[#d4d4d4] bg-[#f5f5f5] px-4 text-[20px] outline-none"
                />
                <button
                  type="button"
                  className="h-12 border border-[#1e2127] bg-[#1f2229] px-5 text-[15px] font-semibold text-white"
                >
                  SEARCH
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {filteredMemories.length > 0 ? (
                  filteredMemories.slice(0, 10).map((memory) => (
                    <div key={memory.id} className="border border-[#d4d4d4] bg-[#f5f5f5] p-3">
                      <div className="flex items-center justify-between text-[14px] text-[#6f7c89]">
                        <span className="uppercase">{memory.type}</span>
                        <span>{formatTime(memory.updatedAt)}</span>
                      </div>
                      <p className="mt-2 text-[18px] text-[#2d3742]">
                        {memory.summary || memory.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="grid min-h-[220px] place-items-center text-center text-[#8b949f]">
                    <div>
                      <p className="text-[22px]">no memories yet</p>
                      <p className="mt-2 text-[20px]">
                        Ingesting voice chunks to generate memories...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="border border-dashed border-[#c8ced5] bg-[#f3f3f3] p-4 text-[#5f6c78]">
                <p className="text-[18px] uppercase tracking-[0.08em]">
                  Live Knowledge Graph
                </p>
                <p className="mt-2 text-[15px]">
                  {timelineEvents.length} timeline updates from this session.
                </p>
              </div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
                {timelineEvents.length > 0 ? (
                  timelineEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-[#d4d4d4] bg-[#f5f5f5] px-3 py-2"
                    >
                      <p className="text-[12px] uppercase tracking-[0.08em] text-[#7f8a96]">
                        {event.eventType}
                      </p>
                      <p className="mt-1 text-[14px] text-[#3b4653]">{event.reason}</p>
                      <p className="mt-1 text-[12px] text-[#8d97a2]">
                        {formatTime(event.timestamp)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[14px] text-[#7d8792]">Loading graph...</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-6">
          <div className="border border-[#d4d4d4] bg-[#f5f5f5]">
            <div className="border-b border-[#d4d4d4] px-4 py-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#5d83cb]">
                Profile
              </p>
            </div>
            <div className="space-y-2 p-4">
              {profileLines.map((line) => (
                <p key={line} className="text-[15px] leading-6 text-[#3d4753]">
                  {line}
                </p>
              ))}
              <p className="text-[13px] text-[#64707c]">
                Active memory types:{" "}
                {Object.entries(insights?.totalsByType ?? {})
                  .filter(([, count]) => count > 0)
                  .map(([type]) => type)
                  .join(", ") || "none"}
              </p>
            </div>
          </div>

          <div className="mt-4 border border-[#d4d4d4] bg-[#f5f5f5]">
            <div className="border-b border-[#d4d4d4] px-4 py-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#3abf6b]">
                Session
              </p>
            </div>
            <div className="p-4 text-[14px] leading-6 text-[#3d4753]">
              <p>Session ID: {session?.sessionId ?? sessionIdentity.sessionId}</p>
              <p>Status: {session?.status ?? "active"}</p>
              <p>Chunks stored: {session?.chunkCount ?? scriptIndex}</p>
              <p>Characters: {session?.totalCharacters ?? 0}</p>
              <p>Thread ID: {session?.threadId ?? sessionIdentity.threadId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
