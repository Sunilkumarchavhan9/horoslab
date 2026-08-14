import { auth } from "@clerk/nextjs/server";
import { SignJWT } from "jose";
import { isClerkEnabled } from "@/lib/clerk";
import { normalizeOrgId } from "@/lib/org-scope-server";

type BackendAuthScope = {
  userId: string;
  orgId?: string;
};

function getDevUserId(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  return process.env.MEMORYOS_DEV_USER_ID?.trim() || "user-demo";
}

function getDevOrgId(): string | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  return normalizeOrgId(process.env.MEMORYOS_DEV_ORG_ID);
}

async function resolveProxyAuthScope(): Promise<BackendAuthScope | null> {
  if (isClerkEnabled()) {
    const authState = await auth();
    if (authState.userId) {
      return {
        userId: authState.userId,
        orgId: normalizeOrgId(authState.orgId),
      };
    }
  }
  const devUserId = getDevUserId();
  if (!devUserId) return null;
  return {
    userId: devUserId,
    orgId: getDevOrgId(),
  };
}

export async function createBackendAuthHeader(): Promise<string | null> {
  const scope = await resolveProxyAuthScope();

  const secret = process.env.MEMORYOS_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!scope?.userId || !secret) return null;

  const issuer =
    process.env.MEMORYOS_JWT_ISSUER ?? process.env.JWT_ISSUER ?? "memoryos";
  const audience =
    process.env.MEMORYOS_JWT_AUDIENCE ?? process.env.JWT_AUDIENCE ?? "memoryos-api";

  const claims = scope.orgId ? { orgId: scope.orgId } : {};
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(scope.userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(secret));

  return `Bearer ${token}`;
}
