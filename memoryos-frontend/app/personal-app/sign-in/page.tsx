import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClerkPersonalSignIn } from "@/components/auth/clerk-personal-sign-in";
import { PersonalAuthShell } from "@/components/auth/personal-auth-shell";
import { isClerkEnabled } from "@/lib/clerk";

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
            className="flex min-h-[56px] w-full items-center justify-center rounded-[16px] border border-[#0b3a72] bg-[linear-gradient(180deg,#062a58_0%,#07244a_100%)] px-5 text-[16px] font-semibold text-white/70"
          >
            Continue with Google
          </button>
          <button
            type="button"
            disabled
            className="flex min-h-[56px] w-full items-center justify-center rounded-[16px] border border-[#0b3a72] bg-[linear-gradient(180deg,#062a58_0%,#07244a_100%)] px-5 text-[16px] font-semibold text-white/70"
          >
            Continue with GitHub
          </button>
          <div className="flex items-center justify-center py-2 text-[14px] font-medium tracking-[0.08em] text-white/85">
            OR
          </div>
          <input
            type="email"
            placeholder="your@email.com"
            className="h-[56px] w-full rounded-[16px] border border-white/7 bg-[#08101b] px-5 text-[17px] text-white outline-none placeholder:text-[#667085]"
          />
          <button
            type="button"
            disabled
            className="flex min-h-[56px] w-full items-center justify-center rounded-[16px] border border-[#5b7fff] bg-[linear-gradient(180deg,#4d6cff_0%,#3928ff_100%)] px-5 text-[16px] font-semibold text-white/80"
          >
            Continue with MemoryOS
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
