"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DitherBackground } from "@/components/ui/dither-background";
import { EASE_OUT } from "@/lib/motion";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type PluginStatus = "available" | "installed";

type PluginCard = {
  id: string;
  name: string;
  category: string;
  runtime: string;
  version: string;
  status: PluginStatus;
  capabilities: string[];
  source: string;
  installedAt?: string;
  updatedAt?: string;
  health: "healthy" | "unknown" | "error";
  healthDetail?: string;
};

type PluginEvent = {
  id: string;
  pluginId: string;
  action: "installed" | "uninstalled";
  at: string;
};

function statusTone(status: PluginStatus) {
  if (status === "installed") return "#14c38e";
  return "#9aa6b8";
}

function statusLabel(status: PluginStatus) {
  if (status === "installed") return "installed";
  return "available";
}

export function PluginsSection() {
  const [plugins, setPlugins] = useState<PluginCard[]>([]);
  const [events, setEvents] = useState<PluginEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState<"All" | "Runtime" | "MCP" | "Workflow">("All");
  const [selectedPluginId, setSelectedPluginId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPlugins = useCallback(async (options?: { keepSelection?: boolean }) => {
    const token = await getOrCreateMemoryToken();
    const response = await fetch("/api/memory/plugins", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { plugins?: PluginCard[]; events?: PluginEvent[]; error?: string }
      | null;
    if (!response.ok || !payload?.plugins) {
      throw new Error(payload?.error ?? "Could not load plugins.");
    }
    setPlugins(payload.plugins);
    setEvents(payload.events ?? []);
    setErrorMessage(null);
    if (!options?.keepSelection && payload.plugins.length > 0) {
      setSelectedPluginId(payload.plugins[0].id);
      return;
    }
    if (
      options?.keepSelection &&
      selectedPluginId &&
      !payload.plugins.some((plugin) => plugin.id === selectedPluginId) &&
      payload.plugins.length > 0
    ) {
      setSelectedPluginId(payload.plugins[0].id);
    }
  }, [selectedPluginId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await loadPlugins();
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load plugins.",
          );
        }
      }
    };
    void run();
    const interval = window.setInterval(() => {
      void (async () => {
        try {
          await loadPlugins({ keepSelection: true });
        } catch {
          // background refresh stays silent
        }
      })();
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadPlugins]);

  const filteredPlugins = plugins.filter((plugin) =>
    activeCategory === "All" ? true : plugin.category === activeCategory,
  );

  const selectedPlugin = plugins.find((plugin) => plugin.id === selectedPluginId) ?? filteredPlugins[0] ?? plugins[0];

  const installedPlugins = plugins.filter((plugin) => plugin.status === "installed");
  const healthyPlugins = plugins.filter((plugin) => plugin.health === "healthy");
  const catalogPlugins = plugins.length;
  const statCards = [
    { label: "Installed plugins", value: installedPlugins.length, tone: "#14c38e" },
    { label: "Catalog plugins", value: catalogPlugins, tone: "#4f93ff" },
    { label: "Healthy plugins", value: healthyPlugins.length, tone: "#14c38e" },
    { label: "Events", value: events.length, tone: "#9b7bff" },
  ];

  async function installPlugin(pluginId: string) {
    try {
      const token = await getOrCreateMemoryToken();
      const response = await fetch(`/api/memory/plugins/${pluginId}/install`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = (await response.json().catch(() => null)) as
        | { plugins?: PluginCard[]; events?: PluginEvent[]; error?: string }
        | null;
      if (!response.ok || !payload?.plugins) {
        throw new Error(payload?.error ?? "Could not install plugin.");
      }
      setPlugins(payload.plugins);
      setEvents(payload.events ?? []);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not install plugin.",
      );
    }
  }

  async function uninstallPlugin(pluginId: string) {
    try {
      const token = await getOrCreateMemoryToken();
      const response = await fetch(`/api/memory/plugins/${pluginId}/uninstall`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = (await response.json().catch(() => null)) as
        | { plugins?: PluginCard[]; events?: PluginEvent[]; error?: string }
        | null;
      if (!response.ok || !payload?.plugins) {
        throw new Error(payload?.error ?? "Could not uninstall plugin.");
      }
      setPlugins(payload.plugins);
      setEvents(payload.events ?? []);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not uninstall plugin.",
      );
    }
  }

  return (
    <>
      <motion.div
        className="relative overflow-hidden border border-white/10 bg-black px-4 py-4 sm:px-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,147,255,0.10),transparent_52%),radial-gradient(ellipse_at_bottom_left,rgba(155,123,255,0.08),transparent_52%)]" />
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ x: [0, 2, -2, 0], y: [0, -1, 1, 0] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <DitherBackground
            className="h-full w-full opacity-25"
            accent="#4f93ff"
            density={0.54}
            cols={260}
            rows={72}
          />
        </motion.div>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="inline-block rounded-[6px] bg-black px-2 py-1 text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">
              Plugins
            </h1>
            <br/>
            <p className="mt-1 inline-block rounded-[6px] bg-black px-2 py-1 text-[12px] leading-6 text-white/70 sm:text-[13px]">
              Install and manage MemoryOS adapters for MCP runtimes, SDK clients, HTTP agents, and workflow orchestration.
            </p>
          </div>
          <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            onClick={() => window.open("https://www.npmjs.com/search?q=memoryos", "_blank", "noopener,noreferrer")}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#4f93ff]/55 bg-[linear-gradient(180deg,#1d4ed8,#1e40af)] px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] text-white shadow-[0_8px_24px_rgba(30,64,175,0.35)] transition hover:border-[#7fb2ff] hover:shadow-[0_10px_28px_rgba(37,99,235,0.42)]"
          >
            <span aria-hidden>↗</span>
            OPEN MARKETPLACE
          </motion.button>
          </div>
        </div>
      </motion.div>
      {errorMessage ? (
        <div className="mt-2.5 rounded-[10px] border border-[#ff6d6d]/25 bg-[#2a1111] px-3.5 py-3 text-[12px] text-[#ffb0b0]">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[#0b0b0b] px-3.5 py-3"
            style={{ borderTopColor: card.tone, borderTopWidth: "2px" }}
          >
            <DitherBackground
              cols={52}
              rows={20}
              opacity={0.30}
              accent={card.tone}
              density={0.52}
              className="pointer-events-none absolute inset-0"
              
            />
            <p className="relative">
              <span className="inline-block rounded-[4px] bg-black px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                {card.label}
              </span>
            </p>
            <p className="relative mt-1">
              <span className="inline-block rounded-[4px] bg-black px-1.5 py-0.5 text-[20px] font-semibold tracking-[-0.03em] text-white">
                {card.value}
              </span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#0b0b0b]">
          {(["All", "Runtime", "MCP", "Workflow"] as const).map((category) => (
            <motion.button
              key={category}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                activeCategory === category ? "bg-[#1f1f1f] text-white" : "text-white/46 hover:text-white/74"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {filteredPlugins.map((plugin) => {
          const isInstalled = plugin.status === "installed";
          return (
            <div
              key={plugin.id}
              className={`rounded-[10px] border px-3.5 py-3.5 transition ${
                selectedPlugin?.id === plugin.id
                  ? "border-[#4f93ff]/45 bg-[#0b0b0b]"
                  : "border-white/10 bg-[#0b0b0b] hover:border-white/20"
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
              <p className="mt-1 text-[11px] text-white/38">v{plugin.version}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPluginId(plugin.id)}
                  className="rounded-[7px] border border-white/10 bg-[#0b0b0b] px-2.5 py-1 text-[10px] tracking-[0.08em] text-white/60"
                >
                  DETAILS
                </button>
                {isInstalled ? (
                  <button
                    type="button"
                    onClick={() => uninstallPlugin(plugin.id)}
                    className="rounded-[7px] border border-white/10 bg-[#0b0b0b] px-2.5 py-1 text-[10px] tracking-[0.08em] text-white/60"
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
        <div className="rounded-[10px] border border-white/10 bg-[#0b0b0b] px-4 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 1H4.5a1 1 0 00-1 1v.5H2a1 1 0 00-1 1v5.5a1 1 0 001 1h7a1 1 0 001-1V3.5a1 1 0 00-1-1H7.5V2a1 1 0 00-1-1z" />
            </svg>
            Plugin Details
          </p>
          {selectedPlugin ? (
            <>
              <div className="mt-2.5 rounded-[8px] border border-white/10 bg-[#0b0b0b] px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold tracking-[-0.02em]">{selectedPlugin.name}</p>
                  <span className="text-[11px] text-white/44">v{selectedPlugin.version}</span>
                </div>
                <p className="mt-1 text-[12px] text-white/56">
                  {selectedPlugin.category} · {selectedPlugin.runtime}
                </p>
                <p className="mt-1 text-[11px] text-white/45">
                  Source: <code>{selectedPlugin.source}</code>
                </p>
                <p className="mt-1 text-[11px] text-white/45">
                  Health: {selectedPlugin.health}
                  {selectedPlugin.healthDetail ? ` - ${selectedPlugin.healthDetail}` : ""}
                </p>
                {selectedPlugin.installedAt ? (
                  <p className="mt-1 text-[11px] text-white/45">
                    Installed: {new Date(selectedPlugin.installedAt).toLocaleString()}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedPlugin.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-[6px] border border-white/10 bg-[#0b0b0b] px-2 py-1 text-[10px] text-white/58"
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
          <div className="rounded-[10px] border border-white/10 bg-[#0b0b0b] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 3h8M1.5 5.5h8M1.5 8h5" />
              </svg>
              Activity
            </p>
            <div className="mt-2.5 space-y-2">
              {events.length === 0 ? (
                <div className="rounded-[8px] border border-white/10 bg-[#0b0b0b] px-3 py-2.5 text-[12px] text-white/50">
                  No plugin activity yet.
                </div>
              ) : events.map((event) => (
                <div key={event.id} className="rounded-[8px] border border-white/10 bg-[#0b0b0b] px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: event.action === "installed" ? "#14c38e" : "#9aa6b8" }}
                    />
                    <div>
                      <p className="text-[12px] text-white/74">
                        {event.action === "installed" ? "Installed" : "Uninstalled"} {event.pluginId}
                      </p>
                      <p className="mt-1 text-[11px] text-white/38">{new Date(event.at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#0b0b0b] px-4 py-4 text-[12px] text-white/56">
            Plugin status and versions are loaded from local project packages and persisted installation state.
          </div>
        </div>
      </div>
    </>
  );
}
