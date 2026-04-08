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
      <div className="absolute -bottom-18 left-1/2 h-[230px] w-[360px] -translate-x-1/2 rounded-full bg-[#f5f7ff]/20 blur-[92px] sm:h-[280px] sm:w-[500px] sm:blur-[114px]" />
      <div className="absolute -bottom-28 left-[14%] h-[230px] w-[260px] rounded-full bg-[#3726ae]/28 blur-[110px] sm:h-[320px] sm:w-[360px] sm:blur-[138px]" />
      <div className="absolute -bottom-28 right-[12%] h-[240px] w-[280px] rounded-full bg-[#0c28a3]/30 blur-[112px] sm:h-[340px] sm:w-[390px] sm:blur-[144px]" />
      <div className="pointer-events-none absolute bottom-[116px] left-1/2 h-[82px] w-[58vw] min-w-[320px] max-w-[920px] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,rgba(52,37,166,0)_0%,rgba(90,71,214,0.22)_18%,rgba(241,245,255,0.98)_50%,rgba(12,40,163,0.28)_82%,rgba(12,40,163,0)_100%)] opacity-78 blur-[30px] beam-float sm:bottom-[130px] sm:h-[96px]" />
      <div className="pointer-events-none absolute bottom-[100px] left-1/2 h-[126px] w-[40vw] min-w-[260px] max-w-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(247,249,255,0.96)_0%,rgba(228,235,255,0.7)_24%,rgba(12,40,163,0.24)_58%,rgba(4,6,13,0)_82%)] opacity-92 blur-[24px] beam-pulse sm:bottom-[112px]" />

      <div className="relative flex min-h-svh flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <div className="flex items-start justify-between gap-4">
          <Link href="/" className="inline-flex">
            <PersonalStarMark />
          </Link>

          <a
            href="#"
            className="inline-flex items-center rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(29,35,45,0.94),rgba(15,19,27,0.98))] px-4 py-2.5 text-[14px] font-semibold text-white/95 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(34,42,54,0.98),rgba(18,23,33,0.98))] sm:px-6 sm:py-3 sm:text-[15px]"
          >
            Memory API↗
          </a>
        </div>

        <div className="mx-auto flex w-full max-w-[920px] flex-1 flex-col items-center justify-center pb-8 pt-14 text-center sm:pt-20 lg:pt-24">
          <h1 className="max-w-[1020px] text-balance text-[40px] font-semibold tracking-[-0.065em] text-white sm:text-[56px] md:text-[68px] lg:text-[76px]">
            Never lose project context, anywhere with MemoryOS
          </h1>

          <div className="mt-14 w-full max-w-[760px] rounded-[28px] border border-[#0d2746] bg-[linear-gradient(180deg,rgba(6,16,30,0.985),rgba(3,9,17,0.995))] px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(52,92,146,0.2)] backdrop-blur-xl sm:mt-16 sm:px-10 sm:py-8">
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
