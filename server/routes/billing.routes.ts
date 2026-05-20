  import express, { Router } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import type { BillingPlan } from "../../shared/planCatalog";
import {
  appendInvoiceForUser,
  appendBillingEvent,
  resolveUserIdByCustomerId,
  setUserBillingState,
} from "../../lib/billing/store";
import { randomUUID } from "crypto";
import { rateLimitWebhookIp } from "../middleware/rateLimit";

export const billingRouter = Router();
billingRouter.use("/webhooks/polar", express.text({ type: "*/*" }));
billingRouter.use("/webhooks/polar", rateLimitWebhookIp);

type PolarWebhookPayload = {
  type?: string;
  data?: Record<string, unknown>;
};
type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unknown";

function readRawSignature(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const raw = headerValue.trim();
  if (!raw) return null;
  const maybePrefixed = raw.startsWith("sha256=") ? raw.slice("sha256=".length) : raw;
  return /^[a-f0-9]+$/i.test(maybePrefixed) ? maybePrefixed.toLowerCase() : null;
}

function verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  const secret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const signature = readRawSignature(signatureHeader);
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actualBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (actualBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(actualBuf, expectedBuf);
}

function coercePlan(value: unknown): BillingPlan | null {
  if (value === "Free" || value === "Pro" || value === "Scale" || value === "Enterprise") return value;
  return null;
}

function coerceSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (value === "active" || value === "trialing" || value === "past_due" || value === "canceled" || value === "incomplete") {
    return value;
  }
  return "unknown";
}

billingRouter.post("/webhooks/polar", async (req, res) => {
  const rawBody = typeof req.body === "string" ? req.body : "";
  const sigHeader = req.headers["x-polar-signature"];
  const signature = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;

  if (!verifyWebhookSignature(rawBody, signature)) {
    await appendBillingEvent({
      id: randomUUID(),
      userId: null,
      provider: "polar",
      type: "webhook.invalid_signature",
      status: "failed",
      summary: "Rejected webhook with invalid signature.",
      createdAt: new Date().toISOString(),
    });
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  let payload: PolarWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PolarWebhookPayload;
  } catch {
    await appendBillingEvent({
      id: randomUUID(),
      userId: null,
      provider: "polar",
      type: "webhook.invalid_json",
      status: "failed",
      summary: "Rejected webhook with invalid JSON body.",
      createdAt: new Date().toISOString(),
    });
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  const eventType = String(payload.type ?? "");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const customerId = typeof data.customer_id === "string" ? data.customer_id : typeof data.customerId === "string" ? data.customerId : null;
  const userIdFromMetadata = typeof metadata.userId === "string" ? metadata.userId : null;
  let userId: string | null = userIdFromMetadata;
  if (!userId && customerId) {
    userId = await resolveUserIdByCustomerId(customerId);
  }

  if (!userId) {
    await appendBillingEvent({
      id: randomUUID(),
      userId: null,
      provider: "polar",
      type: eventType || "webhook.unknown",
      status: "skipped",
      summary: "Webhook received but user could not be resolved from metadata/customer mapping.",
      createdAt: new Date().toISOString(),
    });
    res.status(202).json({ ok: true, skipped: true, reason: "user_not_resolved" });
    return;
  }

  if (eventType.includes("subscription")) {
    const plan = coercePlan(metadata.plan ?? data.planName ?? data.plan);
    if (plan) {
      await setUserBillingState({
        userId,
        plan,
        customerId,
        subscriptionId: typeof data.subscription_id === "string" ? data.subscription_id : null,
        subscriptionStatus: coerceSubscriptionStatus(data.status),
        currentPeriodEnd: typeof data.current_period_end === "string" ? data.current_period_end : null,
      });
    }
  }

  if (eventType.includes("invoice")) {
    const invoiceId = typeof data.id === "string" ? data.id : `inv_${Date.now()}`;
    const amountCents = typeof data.amount === "number" ? Math.round(data.amount) : typeof data.amount_cents === "number" ? Math.round(data.amount_cents) : 0;
    const currency = typeof data.currency === "string" ? data.currency : "usd";
    const status = (typeof data.status === "string" ? data.status : "open") as "paid" | "open" | "void";
    const hostedInvoiceUrl = typeof data.hosted_invoice_url === "string" ? data.hosted_invoice_url : null;
    const issuedAt = typeof data.created_at === "string" ? data.created_at : new Date().toISOString();
    await appendInvoiceForUser(userId, {
      id: invoiceId,
      amountCents,
      currency,
      status,
      hostedInvoiceUrl,
      issuedAt,
    });
  }

  await appendBillingEvent({
    id: randomUUID(),
    userId,
    provider: "polar",
    type: eventType || "webhook.unknown",
    status: "processed",
    summary: eventType.includes("subscription")
      ? "Subscription state synced."
      : eventType.includes("invoice")
        ? "Invoice event synced."
        : "Webhook processed.",
    createdAt: new Date().toISOString(),
  });

  res.status(200).json({ ok: true });
});
