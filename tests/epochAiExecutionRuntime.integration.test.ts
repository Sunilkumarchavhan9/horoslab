import "dotenv/config";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/storage/prismaClient";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

const app = createMemoryOsApp();

describe("AI Execution Runtime API", () => {
  let workspaceId = "";

  afterEach(async () => {
    if (workspaceId) {
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => undefined);
      workspaceId = "";
    }
  });

  it("routes a mission to a registered private AI worker by policy", async () => {
    const userId = `u_ai_execution_${Date.now()}`;
    const token = await makeToken(userId);
    const workspace = await prisma.workspace.create({
      data: { userId, ownerId: userId, name: "AI Execution Runtime API", plan: "Free", region: "us" },
    });
    workspaceId = workspace.id;

    const workerResponse = await request(app)
      .post(`/api/epoch/workspaces/${workspaceId}/ai-execution/workers`)
      .set("authorization", `Bearer ${token}`)
      .send({
        kind: "ai_agent",
        name: "Private GPU Worker",
        capabilities: ["vision", "tools", "structured_output"],
        metadata: { provider: "ollama", model: "llama-vision", privacy: "private", region: "local", costPer1kTokens: 0, latencyMs: 250, reliability: 0.96 },
    });
    expect(workerResponse.status).toBe(201);

    const telemetryResponse = await request(app)
      .post(`/api/epoch/workspaces/${workspaceId}/ai-execution/workers/${workerResponse.body.data.worker.id}/telemetry`)
      .set("authorization", `Bearer ${token}`)
      .send({ gpuUtilizationPct: 92, vramUsedMb: 23_500, vramTotalMb: 24_000, temperatureC: 94, throughputTokensPerSecond: 48, queueDepth: 12, loadedModels: ["llama-vision"] });
    expect(telemetryResponse.status).toBe(202);

    const telemetryReadResponse = await request(app)
      .get(`/api/epoch/workspaces/${workspaceId}/ai-execution/workers/${workerResponse.body.data.worker.id}/telemetry`)
      .set("authorization", `Bearer ${token}`);
    expect(telemetryReadResponse.status).toBe(200);
    expect(telemetryReadResponse.body.data.telemetry.temperatureC).toBe(94);

    const routeResponse = await request(app)
      .post(`/api/epoch/workspaces/${workspaceId}/ai-execution/route`)
      .set("authorization", `Bearer ${token}`)
      .send({ requiredCapabilities: ["vision"], allowedPrivacy: ["private"], minimumReliability: 0.9 });

    expect(routeResponse.status).toBe(200);
    expect(routeResponse.body.data.route.selected.id).toBe(workerResponse.body.data.worker.id);
    expect(routeResponse.body.data.route.selected.privacy).toBe("private");

    await prisma.modelUsageEvent.createMany({
      data: [
        { workspaceId, providerId: null, taskType: "mission", inputTokens: 100, outputTokens: 40, estimatedCost: 0.02, latencyMs: 250, success: true },
        { workspaceId, providerId: null, taskType: "mission", inputTokens: 80, outputTokens: 20, estimatedCost: 0.01, latencyMs: 500, success: false, error: "timeout" },
      ],
    });

    const workersResponse = await request(app)
      .get(`/api/epoch/workspaces/${workspaceId}/ai-execution/workers`)
      .set("authorization", `Bearer ${token}`);
    expect(workersResponse.status).toBe(200);
    expect(workersResponse.body.data.endpoints.some((endpoint: { id: string }) => endpoint.id === workerResponse.body.data.worker.id)).toBe(true);

    const healthResponse = await request(app)
      .get(`/api/epoch/workspaces/${workspaceId}/ai-execution/health`)
      .set("authorization", `Bearer ${token}`);
    expect(healthResponse.status).toBe(200);
    expect(healthResponse.body.data.summary.total).toBeGreaterThan(0);
    const workerHealth = healthResponse.body.data.health.find((item: { endpointId: string }) => item.endpointId === workerResponse.body.data.worker.id);
    expect(workerHealth.status).toBe("degraded");
    expect(workerHealth.telemetry.gpuUtilizationPct).toBe(92);

    const historyResponse = await request(app)
      .get(`/api/epoch/workspaces/${workspaceId}/ai-execution/history?limit=1`)
      .set("authorization", `Bearer ${token}`);
    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.data.executions).toHaveLength(1);

    const costsResponse = await request(app)
      .get(`/api/epoch/workspaces/${workspaceId}/ai-execution/costs`)
      .set("authorization", `Bearer ${token}`);
    expect(costsResponse.status).toBe(200);
    expect(costsResponse.body.data.totalExecutions).toBe(2);
    expect(costsResponse.body.data.estimatedCost).toBeCloseTo(0.03);

    const rebalanceResponse = await request(app)
      .post(`/api/epoch/workspaces/${workspaceId}/ai-execution/rebalance`)
      .set("authorization", `Bearer ${token}`)
      .send({});
    expect(rebalanceResponse.status).toBe(200);
    expect(rebalanceResponse.body.data.dryRun).toBe(true);
  }, 30_000);

  it("streams correlated deltas and persists the execution usage record", async () => {
    const userId = `u_ai_stream_${Date.now()}`;
    const token = await makeToken(userId);
    const workspace = await prisma.workspace.create({
      data: { userId, ownerId: userId, name: "AI Stream Runtime API", plan: "Free", region: "us" },
    });
    workspaceId = workspace.id;
    const institution = await prisma.epochInstitution.create({ data: { workspaceId, userId, name: "Stream Institution", summary: "SSE test" } });
    const mission = await prisma.epochMission.create({ data: { workspaceId, institutionId: institution.id, userId, title: "Stream mission", objective: "Stream output", plan: ["execute"], state: "running" } });
    const execution = await prisma.epochExecutionRun.create({ data: { workspaceId, missionId: mission.id, userId, status: "running" } });
    const previousFetch = globalThis.fetch;
    const previousKey = process.env.EPOCH_OPENROUTER_AI_API_KEY;
    const previousEndpoint = process.env.EPOCH_OPENROUTER_AI_ENDPOINT;
    process.env.EPOCH_OPENROUTER_AI_API_KEY = "test-stream-key";
    process.env.EPOCH_OPENROUTER_AI_ENDPOINT = "https://stream.test/v1/chat/completions";
    globalThis.fetch = (async () => new Response(
      'data: {"choices":[{"delta":{"content":"hello"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n' +
      "data: [DONE]\n\n",
      { status: 200, headers: { "content-type": "text/event-stream" } },
    )) as typeof fetch;
    try {
      const response = await request(app)
        .post(`/api/epoch/workspaces/${workspaceId}/ai-execution/stream`)
        .set("authorization", `Bearer ${token}`)
        .send({ missionId: mission.id, executionId: execution.id, prompt: "Say hello", provider: "openrouter" });
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
      expect(response.text).toContain("event: delta");
      expect(response.text).toContain('"text":"hello"');
      expect(response.text).toContain("event: complete");
      const storedExecution = await prisma.epochExecutionRun.findUnique({ where: { id: execution.id } });
      expect(storedExecution?.logs).toEqual(expect.arrayContaining([expect.objectContaining({ type: "ai_stream_delta", index: 0 })]));
      const usage = await prisma.modelUsageEvent.findFirst({ where: { workspaceId, taskType: "epoch_ai_stream" } });
      expect(usage).toMatchObject({ success: true, inputTokens: 3, outputTokens: 3 });
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.EPOCH_OPENROUTER_AI_API_KEY;
      else process.env.EPOCH_OPENROUTER_AI_API_KEY = previousKey;
      if (previousEndpoint === undefined) delete process.env.EPOCH_OPENROUTER_AI_ENDPOINT;
      else process.env.EPOCH_OPENROUTER_AI_ENDPOINT = previousEndpoint;
    }
  }, 30_000);

  it("keeps cache entries workspace-scoped and supports invalidation", async () => {
    const userId = `u_ai_cache_${Date.now()}`;
    const token = await makeToken(userId);
    const workspace = await prisma.workspace.create({ data: { userId, ownerId: userId, name: "AI Cache Runtime API", plan: "Free", region: "us" } });
    workspaceId = workspace.id;
    const previousFetch = globalThis.fetch;
    const previousKey = process.env.EPOCH_OPENROUTER_AI_API_KEY;
    const previousEndpoint = process.env.EPOCH_OPENROUTER_AI_ENDPOINT;
    process.env.EPOCH_OPENROUTER_AI_API_KEY = "test-cache-key";
    process.env.EPOCH_OPENROUTER_AI_ENDPOINT = "https://cache.test/v1/chat/completions";
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ choices: [{ message: { content: "cached answer" } }], usage: { prompt_tokens: 2, completion_tokens: 2 } }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    try {
      const blocked = await request(app).post(`/api/epoch/workspaces/${workspaceId}/ai-execution/execute`).set("authorization", `Bearer ${token}`).send({ prompt: "This request is over budget", preferredProvider: "openai", maxCostCents: 0 });
      expect(blocked.status).toBe(409);
      expect(blocked.body.error.code).toBe("AI_EXECUTION_BUDGET_EXCEEDED");
      const payload = { prompt: "Cache this answer", preferredProvider: "openrouter", cacheTtlSeconds: 60, cachePrivacy: "tenant" };
      const first = await request(app).post(`/api/epoch/workspaces/${workspaceId}/ai-execution/execute`).set("authorization", `Bearer ${token}`).send(payload);
      const second = await request(app).post(`/api/epoch/workspaces/${workspaceId}/ai-execution/execute`).set("authorization", `Bearer ${token}`).send(payload);
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(second.body.data.result.cacheHit).toBe(true);
      const cachedRow = await prisma.epochAiExecutionCache.findFirst({ where: { workspaceId } });
      expect(cachedRow?.hitCount).toBe(1);
      const invalidated = await request(app).delete(`/api/epoch/workspaces/${workspaceId}/ai-execution/cache?provider=openrouter`).set("authorization", `Bearer ${token}`);
      expect(invalidated.status).toBe(200);
      expect(invalidated.body.data.deleted).toBe(1);
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.EPOCH_OPENROUTER_AI_API_KEY;
      else process.env.EPOCH_OPENROUTER_AI_API_KEY = previousKey;
      if (previousEndpoint === undefined) delete process.env.EPOCH_OPENROUTER_AI_ENDPOINT;
      else process.env.EPOCH_OPENROUTER_AI_ENDPOINT = previousEndpoint;
    }
  }, 30_000);
});
