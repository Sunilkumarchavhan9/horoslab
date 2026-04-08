"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";

type ClerkPersonalSignInProps = {
  redirectTo: "/personal-app";
};

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
      className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-[16px] border border-[#0a437f] bg-[linear-gradient(180deg,#083367_0%,#082a56_100%)] px-5 text-[16px] font-semibold text-white transition hover:border-[#1661b0] hover:bg-[linear-gradient(180deg,#093874_0%,#0a2f62_100%)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function ClerkPersonalSignIn({ redirectTo }: ClerkPersonalSignInProps) {
  const { isLoaded, signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [pendingStrategy, setPendingStrategy] = useState<"google" | "github" | null>(null);

  async function handleOauth(strategy: "oauth_google" | "oauth_github", completeUrl: string) {
    if (!isLoaded || !signIn) return;

    setPendingStrategy(strategy === "oauth_google" ? "google" : "github");
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: completeUrl,
      });
    } finally {
      setPendingStrategy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] space-y-4 text-left">
      <SocialButton
        onClick={() => handleOauth("oauth_google", redirectTo)}
        disabled={!isLoaded || pendingStrategy !== null}
      >
        <GoogleMark />
        <span>{pendingStrategy === "google" ? "Connecting..." : "Continue with Google"}</span>
      </SocialButton>

      <SocialButton
        onClick={() => handleOauth("oauth_github", redirectTo)}
        disabled={!isLoaded || pendingStrategy !== null}
      >
        <GithubMark />
        <span>{pendingStrategy === "github" ? "Connecting..." : "Continue with GitHub"}</span>
      </SocialButton>

      <div className="flex items-center justify-center py-1 text-[14px] font-semibold tracking-[0.08em] text-white/90">
        OR
      </div>

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="your@email.com"
        className="h-[56px] w-full rounded-[16px] border border-white/8 bg-[#09111c] px-5 text-[17px] text-white outline-none transition placeholder:text-[#667085] focus:border-[#215eb0]"
      />

      <button
        type="button"
        disabled
        className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-[16px] border border-[#6d90ff] bg-[linear-gradient(180deg,#4782ff_0%,#4d53ff_18%,#3324ff_100%)] px-5 text-[16px] font-semibold text-white shadow-[0_18px_40px_rgba(54,88,255,0.4)] disabled:opacity-100"
      >
        <BrandMark />
        <span>Open MemoryOS Personal</span>
      </button>

      <p className="pt-4 text-center text-[14px] leading-7 text-[#7d8596]">
        By continuing, you agree to our <a href="#" className="underline underline-offset-2">Terms</a> and{" "}
        <a href="#" className="underline underline-offset-2">Privacy Policy</a>.
      </p>
    </div>
  );
}
