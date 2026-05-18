"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DitherBackground } from "@/components/ui/dither-background";
import {
  Button,
  ConsoleAlert,
  ConsolePage,
  ConsolePageHeader,
  ConsoleStatCard,
  ConsoleStatGrid,
  ConsoleToolbar,
  ConsoleToolbarButton,
} from "@/components/developer-console/console-ui";
import { EASE_OUT } from "@/lib/motion";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import { StructuredDataPanel } from "./_shared/structured-data-panel";

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
  if (status === "installed") return "var(--chart-2)";
  return "var(--muted-foreground)";
}

function statusLabel(status: PluginStatus) {
  if (status === "installed") return "installed";
  return "available";
}

export function PluginsSection() {
  const [plugins, setPlugins] = useState<PluginCard[]>([]);
  const [events, setEvents] = useState<PluginEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [activeCategory, setActiveCategory] = useState<"All" | "Runtime" | "MCP" | "Workflow">("All");
  const [selectedPluginId, setSelectedPluginId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendReachable, setBackendReachable] = useState(false);

  const loadPlugins = useCallback(async (options?: { keepSelection?: boolean }) => {
    if (!options?.keepSelection) setIsLoading(true);
    const token = await getOrCreateMemoryToken();
    const response = await fetch("/api/memory/plugins", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    const rawPayload = (await response.json().catch(() => null)) as
      | { plugins?: PluginCard[]; events?: PluginEvent[]; error?: string; data?: { plugins?: PluginCard[]; events?: PluginEvent[] } }
      | null;
    const payload = rawPayload?.data ?? rawPayload;
    if (!response.ok || !payload?.plugins) {
      throw new Error(rawPayload?.error ?? "Could not load plugins.");
    }
    const dedupedPlugins = Array.from(new Map(payload.plugins.map((plugin) => [plugin.id, plugin])).values());
    const dedupedEvents = Array.from(new Map((payload.events ?? []).map((event) => [event.id, event])).values())
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    setPlugins(dedupedPlugins);
    setEvents(dedupedEvents);
    setLastUpdated(new Date().toISOString());
    setErrorMessage(null);
    setBackendReachable(true);
    if (!options?.keepSelection && dedupedPlugins.length > 0) {
      setSelectedPluginId(dedupedPlugins[0].id);
      setIsLoading(false);
      return;
    }
    if (
      options?.keepSelection &&
      selectedPluginId &&
      !dedupedPlugins.some((plugin) => plugin.id === selectedPluginId) &&
      dedupedPlugins.length > 0
    ) {
      setSelectedPluginId(dedupedPlugins[0].id);
    }
    setIsLoading(false);
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
          setIsLoading(false);
          setBackendReachable(false);
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
    { label: "Installed plugins", value: installedPlugins.length, tone: "var(--color-chart-2)" },
    { label: "Catalog plugins", value: catalogPlugins, tone: "var(--color-primary)" },
    { label: "Healthy plugins", value: healthyPlugins.length, tone: "var(--color-chart-2)" },
    { label: "Events", value: events.length, tone: "var(--color-chart-4)" },
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
      setBackendReachable(true);
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
      setBackendReachable(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not uninstall plugin.",
      );
    }
  }

  return (
    <ConsolePage>
      <motion.div
        className="relative overflow-hidden border border-border bg-background px-4 py-4 sm:px-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
      >
        <div className="absolute inset-0 bg-primary/5" />
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ x: [0, 2, -2, 0], y: [0, -1, 1, 0] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <DitherBackground
            className="h-full w-full opacity-25"
            accent="var(--color-primary)"
            density={0.54}
            cols={260}
            rows={72}
          />
        </motion.div>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="inline-block rounded-[6px] px-2 py-1 text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">
              Plugins
            </h1>
            <br/>
            <p className="mt-1 inline-block rounded-[6px] px-2 py-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
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
            className="inline-flex items-center gap-2 rounded-[8px] border border-primary/50 bg-primary px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] text-primary-foreground shadow-md shadow-primary/25 transition hover:border-primary hover:bg-primary/90"
          >
            <span aria-hidden>↗</span>
            OPEN MARKETPLACE
          </motion.button>
          </div>
        </div>
        <p className="relative z-10 mt-2 text-[11px] text-muted-foreground">
          {isLoading
            ? "Loading plugin state..."
            : errorMessage
              ? "Connection issue"
              : backendReachable
                ? "Workspace plugin state loaded"
                : "Waiting for backend"} · Updated: {lastUpdated}
        </p>
      </motion.div>
      {errorMessage ? (
        <div className="mt-2.5 rounded-[10px] border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-[12px] text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="relative overflow-hidden rounded-[10px] border border-border bg-card px-3.5 py-3"
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
              <span className="inline-block rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground">
                {card.label}
              </span>
            </p>
            <p className="relative mt-1">
              <span className="inline-block rounded-[4px] px-1.5 py-0.5 text-[20px] font-semibold tracking-[-0.03em] text-foreground">
                {card.value}
              </span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center overflow-hidden rounded-[8px] border border-border bg-card">
          {(["All", "Runtime", "MCP", "Workflow"] as const).map((category) => (
            <motion.button
              key={category}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                activeCategory === category ? "bg-muted text-foreground" : "text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {!isLoading && filteredPlugins.length === 0 ? (
          <div className="rounded-[10px] border border-border bg-card px-3.5 py-6 text-[12px] text-muted-foreground xl:col-span-4">
            No plugins returned from backend yet.
          </div>
        ) : null}
        {filteredPlugins.map((plugin) => {
          const isInstalled = plugin.status === "installed";
          return (
            <div
              key={plugin.id}
              className={`rounded-[10px] border px-3.5 py-3.5 transition ${
                selectedPlugin?.id === plugin.id
                  ? "border-primary/45 bg-card"
                  : "border-border bg-card hover:border-border"
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
              <p className="mt-1 text-[11px] text-muted-foreground">
                {plugin.category} · {plugin.runtime}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">v{plugin.version}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPluginId(plugin.id)}
                  className="rounded-[7px] border border-border bg-card px-2.5 py-1 text-[10px] tracking-[0.08em] text-muted-foreground"
                >
                  DETAILS
                </button>
                {isInstalled ? (
                  <button
                    type="button"
                    onClick={() => uninstallPlugin(plugin.id)}
                    className="rounded-[7px] border border-border bg-card px-2.5 py-1 text-[10px] tracking-[0.08em] text-muted-foreground"
                  >
                    UNINSTALL
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => installPlugin(plugin.id)}
                    className="rounded-[7px] border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] tracking-[0.08em] text-primary"
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
        <div className="rounded-[10px] border border-border bg-card px-4 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 1H4.5a1 1 0 00-1 1v.5H2a1 1 0 00-1 1v5.5a1 1 0 001 1h7a1 1 0 001-1V3.5a1 1 0 00-1-1H7.5V2a1 1 0 00-1-1z" />
            </svg>
            Plugin Details
          </p>
          {selectedPlugin ? (
            <>
              <div className="mt-2.5 rounded-[8px] border border-border bg-card px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold tracking-[-0.02em]">{selectedPlugin.name}</p>
                  <span className="text-[11px] text-muted-foreground">v{selectedPlugin.version}</span>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {selectedPlugin.category} · {selectedPlugin.runtime}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Source: <code>{selectedPlugin.source}</code>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Health: {selectedPlugin.health}
                  {selectedPlugin.healthDetail ? ` - ${selectedPlugin.healthDetail}` : ""}
                </p>
                {selectedPlugin.installedAt ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Installed: {new Date(selectedPlugin.installedAt).toLocaleString()}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedPlugin.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-[6px] border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <StructuredDataPanel title="Plugin CLI" value={`# install plugin
memoryos plugin install ${selectedPlugin.id}

# enable for workspace
memoryos plugin enable ${selectedPlugin.id} --workspace acm

# verify health
memoryos plugin status ${selectedPlugin.id}`} maxHeightClassName="max-h-52" compactChars={900} />
              </div>
            </>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-[10px] border border-border bg-card px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 3h8M1.5 5.5h8M1.5 8h5" />
              </svg>
              Activity
            </p>
            <div className="mt-2.5 space-y-2">
              {events.length === 0 ? (
                <div className="rounded-[8px] border border-border bg-card px-3 py-2.5 text-[12px] text-muted-foreground">
                  No plugin activity yet.
                </div>
              ) : events.map((event) => (
                <div key={event.id} className="rounded-[8px] border border-border bg-card px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background:
                          event.action === "installed" ? "var(--chart-2)" : "var(--muted-foreground)",
                      }}
                    />
                    <div>
                      <p className="text-[12px] text-muted-foreground">
                        {event.action === "installed" ? "Installed" : "Uninstalled"} {event.pluginId}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(event.at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-border bg-card px-4 py-4 text-[12px] text-muted-foreground">
            Source of truth: package manifests + persisted workspace install state. Marketplace listing is external.
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}
