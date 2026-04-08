import Link from "next/link";
import Image from "next/image";
import { MemoryStarLogo } from "../landing/memory-star-logo";

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
    <main className="min-h-svh bg-black xl:grid xl:h-svh xl:grid-cols-[minmax(520px,0.92fr)_1.08fr] xl:overflow-hidden">
      <section className="flex min-h-svh bg-[#171717] text-white xl:min-h-0 xl:h-svh">
        <div className="mx-auto flex w-full max-w-[560px] flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:max-w-[520px] lg:px-10 xl:py-12">
          <Link href="/" className="w-fit">
            <MemoryStarLogo tone="white" />
          </Link>

          <div className="mt-10 sm:mt-12 xl:mt-14">
            <h1 className="text-[30px] font-semibold tracking-[-0.05em] text-white sm:text-[36px] lg:text-[44px]">
              {title}
            </h1>
            <p className="mt-4 max-w-[440px] text-[16px] leading-7 text-[#a5acb8] sm:text-[17px] lg:text-[18px] lg:leading-8">
              {subtitle}
            </p>
          </div>

          <div className="mt-8 sm:mt-10">{children}</div>

          <p className="mt-6 text-[13px] leading-6 text-[#767d87] sm:text-[14px] sm:leading-7">
            By continuing, you agree to the Terms and Privacy Policy.
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden border-l border-[#202020] bg-[#070707] xl:flex xl:h-svh xl:min-h-0 xl:flex-col">
        <div className="absolute inset-x-0 top-0 h-[62%] sm:h-[64%] lg:h-[65%]">
          <Image
            src="/dev.jpg"
            alt="Developer console visual"
            fill
            priority
            className="object-cover object-center"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_28%,rgba(0,0,0,0.1)_70%,transparent)]" />
        </div>

        <div className="relative mt-auto border-t border-[#202020] bg-black/92 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <p className="text-center font-mono text-[11px] tracking-[0.16em] text-[#d5d5d5] sm:text-[12px] lg:text-[14px] lg:tracking-[0.18em]">
            {footerLabel}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 sm:mt-8 sm:grid-cols-3 sm:gap-x-10 sm:gap-y-8 lg:mt-10 lg:gap-x-14 lg:gap-y-10">
            {LOGO_STRIP.map((item) => (
              <div
                key={item}
                className="text-center text-[15px] font-medium tracking-[-0.02em] text-white/90 sm:text-[16px] lg:text-[18px]"
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
