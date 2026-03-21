import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;
  const message = error instanceof Error ? error.message : "Unknown server error";
  res.status(500).json({
    error: "Internal Server Error",
    message,
  });
}
