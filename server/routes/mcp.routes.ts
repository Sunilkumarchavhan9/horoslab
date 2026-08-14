import { Router, type Request } from "express";
import { prisma } from "../../lib/storage/prismaClient";
import {
  invokeMemoryTool,
  type InvokeMemoryToolError,
} from "../../lib/memory/MCP";
import { buildMcpWorkspaceSnapshot } from "../lib/mcp/mcpIntrospection";
import { asyncHandler } from "../middleware/asyncHandler";
import { McpInvokeRequestSchema } from "../schemas/mcp.schema";
import type { McpInvokeResponseData } from "../types/api-contracts";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";

export const mcpRouter = Router();

function scopedWorkspaceWhere(req: Request): { userId: string; orgId?: string } {
  if (!req.authUserId) {
    throw new Error("unauthorized");
  }
  return req.authOrgId ? { userId: req.authUserId, orgId: req.authOrgId } : { userId: req.authUserId };
}

async function resolveWorkspaceId(req: Request): Promise<string> {
  const userId = req.authUserId;
  if (!userId) {
    throw new Error("unauthorized");
  }
  const providedWorkspaceId =
    typeof req.query.workspaceId === "string" && req.query.workspaceId.trim().length > 0
      ? req.query.workspaceId.trim()
      : typeof req.body?.workspaceId === "string" && req.body.workspaceId.trim().length > 0
        ? req.body.workspaceId.trim()
        : null;

  if (providedWorkspaceId) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: providedWorkspaceId, ...scopedWorkspaceWhere(req) },
      select: { id: true },
    });
    if (!workspace) {
      if (req.authOrgId) {
        const fallbackWorkspace = await prisma.workspace.findFirst({
          where: { id: providedWorkspaceId, userId: req.authUserId, orgId: null },
          select: { id: true },
        });
        if (fallbackWorkspace) {
          return fallbackWorkspace.id;
        }
      }
      throw new Error("workspace_not_found");
    }
    return workspace.id;
  }

  const existing = await prisma.workspace.findFirst({
    where: scopedWorkspaceWhere(req),
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }

  const created = await prisma.workspace.create({
    data: {
      ...scopedWorkspaceWhere(req),
      name: "MemoryOS Workspace",
      ownerId: userId,
    },
    select: { id: true },
  });
  return created.id;
}

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
  "/status",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const workspaceId = await resolveWorkspaceId(req);
      const snapshot = await buildMcpWorkspaceSnapshot(workspaceId);
      sendApiSuccess(
        res,
        200,
        {
          mcp: snapshot,
        },
        buildApiMeta(req, startedAt, { intent: "mcp_status" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "MCP_STATUS_FAILED", message: error instanceof Error ? error.message : "Failed to load MCP status" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

mcpRouter.get(
  "/clients",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const workspaceId = await resolveWorkspaceId(req);
      const snapshot = await buildMcpWorkspaceSnapshot(workspaceId);
      sendApiSuccess(res, 200, { workspaceId, clients: snapshot.clients }, buildApiMeta(req, startedAt, { intent: "mcp_clients" }));
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "MCP_CLIENTS_FAILED", message: error instanceof Error ? error.message : "Failed to load MCP clients" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

mcpRouter.get(
  "/tools",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const workspaceId = await resolveWorkspaceId(req);
      const snapshot = await buildMcpWorkspaceSnapshot(workspaceId);
      sendApiSuccess(
        res,
        200,
        {
          workspaceId,
          tools: snapshot.tools,
        },
        buildApiMeta(req, startedAt, { intent: "mcp_tools" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "MCP_TOOLS_FAILED", message: error instanceof Error ? error.message : "Failed to load MCP tools" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

mcpRouter.get(
  "/resources",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const workspaceId = await resolveWorkspaceId(req);
      const snapshot = await buildMcpWorkspaceSnapshot(workspaceId);
      sendApiSuccess(
        res,
        200,
        {
          workspaceId,
          resources: snapshot.resources,
        },
        buildApiMeta(req, startedAt, { intent: "mcp_resources" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "MCP_RESOURCES_FAILED", message: error instanceof Error ? error.message : "Failed to load MCP resources" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

mcpRouter.get(
  "/requests",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const workspaceId = await resolveWorkspaceId(req);
      const snapshot = await buildMcpWorkspaceSnapshot(workspaceId);
      sendApiSuccess(
        res,
        200,
        {
          workspaceId,
          requests: snapshot.requests,
        },
        buildApiMeta(req, startedAt, { intent: "mcp_requests" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "MCP_REQUESTS_FAILED", message: error instanceof Error ? error.message : "Failed to load MCP requests" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

mcpRouter.get(
  "/logs",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const workspaceId = await resolveWorkspaceId(req);
      const snapshot = await buildMcpWorkspaceSnapshot(workspaceId);
      sendApiSuccess(
        res,
        200,
        {
          workspaceId,
          logs: snapshot.logs,
        },
        buildApiMeta(req, startedAt, { intent: "mcp_logs" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "MCP_LOGS_FAILED", message: error instanceof Error ? error.message : "Failed to load MCP logs" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

mcpRouter.get(
  "/sessions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const workspaceId = await resolveWorkspaceId(req);
      const snapshot = await buildMcpWorkspaceSnapshot(workspaceId);
      sendApiSuccess(
        res,
        200,
        {
          workspaceId,
          sessions: snapshot.sessions,
        },
        buildApiMeta(req, startedAt, { intent: "mcp_sessions" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "MCP_SESSIONS_FAILED", message: error instanceof Error ? error.message : "Failed to load MCP sessions" },
        buildApiMeta(req, startedAt),
      );
    }
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
