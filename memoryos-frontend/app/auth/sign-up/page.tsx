import { auth } from "@clerk/nextjs/server"
import { ConsoleAuthShell } from "@/components/auth/console-auth-shell"
import { ClerkConsoleSignUp } from "@/components/auth/clerk-console-sign-up"
import { isClerkEnabled } from "@/lib/clerk"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

function resolveSafeNextDestination(value: string | string[] | undefined): "/personal-app" | "/mission-control" {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate === "/personal-app" ? "/personal-app" : "/mission-control"
}

export default async function AuthSignUpPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const nextDestination = resolveSafeNextDestination(resolvedSearchParams?.next)
  const clerkEnabled = isClerkEnabled()

  if (clerkEnabled) {
    const { userId } = await auth()
    if (userId) {
      redirect(nextDestination)
    }
  }

  return (
    <ConsoleAuthShell
      title="Create your HOROS account"
      subtitle="Join the workspace, connect your tools, and continue to Mission Control."
      footerLabel="HOROS"
    >
      {clerkEnabled ? (
        <ClerkConsoleSignUp
          redirectTo={nextDestination}
          emailLinkCompleteUrl={`/auth/verify-link?next=${encodeURIComponent(nextDestination)}`}
        />
      ) : (
        <div className="space-y-3 text-[14px] leading-7 text-[#9ca5b0]">
          <p>Clerk is disabled in this environment.</p>
          <p>Enable Clerk to continue with the sign-up flow.</p>
        </div>
      )}
    </ConsoleAuthShell>
  )
}
