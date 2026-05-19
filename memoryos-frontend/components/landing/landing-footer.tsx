import { FooterAsciiStars } from "./footer-ascii-stars";
import { Reveal } from "./motion";
import { MemoryStarLogo } from "./memory-star-logo";

const FOOTER_COLUMNS = [
  {
    title: "PRODUCT",
    links: [
      { label: "Developer Console", href: "/developer-console/sign-in" },
      { label: "API + SDK", href: "#developer-experience" },
      { label: "Proof", href: "#benchmarks" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "DEVELOPERS",
    links: [
      { label: "Quickstart", href: "#developer-experience" },
      { label: "Context Stack", href: "#context-stack" },
      { label: "Under The Hood", href: "#under-the-hood" },
      { label: "GitHub", href: "https://github.com/Sunilkumarchavhan9/MemoryOS" },
    ],
  },
  {
    title: "COMPANY",
    links: [
      { label: "About", href: "#what-we-do" },
      { label: "Enterprise", href: "#enterprise" },
      { label: "Terms", href: "/terms-of-service" },
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Refunds", href: "/refund-policy" },
      { label: "Contact", href: "mailto:chavhansunilkumar753@gmail.com" },
    ],
  },
];

function ConnectIcons() {
  return (
    <div>
      <p className="font-mono text-[12px] tracking-[0.2em] text-slate-900">CONNECT</p>
      <div className="mt-4 flex items-center gap-4 text-[#6b7280]">
        <a
          href="https://github.com/Sunilkumarchavhan9/MemoryOS"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="transition hover:text-slate-900"
        >
          <svg viewBox="0 0 16 16" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
        </a>
        <a href="https://x.com/memoryostm" aria-label="X (Twitter)" target="_blank" rel="noreferrer" className="transition hover:text-slate-900">
          <svg viewBox="0 0 16 16" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
          </svg>
        </a>
        <a href="https://discord.gg/JtwaRJaeR" aria-label="Discord" target="_blank" rel="noreferrer" className="transition hover:text-slate-900">
          <svg viewBox="0 0 16 16" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer id="contact" className="relative border-[#c9d8ee] bg-white">
      <Reveal className="relative overflow-hidden border-b border-[#c9d8ee] px-5 py-20 text-center lg:px-7 lg:py-24">
        <FooterAsciiStars />

        <div className="relative z-10 mx-auto max-w-[1120px]">
          <h2 className="text-[40px] font-semibold tracking-[-0.06em] text-slate-900 md:text-[68px]">
            Build faster with <span className="text-blue-600">a company brain that compounds.</span>
          </h2>
          <div className="mt-8">
            <a
              href="/developer-console/sign-in"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition-colors px-8 py-3 text-[16px] font-medium text-white md:text-[18px]"
            >
              Start Building &rarr;
            </a>
          </div>
        </div>
      </Reveal>

      <Reveal className="relative px-5 py-10 lg:px-7 lg:py-12">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-[12px] tracking-[0.2em] text-slate-900">
                  {column.title}
                </p>
                <div className="mt-4 grid gap-3">
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                      className="text-[15px] text-[#516882] transition hover:text-slate-900"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <ConnectIcons />
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[#c9d8ee] pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <MemoryStarLogo />
            </div>
            <p className="text-[14px] text-[#61738d]">
              ©2026 memoryos™ Inc. All rights reserved.
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}

