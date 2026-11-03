import { NextRequest, NextResponse } from "next/server";
import { sendEarlyAccessConfirmationEmail } from "@/lib/email-service";

async function capturePostHogServerEvent(email: string, provider: string, name?: string) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!posthogKey) return;

  try {
    await fetch(`${posthogHost}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: posthogKey,
        event: "user_signed_up",
        distinct_id: email,
        properties: {
          email,
          provider,
          name: name || undefined,
          signup_provider: provider,
          plan: "early_access",
          server_side: true,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    console.warn("[PostHog Server Capture Error]", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.trim();
    const name = body?.name?.trim();
    const provider = body?.provider || "email";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // 1. Send confirmation email and persist in signups database
    const result = await sendEarlyAccessConfirmationEmail({
      email,
      name,
      provider,
    });

    // 2. Server-side PostHog capture (bypasses browser ad-blockers & Brave shields)
    await capturePostHogServerEvent(email, provider, name);

    return NextResponse.json({
      success: true,
      email,
      provider,
      delivered: !result.simulated,
      messageId: result.messageId,
      message:
        "Thanks for signing up! We will reach out to you as soon as possible. We will start a launch. When we launch you can access it first.",
    });
  } catch (error: any) {
    console.error("[Notify Signup Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process signup notification" },
      { status: 500 }
    );
  }
}
