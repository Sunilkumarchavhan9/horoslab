import { jwtVerify } from "jose";

export interface VerifiedAuth {
  userId: string;
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

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      {
        algorithms: ["HS256"],
        issuer: process.env.JWT_ISSUER || undefined,
        audience: process.env.JWT_AUDIENCE || undefined,
      },
    );

    const sub = payload.sub;
    if (typeof sub !== "string" || sub.length === 0) {
      return null;
    }

    return { userId: sub };
  } catch {
    return null;
  }
}
