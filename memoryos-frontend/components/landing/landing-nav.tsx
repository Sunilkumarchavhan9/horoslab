import { MemoryStarLogo } from "./memory-star-logo";

const PRIMARY_LINKS = [
  { label: "Research", href: "#what-we-do" },
  { label: "Pricing", href: "#benchmarks" },
  { label: "Docs", href: "#developer-experience" },
  { label: "Blog", href: "#under-the-hood" },
];

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      height="16"
      width="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.0607 5.49999L13.5303 6.03032L8.7071 10.8535C8.31658 11.2441 7.68341 11.2441 7.29289 10.8535L2.46966 6.03032L1.93933 5.49999L2.99999 4.43933L3.53032 4.96966L7.99999 9.43933L12.4697 4.96966L13 4.43933L14.0607 5.49999Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
    <svg height="18" width="18" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.60022 2H5.80022L8.78759 6.16842L12.4002 2H14.0002L9.5118 7.17895L14.4002 14H10.2002L7.21285 9.83158L3.60022 14H2.00022L6.48864 8.82105L1.60022 2ZM10.8166 12.8L3.93657 3.2H5.18387L12.0639 12.8H10.8166Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LandingNav() {
  return (
    <header className="border-b border-[#c9d8ee] bg-white">
      <div className="grid items-center gap-4 px-5 py-3 lg:h-[72px] lg:grid-cols-[auto_1fr_auto] lg:px-7 lg:py-0">
        <div className="flex items-center">
          <MemoryStarLogo />
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-7 text-[15px] text-[#101827]">
          {PRIMARY_LINKS.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-[#2166f3]">
              {item.label}
            </a>
          ))}

          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 transition hover:text-[#2166f3]"
            >
              <span>Consumer</span>
              <ChevronIcon className="mt-[1px] transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
            </button>

            <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-4 w-[200px] -translate-x-1/2 translate-y-1 border border-[#b9cfef] bg-white opacity-0 shadow-[0_10px_24px_rgba(35,57,90,0.16)] transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <a href="#" className="block px-5 py-4 text-[17px] text-[#1a2431] hover:bg-white">
                App
              </a>
              <div className="border-t border-[#d6e0ef]" />
              <a href="#" className="block px-5 py-4 text-[17px] text-[#1a2431] hover:bg-white">
                Plugins
              </a>
            </div>
          </div>
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-5 text-[14px] text-[#111827]">
          <a href="#" className="inline-flex items-center gap-1.5 transition hover:text-[#2166f3]">
            <GithubIcon />
            <span>0</span>
          </a>

          <a href="#" className="inline-flex items-center gap-1.5 transition hover:text-[#2166f3]">
            <XIcon />
            <span>0</span>
          </a>

          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-[#bfd1ee] bg-white px-6 py-2.5 text-[15px] font-medium text-[#101827]"
            >
              <span>Login</span>
              <ChevronIcon className="transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
            </button>

            <div className="pointer-events-none absolute right-0 top-full z-30 mt-4 w-[304px] translate-y-1 border border-[#b9cfef] bg-white opacity-0 shadow-[0_10px_24px_rgba(35,57,90,0.16)] transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <a href="#" className="block px-5 py-5 hover:bg-white">
                <p className="text-[17px] leading-none text-[#1a2431]">Developer Console</p>
                <p className="mt-3 text-[14px] leading-none text-[#44546a]">API keys, usage, docs</p>
              </a>
              <div className="mx-5 border-t border-[#d6e0ef]" />
              <a href="#" className="block px-5 py-5 hover:bg-white">
                <p className="text-[17px] leading-none text-[#1a2431]">Personal App</p>
                <p className="mt-3 text-[14px] leading-none text-[#44546a]">Your memory dashboard</p>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden h-0 bg-white md:block" />
    </header>
  );
}
