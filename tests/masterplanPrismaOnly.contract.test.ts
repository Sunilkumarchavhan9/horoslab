import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const productLoopStoreSource = readFileSync(
  path.join(process.cwd(), "lib", "masterplan", "productLoopStore.ts"),
  "utf8",
);

describe("masterplan Prisma persistence", () => {
  it("uses Prisma directly for durable product-loop storage", () => {
    expect(productLoopStoreSource).toContain("const db = prisma as MasterplanPrismaClient");
    expect(productLoopStoreSource).not.toContain("createJsonDelegate");
    expect(productLoopStoreSource).not.toContain("withJsonFallback");
    expect(productLoopStoreSource).not.toContain("MASTERPLAN_STORE_PATH");
    expect(productLoopStoreSource).not.toContain("using JSON fallback");
  });
});
