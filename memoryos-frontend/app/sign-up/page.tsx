import { auth } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/clerk";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const clerkEnabled = isClerkEnabled();

  if (clerkEnabled) {
    const { userId } = await auth();

    if (userId) {
      redirect("/mission-control");
    }

    redirect("/auth/sign-up");
  }

  redirect("/personal-app/sign-up");
}
