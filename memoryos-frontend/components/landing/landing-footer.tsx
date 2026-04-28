import { FooterAsciiStars } from "./footer-ascii-stars";
import { Reveal } from "./motion";

const FOOTER_COLUMNS = [
  {
    title: "PRODUCT",
    links: [
      { label: "Developer Console", href: "/developer-console/sign-in" },
      { label: "API + SDK", href: "#developer-experience" },
      { label: "Benchmarks", href: "#benchmarks" },
      { label: "Pricing", href: "#pricing" },
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
      { label: "Contact", href: "mailto:sunilkumarchavhan753@gmail.com" },
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
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.42-4.04-1.42a3.18 3.18 0 0 0-1.34-1.76c-1.09-.75.08-.74.08-.74a2.53 2.53 0 0 1 1.85 1.24a2.58 2.58 0 0 0 3.52 1a2.6 2.6 0 0 1 .77-1.62c-2.66-.3-5.46-1.33-5.46-5.9A4.62 4.62 0 0 1 6.64 9a4.3 4.3 0 0 1 .12-3.18s1-.33 3.3 1.24a11.45 11.45 0 0 1 6 0c2.28-1.57 3.3-1.24 3.3-1.24a4.3 4.3 0 0 1 .12 3.18a4.62 4.62 0 0 1 1.23 3.2c0 4.58-2.8 5.6-5.47 5.9a2.9 2.9 0 0 1 .82 2.24v3.32c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
          </svg>
        </a>
        <a href="/developer-console/sign-in" aria-label="Developer Console" className="transition hover:text-slate-900">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 5h10M7 11h7" />
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
            Ship faster with <span className="text-[#2166f3]">continuity that compounds.</span>
          </h2>
          <div className="mt-8">
            <a
              href="/developer-console/sign-in"
              className="inline-flex items-center justify-center  bg-[#2166f3] px-8 py-3 text-[16px] font-medium text-white md:text-[18px]"
            >
              Open Developer Console →
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
              <span className="text-[22px] text-slate-900">✶</span>
              <span className="text-[20px] font-semibold tracking-[-0.04em] text-slate-900">
                memoryos
              </span>
              <span className="text-[12px] font-semibold text-slate-900">TM</span>
            </div>
            <p className="text-[14px] text-[#61738d]">
              © 2026 MemoryOS Inc. All rights reserved.
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
