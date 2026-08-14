import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  zendeskAuthorize: vi.fn(),
  jiraAuthorize: vi.fn(),
  linearAuthorize: vi.fn(),
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

vi.mock("@/lib/integrations/linear", () => ({
  LinearClient: {
    getAuthorizeUrl: mocks.linearAuthorize,
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
    mocks.linearAuthorize.mockReset();
    mocks.zendeskAuthorize.mockReturnValue("https://zendesk.example/authorize");
    mocks.jiraAuthorize.mockReturnValue("https://jira.example/authorize");
    mocks.linearAuthorize.mockReturnValue("https://linear.example/authorize");
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

  it("allows linear connector on Free for engineering continuity MVP", async () => {
    const originalLinearClientId = process.env.LINEAR_CLIENT_ID;
    process.env.LINEAR_CLIENT_ID = "linear-client";

    try {
      const res = await request(app)
        .get("/api/connector/linear/authorize")
        .set("authorization", authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.authorizeUrl).toBe("https://linear.example/authorize");
      expect(mocks.linearAuthorize).toHaveBeenCalled();
    } finally {
      process.env.LINEAR_CLIENT_ID = originalLinearClientId;
    }
  });

  it("does not leak same-origin into local mock OAuth callback URLs", async () => {
    const originalGitHubClientId = process.env.GITHUB_CLIENT_ID;
    const originalGitHubClientSecret = process.env.GITHUB_CLIENT_SECRET;
    const originalApiOrigin = process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN;
    const originalCallbackUrl = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    process.env.GITHUB_CLIENT_ID = "";
    process.env.GITHUB_CLIENT_SECRET = "";
    process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN = "same-origin";
    process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL = "http://localhost:3000/api/connector/callback";

    try {
      const res = await request(app)
        .get("/api/connector/github/authorize")
        .set("authorization", authHeader)
        .set("x-memoryos-frontend-origin", "http://localhost:3000");

      expect(res.status).toBe(200);
      const authorizeUrl = String(res.body.data.authorizeUrl);
      expect(authorizeUrl).toContain("http://localhost:3000/api/connector/callback");
      expect(authorizeUrl).toContain("mock_demo_code");
      expect(authorizeUrl).not.toContain("same-origin");
    } finally {
      process.env.GITHUB_CLIENT_ID = originalGitHubClientId;
      process.env.GITHUB_CLIENT_SECRET = originalGitHubClientSecret;
      process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN = originalApiOrigin;
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL = originalCallbackUrl;
    }
  });
});
