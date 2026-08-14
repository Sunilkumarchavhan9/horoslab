import { Router, type Request } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { buildApiMeta, sendApiSuccess } from "./api-response";
import { prisma } from "../../lib/storage/prismaClient";
import { listEpochAiModels } from "../../lib/epoch/aiRuntime";

export const epochAiExecutionRouter = Router();

epochAiExecutionRouter.get("/providers", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const providers = await prisma.modelProvider.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  sendApiSuccess(res, 200, providers, buildApiMeta(req, startedAt));
}));

epochAiExecutionRouter.get("/models", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const models = listEpochAiModels().map((model) => ({
    id: `${model.provider}:${model.model}`,
    name: model.model,
    provider: model.provider,
    contextWindow: model.contextWindow,
    capabilities: model.capabilities,
    status: "catalogued",
  }));
  sendApiSuccess(res, 200, models, buildApiMeta(req, startedAt));
}));

epochAiExecutionRouter.get("/workers", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const workers = await prisma.epochWorker.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  sendApiSuccess(res, 200, workers, buildApiMeta(req, startedAt));
}));

epochAiExecutionRouter.get("/routing", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const routingCache = await prisma.epochAiExecutionCache.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  sendApiSuccess(res, 200, routingCache, buildApiMeta(req, startedAt));
}));

epochAiExecutionRouter.get("/gpu", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const workers = await prisma.epochWorker.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  const gpuWorkers = workers.filter((worker) => {
    const metadata = worker.metadata && typeof worker.metadata === "object" && !Array.isArray(worker.metadata) ? worker.metadata as Record<string, unknown> : {};
    return worker.kind.includes("gpu") || typeof metadata.gpu === "object" || typeof metadata.gpuModel === "string";
  });
  sendApiSuccess(res, 200, gpuWorkers.map((worker) => ({
    id: worker.id,
    workerId: worker.id,
    name: worker.name,
    status: worker.status,
    metadata: worker.metadata,
    updatedAt: worker.updatedAt,
  })), buildApiMeta(req, startedAt));
}));

epochAiExecutionRouter.get("/health", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const healthStore = prisma as unknown as {
    epochAiProviderHealthCheck?: {
      findMany: (input: { orderBy: { checkedAt: "desc" }; take: number }) => Promise<unknown[]>;
    };
  };
  const healthChecks = healthStore.epochAiProviderHealthCheck
    ? await healthStore.epochAiProviderHealthCheck.findMany({
    orderBy: { checkedAt: "desc" },
    take: 50,
    })
    : [];
  sendApiSuccess(res, 200, healthChecks, buildApiMeta(req, startedAt));
}));

epochAiExecutionRouter.get("/costs", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const costs = await prisma.modelUsageEvent.findMany({
    include: { provider: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  sendApiSuccess(res, 200, costs, buildApiMeta(req, startedAt));
}));

epochAiExecutionRouter.get("/failovers", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const failovers = await prisma.epochFailureSignal.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  sendApiSuccess(res, 200, failovers, buildApiMeta(req, startedAt));
}));

epochAiExecutionRouter.get("/capabilities", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const capabilities = listEpochAiModels().map((model) => ({
    id: `${model.provider}:${model.model}`,
    provider: model.provider,
    model: model.model,
    capabilities: model.capabilities,
    contextSize: model.contextWindow,
  }));
  sendApiSuccess(res, 200, capabilities, buildApiMeta(req, startedAt));
}));
