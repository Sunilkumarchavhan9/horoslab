"use client";

import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ClerkPersonalSignInProps = {
  redirectTo: "/personal-app";
};

const AUTH_LOADING_MESSAGE =
  "Preparing secure sign-in. If it keeps loading, disable Brave Shields or ad blockers for localhost.";
const REDIRECT_BLOCKED_MESSAGE =
  "Redirect did not start. Disable Brave Shields/ad blockers for localhost, allow Clerk cookies, then try again.";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12.24 10.285v3.821h5.445c-.239 1.226-.957 2.264-2.035 2.962l3.295 2.56c1.92-1.77 3.026-4.374 3.026-7.479c0-.72-.065-1.411-.185-2.08z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.896 6.619-2.42l-3.295-2.56c-.916.614-2.086.977-3.324.977c-2.551 0-4.714-1.724-5.486-4.041l-3.406 2.635A9.998 9.998 0 0 0 12 22"
      />
      <path
        fill="#4A90E2"
        d="M6.514 13.956A5.996 5.996 0 0 1 6.2 12c0-.679.117-1.338.314-1.956L3.108 7.409A9.996 9.996 0 0 0 2 12c0 1.615.386 3.139 1.108 4.591z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.004c1.469 0 2.786.505 3.824 1.494l2.867-2.867C16.96 3.01 14.696 2 12 2a9.998 9.998 0 0 0-8.892 5.409l3.406 2.635C7.286 7.728 9.449 6.004 12 6.004"
      />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.57879 0 7.99729C0 11.5361 2.29 14.5251 5.47 15.5847C5.87 15.6547 6.02 15.4148 6.02 15.2049C6.02 15.0149 6.01 14.3851 6.01 13.7154C4 14.0852 3.48 13.2255 3.32 12.7757C3.23 12.5458 2.84 11.836 2.5 11.6461C2.22 11.4961 1.82 11.1262 2.49 11.1162C3.12 11.1062 3.57 11.696 3.72 11.936C4.44 13.1455 5.59 12.8057 6.05 12.5957C6.12 12.0759 6.33 11.726 6.56 11.5261C4.78 11.3262 2.92 10.6364 2.92 7.57743C2.92 6.70773 3.23 5.98797 3.74 5.42816C3.66 5.22823 3.38 4.40851 3.82 3.30888C3.82 3.30888 4.49 3.09895 6.02 4.1286C6.66 3.94866 7.34 3.85869 8.02 3.85869C8.7 3.85869 9.38 3.94866 10.02 4.1286C11.55 3.08895 12.22 3.30888 12.22 3.30888C12.66 4.40851 12.38 5.22823 12.3 5.42816C12.81 5.98797 13.12 6.69773 13.12 7.57743C13.12 10.6464 11.25 11.3262 9.47 11.5261C9.76 11.776 10.01 12.2558 10.01 13.0056C10.01 14.0752 10 14.9349 10 15.2049C10 15.4148 10.15 15.6647 10.55 15.5847C12.1381 15.0488 13.5182 14.0284 14.4958 12.6673C15.4735 11.3062 15.9996 9.67293 16 7.99729C16 3.57879 12.42 0 8 0Z" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 23 26" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M11.2644 0.000937462L12.8644 9.34494L21.7604 6.01694L22.0164 6.46494L14.7204 12.5449L22.0164 18.5609L21.7604 19.0089L12.8644 15.7449L11.2644 25.0889H10.7524L9.15244 15.7449L0.256437 19.0089L0.000436783 18.5609L7.29644 12.5449L0.000436783 6.46494L0.256437 6.01694L9.15244 9.34494L10.7524 0.000937462H11.2644Z"
        fill="#ffffff"
      />
    </svg>
  );
}

function SocialButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-[5px] bg-[linear-gradient(180deg,#0a2ba7_0%,#092891_100%)] px-4 text-center text-[15px] font-semibold text-[#F0EFE2] transition hover:bg-[linear-gradient(180deg,#1135bd_0%,#0c2f9f_100%)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[56px] sm:px-5 sm:text-[16px]"
    >
      {children}
    </button>
  );
}

export function ClerkPersonalSignIn({ redirectTo }: ClerkPersonalSignInProps) {
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const authReady = !isSignedIn && isSignInLoaded && Boolean(signIn);
  const [email, setEmail] = useState("");
  const [pendingStrategy, setPendingStrategy] = useState<"google" | "github" | "email" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"error" | "success" | "info" | null>(null);

  useEffect(() => {
    if (authReady) {
      setStatusMessage((current) => {
        if (current === AUTH_LOADING_MESSAGE) {
          return null;
        }

        return current;
      });
      setStatusTone((current) => (current === "info" ? null : current));
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatusMessage(AUTH_LOADING_MESSAGE);
      setStatusTone("info");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [authReady]);

  useEffect(() => {
    if (pendingStrategy !== "google" && pendingStrategy !== "github") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatusMessage(REDIRECT_BLOCKED_MESSAGE);
      setStatusTone("error");
      setPendingStrategy(null);
    }, 7000);

    return () => window.clearTimeout(timeout);
  }, [pendingStrategy]);

  function buildAbsoluteUrl(path: string) {
    if (typeof window === "undefined") {
      return path;
    }

    return new URL(path, window.location.origin).toString();
  }

  function getErrorMessage(error: unknown) {
    if (isClerkAPIResponseError(error) && error.errors.length > 0) {
      const firstError = error.errors[0];
      const code = (firstError?.code ?? "").toLowerCase();
      const longMessage = firstError?.longMessage ?? "";
      const shortMessage = firstError?.message ?? "";

      if (
        code.includes("oauth") ||
        longMessage.toLowerCase().includes("oauth") ||
        longMessage.toLowerCase().includes("social")
      ) {
        return "Google/GitHub is not fully configured in Clerk for this app. Enable both social providers and allow localhost:3000 redirect URLs in Clerk dashboard.";
      }

      if (code.includes("dev_browser_unauthenticated")) {
        return "Clerk development browser session is not trusted yet. Open this app in a clean browser tab, disable shields/ad blockers for localhost, then retry.";
      }

      return longMessage || shortMessage || "Authentication failed.";
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return "Authentication failed. Check the Clerk provider setup and try again.";
  }

  function isAlreadySignedInError(error: unknown): boolean {
    if (isClerkAPIResponseError(error)) {
      return error.errors.some((entry) => {
        const code = (entry.code ?? "").toLocaleLowerCase();
        const message = `${entry.longMessage ?? ""} ${entry.message ?? ""}`.toLocaleLowerCase();
        return code.includes("session") || message.includes("already signed in");
      });
    }
    if (error instanceof Error) {
      return error.message.toLowerCase().includes("already signed in");
    }
    return false;
  }

  const redirectSignedInUser = useCallback(() => {
    router.replace(redirectTo);
  }, [redirectTo, router]);

  useEffect(() => {
    if (isSignedIn) {
      void redirectSignedInUser();
    }
  }, [isSignedIn, redirectSignedInUser]);

  if (isSignedIn) {
    return null;
  }

  async function handleOauth(strategy: "oauth_google" | "oauth_github", completeUrl: string) {
    if (!authReady || !signIn) {
      setStatusMessage(AUTH_LOADING_MESSAGE);
      setStatusTone("info");
      return;
    }
    if (isSignedIn) {
      await redirectSignedInUser();
      return;
    }

    setPendingStrategy(strategy === "oauth_google" ? "google" : "github");
    setStatusMessage(null);
    setStatusTone(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: buildAbsoluteUrl("/sso-callback-personal"),
        redirectUrlComplete: buildAbsoluteUrl(completeUrl),
      });
    } catch (error) {
      if (isAlreadySignedInError(error)) {
        await redirectSignedInUser();
        return;
      }
      console.error("[MemoryOS Auth] Personal OAuth sign-in failed", error);
      setStatusMessage(getErrorMessage(error));
      setStatusTone("error");
    } finally {
      setPendingStrategy(null);
    }
  }

  async function handleMagicLink() {
    if (!authReady || !signIn) {
      setStatusMessage(AUTH_LOADING_MESSAGE);
      setStatusTone("info");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatusMessage("Enter your email address first.");
      setStatusTone("error");
      return;
    }

    setPendingStrategy("email");
    setStatusMessage(null);
    setStatusTone(null);

    try {
      const { startEmailLinkFlow } = signIn.createEmailLinkFlow();
      const signInAttempt = await signIn.create({
        strategy: "email_link",
        identifier: trimmedEmail,
        redirectUrl: buildAbsoluteUrl("/personal-app/verify-link"),
      });

      const emailLinkFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_link" && "emailAddressId" in factor,
      );

      if (!emailLinkFactor || !("emailAddressId" in emailLinkFactor)) {
        throw new Error(
          "Email link sign-in is not enabled in Clerk. Enable Email verification link for sign-in.",
        );
      }

      await startEmailLinkFlow({
        emailAddressId: emailLinkFactor.emailAddressId,
        redirectUrl: buildAbsoluteUrl("/personal-app/verify-link"),
      });

      setStatusMessage(`Magic link sent to ${trimmedEmail}. Open it in this browser to finish sign-in.`);
      setStatusTone("success");
    } catch (error) {
      if (isAlreadySignedInError(error)) {
        await redirectSignedInUser();
        return;
      }
      setStatusMessage(getErrorMessage(error));
      setStatusTone("error");
    } finally {
      setPendingStrategy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] space-y-4 text-left sm:space-y-5">
      <SocialButton
        onClick={() => handleOauth("oauth_google", redirectTo)}
        disabled={pendingStrategy !== null || !authReady}
      >
        <GoogleMark />
        <span>
          {!authReady
            ? "Preparing sign-in..."
            : pendingStrategy === "google"
              ? "Connecting..."
              : "Continue with Google"}
        </span>
      </SocialButton>

      <SocialButton
        onClick={() => handleOauth("oauth_github", redirectTo)}
        disabled={pendingStrategy !== null || !authReady}
      >
        <GithubMark />
        <span>
          {!authReady
            ? "Preparing sign-in..."
            : pendingStrategy === "github"
              ? "Connecting..."
              : "Continue with GitHub"}
        </span>
      </SocialButton>

      <div className="flex items-center justify-center py-1 text-[14px] font-semibold tracking-[0.08em] text-[#F0EFE2]/90">
        OR
      </div>

      <input
        type="email"
        suppressHydrationWarning
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="your@email.com"
        className="h-[54px] w-full rounded-[5px] bg-[#181c22] px-4 text-[16px] text-[#F0EFE2] outline-none transition placeholder:text-[#8892a2] focus:ring-2 focus:ring-[#314bf4] sm:h-[56px] sm:px-5 sm:text-[17px]"
      />

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={pendingStrategy !== null || !authReady}
        className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-[5px] bg-[linear-gradient(180deg,#314bf4_0%,#0a2ba7_100%)] px-4 text-center text-[15px] font-semibold text-[#F0EFE2] shadow-[0_18px_40px_rgba(49,75,244,0.36)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[56px] sm:px-5 sm:text-[16px]"
      >
        <BrandMark />
        <span>
          {!authReady
            ? "Preparing sign-in..."
            : pendingStrategy === "email"
              ? "Logging in..."
              : "Log in with Dhyra"}
        </span>
      </button>

      <div
        id="clerk-captcha"
        className="relative min-h-[70px] w-full"
        aria-hidden="true"
      />

      {statusMessage ? (
        <p
          className={`text-center text-[13px] leading-6 sm:text-[14px] sm:leading-7 ${
            statusTone === "error"
              ? "text-[#ff9b9b]"
              : statusTone === "success"
                ? "text-[#b6f4cf]"
                : "text-[#9bb7ff]"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}

      <p className="pt-3 text-center text-[13px] leading-6 text-[#7d8596] sm:pt-4 sm:text-[14px] sm:leading-7">
        By continuing, you agree to our <a href="#" className="underline underline-offset-2">Terms</a> and{" "}
        <a href="#" className="underline underline-offset-2">Privacy Policy</a>.
      </p>
    </div>
  );
}
