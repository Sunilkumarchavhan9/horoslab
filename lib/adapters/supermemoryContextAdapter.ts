import { createHash } from "crypto";
import type { ContextAdapter, ContextSearchResult, ContinuityScope } from "./adapters";

type PrimitiveMetadataValue = string | number | boolean;

type SupermemoryDocumentRequest = {
  content: string;
  containerTag?: string;
  customId?: string;
  metadata?: Record<string, PrimitiveMetadataValue>;
};

type SupermemoryDocumentResponse = {
  id?: string;
  status?: string;
};

type SupermemorySearchRequest = {
  q: string;
  limit: number;
  containerTag?: string;
  searchMode?: "hybrid" | "memories";
  rerank?: boolean;
  rewriteQuery?: boolean;
};

type SupermemorySearchChunk = {
  id?: string;
  content?: string;
  text?: string;
  chunk?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

type SupermemorySearchResultItem = {
  id?: string;
  documentId?: string;
  score?: number;
  memory?: string;
  chunk?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  chunks?: SupermemorySearchChunk[];
};

type SupermemorySearchResponse = {
  results?: SupermemorySearchResultItem[];
};

export interface SupermemoryContextClient {
  addDocument(input: SupermemoryDocumentRequest): Promise<SupermemoryDocumentResponse>;
  search(input: SupermemorySearchRequest): Promise<SupermemorySearchResponse>;
}

type SupermemoryContextAdapterOptions = {
  apiKey?: string;
  apiOrigin?: string;
  namespace?: string;
  client?: SupermemoryContextClient;
};

function sanitizeTagPart(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");

  return normalized.length > 0 ? normalized.slice(0, 32) : "default";
}

function stringifyPayload(payload: unknown): string {
  if (typeof payload === "string") {
    return payload.trim();
  }

  if (payload === null || payload === undefined) {
    return "";
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function pickPrimitiveMetadata(
  payload: unknown,
): Record<string, PrimitiveMetadataValue> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const metadata: Record<string, PrimitiveMetadataValue> = {};

  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    const normalizedKey = key
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[^a-zA-Z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();

    if (!normalizedKey) {
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      metadata[normalizedKey] = value;
    }
  }

  return metadata;
}

function buildCustomId(input: {
  userId: string;
  source: string;
  serializedPayload: string;
} & ContinuityScope): string {
  const parts = [
    "ctx",
    sanitizeTagPart(input.userId),
    sanitizeTagPart(input.source),
    sanitizeTagPart(input.workspace ?? "default"),
    sanitizeTagPart(input.project ?? "default"),
    sanitizeTagPart(input.threadId ?? "default"),
  ];

  const fingerprint = createHash("sha1")
    .update(input.serializedPayload)
    .digest("hex")
    .slice(0, 12);

  return [...parts, fingerprint].join("_").slice(0, 100);
}

function matchesScope(
  metadata: Record<string, unknown> | undefined,
  scope: ContinuityScope,
): boolean {
  if (!metadata) {
    return !scope.workspace && !scope.project && !scope.threadId;
  }

  const workspace =
    typeof metadata.workspace === "string" ? metadata.workspace : undefined;
  const project =
    typeof metadata.project === "string" ? metadata.project : undefined;
  const threadId =
    typeof metadata.thread_id === "string"
      ? metadata.thread_id
      : typeof metadata.threadId === "string"
        ? metadata.threadId
        : undefined;

  if (scope.workspace && workspace !== scope.workspace) {
    return false;
  }

  if (scope.project && project !== scope.project) {
    return false;
  }

  if (scope.threadId && threadId !== scope.threadId) {
    return false;
  }

  return true;
}

function pickTopLevelContent(item: SupermemorySearchResultItem): string | undefined {
  if (typeof item.memory === "string" && item.memory.trim().length > 0) {
    return item.memory;
  }

  if (typeof item.chunk === "string" && item.chunk.trim().length > 0) {
    return item.chunk;
  }

  if (typeof item.content === "string" && item.content.trim().length > 0) {
    return item.content;
  }

  const data = item.data;
  if (!data || typeof data !== "object") {
    return undefined;
  }

  for (const key of ["memory", "chunk", "content", "text"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function toContextSearchResult(
  item: SupermemorySearchResultItem,
): ContextSearchResult | null {
  const chunkContent =
    item.chunks?.find(
      (chunk) =>
        (typeof chunk.content === "string" && chunk.content.trim().length > 0) ||
        (typeof chunk.text === "string" && chunk.text.trim().length > 0) ||
        (typeof chunk.chunk === "string" && chunk.chunk.trim().length > 0),
    ) ?? null;

  const content =
    (chunkContent && (
      chunkContent.content ?? chunkContent.text ?? chunkContent.chunk
    )) ||
    pickTopLevelContent(item);

  if (!content || content.trim().length === 0) {
    return null;
  }

  const metadata: Record<string, unknown> = {
    ...(item.metadata ?? {}),
  };

  if (item.updatedAt && metadata.updatedAt === undefined) {
    metadata.updatedAt = item.updatedAt;
  }

  if (item.createdAt && metadata.createdAt === undefined) {
    metadata.createdAt = item.createdAt;
  }

  if (chunkContent?.metadata && typeof chunkContent.metadata === "object") {
    Object.assign(metadata, chunkContent.metadata);
  }

  return {
    id: item.documentId ?? item.id ?? `ctx-${createHash("sha1").update(content).digest("hex").slice(0, 12)}`,
    score: chunkContent?.score ?? item.score,
    content,
    metadata,
    source:
      typeof metadata.source === "string"
        ? metadata.source
        : "supermemory",
  };
}

class FetchSupermemoryContextClient implements SupermemoryContextClient {
  constructor(
    private readonly apiKey: string,
    private readonly apiOrigin: string,
  ) {}

  private async request<T>(
    path: string,
    body: Record<string, unknown>,
    action: string,
  ): Promise<T> {
    const response = await fetch(`${this.apiOrigin}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Supermemory ${action} failed with ${response.status}: ${errorText || response.statusText}`,
      );
    }

    return (await response.json()) as T;
  }

  async addDocument(
    input: SupermemoryDocumentRequest,
  ): Promise<SupermemoryDocumentResponse> {
    return this.request<SupermemoryDocumentResponse>(
      "/v3/documents",
      input,
      "add document",
    );
  }

  async search(
    input: SupermemorySearchRequest,
  ): Promise<SupermemorySearchResponse> {
    return this.request<SupermemorySearchResponse>(
      "/v4/search",
      input,
      "search",
    );
  }
}

export class SupermemoryContextAdapter implements ContextAdapter {
  private readonly client: SupermemoryContextClient;

  private readonly namespace?: string;
  private disabled = false;

  constructor(options: SupermemoryContextAdapterOptions = {}) {
    if (options.client) {
      this.client = options.client;
    } else {
      if (!options.apiKey) {
        throw new Error("SupermemoryContextAdapter requires apiKey or client");
      }

      this.client = new FetchSupermemoryContextClient(
        options.apiKey,
        (options.apiOrigin ?? "https://api.supermemory.ai").replace(/\/+$/, ""),
      );
    }

    this.namespace = options.namespace;
  }

  private buildContainerTag(userId: string): string {
    const parts = ["memoryos", "ctx"];

    if (this.namespace) {
      parts.push(sanitizeTagPart(this.namespace));
    }

    parts.push(sanitizeTagPart(userId));

    return parts.join(":").slice(0, 100);
  }

  async ingestContext(
    input: {
      userId: string;
      source: string;
      payload: unknown;
    } & ContinuityScope,
  ): Promise<void> {
    if (this.disabled) {
      return;
    }
    const serializedPayload = stringifyPayload(input.payload);

    if (!serializedPayload) {
      throw new Error("Supermemory context ingest requires non-empty payload");
    }

    try {
      await this.client.addDocument({
        content: serializedPayload,
        containerTag: this.buildContainerTag(input.userId),
        customId: buildCustomId({
          userId: input.userId,
          source: input.source,
          serializedPayload,
          workspace: input.workspace,
          project: input.project,
          threadId: input.threadId,
        }),
        metadata: {
          user_id: input.userId,
          source: input.source,
          payload_kind: typeof input.payload === "string" ? "text" : "json",
          ...(input.workspace ? { workspace: input.workspace } : {}),
          ...(input.project ? { project: input.project } : {}),
          ...(input.threadId ? { thread_id: input.threadId } : {}),
          ...pickPrimitiveMetadata(input.payload),
        },
      });
    } catch (error) {
      if (this.shouldDisable(error)) {
        this.disabled = true;
        console.warn(
          "[context.supermemory] disabling adapter after unauthorized response",
        );
        return;
      }
      throw error;
    }
  }

  async searchContext(
    input: {
      userId: string;
      query: string;
      topK?: number;
    } & ContinuityScope,
  ): Promise<ContextSearchResult[]> {
    if (this.disabled) {
      return [];
    }
    let response: SupermemorySearchResponse;
    try {
      response = await this.client.search({
        q: input.query,
        limit: input.topK ?? 10,
        containerTag: this.buildContainerTag(input.userId),
        searchMode: "hybrid",
        rerank: true,
        rewriteQuery: false,
      });
    } catch (error) {
      if (this.shouldDisable(error)) {
        this.disabled = true;
        console.warn(
          "[context.supermemory] disabling adapter after unauthorized response",
        );
        return [];
      }
      throw error;
    }

    const scopedResults = (response.results ?? [])
      .map((item) => toContextSearchResult(item))
      .filter((item): item is ContextSearchResult => item !== null)
      .filter((item) => matchesScope(item.metadata, input));

    return scopedResults.slice(0, input.topK ?? 10);
  }

  private shouldDisable(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    return /401|unauthorized|invalid api key|forbidden/i.test(error.message);
  }
}
