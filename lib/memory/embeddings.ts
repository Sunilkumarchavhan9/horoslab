import { createHash } from "crypto";

const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";
const OPENROUTER_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

const embeddingCache = new Map<string, number[]>();

export function isEmbeddingsEnabled(): boolean {
  if (process.env.MEMORYOS_EMBEDDINGS_ENABLED?.trim().toLowerCase() !== "true") {
    return false;
  }
  return resolveEmbeddingApiKey() !== null;
}

export function getEmbeddingModel(): string {
  return process.env.MEMORYOS_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}

function resolveEmbeddingApiKey(): string | null {
  const openRouter =
    process.env.PLATFORM_OPENROUTER_KEY?.trim() ??
    process.env.OPENROUTER_API_KEY?.trim();
  if (openRouter) {
    return openRouter;
  }

  const openAi = process.env.OPENAI_API_KEY?.trim();
  return openAi || null;
}

function resolveEmbeddingBaseUrl(apiKeySource: "openrouter" | "openai"): string {
  if (apiKeySource === "openrouter") {
    return (
      process.env.OPENROUTER_BASE_URL?.trim() || OPENROUTER_DEFAULT_BASE_URL
    ).replace(/\/+$/, "");
  }

  return (
    process.env.OPENAI_BASE_URL?.trim() || OPENAI_DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
}

function resolveApiKeySource(): "openrouter" | "openai" | null {
  const openRouter =
    process.env.PLATFORM_OPENROUTER_KEY?.trim() ??
    process.env.OPENROUTER_API_KEY?.trim();
  if (openRouter) {
    return "openrouter";
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return "openai";
  }

  return null;
}

function normalizeEmbeddingModel(model: string, apiKeySource: "openrouter" | "openai"): string {
  if (apiKeySource === "openrouter" && !model.includes("/")) {
    return `openai/${model}`;
  }
  return model;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  const raw = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  if (Number.isNaN(raw)) {
    return 0;
  }

  return Math.max(0, Math.min(1, (raw + 1) / 2));
}

export function computeHybridScore(input: {
  lexicalScore: number;
  vectorScore?: number;
  vectorWeight?: number;
}): number {
  const lexical = clampScore(input.lexicalScore);
  const vectorWeight = input.vectorWeight ?? 0.6;

  if (typeof input.vectorScore !== "number" || Number.isNaN(input.vectorScore)) {
    return lexical;
  }

  const vector = clampScore(input.vectorScore);
  return clampScore(vectorWeight * vector + (1 - vectorWeight) * lexical);
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) {
    return 0.5;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

async function requestEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKeySource = resolveApiKeySource();
  const apiKey = resolveEmbeddingApiKey();

  if (!apiKey || !apiKeySource) {
    throw new Error("Embedding API key is not configured");
  }

  const model = normalizeEmbeddingModel(getEmbeddingModel(), apiKeySource);
  const baseUrl = resolveEmbeddingBaseUrl(apiKeySource);

  const headers: Record<string, string> = {
    "content-type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (apiKeySource === "openrouter") {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000";
    headers["X-Title"] =
      process.env.OPENROUTER_APP_TITLE ?? "MemoryOS Living Memory Demo";
  }

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Embedding request failed with ${response.status}: ${errorText || response.statusText}`,
    );
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[]; index?: number }>;
  };

  const rows = payload.data ?? [];
  const ordered = new Array<number[]>(texts.length);

  for (const row of rows) {
    if (!Array.isArray(row.embedding)) {
      continue;
    }
    const index = typeof row.index === "number" ? row.index : ordered.findIndex((item) => item === undefined);
    if (index >= 0 && index < ordered.length) {
      ordered[index] = row.embedding;
    }
  }

  if (ordered.some((item) => !Array.isArray(item) || item.length === 0)) {
    throw new Error("Embedding response missing vectors");
  }

  return ordered;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  if (!isEmbeddingsEnabled()) {
    throw new Error("Embeddings are disabled or API key is missing");
  }

  const results: number[][] = new Array(texts.length);
  const uncached: Array<{ index: number; text: string; cacheKey: string }> = [];

  for (let index = 0; index < texts.length; index += 1) {
    const text = texts[index]?.trim();
    if (!text) {
      results[index] = [];
      continue;
    }

    const cacheKey = `${getEmbeddingModel()}::${hashText(text)}`;
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
      results[index] = cached;
    } else {
      uncached.push({ index, text, cacheKey });
    }
  }

  if (uncached.length > 0) {
    const fetched = await requestEmbeddings(uncached.map((item) => item.text));
    for (let i = 0; i < uncached.length; i += 1) {
      const { index, cacheKey } = uncached[i];
      const vector = fetched[i] ?? [];
      results[index] = vector;
      if (vector.length > 0) {
        embeddingCache.set(cacheKey, vector);
      }
    }
  }

  return results;
}

export async function embedText(text: string): Promise<number[] | null> {
  if (!isEmbeddingsEnabled()) {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const [vector] = await embedTexts([trimmed]);
  return vector?.length ? vector : null;
}

export function __resetEmbeddingCacheForTests(): void {
  embeddingCache.clear();
}
