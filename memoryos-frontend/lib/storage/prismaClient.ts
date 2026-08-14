import { PrismaClient } from "@prisma/client";

declare global {
  var __memoryOsFrontendPrismaClient: PrismaClient | undefined;
}

export const prisma =
  globalThis.__memoryOsFrontendPrismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__memoryOsFrontendPrismaClient = prisma;
}
