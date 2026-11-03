import { NextRequest, NextResponse } from "next/server";
import {
  workos,
  WORKOS_CLIENT_ID,
  isWorkOSEnabled,
  getWorkOSProviderName,
  WorkOSOAuthProvider,
} from "@/lib/workos";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as WorkOSOAuthProvider | null;
  const directRedirect = searchParams.get("redirect") === "true";
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/workos/callback`;

  if (!isWorkOSEnabled()) {
    return NextResponse.json({
      enabled: false,
      message:
        "WorkOS is configured in development mode. Add WORKOS_API_KEY and WORKOS_CLIENT_ID to .env.local for live enterprise authentication.",
    });
  }

  try {
    let authUrl: string;

    if (provider && ["google", "github", "linkedin"].includes(provider)) {
      const workosProvider = getWorkOSProviderName(provider);
      authUrl = workos.userManagement.getAuthorizationUrl({
        clientId: WORKOS_CLIENT_ID,
        redirectUri,
        provider: workosProvider,
        screenHint: "sign-up",
      });
    } else {
      authUrl = workos.userManagement.getAuthorizationUrl({
        clientId: WORKOS_CLIENT_ID,
        redirectUri,
        provider: "authkit",
        screenHint: "sign-up",
      });
    }

    if (directRedirect) {
      return NextResponse.redirect(authUrl);
    }

    return NextResponse.json({
      enabled: true,
      url: authUrl,
    });
  } catch (error: any) {
    console.error("[WorkOS Authorize Error]", error);
    return NextResponse.json(
      {
        enabled: false,
        error: error?.message || "Failed to generate WorkOS authorization URL",
      },
      { status: 500 }
    );
  }
}

