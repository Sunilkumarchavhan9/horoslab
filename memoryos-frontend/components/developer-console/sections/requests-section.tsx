"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

const REQUEST_TIME_FILTERS = ["1d", "7d", "30d", "All"] as const;
const REQUEST_STATUS_FILTERS = ["All statuses", "Success", "Error"] as const;

type RequestTimeFilter = (typeof REQUEST_TIME_FILTERS)[number];
type RequestStatusFilter = (typeof REQUEST_STATUS_FILTERS)[number];

export type RequestSectionEvent = {
  id: string;
  createdAt: string;
  type: string;
  status: "Success" | "Error";
  latencyMs: number;
  route: string;
  method: string;
  statusCode: number;
  agent?: string;
  payloadSummary?: string;
  responseSummary?: string;
  errorDetails?: string;
};

type RequestsSectionProps = {
  requestEvents: RequestSectionEvent[];
  isLoading?: boolean;
  errorMessage?: string | null;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeRequestType(type: string): string {
  return type.trim().length > 0 ? type : "other";
}

export function RequestsSection({
  requestEvents,
  isLoading = false,
  errorMessage = null,
}: RequestsSectionProps) {
  const [liveEvents, setLiveEvents] = useState<RequestSectionEvent[]>(requestEvents);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [requestTimeFilter, setRequestTimeFilter] =
    useState<RequestTimeFilter>("30d");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("All types");
  const [requestStatusFilter, setRequestStatusFilter] =
    useState<RequestStatusFilter>("All statuses");
  const [showRequestTypeMenu, setShowRequestTypeMenu] = useState(false);
  const [showRequestStatusMenu, setShowRequestStatusMenu] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("-");

  useEffect(() => {
    const deduped = Array.from(new Map(requestEvents.map((event) => [event.id, event])).values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLiveEvents(deduped);
    setLastUpdated(new Date().toISOString());
  }, [requestEvents]);

  useEffect(() => {
    let cancelled = false;

    const fetchLive = async () => {
      try {
        const token = await getOrCreateMemoryToken();
        if (!token) return;
        const response = await fetch("/api/memory/requests?limit=200&range=all", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Could not refresh requests (${response.status})`);
        }
        const payload = (await response.json()) as {
          requests?: unknown[];
          data?: { requests?: unknown[] };
        };
        const rawList = Array.isArray(payload?.requests)
          ? payload.requests
          : Array.isArray(payload?.data?.requests)
            ? payload.data.requests
            : [];
        const mapped: RequestSectionEvent[] = rawList
          .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
          .map((entry) => ({
            id: String(entry.id ?? ""),
            createdAt: String(entry.createdAt ?? new Date().toISOString()),
            type: String(entry.routeType ?? entry.type ?? "other"),
            status:
              Number(entry.status) >= 200 && Number(entry.status) < 400
                ? "Success"
                : "Error",
            latencyMs: Number(entry.durationMs ?? entry.latencyMs ?? 0),
            route: String(entry.path ?? entry.route ?? ""),
            method: String(entry.method ?? "GET"),
            statusCode: Number(entry.statusCode ?? entry.status ?? 0),
            agent: typeof entry.agent === "string" ? entry.agent : null,
            payloadSummary:
              typeof entry.payloadSummary === "string" ? entry.payloadSummary : null,
            responseSummary:
              typeof entry.responseSummary === "string" ? entry.responseSummary : null,
            errorDetails:
              typeof entry.errorDetails === "string" ? entry.errorDetails : null,
          }));
        const deduped = Array.from(new Map(mapped.map((event) => [event.id, event])).values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (!cancelled) {
          setLiveEvents(deduped);
          setLiveError(null);
          setLastUpdated(new Date().toISOString());
        }
      } catch (err) {
        if (!cancelled) {
          setLiveError(err instanceof Error ? err.message : "Could not refresh requests.");
        }
      }
    };

    void fetchLive();
    const timer = window.setInterval(() => {
      void fetchLive();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const requestTypeFilters = useMemo(() => {
    const dynamicTypes = Array.from(
      new Set(liveEvents.map((event) => normalizeRequestType(event.type))),
    ).sort((a, b) => a.localeCompare(b));
    return ["All types", ...dynamicTypes];
  }, [liveEvents]);

  const filteredRequestEvents = useMemo(() => {
    const referenceTimeMs = Date.now();
    const maxAgeMs =
      requestTimeFilter === "All"
        ? null
        : requestTimeFilter === "1d"
          ? ONE_DAY_MS
          : requestTimeFilter === "7d"
            ? 7 * ONE_DAY_MS
            : 30 * ONE_DAY_MS;

    return liveEvents.filter((event) => {
      const matchesType =
        requestTypeFilter === "All types" ||
        normalizeRequestType(event.type) === requestTypeFilter;
      const matchesStatus =
        requestStatusFilter === "All statuses" ||
        event.status === requestStatusFilter;
      const eventTimeMs = new Date(event.createdAt).getTime();
      const matchesTime =
        maxAgeMs === null ||
        !Number.isFinite(eventTimeMs) ? false :
        referenceTimeMs - eventTimeMs <= maxAgeMs;

      return matchesType && matchesStatus && matchesTime;
    });
  }, [liveEvents, requestTimeFilter, requestTypeFilter, requestStatusFilter]);

  const successfulRequestCount = filteredRequestEvents.filter(
    (event) => event.status === "Success",
  ).length;
  const averageRequestLatency =
    successfulRequestCount > 0
      ? Math.round(
          filteredRequestEvents
            .filter((event) => event.status === "Success")
            .reduce((total, event) => total + event.latencyMs, 0) /
            successfulRequestCount,
        )
      : null;

  const hasRows = filteredRequestEvents.length > 0;
  const emptyTitle = isLoading
    ? "Loading requests..."
    : errorMessage || liveError
      ? "Could not load requests"
      : "No requests yet";
  const emptyDescription = isLoading
    ? "Fetching request history from the MemoryOS API."
    : errorMessage || liveError
      ? (errorMessage ?? liveError ?? "Could not load requests")
      : "API requests will appear here once you run retrieve, resume, continue, or handoff flows.";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">
            Requests
          </h1>
          <p className="mt-1 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">
            View MemoryOS API request history and continuity runtime details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center overflow-hidden rounded-[8px] border border-border bg-card">
            {REQUEST_TIME_FILTERS.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setRequestTimeFilter(range)}
                className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] transition ${
                  requestTimeFilter === range
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-muted-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowRequestTypeMenu((current) => !current);
                setShowRequestStatusMenu(false);
              }}
              className="flex items-center gap-2 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-foreground transition hover:border-border"
            >
              {requestTypeFilter}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M2 4l3 3 3-3" />
              </svg>
            </button>
            {showRequestTypeMenu ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[220px] overflow-hidden rounded-[8px] border border-border bg-card shadow-xl">
                {requestTypeFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setRequestTypeFilter(item);
                      setShowRequestTypeMenu(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] transition ${
                      requestTypeFilter === item
                        ? "bg-muted font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{item}</span>
                    {requestTypeFilter === item ? (
                      <span className="text-muted-foreground">✓</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowRequestStatusMenu((current) => !current);
                setShowRequestTypeMenu(false);
              }}
              className="flex items-center gap-2 rounded-[8px] border border-border bg-card px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-foreground transition hover:border-border"
            >
              {requestStatusFilter}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M2 4l3 3 3-3" />
              </svg>
            </button>
            {showRequestStatusMenu ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[180px] overflow-hidden rounded-[8px] border border-border bg-card shadow-xl">
                {REQUEST_STATUS_FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setRequestStatusFilter(item);
                      setShowRequestStatusMenu(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] transition ${
                      requestStatusFilter === item
                        ? "bg-muted font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{item}</span>
                    {requestStatusFilter === item ? (
                      <span className="text-muted-foreground">✓</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-2.5 lg:grid-cols-3">
        <div className="rounded-[8px] border border-border border-t-2 border-t-primary bg-card px-3.5 py-3.5 sm:px-4 sm:py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            By request type
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {filteredRequestEvents.length > 0
              ? `${filteredRequestEvents.length} request(s) in this period`
              : "No requests in this period"}
          </p>
        </div>
        <div className="rounded-[8px] border border-border border-t-2 border-t-primary bg-card px-3.5 py-3.5 sm:px-4 sm:py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Successful requests (2xx)
          </p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">
            {successfulRequestCount}
            <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">
              of {filteredRequestEvents.length}
            </span>
          </p>
        </div>
        <div className="rounded-[8px] border border-border border-t-2 border-t-primary bg-card px-3.5 py-3.5 sm:px-4 sm:py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Average latency (ms)
          </p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">
            {averageRequestLatency !== null ? averageRequestLatency : "-"}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-[10px] border border-border bg-card px-4 py-4 sm:px-5 sm:py-5">
        {!hasRows ? (
          <div className="grid min-h-[300px] place-items-center text-center sm:min-h-[360px]">
            <div className="max-w-[460px]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border text-muted-foreground">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="1,11 4,11 6,5 9,17 12,8 15,13 17,11 21,11" />
                </svg>
              </div>
              <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.04em]">
                {emptyTitle}
              </h2>
              <p className="mt-2 text-[14px] leading-7 text-muted-foreground">
                {emptyDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Route</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequestEvents.map((event) => (
                  <tr key={event.id} className="text-[12px] text-muted-foreground">
                    <td className="px-3 py-3">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">{normalizeRequestType(event.type)}</td>
                    <td className="px-3 py-3">{event.route}</td>
                    <td className="px-3 py-3">{event.status}</td>
                    <td className="px-3 py-3">{event.latencyMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
