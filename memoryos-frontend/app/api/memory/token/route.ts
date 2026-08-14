import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SignJWT } from "jose";
import { isClerkEnabled } from "@/lib/clerk";

export async function GET(): Promise<NextResponse> {
  let userId: string | null = null;

  if (isClerkEnabled()) {
    const authState = await auth();
    userId = authState.userId;
    if (!userId && process.env.NODE_ENV === "development") {
      userId = process.env.MEMORYOS_DEV_USER_ID?.trim() || "user-demo";
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    userId = process.env.MEMORYOS_DEV_USER_ID?.trim() || "user-demo";
  }

  const secret = process.env.MEMORYOS_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing MEMORYOS_JWT_SECRET or JWT_SECRET" },
      { status: 500 },
    );
  }

  const issuer =
    process.env.MEMORYOS_JWT_ISSUER ??
    process.env.JWT_ISSUER ??
    "memoryos";
  const audience =
    process.env.MEMORYOS_JWT_AUDIENCE ??
    process.env.JWT_AUDIENCE ??
    "memoryos-api";

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
