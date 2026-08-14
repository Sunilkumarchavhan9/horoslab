import type { Prisma } from "@prisma/client";
import { prisma } from "../../storage/prismaClient";
import { createEpochV13Id } from "./ids";

export type EpochOutboxInput = {
  workspaceId?: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
};

type DbClient = typeof prisma | Prisma.TransactionClient;

export async function enqueueEpochOutboxEvent(input: EpochOutboxInput, client: DbClient = prisma) {
  const existing = await client.epochOutboxEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return { event: existing, created: false };
  try {
    const event = await client.epochOutboxEvent.create({
      data: {
        id: createEpochV13Id(),
        workspaceId: input.workspaceId,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        idempotencyKey: input.idempotencyKey,
        payload: JSON.parse(JSON.stringify(input.payload)),
      },
    });
    return { event, created: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      const event = await client.epochOutboxEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (event) return { event, created: false };
    }
    throw error;
  }
}

export async function listEpochOutboxEvents(workspaceId: string, limit = 100) {
  return prisma.epochOutboxEvent.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: Math.min(Math.max(limit, 1), 200) });
}

export async function claimEpochOutboxEvent(workspaceId: string, eventId: string) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.epochOutboxEvent.findFirst({ where: { id: eventId, workspaceId } });
    if (!event) return null;
    if (event.status === "published") return event;
    return tx.epochOutboxEvent.update({ where: { id: event.id }, data: { status: "published", attempts: { increment: 1 }, publishedAt: new Date(), lastError: null } });
  });
}
