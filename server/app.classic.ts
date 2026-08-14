import express from "express";
import type { ErrorRequestHandler } from "express";

import { invokeMemoryTool, listMemoryTools } from "../lib/memory/MCP";
import { ensureMemoryStoreIntegrity } from "../lib/memory/startupIntegrity";
import {
  classicRequestIdMiddleware,
  requireClassicAuth,
} from "./middleware/classic";
import { corsMiddleware } from "./middleware/cors";
import {
  getMetricsContentType,
  renderMetrics,
} from "./observability/metrics";

export function createClassicMemoryOsApp() {
  ensureMemoryStoreIntegrity();

  const app = express();
  const classicErrorHandler: ErrorRequestHandler = function (error, req, res, _next) {
    void _next;
    console.error(error);

    res.status(500).json({
      ok: false,
      error: "Internal server error",
      requestId: req.requestId || "unknown",
    });
  };

  app.use(corsMiddleware);

  app.use(express.json());
  app.use(classicRequestIdMiddleware);

  app.get("/", function (req, res) {
    res.status(200).json({
      status: "ok",
      message: "MemoryOS classic express app",
      requestId: req.requestId || "unknown",
    });
  });

  app.get("/api/health", function (req, res) {
    res.status(200).json({
      status: "ok",
      requestId: req.requestId || "unknown",
    });
  });

  app.get("/api/v1/health", function (req, res) {
    res.status(200).json({
      status: "ok",
      requestId: req.requestId || "unknown",
    });
  });

  app.get("/api/metrics", async function (req, res) {
    const requiredToken = process.env.METRICS_TOKEN;

    if (requiredToken) {
      const authHeader = req.header("authorization");
      const bearerToken =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.slice("Bearer ".length)
          : undefined;
      const headerToken = req.header("x-metrics-token");
      const token = bearerToken || headerToken;

      if (token !== requiredToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    }

    res.setHeader("Content-Type", getMetricsContentType());
    res.send(await renderMetrics());
  });

  app.get("/api/mcp/tools", requireClassicAuth, function (req, res) {
    res.status(200).json({
      ok: true,
      tools: listMemoryTools(),
      requestId: req.requestId || "unknown",
    });
  });

  app.get("/api/v1/mcp/tools", requireClassicAuth, function (req, res) {
    res.status(200).json({
      ok: true,
      tools: listMemoryTools(),
      requestId: req.requestId || "unknown",
    });
  });

  app.post("/api/mcp/invoke", requireClassicAuth, async function (req, res) {
    const body = req.body || {};
    const name = body.name;
    const input = body.input || {};

    if (typeof name !== "string" || name.trim() === "") {
      res.status(400).json({
        ok: false,
        error: "name is required",
        requestId: req.requestId || "unknown",
      });
      return;
    }

    if (typeof input !== "object" || Array.isArray(input)) {
      res.status(400).json({
        ok: false,
        error: "input must be an object",
        requestId: req.requestId || "unknown",
      });
      return;
    }

    const result = await invokeMemoryTool(name, {
      ...input,
      userId: req.authUserId,
    });

    if (result && typeof result === "object" && "error" in result) {
      const errorResult = result as {
        code: "BAD_REQUEST" | "NOT_FOUND";
        error: string;
        details?: unknown;
      };
      const statusCode =
        errorResult.code === "NOT_FOUND" ? 404 : 400;

      res.status(statusCode).json({
        ok: false,
        error: errorResult.error,
        details: errorResult.details,
        requestId: req.requestId || "unknown",
      });
      return;
    }

    res.status(200).json({
      ok: true,
      name: name,
      result: result,
      requestId: req.requestId || "unknown",
    });
  });

  app.post("/api/v1/mcp/invoke", requireClassicAuth, async function (req, res) {
    const body = req.body || {};
    const name = body.name;
    const input = body.input || {};

    if (typeof name !== "string" || name.trim() === "") {
      res.status(400).json({
        ok: false,
        error: "name is required",
        requestId: req.requestId || "unknown",
      });
      return;
    }

    if (typeof input !== "object" || Array.isArray(input)) {
      res.status(400).json({
        ok: false,
        error: "input must be an object",
        requestId: req.requestId || "unknown",
      });
      return;
    }

    const result = await invokeMemoryTool(name, {
      ...input,
      userId: req.authUserId,
    });

    if (result && typeof result === "object" && "error" in result) {
      const errorResult = result as {
        code: "BAD_REQUEST" | "NOT_FOUND";
        error: string;
        details?: unknown;
      };
      const statusCode =
        errorResult.code === "NOT_FOUND" ? 404 : 400;

      res.status(statusCode).json({
        ok: false,
        error: errorResult.error,
        details: errorResult.details,
        requestId: req.requestId || "unknown",
      });
      return;
    }

    res.status(200).json({
      ok: true,
      name: name,
      result: result,
      requestId: req.requestId || "unknown",
    });
  });

  app.use(function (req, res) {
    res.status(404).json({
      ok: false,
      error: "Route not found",
      requestId: req.requestId || "unknown",
    });
  });

  app.use(classicErrorHandler);

  return app;
}
