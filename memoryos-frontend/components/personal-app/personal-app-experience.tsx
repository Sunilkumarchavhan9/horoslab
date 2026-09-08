"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import { getOrCreateMemoryTokenWithRetry } from "@/lib/memory-token";
import styles from "./personal-app-experience.module.css";

type PersonalAppExperienceProps = {
  userId: string;
};

type QuickAction = {
  title: string;
  subtitle: string;
  icon: "link" | "note" | "chrome";
};

type PersonalMemoryRecord = {
  id: string;
  type: string;
  content: string;
  summary: string;
  updatedAt: string;
};

type PersonalInsightsResponse = {
  topSkills: string[];
  activeProjects: string[];
  recentMilestones: string[];
};

type PersonalMemoryListResponse = {
  memories: PersonalMemoryRecord[];
};

type PersonalTimelineResponse = {
  events: Array<{
    id: string;
    eventType: string;
    timestamp: string;
  }>;
  count: number;
};

type PersonalProcessResponse = {
  acceptedMemories: Array<{ id: string }>;
  timelineEvents: Array<{ id: string }>;
};

const QUICK_ACTIONS: QuickAction[] = [
  { title: "Save a link", subtitle: "Capture from the web", icon: "link" },
  { title: "Write a note", subtitle: "Capture an idea", icon: "note" },
  { title: "Browser extension", subtitle: "Install for one-click memory", icon: "chrome" },
];

const PROMPT_SUGGESTIONS = [
  "Show all memories related to onboarding and docs.",
  "Summarize major decisions from this week.",
  "Which memories connect product, design, and AI?",
  "What open loops should I close next?",
];

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    if (
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
    ) {
      return (payload as { error: string }).error;
    }

    if (
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
    ) {
      return (payload as { message: string }).message;
    }
  }

  return fallback;
}

async function fetchPersonalApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const configuredOrigin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim();
  const baseUrl =
    configuredOrigin && configuredOrigin !== "same-origin"
      ? configuredOrigin.replace(/\/+$/, "")
      : "";
  const response = await fetch(`${baseUrl}${path}`, {
    method: init?.method ?? "GET",
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
    throw new Error(
      extractErrorMessage(payload, `Request failed (${response.status}) for ${path}`),
    );
  }

  return payload as T;
}

function ActionIcon({ kind }: { kind: QuickAction["icon"] }) {
  if (kind === "link") {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6.4 9.6L9.6 6.4" />
        <path d="M5.3 11A3 3 0 0 1 1 11A3 3 0 0 1 1 6.7L3.2 4.5A3 3 0 0 1 7.5 4.5" />
        <path d="M10.7 5A3 3 0 0 1 15 5A3 3 0 0 1 15 9.3L12.8 11.5A3 3 0 0 1 8.5 11.5" />
      </svg>
    );
  }

  if (kind === "note") {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="1.8" width="12" height="12.4" rx="1.5" />
        <path d="M5 5.4H11M5 8H11M5 10.6H8.6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
      <circle cx="9" cy="9" r="8" fill="#fbbc05" />
      <path d="M9 1a8 8 0 0 1 6.93 4H9Z" fill="#ea4335" />
      <path d="M2.07 5A8 8 0 0 0 5 16.2l4-7.2Z" fill="#34a853" />
      <path d="M5 16.2A8 8 0 0 0 16.6 8.6H9Z" fill="#4285f4" />
    </svg>
  );
}

function TopTab({
  label,
  active,
  onClick,
}: {
  label: "Grid" | "Graph" | "Integrations";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.pill} px-3 py-1.5 text-sm font-medium tracking-[0.01em] transition md:px-4 md:text-[15px] ${
        active
          ? "bg-[#0a2d7c] text-[#F0EFE2] shadow-[inset_0_0_0_1px_rgba(98,145,245,0.72)]"
          : "bg-transparent text-[#F0EFE2]/62 hover:text-[#F0EFE2]"
      }`}
    >
      {label}
    </button>
  );
}

export function PersonalAppExperience({ userId }: PersonalAppExperienceProps) {
  const [activeTab, setActiveTab] = useState<"Grid" | "Graph" | "Integrations">("Grid");
  const [query, setQuery] = useState("");
  const [liveMemories, setLiveMemories] = useState<PersonalMemoryRecord[]>([]);
  const [liveInsights, setLiveInsights] = useState<PersonalInsightsResponse | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [timelineEventCount, setTimelineEventCount] = useState(0);
  const [isSeedingMemory, setIsSeedingMemory] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const shortUserId = useMemo(() => {
    if (userId.length <= 14) {
      return userId;
    }

    return `${userId.slice(0, 7)}...${userId.slice(-4)}`;
  }, [userId]);

  const promptSuggestions = useMemo(() => {
    if (!liveInsights) {
      return PROMPT_SUGGESTIONS;
    }

    const activeProject = liveInsights.activeProjects[0] ?? "my project";
    const topSkill = liveInsights.topSkills[0] ?? "continuity";
    const latestMilestone = liveInsights.recentMilestones[0] ?? "this week";

    return [
      `What changed in ${activeProject}?`,
      `Summarize milestones: ${latestMilestone}`,
      `How can I improve ${topSkill} quality this sprint?`,
      "What open loops should I close next?",
    ];
  }, [liveInsights]);

  const refreshLiveData = useCallback(async () => {
    try {
      const token = await getOrCreateMemoryTokenWithRetry({
        attempts: 4,
        delayMs: 300,
      });
      if (!token) {
        setLiveError("Sign in to load your live memories.");
        return;
      }

      const [memoryPayload, insightsPayload, timelinePayload] = await Promise.all([
        fetchPersonalApi<PersonalMemoryListResponse>("/api/memory/list?limit=24", token),
        fetchPersonalApi<PersonalInsightsResponse>("/api/memory/insights", token),
        fetchPersonalApi<PersonalTimelineResponse>("/api/memory/timeline?limit=24", token),
      ]);

      setLiveMemories(memoryPayload.memories ?? []);
      setLiveInsights(insightsPayload);
      setTimelineEventCount(timelinePayload.count ?? 0);
      setLiveError(null);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Failed to load live memory data.");
    }
  }, []);

  useEffect(() => {
    void refreshLiveData();
  }, [refreshLiveData, reloadKey]);

  async function createFirstMemory() {
    setIsSeedingMemory(true);
    setLiveError(null);
    try {
      const token = await getOrCreateMemoryTokenWithRetry({
        attempts: 4,
        delayMs: 300,
      });
      if (!token) {
        setLiveError("Sign in to create your first memory.");
        return;
      }

      await fetchPersonalApi<PersonalProcessResponse>("/api/memory/process", token, {
        method: "POST",
        body: JSON.stringify({
          threadId: `personal-onboarding-${Date.now()}`,
          message:
            "I started using MemoryOS Personal App. Keep continuity for my goals, notes, and ongoing product work.",
        }),
      });
      setQuery("What should I work on next based on my recent memory?");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Failed to create first memory.");
    } finally {
      setIsSeedingMemory(false);
    }
  }

  return (
    <main className="min-h-svh bg-[#05070d] text-[#F0EFE2]">
      <div className="relative min-h-svh overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_84%,rgba(53,78,237,0.42),rgba(8,10,16,0)_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_64%,rgba(12,51,177,0.28),rgba(8,10,16,0)_43%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(180deg,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_10px),repeating-linear-gradient(135deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_16px)] [background-size:100%_100%,100%_100%] [background-repeat:repeat]" />

        <div className="relative z-10 px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 md:gap-5">
              <span className="inline-flex scale-[0.84] origin-left md:scale-[0.9]">
                <MemoryStarLogo tone="white" />
              </span>
              <div className="hidden h-8 w-px bg-white/15 md:block" />
              <button
                type="button"
                className={`${styles.pill} inline-flex items-center gap-2 border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm text-[#F0EFE2]/92`}
              >
                <span>MemoryOS Space</span>
                <span className="text-[#F0EFE2]/50">⌄</span>
              </button>
            </div>

            <div
              className={`${styles.pill} flex items-center gap-1 border border-[#2e3954] bg-[#101622]/80 p-1`}
              role="tablist"
              aria-label="View mode"
            >
              <TopTab label="Grid" active={activeTab === "Grid"} onClick={() => setActiveTab("Grid")} />
              <TopTab label="Graph" active={activeTab === "Graph"} onClick={() => setActiveTab("Graph")} />
              <TopTab
                label="Integrations"
                active={activeTab === "Integrations"}
                onClick={() => setActiveTab("Integrations")}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={createFirstMemory}
                disabled={isSeedingMemory}
                className={`${styles.pill} border border-white/12 bg-[#0f141f]/85 px-3 py-2 text-sm font-medium text-[#F0EFE2]/95 md:px-4`}
              >
                {isSeedingMemory ? "Saving..." : "+ Add memory"}
              </button>
              <button
                type="button"
                className={`${styles.pill} hidden border border-white/12 bg-[#0f141f]/85 px-2.5 py-2 text-sm text-[#F0EFE2]/75 sm:inline-flex`}
                aria-label="Search"
              >
                ⌕
              </button>
              <button
                type="button"
                className={`${styles.pill} border border-white/12 bg-[#0f141f]/85 px-3 py-2 text-sm font-medium text-[#F0EFE2]/95 md:px-4`}
              >
                Feedback
              </button>
              <span
                className={`${styles.avatar} grid h-9 w-9 place-items-center bg-[#1a2232] text-xs font-semibold uppercase text-[#F0EFE2]/90`}
                title={userId}
              >
                {shortUserId.slice(0, 1)}
              </span>
            </div>
          </header>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className={`${styles.panel} relative min-h-[560px] p-5 md:min-h-[640px] md:p-8`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(188,205,255,0.58),rgba(56,88,238,0.2)_27%,rgba(6,10,20,0)_62%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_74%,rgba(10,44,162,0.42),rgba(7,10,18,0)_48%)]" />

              <div className="relative z-10 mx-auto flex h-full max-w-[860px] flex-col items-center justify-center text-center">
                <div className={`${styles.orb} h-16 w-16 rounded-full md:h-20 md:w-20`} />

                <h1 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.03em] text-[#F0EFE2] sm:text-4xl md:text-5xl">
                  Help MemoryOS get to know you
                </h1>
                <p className="mt-2 text-balance text-base text-[#F0EFE2]/65 sm:text-lg">
                  {liveMemories.length > 0
                    ? `${liveMemories.length} memories already indexed. Keep adding context for better continuity.`
                    : "Add your first memory to unlock retrieval, continuity, and better answers."}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {liveMemories.length === 0 ? (
                    <button
                      type="button"
                      onClick={createFirstMemory}
                      disabled={isSeedingMemory}
                      className={`${styles.pill} border border-[#4f93ff]/55 bg-[#102145] px-4 py-2.5 text-sm font-medium text-[#a9c7ff] transition hover:bg-[#163165] disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {isSeedingMemory ? "Creating first memory..." : "Create first live memory"}
                    </button>
                  ) : (
                    <p className="text-sm text-[#a7c4ff]">
                      Timeline events tracked: {timelineEventCount}
                    </p>
                  )}
                </div>

                <div className="mt-8 grid w-full max-w-[880px] gap-3 md:grid-cols-3">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.title}
                      type="button"
                      className={`${styles.card} bg-[#161b25]/90 px-4 py-4 text-left transition hover:bg-[#1b2231]`}
                    >
                      <div className="flex items-center gap-2 text-base font-medium text-[#F0EFE2] sm:text-lg">
                        <span className="text-[#F0EFE2]/72">
                          <ActionIcon kind={action.icon} />
                        </span>
                        <span>{action.title}</span>
                      </div>
                      <p className="mt-2 text-sm text-[#89adff] sm:text-[15px]">{action.subtitle} →</p>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-7 text-sm text-[#9ab8ff] transition hover:text-[#F0EFE2] sm:text-base"
                >
                  See more integrations →
                </button>
              </div>
            </div>

            <aside className={`${styles.panel} bg-[#040913]/96 p-3 md:p-4`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`${styles.pill} border border-white/10 bg-[#0e1524]/90 px-3 py-2 text-sm text-[#F0EFE2]/92`}
                  >
                    Memory Copilot ⌄
                  </button>
                  <button
                    type="button"
                    className={`${styles.pill} border border-white/10 bg-[#0e1524]/90 px-3 py-2 text-sm text-[#F0EFE2]/92`}
                  >
                    My Space
                  </button>
                </div>
                <button
                  type="button"
                  className={`${styles.circleButton} border border-white/10 bg-[#0e1524]/90 text-sm text-[#F0EFE2]/72`}
                  aria-label="History"
                >
                  ↺
                </button>
              </div>

              <div className="mt-8 flex flex-col items-center">
                <div className={`${styles.spark} h-14 w-14`} aria-hidden />
                <p className="mt-6 max-w-[28ch] text-center text-xl font-medium leading-tight text-[#F0EFE2]/92 sm:text-2xl">
                  Ask anything about your product memory...
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                {promptSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.pill} bg-[#06173a]/72 px-4 py-2.5 text-left text-sm text-[#77acff] shadow-[inset_0_0_0_1px_rgba(56,97,179,0.48)] transition hover:text-[#F0EFE2] hover:shadow-[inset_0_0_0_1px_rgba(106,152,242,0.82)]`}
                  >
                    ⌕ {item}
                  </button>
                ))}
              </div>

              {liveError ? (
                <p className="mt-3 rounded-[10px] border border-[#264678] bg-[#08162f] px-3 py-2 text-xs text-[#a9c7ff]">
                  {liveError}
                </p>
              ) : null}

              <div className={`${styles.inputBlock} mt-6 p-2.5`}>
                <p className="px-1 text-sm text-[#9fbdf8]">Waiting for input...</p>
                <div className="mt-2 flex items-center gap-2 bg-[#020b1f]/95 p-2 shadow-[inset_0_0_0_1px_rgba(56,91,153,0.5)]">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ask MemoryOS anything..."
                    className="w-full bg-transparent text-sm text-[#F0EFE2] outline-none placeholder:text-[#F0EFE2]/35"
                  />
                  <button
                    type="button"
                    className={`${styles.sendButton} bg-[#0f1b32] px-2.5 py-1.5 text-xs font-medium text-[#F0EFE2]/85 transition hover:bg-[#162746]`}
                    aria-label="Send"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
