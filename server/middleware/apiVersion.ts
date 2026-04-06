import type { NextFunction, Request, Response } from "express";

export function setApiVersionHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const isV1 = req.originalUrl.startsWith("/api/v1/");
  res.setHeader("x-api-version", "1");

  if (!isV1) {
    res.setHeader("Deprecation", "true");
    res.setHeader(
      "Link",
      '</api/v1/memory>; rel="successor-version"; type="application/json"',
    );
  }

  next();
}

