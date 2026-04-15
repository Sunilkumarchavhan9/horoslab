import { Router } from "express";
import {
  invokeMemoryTool,
  listMemoryTools,
  type InvokeMemoryToolError,
} from "../../lib/memory/MCP";
import { asyncHandler } from "../middleware/asyncHandler";
import { McpInvokeRequestSchema } from "../schemas/mcp.schema";
import type { McpInvokeResponseData, McpToolsResponseData } from "../types/api-contracts";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";

export const mcpRouter = Router();

function isInvokeMemoryToolError(value: unknown): value is InvokeMemoryToolError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.code === "BAD_REQUEST" || candidate.code === "NOT_FOUND") &&
    typeof candidate.error === "string"
  );
}

mcpRouter.get(
  "/tools",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();

    sendApiSuccess<McpToolsResponseData>(
      res,
      200,
      {
        tools: listMemoryTools(),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

mcpRouter.post(
  "/invoke",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = McpInvokeRequestSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      sendApiError<McpInvokeResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const result = await invokeMemoryTool(parsed.data.name, {
      ...parsed.data.input,
      userId: req.authUserId,
    });

    if (isInvokeMemoryToolError(result)) {
      sendApiError<McpInvokeResponseData>(
        res,
        result.code === "NOT_FOUND" ? 404 : 400,
        {
          code: result.code,
          message: result.error,
          ...(result.details !== undefined ? { details: result.details } : {}),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess<McpInvokeResponseData>(
      res,
      200,
      {
        name: parsed.data.name,
        result,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);
