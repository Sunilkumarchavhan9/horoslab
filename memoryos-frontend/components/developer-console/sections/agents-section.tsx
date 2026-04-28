"use client";

import { useMemo, useState } from "react";

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
    id: "claude-code",
    name: "Claude Code",
    runtime: "CLI + MCP",
    category: "Coding agent",
    accent: "#4f93ff",
    setup: "Install MCP bridge and set MEMORYOS_API_KEY",
  },
  {
    id: "cursor",
    name: "Cursor",
    runtime: "IDE plugin",
    category: "IDE agent",
    accent: "#9b7bff",
    setup: "Enable MemoryOS plugin and workspace mapping",
  },
  {
    id: "vscode",
    name: "VS Code",
    runtime: "Extension",
    category: "IDE assistant",
    accent: "#14c38e",
    setup: "Attach project context + retrieve pre-prompt hook",
  },
  {
    id: "custom-worker",
    name: "Custom Worker",
    runtime: "REST / SDK",
    category: "Backend agent",
    accent: "#f0b429",
    setup: "Use afterModel() and handoff endpoint integration",
  },
];

const BASE_EVENTS = [
  { message: "Agent auth policy validated", at: "Today 09:05", tone: "#4f93ff" },
  { message: "MCP bridge heartbeat healthy", at: "Today 09:01", tone: "#14c38e" },
  { message: "No handoff traffic yet for one connector", at: "Today 08:47", tone: "#f0b429" },
];

function statusTone(status: AgentStatus) {
  if (status === "online") return "#14c38e";
  if (status === "idle") return "#f0b429";
  return "#ff6d6d";
}

function runtimeTone(runtime: string) {
  if (runtime.toLowerCase().includes("mcp")) return "#4f93ff";
  if (runtime.toLowerCase().includes("plugin") || runtime.toLowerCase().includes("extension")) return "#9b7bff";
  if (runtime.toLowerCase().includes("sdk") || runtime.toLowerCase().includes("rest")) return "#14c38e";
  return "#f0b429";
}

export function AgentsSection() {
  const [connectedAgents, setConnectedAgents] = useState<ConnectedAgent[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(AGENT_TEMPLATES[0]?.id ?? "claude-code");

  const selectedTemplate =
    AGENT_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? AGENT_TEMPLATES[0];

  const connectedCount = connectedAgents.length;
  const onlineCount = connectedAgents.filter((agent) => agent.status === "online").length;
  const totalThreads24h = connectedAgents.reduce((sum, agent) => sum + agent.threads24h, 0);
  const totalHandoffs24h = connectedAgents.reduce((sum, agent) => sum + agent.handoffs24h, 0);

  const avgResumeScore = useMemo(() => {
    if (connectedAgents.length === 0) return 0;
    const avg = connectedAgents.reduce((sum, agent) => sum + agent.resumeScore, 0) / connectedAgents.length;
    return Math.round(avg);
  }, [connectedAgents]);

  const events = useMemo(() => {
    const dynamic = connectedAgents.slice(0, 2).map((agent) => ({
      message: `${agent.name} connected to ${agent.runtime}`,
      at: "Just now",
      tone: runtimeTone(agent.runtime),
    }));
    return [...dynamic, ...BASE_EVENTS];
  }, [connectedAgents]);

  function connectTemplate(template: AgentTemplate) {
    const alreadyConnected = connectedAgents.some((agent) => agent.id === template.id);
    if (alreadyConnected) return;

    const next: ConnectedAgent = {
      id: template.id,
      name: template.name,
      runtime: template.runtime,
      category: template.category,
      status: connectedAgents.length % 2 === 0 ? "online" : "idle",
      connectedAt: "Just now",
      lastHeartbeat: "Just now",
      threads24h: 3 + connectedAgents.length * 2,
      resumeScore: 78 + connectedAgents.length * 4,
      handoffs24h: 1 + connectedAgents.length,
    };

    setConnectedAgents((current) => [next, ...current]);
  }

  function disconnectAgent(agentId: string) {
    setConnectedAgents((current) => current.filter((agent) => agent.id !== agentId));
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Agents</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Connect coding agents to MemoryOS so resume context and handoffs persist across sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => connectTemplate(selectedTemplate)}
            className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff]"
          >
            + CONNECT AGENT
          </button>
          <button
            type="button"
            className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/62"
          >
            CLI QUICKSTART
          </button>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#4f93ff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Connected agents</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{connectedCount}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#14c38e", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Online now</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{onlineCount}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#9b7bff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Threads (24h)</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{totalThreads24h}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#f0b429", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Avg resume score</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{avgResumeScore}%</p>
        </div>
      </div>

      <div className="mt-2.5 rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="4" height="4" rx="0.5" /><rect x="6" y="1" width="4" height="4" rx="0.5" /><rect x="1" y="6" width="4" height="4" rx="0.5" /><rect x="6" y="6" width="4" height="4" rx="0.5" />
          </svg>
          Agent Templates
        </p>
        <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {AGENT_TEMPLATES.map((template) => {
            const isConnected = connectedAgents.some((agent) => agent.id === template.id);
            return (
              <div key={template.id} className="rounded-[10px] border border-white/10 bg-[#111111] px-3.5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold tracking-[-0.02em]">{template.name}</p>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: template.accent }} />
                </div>
                <p className="mt-1 text-[11px] text-white/48">{template.runtime}</p>
                <p className="mt-1 text-[11px] text-white/38">{template.setup}</p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`rounded-[7px] border px-2.5 py-1 text-[10px] tracking-[0.08em] transition ${
                      selectedTemplateId === template.id
                        ? "border-[#4f93ff]/45 bg-[#4f93ff]/8 text-[#8bb5ff]"
                        : "border-white/10 bg-[#0f0f0f] text-white/56 hover:border-white/20"
                    }`}
                  >
                    SELECT
                  </button>
                  <button
                    type="button"
                    onClick={() => connectTemplate(template)}
                    disabled={isConnected}
                    className="rounded-[7px] border border-white/10 bg-[#0f0f0f] px-2.5 py-1 text-[10px] tracking-[0.08em] text-white/62 disabled:cursor-not-allowed disabled:opacity-45"
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
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1.5" y="3.5" width="8" height="5" rx="1.5" /><path d="M3.5 6h1M6.5 6H8" /><path d="M4 3.5V2.5a1.5 1.5 0 013 0v1" /><path d="M3.5 8.5v1M7.5 8.5v1" />
            </svg>
            Connected Agents
          </p>
          <div className="mt-2.5 space-y-2">
            {connectedAgents.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-white/12 bg-[#101010] px-5 py-6 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/28">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="14" height="9" rx="2" />
                    <path d="M7 11.5h1.5M11.5 11.5H13" />
                    <path d="M7.5 7V5.5a2.5 2.5 0 015 0V7" />
                    <path d="M6.5 16v1.5M13.5 16v1.5" />
                  </svg>
                </div>
                <p className="mt-2.5 text-[13px] font-medium text-white/56">No active agents yet</p>
                <p className="mt-1 text-[12px] text-white/34">Connect your first runtime to start tracking continuity.</p>
              </div>
            ) : (
              connectedAgents.map((agent) => (
                <div key={agent.id} className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-semibold tracking-[-0.02em]">{agent.name}</p>
                      <p className="mt-0.5 text-[11px] text-white/42">{agent.category} · {agent.runtime}</p>
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
                        className="rounded-[6px] border border-white/10 bg-[#0f0f0f] px-2 py-0.5 text-[10px] tracking-[0.08em] text-white/50"
                      >
                        DISCONNECT
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-[11px] text-white/46 sm:grid-cols-4">
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
          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1,6 2.5,6 3.5,2.5 5,9 6.5,4.5 7.5,6 10,6" />
              </svg>
              Events
            </p>
            <div className="mt-2.5 space-y-2">
              {events.map((event) => (
                <div key={`${event.message}-${event.at}`} className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: event.tone }} />
                    <div>
                      <p className="text-[12px] text-white/74">{event.message}</p>
                      <p className="mt-1 text-[11px] text-white/38">{event.at}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 3L4 5.5 1.5 8M5.5 8.5h4" />
              </svg>
              Quickstart
            </p>
            <pre className="mt-2.5 overflow-x-auto rounded-[8px] border border-white/10 bg-[#0f0f0f] p-3 text-[11px] leading-6 text-white/72">
              <code>{`# 1) export key
export MEMORYOS_API_KEY="mkey_live_..."

# 2) connect agent runtime
memoryos agent connect --workspace acm --agent claude-code

# 3) verify status
memoryos agent status`}</code>
            </pre>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5.5" cy="5.5" r="4" /><path d="M3.5 5.5l1.5 1.5 2.5-2.5" />
              </svg>
              Quality Snapshot
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {[
                ["Resume score", `${avgResumeScore}%`],
                ["Handoff continuity", `${Math.min(100, 62 + totalHandoffs24h * 8)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                  <p className="text-[11px] text-white/44">{label}</p>
                  <p className="mt-1 text-[16px] font-semibold tracking-[-0.02em]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
