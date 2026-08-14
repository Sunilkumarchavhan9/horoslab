import { createHmac, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";

export type EpochWebhookEventInput = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  kind: string;
  label: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
};

export type EpochWebhookDeliveryRecord = {
  id: string;
  workspaceId: string;
  endpointId: string;
  eventType: string;
  eventId: string | null;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  requestBody: Record<string, unknown>;
  requestHeaders: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: Record<string, unknown> | null;
  errorMessage: string | null;
  nextRetryAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 8;

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function eventMatches(pattern: string, eventType: string): boolean {
  const trimmed = pattern.trim();
  if (!trimmed || trimmed === "*") return true;
  if (trimmed.endsWith("*")) return eventType.startsWith(trimmed.slice(0, -1));
  return trimmed === eventType;
}

function matchesAnyPattern(patterns: string[], eventType: string): boolean {
  return patterns.some((pattern) => eventMatches(pattern, eventType));
}

function signatureSecret(endpointSecret: string | null | undefined): string {
  const envSecret = process.env.EPOCH_WEBHOOK_SIGNING_SECRET?.trim();
  return endpointSecret?.trim() || envSecret || "";
}

function signPayload(rawBody: string, secret: string): string | null {
  if (!secret) return null;
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

function buildDeliveryId(): string {
  return `whd_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

type EpochWebhookDeliveryCursor = {
  createdAt: string;
  id: string;
};

function encodeEpochWebhookDeliveryCursor(cursor: EpochWebhookDeliveryCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeEpochWebhookDeliveryCursor(cursor: string | undefined): EpochWebhookDeliveryCursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { createdAt?: unknown }).createdAt === "string" &&
      typeof (parsed as { id?: unknown }).id === "string"
    ) {
      return {
        createdAt: (parsed as { createdAt: string }).createdAt,
        id: (parsed as { id: string }).id,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function mapDelivery(row: {
  id: string;
  workspaceId: string;
  endpointId: string;
  eventType: string;
  eventId: string | null;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  requestBody: Prisma.JsonValue;
  requestHeaders: Prisma.JsonValue;
  responseStatus: number | null;
  responseBody: Prisma.JsonValue | null;
  errorMessage: string | null;
  nextRetryAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): EpochWebhookDeliveryRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    endpointId: row.endpointId,
    eventType: row.eventType,
    eventId: row.eventId,
    status: row.status,
    attemptCount: row.attemptCount,
    maxAttempts: row.maxAttempts,
    requestBody: row.requestBody as Record<string, unknown>,
    requestHeaders: row.requestHeaders as Record<string, unknown>,
    responseStatus: row.responseStatus,
    responseBody: (row.responseBody as Record<string, unknown> | null) ?? null,
    errorMessage: row.errorMessage,
    nextRetryAt: row.nextRetryAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getEpochWebhookDelivery(input: {
  workspaceId: string;
  deliveryId: string;
}): Promise<EpochWebhookDeliveryRecord | null> {
  const row = await prisma.webhookDelivery.findFirst({
    where: { workspaceId: input.workspaceId, id: input.deliveryId },
  });
  return row ? mapDelivery(row) : null;
}

function sortDeliveriesDesc(deliveries: EpochWebhookDeliveryRecord[]): EpochWebhookDeliveryRecord[] {
  return [...deliveries].sort((a, b) => {
    const byCreatedAt = b.createdAt.localeCompare(a.createdAt);
    if (byCreatedAt !== 0) return byCreatedAt;
    return b.id.localeCompare(a.id);
  });
}

function buildEventId(input: EpochWebhookEventInput): string {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  return `epoch:${input.kind}:${input.workspaceId}:${input.subjectId ?? "workspace"}:${occurredAt}`;
}

function buildRequestBody(input: EpochWebhookEventInput, deliveryId: string, eventId: string): Record<string, unknown> {
  return {
    version: "epoch_webhook.v1",
    deliveryId,
    eventId,
    type: input.kind,
    workspaceId: input.workspaceId,
    orgId: input.orgId ?? null,
    subjectId: input.subjectId ?? null,
    label: input.label,
    payload: input.payload ?? {},
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}

function parseJsonBody(text: string): Record<string, unknown> {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : { body: text };
  } catch {
    return { body: text };
  }
}

function retryDelayMs(attemptCount: number): number {
  const attempt = Math.max(1, attemptCount);
  return Math.min(15 * 60 * 1000, 5_000 * 2 ** (attempt - 1));
}

async function deliverWebhookDelivery(delivery: {
  id: string;
  workspaceId: string;
  endpointId: string;
  eventType: string;
  eventId: string | null;
  requestBody: unknown;
  attemptCount: number;
  maxAttempts: number;
  endpoint: {
    id: string;
    workspaceId: string;
    url: string;
    secret: string | null;
    status: string;
  };
}): Promise<void> {
  const rawBody = JSON.stringify(delivery.requestBody ?? {});
  const secret = signatureSecret(delivery.endpoint.secret);
  const signature = signPayload(rawBody, secret);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "MemoryOS-Epoch/1.0",
    "X-Epoch-Delivery": delivery.id,
    "X-Epoch-Event": delivery.eventType,
    ...(delivery.eventId ? { "X-Epoch-Event-Id": delivery.eventId } : {}),
    "X-Epoch-Workspace": delivery.workspaceId,
  };
  if (signature) {
    headers["X-Epoch-Signature-256"] = `sha256=${signature}`;
  }

  const response = await fetch(delivery.endpoint.url, {
    method: "POST",
    headers,
    body: rawBody,
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  const responseText = await response.text();
  const responseBody = parseJsonBody(responseText);
  await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: "delivered",
      attemptCount: delivery.attemptCount + 1,
      responseStatus: response.status,
      responseBody: inputJson(responseBody),
      errorMessage: null,
      deliveredAt: new Date(),
      nextRetryAt: null,
    },
  });
}

export async function queueEpochWebhookDeliveries(input: EpochWebhookEventInput): Promise<number> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      workspaceId: input.workspaceId,
      status: "active",
    },
    orderBy: { updatedAt: "desc" },
  });
  const matching = endpoints.filter((endpoint) => matchesAnyPattern(safeStringArray(endpoint.events), input.kind));
  if (matching.length === 0) return 0;

  const createdAt = new Date();
  const eventId = buildEventId({ ...input, occurredAt: input.occurredAt ?? createdAt.toISOString() });
  const requestHeaders = {
    "Content-Type": "application/json",
    "User-Agent": "MemoryOS-Epoch/1.0",
    "X-Epoch-Event": input.kind,
    "X-Epoch-Event-Id": eventId,
    "X-Epoch-Workspace": input.workspaceId,
  };

  await Promise.all(
    matching.map((endpoint) => {
      const deliveryId = buildDeliveryId();
      return prisma.webhookDelivery.create({
        data: {
          id: deliveryId,
          workspaceId: input.workspaceId,
          endpointId: endpoint.id,
          eventType: input.kind,
          eventId,
          status: "pending",
          attemptCount: 0,
          maxAttempts: DEFAULT_MAX_ATTEMPTS,
          requestBody: inputJson(buildRequestBody(input, deliveryId, eventId)),
          requestHeaders: inputJson(requestHeaders),
          nextRetryAt: createdAt,
        },
      });
    }),
  );
  return matching.length;
}

export async function runEpochWebhookDeliveryTick(limit = 25): Promise<{ processed: number; delivered: number; failed: number }> {
  const dueDeliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["pending", "retrying"] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: { endpoint: true },
  });

  let delivered = 0;
  let failed = 0;
  for (const delivery of dueDeliveries) {
    if (delivery.endpoint.status !== "active") {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "dead_lettered",
          errorMessage: "Webhook endpoint is inactive.",
          nextRetryAt: null,
        },
      });
      failed += 1;
      continue;
    }

    try {
      await deliverWebhookDelivery({
        id: delivery.id,
        workspaceId: delivery.workspaceId,
        endpointId: delivery.endpointId,
        eventType: delivery.eventType,
        eventId: delivery.eventId,
        requestBody: delivery.requestBody,
        attemptCount: delivery.attemptCount,
        maxAttempts: delivery.maxAttempts,
        endpoint: {
          id: delivery.endpoint.id,
          workspaceId: delivery.endpoint.workspaceId,
          url: delivery.endpoint.url,
          secret: delivery.endpoint.secret,
          status: delivery.endpoint.status,
        },
      });
      delivered += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "webhook_delivery_failed";
      const nextAttempt = delivery.attemptCount + 1;
      const exhausted = nextAttempt >= delivery.maxAttempts;
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          attemptCount: nextAttempt,
          status: exhausted ? "dead_lettered" : "retrying",
          errorMessage: message,
          nextRetryAt: exhausted ? null : new Date(Date.now() + retryDelayMs(nextAttempt)),
        },
      });
      failed += 1;
    }
  }

  return { processed: dueDeliveries.length, delivered, failed };
}

export async function retryEpochWebhookDelivery(input: {
  workspaceId: string;
  deliveryId: string;
}): Promise<EpochWebhookDeliveryRecord | null> {
  const delivery = await prisma.webhookDelivery.findFirst({
    where: { id: input.deliveryId, workspaceId: input.workspaceId },
  });
  if (!delivery) return null;
  const updated = await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: "retrying",
      errorMessage: null,
      nextRetryAt: new Date(),
      deliveredAt: null,
    },
  });
  return {
    id: updated.id,
    workspaceId: updated.workspaceId,
    endpointId: updated.endpointId,
    eventType: updated.eventType,
    eventId: updated.eventId,
    status: updated.status,
    attemptCount: updated.attemptCount,
    maxAttempts: updated.maxAttempts,
    requestBody: updated.requestBody as Record<string, unknown>,
    requestHeaders: updated.requestHeaders as Record<string, unknown>,
    responseStatus: updated.responseStatus,
    responseBody: (updated.responseBody as Record<string, unknown> | null) ?? null,
    errorMessage: updated.errorMessage,
    nextRetryAt: updated.nextRetryAt?.toISOString() ?? null,
    deliveredAt: updated.deliveredAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function listEpochWebhookDeliveries(input: {
  workspaceId: string;
  endpointId?: string;
  limit?: number;
}): Promise<EpochWebhookDeliveryRecord[]> {
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.endpointId ? { endpointId: input.endpointId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(200, input.limit ?? 50)),
  });
  return rows.map((row) => mapDelivery(row));
}

export async function listEpochWebhookDeliveriesPage(input: {
  workspaceId: string;
  endpointId?: string;
  status?: "pending" | "retrying" | "delivered" | "dead_lettered";
  limit?: number;
  cursor?: string;
}): Promise<{
  deliveries: EpochWebhookDeliveryRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}> {
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 25)));
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.endpointId ? { endpointId: input.endpointId } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const deliveries = sortDeliveriesDesc(rows.map((row) => mapDelivery(row)));
  const cursor = decodeEpochWebhookDeliveryCursor(input.cursor);
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = deliveries.findIndex((delivery) => delivery.createdAt === cursor.createdAt && delivery.id === cursor.id);
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }

  const page = deliveries.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < deliveries.length;
  const nextCursor = hasMore && page.length > 0
    ? encodeEpochWebhookDeliveryCursor({
        createdAt: page[page.length - 1].createdAt,
        id: page[page.length - 1].id,
      })
    : null;

  return {
    deliveries: page,
    nextCursor,
    hasMore,
    total: deliveries.length,
  };
}

export async function getEpochWebhookDeliveryStats(workspaceId: string): Promise<{
  pending: number;
  retrying: number;
  delivered: number;
  deadLettered: number;
  total: number;
}> {
  const [pending, retrying, delivered, deadLettered, total] = await Promise.all([
    prisma.webhookDelivery.count({ where: { workspaceId, status: "pending" } }),
    prisma.webhookDelivery.count({ where: { workspaceId, status: "retrying" } }),
    prisma.webhookDelivery.count({ where: { workspaceId, status: "delivered" } }),
    prisma.webhookDelivery.count({ where: { workspaceId, status: "dead_lettered" } }),
    prisma.webhookDelivery.count({ where: { workspaceId } }),
  ]);
  return { pending, retrying, delivered, deadLettered, total };
}

type EpochWebhookEventCursor = {
  lastSeenAt: string;
  id: string;
};

export type EpochWebhookEventRecord = {
  id: string;
  workspaceId: string;
  endpointId: string | null;
  eventType: string;
  eventId: string | null;
  label: string;
  subjectId: string | null;
  payload: Record<string, unknown>;
  deliveryCount: number;
  deliveredCount: number;
  failedCount: number;
  lastStatus: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type EpochWebhookRetryQueueRecord = EpochWebhookDeliveryRecord & {
  endpointUrl: string;
  endpointStatus: string;
};

function decodeEpochWebhookEventCursor(cursor: string | undefined): EpochWebhookEventCursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { lastSeenAt?: unknown }).lastSeenAt === "string" &&
      typeof (parsed as { id?: unknown }).id === "string"
    ) {
      return {
        lastSeenAt: (parsed as { lastSeenAt: string }).lastSeenAt,
        id: (parsed as { id: string }).id,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function encodeEpochWebhookEventCursor(cursor: EpochWebhookEventCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function parseWebhookBody(value: Prisma.JsonValue): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function deriveWebhookEventLabel(row: {
  eventType: string;
  requestBody: Prisma.JsonValue;
}): string {
  const body = parseWebhookBody(row.requestBody);
  return (
    toStringOrNull(body.label) ??
    toStringOrNull(body.eventLabel) ??
    toStringOrNull(body.type) ??
    row.eventType
  );
}

function deriveWebhookEventSubjectId(row: {
  requestBody: Prisma.JsonValue;
}): string | null {
  const body = parseWebhookBody(row.requestBody);
  return toStringOrNull(body.subjectId);
}

function deriveWebhookEventPayload(row: {
  requestBody: Prisma.JsonValue;
}): Record<string, unknown> {
  const body = parseWebhookBody(row.requestBody);
  const payload = body.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return body;
}

export async function listEpochWebhookEvents(input: {
  workspaceId: string;
  endpointId?: string;
  limit?: number;
  cursor?: string;
}): Promise<{
  events: EpochWebhookEventRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}> {
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 25)));
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.endpointId ? { endpointId: input.endpointId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const grouped = new Map<
    string,
    {
      id: string;
      workspaceId: string;
      endpointId: string | null;
      eventType: string;
      eventId: string | null;
      label: string;
      subjectId: string | null;
      payload: Record<string, unknown>;
      deliveryCount: number;
      deliveredCount: number;
      failedCount: number;
      lastStatus: string;
      firstSeenAt: string;
      lastSeenAt: string;
    }
  >();

  for (const row of rows) {
    const eventKey = row.eventId?.trim().length ? row.eventId : `${row.eventType}:${row.id}`;
    const createdAt = row.createdAt.toISOString();
    const existing = grouped.get(eventKey);
    const label = deriveWebhookEventLabel(row);
    const subjectId = deriveWebhookEventSubjectId(row);
    const payload = deriveWebhookEventPayload(row);

    if (!existing) {
      grouped.set(eventKey, {
        id: eventKey,
        workspaceId: row.workspaceId,
        endpointId: row.endpointId,
        eventType: row.eventType,
        eventId: row.eventId,
        label,
        subjectId,
        payload,
        deliveryCount: 1,
        deliveredCount: row.status === "delivered" ? 1 : 0,
        failedCount: row.status === "dead_lettered" || row.status === "retrying" ? 1 : 0,
        lastStatus: row.status,
        firstSeenAt: createdAt,
        lastSeenAt: createdAt,
      });
      continue;
    }

    existing.endpointId = existing.endpointId ?? row.endpointId;
    existing.deliveryCount += 1;
    existing.deliveredCount += row.status === "delivered" ? 1 : 0;
    existing.failedCount += row.status === "dead_lettered" || row.status === "retrying" ? 1 : 0;
    existing.lastStatus = row.status;
    if (createdAt > existing.lastSeenAt) {
      existing.lastSeenAt = createdAt;
      existing.label = label;
      existing.subjectId = subjectId;
      existing.payload = payload;
    }
    if (createdAt < existing.firstSeenAt) {
      existing.firstSeenAt = createdAt;
    }
  }

  const events = Array.from(grouped.values())
    .sort((a, b) => {
      const bySeenAt = b.lastSeenAt.localeCompare(a.lastSeenAt);
      if (bySeenAt !== 0) return bySeenAt;
      return b.id.localeCompare(a.id);
    });

  const cursor = decodeEpochWebhookEventCursor(input.cursor);
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = events.findIndex((event) => event.lastSeenAt === cursor.lastSeenAt && event.id === cursor.id);
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }

  const page = events.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < events.length;
  const nextCursor =
    hasMore && page.length > 0
      ? encodeEpochWebhookEventCursor({
          lastSeenAt: page[page.length - 1].lastSeenAt,
          id: page[page.length - 1].id,
        })
      : null;

  return {
    events: page,
    nextCursor,
    hasMore,
    total: events.length,
  };
}

export async function listEpochWebhookRetryQueue(input: {
  workspaceId: string;
  endpointId?: string;
  limit?: number;
  cursor?: string;
}): Promise<{
  items: EpochWebhookRetryQueueRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}> {
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 25)));
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.endpointId ? { endpointId: input.endpointId } : {}),
      status: { in: ["pending", "retrying", "dead_lettered"] },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { endpoint: true },
  });

  const items = rows.map((row) => ({
    ...mapDelivery(row),
    endpointUrl: row.endpoint.url,
    endpointStatus: row.endpoint.status,
  }));

  const cursor = decodeEpochWebhookDeliveryCursor(input.cursor);
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = items.findIndex((item) => item.createdAt === cursor.createdAt && item.id === cursor.id);
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }

  const page = items.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < items.length;
  const nextCursor =
    hasMore && page.length > 0
      ? encodeEpochWebhookDeliveryCursor({
          createdAt: page[page.length - 1].createdAt,
          id: page[page.length - 1].id,
        })
      : null;

  return {
    items: page,
    nextCursor,
    hasMore,
    total: items.length,
  };
}

export async function testEpochWebhookEndpoint(input: {
  workspaceId: string;
  webhookId: string;
  label?: string;
  eventType?: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
}): Promise<EpochWebhookDeliveryRecord | null> {
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { workspaceId: input.workspaceId, id: input.webhookId },
  });
  if (!endpoint) return null;

  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const eventType = input.eventType?.trim() || "webhook.test";
  const label = input.label?.trim() || "Webhook test";
  const eventId = buildEventId({
    workspaceId: input.workspaceId,
    userId: "system",
    kind: eventType,
    label,
    subjectId: input.subjectId,
    payload: input.payload ?? { source: "mission-control", test: true },
    occurredAt,
  });
  const deliveryId = buildDeliveryId();
  const createdAt = new Date();
  const requestBody = buildRequestBody(
    {
      workspaceId: input.workspaceId,
      userId: "system",
      kind: eventType,
      label,
      subjectId: input.subjectId,
      payload: input.payload ?? { source: "mission-control", test: true },
      occurredAt,
    },
    deliveryId,
    eventId,
  );

  await prisma.webhookDelivery.create({
    data: {
      id: deliveryId,
      workspaceId: input.workspaceId,
      endpointId: endpoint.id,
      eventType,
      eventId,
      status: "pending",
      attemptCount: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      requestBody: inputJson(requestBody),
      requestHeaders: inputJson({
        "Content-Type": "application/json",
        "User-Agent": "MemoryOS-Epoch/1.0",
        "X-Epoch-Event": eventType,
        "X-Epoch-Event-Id": eventId,
        "X-Epoch-Workspace": input.workspaceId,
      }),
      nextRetryAt: createdAt,
    },
  });

  try {
    await deliverWebhookDelivery({
      id: deliveryId,
      workspaceId: input.workspaceId,
      endpointId: endpoint.id,
      eventType,
      eventId,
      requestBody,
      attemptCount: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      endpoint: {
        id: endpoint.id,
        workspaceId: endpoint.workspaceId,
        url: endpoint.url,
        secret: endpoint.secret,
        status: endpoint.status,
      },
    });
  } finally {
    await prisma.webhookEndpoint.update({
      where: { id: endpoint.id },
      data: { lastTestAt: new Date() },
    });
  }

  return getEpochWebhookDelivery({
    workspaceId: input.workspaceId,
    deliveryId,
  });
}
