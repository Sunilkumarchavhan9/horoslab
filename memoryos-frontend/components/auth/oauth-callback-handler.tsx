"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type OAuthCallbackHandlerProps = {
  completeUrl: string;
  signInUrl: string;
  signUpUrl: string;
  continueSignUpUrl: string;
  surface?: "dark" | "light";
};

export function OAuthCallbackHandler({
  completeUrl,
  signInUrl,
  signUpUrl,
  continueSignUpUrl,
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
        router.replace(`${signInUrl}?auth_error=oauth_callback`);
      });

    return () => {
      active = false;
    };
  }, [clerk, completeUrl, continueSignUpUrl, isSessionLoaded, isSignedIn, router, signInUrl, signUpUrl]);

  return <div id="clerk-captcha" className="hidden" aria-hidden="true" />;
}
