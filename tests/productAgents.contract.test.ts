import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import {
  MEMORYOS_AGENT_ID_HEADER,
  MEMORYOS_AGENT_SESSION_HEADER,
  extractAgentLineageFromPayload,
} from "../lib/agents/agentLineage";
import {
  getProductAgent,
  listProductAgents,
} from "../lib/agents/productAgents";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import { getExecutionProposal } from "../lib/companyBrain/executionProposalStore";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import { prisma } from "../lib/storage/prismaClient";

describe("Product agents contract (P2.3)", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_product_agents_contract";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(authUserId)}`;
    await prisma.productAgentSession.deleteMany({ where: { userId: authUserId } });
    await prisma.companyBrainExecutionProposal.deleteMany({ where: { userId: authUserId } });
    await prisma.operationalLoop.deleteMany({ where: { userId: authUserId } });
  });

  it("exposes three scoped product agents in the registry", () => {
    const agents = listProductAgents();
    expect(agents).toHaveLength(3);
    expect(getProductAgent("memory-engineer")?.allowedTools.length).toBeGreaterThan(0);
    expect(getProductAgent("engineering-continuity")?.allowedTools).toContain("memory.handoff");
    expect(getProductAgent("ide-context")?.allowedTools.some((tool) => tool.includes("resume/prompt"))).toBe(
      true,
    );
  });

  it("GET /api/agent/registry returns agents", async () => {
    const res = await request(app)
      .get("/api/agent/registry")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    const agents = res.body.data?.agents ?? res.body.agents;
    expect(agents).toHaveLength(3);
    expect(agents.map((agent: { id: string }) => agent.id)).toContain("engineering-continuity");
  });

  it("POST /api/agent/sessions starts a session with agent metadata", async () => {
    const res = await request(app)
      .post("/api/agent/sessions")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_product_agents")
      .send({
        agentId: "engineering-continuity",
        projectId: "memoryos",
        goal: "Ship native product agents v1",
      });

    expect(res.status).toBe(201);
    const sessionId = (res.body.data?.sessionId ?? res.body.sessionId) as string;
    expect(sessionId).toMatch(/^pa_sess_/);
    expect(res.body.data?.agent?.id ?? res.body.agent?.id).toBe("engineering-continuity");

    const getRes = await request(app)
      .get(`/api/agent/sessions/${sessionId}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_product_agents");

    expect(getRes.status).toBe(200);
    expect(getRes.body.data?.session?.id ?? getRes.body.session?.id).toBe(sessionId);
    expect(typeof (getRes.body.data?.linkedProposalsCount ?? getRes.body.linkedProposalsCount)).toBe(
      "number",
    );
  });

  it("stores agent lineage on execution proposals from headers", async () => {
    const sessionRes = await request(app)
      .post("/api/agent/sessions")
      .set("authorization", authHeader)
      .send({ agentId: "memory-engineer", projectId: "memoryos" });

    const sessionId = (sessionRes.body.data?.sessionId ?? sessionRes.body.sessionId) as string;

    const proposeRes = await request(app)
      .post("/api/company-brain/execution/propose")
      .set("authorization", authHeader)
      .set(MEMORYOS_AGENT_ID_HEADER, "memory-engineer")
      .set(MEMORYOS_AGENT_SESSION_HEADER, sessionId)
      .send({
        adapter: "generic",
        actionType: "noop",
        payload: {},
        riskTier: "medium",
      });

    expect(proposeRes.status).toBe(201);
    const proposalId = proposeRes.body.proposal.id as string;
    const proposal = await getExecutionProposal(authUserId, proposalId);
    expect(proposal).not.toBeNull();

    const lineage = extractAgentLineageFromPayload(proposal!.payload);
    expect(lineage.agentId).toBe("memory-engineer");
    expect(lineage.sessionId).toBe(sessionId);
  });
});
