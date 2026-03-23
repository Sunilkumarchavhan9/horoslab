import type { NextFunction, Request, Response } from "express";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const userId = req.authUserId ?? "anonymous";
    const requestId = req.requestId ?? "unknown";

    console.log(
      `[request] method=${req.method} path=${req.originalUrl} status=${res.statusCode} durationMs=${durationMs} userId=${userId} requestId=${requestId}`,
    );
  });

  next();
}
