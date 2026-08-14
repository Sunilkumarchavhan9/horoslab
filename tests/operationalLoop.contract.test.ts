import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import { prisma } from "../lib/storage/prismaClient";
import {
  getOperationalLoop,
  listOperationalLoops,
} from "../lib/companyBrain/operationalLoopStore";

describe("Operational loop contract (P2.1)", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_operational_loop_contract";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(authUserId)}`;
    await prisma.operationalLoop.deleteMany({ where: { userId: authUserId } });
    await prisma.companyBrainExecutionProposal.deleteMany({ where: { userId: authUserId } });
  });

  it("creates loop via POST /api/company-brain/loops", async () => {
    const res = await request(app)
      .post("/api/company-brain/loops")
      .set("authorization", authHeader)
      .send({ goal: "Ship continuity loop v1", projectId: "memoryos" });

    expect(res.status).toBe(201);
    expect(res.body.loop.goal).toBe("Ship continuity loop v1");
    expect(res.body.loop.currentState).toBe("goal_set");
    expect(res.body.loop.projectId).toBe("memoryos");
  });

  it("lists and gets loops org-scoped", async () => {
    await request(app)
      .post("/api/company-brain/loops")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_loop_alpha")
      .send({ goal: "Alpha org loop" });

    await request(app)
      .post("/api/company-brain/loops")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_loop_beta")
      .send({ goal: "Beta org loop" });

    const listAlpha = await request(app)
      .get("/api/company-brain/loops")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_loop_alpha");

    expect(listAlpha.status).toBe(200);
    expect(listAlpha.body.loops).toHaveLength(1);
    expect(listAlpha.body.loops[0].goal).toBe("Alpha org loop");

    const loopId = listAlpha.body.loops[0].id as string;
    const getRes = await request(app)
      .get(`/api/company-brain/loops/${loopId}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_loop_alpha");

    expect(getRes.status).toBe(200);
    expect(getRes.body.loop.id).toBe(loopId);

    const crossOrg = await request(app)
      .get(`/api/company-brain/loops/${loopId}`)
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_loop_beta");

    expect(crossOrg.status).toBe(404);
  });

  it("transitions loop on propose → review → execute with goal", async () => {
    const proposeRes = await request(app)
      .post("/api/company-brain/execution/propose")
      .set("authorization", authHeader)
      .send({
        adapter: "generic",
        actionType: "noop",
        goal: "Post release note to team channel",
        projectId: "memoryos",
        payload: {},
        riskTier: "medium",
      });

    expect(proposeRes.status).toBe(201);
    const proposalId = proposeRes.body.proposal.id as string;

    const loopsAfterPropose = await listOperationalLoops(authUserId, { limit: 10 });
    expect(loopsAfterPropose).toHaveLength(1);
    expect(loopsAfterPropose[0].currentState).toBe("awaiting_approval");
    expect(loopsAfterPropose[0].linkedProposalIds).toContain(proposalId);

    const reviewRes = await request(app)
      .post("/api/company-brain/execution/review")
      .set("authorization", authHeader)
      .send({ proposalId, decision: "approve" });

    expect(reviewRes.status).toBe(200);
    const loopAfterApprove = await getOperationalLoop(authUserId, loopsAfterPropose[0].id);
    expect(loopAfterApprove?.currentState).toBe("executing");

    const executeRes = await request(app)
      .post("/api/company-brain/execution/execute")
      .set("authorization", authHeader)
      .send({ proposalId });

    expect(executeRes.status).toBe(200);
    const loopAfterExecute = await getOperationalLoop(authUserId, loopsAfterPropose[0].id);
    expect(loopAfterExecute?.currentState).toBe("rolled_back");
    expect(loopAfterExecute?.linkedProposalIds).toContain(proposalId);
    expect(loopAfterExecute?.metadata?.driftReport).toBeTruthy();
  });

  it("marks loop failed when proposal is rejected", async () => {
    const proposeRes = await request(app)
      .post("/api/company-brain/execution/propose")
      .set("authorization", authHeader)
      .send({
        adapter: "generic",
        actionType: "noop",
        goal: "Rejected path",
        payload: {},
        riskTier: "high",
      });

    const proposalId = proposeRes.body.proposal.id as string;
    await request(app)
      .post("/api/company-brain/execution/review")
      .set("authorization", authHeader)
      .send({ proposalId, decision: "reject", rejectionReason: "Not now" });

    const loops = await listOperationalLoops(authUserId, { limit: 5 });
    const loop = loops.find((entry) => entry.goal === "Rejected path");
    expect(loop?.currentState).toBe("failed");
  });
});
