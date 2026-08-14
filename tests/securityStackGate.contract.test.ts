import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { makeToken } from "./helpers/authToken";
import { verifyAuthorizationHeader } from "../lib/auth/verifyToken";
import { requireAuth } from "../server/middleware/auth";

function makeRequest(authHeader: string, spoofedOrgId?: string): Request {
  const headers = new Map<string, string>();
  headers.set("authorization", authHeader);
  if (spoofedOrgId) headers.set("x-memoryos-org-id", spoofedOrgId);

  return {
    header: (name: string) => headers.get(name.toLowerCase()),
    path: "/summary",
    baseUrl: "/api/overview",
  } as Request;
}

function makeResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("security stack auth gate", () => {
  it("verifies signed org scope from backend JWTs", async () => {
    const token = await makeToken("u_security_scope", "org_signed");

    await expect(verifyAuthorizationHeader(`Bearer ${token}`)).resolves.toMatchObject({
      userId: "u_security_scope",
      orgId: "org_signed",
    });
  });

  it("does not let a raw org header override signed org scope", async () => {
    const token = await makeToken("u_security_scope", "org_signed");
    const req = makeRequest(`Bearer ${token}`, "org_spoofed");
    const res = makeResponse();
    const next: NextFunction = vi.fn();

    await requireAuth(req, res, next);

    expect(req.authUserId).toBe("u_security_scope");
    expect(req.authOrgId).toBe("org_signed");
    expect(next).toHaveBeenCalledOnce();
  });
});
