import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClerkPersonalSignUp } from "@/components/auth/clerk-personal-sign-up";
import { PersonalAuthShell } from "@/components/auth/personal-auth-shell";
import { isClerkEnabled } from "@/lib/clerk";

export default async function PersonalAppSignUpPage() {
  const clerkEnabled = isClerkEnabled();

  if (clerkEnabled) {
    const { userId } = await auth();
    if (userId) {
      redirect("/personal-app");
    }
  }

  return (
    <PersonalAuthShell>
      {clerkEnabled ? (
        <ClerkPersonalSignUp redirectTo="/personal-app" />
      ) : (
        <div className="space-y-4">
          <p className="text-[14px] leading-6 text-[#9aa4b2]">
            Configure Clerk to continue sign-up in the app.
          </p>
        </div>
      )}
    </PersonalAuthShell>
  );
}
