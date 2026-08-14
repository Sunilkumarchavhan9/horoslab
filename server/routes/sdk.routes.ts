import { Router, type Request } from "express";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import { buildSdkWorkspaceSnapshot } from "../lib/sdk/sdkIntrospection";

export const sdkRouter = Router();

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

async function loadSnapshot(req: Request) {
  const workspaceId = await resolveWorkspaceId(req);
  const snapshot = await buildSdkWorkspaceSnapshot(workspaceId);
  return { workspaceId, snapshot };
}

sdkRouter.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const { workspaceId, snapshot } = await loadSnapshot(req);
      sendApiSuccess(
        res,
        200,
        {
          workspaceId,
          sdk: snapshot.stats,
          versions: snapshot.versions,
          methods: snapshot.methods,
          releases: snapshot.releases,
          metrics: snapshot.metrics,
        },
        buildApiMeta(req, startedAt, { intent: "sdk_stats" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "SDK_STATS_FAILED", message: error instanceof Error ? error.message : "Failed to load SDK stats" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

sdkRouter.get(
  "/versions",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const { workspaceId, snapshot } = await loadSnapshot(req);
      sendApiSuccess(
        res,
        200,
        { workspaceId, versions: snapshot.versions },
        buildApiMeta(req, startedAt, { intent: "sdk_versions" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "SDK_VERSIONS_FAILED", message: error instanceof Error ? error.message : "Failed to load SDK versions" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

sdkRouter.get(
  "/methods",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const { workspaceId, snapshot } = await loadSnapshot(req);
      sendApiSuccess(
        res,
        200,
        { workspaceId, methods: snapshot.methods, metrics: snapshot.metrics },
        buildApiMeta(req, startedAt, { intent: "sdk_methods" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "SDK_METHODS_FAILED", message: error instanceof Error ? error.message : "Failed to load SDK methods" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);

sdkRouter.get(
  "/releases",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    try {
      const { workspaceId, snapshot } = await loadSnapshot(req);
      sendApiSuccess(
        res,
        200,
        { workspaceId, releases: snapshot.releases, versions: snapshot.versions },
        buildApiMeta(req, startedAt, { intent: "sdk_releases" }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "workspace_not_found") {
        sendApiError(res, 404, { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }, buildApiMeta(req, startedAt));
        return;
      }
      sendApiError(
        res,
        500,
        { code: "SDK_RELEASES_FAILED", message: error instanceof Error ? error.message : "Failed to load SDK releases" },
        buildApiMeta(req, startedAt),
      );
    }
  }),
);
