import type { NextFunction, Request, Response } from "express";
import { recordAppError } from "../observability/metrics";
import { captureBackendError } from "../../lib/observability/sentry";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId ?? "unknown",
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;
  recordAppError(`${req.baseUrl}${req.path}`);
  const requestId = req.requestId ?? "unknown";
  const debugMessage = error instanceof Error ? error.message : "Unknown server error";

  console.error(
    `[error] path=${req.originalUrl} requestId=${requestId} message=${debugMessage}`,
  );
  captureBackendError(error, {
    requestId,
    path: req.originalUrl,
    method: req.method,
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.status(500).json({
    error: "Internal Server Error",
    message: "Unexpected server error. Please retry or contact support with requestId.",
    requestId,
    ...(isProduction ? {} : { debugMessage }),
  });
}
