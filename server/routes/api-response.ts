import type { Request, Response } from "express";
import type { ApiMeta, ApiResponse } from "../types/api-contracts";

type ApiErrorInput = {
  code: string;
  message: string;
  details?: unknown;
};

function getRequestId(req: Request): string {
  return req.requestId ?? "unknown";
}

export function buildApiMeta(
  req: Request,
  startedAtMs: number,
  extra?: Omit<ApiMeta, "requestId" | "latencyMs">,
): ApiMeta {
  return {
    requestId: getRequestId(req),
    latencyMs: Math.max(0, Date.now() - startedAtMs),
    ...(extra ?? {}),
  };
}

export function sendApiSuccess<T>(
  res: Response,
  status: number,
  data: T,
  meta: ApiMeta,
): Response<ApiResponse<T>> {
  return res.status(status).json({
    ok: true,
    data,
    meta,
  });
}

export function sendApiError<T>(
  res: Response,
  status: number,
  error: ApiErrorInput,
  meta: ApiMeta,
): Response<ApiResponse<T>> {
  return res.status(status).json({
    ok: false,
    error,
    meta,
  });
}

