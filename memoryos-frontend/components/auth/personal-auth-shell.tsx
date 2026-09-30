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
    <main className="relative min-h-svh overflow-hidden bg-[#08090c] text-[#F0EFE2]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(49,75,244,0.16),rgba(255,255,255,0)_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,59,0.36)_0%,rgba(10,43,167,0.16)_28%,rgba(8,9,12,0)_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_78%,rgba(9,40,145,0.3),rgba(8,9,12,0)_44%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(180deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_10px),repeating-linear-gradient(135deg,rgba(255,255,255,0.025)_0,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_16px)] [background-size:100%_100%,100%_100%] [background-repeat:repeat]" />
      <div className="absolute -bottom-18 left-1/2 h-[220px] w-[320px] -translate-x-1/2 rounded-full bg-[#314bf4]/24 blur-[88px] sm:h-[270px] sm:w-[460px] sm:blur-[108px]" />
      <div className="absolute -bottom-28 left-[16%] h-[220px] w-[220px] rounded-full bg-[#0a2ba7]/26 blur-[108px] sm:h-[300px] sm:w-[320px] sm:blur-[132px]" />
      <div className="absolute -bottom-28 right-[14%] h-[220px] w-[240px] rounded-full bg-[#092891]/26 blur-[110px] sm:h-[320px] sm:w-[340px] sm:blur-[138px]" />
      <div className="pointer-events-none absolute bottom-[116px] left-1/2 h-[74px] w-[52vw] min-w-[280px] max-w-[760px] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,rgba(10,43,167,0)_0%,rgba(10,43,167,0.22)_18%,rgba(49,75,244,0.96)_50%,rgba(9,40,145,0.26)_82%,rgba(9,40,145,0)_100%)] opacity-82 blur-[26px] beam-float sm:bottom-[130px] sm:h-[88px]" />
      <div className="pointer-events-none absolute bottom-[102px] left-1/2 h-[112px] w-[32vw] min-w-[220px] max-w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(49,75,244,0.94)_0%,rgba(9,40,145,0.58)_32%,rgba(8,9,59,0.26)_58%,rgba(8,9,12,0)_84%)] opacity-94 blur-[22px] beam-pulse sm:bottom-[112px]" />

      <div className="relative flex min-h-svh flex-col px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="inline-flex">
            <PersonalStarMark />
          </Link>

          <a
            href="#"
            className="inline-flex min-h-[42px] items-center justify-center rounded-[5px] bg-[linear-gradient(180deg,#181c22_0%,#08090c_100%)] px-4 py-2 text-[13px] font-semibold text-[#F0EFE2]/95 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:bg-[linear-gradient(180deg,#1f2530_0%,#0b0d15_100%)] sm:min-h-[48px] sm:px-6 sm:py-3 sm:text-[15px]"
          >
            Dhyra API↗
          </a>
        </div>

        <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col items-center justify-center pb-6 pt-10 text-center sm:pb-8 sm:pt-14 lg:pt-16">
          <h1 className="max-w-[980px] text-balance text-[30px] font-semibold tracking-[-0.065em] text-[#F0EFE2] sm:text-[42px] md:text-[56px] lg:text-[68px]">
            Never forget anything, anywhere with Dhyra
          </h1>

          <div className="mt-8 w-full max-w-[760px] rounded-[5px] bg-[linear-gradient(180deg,#181c22_0%,#08090c_100%)] px-4 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:mt-10 sm:rounded-[5px] sm:px-7 sm:py-7 md:px-10 md:py-8">
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
