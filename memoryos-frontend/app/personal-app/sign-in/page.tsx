import { auth } from "@clerk/nextjs/server";
import { ClerkPersonalSignIn } from "@/components/auth/clerk-personal-sign-in";
import { PersonalAuthShell } from "@/components/auth/personal-auth-shell";
import { isClerkEnabled } from "@/lib/clerk";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PersonalAppSignInPage() {
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
        <ClerkPersonalSignIn redirectTo="/personal-app" />
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            disabled
            className="flex min-h-[56px] w-full items-center justify-center rounded-[5px] bg-[linear-gradient(180deg,#0a2ba7_0%,#092891_100%)] px-5 text-[16px] font-semibold text-[#F0EFE2]/70"
          >
            Continue with Google
          </button>
          <button
            type="button"
            disabled
            className="flex min-h-[56px] w-full items-center justify-center rounded-[5px] bg-[linear-gradient(180deg,#0a2ba7_0%,#092891_100%)] px-5 text-[16px] font-semibold text-[#F0EFE2]/70"
          >
            Continue with GitHub
          </button>
          <div className="flex items-center justify-center py-2 text-[14px] font-medium tracking-[0.08em] text-[#F0EFE2]/85">
            OR
          </div>
          <input
            type="email"
            suppressHydrationWarning
            placeholder="your@email.com"
            className="h-[56px] w-full rounded-[5px] bg-[#181c22] px-5 text-[17px] text-[#F0EFE2] outline-none placeholder:text-[#8892a2]"
          />
          <button
            type="button"
            disabled
            className="flex min-h-[56px] w-full items-center justify-center rounded-[5px] bg-[linear-gradient(180deg,#314bf4_0%,#0a2ba7_100%)] px-5 text-[16px] font-semibold text-[#F0EFE2]/80"
          >
            Log in to Dhyra
          </button>
          <p className="pt-4 text-center text-[14px] leading-7 text-[#7d8596]">
            By continuing, you agree to our <a href="#" className="underline underline-offset-2">Terms</a> and{" "}
            <a href="#" className="underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
      )}
    </PersonalAuthShell>
  );
}
