/**
 * useBenchmarks — React hook for polling benchmark data from the backend.
 *
 * Provides:
 * - latest run data (auto-refreshes every 10s)
 * - run history for charts
 * - triggerRun() to start a new benchmark
 * - connection status (live / offline / error)
 * - last updated timestamp
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOrCreateMemoryToken } from "./memory-token";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BenchmarkFailedDetail {
  id: string;
  type: "retrieve" | "resume" | "contradiction";
  reason: string;
  severity: string;
}

export interface BenchmarkLatestRun {
  runId: string;
  generatedAt: string;
  completedAt: string | null;
  mode: "local" | "preview" | "production";
  environment: string;
  commitHash: string | null;
  branch: string | null;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  top3RetrievalPrecision: number;
  resumeSuccessRate: number;
  contradictionMissRate: number;
  wrongMergeRate: number;
  p95RetrieveLatencyMs: number | null;
  status: "running" | "passed" | "failed";
  suites: {
    retrieve: { passed: number; total: number };
    resume: { passed: number; total: number };
    contradiction: { passed: number; total: number };
  };
  abSummary?: {
    missingStepsImprovement: number;
    contradictionImprovement: number;
    timeToCorrectActionDeltaMs: number;
  };
  failedDetails: BenchmarkFailedDetail[];
}

export interface BenchmarkHistoryItem {
  runId: string;
  generatedAt: string;
  status: string;
  mode: string;
  passRate: number;
  top3RetrievalPrecision: number;
  resumeSuccessRate: number;
  contradictionMissRate: number;
  wrongMergeRate: number;
  p95RetrieveLatencyMs: number | null;
  abSummary?: {
    missingStepsImprovement: number;
    contradictionImprovement: number;
    timeToCorrectActionDeltaMs: number;
  };
  totalCases: number;
  passedCases: number;
  failedCases: number;
}

export interface BenchmarkCaseTrace {
  caseId: string;
  suite: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  retrievedMemories: string[];
  scores: Record<string, number>;
  passed: boolean;
  failureReason: string | null;
  traceSteps: Array<{ step: string; data: unknown; durationMs?: number }>;
  ab?: {
    withMemory: {
      passed: boolean;
      scores: Record<string, number>;
      actualOutput: string;
      retrievedCount: number;
      latencyMs: number;
    };
    withoutMemory: {
      passed: boolean;
      scores: Record<string, number>;
      actualOutput: string;
      retrievedCount: number;
      latencyMs: number;
    };
    delta: {
      missingStepsImprovement: number;
      contradictionImprovement: number;
      timeToCorrectActionDeltaMs: number;
    };
  };
}

export interface BenchmarkCaseResultItem {
  caseId: string;
  suite: "retrieve" | "resume" | "contradiction";
  passed: boolean;
  failureReason: string | null;
  createdAt: string;
  ab?: BenchmarkCaseTrace["ab"];
}

export interface BenchmarkScenario {
  id: string;
  name: string;
  mode: "local" | "preview" | "production";
  caseIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type BenchmarkConnectionStatus = "live" | "offline" | "error";

export interface UseBenchmarksResult {
  latest: BenchmarkLatestRun | null;
  history: BenchmarkHistoryItem[];
  connectionStatus: BenchmarkConnectionStatus;
  isLoading: boolean;
  isRunning: boolean;
  errorMessage: string | null;
  lastUpdatedAt: Date | null;
  triggerRun: () => Promise<void>;
  listRunCases: (runId: string) => Promise<BenchmarkCaseResultItem[]>;
  fetchTrace: (runId: string, caseId: string) => Promise<BenchmarkCaseTrace | null>;
  listScenarios: () => Promise<BenchmarkScenario[]>;
  createScenario: (input: { name: string; mode: "local" | "preview" | "production"; caseIds: string[] }) => Promise<BenchmarkScenario | null>;
  runScenario: (scenarioId: string) => Promise<void>;
  checkRegressionGate: (thresholds?: {
    minPassRate?: number;
    maxContradictionMissRate?: number;
    minMissingStepsImprovement?: number;
  }) => Promise<{
    pass: boolean;
    runId?: string;
    generatedAt?: string;
    checks: Array<{ key: string; value: number; target: number; pass: boolean }>;
  } | null>;
  getWeeklyMetrics: () => Promise<{
    window: string;
    sampleSize: number;
    previousSampleSize: number;
    metrics: {
      continuityPassRate: number | null;
      contradictionRate: number | null;
      staleMemoryRate: number | null;
      recoveryLatencyMs: number | null;
    };
    deltasVsPreviousWeek: {
      continuityPassRate: number | null;
      contradictionRate: number | null;
      staleMemoryRate: number | null;
      recoveryLatencyMs: number | null;
    };
  } | null>;
  getRegressionAlerts: () => Promise<{
    runId: string;
    alerts: Array<{
      id: string;
      severity: "warning" | "critical";
      message: string;
      metric: string;
      latestValue: number;
      previousValue: number | null;
      delta: number | null;
      generatedAt: string;
    }>;
  } | null>;
  refreshNow: () => void;
}

// ─── Implementation ──────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000;

function getApiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim();
  if (configured && configured !== "same-origin") {
    return configured.replace(/\/+$/, "");
  }
  return "";
}

async function fetchBenchmarkApi<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const origin = getApiOrigin();
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

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  // Unwrap the { ok, data } envelope
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}


export function useBenchmarks(): UseBenchmarksResult {
  const [latest, setLatest] = useState<BenchmarkLatestRun | null>(null);
  const [history, setHistory] = useState<BenchmarkHistoryItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<BenchmarkConnectionStatus>("offline");
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    const token = await getOrCreateMemoryToken();
    if (!token) {
      setConnectionStatus("offline");
      setIsLoading(false);
      return;
    }

    try {
      const [latestData, historyData] = await Promise.all([
        fetchBenchmarkApi<BenchmarkLatestRun | null>("/api/benchmarks/latest", token),
        fetchBenchmarkApi<BenchmarkHistoryItem[]>("/api/benchmarks/history?range=all", token),
      ]);

      if (!mountedRef.current) return;

      setLatest(latestData);
      const dedupedHistory = Array.from(
        new Map((historyData ?? []).map((run) => [run.runId, run])).values(),
      ).sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
      );
      setHistory(dedupedHistory);
      setConnectionStatus("live");
      setErrorMessage(null);
      setLastUpdatedAt(new Date());

      // Check if a run is currently in progress
      if (latestData?.status === "running") {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      const msg = error instanceof Error ? error.message : "Failed to fetch benchmarks";
      if (msg.includes("not reachable") || msg.includes("Failed to fetch")) {
        setConnectionStatus("offline");
      } else {
        setConnectionStatus("error");
      }
      setErrorMessage(msg);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Start polling on mount
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    timerRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetchData]);

  const triggerRun = useCallback(async () => {
    const token = await getOrCreateMemoryToken();
    if (!token) return;

    setIsRunning(true);
    try {
      await fetchBenchmarkApi("/api/benchmarks/run", token, { method: "POST" });
      // Immediately start polling faster until the run completes
      const fastPoll = setInterval(async () => {
        if (!mountedRef.current) {
          clearInterval(fastPoll);
          return;
        }
        await fetchData();
        const currentLatest = (await getOrCreateMemoryToken())
          ? await fetchBenchmarkApi<BenchmarkLatestRun | null>("/api/benchmarks/latest", token).catch(() => null)
          : null;
        if (currentLatest && currentLatest.status !== "running") {
          clearInterval(fastPoll);
          setIsRunning(false);
          await fetchData();
        }
      }, 3000);

      // Safety timeout to stop fast polling after 5 minutes
      setTimeout(() => {
        clearInterval(fastPoll);
        setIsRunning(false);
      }, 5 * 60 * 1000);
    } catch (error) {
      setIsRunning(false);
      setErrorMessage(error instanceof Error ? error.message : "Failed to start benchmark");
    }
  }, [fetchData]);

  const fetchTrace = useCallback(
    async (runId: string, caseId: string): Promise<BenchmarkCaseTrace | null> => {
      const token = await getOrCreateMemoryToken();
      if (!token) return null;
      try {
        return await fetchBenchmarkApi<BenchmarkCaseTrace>(
          `/api/benchmarks/cases/${runId}/${caseId}/trace`,
          token,
        );
      } catch {
        return null;
      }
    },
    [],
  );

  const listRunCases = useCallback(async (runId: string): Promise<BenchmarkCaseResultItem[]> => {
    const token = await getOrCreateMemoryToken();
    if (!token) return [];
    try {
      return await fetchBenchmarkApi<BenchmarkCaseResultItem[]>(
        `/api/benchmarks/runs/${runId}/cases`,
        token,
      );
    } catch {
      return [];
    }
  }, []);

  const listScenarios = useCallback(async (): Promise<BenchmarkScenario[]> => {
    const token = await getOrCreateMemoryToken();
    if (!token) return [];
    try {
      return await fetchBenchmarkApi<BenchmarkScenario[]>("/api/benchmarks/scenarios", token);
    } catch {
      return [];
    }
  }, []);

  const createScenario = useCallback(
    async (input: { name: string; mode: "local" | "preview" | "production"; caseIds: string[] }): Promise<BenchmarkScenario | null> => {
      const token = await getOrCreateMemoryToken();
      if (!token) return null;
      try {
        return await fetchBenchmarkApi<BenchmarkScenario>("/api/benchmarks/scenarios", token, {
          method: "POST",
          body: JSON.stringify(input),
        });
      } catch {
        return null;
      }
    },
    [],
  );

  const runScenario = useCallback(async (scenarioId: string): Promise<void> => {
    const token = await getOrCreateMemoryToken();
    if (!token) return;
    await fetchBenchmarkApi(`/api/benchmarks/scenarios/${scenarioId}/run`, token, {
      method: "POST",
    });
  }, []);

  const checkRegressionGate = useCallback(
    async (thresholds?: {
      minPassRate?: number;
      maxContradictionMissRate?: number;
      minMissingStepsImprovement?: number;
    }) => {
      const token = await getOrCreateMemoryToken();
      if (!token) return null;
      const params = new URLSearchParams();
      if (typeof thresholds?.minPassRate === "number") {
        params.set("minPassRate", String(thresholds.minPassRate));
      }
      if (typeof thresholds?.maxContradictionMissRate === "number") {
        params.set("maxContradictionMissRate", String(thresholds.maxContradictionMissRate));
      }
      if (typeof thresholds?.minMissingStepsImprovement === "number") {
        params.set("minMissingStepsImprovement", String(thresholds.minMissingStepsImprovement));
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      try {
        return await fetchBenchmarkApi<{
          pass: boolean;
          runId?: string;
          generatedAt?: string;
          checks: Array<{ key: string; value: number; target: number; pass: boolean }>;
        }>(`/api/benchmarks/regression/check${suffix}`, token);
      } catch {
        return null;
      }
    },
    [],
  );

  const refreshNow = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const getWeeklyMetrics = useCallback(async () => {
    const token = await getOrCreateMemoryToken();
    if (!token) return null;
    try {
      return await fetchBenchmarkApi<{
        window: string;
        sampleSize: number;
        previousSampleSize: number;
        metrics: {
          continuityPassRate: number | null;
          contradictionRate: number | null;
          staleMemoryRate: number | null;
          recoveryLatencyMs: number | null;
        };
        deltasVsPreviousWeek: {
          continuityPassRate: number | null;
          contradictionRate: number | null;
          staleMemoryRate: number | null;
          recoveryLatencyMs: number | null;
        };
      }>("/api/benchmarks/metrics/weekly", token);
    } catch {
      return null;
    }
  }, []);

  const getRegressionAlerts = useCallback(async () => {
    const token = await getOrCreateMemoryToken();
    if (!token) return null;
    try {
      return await fetchBenchmarkApi<{
        runId: string;
        alerts: Array<{
          id: string;
          severity: "warning" | "critical";
          message: string;
          metric: string;
          latestValue: number;
          previousValue: number | null;
          delta: number | null;
          generatedAt: string;
        }>;
      }>("/api/benchmarks/regression/alerts", token);
    } catch {
      return null;
    }
  }, []);

  return {
    latest,
    history,
    connectionStatus,
    isLoading,
    isRunning,
    errorMessage,
    lastUpdatedAt,
    triggerRun,
    listRunCases,
    fetchTrace,
    listScenarios,
    createScenario,
    runScenario,
    checkRegressionGate,
    getWeeklyMetrics,
    getRegressionAlerts,
    refreshNow,
  };
}
