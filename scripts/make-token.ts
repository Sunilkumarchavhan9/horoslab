import "dotenv/config";
import { SignJWT } from "jose";

async function main(): Promise<void> {
  const sub = process.argv[2] || "u_demo_1";

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuer(process.env.JWT_ISSUER || "memoryos")
    .setAudience(process.env.JWT_AUDIENCE || "memoryos-api")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  console.log(token);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
