import { ClerkConsoleSignIn } from "@/components/auth/clerk-console-sign-in";
import { ConsoleAuthShell } from "@/components/auth/console-auth-shell";
import { isClerkEnabled } from "@/lib/clerk";

export default function DeveloperConsoleSignInPage() {
  const clerkEnabled = isClerkEnabled();

  return (
    <ConsoleAuthShell
      title="Your developer memory layer awaits"
      subtitle="Sign in to access the MemoryOS developer console, API keys, workspace controls, and usage dashboard."
      footerLabel="BUILT FOR DEVELOPER TEAMS USING MEMORYOS"
    >
      {clerkEnabled ? (
        <ClerkConsoleSignIn redirectTo="/developer-console" />
      ) : (
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="h-[44px] w-full border border-[#343434] bg-transparent px-5 text-[16px] text-white outline-none placeholder:text-[#636c77]"
          />
          <button
            type="button"
            disabled
            className="flex h-[42px] w-full items-center justify-center bg-[#1f56aa] px-4 text-[14px] font-medium tracking-[0.08em] text-white/75"
          >
            Configure Clerk to continue
          </button>
          <p className="pt-2 text-[13px] leading-6 text-[#767d87]">
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and Clerk secret keys, then enable
            Google and GitHub providers in Clerk.
          </p>
        </div>
      )}
    </ConsoleAuthShell>
  );
}
