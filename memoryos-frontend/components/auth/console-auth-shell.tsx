import Link from "next/link";
import Image from "next/image";
import { MemoryStarLogo } from "../landing/memory-star-logo";
import { GlitchBackground } from "./glitch-background";

type ConsoleAuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerLabel: string;
};

const LOGO_STRIP = ["Cursor", "Claude", "VS Code", "GitHub", "MCP", "API"];

export function ConsoleAuthShell({
  title,
  subtitle,
  children,
  footerLabel,
}: ConsoleAuthShellProps) {
  return (
    <main className="min-h-svh bg-black lg:grid lg:min-h-svh lg:grid-cols-[minmax(420px,0.9fr)_1.1fr] lg:overflow-hidden xl:grid-cols-[minmax(500px,0.92fr)_1.08fr]">
      <section className="flex min-h-svh bg-[#171717] text-white lg:min-h-0 lg:h-svh">
        <div className="mx-auto flex w-full max-w-[560px] flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 lg:max-w-[520px] lg:px-10 lg:py-10 xl:py-12">
          <Link href="/" className="mt-5 w-fit lg:mt-3">
            <MemoryStarLogo tone="white" />
          </Link>

          <div className="mt-8 sm:mt-10 lg:mt-12 xl:mt-14">
            <h1 className="text-balance text-[28px] font-semibold tracking-[-0.05em] text-white sm:text-[34px] lg:text-[40px] xl:text-[44px]">
              {title}
            </h1>
            <p className="mt-4 max-w-[440px] text-[15px] leading-7 text-[#a5acb8] sm:text-[16px] lg:text-[17px] lg:leading-8 xl:text-[18px]">
              {subtitle}
            </p>
          </div>

          <div className="mt-8 sm:mt-9 lg:mt-10">{children}</div>

          <p className="mt-6 text-[13px] leading-6 text-[#767d87] sm:text-[14px] sm:leading-7">
            By continuing, you agree to the Terms and Privacy Policy.
          </p>

          <div className="mt-8 rounded-[24px] border border-[#242424] bg-[#0c0c0c] px-4 py-5 lg:hidden">
            <p className="text-center font-mono text-[11px] tracking-[0.16em] text-[#d5d5d5] sm:text-[12px]">
              {footerLabel}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              {LOGO_STRIP.map((item) => (
                <div
                  key={item}
                  className="text-center text-[14px] font-medium tracking-[-0.02em] text-white/88 sm:text-[15px]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden border-l border-[#202020] bg-[#070707] lg:flex lg:h-svh lg:min-h-0 lg:flex-col">
        <GlitchBackground />
        <div className="absolute inset-x-0 top-0 h-[62%] sm:h-[64%] lg:h-[65%]">
          <Image
            src="/dev.jpg"
            alt="Developer console visual"
            fill
            priority
            className="object-cover object-center"
            sizes="(min-width: 1024px) 55vw, 100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_28%,rgba(0,0,0,0.1)_70%,transparent)]" />
        </div>

        <div className="relative mt-auto border-t border-[#202020] bg-black/92 px-5 py-6 text-white sm:px-8 sm:py-8 lg:px-10 lg:py-10 xl:px-12 xl:py-14">
          <p className="text-center font-mono text-[11px] tracking-[0.16em] text-[#d5d5d5] sm:text-[12px] lg:text-[13px] lg:tracking-[0.18em] xl:text-[14px]">
            {footerLabel}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:mt-7 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-6 lg:mt-8 lg:gap-x-10 lg:gap-y-8 xl:mt-10 xl:gap-x-14 xl:gap-y-10">
            {LOGO_STRIP.map((item) => (
              <div
                key={item}
                className="text-center text-[14px] font-medium tracking-[-0.02em] text-white/90 sm:text-[15px] lg:text-[16px] xl:text-[18px]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
