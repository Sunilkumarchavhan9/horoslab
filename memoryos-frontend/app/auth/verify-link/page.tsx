import { EmailLinkVerification } from "@/components/auth/email-link-verification"

export const dynamic = "force-dynamic"

function resolveSafeNextDestination(value: string | string[] | undefined): "/personal-app" | "/mission-control" {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate === "/personal-app" ? "/personal-app" : "/mission-control"
}

export default async function AuthVerifyLinkPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const nextDestination = resolveSafeNextDestination(resolvedSearchParams?.next)

  return <EmailLinkVerification completeUrl={nextDestination} signInUrl="/auth/sign-in" surface="dark" />
}
