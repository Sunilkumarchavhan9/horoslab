import { ensureMemoryStoreIntegrity } from "../lib/memory/startupIntegrity";
import express, { type Express, type Request, type Response } from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";
import { corsMiddleware } from "./middleware/cors";
import {
  rateLimitMemoryApi,
  rateLimitModerateApi,
  rateLimitStrictApi,
} from "./middleware/rateLimit";
import { requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { auditMutationMiddleware } from "./middleware/auditLog";
import { setApiVersionHeaders } from "./middleware/apiVersion";
import { healthRouter } from "./routes/health.routes";
import { epochRuntimeRouter } from "./routes/epoch-runtime.routes";
import { mcpRouter } from "./routes/mcp.routes";
import { memoryRouter } from "./routes/memory.routes";
import { connectorRouter } from "./routes/connector.routes";
import { benchmarkRouter } from "./routes/benchmark.routes";
import { memoryDoctorRouter } from "./routes/memoryDoctor.routes";
import { preflightRouter } from "./routes/preflight.routes";
import { agentRouter } from "./routes/agent.routes";
import { agentSessionRouter } from "./routes/agent-session.routes";
import { productAgentRouter } from "./routes/product-agent.routes";
import { companyBrainRouter } from "./routes/companyBrain.routes";
import { runtimeRouter } from "./routes/runtime.routes";
import { epochRouter } from "./routes/epoch.routes";
import { billingRouter } from "./routes/billing.routes";
import { desktopProviderRouter } from "./routes/desktop-provider.routes";
import { desktopGatewayRouter } from "./routes/desktop-gateway.routes";
import { masterplanRouter } from "./routes/masterplan.routes";
import { overviewRouter } from "./routes/overview.routes";
import { experienceRouter } from "./routes/experience.routes";
import { futureInstructionsRouter } from "./routes/futureInstructions.routes";
import { mistakeImmunityRouter } from "./routes/mistakeImmunity.routes";
import { skillsRouter } from "./routes/skills.routes";
import { approvalsRouter, policiesRouter, policyCenterRouter, riskApprovalsRouter } from "./routes/riskApprovals.routes";
import { agentAccessRouter } from "./routes/agentAccess.routes";
import { eventsRouter } from "./routes/events.routes";
import { securityRouter } from "./routes/security.routes";
import { realityRouter } from "./routes/reality.routes";
import { epochSettlementRouter } from "./routes/epoch-settlement.routes";
import { epochAiExecutionRouter } from "./routes/epoch-ai-execution.routes";
import { epochCanonicalRouter } from "./routes/epoch-canonical.routes";
import { realityCompilerRouter } from "./routes/realityCompiler.routes";
import { sdkRouter } from "./routes/sdk.routes";
import {
  getMetricsContentType,
  observeHttpMetrics,
  renderMetrics,
} from "./observability/metrics";
import { bootstrapCompanyBrainRuntime } from "../lib/companyBrain/platform";
import { startConnectorAutoSyncScheduler } from "../lib/integrations/connectorAutoSyncScheduler";
import { startEngineeringSignalLiveWatcher } from "../lib/integrations/engineeringSignalLiveWatcher";

export function createMemoryOsApp(): Express {
  ensureMemoryStoreIntegrity();
  void bootstrapCompanyBrainRuntime(
    Number(process.env.COMPANY_BRAIN_SCHEDULER_INTERVAL_SECONDS ?? 300),
  )
    .then((bootstrapResult) => {
      console.log(
        `[CompanyBrain] Runtime bootstrap restored schedulers=${bootstrapResult.restoredSchedulers} users=${bootstrapResult.totalUsers}`,
      );
    })
    .catch((error) => {
      console.warn(
        "[CompanyBrain] Runtime bootstrap failed:",
        error instanceof Error ? error.message : error,
      );
    });
  const connectorAutoSync = startConnectorAutoSyncScheduler();
  console.log(
    `[ConnectorAutoSync] active=${connectorAutoSync.active} sweepSeconds=${connectorAutoSync.intervalSeconds}`,
  );
  const engineeringSignalLiveWatcher = startEngineeringSignalLiveWatcher();
  console.log(
    `[EngineeringSignalLiveWatch] active=${engineeringSignalLiveWatcher.active} intervalMs=${engineeringSignalLiveWatcher.intervalMs}`,
  );
  const app: Express = express();

  app.use(corsMiddleware);
  // GitHub signs the raw request body. Mount this before express.json() so
  // the intake route can verify the exact bytes delivered by GitHub.
  app.use("/api/reality-compiler", express.raw({ type: "application/json" }), realityCompilerRouter);
  app.use(express.json());
  app.use("/internal/desktop-provider", desktopProviderRouter);
  app.use("/desktop-gateway", desktopGatewayRouter);
  app.use("/api/billing", billingRouter);
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(auditMutationMiddleware);
  app.use(observeHttpMetrics);
  app.use("/api/health", healthRouter);
  app.use("/api/v1/health", healthRouter);

  app.get(
    "/api/metrics",
    async (req: Request, res: Response): Promise<void> => {
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
    },
  );

  app.use(
    "/api/connector",
    setApiVersionHeaders,
    (req, res, next) => {
      // OAuth providers redirect back here without our bearer token.
      // We authenticate callback integrity via signed `state` in the route handler.
      if (req.path === "/callback" || req.path.startsWith("/callback/")) {
        next();
        return;
      }
      void requireAuth(req, res, next);
    },
    rateLimitModerateApi,
    connectorRouter,
  );
  app.use(
    "/api/benchmarks",
    setApiVersionHeaders,
    requireAuth,
    rateLimitStrictApi,
    benchmarkRouter,
  );
  // Backward-compatible singular alias for older clients.
  app.use(
    "/api/benchmark",
    setApiVersionHeaders,
    requireAuth,
    rateLimitStrictApi,
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
    rateLimitStrictApi,
    preflightRouter,
  );
  app.use(
    "/api/company-brain",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    companyBrainRouter,
  );
  app.use(
    "/api/agents",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    agentRouter,
  );
  app.use(
    "/api/agent-sessions",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    agentSessionRouter,
  );
  app.use(
    "/api/agent",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    productAgentRouter,
  );
  app.use(
    "/api/runtime",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    runtimeRouter,
  );
  app.use(
    "/api/reality",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    realityRouter,
  );
  app.use(
    "/api/v1/epoch",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    epochCanonicalRouter,
  );
  app.use(
    "/api/v1/epoch",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    epochRouter,
  );
  app.use(
    "/api/epoch",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    epochRuntimeRouter,
    (req, res, next) => {
      res.setHeader("X-Epoch-Router", "legacy");
      res.setHeader("Deprecation", "true");
      res.setHeader("Sunset", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString());
      next();
    },
    epochRouter,
  );
  app.use(
    "/api/epoch/settlement",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    epochSettlementRouter,
  );
  app.use(
    "/api/epoch/ai-execution",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    epochAiExecutionRouter,
  );
  app.use(
    "/api/overview",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    overviewRouter,
  );
  app.use(
    "/api/experience",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    experienceRouter,
  );
  app.use(
    "/api/future-instructions",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    futureInstructionsRouter,
  );
  app.use(
    "/api/mistake-immunity",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    mistakeImmunityRouter,
  );
  app.use(
    "/api/skills",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    skillsRouter,
  );
  app.use(
    "/api/risk-approvals",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    riskApprovalsRouter,
  );
  app.use(
    "/api/approvals",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    approvalsRouter,
  );
  app.use(
    "/api/policies",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    policiesRouter,
  );
  app.use(
    "/api/policy-center",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    policyCenterRouter,
  );
  app.use(
    "/api/agent-access",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    agentAccessRouter,
  );
  app.use(
    "/api/sdk",
    setApiVersionHeaders,
    requireAuth,
    rateLimitMemoryApi,
    sdkRouter,
  );
  app.use(
    "/api/v1/sdk",
    setApiVersionHeaders,
    requireAuth,
    rateLimitMemoryApi,
    sdkRouter,
  );
  app.use(
    "/api/events",
    setApiVersionHeaders,
    requireAuth,
    eventsRouter,
  );
  app.use(
    "/api/security",
    setApiVersionHeaders,
    requireAuth,
    rateLimitStrictApi,
    securityRouter,
  );
  app.use(
    "/api",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    masterplanRouter,
  );
  app.use(
    "/api/v1/runtime",
    setApiVersionHeaders,
    requireAuth,
    rateLimitModerateApi,
    runtimeRouter,
  );

  // Catch-all 404 handler for API routes
  app.all("/{*splat}", notFoundHandler);
  app.use(errorHandler);

  return app;
}
