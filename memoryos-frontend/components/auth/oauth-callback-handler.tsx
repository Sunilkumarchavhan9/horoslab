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

    const fallbackTimer = window.setTimeout(() => {
      router.replace(completeUrl);
    }, 2500);

    clerk
      .handleRedirectCallback({
        signInUrl,
        signUpUrl,
        continueSignUpUrl,
        signInForceRedirectUrl: completeUrl,
        signInFallbackRedirectUrl: completeUrl,
        signUpForceRedirectUrl: completeUrl,
        signUpFallbackRedirectUrl: completeUrl,
      })
      .catch((callbackError) => {
        if (!active) return;
        console.error("[MemoryOS Auth] OAuth callback failed", callbackError);
        router.replace(signInUrl);
      });

    return () => {
      active = false;
      window.clearTimeout(fallbackTimer);
    };
  }, [clerk, completeUrl, continueSignUpUrl, isSessionLoaded, isSignedIn, router, signInUrl, signUpUrl]);

  return <div id="clerk-captcha" className="hidden" aria-hidden="true" />;
}
