import type { NextFunction, Request, Response } from "express";
import { verifyAuthorizationHeader } from "../../lib/auth/verifyToken";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const verified = await verifyAuthorizationHeader(req.header("authorization"));
  if (!verified) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.authUserId = verified.userId;
  if (verified.apiKeyId) {
    req.authApiKeyId = verified.apiKeyId;
  }
  next();
}
