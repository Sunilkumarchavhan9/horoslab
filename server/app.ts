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
      const authHeader: string | undefined = req.header("authorization");
      const bearerToken: string | undefined = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;
      const headerToken: string | undefined = req.header("x-metrics-token");
      const token: string | undefined = bearerToken ?? headerToken;

      if (token !== requiredToken) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    }

    res.setHeader("Content-Type", getMetricsContentType());
    res.send(await renderMetrics());
  });

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

  app.all("/{*splat}", notFoundHandler);
  app.use(errorHandler);

  return app;
}
