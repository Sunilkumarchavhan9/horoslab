import { MemoryStarLogo } from "./memory-star-logo";

const PRIMARY_LINKS = [
  { label: "Research", href: "#benchmarks" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#developer-experience" },
  { label: "Blog", href: "#what-we-do" },
];

function GithubIcon() {
  return (
    <svg height="18" width="18" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0C3.58 0 0 3.57879 0 7.99729C0 11.5361 2.29 14.5251 5.47 15.5847C5.87 15.6547 6.02 15.4148 6.02 15.2049C6.02 15.0149 6.01 14.3851 6.01 13.7154C4 14.0852 3.48 13.2255 3.32 12.7757C3.23 12.5458 2.84 11.836 2.5 11.6461C2.22 11.4961 1.82 11.1262 2.49 11.1162C3.12 11.1062 3.57 11.696 3.72 11.936C4.44 13.1455 5.59 12.8057 6.05 12.5957C6.12 12.0759 6.33 11.726 6.56 11.5261C4.78 11.3262 2.92 10.6364 2.92 7.57743C2.92 6.70773 3.23 5.98797 3.74 5.42816C3.66 5.22823 3.38 4.40851 3.82 3.30888C3.82 3.30888 4.49 3.09895 6.02 4.1286C6.66 3.94866 7.34 3.85869 8.02 3.85869C8.7 3.85869 9.38 3.94866 10.02 4.1286C11.55 3.08895 12.22 3.30888 12.22 3.30888C12.66 4.40851 12.38 5.22823 12.3 5.42816C12.81 5.98797 13.12 6.69773 13.12 7.57743C13.12 10.6464 11.25 11.3262 9.47 11.5261C9.76 11.776 10.01 12.2558 10.01 13.0056C10.01 14.0752 10 14.9349 10 15.2049C10 15.4148 10.15 15.6647 10.55 15.5847C12.1381 15.0488 13.5182 14.0284 14.4958 12.6673C15.4735 11.3062 15.9996 9.67293 16 7.99729C16 3.57879 12.42 0 8 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
      <path d="M18.9 3H21l-4.59 5.25L21.8 21h-4.22l-3.3-7.37L7.83 21H5.7l4.9-5.6L5.4 3h4.33l2.98 6.7L18.9 3Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
      <path d="M20.32 4.37A16.7 16.7 0 0 0 16.2 3.1l-.2.4a15.4 15.4 0 0 1 3.72 1.79a12.8 12.8 0 0 0-4.54-2.08a15.7 15.7 0 0 0-6.36 0a12.8 12.8 0 0 0-4.54 2.08A15.4 15.4 0 0 1 8 3.5l-.2-.4a16.7 16.7 0 0 0-4.12 1.27C1.08 8.25.39 12.03.74 15.76A16.9 16.9 0 0 0 5.8 18.3l.95-1.56a10.8 10.8 0 0 1-1.5-.73l.37-.28c2.9 1.36 6.04 1.36 8.9 0l.37.28c-.48.28-.98.52-1.5.73l.95 1.56a16.9 16.9 0 0 0 5.06-2.54c.41-4.33-.7-8.07-2.08-11.39ZM9.68 13.54c-.87 0-1.58-.8-1.58-1.78s.7-1.78 1.58-1.78c.89 0 1.6.8 1.58 1.78c0 .98-.7 1.78-1.58 1.78Zm4.64 0c-.87 0-1.58-.8-1.58-1.78s.7-1.78 1.58-1.78c.89 0 1.6.8 1.58 1.78c0 .98-.69 1.78-1.58 1.78Z" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingNav() {
  return (
    <header className="border-b border-[#c9d8ee] bg-white">
      <div className="grid items-center gap-4 px-5 py-3 lg:h-[78px] lg:grid-cols-[auto_1fr_auto] lg:px-7 lg:py-0">
        <div className="flex items-center">
          <MemoryStarLogo />
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-[15px] text-[#101827]">
          {PRIMARY_LINKS.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-[#2166f3]">
              {item.label}
            </a>
          ))}

          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[15px] text-[#101827] transition hover:text-[#2166f3]"
            >
              Consumer
              <Chevron />
            </button>
            <div className="invisible absolute left-1/2 top-[calc(100%+10px)] z-40 w-[220px] -translate-x-1/2 border border-[#c9d8ee] bg-white opacity-0 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <a
                href="/developer-console/sign-in"
                className="block border-b border-[#d7e2f3] px-4 py-3 text-[15px] text-[#111827] hover:bg-[#f6f9ff]"
              >
                App
              </a>
              <a
                href="#developer-experience"
                className="block px-4 py-3 text-[15px] text-[#111827] hover:bg-[#f6f9ff]"
              >
                Plugins
              </a>
            </div>
          </div>
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-4 text-[14px] text-[#111827]">
          <a
            href="https://github.com/Sunilkumarchavhan9/MemoryOS"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 transition hover:text-[#2166f3] xl:inline-flex"
          >
            <GithubIcon />
            <span>0</span>
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 transition hover:text-[#2166f3] xl:inline-flex"
          >
            <XIcon />
            <span>0</span>
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 transition hover:text-[#2166f3] xl:inline-flex"
          >
            <DiscordIcon />
            <span>0</span>
          </a>

          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-[#bfd1ee] bg-white px-5 py-2.5 text-[14px] font-medium transition hover:border-[#9db8e3] hover:text-[#2166f3]"
            >
              Login
              <Chevron />
            </button>
            <div className="invisible absolute right-0 top-[calc(100%+10px)] z-40 w-[300px] border border-[#c9d8ee] bg-white opacity-0 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <a href="/developer-console/sign-in" className="block border-b border-[#d7e2f3] px-5 py-4 hover:bg-[#f6f9ff]">
                <p className="text-[15px] font-medium text-[#111827]">Developer Console</p>
                <p className="mt-1 text-[13px] text-[#5d6f87]">API keys, usage, docs</p>
              </a>
              <a href="/personal-app" className="block px-5 py-4 hover:bg-[#f6f9ff]">
                <p className="text-[15px] font-medium text-[#111827]">Personal App</p>
                <p className="mt-1 text-[13px] text-[#5d6f87]">Your memory dashboard</p>
              </a>
            </div>
          </div>
          <a
            href="/developer-console/sign-in"
            className="inline-flex items-center gap-2 bg-[#2166f3] px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#0f56de] lg:hidden"
          >
            Start
          </a>
        </div>
      </div>

      <div className="hidden h-0 bg-white md:block" />
    </header>
  );
}
