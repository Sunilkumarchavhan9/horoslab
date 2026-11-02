"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Mail,
  ChevronDown,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { HorosIcon } from "@/components/horos/primitives/horos-logo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "sign-in" | "sign-up";
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "sign-in",
}: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [signedUpSuccess, setSignedUpSuccess] = useState(false);
  const [registeredIdentity, setRegisteredIdentity] = useState<string>("");

  // Sync mode when initialMode changes or modal opens/closes
  React.useEffect(() => {
    setMode(initialMode);
    if (!isOpen) {
      setSignedUpSuccess(false);
      setIsAuthenticating(false);
      setShowEmailForm(false);
      setEmail("");
      setPassword("");
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSignedUpSuccess(false);
    setIsAuthenticating(false);
    setShowEmailForm(false);
    setEmail("");
    setPassword("");
    onClose();
  };

  const handleAuthenticate = (provider: string) => {
    setAuthProvider(provider);
    setIsAuthenticating(true);

    if (mode === "sign-up") {
      // In sign-up mode: simulate registration handshake and show waitlist confirmation with Cal.com booking
      setTimeout(() => {
        setIsAuthenticating(false);
        const identityName =
          provider === "Email"
            ? email
            : `${provider} Account (Verified)`;
        setRegisteredIdentity(identityName);
        setSignedUpSuccess(true);
      }, 600);
    } else {
      // In sign-in mode: authenticate handshake & navigate to Mission Control
      setTimeout(() => {
        handleClose();
        router.push("/mission-control");
      }, 700);
    }
  };

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    handleAuthenticate("Email");
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-mono text-[#F0EFE2] selection:bg-[#75bf00] selection:text-black cursor-pointer"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[860px] bg-[#161616] border border-[#2e2e2e] rounded-xs overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px] cursor-default"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-30 text-[#777] hover:text-[#F0EFE2] bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] p-1.5 rounded-xs transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Left Side: Auth Form / Confirmation Screen */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-[#161616] z-10">
          {signedUpSuccess ? (
            /* Sign-up Waitlist Confirmation View */
            <div className="flex flex-col justify-between h-full">
              <div>
                {/* Top Logo */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2">
                    <HorosIcon className="w-7 h-5 text-[#F0EFE2]" />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#75bf00]/15 border border-[#75bf00]/40 flex items-center justify-center text-[#75bf00]">
                    <CheckCircle2 size={16} className="text-[#75bf00]" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[#75bf00]/10 border border-[#75bf00]/30 text-[10px] text-[#75bf00] font-mono font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00] animate-pulse" />
                    FOUNDING ACCESS CONFIRMED
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-1 mb-3.5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#F0EFE2]">
                    Thanks for signing up!
                  </h2>
                  <p className="text-xs text-[#8a9485] leading-relaxed">
                    Your spot has been reserved in the HOROS Founding Compute Cohort.
                  </p>
                </div>

                {/* Launch Notification Notice Box */}
                <div className="border border-[#2a2a2a] bg-[#111111] p-3 rounded-xs space-y-2 mb-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#F0EFE2]">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#75bf00]">●</span> Launch Rollout
                    </span>
                    <span className="text-[10px] text-[#75bf00] font-mono">Status: Queued</span>
                  </div>
                  <p className="text-[11px] text-[#C8C7BA] leading-relaxed">
                    We will reach out as soon as possible. When we launch, our team will contact you and send an email with your workspace access and private credentials.
                  </p>
                  <div className="pt-2 border-t border-[#222] flex items-center justify-between text-[10px] text-[#777]">
                    <span>Registered:</span>
                    <span className="text-[#75bf00] font-mono font-semibold truncate max-w-[190px]">
                      {registeredIdentity || "Registered founder"}
                    </span>
                  </div>
                </div>

                {/* Cal.com Demo Booking Card */}
                <div className="border border-[#75bf00]/40 bg-[#75bf00]/5 p-3 rounded-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F0EFE2] flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#75bf00]" />
                      Want a live demo right now?
                    </span>
                    <span className="bg-[#75bf00] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-xs">
                      NO WAIT
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    You don't have to wait for the public rollout. Schedule an immediate 1-on-1 technical walkthrough and live inference demo directly with our founding team on Cal.com.
                  </p>
                  <a
                    href="https://cal.com/vegito"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#75bf00] hover:bg-[#86dc00] text-black font-extrabold text-xs py-2 px-3 rounded-xs transition-all cursor-pointer shadow-sm hover:shadow-[#75bf00]/20"
                  >
                    <Calendar size={13} />
                    <span>Schedule Demo on Cal.com</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="pt-3 border-t border-[#242424] mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSignedUpSuccess(false);
                    setShowEmailForm(false);
                  }}
                  className="text-[11px] text-[#666] hover:text-[#aaa] transition-colors cursor-pointer"
                >
                  ← Use another account
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-[#202020] hover:bg-[#282828] border border-[#333] hover:border-[#444] text-[#F0EFE2] text-xs font-semibold px-4 py-1.5 rounded-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Regular Sign In / Sign Up Form */
            <div>
              {/* Top Logo */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2">
                  <HorosIcon className="w-7 h-5 text-[#F0EFE2]" />
                </div>
              </div>

              {/* Dynamic Title based on Sign In / Sign Up */}
              {mode === "sign-in" ? (
                <div className="space-y-1.5 mb-6">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#F0EFE2] flex items-center gap-2">
                    <span>Welcome</span>
                    <span className="bg-[#75bf00] text-black px-2 py-0.5 text-lg rounded-xs font-black">
                      back
                    </span>
                  </h2>
                  <p className="text-xs text-[#8a9485] leading-relaxed">
                    Sign in to your RunInfra workspace and pick up where you left off.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 mb-6">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#F0EFE2] flex items-center gap-2">
                    <span>Create your</span>
                    <span className="bg-[#75bf00] text-black px-2 py-0.5 text-lg rounded-xs font-black">
                      account
                    </span>
                  </h2>
                  <p className="text-xs text-[#8a9485] leading-relaxed">
                    Spin up a workspace and start deploying optimized inference in minutes.
                  </p>
                </div>
              )}

              {/* Authenticating Loading Overlay State */}
              {isAuthenticating ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-4 border border-[#2a2a2a] bg-[#121212] rounded-xs p-6">
                  <Loader2 className="w-7 h-7 text-[#75bf00] animate-spin" />
                  <div className="text-center space-y-1">
                    <div className="text-xs font-bold text-[#F0EFE2] tracking-wider uppercase">
                      {mode === "sign-up"
                        ? "SECURING FOUNDING RESERVATION..."
                        : "AUTHENTICATING REALITY RUNTIME..."}
                    </div>
                    <div className="text-[11px] text-[#75bf00] font-mono">
                      {mode === "sign-up"
                        ? `Registering ${authProvider || "account"} with founding cohort...`
                        : "Connecting to /mission-control plane..."}
                    </div>
                  </div>
                </div>
              ) : (
                /* Auth Form Buttons */
                <div className="space-y-3">
                  {/* Google Auth Button */}
                  <button
                    type="button"
                    onClick={() => handleAuthenticate("Google")}
                    className="w-full flex items-center justify-center gap-2.5 bg-[#202020] hover:bg-[#282828] border border-[#2d2d2d] hover:border-[#444] text-xs font-bold text-[#F0EFE2] py-2.5 px-4 rounded-xs transition-all cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>Continue with Google</span>
                  </button>

                  {/* GitHub Auth Button */}
                  <button
                    type="button"
                    onClick={() => handleAuthenticate("GitHub")}
                    className="w-full flex items-center justify-center gap-2.5 bg-[#202020] hover:bg-[#282828] border border-[#2d2d2d] hover:border-[#444] text-xs font-bold text-[#F0EFE2] py-2.5 px-4 rounded-xs transition-all cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>Continue with GitHub</span>
                  </button>

                  {/* Sign-up Terms Disclaimer matching Reference UI Image 2 & 3 */}
                  {mode === "sign-up" && (
                    <p className="text-[10px] text-[#666] text-center px-2 py-0.5 leading-normal">
                      By continuing with Google or GitHub, you agree to the{" "}
                      <a href="/terms-of-service" className="underline hover:text-[#aaa]">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy-policy" className="underline hover:text-[#aaa]">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  )}

                  {/* Divider Line matching Reference Screenshots */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="w-full border-t border-[#2a2a2a]" />
                    <span className="absolute bg-[#161616] px-3 text-[10px] font-bold text-[#555] uppercase tracking-wider">
                      OR
                    </span>
                  </div>

                  {/* Continue with Email Dropdown / Form */}
                  {!showEmailForm ? (
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(true)}
                      className="w-full flex items-center justify-between bg-[#202020] hover:bg-[#282828] border border-[#2d2d2d] hover:border-[#444] text-xs font-bold text-[#C8C7BA] hover:text-[#F0EFE2] py-2.5 px-4 rounded-xs transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-[#C8C7BA]" />
                        <span>Continue with email</span>
                      </div>
                      <ChevronDown size={14} className="text-[#666]" />
                    </button>
                  ) : (
                    <form onSubmit={handleSubmitEmail} className="space-y-2.5 pt-1">
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#111] border border-[#333] focus:border-[#75bf00] text-xs text-[#F0EFE2] px-3 py-2 rounded-xs outline-none transition-colors"
                      />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#111] border border-[#333] focus:border-[#75bf00] text-xs text-[#F0EFE2] px-3 py-2 rounded-xs outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-[#75bf00] hover:bg-[#86dc00] text-black font-extrabold text-xs py-2 px-4 rounded-xs transition-all cursor-pointer"
                      >
                        <span>
                          {mode === "sign-in"
                            ? "Sign in to Mission Control"
                            : "Sign up for Founding Access"}
                        </span>
                        <ArrowRight size={13} />
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Footer Mode Switcher matching Reference Screenshots */}
              <div className="pt-6 border-t border-[#242424] mt-6 text-center text-xs text-[#788274]">
                {mode === "sign-in" ? (
                  <span>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("sign-up");
                        setShowEmailForm(false);
                        setSignedUpSuccess(false);
                      }}
                      className="text-[#75bf00] font-bold hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("sign-in");
                        setShowEmailForm(false);
                        setSignedUpSuccess(false);
                      }}
                      className="text-[#75bf00] font-bold hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: High-Contrast Halftone/Dithered GPU Datacenter Server Racks Artwork & Jensen Huang Quote */}
        <div className="hidden md:flex md:w-1/2 bg-[#090909] border-l border-[#242424] relative overflow-hidden flex-col justify-end p-6 select-none">
          {/* Background High-Contrast Dithered GPU Server Racks Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 420 520"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Dark base background */}
              <rect width="420" height="520" fill="#090909" />

              {/* Halftone / Dither Dot Grid Texture for Sky/Cloud Area */}
              <pattern
                id="dither-pattern"
                x="0"
                y="0"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1.5" cy="1.5" r="0.85" fill="#333333" opacity="0.6" />
                <circle cx="4.5" cy="4.5" r="0.85" fill="#222222" opacity="0.4" />
              </pattern>
              <rect width="420" height="240" fill="url(#dither-pattern)" />

              {/* Server Racks Row Geometry */}
              <g opacity="0.95">
                {[15, 62, 109, 156, 203, 250, 297, 344, 391].map((x, i) => (
                  <g key={i}>
                    {/* Outer Rack Enclosure */}
                    <rect
                      x={x}
                      y="190"
                      width="42"
                      height="330"
                      fill="#121212"
                      stroke="#282828"
                      strokeWidth="1"
                    />
                    {/* Top Status Header */}
                    <rect
                      x={x + 2}
                      y="192"
                      width="38"
                      height="12"
                      fill="#1a1a1a"
                    />
                    <circle
                      cx={x + 8}
                      cy="198"
                      r="1.2"
                      fill={i % 3 === 0 ? "#75bf00" : "#ffffff"}
                    />
                    <circle cx={x + 14} cy="198" r="1.2" fill="#444444" />
                    {/* Horizontal Server Blades */}
                    {[210, 235, 260, 285, 310, 335, 360, 385, 410, 435, 460, 485].map(
                      (y, j) => (
                        <g key={j}>
                          <line
                            x1={x + 2}
                            y1={y}
                            x2={x + 40}
                            y2={y}
                            stroke="#222222"
                            strokeWidth="1"
                          />
                          <rect
                            x={x + 4}
                            y={y + 3}
                            width="34"
                            height="18"
                            fill="#161616"
                            stroke="#242424"
                            strokeWidth="0.5"
                          />
                          {/* Vent perforations / dither dots on blade */}
                          <line
                            x1={x + 8}
                            y1={y + 12}
                            x2={x + 32}
                            y2={y + 12}
                            stroke="#2a2a2a"
                            strokeWidth="2"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={x + 34}
                            cy={y + 12}
                            r="1"
                            fill={j % 4 === 0 ? "#75bf00" : "#555555"}
                          />
                        </g>
                      )
                    )}
                  </g>
                ))}
              </g>

              {/* Overhead NVLink Bus Lines & High-Contrast Light Accent */}
              <line x1="0" y1="188" x2="420" y2="188" stroke="#333333" strokeWidth="2" />
              <line
                x1="0"
                y1="190"
                x2="420"
                y2="190"
                stroke="#75bf00"
                strokeWidth="1"
                opacity="0.7"
              />

              {/* Bottom Gradient Fade Overlay */}
              <rect
                width="420"
                height="520"
                fill="url(#bottom-fade-grad)"
              />
              <defs>
                <linearGradient
                  id="bottom-fade-grad"
                  x1="210"
                  y1="0"
                  x2="210"
                  y2="520"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stopColor="#090909" stopOpacity="0.1" />
                  <stop offset="0.5" stopColor="#090909" stopOpacity="0.3" />
                  <stop offset="0.85" stopColor="#090909" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#090909" stopOpacity="0.98" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Bottom Quote Overlay matching auth1image.png */}
          <div className="relative z-10 bg-black/60 backdrop-blur-xs p-3.5 space-y-1.5 rounded-xs mt-auto border-t border-white/5">
            <div className="text-xs sm:text-sm font-bold text-[#F0EFE2] font-mono leading-snug flex items-start">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00] shrink-0 mt-1.5 mr-2" />
              <span>Take control of your intelligence. Build your own AI.</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#C8C7BA] pl-3.5">
              <span className="h-0.5 w-3 bg-[#75bf00]" />
              <span className="font-extrabold text-[#eee]">JENSEN HUANG</span>
              <span className="text-[#666]">CEO, NVIDIA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
