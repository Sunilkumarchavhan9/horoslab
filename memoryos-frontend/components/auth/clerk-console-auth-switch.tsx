"use client";

import { useRouter } from "next/navigation";

type ClerkConsoleAuthSwitchProps = {
  active: "sign-in" | "sign-up";
};

export function ClerkConsoleAuthSwitch({ active }: ClerkConsoleAuthSwitchProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#101010] p-1 text-[13px]">
      <button
        type="button"
        onClick={() => router.push("/auth/sign-in")}
        aria-current={active === "sign-in" ? "page" : undefined}
        className={
          active === "sign-in"
            ? "flex-1 rounded-full bg-white/10 px-4 py-2 text-center font-medium text-white"
            : "flex-1 rounded-full px-4 py-2 text-center font-medium text-[#a5acb8] transition hover:bg-white/5 hover:text-white"
        }
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => router.push("/auth/sign-up")}
        aria-current={active === "sign-up" ? "page" : undefined}
        className={
          active === "sign-up"
            ? "flex-1 rounded-full bg-white/10 px-4 py-2 text-center font-medium text-white"
            : "flex-1 rounded-full px-4 py-2 text-center font-medium text-[#a5acb8] transition hover:bg-white/5 hover:text-white"
        }
      >
        Sign up
      </button>
    </div>
  );
}
