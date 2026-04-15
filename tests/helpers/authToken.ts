import { SignJWT } from "jose";

export async function makeToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "test-secret");
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .setIssuer(process.env.JWT_ISSUER || "memoryos-test")
    .setAudience(process.env.JWT_AUDIENCE || "memoryos-api")
    .sign(secret);
}
