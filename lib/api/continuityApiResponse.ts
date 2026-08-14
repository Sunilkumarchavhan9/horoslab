import type { Request, Response } from "express";
import type {
  ContinuityApiFailure,
  ContinuityApiMeta,
  ContinuityApiResponse,
  ContinuityApiSuccess,
} from "./continuityApiTypes";

export function buildContinuityMeta(
  req: Request,
  startedAtMs: number,
  extra?: Pick<ContinuityApiMeta, "projectId" | "orgId">,
): ContinuityApiMeta {
  return {
    generatedAt: new Date().toISOString(),
    traceId: req.requestId,
    requestId: req.requestId,
    latencyMs: Math.max(0, Date.now() - startedAtMs),
    ...extra,
  };
}

export function sendContinuitySuccess<T>(
  res: Response,
  status: number,
  data: T,
  meta: ContinuityApiMeta,
): Response<ContinuityApiSuccess<T>> {
  return res.status(status).json({
    ok: true,
    data,
    meta,
  } satisfies ContinuityApiResponse<T>);
}

export function sendContinuityError(
  res: Response,
  status: number,
  code: string,
  error: string,
  meta: ContinuityApiMeta,
): Response<ContinuityApiFailure> {
  return res.status(status).json({
    ok: false,
    code,
    error,
    meta,
  } satisfies ContinuityApiFailure);
}
