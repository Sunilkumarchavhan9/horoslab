"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const STAR_PATH =
  "M11.2644 0.000937462L12.8644 9.34494L21.7604 6.01694L22.0164 6.46494L14.7204 12.5449L22.0164 18.5609L21.7604 19.0089L12.8644 15.7449L11.2644 25.0889H10.7524L9.15244 15.7449L0.256437 19.0089L0.000436783 18.5609L7.29644 12.5449L0.000436783 6.46494L0.256437 6.01694L9.15244 9.34494L10.7524 0.000937462H11.2644Z";

function PersonalStarMark() {
  return (
    <svg viewBox="0 0 23 26" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" aria-hidden="true">
      <path d={STAR_PATH} fill="#ffffff" />
    </svg>
  );
}

type PersonalAuthShellProps = {
  children: ReactNode;
};

export function PersonalAuthShell({ children }: PersonalAuthShellProps) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#04060d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.045),rgba(255,255,255,0)_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,40,0.14)_0%,rgba(8,8,26,0.08)_26%,rgba(3,5,10,0)_42%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_78%,rgba(37,28,86,0.16),rgba(4,6,13,0)_42%)]" />
      <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(rgba(255,255,255,0.8)_0.55px,transparent_0.55px)] [background-size:7px_7px]" />
      <div className="absolute -bottom-18 left-1/2 h-[220px] w-[320px] -translate-x-1/2 rounded-full bg-[#f5f7ff]/18 blur-[88px] sm:h-[270px] sm:w-[460px] sm:blur-[108px]" />
      <div className="absolute -bottom-28 left-[16%] h-[220px] w-[220px] rounded-full bg-[#3726ae]/22 blur-[108px] sm:h-[300px] sm:w-[320px] sm:blur-[132px]" />
      <div className="absolute -bottom-28 right-[14%] h-[220px] w-[240px] rounded-full bg-[#0c28a3]/24 blur-[110px] sm:h-[320px] sm:w-[340px] sm:blur-[138px]" />
      <div className="pointer-events-none absolute bottom-[116px] left-1/2 h-[74px] w-[52vw] min-w-[280px] max-w-[760px] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,rgba(52,37,166,0)_0%,rgba(90,71,214,0.16)_18%,rgba(241,245,255,0.98)_50%,rgba(12,40,163,0.22)_82%,rgba(12,40,163,0)_100%)] opacity-82 blur-[26px] beam-float sm:bottom-[130px] sm:h-[88px]" />
      <div className="pointer-events-none absolute bottom-[102px] left-1/2 h-[112px] w-[32vw] min-w-[220px] max-w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(247,249,255,0.98)_0%,rgba(228,235,255,0.72)_26%,rgba(12,40,163,0.16)_58%,rgba(4,6,13,0)_82%)] opacity-94 blur-[22px] beam-pulse sm:bottom-[112px]" />

      <div className="relative flex min-h-svh flex-col px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="inline-flex">
            <PersonalStarMark />
          </Link>

          <a
            href="#"
            className="inline-flex min-h-[42px] items-center justify-center rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(29,35,45,0.94),rgba(15,19,27,0.98))] px-4 py-2 text-[13px] font-semibold text-white/95 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(34,42,54,0.98),rgba(18,23,33,0.98))] sm:min-h-[48px] sm:px-6 sm:py-3 sm:text-[15px]"
          >
            Memory API↗
          </a>
        </div>

        <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col items-center justify-center pb-6 pt-10 text-center sm:pb-8 sm:pt-14 lg:pt-16">
          <h1 className="max-w-[980px] text-balance text-[30px] font-semibold tracking-[-0.065em] text-white sm:text-[42px] md:text-[56px] lg:text-[68px]">
            Never lose project context, anywhere with MemoryOS
          </h1>

          <p className="mt-4 max-w-[640px] text-balance text-[14px] leading-6 text-[#93a3bc] sm:mt-5 sm:text-[16px] sm:leading-7">
            Access your MemoryOS workspace from any screen size without losing the sign-in flow.
          </p>

          <div className="mt-8 w-full max-w-[760px] rounded-[22px] border border-[#0d2746] bg-[linear-gradient(180deg,rgba(6,16,30,0.985),rgba(3,9,17,0.995))] px-4 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(52,92,146,0.2)] backdrop-blur-xl sm:mt-10 sm:rounded-[28px] sm:px-7 sm:py-7 md:px-10 md:py-8">
            {children}
          </div>
        </div>
      </div>
      <style jsx>{`
        .beam-float {
          animation: beam-float 7.6s ease-in-out infinite;
        }

        .beam-pulse {
          animation: beam-pulse 4.8s ease-in-out infinite;
        }

        @keyframes beam-float {
          0%,
          100% {
            opacity: 0.52;
            transform: translateX(-50%) scaleX(0.94);
          }
          50% {
            opacity: 0.9;
            transform: translateX(-50%) scaleX(1.02);
          }
        }

        @keyframes beam-pulse {
          0%,
          100% {
            opacity: 0.54;
            transform: translateX(-50%) scale(0.92);
          }
          50% {
            opacity: 0.98;
            transform: translateX(-50%) scale(1.06);
          }
        }
      `}</style>
    </main>
  );
}
