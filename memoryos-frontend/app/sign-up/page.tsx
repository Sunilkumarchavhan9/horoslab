import { auth } from "@clerk/nextjs/server";
import { ClerkConsoleSignUp } from "@/components/auth/clerk-console-sign-up";
import { ConsoleAuthShell } from "@/components/auth/console-auth-shell";
import { isClerkEnabled } from "@/lib/clerk";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const clerkEnabled = isClerkEnabled();

  if (clerkEnabled) {
    const { userId } = await auth();

    if (userId) {
      redirect("/developer-console");
    }
  }

  return (
    <ConsoleAuthShell
      title="Create your MemoryOS access"
      subtitle="Finish account creation here, then continue directly into the developer console onboarding flow."
      footerLabel="MEMORYOS ACCOUNT SETUP"
    >
      {clerkEnabled ? (
        <ClerkConsoleSignUp redirectTo="/developer-console" />
      ) : (
        <div className="space-y-4">
          <p className="text-[14px] leading-6 text-[#767d87]">
            Configure Clerk to continue sign-up in the app.
          </p>
        </div>
      )}
    </ConsoleAuthShell>
  );
}
