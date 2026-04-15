import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { verifyAuthorizationHeader } from "../../lib/auth/verifyToken";

export function classicRequestIdMiddleware( req: Request, res: Response, next: NextFunction) {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

export async function requireClassicAuth( req: Request, res: Response,next: NextFunction) {
  const verified = await verifyAuthorizationHeader(req.header("authorization"));

  if (!verified) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.authUserId = verified.userId;
  next();
}
