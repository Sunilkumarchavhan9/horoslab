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
  usage: UsageSnapshot;
  updatedAt: string;
};

export type UsageSnapshot = {
  tokenLimit: number;
  tokenUsed: number;
  searchLimit: number;
  searchUsed: number;
  resetInDays: number;
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
  const defaultPlan = PLAN_CATALOG.Free;
  return {
    userId,
    plan: "Free",
    customerId: null,
    subscriptionId: null,
    subscriptionStatus: "unknown",
    currentPeriodEnd: null,
    invoices: [],
    connectorSyncUsed: 0,
    usage: {
      tokenLimit: defaultPlan.tokenLimit ?? 0,
      tokenUsed: 0,
      searchLimit: defaultPlan.searchLimit ?? 0,
      searchUsed: 0,
      resetInDays: 30,
    },
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

const USAGE_RESET_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FALLBACK_USAGE_BY_USER = new Map<string, UsageSnapshot>();

function hasDatabaseUrl(): boolean {
  if (process.env.NODE_ENV === "test") return false;
  return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.trim().length > 0;
}

function parseIsoOrNow(value: string | null | undefined): Date {
  if (typeof value !== "string" || value.trim().length === 0) return new Date();
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
}

function computeResetInDays(periodStartIso: string | null | undefined): number {
  const periodStart = parseIsoOrNow(periodStartIso);
  const resetAt = periodStart.getTime() + USAGE_RESET_DAYS * MS_PER_DAY;
  const remaining = Math.ceil((resetAt - Date.now()) / MS_PER_DAY);
  return Math.max(0, remaining);
}

function getFallbackUsageForPlan(userId: string, plan: BillingPlan): UsageSnapshot {
  const existing = FALLBACK_USAGE_BY_USER.get(userId);
  const planDef = PLAN_CATALOG[plan];
  const next: UsageSnapshot = {
    tokenLimit: planDef.tokenLimit ?? Number.MAX_SAFE_INTEGER,
    tokenUsed: existing?.tokenUsed ?? 0,
    searchLimit: planDef.searchLimit ?? Number.MAX_SAFE_INTEGER,
    searchUsed: existing?.searchUsed ?? 0,
    resetInDays: existing?.resetInDays ?? USAGE_RESET_DAYS,
  };
  FALLBACK_USAGE_BY_USER.set(userId, next);
  return next;
}

async function ensureUsagePeriodWindow(userId: string): Promise<void> {
  const account = await prisma.billingAccount.findUnique({
    where: { userId },
    select: { usagePeriodStart: true },
  });
  if (!account) return;

  const now = new Date();
  const periodStart = parseIsoOrNow(account.usagePeriodStart);
  const shouldReset = now.getTime() - periodStart.getTime() >= USAGE_RESET_DAYS * MS_PER_DAY;
  if (!shouldReset) return;

  await prisma.billingAccount.update({
    where: { userId },
    data: {
      tokenUsed: 0,
      searchUsed: 0,
      connectorSyncUsed: 0,
      usagePeriodStart: now.toISOString(),
    },
  });
}

export async function getBillingStateForUser(userId: string): Promise<UserBillingState> {
  if (!hasDatabaseUrl()) {
    const fallback = defaultUserBillingState(userId);
    fallback.usage = getFallbackUsageForPlan(userId, fallback.plan);
    return fallback;
  }
  try {
    await prisma.billingAccount.upsert({
      where: { userId },
      create: {
        userId,
        plan: "Free",
        subscriptionStatus: "unknown",
        connectorSyncUsed: 0,
        tokenUsed: 0,
        searchUsed: 0,
        usagePeriodStart: new Date().toISOString(),
      },
      update: {},
    });
    await ensureUsagePeriodWindow(userId);

    const account = await prisma.billingAccount.findUnique({
      where: { userId },
      include: {
        invoices: { orderBy: { issuedAt: "desc" }, take: 200 },
      },
    });

    if (!account) {
      return defaultUserBillingState(userId);
    }

    const planDef = PLAN_CATALOG[toBillingPlan(account.plan)];
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
      usage: {
        tokenLimit: planDef.tokenLimit ?? Number.MAX_SAFE_INTEGER,
        tokenUsed: account.tokenUsed,
        searchLimit: planDef.searchLimit ?? Number.MAX_SAFE_INTEGER,
        searchUsed: account.searchUsed,
        resetInDays: computeResetInDays(account.usagePeriodStart),
      },
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
      tokenUsed: 0,
      searchUsed: 0,
      usagePeriodStart: new Date().toISOString(),
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
      tokenUsed: 0,
      searchUsed: 0,
      usagePeriodStart: new Date().toISOString(),
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
      tokenUsed: 0,
      searchUsed: 0,
      usagePeriodStart: new Date().toISOString(),
    },
    update: {
      connectorSyncUsed: { increment: amount },
    },
  });
  const state = await getBillingStateForUser(input.userId);
  const planDef = PLAN_CATALOG[state.plan];
  return { plan: state.plan, used: state.connectorSyncUsed, limit: planDef.connectorSyncRecordLimit ?? null };
}

export async function tryConsumeUsage(input: {
  userId: string;
  tokenCost?: number;
  searchCost?: number;
}): Promise<{
  allowed: boolean;
  plan: BillingPlan;
  usage: UsageSnapshot;
  meter?: "tokens" | "searches";
}> {
  const tokenCost = Math.max(0, Math.floor(input.tokenCost ?? 0));
  const searchCost = Math.max(0, Math.floor(input.searchCost ?? 0));

  if (!hasDatabaseUrl()) {
    const state = defaultUserBillingState(input.userId);
    const usage = getFallbackUsageForPlan(input.userId, state.plan);
    const nextTokenUsed = usage.tokenUsed + tokenCost;
    const nextSearchUsed = usage.searchUsed + searchCost;
    if (nextTokenUsed > usage.tokenLimit) {
      return { allowed: false, plan: state.plan, meter: "tokens", usage };
    }
    if (nextSearchUsed > usage.searchLimit) {
      return { allowed: false, plan: state.plan, meter: "searches", usage };
    }
    const updated: UsageSnapshot = {
      ...usage,
      tokenUsed: nextTokenUsed,
      searchUsed: nextSearchUsed,
    };
    FALLBACK_USAGE_BY_USER.set(input.userId, updated);
    return { allowed: true, plan: state.plan, usage: updated };
  }

  try {
    await prisma.billingAccount.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        plan: "Free",
        subscriptionStatus: "unknown",
        connectorSyncUsed: 0,
        tokenUsed: 0,
        searchUsed: 0,
        usagePeriodStart: new Date().toISOString(),
      },
      update: {},
    });
    await ensureUsagePeriodWindow(input.userId);

    const account = await prisma.billingAccount.findUnique({
      where: { userId: input.userId },
      select: { plan: true, tokenUsed: true, searchUsed: true, usagePeriodStart: true },
    });
    if (!account) {
      const fallback = await getBillingStateForUser(input.userId);
      return { allowed: false, plan: fallback.plan, usage: fallback.usage };
    }

    const plan = toBillingPlan(account.plan);
    const planDef = PLAN_CATALOG[plan];
    const tokenLimit = planDef.tokenLimit ?? Number.MAX_SAFE_INTEGER;
    const searchLimit = planDef.searchLimit ?? Number.MAX_SAFE_INTEGER;

    const nextTokenUsed = account.tokenUsed + tokenCost;
    const nextSearchUsed = account.searchUsed + searchCost;
    if (nextTokenUsed > tokenLimit) {
      return {
        allowed: false,
        plan,
        meter: "tokens",
        usage: {
          tokenLimit,
          tokenUsed: account.tokenUsed,
          searchLimit,
          searchUsed: account.searchUsed,
          resetInDays: computeResetInDays(account.usagePeriodStart),
        },
      };
    }
    if (nextSearchUsed > searchLimit) {
      return {
        allowed: false,
        plan,
        meter: "searches",
        usage: {
          tokenLimit,
          tokenUsed: account.tokenUsed,
          searchLimit,
          searchUsed: account.searchUsed,
          resetInDays: computeResetInDays(account.usagePeriodStart),
        },
      };
    }

    await prisma.billingAccount.update({
      where: { userId: input.userId },
      data: {
        tokenUsed: { increment: tokenCost },
        searchUsed: { increment: searchCost },
      },
    });

    return {
      allowed: true,
      plan,
      usage: {
        tokenLimit,
        tokenUsed: nextTokenUsed,
        searchLimit,
        searchUsed: nextSearchUsed,
        resetInDays: computeResetInDays(account.usagePeriodStart),
      },
    };
  } catch {
    const state = defaultUserBillingState(input.userId);
    const usage = getFallbackUsageForPlan(input.userId, state.plan);
    const updated: UsageSnapshot = {
      ...usage,
      tokenUsed: usage.tokenUsed + tokenCost,
      searchUsed: usage.searchUsed + searchCost,
    };
    FALLBACK_USAGE_BY_USER.set(input.userId, updated);
    return { allowed: true, plan: state.plan, usage: updated };
  }
}
