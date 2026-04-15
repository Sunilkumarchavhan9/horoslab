"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useEffect, useMemo, useState } from "react";

type EmailLinkVerificationProps = {
  completeUrl: string;
  signInUrl: string;
  surface: "dark" | "light";
};

type VerificationState = "verifying" | "other-device" | "error";

function getErrorMessage(error: unknown) {
  if (isClerkAPIResponseError(error) && error.errors.length > 0) {
    return error.errors[0]?.longMessage || error.errors[0]?.message || "Verification failed.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Verification failed. Try requesting a new magic link.";
}

export function EmailLinkVerification({
  completeUrl,
  signInUrl,
  surface,
}: EmailLinkVerificationProps) {
  const clerk = useClerk();
  const [state, setState] = useState<VerificationState>("verifying");
  const [message, setMessage] = useState("Verifying your magic link...");

  const styles = useMemo(
    () =>
      surface === "dark"
        ? {
            shell: "min-h-svh bg-[#05070f] text-white",
            card: "border border-white/10 bg-[#08101c] text-white shadow-[0_30px_80px_rgba(0,0,0,0.55)]",
            body: "text-white/72",
            button: "border border-white/12 text-white hover:bg-white/5",
          }
        : {
            shell: "min-h-svh bg-white text-[#09111c]",
            card: "border border-[#d8e0ee] bg-white text-[#09111c] shadow-[0_20px_50px_rgba(9,17,28,0.08)]",
            body: "text-[#5f6b7e]",
            button: "border border-[#d8e0ee] text-[#09111c] hover:bg-[#f7f9fd]",
          },
    [surface],
  );

  useEffect(() => {
    let active = true;

    if (!clerk.loaded) {
      return () => {
        active = false;
      };
    }

    clerk
      .handleEmailLinkVerification({
        redirectUrlComplete: completeUrl,
        redirectUrl: signInUrl,
        onVerifiedOnOtherDevice: () => {
          if (!active) return;
          setState("other-device");
          setMessage("This link was opened on a different device. Return to the original tab to finish sign-in.");
        },
      })
      .catch((error) => {
        if (!active) return;
        setState("error");
        setMessage(getErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [clerk, completeUrl, signInUrl]);

  return (
    <main className={`grid place-items-center px-6 py-10 ${styles.shell}`}>
      <div className={`w-full max-w-[520px] rounded-[24px] px-6 py-8 text-center sm:px-8 sm:py-10 ${styles.card}`}>
        <h1 className="text-[28px] font-semibold tracking-[-0.05em] sm:text-[34px]">
          {state === "verifying" ? "Checking your link" : state === "other-device" ? "Open the original tab" : "Link verification failed"}
        </h1>
        <p className={`mt-4 text-[15px] leading-7 sm:text-[16px] ${styles.body}`}>
          {clerk.loaded ? message : "Preparing secure verification..."}
        </p>
        {state !== "verifying" ? (
          <Link
            href={signInUrl}
            className={`mt-8 inline-flex min-h-[46px] items-center justify-center px-5 text-[14px] font-medium transition sm:text-[15px] ${styles.button}`}
          >
            Back to sign in
          </Link>
        ) : null}
      </div>
    </main>
  );
}
