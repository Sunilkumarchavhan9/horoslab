import { prisma } from "../storage/prismaClient";
import { PLAN_CATALOG, type BillingPlan } from "../../shared/planCatalog";

type BillingInvoice = {
  id: string;
  amountCents: number;
  currency: string;
  status: "paid" | "open" | "void";
  issuedAt: string;
  hostedInvoiceUrl: string | null;
};

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unknown";

type UserBillingState = {
  userId: string;
  plan: BillingPlan;
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  invoices: BillingInvoice[];
  connectorSyncUsed: number;
  updatedAt: string;
};

export type BillingEvent = {
  id: string;
  userId: string | null;
  provider: "polar" | "custom";
  type: string;
  status: "processed" | "skipped" | "failed";
  summary: string;
  createdAt: string;
};

function defaultUserBillingState(userId: string): UserBillingState {
  return {
    userId,
    plan: "Free",
    customerId: null,
    subscriptionId: null,
    subscriptionStatus: "unknown",
    currentPeriodEnd: null,
    invoices: [],
    connectorSyncUsed: 0,
    updatedAt: new Date().toISOString(),
  };
}

function toBillingPlan(input: string | null | undefined): BillingPlan {
  if (input === "Free" || input === "Pro" || input === "Scale" || input === "Enterprise") return input;
  return "Free";
}

function toSubscriptionStatus(input: string | null | undefined): SubscriptionStatus {
  if (input === "active" || input === "trialing" || input === "past_due" || input === "canceled" || input === "incomplete") {
    return input;
  }
  return "unknown";
}

export async function getBillingStateForUser(userId: string): Promise<UserBillingState> {
  try {
    const account = await prisma.billingAccount.findUnique({
      where: { userId },
      include: {
        invoices: { orderBy: { issuedAt: "desc" }, take: 200 },
      },
    });

    if (!account) {
      return defaultUserBillingState(userId);
    }

    return {
      userId: account.userId,
      plan: toBillingPlan(account.plan),
      customerId: account.customerId,
      subscriptionId: account.subscriptionId,
      subscriptionStatus: toSubscriptionStatus(account.subscriptionStatus),
      currentPeriodEnd: account.currentPeriodEnd,
      invoices: account.invoices.map((row) => ({
        id: row.id,
        amountCents: row.amountCents,
        currency: row.currency,
        status: row.status as "paid" | "open" | "void",
        issuedAt: row.issuedAt,
        hostedInvoiceUrl: row.hostedInvoiceUrl,
      })),
      connectorSyncUsed: account.connectorSyncUsed,
      updatedAt: account.updatedAt.toISOString(),
    };
  } catch {
    return defaultUserBillingState(userId);
  }
}

export async function setUserBillingState(input: {
  userId: string;
  plan: BillingPlan;
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodEnd?: string | null;
}): Promise<UserBillingState> {
  await prisma.billingAccount.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      plan: input.plan,
      customerId: input.customerId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      subscriptionStatus: input.subscriptionStatus ?? "unknown",
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      connectorSyncUsed: 0,
    },
    update: {
      plan: input.plan,
      ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
      ...(input.subscriptionId !== undefined ? { subscriptionId: input.subscriptionId } : {}),
      ...(input.subscriptionStatus !== undefined ? { subscriptionStatus: input.subscriptionStatus } : {}),
      ...(input.currentPeriodEnd !== undefined ? { currentPeriodEnd: input.currentPeriodEnd } : {}),
    },
  });

  return getBillingStateForUser(input.userId);
}

export async function appendInvoiceForUser(userId: string, invoice: BillingInvoice): Promise<UserBillingState> {
  await prisma.billingAccount.upsert({
    where: { userId },
    create: {
      userId,
      plan: "Free",
      subscriptionStatus: "unknown",
      connectorSyncUsed: 0,
    },
    update: {},
  });

  await prisma.billingInvoice.upsert({
    where: { id: invoice.id },
    create: {
      id: invoice.id,
      userId,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      hostedInvoiceUrl: invoice.hostedInvoiceUrl,
    },
    update: {
      userId,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      hostedInvoiceUrl: invoice.hostedInvoiceUrl,
    },
  });

  return getBillingStateForUser(userId);
}

export async function resolveUserIdByCustomerId(customerId: string): Promise<string | null> {
  const account = await prisma.billingAccount.findFirst({
    where: { customerId },
    select: { userId: true },
  });
  return account?.userId ?? null;
}

export async function appendBillingEvent(event: BillingEvent): Promise<void> {
  await prisma.billingEvent.create({
    data: {
      id: event.id,
      userId: event.userId,
      provider: event.provider,
      type: event.type,
      status: event.status,
      summary: event.summary,
      createdAt: event.createdAt,
    },
  });
}

export async function listBillingEventsForUser(userId: string, limit = 40): Promise<BillingEvent[]> {
  const rows = await prisma.billingEvent.findMany({
    where: {
      OR: [{ userId }, { userId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 200)),
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    provider: row.provider as "polar" | "custom",
    type: row.type,
    status: row.status as "processed" | "skipped" | "failed",
    summary: row.summary,
    createdAt: row.createdAt,
  }));
}

export function applyPlanUsageLimits(plan: BillingPlan, usage: {
  tokenLimit: number;
  tokenUsed: number;
  searchLimit: number;
  searchUsed: number;
  resetInDays: number;
}): void {
  const planLimits = PLAN_CATALOG[plan];
  if (planLimits.tokenLimit) usage.tokenLimit = planLimits.tokenLimit;
  if (planLimits.searchLimit) usage.searchLimit = planLimits.searchLimit;
}

export async function canConsumeConnectorSyncRecords(input: { userId: string; amount: number }): Promise<{
  allowed: boolean;
  plan: BillingPlan;
  used: number;
  limit: number | null;
}> {
  const amount = Math.max(0, Math.floor(input.amount));
  const state = await getBillingStateForUser(input.userId);
  const planDef = PLAN_CATALOG[state.plan];
  const used = Math.max(0, Math.floor(state.connectorSyncUsed ?? 0));
  const limit = planDef.connectorSyncRecordLimit ?? null;
  if (amount === 0) return { allowed: true, plan: state.plan, used, limit };
  if (limit === null) return { allowed: true, plan: state.plan, used, limit };
  return { allowed: used + amount <= limit, plan: state.plan, used, limit };
}

export async function consumeConnectorSyncRecords(input: { userId: string; amount: number }): Promise<{
  plan: BillingPlan;
  used: number;
  limit: number | null;
}> {
  const amount = Math.max(0, Math.floor(input.amount));
  await prisma.billingAccount.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      plan: "Free",
      subscriptionStatus: "unknown",
      connectorSyncUsed: amount,
    },
    update: {
      connectorSyncUsed: { increment: amount },
    },
  });
  const state = await getBillingStateForUser(input.userId);
  const planDef = PLAN_CATALOG[state.plan];
  return { plan: state.plan, used: state.connectorSyncUsed, limit: planDef.connectorSyncRecordLimit ?? null };
}
