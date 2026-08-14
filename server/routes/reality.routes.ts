import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import {
  RealityRuntime,
  resetRealityStoreForTests,
} from "../../lib/reality/realityRuntime";

export const realityRouter = Router();

function parseLimit(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function getQuestionFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const value = (body as { question?: unknown }).question;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

realityRouter.get(
  "/status",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    sendApiSuccess(res, 200, { status: RealityRuntime.getStatus() }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.get(
  "/graph",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    sendApiSuccess(res, 200, RealityRuntime.getSnapshot(), buildApiMeta(req, startedAt));
  }),
);

realityRouter.get(
  "/nodes",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    sendApiSuccess(res, 200, { nodes: RealityRuntime.listNodes() }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.get(
  "/nodes/:nodeId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const nodeId = String(req.params.nodeId ?? "");
    const node = RealityRuntime.getNode(nodeId);
    if (!node) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality node not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(
      res,
      200,
      {
        node,
        edges: RealityRuntime.listEdges().filter((edge) => edge.from === nodeId || edge.to === nodeId),
        neighbors: RealityRuntime.getNeighbors(nodeId),
        pathHints: RealityRuntime.listNodes()
          .filter((candidate) => candidate.id !== nodeId)
          .slice(0, 5)
          .map((candidate) => ({
            targetId: candidate.id,
            path: RealityRuntime.findPath(nodeId, candidate.id),
          })),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

realityRouter.get(
  "/neighbors/:nodeId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const nodeId = String(req.params.nodeId ?? "");
    if (!RealityRuntime.getNode(nodeId)) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality node not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { neighbors: RealityRuntime.getNeighbors(nodeId) }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.get(
  "/events",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const limit = parseLimit(req.query.limit, 100);
    sendApiSuccess(
      res,
      200,
      { events: RealityRuntime.listEvents(limit) },
      buildApiMeta(req, startedAt),
    );
  }),
);

realityRouter.post(
  "/nodes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = req.body ?? {};
    const type = typeof body.type === "string" ? body.type : "";
    const name = typeof body.name === "string" ? body.name : "";
    if (!type || !name) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "type and name are required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const node = RealityRuntime.createNode({
      type: type as Parameters<typeof RealityRuntime.createNode>[0]["type"],
      name,
      state: typeof body.state === "string" ? body.state : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : undefined,
    });
    sendApiSuccess(res, 201, { node }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/edges",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = req.body ?? {};
    const from = typeof body.from === "string" ? body.from : "";
    const to = typeof body.to === "string" ? body.to : "";
    const relationship = typeof body.relationship === "string" ? body.relationship : "";
    if (!from || !to || !relationship) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "from, to, and relationship are required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const edge = RealityRuntime.connect({
      from,
      to,
      relationship,
      confidence: typeof body.confidence === "number" ? body.confidence : undefined,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as Record<string, unknown>)
          : undefined,
    });
    if (!edge) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Source or target node not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 201, { edge }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/events",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = req.body ?? {};
    const nodeId = typeof body.nodeId === "string" ? body.nodeId : "";
    const type = typeof body.type === "string" ? body.type : "";
    if (!nodeId || !type) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "nodeId and type are required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const event = RealityRuntime.appendEvent({
      nodeId,
      type,
      payload: body.payload && typeof body.payload === "object" ? (body.payload as Record<string, unknown>) : undefined,
      source: typeof body.source === "string" ? body.source : undefined,
    });
    if (!event) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality node not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 201, { event }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.get(
  "/connections",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    sendApiSuccess(
      res,
      200,
      {
        connections: RealityRuntime.listConnections(),
        summary: RealityRuntime.connectionSummary(),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

realityRouter.get(
  "/connections/:connectionId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const connectionId = String(req.params.connectionId ?? "");
    const connection = RealityRuntime.connectionHealth(connectionId);
    if (!connection) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality connection not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { connection }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/connections",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = req.body ?? {};
    const system = typeof body.system === "string" ? body.system : "";
    if (!system) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "system is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const connection = RealityRuntime.connectSystem(system, body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : {});
    sendApiSuccess(res, 201, { connection }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/connections/:connectionId/sync",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const connectionId = String(req.params.connectionId ?? "");
    if (!connectionId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "connectionId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const connection = RealityRuntime.syncConnection(connectionId);
    if (!connection) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality connection not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { connection }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.get(
  "/sources",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    sendApiSuccess(
      res,
      200,
      {
        sources: RealityRuntime.listSources(),
        summary: RealityRuntime.sourceSummary(),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

realityRouter.get(
  "/sources/:sourceId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const sourceId = String(req.params.sourceId ?? "");
    const source = RealityRuntime.sourceStatus(sourceId);
    if (!source) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality source not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { source }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/sources",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = req.body ?? {};
    const system = typeof body.system === "string" ? body.system : "";
    if (!system) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "system is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const source = RealityRuntime.registerSource(system, body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : {});
    sendApiSuccess(res, 201, { source }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/sources/:sourceId/sync",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const sourceId = String(req.params.sourceId ?? "");
    if (!sourceId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "sourceId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const source = RealityRuntime.syncSource(sourceId);
    if (!source) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality source not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { source }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/sources/:sourceId/index",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const sourceId = String(req.params.sourceId ?? "");
    if (!sourceId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "sourceId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const documentsIndexed = typeof req.body?.documentsIndexed === "number" ? req.body.documentsIndexed : 1;
    const source = RealityRuntime.indexSource(sourceId, documentsIndexed);
    if (!source) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality source not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { source }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.get(
  "/evidence/:evidenceId",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const evidenceId = String(req.params.evidenceId ?? "");
    const evidence = RealityRuntime.getEvidence(evidenceId);
    if (!evidence) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality evidence not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { evidence }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.get(
  "/query",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const result = RealityRuntime.queryReality({
      question: typeof req.query.question === "string" ? req.query.question : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      connectedTo: typeof req.query.connectedTo === "string" ? req.query.connectedTo : undefined,
      relationship: typeof req.query.relationship === "string" ? req.query.relationship : undefined,
      direction: req.query.direction === "incoming" || req.query.direction === "outgoing" || req.query.direction === "any" ? req.query.direction : undefined,
      limit: typeof req.query.limit === "string" ? parseLimit(req.query.limit, 50) : undefined,
    });
    sendApiSuccess(res, 200, { result }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/query",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const body = req.body ?? {};
    const result = RealityRuntime.queryReality({
      question: getQuestionFromBody(body),
      search: typeof body.search === "string" ? body.search : undefined,
      connectedTo: typeof body.connectedTo === "string" ? body.connectedTo : undefined,
      relationship: typeof body.relationship === "string" ? body.relationship : undefined,
      direction: body.direction === "incoming" || body.direction === "outgoing" || body.direction === "any" ? body.direction : undefined,
      limit: typeof body.limit === "number" ? body.limit : undefined,
    });
    sendApiSuccess(res, 200, { result }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.delete(
  "/nodes/:nodeId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const nodeId = String(req.params.nodeId ?? "");
    if (!nodeId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "nodeId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const removed = RealityRuntime.deleteNode(nodeId);
    if (!removed) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality node not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { deleted: true }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.delete(
  "/edges/:edgeId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const edgeId = String(req.params.edgeId ?? "");
    if (!edgeId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "edgeId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const removed = RealityRuntime.disconnect(edgeId);
    if (!removed) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Reality edge not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(res, 200, { deleted: true }, buildApiMeta(req, startedAt));
  }),
);

realityRouter.post(
  "/__reset",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    if (process.env.NODE_ENV !== "test") {
      sendApiError(
        res,
        403,
        { code: "FORBIDDEN", message: "Reality test reset is only available in tests" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    resetRealityStoreForTests();
    sendApiSuccess(res, 200, { reset: true }, buildApiMeta(req, startedAt));
  }),
);
