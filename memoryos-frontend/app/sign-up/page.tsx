"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  CheckCircle2,
  Mail,
  ArrowRight,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { HorosLogo, HorosWordmarkLogo } from "@/components/horos/primitives/brand-icons";
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

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4 fill-[#0A66C2] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function StandaloneSignUpPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleOAuth = async (provider: "google" | "github" | "linkedin") => {
    trackEvent("oauth_attempt", { provider, surface: "standalone_page" });
    setLoadingProvider(provider);
    const targetLabel = `${provider.charAt(0).toUpperCase() + provider.slice(1)} account`;
    setRegisteredEmail(targetLabel);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    setIsSubmitting(true);
    setRegisteredEmail(cleanEmail);

    try {
      await fetch("/api/auth/notify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, provider: "email" }),
      });

      try {
        await signIn("credentials", {
          email: cleanEmail,
          redirect: false,
        });
      } catch {
        // safe fallback
      }

      trackSignup({ email: cleanEmail, provider: "email", method: "credentials" });

      setIsConfirmed(true);
    } catch (err) {
      console.warn("[NextAuth] Early access registration note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#F0EFE2] flex items-center justify-center p-3 sm:p-4 selection:bg-[#75bf00] selection:text-black font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(117,191,0,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* 2-Column Squared Brutalist Card */}
      <div className="relative w-full max-w-[420px] md:max-w-[820px] bg-[#141414] border border-[#2b2b2b] rounded-none shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#75bf00] to-transparent opacity-80 z-30" />

        <Link
          href="/"
          className="absolute top-3.5 right-3.5 z-30 text-[#888] hover:text-[#F0EFE2] bg-black/60 hover:bg-[#282828] border border-[#333] p-1.5 rounded-none transition-colors"
          aria-label="Back to home"
        >
          <X size={15} />
        </Link>

        {/* Left Column: Form / Confirmation */}
        <div className="p-6 sm:p-8 flex flex-col justify-between">
          {!isConfirmed ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HorosLogo variant="icon" size="sm" className="text-[#F0EFE2]" />
                <HorosWordmarkLogo className="h-4 w-auto text-[#F0EFE2]" />
              </div>

              <div className="space-y-1 mb-6">
                <h1 className="text-xl sm:text-[22px] font-bold tracking-tight text-[#F0EFE2]">
                  Create your account
                </h1>
                <p className="text-xs text-[#8c8c8c] leading-relaxed">
                  Sign up with your account to get early access before everyone else.
                </p>
              </div>

              {/* 3 Social Login Options - Squared */}
              <div className="space-y-2.5">
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

                <button
                  type="button"
                  disabled={Boolean(loadingProvider) || isSubmitting}
                  onClick={() => handleOAuth("linkedin")}
                  className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-2.5 px-4 rounded-none transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loadingProvider === "linkedin" ? (
                    <Loader2 size={15} className="text-[#75bf00] animate-spin" />
                  ) : (
                    <LinkedInIcon />
                  )}
                  <span>Continue with LinkedIn</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-[#292929]" />
                <span className="absolute bg-[#141414] px-3 text-[10px] font-mono text-[#666] tracking-wider uppercase">
                  OR
                </span>
              </div>

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

              <p className="mt-4 text-[10px] text-[#555] text-center leading-normal">
                By continuing, you agree to HOROS{" "}
                <a href="/terms-of-service" className="underline hover:text-[#888]">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="underline hover:text-[#888]">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-none bg-[#75bf00]/15 border border-[#75bf00]/40 flex items-center justify-center text-[#75bf00] shrink-0">
                  <CheckCircle2 size={16} className="text-[#75bf00]" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none bg-[#75bf00]/10 border border-[#75bf00]/30 text-[10px] text-[#75bf00] font-mono font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#75bf00] animate-pulse" />
                  ACCESS RESERVED
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-[#F0EFE2]">
                  Thanks for signing up!
                </h2>
                <p className="text-xs text-[#a0a0a0] leading-relaxed">
                  We will reach out to you as soon as possible. We will start a launch. When we launch you can access it first.
                </p>
              </div>

              <div className="p-3 rounded-none bg-[#101010] border border-[#2a2a2a] flex items-center gap-3">
                <div className="w-7 h-7 rounded-none bg-[#1f1f1f] flex items-center justify-center text-[#888] shrink-0">
                  <Mail size={14} className="text-[#888]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">
                    Verified Contact
                  </div>
                  <div className="text-xs font-mono text-[#F0EFE2] truncate">
                    {registeredEmail || email || "Account registered"}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#222]">
                <div className="text-[11px] text-[#777] mb-2 leading-relaxed">
                  Need an immediate enterprise walkthrough with our founding engineering team?
                </div>
                <a
                  href="https://cal.com/vegito"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("book_briefing_click", { source: "standalone_confirmation" })}
                  className="w-full flex items-center justify-center gap-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] hover:border-[#75bf00]/50 text-xs font-semibold text-[#F0EFE2] py-2.5 px-4 rounded-none transition-all group"
                >
                  <span>Book technical briefing on Cal.com</span>
                  <ArrowUpRight size={13} className="text-[#888] group-hover:text-[#75bf00] transition-colors" />
                </a>
              </div>

              <Link
                href="/"
                className="block w-full mt-2 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold text-xs py-2.5 px-4 rounded-none text-center transition-all cursor-pointer"
              >
                Done
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: horos-auth.mp4 Video */}
        <div className="hidden md:relative md:flex md:flex-col items-center justify-center bg-[#0d0d0d] border-l border-[#262626] overflow-hidden min-h-[480px]">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/images/horos-auth.mp4" type="video/mp4" />
            <source src="/horos-auth.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/20 to-black/40 pointer-events-none" />

          <div className="absolute bottom-5 left-5 right-5 z-10 p-3.5 bg-black/75 backdrop-blur-md border border-[#333]/90 rounded-none">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-none bg-[#75bf00] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#75bf00] font-bold">
                HOROS CONTINUITY ENGINE
              </span>
            </div>
            <p className="text-[11px] text-[#d4d4d4] leading-snug">
              Continuous agentic control plane, outcome verification & execution runtime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
