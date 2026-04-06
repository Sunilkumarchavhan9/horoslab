import { ensureMemoryStoreIntegrity } from "../lib/memory/startupIntegrity";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";
import { rateLimitMemoryApi } from "./middleware/rateLimit";
import { requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { setApiVersionHeaders } from "./middleware/apiVersion";
import { healthRouter } from "./routes/health.routes";
import { memoryRouter } from "./routes/memory.routes";
import { getMetricsContentType, observeHttpMetrics, renderMetrics } from "./observability/metrics";

export function createMemoryOsApp() {
  ensureMemoryStoreIntegrity();
  const app = express();

  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(observeHttpMetrics);
  app.use("/api/health", healthRouter);
  app.use("/api/v1/health", healthRouter);

  app.get("/api/metrics", async (req, res) => {
    const requiredToken = process.env.METRICS_TOKEN;
    if (requiredToken) {
      const authHeader = req.header("authorization");
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;
      const headerToken = req.header("x-metrics-token");
      const token = bearerToken ?? headerToken;

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

  app.all("/{*splat}", notFoundHandler);
  app.use(errorHandler);

  return app;
}
