import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

type ContractDocument = {
  openapi: string;
  paths: Record<string, Record<string, unknown>>;
  xEpochV13Resources?: {
    eventTrace?: string;
    discovery?: string[];
    environments?: string[];
    execution?: string[];
    outcomes?: string[];
  };
};

describe("Epoch V12 OpenAPI and compatibility gate", () => {
  it("generates the canonical runtime routes and does not advertise deprecated setup flows", async () => {
    const source = await readFile("scripts/generate-epoch-v12-contract.ts", "utf8");
    expect(source).toContain("/api/epoch/workspaces/{workspaceId}/missions");
    expect(source).toContain("/api/epoch/workspaces/{workspaceId}/workers");
    expect(source).toContain("evidence-bundle");
    expect(source).not.toContain("/api/mcp/setup");
    expect(source).not.toMatch(/github.*setup/i);
  });

  it("covers the V13 execution architecture in the generated contract", async () => {
    const document = JSON.parse(
      await readFile("docs/generated/epoch-v12-contract.json", "utf8"),
    ) as ContractDocument;

    expect(document.openapi).toBe("3.1.0");

    const expectedPaths = [
      "/api/epoch/workspaces/{workspaceId}/events",
      "/api/epoch/workspaces/{workspaceId}/unknowns",
      "/api/epoch/workspaces/{workspaceId}/discovery-programs",
      "/api/epoch/workspaces/{workspaceId}/hypotheses",
      "/api/epoch/workspaces/{workspaceId}/experiments",
      "/api/epoch/workspaces/{workspaceId}/observations",
      "/api/epoch/workspaces/{workspaceId}/projects/{projectId}/simulations",
      "/api/epoch/workspaces/{workspaceId}/simulations/{simulationId}/runs",
      "/api/epoch/workspaces/{workspaceId}/automations",
      "/api/epoch/workspaces/{workspaceId}/capabilities",
      "/api/epoch/workspaces/{workspaceId}/architecture-runs/{missionId}",
      "/api/epoch/workspaces/{workspaceId}/architecture-runs/{missionId}/refresh",
      "/api/epoch/workspaces/{workspaceId}/missions/{missionId}/outcome",
      "/api/epoch/workspaces/{workspaceId}/outcomes/{outcomeId}/experience",
    ];

    for (const path of expectedPaths) {
      expect(document.paths, `missing generated route: ${path}`).toHaveProperty(path);
    }

    expect(document.xEpochV13Resources).toMatchObject({
      eventTrace: "/api/epoch/workspaces/{workspaceId}/events",
      discovery: expect.arrayContaining(["unknowns", "hypotheses", "experiments", "observations"]),
      environments: expect.arrayContaining(["software", "cloud", "simulation", "edge", "sandbox"]),
      execution: expect.arrayContaining(["capabilities", "simulations", "automations", "missions", "workers"]),
      outcomes: expect.arrayContaining(["outcomes", "experiences"]),
    });
  });

  it("keeps the runtime worker state vocabulary aligned with persistence", async () => {
    const source = await readFile("lib/epoch/v12/contracts.ts", "utf8");
    expect(source).toContain('["online", "draining", "offline", "blocked", "retired"]');
    expect(source).not.toContain('["available", "busy", "offline", "blocked"]');
  });
});
