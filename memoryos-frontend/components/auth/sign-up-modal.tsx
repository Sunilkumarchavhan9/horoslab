"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Mail,
  ArrowRight,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { HorosWordmarkLogo } from "@/components/horos/primitives/brand-icons";
import { signIn } from "next-auth/react";
import { trackSignup, trackEvent } from "@/lib/posthog";

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

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfirmed?: boolean;
  initialEmail?: string;
}

export function SignUpModal({
  isOpen,
  onClose,
  initialConfirmed = false,
  initialEmail = "",
}: SignUpModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(initialConfirmed);
  const [registeredEmail, setRegisteredEmail] = useState(initialEmail);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUsedProvider, setLastUsedProvider] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("horos_last_auth_provider");
      if (stored) {
        setLastUsedProvider(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (initialConfirmed) {
      setIsConfirmed(true);
      if (initialEmail) {
        setRegisteredEmail(initialEmail);
      }
    }
  }, [initialConfirmed, initialEmail]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsConfirmed(false);
    setIsSubmitting(false);
    setLoadingProvider(null);
    setEmail("");
    setErrorMessage(null);
    onClose();
  };

  // Next.js Auth OAuth Handlers (Google & GitHub only, LinkedIn removed)
  const handleOAuth = async (provider: "google" | "github") => {
    trackEvent("oauth_attempt", { provider });
    setLoadingProvider(provider);
    setErrorMessage(null);
    const targetLabel = `${provider.charAt(0).toUpperCase() + provider.slice(1)} account`;
    setRegisteredEmail(targetLabel);

    if (typeof window !== "undefined") {
      localStorage.setItem("horos_last_auth_provider", provider);
    }

    try {
      trackSignup({ email: targetLabel, provider, method: "oauth" });
      await signIn(provider, { callbackUrl: "/?signed_up=true" });
    } catch (err: any) {
      console.warn(`[NextAuth] ${provider} redirect notice:`, err);
      try {
        await fetch("/api/auth/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: `oauth_${provider}@user.pending`, provider }),
        });
      } catch {
        // safe fallback
      }

      setTimeout(() => {
        setLoadingProvider(null);
        setIsConfirmed(true);
      }, 400);
    }
  };

  // Next.js Auth Credentials & Real-Time Confirmation Email Dispatch
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    setIsSubmitting(true);
    setRegisteredEmail(cleanEmail);
    setErrorMessage(null);

    if (typeof window !== "undefined") {
      localStorage.setItem("horos_last_auth_provider", "email");
    }

    try {
      // 1. Dispatch real confirmation email & save lead
      await fetch("/api/auth/notify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, provider: "email" }),
      });

      // 2. Next.js Auth Credentials Sign-In
      try {
        await signIn("credentials", {
          email: cleanEmail,
          redirect: false,
        });
      } catch {
        // safe fallback
      }

      // 3. Track in PostHog
      trackSignup({ email: cleanEmail, provider: "email", method: "credentials" });

      setIsConfirmed(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to process signup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      {/* 2-Column Balanced Brutalist Card: Same Level, Reduced Size */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[700px] bg-[#141414] border border-[#2b2b2b] rounded-none shadow-2xl text-[#F0EFE2] font-sans flex flex-col md:flex-row items-stretch overflow-hidden"
      >
        {/* Close Button - Squared */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 z-30 p-1.5 rounded-none text-[#8c8c8c] hover:text-[#F0EFE2] bg-black/70 hover:bg-[#222] border border-[#333] transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Left Side: Early Access Sign-Up Form / Confirmation */}
        <div className="w-full md:w-[370px] shrink-0 p-6 sm:p-7 flex flex-col justify-between bg-[#141414] z-10">
          {!isConfirmed ? (
            <div>
              {/* Single Brand Company Logo Only */}
              <div className="mb-4">
                <HorosWordmarkLogo className="h-4.5 w-auto text-[#F0EFE2]" />
              </div>

              {/* Title with Highlighted Badge: Early access */}
              <div className="mb-4">
                <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-[#F0EFE2] flex items-center gap-1.5">
                  <span>Early</span>
                  <span className="bg-[#75bf00] text-black px-1.5 py-0.2 text-base font-extrabold rounded-none">
                    access
                  </span>
                </h2>
                <p className="text-xs text-[#8c8c8c] mt-1.5 leading-relaxed">
                  Sign up with your account to get access before launch.
                </p>
              </div>

              {/* Error notice if present */}
              {errorMessage && (
                <div className="mb-3 p-2 rounded-none bg-red-950/50 border border-red-800/60 text-xs text-red-200 font-mono">
                  {errorMessage}
                </div>
              )}

              {/* 2 Social Buttons: Google & GitHub (LAST USED badge ONLY if previously used) */}
              <div className="space-y-2.5">
                {/* Google Button */}
                <div className="relative">
                  {lastUsedProvider === "google" && (
                    <span className="absolute -top-2.5 right-2 z-10 px-1.5 py-0.2 bg-[#141414] border border-[#75bf00] text-[#75bf00] text-[8.5px] font-mono tracking-wider font-bold">
                      LAST USED
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={Boolean(loadingProvider) || isSubmitting}
                    onClick={() => handleOAuth("google")}
                    className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-2.5 px-4 rounded-none transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {loadingProvider === "google" ? (
                      <Loader2 size={15} className="text-[#75bf00] animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* GitHub Button */}
                <div className="relative">
                  {lastUsedProvider === "github" && (
                    <span className="absolute -top-2.5 right-2 z-10 px-1.5 py-0.2 bg-[#141414] border border-[#75bf00] text-[#75bf00] text-[8.5px] font-mono tracking-wider font-bold">
                      LAST USED
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={Boolean(loadingProvider) || isSubmitting}
                    onClick={() => handleOAuth("github")}
                    className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-2.5 px-4 rounded-none transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {loadingProvider === "github" ? (
                      <Loader2 size={15} className="text-[#75bf00] animate-spin" />
                    ) : (
                      <GithubIcon />
                    )}
                    <span>Continue with GitHub</span>
                  </button>
                </div>
              </div>

              {/* Terms notice placed above OR divider */}
              <p className="mt-4 text-[10px] text-[#777] text-center leading-normal">
                By continuing with Google or GitHub, you agree to the{" "}
                <a href="/terms-of-service" className="underline text-[#aaa] hover:text-[#F0EFE2]">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="underline text-[#aaa] hover:text-[#F0EFE2]">
                  Privacy Policy
                </a>
                .
              </p>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-[#292929]" />
                <span className="absolute bg-[#141414] px-2.5 text-[10px] font-mono text-[#666] tracking-wider uppercase">
                  OR
                </span>
              </div>

              {/* Email Input Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#101010] border border-[#303030] focus:border-[#75bf00] text-xs text-[#F0EFE2] placeholder:text-[#555] px-3.5 py-2.5 rounded-none outline-none transition-colors font-mono"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(loadingProvider)}
                  className="w-full flex items-center justify-center gap-2 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold text-xs py-2.5 px-4 rounded-none transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin text-black" />
                  ) : (
                    <>
                      <span>Continue with email</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* In-Place Confirmation Card - Squared */
            <div className="py-1 space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-none bg-[#75bf00]/15 border border-[#75bf00]/40 flex items-center justify-center text-[#75bf00] shrink-0">
                  <CheckCircle2 size={14} className="text-[#75bf00]" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-[#75bf00]/10 border border-[#75bf00]/30 text-[9.5px] text-[#75bf00] font-mono font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#75bf00] animate-pulse" />
                  ACCESS RESERVED
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold tracking-tight text-[#F0EFE2]">
                  Thanks for signing up!
                </h2>
                <p className="text-xs text-[#a0a0a0] leading-relaxed">
                  We will reach out to you as soon as possible. We will start a launch. When we launch you can access it first.
                </p>
              </div>

              {/* Account identifier badge - Squared */}
              <div className="p-2.5 rounded-none bg-[#101010] border border-[#2a2a2a] flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-none bg-[#1f1f1f] flex items-center justify-center text-[#888] shrink-0">
                  <Mail size={13} className="text-[#888]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9.5px] font-mono text-[#666] uppercase tracking-wider">
                    Verified Contact
                  </div>
                  <div className="text-xs font-mono text-[#F0EFE2] truncate">
                    {registeredEmail || email || "Account registered"}
                  </div>
                </div>
              </div>

              {/* Technical briefing callout - Squared */}
              <div className="pt-2 border-t border-[#222]">
                <div className="text-[10.5px] text-[#777] mb-2 leading-relaxed">
                  Need an immediate enterprise walkthrough with our founding engineering team?
                </div>
                <a
                  href="https://cal.com/vegito"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("book_briefing_click", { source: "modal_confirmation" })}
                  className="w-full flex items-center justify-center gap-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] hover:border-[#75bf00]/50 text-xs font-semibold text-[#F0EFE2] py-2 px-3 rounded-none transition-all group"
                >
                  <span>Book technical briefing on Cal.com</span>
                  <ArrowUpRight size={13} className="text-[#888] group-hover:text-[#75bf00] transition-colors" />
                </a>
              </div>

              {/* Done button - Squared */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold text-xs py-2 px-3 rounded-none transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Right Side: horos-auth.mp4 Video (Same Level, Flush With Form) */}
        <div className="hidden md:block w-[330px] shrink-0 relative bg-black border-l border-[#262626] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/images/horos-auth.mp4" type="video/mp4" />
          </video>

          {/* Vignette & Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Video bottom badge */}
          <div className="absolute bottom-4 left-4 right-4 z-10 p-2.5 bg-black/75 backdrop-blur-md border border-[#333]/90 rounded-none">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-none bg-[#75bf00] animate-pulse" />
              <span className="text-[9.5px] font-mono uppercase tracking-widest text-[#75bf00] font-bold">
                HOROS CONTINUITY ENGINE
              </span>
            </div>
            <p className="text-[10.5px] text-[#bbb] leading-snug">
              Verifiable runtime & continuous execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
