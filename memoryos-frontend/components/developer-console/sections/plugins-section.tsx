"use client";

import { useMemo, useState } from "react";

type PluginStatus = "available" | "installed" | "degraded";

type PluginCard = {
  id: string;
  name: string;
  category: string;
  runtime: string;
  version: string;
  status: PluginStatus;
  trustScore: number;
  calls24h: number;
  lastSync: string;
  capabilities: string[];
};

const PLUGIN_LIBRARY: PluginCard[] = [
  {
    id: "memoryos-mcp",
    name: "MemoryOS MCP Bridge",
    category: "MCP",
    runtime: "Agent transport",
    version: "1.4.2",
    status: "installed",
    trustScore: 93,
    calls24h: 122,
    lastSync: "2m ago",
    capabilities: ["retrieve", "resume", "handoff", "why-not-retrieved"],
  },
  {
    id: "claude-code-plugin",
    name: "Claude Code Continuity",
    category: "IDE",
    runtime: "CLI plugin",
    version: "0.9.8",
    status: "installed",
    trustScore: 88,
    calls24h: 96,
    lastSync: "5m ago",
    capabilities: ["beforeModel", "afterModel", "context-inject"],
  },
  {
    id: "cursor-plugin",
    name: "Cursor Memory Sync",
    category: "IDE",
    runtime: "Extension",
    version: "0.6.1",
    status: "available",
    trustScore: 0,
    calls24h: 0,
    lastSync: "Not connected",
    capabilities: ["retrieve", "project-memory", "open-loops"],
  },
  {
    id: "langgraph-adapter",
    name: "LangGraph Adapter",
    category: "Workflow",
    runtime: "Node runtime",
    version: "1.1.0",
    status: "degraded",
    trustScore: 64,
    calls24h: 33,
    lastSync: "17m ago",
    capabilities: ["state-checkpoint", "resume-node", "handoff-node"],
  },
];

const AUDIT_FEED = [
  { event: "Installed MemoryOS MCP Bridge", at: "Today 09:18", tone: "#14c38e" },
  { event: "Plugin version check completed", at: "Today 09:05", tone: "#4f93ff" },
  { event: "LangGraph adapter retry spike detected", at: "Today 08:51", tone: "#f0b429" },
];

function statusTone(status: PluginStatus) {
  if (status === "installed") return "#14c38e";
  if (status === "degraded") return "#f0b429";
  return "#9aa6b8";
}

function statusLabel(status: PluginStatus) {
  if (status === "installed") return "installed";
  if (status === "degraded") return "degraded";
  return "available";
}

export function PluginsSection() {
  const [plugins, setPlugins] = useState<PluginCard[]>(PLUGIN_LIBRARY);
  const [activeCategory, setActiveCategory] = useState<"All" | "IDE" | "MCP" | "Workflow">("All");
  const [selectedPluginId, setSelectedPluginId] = useState(PLUGIN_LIBRARY[0]?.id ?? "");

  const filteredPlugins = plugins.filter((plugin) =>
    activeCategory === "All" ? true : plugin.category === activeCategory,
  );

  const selectedPlugin = plugins.find((plugin) => plugin.id === selectedPluginId) ?? filteredPlugins[0] ?? plugins[0];

  const installedPlugins = plugins.filter((plugin) => plugin.status === "installed");
  const degradedPlugins = plugins.filter((plugin) => plugin.status === "degraded");
  const totalCalls24h = installedPlugins.reduce((sum, plugin) => sum + plugin.calls24h, 0);
  const avgTrust = installedPlugins.length
    ? Math.round(installedPlugins.reduce((sum, plugin) => sum + plugin.trustScore, 0) / installedPlugins.length)
    : 0;

  const compatibilityRows = useMemo(
    () => [
      ["MemoryOS API", "Compatible", "#14c38e"],
      ["MCP Runtime", "Compatible", "#14c38e"],
      ["LangGraph v1", "Compatible", "#14c38e"],
      ["Legacy bridge", "Needs migration", "#f0b429"],
    ],
    [],
  );

  function installPlugin(pluginId: string) {
    setPlugins((current) =>
      current.map((plugin) =>
        plugin.id === pluginId
          ? {
              ...plugin,
              status: "installed",
              trustScore: plugin.trustScore > 0 ? plugin.trustScore : 82,
              calls24h: plugin.calls24h > 0 ? plugin.calls24h : 6,
              lastSync: "Just now",
            }
          : plugin,
      ),
    );
  }

  function uninstallPlugin(pluginId: string) {
    setPlugins((current) =>
      current.map((plugin) =>
        plugin.id === pluginId
          ? {
              ...plugin,
              status: "available",
              calls24h: 0,
              trustScore: 0,
              lastSync: "Disconnected",
            }
          : plugin,
      ),
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Plugins</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Install and manage MemoryOS plugins for IDEs, MCP runtimes, and workflow orchestration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff]"
          >
            OPEN MARKETPLACE
          </button>
          <button
            type="button"
            className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/62"
          >
            CHECK UPDATES
          </button>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#14c38e", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Installed plugins</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{installedPlugins.length}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#f0b429", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Degraded plugins</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{degradedPlugins.length}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#4f93ff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Calls (24h)</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{totalCalls24h}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#9b7bff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Avg trust</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{avgTrust}%</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#111111]">
          {(["All", "IDE", "MCP", "Workflow"] as const).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                activeCategory === category ? "bg-[#1f1f1f] text-white" : "text-white/46 hover:text-white/74"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {filteredPlugins.map((plugin) => {
          const isInstalled = plugin.status === "installed" || plugin.status === "degraded";
          return (
            <div
              key={plugin.id}
              className={`rounded-[10px] border px-3.5 py-3.5 transition ${
                selectedPlugin?.id === plugin.id
                  ? "border-[#4f93ff]/45 bg-[#4f93ff]/8"
                  : "border-white/10 bg-[#161616] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold tracking-[-0.02em]">{plugin.name}</p>
                <span
                  className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                  style={{
                    borderColor: `${statusTone(plugin.status)}55`,
                    color: statusTone(plugin.status),
                    background: `${statusTone(plugin.status)}12`,
                  }}
                >
                  {statusLabel(plugin.status)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-white/50">
                {plugin.category} · {plugin.runtime}
              </p>
              <p className="mt-1 text-[11px] text-white/38">
                v{plugin.version} · {plugin.lastSync}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPluginId(plugin.id)}
                  className="rounded-[7px] border border-white/10 bg-[#111111] px-2.5 py-1 text-[10px] tracking-[0.08em] text-white/60"
                >
                  DETAILS
                </button>
                {isInstalled ? (
                  <button
                    type="button"
                    onClick={() => uninstallPlugin(plugin.id)}
                    className="rounded-[7px] border border-white/10 bg-[#111111] px-2.5 py-1 text-[10px] tracking-[0.08em] text-white/60"
                  >
                    UNINSTALL
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => installPlugin(plugin.id)}
                    className="rounded-[7px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-2.5 py-1 text-[10px] tracking-[0.08em] text-[#8bb5ff]"
                  >
                    INSTALL
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 1H4.5a1 1 0 00-1 1v.5H2a1 1 0 00-1 1v5.5a1 1 0 001 1h7a1 1 0 001-1V3.5a1 1 0 00-1-1H7.5V2a1 1 0 00-1-1z" />
            </svg>
            Plugin Details
          </p>
          {selectedPlugin ? (
            <>
              <div className="mt-2.5 rounded-[8px] border border-white/10 bg-[#111111] px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold tracking-[-0.02em]">{selectedPlugin.name}</p>
                  <span className="text-[11px] text-white/44">v{selectedPlugin.version}</span>
                </div>
                <p className="mt-1 text-[12px] text-white/56">
                  {selectedPlugin.category} · {selectedPlugin.runtime}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedPlugin.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-[6px] border border-white/10 bg-[#111111] px-2 py-1 text-[10px] text-white/58"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              <pre className="mt-3 overflow-x-auto rounded-[8px] border border-white/10 bg-[#0f0f0f] p-3 text-[11px] leading-6 text-white/72">
                <code>{`# install plugin
memoryos plugin install ${selectedPlugin.id}

# enable for workspace
memoryos plugin enable ${selectedPlugin.id} --workspace acm

# verify health
memoryos plugin status ${selectedPlugin.id}`}</code>
              </pre>
            </>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 3h8M1.5 5.5h8M1.5 8h5" />
              </svg>
              Audit Feed
            </p>
            <div className="mt-2.5 space-y-2">
              {AUDIT_FEED.map((event) => (
                <div key={event.event} className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: event.tone }} />
                    <div>
                      <p className="text-[12px] text-white/74">{event.event}</p>
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
                <path d="M2 5.5l2.5 2.5 4.5-5" />
              </svg>
              Compatibility Matrix
            </p>
            <div className="mt-2.5 space-y-2">
              {compatibilityRows.map(([label, state, tone]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                  <p className="text-[11px] text-white/56">{label}</p>
                  <span className="rounded-[6px] border px-2 py-0.5 text-[10px] tracking-[0.08em]" style={{ borderColor: `${tone}55`, color: tone, background: `${tone}12` }}>
                    {state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
