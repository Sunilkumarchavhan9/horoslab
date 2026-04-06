import type { NextFunction, Request, Response } from "express";
import {
  Counter,
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

export async function renderMetrics(): Promise<string> {
  return register.metrics();
}

export function getMetricsContentType(): string {
  return register.contentType;
}

