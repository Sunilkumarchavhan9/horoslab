import request from "supertest";
import { describe, expect, it } from "vitest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

describe("Codex API key contract", () => {
  const app = createMemoryOsApp();

  it("reports live Agent Access protocol status from backend state", async () => {
    const userId = `u_agent_access_status_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;

    const blockedStatus = await request(app)
      .get("/api/memory/agent-access/status")
      .set("authorization", authHeader);

    expect(blockedStatus.status).toBe(200);
    expect(blockedStatus.body.data).toEqual(expect.objectContaining({
      status: expect.stringMatching(/blocked|partial|ready/),
      ready: expect.any(Boolean),
      baseUrl: expect.any(String),
      keys: [],
      protocol: expect.objectContaining({
        endpoints: expect.arrayContaining(["POST /api/memory/memoryignition/brief"]),
        sdkCalls: expect.arrayContaining(["memoryos.createBrief(task)"]),
        mcpTools: expect.arrayContaining(["memoryignition_get_brief"]),
        inheritancePackage: expect.arrayContaining(["trace proof", "outcome hooks"]),
      }),
      protocolProof: expect.objectContaining({
        requestCount: expect.any(Number),
        successCount: expect.any(Number),
        errorCount: expect.any(Number),
        briefRequestCount: expect.any(Number),
        outcomeRequestCount: expect.any(Number),
        mcpRequestCount: expect.any(Number),
        traceProofRequestCount: expect.any(Number),
        apiStandardPackageRequestCount: expect.any(Number),
        mcpStandardPackageRequestCount: expect.any(Number),
        standardPackageRequestCount: expect.any(Number),
        standardPackageVersion: null,
        standardPackageReady: false,
        latestBrief: null,
      }),
      packageReadiness: expect.objectContaining({
        sdk: expect.objectContaining({ packagePath: "packages/epoch-sdk/package.json" }),
        mcp: expect.objectContaining({ buildPath: "packages/epoch-mcp/dist/stdio.js" }),
      }),
      compatibilityReport: expect.objectContaining({
        version: "agent_access_compatibility.v1",
        ready: false,
        status: expect.stringMatching(/blocked|partial/),
        checks: expect.arrayContaining([
          expect.objectContaining({ id: "scoped_token", ok: false }),
          expect.objectContaining({ id: "api_standard_package", ok: false }),
          expect.objectContaining({ id: "mcp_standard_package", ok: false }),
        ]),
        summary: expect.objectContaining({
          standardPackageVersion: null,
          apiStandardPackageRequestCount: 0,
          mcpStandardPackageRequestCount: 0,
        }),
      }),
    }));

    const createRes = await request(app)
      .post("/api/memory/api-keys/agent-access")
      .set("authorization", authHeader)
      .send({ expires: "1 year" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.key).toEqual(expect.objectContaining({
      mode: "scoped",
      contentTag: "agent-memory-protocol",
      status: "active",
    }));

    const readyStatus = await request(app)
      .get("/api/memory/agent-access/status")
      .set("authorization", authHeader);

    expect(readyStatus.status).toBe(200);
    expect(readyStatus.body.data.keys).toEqual([
      expect.objectContaining({
        id: createRes.body.key.id,
        contentTag: "agent-memory-protocol",
        endpoints: expect.arrayContaining(["memoryignition_brief", "trace_proof", "mcp_invoke"]),
      }),
    ]);
  });

  it("creates a one-time scoped Codex token that can authenticate MCP", async () => {
    const userId = `u_codex_key_${Date.now()}`;
    const authHeader = `Bearer ${await makeToken(userId)}`;

    const createRes = await request(app)
      .post("/api/memory/api-keys/codex")
      .set("authorization", authHeader)
      .send({ expires: "1 year" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.token).toMatch(/^mk_/);
    expect(createRes.body.key).toEqual(
      expect.objectContaining({
        name: "codex-memoryignition-bridge",
        mode: "scoped",
        contentTag: "codex",
        status: "active",
      }),
    );
    expect(createRes.body.key.endpoints).toEqual(
      expect.arrayContaining(["mcp_invoke", "connector_codex", "retrieve", "resume", "handoff"]),
    );
    expect(createRes.body.setup.commands.join("\n")).toContain("npm run codex:mcp:install");

    const mcpRes = await request(app)
      .get("/api/mcp/tools")
      .set("authorization", `Bearer ${createRes.body.token}`);

    expect(mcpRes.status).toBe(200);
    expect(mcpRes.body).toHaveProperty("ok", true);
    expect(mcpRes.body.data.tools).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "memoryignition_get_brief" })]),
    );

    const blockedRes = await request(app)
      .post("/api/memory/process")
      .set("authorization", `Bearer ${createRes.body.token}`)
      .send({ threadId: "blocked", message: "This should not be allowed by a Codex scoped token." });

    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body).toHaveProperty("error", "API key scope does not allow this endpoint");
  });
});
