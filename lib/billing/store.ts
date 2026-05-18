import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { PLAN_CATALOG, type BillingPlan } from "../../shared/planCatalog";

const DATA_DIR = path.join(process.cwd(), "data");
const BILLING_STORE_PATH = path.join(DATA_DIR, "billing-state.json");

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
  updatedAt: string;
};

type BillingStore = {
  users: Record<string, UserBillingState>;
  customerToUser: Record<string, string>;
  events: BillingEvent[];
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
    updatedAt: new Date().toISOString(),
  };
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): BillingStore {
  ensureDataDir();
  if (!existsSync(BILLING_STORE_PATH)) {
    return { users: {}, customerToUser: {}, events: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(BILLING_STORE_PATH, "utf8")) as BillingStore;
    return {
      users: parsed.users ?? {},
      customerToUser: parsed.customerToUser ?? {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { users: {}, customerToUser: {}, events: [] };
  }
}

function writeStore(store: BillingStore): void {
  ensureDataDir();
  writeFileSync(BILLING_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function getBillingStateForUser(userId: string): UserBillingState {
  const store = readStore();
  return store.users[userId] ?? defaultUserBillingState(userId);
}

export function setUserBillingState(input: {
  userId: string;
  plan: BillingPlan;
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodEnd?: string | null;
}): UserBillingState {
  const store = readStore();
  const existing = store.users[input.userId] ?? defaultUserBillingState(input.userId);
  const next: UserBillingState = {
    ...existing,
    plan: input.plan,
    customerId: input.customerId ?? existing.customerId,
    subscriptionId: input.subscriptionId ?? existing.subscriptionId,
    subscriptionStatus: input.subscriptionStatus ?? existing.subscriptionStatus,
    currentPeriodEnd: input.currentPeriodEnd ?? existing.currentPeriodEnd,
    updatedAt: new Date().toISOString(),
  };
  store.users[input.userId] = next;
  if (next.customerId) {
    store.customerToUser[next.customerId] = input.userId;
  }
  writeStore(store);
  return next;
}

export function appendInvoiceForUser(userId: string, invoice: BillingInvoice): UserBillingState {
  const store = readStore();
  const existing = store.users[userId] ?? defaultUserBillingState(userId);
  const deduped = [invoice, ...existing.invoices.filter((row) => row.id !== invoice.id)].slice(0, 200);
  const next: UserBillingState = {
    ...existing,
    invoices: deduped,
    updatedAt: new Date().toISOString(),
  };
  store.users[userId] = next;
  writeStore(store);
  return next;
}

export function resolveUserIdByCustomerId(customerId: string): string | null {
  const store = readStore();
  return store.customerToUser[customerId] ?? null;
}

export function appendBillingEvent(event: BillingEvent): void {
  const store = readStore();
  store.events = [event, ...store.events].slice(0, 500);
  writeStore(store);
}

export function listBillingEventsForUser(userId: string, limit = 40): BillingEvent[] {
  const store = readStore();
  return store.events
    .filter((entry) => entry.userId === userId || entry.userId === null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(1, Math.min(limit, 200)));
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
