import type { NextFunction, Request, Response } from "express";
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({
  name: "memoryos_http_requests_total",
  help: "Total number of HTTP requests handled by MemoryOS API",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register],
});

const httpRequestDurationMs = new Histogram({
  name: "memoryos_http_request_duration_ms",
  help: "HTTP request latency in milliseconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register],
});

const appErrorsTotal = new Counter({
  name: "memoryos_app_errors_total",
  help: "Total number of application errors captured by error middleware",
  labelNames: ["route"] as const,
  registers: [register],
});

const continuityFeedbackTotal = new Counter({
  name: "memoryos_continuity_feedback_total",
  help: "Continuity quality feedback count by kind/rating/useful",
  labelNames: ["kind", "rating", "useful"] as const,
  registers: [register],
});

const continuityFeedbackRating = new Histogram({
  name: "memoryos_continuity_feedback_rating",
  help: "Continuity quality feedback rating by kind",
  labelNames: ["kind"] as const,
  buckets: [1, 2, 3, 4, 5],
  registers: [register],
});

const desktopLifecycleTotal = new Counter({
  name: "memoryos_desktop_lifecycle_total",
  help: "Desktop lifecycle API operations by operation/result/provider/os_type",
  labelNames: ["operation", "result", "provider", "os_type"] as const,
  registers: [register],
});

const desktopLifecycleDurationMs = new Histogram({
  name: "memoryos_desktop_lifecycle_duration_ms",
  help: "Desktop lifecycle operation latency in milliseconds",
  labelNames: ["operation", "result"] as const,
  buckets: [5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
  registers: [register],
});

const desktopProviderHealthChecksTotal = new Counter({
  name: "memoryos_desktop_provider_health_checks_total",
  help: "Desktop provider health check results",
  labelNames: ["provider", "healthy"] as const,
  registers: [register],
});

const desktopProviderHealthState = new Gauge({
  name: "memoryos_desktop_provider_health_state",
  help: "Desktop provider health state (1 healthy, 0 unhealthy)",
  labelNames: ["provider"] as const,
  registers: [register],
});

function detectRoute(req: Request): string {
  const routePath =
    typeof req.route?.path === "string" ? req.route.path : req.path;
  return `${req.baseUrl}${routePath}`;
}

export function observeHttpMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const started = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - started;
    const labels = {
      method: req.method,
      route: detectRoute(req),
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels, 1);
    httpRequestDurationMs.observe(labels, durationMs);
  });

  next();
}

export function recordAppError(route: string): void {
  appErrorsTotal.inc({ route }, 1);
}

export function recordContinuityFeedbackMetric(input: {
  kind: "resume" | "handoff" | "before_model" | "after_model";
  rating: number;
  useful: boolean;
}): void {
  continuityFeedbackTotal.inc(
    {
      kind: input.kind,
      rating: String(input.rating),
      useful: input.useful ? "true" : "false",
    },
    1,
  );
  continuityFeedbackRating.observe({ kind: input.kind }, input.rating);
}

export function recordDesktopLifecycleMetric(input: {
  operation: "start" | "wake" | "status" | "stop" | "capture";
  result: "success" | "error";
  provider: "preview" | "browser" | "vscode" | "playwright" | "custom" | "unknown";
  osType: "ubuntu" | "windows" | "unknown";
  durationMs: number;
}): void {
  desktopLifecycleTotal.inc(
    {
      operation: input.operation,
      result: input.result,
      provider: input.provider,
      os_type: input.osType,
    },
    1,
  );
  desktopLifecycleDurationMs.observe(
    {
      operation: input.operation,
      result: input.result,
    },
    input.durationMs,
  );
}

export function recordDesktopProviderHealthMetric(input: {
  provider: "sandbox" | "external";
  healthy: boolean;
}): void {
  const healthyLabel = input.healthy ? "true" : "false";
  desktopProviderHealthChecksTotal.inc(
    { provider: input.provider, healthy: healthyLabel },
    1,
  );
  desktopProviderHealthState.set({ provider: input.provider }, input.healthy ? 1 : 0);
}

export async function renderMetrics(): Promise<string> {
  return register.metrics();
}

export function getMetricsContentType(): string {
  return register.contentType;
}

