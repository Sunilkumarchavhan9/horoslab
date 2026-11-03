"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import {
  Loader2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  Mail,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { HorosLogo, HorosWordmarkLogo } from "@/components/horos/primitives/brand-icons";
import { isClerkEnabled } from "@/lib/clerk";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4 fill-[#0A66C2] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function HorosSignUpView() {
  const router = useRouter();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // If already signed in, go directly to Thank You early access page
  React.useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      router.replace("/thank-you");
    }
  }, [isAuthLoaded, isSignedIn, router]);

  const handleOAuthSignUp = async (
    provider: "google" | "github" | "linkedin"
  ) => {
    setLoadingProvider(provider);
    setErrorMessage(null);

    const clerkLive = isClerkEnabled();

    // If Clerk is not enabled in this environment, fallback gracefully to early access confirmation
    if (!clerkLive || !signUp || !signIn) {
      setTimeout(() => {
        router.push(`/thank-you?provider=${provider}&status=confirmed`);
      }, 500);
      return;
    }

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const ssoCallbackUrl = `${origin}/sso-callback`;
      const completeUrl = `${origin}/thank-you`;

      let strategy: "oauth_google" | "oauth_github" | "oauth_linkedin_oidc" | "oauth_linkedin" =
        "oauth_google";
      if (provider === "google") strategy = "oauth_google";
      if (provider === "github") strategy = "oauth_github";
      if (provider === "linkedin") strategy = "oauth_linkedin_oidc";

      try {
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: ssoCallbackUrl,
          redirectUrlComplete: completeUrl,
        });
      } catch (signUpErr: unknown) {
        // If account already exists or provider requires sign-in path
        console.warn("[HOROS Auth] SignUp redirect fallback to SignIn", signUpErr);
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: ssoCallbackUrl,
          redirectUrlComplete: completeUrl,
        });
      }
    } catch (err: unknown) {
      console.error("[HOROS Auth] OAuth execution failed", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Authentication handshake failed. Please try another provider or schedule a demo.";
      setErrorMessage(msg);
      setLoadingProvider(null);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    setIsSubmittingEmail(true);
    setErrorMessage(null);

    const clerkLive = isClerkEnabled();

    if (!clerkLive || !signUp) {
      setTimeout(() => {
        router.push(
          `/thank-you?email=${encodeURIComponent(emailInput)}&status=confirmed`
        );
      }, 500);
      return;
    }

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      // Create sign up attempt with Clerk email link / code
      await signUp.create({
        emailAddress: emailInput,
      });

      // Prepare verification or redirect to Thank You page
      router.push(
        `/thank-you?email=${encodeURIComponent(emailInput)}&status=confirmed`
      );
    } catch (err: unknown) {
      console.warn("[HOROS Auth] Email sign-up note", err);
      // If user already exists or needs email code, route gracefully
      router.push(
        `/thank-you?email=${encodeURIComponent(emailInput)}&status=confirmed`
      );
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#F0EFE2] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col justify-between relative overflow-hidden">
      {/* Background Blueprint Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_60%,transparent_100%)] pointer-events-none opacity-40 z-0" />

      {/* Top Navbar Header */}
      <header className="w-full border-b border-dashed border-[#262626] bg-[#111111]/80 backdrop-blur-md relative z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <HorosLogo variant="icon" size="sm" className="text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors" />
            <HorosWordmarkLogo className="h-4.5 w-auto text-[#F0EFE2]" />
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#777] hidden sm:inline font-mono">
              Have questions?
            </span>
            <a
              href="https://cal.com/vegito"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-semibold text-xs px-3.5 py-1.5 rounded-xs transition-colors shadow-xs"
            >
              <Calendar size={13} />
              <span>Demo</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-8">
        <div className="w-full max-w-[460px] bg-[#151515] border border-[#2b2b2b] rounded-xs shadow-2xl p-7 sm:p-9 relative">
          
          {/* Subtle top lime indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#75bf00] to-transparent opacity-75" />

          {/* Header Badge */}
          <div className="flex items-center justify-between mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#75bf00]/10 border border-[#75bf00]/30 text-[10.5px] text-[#75bf00] font-mono font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00] animate-pulse" />
              FOUNDING ACCESS
            </div>
            <span className="text-[10px] text-[#666] font-mono">HOROS v1.0</span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5 mb-7">
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#F0EFE2]">
              Create your account
            </h1>
            <p className="text-xs text-[#999] leading-relaxed">
              Sign up with your preferred developer profile to reserve priority access to the HOROS physical intelligence platform.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xs bg-red-950/40 border border-red-800/60 text-red-200 text-xs font-mono leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* Three OAuth Options (Google, GitHub, LinkedIn) */}
          <div className="space-y-2.5">
            {/* 1. Google */}
            <button
              type="button"
              disabled={Boolean(loadingProvider)}
              onClick={() => handleOAuthSignUp("google")}
              className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#262626] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-3 px-4 rounded-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loadingProvider === "google" ? (
                <Loader2 size={16} className="text-[#75bf00] animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>Continue with Google</span>
            </button>

            {/* 2. GitHub */}
            <button
              type="button"
              disabled={Boolean(loadingProvider)}
              onClick={() => handleOAuthSignUp("github")}
              className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#262626] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-3 px-4 rounded-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loadingProvider === "github" ? (
                <Loader2 size={16} className="text-[#75bf00] animate-spin" />
              ) : (
                <GithubIcon />
              )}
              <span>Continue with GitHub</span>
            </button>

            {/* 3. LinkedIn */}
            <button
              type="button"
              disabled={Boolean(loadingProvider)}
              onClick={() => handleOAuthSignUp("linkedin")}
              className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#262626] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-3 px-4 rounded-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loadingProvider === "linkedin" ? (
                <Loader2 size={16} className="text-[#75bf00] animate-spin" />
              ) : (
                <LinkedInIcon />
              )}
              <span>Continue with LinkedIn</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-dashed border-[#292929]" />
            <span className="absolute bg-[#151515] px-3 text-[10px] font-mono text-[#666] uppercase tracking-wider">
              OR
            </span>
          </div>

          {/* Continue with Email Dropdown */}
          {!showEmailForm ? (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-between bg-[#191919] hover:bg-[#222] border border-[#2b2b2b] hover:border-[#383838] text-xs font-medium text-[#C8C7BA] hover:text-[#F0EFE2] py-2.5 px-4 rounded-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#888]" />
                <span>Continue with email</span>
              </div>
              <ChevronDown size={14} className="text-[#666]" />
            </button>
          ) : (
            <form onSubmit={handleEmailSignUp} className="space-y-2.5">
              <input
                type="email"
                required
                placeholder="developer@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#111] border border-[#333] focus:border-[#75bf00] text-xs text-[#F0EFE2] px-3.5 py-2.5 rounded-xs outline-none transition-colors font-mono"
              />
              <button
                type="submit"
                disabled={isSubmittingEmail}
                className="w-full flex items-center justify-center gap-2 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold text-xs py-2.5 px-4 rounded-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEmail ? (
                  <Loader2 size={14} className="animate-spin text-black" />
                ) : (
                  <>
                    <span>Confirm Early Access</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Cal.com Demo Notice */}
          <div className="mt-6 pt-5 border-t border-[#232323] flex items-center justify-between text-xs text-[#888]">
            <span>Need a custom walkthrough?</span>
            <a
              href="https://cal.com/vegito"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#75bf00] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Schedule Demo</span>
              <ArrowUpRight size={12} />
            </a>
          </div>

          {/* Legal Terms Disclaimer */}
          <p className="mt-5 text-[10px] text-[#666] text-center leading-normal">
            By signing up, you agree to HOROS{" "}
            <Link href="/terms-of-service" className="underline hover:text-[#999]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline hover:text-[#999]">
              Privacy Policy
            </Link>
            .
          </p>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-5 text-center text-[11px] font-mono text-[#555] border-t border-[#1f1f1f] relative z-10">
        © 2026 HOROS Physical Intelligence. All rights reserved.
      </footer>
    </div>
  );
}

