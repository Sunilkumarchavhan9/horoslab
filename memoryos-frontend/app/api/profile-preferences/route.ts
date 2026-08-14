import { NextResponse, type NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { ProfilePreferences } from "@/lib/continuity-lab/profile-preferences-storage";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const prefs = (user.unsafeMetadata?.profilePreferences as Partial<ProfilePreferences>) || {};

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Failed to load profile preferences:", error);
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const currentPrefs = (user.unsafeMetadata?.profilePreferences as Partial<ProfilePreferences>) || {};
    const newPrefs = { ...currentPrefs, ...body };

    await client.users.updateUser(userId, {
      unsafeMetadata: {
        ...user.unsafeMetadata,
        profilePreferences: newPrefs,
      },
    });

    return NextResponse.json({ preferences: newPrefs });
  } catch (error) {
    console.error("Failed to patch profile preferences:", error);
    return NextResponse.json({ error: "Failed to patch preferences" }, { status: 500 });
  }
}
