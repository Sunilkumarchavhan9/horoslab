"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trackSignup } from "@/lib/posthog";

type OAuthCallbackHandlerProps = {
  completeUrl: string;
  signInUrl: string;
  signUpUrl: string;
  continueSignUpUrl: string;
  accountExistsRedirectUrl?: string;
  errorRedirectUrl?: string;
  surface?: "dark" | "light";
};

export function OAuthCallbackHandler({
  completeUrl,
  signInUrl,
  signUpUrl,
  continueSignUpUrl,
  accountExistsRedirectUrl,
  errorRedirectUrl,
}: OAuthCallbackHandlerProps) {
  const clerk = useClerk();
  const { user } = useUser();
  const { isLoaded: isSessionLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    if (!isSessionLoaded || !clerk.loaded) {
      return () => {
        active = false;
      };
    }

    const triggerNotificationAndRedirect = (targetUser?: any) => {
      const email =
        targetUser?.primaryEmailAddress?.emailAddress ||
        user?.primaryEmailAddress?.emailAddress ||
        clerk.user?.primaryEmailAddress?.emailAddress;
      const name =
        targetUser?.fullName ||
        targetUser?.firstName ||
        user?.fullName ||
        clerk.user?.fullName ||
        "";

      if (email) {
        trackSignup(email, "oauth", name);
        fetch("/api/auth/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, provider: "oauth" }),
        }).catch(() => {});
      }

      const dest = email
        ? `${completeUrl}${completeUrl.includes("?") ? "&" : "?"}email=${encodeURIComponent(email)}`
        : completeUrl;
      router.replace(dest);
    };

    if (isSignedIn) {
      triggerNotificationAndRedirect(user);
      return () => {
        active = false;
      };
    }

    void clerk
      .handleRedirectCallback({
        signInUrl,
        signUpUrl,
        continueSignUpUrl,
        signInForceRedirectUrl: completeUrl,
        signInFallbackRedirectUrl: completeUrl,
        signUpForceRedirectUrl: completeUrl,
        signUpFallbackRedirectUrl: completeUrl,
      })
      .then(() => {
        if (!active) return;
        triggerNotificationAndRedirect(clerk.user);
      })
      .catch((callbackError) => {
        if (!active) return;
        console.error("[MemoryOS Auth] OAuth callback failed", callbackError);
        const errorText =
          callbackError instanceof Error
            ? callbackError.message.toLowerCase()
            : typeof callbackError === "string"
              ? callbackError.toLowerCase()
              : "";
        const isAccountExistsError =
          errorText.includes("identifier_exists") ||
          errorText.includes("already exists") ||
          errorText.includes("email already") ||
          errorText.includes("username already") ||
          errorText.includes("account exists") ||
          errorText.includes("identifier already exists");
        if (isAccountExistsError) {
          router.replace(accountExistsRedirectUrl ?? completeUrl);
          return;
        }

        const fallbackUrl = errorRedirectUrl ?? signInUrl;
        router.replace(fallbackUrl);
      });

    return () => {
      active = false;
    };
  }, [
    accountExistsRedirectUrl,
    clerk,
    completeUrl,
    continueSignUpUrl,
    errorRedirectUrl,
    isSessionLoaded,
    isSignedIn,
    router,
    signInUrl,
    signUpUrl,
    user,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070707] text-[#F0EFE2] font-mono">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin border-2 border-[#75bf00] border-t-transparent" />
        <p className="text-xs text-[#888]">Securing access authorization...</p>
      </div>
    </div>
  );
}
