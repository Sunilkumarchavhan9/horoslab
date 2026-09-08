"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";

function isClerkLoadFailure(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === "string"
        ? error
        : String(error ?? "");
  return (
    message.includes("failed_to_load_clerk_js") ||
    message.includes("Failed to load Clerk JS") ||
    message.includes("clerk.browser.js")
  );
}

function ClerkLoadFailureFallback() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#070707] px-5 text-[#F0EFE2]">
      <section className="w-full max-w-[520px] border border-[#262626] bg-[#101010] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8b95a3]">
          Epoch authentication
        </p>
        <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-[#F0EFE2]">
          Clerk could not load in this browser.
        </h1>
        <p className="mt-4 text-[14px] leading-7 text-[#a6afbc]">
          Your browser blocked Clerk&apos;s secure sign-in script. Keep Clerk enabled, then allow
          <span className="text-[#F0EFE2]"> *.clerk.accounts.dev</span> and disable Brave Shields or ad blockers for
          <span className="text-[#F0EFE2]"> localhost:3000</span>.
        </p>
        <div className="mt-6 grid gap-2 text-[13px] leading-6 text-[#8b95a3]">
          <p>1. Open Brave Shields for this site and turn shields off.</p>
          <p>2. Allow third-party cookies for Clerk during local development.</p>
          <p>3. Reload the page and sign in normally.</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-7 h-11 w-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-[#e6e6e6]"
        >
          Reload sign-in
        </button>
      </section>
    </main>
  );
}

class ClerkLoadErrorBoundary extends Component<
  { children: ReactNode; onClerkLoadFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(error: unknown) {
    return { failed: isClerkLoadFailure(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (isClerkLoadFailure(error)) {
      this.props.onClerkLoadFailure();
      console.warn("[Epoch Auth] Clerk JS failed to load.", {
        componentStack: info.componentStack,
      });
      return;
    }
    throw error;
  }

  render() {
    if (this.state.failed) {
      return <ClerkLoadFailureFallback />;
    }
    return this.props.children;
  }
}

export function ClerkRootProvider({ children }: { children: ReactNode }) {
  const [clerkLoadFailed, setClerkLoadFailed] = useState(false);

  useEffect(() => {
    function handleFailure(event: ErrorEvent | PromiseRejectionEvent) {
      const reason = event instanceof PromiseRejectionEvent ? event.reason : event.error ?? event.message;
      if (!isClerkLoadFailure(reason)) return;
      event.preventDefault();
      setClerkLoadFailed(true);
    }

    window.addEventListener("error", handleFailure);
    window.addEventListener("unhandledrejection", handleFailure);
    return () => {
      window.removeEventListener("error", handleFailure);
      window.removeEventListener("unhandledrejection", handleFailure);
    };
  }, []);

  if (clerkLoadFailed) {
    return <ClerkLoadFailureFallback />;
  }

  return (
    <ClerkLoadErrorBoundary onClerkLoadFailure={() => setClerkLoadFailed(true)}>
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        signInUrl="/auth/sign-in"
        signUpUrl="/auth/sign-up"
        signInFallbackRedirectUrl="/mission-control"
        signUpFallbackRedirectUrl="/mission-control"
      >
        {children}
      </ClerkProvider>
    </ClerkLoadErrorBoundary>
  );
}
