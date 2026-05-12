/**
 * Next.js instrumentation hook — runs once when the server starts.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Used here to validate that the JWT secret env vars are present so the
 * /api/memory/token route can sign tokens that the backend will accept.
 * A clear error at startup is far easier to debug than silent 401s later.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const secret =
    process.env.MEMORYOS_JWT_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim();

  if (!secret) {
    console.error(
      "\n" +
      "╔══════════════════════════════════════════════════════════════╗\n" +
      "║  MemoryOS  ·  MISSING JWT SECRET                            ║\n" +
      "╠══════════════════════════════════════════════════════════════╣\n" +
      "║  Neither MEMORYOS_JWT_SECRET nor JWT_SECRET is set in       ║\n" +
      "║  the root .env file (or process environment).               ║\n" +
      "║                                                              ║\n" +
      "║  The /api/memory/token route needs this to sign tokens,     ║\n" +
      "║  and it MUST match the JWT_SECRET in the root .env file     ║\n" +
      "║  that the backend reads.                                     ║\n" +
      "║                                                              ║\n" +
      "║  Add to root .env:                                           ║\n" +
      "║    MEMORYOS_JWT_SECRET=<same value as root .env JWT_SECRET> ║\n" +
      "╚══════════════════════════════════════════════════════════════╝\n"
    );
  } else {
    // Only log in development so production stays quiet.
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[MemoryOS] JWT secret loaded (${secret.length} chars). Token signing ready.`
      );
    }
  }

  const backendOrigin =
    process.env.MEMORYOS_API_ORIGIN?.trim() || "http://localhost:3001";

  if (process.env.NODE_ENV === "development") {
    console.log(`[MemoryOS] API proxy target → ${backendOrigin}`);
  }
}
