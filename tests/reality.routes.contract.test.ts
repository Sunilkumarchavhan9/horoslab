import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import { RealityRuntime } from "../lib/reality/realityRuntime";
import { resetRealityStoreForTests } from "../lib/reality/realityRuntime";

describe("Reality API Route Contracts", () => {
  const app = createMemoryOsApp();
  let authHeader = "";

  beforeEach(async () => {
    resetRealityStoreForTests();
    authHeader = `Bearer ${await makeToken("u_reality_contract")}`;
  });

  it("returns the seeded backend status and graph", async () => {
    const statusRes = await request(app)
      .get("/api/reality/status")
      .set("authorization", authHeader);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.ok).toBe(true);
    expect(statusRes.body.data.status.backend).toBe("reality-fabric");
    expect(statusRes.body.data.status.version).toBe("reality-runtime.v1");
    expect(statusRes.body.data.status.nodes).toBeGreaterThan(0);
    expect(statusRes.body.data.status.edges).toBeGreaterThan(0);

    const nodesRes = await request(app)
      .get("/api/reality/nodes")
      .set("authorization", authHeader);
    expect(nodesRes.status).toBe(200);
    expect(nodesRes.body.ok).toBe(true);
    expect(nodesRes.body.data.nodes.length).toBeGreaterThan(0);
    expect(nodesRes.body.data.nodes.some((node: { id: string }) => node.id === "reality-fabric")).toBe(true);

    const graphRes = await request(app)
      .get("/api/reality/graph")
      .set("authorization", authHeader);
    expect(graphRes.status).toBe(200);
    expect(graphRes.body.data.nodes.length).toBeGreaterThan(0);
    expect(graphRes.body.data.edges.length).toBeGreaterThan(0);
    expect(graphRes.body.data.events.length).toBeGreaterThan(0);
  });

  it("exposes node neighborhoods and shortest-path hints", async () => {
    const nodeRes = await request(app)
      .get("/api/reality/nodes/reality-fabric")
      .set("authorization", authHeader);
    expect(nodeRes.status).toBe(200);
    expect(nodeRes.body.data.node.id).toBe("reality-fabric");
    expect(nodeRes.body.data.neighbors.length).toBeGreaterThan(0);
    expect(nodeRes.body.data.pathHints.length).toBeGreaterThan(0);
  });

  it("allows authenticated graph writes and event appends", async () => {
    const nodeRes = await request(app)
      .post("/api/reality/nodes")
      .set("authorization", authHeader)
      .send({
        type: "service",
        name: "Decision Engine",
        metadata: { owner: "epoch" },
      });
    expect(nodeRes.status).toBe(201);
    expect(nodeRes.body.data.node.name).toBe("Decision Engine");

    const edgeRes = await request(app)
      .post("/api/reality/edges")
      .set("authorization", authHeader)
      .send({
        from: "reality-fabric",
        to: nodeRes.body.data.node.id,
        relationship: "routes",
        confidence: 0.88,
      });
    expect(edgeRes.status).toBe(201);
    expect(edgeRes.body.data.edge.relationship).toBe("routes");

    const eventRes = await request(app)
      .post("/api/reality/events")
      .set("authorization", authHeader)
      .send({
        nodeId: "reality-fabric",
        type: "graph_projection_refreshed",
        payload: { projection: "graph" },
        source: "system",
      });
    expect(eventRes.status).toBe(201);
    expect(eventRes.body.data.event.type).toBe("graph_projection_refreshed");

    const nodeLookup = await request(app)
      .get(`/api/reality/nodes/${nodeRes.body.data.node.id}`)
      .set("authorization", authHeader);
    expect(nodeLookup.status).toBe(200);
    expect(nodeLookup.body.data.neighbors.some((entry: { node: { id: string } }) => entry.node.id === "reality-fabric")).toBe(true);
  });

  it("returns evidence-backed query answers and evidence records", async () => {
    RealityRuntime.createNode({
      type: "service",
      name: "Auth Service",
      metadata: { area: "authentication" },
    });
    const evidence = RealityRuntime.recordEvidence({
      nodeId: "auth-service",
      title: "Authentication migration decision",
      summary: "GitHub and Slack agreed to migrate the auth layer to RuntimeBase.",
      sourceConnector: "github",
      sourceId: "acme/memoryos#22",
      author: "sunil",
      workspace: "u_reality_contract",
      confidence: 0.97,
      sourceUrl: "https://github.com/acme/memoryos/pull/22",
      metadata: { topic: "authentication" },
    });

    const queryRes = await request(app)
      .post("/api/reality/query")
      .set("authorization", authHeader)
      .send({ question: "Why was authentication changed?" });

    expect(queryRes.status).toBe(200);
    expect(queryRes.body.ok).toBe(true);
    expect(queryRes.body.data.result.answer).toContain("evidence");
    expect(queryRes.body.data.result.evidence.length).toBeGreaterThan(0);
    expect(queryRes.body.data.result.evidence[0]).toMatchObject({
      id: evidence.id,
      sourceConnector: "github",
      sourceUrl: "https://github.com/acme/memoryos/pull/22",
    });

    const evidenceRes = await request(app)
      .get(`/api/reality/evidence/${evidence.id}`)
      .set("authorization", authHeader);

    expect(evidenceRes.status).toBe(200);
    expect(evidenceRes.body.data.evidence).toMatchObject({
      id: evidence.id,
      nodeId: "auth-service",
      sourceConnector: "github",
    });
  });
});
