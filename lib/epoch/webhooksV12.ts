import { createHmac, timingSafeEqual } from "node:crypto";

export type EpochWebhookEnvelope = { version: "epoch.webhook.v1"; eventId: string; eventType: string; workspaceId: string; occurredAt: string; payload: Record<string, unknown>; signature: string };

function canonical(input: Omit<EpochWebhookEnvelope, "signature">): string { return JSON.stringify({ version: input.version, eventId: input.eventId, eventType: input.eventType, workspaceId: input.workspaceId, occurredAt: input.occurredAt, payload: input.payload }); }
export function signEpochWebhook(input: Omit<EpochWebhookEnvelope, "signature">, secret: string): string { return createHmac("sha256", secret).update(canonical(input)).digest("hex"); }
export function createEpochWebhook(input: Omit<EpochWebhookEnvelope, "signature">, secret: string): EpochWebhookEnvelope { return { ...input, signature: signEpochWebhook(input, secret) }; }
export function verifyEpochWebhook(input: EpochWebhookEnvelope, secret: string, options: { now?: Date; maxAgeMs?: number } = {}): boolean {
  const age = Math.abs((options.now ?? new Date()).getTime() - new Date(input.occurredAt).getTime());
  if (!Number.isFinite(age) || age > (options.maxAgeMs ?? 300_000)) return false;
  const expected = Buffer.from(signEpochWebhook({ version: input.version, eventId: input.eventId, eventType: input.eventType, workspaceId: input.workspaceId, occurredAt: input.occurredAt, payload: input.payload }, secret), "hex");
  const actual = Buffer.from(input.signature, "hex");
  return input.version === "epoch.webhook.v1" && actual.length === expected.length && timingSafeEqual(actual, expected);
}
