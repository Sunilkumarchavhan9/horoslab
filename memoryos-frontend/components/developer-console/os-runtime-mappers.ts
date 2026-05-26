import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";

export type OsChartInput = {
  createdAt: string;
  primary: number;
  secondary: number;
};

export type OsTableRow = {
  id: string;
  label: string;
  detail: string;
  meta: string;
  status: string;
  tone?: "teal" | "rose" | "amber" | "slate";
};

function cleanRoute(route: string) {
  return route.split("?")[0] || route;
}

function eventLabel(event: RequestSectionEvent) {
  if (event.type === "resume") return "Continuation context";
  if (event.type === "handoff") return "Agent handoff";
  if (event.type === "retrieve") return "Retrieval execution";
  if (event.type === "memory_add") return "Memory write";
  if (event.type === "memory_list") return "Memory registry";
  if (event.type === "timeline") return "Timeline inspection";
  if (event.type === "insights") return "Memory insights";
  if (cleanRoute(event.route).includes("/connector")) return "Source connector";
  return event.type || "Runtime event";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "unknown";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function requestEventsToChartInput(
  events: RequestSectionEvent[],
): OsChartInput[] {
  return events
    .filter((event) => event?.id)
    .map((event) => ({
      createdAt: event.createdAt,
      primary: event.status === "Success" ? 1 : 0,
      secondary: Number.isFinite(event.latencyMs)
        ? Math.min(1, event.latencyMs / 1200)
        : 0,
    }));
}

export function requestEventsToTableRows(
  events: RequestSectionEvent[],
  limit = 24,
): OsTableRow[] {
  return [...events]
    .filter((event) => event?.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      label: eventLabel(event),
      detail:
        event.responseSummary ||
        event.payloadSummary ||
        `${event.method} ${cleanRoute(event.route)}`,
      meta: `${formatTime(event.createdAt)} · ${event.latencyMs}ms`,
      status: event.status === "Success" ? `${event.statusCode} OK` : `${event.statusCode} issue`,
      tone:
        event.status === "Success"
          ? "teal"
          : event.statusCode >= 500
            ? "rose"
            : "amber",
    }));
}
