import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  path.join(process.cwd(), "app", "reality-exchange", "page.tsx"),
  "utf8",
);
const planSource = readFileSync(
  path.join(process.cwd(), "shared", "realityExchangePlan.ts"),
  "utf8",
);

describe("Reality Exchange page contract", () => {
  it("renders the Institution Compiler plan as a dedicated product surface", () => {
    [
      "Reality Exchange",
      "Institution Compiler",
      "North star",
      "Open Continuity Lab",
    ].forEach((fragment) => expect(pageSource).toContain(fragment));
  });

  it("keeps the build cut in the shared plan manifest", () => {
    [
      "Build Now",
      "Mandate Contract",
      "Institution IR",
      "Constitutional VM",
      "REALITY SETTLED",
      "Institution Compiler",
    ].forEach((fragment) => expect(planSource).toContain(fragment));
  });

  it("fetches live reality compiler status from the backend proxy", () => {
    expect(pageSource).toContain("/api/reality-compiler/status");
    expect(pageSource).toContain("getRequestOrigin");
    expect(pageSource).toContain("loadRealityCompilerStatus");
  });
});
