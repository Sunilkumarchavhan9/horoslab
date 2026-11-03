"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Mail,
  ArrowRight,
  Calendar,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { HorosLogo, HorosWordmarkLogo } from "@/components/horos/primitives/brand-icons";

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

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setIsConfirmed(false);
    setIsSubmitting(false);
    setLoadingProvider(null);
    setEmail("");
    onClose();
  };

  const handleOAuth = async (provider: "google" | "github" | "linkedin") => {
    setLoadingProvider(provider);
    const targetLabel = `${provider.charAt(0).toUpperCase() + provider.slice(1)} account`;
    setRegisteredEmail(targetLabel);

    try {
      // 1. Try WorkOS enterprise authorize endpoint
      const res = await fetch(`/api/auth/workos/authorize?provider=${provider}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.enabled && data?.url) {
          // Live WorkOS flow: redirect directly to identity provider
          window.location.href = data.url;
          return;
        }
      }
    } catch (err) {
      console.warn("[HOROS Auth] WorkOS direct call fallback", err);
    }

    // Record early access lead via background endpoint
    try {
      await fetch("/api/auth/workos/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `oauth_${provider}@user.pending`, provider }),
      });
    } catch {
      // safe fallback
    }

    // Modal in-place confirmation flip
    setTimeout(() => {
      setLoadingProvider(null);
      setIsConfirmed(true);
    }, 350);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    setRegisteredEmail(email);

    try {
      await fetch("/api/auth/workos/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, provider: "email" }),
      });
    } catch (err) {
      console.warn("[HOROS Auth] Early access registration fallback", err);
    }

    // Modal in-place confirmation flip
    setTimeout(() => {
      setIsSubmitting(false);
      setIsConfirmed(true);
    }, 350);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-[#75bf00] selection:text-black cursor-pointer animate-in fade-in duration-200"
    >
      {/* Centered Premium Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[430px] bg-[#141414] border border-[#2b2b2b] rounded-lg shadow-2xl p-6 sm:p-8 cursor-default overflow-hidden text-[#F0EFE2]"
      >
        {/* Subtle top lime glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#75bf00] to-transparent opacity-80" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#777] hover:text-[#F0EFE2] bg-[#1e1e1e] hover:bg-[#282828] border border-[#333] p-1.5 rounded-md transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {!isConfirmed ? (
          /* Sign-Up Card Form */
          <div>
            {/* Header: Logo & Badge */}
            <div className="flex items-center gap-2 mb-4">
              <HorosLogo variant="icon" size="sm" className="text-[#F0EFE2]" />
              <HorosWordmarkLogo className="h-4 w-auto text-[#F0EFE2]" />
            </div>

            <div className="space-y-1 mb-6">
              <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-[#F0EFE2]">
                Create your account
              </h2>
              <p className="text-xs text-[#8c8c8c] leading-relaxed">
                Sign up with your account to get early access before everyone else.
              </p>
            </div>

            {/* 3 Social Login Buttons: Google, GitHub, LinkedIn */}
            <div className="space-y-2.5">
              {/* Google */}
              <button
                type="button"
                disabled={Boolean(loadingProvider) || isSubmitting}
                onClick={() => handleOAuth("google")}
                className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-2.5 px-4 rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loadingProvider === "google" ? (
                  <Loader2 size={15} className="text-[#75bf00] animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Continue with Google</span>
              </button>

              {/* GitHub */}
              <button
                type="button"
                disabled={Boolean(loadingProvider) || isSubmitting}
                onClick={() => handleOAuth("github")}
                className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-2.5 px-4 rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loadingProvider === "github" ? (
                  <Loader2 size={15} className="text-[#75bf00] animate-spin" />
                ) : (
                  <GithubIcon />
                )}
                <span>Continue with GitHub</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                disabled={Boolean(loadingProvider) || isSubmitting}
                onClick={() => handleOAuth("linkedin")}
                className="w-full flex items-center justify-center gap-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] hover:border-[#4d4d4d] text-xs font-semibold text-[#F0EFE2] py-2.5 px-4 rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loadingProvider === "linkedin" ? (
                  <Loader2 size={15} className="text-[#75bf00] animate-spin" />
                ) : (
                  <LinkedInIcon />
                )}
                <span>Continue with LinkedIn</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-5">
              <div className="w-full border-t border-[#292929]" />
              <span className="absolute bg-[#141414] px-3 text-[10px] font-mono text-[#666] tracking-wider uppercase">
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
                className="w-full bg-[#101010] border border-[#303030] focus:border-[#75bf00] text-xs text-[#F0EFE2] placeholder:text-[#555] px-3.5 py-2.5 rounded-md outline-none transition-colors font-mono"
              />
              <button
                type="submit"
                disabled={isSubmitting || Boolean(loadingProvider)}
                className="w-full flex items-center justify-center gap-2 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold text-xs py-2.5 px-4 rounded-md transition-all cursor-pointer disabled:opacity-50 shadow-sm"
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

            {/* Terms notice */}
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
          /* In-Place Confirmation Card (Tier-1 Startup Experience) */
          <div className="py-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#75bf00]/15 border border-[#75bf00]/40 flex items-center justify-center text-[#75bf00] shrink-0">
                <CheckCircle2 size={18} className="text-[#75bf00]" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#75bf00]/10 border border-[#75bf00]/30 text-[10.5px] text-[#75bf00] font-mono font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00] animate-pulse" />
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

            {registeredEmail && (
              <div className="bg-[#101010] border border-[#262626] p-3 rounded-md text-[11px] font-mono text-[#888] flex items-center justify-between">
                <span>Notification target:</span>
                <span className="text-[#75bf00] font-semibold truncate max-w-[180px]">
                  {registeredEmail}
                </span>
              </div>
            )}

            {/* Cal.com Demo Link */}
            <div className="pt-3 border-t border-[#242424] flex items-center justify-between text-xs text-[#777]">
              <span>Want a live demo now?</span>
              <a
                href="https://cal.com/vegito"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#75bf00] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Schedule on Cal.com</span>
                <ArrowUpRight size={12} />
              </a>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-[#1e1e1e] hover:bg-[#282828] border border-[#333] hover:border-[#444] text-[#F0EFE2] font-semibold text-xs py-2.5 px-4 rounded-md transition-colors cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
