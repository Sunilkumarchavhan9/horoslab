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

type ConnectorDiagnostic = {
  connectorType: string;
  status: "healthy" | "degraded" | "down";
  checkedAt: string;
  latencyMs?: number;
  errorRate?: number;
};

export function ImportsSection({ liveMemoryCount = 0 }: { liveMemoryCount?: number }) {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<ConnectorDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadConnectors = useCallback(async () => {
    setLoading(true);
    const token = await getOrCreateMemoryToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const response = await fetch(`/api/connector`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { data?: { connectors?: ConnectorRecord[] }; error?: { message?: string } }
      | null;
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Could not load connectors.");
    }
    const raw = payload?.data?.connectors ?? [];
    const deduped = Array.from(
      new Map(
        raw
          .filter((item) => item && typeof item.id === "string")
          .map((item) => [item.type || item.id, item]),
      ).values(),
    ) as ConnectorRecord[];
    setConnectors(deduped);
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, []);

  const loadDiagnostics = useCallback(async () => {
    const token = await getOrCreateMemoryToken();
    if (!token) return;
    const response = await fetch(`/api/connector/health`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = (await response.json().catch(() => null)) as
      | { data?: { diagnostics?: ConnectorDiagnostic[] } }
      | null;
    const list = payload?.data?.diagnostics;
    if (Array.isArray(list)) {
      setDiagnostics(list);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadConnectors();
        await loadDiagnostics();
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
    const interval = window.setInterval(() => {
      void (async () => {
        try {
          await loadConnectors();
          await loadDiagnostics();
          setErrorMessage(null);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load.");
          setLoading(false);
        }
      })();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [loadConnectors, loadDiagnostics, liveMemoryCount]);

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
      const response = await fetch(`/api/connector/${type}/sync`, {
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
    if (diagnostics.some((item) => item.status === "down")) return "Degraded";
    if (diagnostics.some((item) => item.status === "degraded")) return "Degraded";
    return `${connected.length} source(s) connected`;
  }, [connected.length, diagnostics]);

  return (
    <div className="space-y-3 text-foreground">
      <motion.div
        className="relative overflow-hidden rounded-[10px] border border-border bg-background px-4 py-4"
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
          <DitherBackground className="h-full w-full opacity-25" accent="var(--color-chart-5)" density={0.54} cols={260} rows={72} />
        </motion.div>
        <div className="relative z-10">
          <h2 className="inline-block rounded-[6px] px-2 py-1 text-[17px] font-semibold">
            Imports
          </h2>
          <br/>
          <p className="mt-1 inline-block rounded-[6px] px-2 py-1 text-[12px] text-muted-foreground">
            Live connector ingestion and sync status from real backend integrations.
          </p>
        </div>
      </motion.div>

      {errorMessage ? (
        <div className="rounded-[10px] border border-destructive/40 bg-destructive/15 px-3.5 py-3 text-[12px] text-destructive">
          {errorMessage}
        </div>
      ) : null}
      {!errorMessage && loading ? (
        <div className="rounded-[10px] border border-border bg-muted px-3.5 py-3 text-[12px] text-muted-foreground">
          Loading live connector status...
        </div>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Waiting for backend"}
      </p>

      <div className="grid gap-2.5 md:grid-cols-3">
        {[
          { label: "Connected", value: connected.length, tone: "var(--color-chart-5)" },
          { label: "Records", value: totalRecords, tone: "var(--color-chart-4)" },
          { label: "Health", value: healthLabel, tone: "var(--color-chart-2)" },
        ].map((card) => (
          <div key={card.label} className="relative overflow-hidden rounded-[10px] border border-border bg-card px-3.5 py-3">
            <DitherBackground
              cols={52}
              rows={20}
              accent={card.tone}
              density={0.52}
              opacity={0.22}
              className="pointer-events-none absolute inset-0"
            />
            <p className="relative">
              <span className="inline-block rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground">
                {card.label}
              </span>
            </p>
            <p className="relative mt-1">
              <span className="inline-block rounded-[4px] px-1.5 py-0.5 text-[18px] font-semibold text-foreground">
                {card.value}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[10px] border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/75">
            Sources
          </p>
          <div className="mt-2 space-y-2">
            {connectors.map((connector) => (
              <div key={connector.id} className="rounded-[8px] border border-border bg-card/60 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-semibold">{connector.name}</p>
                    <p className="text-[11px] text-muted-foreground">{connector.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                        connector.status === "connected"
                          ? "border-primary/45 bg-primary/10 text-primary"
                          : connector.status === "pending"
                            ? "border-muted-foreground/45 bg-muted text-muted-foreground"
                            : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {connector.status}
                    </span>
                    <button
                      type="button"
                      disabled={connector.status !== "connected" || busyId === connector.type}
                      onClick={() => void syncConnector(connector.type)}
                      className="rounded-[7px] border border-primary/45 bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busyId === connector.type ? "SYNCING" : "SYNC"}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Records: {connector.recordCount ?? 0} · Last sync: {connector.lastSyncAt ? new Date(connector.lastSyncAt).toLocaleString() : "Never"}
                </p>
              </div>
            ))}
            {connectors.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No connector data returned yet.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[10px] border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/75">
            Activity
          </p>
          <div className="mt-2 space-y-2">
            {activity.map((item) => (
              <div key={item.id} className="rounded-[8px] border border-border bg-card/60 px-3 py-2">
                <p className="text-[12px] text-foreground">{item.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{item.at}</p>
              </div>
            ))}
            {activity.length === 0 ? (
              diagnostics.length > 0 ? (
                diagnostics.slice(0, 8).map((item, index) => (
                  <div key={`${item.connectorType}-${item.checkedAt}-${index}`} className="rounded-[8px] border border-border bg-card/60 px-3 py-2">
                    <p className="text-[12px] text-foreground">
                      {item.connectorType} health={item.status}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(item.checkedAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-muted-foreground">No sync activity yet.</p>
              )
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
