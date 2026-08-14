import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { MEMORYOS_ORG_ID_HEADER } from "../lib/auth/orgScope";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";

describe("Continuity feedback API", () => {
  const app = createMemoryOsApp();
  const userId = "u_continuity_feedback";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(userId)}`;
  });

  it("captures resume/handoff quality feedback inside the current org", async () => {
    const createRes = await request(app)
      .post("/api/memory/continuity-feedback")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_feedback_alpha")
      .send({
        kind: "resume",
        rating: 5,
        useful: true,
        project: "MemoryOS",
        requestId: "req_phase1_feedback",
        missingContext: ["Need recent Slack incident thread"],
        shouldRemember: ["Include required phase gate commands in future briefs"],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.feedback).toMatchObject({
      userId,
      orgId: "org_feedback_alpha",
      kind: "resume",
      rating: 5,
      useful: true,
      project: "MemoryOS",
    });

    const sameOrg = await request(app)
      .get("/api/memory/continuity-feedback")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_feedback_alpha");

    expect(sameOrg.status).toBe(200);
    expect(sameOrg.body.data.feedback.some((item: { id: string }) => item.id === createRes.body.data.feedback.id)).toBe(true);
    expect(sameOrg.body.data.summary.count).toBeGreaterThanOrEqual(1);
    expect(sameOrg.body.data.summary.averageRating).toBeGreaterThanOrEqual(1);

    const crossOrg = await request(app)
      .get("/api/memory/continuity-feedback")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_feedback_beta");

    expect(crossOrg.status).toBe(200);
    expect(crossOrg.body.data.feedback.some((item: { id: string }) => item.id === createRes.body.data.feedback.id)).toBe(false);
  });

  it("rejects malformed feedback", async () => {
    const res = await request(app)
      .post("/api/memory/continuity-feedback")
      .set("authorization", authHeader)
      .set(MEMORYOS_ORG_ID_HEADER, "org_feedback_alpha")
      .send({ kind: "resume", rating: 9 });

    expect(res.status).toBe(400);
  });
});
