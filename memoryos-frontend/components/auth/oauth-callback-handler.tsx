"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
  const { isLoaded: isSessionLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    if (!isSessionLoaded || !clerk.loaded) {
      return () => {
        active = false;
      };
    }

    if (isSignedIn) {
      router.replace(completeUrl);
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
        router.replace(completeUrl);
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
        const redirectBase = errorRedirectUrl ?? signInUrl;
        router.replace(`${redirectBase}?auth_error=oauth_callback`);
      });

    return () => {
      active = false;
    };
  }, [
    clerk,
    completeUrl,
    continueSignUpUrl,
    accountExistsRedirectUrl,
    errorRedirectUrl,
    isSessionLoaded,
    isSignedIn,
    router,
    signInUrl,
    signUpUrl,
  ]);

  return <div id="clerk-captcha" className="relative hidden" aria-hidden="true" />;
}
