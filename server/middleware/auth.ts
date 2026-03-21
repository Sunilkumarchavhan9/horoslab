import type { NextFunction, Request, Response } from "express";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = req.header("x-user-id")?.trim();
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.authUserId = userId;
  next();
}
