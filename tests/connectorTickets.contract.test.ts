import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  zendeskAuthorize: vi.fn(),
  jiraAuthorize: vi.fn(),
}));

vi.mock("@/lib/integrations/zendesk", () => ({
  ZendeskClient: {
    getAuthorizeUrl: mocks.zendeskAuthorize,
    getAccessToken: vi.fn(),
    sync: vi.fn(),
  },
}));

vi.mock("@/lib/integrations/jira", () => ({
  JiraClient: {
    getAuthorizeUrl: mocks.jiraAuthorize,
    getAccessToken: vi.fn(),
    sync: vi.fn(),
  },
}));

import { createMemoryOsApp } from "../server/app";

describe("Ticket connector route contract", () => {
  const app = createMemoryOsApp();
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken("u_connector_ticket_contract")}`;
    mocks.zendeskAuthorize.mockReset();
    mocks.jiraAuthorize.mockReset();
    mocks.zendeskAuthorize.mockReturnValue("https://zendesk.example/authorize");
    mocks.jiraAuthorize.mockReturnValue("https://jira.example/authorize");
  });

  it("enforces plan gate for zendesk connector on Free", async () => {
    const res = await request(app)
      .get("/api/connector/zendesk/authorize")
      .set("authorization", authHeader);
    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty("ok", false);
    expect(res.body).toHaveProperty("error.code", "UPGRADE_REQUIRED");
  });

  it("enforces plan gate for jira connector on Free", async () => {
    const res = await request(app)
      .get("/api/connector/jira/authorize")
      .set("authorization", authHeader);
    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty("ok", false);
    expect(res.body).toHaveProperty("error.code", "UPGRADE_REQUIRED");
  });
});
