import { randomUUID } from "crypto";
import type { RedisClientType } from "redis";
import { getRedisClient } from "../cache/redisClient";

export type LabAutomationRealtimeEvent = {
  id: string;
  sourceId: string;
  orgId: string;
  event: string;
  payload: Record<string, unknown>;
  ts: string;
};

type LabAutomationRealtimeListener = (event: LabAutomationRealtimeEvent) => void;

const CHANNEL = process.env.LAB_AUTOMATION_EVENTS_CHANNEL ?? "memoryos:lab-automations:events:v1";
const SOURCE_ID = `${process.pid}:${randomUUID()}`;

const listeners = new Set<LabAutomationRealtimeListener>();
let redisSubscriberPromise: Promise<void> | null = null;
let redisSubscriber: RedisClientType | null = null;

function dispatchAutomationRealtimeEvent(event: LabAutomationRealtimeEvent): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch {
      // Realtime subscribers are best-effort; one broken SSE client must not block others.
    }
  }
}

function parseEvent(message: string): LabAutomationRealtimeEvent | null {
  try {
    const parsed = JSON.parse(message) as Partial<LabAutomationRealtimeEvent>;
    if (
      !parsed ||
      typeof parsed.orgId !== "string" ||
      typeof parsed.event !== "string" ||
      !parsed.payload ||
      typeof parsed.payload !== "object" ||
      Array.isArray(parsed.payload)
    ) {
      return null;
    }
    return {
      id: typeof parsed.id === "string" ? parsed.id : `evt_${randomUUID()}`,
      sourceId: typeof parsed.sourceId === "string" ? parsed.sourceId : "unknown",
      orgId: parsed.orgId,
      event: parsed.event,
      payload: parsed.payload as Record<string, unknown>,
      ts: typeof parsed.ts === "string" ? parsed.ts : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function subscribeLabAutomationRealtime(
  listener: LabAutomationRealtimeListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startLabAutomationRealtimeBridge(): void {
  if (redisSubscriberPromise) return;
  redisSubscriberPromise = (async () => {
    const publisher = await getRedisClient();
    if (!publisher) return;

    try {
      redisSubscriber = publisher.duplicate();
      await redisSubscriber.connect();
      await redisSubscriber.subscribe(CHANNEL, (message) => {
        const event = parseEvent(message);
        if (!event || event.sourceId === SOURCE_ID) return;
        dispatchAutomationRealtimeEvent(event);
      });
    } catch {
      redisSubscriber = null;
      redisSubscriberPromise = null;
    }
  })();
}

export async function publishLabAutomationRealtime(
  orgId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<LabAutomationRealtimeEvent> {
  const envelope: LabAutomationRealtimeEvent = {
    id: `evt_${randomUUID()}`,
    sourceId: SOURCE_ID,
    orgId,
    event,
    payload,
    ts: new Date().toISOString(),
  };

  dispatchAutomationRealtimeEvent(envelope);

  const publisher = await getRedisClient();
  if (publisher) {
    try {
      await publisher.publish(CHANNEL, JSON.stringify(envelope));
    } catch {
      // Redis pub/sub is the cross-process fanout layer; local SSE already received the event.
    }
  }

  return envelope;
}

export async function stopLabAutomationRealtimeBridgeForTests(): Promise<void> {
  listeners.clear();
  const subscriber = redisSubscriber;
  redisSubscriber = null;
  redisSubscriberPromise = null;
  if (subscriber) {
    try {
      await subscriber.unsubscribe(CHANNEL);
      await subscriber.quit();
    } catch {
      // test cleanup only
    }
  }
}
