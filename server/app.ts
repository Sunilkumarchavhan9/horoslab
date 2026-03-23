import { ensureMemoryStoreIntegrity } from "../lib/memory/startupIntegrity";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";
import { rateLimitMemoryApi } from "./middleware/rateLimit";
import { requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { healthRouter } from "./routes/health.routes";
import { memoryRouter } from "./routes/memory.routes";

export function createMemoryOsApp() {
  ensureMemoryStoreIntegrity();
  const app = express();

  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use("/api/health", healthRouter);
  app.use("/api/memory", requireAuth, rateLimitMemoryApi, memoryRouter);

  app.all("/{*splat}", notFoundHandler);
  app.use(errorHandler);

  return app;
}
