import { FooterAsciiStars } from "./footer-ascii-stars";
import { Reveal } from "./motion";

const FOOTER_COLUMNS = [
  {
    title: "PRODUCT",
    links: ["API", "Plugins", "Pricing", "Changelog"],
  },
  {
    title: "RESOURCES",
    links: ["Documentation", "Blog", "Benchmarks"],
  },
  {
    title: "COMPANY",
    links: ["About", "Careers", "Privacy", "Terms"],
  },
];

function ConnectIcons() {
  return (
    <div>
      <p className="font-mono text-[12px] tracking-[0.2em] text-slate-900">CONNECT</p>
      <div className="mt-4 flex items-center gap-4 text-[#6b7280]">
        <a href="#" aria-label="X" className="transition hover:text-slate-900">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M18.9 3H21l-4.59 5.25L21.8 21h-4.22l-3.3-7.37L7.83 21H5.7l4.9-5.6L5.4 3h4.33l2.98 6.7L18.9 3Z" />
          </svg>
        </a>
        <a href="#" aria-label="GitHub" className="transition hover:text-slate-900">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.42-4.04-1.42a3.18 3.18 0 0 0-1.34-1.76c-1.09-.75.08-.74.08-.74a2.53 2.53 0 0 1 1.85 1.24a2.58 2.58 0 0 0 3.52 1a2.6 2.6 0 0 1 .77-1.62c-2.66-.3-5.46-1.33-5.46-5.9A4.62 4.62 0 0 1 6.64 9a4.3 4.3 0 0 1 .12-3.18s1-.33 3.3 1.24a11.45 11.45 0 0 1 6 0c2.28-1.57 3.3-1.24 3.3-1.24a4.3 4.3 0 0 1 .12 3.18a4.62 4.62 0 0 1 1.23 3.2c0 4.58-2.8 5.6-5.47 5.9a2.9 2.9 0 0 1 .82 2.24v3.32c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
          </svg>
        </a>
        <a href="#" aria-label="LinkedIn" className="transition hover:text-slate-900">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M4.98 3.5A2.48 2.48 0 1 1 5 8.46a2.48 2.48 0 0 1-.02-4.96ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05c.53-1 1.84-2.05 3.79-2.05c4.05 0 4.8 2.66 4.8 6.12V21h-4v-5.49c0-1.31-.02-3-1.83-3c-1.83 0-2.11 1.43-2.11 2.9V21h-4V9Z" />
          </svg>
        </a>
        <a href="#" aria-label="Discord" className="transition hover:text-slate-900">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
            <path d="M20.32 4.37A16.7 16.7 0 0 0 16.2 3.1l-.2.4a15.4 15.4 0 0 1 3.72 1.79a12.8 12.8 0 0 0-4.54-2.08a15.7 15.7 0 0 0-6.36 0a12.8 12.8 0 0 0-4.54 2.08A15.4 15.4 0 0 1 8 3.5l-.2-.4a16.7 16.7 0 0 0-4.12 1.27C1.08 8.25.39 12.03.74 15.76A16.9 16.9 0 0 0 5.8 18.3l.95-1.56a10.8 10.8 0 0 1-1.5-.73l.37-.28c2.9 1.36 6.04 1.36 8.9 0l.37.28c-.48.28-.98.52-1.5.73l.95 1.56a16.9 16.9 0 0 0 5.06-2.54c.41-4.33-.7-8.07-2.08-11.39ZM9.68 13.54c-.87 0-1.58-.8-1.58-1.78s.7-1.78 1.58-1.78c.89 0 1.6.8 1.58 1.78c0 .98-.7 1.78-1.58 1.78Zm4.64 0c-.87 0-1.58-.8-1.58-1.78s.7-1.78 1.58-1.78c.89 0 1.6.8 1.58 1.78c0 .98-.69 1.78-1.58 1.78Z" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative border-[#c9d8ee] bg-white">
      <Reveal className="relative overflow-hidden border-b border-[#c9d8ee] px-5 py-20 text-center lg:px-7 lg:py-24">
        <FooterAsciiStars />

        <div className="relative z-10 mx-auto max-w-[1120px]">
          <h2 className="text-[40px] font-semibold tracking-[-0.06em] text-slate-900 md:text-[68px]">
            Your agents need <span className="text-[#2166f3]">memoryos memory.</span>
          </h2>
          <div className="mt-8">
            <a
              href="#developer-experience"
              className="inline-flex items-center justify-center  bg-[#2166f3] px-8 py-3 text-[16px] font-medium text-white md:text-[18px]"
            >
              Read the docs →
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
                      key={link}
                      href="#"
                      className="text-[15px] text-[#516882] transition hover:text-slate-900"
                    >
                      {link}
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
