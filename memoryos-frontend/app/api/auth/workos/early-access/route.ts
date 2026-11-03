import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.trim();
    const provider = body?.provider || "email";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    console.info(`[HOROS Early Access] Reserved access for: ${email} (via ${provider})`);

    // In a production setup, this would also queue a transactional email:
    // "Thanks for signing up! We will reach out to you as soon as possible. We will start a launch. When we launch you can access it first."

    return NextResponse.json({
      success: true,
      email,
      message:
        "Thanks for signing up! We will reach out to you as soon as possible. We will start a launch. When we launch you can access it first.",
    });
  } catch (err: any) {
    console.error("[Early Access Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to process registration" },
      { status: 500 }
    );
  }
}

