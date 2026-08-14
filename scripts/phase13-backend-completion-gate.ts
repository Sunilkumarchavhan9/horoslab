import { randomUUID } from "node:crypto";
import { prisma } from "../lib/storage/prismaClient";
import { createEpochV13Id } from "../lib/epoch/v13/ids";
import {
  claimEpochOutboxEvent,
  enqueueEpochOutboxEvent,
} from "../lib/epoch/v13/outboxService";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const first = createEpochV13Id();
  const second = createEpochV13Id();
  assert(first !== second, "V13 IDs must be unique");
  assert(
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(first),
    "V13 IDs must be UUIDv7-compatible",
  );
  console.log("[PASS] UUIDv7-compatible V13 identifiers");

  const workspaceId = process.env.EPOCH_V13_GATE_WORKSPACE_ID
    ?? (await prisma.workspace.findFirst({ select: { id: true } }))?.id;

  if (!workspaceId) {
    console.log("[WARN] No workspace found; skipped database outbox roundtrip.");
    return;
  }

  const idempotencyKey = `phase13-gate-${Date.now()}-${randomUUID()}`;
  try {
    const firstEnqueue = await enqueueEpochOutboxEvent({
      workspaceId,
      aggregateType: "phase13_gate",
      aggregateId: workspaceId,
      eventType: "phase13.roundtrip",
      idempotencyKey,
      payload: { gate: "phase13", workspaceId },
    });
    const secondEnqueue = await enqueueEpochOutboxEvent({
      workspaceId,
      aggregateType: "phase13_gate",
      aggregateId: workspaceId,
      eventType: "phase13.roundtrip",
      idempotencyKey,
      payload: { gate: "phase13", workspaceId },
    });

    assert(firstEnqueue.created, "First outbox enqueue must create an event");
    assert(!secondEnqueue.created, "Duplicate outbox enqueue must be idempotent");
    assert(firstEnqueue.event.id === secondEnqueue.event.id, "Idempotency key returned different events");

    const claimed = await claimEpochOutboxEvent(workspaceId, firstEnqueue.event.id);
    assert(claimed?.status === "published", "Outbox event was not published by claim");
    assert(claimed.attempts === 1, "Outbox claim did not record one publish attempt");
    console.log("[PASS] Durable outbox idempotency and claim roundtrip");
  } finally {
    await prisma.epochOutboxEvent.deleteMany({ where: { idempotencyKey } });
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
