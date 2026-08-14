import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function GET(): Promise<NextResponse> {
  const userId = process.env.MEMORYOS_DEV_USER_ID?.trim() || "user-demo";

  const secret = process.env.MEMORYOS_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing MEMORYOS_JWT_SECRET or JWT_SECRET" },
      { status: 500 },
    );
  }

  const issuer = process.env.MEMORYOS_JWT_ISSUER ?? process.env.JWT_ISSUER ?? "memoryos";
  const audience =
    process.env.MEMORYOS_JWT_AUDIENCE ?? process.env.JWT_AUDIENCE ?? "memoryos-api";

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  return NextResponse.json(
    { token, userId },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
