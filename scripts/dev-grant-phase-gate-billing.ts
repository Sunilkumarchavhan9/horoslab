import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return found?.slice(prefix.length).trim() || undefined;
}

function isProductionLike(): boolean {
  const values = [
    process.env.NODE_ENV,
    process.env.MEMORYOS_ENV,
    process.env.DEPLOYMENT_ENV,
    process.env.VERCEL_ENV,
  ];
  return values.some((value) => value?.toLowerCase() === "production");
}

async function main(): Promise<void> {
  if (isProductionLike()) {
    throw new Error("Refusing to grant dev billing entitlement in a production-like environment.");
  }

  const userId =
    arg("user-id") ??
    env("PHASE1_GATE_USER_ID") ??
    env("MEMORYOS_DEV_BILLING_USER_ID") ??
    env("MEMORYOS_USER_ID");

  if (!userId) {
    throw new Error(
      "Missing user id. Pass --user-id=<id> or set PHASE1_GATE_USER_ID / MEMORYOS_DEV_BILLING_USER_ID.",
    );
  }

  const resetUsage = process.argv.includes("--reset-usage");
  const now = new Date();

  const account = await prisma.billingAccount.upsert({
    where: { userId },
    create: {
      userId,
      plan: "Scale",
      subscriptionStatus: "active",
      connectorSyncUsed: 0,
      tokenUsed: 0,
      searchUsed: 0,
      usagePeriodStart: now.toISOString(),
    },
    update: {
      plan: "Scale",
      subscriptionStatus: "active",
      currentPeriodEnd: null,
      ...(resetUsage
        ? {
            connectorSyncUsed: 0,
            tokenUsed: 0,
            searchUsed: 0,
            usagePeriodStart: now.toISOString(),
          }
        : {}),
    },
    select: {
      userId: true,
      plan: true,
      subscriptionStatus: true,
      tokenUsed: true,
      searchUsed: true,
      connectorSyncUsed: true,
      usagePeriodStart: true,
      updatedAt: true,
    },
  });

  console.log(JSON.stringify({ ok: true, resetUsage, account }, null, 2));
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[dev-grant-phase-gate-billing] ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
