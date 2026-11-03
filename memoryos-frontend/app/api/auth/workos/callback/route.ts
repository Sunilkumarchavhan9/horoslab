import { NextRequest, NextResponse } from "next/server";
import { workos, WORKOS_CLIENT_ID, isWorkOSEnabled } from "@/lib/workos";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const origin = request.nextUrl.origin;

  if (error || !code) {
    console.warn("[WorkOS Callback] Callback received error or missing code:", error);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error || "missing_code")}`);
  }

  if (!isWorkOSEnabled()) {
    return NextResponse.redirect(`${origin}/?signed_up=true`);
  }

  try {
    const authenticateResponse = await workos.userManagement.authenticateWithCode({
      code,
      clientId: WORKOS_CLIENT_ID,
    });

    const user = authenticateResponse.user;
    const email = user?.email || "";
    const firstName = user?.firstName || "";

    console.info(`[WorkOS Auth Success] User authenticated: ${email} (${firstName})`);

    // In a full session setup, we could set a session cookie here.
    // Redirect back to landing page with signed_up=true so the sleek modal/toast indicates access reserved.
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set("signed_up", "true");
    if (email) {
      redirectUrl.searchParams.set("email", email);
    }

    const response = NextResponse.redirect(redirectUrl.toString());

    // Set a lightweight cookie marking early access confirmed
    response.cookies.set("horos_early_access", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    console.error("[WorkOS Callback Error]", err);
    return NextResponse.redirect(`${origin}/?signed_up=true`);
  }
}

