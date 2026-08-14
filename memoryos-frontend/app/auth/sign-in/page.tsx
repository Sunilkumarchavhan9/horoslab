import { auth } from "@clerk/nextjs/server"
import { ConsoleAuthShell } from "@/components/auth/console-auth-shell"
import { ClerkConsoleSignIn } from "@/components/auth/clerk-console-sign-in"
import { isClerkEnabled } from "@/lib/clerk"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

function resolveSafeNextDestination(value: string | string[] | undefined): "/personal-app" | "/mission-control" {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate === "/personal-app" ? "/personal-app" : "/mission-control"
}

export default async function AuthSignInPage({
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
      title="Sign in to Epoch"
      subtitle="Sign in and continue to your workspace."
      footerLabel="Epoch"
    >
      {clerkEnabled ? (
        <ClerkConsoleSignIn
          redirectTo={nextDestination}
          emailLinkCompleteUrl={`/auth/verify-link?next=${encodeURIComponent(nextDestination)}`}
        />
      ) : (
        <div className="space-y-3 text-[14px] leading-7 text-[#9ca5b0]">
          <p>Clerk is disabled in this environment.</p>
          <p>Enable Clerk to continue with the sign-in flow.</p>
        </div>
      )}
    </ConsoleAuthShell>
  )
}
