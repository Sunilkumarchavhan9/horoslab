"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DitherBackground } from "@/components/ui/dither-background";
import { EASE_OUT } from "@/lib/motion";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type ConnectorRecord = {
  id: string;
  type: string;
  name: string;
  status: "connected" | "not_connected" | "pending";
  lastSyncAt?: string | null;
  recordCount?: number;
};

type ActivityItem = {
  id: string;
  message: string;
  at: string;
  tone: "success" | "info" | "error";
};

export function ImportsSection({ liveMemoryCount = 0 }: { liveMemoryCount?: number }) {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadConnectors = useCallback(async () => {
    const token = await getOrCreateMemoryToken();
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim();
    const origin = !base || base === "same-origin" ? "" : base.replace(/\/+$/, "");
    const response = await fetch(`${origin}/api/connector`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { data?: { connectors?: ConnectorRecord[] }; error?: { message?: string } }
      | null;
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Could not load connectors.");
    }
    setConnectors(payload?.data?.connectors ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadConnectors();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load.");
      }
    })();
    const interval = window.setInterval(() => {
      void loadConnectors();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [loadConnectors, liveMemoryCount]);

  const connected = connectors.filter((item) => item.status === "connected");
  const totalRecords = connected.reduce((sum, item) => sum + (item.recordCount ?? 0), 0);

  const addActivity = useCallback((message: string, tone: ActivityItem["tone"]) => {
    setActivity((current) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        message,
        at: new Date().toLocaleString(),
        tone,
      },
      ...current,
    ].slice(0, 20));
  }, []);

  async function syncConnector(type: string) {
    setBusyId(type);
    setErrorMessage(null);
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token.");
      const base = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim();
      const origin = !base || base === "same-origin" ? "" : base.replace(/\/+$/, "");
      const response = await fetch(`${origin}/api/connector/${type}/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { extractedCount?: number }; error?: { message?: string } }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? `Failed to sync ${type}`);
      }
      addActivity(
        `${type} synced. Extracted ${payload?.data?.extractedCount ?? 0} records.`,
        "success",
      );
      await loadConnectors();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to sync ${type}`;
      setErrorMessage(message);
      addActivity(message, "error");
    } finally {
      setBusyId(null);
    }
  }

  const healthLabel = useMemo(() => {
    if (connected.length === 0) return "No connected sources";
    return `${connected.length} source(s) connected`;
  }, [connected.length]);

  return (
    <div className="space-y-3 text-white">
      <motion.div
        className="relative overflow-hidden rounded-[10px] border border-white/10 bg-black px-4 py-4"
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
          <DitherBackground className="h-full w-full opacity-25" accent="yellow" density={0.54} cols={260} rows={72} />
        </motion.div>
        <div className="relative z-10">
          <h2 className="inline-block rounded-[6px] bg-black px-2 py-1 text-[17px] font-semibold">
            Imports
          </h2>
          <br/>
          <p className="mt-1 inline-block rounded-[6px] bg-black px-2 py-1 text-[12px] text-white/70">
            Live connector ingestion and sync status from real backend integrations.
          </p>
        </div>
      </motion.div>

      {errorMessage ? (
        <div className="rounded-[10px] border border-[#ff7d7d]/35 bg-[#2a1010] px-3.5 py-3 text-[12px] text-[#ffb3b3]">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-2.5 md:grid-cols-3">
        {[
          { label: "Connected", value: connected.length, tone: "#c34c14" },
          { label: "Records", value: totalRecords, tone: "#ff4f92" },
          { label: "Health", value: healthLabel, tone: "#25d669" },
        ].map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[#0b0b0b] px-3.5 py-3">
            <DitherBackground
              cols={52}
              rows={20}
              accent={card.tone}
              density={0.52}
              opacity={0.22}
              className="pointer-events-none absolute inset-0"
            />
            <p className="relative">
              <span className="inline-block rounded-[4px] bg-black px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                {card.label}
              </span>
            </p>
            <p className="relative mt-1">
              <span className="inline-block rounded-[4px] bg-black px-1.5 py-0.5 text-[18px] font-semibold text-white">
                {card.value}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[10px] border border-white/10 bg-[#0b0b0b] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/75">
            Sources
          </p>
          <div className="mt-2 space-y-2">
            {connectors.map((connector) => (
              <div key={connector.id} className="rounded-[8px] border border-white/10 bg-black px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-semibold">{connector.name}</p>
                    <p className="text-[11px] text-white/48">{connector.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                        connector.status === "connected"
                          ? "border-[#14c38e]/45 bg-[#14c38e]/12 text-[#8ce6c7]"
                          : connector.status === "pending"
                            ? "border-[#f0b429]/45 bg-[#f0b429]/12 text-[#ffd27a]"
                            : "border-white/20 bg-white/5 text-white/55"
                      }`}
                    >
                      {connector.status}
                    </span>
                    <button
                      type="button"
                      disabled={connector.status !== "connected" || busyId === connector.type}
                      onClick={() => void syncConnector(connector.type)}
                      className="rounded-[7px] border border-[#4f93ff]/45 bg-[#1d4ed8] px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busyId === connector.type ? "SYNCING" : "SYNC"}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-white/52">
                  Records: {connector.recordCount ?? 0} · Last sync: {connector.lastSyncAt ? new Date(connector.lastSyncAt).toLocaleString() : "Never"}
                </p>
              </div>
            ))}
            {connectors.length === 0 ? (
              <p className="text-[12px] text-white/46">No connector data returned yet.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[10px] border border-white/10 bg-[#0b0b0b] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/75">
            Activity
          </p>
          <div className="mt-2 space-y-2">
            {activity.map((item) => (
              <div key={item.id} className="rounded-[8px] border border-white/10 bg-black px-3 py-2">
                <p className="text-[12px] text-white/80">{item.message}</p>
                <p className="mt-1 text-[11px] text-white/45">{item.at}</p>
              </div>
            ))}
            {activity.length === 0 ? (
              <p className="text-[12px] text-white/46">No sync activity yet.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
