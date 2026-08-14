import { createHash } from "crypto";
import { prisma } from "../storage/prismaClient";
import type { EpochAiProvider, EpochAiResponse } from "./aiRuntime";

export type EpochAiExecutionCacheInput = {
  workspaceId: string;
  provider: EpochAiProvider;
  model: string;
  prompt: string;
  maxOutputTokens: number;
  requireJson: boolean;
  reasoning: boolean;
};

export function buildEpochAiExecutionCacheKey(input: Omit<EpochAiExecutionCacheInput, "workspaceId">): string {
  return createHash("sha256").update(JSON.stringify({
    provider: input.provider,
    model: input.model,
    prompt: input.prompt,
    maxOutputTokens: input.maxOutputTokens,
    requireJson: input.requireJson,
    reasoning: input.reasoning,
  })).digest("hex");
}

export async function getEpochAiExecutionCache(input: EpochAiExecutionCacheInput): Promise<{ response: EpochAiResponse; hitCount: number } | null> {
  const cacheKey = buildEpochAiExecutionCacheKey(input);
  const entry = await prisma.epochAiExecutionCache.findFirst({ where: { workspaceId: input.workspaceId, cacheKey } });
  if (!entry) return null;
  if (entry.expiresAt <= new Date()) {
    await prisma.epochAiExecutionCache.delete({ where: { id: entry.id } }).catch(() => undefined);
    return null;
  }
  const nextHitCount = entry.hitCount + 1;
  await prisma.epochAiExecutionCache.update({ where: { id: entry.id }, data: { hitCount: nextHitCount, lastHitAt: new Date() } });
  return {
    response: {
      output: entry.response,
      structured: Boolean((entry.provenance as { structured?: unknown }).structured),
      evidence: {
        provider: entry.provider as EpochAiProvider,
        model: entry.model,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        estimatedCostCents: 0,
        pricingVersion: "epoch.ai.cache.v1",
        latencyMs: 0,
      },
    },
    hitCount: nextHitCount,
  };
}

export async function putEpochAiExecutionCache(input: EpochAiExecutionCacheInput & { response: EpochAiResponse; ttlSeconds: number; privacy: "public" | "tenant" | "private" }): Promise<void> {
  const cacheKey = buildEpochAiExecutionCacheKey(input);
  await prisma.epochAiExecutionCache.upsert({
    where: { workspaceId_cacheKey: { workspaceId: input.workspaceId, cacheKey } },
    create: {
      workspaceId: input.workspaceId,
      cacheKey,
      provider: input.provider,
      model: input.model,
      privacy: input.privacy,
      response: input.response.output,
      inputTokens: input.response.evidence.inputTokens,
      outputTokens: input.response.evidence.outputTokens,
      provenance: { structured: input.response.structured, pricingVersion: input.response.evidence.pricingVersion },
      expiresAt: new Date(Date.now() + input.ttlSeconds * 1000),
    },
    update: {
      provider: input.provider,
      model: input.model,
      privacy: input.privacy,
      response: input.response.output,
      inputTokens: input.response.evidence.inputTokens,
      outputTokens: input.response.evidence.outputTokens,
      provenance: { structured: input.response.structured, pricingVersion: input.response.evidence.pricingVersion },
      expiresAt: new Date(Date.now() + input.ttlSeconds * 1000),
    },
  });
}

export async function invalidateEpochAiExecutionCache(input: { workspaceId: string; provider?: EpochAiProvider; model?: string }): Promise<number> {
  const result = await prisma.epochAiExecutionCache.deleteMany({
    where: { workspaceId: input.workspaceId, ...(input.provider ? { provider: input.provider } : {}), ...(input.model ? { model: input.model } : {}) },
  });
  return result.count;
}
