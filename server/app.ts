import { ensureMemoryStoreIntegrity } from "../lib/memory/startupIntegrity";
import express, { type Express, type Request, type Response } from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";
import { corsMiddleware } from "./middleware/cors";
import { rateLimitMemoryApi } from "./middleware/rateLimit";
import { requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { setApiVersionHeaders } from "./middleware/apiVersion";
import { healthRouter } from "./routes/health.routes";
import { mcpRouter } from "./routes/mcp.routes";
import { memoryRouter } from "./routes/memory.routes";
import { connectorRouter } from "./routes/connector.routes";
import { benchmarkRouter } from "./routes/benchmark.routes";
import { memoryDoctorRouter } from "./routes/memoryDoctor.routes";
import { preflightRouter } from "./routes/preflight.routes";
import { agentRouter } from "./routes/agent.routes";
import { agentSessionRouter } from "./routes/agent-session.routes";
import { getMetricsContentType, observeHttpMetrics, renderMetrics } from "./observability/metrics";

export function createMemoryOsApp(): Express {
  ensureMemoryStoreIntegrity();
  const app: Express = express();

  app.use(corsMiddleware);
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(observeHttpMetrics);
  app.use("/api/health", healthRouter);
  app.use("/api/v1/health", healthRouter);

  app.get("/api/metrics", async (req: Request, res: Response): Promise<void> => {
    const requiredToken: string | undefined = process.env.METRICS_TOKEN;
    if (requiredToken) {
      const authHeader: string | undefined = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${requiredToken}`) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    }

    try {
      res.setHeader("Content-Type", getMetricsContentType());
      const metrics: string = await renderMetrics();
      res.send(metrics);
    } catch (err) {
      console.error("[Metrics] Failed to render:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.use(
    "/api/connector",
    setApiVersionHeaders,
    connectorRouter,
  );
  app.use(
    "/api/benchmarks",
    setApiVersionHeaders,
    requireAuth,
    benchmarkRouter,
  );
  // Backward-compatible singular alias for older clients.
  app.use(
    "/api/benchmark",
    setApiVersionHeaders,
    requireAuth,
    benchmarkRouter,
  );
  // IMPORTANT: mount the more-specific `/api/memory/doctor` router BEFORE the
  // catch-all `/api/memory` router. Express matches in registration order, and
  // because `/api/memory` is a prefix of `/api/memory/doctor`, registering the
  // generic router first causes the doctor routes to fall through to the
  // notFoundHandler (404). See tests/memoryDoctorRoutes.contract.test.ts.
  app.use(
    "/api/memory/doctor",
    setApiVersionHeaders,
    requireAuth,
    memoryDoctorRouter,
  );
  app.use(
    "/api/memory",
    setApiVersionHeaders,
    requireAuth,
    rateLimitMemoryApi,
    memoryRouter,
  );
  app.use(
    "/api/v1/memory",
    setApiVersionHeaders,
    requireAuth,
    rateLimitMemoryApi,
    memoryRouter,
  );
  app.use(
    "/api/mcp",
    setApiVersionHeaders,
    requireAuth,
    rateLimitMemoryApi,
    mcpRouter,
  );
  app.use(
    "/api/v1/mcp",
    setApiVersionHeaders,
    requireAuth,
    rateLimitMemoryApi,
    mcpRouter,
  );
  app.use(
    "/api/preflight",
    setApiVersionHeaders,
    requireAuth,
    preflightRouter,
  );
  app.use(
    "/api/agents",
    setApiVersionHeaders,
    requireAuth,
    agentRouter,
  );
  app.use(
    "/api/agent-sessions",
    setApiVersionHeaders,
    requireAuth,
    agentSessionRouter,
  );

  // Catch-all 404 handler for API routes
  app.all("/{*splat}", notFoundHandler);
  app.use(errorHandler);

  return app;
}
