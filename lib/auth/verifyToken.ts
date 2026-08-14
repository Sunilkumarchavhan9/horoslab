import { jwtVerify } from "jose";
import { verifyApiKeyToken } from "./apiKeyStore";

export interface VerifiedAuth {
  userId: string;
  orgId?: string;
  apiKeyId?: string;
  apiKeyMode?: "full" | "scoped";
  apiKeyEndpoints?: string[];
  apiKeyContentTag?: string;
}

function readBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.trim().split(/\s+/);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;

  return token;
}

export async function verifyAuthorizationHeader(
  authHeader: string | undefined,
): Promise<VerifiedAuth | null> {
  const token = readBearerToken(authHeader);
  if (!token) return null;

  const apiKeyAuth = await verifyApiKeyToken(token);
  if (apiKeyAuth) {
    return {
      userId: apiKeyAuth.userId,
      apiKeyId: apiKeyAuth.keyId,
      apiKeyMode: apiKeyAuth.mode,
      apiKeyEndpoints: apiKeyAuth.endpoints,
      apiKeyContentTag: apiKeyAuth.contentTag,
    };
  }

  const secret = process.env.MEMORYOS_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing MEMORYOS_JWT_SECRET or JWT_SECRET");
  }

  try {
    const issuer =
      process.env.MEMORYOS_JWT_ISSUER ??
      process.env.JWT_ISSUER ??
      undefined;
    const audience =
      process.env.MEMORYOS_JWT_AUDIENCE ??
      process.env.JWT_AUDIENCE ??
      undefined;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      {
        algorithms: ["HS256"],
        issuer,
        audience,
      },
    );

    const sub = payload.sub;
    if (typeof sub !== "string" || sub.length === 0) {
      return null;
    }

    const orgId = typeof payload.orgId === "string" && payload.orgId.trim()
      ? payload.orgId.trim()
      : undefined;

    return { userId: sub, orgId };
  } catch {
    return null;
  }
}
