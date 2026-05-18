"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DitherBackground } from "@/components/ui/dither-background";
import { StructuredDataPanel } from "./_shared/structured-data-panel";
import { EASE_OUT } from "@/lib/motion";

type AgentStatus = "online" | "idle" | "offline";

type AgentTemplate = {
  id: string;
  name: string;
  runtime: string;
  category: string;
  accent: string;
  setup: string;
};

type ConnectedAgent = {
  id: string;
  templateId?: string;
  name: string;
  runtime: string;
  category: string;
  status: AgentStatus;
  connectedAt: string;
  lastHeartbeat: string;
  threads24h: number;
  resumeScore: number;
  handoffs24h: number;
};

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "mcp-agent",
    name: "MCP Agent",
    runtime: "MCP",
    category: "Any compatible agent",
    accent: "hsl(var(--primary))",
    setup: "Run npx -y @memoryostm/mcp and set MEMORYOS_API_KEY",
  },
  {
    id: "gpt-agent",
    name: "GPT Agent",
    runtime: "SDK / HTTP",
    category: "Cloud model agent",
    accent: "hsl(var(--primary))",
    setup: "Wrap model calls with beforeModel() and afterModel()",
  },
  {
    id: "local-model-agent",
    name: "Local Model Agent",
    runtime: "Ollama / Qwen / DeepSeek",
    category: "Local model runner",
    accent: "hsl(var(--primary))",
    setup: "Connect through MCP or HTTP before each generation",
  },
  {
    id: "custom-worker",
    name: "Custom Worker",
    runtime: "HTTP / SDK",
    category: "Backend agent",
    accent: "hsl(var(--primary))",
    setup: "Use afterModel() and handoff endpoint integration",
  },
];

function statusTone(status: AgentStatus) {
  if (status === "online") return "hsl(var(--primary))";
  if (status === "idle") return "hsl(var(--primary))";
  return "hsl(var(--destructive))";
}

function runtimeTone(runtime: string) {
  const value = runtime.toLowerCase();

  if (value.includes("mcp")) return "hsl(var(--primary))";
  if (value.includes("local") || value.includes("ollama")) return "hsl(var(--primary))";
  if (value.includes("sdk") || value.includes("http")) return "hsl(var(--primary))";

  return "hsl(var(--primary))";
}

function getApiOrigin() {
  const origin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN;

  if (!origin || origin === "same-origin") return "";

  return origin;
}

export function AgentsSection() {
  const [connectedAgents, setConnectedAgents] = useState<ConnectedAgent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    AGENT_TEMPLATES[0]?.id ?? "mcp-agent",
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selectedTemplate =
    AGENT_TEMPLATES.find((template) => template.id === selectedTemplateId) ??
    AGENT_TEMPLATES[0];

  const connectedCount = connectedAgents.length;

  const onlineCount = connectedAgents.filter(
    (agent) => agent.status === "online",
  ).length;

  const totalThreads24h = connectedAgents.reduce(
    (sum, agent) => sum + agent.threads24h,
    0,
  );

  const totalHandoffs24h = connectedAgents.reduce(
    (sum, agent) => sum + agent.handoffs24h,
    0,
  );

  const avgResumeScore = useMemo(() => {
    if (connectedAgents.length === 0) return 0;

    const avg =
      connectedAgents.reduce((sum, agent) => sum + agent.resumeScore, 0) /
      connectedAgents.length;

    return Math.round(avg);
  }, [connectedAgents]);

  const events = useMemo(() => {
    return connectedAgents.slice(0, 6).map((agent, index) => ({
      id: `${agent.id}-${agent.connectedAt}-${index}`,
      message: `${agent.name} connected to ${agent.runtime}`,
      at: agent.connectedAt,
      tone: runtimeTone(agent.runtime),
    }));
  }, [connectedAgents]);

  const statCards = [
    { label: "Connected agents", value: connectedCount, tone: "hsl(var(--primary))" },
    { label: "Online now", value: onlineCount, tone: "hsl(var(--primary))" },
    { label: "Threads 24h", value: totalThreads24h, tone: "hsl(var(--primary))" },
    { label: "Avg resume score", value: `${avgResumeScore}%`, tone: "hsl(var(--primary))" },
  ];
  const backendStateLabel = errorMessage
    ? "Connection issue"
    : isRefreshing
      ? "Syncing..."
      : hasLoadedOnce
        ? "Live sync enabled"
        : "Waiting for first sync";

  const loadAgents = useCallback(async (background = false) => {
    if (!background) setIsRefreshing(true);
    try {
      const { getOrCreateMemoryToken } = await import("@/lib/memory-token");
      const token = await getOrCreateMemoryToken();
      const origin = "";

      const response = await fetch(`${origin}/api/agents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Could not load agents.");

      const result = await response.json();
      const deduped = Array.from(
        new Map(((result?.data?.agents ?? []) as ConnectedAgent[]).map((agent) => [agent.id, agent])).values(),
      ) as ConnectedAgent[];
      deduped.sort((a, b) => {
        const aTime = new Date(a.connectedAt).getTime();
        const bTime = new Date(b.connectedAt).getTime();
        return bTime - aTime;
      });
      setConnectedAgents(deduped);
      setHasLoadedOnce(true);
      setErrorMessage(null);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load agents.");
    } finally {
      if (!background) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents(false);
    const timer = window.setInterval(() => {
      void loadAgents(true);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [loadAgents]);

  async function connectTemplate(template: AgentTemplate) {
    const alreadyConnected = connectedAgents.some(
      (agent) => agent.templateId === template.id,
    );

    if (alreadyConnected) return;

    try {
      const { getOrCreateMemoryToken } = await import("@/lib/memory-token");
      const token = await getOrCreateMemoryToken();
      const origin = "";

      const response = await fetch(`${origin}/api/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: template.id,
          name: template.name,
          runtime: template.runtime,
          category: template.category,
          setup: template.setup,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          (payload && typeof payload.error === "string" && payload.error) ||
          "Could not connect agent.";
        setActionMessage(message);
        return;
      }

      const result = await response.json();

      if (!result?.data?.agent) return;

      setConnectedAgents((current) =>
        Array.from(new Map([result.data.agent as ConnectedAgent, ...current].map((agent) => [agent.id, agent])).values()),
      );
      setLastUpdated(new Date().toISOString());
      setActionMessage(`${template.name} connected.`);
      void loadAgents(true);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to connect agent.");
    }
  }

  async function disconnectAgent(agentId: string) {
    try {
      const { getOrCreateMemoryToken } = await import("@/lib/memory-token");
      const token = await getOrCreateMemoryToken();
      const origin = "";

      const response = await fetch(`${origin}/api/agents/${agentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      setConnectedAgents((current) =>
        current.filter((agent) => agent.id !== agentId),
      );
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error("Failed to disconnect agent", err);
    }
  }

  async function handleCliQuickstart() {
    const snippet = `# 1) export key
export MEMORYOS_API_KEY="mkey_live_..."

# 2) connect agent runtime
memoryos agent connect --workspace acm --agent mcp-agent

# 3) verify status
memoryos agent status`;
    try {
      await navigator.clipboard.writeText(snippet);
      setActionMessage("CLI quickstart copied.");
    } catch {
      setActionMessage("Could not copy. Use the Quickstart block below.");
    }
  }

  return (
    <>
      <motion.div
        className="relative overflow-hidden border border-[hsl(var(--primary))]/20 bg-card px-4 py-4 sm:px-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-chart-2/10 via-transparent to-primary/8" />
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ x: [0, 3, -3, 0], y: [0, 1, -1, 0] }}
          transition={{ duration: 11, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <DitherBackground className="h-full w-full opacity-30" accent="hsl(var(--primary))" density={0.58} cols={280} rows={78} />
        </motion.div>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
          <div>
          <div className="inline-block rounded-[6px] px-2 py-1">
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">
            Agents
          </h1>
          </div>

          <br />
          <p className="mt-1 inline-block rounded-[6px] px-2 py-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
            Connect coding agents to MemoryOS so resume context and handoffs
            persist across sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            onClick={() => connectTemplate(selectedTemplate)}
            className="inline-flex items-center gap-2 rounded-[8px] border border-primary/50 bg-primary px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] text-primary-foreground shadow-md shadow-primary/25 transition hover:border-primary hover:bg-primary/90"
          >
            <span aria-hidden>+</span>
            + CONNECT AGENT
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            onClick={handleCliQuickstart}
            className="inline-flex items-center gap-2 rounded-[8px] border border-border bg-card px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground shadow-md shadow-black/15 dark:shadow-black/30"
          >
            <span aria-hidden>⌘</span>
            CLI QUICKSTART
          </motion.button>
        </div>
        </div>
        <p className="relative z-10 mt-2 text-[11px] text-muted-foreground">
          {backendStateLabel} · Updated: {lastUpdated}
        </p>
      </motion.div>
      {errorMessage ? (
        <div className="mt-2.5 rounded-[10px] border border-[hsl(var(--destructive))]/25 bg-card px-3.5 py-3 text-[12px] text-primary">
          {errorMessage}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="mt-2.5 rounded-[10px] border border-border bg-card px-3.5 py-3 text-[12px] text-foreground">
          {actionMessage}
        </div>
      ) : null}

      {!hasLoadedOnce ? (
        <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[10px] border border-border bg-card" />
          ))}
        </div>
      ) : null}

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="relative overflow-hidden rounded-[10px] border border-border bg-card bg-gradient-to-br from-card to-muted/25 px-3.5 py-3"
            style={{ borderTopColor: card.tone, borderTopWidth: "2px" }}
          >
            <DitherBackground
              cols={52}
              rows={20}
              accent={card.tone}
              density={0.48}
              opacity={0.18}
              className="pointer-events-none absolute inset-0"
            />
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-card blur-2xl" />
            <p className="relative text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {card.label}
            </p>
            <p className="relative mt-1 text-[20px] font-semibold tracking-[-0.03em] text-foreground">
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-2.5 rounded-[10px] border border-border bg-card px-4 py-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="1" width="4" height="4" rx="0.5" />
            <rect x="6" y="1" width="4" height="4" rx="0.5" />
            <rect x="1" y="6" width="4" height="4" rx="0.5" />
            <rect x="6" y="6" width="4" height="4" rx="0.5" />
          </svg>
          Agent Templates
        </p>

        <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {AGENT_TEMPLATES.map((template) => {
            const isConnected = connectedAgents.some(
              (agent) => agent.templateId === template.id,
            );

            return (
              <div
                key={template.id}
                className="rounded-[10px] border border-border bg-card px-3.5 py-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold tracking-[-0.02em]">
                    {template.name}
                  </p>

                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: template.accent }}
                  />
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {template.runtime}
                </p>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {template.setup}
                </p>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`rounded-[7px] border px-2.5 py-1 text-[10px] tracking-[0.08em] transition ${
                      selectedTemplateId === template.id
                        ? "border-[hsl(var(--primary))]/45 bg-[hsl(var(--primary))]/8 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-border"
                    }`}
                  >
                    SELECT
                  </button>

                  <button
                    type="button"
                    onClick={() => connectTemplate(template)}
                    disabled={isConnected}
                    className="rounded-[7px] border border-border bg-card px-2.5 py-1 text-[10px] tracking-[0.08em] text-muted-foreground disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isConnected ? "CONNECTED" : "CONNECT"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-[10px] border border-border bg-card px-4 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1.5" y="3.5" width="8" height="5" rx="1.5" />
              <path d="M3.5 6h1M6.5 6H8" />
              <path d="M4 3.5V2.5a1.5 1.5 0 013 0v1" />
              <path d="M3.5 8.5v1M7.5 8.5v1" />
            </svg>
            Connected Agents
          </p>

          <div className="mt-2.5 space-y-2">
            {connectedAgents.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-border bg-card px-5 py-6 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="7" width="14" height="9" rx="2" />
                    <path d="M7 11.5h1.5M11.5 11.5H13" />
                    <path d="M7.5 7V5.5a2.5 2.5 0 015 0V7" />
                    <path d="M6.5 16v1.5M13.5 16v1.5" />
                  </svg>
                </div>

                <p className="mt-2.5 text-[13px] font-medium text-muted-foreground">
                  No active agents yet
                </p>

                <p className="mt-1 text-[12px] text-muted-foreground">
                  Connect your first runtime to start tracking continuity.
                </p>
              </div>
            ) : (
              connectedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-[8px] border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-semibold tracking-[-0.02em]">
                        {agent.name}
                      </p>

                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {agent.category} · {agent.runtime}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: `${statusTone(agent.status)}55`,
                          color: statusTone(agent.status),
                          background: `${statusTone(agent.status)}12`,
                        }}
                      >
                        {agent.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => disconnectAgent(agent.id)}
                        className="rounded-[6px] border border-border bg-card px-2 py-0.5 text-[10px] tracking-[0.08em] text-muted-foreground"
                      >
                        DISCONNECT
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-4">
                    <p>Connected: {agent.connectedAt}</p>
                    <p>Heartbeat: {agent.lastHeartbeat}</p>
                    <p>Threads 24h: {agent.threads24h}</p>
                    <p>Handoffs 24h: {agent.handoffs24h}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[10px] border border-border bg-card px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1,6 2.5,6 3.5,2.5 5,9 6.5,4.5 7.5,6 10,6" />
              </svg>
              Events
            </p>

            <div className="mt-2.5 space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-[8px] border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: event.tone }}
                    />

                    <div>
                      <p className="text-[12px] text-muted-foreground">
                        {event.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {event.at}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-border bg-card px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1.5 3L4 5.5 1.5 8M5.5 8.5h4" />
              </svg>
              Quickstart
            </p>

            <div className="mt-2.5">
              <StructuredDataPanel title="CLI quickstart" value={`# 1) export key
export MEMORYOS_API_KEY="mkey_live_..."

# 2) connect agent runtime
memoryos agent connect --workspace acm --agent mcp-agent

# 3) verify status
memoryos agent status`} maxHeightClassName="max-h-52" compactChars={900} />
            </div>
          </div>

          <div className="rounded-[10px] border border-border bg-card px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="5.5" cy="5.5" r="4" />
                <path d="M3.5 5.5l1.5 1.5 2.5-2.5" />
              </svg>
              Quality Snapshot
            </p>

            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {[
                ["Resume score", `${avgResumeScore}%`],
                [
                  "Handoff continuity",
                  connectedCount > 0 ? `${Math.min(100, Math.round((totalHandoffs24h / Math.max(totalThreads24h, 1)) * 100))}%` : "n/a",
                ],
              ].map(([metricLabel, value]) => (
                <div
                  key={metricLabel}
                  className="rounded-[8px] border border-border bg-card px-3 py-2.5"
                >
                  <p className="text-[11px] text-muted-foreground">{metricLabel}</p>
                  <p className="mt-1 text-[16px] font-semibold tracking-[-0.02em]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
