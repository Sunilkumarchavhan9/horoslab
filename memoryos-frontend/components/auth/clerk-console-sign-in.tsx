"use client";

import { useAuth } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { warmMemoryTokenBridge } from "@/lib/memory-token";

type ClerkConsoleSignInProps = {
  redirectTo: "/developer-console" | "/personal-app";
};

const AUTH_LOADING_MESSAGE =
  "Preparing secure sign-in. If it keeps loading, disable Brave Shields or ad blockers for localhost.";

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

function ActionButton({
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
      className="flex min-h-[44px] w-full items-center justify-center gap-3 border border-[#343434] bg-transparent px-3 text-center text-[11px] font-medium tracking-[0.05em] text-white transition hover:border-[#4a4a4a] hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-[46px] sm:px-4 sm:text-[13px] lg:text-[14px]"
    >
      {children}
    </button>
  );
}

export function ClerkConsoleSignIn({ redirectTo }: ClerkConsoleSignInProps) {
  const { isLoaded, signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const authReady = isLoaded && Boolean(signIn);
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

  const redirectSignedInUser = useCallback(async () => {
    try {
      await warmMemoryTokenBridge();
    } catch {
      // If token bridge fails temporarily, still move signed-in users forward.
    }
    router.replace(redirectTo);
  }, [redirectTo, router]);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    void redirectSignedInUser();
  }, [isSignedIn, redirectSignedInUser]);

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
        redirectUrl: "/sso-callback",
        redirectUrlComplete: completeUrl,
      });
    } catch (error) {
      if (isAlreadySignedInError(error)) {
        await redirectSignedInUser();
        return;
      }
      console.error("[MemoryOS Auth] Developer OAuth sign-in failed", error);
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
        redirectUrl: buildAbsoluteUrl("/developer-console/verify-link"),
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
        redirectUrl: buildAbsoluteUrl("/developer-console/verify-link"),
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
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-3">
        <input
          type="email"
          suppressHydrationWarning
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className="h-[44px] w-full border border-[#343434] bg-transparent px-4 text-[14px] text-white outline-none placeholder:text-[#636c77] sm:h-[46px] sm:px-5 sm:text-[16px]"
        />
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={pendingStrategy !== null || !authReady}
          className="flex min-h-[44px] w-full items-center justify-center gap-3 bg-[#1f56aa] px-4 text-center text-[11px] font-medium tracking-[0.05em] text-white transition hover:bg-[#2763c3] disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-[46px] sm:text-[13px] lg:text-[14px]"
        >
          {!authReady
            ? "PREPARING SIGN-IN..."
            : pendingStrategy === "email"
              ? "SENDING MAGIC LINK..."
              : "SEND MAGIC LINK"}
        </button>
      </div>

      {statusMessage ? (
        <p
          className={`text-[12px] leading-6 sm:text-[13px] ${
            statusTone === "error"
              ? "text-[#ff9b9b]"
              : statusTone === "success"
                ? "text-[#9fd3b6]"
                : "text-[#8fb4ff]"
          }`}
        >
          {statusMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-3 py-1 text-[11px] tracking-[0.14em] text-[#555d67] sm:gap-4 sm:text-[13px] sm:tracking-[0.16em]">
        <span className="h-px flex-1 bg-[#2a2a2a]" />
        <span>OR</span>
        <span className="h-px flex-1 bg-[#2a2a2a]" />
      </div>

      <ActionButton
        onClick={() => handleOauth("oauth_google", redirectTo)}
        disabled={pendingStrategy !== null || !authReady}
      >
        <GoogleMark />
        <span>
          {!authReady
            ? "PREPARING SIGN-IN..."
            : pendingStrategy === "google"
              ? "CONNECTING..."
              : "CONTINUE WITH GOOGLE"}
        </span>
      </ActionButton>

      <ActionButton
        onClick={() => handleOauth("oauth_github", redirectTo)}
        disabled={pendingStrategy !== null || !authReady}
      >
        <GithubMark />
        <span>
          {!authReady
            ? "PREPARING SIGN-IN..."
            : pendingStrategy === "github"
              ? "CONNECTING..."
              : "CONTINUE WITH GITHUB"}
        </span>
      </ActionButton>

      <div
        id="clerk-captcha"
        className="min-h-[70px] w-full"
        aria-hidden="true"
      />
    </div>
  );
}
